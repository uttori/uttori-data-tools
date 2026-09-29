import test from 'ava';

import { BitmapText, GLYPHS, drawBitmapText } from '../../dist/image/bitmap-text.js';
import RgbaSurface from '../../dist/image/rgba-surface.js';

const A_ROWS = ['01110', '10001', '10001', '11111', '10001', '10001', '10001'];
const QUESTION_ROWS = ['01110', '10001', '00001', '00010', '00100', '00000', '00100'];

/**
 * Render an explicit golden bitmap one pixel at a time, without surface methods.
 * This reference does not use glyph lookup, run grouping, or BitmapText layout.
 * @param {string[]} rows Rows containing zero/one characters.
 * @param {number} width Destination width.
 * @param {number} height Destination height.
 * @param {number} [x] Glyph origin.
 * @param {number} [y] Glyph origin.
 * @param {number} [scale] Integer enlargement factor.
 * @param {number[]} [color] Foreground RGBA bytes.
 * @param {number[]} [background] Background RGBA bytes.
 * @returns {Uint8Array} Expected destination pixels.
 */
function goldenPixels(
  rows,
  width,
  height,
  x = 0,
  y = 0,
  scale = 1,
  color = [255, 255, 255, 255],
  background = [0, 0, 0, 0],
) {
  const expected = new Uint8Array(width * height * 4);
  for (let destinationY = 0; destinationY < height; destinationY++) {
    for (let destinationX = 0; destinationX < width; destinationX++) {
      const glyphX = Math.floor((destinationX - x) / scale);
      const glyphY = Math.floor((destinationY - y) / scale);
      let value = background;
      if (glyphY >= 0 && glyphY < rows.length && glyphX >= 0 && glyphX < rows[glyphY].length) {
        if (rows[glyphY][glyphX] === '1') {
          value = color;
        }
      }
      expected.set(value, (destinationY * width + destinationX) * 4);
    }
  }
  return expected;
}

test('BitmapText: exposes immutable face metrics and frozen seven-row glyphs', (t) => {
  t.true(Object.isFrozen(BitmapText));
  t.true(Object.isFrozen(GLYPHS));
  t.is(BitmapText.glyphWidth, 5);
  t.is(BitmapText.glyphHeight, 7);
  t.is(BitmapText.advance, 6);
  t.is(BitmapText.lineHeight, 8);
  t.deepEqual(GLYPHS.A, [14, 17, 17, 31, 17, 17, 17]);
  for (const rows of Object.values(GLYPHS)) {
    t.true(Object.isFrozen(rows));
    t.is(rows.length, 7);
    t.true(rows.every((row) => Number.isInteger(row) && row >= 0 && row <= 31));
  }
});

test('measure(text, options): measures a caption without trailing inter-character spacing', (t) => {
  t.deepEqual(BitmapText.measure('FRAME 01'), {
    width: 47,
    height: 7,
    advanceX: 48,
    advanceY: 0,
    lineHeight: 8,
    baseline: 7,
    lines: 1,
  });
  t.is(BitmapText.measure('A').width, 5);
  t.is(BitmapText.measure('AB').width, 11);
});

test('measure(text): returns zero content dimensions for the empty string', (t) => {
  t.deepEqual(BitmapText.measure(''), {
    width: 0,
    height: 0,
    advanceX: 0,
    advanceY: 0,
    lineHeight: 8,
    baseline: 7,
    lines: 0,
  });
  t.deepEqual(BitmapText.measure('', { scale: 2 }), {
    width: 0,
    height: 0,
    advanceX: 0,
    advanceY: 0,
    lineHeight: 16,
    baseline: 14,
    lines: 0,
  });
});

