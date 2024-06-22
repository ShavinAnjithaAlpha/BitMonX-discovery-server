const HeartBeat = require('./heartbeat');

module.exports = class Instance {
  // static properties
  static MAX_HEARTBEAT_THRESHOLD = 100;
  // properties
  id;
  service_id;
  instance_name;
  ip_address;
  port;
  heartbeats = [];

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

  addHeartBeat() {
    this.heartbeats.push(
      HeartBeat.builder()
        .setServiceId(this.service_id)
        .setInstanceId(this.id)
        .build(),
    );

    if (this.heartbeats.length > Instance.MAX_HEARTBEAT_THRESHOLD) {
      // remove the oldest heartbeats
      this.heartbeats.splice(0, Instance.MAX_HEARTBEAT_THRESHOLD);
    }
  }
};
