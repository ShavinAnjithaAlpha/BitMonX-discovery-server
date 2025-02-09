const HeartBeat = require('./heartbeat');
const InstanceStat = require('./instance_stat');
const Health = require('./health');
const broadcastData = require('../tasks/socket_broadcast');
const IDGenerator = require('./id_gen');

/*
 * This class is used to store the instance object
 */
module.exports = class Instance {
  // static properties
  static MAX_HEARTBEAT_THRESHOLD = 100;
  // properties
  status;
  id;
  globalId;
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
   * return JSON representation of the instance object based on verbosity level provided
   * @param {number} verbosity_level - The verbosity level of the JSON representation
   * verbosity_level 0: return only the basic details of the instance
   * verbosity_level 1: return the basic details along with the status of the instance
   */
  toJSON(verbosity_level = 0) {
    switch (verbosity_level) {
      case 0:
        return {
          id: this.id,
          globalId: this.globalId,
          seviceId: this.service_id,
          instanceName: this.instance_name,
          ipAddress: this.ip_address,
          port: this.port,
        };
      case 1:
        return {
          id: this.id,
          globalId: this.globalId,
          seviceId: this.service_id,
          instanceName: this.instance_name,
          ipAddress: this.ip_address,
          port: this.port,
          status: this.status,
        };

      default:
        return {
          id: this.id,
          globalId: this.globalId,
          seviceId: this.service_id,
          instanceName: this.instance_name,
          ipAddress: this.ip_address,
          port: this.port,
        };
    }
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

  getGlobalId() {
    return this.globalId;
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
    this.globalId = IDGenerator.getIDGen().getNewInstanceID();
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
