export default ImagePNG;
/**
 * PNG Decoder
 * @property {number} width Pixel Width
 * @property {number} height Pixel Height
 * @property {number} bitDepth Image Bit Depth, one of: 1, 2, 4, 8, 16
 * @property {number} colorType Defines pixel structure, one of: 0, 2, 3, 4, 6
 * @property {number} compressionMethod Type of compression, always 0
 * @property {number} filterMethod Type of filtering, always 0
 * @property {number} interlaceMethod Type of interlacing, one of: 0, 1
 * @property {number} colors Number of bytes for each pixel
 * @property {boolean} alpha True when the image has an alpha transparency layer
 * @property {number[] | Uint8Array} palette Raw Color data
 * @property {Uint8Array} pixels Raw Image Pixel data
 * @property {Uint8Array} transparency Raw Transparency data
 * @property {object} physical Object containing physical dimension information
 * @property {number} physical.width Physical Dimension Width
 * @property {number} physical.height Physical Dimension Height
 * @property {number} physical.unit Physical Dimension Units, with 0 being unknown and 1 being Meters
 * @property {Uint8Array[]} dataChunks Image Data pieces
 * @property {Uint8Array} header PNG Signature from the data
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
 *  ➜ 6144
 * const pixel = image.getPixel(0, 0);
 *  ➜ [255, 255, 255, 255]
 * @class
 * @augments DataBuffer
 */
