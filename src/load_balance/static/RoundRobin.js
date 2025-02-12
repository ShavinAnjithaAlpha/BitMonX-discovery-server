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

const request_handle = require('../request_handler');

class RoundRobin {
  // properties
  instance_count;
  current_instance;

  constructor() {
    // empty constructor
    this.current_instance = 0;
  }

  // getters
  getInstanceCount() {
    return this.instance_count;
  }

  getCurrentInstance() {
    return this.current_instance;
  }

  // setters
  setInstanceCount(instance_count) {
    this.instance_count = instance_count;
    return this;
  }

  addInstance() {
    this.instance_count += 1;
    this.reset();
    return this;
  }

  removeInstance() {
    this.instance_count -= 1;
    this.reset();
    return this;
  }

  static builder() {
    return new RoundRobin();
  }

  build() {
    return this;
  }

  // get the next instance
  next() {
    const index = this.current_instance;
    this.current_instance += 1;
    if (this.current_instance >= this.instance_count) {
      this.current_instance = 0;
    }
    return index;
  }

  reset() {
    this.current_instance = 0;
  }
}

function handleRoundRobin(serviceObj, req, res) {
  // get the load balancer state from the service object
  const state = serviceObj.getLoadBalancerState();
  let instance = null; // instance to be handled the request
  while (!instance) {
    const instance_ = serviceObj.getInstance(state.next());
    if (instance_.getStatus() !== 'UP') continue;
    instance = instance_;
  }
  // parse the request to make the request and return the response
  request_handle(instance, req, res);
}

module.exports = {
  RoundRobin,
  handleRoundRobin,
};
