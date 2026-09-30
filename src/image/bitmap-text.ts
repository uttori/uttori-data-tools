import type RgbaSurface from "./rgba-surface.js";
import type { TextOptions, TextMetrics, RGBA } from "./types.js";

/**
 * Hand-authored 5×7 caption glyphs, not extracted from an installed font.
 * ASCII lowercase intentionally uses the uppercase glyph. Unsupported code points use '?'.
 * Five low bits describe each row, with the leftmost pixel in bit 4.
 */
function freezeGlyphs(): Readonly<Record<string, readonly number[]>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries({
        " ": [0, 0, 0, 0, 0, 0, 0],
        A: [14, 17, 17, 31, 17, 17, 17],
        B: [30, 17, 17, 30, 17, 17, 30],
        C: [14, 17, 16, 16, 16, 17, 14],
        D: [30, 17, 17, 17, 17, 17, 30],
        E: [31, 16, 16, 30, 16, 16, 31],
        F: [31, 16, 16, 30, 16, 16, 16],
        G: [14, 17, 16, 23, 17, 17, 15],
        H: [17, 17, 17, 31, 17, 17, 17],
        I: [14, 4, 4, 4, 4, 4, 14],
        J: [7, 2, 2, 2, 2, 18, 12],
        K: [17, 18, 20, 24, 20, 18, 17],
        L: [16, 16, 16, 16, 16, 16, 31],
        M: [17, 27, 21, 21, 17, 17, 17],
        N: [17, 25, 21, 19, 17, 17, 17],
        O: [14, 17, 17, 17, 17, 17, 14],
        P: [30, 17, 17, 30, 16, 16, 16],
        Q: [14, 17, 17, 17, 21, 18, 13],
        R: [30, 17, 17, 30, 20, 18, 17],
        S: [15, 16, 16, 14, 1, 1, 30],
        T: [31, 4, 4, 4, 4, 4, 4],
        U: [17, 17, 17, 17, 17, 17, 14],
        V: [17, 17, 17, 17, 17, 10, 4],
        W: [17, 17, 17, 21, 21, 27, 17],
        X: [17, 17, 10, 4, 10, 17, 17],
        Y: [17, 17, 10, 4, 4, 4, 4],
        Z: [31, 1, 2, 4, 8, 16, 31],
        0: [14, 17, 19, 21, 25, 17, 14],
        1: [4, 12, 4, 4, 4, 4, 14],
        2: [14, 17, 1, 2, 4, 8, 31],
        3: [30, 1, 1, 14, 1, 1, 30],
        4: [2, 6, 10, 18, 31, 2, 2],
        5: [31, 16, 16, 30, 1, 1, 30],
        6: [14, 16, 16, 30, 17, 17, 14],
        7: [31, 1, 2, 4, 8, 8, 8],
        8: [14, 17, 17, 14, 17, 17, 14],
        9: [14, 17, 17, 15, 1, 1, 14],
        ".": [0, 0, 0, 0, 0, 12, 12],
        ",": [0, 0, 0, 0, 4, 4, 8],
        ":": [0, 12, 12, 0, 12, 12, 0],
        ";": [0, 12, 12, 0, 4, 4, 8],
        "!": [4, 4, 4, 4, 4, 0, 4],
        "?": [14, 17, 1, 2, 4, 0, 4],
        "-": [0, 0, 0, 31, 0, 0, 0],
        _: [0, 0, 0, 0, 0, 0, 31],
        "+": [0, 4, 4, 31, 4, 4, 0],
        "=": [0, 0, 31, 0, 31, 0, 0],
        "/": [1, 2, 2, 4, 8, 8, 16],
        "\\": [16, 8, 8, 4, 2, 2, 1],
        "(": [2, 4, 8, 8, 8, 4, 2],
        ")": [8, 4, 2, 2, 2, 4, 8],
        "[": [14, 8, 8, 8, 8, 8, 14],
        "]": [14, 2, 2, 2, 2, 2, 14],
        "<": [1, 2, 4, 8, 4, 2, 1],
        ">": [16, 8, 4, 2, 4, 8, 16],
        "#": [10, 10, 31, 10, 31, 10, 10],
        "%": [25, 25, 2, 4, 8, 19, 19],
        "*": [0, 21, 14, 31, 14, 21, 0],
        "|": [4, 4, 4, 4, 4, 4, 4],
        "'": [4, 4, 8, 0, 0, 0, 0],
        '"': [10, 10, 20, 0, 0, 0, 0],
        "@": [14, 17, 23, 21, 23, 16, 14],
        "&": [12, 18, 20, 8, 21, 18, 13],
        $: [4, 15, 20, 14, 5, 30, 4],
        "^": [4, 10, 17, 0, 0, 0, 0],
        "~": [0, 0, 8, 21, 2, 0, 0],
        "`": [8, 4, 2, 0, 0, 0, 0],
        "{": [2, 4, 4, 8, 4, 4, 2],
        "}": [8, 4, 4, 2, 4, 4, 8],
      }).map(([key, rows]) => [key, Object.freeze(rows)]),
    ),
  );
}
/** Pure so an unused glyph table is not a bundler side effect. */
export const GLYPHS = /* @__PURE__ */ freezeGlyphs();

