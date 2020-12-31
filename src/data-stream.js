/* eslint-disable unicorn/explicit-length-check */
/* eslint-disable no-bitwise */
let debug = () => {};
try { debug = require('debug')('Uttori.Utilities.DataStream'); } catch {}
const DataBuffer = require('./data-buffer');
const DataBufferList = require('./data-buffer-list');

/**
 * Error thrown when insufficient bytes are avaliable to process.
 *
 * @example <caption>new UnderflowError(message)</caption>
 * throw new UnderflowError('Insufficient Bytes: 1');
 * @augments Error
 * @class
 */
class UnderflowError extends Error {
  /**
   * Creates a new UnderflowError.
   *
   * @param {string} message - Message to show when the error is thrown.
   * @class
   */
  constructor(message) {
    super(message);
    this.name = 'UnderflowError';
    this.stack = (new Error(message)).stack;
    /* istanbul ignore else */
    // https://nodejs.org/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Helpter class to ease working with binary files.
 *
 * @property {number} size - ArrayBuffer byteLength
 * @property {ArrayBuffer} buf - Instance of ArrayBuffer used for the various typed arrays
 * @property {Uint8Array} uint8 - octet / uint8_t
 * @property {Int8Array} int8 - byte / int8_t
 * @property {Uint16Array} uint16 - unsigned short / uint16_t
 * @property {Int16Array} int16 - short / int16_t
 * @property {Uint32Array} uint32 - unsigned long / uint32_t
 * @property {Int32Array} int32 - long / int32_t
 * @property {Float32Array} float32 - unrestricted float / float
 * @property {Float64Array} float64 - unrestricted double / double
 * @property {BigInt64Array} int64 - bigint / int64_t (signed long long)
 * @property {BigUint64Array} uint64 - bigint / uint64_t (unsigned long long)
 * @property {boolean} nativeEndian - Native Endianness of the machine, true is Little Endian, false is Big Endian
 * @property {DataBufferList} list - The DataBufferList to process
 * @property {number} localOffset - Reading offset for the current chunk
 * @property {number} offset - Reading offset for all chunks
 * @example <caption>new DataStream(list, options)</caption>
 * @class
 */
class DataStream {
  /**
   * Creates a new DataStream.
   *
   * @param {DataBufferList} list - The DataBufferList to process
   * @param {object} options - Options for this instance
   * @param {number} [options.size=16] - ArrayBuffer byteLength for the underlying binary parsing
   * @class
   */
  constructor(list, options = {}) {
    options.size = options.size || 16;
    if (options && options.size % 8 !== 0) {
      options.size += (8 - (options.size % 8));
    }
    this.size = options.size;
    this.buf = new ArrayBuffer(this.size);
    this.uint8 = new Uint8Array(this.buf);
    this.int8 = new Int8Array(this.buf);
    this.uint16 = new Uint16Array(this.buf);
    this.int16 = new Int16Array(this.buf);
    this.uint32 = new Uint32Array(this.buf);
    this.int32 = new Int32Array(this.buf);
    this.float32 = new Float32Array(this.buf);
    this.float64 = new Float64Array(this.buf);
    this.int64 = new BigInt64Array(this.buf);
    this.uint64 = new BigUint64Array(this.buf);

    this.nativeEndian = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412;

    this.list = list;
    this.localOffset = 0;
    this.offset = 0;
  }

  /**
   * Creates a new DataStream from file data.
   *
   * @param {string | Buffer} data - The data of the image to process.
   * @returns {DataStream} the new DataStream instance for the provided file data
   * @static
   */
  static fromData(data) {
    const buffer = new DataBuffer(data);
    const list = new DataBufferList();
    list.append(buffer);
    return new DataStream(list, { size: buffer.length });
  }

  /**
   * Creates a new DataStream from a DataBuffer.
   *
   * @param {DataBuffer} buffer - The DataBuffer of the image to process.
   * @returns {DataStream} the new DataStream instance for the provided DataBuffer
   * @static
   */
  static fromBuffer(buffer) {
    const list = new DataBufferList();
    list.append(buffer);
    return new DataStream(list, { size: buffer.length });
  }

  /**
   * Compares input data against the current data.
   *
   * @param {DataStream} input - The DataStream to compare against
   * @param {number} [offset=0] - The offset to begin comparing at
   * @returns {boolean} - True if the data is the same as the input, starting at the offset, false is there is any difference
   */
  compare(input, offset = 0) {
    if (!input || !input.list || !input.list.availableBytes) {
      debug('compare: no input provided');
      return false;
    }
    let { availableBytes } = input.list;
    debug('compare', availableBytes, offset);
    if (offset) {
      availableBytes -= offset;
      this.seek(offset);
      input.seek(offset);
    }
    let local;
    let external;
    for (let i = 0; i < availableBytes; i++) {
      local = this.readUInt8();
      external = input.readUInt8();
      if (local !== external) {
        debug('compare: first failed match at', i);
        return false;
      }
      debug('compare: match at', i);
    }
    return true;
  }

  /**
   * Compares input data against the upcoming data, byte by byte.
   *
   * @param {number[] | Buffer} input - The data to check for in upcoming bytes.
   * @returns {boolean} - True if the data is the upcoming data, false if it is not or there is not enough buffer remaining
   */
  next(input) {
    debug('next:', input);
    if (!input || !input.length || input.length === 0) {
      debug('next: no input provided');
      return false;
    }
    if (!this.available(input.length)) {
      debug(`Insufficient Bytes: ${input.length} <= ${this.remainingBytes()}`);
      return false;
    }

    debug('next: this.offset =', this.offset);
    for (let i = 0; i < input.length; i++) {
      const data = this.peekUInt8(this.offset + i);
      if (input[i] !== data) {
        debug('next: first failed match at', i, ', where:', input[i], '!==', data);
        return false;
      }
    }

    return true;
  }

  /**
   * Create a copy of the current DataStream and offset.
   *
   * @returns {DataStream} - A new copy of the DataStream
   */
  copy() {
    const result = new DataStream(this.list.copy(), { size: this.size });
    result.localOffset = this.localOffset;
    result.offset = this.offset;
    return result;
  }

  // TODO Can `availableAt` replace `available`?
  /**
   * Checks if a given number of bytes are avaliable in the stream.
   *
   * @param {number} bytes - The number of bytes to check for
   * @returns {boolean} - True if there are the requested amount, or more, of bytes left in the stream
   */
  available(bytes) {
    return bytes <= this.remainingBytes();
  }

  /**
   * Checks if a given number of bytes are avaliable after a given offset in the stream.
   *
   * @param {number} bytes - The number of bytes to check for
   * @param {number} offset - The offset to start from
   * @returns {boolean} - True if there are the requested amount, or more, of bytes left in the stream
   */
  availableAt(bytes, offset) {
    return bytes <= this.list.availableBytes - offset;
  }

  /**
   * Returns the remaining bytes in the stream.
   *
   * @returns {number} - The remaining bytes in the stream
   */
  remainingBytes() {
    return this.list.availableBytes - this.localOffset;
  }

  /**
   * Advance the stream by a given number of bytes. Useful for skipping unused bytes.
   *
   * @param {number} bytes - The number of bytes to advance
   * @returns {DataStream} - The current DataStream
   * @throws {UnderflowError} Insufficient Bytes in the stream
   */
  advance(bytes) {
    debug('advance:', bytes);
    if (!this.available(bytes)) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} <= ${this.remainingBytes()}`);
    }

    this.localOffset += bytes;
    this.offset += bytes;

    while (this.list.first && (this.localOffset >= this.list.first.length)) {
      this.localOffset -= this.list.first.length;
      this.list.advance();
    }

    return this;
  }

  /**
   * Rewind the stream by a given number of bytes.
   *
   * @param {number} bytes - The number of bytes to go back
   * @returns {DataStream} - The current DataStream
   * @throws {UnderflowError} Insufficient Bytes in the stream
   */
  rewind(bytes) {
    if (bytes > this.offset) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} > ${this.offset}`);
    }

