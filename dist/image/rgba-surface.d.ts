import type { BlitOptions, IndexedInput, RgbaImage, SurfaceOptions, TextOptions, TextMetrics, RGBA, Rect } from "./types.js";
/** The default maximum number of pixels for a surface. Size is 4MB. */
export declare const DEFAULT_MAX_PIXELS: number;
/** Validate and normalize an RGBA color. */
export declare function colorRGBA(color: RGBA): RGBA;
/** Validate an RGBA image. */
export declare function validateRGBA(image: RgbaImage, maxPixels?: number): void;
/**
 * Mutable straight RGBA8 pixels. Geometry and buffer identity are immutable.
 * Fill/blit/line/text mutate and return this. Crop/flip/scale return owned new surfaces.
 * This module does not import PNG, Pako, Canvas, DOM, Node, or a font runtime.
 */
export declare class RgbaSurface implements RgbaImage {
    readonly kind: "rgba-image";
    readonly width: number;
    readonly height: number;
    readonly rgba: Uint8Array;
    readonly maxPixels: number;
    constructor(width: number, height: number, rgba?: Uint8Array, options?: SurfaceOptions);
    static from(image: RgbaImage, options?: SurfaceOptions): RgbaSurface;
    static fromIndexed(image: IndexedInput, options?: SurfaceOptions): RgbaSurface;
    clone(): RgbaSurface;
    /** Copy-mode fill, including RGB under alpha zero. Rectangles are clipped, not resized. */
    fill(color: RGBA, rect?: Rect): this;
    /** Clip against source and destination. Snapshot aliased buffers before the first write. */
    blit(source: RgbaImage, x: number, y: number, options?: BlitOptions): this;
    /** Strict in-bounds crop; invalid or zero dimensions are errors rather than implicit padding. */
    crop(x: number, y: number, width: number, height: number): RgbaSurface;
    /** Flip the surface horizontally or vertically. */
    flip({ horizontal, vertical }?: {
        horizontal?: boolean | undefined;
        vertical?: boolean | undefined;
    }): RgbaSurface;
    /** Flip the surface horizontally. */
    flipX(): RgbaSurface;
    /** Flip the surface vertically. */
    flipY(): RgbaSurface;
    /** Nearest neighbor with floor(x * sourceWidth / width), independently on each axis. */
    scaleNearest(width: number, height: number): RgbaSurface;
    /** Aspect fit with the original preview.ts shared-scale sampling convention. */
    fitNearest(maxEdge: number, { upscale }?: {
        upscale?: boolean | undefined;
    }): RgbaSurface;
    _resample(width: number, height: number, scale?: number): RgbaSurface;
    /** Inclusive 1px Bresenham line. Clip the segment first to bound work by visible dimensions. */
    line(x0: number, y0: number, x1: number, y1: number, color: RGBA): this;
    measureText(text: string, options?: TextOptions): TextMetrics;
    drawText(text: string, x: number, y: number, color: RGBA, options?: TextOptions): this;
}
export default RgbaSurface;
//# sourceMappingURL=rgba-surface.d.ts.map