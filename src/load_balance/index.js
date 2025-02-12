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

const ServiceError = require('../error/ServiceError');
const ServiceRegistry = require('../registry/registry');
const { handleRoundRobin } = require('./static/RoundRobin');
const { getLoadBalanceAlgorithm } = require('./init');
const { handleRandom } = require('./static/Random');
const { handleIpHash } = require('./static/IpHash');
const { handleLeastResponseTime } = require('./dynamic/LeastResponseTime');
const { handleLeastResourceUsage } = require('./dynamic/LeastResourcesUsage');

/*
  This function is used to parse the request and route it to the appropriate service.
  It first determines the appropriate service to route the request to.
  Then, it switches the request to the appropriate load balancer.
*/
function requestParser(req, res) {
  // get the load balance algorithm
  const load_balance_algorithm = getLoadBalanceAlgorithm();
  // first determine the appropriate service to route the request to
  const matchedService = ServiceRegistry.getRegistry().getService(req.url);
  if (!matchedService) {
    return new ServiceError('Service not found', 404);
  }

  // switch the request to the appropriate load balancer
  switch (load_balance_algorithm) {
    case 'round-robin':
      handleRoundRobin(matchedService, req, res);
      break;
    case 'random':
      handleRandom(matchedService, req, res);
      break;
    case 'ip-hash':
      handleIpHash(matchedService, req, res);
      break;
    case 'least-response-time':
      handleLeastResponseTime(matchedService, req, res);
      break;
    case 'least-resource-usage':
      handleLeastResourceUsage(matchedService, req, res);
      break;
    default:
      break;
  }
}

module.exports = {
  requestParser,
};
