'use strict';
// hier verwende ich die von mir umgebaute version von reinforce
let reinforce = require('reinforcenode');
let spec = require('./agentspec.js');
let env = require('./tradeworld.js')();
let Agent = reinforce.DQNAgent;
let tradeAgent = new Agent(env, spec);
let count = 0;
let interval;
let trainAgent = () => {
  if (count++ < 9) {
    env.getState((state) => {
      console.log(state);
      let action = tradeAgent.act(state);
      let reward = env.getReward(action);
      tradeAgent.learn(reward);
      console.log('learning from reward: '+ reward);
    });
  } else {
    clearInterval(interval);
  }
};
interval = setInterval(trainAgent, 1000);
