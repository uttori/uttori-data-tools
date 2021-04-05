/** @type {Function} */
let debug = () => {}; /* istanbul ignore next */ if (process.env.UTTORI_DATA_DEBUG) { try { debug = require('debug')('DataBitstream'); } catch {} }
const DataStream = require('./data-stream');
const DataBuffer = require('./data-buffer');
const DataBufferList = require('./data-buffer-list');

/**
 * Read a DataStream as a stream of bits.
 *
 * @property {DataStream} stream The DataStream to process.
 * @property {number} bitPosition The number of buffers in the list.
 * @example <caption>new DataBitstream(stream)</caption>
 * const stream = DataStream.fromBuffer(new DataBuffer(new Uint8Array([0xFC, 0x08])));
 * const bitstream = new DataBitstream(stream);
 * bitstream.readLSB(0);
 * ➜ 0
 * bitstream.readLSB(4);
 * ➜ 12
 * @class
 */
class DataBitstream {
/**
 * Creates an instance of DataBitstream.
 *
 * @param {DataStream} stream The DataStream to process.
 */
  constructor(stream) {
    debug('constructor');
    this.stream = stream;
    this.bitPosition = 0;
  }

  /**
   * Creates a new DataBitstream from file data.
   *
   * @param {Array|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|number|string|Uint8Array|Uint32Array} data The data of the image to process.
   * @returns {DataBitstream} The new DataBitstream instance for the provided file data.
   * @static
   */
  static fromData(data) {
    const buffer = new DataBuffer(data);
    const list = new DataBufferList();
    list.append(buffer);
    const stream = new DataStream(list, { size: buffer.length });
    return new DataBitstream(stream);
  }

  /**
   * Creates a new DataBitstream from an array of bytes.
   *
   * @param {number[]} bytes The data to read as a bitstream.
   * @returns {DataBitstream} The new DataBitstream instance for the provided bytes.
   * @static
   */
  static fromBytes(bytes) {
    const stream = DataStream.fromBuffer(new DataBuffer(new Uint8Array(bytes)));
    return new DataBitstream(stream);
  }

  /**
   * Creates a copy of the DataBitstream.
   *
   * @returns {DataBitstream} The copied DataBufferList.
   */
  copy() {
    debug('copy');
    const result = new DataBitstream(this.stream.copy());
    result.bitPosition = this.bitPosition;
    return result;
  }

  /**
   * Returns the current stream offset in bits.
   *
   * @returns {number} The number of bits read thus far.
   */
  offset() {
    debug('offset');
    return (8 * this.stream.offset) + this.bitPosition;
  }

  /**
   * Returns if the specified number of bits is avaliable in the stream.
   *
   * @param {number} bits The number of bits to check for avaliablity.
   * @returns {boolean} If the requested number of bits are avaliable in the stream.
   */
  available(bits) {
    debug('available:', bits);
    return this.stream.available(((bits + 8) - this.bitPosition) / 8);
  }

  /**
   * Advance the bit position by the specified number of bits in the stream.
   *
   * @param {number} bits The number of bits to advance.
   */
  advance(bits) {
    debug('advance:', bits);
    const position = this.bitPosition + bits;
    this.stream.advance(position >> 3);
    this.bitPosition = position & 7;
  }

  /**
   * Rewind the bit position by the specified number of bits in the stream.
   *
   * @param {number} bits The number of bits to go back.
   */
  rewind(bits) {
    debug('rewind:', bits);
    const pos = this.bitPosition - bits;
    this.stream.rewind(Math.abs(pos >> 3));
    this.bitPosition = pos & 7;
  }

  /**
   * Go to the specified offset in the stream.
   *
   * @param {number} offset The offset to go to.
   */
  seek(offset) {
    debug('seek:', offset);
    const current_offset = this.offset();
    if (offset > current_offset) {
      this.advance(offset - current_offset);
    } else if (offset < current_offset) {
      this.rewind(current_offset - offset);
    }
  }

  /**
   * Reset the bit position back to 0 and advance the stream.
   */
  align() {
    debug('align');
    if (this.bitPosition !== 0) {
      this.bitPosition = 0;
      this.stream.advance(1);
    }
  }

