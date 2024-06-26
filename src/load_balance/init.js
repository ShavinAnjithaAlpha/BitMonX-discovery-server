const LOAD_BALANCE_ALGORITHMS = {
  ROUND_ROBIN: 'round-robin',
  RANDOM: 'random',
  LEAST_CONNECTION: 'least-connection',
  IP_HASH: 'ip-hash',
  URL_HASH: 'url-hash',
  WEIGHTED_ROUND_ROBIN: 'weighted-round-robin',
  WEIGHTED_RANDOM: 'weighted-random',
};

const DEFAULT_LOAD_BALANCE_ALGORITHM = LOAD_BALANCE_ALGORITHMS.ROUND_ROBIN;

let load_balance_algorithm = null;

function readLoadBalancer(config) {
  // fetch the load balance algorithm from the config file or if not found use the default algorithm
  load_balance_algorithm =
    config?.loadbalancer?.algorithm ?? DEFAULT_LOAD_BALANCE_ALGORITHM;
}

// return the load balance algorithm read fron the server configurations
function getLoadBalanceAlgorithm() {
  return load_balance_algorithm;
}

module.exports = {
  readLoadBalancer,
  getLoadBalanceAlgorithm,
};
