/**
 * MIT License
 *
 * Copyright (c) 2024 Shavin Anjitha Chandrawansha
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const ServiceRegistry = require('../registry/registry');
const { getWSS } = require('../socket');
const WebSocket = require('ws');
const Logger = require('../logger');

const logger = Logger.logger('health');

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
            logger.error('error in health check: ', err);
          });
      });
    });
  }
}

module.exports = {
  healthCheck,
};
