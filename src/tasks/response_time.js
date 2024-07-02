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
    let total_avg_time = 0;
    let total_requests = 0;
    let total_failed_requests = 0;
    let total_error_rate = 0;

    registry.getServices().forEach((service) => {
      service.getInstances().forEach((instance) => {
        avg_response_times.push({
          service_id: service.getId(),
          instance_id: instance.getId(),
          response_time: instance.getStats().getAvgResponseTime(),
          total_requests: instance.getStats().getTotalRequests(),
          failed_requests: instance.getStats().getFailedRequests(),
          error_rate: instance.getStats().getErrorRate(),
        });

        total_avg_time += instance.getStats().getAvgResponseTime();
        total_requests += instance.getStats().getTotalRequests();
        total_failed_requests += instance.getStats().getFailedRequests();
        total_error_rate += instance.getStats().getErrorRate();
      });
    });

    // calculate the total average response time
    const total_avg_response_time = total_avg_time / avg_response_times.length;
    const total_error_rate_ = total_error_rate / avg_response_times.length;

    const data = {
      action: 'response_time',
      total_avg_response_time,
      total_requests,
      total_failed_requests,
      total_error_rate: total_error_rate_,
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