/**
 * Layout a text string for bitmap text rendering.
 * @param text The text to layout.
 * @param options The options for the layout.
 * @param options.scale The scale of the text, defaults to 1.
 * @returns The layout object.
 */
function layout(
  text: string,
  options: TextOptions = {},
): { lines: string[][]; scale: number; metrics: TextMetrics } {
  if (typeof text !== "string") {
    throw new TypeError("Caption must be a string.");
  }
  if (text.length > 4096) {
    throw new RangeError("Caption exceeds 4096 UTF-16 code units.");
  }
  /** Between 1 and 64. */
  const scale = options.scale ?? 1;
  if (!Number.isSafeInteger(scale) || scale < 1 || scale > 64) {
    throw new RangeError("Text scale must be an integer in [1, 64].");
  }
  /** Tabs are exactly four spaces, not context-dependent tab stops. */
  const lines = text.length
    ? text
        .replace(/\r\n?/g, "\n")
        .replace(/\t/g, "    ")
        .split("\n")
        .map((line) => Array.from(line))
    : [];
  const maxColumns = lines.reduce((max, line) => Math.max(max, line.length), 0);
  return {
    lines,
    scale,
    metrics: {
      width: maxColumns ? (maxColumns * 6 - 1) * scale : 0,
      height: lines.length ? (lines.length * 8 - 1) * scale : 0,
      advanceX: (lines.at(-1)?.length ?? 0) * 6 * scale,
      advanceY: Math.max(0, lines.length - 1) * 8 * scale,
      lineHeight: 8 * scale,
      baseline: 7 * scale,
      lines: lines.length,
    },
  };
}

export const BitmapText = /* @__PURE__ */ Object.freeze({
  glyphWidth: 5,
  glyphHeight: 7,
  advance: 6,
  lineHeight: 8,
  measure(text: string, options: TextOptions = {}): TextMetrics {
    return layout(text, options).metrics;
  },
});

/**
 * Draw a text string on a surface.
 * @param surface The surface to draw on.
 * @param text The text to draw.
 * @param x The x coordinate of the text.
 * @param y The y coordinate of the text.
 * @param color The color of the text.
 * @param options The options for the drawing.
 */
export function drawBitmapText(
  surface: RgbaSurface,
  text: string,
  x: number,
  y: number,
  color: RGBA,
  options?: TextOptions,
): TextMetrics {
  if (!Number.isSafeInteger(x) || x < -0x7fffffff || x > 0x7fffffff) {
    throw new RangeError("Text x must be an integer in [-2147483647, 2147483647].");
  }
  if (!Number.isSafeInteger(y) || y < -0x7fffffff || y > 0x7fffffff) {
    throw new RangeError("Text y must be an integer in [-2147483647, 2147483647].");
  }
  const { lines, scale, metrics } = layout(text, options);
  for (let line = 0; line < lines.length; line++) {
    for (let column = 0; column < lines[line].length; column++) {
      let character = lines[line][column];
      const code = character.codePointAt(0);
      if (code && code >= 97 && code <= 122) {
        character = String.fromCharCode(code - 32);
      }
      const glyph = GLYPHS[character] ?? GLYPHS["?"];
      for (let row = 0; row < 7; row++) {
        for (let cx = 0; cx < 5;) {
          if (!(glyph[row] & (16 >>> cx))) {
            cx++;
            continue;
          }
          const start = cx++;
          while (cx < 5 && glyph[row] & (16 >>> cx)) {
            cx++;
          }
          surface.fill(color, {
            x: x + (column * 6 + start) * scale,
            y: y + (line * 8 + row) * scale,
            width: (cx - start) * scale,
            height: scale,
          });
        }
      }
    }
  }
  return metrics;
}
