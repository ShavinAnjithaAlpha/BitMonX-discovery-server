/* 
  This class is used to create an instance error.
  It extends the Error class.
  It has two properties, message and status.
  The constructor takes in a message and status.
*/
module.exports = class InstanceError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }

  statusCode() {
    return this.status;
  }
};
