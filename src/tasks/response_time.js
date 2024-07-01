const ServiceRegistry = require('../registry/registry');
const { getWSS } = require('../socket');
const WebSocket = require('ws');

function sendResponseTime() {
  // get the registry
  const registry = ServiceRegistry.getRegistry();
  // get the WebSocket connection with from the server
  const wss = getWSS();
  if (wss !== null) {
    // collect the response time data from the services
    const avg_response_times = [];
    let total = 0;
    registry.getServices().forEach((service) => {
      service.getInstances().forEach((instance) => {
        avg_response_times.push({
          service_id: service.getId(),
          instance_id: instance.getId(),
          response_time: instance.getStats().getAvgResponseTime(),
        });

        total += instance.getStats().getAvgResponseTime();
      });
    });

    // calculate the total average response time
    const total_avg_response_time = total / avg_response_times.length;

    const data = {
      action: 'response_time',
      total_avg_response_time,
      avg_response_times,
    };

    // send the response time data to the clients via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

module.exports = sendResponseTime;
