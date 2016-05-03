'use strict';

let KrakenClient = require('kraken-api');
let kraken = new KrakenClient('api_key', 'api_secret');
const INTERVAL = 20000;
module.exports = (currency, callback) => {
//XETHXXBT
//XETHZEUR

let currencyPairs = [('XETHZ' + currency), ('XXBTZ' + currency), 'XETHXXBT' ].map((name) => {
  return {
    pairString: name,
  };
});

/**

<pair_name> = pair name
   a = ask array(<price>, <whole lot volume>, <lot volume>),
   b = bid array(<price>, <whole lot volume>, <lot volume>),
   c = last trade closed array(<price>, <lot volume>),
   v = volume array(<today>, <last 24 hours>),
   p = volume weighted average price array(<today>, <last 24 hours>),
   t = number of trades array(<today>, <last 24 hours>),
   l = low array(<today>, <last 24 hours>),
   h = high array(<today>, <last 24 hours>),
   o = today's opening price

*/
  let currentTick = 0;
  let haveAllInfo = () => {
    currentTick++;
    return currencyPairs.length === currencyPairs.filter(pair => pair.data).length &&
     currentTick % currencyPairs.length === 0;
  };


  /**
   prices {
    ehteur = 7.2,
    btceur = 375,
    ethbtc = 0.01932
    calc = 0.01832
    diff = ehtbtc - calc
  }
  */

  // CALC the data to send
  /**
  @return
    {
      etheur: etheur,
      btceur: btceur,
      ethbtc: ethbtc,
      calc: calc,
      suggest: suggest,
      time: new Date().getTime()
    };
  */
  let calcData = () => {
    let etheur = currencyPairs[0].data;
    let btceur = currencyPairs[1].data;
    let ethbtc = currencyPairs[2].data;

    let middleEthPrice = ((+etheur.bid.price) + (+etheur.ask.price)) / 2;
    let middleBtcPrice = ((+btceur.bid.price) + (+btceur.ask.price)) / 2;
    let btcBidEthAsk = {
      price: (+etheur.ask.price) / (+btceur.bid.price)
    };
    let btcAskEthBid = {
      price: (etheur.bid.price) / (+btceur.ask.price)
     };

    let calc = {
      price: middleEthPrice / middleBtcPrice
    };



    let diff = calc.price - ethbtc.close.price;

    let suggest = diff > 0.00009 ? 'buy' : diff < -0.00009 ? 'sell' : null;

    return {
      etheur: etheur,
      btceur: btceur,
      ethbtc: ethbtc,
      calc: calc,
      btcBidEthAsk : btcBidEthAsk,
      btcAskEthBid: btcAskEthBid,
      suggest: suggest,
      time: new Date().getTime()
    };
  };

  let getObject = (array) => {
    return {
      price: array[0],
      volume: array[1],
    };
  };


  let updateData = (newData, name) => {
    currencyPairs.forEach((pair) => {
      if(pair.pairString === name){
        pair.data = {
          ask: getObject(newData.a),
          bid: getObject(newData.b),
          close: getObject(newData.c)
        };
      }
    });
    if(haveAllInfo()){
      return calcData();
    }
    return null;
  };

  let checkUpdate = (data, name) => {
    let callbackData = updateData(data, name);
    if(callbackData){
      callback(null, callbackData);
    }
  };


  let ticker;

  let getApiResult = (data, currencyPairString) => {
    return data.result[currencyPairString];
  };

  let callKrakenTickerApi = (reqData) => {
    let reqestData = {pair: reqData.pairString};
    kraken.api('Ticker', reqestData, (error, data) =>{
      if(error){
        callback(error);
      }else{
        let resultData = getApiResult(data, reqData.pairString);
        checkUpdate(resultData, reqData.pairString);
      }
    });
  };

  let callKrakenApis = () => {
    currencyPairs.forEach(callKrakenTickerApi);
  };

  let start = () => {
    console.log('starting '+currencyPairs.length+' tickers... ' + currency);
    ticker = setInterval(callKrakenApis, INTERVAL);
  };

  let stop = () => {
    console.log('stopped ticker ' + currency);
    clearInterval(ticker);
  };

  return {
    start: start,
    stop: stop
  };
};
