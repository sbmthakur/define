#!/usr/bin/env node

const request = require("request");
const config = require("./conf.json");
const word = process.argv[2]; 

const print = function(someString, result){ 
    return console.log("\n" + someString, result || '');
};
const Redis = require("redis");
const redis = Redis.createClient();

wordExistsRedis(word, (error, result) => {
   if(error){
        
   }
   else{
       if(result === null){
           requestWordInfo(word); 
       }
       else{

         const wordData = JSON.parse(result);
         printWordData(wordData, () => {
                 
           print("Synonyms: ", wordData.synonyms);
           print("Antonyms: ", wordData.antonyms);
           redis.quit();
         });
       }
   }
});

function wordExistsRedis(word, callback){
    redis.get(word, (err, res) => {
        if(err){
            callback(err, null);
        }
        else{
            callback(null, res);
        }
    });    
}

function requestWordInfo(word){

    const options = { 
      "method": "GET",
      "url": config.baseUrl + word,
      "headers": { 
         "app_key": config.appHeaders.key,
         "app_id": config.appHeaders.id 
       },
      "proxy": config.proxy
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      if (response.statusCode !== 200) {
          redis.quit();
          if (response.statusCode === 404)
              return print("This word doesn't exist in oxford dictionary"); 
          else
              return print("Some probelem with API server"); 
      }
        let redisData = JSON.parse(body); 
        printWordData(redisData, () => {
         requestSynsAnts(word, (err, wordData) => {
    
           let synonyms = wordData.synonyms.replace(/, $/,'');
           let antonyms = wordData.antonyms.replace(/, $/,''); 
           print("Synonyms: ", synonyms);
           print("Antonyms: ", antonyms);
           redisData["synonyms"] = synonyms;
           redisData["antonyms"] = antonyms;

           storeDataRedis(word, JSON.stringify(redisData), (err, res) => {
               if(err){
                   print("Couldn't store this word in redis", err); 
               }
               else{
                   print("Word data added to cache"); 
               }
               redis.quit();
           });
         }); 
        });
    });
}

function requestSynsAnts(word, callback){

		const options = { 
     "method": "GET",
     "url": config.baseUrl + word + "/synonyms;antonyms",
     "headers": { 
        "app_key": config.appHeaders.key,
        "app_id": config.appHeaders.id 
      },
     "proxy": config.proxy
    };
    print("Fetching synonyms and antonyms","...."); 
    request(options, function (error, response, body) {

        const senses = JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses;
        let synonyms = "";
        let antonyms = "";
        for(let sense of senses){

            if(sense.hasOwnProperty("synonyms")){
            
              sense["synonyms"].map(synonym => {
                      
                  synonyms += synonym.text + ", ";
              }); 
            }
            if(sense.hasOwnProperty("antonyms")){
            
              sense["antonyms"].map(antonym => {
                      
                  antonyms += antonym.text + ", ";
              }); 
            }
        }

        const wordData = {
            "synonyms": synonyms, 
            "antonyms": antonyms
        }
       return callback(null, wordData);
    });
}

function storeDataRedis(wordKey, redisData, callback){

    redis.set(wordKey, redisData, (err, res) => {
    
        if(err){
            callback(err, null);    
        }
        else{
            callback(null, res); 
        }
    });    
}

function printWordData(wordData, callback){

         print("You asked for: ", wordData.results[0].id);
         wordData.results[0].lexicalEntries.map(wordInfo => {
         print(wordInfo.lexicalCategory);
         print("Meaning: ", wordInfo.entries[0].senses[0].definitions[0]);
         try{
         
            print("Example: ", wordInfo.entries[0].senses[0].examples[0].text);
         }
         catch(e){
           print("Couldn't find any example.");
         }

         });
         callback();
}

