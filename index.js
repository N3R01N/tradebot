'use strict';

let ticker = require('./ticker.js');



/**

 array of array entries(<time>, <open>, <high>, <low>, <close>, <vwap>, <volume>, <count>)

*/

let euroTickerCallback = (error, data) => {
  if(error){
    console.error('ERROR: ', error);
    return;
  }
  if(clients.length > 0){
    clients.forEach((socket)=>{
      socket.send(JSON.stringify(data));
    });
  }
};

let euroTicker = ticker('EUR', euroTickerCallback);
euroTicker.start();


const PORT = 4080;
let http = require('http');
let url = require('url');
let WSWebSocketServer = require('ws').Server;
let express = require('express');
let app = express();
let clients = [];

app.use(express.static(__dirname + '/client'));

let server = http.createServer(app);
let wss = new WSWebSocketServer({server: server});

console.log('created app and ws');
wss.on('connection', (socket) => {

  let location = url.parse(socket.upgradeReq.url, true);
  console.log('someone connected:', socket.upgradeReq.headers['user-agent']);
  socket.on('message', (message) => {
    console.log('client socket sent: ', message);
  });
  clients.push(socket);
});

//server.on('request', app);
server.listen(PORT, () => {
  console.log('Listening on port :', server.address().port);
});
