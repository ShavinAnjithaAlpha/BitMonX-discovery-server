const { test, expect, describe, beforeEach } = require('@jest/globals');
const IDGenerator = require('../../src/registry/id_gen');

describe('IDGenerator', () => {
  let idGenerator;

  beforeEach(() => {
    idGenerator = new IDGenerator();
  });

  test('should return 1024 hash values when key is provide', () => {
    const key = 'key';
    const hash = IDGenerator.hash(key);
    expect(hash).toBeLessThan(1024);
  });

  test('should return new instance id with prefix i-', () => {
    const id = idGenerator.getNewInstanceID();
    expect(id).toMatch(/^i-/);
  });

  test('should return new service id with prefix s-', () => {
    const id = idGenerator.getNewServiceID();
    expect(id).toMatch(/^s-/);
  });

  test('should return two uniqe id when calling twise', () => {
    const id1 = idGenerator.getNewInstanceID();
    const id2 = idGenerator.getNewInstanceID();
    expect(id1).not.toBe(id2);
  });

  test('should return two uniqe id when calling twise with different prefix', () => {
    const id1 = idGenerator.getNewInstanceID();
    const id2 = idGenerator.getNewServiceID();
    expect(id1).not.toBe(id2);
  });
});
