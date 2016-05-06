'use strict';
let KrakenClient = require('kraken-api');
let kraken = new KrakenClient('api_key', 'api_secret');
let getPrice = (obj) => {
  return obj[0];
};
let getVolume = (obj) => {
  return obj[1];
};
let getTime = (obj) => {
  return obj[2];
};
let getDate = (obj) => {
  return new Date(getTime(obj) * 1000);
};
module.exports = () => {
  let lastAsk = null;
  let lastBid = null;
  let maxInvest = 1;
  let currentInvested = 0;
  let cashInThreshold = 0.0004;
  let cashOutThreshold = 0.0003;
  let reset = () => {
    lastAsk = null;
    lastBid = null;
    maxInvest = 1;
    currentInvested = 0;
    cashInThreshold = 0.0004;
    cashOutThreshold = 0.0003;
  };
  let init = (bid, ask) => {
    lastAsk = ask;
    lastBid = bid;
  };
  let getNumStates = () => {
    return 12; // (bid: +-price, price, +-volume, volume, +-time, time) same for ask
  };
  let getMaxNumActions = () => {
    return 3; // kaufen, verkaufen, nix
  };
  let getState = (callback) => {
    // return an array of 9 that represents the state of the world
    // Get Ticker Info
    kraken.api('Depth', {
      pair: 'XETHXXBT',
      count: 2
    }, function (error, data) {
      if (error) {
        console.error('ERROR: ', error);
      } else {
        /*
         * <pair_name> = pair name
         * asks = ask side array of array entries(<price>, <volume>, <timestamp>)
         * bids = bid side array of array entries(<price>, <volume>, <timestamp>)
         */
        let firstAsk = data.result.XETHXXBT.asks[0];
        let firstBid = data.result.XETHXXBT.bids[0];
        if (!lastAsk || !lastBid) {
          init(firstBid, firstAsk);
        }
        console.log('first ask:', firstAsk[0], ' - ', firstAsk[1], ' at ', new Date(firstAsk[2] * 1000));
        console.log('first bid:', firstBid[0], ' - ', firstBid[1], ' at ', new Date(firstBid[2] * 1000));
        //return the 12 digit arrey which represents the world state!
        callback([
          getPrice(firstBid), getVolume(firstBid), getTime(firstBid),
          getPrice(firstAsk), getVolume(firstAsk), getTime(firstAsk),
          getPrice(firstBid) - getPrice(lastBid), getVolume(firstBid) - getVolume(lastBid), getTime(firstBid) - getTime(lastBid),
          getPrice(firstAsk) - getPrice(lastAsk), getVolume(firstAsk) - getVolume(lastAsk), getTime(firstAsk) - getTime(lastAsk),
        ]);
      }
    });
  };
  let getReward = (action) => {
    switch (action) {
    case 0:
      return -1;
    case 1:
      return 0;
    case 2:
      return 1;
    default:
      console.log('strange:', action);
      return 0;
    }
  };
  return {
    reset: reset,
    getNumStates: getNumStates,
    getMaxNumActions: getMaxNumActions,
    getState: getState,
    getReward: getReward
  };
};
