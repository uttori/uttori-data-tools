import DataBuffer from "../data-buffer.js";
import RgbaSurface from "./rgba-surface.js";
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
declare class ImagePNG extends DataBuffer {
    constructor(input: any, options?: {});
    static fromFile(data: any, options?: {}): ImagePNG;
    static fromBuffer(buffer: any, options?: {}): ImagePNG;
    static encodeIndexed(image: any, options?: {}): Uint8Array<any>;
    static encodeRGBA(image: any, options?: {}): Uint8Array<any>;
    static createIndexedPng(image: any, options?: {}): Uint8Array<any>;
    static rewriteIndexed(source: any, edit?: {}, options?: {}): Uint8Array<any>;
    static rewriteIndexedPng(source: any, edit?: {}, options?: {}): Uint8Array<any>;
    parse(): this;
    invalidatePixels(): void;
    /** Decode once; force:true discards the decoded cache and rechecks compressed samples. */
    decodePixels({ force }?: {
        force?: boolean | undefined;
    }): any;
    /** Returned palette slots and indexes are owned unless copy:false is explicit. */
    toIndexed({ copy }?: {
        copy?: boolean | undefined;
    }): {
        kind: string;
        width: any;
        height: any;
        indexes: any;
        palette: any[][];
        sourceBitDepth: any;
    };
    /** Explicit rendering conversion. Sixteen-bit values round to nearest RGBA8; native samples remain intact. */
    toRGBA({ copy }?: {
        copy?: boolean | undefined;
    }): RgbaSurface;
    /** Compatibility accessor. Bulk rendering should use toRGBA(), not allocate an array for every pixel. */
    getPixel(x: any, y: any): number[];
    getPixelInto(x: any, y: any, output: any, offset?: number): Uint8Array<ArrayBufferLike>;
    setBitDepth(value: any): void;
    setColorType(value: any): void;
    setCompressionMethod(value: any): void;
    setFilterMethod(value: any): void;
    setInterlaceMethod(value: any): void;
    setPalette(palette: any): void;
    decodeHeader(): void;
    decodeChunk(): string;
    decodeIHDR(chunk: any): void;
    decodePLTE(chunk: any): void;
    decodeIDAT(chunk: any): void;
    decodeTRNS(chunk: any): void;
    decodePHYS(chunk: any): void;
    decodeIEND(chunk: any): void;
    interlaceNone(data: any): any;
    interlaceAdam7(data: any): any;
    static unFilterNone(pixels: any, scanline: any, bpp: any, offset: any, length: any): Uint8Array<ArrayBufferLike>;
    static unFilterSub(pixels: any, scanline: any, bpp: any, offset: any, length: any): Uint8Array<ArrayBufferLike>;
    static unFilterUp(pixels: any, scanline: any, bpp: any, offset: any, length: any): Uint8Array<ArrayBufferLike>;
    static unFilterAverage(pixels: any, scanline: any, bpp: any, offset: any, length: any): Uint8Array<ArrayBufferLike>;
    static unFilterPaeth(pixels: any, scanline: any, bpp: any, offset: any, length: any): Uint8Array<ArrayBufferLike>;
}
export default ImagePNG;
//# sourceMappingURL=data-image-png.new.d.ts.map