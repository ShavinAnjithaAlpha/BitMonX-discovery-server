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

/*
  This function reads the load balancer algorithm from the server configurations.
  If not found, it uses the default algorithm.
*/
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
