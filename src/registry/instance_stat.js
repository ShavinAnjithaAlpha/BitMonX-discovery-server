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
  This class is used to store the instance stats
*/
class InstanceStat {
  // properties
  avg_response_time;
  total_requests;
  failed_requests;
  last_updated;
  instance;

  // additional meta proeprties
  response_time_aged_factor = 0.875;

  constructor(instance) {
    this.instance = instance;
    this.avg_response_time = 0;
    this.total_requests = 0;
    this.failed_requests = 0;
    this.last_updated = new Date();
    return this;
  }

  setAgedFactor(factor) {
    this.response_time_aged_factor = factor;
    return this;
  }

  // update the instance stat
  update(response_time, failed) {
    // calculate the timed average response time
    this.avg_response_time =
      (this.avg_response_time *
        this.response_time_aged_factor *
        this.total_requests +
        response_time * (1 - this.response_time_aged_factor)) /
      (this.total_requests + 1);
    // update the total requests and failed requests
    this.total_requests++;
    // update the total number of failed requests if request is failed
    if (failed) this.failed_requests++;
    // update the last updated time
    this.last_updated = new Date();
    return this;
  }

  // get the instance stat
  getAvgResponseTime() {
    return this.avg_response_time;
  }

  getTotalRequests() {
    return this.total_requests;
  }

  getFailedRequests() {
    return this.failed_requests;
  }

  getLastUpdated() {
    return this.last_updated;
  }

  getErrorRate() {
    return this.total_requests === 0
      ? 0
      : this.failed_requests / this.total_requests;
  }

  getInstance() {
    return this.instance;
  }
}

module.exports = InstanceStat;
