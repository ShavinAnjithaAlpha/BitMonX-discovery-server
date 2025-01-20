module.exports = class CircularQueue {
  /**
   * CircularQueue is a queue data structure that used a fixed size array to store last N elements in a circular way.
   * The circular queue is used to maintain the various last N elements that needed in the service registry.
   * @param {number} size - The size of the circular queue.
   * @constructor CircularQueue
   * @example
   * const CircularQueue = require('./circular_queue');
   * const queue = new CircularQueue(10);
   */

  DEFAULT_SIZE = 1000;

  size;
  array;
  head;
  tail;
  is_full;

  constructor(size = this.DEFAULT_SIZE) {
    this.array = new Array(size);
    this.size = size;
    this.head = -1;
    this.tail = 0;
    this.is_full = false;
  }

  push(element) {
    if (this.head < this.size - 1) {
      this.head++;
      this.array[this.head] = element;

      if (this.head == this.size - 1) {
        this.is_full = true;
      }
    } else {
      this.head = 0;
      this.array[this.head] = element;
    }

    if (this.is_full && this.head == this.tail) {
      this.tail++;
    }
  }

  getSize() {
    if (this.is_full) {
      return this.size;
    } else {
      return this.head + 1;
    }
  }

  isFull() {
    return this.is_full;
  }

  getFullSize() {
    return this.size;
  }

  getLastN(n) {
    if (n instanceof String) {
      n = parseInt(n);
    }

    if (n > this.size) {
      throw new Error(
        'Requested number of elements is greater than the size of the queue',
      );
    }

    const result = [];
    let index = this.head;

    for (let i = 0; i < n; i++) {
      if (index < 0) {
        index = this.size - 1;
      }

      result.push(this.array[index]);
      index--;
    }

    return result;
  }
};
