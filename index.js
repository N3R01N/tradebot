'use strict';
let KrakenClient = require('kraken-api');
let kraken = new KrakenClient('api_key', 'api_secret');

// Display user's balance
kraken.api('Balance', null, function(error, data) {
    if(error) {
        console.log(error);
    }
    else {
        console.log(data.result);
    }
});

// Get Ticker Info
kraken.api('Ticker', {pair: 'XBTCXLTC'}, function(error, data) {
    if(error) {
        console.log(error);
    }
    else {
        console.log(data.result);
    }
});
