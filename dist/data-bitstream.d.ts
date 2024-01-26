export default DataBitstream;
/**
 * Read a DataStream as a stream of bits.
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
declare class DataBitstream {
    /**
     * Creates a new DataBitstream from file data.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|number|string|Uint8Array|Uint32Array} data The data of the image to process.
     * @returns {DataBitstream} The new DataBitstream instance for the provided file data.
     * @static
     */
    static fromData(data: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | number | string | Uint8Array | Uint32Array): DataBitstream;
    /**
     * Creates a new DataBitstream from an array of bytes.
     * @param {number[]} bytes The data to read as a bitstream.
     * @returns {DataBitstream} The new DataBitstream instance for the provided bytes.
     * @static
     */
    static fromBytes(bytes: number[]): DataBitstream;
    /**
     * Creates an instance of DataBitstream.
     * @param {DataStream} stream The DataStream to process.
     */
    constructor(stream: DataStream);
    /** @type {DataStream} The DataStream being processed. */
    stream: DataStream;
    /** @type {number} The number of buffers in the list. */
    bitPosition: number;
    /**
     * Creates a copy of the DataBitstream.
     * @returns {DataBitstream} The copied DataBufferList.
     */
    copy(): DataBitstream;
    /**
     * Returns the current stream offset in bits.
     * @returns {number} The number of bits read thus far.
     */
    offset(): number;
    /**
     * Returns if the specified number of bits is avaliable in the stream.
     * @param {number} bits The number of bits to check for avaliablity.
     * @returns {boolean} If the requested number of bits are avaliable in the stream.
     */
    available(bits: number): boolean;
    /**
     * Advance the bit position by the specified number of bits in the stream.
     * @param {number} bits The number of bits to advance.
     */
    advance(bits: number): void;
    /**
     * Rewind the bit position by the specified number of bits in the stream.
     * @param {number} bits The number of bits to go back.
     */
    rewind(bits: number): void;
    /**
     * Go to the specified offset in the stream.
     * @param {number} offset The offset to go to.
     */
    seek(offset: number): void;
    /**
     * Reset the bit position back to 0 and advance the stream.
     */
    align(): void;
    /**
     * Read the specified number of bits.
     * @param {number} bits The number of bits to be read.
     * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
     * @param {boolean} [advance=true] If true, advance the bit position.
     * @returns {number} The value read in from the stream.
     */
    read(bits: number, signed?: boolean, advance?: boolean): number;
    /**
     * Read the specified number of bits without advancing the bit position.
     * @param {number} bits The number of bits to be read.
     * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
     * @returns {number} The value read in from the stream.
     */
    peek(bits: number, signed?: boolean): number;
    /**
     * Read the specified number of bits.
     * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
     * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
     * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
     * @param {number} bits The number of bits to be read.
     * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
     * @param {boolean} [advance=true] If true, advance the bit position.
     * @returns {number} The value read in from the stream.
     * @throws {Error} Too Large, too many bits.
     */
    readLSB(bits: number, signed?: boolean, advance?: boolean): number;
    /**
     * Read the specified number of bits without advancing the bit position.
     * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
     * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
     * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
     * @param {number} bits The number of bits to be read.
     * @param {boolean} [signed=false] If the sign bit is turned on, flip the bits and add one to convert to a negative value.
     * @returns {number} The value read in from the stream.
     * @throws {Error} Too Large, too many bits.
     */
    peekLSB(bits: number, signed?: boolean): number;
}
import DataStream from './data-stream.js';
import DataBuffer from './data-buffer.js';
//# sourceMappingURL=data-bitstream.d.ts.map