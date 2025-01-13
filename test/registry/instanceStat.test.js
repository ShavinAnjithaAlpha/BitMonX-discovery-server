const { test, expect, describe, beforeEach } = require('@jest/globals');
const InstanceStat = require('../../src/registry/instance_stat');

describe('InstanceStat', () => {
  let instanceStat;

  beforeEach(() => {
    instanceStat = new InstanceStat();
  });

  test('should return 0 when initializing', () => {
    expect(instanceStat.getAvgResponseTime()).toBe(0);
    expect(instanceStat.getTotalRequests()).toBe(0);
    expect(instanceStat.getFailedRequests()).toBe(0);
  });

  test('should return correct total request counts and avg response time after update', () => {
    // set the aged factor
    instanceStat.setAgedFactor(0.5);
    // update the instance stat via a successful request
    instanceStat.update(100, false);
    expect(instanceStat.getTotalRequests()).toBe(1);
    expect(instanceStat.getFailedRequests()).toBe(0);
    expect(instanceStat.getAvgResponseTime()).toBe(50);
    // update the instance stat via a failed request
    instanceStat.update(200, true);
    expect(instanceStat.getTotalRequests()).toBe(2);
    expect(instanceStat.getFailedRequests()).toBe(1);
    expect(instanceStat.getAvgResponseTime()).toBe(62.5);
  });

  test('should return correct error rate', () => {
    // set the aged factor
    instanceStat.setAgedFactor(0.5);
    // update the instance stat via a successful request
    instanceStat.update(100, false);
    expect(instanceStat.getErrorRate()).toBe(0);
    // update the instance stat via a failed request
    instanceStat.update(200, true);
    expect(instanceStat.getErrorRate()).toBe(0.5);
  });

  test('should return correct last updated time', () => {
    // update the instance stat
    instanceStat.update(100, false);
    const lastUpdated = instanceStat.getLastUpdated();
    expect(lastUpdated).toBeInstanceOf(Date);
  });
});
