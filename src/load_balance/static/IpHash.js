const crypto = require('crypto');
const request_handle = require('../request_handler');

class IpHash {
  hashring;
  sorted_keys;

  constructor() {
    this.hashring = {};
    this.sorted_keys = [];
  }

  static builder() {
    return new IpHash();
  }

  build() {
    return this;
  }

  // util method related to IP hashing
  static hashIp(ip_address, port) {
    const hash = crypto.createHash('md5');
    return hash.update(ip_address + ':' + port).digest('hex');
  }

  static _binary_search(arr, key, low, high) {
    if (low > high) return low;
    // get the midpoint of the givel slice
    const mid = Math.floor((low + high) / 2);
    // check if the midpoint is the key
    if (arr[mid] === key) {
      return mid;
    } else if (arr[mid] < key) {
      return this._binary_search(arr, key, mid + 1, high);
    } else if (arr[mid] > key) {
      return this._binary_search(arr, key, low, mid - 1);
    }
  }

  addNode(instance) {
    // get the hash of the IP address
    const hash = IpHash.hashIp(instance.getIpAddress(), instance.getPort());
    // find the positions of the hash in the sorted keys
    const position = IpHash._binary_search(
      this.sorted_keys,
      hash,
      0,
      this.sorted_keys.length - 1,
    );
    // insert the key in the sorted keys
    this.sorted_keys.splice(position, 0, hash);
    this.hashring[hash] = instance;
  }

  removeNode(instance) {
    // get the hash of the IP address
    const hash = IpHash.hashIp(instance.getIpAddress(), instance.getPort());
    // find the postion of the hash in the sorted keys
    const position = IpHash._binary_search(
      this.sorted_keys,
      hash,
      0,
      this.sorted_keys.length - 1,
    );
    // remove that element from the sorted keys
    this.sorted_keys.splice(position, 1);
    delete this.hashring[hash];
  }

  getNode(ip_address, offset = 0) {
    // get the hash of the IP address
    const hash = IpHash.hashIp(ip_address);
    // get the position of the hash in the sorted keys
    const position = IpHash._binary_search(
      this.sorted_keys,
      hash,
      0,
      this.sorted_keys.length - 1,
    );

    const nodeHash =
      this.sorted_keys[(position + offset) % this.sorted_keys.length];
    // return the node
    return this.hashring[nodeHash];
  }
}

// function handler for the IP hashing load balancing algorithm
function handleIpHash(serviceObj, req, res) {
  // get the state from the service object
  const load_balancer_state = serviceObj.getLoadBalancerState();
  // extract the ip address of the request
  const ip_address = req.connection.remoteAddress;
  // get the instance from the ip hash
  let instance = null;
  let offset = 0;
  // lop through the hashring until find a instance with status UP
  while (!instance) {
    const instance_ = load_balancer_state.getNode(ip_address, offset);
    if (instance_.getStatus() !== 'UP') {
      offset += 1;
      continue;
    }

    instance = instance_;
  }

  // forward the request to the request handler to handle the request and return the response
  request_handle(instance, req, res);
}

module.exports = {
  IpHash,
  handleIpHash,
};
