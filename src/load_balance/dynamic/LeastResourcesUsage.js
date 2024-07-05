const ServiceError = require('../../error/ServiceError');
const request_handle = require('../request_handler');

class LeastResourceUsage {
  // properties
  instances;
  service;
  current_instance;

  static CPU_USAGE_WEIGHT = 0.4;
  static MEMORY_USAGE_WEIGHT = 0.3;
  static ERROR_USAGE_WEIGHT = 0.3;

  static CHECK_INTERVAL = 2000;

  constructor(instances, service) {
    this.instances = instances;
    this.service = service;
    this.current_instance = instances && this.instances[0];
  }

  static builder(instances, service) {
    return new LeastResourceUsage(instances, service);
  }

  build() {
    // setup the periodic task to fetch the health data from the instances and update the state
    setInterval(() => {
      fetchHealthFromInstances(this.instances, this.service, this);
    }, LeastResourceUsage.CHECK_INTERVAL);

    return this;
  }

  getCurrentInstance() {
    return this.current_instance;
  }

  calculateScore(instance) {
    // get the instance' health object
    const healthObj = instance.getHealth();
    // return the caculated score of the instance
    return (
      LeastResourceUsage.CPU_USAGE_WEIGHT * healthObj.getCpuUsage() +
      LeastResourceUsage.MEMORY_USAGE_WEIGHT * healthObj.getMemUsage() +
      LeastResourceUsage.ERROR_USAGE_WEIGHT * instance.getStats().getErrorRate()
    );
  }

  updateLeastResourceUsageInstance() {
    let min = Number.MAX_SAFE_INTEGER;
    let instance = null;

    this.instances.forEach((instance_) => {
      const score = this.calculateScore(instance_);
      if (instance_.getStatus() === 'UP' && score < min) {
        min = score;
        instance = instance_;
      }
    });

    this.current_instance = instance;
    return instance;
  }
}

function fetchHealthFromInstances(instances, service, state) {
  instances.forEach((instance) => {
    // call the health endpoint of the each server
    const host = instance.getIpAddress();
    const port = instance.getPort();
    const healthEndpoint = service.getHealthCheckUrl();

    const url = `http://${host}:${port}${healthEndpoint}`;
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const cpu_usage = data.cpu_usage[data.cpu_usage.length - 1].usage;
        const mem_usage = data.memory_usage.usage;

        instance.getHealth().setCpuUsage(cpu_usage).setMemUsage(mem_usage);
        // update the load balancer state
        state.updateLeastResourceUsageInstance();
      })
      .catch((err) => {
        // ignore the error
      });
  });
}

// function to handle the load balancing based on its load balancer state
function handleLeastResourceUsage(serviceObj, req, res) {
  // get the load balancer state from the service object
  const state = serviceObj.getLoadBalancerState();
  // get the next instance to be requested
  const instance = state.getCurrentInstance();
  if (!instance) throw new ServiceError('No instances available', 503);

  console.log(
    'Handling request using LeastResourceUsage strategy',
    instance.getId(),
  );
  // parse the request to the requets handler
  request_handle(instance, req, res);
}

module.exports = {
  LeastResourceUsage,
  handleLeastResourceUsage,
};
