/* 
  This class is used to create a HeartBeat object that will be used to send a heartbeat to the registry
*/
module.exports = class HeartBeat {
  // properties
  service_id;
  instance_id;
  datetimestamp;

  constructor() {
    this.datetimestamp = new Date().toISOString();
  }

  // setters for service id and instance id
  setServiceId(service_id) {
    this.service_id = service_id;
    return this;
  }

  setInstanceId(instance_id) {
    this.instance_id = instance_id;
    return this;
  }

  // get the service id
  getServiceId() {
    return this.service_id;
  }

  // get the instance id
  getInstanceId() {
    return this.instance_id;
  }

  // get the date timestamp
  getDatetimestamp() {
    return this.datetimestamp;
  }

  // builder
  static builder() {
    return new HeartBeat();
  }

  // return the time didderence between the timestamp and now in milliseconds
  fromNow() {
    return new Date().getTime() - new Date(this.datetimestamp).getTime();
  }

  // build the HeartBeat object
  build() {
    return this;
  }
};
