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
