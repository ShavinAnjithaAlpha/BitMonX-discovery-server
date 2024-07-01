class TokenBucket {
  // properties of the token bucket
  capacity;
  tokens;
  fillRate;
  timestamp;

  constructor(capacity, fillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.fillRate = fillRate;
    this.timestamp = Date.now();
  }

  // consume tokens from the bucket
  consume(count) {
    // calculate the elapsed time
    const now = Date.now();
    const elapsed = (now - this.timestamp) / 1000;
    this.timestamp = now;

    // add new tokens to the bucket
    this.tokens += elapsed * this.fillRate;
    this.tokens = Math.min(this.tokens, this.capacity);

    // check if there are enough tokens
    if (count > this.tokens) {
      return false;
    }

    // consume the tokens
    this.tokens -= count;
    return true;
  }

  // get the number of tokens in the bucket
  getTokens() {
    return this.tokens;
  }

  // get the capacity of the bucket
  getCapacity() {
    return this.capacity;
  }

  // get the fill rate of the bucket
  getFillRate() {
    return this.fillRate;
  }

  static build() {
    // read the configuration from the config json file
    const config = require('../read_config');
    // create a new token bucket object
    return new TokenBucket(
      config.ratelimiting.capacity,
      config.ratelimiting.fillRate,
    );
  }
}

module.exports = TokenBucket;
