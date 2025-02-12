/**
 * MIT License
 *
 * Copyright (c) 2024 Shavin Anjitha Chandrawansha
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

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
