const { test, expect, describe, beforeEach } = require('@jest/globals');
const HeartBeat = require('../../src/registry/heartbeat');

describe('HeartBeat', () => {
  let heartbeat;

  beforeEach(() => {
    heartbeat = HeartBeat.builder().build();
  });

  test('should return service ID when set', () => {
    heartbeat.setServiceId(1);
    expect(heartbeat.getServiceId()).toBe(1);
  });

  test('should return instance ID when set', () => {
    heartbeat.setInstanceId(1);
    expect(heartbeat.getInstanceId()).toBe(1);
  });

  test('should return a timestamp when initialized', () => {
    expect(heartbeat.getDatetimestamp()).not.toBeNull();
    expect(heartbeat.getDatetimestamp()).not.toBeUndefined();
    expect(typeof heartbeat.getDatetimestamp()).toBe('string');
  });

  test('should return correct time difference', () => {
    const heartbeat = HeartBeat.builder().build();
    const time = heartbeat.fromNow();
    expect(time).not.toBeNull();
    expect(time).not.toBeUndefined();
    expect(typeof time).toBe('number');
  });
});
