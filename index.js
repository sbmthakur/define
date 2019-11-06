/*
#!/usr/bin/env node

const request = require("request");
const config = require("./conf.json");

//Just a wrapper around "console.log", "print" prints two
//strings with a line break
const print = function(someString, result) {
    return console.log("\n" + someString, result || "");
};

//Get the word as a command line argument
const word = process.argv[2].toLowerCase();

if (!word) {
    print("Please enter an english word as the first argument");
    return;
}

//Connect to Redis
const Redis = require("redis");
const redis = Redis.createClient({
    "host": config.redis.host,
    "port": config.redis.port
});

wordExistsRedis(word, (error, result) => {
    if (error) {
        print("Some problem with redis server", error);
        redis.quit();
    } else {
        if (result === null) {
            requestWordInfo(word);
        } else {

            const wordData = JSON.parse(result);
            printWordData(wordData, () => {
                print("Synonyms: ", wordData.synonyms);
                print("Antonyms: ", wordData.antonyms);
                redis.quit();
            });
        }
    }
});

function wordExistsRedis(word, callback) {
    let wordKey = "word:" + word;
    redis.get(wordKey, (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, res);
        }
    });
}

function requestWordInfo(word) {

    const options = {
        "method": "GET",
        "url": config.basePath + word,
        "headers": {
            "app_key": config.appHeaders.key,
            "app_id": config.appHeaders.id
        }
    };
    request(options, function(error, response, body) {
        if (error) throw new Error(error);

        if (response.statusCode !== 200) {
            redis.quit();
            if (response.statusCode === 404)
                return print("This word doesn't exist in oxford dictionary");
            else
                return print("Some problem with API server");
        }
        let redisData = JSON.parse(body);
        printWordData(redisData, (exception) => {

            if (exception) {
                return redis.quit();
            }

            requestSynsAnts(word, (err, wordData) => {
                let synonyms = wordData.synonyms.replace(/, $/, "");
                let antonyms = wordData.antonyms.replace(/, $/, "");
                print("Synonyms: ", synonyms);
                print("Antonyms: ", antonyms);
                redisData["synonyms"] = synonyms;
                redisData["antonyms"] = antonyms;

                storeDataRedis(word, JSON.stringify(redisData), (err, res) => {
                    if (err) {
                        print("Couldn't store this word in redis", err);
                    } else {
                        print("Word data added to cache");
                    }
                    redis.quit();
                });
            });
        });
    });
}

function requestSynsAnts(word, callback) {

    const options = {
        "method": "GET",
        "url": config.basePath + word + "/synonyms;antonyms",
        "headers": {
            "app_key": config.appHeaders.key,
            "app_id": config.appHeaders.id
        }
    };
    print("Fetching synonyms and antonyms", "....");
    request(options, function(error, response, body) {

        let synonyms = "";
        let antonyms = "";
        if (response.statusCode !== 200) {

            //404 is handled below with an 'or' operator when 'wordData' variable is assigned
            if (response.statusCode >= 500) {

                print("Some problem with API server. Please request the word when the server is up.");
                process.exit();
            }

        } else {

            const senses = JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses;
            for (let sense of senses) {
                if (sense.hasOwnProperty("synonyms")) {
                    sense["synonyms"].map(synonym => {
                        synonyms += synonym.text + ", ";
                    });
                }
                if (sense.hasOwnProperty("antonyms")) {
                    sense["antonyms"].map(antonym => {
                        antonyms += antonym.text + ", ";
                    });
                }
            }
        }

        const wordData = {

            //In case synonyms and/or antonyms don't exist in the dictionary for the given word
            "synonyms": synonyms || "none",
            "antonyms": antonyms || "none"
        };
        return callback(null, wordData);
    });
}

function storeDataRedis(word, redisData, callback) {
    let wordKey = "word:" + word;

    redis.set(wordKey, redisData, (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, res);
        }
    });
}

function printWordData(wordData, callback) {
    let exception;
    print("You asked for: ", wordData.results[0].id);

    wordData.results[0].lexicalEntries.map(wordInfo => {
        print(wordInfo.lexicalCategory);
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
*/

const axios = require('axios');
const config = require('./conf.json');

(async () => {

    const print = function (someString, result) {
        return console.log("\n" + someString, result || "");
    };

    const word = process.argv[2].toLowerCase();
    await requestWordInfo(word);
})()


async function requestWordInfo(word) {

    let url = `${config.basePath}${word}?strictMatch=false`;
    const options = {
        "method": "GET",
        "url": url,
        "headers": {
            "app_key": config.appHeaders.key,
            "app_id": config.appHeaders.id
        }
    };

    let response = await axios(options);
    console.log(response.data)
    /*
    request(options, function(error, response, body) {
        if (error) throw new Error(error);

        if (response.statusCode !== 200) {
            redis.quit();
            if (response.statusCode === 404)
                return print("This word doesn't exist in oxford dictionary");
            else
                return print("Some problem with API server");
        }
        let redisData = JSON.parse(body);
        printWordData(redisData, (exception) => {

            if (exception) {
                return redis.quit();
            }

            requestSynsAnts(word, (err, wordData) => {
                let synonyms = wordData.synonyms.replace(/, $/, "");
                let antonyms = wordData.antonyms.replace(/, $/, "");
                print("Synonyms: ", synonyms);
                print("Antonyms: ", antonyms);
                redisData["synonyms"] = synonyms;
                redisData["antonyms"] = antonyms;

                storeDataRedis(word, JSON.stringify(redisData), (err, res) => {
                    if (err) {
                        print("Couldn't store this word in redis", err);
                    } else {
                        print("Word data added to cache");
                    }
                    redis.quit();
                });
            });
        });
    });
    */
}