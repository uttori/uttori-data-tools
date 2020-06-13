/* eslint-disable no-bitwise */
const debug = require('debug')('Uttori.Utilities.DataBufferList');

/**
 * A linked list of DataBuffers.
 *
 * @property {DataBuffer} first - The first DataBuffer in the list
 * @property {DataBuffer} last - The last DataBuffer in the list
 * @property {number} totalBuffers - The number of buffers in the list
 * @property {number} availableBytes - The number of bytes avaliable to read
 * @property {number} availableBuffers - The number of buffers avaliable to read
 * @example <caption>new DataBufferList()</caption>
 * const buffer = new DataBuffer(data);
 * const list = new DataBufferList();
 * list.append(buffer);
 * @class
 */
class DataBufferList {
/**
 * Creates an instance of DataBufferList.
 */
  constructor() {
    debug('constructor');
    this.first = null;
    this.last = null;
    this.totalBuffers = 0;
    this.availableBytes = 0;
    this.availableBuffers = 0;
  }

  /**
   * Creates a copy of the DataBufferList.
   *
   * @returns {DataBufferList} - The copied DataBufferList
   */
  copy() {
    debug('copy');
    const result = new DataBufferList();

    result.first = this.first;
    result.last = this.last;
    result.totalBuffers = this.totalBuffers;
    result.availableBytes = this.availableBytes;
    result.availableBuffers = this.availableBuffers;

    return result;
  }

  /**
   * Creates a copy of the DataBufferList.
   *
   * @param {DataBuffer} buffer - The DataBuffer to add to the list
   * @returns {number} - The new number of buffers in the DataBufferList
   */
  append(buffer) {
    debug('append');
    buffer.prev = this.last;
    if (this.last) {
      this.last.next = buffer;
    }
    this.last = buffer;
    if (this.first == null) {
      this.first = buffer;
    }

    this.availableBytes += buffer.length;
    this.availableBuffers++;
    return this.totalBuffers++;
  }

  /**
   * Advance the buffer list to the next buffer.
   *
   * @returns {boolean} - Returns false if there is no more buffers, returns true when the next buffer is set
   */
  advance() {
    debug('advance');
    if (this.first) {
      this.availableBytes -= this.first.length;
      this.availableBuffers--;
      this.first = this.first.next;
      return (this.first != null);
    }

    return false;
  }

  /**
   * Rewind the buffer list to the previous buffer.
   *
   * @returns {boolean} - Returns false if there is no previous buffer, returns true when the previous buffer is set
   */
  rewind() {
    debug('rewind');
    if (this.first && !this.first.prev) {
      return false;
    }

    this.first = this.first ? this.first.prev : this.last;
    /* istanbul ignore else */
    if (this.first) {
      this.availableBytes += this.first.length;
      this.availableBuffers++;
    }

    return (this.first != null);
  }

  /**
   * Reset the list to the beginning.
   */
  reset() {
    debug('reset');
    while (this.rewind()) {
      // eslint-disable-next-line no-continue
      continue;
    }
  }
}

module.exports = DataBufferList;
