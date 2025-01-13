const { test, expect, beforeEach, describe } = require('@jest/globals');
const Key = require('../../src/registry/key');

describe('Key', () => {
  test('should key return correct hash key when created', () => {
    const key = Key.builder()
      .setEntityType(Key.EntityType.SERVICE)
      .setEntityIndex(1)
      .build();
    expect(key.getHashKey()).toBe('service:1');
  });

  test('should return the correct hash value when created', () => {
    const key = Key.builder()
      .setEntityType(Key.EntityType.SERVICE)
      .setEntityIndex(1)
      .build();
    expect(key.hashValue()).toBe('fc8126dfa1f5c0f645a19e49cd44bf7a');
  });

  test('should return false when comparing two different objects', () => {
    const key = Key.builder()
      .setEntityType(Key.EntityType.SERVICE)
      .setEntityIndex(1)
      .build();

    expect(key.equals('jsjdhsds')).toBe(false);
  });

  test('should return true when comparing same two keys', () => {
    const key = Key.builder()
      .setEntityType(Key.EntityType.SERVICE)
      .setEntityIndex(1)
      .build();

    const key2 = Key.builder()
      .setEntityType(Key.EntityType.SERVICE)
      .setEntityIndex(1)
      .build();

    expect(key.equals(key2)).toBe(true);
  });

  test('should return correct JSON representation of the key', () => {
    const key = Key.builder()
      .setEntityType(Key.EntityType.SERVICE)
      .setEntityIndex(1)
      .build();

    expect(key.toJSON()).toEqual({
      entityType: 'service',
      entityId: 1,
    });
  });
});
