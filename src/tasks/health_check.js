const ServiceRegistry = require('../registry/registry');
const { getWSS } = require('../socket');
const WebSocket = require('ws');
const Logger = require('../logger');

function healthCheck() {
  // get the registry
  const registry = ServiceRegistry.getRegistry();
  // get the WebSocket connection with from the server
  const wss = getWSS();
  if (wss !== null) {
    const services = registry.getServices();
    services.forEach((service) => {
      service.getInstances().forEach((instance) => {
        if (instance.getStatus() === 'DOWN') {
          return;
        }
        // check the health of the instance
        fetch(
          `http://${instance.getIpAddress()}:${instance.getPort()}${service.getHealthCheckUrl()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
          .then((res) => res.json())
          .then((data) => {
            const health_data = {
              action: 'health',
              service_id: service.getId(),
              instance_id: instance.getId(),
              health: data,
            };
            // send the health status to the clients via WebSocket
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(health_data));
              }
            });
          })
          .catch((err) => {
            Logger.logger().error('[bitmonx] Error in health check: ', err);
          });
      });
    });
  }
}

module.exports = {
  healthCheck,
};