test('measure(text, options): measures scaled multiline text and final cursor advancement', (t) => {
  t.deepEqual(BitmapText.measure('A\nBC', { scale: 2 }), {
    width: 22,
    height: 30,
    advanceX: 24,
    advanceY: 16,
    lineHeight: 16,
    baseline: 14,
    lines: 2,
  });
  t.deepEqual(BitmapText.measure('AB\nC'), {
    width: 11,
    height: 15,
    advanceX: 6,
    advanceY: 8,
    lineHeight: 8,
    baseline: 7,
    lines: 2,
  });
});

test('measure(text): normalizes CRLF and standalone CR without adding extra lines', (t) => {
  const expected = BitmapText.measure('A\nBC\nD');
  t.deepEqual(BitmapText.measure('A\r\nBC\rD'), expected);
  t.deepEqual(BitmapText.measure('A\rBC\rD'), expected);
  t.is(expected.lines, 3);
});

test('measure(text): preserves blank lines, spaces, and trailing newlines', (t) => {
  t.deepEqual(BitmapText.measure('A\n'), {
    width: 5,
    height: 15,
    advanceX: 0,
    advanceY: 8,
    lineHeight: 8,
    baseline: 7,
    lines: 2,
  });
  t.is(BitmapText.measure('\n').lines, 2);
  t.is(BitmapText.measure('\n').width, 0);
  t.is(BitmapText.measure('\n').height, 15);
  t.is(BitmapText.measure(' ').width, 5);
  t.is(BitmapText.measure('A ').width, 11);
});

test('measure(text): expands tabs to four spaces rather than contextual tab stops', (t) => {
  t.deepEqual(BitmapText.measure('\t'), BitmapText.measure('    '));
  t.is(BitmapText.measure('\t').width, 23);
  t.deepEqual(BitmapText.measure('A\tB'), BitmapText.measure('A    B'));
  t.is(BitmapText.measure('A\tB').width, 35);
});

test('measure(text): counts Unicode code points, not UTF-16 units or grapheme clusters', (t) => {
  t.is(BitmapText.measure('🐈').width, 5);
  t.is(BitmapText.measure('A🐈B').width, 17);
  // Combining marks still occupy one fallback cell; no text shaping is promised.
  t.is(BitmapText.measure('A\u0301').width, 11);
  t.is(BitmapText.measure('ß').width, 5);
});

test('measure(text, options): accepts both scale boundaries and rejects invalid scales', (t) => {
  t.is(BitmapText.measure('A', { scale: 1 }).width, 5);
  t.is(BitmapText.measure('A', { scale: 64 }).width, 320);
  t.is(BitmapText.measure('A', { scale: 64 }).height, 448);
  for (const scale of [0, -1, 0.5, 65, NaN, Infinity, '2']) {
    t.throws(() => BitmapText.measure('A', { scale }), { instanceOf: RangeError });
    t.throws(() => BitmapText.measure('', { scale }), { instanceOf: RangeError });
  }
});

test('measure(text): enforces the caption limit in UTF-16 code units', (t) => {
  t.is(BitmapText.measure('A'.repeat(4096)).width, 24575);
  t.is(BitmapText.measure('🐈'.repeat(2048)).width, 12287);
  t.throws(() => BitmapText.measure('A'.repeat(4097)), { instanceOf: RangeError, message: /4096/ });
  t.throws(() => BitmapText.measure('🐈'.repeat(2049)), { instanceOf: RangeError, message: /4096/ });
  for (const value of [null, undefined, 123, {}, ['A']]) {
    t.throws(() => BitmapText.measure(value), { instanceOf: TypeError });
  }
});

test('measure(text): returns a fresh metrics object for each call', (t) => {
  const first = BitmapText.measure('A');
  const second = BitmapText.measure('A');
  t.not(first, second);
  first.width = 999;
  t.is(second.width, 5);
  t.is(BitmapText.measure('A').width, 5);
});

test('drawBitmapText(surface, text, x, y, color): draws the exact golden A bitmap', (t) => {
  const surface = new RgbaSurface(5, 7);
  const metrics = drawBitmapText(surface, 'A', 0, 0, [255, 255, 255, 255]);
  t.deepEqual(surface.rgba, goldenPixels(A_ROWS, 5, 7));
  t.deepEqual(metrics, BitmapText.measure('A'));
});

