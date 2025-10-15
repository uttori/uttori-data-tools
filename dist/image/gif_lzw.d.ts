export default GIFLZW;
/**
 * GIF LZW Compression
 * The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.
 * @class
 */
declare class GIFLZW {
    /**
     * Creates a new GIFLZW instance.
     * @param {number[]} input The input data
     */
    constructor(input?: number[]);
    input: number[];
    /** @type {number[]} */
    output: number[];
    offset: number;
    bitOffset: number;
    /**
     * Initialize the compression or decompression dictionary based on the code size.
     * @param {number} size Size of lookup, `(1 << Code Size) + 2`, the extra two are Clear Code & End of Information
     * @param {boolean} [compress] Type of dictionary returned, compression when true, decompression when false. Defaults to true.
     * @returns {Record<number|string, number|string>} The built to size dictionary.
     */
    buildDictionary(size: number, compress?: boolean): Record<number | string, number | string>;
    /**
     * Pack the colors as a series of bits, based on the codeSize.
     * @param {number} codeLength The code length
     * @param {number} code The code
     */
    pack(codeLength: number, code: number): void;
    /**
     * Unpack
     * @param {number} codeLength Code Length
     * @param {boolean} [useInput] Unpacking the `input` or the `output`. Defaults to true.
     * @returns {number} The unpacked code
     */
    unpack(codeLength: number, useInput?: boolean): number;
    /**
     * Compress data.
     * @param {number} codeSize Code Size
     * @returns {number[]} The compressed output
     */
    compress(codeSize: number): number[];
    /**
     * Decompress data.
     * @param {number} codeSize Code Size
     * @param {boolean} [useInput] Unpacking the `input` or the `output`. Defaults to true.
     * @returns {string} The decompressed output
     */
    decompress(codeSize: number, useInput?: boolean): string;
}
//# sourceMappingURL=gif_lzw.d.ts.map