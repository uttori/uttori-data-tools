/**
 * Creates an instance of DataBitstream.
 * @example
 * <caption>new DataBitstream(stream)</caption>
 * const stream = DataStream.fromBuffer(new DataBuffer(new Uint8Array([0xFC, 0x08])));
 * const bitstream = new DataBitstream(stream);
 * bitstream.readLSB(0);
 * ➜ 0
 * bitstream.readLSB(4);
 * ➜ 12
 * @property stream - The DataStream to process
 * @property bitPosition - The number of buffers in the list
 * @param stream - The DataStream to process
 */
declare class DataBitstream {
    constructor(stream: DataStream);
    /**
     * Creates a new DataBitstream from file data.
     * @param data - The data of the image to process.
     * @returns the new DataBitstream instance for the provided file data
     */
    static fromData(data: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | number | string | Uint8Array | Uint32Array): DataBitstream;
    /**
     * Creates a new DataBitstream from an array of bytes.
     * @param bytes - The data to read as a bitstream.
     * @returns the new DataBitstream instance for the provided bytes
     */
    static fromBytes(bytes: number[]): DataBitstream;
    /**
     * Creates a copy of the DataBitstream.
     * @returns - The copied DataBufferList
     */
    copy(): DataBitstream;
    /**
     * Returns the current stream offset in bits.
     * @returns - The number of bits read thus far
     */
    offset(): number;
    /**
     * Returns if the specified number of bits is avaliable in the stream.
     * @param bits - The number of bits to check for avaliablity
     * @returns - If the requested number of bits are avaliable in the stream
     */
    available(bits: number): boolean;
    /**
     * Advance the bit position by the specified number of bits in the stream.
     * @param bits - The number of bits to advance
     */
    advance(bits: number): void;
    /**
     * Rewind the bit position by the specified number of bits in the stream.
     * @param bits - The number of bits to go back
     */
    rewind(bits: number): void;
    /**
     * Go to the specified offset in the stream.
     * @param offset - The offset to go to
     */
    seek(offset: number): void;
    /**
     * Reset the bit position back to 0 and advance the stream.
     */
    align(): void;
    /**
     * Read the specified number of bits.
     * @param bits - The number of bits to be read
     * @param [signed = false] - If the sign bit is turned on, flip the bits and add one to convert to a negative value
     * @param [advance = true] - If true, advance the bit position.
     * @returns The value read in from the stream
     */
    read(bits: number, signed?: boolean, advance?: boolean): number;
    /**
     * Read the specified number of bits without advancing the bit position.
     * @param bits - The number of bits to be read
     * @param [signed] - If the sign bit is turned on, flip the bits and add one to convert to a negative value
     * @returns The value read in from the stream
     */
    peek(bits: number, signed?: boolean): number;
    /**
     * Read the specified number of bits.
     * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
     * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
     * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
     * @param bits - The number of bits to be read
     * @param [signed = false] - If the sign bit is turned on, flip the bits and add one to convert to a negative value
     * @param [advance = true] - If true, advance the bit position.
     * @returns The value read in from the stream
     */
    readLSB(bits: number, signed?: boolean, advance?: boolean): number;
    /**
     * Read the specified number of bits without advancing the bit position.
     * In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
     * The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
     * It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.
     * @param bits - The number of bits to be read
     * @param [signed = false] - If the sign bit is turned on, flip the bits and add one to convert to a negative value
     * @returns The value read in from the stream
     */
    peekLSB(bits: number, signed?: boolean): number;
    /**
     * The DataStream to process
    */
    stream: DataStream;
    /**
     * The number of buffers in the list
    */
    bitPosition: number;
}

/**
 * Creates an instance of DataBufferList.
 * @example
 * <caption>new DataBufferList()</caption>
 * const buffer = new DataBuffer(data);
 * const list = new DataBufferList();
 * list.append(buffer);
 * @property first - The first DataBuffer in the list
 * @property last - The last DataBuffer in the list
 * @property totalBuffers - The number of buffers in the list
 * @property availableBytes - The number of bytes avaliable to read
 * @property availableBuffers - The number of buffers avaliable to read
 */
