const WebSocket = require('ws');
const { getWSS } = require('../socket');

function broadcastData(data) {
  const wss = getWSS();
  if (wss !== null) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

module.exports = broadcastData;
