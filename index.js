const Redis = require('ioredis');
let redis = new Redis.default({
  port: 6379,
  host: '127.0.0.1',
  db: 1
});

//Just a wrapper around "console.log", "print" prints two
//strings with a line break
const print = function(someString, result) {
  return console.log('\n' + someString, result || '');
};

async function wordExistsRedis(word) {
  let wordKey = 'word:' + word;
  return redis.get(wordKey);
}

async function storeDataRedis(word, redisData) {
  let wordKey = 'word:' + word;
  await redis.set(wordKey, redisData);
}

function printWordData(wordData, callback) {
  let exception;
  print('You asked for: ', wordData.results[0].id);

  wordData.results[0].lexicalEntries.map(wordInfo => {
    print(wordInfo.lexicalCategory.text);
    try {
      print('Meaning: ', wordInfo.entries[0].senses[0].definitions[0]);
    } catch (err) {
      exception = err;
    }
    try {
      print('Example: ', wordInfo.entries[0].senses[0].examples[0].text);
    } catch (e) {
      print('Couldn\'t find any example.');
    }

  });

  if (exception) {
    print('Cannot cache in redis as the data is in inconsistent format');
    callback(exception);
  } else {
    callback();
  }
}

const axios = require('axios');
const config = require('./conf.json');

(async () => {
  let word, cache = false;

  if(process.argv.length > 3) {
    if(process.argv[2] !== '-c') {
      return print('Inconsistent input');
    }
    cache = true;
    word = process.argv[3].toLowerCase();
  } else {
    word = process.argv[2].toLowerCase();
  }

  if (cache) {
    let result = await wordExistsRedis(word);

    if(result === null) {
      await requestWordInfo(word, true);
    } else {
      const wordData = JSON.parse(result);
      printWordData(wordData, (exception) => {
        if (exception) {
          console.log('Exception: ', exception);
        }
      });
    }

  } else {
    await requestWordInfo(word, false);
  }

  redis.quit();
})();


async function requestWordInfo(word, cache) {
  try {
    let url = `${config.basePath}/entries/${config.sourceLang}/${word}?strictMatch=false`;
    const options = {
      'method': 'GET',
      'url': url,
      'headers': {
        'app_key': config.appHeaders.key,
        'app_id': config.appHeaders.id
      }
    };

    let response = await axios(options);
    let redisData = response.data;
    printWordData(redisData, (exception) => {
      if (exception) {
        console.log('Exception', exception);
      }
    });

    if(cache) {
      await storeDataRedis(word, JSON.stringify(redisData));
    }
  } catch(err) {
    let status = err.response.status;
    if (status === 404) {
      return print('This word doesn\'t exist in Oxford dictionary');
    }
    else {
      return print('Some problem with API server', err.message);
    }
  }
}