for (const scale of [1, 2, 3]) {
  for (const [x, y, width, height] of [[0, 0, 20, 24], [-2, -2, 3, 5], [3, 2, 6, 5]]) {
    test(`drawBitmapText(): clips a scale-${scale} glyph at ${x},${y} into ${width}x${height}`, (t) => {
      const background = [10, 20, 30, 40];
      const foreground = [250, 120, 60, 128];
      const surface = new RgbaSurface(width, height).fill(background);
      const metrics = drawBitmapText(surface, 'A', x, y, foreground, { scale });
      t.deepEqual(surface.rgba, goldenPixels(A_ROWS, width, height, x, y, scale, foreground, background));
      // Clipping changes the pixels, never the logical caption measurement.
      t.deepEqual(metrics, BitmapText.measure('A', { scale }));
    });
  }
}

test('drawBitmapText(): uses the same uppercase glyph for every ASCII lowercase letter', (t) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const width = BitmapText.measure(uppercase).width;
  const a = new RgbaSurface(width, 7);
  const b = new RgbaSurface(width, 7);
  drawBitmapText(a, lowercase, 0, 0, [9, 8, 7, 255]);
  drawBitmapText(b, uppercase, 0, 0, [9, 8, 7, 255]);
  t.deepEqual(a.rgba, b.rgba);
  t.deepEqual(BitmapText.measure(lowercase), BitmapText.measure(uppercase));
});

for (const character of ['🐈', 'é', 'ß', '\u0301', '\u0000', '\ud800']) {
  test(`drawBitmapText(): uses one fallback glyph for ${JSON.stringify(character)}`, (t) => {
    const surface = new RgbaSurface(5, 7);
    drawBitmapText(surface, character, 0, 0, [255, 255, 255, 255]);
    t.deepEqual(surface.rgba, goldenPixels(QUESTION_ROWS, 5, 7));
    t.is(BitmapText.measure(character).advanceX, 6);
  });
}

for (const [character, glyph] of Object.entries(GLYPHS)) {
  test(`drawBitmapText(): renders all five bits of ${JSON.stringify(character)}`, (t) => {
    const surface = new RgbaSurface(5, 7);
    drawBitmapText(surface, character, 0, 0, [255, 255, 255, 255]);
    const rows = glyph.map((row) => row.toString(2).padStart(5, '0'));
    t.deepEqual(surface.rgba, goldenPixels(rows, 5, 7));
  });
}

test('drawBitmapText(): leaves the one-pixel character and line gaps untouched', (t) => {
  const surface = new RgbaSurface(11, 15).fill([9, 8, 7, 6]);
  drawBitmapText(surface, 'AA\nA', 0, 0, [1, 2, 3, 255]);
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 11; x++) {
      const offset = (y * 11 + x) * 4;
      if (x === 5 || y === 7 || (x >= 6 && y >= 8)) {
        t.deepEqual(Array.from(surface.rgba.subarray(offset, offset + 4)), [9, 8, 7, 6]);
      }
    }
  }
  t.deepEqual(surface.measureText('AA\nA'), BitmapText.measure('AA\nA'));
});

test('drawBitmapText(): normalizes line endings and tabs consistently with measurement', (t) => {
  const text = 'A\r\nB\tC\rD';
  const normalized = 'A\nB    C\nD';
  const metrics = BitmapText.measure(normalized);
  const first = new RgbaSurface(metrics.width, metrics.height);
  const second = new RgbaSurface(metrics.width, metrics.height);
  t.deepEqual(drawBitmapText(first, text, 0, 0, [1, 2, 3, 255]), metrics);
  drawBitmapText(second, normalized, 0, 0, [1, 2, 3, 255]);
  t.deepEqual(first.rgba, second.rgba);
});

