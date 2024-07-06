class DataInOut {
  // properties
  dataIn;
  dataOut;

  constructor() {
    this.dataIn = 0;
    this.dataOut = 0;
  }

  // methods
  // increment the dataIn property
  incrementDataIn(data) {
    this.dataIn += data;
  }

  // increment the dataOut property
  incrementDataOut(data) {
    this.dataOut += data;
  }

  // getters
  getDataIn() {
    return this.dataIn;
  }

  getDataOut() {
    return this.dataOut;
  }

  reset() {
    this.dataIn = 0;
    this.dataOut = 0;
  }
}

module.exports = DataInOut;
