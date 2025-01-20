const { test, expect, describe, beforeEach } = require('@jest/globals');
const CircularQueue = require('../../src/registry/circular_queue');

describe('CircularQueue', () => {
  let circularQueue;

  beforeEach(() => {
    circularQueue = new CircularQueue(10);
  });

  test('should return full size when initialized', () => {
    let queue = new CircularQueue(10);
    expect(queue.getFullSize()).toBe(10);
  });

  test('should return size 0 when initialized', () => {
    expect(circularQueue.getSize()).toBe(0);
  });

  test('should return correct size when pushing elements', () => {
    circularQueue.push(1);
    circularQueue.push(2);
    circularQueue.push(3);
    expect(circularQueue.getSize()).toBe(3);
  });

  test('should return isFull after pushing some elements', () => {
    circularQueue.push(1);
    circularQueue.push(2);
    circularQueue.push(3);
    expect(circularQueue.isFull()).toBe(false);
  });

  test('should return isFull after pushing elements equal to size', () => {
    for (let i = 0; i < 10; i++) {
      circularQueue.push(i);
    }
    expect(circularQueue.isFull()).toBe(true);
  });

  test('should return correct last 5 elements when pushing 5 elements', () => {
    for (let i = 0; i < 5; i++) {
      circularQueue.push(i);
    }

    const last5 = circularQueue.getLastN(5);
    expect(last5).toEqual([4, 3, 2, 1, 0]);
  });

  test('should return correct last 5 elements when pushing 4 elements', () => {
    for (let i = 0; i < 4; i++) {
      circularQueue.push(i);
    }

    const last5 = circularQueue.getLastN(5);
    expect(last5).toEqual([3, 2, 1, 0]);
  });

  test('should return correct last elements when queue is full', () => {
    for (let i = 0; i < 10; i++) {
      circularQueue.push(i);
    }

    const last5 = circularQueue.getLastN(5);
    expect(last5).toEqual([9, 8, 7, 6, 5]);

    for (let i = 10; i < 15; i++) {
      circularQueue.push(i);
    }

    const last5AfterFull = circularQueue.getLastN(5);
    expect(last5AfterFull).toEqual([14, 13, 12, 11, 10]);
  });
});
