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

module.exports = class ValueHolder {
  /**
   * ValueHolder is a class that holds a value and the time it was initialized and updated.
   * The ValueHolder is used in various places in the registry such as lastN queues for storing timestamped entries of registry elements
   */

  initialized_at;
  updated_at;
  value;

  constructor(value) {
    if (value == null) {
      throw new Error('Value cannot be null');
    }

    this.initialized_at = Date.now();
    this.updated_at = null;
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  getCreatedAt() {
    return this.initialized_at;
  }

  getUpdatedAt() {
    return this.updated_at;
  }

  getSinceCreated() {
    return Date.now() - this.initialized_at;
  }

  getSinceUpdated() {
    if (this.updated_at == null) {
      return null;
    }
    return Date.now() - this.updated_at;
  }

  isExpired(expiryTime) {
    return this.getSinceNow() > expiryTime;
  }

  setValue(value) {
    this.value = value;
    this.updated_at = Date.now();
  }

  toJSON() {
    return {
      createdAt: new Date(this.initialized_at).toISOString(),
      value: this.value.toJSON(),
    };
  }
};
