'use strict';
// hier verwende ich die von mir umgebaute version von reinforce
let reinforce = require('reinforcenode');
let spec = require('./agentspec.js');
let env = require('./tradeworld.js')();
let Agent = reinforce.DQNAgent;
let tradeAgent = new Agent(env, spec);
let client = null;
let count = 0;
let interval;



/**
  - train the agent
  - send data to client if connected
      data = {
        state: the state our world is in (array full of float numbers)
        reward: the current reward the agent got
        action: the action the actor made (a number between 0 and whatever env.getNumStates() returns)
      }
*/
let trainAgent = () => {
  // for now 400 iterations are ok for testing
  // remove this check to go infinate!
  // warning this COULD possibly go wrong ! ;)
  if (count++ < 400) {
    env.getState((state) => {
      let action = tradeAgent.act(state);
      let reward = env.getReward(action);
      tradeAgent.learn(reward);
      if (client !== null) {
        let data = {
          state: state,
          reward: reward,
          action: action
        };
        client.send(JSON.stringify(data));
      }
    });
  } else {
    clearInterval(interval);
  }
};
interval = setInterval(trainAgent, 5000);
/*
SERVER STUFF
for viz in browser set up websocket connection;
*/
let server = require('http')
  .createServer();
let url = require('url');
let WebSocketServer = require('ws')
  .Server;
let wss = new WebSocketServer({
  server: server
});
let express = require('express');
let app = express();
let port = 4080;


app.use(express.static('client'));
wss.on('connection', (ws) => {
  console.log('someone connected', ws.upgradeReq.headers['user-agent']);
  client = ws;
  url.parse(ws.upgradeReq.url, true);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });
});
server.on('request', app);
server.listen(port, () => {
  console.log('Listening on -> localhost:' + server.address()
    .port);
});