declare class DataBufferList {
    /**
     * Creates a copy of the DataBufferList.
     * @returns - The copied DataBufferList
     */
    copy(): DataBufferList;
    /**
     * Creates a copy of the DataBufferList.
     * @param buffer - The DataBuffer to add to the list
     * @returns - The new number of buffers in the DataBufferList
     */
    append(buffer: DataBuffer): number;
    /**
     * Advance the buffer list to the next buffer.
     * @returns - Returns false if there is no more buffers, returns true when the next buffer is set
     */
    advance(): boolean;
    /**
     * Rewind the buffer list to the previous buffer.
     * @returns - Returns false if there is no previous buffer, returns true when the previous buffer is set
     */
    rewind(): boolean;
    /**
     * Reset the list to the beginning.
     */
    reset(): void;
    /**
     * The first DataBuffer in the list
    */
    first: DataBuffer;
    /**
     * The last DataBuffer in the list
    */
    last: DataBuffer;
    /**
     * The number of buffers in the list
    */
    totalBuffers: number;
    /**
     * The number of bytes avaliable to read
    */
    availableBytes: number;
    /**
     * The number of buffers avaliable to read
    */
    availableBuffers: number;
}

/**
 * Creates an instance of DataBitstream.
 * @example
 * <caption>new DataBitstream(stream)</caption>
 * const stream = DataStream.fromBuffer(new DataBuffer(new Uint8Array([0xFC, 0x08])));
 * const bitstream = new DataBitstream(stream);
 * bitstream.readLSB(0);
 * ➜ 0
 * bitstream.readLSB(4);
 * ➜ 12
 * @property data - The data to process
 * @property length - The size of the data in bytes
 * @property next - The next DataBuffer when part of a DataBufferList
 * @property prev - The previous DataBuffer when part of a DataBufferList
 * @param input - The DataStream to process
 */
declare class DataBuffer {
    constructor(input: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | number | string | Uint8Array | Uint32Array);
    /**
     * Creates an instance of DataBuffer with given size.
     * @param size - The size of the requested DataBuffer
     * @returns The new DataBuffer
     */
    static allocate(size: number): DataBuffer;
    /**
     * Compares another DataBuffer against the current data buffer at a specified offset.
     * @param input - The size of the requested DataBuffer
     * @param [offset = 0] - The size of the requested DataBuffer
     * @returns Returns true when both DataBuffers are equal, false if there is any difference.
     */
    compare(input: DataBuffer, offset?: number): boolean;
    /**
     * Creates a copy of the current DataBuffer.
     * @returns A new copy of the current DataBuffer
     */
    copy(): DataBuffer;
    /**
     * Creates a copy of the current DataBuffer from a specified offset and a specified length.
     * @param position - The starting offset to begin the copy of the new DataBuffer
     * @param [length] - The size of the new DataBuffer
     * @returns The new DataBuffer
     */
    slice(position: number, length?: number): DataBuffer;
    /**
     * The data to process
    */
    data: Buffer | Uint8Array;
    /**
     * The size of the data in bytes
    */
    length: number;
    /**
     * The next DataBuffer when part of a DataBufferList
    */
    next: DataBuffer;
    /**
     * The previous DataBuffer when part of a DataBufferList
    */
    prev: DataBuffer;
}

/**
 * Creates an instance of CRC32.
 * @example
 * <caption>CRC32.of(...)</caption>
 * CRC32.of('The quick brown fox jumps over the lazy dog');
 * ➜ '414FA339'
 * @property crc - The internal CRC value
 */
declare class CRC32 {
    /**
     * Creates an instance of CRC32 and calculates the checksum of a provided input.
     * @param data - The data to calculate the checksum of
     * @returns The computed CRC value
     */
    static of(data: any): string;
    /**
     * Calculates the CRC for a chunk of data.
     * @param buffer - The data buffer to calculate the checksum of
     */
    update(buffer: DataBuffer): void;
    /**
     * Returns the internal CRC value as a hexadecimal string.
     * @returns The computed CRC value
     */
    toHex(): string;
    /**
     * The internal CRC value
    */
    crc: number;
}

/**
 * Creates a new UnderflowError.
 * @example
 * <caption>new UnderflowError(message)</caption>
 * throw new UnderflowError('Insufficient Bytes: 1');
 * @param message - Message to show when the error is thrown.
 */
declare class UnderflowError extends Error {
    constructor(message: string);
}

