const HeartBeat = require('./heartbeat');
const InstanceStat = require('./instance_stat');
const Health = require('./health');
const broadcastData = require('../tasks/socket_broadcast');

/*
 * This class is used to store the instance object
 */
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
  health;

  constructor() {}

  /*
   * return JSON representation of the instance object
   */
  toJSON() {
    return {
      id: this.id,
      sevice_id: this.service_id,
      instance_name: this.instance_name,
      ip_address: this.ip_address,
      port: this.port,
    };
  }

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

  setHealth(health) {
    this.health = health;
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

  getHealth() {
    return this.health;
  }

  static builder() {
    return new Instance();
  }

  build() {
    this.status = 'UP';
    this.stats = new InstanceStat(this);
    this.health = Health.builder().build();
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
      // broadcast the changes to the clients
      broadcastData({
        action: 'instance_status',
        service_id: this.service_id,
        instance_id: this.id,
        status: 'UP',
      });
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
