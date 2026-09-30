import DataBuffer from "./data-buffer.js";
import UnderflowError from "./underflow-error.js";
/** No-op logger, replaced by the `debug` package when enabled. */
let debug = (..._args) => { };
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
    try {
        const { default: d } = await import("debug");
        debug = d("DataBitstream");
    }
    catch { }
}
/**
 * Read a DataBuffer as a stream of bits.
 * @property {DataBuffer} stream The DataBuffer to process.
 * @property {number} bitPosition The bit offset within the current byte, from 0 through 7.
 * @example <caption>new DataBitstream(stream)</caption>
 * const stream = new DataBuffer(new Uint8Array([0xFC, 0x08]));
 * const bitstream = new DataBitstream(stream);
 * bitstream.readLSB(0);
 * ➜ 0
 * bitstream.readLSB(4);
 * ➜ 12
 * @class
 */
class DataBitstream {
    /** The DataBuffer being processed. */
    stream;
    /** The bit offset within the current byte, from 0 through 7. */
    bitPosition;
    /**
     * Creates an instance of DataBitstream.
     * @param stream The DataBuffer to process.
     */
    constructor(stream) {
        debug("constructor");
        if (!(stream instanceof DataBuffer)) {
            throw new TypeError("Expected a DataBuffer.");
        }
        this.stream = stream;
        this.bitPosition = 0;
    }
    /**
     * Creates a new DataBitstream from file data.
     * @param data The data of the image to process.
     * @returns The new DataBitstream instance for the provided file data.
     * @static
     */
    static fromData(data) {
        return new DataBitstream(new DataBuffer(data));
    }
    /**
     * Creates a new DataBitstream from an array of bytes.
     * @param bytes The data to read as a bitstream.
     * @returns The new DataBitstream instance for the provided bytes.
     * @static
     */
    static fromBytes(bytes) {
        return new DataBitstream(new DataBuffer(bytes));
    }
    /**
     * Creates a copy of the DataBitstream.
     * @returns The copied DataBitstream, including its byte and bit offsets.
     */
    copy() {
        debug("copy");
        const result = new DataBitstream(this.stream.copy());
        result.stream.offset = this.stream.offset;
        result.bitPosition = this.bitPosition;
        return result;
    }
    /**
     * Returns the current stream offset in bits.
     * @returns The number of bits read thus far.
     */
    offset() {
        debug("offset");
        return 8 * this.stream.offset + this.bitPosition;
    }
    /**
     * Returns if the specified number of bits is avaliable in the stream.
     * @param bits The number of bits to check for avaliablity.
     * @returns If the requested number of bits are avaliable in the stream.
     */
    available(bits) {
        debug("available:", bits);
        return (Number.isSafeInteger(bits) &&
            bits >= 0 &&
            Number.isSafeInteger(this.stream.offset) &&
            this.stream.offset >= 0 &&
            Number.isInteger(this.bitPosition) &&
            this.bitPosition >= 0 &&
            this.bitPosition < 8 &&
            bits <= this.stream.remainingBytes() * 8 - this.bitPosition);
    }
    /**
     * Advance the bit position by the specified number of bits in the stream.
     * @param bits The number of bits to advance.
     */
    advance(bits) {
        debug("advance:", bits);
        this.validateBits(bits);
        if (!this.available(bits)) {
            throw new UnderflowError(`Insufficient Bits: ${bits} <= ${this.stream.remainingBytes() * 8 - this.bitPosition}`);
        }
        const position = this.bitPosition + bits;
        this.stream.offset += Math.floor(position / 8);
        this.bitPosition = position % 8;
    }
    /**
     * Rewind the bit position by the specified number of bits in the stream.
     * @param bits The number of bits to go back.
     */
    rewind(bits) {
        debug("rewind:", bits);
        this.validateBits(bits);
        const current_offset = this.offset();
        if (!this.available(0) || bits > current_offset) {
            throw new UnderflowError(`Insufficient Bits: ${bits} > ${current_offset}`);
        }
        const position = current_offset - bits;
        this.stream.offset = Math.floor(position / 8);
        this.bitPosition = position % 8;
    }
    /**
     * Go to the specified offset in the stream.
     * @param offset The offset to go to.
     */
    seek(offset) {
        debug("seek:", offset);
        this.validateBits(offset);
        const current_offset = this.offset();
        if (offset > current_offset) {
            this.advance(offset - current_offset);
        }
        else if (offset < current_offset) {
            this.rewind(current_offset - offset);
        }
    }
    /**
     * Reset the bit position back to 0 and advance the stream.
     */
    align() {
        debug("align");
        if (this.bitPosition !== 0) {
            this.advance(8 - this.bitPosition);
        }
    }
    /**
     * Read the specified number of bits, from 0 through 40 at any bit alignment.
     * @param bits The number of bits to be read.
     * @param signed If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false.
     * @param advance If true, advance the bit position, default is true.
     * @returns The value read in from the stream.
     */
    read(bits, signed = false, advance = true) {
        debug("read:", bits, signed, advance);
        this.validateRead(bits);
        if (bits === 0) {
            return 0;
        }
        let output = 0;
        const mBits = bits + this.bitPosition;
        const { data, offset } = this.stream;
        debug("read mBits:", mBits);
        if (mBits <= 8) {
            output = ((data[offset] << this.bitPosition) & 0xff) >>> (8 - bits);
        }
        else if (mBits <= 16) {
            output =
                ((((data[offset] << 8) | data[offset + 1]) << this.bitPosition) & 0xffff) >>> (16 - bits);
        }
        else if (mBits <= 24) {
            const value = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
            output = ((value << this.bitPosition) & 0xffffff) >>> (24 - bits);
        }
        else if (mBits <= 32) {
            const value = (data[offset] << 24) |
                (data[offset + 1] << 16) |
                (data[offset + 2] << 8) |
                data[offset + 3];
            output = (value << this.bitPosition) >>> (32 - bits);
        }
        else {
            // Up to six bytes are needed for an unaligned 40-bit field; 48 bits remain exact in a Number.
            const bytes = Math.ceil(mBits / 8);
            for (let i = 0; i < bytes; i++) {
                output = output * 256 + data[offset + i];
            }
            output %= 2 ** (bytes * 8 - this.bitPosition); // (output << bitPosition) & the byte-width mask
            output = Math.floor(output / 2 ** (bytes * 8 - mBits)); // a >>> (byte width - mBits)
        }
        if (signed && output >= 2 ** (bits - 1)) {
            // NOTE: The above check avoids 32-bit coercion when the field is wider than 31 bits.
            output -= 2 ** bits;
        }
        if (advance) {
            // Bounds were checked before reading, so commit both cursor components together.
            this.stream.offset += Math.floor(mBits / 8);
            this.bitPosition = mBits % 8;
        }
        return output;
    }
    /**
     * Read the specified number of bits without advancing the bit position.
     * @param bits The number of bits to be read.
     * @param signed If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false.
     * @returns The value read in from the stream.
     */
    peek(bits, signed = false) {
        debug("peek:", bits, signed);
        return this.read(bits, signed, false);
    }
    /**
     * Read the specified number of bits, from 0 through 40 at any bit alignment.
     * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
     * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
     * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
     * @param bits The number of bits to be read.
     * @param signed If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false.
     * @param advance If true, advance the bit position, default is true.
     * @returns The value read in from the stream.
     * @throws {Error} Too Large, too many bits.
     */
    readLSB(bits, signed = false, advance = true) {
        debug("readLSB:", bits, signed, advance);
        this.validateRead(bits);
        if (bits === 0) {
            return 0;
        }
        const mBits = bits + this.bitPosition;
        const { data, offset } = this.stream;
        let output = data[offset];
        if (mBits > 8) {
            output |= data[offset + 1] << 8;
        }
        if (mBits > 16) {
            output |= data[offset + 2] << 16;
        }
        if (mBits > 24) {
            output = (output | (data[offset + 3] << 24)) >>> 0;
        }
        if (mBits > 32) {
            output += data[offset + 4] * 0x100000000;
        }
        if (mBits > 40) {
            output += data[offset + 5] * 0x10000000000;
        }
        if (mBits <= 32) {
            output >>>= this.bitPosition;
            if (bits < 32) {
                output &= 2 ** bits - 1;
            }
        }
        else {
            output = Math.floor(output / 2 ** this.bitPosition) % 2 ** bits;
        }
        if (signed && output >= 2 ** (bits - 1)) {
            output -= 2 ** bits;
        }
        if (advance) {
            this.stream.offset += Math.floor(mBits / 8);
            this.bitPosition = mBits % 8;
        }
        return output;
    }
    /**
     * Read the specified number of bits without advancing the bit position.
     * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
     * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
     * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
     * @param bits The number of bits to be read.
     * @param signed If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false.
     * @returns The value read in from the stream.
     * @throws {Error} Too Large, too many bits.
     */
    peekLSB(bits, signed = false) {
        debug("peekLSB:", bits, signed);
        return this.readLSB(bits, signed, false);
    }
    /** Validate a bit count without applying the 40-bit numeric read limit. */
    validateBits(bits) {
        if (!Number.isSafeInteger(bits) || bits < 0) {
            throw new RangeError(`Invalid bit count: ${bits}`);
        }
    }
    /** Validate the entire read before accessing bytes or changing either cursor. */
    validateRead(bits) {
        this.validateBits(bits);
        if (bits > 40) {
            throw new Error(`Too Large: ${bits} bits`);
        }
        if (!this.available(bits)) {
            throw new UnderflowError(`Insufficient Bits: ${bits} <= ${this.stream.remainingBytes() * 8 - this.bitPosition}`);
        }
    }
}
export default DataBitstream;
//# sourceMappingURL=data-bitstream.js.map