/**
 * Creates a new DataStream.
 * @example
 * <caption>new DataStream(list, options)</caption>
 * @property size - ArrayBuffer byteLength
 * @property buf - Instance of ArrayBuffer used for the various typed arrays
 * @property uint8 - octet / uint8_t
 * @property int8 - byte / int8_t
 * @property uint16 - unsigned short / uint16_t
 * @property int16 - short / int16_t
 * @property uint32 - unsigned long / uint32_t
 * @property int32 - long / int32_t
 * @property float32 - unrestricted float / float
 * @property float64 - unrestricted double / double
 * @property int64 - bigint / int64_t (signed long long)
 * @property uint64 - bigint / uint64_t (unsigned long long)
 * @property nativeEndian - Native Endianness of the machine, true is Little Endian, false is Big Endian
 * @property list - The DataBufferList to process
 * @property localOffset - Reading offset for the current chunk
 * @property offset - Reading offset for all chunks
 * @param list - The DataBufferList to process
 * @param options - Options for this instance
 * @param [options.size = 16] - ArrayBuffer byteLength for the underlying binary parsing
 */
declare class DataStream {
    constructor(list: DataBufferList, options: {
        size?: number;
    });
    /**
     * Creates a new DataStream from file data.
     * @param data - The data of the image to process.
     * @returns the new DataStream instance for the provided file data
     */
    static fromData(data: string | Buffer): DataStream;
    /**
     * Creates a new DataStream from a DataBuffer.
     * @param buffer - The DataBuffer of the image to process.
     * @returns the new DataStream instance for the provided DataBuffer
     */
    static fromBuffer(buffer: DataBuffer): DataStream;
    /**
     * Compares input data against the current data.
     * @param input - The DataStream to compare against
     * @param [offset = 0] - The offset to begin comparing at
     * @returns - True if the data is the same as the input, starting at the offset, false is there is any difference
     */
    compare(input: DataStream, offset?: number): boolean;
    /**
     * Compares input data against the upcoming data, byte by byte.
     * @param input - The data to check for in upcoming bytes.
     * @returns - True if the data is the upcoming data, false if it is not or there is not enough buffer remaining
     */
    next(input: number[] | Buffer): boolean;
    /**
     * Create a copy of the current DataStream and offset.
     * @returns - A new copy of the DataStream
     */
    copy(): DataStream;
    /**
     * Checks if a given number of bytes are avaliable in the stream.
     * @param bytes - The number of bytes to check for
     * @returns - True if there are the requested amount, or more, of bytes left in the stream
     */
    available(bytes: number): boolean;
    /**
     * Returns the remaining bytes in the stream.
     * @returns - The remaining bytes in the stream
     */
    remainingBytes(): number;
    /**
     * Advance the stream by a given number of bytes. Useful for skipping unused bytes.
     * @param bytes - The number of bytes to advance
     * @returns - The current DataStream
     */
    advance(bytes: number): DataStream;
    /**
     * Rewind the stream by a given number of bytes.
     * @param bytes - The number of bytes to go back
     * @returns - The current DataStream
     */
    rewind(bytes: number): DataStream;
    /**
     * Go to a specified offset in the stream.
     * @param position - The offset to go to
     * @returns - The current DataStream
     */
    seek(position: number): DataStream;
    /**
     * Read from the current offset and return the value.
     * @returns - The UInt8 value at the current offset
     */
    readUInt8(): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @returns - The UInt8 value at the current offset
     */
    peekUInt8(offset?: number): any;
    /**
     * Read from the current offset and return the value.
     * @param bytes - The number of bytes to read
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The UInt8 value at the current offset
     */
    read(bytes: number, littleEndian?: boolean): any;
    /**
     * Read the bits from the bytes from the provided offset and return the value.
     * @param position - The bit position to read, 0 to 7
     * @param [length = 1] - The number of bits to read, 1 to 8
     * @param [offset = 0] - The offset to read from
     * @returns - The value at the provided bit position of a provided length at the provided offset
     */
    peekBit(position: number, length?: number, offset?: number): number;
    /**
     * Read from the provided offset and return the value.
     * @param bytes - The number of bytes to read
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The UInt8 value at the current offset
     */
    peek(bytes: number, offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value.
     * @returns - The Int8 value at the current offset
     */
    readInt8(): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @returns - The Int8 value at the current offset
     */
    peekInt8(offset?: number): any;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The UInt16 value at the current offset
     */
    readUInt16(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Int8 value at the current offset
     */
    peekUInt16(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Int16 value at the current offset
     */
    readInt16(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Int16 value at the current offset
     */
    peekInt16(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The UInt24 value at the current offset
     */
    readUInt24(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The UInt24 value at the current offset
     */
    peekUInt24(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Int24 value at the current offset
     */
    readInt24(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Int24 value at the current offset
     */
    peekInt24(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The UInt32 value at the current offset
     */
    readUInt32(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The UInt32 value at the current offset
     */
    peekUInt32(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Int32 value at the current offset
     */
    readInt32(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Int32 value at the current offset
     */
    peekInt32(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float32 value at the current offset
     */
    readFloat32(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float32 value at the current offset
     */
    peekFloat32(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
     * May be faulty with large numbers due to float percision.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float48 value at the current offset
     */
    readFloat48(littleEndian?: boolean): number;
    /**
     * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
     * May be faulty with large numbers due to float percision.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float48 value at the specified offset
     */
    peekFloat48(offset?: number, littleEndian?: boolean): number;
    /**
     * Read from the current offset and return the value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float64 value at the current offset
     */
    readFloat64(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float64 value at the current offset
     */
    peekFloat64(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the IEEE 80 bit extended float value.
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float80 value at the current offset
     */
    readFloat80(littleEndian?: boolean): any;
    /**
     * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
     * @param [offset = 0] - The offset to read from
     * @param [littleEndian = false] - Read in Little Endian format
     * @returns - The Float80 value at the current offset
     */
    peekFloat80(offset?: number, littleEndian?: boolean): any;
    /**
     * Read from the current offset and return the value as a DataBuffer.
     * @param length - The number of bytes to read
     * @returns - The requested number of bytes as a DataBuffer
     */
    readBuffer(length: number): DataBuffer;
    /**
     * Read from the specified offset and return the value as a DataBuffer.
     * @param [offset = 0] - The offset to read from
     * @param length - The number of bytes to read
     * @returns - The requested number of bytes as a DataBuffer
     */
    peekBuffer(offset?: number, length: number): DataBuffer;
    /**
     * Read from the current offset of the current buffer for a given length and return the value as a DataBuffer.
     * @param length - The number of bytes to read
     * @returns - The requested number of bytes as a DataBuffer
     */
    readSingleBuffer(length: number): DataBuffer;
    /**
     * Read from the specified offset of the current buffer for a given length and return the value as a DataBuffer.
     * @param [offset = 0] - The offset to read from
     * @param length - The number of bytes to read
     * @returns - The requested number of bytes as a DataBuffer
     */
    peekSingleBuffer(offset?: number, length: number): DataBuffer;
    /**
     * Read from the current offset for a given length and return the value as a string.
     * @param length - The number of bytes to read
     * @param [encoding = ascii] - The encoding of the string
     * @returns - The read value as a string
     */
    readString(length: number, encoding?: string): string;
    /**
     * Read from the specified offset for a given length and return the value as a string.
     * @param [offset = 0] - The offset to read from
     * @param length - The number of bytes to read
     * @param [encoding = ascii] - The encoding of the string
     * @returns - The read value as a string
     */
    peekString(offset?: number, length: number, encoding?: string): string;
    /**
     * Convert the current buffer into a Turbo Pascal 48 bit float value.
     * May be faulty with large numbers due to float percision.
     *
     * While most languages use a 32-bit or 64-bit floating point decimal variable, usually called single or double,
     * Turbo Pascal featured an uncommon 48-bit float called a real which served the same function as a float.
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
     * @returns - The read value as a number
     */
    float48(): number;
    /**
     * ArrayBuffer byteLength
    */
    size: number;
    /**
     * Instance of ArrayBuffer used for the various typed arrays
    */
    buf: ArrayBuffer;
    /**
     * octet / uint8_t
    */
    uint8: Uint8Array;
    /**
     * byte / int8_t
    */
    int8: Int8Array;
    /**
     * unsigned short / uint16_t
    */
    uint16: Uint16Array;
    /**
     * short / int16_t
    */
    int16: Int16Array;
    /**
     * unsigned long / uint32_t
    */
    uint32: Uint32Array;
    /**
     * long / int32_t
    */
    int32: Int32Array;
    /**
     * unrestricted float / float
    */
    float32: Float32Array;
    /**
     * unrestricted double / double
    */
    float64: Float64Array;
    /**
     * bigint / int64_t (signed long long)
    */
    int64: BigInt64Array;
    /**
     * bigint / uint64_t (unsigned long long)
    */
    uint64: BigUint64Array;
    /**
     * Native Endianness of the machine, true is Little Endian, false is Big Endian
    */
    nativeEndian: boolean;
    /**
     * The DataBufferList to process
    */
    list: DataBufferList;
    /**
     * Reading offset for the current chunk
    */
    localOffset: number;
    /**
     * Reading offset for all chunks
    */
    offset: number;
}

