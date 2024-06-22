const Instance = require('./instance');

module.exports = class Service {
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
  // array of service's instances
  instances = [];

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

  static builder() {
    // return a new empty instance of Service with generated Service ID
    return new Service();
  }

  build() {
    return this;
  }

  addInstance(ip_address, port, instance_name) {
    const instance = Instance.builder()
      .setId(this.instances.length + 1)
      .setServiceId(this.id)
      .setInstanceName(instance_name)
      .setIpAddress(ip_address)
      .setPort(port)
      .build();

    // add the instance to the instances array
    this.instances.push(instance);
    return instance.getId();
  }

  removeInstance(instance_id) {
    this.instances = this.instances.filter(
      (instance) => instance.getId() !== instance_id,
    );
  }

  numberOfInstances() {
    return this.instances.length;
  }
};
