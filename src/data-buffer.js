/* eslint-disable class-methods-use-this */
/* eslint-disable no-bitwise */
const debug = require('debug')('Uttori.Utilities.DataBuffer');

/**
 * Helper class for manipulating binary data.
 *
 * @property {Buffer|Uint8Array} data - The data to process
 * @property {number} length - The size of the data in bytes
 * @property {DataBuffer} next - The next DataBuffer when part of a DataBufferList
 * @property {DataBuffer} prev - The previous DataBuffer when part of a DataBufferList
 * @example <caption>new DataBitstream(stream)</caption>
 * const stream = DataStream.fromBuffer(new DataBuffer(new Uint8Array([0xFC, 0x08])));
 * const bitstream = new DataBitstream(stream);
 * bitstream.readLSB(0);
 * ➜ 0
 * bitstream.readLSB(4);
 * ➜ 12
 * @class
 */
class DataBuffer {
/**
 * Creates an instance of DataBitstream.
 *
 * @param {Array|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|number|Uint8Array|Uint32Array} input - The DataStream to process
 */
  constructor(input) {
    if (!input) {
      const error = 'Missing input data.';
      debug(error);
      throw new TypeError(error);
    }
    if (Buffer.isBuffer(input) || typeof input === 'string') {
      debug('constructor: from Buffer');
      this.data = Buffer.from(input);
    } else if (input instanceof Uint8Array) {
      debug('constructor: from Uint8Array');
      this.data = input;
    } else if (input instanceof ArrayBuffer) {
      debug('constructor: from ArrayBuffer');
      this.data = new Uint8Array(input);
    } else if (Array.isArray(input)) {
      debug('constructor: Normal Array');
      this.data = new Uint8Array(input);
    } else if (typeof input === 'number') {
      debug('constructor: Number (i.e. length)');
      this.data = new Uint8Array(input);
    } else if (input.buffer instanceof ArrayBuffer) {
      debug('constructor: from typed arrays other than Uint8Array');
      this.data = new Uint8Array(input.buffer, input.byteOffset, input.length * input.BYTES_PER_ELEMENT);
    } else if (input instanceof DataBuffer) {
      debug('constructor: from DataBuffer, a shallow copy');
      this.data = input.data;
    } else {
      const error = `Unknown type of input for DataBuffer: ${typeof input}`;
      debug(error);
      throw new TypeError(error);
    }

    this.length = this.data.length;

    // used when the buffer is part of a bufferlist
    this.next = null;
    this.prev = null;
  }

  /**
   * Creates an instance of DataBuffer with given size.
   *
   * @param {number} size - The size of the requested DataBuffer
   * @returns {DataBuffer} The new DataBuffer
   */
  static allocate(size) {
    debug('DataBuffer.allocate:', size);
    return new DataBuffer(size);
  }

  /**
   * Compares another DataBuffer against the current data buffer at a specified offset.
   *
   * @param {DataBuffer} input - The size of the requested DataBuffer
   * @param {number} [offset=0] - The size of the requested DataBuffer
   * @returns {boolean} Returns true when both DataBuffers are equal, false if there is any difference.
   */
  compare(input, offset = 0) {
    // debug('compare:', input.length, offset);
    const buffer = new DataBuffer(input);
    const { length } = buffer;
    /* istanbul ignore next */
    if (!length) {
      debug('compare: no input provided');
      return false;
    }
    const local = this.slice(offset, length);
    for (let i = 0; i < length; i++) {
      if (local.data[i] !== buffer.data[i]) {
        debug('compare: first failed match at', i);
        return false;
      }
    }
    debug('compare: data is the same');
    return true;
  }

  /**
   * Creates a copy of the current DataBuffer.
   *
   * @returns {DataBuffer} A new copy of the current DataBuffer
   */
  copy() {
    debug('copy');
    return new DataBuffer(new Uint8Array(this.data));
  }

  /**
   * Creates a copy of the current DataBuffer from a specified offset and a specified length.
   *
   * @param {number} position - The starting offset to begin the copy of the new DataBuffer
   * @param {number} [length] - The size of the new DataBuffer
   * @returns {DataBuffer} The new DataBuffer
   */
  slice(position, length = this.length) {
    debug('slice:', position, length);
    if ((position === 0) && (length >= this.length)) {
      return new DataBuffer(this.data);
    }
    return new DataBuffer(this.data.subarray(position, position + length));
  }
}

module.exports = DataBuffer;
