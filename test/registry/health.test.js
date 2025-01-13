const { test, expect, describe, beforeEach } = require('@jest/globals');
const Health = require('../../src/registry/health');

describe('Health', () => {
  let health;

  beforeEach(() => {
    health = Health.builder().build();
  });

  test('should return the cpu usage', () => {
    expect(health.getCpuUsage()).toBe(0);
  });

  test('should return the memory usage', () => {
    expect(health.getMemUsage()).toBe(0);
  });

  test('should set the cpu usage', () => {
    health.setCpuUsage(10);
    expect(health.getCpuUsage()).toBe(10);
  });

  test('should set the memory usage', () => {
    health.setMemUsage(20);
    expect(health.getMemUsage()).toBe(20);
  });

  test('should return the instance of Health', () => {
    expect(Health.builder()).toBeInstanceOf(Health);
  });
});
