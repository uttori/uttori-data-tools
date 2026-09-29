import type RgbaSurface from "./rgba-surface.js";
import type { TextOptions, TextMetrics, RGBA } from "./types.js";
/** Pure so an unused glyph table is not a bundler side effect. */
export declare const GLYPHS: Readonly<Record<string, readonly number[]>>;
export declare const BitmapText: Readonly<{
    glyphWidth: 5;
    glyphHeight: 7;
    advance: 6;
    lineHeight: 8;
    measure(text: string, options?: TextOptions): TextMetrics;
}>;
/**
 * Draw a text string on a surface.
 * @param surface The surface to draw on.
 * @param text The text to draw.
 * @param x The x coordinate of the text.
 * @param y The y coordinate of the text.
 * @param color The color of the text.
 * @param options The options for the drawing.
 */
export declare function drawBitmapText(surface: RgbaSurface, text: string, x: number, y: number, color: RGBA, options?: TextOptions): TextMetrics;
//# sourceMappingURL=bitmap-text.d.ts.map