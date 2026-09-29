import DataBuffer from "../data-buffer.js";
import { RgbaSurface } from "./rgba-surface.js";
import type { IndexedInput, IndexedPixels, RGBA, RgbaImage } from "./types.js";
export interface PngChunk {
    readonly type: string;
    readonly offset: number;
    readonly end: number;
    readonly length: number;
    readonly data: Uint8Array;
    readonly raw: Uint8Array;
    readonly critical: boolean;
    readonly safeToCopy: boolean;
}
export interface Bounds {
    readonly maxInputBytes?: number;
    readonly maxPixels?: number;
    readonly maxInflatedBytes?: number;
    readonly maxOutputBytes?: number;
    readonly maxChunks?: number;
}
export interface DecodeOptions extends Bounds {
    readonly copyInput?: boolean;
    readonly allow16Bit?: boolean;
    readonly animation?: "reject" | "default-image";
}
export interface EncodeOptions extends Bounds {
    readonly filter?: "none" | "sub" | "adaptive";
    readonly level?: number;
}
export interface IndexedEncodeOptions extends EncodeOptions {
    readonly bitDepth?: IndexedDepth;
}
export interface RewriteOptions extends DecodeOptions, EncodeOptions {
    /** Optional synchronous application policy. Must not mutate the supplied pixels. Throw to reject. */
    readonly validateIndexed?: (image: IndexedPixels) => void;
}
/** The depth of indexed pixels. */
export type IndexedDepth = 1 | 2 | 4 | 8;
export interface IndexedImage extends IndexedInput {
    readonly kind: "indexed-image";
    readonly sourceBitDepth: IndexedDepth;
}
export interface IndexedPngEdit {
    readonly palette?: readonly RGBA[];
    readonly indexes?: Uint8Array;
    readonly dimensions?: {
        readonly width: number;
        readonly height: number;
    };
    readonly preserveChunks?: readonly string[];
}
/** File inputs supported by DataBuffer; allocation lengths are not PNG file data. */
export type PngInput = number[] | ArrayBuffer | ArrayBufferView | DataBuffer | number | string;
/** One native sample or index per element; 16-bit samples retain their precision. */
export type PngPixels = Uint8Array | Uint16Array;
/**
 * PNG Decoder
 *
 * Also supports indexed editing and indexed/RGBA8 encoding.
 * Native samples and rendering remain distinct:
 * depths 1/2/4/8 use one Uint8Array element per sample or palette index,
 * depth 16 uses one Uint16Array element per sample.
 * Duplicate palette colors retain separate slots. Use toRGBA() explicitly for rendering.
 *
 * Input is copied by default. With `copyInput: false`,
 * you must not mutate the borrowed bytes while the instance is in use.
 * Chunk payloads are read-only views by convention.
 * Native pixels are decoded lazily and cached after success.
 * @see {@link http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html|Chunk Specifications}
 * @see {@link https://ucnv.github.io/pnglitch/|The Art of PNG Glitch}
 * @see {@link http://www.schaik.com/pngsuite/|PngSuite, test-suite for PNG}
 * @see {@link http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html|Chunk Specifications (LibPNG)}
 * @see {@link https://www.w3.org/TR/PNG-Chunks.html|Chunk Specifications (W3C)}
 * @see {@link http://www.simplesystems.org/libpng/FFFF/|PNGs containing a chunk with length 0xffffffff}
 * @see {@link https://news.ycombinator.com/item?id=27579759|PNG files can be animated via network latency}
 * @see {@link https://github.com/jsummers/tweakpng|TweakPNG}
 * @example <caption>new ImagePNG(list, options)</caption>
 * const image_data = await FileUtility.readFile('./test/assets/PngSuite', 'oi1n0g16', 'png', null);
 * const image = ImagePNG.fromFile(image_data);
 * image.decodePixels();
 * const length = image.pixels.length;
 * // One element per native sample, including 16-bit samples.
 * const pixel = image.getPixel(0, 0);
 *  ➜ [255, 255, 255, 255]
 * @class
 * @augments DataBuffer
 */
