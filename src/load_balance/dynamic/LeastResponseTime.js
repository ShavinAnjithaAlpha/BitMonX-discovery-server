const ServiceError = require('../../error/ServiceError');
const request_handle = require('../request_handler');

class LeastResponseTime {
  // properties
  instances; // to store the instances
  current_instance; // to store the current instance
  lastCurrentTime; // to store the last time the current instance was used

  // time constants that used to measure the maximum time that one node can keep being the current node
  static MAX_CURRENT_TIME = 250; // 1 second

  constructor(instances) {
    this.instances = instances;
    this.current_instance = instances && this.instances[0];
    this.lastCurrentTime = new Date();
  }

  // getters
  getInstanceCount() {
    return this.instances.length;
  }

  // setters
  setInstances(instances) {
    this.instances = instances;
    return this;
  }

  // method to find the minimum response time instances out of the instances
  getLeastResponseTimeInstance() {
    let min = Number.MAX_SAFE_INTEGER;
    let instance = null;
    this.instances.forEach((instance_) => {
      if (instance_.getStats().getAvgResponseTime() < min) {
        min = instance_.getStats().getAvgResponseTime();
        instance = instance_;
      }
    });
    this.current_instance = instance;
    // return the instance with the minimum response time
    return instance;
  }

  // get the next instance to be requested
  next() {
    // get the time difference between last current time and now
    const now = new Date();
    const diff = now - this.lastCurrentTime;
    // if the difference is less than the maximum current time, return the current instance
    if (diff < LeastResponseTime.MAX_CURRENT_TIME) {
      return this.current_instance;
    } else {
      this.lastCurrentTime = now;
      return this.getLeastResponseTimeInstance();
    }
  }
}

// method to handle the least response time load balancer
function handleLeastResponseTime(serviceObj, req, res) {
  // get the load balancer state from the service object
  const state = serviceObj.getLoadBalancerState();
  // get the instance with the least response time
  const instance = state.next();
  if (!instance) throw new ServiceError('No instances available', 503);

  console.log(
    'found the least response time instance: ',
    instance.getId(),
    ' with response time: ',
    instance.getStats().getAvgResponseTime().toFixed(4),
  );
  // parse the request to make the request and return the response
  request_handle(instance, req, res);
}

module.exports = {
  LeastResponseTime,
  handleLeastResponseTime,
};
