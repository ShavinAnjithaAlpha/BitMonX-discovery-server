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
 * Token Bucket Algorithm
 * The token bucket algorithm is a rate limiting algorithm that is used in network traffic management.
 * It is used to control the rate of traffic sent or received on a network.
 * The token bucket algorithm works by having a bucket that is filled with tokens.
 * When a packet arrives, a token is removed from the bucket.
 * If the bucket is empty, the packet is dropped.
 * The bucket is refilled at a constant rate.
 * @class TokenBucket
 * @constructor
 * @param {Number} capacity - The capacity of the token bucket
 * @param {Number} fillRate - The rate at which the bucket is refilled
 * @returns {TokenBucket} - The token bucket object
 */
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
