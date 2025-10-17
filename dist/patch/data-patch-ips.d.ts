/**
 * A chunk of IPS data.
 * @typedef {object} IPSChunk
 * @property {number} offset 3 bytes. The starting offset of the change.
 * @property {number} length The length of the change.
 * @property {number} [rle] The type of change, value is not undefined when Run Length Encoding is being used.
 * @property {number[]} [data] The data to be used for the change when not RLE.
 */
/** @type {number} The maximum size of a file in the IPS format, 16 megabytes. */
export const IPS_MAX_SIZE: number;
export default IPS;
/**
 * A chunk of IPS data.
 */
export type IPSChunk = {
    /**
     * 3 bytes. The starting offset of the change.
     */
    offset: number;
    /**
     * The length of the change.
     */
    length: number;
    /**
     * The type of change, value is not undefined when Run Length Encoding is being used.
     */
    rle?: number;
    /**
     * The data to be used for the change when not RLE.
     */
    data?: number[];
};
/**
 * IPS as a format is a simple format for binary file patches, popular in the ROM hacking community
 * "IPS" allegedly stands for "International Patching System".
 * FuSoYa's LunarIPS extension that writes beyond EOF to support a "cut" / truncate command is also supported.
 * IPS as a class can be used to:
 * - Parse IPS patch and apply to file
 * - Create IPS from file and modified file
 * - Debug IPS patch
 * An IPS file starts with the magic number "PATCH" (50 41 54 43 48), followed by a series of hunks and an end-of-file marker "EOF" (45 4f 46).
 * All numerical values are unsigned and stored big-endian.
 *
 * Regular hunks consist of a three-byte offset followed by a two-byte length of the payload and the payload itself.
 * Applying the hunk is done by writing the payload at the specified offset.
 *
 * RLE hunks have their length field set to zero; in place of a payload there is a two-byte length of the run followed by a single byte indicating the value to be written.
 * Applying the RLE hunk is done by writing this byte the specified number of times at the specified offset.
 *
 * As an extension, the end-of-file marker may be followed by a three-byte length to which the resulting file should be truncated.
 * Not every patching program will implement this extension, however.
 * @see {@link http://fileformats.archiveteam.org/wiki/IPS_(binary_patch_format)}
 */
declare class IPS extends DataBuffer {
    /**
     * Calculate the difference between two DataBuffers and save it as an IPS patch.
     * @static
     * @param {DataBuffer} original The original file to compare against.
     * @param {DataBuffer} modified The modified file.
     * @returns {IPS} The IPS patch file data as a Buffer.
     */
    static createIPSFromDataBuffers(original: DataBuffer, modified: DataBuffer): IPS;
    /**
     * Creates an instance of IPS.
     * @param {Array|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} input The data to process.
     * @param {boolean} [parse] Whether to immediately parse the IPS file. Default is true.
     * @throws {TypeError} Missing input data.
     * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
     * @class
     */
    constructor(input?: any[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array, parse?: boolean);
    /** @type {IPSChunk[]} The changed to be made. */
    hunks: IPSChunk[];
    /** @type {number} The 3 byte length the file should be truncated to. */
    truncate: number;
    /**
     * Parse the IPS file, decoding the hunks.
     */
    parse(): void;
    /**
     * Decodes and validates IPS Header.
     *
     * The header takes up the first five bytes of the file.
     * These bytes should all correspond to ASCII character codes.
     *
     * Signature (Decimal): [80, 65, 84, 67, 72]
     * Signature (Hexadecimal): [50, 41, 54, 43, 48]
     * Signature (ASCII): [P, A, T, C, H]
     *
     * @throws {Error} Missing or invalid IPS header
     */
    decodeHeader(): void;
    /**
     * Convert the current instance to an IPS file Buffer instance.
     * @returns {DataBuffer} The new IPS file as a Buffer.
     */
    encode(): DataBuffer;
    /**
     * Apply the IPS patch to an input DataBuffer.
     * @param {DataBuffer} input The binary to patch.
     * @returns {DataBuffer} The patched binary.
     */
    apply(input: DataBuffer): DataBuffer;
}
import DataBuffer from '@uttori/data-tools/data-buffer';
//# sourceMappingURL=data-patch-ips.d.ts.map