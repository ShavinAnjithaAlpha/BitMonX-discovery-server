module.exports = class ServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }

  statusCode() {
    return this.status;
  }
};
