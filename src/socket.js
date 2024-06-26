const WebSocket = require('ws');

let wss = null;
// create a new web socket server and handle client connections
function initWSS(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', function connection(ws) {});
}

function getWSS() {
  return wss;
}

module.exports = {
  initWSS,
  getWSS,
};
