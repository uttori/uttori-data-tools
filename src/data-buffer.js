/** @type {Function} */
let debug = () => {}; /* istanbul ignore next */ if (process.env.UTTORI_DATA_DEBUG) { try { debug = require('debug')('DataBuffer'); } catch {} }

const UnderflowError = require('./underflow-error');

// TODO: Extract common helpers to external file between Steam and Buffer: float48. float80, decodeString

/**
 * Helper class for manipulating binary data.
 *
 * @property {Buffer|Uint8Array} data The data to process.
 * @property {number} length The size of the data in bytes.
 * @property {DataBuffer} next The next DataBuffer when part of a DataBufferList.
 * @property {DataBuffer} prev The previous DataBuffer when part of a DataBufferList.
 * @example <caption>new DataBuffer(stream)</caption>
 * const buffer = new DataBuffer(new Uint8Array([0xFC, 0x08]));
 * buffer.readUint8();
 * ➜ 0xFC
 * buffer.readUint8();
 * ➜ 0x08
 * @class
 */
class DataBuffer {
/**
 * Creates an instance of DataBuffer.
 *
 * @param {Array|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|number|string|Uint8Array|Uint32Array} input The data to process.
 * @throws {TypeError} Missing input data.
 * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
 */
  constructor(input) {
    if (!input) {
      const error = 'Missing input data.';
      debug(error);
      throw new TypeError(error);
    }
    /** @type {Array|Buffer|Uint8Array} The number of bytes avaliable to read. */
    this.data = null;
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
      debug('constructor: from Buffer');
      this.data = Buffer.from(input);
    } else if (typeof input === 'string') {
      debug('constructor: from string');
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
    } else if (input instanceof DataBuffer) {
      debug('constructor: from DataBuffer, a shallow copy');
      this.data = input.data;
    } else if (input.buffer && input.buffer instanceof ArrayBuffer) {
      debug('constructor: from typed arrays other than Uint8Array');
      this.data = new Uint8Array(input.buffer, input.byteOffset, input.length * input.BYTES_PER_ELEMENT);
    } else {
      const error = `Unknown type of input for DataBuffer: ${typeof input}`;
      debug(error);
      throw new TypeError(error);
    }

    /** @type {number} The number of bytes avaliable to read. */
    this.length = this.data.length;

    // Used when the buffer is part of a bufferlist
    /** @type {DataBuffer|null} The next DataBuffer in the list. */
    this.next = null;
    /** @type {DataBuffer|null} The previous DataBuffer in the list. */
    this.prev = null;

    /** @type {boolean} Native Endianness of the machine, true is Little Endian, false is Big Endian */
    this.nativeEndian = new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412;

