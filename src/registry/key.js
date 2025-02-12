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

const crypto = require('crypto');

module.exports = class Key {
  // class that represent the request type
  static RequestType = Object.freeze({
    JSON: 'json',
    XML: 'xml',
  });

  // class represent the entity type requested
  static EntityType = Object.freeze({
    SERVICE: 'service',
    INSTANCE: 'instance',
    SERVICE_WITH_INSTANCE: 'service_with_instance',
  });

  entityType;
  entityId;
  hashKey;

  constructor() {}

  getEntityType() {
    return this.entityType;
  }

  getEntityIndex() {
    return this.entityId;
  }

  getHashKey() {
    return this.hashKey;
  }

  static builder() {
    return new Key();
  }

  setEntityType(entityType) {
    this.entityType = entityType;
    return this;
  }

  setEntityIndex(entityId) {
    this.entityId = entityId;
    return this;
  }

  build() {
    this.hashKey = `${this.entityType}:${this.entityId}`;
    return this;
  }

  // return JSON representation of the key object
  toJSON() {
    return {
      entityType: this.entityType,
      entityId: this.entityId,
    };
  }

  // return the hash value of the Key using the MD5 hashfunction
  hashValue() {
    return crypto.createHash('md5').update(this.hashKey).digest('hex');
  }

  // check whether if two given keys are equal
  equals(key) {
    if (key instanceof Key) {
      return this.hashKey === key.hashKey;
    } else {
      return false;
    }
  }
};
