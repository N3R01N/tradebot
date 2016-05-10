'use strict';
let KrakenClient = require('kraken-api');
let kraken = new KrakenClient('api_key', 'api_secret');
let getPrice = (obj) => {
  return +obj[0];
};
let getVolume = (obj) => {
  return +obj[1];
};
let getTime = (obj) => {
  return +obj[2];
};
let getDate = (obj) => {
  return new Date(getTime(obj) * 1000);
};
const REWARD_FACTOR = 10000;
module.exports = () => {
  let position = null;
  let lastAsk = null;
  let lastBid = null;
  let investmentAmount = 1;
  let investmentPrice = null;
  let reset = () => {
    position = null;
    lastAsk = null;
    lastBid = null;
    investmentAmount = 1;
    investmentPrice = null;
  };
  let init = (bid, ask) => {
    lastAsk = ask;
    lastBid = bid;
  };
  let getNumStates = () => {
    return 8; // (bid, ask) * (price, vol) * (current, change) = 2^3 = 8
  };
  let getMaxNumActions = () => {
    return 3; // kaufen, verkaufen, nix
  };
  // queries the KRAKEN.com API and returns an Array of 8 representing the
  // STATE of the "MarketWorld"
  /* for now array holding :
   [
    currentBidPrice,
    currentAskPrice,
    currentBidVolume,
    currentAskVolume,
    changeBidPrice,
    changeAskPrice,
    changeBidVolume,
    changeAskVolume
  ]
  */
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
        // console.log('first ask:', firstAsk[0], ' - ', firstAsk[1], ' at ', new Date(firstAsk[2] * 1000));
        // console.log('first bid:', firstBid[0], ' - ', firstBid[1], ' at ', new Date(firstBid[2] * 1000));
        let currentBidPrice = getPrice(firstBid);
        let currentAskPrice = getPrice(firstAsk);
        let currentBidVolume = getVolume(firstBid);
        let currentAskVolume = getVolume(firstAsk);
        let changeBidPrice = currentBidPrice - getPrice(lastBid);
        let changeAskPrice = currentAskPrice - getPrice(lastAsk);
        let changeBidVolume = currentBidVolume - getVolume(lastBid);
        let changeAskVolume = currentAskVolume - getVolume(lastAsk);
        //return the 8 digit arrey which represents the world state!
        callback([
          currentBidPrice,
          currentAskPrice,
          currentBidVolume,
          currentAskVolume,
          changeBidPrice,
          changeAskPrice,
          changeBidVolume,
          changeAskVolume
        ]);
      }
    });
  };
  let calcClearReward = (sellPrice, buyPrice) => {
    let reward = (investmentAmount * sellPrice - investmentAmount * buyPrice) * REWARD_FACTOR;
    console.log('closed ' + position + ' position at price: ' + sellPrice + ' - ' + buyPrice + ' reward: ', reward);
    return reward;
  };
  let getBuyReward = () => {
    // punish tying to buy when already in long position
    let reward = -1;
    //open long position
    if (!position) {
      reward = 0.1;
      position = 'long';
      investmentPrice = getPrice(lastAsk);
      console.log('opened ' + position + ' position at price' + investmentPrice);
      //clear short position
    } else if (position === 'short') {
      // reward is price we sold * amount - price we now buy * amount (positiv if buyprice lower than sellprice)
      reward = calcClearReward(investmentPrice, getPrice(lastAsk));
      position = null;
      investmentPrice = null;
    }
    return reward;
  };
  // if we bought long before we get the diff between sell - buy as reward
  // if we did not buy before we sell short for the lastBidPrice and get 0.1 for taking initiative :)
  // if we sold short before we cannot sell more and get -0.1 punishment for trying
  let getSellReward = () => {
    // punish tying to sell when already in short position
    let reward = -1;
    //open short position
    if (!position) {
      reward = 0.1;
      position = 'short';
      investmentPrice = getPrice(lastBid);
      console.log('opened ' + position + ' position at price' + investmentPrice);
      //clear long position
    } else if (position === 'long') {
      // reward is price we sell * amount - price we bought * amount (positiv if buyprice lower than sellprice)
      reward = calcClearReward(getPrice(lastBid), investmentPrice);
      position = null;
      investmentPrice = null;
    }
    return reward;
  };
  // no reward for doing nothing (for now)
  let getWaitReward = () => {
    console.log('doing nothing...');
    return 0;
  };
  // lets say 0 = buy, 1 = sell, 2 = do nothing
  let getReward = (action) => {
    switch (action) {
    case 0:
      return getBuyReward();
    case 1:
      return getSellReward();
    case 2:
      return getWaitReward();
    default:
      console.log('this should never happen since we only have 3 actions to pick from!');
      console.log('action:', action);
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
