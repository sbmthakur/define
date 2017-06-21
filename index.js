#!/usr/bin/env node

const request = require("request");
const config = require("./conf.json");
const word = process.argv[2]; 

const print = function(someString, result){ 
    return console.log("\n" + someString, result || '');
};
const Redis = require("redis");
const redis = Redis.createClient();
const meaning = require("./balk_meaning.json")
const syn_ant = require("./balk_syn_ant.json")

wordExistsRedis(word, (error, result) => {
   if(error){
        
   }
   else{
       if(result === null){
           requestWordInfo(word); 
       }
       else{
//lol
         const wordData = JSON.parse(result).results[0].lexicalEntries; 
         print("You asked for: ", word);
         wordData.map(wordInfo => {
         print(wordInfo.lexicalCategory);
         print("Meaning: ", wordInfo.entries[0].senses[0].definitions[0]);
         try{
         
            print("Example: ", wordInfo.entries[0].senses[0].examples[0].text);
         }
         catch(e){
           print("Couldn't find any example.");
         }
         //redisData[wordInfo.lexicalCategory.toLowerCase()] = JSON.stringify(wordInfo);

         });
       }
   }
});

function wordExistsRedis(word, callback){
    redis.hgetall(word, (err, res) => {
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
         const wordData = JSON.parse(body).results[0].lexicalEntries; 
         let redisData = JSON.parse(body);
         print("You asked for: ", word);
         wordData.map(wordInfo => {
         print(wordInfo.lexicalCategory);
         print("Meaning: ", wordInfo.entries[0].senses[0].definitions[0]);
         try{
         
            print("Example: ", wordInfo.entries[0].senses[0].examples[0].text);
         }
         catch(e){
           print("Couldn't find any example.");
         }
         //redisData[wordInfo.lexicalCategory.toLowerCase()] = JSON.stringify(wordInfo);

         });
          /* storeDataRedis(word + "::info", redisData, (err, res) => {
               if(err){
               
               }
               else{
                   console.log(res,"Stored this word's info in redis"); 
               }
           });*/
         requestSynsAnts(word, (err, wordData) => {
    
//           let redisExtra = {};
           let synonyms = wordData.synonyms.replace(/, $/,'');
           let antonyms = wordData.antonyms.replace(/, $/,''); 
           print("Synonyms: ", synonyms);
           print("Antonyms: ", antonyms);
           redisData["synonyms"] = synonyms;
           redisData["antonyms"] = antonyms;
         //  storeDataRedis(word + "::extrastuff", redisExtra, (err, res) => {
           storeDataRedis(word, JSON.stringify(redisData), (err, res) => {
               if(err){
               
               }
               else{
                   console.log(res,"Stored this word's extra stuff in redis"); 
                   redis.quit();
               }
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

    redis.hmset(wordKey, redisData, (err, res) => {
    
        if(err){
            callback(err, null);    
        }
        else{
            callback(null, res); 
        }
    });    
}

function printWordData(wordData){


}
/*
//redis.hexists(word,'sdfdf',(e,r) => {console.log(e, r)})
//console.log(redis.hexists(word,'verb'))

*/

