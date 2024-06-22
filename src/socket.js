const WebSocket = require('ws');

let wss = null;
// create a new web socket server and handle client connections
function initWSS(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', function connection(ws) {
    console.log('New client connected');

    ws.send('Welcome to the websocket server');
  });
}

function getWSS() {
  return wss;
}

module.exports = {
  initWSS,
  getWSS,
};
