#!/usr/bin/env node

const request = require("request");
const config = require("./conf.json");
const word = process.argv[2]; 
const options = { 
  "method": "GET",
  "url": config.baseUrl + word,
  "headers": { 
     "app_key": config.appHeaders.key,
     "app_id": config.appHeaders.id 
   },
  "proxy": config.proxy
   };

const print = function(someString, result){ 
    return console.log("\n" + someString, result || '');
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);
     const wordData = JSON.parse(body); 
     print("You asked for: ", word);
     print(JSON.parse(body).results[0].lexicalEntries[0].lexicalCategory);
     print("Meaning: ", JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]);
     try{
     
        print("Example: ", JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses[0].examples[0].text);
     }
     catch(e){
       print("Couldn't find any example.");
     }
     requestSynsAnts(word, (err, wordData) => {

       print("Synonyms: ", wordData.synonyms.replace(/, $/,''));
       print("Antonyms: ", wordData.antonyms.replace(/, $/,''));
     }); 
});

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