declare class ImagePNG extends DataBuffer {
    /**
     * Creates a new ImagePNG from file data.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} data The data of the image to process.
     * @returns {ImagePNG} the new ImagePNG instance for the provided file data
     * @static
     */
    static fromFile(data: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array): ImagePNG;
    /**
     * Creates a new ImagePNG from a DataBuffer.
     * @param {DataBuffer} buffer The DataBuffer of the image to process.
     * @returns {ImagePNG} the new ImagePNG instance for the provided DataBuffer
     * @static
     */
    static fromBuffer(buffer: DataBuffer): ImagePNG;
    /**
     * No filtering, direct copy.
     * @param {number[]|Uint8Array} pixels Pixels to update.
     * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
     * @param {number} bpp Bytes Per Pixel
     * @param {number} offset Offset
     * @param {number} length Length
     * @returns {number[]|Uint8Array} Pixels
     */
    static unFilterNone(pixels: number[] | Uint8Array, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): number[] | Uint8Array;
    /**
     * The Sub() filter transmits the difference between each byte and the value of the corresponding byte of the prior pixel.
     * Sub(x) = Raw(x) + Raw(x - bpp)
     * @param {number[]|Uint8Array} pixels Pixels to update.
     * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
     * @param {number} bpp - Bytes Per Pixel
     * @param {number} offset Offset
     * @param {number} length Length
     * @returns {number[]|Uint8Array} Pixels
     */
    static unFilterSub(pixels: number[] | Uint8Array, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): number[] | Uint8Array;
    /**
     * The Up() filter is just like the Sub() filter except that the pixel immediately above the current pixel, rather than just to its left, is used as the predictor.
     * Up(x) = Raw(x) + Prior(x)
     * @param {number[]|Uint8Array} pixels Pixels to update.
     * @param {number[]|Uint8Array} scanline - Scanline to search for pixels in.
     * @param {number} _bpp Bytes Per Pixel, Unused
     * @param {number} offset Offset
     * @param {number} length Length
     * @returns {number[]|Uint8Array} Pixels
     */
    static unFilterUp(pixels: number[] | Uint8Array, scanline: number[] | Uint8Array, _bpp: number, offset: number, length: number): number[] | Uint8Array;
    /**
     * The Average() filter uses the average of the two neighboring pixels (left and above) to predict the value of a pixel.
     * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
     * @param {number[]|Uint8Array} pixels Pixels to update.
     * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
     * @param {number} bpp Bytes Per Pixel
     * @param {number} offset Offset
     * @param {number} length Length
     * @returns {number[]|Uint8Array} Pixels
     */
    static unFilterAverage(pixels: number[] | Uint8Array, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): number[] | Uint8Array;
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
     * @param {number[]|Uint8Array} pixels Pixels to update.
     * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
     * @param {number} bpp Bytes Per Pixel
     * @param {number} offset Offset
     * @param {number} length Length
     * @returns {number[]|Uint8Array} Pixels
     */
    static unFilterPaeth(pixels: number[] | Uint8Array, scanline: number[] | Uint8Array, bpp: number, offset: number, length: number): number[] | Uint8Array;
    /**
     * Creates a new ImagePNG.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} input The data to process.
     */
    constructor(input: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array);
    /** @type {number} Pixel Width */
    width: number;
    /** @type {number} Pixel Height */
    height: number;
    /** @type {number} Image Bit Depth, one of: 1, 2, 4, 8, 16 */
    bitDepth: number;
    /** @type {number} Defines pixel structure, one of: 0, 2, 3, 4, 6 */
    colorType: number;
    /** @type {number} Type of compression, always 0 */
    compressionMethod: number;
    /** @type {number} Type of filtering, always 0 */
    filterMethod: number;
    /** @type {number} Type of interlacing, one of: 0, 1 */
    interlaceMethod: number;
    /** @type {number} Number of bytes for each pixel */
    colors: number;
    /** @type {boolean} True when the image has an alpha transparency layer */
    alpha: boolean;
    /** @type {number[] | Uint8Array} Raw Color data */
    palette: number[] | Uint8Array;
    /** @type {number[]|Uint8Array} Raw Image Pixel data */
    pixels: number[] | Uint8Array;
    /** @type {Uint8Array} Raw Transparency data */
    transparency: Uint8Array;
    /** @type {object} physical - Object containing physical dimension information */
    physical: object;
    /** @type {Uint8Array[]} Image Data pieces */
    dataChunks: Uint8Array[];
    /** @type {number[]|Uint8Array} PNG Signature from the data */
    header: number[] | Uint8Array;
    /**
     * Sets the bitDepth on the ImagePNG instance.
     * @param {number} bitDepth The bitDepth to set, one of: 1, 2, 4, 8, 16
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
     * @param {number} colorType - The colorType to set, one of: 0, 2, 3, 4, 6
     * @throws {Error} Invalid Color Type, anything other than 0, 2, 3, 4, 6
     */
    setColorType(colorType: number): void;
    /**
     * Sets the compressionMethod on the ImagePNG instance.
     * The compressionMethod should always be 0.
     * @param {number} compressionMethod - The compressionMethod to set, always 0
     * @throws {Error} Unsupported Compression Method, anything other than 0
     */
    setCompressionMethod(compressionMethod: number): void;
    /**
     * Sets the filterMethod on the ImagePNG instance.
     * The filterMethod should always be 0.
     * @param {number} filterMethod - The filterMethod to set, always 0
     * @throws {Error} Unsupported Filter Method, anything other than 0
     */
    setFilterMethod(filterMethod: number): void;
    /**
     * Sets the interlaceMethod on the ImagePNG instance.
     * The interlaceMethod should always be 0 or 1.
     * @param {number} interlaceMethod The interlaceMethod to set, always 0 or 1
     * @throws {Error} Unsupported Interlace Method, anything other than 0 or 1
     */
    setInterlaceMethod(interlaceMethod: number): void;
    /**
     * Sets the palette on the ImagePNG instance.
     * @param {number[] | Uint8Array} palette The palette to set
     * @throws {Error} No colors in the palette
     * @throws {Error} Too many colors for the current bit depth
     */
    setPalette(palette: number[] | Uint8Array): void;
    /**
     * Get the pixel color at a specified x, y location.
     * @param {number} x The hoizontal offset to read.
     * @param {number} y The vertical offset to read.
     * @returns {Array<number>} the color as [red, green, blue, alpha]
     * @throws {Error} x is out of bound for the image
     * @throws {Error} y is out of bound for the image
     * @throws {Error} Unknown color types
     */
    getPixel(x: number, y: number): Array<number>;
    /**
     * Parse the PNG file, decoding the supported chunks.
     */
    parse(): void;
    /**
     * Decodes and validates PNG Header.
     * Signature (Decimal): [137, 80, 78, 71, 13, 10, 26, 10]
     * Signature (Hexadecimal): [89, 50, 4E, 47, 0D, 0A, 1A, 0A]
     * Signature (ASCII): [\211, P, N, G, \r, \n, \032, \n]
     * @throws {Error} Missing or invalid PNG header
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
     * @returns {string} Chunk Type
     * @throws {Error} Invalid Chunk Length when less than 0
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
     * @param {Uint8Array} chunk - Data Blob
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR|Image Header}
     * @see {@link http://www.libpng.org/pub/png/spec/1.2/png-1.2-pdg.html#C.IHDR|Image Header}
     */
    decodeIHDR(chunk: Uint8Array): void;
    /**
     * Decode the PLTE (Palette) chunk.
     * The PLTE chunk contains from 1 to 256 palette entries, each a three-byte series of the form.
     * The number of entries is determined from the chunk length. A chunk length not divisible by 3 is an error.
     * @param {Uint8Array} chunk - Data Blob
     * @see {@link http://www.w3.org/TR/PNG/#11PLTE|Palette}
     */
    decodePLTE(chunk: Uint8Array): void;
    /**
     * Decode the IDAT (Image Data) chunk.
     * The IDAT chunk contains the actual image data which is the output stream of the compression algorithm.
     * @param {Uint8Array} chunk - Data Blob
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT|Image Data}
     */
    decodeIDAT(chunk: Uint8Array): void;
    /**
     * Decode the tRNS (Transparency) chunk.
     * The tRNS chunk specifies that the image uses simple transparency: either alpha values associated with palette entries (for indexed-color images) or a single transparent color (for grayscale and truecolor images). Although simple transparency is not as elegant as the full alpha channel, it requires less storage space and is sufficient for many common cases.
     * @param {Uint8Array} chunk - Data Blob
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
     * @param {Uint8Array} chunk - Data Blob
     * @see {@link https://www.w3.org/TR/PNG/#11pHYs|Pixel Dimensions}
     */
    decodePHYS(chunk: Uint8Array): void;
    /**
     * Decode the IEND (Image trailer) chunk.
     * The IEND chunk marks the end of the PNG DataBuffer. The chunk's data field is empty.
     * @param {Uint8Array} _chunk - Unused.
     * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND|Image Trailer}
     */
    decodeIEND(_chunk: Uint8Array): void;
    /**
     * Uncompress IDAT chunks.
     * @throws {Error} No IDAT chunks to decode
     * @throws {Error} Deinterlacing Error
     * @throws {Error} Inflating Error
     * @throws {Error} Adam7 interlaced format is unsupported
     */
    decodePixels(): void;
    /**
     * Deinterlace with no interlacing.
     * @param {Buffer} data - Data to deinterlace.
     * @see {@link https://www.w3.org/TR/PNG-Filters.html|PNG Filters}
     */
    interlaceNone(data: Buffer): void;
    /**
     * Deinterlace with Adam7 interlacing.
     * Adam7 divides the image into 7 passes with different starting positions and step sizes.
     * @param {Buffer} data - Data to deinterlace.
     * @see {@link https://www.w3.org/TR/PNG/#8Interlace|PNG Adam7 Interlacing}
     * @see {@link https://github.com/em2046/lens/blob/master/assets/js/interlace.js}
     * @see {@link https://github.com/em2046/aperture/tree/master/lib/png/chunks}
     * @see {@link https://github.com/beejjorgensen/jsmandel/blob/master/src/js/adam7.js}
     * @see {@link http://diyhpl.us/~yenatch/pokecrystal/src/pypng/code/png.py}
     * @see {@link https://github.com/SixLabors/ImageSharp/blob/master/src/ImageSharp/Formats/Png/Adam7.cs}
     */
    interlaceAdam7(data: Buffer): void;
}
import DataBuffer from '../data-buffer.js';
//# sourceMappingURL=data-image-png.d.ts.map