    // if we're at the end of the bufferlist, seek from the end
    if (!this.list.first) {
      this.list.rewind();
      this.localOffset = this.list.first.length;
    }

    this.localOffset -= bytes;
    this.offset -= bytes;

    while (this.list.first.prev && (this.localOffset < 0)) {
      this.list.rewind();
      this.localOffset += this.list.first.length;
    }

    return this;
  }

  /**
   * Go to a specified offset in the stream.
   *
   * @param {number} position - The offset to go to
   * @returns {DataStream} - The current DataStream
   */
  seek(position) {
    if (position > this.offset) {
      return this.advance(position - this.offset);
    }
    if (position < this.offset) {
      return this.rewind(this.offset - position);
    }
    return this;
  }

  /**
   * Read from the current offset and return the value.
   *
   * @returns {*} - The UInt8 value at the current offset
   * @throws {UnderflowError} Insufficient Bytes in the stream
   */
  readUInt8() {
    if (!this.available(1)) {
      throw new UnderflowError('Insufficient Bytes: 1');
    }

    const output = this.list.first.data[this.localOffset];
    this.localOffset += 1;
    this.offset += 1;

    // Advance to the next item in the list if we are at the end.
    if (this.localOffset === this.list.first.length) {
      this.localOffset = 0;
      this.list.advance();
    }

    return output;
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @returns {*} - The UInt8 value at the current offset
   * @throws {UnderflowError} Insufficient Bytes in the stream
   */
  peekUInt8(offset = 0) {
    if (!this.availableAt(1, offset)) {
      throw new UnderflowError(`Insufficient Bytes: ${offset} + 1`);
    }
    let buffer = this.list.first;

    while (buffer) {
      if (buffer.length > offset) {
        return buffer.data[offset];
      }

      offset -= buffer.length;
      buffer = buffer.next;
    }

    return 0;
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {number} bytes - The number of bytes to read
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {Uint8Array} - The UInt8 value at the current offset
   */
  read(bytes, littleEndian = false) {
    // debug('read:', bytes, this.offset, littleEndian);
    if (littleEndian === this.nativeEndian) {
      for (let i = 0; i < bytes; i++) {
        this.uint8[i] = this.readUInt8();
      }
    } else {
      for (let i = bytes - 1; i >= 0; i--) {
        this.uint8[i] = this.readUInt8();
      }
    }
    // eslint-disable-next-line sonarjs/prefer-immediate-return
    const output = this.uint8.slice(0, bytes);
    // debug('read =', output.toString('hex'));
    return output;
  }

  /**
   * Read from the provided offset and return the value.
   *
   * @param {number} bytes - The number of bytes to read
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The UInt8 value at the current offset
   */
  peek(bytes, offset = 0, littleEndian = false) {
    // debug('peek:', bytes, offset, littleEndian);
    if (littleEndian === this.nativeEndian) {
      for (let i = 0; i < bytes; i++) {
        this.uint8[i] = this.peekUInt8(offset + i);
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        this.uint8[bytes - i - 1] = this.peekUInt8(offset + i);
      }
    }
    // eslint-disable-next-line sonarjs/prefer-immediate-return
    const output = this.uint8.slice(0, bytes);
    // debug('peek =', output.toString('hex'));
    return output;
  }

  /**
   * Read the bits from the bytes from the provided offset and return the value.
   *
   * @param {number} position - The bit position to read, 0 to 7
   * @param {number} [length=1] - The number of bits to read, 1 to 8
   * @param {number} [offset=0] - The offset to read from
   * @returns {number} - The value at the provided bit position of a provided length at the provided offset
   */
  peekBit(position, length = 1, offset = 0) {
    // debug('peekBit:', position, length, offset);
    if (Number.isNaN(position) || !Number.isInteger(position) || position < 0 || position > 7) {
      throw new Error(`peekBit position is invalid: ${position}, must be an Integer between 0 and 7`);
    }
    if (Number.isNaN(length) || !Number.isInteger(length) || length < 1 || length > 8) {
      throw new Error(`peekBit length is invalid: ${length}, must be an Integer between 1 and 8`);
    }
    const value = this.peekUInt8(offset);
    return ((value << position) & 0xFF) >>> (8 - length);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @returns {*} - The Int8 value at the current offset
   */
  readInt8() {
    this.read(1);
    return this.int8[0];
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @returns {*} - The Int8 value at the current offset
   */
  peekInt8(offset = 0) {
    this.peek(1, offset);
    return this.int8[0];
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The UInt16 value at the current offset
   */
  readUInt16(littleEndian) {
    this.read(2, littleEndian);
    return this.uint16[0];
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Int8 value at the current offset
   */
  peekUInt16(offset = 0, littleEndian = false) {
    this.peek(2, offset, littleEndian);
    return this.uint16[0];
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Int16 value at the current offset
   */
  readInt16(littleEndian = false) {
    this.read(2, littleEndian);
    return this.int16[0];
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Int16 value at the current offset
   */
  peekInt16(offset = 0, littleEndian = false) {
    this.peek(2, offset, littleEndian);
    return this.int16[0];
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The UInt24 value at the current offset
   */
  readUInt24(littleEndian = false) {
    if (littleEndian) {
      return this.readUInt16(true) + (this.readUInt8() << 16);
    }
    return (this.readUInt16() << 8) + this.readUInt8();
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The UInt24 value at the current offset
   */
  peekUInt24(offset = 0, littleEndian = false) {
    if (littleEndian) {
      return this.peekUInt16(offset, true) + (this.peekUInt8(offset + 2) << 16);
    }
    return (this.peekUInt16(offset) << 8) + this.peekUInt8(offset + 2);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Int24 value at the current offset
   */
  readInt24(littleEndian = false) {
    if (littleEndian) {
      return this.readUInt16(true) + (this.readInt8() << 16);
    }
    return (this.readInt16() << 8) + this.readUInt8();
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Int24 value at the current offset
   */
  peekInt24(offset = 0, littleEndian = false) {
    if (littleEndian) {
      return this.peekUInt16(offset, true) + (this.peekInt8(offset + 2) << 16);
    }
    return (this.peekInt16(offset) << 8) + this.peekUInt8(offset + 2);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The UInt32 value at the current offset
   */
  readUInt32(littleEndian = false) {
    this.read(4, littleEndian);
    return this.uint32[0];
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The UInt32 value at the current offset
   */
  peekUInt32(offset = 0, littleEndian = false) {
    this.peek(4, offset, littleEndian);
    return this.uint32[0];
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Int32 value at the current offset
   */
  readInt32(littleEndian = false) {
    this.read(4, littleEndian);
    return this.int32[0];
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Int32 value at the current offset
   */
  peekInt32(offset = 0, littleEndian = false) {
    this.peek(4, offset, littleEndian);
    return this.int32[0];
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Float32 value at the current offset
   */
  readFloat32(littleEndian = false) {
    this.read(4, littleEndian);
    return this.float32[0];
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Float32 value at the current offset
   */
  peekFloat32(offset = 0, littleEndian = false) {
    this.peek(4, offset, littleEndian);
    return this.float32[0];
  }

  /**
   * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {number} - The Float48 value at the current offset
   */
  readFloat48(littleEndian = false) {
    this.read(6, littleEndian);
    return this.float48();
  }

  /**
   * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {number} - The Float48 value at the specified offset
   */
  peekFloat48(offset, littleEndian = false) {
    this.peek(6, offset, littleEndian);
    return this.float48();
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Float64 value at the current offset
   */
  readFloat64(littleEndian = false) {
    this.read(8, littleEndian);
    return this.float64[0];
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Float64 value at the current offset
   */
  peekFloat64(offset = 0, littleEndian = false) {
    this.peek(8, offset, littleEndian);
    return this.float64[0];
  }

  /**
   * Read from the current offset and return the IEEE 80 bit extended float value.
   *
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Float80 value at the current offset
   */
  readFloat80(littleEndian = false) {
    this.read(10, littleEndian);
    return this.float80();
  }

  /**
   * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
   *
   * @param {number} [offset=0] - The offset to read from
   * @param {boolean} [littleEndian=false] - Read in Little Endian format
   * @returns {*} - The Float80 value at the current offset
   */
  peekFloat80(offset = 0, littleEndian = false) {
    this.peek(10, offset, littleEndian);
    return this.float80();
  }

  /**
   * Read from the current offset and return the value as a DataBuffer.
   *
   * @param {number} length - The number of bytes to read
   * @returns {DataBuffer} - The requested number of bytes as a DataBuffer
   */
  readBuffer(length) {
    const result = DataBuffer.allocate(length);
    const to = result.data;

    for (let i = 0; i < length; i++) {
      to[i] = this.readUInt8();
    }

    return result;
  }

  /**
   * Read from the specified offset and return the value as a DataBuffer.
   *
   * @param {number} offset - The offset to read from
   * @param {number} length - The number of bytes to read
   * @returns {DataBuffer} - The requested number of bytes as a DataBuffer
   */
  peekBuffer(offset, length) {
    const result = DataBuffer.allocate(length);
    const to = result.data;

    for (let i = 0; i < length; i++) {
      to[i] = this.peekUInt8(offset + i);
    }

    return result;
  }

  /**
   * Read from the current offset of the current buffer for a given length and return the value as a DataBuffer.
   *
   * @param {number} length - The number of bytes to read
   * @returns {DataBuffer} - The requested number of bytes as a DataBuffer
   */
  readSingleBuffer(length) {
    debug('readSingleBuffer:', length);
    const result = this.list.first.slice(this.localOffset, length);
    this.advance(result.length);
    return result;
  }

  /**
   * Read from the specified offset of the current buffer for a given length and return the value as a DataBuffer.
   *
   * @param {number} offset - The offset to read from
   * @param {number} length - The number of bytes to read
   * @returns {DataBuffer} - The requested number of bytes as a DataBuffer
   */
  peekSingleBuffer(offset, length) {
    debug('peekSingleBuffer:', offset, length);
    return this.list.first.slice(this.localOffset + offset, length);
  }

  /**
   * Read from the current offset for a given length and return the value as a string.
   *
   * @param {number} length - The number of bytes to read
   * @param {string} [encoding=ascii] - The encoding of the string
   * @returns {string} - The read value as a string
   */
  readString(length, encoding = 'ascii') {
    return this.decodeString(this.offset, length, encoding, true);
  }

  /**
   * Read from the specified offset for a given length and return the value as a string.
   *
   * @param {number} offset - The offset to read from
   * @param {number} length - The number of bytes to read
   * @param {string} [encoding=ascii] - The encoding of the string
   * @returns {string} - The read value as a string
   */
  peekString(offset, length, encoding = 'ascii') {
    return this.decodeString(offset, length, encoding, false);
  }

  /**
   * Convert the current buffer into a Turbo Pascal 48 bit float value.
   * May be faulty with large numbers due to float percision.
   *
   * While most languages use a 32-bit or 64-bit floating point decimal variable, usually called single or double,
   * Turbo Pascal featured an uncommon 48-bit float called a real which served the same function as a float.
   *
   * The Real48 type exists for backward compatibility with Turbo Pascal. It defines a 6-byte floating-point type.
   * The Real48 type has an 8-bit exponent and a 39-bit normalized mantissa. It cannot store denormalized values, infinity, or not-a-number. If the exponent is zero, the number is zero.
   *
   * Structure (Bytes, Big Endian)
   * 5: SMMMMMMM 4: MMMMMMMM 3: MMMMMMMM 2: MMMMMMMM 1: MMMMMMMM 0: EEEEEEEE
   *
   * Structure (Bytes, Little Endian)
   * 0: EEEEEEEE 1: MMMMMMMM 2: MMMMMMMM 3: MMMMMMMM 4: MMMMMMMM 5: SMMMMMMM
   *
   * E[8]: Exponent
   * M[39]: Mantissa
   * S[1]: Sign
   *
   * Value: (-1)^s * 2^(e - 129) * (1.f)
   *
   * @returns {number} - The read value as a number
   * @see {@link http://www.shikadi.net/moddingwiki/Turbo_Pascal_Real|Turbo Pascal Real}
   */
  float48() {
    let mantissa = 0;

    // Bias is 129, which is 0x81
    let exponent = this.uint8[0];
    if (exponent === 0) {
      return 0;
    }
    exponent = this.uint8[0] - 0x81;

    for (let i = 1; i <= 4; i++) {
      mantissa += this.uint8[i];
      mantissa /= 256;
    }
    mantissa += (this.uint8[5] & 0x7F);
    mantissa /= 128;
    mantissa += 1;

    // Sign bit check
    if (this.uint8[5] & 0x80) {
      mantissa = -mantissa;
    }

    const output = mantissa * (2 ** exponent);
    return Number.parseFloat(output.toFixed(4));
  }

  /**
   * Convert the current buffer into an IEEE 80 bit extended float value.
   *
   * @private
   * @returns {number} - The read value as a number
   * @see {@link https://en.wikipedia.org/wiki/Extended_precision|Extended_Precision}
   */
  float80() {
    const [high, low] = [...this.uint32];
    const a0 = this.uint8[9];
    const a1 = this.uint8[8];

    // 1 bit sign, -1 or +1
    const sign = 1 - ((a0 >>> 7) * 2);
    // 15 bit exponent
    // let exponent = (((a0 << 1) & 0xFF) << 7) | a1;
    let exponent = ((a0 & 0x7F) << 8) | a1;

    if ((exponent === 0) && (low === 0) && (high === 0)) {
      return 0;
    }

    // 0x7FFF is a reserved value
    if (exponent === 0x7FFF) {
      if ((low === 0) && (high === 0)) {
        return sign * Number.POSITIVE_INFINITY;
      }

      return Number.NaN;
    }

    // Bias is 16383, which is 0x3FFF
    exponent -= 0x3FFF;
    let out = low * 2 ** (exponent - 31);
    out += high * 2 ** (exponent - 63);

    return sign * out;
  }

  /**
   * Read from the specified offset for a given length and return the value as a string in a specified encoding, and optionally advance the offsets.
   * Supported Encodings: ascii / latin1, utf8 / utf-8, utf16-be, utf16be, utf16le, utf16-le, utf16bom, utf16-bom
   *
   * @private
   * @param {number} offset - The offset to read from
   * @param {number} length - The number of bytes to read, if not defined it is the remaining bytes in the buffer
   * @param {string} encoding - The encoding of the string
   * @param {boolean} advance - Flag to optionally advance the offsets
   * @returns {string} - The read value as a string
   */
  decodeString(offset, length, encoding, advance) {
    encoding = encoding.toLowerCase();
    const nullEnd = length === null ? 0 : -1;

    if (!length) {
      length = this.remainingBytes();
    }

    const end = offset + length;
    let result = '';

    switch (encoding) {
      case 'ascii':
      case 'latin1': {
        while (offset < end) {
          const char = this.peekUInt8(offset++);
          if (char === nullEnd) {
            break;
          }
          result += String.fromCharCode(char);
        }
        break;
      }
      case 'utf8':
      case 'utf-8': {
        while (offset < end) {
          const b1 = this.peekUInt8(offset++);
          if (b1 === nullEnd) {
            break;
          }
          let b2;
          let b3;
          /* istanbul ignore else */
          if ((b1 & 0x80) === 0) {
            result += String.fromCharCode(b1);
          } else if ((b1 & 0xE0) === 0xC0) {
            // one continuation (128 to 2047)
            b2 = this.peekUInt8(offset++) & 0x3F;
            result += String.fromCharCode(((b1 & 0x1F) << 6) | b2);
          } else if ((b1 & 0xF0) === 0xE0) {
            // two continuation (2048 to 55295 and 57344 to 65535)
            b2 = this.peekUInt8(offset++) & 0x3F;
            b3 = this.peekUInt8(offset++) & 0x3F;
            result += String.fromCharCode(((b1 & 0x0F) << 12) | (b2 << 6) | b3);
          } else if ((b1 & 0xF8) === 0xF0) {
            // three continuation (65536 to 1114111)
            b2 = this.peekUInt8(offset++) & 0x3F;
            b3 = this.peekUInt8(offset++) & 0x3F;
            const b4 = this.peekUInt8(offset++) & 0x3F;

            // split into a surrogate pair
            const pt = (((b1 & 0x0F) << 18) | (b2 << 12) | (b3 << 6) | b4) - 0x10000;
            result += String.fromCharCode(0xD800 + (pt >> 10), 0xDC00 + (pt & 0x3FF));
          }
        }
        break;
      }
      case 'utf16-be':
      case 'utf16be':
      case 'utf16le':
      case 'utf16-le':
      case 'utf16bom':
      case 'utf16-bom': {
        let littleEndian;

        // find endianness
        switch (encoding) {
          case 'utf16be':
          case 'utf16-be': {
            littleEndian = false;
            break;
          }
          case 'utf16le':
          case 'utf16-le': {
            littleEndian = true;
            break;
          }
          case 'utf16bom':
          case 'utf16-bom':
          default: {
            const bom = this.peekUInt16(offset);
            if ((length < 2) || (bom === nullEnd)) {
              if (advance) {
                this.advance(offset += 2);
              }
              return result;
            }

            littleEndian = bom === 0xFFFE;
            offset += 2;
            break;
          }
        }

        let w1;
        // eslint-disable-next-line no-cond-assign
        while ((offset < end) && ((w1 = this.peekUInt16(offset, littleEndian)) !== nullEnd)) {
          offset += 2;

          if ((w1 < 0xD800) || (w1 > 0xDFFF)) {
            result += String.fromCharCode(w1);
          } else {
            const w2 = this.peekUInt16(offset, littleEndian);
            if ((w2 < 0xDC00) || (w2 > 0xDFFF)) {
              throw new Error('Invalid utf16 sequence.');
            }

            result += String.fromCharCode(w1, w2);
            offset += 2;
          }
        }

        if (w1 === nullEnd) {
          offset += 2;
        }
        break;
      }
      default: {
        throw new Error(`Unknown encoding: ${encoding}`);
      }
    }

    if (advance) {
      this.advance(length);
    }
    return result;
  }
}

module.exports = DataStream;
