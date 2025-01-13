const { test, expect, describe, beforeEach } = require('@jest/globals');
const DataInOut = require('../../src/registry/dataInOut');

describe('DataInOut', () => {
  let dataInOut;

  beforeEach(() => {
    dataInOut = new DataInOut();
  });

  test('should return 0 when initializing', () => {
    expect(dataInOut.getDataIn()).toBe(0);
    expect(dataInOut.getDataOut()).toBe(0);
  });

  test('should return incremented value after incremented dataIn', () => {
    const prevValue = dataInOut.getDataIn();
    const incrementValue = 5;
    dataInOut.incrementDataIn(incrementValue);
    expect(dataInOut.getDataIn()).toBe(prevValue + incrementValue);
  });

  test('should return incremeneted value after icremented dataOut', () => {
    const prevValue = dataInOut.getDataOut();
    const incrementValue = 5;
    dataInOut.incrementDataOut(incrementValue);
    expect(dataInOut.getDataOut()).toBe(prevValue + incrementValue);
  });

  test('should return 0 after reset', () => {
    dataInOut.incrementDataIn(5);
    dataInOut.incrementDataOut(5);
    dataInOut.reset();
    expect(dataInOut.getDataIn()).toBe(0);
    expect(dataInOut.getDataOut()).toBe(0);
  });
});
