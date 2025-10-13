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
    data?: number[] | Uint8Array;
};
/**
 * IPS is a simple format for binary file patches, popular in the ROM hacking community
 * "IPS" allegedly stands for "International Patching System".
 * FuSoYa's LunarIPS extension that writes beyond EOF to support a "cut" / truncate command is also supported.
 */
declare class IPS extends DataBuffer {
    /**
     * Calculate the difference between two DataBuffers and save it as an IPS patch.
     *
     * @static
     * @param {DataBuffer} original The original file to compare against.
     * @param {DataBuffer} modified The modified file.
     * @returns {IPS} The IPS patch file data as a Buffer.
     */
    static createIPSFromDataBuffers(original: DataBuffer, modified: DataBuffer): IPS;
    /**
     * Creates an instance of IPS.
     *
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
     *
     * @returns {DataBuffer} - The new IPS file as a Buffer.
     */
    encode(): DataBuffer;
    /**
     * Apply the IPS patch to an input DataBuffer.
     *
     * @param {DataBuffer} input The binary to patch.
     * @returns {DataBuffer} The patched binary.
     */
    apply(input: DataBuffer): DataBuffer;
}
import DataBuffer from '@uttori/data-tools/data-buffer';
//# sourceMappingURL=data-patch-ips.d.ts.map