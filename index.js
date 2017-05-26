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

request(options, function (error, response, body) {
  if (error) throw new Error(error);
     const wordData = JSON.parse(body); 
     console.log("You asked for: ", word);
     console.log("Meaning: ", JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]);
     console.log("Example: ", JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses[0].examples[0].text);
});

