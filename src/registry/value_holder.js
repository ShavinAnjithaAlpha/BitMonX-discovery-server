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
