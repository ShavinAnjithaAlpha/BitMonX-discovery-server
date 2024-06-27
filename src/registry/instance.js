const HeartBeat = require('./heartbeat');
const InstanceStat = require('./instance_stat');

module.exports = class Instance {
  // static properties
  static MAX_HEARTBEAT_THRESHOLD = 100;
  // properties
  status;
  id;
  service_id;
  instance_name;
  ip_address;
  port;
  // instance dynamics properties
  heartbeats = [];
  stats;

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

  setStatus(status) {
    this.status = status;
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

  getStatus() {
    return this.status;
  }

  getStats() {
    return this.stats;
  }

  static builder() {
    return new Instance();
  }

  build() {
    this.status = 'UP';
    this.stats = new InstanceStat(this);
    return this;
  }

  addHeartBeat() {
    this.heartbeats.push(
      HeartBeat.builder()
        .setServiceId(this.service_id)
        .setInstanceId(this.id)
        .build(),
    );

    if (this.status === 'DOWN') {
      this.status = 'UP';
    }

    if (this.heartbeats.length > Instance.MAX_HEARTBEAT_THRESHOLD) {
      // remove the oldest heartbeats
      this.heartbeats.splice(0, Instance.MAX_HEARTBEAT_THRESHOLD);
    }
  }

  fromLastHeartBeat() {
    if (this.heartbeats.length === 0) return 0;
    return this.heartbeats[this.heartbeats.length - 1].fromNow();
  }
};
