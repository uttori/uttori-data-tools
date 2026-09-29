/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */
/**
 * GIF LZW Compression
 * The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.
 * @class
 */
declare class GIFLZW {
    /** The input data. */
    input: number[];
    /** The output data. */
    output: number[];
    /** The current offset in the output data. */
    offset: number;
    /** The current bit offset in the output data. */
    bitOffset: number;
    /**
     * Creates a new GIFLZW instance.
     * @param input The input data
     */
    constructor(input?: number[]);
    /**
     * Initialize the compression or decompression dictionary based on the code size.
     * @param size Size of lookup, `(1 << Code Size) + 2`, the extra two are Clear Code & End of Information
     * @param compress Type of dictionary returned, compression when true, decompression when false. Defaults to true.
     * @returns The built to size dictionary.
     */
    buildDictionary(size: number, compress?: boolean): Record<number | string, number | string>;
    /**
     * Pack the colors as a series of bits, based on the codeSize.
     * @param codeLength The code length
     * @param code The code
     */
    pack(codeLength: number, code: number): void;
    /**
     * Unpack
     * @param codeLength Code Length
     * @param useInput Unpacking the `input` or the `output`. Defaults to true, using the input.
     * @returns The unpacked code
     */
    unpack(codeLength: number, useInput?: boolean): number;
    /**
     * Compress data.
     * @param codeSize Code Size
     * @returns The compressed output
     */
    compress(codeSize: number): number[];
    /**
     * Decompress data.
     * @param codeSize Code Size
     * @param useInput Unpacking the `input` or the `output`. Defaults to true.
     * @returns The decompressed output
     */
    decompress(codeSize: number, useInput?: boolean): string;
}
export default GIFLZW;
//# sourceMappingURL=gif_lzw.d.ts.map