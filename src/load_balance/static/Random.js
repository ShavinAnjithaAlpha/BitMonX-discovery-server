const request_handle = require('../request_handler');

class Random {
  instance_count;

  constructor() {}

  // getters
  getInstanceCount() {
    return this.instance_count;
  }

  // setters
  setInstanceCount(count) {
    this.instance_count = count;
  }

  static builder() {
    return new Random();
  }

  build() {
    return this;
  }

  // add instance
  addInstance() {
    this.instance_count += 1;
    return this;
  }

  // remove instance
  removeInstance() {
    this.instance_count -= 1;
    return this;
  }

  next() {
    return Math.floor(Math.random() * this.instance_count);
  }
}

function handleRandom(serviceObj, req, res) {
  // get the load balancer state
  const state = serviceObj.getLoadBalancerState();
  let instance = null;
  while (!instance) {
    const instance_ = serviceObj.getInstance(state.next());
    if (instance_.getStatus() !== 'UP') continue;

    instance = instance_;
  }

  // parse the request to the request handler and return the response
  request_handle(instance, req, res);
}

module.exports = {
  Random,
  handleRandom,
};