    /** @type {number} Reading / Writing offset */
    this.offset = 0;
  }

  /**
   * Creates an instance of DataBuffer with given size.
   *
   * @param {number} size The size of the requested DataBuffer.
   * @returns {DataBuffer} The new DataBuffer.
   */
  static allocate(size) {
    debug('DataBuffer.allocate:', size);
    return new DataBuffer(size);
  }

  /**
   * Compares another DataBuffer against the current data buffer at a specified offset.
   *
   * @param {DataBuffer} input The size of the requested DataBuffer.
   * @param {number} [offset=0] The size of the requested DataBuffer.
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
    const { data } = buffer;
    for (let i = 0; i < length; i++) {
      if (local.data[i] !== data[i]) {
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
   * @returns {DataBuffer} A new copy of the current DataBuffer.
   */
  copy() {
    debug('copy');
    return new DataBuffer(new Uint8Array(this.data.slice(0)));
  }

  /**
   * Creates a copy of the current DataBuffer from a specified offset and a specified length.
   *
   * @param {number} position The starting offset to begin the copy of the new DataBuffer.
   * @param {number} [length=this.length] The size of the new DataBuffer.
   * @returns {DataBuffer} The new DataBuffer
   */
  slice(position, length = this.length) {
    debug('slice:', position, length);
    if ((position === 0) && (length >= this.length)) {
      return new DataBuffer(this.data);
    }
    // `subarray` returns a new typed array copy on the same ArrayBuffer,
    // `slice`  returns a new typed array (with a new underlying buffer).
    return new DataBuffer(this.data.slice(position, position + length));
  }

  /**
   * Returns the remaining bytes to be read in the DataBuffer.
   *
   * @returns {number} The remaining bytes to bre read in the DataBuffer.
   */
  remainingBytes() {
    return this.length - this.offset;
  }

  /**
   * Checks if a given number of bytes are avaliable in the DataBuffer.
   *
   * @param {number} bytes The number of bytes to check for.
   * @returns {boolean} True if there are the requested amount, or more, of bytes left in the DataBuffer.
   */
  available(bytes) {
    return bytes <= this.remainingBytes();
  }

  /**
   * Checks if a given number of bytes are avaliable after a given offset in the stream.
   *
   * @param {number} bytes The number of bytes to check for.
   * @param {number} offset The offset to start from.
   * @returns {boolean} - True if there are the requested amount, or more, of bytes left in the stream.
   */
  availableAt(bytes, offset) {
    return bytes <= this.length - offset;
  }

  /**
   * Advance the offset by a given number of bytes.
   *
   * @param {number} bytes The number of bytes to advance.
   * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
   */
  advance(bytes) {
    debug('advance:', bytes);
    if (!this.available(bytes)) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} <= ${this.remainingBytes()}`);
    }
    this.offset += bytes;
  }

  /**
   * Rewind the offset by a given number of bytes.
   *
   * @param {number} bytes The number of bytes to go back.
   * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
   */
  rewind(bytes) {
    if (bytes > this.offset) {
      throw new UnderflowError(`Insufficient Bytes: ${bytes} > ${this.offset}`);
    }
    this.offset -= bytes;
  }

  /**
   * Go to a specified offset in the stream.
   *
   * @param {number} position The offset to go to.
   */
  seek(position) {
    if (position > this.offset) {
      this.advance(position - this.offset);
    }
    if (position < this.offset) {
      this.rewind(this.offset - position);
    }
  }

  /**
   * Read from the current offset and return the value.
   *
   * @returns {*} The UInt8 value at the current offset.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  readUInt8() {
    if (!this.available(1)) {
      throw new UnderflowError('Insufficient Bytes: 1');
    }
    const output = this.data[this.offset];
    this.offset += 1;
    return output;
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @returns {*} The UInt8 value at the current offset.
   * @throws {UnderflowError} Insufficient Bytes in the stream.
   */
  peekUInt8(offset = 0) {
    if (!this.availableAt(1, offset)) {
      throw new UnderflowError(`Insufficient Bytes: ${offset} + 1`);
    }
    return this.data[offset];
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {number} bytes The number of bytes to read.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {Uint8Array} - The UInt8 value at the current offset.
   */
  read(bytes, littleEndian = false) {
    // debug('read:', bytes, this.offset, littleEndian);
    const uint8 = new Uint8Array(bytes);
    if (littleEndian) {
      for (let i = bytes - 1; i >= 0; i--) {
        uint8[i] = this.readUInt8();
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        uint8[i] = this.readUInt8();
      }
    }
    // debug('read =', uint8.toString('hex'));
    return uint8;
  }

  /**
   * Read from the provided offset and return the value.
   *
   * @param {number} bytes The number of bytes to read.
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {Uint8Array} The UInt8 value at the current offset.
   */
  peek(bytes, offset = 0, littleEndian = false) {
    // debug('peek:', bytes, offset, littleEndian);
    const uint8 = new Uint8Array(bytes);
    if (littleEndian) {
      for (let i = 0; i < bytes; i++) {
        uint8[bytes - i - 1] = this.peekUInt8(offset + i);
      }
    } else {
      for (let i = 0; i < bytes; i++) {
        uint8[i] = this.peekUInt8(offset + i);
      }
    }
    debug('peek =', uint8.toString('hex'));
    return uint8;
  }

  /**
   * Read the bits from the bytes from the provided offset and return the value.
   *
   * @param {number} position The bit position to read, 0 to 7.
   * @param {number} [length=1] The number of bits to read, 1 to 8.
   * @param {number} [offset=0] The offset to read from.
   * @returns {number} The value at the provided bit position of a provided length at the provided offset.
   * @throws {Error} peekBit position is invalid: ${position}, must be an Integer between 0 and 7
   * @throws {Error} `peekBit length is invalid: ${length}, must be an Integer between 1 and 8
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
   * @returns {*} The Int8 value at the current offset.
   */
  readInt8() {
    const uint8 = this.read(1);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt8(0);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @returns {*} The Int8 value at the current offset.
   */
  peekInt8(offset = 0) {
    const uint8 = this.peek(1, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt8(0);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The UInt16 value at the current offset.
   */
  readUInt16(littleEndian) {
    const uint8 = this.read(2);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint16(0, littleEndian);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Int8 value at the current offset.
   */
  peekUInt16(offset = 0, littleEndian = false) {
    const uint8 = this.peek(2, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint16(0, littleEndian);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Int16 value at the current offset.
   */
  readInt16(littleEndian = false) {
    const uint8 = this.read(2);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt16(0, littleEndian);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Int16 value at the current offset.
   */
  peekInt16(offset = 0, littleEndian = false) {
    const uint8 = this.peek(2, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt16(0, littleEndian);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The UInt24 value at the current offset.
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
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The UInt24 value at the current offset.
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
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Int24 value at the current offset.
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
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Int24 value at the current offset.
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
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The UInt32 value at the current offset.
   */
  readUInt32(littleEndian = false) {
    const uint8 = this.read(4);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint32(0, littleEndian);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The UInt32 value at the current offset.
   */
  peekUInt32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getUint32(0, littleEndian);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Int32 value at the current offset.
   */
  readInt32(littleEndian = false) {
    const uint8 = this.read(4);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt32(0, littleEndian);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Int32 value at the current offset.
   */
  peekInt32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getInt32(0, littleEndian);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Float32 value at the current offset.
   */
  readFloat32(littleEndian = false) {
    const uint8 = this.read(4);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat32(0, littleEndian);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Float32 value at the current offset.
   */
  peekFloat32(offset = 0, littleEndian = false) {
    const uint8 = this.peek(4, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat32(0, littleEndian);
  }

  /**
   * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the current offset.
   */
  readFloat48(littleEndian = false) {
    const uint8 = this.read(6, littleEndian || this.nativeEndian);
    return this.float48(uint8);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
   * May be faulty with large numbers due to float percision.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {number} The Float48 value at the specified offset.
   */
  peekFloat48(offset, littleEndian = false) {
    const uint8 = this.peek(6, offset, littleEndian || this.nativeEndian);
    return this.float48(uint8);
  }

  /**
   * Read from the current offset and return the value.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Float64 value at the current offset.
   */
  readFloat64(littleEndian = false) {
    const uint8 = this.read(8);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat64(0, littleEndian);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Float64 value at the current offset.
   */
  peekFloat64(offset = 0, littleEndian = false) {
    const uint8 = this.peek(8, offset);
    const view = new DataView(uint8.buffer, 0);
    return view.getFloat64(0, littleEndian);
  }

  /**
   * Read from the current offset and return the IEEE 80 bit extended float value.
   *
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Float80 value at the current offset.
   */
  readFloat80(littleEndian = this.nativeEndian) {
    const uint8 = this.read(10, littleEndian);
    return this.float80(uint8);
  }

  /**
   * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
   *
   * @param {number} [offset=0] The offset to read from.
   * @param {boolean} [littleEndian=false] Read in Little Endian format.
   * @returns {*} The Float80 value at the current offset.
   */
  peekFloat80(offset = 0, littleEndian = this.nativeEndian) {
    const uint8 = this.peek(10, offset, littleEndian);
    return this.float80(uint8);
  }

  /**
   * Read from the current offset and return the value as a DataBuffer.
   *
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
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
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
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
   * Read from the current offset for a given length and return the value as a string.
   *
   * @param {number} length The number of bytes to read.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @returns {string} The read value as a string.
   */
  readString(length, encoding = 'ascii') {
    return this.decodeString(this.offset, length, encoding, true);
  }

  /**
   * Read from the specified offset for a given length and return the value as a string.
   *
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read.
   * @param {string} [encoding=ascii] The encoding of the string.
   * @returns {string} The read value as a string.
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
   * @param {Uint8Array} uint8 The data to process to a float48 value.
   * @returns {number} The read value as a number.
   * @see {@link http://www.shikadi.net/moddingwiki/Turbo_Pascal_Real|Turbo Pascal Real}
   */
  float48(uint8) {
    debug('float48: uint8', uint8);
    let mantissa = 0;

    // Bias is 129, which is 0x81
    let exponent = uint8[0];
    debug('float48: exponent', exponent);
    if (exponent === 0) {
      return 0;
    }
    exponent = uint8[0] - 0x81;
    debug('float48: exponent', exponent);

    for (let i = 1; i <= 4; i++) {
      mantissa += uint8[i];
      mantissa /= 256;
    }
    mantissa += (uint8[5] & 0x7F);
    mantissa /= 128;
    mantissa += 1;

    debug('float48: mantissa', mantissa);
    // Sign bit check
    if (uint8[5] & 0x80) {
      mantissa = -mantissa;
    }
    debug('float48: mantissa', mantissa);

    const output = mantissa * (2 ** exponent);
    debug('float48: output', output);
    return Number.parseFloat(output.toFixed(4));
  }

  /**
   * Convert the current buffer into an IEEE 80 bit extended float value.
   *
   * @param {Uint8Array} uint8 The raw data to convert to a float80.
   * @returns {number} The read value as a number.
   * @see {@link https://en.wikipedia.org/wiki/Extended_precision|Extended_Precision}
   */
  float80(uint8) {
    const uint32 = new Uint32Array(uint8.buffer, uint8.byteOffset, uint8.byteLength / 4);
    const [high, low] = [...uint32];
    const a0 = uint8[9];
    const a1 = uint8[8];

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
   * @param {number} offset The offset to read from.
   * @param {number} length The number of bytes to read, if not defined it is the remaining bytes in the buffer.
   * @param {string} encoding The encoding of the string.
   * @param {boolean} advance Flag to optionally advance the offsets.
   * @returns {string} The read value as a string.
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

  /**
   * Resets the instance offsets to 0.
   */
  reset() {
    this.offset = 0;
  }
}

module.exports = DataBuffer;