declare class ImagePNG extends DataBuffer {
    /** Pixel Width */
    width: number;
    /** Pixel Height */
    height: number;
    /** Image Bit Depth, one of: 1, 2, 4, 8, 16 */
    bitDepth: number;
    /** Defines pixel structure, one of: 0, 2, 3, 4, 6 */
    colorType: number;
    /** Type of compression, always 0 */
    compressionMethod: number;
    /** Type of filtering, always 0 */
    filterMethod: number;
    /** Type of interlacing, one of: 0, 1 */
    interlaceMethod: number;
    /** Number of native samples per pixel, not the number of packed bytes. */
    colors: number;
    /** True when the image has an alpha transparency layer */
    alpha: boolean;
    /** Raw Color data */
    palette: Uint8Array;
    /** Row-major native samples, with one element per sample or index. */
    pixels: PngPixels;
    /** Raw Transparency data */
    transparency: Uint8Array;
    /** Object containing physical dimension information */
    physical: {
        width: number;
        height: number;
        unit: number;
    };
    /** Image Data pieces */
    dataChunks: Uint8Array[];
    /** PNG Signature from the data */
    header: Uint8Array;
    /** Validated chunks, including views of their original framing and CRC. */
    chunks: PngChunk[];
    /** Whether animation chunks were found under the explicit default-image policy. */
    animated: boolean;
    /** Decoder policies captured at construction. */
    readonly options: Readonly<DecodeOptions>;
    /** True when the image has been decoded */
    _decoded: boolean;
    /** Validated allocation bounds, reused for parsing and decoding. */
    private readonly _limits;
    /** Chunk names used for singleton and ordering checks. */
    private readonly _seenChunks;
    /** Whether a non-IDAT chunk has ended the contiguous IDAT sequence. */
    private _dataEnded;
    /**
     * Creates a new ImagePNG.
     *
     * The container is validated immediately; native pixels are decoded on demand.
     * @param input The data to process.
     * @param options Ownership, allocation limits, and format policies.
     * @throws {Error} Signature, framing, CRC, ordering, or metadata are invalid.
     */
    constructor(input: PngInput, options?: DecodeOptions);
    /**
     * Creates a new ImagePNG from file data.
     *
     * The container is validated immediately; native pixels are decoded on demand.
     * @param data The data of the image to process.
     * @param options Ownership, allocation limits, and format policies.
     * @returns {ImagePNG} the new ImagePNG instance for the provided file data
     * @static
     */
    static fromFile(data: PngInput, options?: DecodeOptions): ImagePNG;
    /**
     * Creates a new ImagePNG from a DataBuffer.
     *
     * The container is validated immediately; native pixels are decoded on demand.
     * @param buffer The DataBuffer of the image to process.
     * @param options Ownership, allocation limits, and format policies.
     * @returns the new ImagePNG instance for the provided DataBuffer
     * @static
     */
    static fromBuffer(buffer: DataBuffer, options?: DecodeOptions): ImagePNG;
    /**
     * Sets the bitDepth on the ImagePNG instance.
     *
     * Discard samples decoded with the old layout. The complete color/depth
     * combination is checked before decoding.
     * @param bitDepth The bitDepth to set, one of: 1, 2, 4, 8, 16
     * @throws {Error} The depth is invalid or disabled by caller policy.
     */
    setBitDepth(bitDepth: number): void;
    /**
     * Sets the colorType on the ImagePNG instance.
     * Both color and alpha properties are inferred from the colorType.
     *
     * | Color Type | Allowed Bit Depths | Interpretation |
     * |------------|--------------------|----------------|
     * | 0          | 1, 2, 4, 8, 16     | Each pixel is a grayscale sample.
     * | 2          | 8, 16              | Each pixel is an R, G, B triple.
     * | 3          | 1, 2, 4, 8         | Each pixel is a palette index; a `PLTE` chunk must appear.
     * | 4          | 8, 16              | Each pixel is a grayscale sample, followed by an alpha sample.
     * | 6          | 8, 16              | Each pixel is an R, G, B triple, followed by an alpha sample.
     *
     * Discard samples decoded with the old layout.
     * @param colorType The colorType to set, one of: 0, 2, 3, 4, 6
     * @throws {Error} Invalid Color Type, anything other than 0, 2, 3, 4, 6
     */
    setColorType(colorType: number): void;
    /**
     * Sets the compressionMethod on the ImagePNG instance.
     * The compressionMethod should always be 0.
     * @param compressionMethod The compressionMethod to set, always 0
     * @throws {Error} Unsupported Compression Method, anything other than 0
     */
    setCompressionMethod(compressionMethod: number): void;
    /**
     * Sets the filterMethod on the ImagePNG instance.
     * The filterMethod should always be 0.
     * @param filterMethod The filterMethod to set, always 0
     * @throws {Error} Unsupported Filter Method, anything other than 0
     */
    setFilterMethod(filterMethod: number): void;
    /**
     * Sets the interlaceMethod on the ImagePNG instance.
     * The interlaceMethod should always be 0 or 1.
     *
     * Discard samples decoded with the old layout.
     * @param interlaceMethod The interlaceMethod to set, always 0 or 1
     * @throws {Error} Unsupported Interlace Method, anything other than 0 or 1
     */
    setInterlaceMethod(interlaceMethod: number): void;
    /**
     * Sets the palette on the ImagePNG instance.
     *
     * Palette slots retain their identity; duplicate RGB triples are not deduplicated.
     * @param palette The palette to set
     * @throws {Error} No colors in the palette
     * @throws {Error} Too many colors for the current bit depth
     * @throws {Error} Components, transparency length, or referenced slots are invalid.
     */
    setPalette(palette: number[] | Uint8Array): void;
    /** Discard decoded native samples without changing the original compressed IDAT data. */
    invalidatePixels(): void;
    /**
     * Parse the PNG file, decoding the supported chunks.
     *
     * Start from the beginning and reset metadata and cached samples.
     * @returns This image.
     * @throws {Error} Required chunks are missing or any chunk fails validation.
     */
    parse(): this;
    /**
     * Decodes and validates PNG Header.
     * Signature (Decimal): [137, 80, 78, 71, 13, 10, 26, 10]
     * Signature (Hexadecimal): [89, 50, 4E, 47, 0D, 0A, 1A, 0A]
     * Signature (ASCII): [\211, P, N, G, \r, \n, \032, \n]
     * @throws {Error} Missing or invalid PNG header
     * @throws {Error} The header is not being read from offset zero.
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature|PNG Signature}
     */
    decodeHeader(): void;
    /**
     * Decodes the chunk type, and attempts to parse that chunk if supported.
     * Supported Chunk Types: IHDR, PLTE, IDAT, IEND, tRNS, pHYs
     *
     * Chunk Structure:
     * Length: 4 bytes
     * Type:   4 bytes (IHDR, PLTE, IDAT, IEND, etc.)
     * Chunk:  {length} bytes
     * CRC:    4 bytes
     *
     * Validate CRCs, chunk ordering, and bounds before dispatching.
     * Ancillary records retain their original framing for indexed rewriting.
     * @returns {string} Chunk Type
     * @throws {Error} Invalid chunk length, CRC, ordering, or critical chunk type.
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout|Chunk Layout}
     */
    decodeChunk(): string;
    /**
     * Decode the IHDR (Image header) chunk.
     * Should be the first chunk in the data stream.
     *
     * Width:              4 bytes
     * Height:             4 bytes
     * Bit Depth:          1 byte
     * Colour Type:        1 byte
     * Compression Method: 1 byte
     * Filter Method:      1 byte
     * Interlace Method:   1 byte
     * @param chunk Data Blob
     * @throws {Error} Dimensions, sample layout, or PNG methods are invalid.
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR|Image Header}
     * @see {@link http://www.libpng.org/pub/png/spec/1.2/png-1.2-pdg.html#C.IHDR|Image Header}
     */
    decodeIHDR(chunk: Uint8Array): void;
    /**
     * Decode the PLTE (Palette) chunk.
     * The PLTE chunk contains from 1 to 256 palette entries, each a three-byte series of the form.
     * The number of entries is determined from the chunk length. A chunk length not divisible by 3 is an error.
     *
     * Preserve the original palette slot order, including duplicate colors.
     * @param chunk Data Blob
     * @see {@link http://www.w3.org/TR/PNG/#11PLTE|Palette}
     */
    decodePLTE(chunk: Uint8Array): void;
    /**
     * Decode the IDAT (Image Data) chunk.
     * The IDAT chunk contains the actual image data which is the output stream of the compression algorithm.
     *
     * Retain a payload view for bounded inflation on demand and invalidate cached
     * samples. Empty IDAT chunks are legal.
     * @param chunk Data Blob
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT|Image Data}
     */
    decodeIDAT(chunk: Uint8Array): void;
    /**
     * Decode the tRNS (Transparency) chunk.
     * The tRNS chunk specifies that the image uses simple transparency: either alpha values associated with palette entries (for indexed-color images) or a single transparent color (for grayscale and truecolor images). Although simple transparency is not as elegant as the full alpha channel, it requires less storage space and is sufficient for many common cases.
     * @param chunk Data Blob
     * @throws {Error} Transparency is incompatible with the color type or sample depth.
     * @see {@link https://www.w3.org/TR/PNG/#11tRNS|Transparency}
     */
    decodeTRNS(chunk: Uint8Array): void;
    /**
     * Decode the pHYs (Pixel Dimensions) chunk.
     * The pHYs chunk specifies the intended pixel size or aspect ratio for display of the image.
     * When the unit specifier is 0, the pHYs chunk defines pixel aspect ratio only; the actual size of the pixels remains unspecified.
     * If the pHYs chunk is not present, pixels are assumed to be square, and the physical size of each pixel is unspecified.
     *
     * Structure:
     * Pixels per unit, X axis: 4 bytes (unsigned integer)
     * Pixels per unit, Y axis: 4 bytes (unsigned integer)
     * Unit specifier:          1 byte
     * 0: unit is unknown
     * 1: unit is the meter
     *
     * Keep the raw pixels-per-unit values. When unit is 1, multiplying by 0.0254
     * converts pixels per meter to pixels per inch without changing stored metadata.
     * @param chunk Data Blob
     * @throws {Error} The length or unit specifier is invalid.
     * @see {@link https://www.w3.org/TR/PNG/#11pHYs|Pixel Dimensions}
     */
    decodePHYS(chunk: Uint8Array): void;
    /**
     * Decode the IEND (Image trailer) chunk.
     * The IEND chunk marks the end of the PNG DataBuffer. The chunk's data field is empty.
     * @param chunk The IEND payload, which must have no bytes.
     * @throws {Error} IEND contains data.
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND|Image Trailer}
     */
    decodeIEND(chunk: Uint8Array): void;
    /**
     * Measure the exact decompressed layout, including filter bytes for each pass.
     * @param interlaceMethod The layout to measure; defaults to the current IHDR value.
     * @returns Expected filtered scanline byte count.
     * @throws {Error} The layout is invalid or exceeds the inflation limit.
     */
    private _expectedInflatedBytes;
    /**
     * Uncompress IDAT chunks.
     *
     * Reverse scanline filters and unpack native samples after bounded inflation.
     * Successful decodes are cached. Forcing a decode discards in-memory pixel edits
     * and reconstructs the source IDAT; failures never expose partial pixel buffers.
     * @param options Cache control for this decode.
     * @param options.force Discard cached samples and decode the source again.
     * @returns Row-major native samples, retaining original palette indexes.
     * @throws {Error} No IDAT chunks to decode
     * @throws {Error} Deinterlacing Error
     * @throws {Error} Inflating Error
     * @throws {Error} Compressed data, scanline lengths, filters, or indexes are invalid.
     */
    decodePixels({ force }?: {
        readonly force?: boolean;
    }): PngPixels;
    /**
     * Deinterlace with no interlacing.
     * @param data Data to deinterlace.
     * @returns Native samples, also stored in pixels on success.
     * @see {@link https://www.w3.org/TR/PNG-Filters.html|PNG Filters}
     */
    interlaceNone(data: Uint8Array): PngPixels;
    /**
     * Deinterlace with Adam7 interlacing.
     * Adam7 divides the image into 7 passes with different starting positions and step sizes.
     *
     * Empty passes consume neither filter bytes nor row bytes. Scatter decoded
     * samples into row-major image order without converting palette indexes.
     * @param data Data to deinterlace.
     * @returns Native samples, also stored in pixels on success.
     * @see {@link https://www.w3.org/TR/PNG/#8Interlace|PNG Adam7 Interlacing}
     * @see {@link https://github.com/em2046/lens/blob/master/assets/js/interlace.js}
     * @see {@link https://github.com/em2046/aperture/tree/master/lib/png/chunks}
     * @see {@link https://github.com/beejjorgensen/jsmandel/blob/master/src/js/adam7.js}
     * @see {@link http://diyhpl.us/~yenatch/pokecrystal/src/pypng/code/png.py}
     * @see {@link https://github.com/SixLabors/ImageSharp/blob/master/src/ImageSharp/Formats/Png/Adam7.cs}
     */
    interlaceAdam7(data: Uint8Array): PngPixels;
    /**
     * Share row reconstruction and native sample unpacking across interlace modes.
     * @param data Exact filtered scanline bytes.
     * @param interlaceMethod Zero for the full image, or one for Adam7 passes.
     * @returns The fully reconstructed native sample buffer.
     */
    private _decodeScanlines;
    /**
     * Get indexed pixels without flattening duplicate palette colors.
     * @param options Index-buffer ownership.
     * @param options.copy False to borrow decoded indexes; defaults to true.
     * @returns Native indexes, newly expanded RGBA slots, and original index depth.
     * @throws {Error} The source is not indexed.
     */
    toIndexed({ copy }?: {
        readonly copy?: boolean;
    }): IndexedImage;
    /**
     * Convert native samples to straight-alpha RGBA8 for rendering.
     * Sixteen-bit values are rounded to the nearest eight-bit value after testing
     * native transparency keys. Native samples and indexes remain unchanged.
     * @param options Output-buffer ownership for an RGBA8 source.
     * @param options.copy False to share existing RGBA8 samples; defaults to true.
     * @returns The RGBA surface; other source formats always require a new buffer.
     */
    toRGBA({ copy }?: {
        readonly copy?: boolean;
    }): RgbaSurface;
    /**
     * Get the pixel color at a specified x, y location.
     *
     * Decode native samples on demand, then convert the selected pixel to RGBA8.
     * Sixteen-bit samples are rounded after testing native transparency keys.
     * Prefer toRGBA() for bulk conversion or getPixelInto() for reusable output.
     * @param x The hoizontal offset to read.
     * @param y The vertical offset to read.
     * @returns the color as [red, green, blue, alpha]
     * @throws {Error} x is out of bound for the image
     * @throws {Error} y is out of bound for the image
     * @throws {Error} Unknown color types
     */
    getPixel(x: number, y: number): [number, number, number, number];
    /**
     * Write an RGBA8 pixel into a caller-owned buffer without allocating an output tuple.
     * @param x Horizontal pixel coordinate.
     * @param y Vertical pixel coordinate.
     * @param output Destination bytes.
     * @param offset First of four writable destination bytes.
     * @returns The same output buffer.
     */
    getPixelInto(x: number, y: number, output: Uint8Array, offset?: number): Uint8Array;
    /**
     * Expand RGB palette metadata into newly owned RGBA tuples without remapping slots.
     * @returns Palette slots, with full opacity for entries omitted from tRNS.
     */
    private _paletteRGBA;
    /**
     * Read a grayscale/RGB transparency key in native sample precision.
     * @returns Key components, or an empty array when there is no color key.
     */
    private _transparencyKey;
    /**
     * Write one native pixel as RGBA8, retaining RGB beneath transparent alpha.
     * @param pixel Row-major pixel index, not a byte offset.
     * @param output Destination array or byte buffer.
     * @param offset Destination byte offset.
     * @param key Native transparency components, resolved once per bulk conversion.
     */
    private _writePixel;
    /**
     * Encode indexed pixels without quantization, palette reordering, or deduplication.
     * @param image Native indexes and RGBA palette slots.
     * @param options Bit depth, filters, compression level, and allocation limits.
     * @returns Owned non-interlaced PNG bytes; the default index depth is eight bits.
     * @static
     */
    static encodeIndexed(image: IndexedInput, options?: IndexedEncodeOptions): Uint8Array;
    /**
     * Create an indexed PNG using the encodeIndexed() implementation.
     * @param image Native indexes and RGBA palette slots.
     * @param options Bit depth, filters, compression level, and allocation limits.
     * @returns Owned PNG bytes retaining each supplied palette slot.
     * @static
     */
    static createIndexedPng(image: IndexedInput, options?: IndexedEncodeOptions): Uint8Array;
    /**
     * Encode straight-alpha RGBA8 without changing hidden RGB components.
     * @param image Dimensions and an exact row-major RGBA8 buffer.
     * @param options Filters, compression level, and allocation limits.
     * @returns Owned non-interlaced RGBA8 PNG bytes.
     * @static
     */
    static encodeRGBA(image: RgbaImage, options?: EncodeOptions): Uint8Array;
    /**
     * Rewrite indexed pixels, dimensions, or same-slot palette entries without an RGBA round trip.
     * No-op edits return an exact owned copy. Palette-only changes keep the original
     * IDAT bytes, including Adam7. Pixel edits use new non-interlaced packed rows.
     * Safe-to-copy ancillary chunks survive edits. Unsafe chunks require explicit
     * retention after caller-supplied, format-specific validation.
     * @param source Original PNG file bytes, rather than a mutable decoded model.
     * @param edit Palette edits and optional complete pixel/canvas replacements.
     * @param options Decoder/encoder limits and optional application validation.
     * @returns Owned PNG bytes preserving palette slot identities.
     * @throws {Error} Palette slot count changes or resizing omits replacement pixels.
     * @static
     */
    static rewriteIndexed(source: PngInput, edit?: IndexedPngEdit, options?: RewriteOptions): Uint8Array;
    /**
     * Rewrite an indexed PNG using rewriteIndexed().
     * @param source Original indexed PNG bytes.
     * @param edit Palette edits and optional complete pixel/canvas replacements.
     * @param options Decoder/encoder limits and optional application validation.
     * @returns Owned PNG bytes preserving palette slot identities.
     * @static
     */
    static rewriteIndexedPng(source: PngInput, edit?: IndexedPngEdit, options?: RewriteOptions): Uint8Array;
    /**
     * Pack validated indexes into scanlines and compress them for IDAT.
     * @param image A validated indexed surface.
     * @param bitDepth Number of bits per index.
     * @param options Filtering and compression options.
     * @param limits Resolved allocation limits.
     * @returns A complete zlib stream.
     */
    private static _encodeIndexedData;
    /**
     * Filter and compress rows for indexed and RGBA8 output.
     * None is the deterministic, low-CPU default. Adaptive filtering tries all five
     * predictors and selects the lowest signed-byte residual score for each row.
     * @param height Number of scanlines.
     * @param rowBytes Packed byte count per row, excluding its filter byte.
     * @param bpp Byte distance to the previous pixel for filtering.
     * @param fillRow Callback writing one unfiltered row into zero-initialized storage.
     * @param options Filtering and compression options.
     * @param limits Resolved allocation limits.
     * @returns A complete zlib stream.
     */
    private static _encodeRows;
    /**
     * No filtering, direct copy.
     * @param pixels Pixels to update.
     * @param scanline Scanline to search for pixels in.
     * @param bpp Bytes Per Pixel
     * @param offset Offset
     * @param length Length
     * @returns Pixels
     */
    static unFilterNone<T extends number[] | Uint8Array>(pixels: T, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): T;
    /**
     * The Sub() filter transmits the difference between each byte and the value of the corresponding byte of the prior pixel.
     * Sub(x) = Raw(x) + Raw(x - bpp)
     * @param pixels Pixels to update.
     * @param scanline Scanline to search for pixels in.
     * @param bpp Bytes Per Pixel
     * @param offset Offset
     * @param length Length
     * @returns Pixels
     */
    static unFilterSub<T extends number[] | Uint8Array>(pixels: T, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): T;
    /**
     * The Up() filter is just like the Sub() filter except that the pixel immediately above the current pixel, rather than just to its left, is used as the predictor.
     * Up(x) = Raw(x) + Prior(x)
     * @param pixels Pixels to update.
     * @param scanline - Scanline to search for pixels in.
     * @param bpp Bytes Per Pixel
     * @param offset Offset
     * @param length Length
     * @returns Pixels
     */
    static unFilterUp<T extends number[] | Uint8Array>(pixels: T, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): T;
    /**
     * The Average() filter uses the average of the two neighboring pixels (left and above) to predict the value of a pixel.
     * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
     * @param pixels Pixels to update.
     * @param scanline Scanline to search for pixels in.
     * @param bpp Bytes Per Pixel
     * @param offset Offset
     * @param length Length
     * @returns Pixels
     */
    static unFilterAverage<T extends number[] | Uint8Array>(pixels: T, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): T;
    /**
     * The Paeth() filter computes a simple linear function of the three neighboring pixels (left, above, upper left), then chooses as predictor the neighboring pixel closest to the computed value.
     * This technique was developed by Alan W. Paeth.
     * Paeth(x) = Raw(x) + PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
     * function PaethPredictor (a, b, c)
     * begin
     * ; a = left, b = above, c = upper left
     * p := a + b - c        ; initial estimate
     * pa := abs(p - a)      ; distances to a, b, c
     * pb := abs(p - b)
     * pc := abs(p - c)
     * ; return nearest of a,b,c,
     * ; breaking ties in order a,b,c.
     * if pa <= pb AND pa <= pc then return a
     * else if pb <= pc then return b
     * else return c
     * end
     * @param pixels Pixels to update.
     * @param scanline Scanline to search for pixels in.
     * @param bpp Bytes Per Pixel
     * @param offset Offset
     * @param length Length
     * @returns Pixels
     */
    static unFilterPaeth<T extends number[] | Uint8Array>(pixels: T, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): T;
}
export default ImagePNG;
//# sourceMappingURL=data-image-png.d.ts.map