  /**
   * Read the specified number of bits.
   *
   * @param {number} bits The number of bits to be read.
   * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
   * @param {boolean} [advance=true] If true, advance the bit position.
   * @returns {number} The value read in from the stream.
   */
  read(bits, signed = false, advance = true) {
    debug('read:', bits, signed, advance);
    if (bits === 0) {
      return 0;
    }

    let output;
    const mBits = bits + this.bitPosition;
    debug('read mBits:', mBits);
    if (mBits <= 8) {
      output = ((this.stream.peekUInt8() << this.bitPosition) & 0xFF) >>> (8 - bits);
    } else if (mBits <= 16) {
      output = ((this.stream.peekUInt16() << this.bitPosition) & 0xFFFF) >>> (16 - bits);
    } else if (mBits <= 24) {
      output = ((this.stream.peekUInt24() << this.bitPosition) & 0xFFFFFF) >>> (24 - bits);
    } else if (mBits <= 32) {
      output = (this.stream.peekUInt32() << this.bitPosition) >>> (32 - bits);
    } else if (mBits <= 40) {
      const a0 = this.stream.peekUInt8(0) * 0x0100000000; // same as a << 32
      const a1 = (this.stream.peekUInt8(1) << 24) >>> 0;
      const a2 = this.stream.peekUInt8(2) << 16;
      const a3 = this.stream.peekUInt8(3) << 8;
      const a4 = this.stream.peekUInt8(4);

      output = a0 + a1 + a2 + a3 + a4;
      output %= 2 ** (40 - this.bitPosition); // (output << bitPosition) & 0xffffffffff
      output = Math.floor(output / 2 ** (40 - this.bitPosition - bits)); // a >>> (40 - bits)
    } else {
      throw new Error(`Too Large: ${mBits} bits`);
    }

    if (signed) {
      /* istanbul ignore else */
      if (mBits < 32) {
        if (output >>> (bits - 1)) {
          output = (((1 << bits) >>> 0) - output) * -1;
        }
      } else if (Math.trunc(output / 2 ** (bits - 1))) {
        // NOTE: The above check is equivalent to `output / 2 ** (bits - 1) | 0`
        output = (2 ** bits - output) * -1;
      }
    }

    if (advance) {
      this.advance(bits);
    }
    return output;
  }

  /**
   * Read the specified number of bits without advancing the bit position.
   *
   * @param {number} bits The number of bits to be read.
   * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
   * @returns {number} The value read in from the stream.
   */
  peek(bits, signed = false) {
    debug('peek:', bits, signed);
    return this.read(bits, signed, false);
  }

  /**
   * Read the specified number of bits.
   * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
   * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
   * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
   *
   * @param {number} bits The number of bits to be read.
   * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
   * @param {boolean} [advance=true] If true, advance the bit position.
   * @returns {number} The value read in from the stream.
   * @throws {Error} Too Large, too many bits.
   */
  readLSB(bits, signed = false, advance = true) {
    debug('readLSB:', bits, signed, advance);
    if (bits === 0) {
      return 0;
    }
    if (bits > 40) {
      throw new Error(`Too Large: ${bits} bits`);
    }

    const mBits = bits + this.bitPosition;
    let output = (this.stream.peekUInt8(0)) >>> this.bitPosition;
    if (mBits > 8) {
      output |= (this.stream.peekUInt8(1)) << (8 - this.bitPosition);
    }
    if (mBits > 16) {
      output |= (this.stream.peekUInt8(2)) << (16 - this.bitPosition);
    }
    if (mBits > 24) {
      output += ((this.stream.peekUInt8(3)) << (24 - this.bitPosition)) >>> 0;
    }
    if (mBits > 32) {
      output += (this.stream.peekUInt8(4)) * 2 ** (32 - this.bitPosition);
    }

    if (mBits >= 32) {
      output %= 2 ** bits;
    } else {
      output &= (1 << bits) - 1;
    }

    if (signed) {
      /* istanbul ignore else */
      if (mBits < 32) {
        if (output >>> (bits - 1)) {
          output = (((1 << bits) >>> 0) - output) * -1;
        }
      } else if (Math.trunc(output / 2 ** (bits - 1))) {
        output = (2 ** bits - output) * -1;
      }
    }

    if (advance) {
      this.advance(bits);
    }
    return output;
  }

  /**
   * Read the specified number of bits without advancing the bit position.
   * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
   * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
   * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
   *
   * @param {number} bits The number of bits to be read.
   * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
   * @returns {number} The value read in from the stream.
   * @throws {Error} Too Large, too many bits.
   */
  peekLSB(bits, signed = false) {
    debug('peekLSB:', bits, signed);
    return this.readLSB(bits, signed, false);
  }
}

module.exports = DataBitstream;
