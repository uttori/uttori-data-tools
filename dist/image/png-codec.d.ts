export { integer, dimensions } from "./raster-utils.js";
export declare const SIGNATURE: Uint8Array<ArrayBuffer>;
export declare const PASSES: readonly Readonly<unknown>[];
export declare const DEFAULT_LIMITS: Readonly<{
    maxInputBytes: number;
    maxPixels: number;
    maxInflatedBytes: number;
    maxOutputBytes: number;
    maxChunks: 16384;
}>;
export declare function limits(options?: {}): {
    maxInputBytes: number;
    maxPixels: number;
    maxInflatedBytes: number;
    maxOutputBytes: number;
    maxChunks: 16384;
};
export declare const passLength: (size: any, start: any, step: any) => number;
export declare const viewOf: (bytes: any) => DataView<any>;
export declare function checkSignature(bytes: any): void;
export declare function readChunk(bytes: any, offset: any): {
    type: string;
    offset: any;
    end: any;
    length: number;
    data: any;
    raw: any;
    critical: boolean;
    safeToCopy: boolean;
};
export declare function readHeader(data: any, options?: {}): {
    width: number;
    height: number;
    bitDepth: any;
    colorType: any;
    colors: any;
    alpha: boolean;
    compressionMethod: number;
    filterMethod: number;
    interlaceMethod: any;
};
export declare function readPhysical(data: any): {
    width: number;
    height: number;
    unit: any;
};
/** Container validation is performed once; chunk payloads are views of the owned/borrowed source. */
export declare function parsePNG(bytes: any, options?: {}): {
    width: number;
    height: number;
    bitDepth: any;
    colorType: any;
    colors: any;
    alpha: boolean;
    compressionMethod: number;
    filterMethod: number;
    interlaceMethod: any;
    palette: Uint8Array<ArrayBuffer>;
    transparency: Uint8Array<ArrayBuffer>;
    physical: {
        width: number;
        height: number;
        unit: number;
    };
    chunks: {
        type: string;
        offset: any;
        end: any;
        length: number;
        data: any;
        raw: any;
        critical: boolean;
        safeToCopy: boolean;
    }[];
    dataChunks: any[];
    animated: boolean;
};
export declare function expectedBytes(image: any, bound?: Readonly<{
    maxInputBytes: number;
    maxPixels: number;
    maxInflatedBytes: number;
    maxOutputBytes: number;
    maxChunks: 16384;
}>): number;
export declare function inflatePNG(image: any, options?: {}): Uint8Array<ArrayBuffer>;
export declare function paeth(a: any, b: any, c: any): any;
/** Reconstruct an owned row in place. Previous-row storage is reset at each Adam7 pass. */
export declare function unfilterRow(row: any, previous: any, bpp: any, length: any, filter: any): void;
/** One element per sample; packed indexes stay indexes, and 16-bit precision is retained. */
export declare function decodeSamples(image: any, data: any, options?: {}): Uint16Array<ArrayBuffer> | Uint8Array<ArrayBuffer>;
export declare function paletteRGBA(image: any): any[][];
export declare function transparencyKey(image: any): number[];
/** Writes straight RGBA8 without premultiplication, color management, or loss of hidden RGB. */
export declare function writeRGBA(image: any, pixel: any, output: any, offset: any, key?: number[]): void;
export declare function join(parts: any, maxBytes?: number): Uint8Array<any>;
export declare function makeChunk(type: any, data: any): Uint8Array<any>;
export declare function makeHeader(width: any, height: any, depth: any, type: any): Uint8Array<ArrayBuffer>;
export declare function validatePalette(palette: any, bitDepth?: number): void;
export declare function validateIndexed(image: any, bitDepth?: number, options?: {}): void;
/** None is the deterministic low-CPU default; adaptive is explicitly opt-in. */
export declare function encodeRows(width: any, height: any, rowBytes: any, bpp: any, fillRow: any, options?: {}): Uint8Array<ArrayBuffer>;
export declare function indexedData(image: any, depth: any, options?: {}): Uint8Array<ArrayBuffer>;
export declare function paletteChunks(palette: any): Uint8Array<any>[];
export declare function encodeIndexed(image: any, options?: {}): Uint8Array<any>;
export declare function encodeRGBA(image: any, options?: {}): Uint8Array<any>;
/** Source has already been parsed and decoded. A caller must not supply a mutated model. */
export declare function rewriteIndexedModel(source: any, image: any, edit?: {}, options?: {}): Uint8Array<any>;
//# sourceMappingURL=png-codec.d.ts.map