test('drawBitmapText(): preserves hidden RGB and uses replacement rather than source-over', (t) => {
  for (const alpha of [0, 128]) {
    const background = [10, 20, 30, 255];
    const color = [201, 102, 53, alpha];
    const surface = new RgbaSurface(5, 7).fill(background);
    drawBitmapText(surface, 'A', 0, 0, color);
    t.deepEqual(surface.rgba, goldenPixels(A_ROWS, 5, 7, 0, 0, 1, color, background));
  }
});

test('drawBitmapText(): supports borrowed unaligned pixel views without touching sentinels', (t) => {
  const backing = new Uint8Array(5 * 7 * 4 + 8).fill(0xa5);
  const pixels = backing.subarray(3, 3 + 5 * 7 * 4);
  pixels.fill(0);
  const surface = new RgbaSurface(5, 7, pixels, { copy: false });
  drawBitmapText(surface, 'A', 0, 0, [255, 255, 255, 255]);
  t.deepEqual(pixels, goldenPixels(A_ROWS, 5, 7));
  t.true(backing.subarray(0, 3).every((byte) => byte === 0xa5));
  t.true(backing.subarray(3 + pixels.length).every((byte) => byte === 0xa5));
});

test('drawBitmapText(): empty, blank, and fully clipped captions leave pixels untouched', (t) => {
  const surface = new RgbaSurface(5, 7).fill([1, 2, 3, 4]);
  const before = surface.rgba.slice();
  for (const [text, x, y] of [['', 0, 0], [' \t\n', 0, 0], ['A', 100, 0], ['A', 0, -100]]) {
    t.deepEqual(drawBitmapText(surface, text, x, y, [255, 255, 255, 255]), BitmapText.measure(text));
    t.deepEqual(surface.rgba, before);
  }
});

test('drawBitmapText(): invalid text, scale, and coordinates fail before drawing', (t) => {
  const surface = new RgbaSurface(5, 7).fill([1, 2, 3, 4]);
  const before = surface.rgba.slice();
  for (const value of [NaN, Infinity, -Infinity, 0.5, 0x80000000, -0x80000000, '0']) {
    t.throws(() => drawBitmapText(surface, 'A', value, 0, [255, 255, 255, 255]), { instanceOf: RangeError });
    t.throws(() => drawBitmapText(surface, 'A', 0, value, [255, 255, 255, 255]), { instanceOf: RangeError });
  }
  t.throws(() => drawBitmapText(surface, null, 0, 0, [1, 2, 3, 4]), { instanceOf: TypeError });
  t.throws(() => drawBitmapText(surface, 'A', 0, 0, [1, 2, 3, 4], { scale: 0 }), { instanceOf: RangeError });
  t.throws(() => drawBitmapText(surface, 'A'.repeat(4097), 0, 0, [1, 2, 3, 4]), { instanceOf: RangeError });
  t.deepEqual(surface.rgba, before);
});

test('drawBitmapText()/drawText(): reject invalid colors when drawing glyphs', (t) => {
  const surface = new RgbaSurface(5, 7);
  const before = surface.rgba.slice();
  for (const color of [[1, 2, 3], [256, 2, 3, 4], [1, 2, 3, -1]]) {
    t.throws(() => drawBitmapText(surface, 'A', 0, 0, color));
    t.throws(() => surface.drawText('', 0, 0, color));
    t.deepEqual(surface.rgba, before);
  }
});

test('drawText(text, x, y, color, options): delegates drawing and returns the surface', (t) => {
  const direct = new RgbaSurface(10, 14);
  const surface = new RgbaSurface(10, 14);
  const metrics = drawBitmapText(direct, 'A', 0, 0, [1, 2, 3, 4], { scale: 2 });
  t.is(surface.drawText('A', 0, 0, [1, 2, 3, 4], { scale: 2 }), surface);
  t.deepEqual(surface.rgba, direct.rgba);
  t.deepEqual(surface.measureText('A', { scale: 2 }), metrics);
});
