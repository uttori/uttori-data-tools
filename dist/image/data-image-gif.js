import DataBuffer from "../data-buffer.js";
import GIFLZW from "./gif_lzw.js";
import { RgbaSurface } from "./rgba-surface.js";
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
        debug = d("Uttori.ImageGIF");
    }
    catch { }
}
/** Default allocation and work limits; caller overrides must be positive safe integers. */
const DEFAULT_LIMITS = Object.freeze({
    maxInputBytes: 64 * 1024 * 1024,
    maxPixels: 4 * 1024 * 1024,
    maxInflatedBytes: 64 * 1024 * 1024,
    maxOutputBytes: 64 * 1024 * 1024,
    maxRenderedBytes: 128 * 1024 * 1024,
    maxFrames: 4096,
    maxBlocks: 65536,
});
/** Four GIF interlace passes, expressed as starting row and row stride. */
const GIF_PASSES = [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
];
function resolveLimits(options) {
    const limits = { ...DEFAULT_LIMITS };
    for (const key of Object.keys(limits)) {
        const value = options[key];
        if (value !== undefined) {
            if (!Number.isSafeInteger(value) || value < 1) {
                throw new RangeError(`${key} must be a positive safe integer.`);
            }
            limits[key] = value;
        }
    }
    return limits;
}
function integer(value, name, minimum = 0, maximum = 65535) {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
        throw new RangeError(`${name} must be an integer in [${minimum}, ${maximum}].`);
    }
}
function dimensions(width, height, limits) {
    integer(width, "Width", 1);
    integer(height, "Height", 1);
    const pixels = width * height;
    if (pixels > limits.maxPixels) {
        throw new RangeError(`Image dimensions ${width}x${height} exceed the pixel limit ${limits.maxPixels}.`);
    }
    return pixels;
}
/** Length check that does not apply `Array.isArray`'s `any[]` predicate to the caller's binding. */
function arrayLengthInRange(value, minimum, maximum) {
    return Array.isArray(value) && value.length >= minimum && value.length <= maximum;
}
function prepareInput(input, options, maxBytes) {
    for (const [name, value] of Object.entries({
        copyInput: options.copyInput,
        strict: options.strict,
        strict_block_size: options.rules?.strict_block_size,
        strict_lzw_minimum_code_size: options.rules?.strict_lzw_minimum_code_size,
    })) {
        if (value !== undefined && typeof value !== "boolean") {
            throw new TypeError(`${name} must be a boolean.`);
        }
    }
    if (options.plainText !== undefined &&
        options.plainText !== "reject" &&
        options.plainText !== "ignore") {
        throw new Error("plainText must be reject or ignore.");
    }
    if (input instanceof DataBuffer) {
        input = input.data;
    }
    let bytes;
    if (input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
    }
    else if (ArrayBuffer.isView(input)) {
        bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    else if (Array.isArray(input) || typeof input === "string") {
        if (input.length > maxBytes) {
            throw new RangeError("GIF exceeds the input byte limit.");
        }
        if (Array.isArray(input)) {
            for (const byte of input) {
                integer(byte, "Input byte", 0, 255);
            }
        }
        else {
            // DataBuffer strings use UTF-8. Check their encoded size before allocating that buffer.
            let length = 0;
            for (let i = 0; i < input.length; i++) {
                const code = input.charCodeAt(i);
                if (code < 0x80) {
                    length++;
                }
                else if (code < 0x800) {
                    length += 2;
                }
                else if (code >= 0xd800 &&
                    code <= 0xdbff &&
                    input.charCodeAt(i + 1) >= 0xdc00 &&
                    input.charCodeAt(i + 1) <= 0xdfff) {
                    length += 4;
                    i++;
                }
                else {
                    length += 3;
                }
                if (length > maxBytes) {
                    throw new RangeError("GIF exceeds the input byte limit.");
                }
            }
        }
        bytes = new DataBuffer(input).data;
    }
    else {
        throw new TypeError("ImageGIF requires GIF bytes, not an allocation length or unsupported input.");
    }
    if (bytes.length > maxBytes) {
        throw new RangeError("GIF exceeds the input byte limit.");
    }
    return options.copyInput === false ? bytes : Uint8Array.from(bytes);
}
/** Decode byte-oriented GIF text without UTF-8 replacement or Windows-1252 remapping. */
function byteString(bytes) {
    const parts = [];
    for (let i = 0; i < bytes.length; i += 8192) {
        parts.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
    }
    return parts.join("");
}
/** Validate exact indexes and preserve every palette slot, including duplicates and unused slots. */
function validateIndexed(image, limits) {
    dimensions(image.width, image.height, limits);
    if (!(image.indexes instanceof Uint8Array) ||
        image.indexes.length !== image.width * image.height) {
        throw new Error("Indexed buffer length does not match dimensions.");
    }
    if (image.indexes.length > limits.maxInflatedBytes) {
        throw new RangeError("GIF exceeds the inflated byte limit.");
    }
    if (!arrayLengthInRange(image.palette, 1, 256)) {
        throw new RangeError("GIF palette must contain 1 to 256 RGBA8 slots.");
    }
    let transparentIndex;
    for (let i = 0; i < image.palette.length; i++) {
        const color = image.palette[i];
        if (!arrayLengthInRange(color, 4, 4)) {
            throw new TypeError("Palette entries require RGBA8.");
        }
        for (const component of color) {
            integer(component, "Palette component", 0, 255);
        }
        if (color[3] !== 0 && color[3] !== 255) {
            throw new Error("GIF does not support partial alpha; supply binary transparency explicitly.");
        }
        if (color[3] === 0) {
            if (transparentIndex !== undefined) {
                throw new Error("GIF supports only one transparent palette slot per frame.");
            }
            transparentIndex = i;
        }
    }
    for (const index of image.indexes) {
        if (index >= image.palette.length) {
            throw new Error(`GIF palette index ${index} is out of range.`);
        }
    }
    return transparentIndex;
}
/** Small bounded byte writer, used for framing and owned file output. */
class GifWriter {
    bytes;
    length = 0;
    maximum;
    constructor(maximum) {
        this.maximum = maximum;
        this.bytes = new Uint8Array(Math.min(1024, maximum));
    }
    reserve(count) {
        const required = this.length + count;
        if (!Number.isSafeInteger(required) || required > this.maximum) {
            throw new RangeError("GIF exceeds the output byte limit.");
        }
        if (required > this.bytes.length) {
            const grown = new Uint8Array(Math.min(this.maximum, Math.max(required, this.bytes.length * 2)));
            grown.set(this.bytes);
            this.bytes = grown;
        }
    }
    byte(value) {
        this.reserve(1);
        this.bytes[this.length++] = value;
    }
    word(value) {
        this.reserve(2);
        this.bytes[this.length++] = value & 255;
        this.bytes[this.length++] = value >>> 8;
    }
    write(bytes) {
        this.reserve(bytes.length);
        this.bytes.set(bytes, this.length);
        this.length += bytes.length;
    }
    text(value) {
        this.reserve(value.length);
        for (let i = 0; i < value.length; i++) {
            this.bytes[this.length++] = value.charCodeAt(i);
        }
    }
    palette(colors) {
        const count = 1 << Math.max(1, Math.ceil(Math.log2(colors.length)));
        for (let i = 0; i < count; i++) {
            const color = colors[i];
            this.byte(color?.[0] ?? 0);
            this.byte(color?.[1] ?? 0);
            this.byte(color?.[2] ?? 0);
        }
    }
    subBlocks(bytes) {
        for (let i = 0; i < bytes.length; i += 255) {
            const block = bytes.subarray(i, i + 255);
            this.byte(block.length);
            this.write(block);
        }
        this.byte(0);
    }
    finish() {
        return this.bytes.slice(0, this.length);
    }
}
/** Write one fully validated graphics-control record. */
function writeControl(writer, delay, disposal, transparentIndex, userInput = false) {
    writer.write(Uint8Array.of(0x21, 0xf9, 4, (disposal << 2) | (userInput ? 2 : 0) | (transparentIndex === undefined ? 0 : 1)));
    writer.word(delay);
    writer.byte(transparentIndex ?? 0);
    writer.byte(0);
}
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
class ImageGIF extends DataBuffer {
    /** The GIF signature. */
    header;
    /** The GIF version. */
    version;
    /** The width of the image. */
    width;
    /** The height of the image. */
    height;
    /** The bit depth of the image. */
    bitDepth;
    /** The color type of the image. */
    colorType;
    /** The number of colors in the image. */
    colors;
    /** Whether the image has an alpha transparency layer. */
    alpha;
    /** The palette of the image. */
    palette;
    /** The pixels of the image. */
    pixels;
    /** The transparency of the image. */
    transparency;
    /** The frames of the image. */
    frames;
    /** The comments of the image. */
    comments;
    /** The application extensions of the image. */
    applicationExtensions;
    /** The image descriptors of the image. */
    imageDescriptors;
    /** The plain text extensions of the image. */
    plainTextExtensions;
    /** Whether the next byte is an image descriptor. */
    imageNext;
    /** Options for the ImageGIF instance. */
    options;
    /** The size of the global color table, set while decoding the logical screen descriptor. */
    sizeOfGlobalColorTable;
    /** The global color table of the image. */
    globalColorTable;
    /** The color resolution of the image. */
    colorResolution;
    /** The sort flag of the image. */
    sortFlag;
    /** The background color index of the image. */
    backgroundColorIndex;
    /** The pixel aspect ratio of the image. */
    pixelAspectRatio;
    /** The packed fields of the image descriptor. */
    packed;
    /** Parsed original block boundaries, including the trailer. */
    blocks;
    /** Netscape loop count; zero means infinite and undefined means no loop extension. */
    loopCount;
    /** Whether more than one raster frame is present. */
    animated;
    /** True once the first frame's indexes have decoded successfully. */
    _decoded;
    _limits;
    _framePixels;
    _pendingControl;
    _inflatedTotal;
    _blockCount;
    _unsupportedGraphics;
    /**
     * Creates a new ImageGIF.
     *
     * @param input The data to process.
     * @param options Options for this ImageGIF instance.
     * @class
     */
    constructor(input, options = {}) {
        const limits = resolveLimits(options);
        super(prepareInput(input, options, limits.maxInputBytes));
        this._limits = Object.freeze(limits);
        this._framePixels = new Map();
        this._pendingControl = undefined;
        this._inflatedTotal = 0;
        this._blockCount = 0;
        this._unsupportedGraphics = 0;
        this._decoded = false;
        this.blocks = [];
        this.loopCount = undefined;
        this.animated = false;
        // GIF Specific Details
        this.header = "";
        this.version = 0;
        this.width = 0;
        this.height = 0;
        this.bitDepth = 0;
        this.colorType = 0;
        this.colors = 0;
        this.alpha = false;
        this.sizeOfGlobalColorTable = 0;
        this.globalColorTable = 0;
        this.packed = 0;
        this.colorResolution = 0;
        this.sortFlag = 0;
        this.backgroundColorIndex = 0;
        this.pixelAspectRatio = 0;
        this.palette = new Uint8Array();
        this.pixels = new Uint8Array();
        this.transparency = new Uint8Array();
        this.frames = [];
        this.comments = [];
        this.applicationExtensions = [];
        this.imageDescriptors = [];
        this.plainTextExtensions = [];
        this.imageNext = false;
        this.options = Object.freeze({
            ...options,
            strict: options.strict ?? true,
            plainText: options.plainText ?? "reject",
            rules: Object.freeze({
                strict_block_size: options.rules?.strict_block_size ?? options.strict ?? true,
                strict_lzw_minimum_code_size: options.rules?.strict_lzw_minimum_code_size ?? options.strict ?? true,
            }),
        });
        debug("this.options", this.options);
        this.parse();
    }
    /**
     * Creates a new ImageGIF from file data.
     *
     * @param data The data of the image to process.
     * @param opts Options for this ImageGIF instance.
     * @returns The new ImageGIF instance for the provided file data
     * @static
     */
    static fromFile(data, opts = {}) {
        debug("fromFile:", data);
        return new ImageGIF(data, opts);
    }
    /**
     * Creates a new ImageGIF from a DataBuffer.
     *
     * @param buffer The DataBuffer of the image to process.
     * @param opts Options for this ImageGIF instance.
     * @returns The new ImageGIF instance for the provided DataBuffer
     * @static
     */
    static fromBuffer(buffer, opts = {}) {
        debug("fromBuffer:", buffer.length);
        return new ImageGIF(buffer, opts);
    }
    /**
     * Parse the GIF file, decoding the chunks.
     */
    parse() {
        debug("parse");
        if (this.data.length > this._limits.maxInputBytes) {
            throw new RangeError("GIF exceeds the input byte limit.");
        }
        this.reset();
        this.frames = [];
        this.comments = [];
        this.applicationExtensions = [];
        this.imageDescriptors = [];
        this.plainTextExtensions = [];
        this.blocks = [];
        this.loopCount = undefined;
        this.animated = false;
        this.palette = new Uint8Array();
        this.transparency = new Uint8Array();
        this.colors = 0;
        this.alpha = false;
        this._pendingControl = undefined;
        this._inflatedTotal = 0;
        this._blockCount = 0;
        this._unsupportedGraphics = 0;
        this.invalidatePixels();
        this.decodeHeader();
        this.decodeLogicalScreenDescriptor();
        if (this.globalColorTable === 1) {
            this.decodeGlobalColorTable();
            if (this.options.strict && this.backgroundColorIndex >= this.colors) {
                throw new Error("GIF background color index exceeds the global palette.");
            }
        }
        this.imageNext = false;
        while (this.remainingBytes() > 0) {
            this._countBlock();
            const offset = this.offset;
            const introducer = this.data[offset];
            let type;
            let label;
            let frameIndex;
            if (introducer === 0x21) {
                this._requireBytes(2, "extension header");
                label = this.data[offset + 1];
                switch (label) {
                    case 0xff:
                        type = "application";
                        this.decodeApplicationExtension();
                        break;
                    case 0xfe:
                        type = "comment";
                        this.decodeCommentExtension();
                        break;
                    case 0xf9:
                        type = "graphic-control";
                        this.decodeGraphicControlExtension();
                        break;
                    case 0x01:
                        type = "plain-text";
                        this.decodePlainTextExtension();
                        break;
                    default:
                        type = "extension";
                        if (label === 0xce) {
                            debug("🎁 NAME:", this.offset);
                            // NAME
                            // the only reference to this extension I could find was in gifsicle.
                            // I'm not sure if this is something gifsicle just made up or if this actually exists outside of this app
                        }
                        // Consume introducer and label before reading length-prefixed sub-blocks.
                        this.advance(2);
                        this._decodeDataSubBlocks();
                        if (label < 0x80) {
                            this._unsupportedGraphics++;
                            this._pendingControl = undefined;
                            this.imageNext = false;
                        }
                        break;
                }
            }
            else if (introducer === 0x2c) {
                type = "image";
                frameIndex = this.frames.length;
                // Descriptor failures are not swallowed: strict rules must reach the caller.
                this.decodeImageDescriptor();
            }
            else if (introducer === 0x3b) {
                debug("TRAILER 0x3B");
                this.advance(1);
                if (this.options.strict && this.remainingBytes() !== 0) {
                    throw new Error("GIF contains trailing bytes after the trailer.");
                }
                if (this.options.strict && this._pendingControl !== undefined) {
                    throw new Error("GIF has a graphic control extension without a rendering block.");
                }
                this.blocks.push({ type: "trailer", offset, end: this.offset });
                this.animated = this.frames.length > 1;
                return this;
            }
            else if (!this.options.strict && introducer === 0) {
                type = "padding";
                this.advance(1);
            }
            else {
                throw new Error(`Unknown GIF block 0x${introducer.toString(16)} at offset ${offset}.`);
            }
            this.blocks.push({ type, offset, end: this.offset, label, frameIndex });
        }
        if (this.options.strict) {
            throw new Error("GIF is missing its trailer.");
        }
        this.animated = this.frames.length > 1;
        return this;
    }
    decodeImageDescriptor() {
        this._requireBytes(10, "image descriptor");
        if (this.frames.length >= this._limits.maxFrames) {
            throw new RangeError("GIF exceeds the frame count limit.");
        }
        // 0x00: Image Separator - Identifies the beginning of an Image Descriptor. This field contains the fixed value 0x2C.
        debug("decodeImageDescriptor: at offset", this.offset);
        const imageDescriptor = {
            offset: this.offset,
            leftPosition: 0,
            topPosition: 0,
            width: 0,
            height: 0,
            packed: 0,
            localColorTableFlag: 0,
            interlaceFlag: 0,
            sortFlag: 0,
            localColorTableSize: 0,
            localColorTable: new Uint8Array(),
            lzwMinimumCodeSize: 0,
            lzwData: new Uint8Array(),
            end: 0,
            imageDataOffset: 0,
            unsupportedGraphicsBefore: this._unsupportedGraphics,
        };
        this.advance(1);
        // This is a bare image, not prefaced with a Graphics Control Extension so we should treat it as a frame.
        // Publish either kind of frame only after its entire image descriptor has parsed successfully.
        const frame = {
            index: this.frames.length,
            delay: 0,
            ...this._pendingControl,
        };
        // 0x01: Image Left Position - Column number, in pixels, of the left edge of the image, with respect to the left edge of the Logical Screen. Leftmost column of the Logical Screen is 0.
        imageDescriptor.leftPosition = this.readUInt16(true);
        debug("Left Position:", imageDescriptor.leftPosition);
        // 0x03: Image Top Position - Row number, in pixels, of the top edge of the image with respect to the top edge of the Logical Screen. Top row of the Logical Screen is 0.
        imageDescriptor.topPosition = this.readUInt16(true);
        debug("top position:", imageDescriptor.topPosition);
        // 0x05: Image Width - Width of the image in pixels.
        imageDescriptor.width = this.readUInt16(true);
        debug("Width:", imageDescriptor.width);
        // 0x07: Image Height - Height of the image in pixels.
        imageDescriptor.height = this.readUInt16(true);
        debug("Height:", imageDescriptor.height);
        const count = dimensions(imageDescriptor.width, imageDescriptor.height, this._limits);
        if (this._inflatedTotal + count > this._limits.maxInflatedBytes) {
            throw new RangeError("GIF exceeds the aggregate inflated byte limit.");
        }
        if (this.options.strict &&
            (imageDescriptor.leftPosition + imageDescriptor.width > this.width ||
                imageDescriptor.topPosition + imageDescriptor.height > this.height)) {
            throw new Error("GIF frame rectangle exceeds the logical screen.");
        }
        // 0x09: Packed Field:
        // Local Color Table Flag        1 Bit
        // Interlace Flag                1 Bit
        // Sort Flag                     1 Bit
        // Reserved                      2 Bits
        // Size of Local Color Table     3 Bits
        const packed = this.readUInt8();
        imageDescriptor.packed = packed;
        if (this.options.strict && (packed & 0x18) !== 0) {
            throw new Error("GIF image descriptor contains reserved bits.");
        }
        const localColorTableFlag = packed >> 7;
        imageDescriptor.localColorTableFlag = localColorTableFlag;
        const interlaceFlag = (packed >> 6) & 1;
        imageDescriptor.interlaceFlag = interlaceFlag;
        const sortFlag = (packed >> 5) & 1;
        imageDescriptor.sortFlag = sortFlag;
        const localColorTableSize = packed & 7;
        imageDescriptor.localColorTableSize = localColorTableSize;
        if (localColorTableFlag) {
            debug(`LOCAL COLOR TABLE IS ${3 * 2 ** (localColorTableSize + 1)} BYTES`);
            this._requireBytes(3 * 2 ** (localColorTableSize + 1), "local color table");
            imageDescriptor.localColorTable = this.read(3 * 2 ** (localColorTableSize + 1));
            debug("localColorTable bytes:", imageDescriptor.localColorTable.length);
        }
        else {
            debug("NO LOCAL COLOR TABLE");
        }
        this._requireBytes(1, "LZW minimum code size");
        imageDescriptor.imageDataOffset = this.offset;
        const lzwMinimumCodeSize = this.readUInt8();
        if (lzwMinimumCodeSize < 2 || lzwMinimumCodeSize > 8) {
            const error = `Invalid LZW Minimum Code Size: ${lzwMinimumCodeSize} < 2 or ${lzwMinimumCodeSize} > 8`;
            debug(this.options.rules);
            if (this.options.rules?.strict_lzw_minimum_code_size) {
                throw new Error(error);
            }
        }
        debug(`LZW Minimum Code Size: ${this.offset} === 0x${lzwMinimumCodeSize.toString(16)} / ${lzwMinimumCodeSize}`);
        debug("Table Based Image Data:", this.offset);
        imageDescriptor.lzwMinimumCodeSize = lzwMinimumCodeSize;
        imageDescriptor.lzwData = this._decodeDataSubBlocks();
        imageDescriptor.end = this.offset;
        const palette = localColorTableFlag ? imageDescriptor.localColorTable : this.palette;
        if (palette.length !== 0 &&
            frame.transparentIndex !== undefined &&
            frame.transparentIndex >= palette.length / 3) {
            throw new Error("GIF transparent color index exceeds the active palette.");
        }
        this.imageDescriptors.push(imageDescriptor);
        this.frames.push(frame);
        this._inflatedTotal += count;
        this._pendingControl = undefined;
        this.imageNext = false;
        this.alpha ||= frame.transparentIndex !== undefined;
        if (frame.index === 0) {
            this.bitDepth = Math.max(1, Math.ceil(Math.log2(palette.length / 3 || 2)));
            if (this.palette.length === 0) {
                this.colors = palette.length / 3;
            }
            if (frame.transparentIndex !== undefined) {
                this.transparency = new Uint8Array(palette.length / 3).fill(255);
                this.transparency[frame.transparentIndex] = 0;
            }
        }
    }
    // 0x00: Extension Introducer - Identifies the beginning of an extension block. This field contains the fixed value 0x21.
    // 0x01: Graphic Control Label - Identifies the current block as a Graphic Control Extension. This field contains the fixed value 0xF9.
    // 0x03: Block Size - Number of bytes in the block, after the Block Size field and up to but not including the Block Terminator. This field should contain the fixed value 0x04.
    // 0x04: Packed Fields:
    //       Reserved: 3 Bits
    //       Disposal Method: 3 Bits
    //       User Input Flag: 1 Bit
    //       Transparent Color Flag: 1 Bit
    // Disposal Method - Indicates the way in which the graphic is to be treated after being displayed.
    // Values: 0 - No disposal specified. The decoder is not required to take any action.
    //         1 - Do not dispose. The graphic is to be left in place.
    //         2 - Restore to background color. The area used by the graphic must be restored to the background color.
    //         3 - Restore to previous. The decoder is required to restore the area overwritten by the graphic with what was there prior to rendering the graphic.
    //       4-7 - Unused.
    // User Input Flag - Indicates whether or not user input is expected before continuing. If the flag is set, processing will continue when user input is entered. The nature of the User input is determined by the application (Carriage Return, Mouse Button Click, etc.).
    // Values: 0 - User input is not expected.
    //         1 - User input is expected.
    // When a Delay Time is used and the User Input Flag is set, processing will continue when user input is received or when the delay time expires, whichever occurs first.
    // Transparency Flag - Indicates whether a transparency index is given in the Transparent Index field. (This field is the least significant bit of the byte.)
    // Values: 0 - Transparent Index is not given.
    //         1 - Transparent Index is given.
    // 0x05 - 0x06: Delay Time - If not 0, this field specifies the number of hundredths (1/100) of a second to wait before continuing with the processing of the Data Stream. The clock starts ticking immediately after the graphic is rendered. This field may be used in conjunction with the User Input Flag field.
    // 0x07: Transparent Color Index - The Transparency Index is such that when encountered, the corresponding pixel of the display device is not modified and processing goes on to the next pixel. The index is present if and only if the Transparency Flag is set to 1.
    decodeGraphicControlExtension() {
        debug("decodeGraphicControlExtension: offset", this.offset);
        this._requireBytes(3, "graphic control extension");
        const graphicControlOffset = this.offset;
        if (this.options.strict && this._pendingControl !== undefined) {
            throw new Error("GIF has multiple graphic control extensions for one rendering block.");
        }
        this.advance(2);
        const blockSize = this.readUInt8();
        debug("blockSize:", blockSize);
        if (blockSize !== 4) {
            const error = `Invalid Graphic Control Block Size: ${blockSize} !== 4`;
            debug(error);
            if (this.options.rules?.strict_block_size || blockSize < 4) {
                throw new Error(error);
            }
        }
        this._requireBytes(blockSize + 1, "graphic control payload");
        const packed = this.readUInt8();
        const disposalMethod = (packed >>> 2) & 7;
        if (this.options.strict && ((packed & 0xe0) !== 0 || disposalMethod > 3)) {
            throw new Error("GIF graphic control contains reserved bits or disposal method.");
        }
        debug(`DISPOSAL ${disposalMethod}`);
        const delay = this.readUInt16(true);
        const transparentIndex = this.readUInt8();
        this.advance(blockSize - 4);
        if (this.readUInt8() !== 0) {
            throw new Error("Invalid GIF graphic control block terminator.");
        }
        this._pendingControl = {
            delay,
            disposal: disposalMethod,
            userInput: (packed & 2) !== 0,
            graphicControlOffset,
        };
        if ((packed & 1) !== 0) {
            this._pendingControl.transparentIndex = transparentIndex;
        }
        debug(`FRAME DELAY ${delay}`);
        this.imageNext = true;
    }
    decodeApplicationExtension() {
        debug("decodeApplicationExtension:", this.offset);
        const offset = this.offset;
        this._requireBytes(3, "application extension");
        // 0x00: Extension Label - Defines this block as an extension. This field contains the fixed value 0x21 (33).
        // 0x01: Application Extension Label - Identifies the block as an Application Extension. This field contains the fixed value 0xFF (255).
        this.advance(2);
        // 0x02: Block Size - Number of bytes in this extension block, following the Block Size field, up to but not including the beginning of the Application Data.
        const blockSize = this.readUInt8();
        if (blockSize < 11 || (blockSize !== 11 && this.options.rules?.strict_block_size)) {
            throw new Error(`Invalid Application Block Size: ${blockSize} !== 11`);
        }
        this._requireBytes(blockSize, "application identifier");
        // 0x03: Application Identifier - Sequence of eight printable ASCII characters used to identify the application owning the Application Extension.
        const applicationIdentifier = byteString(this.read(8));
        // 0x0B: Application Authentication Code - Sequence of three bytes used to authenticate the Application Identifier. An Application program may use an algorithm to compute a binary code that uniquely identifies it as the application owning the Application Extension. For Netscape looping this field contains "2.0"; other applications use their own authentication code. Sometimes Application Identifier and Application Authentication Code fields are referred as one "NETSCAPE2.0" field.
        const applicationAuthenticationCode = byteString(this.read(3));
        this.advance(blockSize - 11);
        // 0x0E: Sub-block Data Size - Indicates the number of data bytes to follow. The size of the block does not account for the size byte itself.
        // Read every length-prefixed sub-block, not bytes up to the first zero in a binary payload.
        const data = this._decodeDataSubBlocks();
        const extension = {
            offset,
            applicationIdentifier,
            applicationAuthenticationCode,
            data,
        };
        if (((applicationIdentifier === "NETSCAPE" && applicationAuthenticationCode === "2.0") ||
            (applicationIdentifier === "ANIMEXTS" && applicationAuthenticationCode === "1.0")) &&
            data[0] === 1) {
            // 0x0F: Sub-block ID - Identifies the Netscape Looping Extension.
            if (data.length < 3) {
                throw new Error("Invalid GIF looping application data.");
            }
            // 0x10: Loop Count - Indicates the number of iterations the animated GIF should be executed. This field is an unsigned 2-byte integer in little-endian (least significant byte first) byte order. 0x00 (0) means infinite loop.
            extension.loopCount = data[1] | (data[2] << 8);
            this.loopCount = extension.loopCount;
            // 0x12: Block Terminator - This zero-length data block marks the end of the Application Extension.
            // The shared sub-block reader has already consumed the terminator.
        }
        else {
            debug("Unsupported:", applicationIdentifier);
        }
        this.applicationExtensions.push(extension);
    }
    decodeCommentExtension() {
        debug("decodeCommentExtension:", this.offset);
        this._requireBytes(2, "comment extension");
        const comment = { offset: this.offset };
        this.advance(2);
        comment.comment = byteString(this._decodeDataSubBlocks());
        this.comments.push(comment);
        debug("comment:", comment.comment);
    }
    decodePlainTextExtension() {
        this._requireBytes(3, "plain text extension");
        debug("decodePlainTextExtension:", this.offset);
        const plainText = { offset: this.offset };
        // Extension Introducer - Identifies the beginning of an extension block. This field contains the fixed value 0x21.
        // Plain Text Label - Identifies the current block as a Plain Text Extension. This field contains the fixed value 0x01.
        this.advance(2);
        // Block Size - Number of bytes in the extension, after the Block Size field and up to but not including the beginning of the data portion. This field contains the fixed value 12.
        const blockSize = this.readUInt8();
        debug("blockSize:", blockSize);
        if (blockSize < 12 || (blockSize !== 12 && this.options.rules?.strict_block_size)) {
            throw new Error(`Invalid Plain Text Block Size: ${blockSize} !== 12`);
        }
        this._requireBytes(blockSize, "plain text header");
        // Text Grid Left Position - Column number, in pixels, of the left edge of the text grid, with respect to the left edge of the Logical Screen.
        plainText.textGridLeftPosition = this.readUInt16(true);
        debug("Text Grid Left Position:", plainText.textGridLeftPosition);
        // Text Grid Top Position - Row number, in pixels, of the top edge of the text grid, with respect to the top edge of the Logical Screen.
        plainText.textGridTopPosition = this.readUInt16(true);
        debug("Text Grid Top Position:", plainText.textGridTopPosition);
        // Image Grid Width - Width of the text grid in pixels.
        plainText.imageGridWidth = this.readUInt16(true);
        debug("Image Grid Width:", plainText.imageGridWidth);
        // Image Grid Height - Height of the text grid in pixels.
        plainText.imageGridHeight = this.readUInt16(true);
        debug("Image Grid Height:", plainText.imageGridHeight);
        // Character Cell Width - Width, in pixels, of each cell in the grid.
        plainText.characterCellWidth = this.readUInt8();
        debug("Character Cell Width:", plainText.characterCellWidth);
        // Character Cell Height - Height, in pixels, of each cell in the grid.
        plainText.characterCellHeight = this.readUInt8();
        debug("Character Cell Height:", plainText.characterCellHeight);
        // Text Foreground Color Index - Index into the Global Color Table to be used to render the text foreground.
        plainText.textForegroundColorIndex = this.readUInt8();
        debug("Text Foreground Color Index:", plainText.textForegroundColorIndex);
        // Text Background Color Index - Index into the Global Color Table to be used to render the text background.
        plainText.textBackgroundColorIndex = this.readUInt8();
        debug("Text Background Color Index:", plainText.textBackgroundColorIndex);
        // Plain Text Data - Sequence of sub-blocks, each of size at most 255 bytes and at least 1 byte, with the size in a byte preceding the data. The end of the sequence is marked by the Block Terminator.
        // Block Terminator - This zero-length data block marks the end of the Plain Text Data Blocks.
        this.advance(blockSize - 12);
        plainText.plainText = byteString(this._decodeDataSubBlocks());
        if (this.options.strict) {
            if (!this.globalColorTable || this.palette.length === 0) {
                throw new Error("GIF plain text requires a global color table.");
            }
            if (!plainText.imageGridWidth ||
                !plainText.imageGridHeight ||
                !plainText.characterCellWidth ||
                !plainText.characterCellHeight ||
                plainText.textGridLeftPosition + plainText.imageGridWidth > this.width ||
                plainText.textGridTopPosition + plainText.imageGridHeight > this.height) {
                throw new Error("Invalid GIF plain text grid or cell dimensions.");
            }
            if (plainText.textForegroundColorIndex >= this.palette.length / 3 ||
                plainText.textBackgroundColorIndex >= this.palette.length / 3) {
                throw new Error("GIF plain text color index exceeds the global palette.");
            }
            if (this._pendingControl?.transparentIndex !== undefined &&
                this._pendingControl.transparentIndex >= this.palette.length / 3) {
                throw new Error("GIF plain text transparency exceeds the global palette.");
            }
        }
        plainText.graphicControl = this._pendingControl;
        this._pendingControl = undefined;
        this.imageNext = false;
        this._unsupportedGraphics++;
        this.plainTextExtensions.push(plainText);
        debug("plainTextData:", plainText.plainText);
    }
    /**
     * Decodes the Data Sub Blocks.
     * @returns {number[]} The decoded data
     */
    decodeDataSubBlocks() {
        debug("decodeDataSubBlocks:", this.offset);
        // debug('blockSize:', blockSize);
        /** @type {number[]} */
        const data = Array.from(this._decodeDataSubBlocks());
        // this.advance(blockSize);
        // debug('blockSize:', blockSize);
        return data;
    }
    /** Join validated payloads in one allocation, retaining no per-byte boxed array. */
    _decodeDataSubBlocks() {
        this._requireBytes(0, "data sub-block offset");
        const start = this.offset;
        let offset = start;
        let length = 0;
        while (true) {
            this._countBlock();
            if (offset >= this.data.length) {
                throw new Error("Truncated GIF data sub-block or missing terminator.");
            }
            const size = this.data[offset++];
            if (size === 0) {
                break;
            }
            if (size > this.data.length - offset) {
                throw new Error("Truncated GIF data sub-block payload.");
            }
            length += size;
            offset += size;
        }
        const output = new Uint8Array(length);
        let source = start;
        let destination = 0;
        while (this.data[source] !== 0) {
            const size = this.data[source++];
            output.set(this.data.subarray(source, source + size), destination);
            destination += size;
            source += size;
        }
        this.seek(offset);
        return output;
    }
    /** Enforce framing before asking DataBuffer to consume a field. */
    _requireBytes(count, field) {
        if (!Number.isSafeInteger(this.offset) ||
            this.offset < 0 ||
            count > this.data.length - this.offset) {
            throw new Error(`Truncated GIF ${field}.`);
        }
    }
    /** Bound parser work even for many empty extensions or one-byte payloads. */
    _countBlock() {
        if (++this._blockCount > this._limits.maxBlocks) {
            throw new RangeError("GIF exceeds the block count limit.");
        }
    }
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
    decodeHeader() {
        debug("decodeHeader:", this.offset);
        /* c8 ignore next 3 */
        if (this.offset !== 0) {
            debug("Offset should be at 0 to read the header.");
        }
        if (this.remainingBytes() < 6) {
            throw new Error("Missing or invalid GIF header.");
        }
        const header = this.readString(6);
        debug("Header:", header);
        if (header === "GIF89a") {
            this.version = 89;
        }
        else if (header === "GIF87a") {
            this.version = 87;
        }
        else {
            throw new Error("Missing or invalid GIF header.");
        }
        this.header = header;
    }
    /**
     * Decodes and parse GIF Logical Screen Descriptor.
     * The logical screen descriptor always immediately follows the header.
     * This block tells the decoder how much room this image will take up.
     * It is exactly seven bytes long.
     */
    decodeLogicalScreenDescriptor() {
        debug("decodeLogicalScreenDescriptor:", this.offset);
        /* c8 ignore next 3 */
        if (this.offset !== 6) {
            debug("Offset should be at 6, just after the header.");
        }
        this._requireBytes(7, "logical screen descriptor");
        // Width & Height are 16-bit, nonnegative integers (0-65,535).
        this.width = this.readUInt16(true);
        this.height = this.readUInt16(true);
        dimensions(this.width, this.height, this._limits);
        this.colorType = 3;
        // The next byte contains four fields of packed data, the "logical screen descriptor".
        this.packed = this.readUInt8();
        const packed = this.packed;
        // The first (most-significant) bit is the global color table flag.
        // If it's 0, then there is no global color table.
        // If it's 1, then a global color table will follow.
        this.globalColorTable = packed >>> 7;
        // The next three bits are the color resolution.
        // This is the source color precision minus one, not the size of the global color table.
        // If the value of this field is N, the source had N+1 bits per primary color; the low three packed bits specify the table size separately.
        this.colorResolution = (packed >>> 4) & 7;
        // The next single bit is the sort flag.
        // If the values is 1, then the colors in the global color table are sorted in order of "decreasing importance," which typically means "decreasing frequency" in the image.
        // This can help the image decoder, but is not required.
        this.sortFlag = (packed >>> 3) & 1;
        // The length of the global color table is 2^(N+1) entries where N is the value of the color depth field in the logical screen descriptor.
        // The table will take up 3*2^(N+1) bytes in the stream.
        // | LSD | Colors | Bytes |
        // |-----|--------|-------|
        // |   0 |      2 |     6 |
        // |   1 |      4 |    12 |
        // |   2 |      8 |    24 |
        // |   3 |     16 |    48 |
        // |   4 |     32 |    96 |
        // |   5 |     64 |   192 |
        // |   6 |    128 |   384 |
        // |   7 |    256 |   768 |
        this.sizeOfGlobalColorTable = packed & 7;
        this.bitDepth = this.sizeOfGlobalColorTable + 1;
        // The next byte gives us the background color index.
        // This byte is only meaningful if the global color table flag is 1, and if there is no global color table, this byte should be 0.
        // To understand it you have to remember the original "picture wall" rendering model for GIFs in which sub-images are composited onto a larger canvas.
        // It represents which index in the global color table should be used for pixels on the virtual canvas that aren't overlayed by an image.
        this.backgroundColorIndex = this.readUInt8();
        // The last byte of the logical screen descriptor is the pixel aspect ratio.
        // The GIF standard doesn't give a rationale for it, but it seems likely that the designers intended it for representing image captures from the analog television of the day, which had rectangular pixel-equivalents.
        // The GIF specification says that if there was a value specified in this byte, N, the actual ratio used would be (N + 15) / 64 for all N<>0.
        this.pixelAspectRatio = this.readUInt8();
        const output = JSON.stringify({
            width: this.width,
            height: this.height,
            globalColorTable: this.globalColorTable,
            colorResolution: this.colorResolution,
            sortFlag: this.sortFlag,
            sizeOfGlobalColorTable: this.sizeOfGlobalColorTable,
            backgroundColorIndex: this.backgroundColorIndex,
            pixelAspectRatio: this.pixelAspectRatio,
        });
        debug(`decodeLogicalScreenDescriptor: ${output}`);
    }
    /**
     * Decodes the Global Color Table.
     *
     * GIFs can have either a global color table or local color tables for each sub-image.
     * Each color table consists of a list of RGB (Red-Green-Blue) color component intensities, three bytes for each color, with intensities ranging from 0 (least) to 255 (most).
     * The color (0,0,0) is deepest black, the color (255,255,255) brightest white.
     * This block is "optional" as not every GIF has to specify a global color table.
     * If the global color table flag is set to 1 in the logical screen descriptor block, the global color table is then required to immediately follow that block.
     */
    decodeGlobalColorTable() {
        debug("decodeGlobalColorTable:", this.offset);
        // `sizeOfGlobalColorTable` is always set by decodeLogicalScreenDescriptor() before this runs.
        this.colors = 2 ** (this.sizeOfGlobalColorTable + 1);
        this._requireBytes(this.colors * 3, "global color table");
        this.palette = this.read(this.colors * 3);
        debug("colors =", this.colors);
        debug("palette size =", this.colors * 3);
    }
    /** Discard cached native indexes without modifying the original compressed image data. */
    invalidatePixels(frameIndex) {
        if (frameIndex === undefined) {
            this._framePixels.clear();
            this.pixels = new Uint8Array();
            this._decoded = false;
            return;
        }
        this._frame(frameIndex);
        this._framePixels.delete(frameIndex);
        if (frameIndex === 0) {
            this.pixels = new Uint8Array();
            this._decoded = false;
        }
    }
    /** Validate a raster frame reference independently of the publicly mutable pixel cache. */
    _frame(frameIndex) {
        if (this.imageDescriptors.length === 0) {
            throw new Error("No image descriptors found");
        }
        integer(frameIndex, "Frame index", 0, this.imageDescriptors.length - 1);
        return this.imageDescriptors[frameIndex];
    }
    /** Local tables override the global table; missing tables cannot be invented for rendering. */
    _paletteForFrame(frameIndex) {
        const frame = this._frame(frameIndex);
        const palette = frame.localColorTableFlag ? frame.localColorTable : this.palette;
        if (palette.length === 0 || palette.length % 3 !== 0 || palette.length > 768) {
            throw new Error("GIF frame requires a valid active color table.");
        }
        return palette;
    }
    /** Expand palette slots without merging duplicate colors or losing transparent RGB. */
    _paletteRGBA(frameIndex) {
        const bytes = this._paletteForFrame(frameIndex);
        const transparent = this.frames[frameIndex].transparentIndex;
        const palette = [];
        for (let i = 0; i < bytes.length; i += 3) {
            palette.push([bytes[i], bytes[i + 1], bytes[i + 2], i / 3 === transparent ? 0 : 255]);
        }
        return palette;
    }
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
    decodePixels({ frameIndex = 0, force = false, } = {}) {
        debug("decodePixels");
        const imageDescriptor = this._frame(frameIndex);
        if (typeof force !== "boolean") {
            throw new TypeError("force must be a boolean.");
        }
        if (force) {
            this.invalidatePixels(frameIndex);
        }
        if (frameIndex === 0 && this._decoded) {
            return this.pixels;
        }
        const cached = this._framePixels.get(frameIndex);
        if (cached !== undefined) {
            return cached;
        }
        // Use the first image descriptor unless another frame was explicitly selected.
        const { width, height, lzwMinimumCodeSize, lzwData } = imageDescriptor;
        const count = dimensions(width, height, this._limits);
        if (count > this._limits.maxInflatedBytes) {
            throw new RangeError("GIF exceeds the inflated byte limit.");
        }
        const palette = this._paletteForFrame(frameIndex);
        // Decompress the LZW data
        const lzw = new GIFLZW(lzwData);
        let pixels = lzw.decompressBytes(lzwMinimumCodeSize, true, {
            expectedLength: count,
            maxInputBytes: this._limits.maxInputBytes,
            maxOutputBytes: this._limits.maxInflatedBytes,
            allowTrailingBytes: !this.options.strict,
        });
        // Decode directly to a Uint8Array of palette indices, without an intermediate string.
        if (imageDescriptor.interlaceFlag) {
            const rows = new Uint8Array(count);
            let source = 0;
            for (const [start, step] of GIF_PASSES) {
                for (let y = start; y < height; y += step) {
                    rows.set(pixels.subarray(source, source + width), y * width);
                    source += width;
                }
            }
            pixels = rows;
        }
        for (const index of pixels) {
            if (index >= palette.length / 3) {
                throw new Error(`GIF palette index ${index} is out of range.`);
            }
        }
        // Publish only a complete, validated frame. Failures never cache partial output.
        if (frameIndex === 0) {
            this.pixels = pixels;
            this._decoded = true;
        }
        else {
            this._framePixels.set(frameIndex, pixels);
        }
        debug("Decompressed", pixels.length, "pixels");
        return pixels;
    }
    /** Return native frame indexes and newly owned RGBA slots, preserving palette identity. */
    toIndexed({ frameIndex = 0, copy = true, } = {}) {
        if (typeof copy !== "boolean") {
            throw new TypeError("copy must be a boolean.");
        }
        const descriptor = this._frame(frameIndex);
        const pixels = this.decodePixels({ frameIndex });
        const palette = this._paletteRGBA(frameIndex);
        return {
            kind: "indexed-image",
            frameIndex,
            width: descriptor.width,
            height: descriptor.height,
            leftPosition: descriptor.leftPosition,
            topPosition: descriptor.topPosition,
            sourceBitDepth: Math.max(1, Math.ceil(Math.log2(palette.length))),
            indexes: copy ? Uint8Array.from(pixels) : pixels,
            palette,
        };
    }
    /** Validate rendering choices before allocating pixels or interpreting unsupported graphics. */
    _renderOptions(options) {
        const frameIndex = options.frameIndex ?? 0;
        const descriptor = this._frame(frameIndex);
        if (options.copy !== undefined && typeof options.copy !== "boolean") {
            throw new TypeError("copy must be a boolean.");
        }
        if (options.composited !== undefined && typeof options.composited !== "boolean") {
            throw new TypeError("composited must be a boolean.");
        }
        if (options.background !== undefined &&
            options.background !== "auto" &&
            options.background !== "transparent" &&
            options.background !== "logical-screen") {
            throw new Error("background must be auto, transparent, or logical-screen.");
        }
        if (options.composited !== false &&
            descriptor.unsupportedGraphicsBefore !== 0 &&
            this.options.plainText !== "ignore") {
            throw new Error("GIF contains unsupported rendering blocks; use plainText: ignore explicitly to render raster frames only.");
        }
        return frameIndex;
    }
    /** Resolve the logical background as a packed RGBA word without allocating a color tuple. */
    _backgroundWord(frameIndex, policy = "auto") {
        if (policy === "transparent" ||
            (policy === "auto" && this.frames[frameIndex].transparentIndex !== undefined)) {
            return 0;
        }
        const offset = this.backgroundColorIndex * 3;
        if (this.globalColorTable && offset + 3 <= this.palette.length) {
            return (this.palette[offset] |
                (this.palette[offset + 1] << 8) |
                (this.palette[offset + 2] << 16) |
                0xff000000);
        }
        return 0;
    }
    /** Expand a background word for RgbaSurface.fill(); individual pixel reads avoid this allocation. */
    _background(frameIndex, policy = "auto") {
        const word = this._backgroundWord(frameIndex, policy);
        return [word & 255, (word >>> 8) & 255, (word >>> 16) & 255, word >>> 24];
    }
    /**
     * Render working snapshots sequentially. The yielded surface is borrowed until iteration resumes.
     * Restore-to-previous saves only the affected rectangle, rather than an entire canvas per frame.
     * @param lastIndex The index of the last frame to render.
     * @param background The background color to use for the render.
     * @returns A generator of RgbaSurface objects.
     * @yields RgbaSurface The rendered frame.
     */
    *_render(lastIndex, background) {
        const bytes = dimensions(this.width, this.height, this._limits) * 4;
        if (bytes > this._limits.maxRenderedBytes) {
            throw new RangeError("GIF exceeds the rendered byte limit.");
        }
        const canvas = new RgbaSurface(this.width, this.height, undefined, {
            maxPixels: this._limits.maxPixels,
        });
        canvas.fill(this._background(0, background));
        for (let frameIndex = 0; frameIndex <= lastIndex; frameIndex++) {
            const descriptor = this._frame(frameIndex);
            const frame = this.frames[frameIndex];
            const pixels = this.decodePixels({ frameIndex });
            const palette = this._paletteForFrame(frameIndex);
            const left = descriptor.leftPosition;
            const top = descriptor.topPosition;
            const width = Math.max(0, Math.min(descriptor.width, this.width - left));
            const height = Math.max(0, Math.min(descriptor.height, this.height - top));
            let previous;
            if (frame.disposal === 3 && frameIndex < lastIndex && width > 0 && height > 0) {
                if (bytes + width * height * 4 > this._limits.maxRenderedBytes) {
                    throw new RangeError("GIF exceeds the rendered byte limit.");
                }
                previous = canvas.crop(left, top, width, height);
            }
            for (let y = 0; y < height; y++) {
                let source = y * descriptor.width;
                let destination = ((top + y) * this.width + left) * 4;
                for (let x = 0; x < width; x++, source++, destination += 4) {
                    const index = pixels[source];
                    if (index === undefined || index >= palette.length / 3) {
                        throw new Error(`GIF palette index ${index} is out of range.`);
                    }
                    if (index !== frame.transparentIndex) {
                        const color = index * 3;
                        canvas.rgba[destination] = palette[color];
                        canvas.rgba[destination + 1] = palette[color + 1];
                        canvas.rgba[destination + 2] = palette[color + 2];
                        canvas.rgba[destination + 3] = 255;
                    }
                }
            }
            yield canvas;
            if (frame.disposal === 2) {
                canvas.fill(this._background(frameIndex, background), { x: left, y: top, width, height });
            }
            else if (previous !== undefined) {
                canvas.blit(previous, left, top);
            }
        }
    }
    /**
     * Convert to an owned RgbaSurface for drawing, blitting, cropping, flipping, scaling, or text.
     * By default return the selected composited logical-screen snapshot. Native indexes are unchanged.
     * Set composited: false to convert only the selected frame rectangle, retaining hidden RGB.
     */
    toRGBA(options = {}) {
        const frameIndex = this._renderOptions(options);
        if (options.composited === false) {
            const frame = this.toIndexed({ frameIndex, copy: false });
            if (frame.width * frame.height * 4 > this._limits.maxRenderedBytes) {
                throw new RangeError("GIF exceeds the rendered byte limit.");
            }
            return RgbaSurface.fromIndexed(frame, { maxPixels: this._limits.maxPixels });
        }
        let index = 0;
        for (const surface of this._render(frameIndex, options.background)) {
            if (index++ === frameIndex) {
                // Returning closes the generator before disposal can modify this owned snapshot.
                return surface;
            }
        }
        throw new Error("GIF has no renderable frame.");
    }
    /** Decode one animation snapshot, preserving the same rendering choices as toRGBA(). */
    decodeFrame(frameIndex = 0, options = {}) {
        return this.toRGBA({ ...options, frameIndex });
    }
    /** Decode independently owned logical-screen snapshots with timing and disposal metadata. */
    decodeFrames(options = {}) {
        const last = this.imageDescriptors.length - 1;
        this._renderOptions({ ...options, frameIndex: last });
        const bytes = dimensions(this.width, this.height, this._limits) * 4;
        // Account for returned snapshots, one working canvas, and a worst-case previous rectangle.
        if (bytes * (this.frames.length + 2) > this._limits.maxRenderedBytes) {
            throw new RangeError("GIF exceeds the aggregate rendered byte limit.");
        }
        const result = [];
        for (const surface of this._render(last, options.background)) {
            result.push({ ...this.frames[result.length], surface: surface.clone() });
        }
        return result;
    }
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
    getPixel(x, y, options = {}) {
        const output = [0, 0, 0, 0];
        this._writePixel(x, y, output, 0, options);
        return output;
    }
    /** Write one rendered pixel without allocating a tuple or a full RGBA canvas. */
    getPixelInto(x, y, output, offset = 0, options = {}) {
        integer(offset, "Output offset", 0, Number.MAX_SAFE_INTEGER);
        if (!(output instanceof Uint8Array) || offset > output.length - 4) {
            throw new RangeError("Output needs four writable bytes.");
        }
        this._writePixel(x, y, output, offset, options);
        return output;
    }
    /** Resolve only one pixel through the animation; decoded native frames are reused. */
    _writePixel(x, y, output, offset, options) {
        const selected = this._renderOptions(options);
        const native = options.composited === false;
        const descriptor = this._frame(selected);
        const width = native ? descriptor.width : this.width;
        const height = native ? descriptor.height : this.height;
        if (!Number.isSafeInteger(x) || x >= width || x < 0) {
            throw new RangeError(`x position out of bounds or invalid: ${x}`);
        }
        if (!Number.isSafeInteger(y) || y >= height || y < 0) {
            throw new RangeError(`y position out of bounds or invalid: ${y}`);
        }
        let background = this._backgroundWord(0, options.background);
        let red = background & 255, green = (background >>> 8) & 255;
        let blue = (background >>> 16) & 255, alpha = background >>> 24;
        for (let frameIndex = native ? selected : 0; frameIndex <= selected; frameIndex++) {
            const frame = this.frames[frameIndex];
            const image = this._frame(frameIndex);
            const pixels = this.decodePixels({ frameIndex });
            const sx = native ? x : x - image.leftPosition;
            const sy = native ? y : y - image.topPosition;
            const inside = sx >= 0 && sy >= 0 && sx < image.width && sy < image.height;
            const previousRed = red, previousGreen = green, previousBlue = blue, previousAlpha = alpha;
            if (inside) {
                // Calculate the index in the pixels array using the frame's own row stride.
                const paletteIndex = pixels[sy * image.width + sx];
                if (native || paletteIndex !== frame.transparentIndex) {
                    // Look up the color in the active palette.
                    // Each palette entry is 3 bytes (RGB)
                    const palette = this._paletteForFrame(frameIndex);
                    if (paletteIndex === undefined || paletteIndex >= palette.length / 3) {
                        throw new Error(`GIF palette index ${paletteIndex} is out of range.`);
                    }
                    red = palette[paletteIndex * 3];
                    green = palette[paletteIndex * 3 + 1];
                    blue = palette[paletteIndex * 3 + 2];
                    alpha = paletteIndex === frame.transparentIndex ? 0 : 255;
                }
            }
            if (frameIndex === selected) {
                break;
            }
            if (inside && frame.disposal === 2) {
                background = this._backgroundWord(frameIndex, options.background);
                red = background & 255;
                green = (background >>> 8) & 255;
                blue = (background >>> 16) & 255;
                alpha = background >>> 24;
            }
            else if (inside && frame.disposal === 3) {
                red = previousRed;
                green = previousGreen;
                blue = previousBlue;
                alpha = previousAlpha;
            }
        }
        output[offset] = red;
        output[offset + 1] = green;
        output[offset + 2] = blue;
        output[offset + 3] = alpha;
    }
    /** Encode one indexed GIF without quantization, reordering, or palette-slot deduplication. */
    static encodeIndexed(image, options = {}) {
        return ImageGIF.encodeIndexedFrames([
            {
                // Standalone indexed encoding ignores animation placement metadata on structural inputs.
                width: image.width,
                height: image.height,
                indexes: image.indexes,
                palette: image.palette,
                delay: options.delay,
                disposal: options.disposal,
                userInput: options.userInput,
                interlaced: options.interlaced,
            },
        ], options);
    }
    /** Create an indexed GIF using the encodeIndexed() implementation. */
    static createIndexedGif(image, options = {}) {
        return ImageGIF.encodeIndexed(image, options);
    }
    /**
     * Encode exact RGBA8 colors, including the RGB components beneath transparent alpha.
     * GIF permits at most 256 palette entries and one transparent slot. Reject unsupported
     * input rather than silently quantizing colors, merging transparent RGB, or thresholding alpha.
     */
    static encodeRGBA(image, options = {}) {
        const limits = resolveLimits(options);
        const count = dimensions(image.width, image.height, limits);
        if (!(image.rgba instanceof Uint8Array) || image.rgba.length !== count * 4) {
            throw new Error("RGBA buffer length does not match dimensions.");
        }
        if (count > limits.maxInflatedBytes) {
            throw new RangeError("GIF exceeds the inflated byte limit.");
        }
        const indexes = new Uint8Array(count);
        const palette = [];
        const slots = new Map();
        let transparentKey;
        for (let i = 0, offset = 0; i < count; i++, offset += 4) {
            const red = image.rgba[offset], green = image.rgba[offset + 1];
            const blue = image.rgba[offset + 2], alpha = image.rgba[offset + 3];
            if (alpha !== 0 && alpha !== 255) {
                throw new Error("GIF does not support partial alpha; supply binary transparency explicitly.");
            }
            const key = (red | (green << 8) | (blue << 16) | (alpha << 24)) >>> 0;
            if (alpha === 0) {
                if (transparentKey !== undefined && transparentKey !== key) {
                    throw new Error("GIF cannot preserve multiple transparent RGB colors in one frame.");
                }
                transparentKey = key;
            }
            let index = slots.get(key);
            if (index === undefined) {
                if (palette.length === 256) {
                    throw new Error("GIF cannot encode more than 256 exact RGBA colors without quantization.");
                }
                index = palette.length;
                palette.push([red, green, blue, alpha]);
                slots.set(key, index);
            }
            indexes[i] = index;
        }
        return ImageGIF.encodeIndexed({ width: image.width, height: image.height, indexes, palette }, options);
    }
    /** Encode raster animation frames with local palettes, offsets, delays, looping, and disposal. */
    static encodeIndexedFrames(frames, options = {}) {
        const limits = resolveLimits(options);
        if (!arrayLengthInRange(frames, 1, limits.maxFrames)) {
            throw new RangeError("GIF requires at least one frame within the frame count limit.");
        }
        const width = options.width ?? frames[0].width;
        const height = options.height ?? frames[0].height;
        dimensions(width, height, limits);
        if (options.loopCount !== undefined) {
            integer(options.loopCount, "Loop count");
        }
        const global = frames[0].palette;
        const transparent = [];
        let inflated = 0;
        for (const frame of frames) {
            transparent.push(validateIndexed(frame, limits));
            inflated += frame.indexes.length;
            if (inflated > limits.maxInflatedBytes) {
                throw new RangeError("GIF exceeds the aggregate inflated byte limit.");
            }
            integer(frame.leftPosition ?? 0, "Frame left position");
            integer(frame.topPosition ?? 0, "Frame top position");
            if ((frame.leftPosition ?? 0) + frame.width > width ||
                (frame.topPosition ?? 0) + frame.height > height) {
                throw new Error("GIF frame rectangle exceeds the logical screen.");
            }
            integer(frame.delay ?? options.delay ?? 0, "Frame delay");
            integer(frame.disposal ?? options.disposal ?? 0, "Disposal method", 0, 3);
            for (const [name, value] of Object.entries({
                userInput: frame.userInput ?? options.userInput,
                interlaced: frame.interlaced ?? options.interlaced,
            })) {
                if (value !== undefined && typeof value !== "boolean") {
                    throw new TypeError(`${name} must be a boolean.`);
                }
            }
        }
        const background = options.backgroundColorIndex ?? 0;
        integer(background, "Background color index", 0, global.length - 1);
        const depth = Math.max(1, Math.ceil(Math.log2(global.length)));
        const writer = new GifWriter(limits.maxOutputBytes);
        writer.text("GIF89a");
        writer.word(width);
        writer.word(height);
        // Input RGB components have eight bits of precision, independently of the palette index depth.
        writer.byte(0xf0 | (depth - 1));
        writer.byte(background);
        writer.byte(0);
        writer.palette(global);
        let blocks = 1; // Trailer.
        if (options.loopCount !== undefined) {
            writer.write(Uint8Array.of(0x21, 0xff, 11));
            writer.text("NETSCAPE2.0");
            writer.subBlocks(Uint8Array.of(1, options.loopCount & 255, options.loopCount >>> 8));
            blocks += 3;
        }
        for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
            const frame = frames[frameIndex];
            writeControl(writer, frame.delay ?? options.delay ?? 0, frame.disposal ?? options.disposal ?? 0, transparent[frameIndex], frame.userInput ?? options.userInput ?? false);
            // Alpha belongs to the GCE, so frames may share identical RGB tables with different transparency.
            const local = frame.palette.length !== global.length ||
                frame.palette.some((color, i) => color[0] !== global[i][0] || color[1] !== global[i][1] || color[2] !== global[i][2]);
            const interlaced = frame.interlaced ?? options.interlaced ?? false;
            const frameDepth = Math.max(1, Math.ceil(Math.log2(frame.palette.length)));
            writer.byte(0x2c);
            writer.word(frame.leftPosition ?? 0);
            writer.word(frame.topPosition ?? 0);
            writer.word(frame.width);
            writer.word(frame.height);
            writer.byte((local ? 0x80 | (frameDepth - 1) : 0) | (interlaced ? 0x40 : 0));
            if (local) {
                writer.palette(frame.palette);
            }
            const compressed = ImageGIF._encodePixels(frame, interlaced, limits);
            blocks += 3 + Math.ceil(compressed.length / 255); // GCE, descriptor, sub-block terminator, payloads.
            if (blocks > limits.maxBlocks) {
                throw new RangeError("GIF exceeds the block count limit.");
            }
            writer.byte(Math.max(2, frameDepth));
            writer.subBlocks(compressed);
        }
        writer.byte(0x3b);
        return writer.finish();
    }
    /** Convert row-major indexes to GIF pass order only when interlacing is requested. */
    static _encodePixels(image, interlaced, limits) {
        let indexes = image.indexes;
        if (interlaced) {
            indexes = new Uint8Array(image.indexes.length);
            let offset = 0;
            for (const [start, step] of GIF_PASSES) {
                for (let y = start; y < image.height; y += step) {
                    indexes.set(image.indexes.subarray(y * image.width, (y + 1) * image.width), offset);
                    offset += image.width;
                }
            }
        }
        return new GIFLZW(indexes).compressBytes(Math.max(2, Math.ceil(Math.log2(image.palette.length))), {
            maxInputBytes: limits.maxInflatedBytes,
            maxOutputBytes: limits.maxOutputBytes,
        });
    }
    /**
     * Rewrite one frame without an RGBA round trip. No-op edits return an exact owned copy.
     * Same-slot palette changes retain the original framed LZW bytes and interlacing. A local
     * replacement table isolates edits from other frames that share the global table.
     * Other extensions are retained byte-for-byte; application-specific payload semantics are not rewritten.
     */
    static rewriteIndexed(source, edit = {}, options = {}) {
        const image = new ImageGIF(source, options);
        const frameIndex = edit.frameIndex ?? 0;
        // Validate every native raster before preserving untouched frame bytes in a rewritten file.
        for (let index = 0; index < image.imageDescriptors.length; index++) {
            image.decodePixels({ frameIndex: index });
        }
        const original = image.toIndexed({ frameIndex, copy: false });
        const descriptor = image._frame(frameIndex);
        const frame = image.frames[frameIndex];
        const width = edit.dimensions?.width ?? original.width;
        const height = edit.dimensions?.height ?? original.height;
        const resized = width !== original.width || height !== original.height;
        if (resized && edit.indexes === undefined) {
            throw new Error("Resizing requires replacement indexed pixels.");
        }
        const next = {
            width,
            height,
            indexes: edit.indexes ?? original.indexes,
            palette: edit.palette ?? original.palette,
        };
        if (next.palette.length !== original.palette.length) {
            throw new Error("Palette edit must preserve slot count.");
        }
        const transparent = validateIndexed(next, image._limits);
        if (image._inflatedTotal - original.indexes.length + next.indexes.length >
            image._limits.maxInflatedBytes) {
            throw new RangeError("GIF exceeds the aggregate inflated byte limit.");
        }
        if (options.validateIndexed !== undefined) {
            if (typeof options.validateIndexed !== "function") {
                throw new TypeError("validateIndexed must be a function.");
            }
            options.validateIndexed({ width, height, indexes: next.indexes });
        }
        const delay = edit.delay ?? frame.delay;
        const disposal = edit.disposal ?? frame.disposal ?? 0;
        integer(delay, "Frame delay");
        integer(disposal, "Disposal method", 0, 3);
        const pixelsChanged = resized || next.indexes.some((value, i) => value !== original.indexes[i]);
        const paletteChanged = next.palette.some((color, i) => color.some((value, channel) => value !== original.palette[i][channel]));
        const controlChanged = delay !== frame.delay ||
            disposal !== (frame.disposal ?? 0) ||
            transparent !== frame.transparentIndex;
        if (!pixelsChanged && !paletteChanged && !controlChanged) {
            if (image.data.length > image._limits.maxOutputBytes) {
                throw new RangeError("GIF exceeds the output byte limit.");
            }
            return Uint8Array.from(image.data);
        }
        let canvasWidth = image.width, canvasHeight = image.height;
        if (resized && image.frames.length === 1) {
            if (descriptor.leftPosition !== 0 || descriptor.topPosition !== 0) {
                throw new Error("Resizing a single-frame canvas requires a frame at the origin.");
            }
            canvasWidth = width;
            canvasHeight = height;
        }
        if (descriptor.leftPosition + width > canvasWidth ||
            descriptor.topPosition + height > canvasHeight) {
            throw new Error("GIF frame rectangle exceeds the logical screen.");
        }
        const writer = new GifWriter(image._limits.maxOutputBytes);
        const prefixEnd = 13 + (image.globalColorTable ? image.palette.length : 0);
        const prefix = image.data.slice(0, prefixEnd);
        // Adding a GCE to GIF87a requires the GIF89a version identifier.
        prefix.set(Uint8Array.of(71, 73, 70, 56, 57, 97));
        prefix[6] = canvasWidth & 255;
        prefix[7] = canvasWidth >>> 8;
        prefix[8] = canvasHeight & 255;
        prefix[9] = canvasHeight >>> 8;
        writer.write(prefix);
        for (const block of image.blocks) {
            if (block.type === "graphic-control" && block.offset === frame.graphicControlOffset) {
                continue;
            }
            if (block.type === "image" && block.frameIndex === frameIndex) {
                writeControl(writer, delay, disposal, transparent, frame.userInput);
                if (!pixelsChanged && !paletteChanged) {
                    writer.write(image.data.subarray(block.offset, block.end));
                    continue;
                }
                const depth = Math.max(1, Math.ceil(Math.log2(next.palette.length)));
                writer.byte(0x2c);
                writer.word(descriptor.leftPosition);
                writer.word(descriptor.topPosition);
                writer.word(width);
                writer.word(height);
                writer.byte(0x80 | (descriptor.packed & 0x60) | (depth - 1));
                writer.palette(next.palette);
                if (pixelsChanged) {
                    writer.byte(Math.max(2, depth));
                    writer.subBlocks(ImageGIF._encodePixels(next, descriptor.interlaceFlag !== 0, image._limits));
                }
                else {
                    writer.write(image.data.subarray(descriptor.imageDataOffset, descriptor.end));
                }
            }
            else {
                writer.write(image.data.subarray(block.offset, block.end));
            }
        }
        if (!image.blocks.some((block) => block.type === "trailer")) {
            writer.byte(0x3b);
        }
        const output = writer.finish();
        // Recheck structural counts and canvas limits after adding or reframing blocks.
        new ImageGIF(output, { ...options, maxInputBytes: image._limits.maxOutputBytes });
        return output;
    }
    /** Rewrite indexed GIF bytes using rewriteIndexed(). */
    static rewriteIndexedGif(source, edit = {}, options = {}) {
        return ImageGIF.rewriteIndexed(source, edit, options);
    }
}
export default ImageGIF;
//# sourceMappingURL=data-image-gif.js.map