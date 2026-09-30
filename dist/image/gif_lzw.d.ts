/** Bounds for one complete GIF LZW operation. */
export interface GIFLZWOptions {
    readonly maxInputBytes?: number;
    readonly maxOutputBytes?: number;
    /** Require exactly this many decoded indexes, including zero for an empty stream. */
    readonly expectedLength?: number;
    /** Ignore complete bytes following EOI; unused bits in its final byte are always allowed. */
    readonly allowTrailingBytes?: boolean;
}
/**
 * GIF LZW Compression
 * The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.
 *
 * Byte APIs avoid string dictionaries and per-bit loops. Complete operations rewind
 * their cursor automatically; pack()/unpack() still advance the public cursor.
 * @class
 */
declare class GIFLZW {
    /** The input data. */
    input: number[] | Uint8Array;
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
    constructor(input?: number[] | Uint8Array);
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
     * @param options Input and output allocation limits.
     * @returns The compressed output
     */
    compress(codeSize: number, options?: GIFLZWOptions): number[];
    /**
     * Compress native indexes directly to bytes without an intermediate number array.
     * @param codeSize GIF minimum code size, two through eight.
     * @param options Input and output allocation limits.
     * @returns An owned, unframed GIF LZW stream, including clear and EOI codes.
     */
    compressBytes(codeSize: number, options?: GIFLZWOptions): Uint8Array;
    /**
     * Decompress data.
     * @param codeSize Code Size
     * @param useInput Unpacking the `input` or the `output`. Defaults to true.
     * @param options Allocation limits, exact decoded length, and trailing-byte policy.
     * @returns The decompressed output
     */
    decompress(codeSize: number, useInput?: boolean, options?: GIFLZWOptions): string;
    /**
     * Decode with a fixed 4096-entry prefix/suffix dictionary and a bounded output buffer.
     * @param codeSize GIF minimum code size, two through eight.
     * @param useInput Read input, or the compatibility compress() output.
     * @param options Allocation limits, exact decoded length, and trailing-byte policy.
     * @returns Owned row-order indexes; GIF interlacing belongs to the image container.
     */
    decompressBytes(codeSize: number, useInput?: boolean, options?: GIFLZWOptions): Uint8Array;
}
export default GIFLZW;
//# sourceMappingURL=gif_lzw.d.ts.map