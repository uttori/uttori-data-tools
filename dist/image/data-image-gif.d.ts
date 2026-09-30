import DataBuffer from "../data-buffer.js";
import { RgbaSurface } from "./rgba-surface.js";
import type { IndexedInput, IndexedPixels, RGBA, RgbaImage } from "./types.js";
export interface ImageGIFBounds {
    readonly maxInputBytes?: number;
    readonly maxPixels?: number;
    /** Aggregate native index bytes across all raster frames. */
    readonly maxInflatedBytes?: number;
    readonly maxOutputBytes?: number;
    /** Aggregate RGBA snapshots returned by decodeFrames(), including working storage. */
    readonly maxRenderedBytes?: number;
    readonly maxFrames?: number;
    /** Counts top-level blocks and data sub-blocks, including their terminators. */
    readonly maxBlocks?: number;
}
export interface ImageGIFOptions extends ImageGIFBounds {
    readonly copyInput?: boolean;
    /** Strict container validation defaults to true; unsafe reads always fail. */
    readonly strict?: boolean;
    /** Plain text is preserved as metadata; rendering it requires an application font policy. */
    readonly plainText?: "reject" | "ignore";
    /** Options for the ImageGIF instance. */
    rules?: {
        /** Strictly enforce the block size. */
        strict_block_size?: boolean;
        /** Strictly enforce the LZW minimum code size. */
        strict_lzw_minimum_code_size?: boolean;
    };
}
export interface ImageGIFImageDescriptor {
    /** The offset of the image descriptor in the data. */
    offset: number;
    /** The left position of the image. */
    leftPosition: number;
    /** The top position of the image. */
    topPosition: number;
    /** The width of the image. */
    width: number;
    /** The height of the image. */
    height: number;
    /** The packed fields of the image descriptor. */
    packed: number;
    /** The local color table flag. */
    localColorTableFlag: number;
    /** The interlace flag. */
    interlaceFlag: number;
    /** The sort flag. */
    sortFlag: number;
    /** The local color table size. */
    localColorTableSize: number;
    /** The local color table. */
    localColorTable: Uint8Array;
    /** The LZW minimum code size. */
    lzwMinimumCodeSize: number;
    /** The LZW data. */
    lzwData: number[] | Uint8Array;
    /** The byte after the complete image data sub-block sequence. */
    end: number;
    /** The source offset of the minimum code size and framed image data. */
    imageDataOffset: number;
    /** Number of unsupported graphic-rendering blocks preceding this frame. */
    unsupportedGraphicsBefore: number;
}
/** A decoded animation frame reference. */
export interface ImageGIFFrame {
    /** The index of the frame. */
    index: number;
    /** The delay of the frame. */
    delay: number;
    /** The disposal method of the frame. */
    disposal?: number;
    /** Transparent palette slot; absence means that every slot is opaque. */
    transparentIndex?: number;
    /** Whether user input may advance this frame before its delay expires. */
    userInput?: boolean;
    /** Source offset of the controlling extension, when present. */
    graphicControlOffset?: number;
}
/** A decoded comment extension. */
export interface ImageGIFComment {
    /** The offset of the comment extension in the data. */
    offset: number;
    /** The decoded comment text. */
    comment?: string;
}
/** A decoded plain text extension. */
export interface ImageGIFPlainTextExtension {
    /** The offset of the plain text extension in the data. */
    offset: number;
    /** The text grid left position. */
    textGridLeftPosition?: number;
    /** The text grid top position. */
    textGridTopPosition?: number;
    /** The image grid width. */
    imageGridWidth?: number;
    /** The image grid height. */
    imageGridHeight?: number;
    /** The character cell width. */
    characterCellWidth?: number;
    /** The character cell height. */
    characterCellHeight?: number;
    /** The text foreground color index. */
    textForegroundColorIndex?: number;
    /** The text background color index. */
    textBackgroundColorIndex?: number;
    /** The plain text data. */
    plainText?: string;
    /** Graphic control consumed by this text block, not by the next raster frame. */
    graphicControl?: Omit<ImageGIFFrame, "index">;
}
/** A parsed application extension, including its complete unframed binary payload. */
export interface ImageGIFApplicationExtension {
    offset: number;
    applicationIdentifier: string;
    applicationAuthenticationCode: string;
    data: Uint8Array;
    loopCount?: number;
}
/** Original block boundaries used for lossless indexed rewriting. */
export interface ImageGIFBlock {
    readonly type: "image" | "graphic-control" | "comment" | "application" | "plain-text" | "extension" | "padding" | "trailer";
    readonly offset: number;
    readonly end: number;
    readonly label?: number;
    readonly frameIndex?: number;
}
/** Native frame indexes and palette slots, distinct from the composited logical screen. */
export interface ImageGIFIndexedImage extends IndexedInput {
    readonly kind: "indexed-image";
    readonly frameIndex: number;
    readonly sourceBitDepth: number;
    readonly leftPosition: number;
    readonly topPosition: number;
}
export interface ImageGIFRenderOptions {
    readonly frameIndex?: number;
    /** True renders the logical screen; false returns only the selected image rectangle. */
    readonly composited?: boolean;
    /** Conversion always needs owned RGBA storage; false cannot alias indexed bytes. */
    readonly copy?: boolean;
    /** Auto clears transparent frames to transparency and opaque frames to the global background. */
    readonly background?: "auto" | "transparent" | "logical-screen";
}
export interface ImageGIFRenderedFrame extends ImageGIFFrame {
    readonly surface: RgbaSurface;
}
export interface ImageGIFIndexedFrameInput extends IndexedInput {
    readonly leftPosition?: number;
    readonly topPosition?: number;
    /** Delay in hundredths of a second, without browser-specific clamping. */
    readonly delay?: number;
    readonly disposal?: number;
    readonly userInput?: boolean;
    readonly interlaced?: boolean;
}
export interface ImageGIFEncodeOptions extends ImageGIFBounds {
    readonly width?: number;
    readonly height?: number;
    readonly loopCount?: number;
    readonly backgroundColorIndex?: number;
    readonly delay?: number;
    readonly disposal?: number;
    readonly userInput?: boolean;
    readonly interlaced?: boolean;
}
export interface ImageGIFIndexedEdit {
    readonly frameIndex?: number;
    readonly palette?: readonly RGBA[];
    readonly indexes?: Uint8Array;
    /** Resize a single-frame canvas, or a selected animation rectangle inside its existing canvas. */
    readonly dimensions?: {
        readonly width: number;
        readonly height: number;
    };
    readonly delay?: number;
    readonly disposal?: number;
}
export interface ImageGIFRewriteOptions extends ImageGIFOptions {
    /** Synchronous validation only. Must not mutate the supplied indexes. Throw to reject. */
    readonly validateIndexed?: (image: IndexedPixels) => void;
}
/** File inputs supported by DataBuffer; numeric allocation lengths are not GIF files. */
export type GifInput = number[] | ArrayBuffer | ArrayBufferView | DataBuffer | number | string;
/**
 * GIF Decoder
 *
 * Indexed decoding/editing and indexed/RGBA8 encoding share ImagePNG's surface contracts.
 * Native pixels are frame-local indexes; toRGBA() renders a logical-screen snapshot.
 * Files are copied by default. Borrowed bytes and block views are read-only by convention.
 * Container structure is checked immediately, while raster decompression remains lazy.
 *
 * @property {number} width Pixel Width
 * @property {number} height Pixel Height
 * @property {number} bitDepth Palette index depth, from 1 through 8
 * @property {number} colorType Defines pixel structure, always 3 for indexed GIF pixels
 * @property {number} colors Number of colors in the image
 * @property {boolean} alpha True when the image has an alpha transparency layer
 * @property {number[] | Uint8Array} palette Raw Color data
 * @property {Uint8Array} pixels Raw Image Pixel data
 * @property {Uint8Array} transparency Raw Transparency data
 * @property {string} header GIF Signature from the data
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
    /** The GIF signature. */
    header: string;
    /** The GIF version. */
    version: number;
    /** The width of the image. */
    width: number;
    /** The height of the image. */
    height: number;
    /** The bit depth of the image. */
    bitDepth: number;
    /** The color type of the image. */
    colorType: number;
    /** The number of colors in the image. */
    colors: number;
    /** Whether the image has an alpha transparency layer. */
    alpha: boolean;
    /** The palette of the image. */
    palette: Uint8Array;
    /** The pixels of the image. */
    pixels: Uint8Array;
    /** The transparency of the image. */
    transparency: Uint8Array;
    /** The frames of the image. */
    frames: ImageGIFFrame[];
    /** The comments of the image. */
    comments: ImageGIFComment[];
    /** The application extensions of the image. */
    applicationExtensions: ImageGIFApplicationExtension[];
    /** The image descriptors of the image. */
    imageDescriptors: ImageGIFImageDescriptor[];
    /** The plain text extensions of the image. */
    plainTextExtensions: ImageGIFPlainTextExtension[];
    /** Whether the next byte is an image descriptor. */
    imageNext: boolean;
    /** Options for the ImageGIF instance. */
    readonly options: ImageGIFOptions;
    /** The size of the global color table, set while decoding the logical screen descriptor. */
    sizeOfGlobalColorTable: number;
    /** The global color table of the image. */
    globalColorTable: number;
    /** The color resolution of the image. */
    colorResolution: number;
    /** The sort flag of the image. */
    sortFlag: number;
    /** The background color index of the image. */
    backgroundColorIndex: number;
    /** The pixel aspect ratio of the image. */
    pixelAspectRatio: number;
    /** The packed fields of the image descriptor. */
    packed: number;
    /** Parsed original block boundaries, including the trailer. */
    blocks: ImageGIFBlock[];
    /** Netscape loop count; zero means infinite and undefined means no loop extension. */
    loopCount: number | undefined;
    /** Whether more than one raster frame is present. */
    animated: boolean;
    /** True once the first frame's indexes have decoded successfully. */
    _decoded: boolean;
    private readonly _limits;
    private readonly _framePixels;
    private _pendingControl;
    private _inflatedTotal;
    private _blockCount;
    private _unsupportedGraphics;
    /**
     * Creates a new ImageGIF.
     *
     * @param input The data to process.
     * @param options Options for this ImageGIF instance.
     * @class
     */
    constructor(input: GifInput, options?: ImageGIFOptions);
    /**
     * Creates a new ImageGIF from file data.
     *
     * @param data The data of the image to process.
     * @param opts Options for this ImageGIF instance.
     * @returns The new ImageGIF instance for the provided file data
     * @static
     */
    static fromFile(data: GifInput, opts?: ImageGIFOptions): ImageGIF;
    /**
     * Creates a new ImageGIF from a DataBuffer.
     *
     * @param buffer The DataBuffer of the image to process.
     * @param opts Options for this ImageGIF instance.
     * @returns The new ImageGIF instance for the provided DataBuffer
     * @static
     */
    static fromBuffer(buffer: DataBuffer, opts?: ImageGIFOptions): ImageGIF;
    /**
     * Parse the GIF file, decoding the chunks.
     */
    parse(): this;
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
    /** Join validated payloads in one allocation, retaining no per-byte boxed array. */
    private _decodeDataSubBlocks;
    /** Enforce framing before asking DataBuffer to consume a field. */
    private _requireBytes;
    /** Bound parser work even for many empty extensions or one-byte payloads. */
    private _countBlock;
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
    /** Discard cached native indexes without modifying the original compressed image data. */
    invalidatePixels(frameIndex?: number): void;
    /** Validate a raster frame reference independently of the publicly mutable pixel cache. */
    private _frame;
    /** Local tables override the global table; missing tables cannot be invented for rendering. */
    private _paletteForFrame;
    /** Expand palette slots without merging duplicate colors or losing transparent RGB. */
    private _paletteRGBA;
    /**
     * Decompress LZW image data to pixels using the first image descriptor by default.
     * GIF images are always palette-based (indexed color).
     * Native pixels belong to the image rectangle, not the entire logical screen.
     * Successful decodes are cached. A forced decode discards edits to that cache.
     * @param options Frame selection and cache control.
     * @returns Row-major, deinterlaced native palette indexes.
     * @throws {Error} No image descriptors found
     * @throws {Error} Invalid LZW codes, pixel count, or palette indexes.
     */
    decodePixels({ frameIndex, force, }?: {
        readonly frameIndex?: number;
        readonly force?: boolean;
    }): Uint8Array;
    /** Return native frame indexes and newly owned RGBA slots, preserving palette identity. */
    toIndexed({ frameIndex, copy, }?: {
        readonly frameIndex?: number;
        readonly copy?: boolean;
    }): ImageGIFIndexedImage;
    /** Validate rendering choices before allocating pixels or interpreting unsupported graphics. */
    private _renderOptions;
    /** Resolve the logical background as a packed RGBA word without allocating a color tuple. */
    private _backgroundWord;
    /** Expand a background word for RgbaSurface.fill(); individual pixel reads avoid this allocation. */
    private _background;
    /**
     * Render working snapshots sequentially. The yielded surface is borrowed until iteration resumes.
     * Restore-to-previous saves only the affected rectangle, rather than an entire canvas per frame.
     * @param lastIndex The index of the last frame to render.
     * @param background The background color to use for the render.
     * @returns A generator of RgbaSurface objects.
     * @yields RgbaSurface The rendered frame.
     */
    private _render;
    /**
     * Convert to an owned RgbaSurface for drawing, blitting, cropping, flipping, scaling, or text.
     * By default return the selected composited logical-screen snapshot. Native indexes are unchanged.
     * Set composited: false to convert only the selected frame rectangle, retaining hidden RGB.
     */
    toRGBA(options?: ImageGIFRenderOptions): RgbaSurface;
    /** Decode one animation snapshot, preserving the same rendering choices as toRGBA(). */
    decodeFrame(frameIndex?: number, options?: Omit<ImageGIFRenderOptions, "frameIndex">): RgbaSurface;
    /** Decode independently owned logical-screen snapshots with timing and disposal metadata. */
    decodeFrames(options?: Pick<ImageGIFRenderOptions, "background">): ImageGIFRenderedFrame[];
    /**
     * Get the pixel color at a specified x, y location.
     * GIF images are always palette-based (indexed color).
     * Decode lazily and resolve the selected logical-screen pixel, including frame offsets and disposal.
     * @param x The horizontal offset to read.
     * @param y The vertical offset to read.
     * @param options Frame and background selection, or composited: false for native coordinates.
     * @returns The color as [red, green, blue, alpha]
     * @throws {Error} Pixel data cannot be decoded
     * @throws {Error} x is out of bound for the image
     * @throws {Error} y is out of bound for the image
     */
    getPixel(x: number, y: number, options?: ImageGIFRenderOptions): [number, number, number, number];
    /** Write one rendered pixel without allocating a tuple or a full RGBA canvas. */
    getPixelInto(x: number, y: number, output: Uint8Array, offset?: number, options?: ImageGIFRenderOptions): Uint8Array;
    /** Resolve only one pixel through the animation; decoded native frames are reused. */
    private _writePixel;
    /** Encode one indexed GIF without quantization, reordering, or palette-slot deduplication. */
    static encodeIndexed(image: IndexedInput, options?: ImageGIFEncodeOptions): Uint8Array;
    /** Create an indexed GIF using the encodeIndexed() implementation. */
    static createIndexedGif(image: IndexedInput, options?: ImageGIFEncodeOptions): Uint8Array;
    /**
     * Encode exact RGBA8 colors, including the RGB components beneath transparent alpha.
     * GIF permits at most 256 palette entries and one transparent slot. Reject unsupported
     * input rather than silently quantizing colors, merging transparent RGB, or thresholding alpha.
     */
    static encodeRGBA(image: RgbaImage, options?: ImageGIFEncodeOptions): Uint8Array;
    /** Encode raster animation frames with local palettes, offsets, delays, looping, and disposal. */
    static encodeIndexedFrames(frames: readonly ImageGIFIndexedFrameInput[], options?: ImageGIFEncodeOptions): Uint8Array;
    /** Convert row-major indexes to GIF pass order only when interlacing is requested. */
    private static _encodePixels;
    /**
     * Rewrite one frame without an RGBA round trip. No-op edits return an exact owned copy.
     * Same-slot palette changes retain the original framed LZW bytes and interlacing. A local
     * replacement table isolates edits from other frames that share the global table.
     * Other extensions are retained byte-for-byte; application-specific payload semantics are not rewritten.
     */
    static rewriteIndexed(source: GifInput, edit?: ImageGIFIndexedEdit, options?: ImageGIFRewriteOptions): Uint8Array;
    /** Rewrite indexed GIF bytes using rewriteIndexed(). */
    static rewriteIndexedGif(source: GifInput, edit?: ImageGIFIndexedEdit, options?: ImageGIFRewriteOptions): Uint8Array;
}
export default ImageGIF;
//# sourceMappingURL=data-image-gif.d.ts.map