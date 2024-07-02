const Instance = require('./instance');
const { getLoadBalanceAlgorithm } = require('../load_balance/init');
const { RoundRobin } = require('../load_balance/static/RoundRobin');
const ServiceError = require('../error/ServiceError');
const { Random } = require('../load_balance/static/Random');
const { IpHash } = require('../load_balance/static/IpHash');
const broadcastData = require('../tasks/socket_broadcast');

module.exports = class Service {
  // static properties
  static DEFAULT_HEARTBEAT_INTERVAL = 10000;
  // properties
  id;
  name;
  mapping;
  health_check_url;
  health_check_interval;
  timeout;
  version;
  protocol;
  env;
  heartbeat_interval = Service.DEFAULT_HEARTBEAT_INTERVAL;
  // array of service's instances
  instances = [];

  // property for store the state of the load balancing algorithm
  loadbalancer_state = null;

  static nextServiceId = 0;

  constructor() {
    this.id = ++Service.nextServiceId;
  }

  // setters for each properties
  setName(name) {
    this.name = name;
    return this;
  }

  setMapping(mapping) {
    this.mapping = mapping;
    return this;
  }

  setHealthCheckUrl(health_check_url) {
    this.health_check_url = health_check_url;
    return this;
  }

  setHealthCheckInterval(health_check_interval) {
    this.health_check_interval = health_check_interval;
    return this;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }

  setVersion(version) {
    this.version = version;
    return this;
  }

  setProtocol(protocol) {
    this.protocol = protocol;
    return this;
  }

  setEnv(env) {
    this.env = env;
    return this;
  }

  setHeartBeatInterval(interval) {
    this.heartbeat_interval = interval;
    return this;
  }

  // getters for each properties
  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getMapping() {
    return this.mapping;
  }

  getHealthCheckUrl() {
    return this.health_check_url;
  }

  getHealthCheckInterval() {
    return this.health_check_interval;
  }

  getTimeout() {
    return this.timeout;
  }

  getVersion() {
    return this.version;
  }

  getProtocol() {
    return this.protocol;
  }

  getEnv() {
    return this.env;
  }

  getHeartBeatInterval() {
    return this.heartbeat_interval;
  }

  getInstances() {
    return this.instances;
  }

  getInstance(index) {
    if (index >= this.instances.length) {
      throw new ServiceError('No instance with index: ' + index);
    }

    return this.instances[index];
  }

  getInstanceById(instance_id) {
    const instance = this.instances.find(
      (instance) => instance.getId() === instance_id,
    );

    return instance;
  }

  getLoadBalancerState() {
    return this.loadbalancer_state;
  }

  getRandomInstance() {
    // first filter the UP instances from the instances list
    const upInstances = this.instances.filter(
      (instance) => instance.getStatus() === 'UP',
    );
    if (upInstances.length === 0) null;

    // randomly select the instance from the instance list
    const randomIndex = Math.floor(Math.random() * upInstances.length);
    return upInstances[randomIndex];
  }

  static builder() {
    // return a new empty instance of Service with generated Service ID
    return new Service();
  }

  // method for building the load balancing state object for the service
  buildLoadBalancerState() {
    // get the load balancer algorithm from the global configs
    const algorithm = getLoadBalanceAlgorithm();
    switch (algorithm) {
      case 'round-robin':
        this.loadbalancer_state = RoundRobin.builder()
          .setInstanceCount(this.numberOfInstances())
          .build();
        break;

      case 'random':
        this.loadbalancer_state = Random.builder()
          .setInstanceCount(this.numberOfInstances())
          .build();
        break;
      case 'ip-hash':
        this.loadbalancer_state = IpHash.builder().build();
        break;
      default:
        break;
    }
  }

  build() {
    this.timeout = setTimeout(() => {
      // create heartbeat check on the service instances
      this.hearbeatInterval = setInterval(() => {
        // get all the clients associated with the service
        const clients = this.instances;
        clients.forEach((client) => {
          this.checkInstanceStatus();
        });
      }, this.heartbeat_interval);
    }, 2000);
    this.buildLoadBalancerState();
    return this;
  }

  findInstanceWithURL(ipAddress, port) {
    const instance = this.instances.find(
      (instance) =>
        instance.getIpAddress() === ipAddress && instance.getPort() === port,
    );

    return instance;
  }

  addInstance(ip_address, port, instance_name) {
    const instance = Instance.builder()
      .setId(this.instances.length + 1)
      .setServiceId(this.id)
      .setInstanceName(instance_name)
      .setIpAddress(ip_address)
      .setPort(port)
      .build();

    this.updateLoadBalancerState('add', instance);
    // add the instance to the instances array
    this.instances.push(instance);

    // broadcast the changes to the clients
    const broadcast_data = {
      action: 'instance_registered',
      service_id: this.getId(),
      service_name: this.getName(),
      instance: {
        id: instance.getId(),
        name: instance.getInstanceName(),
        ip_address: instance.getIpAddress(),
        port: instance.getPort(),
        status: instance.getStatus(),
      },
    };
    broadcastData(broadcast_data);

    return instance.getId();
  }

  addHeartBeat(instance_id) {
    const instance = this.instances.find(
      (instance) => instance.getId() === instance_id,
    );

    if (!instance) throw new ServiceError('Instance not found', 404);

    instance.addHeartBeat();
  }

  removeInstance(instance_id) {
    const instance = this.instances.find(
      (instance) => instance.getId() === instance_id,
    );
    this.instances = this.instances.filter(
      (instance) => instance.getId() !== instance_id,
    );

    this.updateLoadBalancerState('remove', instance);
  }

  numberOfInstances() {
    return this.instances.length;
  }

  checkInstanceStatus() {
    this.getInstances().forEach((instance) => {
      const timeDiff = instance.fromLastHeartBeat(); // fetch the time difference between the last heartbeat and now
      const status_ = instance.getStatus();
      if (timeDiff > this.heartbeat_interval * 2) {
        instance.setStatus('DOWN');
      } else {
        instance.setStatus('UP');
      }

      // if changes occur in the instance status broadcast the changes to the clients
      if (status_ !== instance.getStatus()) {
        console.log(
          `[INSTANCE]: Instance ${instance.getId()} is ${instance.getStatus()}`,
        );
        // broadcast the instance status to the clients
        broadcastData({
          action: 'instance_status',
          service_id: this.getId(),
          instance_id: instance.getId(),
          status: instance.getStatus(),
        });
      }
    });
  }

  // method for updating the load balancing state
  updateLoadBalancerState(action, instance = null) {
    if (this.loadbalancer_state !== null) {
      const loadBalancerAlgorithm = getLoadBalanceAlgorithm();
      if (loadBalancerAlgorithm === 'round-robin') {
        if (action === 'add') {
          this.loadbalancer_state.addInstance();
        } else if (action === 'remove') {
          this.loadbalancer_state.removeInstance();
        }
      } else if (loadBalancerAlgorithm === 'random') {
        if (action === 'add') {
          this.loadbalancer_state.addInstance();
        } else if (action === 'remove') {
          this.loadbalancer_state.removeInstance();
        }
      } else if (loadBalancerAlgorithm === 'ip-hash') {
        if (action === 'add') {
          this.loadbalancer_state.addNode(instance);
        } else if (action === 'remove') {
          this.loadbalancer_state.removeNode(instance);
        }
      }
    }
  }
};
