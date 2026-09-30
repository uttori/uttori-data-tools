import { convertFromIeeeExtended, float48, float80 } from "./data-helpers.js";
import UnderflowError from "./underflow-error.js";
/** Brand so checksums can recognize a DataBuffer without importing this module. */
function dataBufferBrand() {
    return Symbol.for("uttori.DataBuffer");
}
const DATA_BUFFER_BRAND = /* @__PURE__ */ dataBufferBrand();
/**
 * Native endianness is constant for the lifetime of this module.
 * Wrapped so the unused probe can be dropped; a bare `new Uint16Array` is a side effect to bundlers.
 */
function nativeEndian() {
    return new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412;
}
const NATIVE_ENDIAN = /* @__PURE__ */ nativeEndian();
/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */
/** @type {DebugLogger} */
let debug = (..._args) => { };
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
    try {
        const { default: d } = await import("debug");
        debug = d("DataBuffer");
    }
    catch { }
}
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
class DataBuffer {
    /** Bytes owned or borrowed by this view. */
    data = new Uint8Array(0);
    /** Is this instance for creating a new file? */
    writing = false;
    /** Native Endianness of the machine, true is Little Endian, false is Big Endian */
    nativeEndian = false;
    /** Reading / Writing offset */
    offset = 0;
    /** Backing store for the internal write buffer, null until first write to avoid copying when read-only, based on `this.writing` flag. */
    _buffer = null;
    /** The number of bytes avaliable to read. */
    lengthInBytes = 0;
    /** When the buffer is part of a bufferlist, the next DataBuffer in the list. */
    next = null;
    /** When the buffer is part of a bufferlist, the previous DataBuffer in the list. */
    prev = null;
    /** Cached numeric view, bounded to data. */
    #dataView = null;
    /** The data identity and byte length used to construct the cached numeric view. */
    #viewData = null;
    #viewLength = -1;
    /**
     * Reuse the numeric view until data is replaced or its backing buffer is resized.
     * Do not inspect the old DataView's byte length, a resize may have made it out of bounds.
     * @returns {DataView} A view covering exactly the current data.
     */
    get #view() {
        const { data } = this;
        if (this.#dataView === null ||
            this.#viewData !== data ||
            this.#viewLength !== data.byteLength) {
            this.#dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
            this.#viewData = data;
            this.#viewLength = data.byteLength;
        }
        return this.#dataView;
    }
    /**
     * Validate the complete write range before initializing or modifying the staging array.
     * Array indices stop before 0xFFFFFFFF, which is the maximum number[] length.
     * @param {number} bytes The number of staged elements to write.
     * @param {number} offset The destination offset.
     * @throws {RangeError} The write range is not a valid array range.
     */
    #validateWrite(bytes, offset) {
        if (!Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            !Number.isSafeInteger(offset) ||
            offset < 0 ||
            bytes > 0xffffffff - offset) {
            throw new RangeError(`Invalid write range: ${offset} + ${bytes}`);
        }
    }
    /**
     * Creates an instance of DataBuffer.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} [input] The data to process.
     * Omitted input creates an empty writable buffer.
     * @throws {RangeError} The requested numeric length is not a nonnegative safe integer.
     * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
     */
    constructor(input) {
        this.writing = false;
        if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
            debug("constructor: from Buffer");
            this.data = Buffer.from(input);
        }
        else if (typeof input === "string") {
            debug("constructor: from string");
            this.data = new TextEncoder().encode(input);
        }
        else if (input instanceof Uint8Array) {
            debug("constructor: from Uint8Array");
            // Keep the caller's view. SharedArrayBuffer-backed input is copied to retain the existing ownership policy.
            if (input.buffer instanceof ArrayBuffer) {
                this.data = input;
            }
            else {
                this.data = new Uint8Array(input);
            }
        }
        else if (input instanceof ArrayBuffer) {
            debug("constructor: from ArrayBuffer");
            this.data = new Uint8Array(input);
        }
        else if (Array.isArray(input)) {
            debug("constructor: Normal Array");
            this.data = new Uint8Array(input);
        }
        else if (typeof input === "number") {
            debug("constructor: Number (i.e. length)");
            if (!Number.isSafeInteger(input) || input < 0) {
                throw new RangeError(`Invalid buffer length: ${input}`);
            }
            this.data = new Uint8Array(input);
        }
        else if (input instanceof DataBuffer) {
            debug("constructor: from DataBuffer, a shallow copy");
            this.data = input.data;
        }
        else if (ArrayBuffer.isView(input) &&
            "BYTES_PER_ELEMENT" in input &&
            input.buffer instanceof ArrayBuffer) {
            debug("constructor: from typed arrays other than Uint8Array");
            this.data = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        }
        else if (typeof input === "undefined") {
            debug("constructor: empty, creating a new file from scratch");
            this.writing = true;
            this.data = new Uint8Array();
        }
        else {
            const error = `Unknown type of input for DataBuffer: ${typeof input}`;
            debug(error);
            throw new TypeError(error);
        }
        this.lengthInBytes = this.data.length;
        this.next = null;
        this.prev = null;
        // Defined so we can recognize a DataBuffer without importing this module.
        Object.defineProperty(this, DATA_BUFFER_BRAND, { value: true });
        this.nativeEndian = NATIVE_ENDIAN;
        this.offset = 0;
        this._buffer = this.writing ? [] : null;
    }
    /**
     * Buffer for creating new files. Lazy-inits from a copy of data on first write when instance was created read-only.
     * @returns {number[]} The buffer.
     */
    get buffer() {
        if (this._buffer === null) {
            this._buffer = this.data.length ? Array.from(this.data) : [];
        }
        return this._buffer;
    }
    /**
     * Creates an instance of DataBuffer with given size.
     * @param {number} size The size of the requested DataBuffer.
     * @returns {DataBuffer} The new DataBuffer.
     */
    static allocate(size) {
        debug("DataBuffer.allocate:", size);
        return new DataBuffer(size);
    }
    /**
     * Helper to match arrays by returning the data length.
     * @returns {number} The data length of the DataBuffer.
     */
    get length() {
        return this.data.length;
    }
    /**
     * Compares another DataBuffer against the current data buffer at a specified offset.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} input The data to compare against the current DataBuffer.
     * @param {number} [offset] The offset in the current DataBuffer to start comparing, default is 0.
     * @returns {boolean} Returns true when all input bytes match the region at offset, false if there is any difference, the input is empty, or the region is out of bounds.
     */
    compare(input, offset = 0) {
        // debug('compare:', input.length, offset);
        let data;
        if (input instanceof DataBuffer) {
            data = input.data;
        }
        else if (input instanceof Uint8Array) {
            data = input;
        }
        else {
            data = new DataBuffer(input).data;
        }
        const { length } = data;
        if (!length) {
            debug("compare: no input provided");
            return false;
        }
        if (!this.availableAt(length, offset, false)) {
            return false;
        }
        const current = this.data;
        if (data === current && offset === 0) {
            return true;
        }
        for (let i = 0; i < length; i++) {
            if (current[offset + i] !== data[i]) {
                debug("compare: first failed match at", i);
                return false;
            }
        }
        debug("compare: data is the same");
        return true;
    }
    /**
     * Compares input data against the upcoming data, byte by byte.
     * @param {number[] | Buffer | Uint8Array} input The data to check for in upcoming bytes.
     * @returns {boolean} `true` if the data is the upcoming data, `false` if it is not or there is not enough buffer remaining.
     */
    isNextBytes(input) {
        debug("isNextBytes:", input);
        if (!input || typeof input.length !== "number" || input.length === 0) {
            debug("isNextBytes: no input provided");
            return false;
        }
        if (!this.available(input.length, false)) {
            debug(`isNextBytes: Insufficient Bytes: ${input.length} <= ${this.remainingBytes()}`);
            return false;
        }
        debug("isNextBytes: this.offset =", this.offset);
        const off = this.offset;
        for (let i = 0; i < input.length; i++) {
            if (input[i] !== this.data[off + i]) {
                debug("isNextBytes: first failed match at", i, ", where:", input[i], "!==", this.data[off + i]);
                return false;
            }
        }
        return true;
    }
    /**
     * Creates a copy of the current DataBuffer.
     * @returns {DataBuffer} A new copy of the current DataBuffer.
     */
    copy() {
        debug("copy");
        return new DataBuffer(new Uint8Array(this.data));
    }
    /**
     * Creates a copy of the current DataBuffer from a specified offset and a specified length.
     * @param {number} position The starting offset to begin the copy of the new DataBuffer.
     * @param {number} [length] The size of the new DataBuffer, defaults to the current length.
     * @returns {DataBuffer} The new DataBuffer
     */
    slice(position, length = this.length) {
        debug("slice:", position, length);
        if (!Number.isSafeInteger(position) ||
            position < 0 ||
            !Number.isSafeInteger(length) ||
            length < 0) {
            throw new RangeError(`Invalid slice range: ${position} + ${length}`);
        }
        // `subarray` returns a new typed array view on the same ArrayBuffer,
        // `slice`  returns a new typed array (with a new underlying buffer), except for Node Buffer.
        // Copy the selected bytes explicitly so full-range slices and Buffer inputs are also independent.
        return new DataBuffer(new Uint8Array(this.data.subarray(position, position + length)));
    }
    /**
     * Returns the remaining bytes to be read in the DataBuffer.
     * @returns {number} The remaining bytes to bre read in the DataBuffer.
     */
    remainingBytes() {
        return this.length - this.offset;
    }
    /**
     * Checks if a given number of bytes are avaliable in the DataBuffer.
     * If writing mode is enabled, this is true for valid nonnegative integer ranges.
     * Pass false for writing when checking committed bytes for a read.
     * @param {number} bytes The number of bytes to check for.
     * @param {boolean} [writing] Allow growth instead of requiring committed bytes, default is this.writing.
     * @returns {boolean} True if there are the requested amount, or more, of bytes left in the DataBuffer.
     */
    available(bytes, writing = this.writing) {
        return this.availableAt(bytes, this.offset, writing);
    }
    /**
     * Checks if a given number of bytes are avaliable after a given offset in the buffer.
     * If writing mode is enabled, this is true for valid nonnegative integer ranges.
     * Pass false for writing when checking committed bytes for a read.
     * @param {number} bytes The number of bytes to check for.
     * @param {number} offset The offset to start from.
     * @param {boolean} [writing] Allow growth instead of requiring committed bytes, default is this.writing.
     * @returns {boolean} True if there are the requested amount, or more, of bytes left in the stream.
     */
    availableAt(bytes, offset, writing = this.writing) {
        return (Number.isSafeInteger(bytes) &&
            bytes >= 0 &&
            Number.isSafeInteger(offset) &&
            offset >= 0 &&
            (writing ? bytes <= Number.MAX_SAFE_INTEGER - offset : bytes <= this.length - offset));
    }
    /**
     * Advance the offset by a given number of bytes.
     * @param {number} bytes The number of bytes to advance.
     * @throws {RangeError} The byte count or current offset is not a nonnegative safe integer.
     * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
     */
    advance(bytes) {
        debug("advance:", bytes);
        if (!Number.isSafeInteger(bytes) || bytes < 0) {
            throw new RangeError(`Invalid byte count: ${bytes}`);
        }
        if (!Number.isSafeInteger(this.offset) || this.offset < 0) {
            throw new RangeError(`Invalid offset: ${this.offset}`);
        }
        if (!this.available(bytes)) {
            throw new UnderflowError(`Insufficient Bytes: ${bytes} <= ${this.remainingBytes()}`);
        }
        this.offset += bytes;
        debug("advance: offset", this.offset);
    }
    /**
     * Rewind the offset by a given number of bytes.
     * @param {number} bytes The number of bytes to go back.
     * @throws {RangeError} The byte count or current offset is not a nonnegative safe integer.
     * @throws {UnderflowError} Insufficient Bytes in the DataBuffer.
     */
    rewind(bytes) {
        debug("rewind:", bytes);
        if (!Number.isSafeInteger(bytes) || bytes < 0) {
            throw new RangeError(`Invalid byte count: ${bytes}`);
        }
        if (!Number.isSafeInteger(this.offset) || this.offset < 0) {
            throw new RangeError(`Invalid offset: ${this.offset}`);
        }
        if (bytes > this.offset) {
            throw new UnderflowError(`Insufficient Bytes: ${bytes} > ${this.offset}`);
        }
        this.offset -= bytes;
        debug("rewind: offset", this.offset);
    }
    /**
     * Go to a specified offset in the stream.
     * @param {number} position The offset to go to.
     * @throws {RangeError} The requested position or current offset is not a nonnegative safe integer.
     */
    seek(position) {
        debug(`seek: from ${this.offset} to ${position}`);
        if (!Number.isSafeInteger(position) || position < 0) {
            throw new RangeError(`Invalid position: ${position}`);
        }
        if (!Number.isSafeInteger(this.offset) || this.offset < 0) {
            throw new RangeError(`Invalid offset: ${this.offset}`);
        }
        if (position === this.offset && !this.available(0)) {
            throw new UnderflowError(`Insufficient Bytes: 0 <= ${this.remainingBytes()}`);
        }
        if (position > this.offset) {
            this.advance(position - this.offset);
        }
        if (position < this.offset) {
            this.rewind(this.offset - position);
        }
        debug(`seek: offset is ${this.offset}`);
    }
    /**
     * Read from the current offset and return the value.
     * @returns {number} The UInt8 value at the current offset.
     * @throws {UnderflowError} Insufficient Bytes in the stream.
     */
    readUInt8() {
        if (!this.available(1, false)) {
            throw new UnderflowError("Insufficient Bytes: 1");
        }
        const output = this.data[this.offset];
        this.offset += 1;
        return output;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @returns {number} The UInt8 value at the current offset.
     * @throws {UnderflowError} Insufficient Bytes in the stream.
     */
    peekUInt8(offset = 0) {
        if (!this.availableAt(1, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 1`);
        }
        return this.data[offset];
    }
    /**
     * Read from the current offset and return the value.
     * @param {number} bytes The number of bytes to read.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {Uint8Array} The UInt8 value at the current offset.
     */
    read(bytes, littleEndian = false) {
        // debug('read:', bytes, this.offset, littleEndian);
        if (!this.available(bytes, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${bytes}`);
        }
        const start = this.offset;
        if (littleEndian && bytes > 1) {
            const uint8 = new Uint8Array(bytes);
            for (let i = 0; i < bytes; i++) {
                uint8[i] = this.data[start + bytes - 1 - i];
            }
            this.offset += bytes;
            return uint8;
        }
        const uint8 = new Uint8Array(this.data.subarray(start, start + bytes));
        this.offset += bytes;
        return uint8;
    }
    /**
     * Read from the provided offset and return the value.
     * @param {number} bytes The number of bytes to read.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {Uint8Array} The UInt8 value at the current offset.
     */
    peek(bytes, offset = 0, littleEndian = false) {
        // debug('peek:', bytes, offset, littleEndian);
        if (!this.availableAt(bytes, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + ${bytes}`);
        }
        if (littleEndian && bytes > 1) {
            const uint8 = new Uint8Array(bytes);
            for (let i = 0; i < bytes; i++) {
                uint8[i] = this.data[offset + bytes - 1 - i];
            }
            return uint8;
        }
        return new Uint8Array(this.data.subarray(offset, offset + bytes));
    }
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
    peekBit(position, length = 1, offset = 0) {
        // debug('peekBit:', position, length, offset);
        if (Number.isNaN(position) || !Number.isInteger(position) || position < 0 || position > 7) {
            throw new Error(`peekBit position is invalid: ${position}, must be an Integer between 0 and 7`);
        }
        if (Number.isNaN(length) || !Number.isInteger(length) || length < 1 || length > 8) {
            throw new Error(`peekBit length is invalid: ${length}, must be an Integer between 1 and 8`);
        }
        const value = this.peekUInt8(offset);
        return ((value << position) & 0xff) >>> (8 - length);
    }
    /**
     * Read from the current offset and return the value.
     * @returns {number} The Int8 value at the current offset.
     */
    readInt8() {
        if (!this.available(1, false)) {
            throw new UnderflowError("Insufficient Bytes: 1");
        }
        const v = this.#view.getInt8(this.offset);
        this.offset += 1;
        return v;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @returns {number} The Int8 value at the current offset.
     */
    peekInt8(offset = 0) {
        if (!this.availableAt(1, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 1`);
        }
        return this.#view.getInt8(offset);
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt16 value at the current offset.
     */
    readUInt16(littleEndian = false) {
        if (!this.available(2, false)) {
            throw new UnderflowError("Insufficient Bytes: 2");
        }
        const v = this.#view.getUint16(this.offset, littleEndian);
        this.offset += 2;
        return v;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int8 value at the current offset.
     */
    peekUInt16(offset = 0, littleEndian = false) {
        if (!this.availableAt(2, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 2`);
        }
        return this.#view.getUint16(offset, littleEndian);
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int16 value at the current offset.
     */
    readInt16(littleEndian = false) {
        if (!this.available(2, false)) {
            throw new UnderflowError("Insufficient Bytes: 2");
        }
        const v = this.#view.getInt16(this.offset, littleEndian);
        this.offset += 2;
        return v;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int16 value at the current offset.
     */
    peekInt16(offset = 0, littleEndian = false) {
        if (!this.availableAt(2, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 2`);
        }
        return this.#view.getInt16(offset, littleEndian);
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt24 value at the current offset.
     */
    readUInt24(littleEndian = false) {
        if (!this.available(3, false)) {
            throw new UnderflowError("Insufficient Bytes: 3");
        }
        const { offset } = this;
        const { data } = this;
        const value = littleEndian
            ? data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)
            : (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
        this.offset += 3;
        return value;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt24 value at the current offset.
     */
    peekUInt24(offset = 0, littleEndian = false) {
        if (!this.availableAt(3, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 3`);
        }
        const { data } = this;
        const value = littleEndian
            ? data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)
            : (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
        return value;
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int24 value at the current offset.
     */
    readInt24(littleEndian = false) {
        if (!this.available(3, false)) {
            throw new UnderflowError("Insufficient Bytes: 3");
        }
        const { offset } = this;
        const { data } = this;
        const value = littleEndian
            ? data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)
            : (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
        this.offset += 3;
        return (value << 8) >> 8;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int24 value at the current offset.
     */
    peekInt24(offset = 0, littleEndian = false) {
        if (!this.availableAt(3, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 3`);
        }
        const { data } = this;
        const value = littleEndian
            ? data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)
            : (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
        return (value << 8) >> 8;
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt32 value at the current offset.
     */
    readUInt32(littleEndian = false) {
        if (!this.available(4, false)) {
            throw new UnderflowError("Insufficient Bytes: 4");
        }
        const v = this.#view.getUint32(this.offset, littleEndian);
        this.offset += 4;
        return v;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The UInt32 value at the current offset.
     */
    peekUInt32(offset = 0, littleEndian = false) {
        if (!this.availableAt(4, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 4`);
        }
        return this.#view.getUint32(offset, littleEndian);
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int32 value at the current offset.
     */
    readInt32(littleEndian = false) {
        if (!this.available(4, false)) {
            throw new UnderflowError("Insufficient Bytes: 4");
        }
        const v = this.#view.getInt32(this.offset, littleEndian);
        this.offset += 4;
        return v;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Int32 value at the current offset.
     */
    peekInt32(offset = 0, littleEndian = false) {
        if (!this.availableAt(4, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 4`);
        }
        return this.#view.getInt32(offset, littleEndian);
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float32 value at the current offset.
     */
    readFloat32(littleEndian = false) {
        if (!this.available(4, false)) {
            throw new UnderflowError("Insufficient Bytes: 4");
        }
        const v = this.#view.getFloat32(this.offset, littleEndian);
        this.offset += 4;
        return v;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float32 value at the current offset.
     */
    peekFloat32(offset = 0, littleEndian = false) {
        if (!this.availableAt(4, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 4`);
        }
        return this.#view.getFloat32(offset, littleEndian);
    }
    /**
     * Read from the current offset and return the Turbo Pascal 48 bit extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float48 value at the current offset.
     */
    readFloat48(littleEndian = false) {
        // float48 expects the exponent first (little-endian byte order), independently of the host.
        const uint8 = this.read(6, !littleEndian);
        return float48(uint8);
    }
    /**
     * Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float48 value at the specified offset.
     */
    peekFloat48(offset = 0, littleEndian = false) {
        // float48 expects the exponent first (little-endian byte order), independently of the host.
        const uint8 = this.peek(6, offset, !littleEndian);
        return float48(uint8);
    }
    /**
     * Read from the current offset and return the value.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float64 value at the current offset.
     */
    readFloat64(littleEndian = false) {
        if (!this.available(8, false)) {
            throw new UnderflowError("Insufficient Bytes: 8");
        }
        const v = this.#view.getFloat64(this.offset, littleEndian);
        this.offset += 8;
        return v;
    }
    /**
     * Read from the specified offset without advancing the offsets and return the value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The Float64 value at the current offset.
     */
    peekFloat64(offset = 0, littleEndian = false) {
        if (!this.availableAt(8, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 8`);
        }
        return this.#view.getFloat64(offset, littleEndian);
    }
    /**
     * Read from the current offset and return the IEEE 80 bit extended float value.
     * @param {boolean} [littleEndian] Reverse the input bytes before conversion, defaults to system value, default is the current nativeEndian value.
     * This legacy flag is retained for compatibility; use readFloatIEEE754 / peekFloatIEEE754 for conventional input-endianness semantics.
     * @returns {number} The Float80 value at the current offset.
     */
    readFloat80(littleEndian = this.nativeEndian) {
        const uint8 = this.read(10, littleEndian);
        return float80(uint8);
    }
    /**
     * Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Reverse the input bytes before conversion, defaults to system value, default is the current nativeEndian value.
     * This legacy flag is retained for compatibility; use readFloatIEEE754 / peekFloatIEEE754 for conventional input-endianness semantics.
     * @returns {number} The Float80 value at the current offset.
     */
    peekFloat80(offset = 0, littleEndian = this.nativeEndian) {
        const uint8 = this.peek(10, offset, littleEndian);
        return float80(uint8);
    }
    /**
     * Read from the current offset and return the IEEE 754 extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The IEEE 754 extended float value at the current offset.
     */
    readFloatIEEE754(littleEndian = false) {
        const uint8 = this.read(10, littleEndian);
        return convertFromIeeeExtended(uint8);
    }
    /**
     * Peek from the specified offset without advancing the offsets and return the IEEE 754 extended float value.
     * May be faulty with large numbers due to float percision.
     * @param {number} [offset] The offset to read from, default is 0.
     * @param {boolean} [littleEndian] Read in Little Endian format, default is false.
     * @returns {number} The IEEE 754 extended float value at the specified offset.
     */
    peekFloatIEEE754(offset = 0, littleEndian = false) {
        const uint8 = this.peek(10, offset, littleEndian);
        return convertFromIeeeExtended(uint8);
    }
    /**
     * Read from the current offset and return the value as a DataBuffer.
     * @param {number} length The number of bytes to read.
     * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
     */
    readBuffer(length) {
        if (!this.available(length, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${length}`);
        }
        const chunk = new DataBuffer(new Uint8Array(this.data.subarray(this.offset, this.offset + length)));
        this.offset += length;
        return chunk;
    }
    /**
     * Read from the specified offset and return the value as a DataBuffer.
     * @param {number} offset The offset to read from.
     * @param {number} length The number of bytes to read.
     * @returns {DataBuffer} The requested number of bytes as a DataBuffer.
     */
    peekBuffer(offset, length) {
        if (!this.availableAt(length, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + ${length}`);
        }
        return new DataBuffer(new Uint8Array(this.data.subarray(offset, offset + length)));
    }
    /**
     * Read from the current offset for a given length and return the value as a string.
     * @param {number|null} [length] The number of bytes to read; omitted reads the remainder, null reads through a null terminator, and zero reads nothing.
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @returns {string} The read value as a string.
     */
    readString(length, encoding = "ascii") {
        debug("readString:", { length, encoding });
        return this.decodeString(this.offset, length, encoding, true);
    }
    /**
     * Read from the specified offset for a given length and return the value as a string.
     * @param {number} offset The offset to read from.
     * @param {number|null} [length] The number of bytes to read; omitted reads the remainder, null reads through a null terminator, and zero reads nothing.
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @returns {string} The read value as a string.
     */
    peekString(offset, length, encoding = "ascii") {
        debug("peekString:", { offset, length, encoding });
        return this.decodeString(offset, length, encoding, false);
    }
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
    decodeString(offset, length, encoding, advance = false) {
        debug("decodeString:", { offset, length, encoding, advance });
        encoding = encoding.toLowerCase();
        if (length === null) {
            return this.decodeNullTerminatedString(offset, encoding, advance);
        }
        if (length === undefined) {
            length = this.length - offset;
        }
        if (!this.availableAt(length, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + ${length}`);
        }
        const end = offset + length;
        const { data } = this;
        /** @type {number[]} */
        const codes = [];
        // Bound each fromCharCode call instead of spreading an entire, potentially very large string.
        const chunks = [];
        switch (encoding) {
            case "ascii":
            case "latin1": {
                while (offset < end) {
                    if (codes.length >= 0x4000) {
                        chunks.push(String.fromCharCode(...codes));
                        codes.length = 0;
                    }
                    const character = data[offset++];
                    codes.push(character);
                }
                break;
            }
            case "utf8":
            case "utf-8": {
                while (offset < end) {
                    if (codes.length >= 0x4000) {
                        chunks.push(String.fromCharCode(...codes));
                        codes.length = 0;
                    }
                    const b1 = data[offset++];
                    let needed = 0;
                    let point = 0;
                    let lower = 0x80;
                    let upper = 0xbf;
                    if (b1 < 0x80) {
                        codes.push(b1);
                        continue;
                    }
                    else if (b1 >= 0xc2 && b1 <= 0xdf) {
                        // one continuation (128 to 2047)
                        needed = 1;
                        point = b1 & 0x1f;
                    }
                    else if (b1 >= 0xe0 && b1 <= 0xef) {
                        // two continuation (2048 to 55295 and 57344 to 65535)
                        needed = 2;
                        point = b1 & 0x0f;
                        if (b1 === 0xe0) {
                            lower = 0xa0;
                        }
                        if (b1 === 0xed) {
                            upper = 0x9f;
                        }
                    }
                    else if (b1 >= 0xf0 && b1 <= 0xf4) {
                        // three continuation (65536 to 1114111)
                        needed = 3;
                        point = b1 & 0x07;
                        if (b1 === 0xf0) {
                            lower = 0x90;
                        }
                        if (b1 === 0xf4) {
                            upper = 0x8f;
                        }
                    }
                    else {
                        codes.push(0xfffd);
                        continue;
                    }
                    let valid = true;
                    for (let i = 0; i < needed; i++) {
                        // Never borrow a continuation byte from the next fixed-width field.
                        // Leave an invalid continuation unconsumed so it can start the next character.
                        if (offset >= end || data[offset] < lower || data[offset] > upper) {
                            valid = false;
                            break;
                        }
                        point = (point << 6) | (data[offset++] & 0x3f);
                        lower = 0x80;
                        upper = 0xbf;
                    }
                    if (!valid) {
                        codes.push(0xfffd);
                    }
                    else if (point < 0x10000) {
                        codes.push(point);
                    }
                    else {
                        // Split into a Surrogate Pair
                        const pt = point - 0x10000;
                        codes.push(0xd800 + (pt >> 10), 0xdc00 + (pt & 0x3ff));
                    }
                }
                break;
            }
            case "utf16-be":
            case "utf16be":
            case "utf16le":
            case "utf16-le":
            case "utf16bom":
            case "utf16-bom": {
                /** @type {boolean} */
                let littleEndian;
                // find endianness
                switch (encoding) {
                    case "utf16be":
                    case "utf16-be": {
                        littleEndian = false;
                        break;
                    }
                    case "utf16le":
                    case "utf16-le": {
                        littleEndian = true;
                        break;
                    }
                    case "utf16bom":
                    case "utf16-bom":
                    default: {
                        littleEndian = false;
                        if (end - offset >= 2) {
                            const bom = (data[offset] << 8) | data[offset + 1];
                            if (bom === 0xfeff || bom === 0xfffe) {
                                littleEndian = bom === 0xfffe;
                                offset += 2;
                            }
                        }
                        // Without a BOM, retain the first code unit and use big-endian byte order.
                        break;
                    }
                }
                /** @type {number} */
                let w1 = 0;
                while (offset < end) {
                    if (codes.length >= 0x4000) {
                        chunks.push(String.fromCharCode(...codes));
                        codes.length = 0;
                    }
                    if (end - offset < 2) {
                        throw new Error("Invalid utf16 sequence.");
                    }
                    w1 = littleEndian
                        ? data[offset] | (data[offset + 1] << 8)
                        : (data[offset] << 8) | data[offset + 1];
                    offset += 2;
                    if (w1 < 0xd800 || w1 > 0xdfff) {
                        codes.push(w1);
                    }
                    else {
                        // Only a high surrogate may begin a pair, and both units must be inside this field.
                        if (w1 > 0xdbff || end - offset < 2) {
                            throw new Error("Invalid utf16 sequence.");
                        }
                        const w2 = littleEndian
                            ? data[offset] | (data[offset + 1] << 8)
                            : (data[offset] << 8) | data[offset + 1];
                        if (w2 < 0xdc00 || w2 > 0xdfff) {
                            throw new Error("Invalid utf16 sequence.");
                        }
                        codes.push(w1, w2);
                        offset += 2;
                    }
                }
                break;
            }
            default: {
                throw new Error(`Unknown Encoding: ${encoding}`);
            }
        }
        const result = chunks.length
            ? chunks.join("") + String.fromCharCode(...codes)
            : String.fromCharCode(...codes);
        if (advance) {
            this.offset = end;
        }
        return result;
    }
    /**
     * Read a null-terminated string from the current offset and advance the offset.
     * A null-terminated string is a sequence of bytes ending with a null byte (0x00).
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @param {number} [nullValue] The byte value that terminates the string, default is 0x00.
     * @returns {string} The read value as a string (without the null terminator).
     */
    readNullTerminatedString(encoding = "ascii", nullValue = 0x00) {
        debug("readNullTerminatedString:", { encoding, nullValue });
        const result = this.decodeNullTerminatedString(this.offset, encoding, true, nullValue);
        return result;
    }
    /**
     * Read a null-terminated string from the specified offset without advancing the offset.
     * A null-terminated string is a sequence of bytes ending with a null byte (0x00).
     * @param {number} offset The offset to read from.
     * @param {string} [encoding] The encoding of the string, default is `ascii`.
     * @param {number} [nullValue] The byte value that terminates the string, default is 0x00.
     * @returns {string} The read value as a string (without the null terminator).
     */
    peekNullTerminatedString(offset, encoding = "ascii", nullValue = 0x00) {
        debug("peekNullTerminatedString:", { offset, encoding, nullValue });
        const result = this.decodeNullTerminatedString(offset, encoding, false, nullValue);
        return result;
    }
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
    decodeNullTerminatedString(offset, encoding, advance, nullValue = 0x00) {
        debug("decodeNullTerminatedString:", { offset, encoding, advance, nullValue });
        encoding = encoding.toLowerCase();
        if (!this.availableAt(0, offset, false)) {
            throw new UnderflowError(`Insufficient Bytes: ${offset} + 0`);
        }
        if (!Number.isInteger(nullValue) || nullValue < 0 || nullValue > 0xff) {
            throw new RangeError(`Invalid null value: ${nullValue}`);
        }
        const start = offset;
        const { data } = this;
        const { length } = data;
        let end = length;
        switch (encoding) {
            case "utf8":
            case "utf-8": {
                // decodeString validates all UTF-8 forms within the bounded bytes before the terminator:
                // one continuation (128 to 2047)
                // two continuation (2048 to 55295 and 57344 to 65535)
                // three continuation (65536 to 1114111)
                // Split into a Surrogate Pair
                // The final step above is performed by decodeString for supplementary code points.
                const terminator = data.indexOf(nullValue, offset);
                if (terminator !== -1) {
                    end = terminator;
                    offset = terminator + 1;
                }
                else {
                    offset = length;
                }
                break;
            }
            case "utf16-be":
            case "utf16be":
            case "utf16-le":
            case "utf16le":
            case "utf16bom":
            case "utf16-bom": {
                while (offset < length - 1) {
                    const b1 = data[offset];
                    const b2 = data[offset + 1];
                    if (b1 === nullValue && b2 === nullValue) {
                        end = offset;
                        offset += 2;
                        break;
                    }
                    offset += 2;
                }
                if (end === length) {
                    // Include any trailing byte so decodeString reports an incomplete UTF-16 code unit.
                    offset = length;
                }
                break;
            }
            case "ascii":
            case "latin1": {
                // For ASCII and Latin-1, retain byte-preserving behavior; unknown encodings throw.
                const terminator = data.indexOf(nullValue, offset);
                if (terminator !== -1) {
                    end = terminator;
                    offset = terminator + 1;
                }
                else {
                    offset = length;
                }
                break;
            }
            default: {
                throw new Error(`Unknown Encoding: ${encoding}`);
            }
        }
        const result = this.decodeString(start, end - start, encoding, false);
        // Advance offset if requested
        // Note: offset already points to the byte AFTER the null terminator
        // because the scan adds its byte width when a terminator is found, or reaches the end of data.
        if (advance) {
            this.offset = offset;
        }
        return result;
    }
    /**
     * Resets the instance offsets to 0.
     */
    reset() {
        debug("reset");
        this.offset = 0;
    }
    /**
     * Writes a single 8 bit byte.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     */
    writeUInt8(data, offset = this.offset, advance = true) {
        debug("writeUInt8:", { data, offset, advance });
        this.#validateWrite(1, offset);
        const buffer = this.buffer;
        buffer[offset] = data;
        if (advance) {
            this.offset = offset + 1;
        }
    }
    /**
     * Writes an unsigned 16 bit value, 2 bytes.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     * @param {boolean} [littleEndian] Endianness of the write order, little Endian when `true`, default is big Endian `false`.
     */
    writeUInt16(data, offset = this.offset, advance = true, littleEndian = false) {
        debug("writeUInt16:", { data, offset, advance, littleEndian });
        this.#validateWrite(2, offset);
        const buffer = this.buffer;
        if (littleEndian) {
            buffer[offset] = data & 0xff;
            buffer[offset + 1] = (data & 0xff00) >> 8;
        }
        else {
            buffer[offset] = (data & 0xff00) >> 8;
            buffer[offset + 1] = data & 0xff;
        }
        if (advance) {
            this.offset = offset + 2;
        }
    }
    /**
     * Writes an unsigned 24 bit value, 3 bytes.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     * @param {boolean} [littleEndian] Endianness of the write order, little Endian when `true`, default is big Endian `false`.
     */
    writeUInt24(data, offset = this.offset, advance = true, littleEndian = false) {
        debug("writeUInt24:", { data, offset, advance, littleEndian });
        this.#validateWrite(3, offset);
        const buffer = this.buffer;
        if (littleEndian) {
            buffer[offset] = data & 0x0000ff;
            buffer[offset + 1] = (data & 0x00ff00) >> 8;
            buffer[offset + 2] = (data & 0xff0000) >> 16;
        }
        else {
            buffer[offset] = (data & 0xff0000) >> 16;
            buffer[offset + 1] = (data & 0x00ff00) >> 8;
            buffer[offset + 2] = data & 0x0000ff;
        }
        if (advance) {
            this.offset = offset + 3;
        }
    }
    /**
     * Writes an unsigned 32 bit value, 4 bytes.
     * @param {number} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     * @param {boolean} [littleEndian] Endianness of the write order, little Endian when `true`, default is big Endian `false`.
     */
    writeUInt32(data, offset = this.offset, advance = true, littleEndian = false) {
        debug("writeUInt32:", { data, offset, advance, littleEndian });
        this.#validateWrite(4, offset);
        const buffer = this.buffer;
        if (littleEndian) {
            buffer[offset] = data & 0x000000ff;
            buffer[offset + 1] = (data & 0x0000ff00) >> 8;
            buffer[offset + 2] = (data & 0x00ff0000) >> 16;
            buffer[offset + 3] = data >>> 24;
        }
        else {
            buffer[offset] = data >>> 24;
            buffer[offset + 1] = (data & 0x00ff0000) >> 16;
            buffer[offset + 2] = (data & 0x0000ff00) >> 8;
            buffer[offset + 3] = data & 0x000000ff;
        }
        if (advance) {
            this.offset = offset + 4;
        }
    }
    /**
     * Write a series of bytes.
     * Wider typed arrays retain the existing element-wise behavior: one staged value per element,
     * converted to a byte by commit(), not the constructor's raw-memory interpretation.
     * @param {number[]|Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array} data The data to write.
     * @param {number} [offset] The offset to write the data to, default is current offset.
     * @param {boolean} [advance] Flag to set the cursor to the supplied offset plus the number of bytes written, default is true; false leaves the cursor unchanged.
     */
    writeBytes(data, offset = this.offset, advance = true) {
        debug("writeBytes:", { data, offset, advance });
        const { length } = data;
        this.#validateWrite(length, offset);
        if (length > 0) {
            const buffer = this.buffer;
            // Snapshot aliased input before an overlapping write can overwrite or extend its source.
            const source = data === buffer ? buffer.slice() : data;
            for (let i = 0; i < length; i++) {
                buffer[offset + i] = source[i];
            }
        }
        if (advance) {
            this.offset = offset + length;
        }
    }
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
    writeString(string, offset = this.offset, encoding = "ascii", advance = true) {
        debug("writeString:", { string, offset, encoding, advance });
        this.#validateWrite(0, offset);
        encoding = encoding.toLowerCase();
        const data = [];
        switch (encoding) {
            case "ascii":
            case "latin1": {
                for (let i = 0; i < string.length; i++) {
                    data.push(string.charCodeAt(i) & 0xff);
                }
                break;
            }
            case "utf8":
            case "utf-8": {
                for (let i = 0; i < string.length; i++) {
                    let charcode = string.charCodeAt(i);
                    if (charcode < 0x80) {
                        data.push(charcode);
                    }
                    else if (charcode < 0x800) {
                        data.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
                    }
                    else if (charcode < 0xd800 || charcode >= 0xe000) {
                        data.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                    }
                    else {
                        const next = string.charCodeAt(i + 1);
                        if (charcode > 0xdbff || !(next >= 0xdc00 && next <= 0xdfff)) {
                            // Match TextEncoder: replace an unpaired surrogate without consuming the next character.
                            data.push(0xef, 0xbf, 0xbd);
                            continue;
                        }
                        i++;
                        // Surrogate Pair
                        // UTF-16 encodes 0x10000-0x10FFFF by subtracting 0x10000 and splitting the 20 bits of 0x0-0xFFFFF into two halves.
                        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (string.charCodeAt(i) & 0x3ff));
                        data.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                    }
                }
                break;
            }
            case "utf16be":
            case "utf16-be":
            case "utf16le":
            case "utf16-le":
            case "utf16bom":
            case "utf16-bom": {
                const littleEndian = encoding === "utf16le" || encoding === "utf16-le";
                if (encoding === "utf16bom" || encoding === "utf16-bom") {
                    // Emit the big-endian BOM expected by the BOM-aware decoder.
                    data.push(0xfe, 0xff);
                }
                for (let i = 0; i < string.length; i++) {
                    const charcode = string.charCodeAt(i);
                    if (littleEndian) {
                        data.push(charcode & 0xff, (charcode / 256) >>> 0);
                    }
                    else {
                        data.push((charcode / 256) >>> 0, charcode & 0xff);
                    }
                }
                break;
            }
            default: {
                throw new Error(`Unknown Encoding: ${encoding}`);
            }
        }
        debug("writeString: data", data);
        this.writeBytes(data, offset, advance);
    }
    /**
     * Convert a write mode file into a read mode file.
     */
    commit() {
        debug("commit: converting to read mode file");
        this.data = new Uint8Array(this.buffer);
        this.lengthInBytes = this.data.length;
        // Release the old backing store even when the next operation is not a numeric read.
        this.#dataView = null;
        this.#viewData = null;
        this.#viewLength = -1;
        this._buffer = null;
        this.writing = false;
    }
}
export default DataBuffer;
//# sourceMappingURL=data-buffer.js.map