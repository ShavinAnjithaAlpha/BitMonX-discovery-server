const request_handle = require('../request_handler');

class RoundRobin {
  // properties
  instance_count;
  current_instance;

  constructor() {
    // empty constructor
    this.current_instance = 0;
  }

  // getters
  getInstanceCount() {
    return this.instance_count;
  }

  getCurrentInstance() {
    return this.current_instance;
  }

  // setters
  setInstanceCount(instance_count) {
    this.instance_count = instance_count;
    return this;
  }

  addInstance() {
    this.instance_count += 1;
    this.reset();
    return this;
  }

  removeInstance() {
    this.instance_count -= 1;
    this.reset();
    return this;
  }

  static builder() {
    return new RoundRobin();
  }

  build() {
    return this;
  }

  // get the next instance
  next() {
    const index = this.current_instance;
    this.current_instance += 1;
    if (this.current_instance >= this.instance_count) {
      this.current_instance = 0;
    }
    return index;
  }

  reset() {
    this.current_instance = 0;
  }
}

function handleRoundRobin(serviceObj, req, res) {
  // get the load balancer state from the service object
  const state = serviceObj.getLoadBalancerState();
  let instance = null; // instance to be handled the request
  while (!instance) {
    const instance_ = serviceObj.getInstance(state.next());
    if (instance_.getStatus() !== 'UP') continue;
    instance = instance_;
  }
  // parse the request to make the request and return the response
  request_handle(instance, req, res);
}

module.exports = {
  RoundRobin,
  handleRoundRobin,
};
