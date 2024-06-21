module.exports = class Instance {
  // properties
  id;
  service_id;
  instance_name;
  ip_address;
  port;

  constructor() {}

  // setters for each properties
  setId(id) {
    this.id = id;
    return this;
  }

  setServiceId(service_id) {
    this.service_id = service_id;
    return this;
  }

  setInstanceName(instance_name) {
    this.instance_name = instance_name;
    return this;
  }

  setIpAddress(ip_address) {
    this.ip_address = ip_address;
    return this;
  }

  setPort(port) {
    this.port = port;
    return this;
  }

  // getters for each properties
  getId() {
    return this.id;
  }

  getServiceId() {
    return this.service_id;
  }

  getInstanceName() {
    return this.instance_name;
  }

  getIpAddress() {
    return this.ip_address;
  }

  getPort() {
    return this.port;
  }

  static builder() {
    return new Instance();
  }

  build() {
    return this;
  }
};
