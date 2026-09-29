import DataBuffer from "../data-buffer.js";
import { checkSignature, readChunk, readHeader, readPhysical, parsePNG, limits, integer, inflatePNG, decodeSamples, unfilterRow, paletteRGBA, transparencyKey, writeRGBA, encodeIndexed, encodeRGBA, rewriteIndexedModel, } from "./png-codec.js";
import RgbaSurface from "./rgba-surface.js";
function prepareInput(input, options) {
    const maxInputBytes = limits(options).maxInputBytes;
    if (input instanceof DataBuffer) {
        input = input.data;
    }
    if (typeof input === "number") {
        throw new TypeError("ImagePNG requires PNG data, not an allocation length.");
    }
    if ((typeof input === "string" && input.length > maxInputBytes) ||
        (Array.isArray(input) && input.length > maxInputBytes) ||
        input?.byteLength > maxInputBytes) {
        throw new RangeError("PNG exceeds the input byte limit.");
    }
    let bytes;
    if (input instanceof Uint8Array) {
        bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    else if (input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
    }
    else {
        bytes = new DataBuffer(input).data;
    }
    if (bytes.length > maxInputBytes) {
        throw new RangeError("PNG exceeds the input byte limit.");
    }
    return options.copyInput === false ? bytes : Uint8Array.from(bytes);
}
function legacyUnfilter(type, pixels, scanline, bpp, offset, length) {
    integer(offset, "Unfilter offset");
    integer(length, "Unfilter length");
    integer(bpp, "Unfilter stride", 1);
    if (offset + length > pixels.length || length > scanline.length) {
        throw new RangeError("Unfilter buffer is too small.");
    }
    const row = Uint8Array.from(scanline.slice(0, length));
    const previous = new Uint8Array(length);
    if (offset >= length) {
        for (let i = 0; i < length; i++) {
            previous[i] = pixels[offset - length + i];
        }
    }
    unfilterRow(row, previous, bpp, length, type);
    if (pixels instanceof Uint8Array) {
        pixels.set(row, offset);
    }
    else {
        for (let i = 0; i < length; i++) {
            pixels[offset + i] = row[i];
        }
    }
    return pixels;
}
/**
 * PNG container + lossless native sample decoder, still extending DataBuffer.
 *
 * pixels: one Uint8Array element per sample/index for depths 1/2/4/8;
 *         one Uint16Array element per native sample for depth 16.
 * palette: original RGB bytes, in original slot order, including duplicate colors.
 * transparency: original tRNS bytes. No RGBA cache is kept beside mutable native pixels.
 *
 * Copy input by default. copyInput:false borrows the exact byte view: the caller must
 * not mutate it while this object is in use. Parsed chunk payloads are read-only views.
 *
 * Static encoder methods produce non-interlaced indexed PNG or RGBA8 PNG.
 * Rewriting indexed PNG preserves the stronger original-byte and IDAT contracts.
 */
class ImagePNG extends DataBuffer {
    constructor(input, options = {}) {
        super(prepareInput(input, options));
        this.options = Object.freeze({ ...options });
        this.pixels = new Uint8Array();
        this._decoded = false;
        this.parse();
    }
    static fromFile(data, options = {}) {
        return new ImagePNG(data, options);
    }
    static fromBuffer(buffer, options = {}) {
        return new ImagePNG(buffer, options);
    }
    static encodeIndexed(image, options = {}) {
        return encodeIndexed(image, options);
    }
    static encodeRGBA(image, options = {}) {
        return encodeRGBA(image, options);
    }
    static createIndexedPng(image, options = {}) {
        return encodeIndexed(image, options);
    }
    static rewriteIndexed(source, edit = {}, options = {}) {
        // Always decode a fresh source model. Never compare edits against a publicly mutable pixels buffer.
        const image = new ImagePNG(source, options);
        image.decodePixels();
        return rewriteIndexedModel(image.data, image, edit, options);
    }
    static rewriteIndexedPng(source, edit = {}, options = {}) {
        return ImagePNG.rewriteIndexed(source, edit, options);
    }
    parse() {
        Object.assign(this, parsePNG(this.data, this.options));
        this.header = this.data.subarray(0, 8);
        this.offset = this.data.length;
        this.invalidatePixels();
        return this;
    }
    invalidatePixels() {
        this.pixels = new Uint8Array();
        this._decoded = false;
    }
    /** Decode once; force:true discards the decoded cache and rechecks compressed samples. */
    decodePixels({ force = false } = {}) {
        if (!this._decoded || force) {
            this._decoded = false;
            this.pixels = decodeSamples(this, inflatePNG(this, this.options), this.options);
            this._decoded = true;
        }
        return this.pixels;
    }
    /** Returned palette slots and indexes are owned unless copy:false is explicit. */
    toIndexed({ copy = true } = {}) {
        if (this.colorType !== 3) {
            throw new Error("PNG does not contain indexed pixels.");
        }
        this.decodePixels();
        return {
            kind: "indexed-image",
            width: this.width,
            height: this.height,
            indexes: copy ? Uint8Array.from(this.pixels) : this.pixels,
            palette: paletteRGBA(this),
            sourceBitDepth: this.bitDepth,
        };
    }
    /** Explicit rendering conversion. Sixteen-bit values round to nearest RGBA8; native samples remain intact. */
    toRGBA({ copy = true } = {}) {
        this.decodePixels();
        if (this.colorType === 6 && this.bitDepth === 8) {
            return new RgbaSurface(this.width, this.height, this.pixels, {
                copy,
                maxPixels: limits(this.options).maxPixels,
            });
        }
        const rgba = new Uint8Array(this.width * this.height * 4), key = transparencyKey(this);
        for (let pixel = 0, offset = 0; pixel < this.width * this.height; pixel++, offset += 4) {
            writeRGBA(this, pixel, rgba, offset, key);
        }
        return new RgbaSurface(this.width, this.height, rgba, {
            copy: false,
            maxPixels: limits(this.options).maxPixels,
        });
    }
    /** Compatibility accessor. Bulk rendering should use toRGBA(), not allocate an array for every pixel. */
    getPixel(x, y) {
        integer(x, "x position", 0, this.width - 1);
        integer(y, "y position", 0, this.height - 1);
        this.decodePixels();
        const result = [0, 0, 0, 0];
        writeRGBA(this, y * this.width + x, result, 0);
        return result;
    }
    getPixelInto(x, y, output, offset = 0) {
        integer(x, "x position", 0, this.width - 1);
        integer(y, "y position", 0, this.height - 1);
        integer(offset, "Output offset");
        if (!(output instanceof Uint8Array) || offset + 4 > output.length) {
            throw new RangeError("Output needs four writable bytes.");
        }
        this.decodePixels();
        writeRGBA(this, y * this.width + x, output, offset);
        return output;
    }
    // Retain the old low-level entry points. Container ordering is enforced by parse(),
    // not by calling isolated chunk handlers. Layout setters invalidate native samples.
    setBitDepth(value) {
        if (![1, 2, 4, 8, 16].includes(value)) {
            throw new Error(`Invalid Bit Depth: ${value}`);
        }
        this.bitDepth = value;
        this.invalidatePixels();
    }
    setColorType(value) {
        const colors = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[value];
        if (colors === undefined) {
            throw new Error(`Invalid Color Type: ${value}`);
        }
        this.colorType = value;
        this.colors = colors;
        this.alpha = value === 4 || value === 6;
        this.invalidatePixels();
    }
    setCompressionMethod(value) {
        if (value !== 0) {
            throw new Error(`Unsupported Compression Method: ${value}`);
        }
        this.compressionMethod = value;
    }
    setFilterMethod(value) {
        if (value !== 0) {
            throw new Error(`Unsupported Filter Method: ${value}`);
        }
        this.filterMethod = value;
    }
    setInterlaceMethod(value) {
        if (value !== 0 && value !== 1) {
            throw new Error(`Unsupported Interlace Method: ${value}`);
        }
        this.interlaceMethod = value;
        this.invalidatePixels();
    }
    setPalette(palette) {
        if ((!Array.isArray(palette) && !(palette instanceof Uint8Array)) ||
            !palette.length ||
            palette.length % 3 ||
            palette.length > 768 ||
            (this.colorType === 3 && palette.length / 3 > 2 ** this.bitDepth)) {
            throw new Error("Invalid PNG palette.");
        }
        for (const value of palette) {
            integer(value, "Palette byte", 0, 255);
        }
        const count = palette.length / 3;
        if (this.colorType === 3) {
            if (this.transparency.length > count) {
                throw new Error("Transparency exceeds the new palette.");
            }
            if (this._decoded) {
                for (const index of this.pixels) {
                    if (index >= count) {
                        throw new Error("Decoded index exceeds the new palette.");
                    }
                }
            }
        }
        this.palette = Uint8Array.from(palette);
    }
    decodeHeader() {
        if (this.offset !== 0) {
            throw new Error("PNG header must be read at offset zero.");
        }
        checkSignature(this.data);
        this.header = this.data.subarray(0, 8);
        this.offset = 8;
    }
    decodeChunk() {
        const chunk = readChunk(this.data, this.offset);
        this.offset = chunk.end;
        const handlers = {
            IHDR: "decodeIHDR",
            PLTE: "decodePLTE",
            IDAT: "decodeIDAT",
            tRNS: "decodeTRNS",
            pHYs: "decodePHYS",
            IEND: "decodeIEND",
        };
        if (handlers[chunk.type]) {
            this[handlers[chunk.type]](chunk.data);
        }
        else if (chunk.critical) {
            throw new Error(`Unsupported critical PNG chunk '${chunk.type}'.`);
        }
        return chunk.type;
    }
    decodeIHDR(chunk) {
        Object.assign(this, readHeader(chunk, this.options));
        this.invalidatePixels();
    }
    decodePLTE(chunk) {
        this.setPalette(chunk);
    }
    decodeIDAT(chunk) {
        this.dataChunks.push(chunk);
        this.invalidatePixels();
    }
    decodeTRNS(chunk) {
        this.transparency = Uint8Array.from(chunk);
    }
    decodePHYS(chunk) {
        this.physical = readPhysical(chunk);
    }
    decodeIEND(chunk) {
        if (chunk.length) {
            throw new Error("IEND must be empty.");
        }
    }
    interlaceNone(data) {
        this.pixels = decodeSamples({ ...this, interlaceMethod: 0 }, data, this.options);
        this._decoded = true;
        return this.pixels;
    }
    interlaceAdam7(data) {
        this.pixels = decodeSamples({ ...this, interlaceMethod: 1 }, data, this.options);
        this._decoded = true;
        return this.pixels;
    }
    static unFilterNone(pixels, scanline, bpp, offset, length) {
        return legacyUnfilter(0, pixels, scanline, bpp, offset, length);
    }
    static unFilterSub(pixels, scanline, bpp, offset, length) {
        return legacyUnfilter(1, pixels, scanline, bpp, offset, length);
    }
    static unFilterUp(pixels, scanline, bpp, offset, length) {
        return legacyUnfilter(2, pixels, scanline, bpp, offset, length);
    }
    static unFilterAverage(pixels, scanline, bpp, offset, length) {
        return legacyUnfilter(3, pixels, scanline, bpp, offset, length);
    }
    static unFilterPaeth(pixels, scanline, bpp, offset, length) {
        return legacyUnfilter(4, pixels, scanline, bpp, offset, length);
    }
}
export default ImagePNG;
//# sourceMappingURL=data-image-png.new.js.map