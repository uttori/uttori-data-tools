export default ImageGIF;
export type ImageGIFOptions = {
    /**
     * Options for the ImageGIF instance.
     */
    rules: {
        strict_block_size: boolean;
        strict_lzw_minimum_code_size: boolean;
    };
};
export type ImageGIFImageDescriptor = {
    /**
     * The offset of the image descriptor in the data
     */
    offset: number;
    /**
     * The left position of the image
     */
    leftPosition: number;
    /**
     * The top position of the image
     */
    topPosition: number;
    /**
     * The width of the image
     */
    width: number;
    /**
     * The height of the image
     */
    height: number;
    /**
     * The packed fields of the image descriptor
     */
    packed: number;
    /**
     * The local color table flag
     */
    localColorTableFlag: number;
    /**
     * The interlace flag
     */
    interlaceFlag: number;
    /**
     * The sort flag
     */
    sortFlag: number;
    /**
     * The local color table size
     */
    localColorTableSize: number;
    /**
     * The local color table
     */
    localColorTable: Uint8Array;
    /**
     * The LZW minimum code size
     */
    lzwMinimumCodeSize: number;
    /**
     * The LZW data
     */
    lzwData: number[];
};
/**
 * @typedef {Object} ImageGIFOptions
 * @property {object} rules Options for the ImageGIF instance.
 * @property {boolean} rules.strict_block_size Strictly enforce the block size.
 * @property {boolean} rules.strict_lzw_minimum_code_size Strictly enforce the LZW minimum code size.
 */
/**
 * @typedef {Object} ImageGIFImageDescriptor
 * @property {number} offset The offset of the image descriptor in the data
 * @property {number} leftPosition The left position of the image
 * @property {number} topPosition The top position of the image
 * @property {number} width The width of the image
 * @property {number} height The height of the image
 * @property {number} packed The packed fields of the image descriptor
 * @property {number} localColorTableFlag The local color table flag
 * @property {number} interlaceFlag The interlace flag
 * @property {number} sortFlag The sort flag
 * @property {number} localColorTableSize The local color table size
 * @property {Uint8Array} localColorTable The local color table
 * @property {number} lzwMinimumCodeSize The LZW minimum code size
 * @property {number[]} lzwData The LZW data
 */
/**
 * GIF Decoder
 *
 * @property {number} width Pixel Width
 * @property {number} height Pixel Height
 * @property {number} bitDepth Image Bit Depth, one of: 1, 2, 4, 8, 16
 * @property {number} colorType Defines pixel structure, one of: 0, 2, 3, 4, 6
 * @property {number} colors Number of colors in the image
 * @property {boolean} alpha True when the image has an alpha transparency layer
 * @property {number[] | Uint8Array} palette Raw Color data
 * @property {Uint8Array} pixels Raw Image Pixel data
 * @property {Uint8Array} transparency Raw Transparency data
 * @property {Uint8Array} header GIF Signature from the data
 * @see {@link http://www.w3.org/Graphics/GIF/spec-gif87.txt|Graphics Interchange Format (GIF) Specification}
 * @see {@link http://www.w3.org/Graphics/GIF/spec-gif89a.txt|GIF89a Specification}
 * @example <caption>new ImageGIF(list, options)</caption>
 * const image_data = await fs.readFile('./test/image/assets/sundisk04.gif');
 * const image = ImageGIF.fromFile(image_data);
 * image.decodePixels();
 * const length = image.pixels.length;
 *  ➜ 65536
 * const pixel = image.getPixel(0, 0);
 *  ➜ [255, 254, 254, 255]
 * @class
 */
