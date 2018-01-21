# define

Fetch a word's meaning and usage through Oxford Dictionaries API. Once fetched, the word data is stored in Redis and future queries for the same word are served through Redis.

## Getting Started

### Prerequisites

Oxford Dictionary API key: Register on [Oxford Dictionaries API site](https://developer.oxforddictionaries.com/) and generate your keys. You will be provided with `id` and `key` which you need to put in `conf.json`. 

### Installing

#### Setup redis

`define` requires Redis. Instructions for installing Redis are mentioned [here](https://redis.io/download#installation). The host and port of your Redis instance must be mentioned in `conf.json`. 

Now run the following command after downloading or cloning this repo:

```
npm install -g
```
This will install dependencies and will link the script to our project's location. Now we can use `define` like any other shell command.

For any further hacking, it's convenient to run `npm link` once. This will create a symlink to our `index.js`.

Please report any issues that you may encounter. Suggestions are welcome.
