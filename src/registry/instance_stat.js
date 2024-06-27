class InstanceStat {
  // properties
  avg_response_time;
  total_requests;
  failed_requests;
  last_updated;
  instance;

  // additional meta proeprties
  response_time_aged_factor = 0.95;

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
        response_time) /
      (this.total_requests + 1);
    // update the total requests and failed requests
    this.total_requests++;
    // update the total number of failed requests if request is failed
    if (failed) this.failed_requests++;
    // update the last updated time
    this.last_updated = new Date();
    console.log(this.avg_response_time);
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
