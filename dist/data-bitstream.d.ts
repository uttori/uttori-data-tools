import DataBuffer from "./data-buffer.js";
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
declare class DataBitstream {
    /** The DataBuffer being processed. */
    stream: DataBuffer;
    /** The bit offset within the current byte, from 0 through 7. */
    bitPosition: number;
    /**
     * Creates an instance of DataBitstream.
     * @param stream The DataBuffer to process.
     */
    constructor(stream: DataBuffer);
    /**
     * Creates a new DataBitstream from file data.
     * @param data The data of the image to process.
     * @returns The new DataBitstream instance for the provided file data.
     * @static
     */
    static fromData(data: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array): DataBitstream;
    /**
     * Creates a new DataBitstream from an array of bytes.
     * @param bytes The data to read as a bitstream.
     * @returns The new DataBitstream instance for the provided bytes.
     * @static
     */
    static fromBytes(bytes: number[]): DataBitstream;
    /**
     * Creates a copy of the DataBitstream.
     * @returns The copied DataBitstream, including its byte and bit offsets.
     */
    copy(): DataBitstream;
    /**
     * Returns the current stream offset in bits.
     * @returns The number of bits read thus far.
     */
    offset(): number;
    /**
     * Returns if the specified number of bits is avaliable in the stream.
     * @param bits The number of bits to check for avaliablity.
     * @returns If the requested number of bits are avaliable in the stream.
     */
    available(bits: number): boolean;
    /**
     * Advance the bit position by the specified number of bits in the stream.
     * @param bits The number of bits to advance.
     */
    advance(bits: number): void;
    /**
     * Rewind the bit position by the specified number of bits in the stream.
     * @param bits The number of bits to go back.
     */
    rewind(bits: number): void;
    /**
     * Go to the specified offset in the stream.
     * @param offset The offset to go to.
     */
    seek(offset: number): void;
    /**
     * Reset the bit position back to 0 and advance the stream.
     */
    align(): void;
    /**
     * Read the specified number of bits, from 0 through 40 at any bit alignment.
     * @param bits The number of bits to be read.
     * @param signed If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false.
     * @param advance If true, advance the bit position, default is true.
     * @returns The value read in from the stream.
     */
    read(bits: number, signed?: boolean, advance?: boolean): number;
    /**
     * Read the specified number of bits without advancing the bit position.
     * @param bits The number of bits to be read.
     * @param signed If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false.
     * @returns The value read in from the stream.
     */
    peek(bits: number, signed?: boolean): number;
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
    readLSB(bits: number, signed?: boolean, advance?: boolean): number;
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
    peekLSB(bits: number, signed?: boolean): number;
    /** Validate a bit count without applying the 40-bit numeric read limit. */
    private validateBits;
    /** Validate the entire read before accessing bytes or changing either cursor. */
    private validateRead;
}
export default DataBitstream;
//# sourceMappingURL=data-bitstream.d.ts.map