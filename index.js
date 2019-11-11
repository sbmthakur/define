const Redis = require('ioredis');
let redis = new Redis.default({
  port: 6379,
  host: "127.0.0.1",
  db: 1
});

//Just a wrapper around "console.log", "print" prints two
//strings with a line break
const print = function(someString, result) {
    return console.log("\n" + someString, result || "");
};
async function wordExistsRedis(word) {
    let wordKey = "word:" + word;
    return redis.get(wordKey);
}

async function storeDataRedis(word, redisData) {
    let wordKey = "word:" + word;
    await redis.set(wordKey, redisData);
}

function printWordData(wordData, callback) {
    let exception;
    print("You asked for: ", wordData.results[0].id);

    wordData.results[0].lexicalEntries.map(wordInfo => {
        print(wordInfo.lexicalCategory.text);
        try {
            print("Meaning: ", wordInfo.entries[0].senses[0].definitions[0]);
        } catch (err) {
            exception = err;
        }
        try {
            print("Example: ", wordInfo.entries[0].senses[0].examples[0].text);
        } catch (e) {
            print("Couldn't find any example.");
        }

    });

    if (exception) {
        print("Cannot cache in redis as the data is in inconsistent format");
        callback(exception);
    } else {
        callback();
    }
}

const axios = require('axios');
const config = require('./conf.json');

(async () => {

  const print = function (someString, result) {
    return console.log("\n" + someString, result || "");
  };

  const word = process.argv[2].toLowerCase();
  let result = await wordExistsRedis(word);
  console.log(result)
  if (result === null) {
    await requestWordInfo(word);
  } else {
    const wordData = JSON.parse(result);
    printWordData(wordData, (exception) => {
      if (exception) {
        console.log("Exception: ", exception);
      }
    });
  }
  redis.quit();
})()


async function requestWordInfo(word) {

  try {
    let url = `${config.basePath}/entries/${config.sourceLang}/${word}?strictMatch=false`;
    const options = {
      "method": "GET",
      "url": url,
      "headers": {
        "app_key": config.appHeaders.key,
        "app_id": config.appHeaders.id
      }
    };

    let response = await axios(options);

    if (response.status !== 200) {
      redis.quit();
      if (response.statusCode === 404)
        return print("This word doesn't exist in oxford dictionary");
      else
        return print("Some problem with API server");
    }

    let redisData = response.data;
    printWordData(redisData, (exception) => {
      if (exception) {
        console.log("Exception", exception);
      }
    });
    await storeDataRedis(word, JSON.stringify(redisData));
  } catch(err) {
    console.log(err) 
  }
}