declare class ImageGIF extends DataBuffer {
    /**
     * Creates a new ImageGIF from file data.
     *
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} data The data of the image to process.
     * @param {ImageGIFOptions} opts Options for this ImageGIF instance.
     * @returns {ImageGIF} the new ImageGIF instance for the provided file data
     * @static
     */
    static fromFile(data: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array, opts?: ImageGIFOptions): ImageGIF;
    /**
     * Creates a new ImageGIF from a DataBuffer.
     *
     * @param {DataBuffer} buffer The DataBuffer of the image to process.
     * @param {ImageGIFOptions} opts Options for this ImageGIF instance.
     * @returns {ImageGIF} the new ImageGIF instance for the provided DataBuffer
     * @static
     */
    static fromBuffer(buffer: DataBuffer, opts?: ImageGIFOptions): ImageGIF;
    /**
     * Creates a new ImageGIF.
     *
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} input The data to process.
     * @param {ImageGIFOptions} [options] Options for this ImageGIF instance.
     * @class
     */
    constructor(input: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array, options?: ImageGIFOptions);
    header: string;
    version: number;
    width: number;
    height: number;
    bitDepth: number;
    colorType: number;
    colors: number;
    alpha: boolean;
    /** @type {Uint8Array} */
    palette: Uint8Array;
    /** @type {number[]|Uint8Array} */
    pixels: number[] | Uint8Array;
    /** @type {Uint8Array} */
    transparency: Uint8Array;
    frames: any[];
    comments: any[];
    applicationExtensions: any[];
    /** @type {ImageGIFImageDescriptor[]} */
    imageDescriptors: ImageGIFImageDescriptor[];
    plainTextExtensions: any[];
    imageNext: boolean;
    /** @type {ImageGIFOptions} */
    options: ImageGIFOptions;
    /**
     * Parse the GIF file, decoding the chunks.
     */
    parse(): void;
    decodeImageDescriptor(): void;
    decodeGraphicControlExtension(): void;
    decodeApplicationExtension(): void;
    decodeCommentExtension(): void;
    decodePlainTextExtension(): void;
    /**
     * Decodes the Data Sub Blocks.
     * @returns {number[]} The decoded data
     */
    decodeDataSubBlocks(): number[];
    /**
     * Decodes and validates GIF Header.
     *
     * The header takes up the first six bytes of the file.
     * These bytes should all correspond to ASCII character codes.
     * The first three bytes are called the signature.
     * The next three specify the version of the specification that was used to encode the image.
     *
     * Signature + Version (Decimal): [71, 73, 70, 56, 57, 97]
     * Signature + Version (Hexadecimal): [47, 49, 46, 38, 39, 61]
     * Signature + Version (ASCII): [G, I, F, 8, 9, a]
     *
     * @throws {Error} Missing or invalid GIF header
     */
    decodeHeader(): void;
    /**
     * Decodes and parse GIF Logical Screen Descriptor.
     * The logical screen descriptor always immediately follows the header.
     * This block tells the decoder how much room this image will take up.
     * It is exactly seven bytes long.
     */
    decodeLogicalScreenDescriptor(): void;
    packed: number;
    globalColorTable: number;
    colorResolution: number;
    sortFlag: number;
    sizeOfGlobalColorTable: number;
    backgroundColorIndex: number;
    pixelAspectRatio: number;
    /**
     * Decodes the Global Color Table.
     *
     * GIFs can have either a global color table or local color tables for each sub-image.
     * Each color table consists of a list of RGB (Red-Green-Blue) color component intensities, three bytes for each color, with intensities ranging from 0 (least) to 255 (most).
     * The color (0,0,0) is deepest black, the color (255,255,255) brightest white.
     * This block is "optional" as not every GIF has to specify a global color table.
     * If the global color table flag is set to 1 in the logical screen descriptor block, the global color table is then required to immediately follow that block.
     */
    decodeGlobalColorTable(): void;
    /**
     * Decompress LZW image data to pixels using the first image descriptor.
     * GIF images are always palette-based (indexed color).
     * @throws {Error} No image descriptors found
     */
    decodePixels(): void;
    /**
     * Get the pixel color at a specified x, y location.
     * GIF images are always palette-based (indexed color).
     *
     * @param {number} x The horizontal offset to read.
     * @param {number} y The vertical offset to read.
     * @returns {Array<number>} the color as [red, green, blue, alpha]
     * @throws {Error} Pixel data has not been decoded
     * @throws {Error} x is out of bound for the image
     * @throws {Error} y is out of bound for the image
     */
    getPixel(x: number, y: number): Array<number>;
}
import { DataBuffer } from '../index.js';
//# sourceMappingURL=data-image-gif.d.ts.map