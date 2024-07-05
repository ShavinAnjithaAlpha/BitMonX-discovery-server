const ServiceError = require('../error/ServiceError');
const ServiceRegistry = require('../registry/registry');
const { handleRoundRobin } = require('./static/RoundRobin');
const { getLoadBalanceAlgorithm } = require('./init');
const { handleRandom } = require('./static/Random');
const { handleIpHash } = require('./static/IpHash');
const { handleLeastResponseTime } = require('./dynamic/LeastResponseTime');

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
    default:
      break;
  }
}

module.exports = {
  requestParser,
};
