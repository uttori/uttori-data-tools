import { type Edit } from "./diff/diff.js";
/**
 * Helper class for manipulating binary data.
 * @property {Buffer|Uint8Array} data The data to process.
 * @property {number} length The size of the data in bytes.
 * @property {DataBuffer} next The next DataBuffer when part of a DataBufferList.
 * @property {DataBuffer} prev The previous DataBuffer when part of a DataBufferList.
 * @example <caption>new DataBuffer(stream)</caption>
 * const buffer = new DataBuffer(new Uint8Array([0xFC, 0x08]));
 * buffer.readUInt8();
 * ➜ 0xFC
 * buffer.readUInt8();
 * ➜ 0x08
 * @class
 */
declare class DataBuffer {
    #private;
    /** Bytes owned or borrowed by this view. */
    data: Uint8Array<ArrayBuffer>;
    /** Is this instance for creating a new file? */
    writing: boolean;
    /** Native Endianness of the machine, true is Little Endian, false is Big Endian */
    nativeEndian: boolean;
    /** Reading / Writing offset */
    offset: number;
    /** Backing store for the internal write buffer, null until first write to avoid copying when read-only, based on `this.writing` flag. */
    _buffer: number[] | null;
    /** The number of bytes avaliable to read. */
    lengthInBytes: number;
    /** When the buffer is part of a bufferlist, the next DataBuffer in the list. */
    next: DataBuffer | null;
    /** When the buffer is part of a bufferlist, the previous DataBuffer in the list. */
    prev: DataBuffer | null;
    /**
     * Creates an instance of DataBuffer.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} [input] The data to process.
     * Omitted input creates an empty writable buffer.
     * @throws {RangeError} The requested numeric length is not a nonnegative safe integer.
     * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
     */
    constructor(input?: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array);
    /**
     * Buffer for creating new files. Lazy-inits from a copy of data on first write when instance was created read-only.
     * @returns {number[]} The buffer.
     */
    get buffer(): number[];
    /**
     * Creates an instance of DataBuffer with given size.
     * @param {number} size The size of the requested DataBuffer.
     * @returns {DataBuffer} The new DataBuffer.
     */
    static allocate(size: number): DataBuffer;
    /**
     * Helper to match arrays by returning the data length.
     * @returns {number} The data length of the DataBuffer.
     */
    get length(): number;
    /**
     * Compares another DataBuffer against the current data buffer at a specified offset.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} input The data to compare against the current DataBuffer.
     * @param {number} [offset] The offset in the current DataBuffer to start comparing, default is 0.
     * @returns {boolean} Returns true when all input bytes match the region at offset, false if there is any difference, the input is empty, or the region is out of bounds.
     */
    compare(input: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array | undefined, offset?: number): boolean;
    /**
     * Diffs another DataBuffer against the current data buffer at a specified offset and returns the edits.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} input The DataBuffer to compare against.
     * @param {number} [offset] The offset to start the comparison from, default is 0.
     * @returns {import('./diff/diff.js').Edit[]} Returns an array of edits describing the differences.
     */
    diff(input: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array | undefined, offset?: number): Edit[];
    /**
     * Compares input data against the upcoming data, byte by byte.
     * @param {number[] | Buffer | Uint8Array} input The data to check for in upcoming bytes.
     * @returns {boolean} `true` if the data is the upcoming data, `false` if it is not or there is not enough buffer remaining.
     */
    isNextBytes(input: number[] | Buffer | Uint8Array): boolean;
    /**
     * Creates a copy of the current DataBuffer.
     * @returns {DataBuffer} A new copy of the current DataBuffer.
     */
    copy(): DataBuffer;
    /**
     * Creates a copy of the current DataBuffer from a specified offset and a specified length.
     * @param {number} position The starting offset to begin the copy of the new DataBuffer.
     * @param {number} [length] The size of the new DataBuffer, defaults to the current length.
     * @returns {DataBuffer} The new DataBuffer
     */
    slice(position: number, length?: number): DataBuffer;
    /**
     * Returns the remaining bytes to be read in the DataBuffer.
     * @returns {number} The remaining bytes to bre read in the DataBuffer.
     */
    remainingBytes(): number;
    /**
     * Checks if a given number of bytes are avaliable in the DataBuffer.
     * If writing mode is enabled, this is true for valid nonnegative integer ranges.
     * Pass false for writing when checking committed bytes for a read.
     * @param {number} bytes The number of bytes to check for.
     * @param {boolean} [writing] Allow growth instead of requiring committed bytes, default is this.writing.
     * @returns {boolean} True if there are the requested amount, or more, of bytes left in the DataBuffer.
     */
    available(bytes: number, writing?: boolean): boolean;
    /**
     * Checks if a given number of bytes are avaliable after a given offset in the buffer.
     * If writing mode is enabled, this is true for valid nonnegative integer ranges.
     * Pass false for writing when checking committed bytes for a read.
     * @param {number} bytes The number of bytes to check for.
     * @param {number} offset The offset to start from.
     * @param {boolean} [writing] Allow growth instead of requiring committed bytes, default is this.writing.
     * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
     */
    availableAt(bytes: number, offset: number, writing?: boolean): boolean;
    /**
     * Advance the offset by a given number of bytes.
     * @param {number} bytes The number of bytes to advance.
     * @throws {RangeError} The byte count or current offset is not a nonnegative safe integer.
     * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
     */
    advance(bytes: number): void;
    /**
     * Rewind the offset by a given number of bytes.
     * @param {number} bytes The number of bytes to go back.
     * @throws {RangeError} The byte count or current offset is not a nonnegative safe integer.
     * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
     */
    rewind(bytes: number): void;
    /**
     * Go to a specified offset in the stream.
     * @param {number} position The offset to go to.
     * @throws {RangeError} The requested position or current offset is not a nonnegative safe integer.
     */
    seek(position: number): void;
    /**
     * Read from the current offset and return the value.
     * @returns {number} The UInt8 value at the current offset.
     * @throws {UnderflowError} Insufficient Bytes in the stream.
     */
    readUInt8(): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @returns {number} The UInt8 value at the current offset.
     * @throws {UnderflowError} Insufficient Bytes in the stream.
     */
    peekUInt8(offset?: number): number;
    /**
     * Read from the current offset and return the value.
     * @param {number} bytes The number of bytes to read.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {Uint8Array} The UInt8 value at the current offset.
     */
    read(bytes: number, littleEndian?: boolean): Uint8Array;
    /**
     * Read from the provided offset and return the value.
     * @param {number} bytes The number of bytes to read.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {Uint8Array} The UInt8 value at the current offset.
     */
    peek(bytes: number, offset?: number, littleEndian?: boolean): Uint8Array;
    /**
     * Read the bits from the bytes from the provided offset and return the value.
     * Bits are numbered from the most significant bit. Requests extending past bit 7
     * are zero-filled on the right, preserving the existing single-byte behavior.
     * @param {number} position The bit position to read, 0 to 7.
     * @param {number} [length] The number of bits to read, 1 to 8, default is 1.
     * @param {number} [offset] The offset to read from, default is 0.
     * @returns {number} The value at the provided bit position of a provided length at the provided offset.
     * @throws {Error} peekBit position is invalid: ${position}, must be an Integer between 0 and 7
     * @throws {Error} `peekBit length is invalid: ${length}, must be an Integer between 1 and 8
     */
    peekBit(position: number, length?: number, offset?: number): number;
    /**
     * Read from the current offset and return the value.
     * @returns {number} The Int8 value at the current offset.
     */
    readInt8(): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @returns {number} The Int8 value at the current offset.
     */
    peekInt8(offset?: number): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt16 value at the current offset.
     */
    readUInt16(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int8 value at the current offset.
     */
    peekUInt16(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int16 value at the current offset.
     */
    readInt16(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int16 value at the current offset.
     */
    peekInt16(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt24 value at the current offset.
     */
    readUInt24(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt24 value at the current offset.
     */
    peekUInt24(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int24 value at the current offset.
     */
    readInt24(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int24 value at the current offset.
     */
    peekInt24(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt32 value at the current offset.
     */
    readUInt32(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt32 value at the current offset.
     */
    peekUInt32(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int32 value at the current offset.
     */
    readInt32(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int32 value at the current offset.
     */
    peekInt32(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float32 value at the current offset.
     */
    readFloat32(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float32 value at the current offset.
     */
    peekFloat32(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float48 value at the current offset.
     */
    readFloat48(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float48 value at the specified offset.
     */
    peekFloat48(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float64 value at the current offset.
     */
    readFloat64(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float64 value at the current offset.
     */
    peekFloat64(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the IEEE 80 bit extended float value.
     * @param {boolean} [littleEndian] Reverse the input bytes before conversion, defaults to system value, default is the current nativeEndian value.
     * This legacy flag is retained for compatibility; use readFloatIEEE754 / peekFloatIEEE754 for conventional input-endianness semantics.
     * @returns {number} The Float80 value at the current offset.
     */
    readFloat80(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Reverse the input bytes before conversion, defaults to system value, default is the current nativeEndian value.
     * This legacy flag is retained for compatibility; use readFloatIEEE754 / peekFloatIEEE754 for conventional input-endianness semantics.
     * @returns {number} The Float80 value at the current offset.
     */
    peekFloat80(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the IEEE 754 extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The IEEE 754 extended float value at the current offset.
     */
    readFloatIEEE754(littleEndian?: boolean): number;
    /**
     * Peek from the specified offset without advancing the offsets and return the IEEE 754 extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The IEEE 754 extended float value at the specified offset.
     */
    peekFloatIEEE754(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value as a DataBuffer.
     * @param {number} length The number of bytes to read.
     * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
     */
    readBuffer(length: number): DataBuffer;
    /**
     * Read from the specified offset and return the value as a DataBuffer.
     * @param {number} offset The offset to read from.
     * @param {number} length The number of bytes to read.
     * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
     */
    peekBuffer(offset: number, length: number): DataBuffer;
    /**
     * Read from the current offset for a given length and return the value as a string.
     * @param {number|null} [length] The number of bytes to read; omitted reads the remainder, null reads through a null terminator, and zero reads nothing.
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @returns {string} The read value as a string.
     */
    readString(length?: number | null, encoding?: string): string;
    /**
     * Read from the specified offset for a given length and return the value as a string.
     * @param {number} offset The offset to read from.
     * @param {number|null} [length] The number of bytes to read; omitted reads the remainder, null reads through a null terminator, and zero reads nothing.
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @returns {string} The read value as a string.
     */
    peekString(offset: number, length?: number | null, encoding?: string): string;
    /**
     * Read from the specified offset for a given length and return the value as a string in a specified encoding, and optionally advance the offsets.
     * Supported Encodings: ascii / latin1, utf8 / utf-8, utf16-be, utf16be, utf16le, utf16-le, utf16bom, utf16-bom
     * Encoding names are case-insensitive. Malformed UTF-8 is replaced with U+FFFD without
     * consuming bytes outside the field; malformed UTF-16 retains the existing error behavior.
     * A failed decode does not move the cursor. A successful advancing decode ends at the supplied offset plus consumed bytes.
     * @private
     * @param {number} offset The offset to read from.
     * @param {number|null|undefined} length The number of bytes to read, if not defined it is the remaining bytes in the buffer. If NULL a null terminated string will be read.
     * @param {string} encoding The encoding of the string.
     * @param {boolean} [advance] Flag to optionally advance the offsets, default is false.
     * @returns {string} The read value as a string.
     */
    decodeString(offset: number, length: number | null | undefined, encoding: string, advance?: boolean): string;
    /**
     * Read a null-terminated string from the current offset and advance the offset.
     * A null-terminated string is a sequence of bytes ending with a null byte (0x00).
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @param {number} [nullValue] The byte value that terminates the string, default is 0x00.
     * @returns {string} The read value as a string (without the null terminator).
     */
    readNullTerminatedString(encoding?: string, nullValue?: number): string;
    /**
     * Read a null-terminated string from the specified offset without advancing the offset.
     * A null-terminated string is a sequence of bytes ending with a null byte (0x00).
     * @param {number} offset The offset to read from.
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @param {number} [nullValue] The byte value that terminates the string, default is 0x00.
     * @returns {string} The read value as a string (without the null terminator).
     */
    peekNullTerminatedString(offset: number, encoding?: string, nullValue?: number): string;
    /**
     * Decode a null-terminated string from the specified offset.
     * Reads bytes until a null byte (0x00) is encountered. For UTF-16, a terminator is two
     * copies of nullValue at a code-unit boundary. Without a terminator, reads to the end of data.
     * Uses the same encodings and Unicode validation as decodeString.
     * @private
     * @param offset The offset to read from.
     * @param encoding The encoding of the string.
     * @param advance Flag to optionally advance the offsets.
     * @param nullValue The byte value that terminates the string, default is 0x00.
     * @returns The read value as a string (without the null terminator).
     */
    decodeNullTerminatedString(offset: number, encoding: string, advance: boolean, nullValue?: number): string;
    /**
     * Resets the instance offsets to 0.
     */
    reset(): void;
    /**
     * Writes a single 8 bit byte.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     */
    writeUInt8(data: number, offset?: number, advance?: boolean): void;
    /**
     * Writes an unsigned 16 bit value, 2 bytes.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     * @param {boolean} [littleEndian] Endianness of the write order, little Endian when `true`, default is big Endian `false`.
     */
    writeUInt16(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void;
    /**
     * Writes an unsigned 24 bit value, 3 bytes.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     * @param {boolean} [littleEndian] Endianness of the write order, little Endian when `true`, default is big Endian `false`.
     */
    writeUInt24(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void;
    /**
     * Writes an unsigned 32 bit value, 4 bytes.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     * @param {boolean} [littleEndian] Endianness of the write order, little Endian when `true`, default is big Endian `false`.
     */
    writeUInt32(data: number, offset?: number, advance?: boolean, littleEndian?: boolean): void;
    /**
     * Write a series of bytes.
     * Wider typed arrays retain the existing element-wise behavior: one staged value per element,
     * converted to a byte by commit(), not the constructor's raw-memory interpretation.
     * @param {number[]|Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     */
    writeBytes(data: number[] | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array, offset?: number, advance?: boolean): void;
    /**
     * Write a string as a given encoding.
     *
     * Valid encodings are: 'ascii' aka 'latin1', 'utf8' / 'utf-8', 'utf16be' / 'utf16-be', 'utf16le' / 'utf16-le', 'utf16bom' / 'utf16-bom'.
     * Names are case-insensitive. BOM encodings write a big-endian BOM before the UTF-16 data.
     * UTF-8 replaces unpaired surrogates with U+FFFD; UTF-16 retains the original code units.
     *
     * For UTF-8:
     * Up to 4 bytes per character can be used. The fewest number of bytes possible is used.
     * Characters up to U+007F are encoded with a single byte.
     * For multibyte sequences, the number of leading 1 bits in the first byte gives the number of bytes for the character. The rest of the bits of the first byte can be used to encode bits of the character.
     * The continuation bytes begin with 10, and the other 6 bits encode bits of the character.
     *
     * UTF-8 conversion interpreted from https://stackoverflow.com/posts/18729931/revisions
     * @param {string} string The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {string} [encoding] The encoding of the string, defailt is `ascii`.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     */
    writeString(string: string, offset?: number, encoding?: string, advance?: boolean): void;
    /**
     * Convert a write mode file into a read mode file.
     */
    commit(): void;
}
export default DataBuffer;
//# sourceMappingURL=data-buffer.d.ts.map