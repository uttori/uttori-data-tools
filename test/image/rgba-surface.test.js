import test from 'ava';

import RgbaSurface from '../../dist/image/rgba-surface.js';

/**
 * Create deterministic pixels with distinct channel values and alpha levels.
 * @param {number} width Pixel width.
 * @param {number} height Pixel height.
 * @param {number} [byteOffset] Offset used to exercise unaligned byte access.
 * @returns {RgbaSurface} Surface borrowing only the requested byte range.
 */
function createSurface(width, height, byteOffset = 0) {
  const backing = new Uint8Array(width * height * 4 + byteOffset + 5).fill(0xa5);
  const bytes = backing.subarray(byteOffset, byteOffset + width * height * 4);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (i * 37 + Math.floor(i / 4) * 11) & 255;
  }
  return new RgbaSurface(width, height, bytes, { copy: false });
}

/**
 * Read a pixel without depending on any drawing or transformation method.
 * @param {{width: number, rgba: Uint8Array}} surface Source surface.
 * @param {number} x Pixel column.
 * @param {number} y Pixel row.
 * @returns {number[]} The four RGBA components.
 */
function pixel(surface, x, y) {
  const offset = (y * surface.width + x) * 4;
  return Array.from(surface.rgba.subarray(offset, offset + 4));
}

/**
 * Give each randomized AVA case its own reproducible random-number sequence.
 * @param {number} seed Initial state for this case, never shared between tests.
 * @returns {(maximum: number) => number} Bounded nonnegative integer generator.
 */
function randomSequence(seed) {
  let state = seed >>> 0;
  return (maximum) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % maximum;
  };
}

/**
 * Calculate source-over using exact integer fractions and independent rounding.
 * BigInt avoids floating-point half-way rounding differences in the test oracle.
 * @param {number[]} destination Original destination RGBA.
 * @param {number[]} source Source RGBA.
 * @returns {number[]} Expected straight-alpha RGBA8.
 */
function referenceBlend(destination, source) {
  if (source[3] === 0) {
    return destination.slice();
  }
  const sa = BigInt(source[3]);
  const da = BigInt(destination[3]);
  const denominator = sa * 255n + da * (255n - sa);
  const result = [];
  for (let channel = 0; channel < 3; channel++) {
    const numerator = BigInt(source[channel]) * sa * 255n
      + BigInt(destination[channel]) * da * (255n - sa);
    result.push(Number((2n * numerator + denominator) / (2n * denominator)));
  }
  result.push(Number((denominator + 127n) / 255n));
  return result;
}

/**
 * Simulate a clipped blit one requested pixel at a time, without row optimizations.
 * The expected buffer is separate from both sources, including aliased views.
 * @param {RgbaSurface} destination Destination before mutation.
 * @param {RgbaSurface} source Source before mutation.
 * @param {number} x Destination origin.
 * @param {number} y Destination origin.
 * @param {object} [options] Source rectangle and compositing mode.
 * @returns {Uint8Array} Expected complete destination buffer.
 */
function referenceBlit(destination, source, x, y, options = {}) {
  const expected = destination.rgba.slice();
  const sx = options.sx ?? 0;
  const sy = options.sy ?? 0;
  const width = options.width ?? source.width;
  const height = options.height ?? source.height;
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const sourceX = sx + column;
      const sourceY = sy + row;
      const destinationX = x + column;
      const destinationY = y + row;
      if (
        sourceX < 0 || sourceX >= source.width || sourceY < 0 || sourceY >= source.height
        || destinationX < 0 || destinationX >= destination.width
        || destinationY < 0 || destinationY >= destination.height
      ) {
        continue;
      }
      let color = pixel(source, sourceX, sourceY);
      if (options.mode === 'source-over') {
        color = referenceBlend(pixel(destination, destinationX, destinationY), color);
      }
      expected.set(color, (destinationY * destination.width + destinationX) * 4);
    }
  }
  return expected;
}

test('constructor(width, height): allocates transparent owned pixels', (t) => {
  const surface = new RgbaSurface(3, 2);
  t.is(surface.kind, 'rgba-image');
  t.is(surface.width, 3);
  t.is(surface.height, 2);
  t.deepEqual(surface.rgba, new Uint8Array(24));
  t.not(surface.rgba.buffer, new RgbaSurface(3, 2).rgba.buffer);
});

test('constructor(width, height, rgba, options): copies by default and borrows explicitly', (t) => {
  const bytes = Uint8Array.of(1, 2, 3, 4);
  const copy = new RgbaSurface(1, 1, bytes);
  const borrowed = new RgbaSurface(1, 1, bytes, { copy: false });
  t.not(copy.rgba.buffer, bytes.buffer);
  t.is(borrowed.rgba, bytes);
  bytes[0] = 99;
  t.is(copy.rgba[0], 1);
  t.is(borrowed.rgba[0], 99);
});

test('constructor(): protects geometry and buffer identity while allowing pixel edits', (t) => {
  const surface = new RgbaSurface(1, 1);
  for (const field of ['kind', 'width', 'height', 'rgba', 'maxPixels']) {
    const descriptor = Object.getOwnPropertyDescriptor(surface, field);
    t.false(descriptor.writable);
    t.false(descriptor.configurable);
    t.throws(() => {
      surface[field] = null;
    }, { instanceOf: TypeError });
  }
  t.notThrows(() => {
    surface.rgba[0] = 123;
  });
  t.is(surface.rgba[0], 123);
});

test('from(image, options)/clone(): preserve pixels and make ownership explicit', (t) => {
  const original = createSurface(3, 2, 1);
  const copy = RgbaSurface.from(original);
  const borrowed = RgbaSurface.from(original, { copy: false });
  const clone = original.clone();
  t.deepEqual(copy.rgba, original.rgba);
  t.deepEqual(clone.rgba, original.rgba);
  t.not(copy.rgba.buffer, original.rgba.buffer);
  t.not(clone.rgba.buffer, original.rgba.buffer);
  t.is(borrowed.rgba, original.rgba);
  clone.fill([0, 0, 0, 0]);
  t.notDeepEqual(clone.rgba, original.rgba);
});

test('fromIndexed(image): expands duplicate slots and transparent RGB without editing indexes', (t) => {
  const indexes = Uint8Array.of(0, 1, 2);
  const palette = [[9, 8, 7, 255], [9, 8, 7, 255], [1, 2, 3, 0]];
  const surface = RgbaSurface.fromIndexed({ width: 3, height: 1, indexes, palette });
  t.deepEqual(surface.rgba, Uint8Array.of(9, 8, 7, 255, 9, 8, 7, 255, 1, 2, 3, 0));
  surface.fill([0, 0, 0, 0]);
  t.deepEqual(indexes, Uint8Array.of(0, 1, 2));
  t.deepEqual(palette, [[9, 8, 7, 255], [9, 8, 7, 255], [1, 2, 3, 0]]);
  t.throws(() => RgbaSurface.fromIndexed({ width: 3, height: 1, indexes: Uint8Array.of(0, 1, 3), palette }), {
    message: /palette slot/,
  });
});

// Aligned views exercise the Uint32Array fast paths. Unaligned views must give
// identical results without touching bytes outside their logical pixel buffers.
for (const byteOffset of [0, 1]) {
  const alignment = byteOffset === 0 ? 'aligned' : 'unaligned';

  test(`fill(color, rect): clips ${alignment} rectangles and preserves hidden RGB`, (t) => {
    const surface = createSurface(7, 5, byteOffset);
    const original = surface.rgba.slice();
    const color = [101, 202, 33, 0];
    t.is(surface.fill(color, { x: -2, y: 2, width: 5, height: 99 }), surface);
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        const offset = (y * surface.width + x) * 4;
        const expected = y >= 2 && x < 3 ? color : Array.from(original.subarray(offset, offset + 4));
        t.deepEqual(pixel(surface, x, y), expected);
      }
    }
    const backing = new Uint8Array(surface.rgba.buffer);
    t.true(backing.subarray(0, byteOffset).every((byte) => byte === 0xa5));
    t.true(backing.subarray(byteOffset + surface.rgba.length).every((byte) => byte === 0xa5));
  });

  for (const horizontal of [false, true]) {
    for (const vertical of [false, true]) {
      test(`flip(options): ${alignment}, horizontal ${horizontal}, vertical ${vertical}`, (t) => {
        const surface = createSurface(7, 5, byteOffset);
        const before = surface.rgba.slice();
        const flipped = surface.flip({ horizontal, vertical });
        t.not(flipped, surface);
        t.not(flipped.rgba.buffer, surface.rgba.buffer);
        t.is(flipped.width, surface.width);
        t.is(flipped.height, surface.height);
        for (let y = 0; y < surface.height; y++) {
          for (let x = 0; x < surface.width; x++) {
            const sourceX = horizontal ? surface.width - x - 1 : x;
            const sourceY = vertical ? surface.height - y - 1 : y;
            t.deepEqual(pixel(flipped, x, y), pixel(surface, sourceX, sourceY));
          }
        }
        t.deepEqual(flipped.flip({ horizontal, vertical }).rgba, surface.rgba);
        t.deepEqual(surface.rgba, before);
      });
    }
  }

  test(`crop(x, y, width, height): returns an owned ${alignment} subrectangle`, (t) => {
    const surface = createSurface(7, 5, byteOffset);
    const before = surface.rgba.slice();
    const cropped = surface.crop(2, 1, 3, 2);
    t.is(cropped.width, 3);
    t.is(cropped.height, 2);
    t.not(cropped.rgba.buffer, surface.rgba.buffer);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 3; x++) {
        t.deepEqual(pixel(cropped, x, y), pixel(surface, x + 2, y + 1));
      }
    }
    cropped.fill([0, 0, 0, 0]);
    t.deepEqual(surface.rgba, before);
  });

  for (const [width, height] of [[1, 1], [3, 2], [7, 5], [14, 10], [11, 3], [3, 11]]) {
    test(`scaleNearest(width, height): ${alignment} 7x5 to ${width}x${height}`, (t) => {
      const surface = createSurface(7, 5, byteOffset);
      const before = surface.rgba.slice();
      const scaled = surface.scaleNearest(width, height);
      t.is(scaled.width, width);
      t.is(scaled.height, height);
      t.not(scaled.rgba.buffer, surface.rgba.buffer);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          t.deepEqual(pixel(scaled, x, y), pixel(surface, Math.floor((x * 7) / width), Math.floor((y * 5) / height)));
        }
      }
      t.deepEqual(surface.rgba, before);
    });
  }
}

test('fill(color, rect): zero-sized or entirely clipped rectangles do not mutate pixels', (t) => {
  const surface = createSurface(3, 2);
  const before = surface.rgba.slice();
  for (const rect of [
    { width: 0 }, { height: 0 }, { x: 3 }, { y: 2 },
    { x: -10, width: 2 }, { y: -10, height: 2 },
  ]) {
    t.is(surface.fill([9, 8, 7, 6], rect), surface);
    t.deepEqual(surface.rgba, before);
  }
});

test('fill(color): accepts an RGBA byte view and fills the entire surface', (t) => {
  const surface = new RgbaSurface(3, 2);
  t.is(surface.fill(Uint8Array.of(1, 2, 3, 4)), surface);
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 3; x++) {
      t.deepEqual(pixel(surface, x, y), [1, 2, 3, 4]);
    }
  }
});

// Each case owns its source, destination, options, and PRNG state. There is no
// test.serial() requirement and no execution-order dependency between AVA cases.
for (let trial = 0; trial < 160; trial++) {
  test(`blit(source, x, y, options): clipped scalar-reference case ${trial}`, (t) => {
    const random = randomSequence(123456789 + trial * 977);
    const width = 2 + random(10);
    const height = 2 + random(8);
    const destination = createSurface(width, height, trial % 2);
    let source = destination;
    if (trial % 3 !== 0) {
      source = createSurface(1 + random(10), 1 + random(8), (trial + 1) % 2);
    }
    for (let i = 0; i < destination.rgba.length; i++) {
      destination.rgba[i] = random(256);
    }
    if (source !== destination) {
      for (let i = 0; i < source.rgba.length; i++) {
        source.rgba[i] = random(256);
      }
    }
    const x = random(16) - 6;
    const y = random(14) - 5;
    const options = {
      sx: random(8) - 3,
      sy: random(8) - 3,
      width: random(12),
      height: random(12),
      mode: trial % 2 === 0 ? 'copy' : 'source-over',
    };
    const sourceBefore = source.rgba.slice();
    const expected = referenceBlit(destination, source, x, y, options);
    t.is(destination.blit(source, x, y, options), destination);
    t.deepEqual(destination.rgba, expected);
    if (source !== destination) {
      t.deepEqual(source.rgba, sourceBefore);
    }
  });
}

for (const mode of ['copy', 'source-over']) {
  for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]) {
    test(`blit(source): snapshots self-overlap for ${mode} at ${x},${y}`, (t) => {
      const surface = createSurface(4, 4);
      const expected = referenceBlit(surface, surface, x, y, { mode });
      surface.blit(surface, x, y, { mode });
      t.deepEqual(surface.rgba, expected);
    });
  }

  test(`blit(source): snapshots distinct overlapping views for ${mode}`, (t) => {
    const backing = Uint8Array.from({ length: 80 }, (_, i) => (i * 17) & 255);
    const destination = new RgbaSurface(4, 4, backing.subarray(0, 64), { copy: false });
    const source = new RgbaSurface(4, 4, backing.subarray(7, 71), { copy: false });
    const tail = backing.slice(64);
    const expected = referenceBlit(destination, source, 0, 0, { mode });
    destination.blit(source, 0, 0, { mode });
    t.deepEqual(destination.rgba, expected);
    t.deepEqual(backing.subarray(64), tail);
  });
}

test('blit(source): copy and source-over have distinct transparent-pixel behavior', (t) => {
  const transparent = new RgbaSurface(1, 1).fill([9, 8, 7, 0]);
  const destination = new RgbaSurface(1, 1).fill([1, 2, 3, 0]);
  destination.blit(transparent, 0, 0, { mode: 'source-over' });
  t.deepEqual(pixel(destination, 0, 0), [1, 2, 3, 0]);
  destination.blit(transparent, 0, 0);
  t.deepEqual(pixel(destination, 0, 0), [9, 8, 7, 0]);
  const translucent = new RgbaSurface(1, 1).fill([250, 120, 50, 127]);
  destination.blit(translucent, 0, 0, { mode: 'source-over' });
  t.deepEqual(pixel(destination, 0, 0), [250, 120, 50, 127]);
  const opaque = new RgbaSurface(1, 1).fill([12, 34, 56, 255]);
  destination.blit(opaque, 0, 0, { mode: 'source-over' });
  t.deepEqual(pixel(destination, 0, 0), [12, 34, 56, 255]);
});

for (const destinationAlpha of [0, 1, 127, 128, 254, 255]) {
  for (const sourceAlpha of [0, 1, 127, 128, 254, 255]) {
    test(`blit(source, options): straight-alpha rounding with alpha ${sourceAlpha} over ${destinationAlpha}`, (t) => {
      const background = [33, 111, 222, destinationAlpha];
      const foreground = [250, 50, 10, sourceAlpha];
      const surface = new RgbaSurface(1, 1).fill(background);
      surface.blit(new RgbaSurface(1, 1).fill(foreground), 0, 0, { mode: 'source-over' });
      t.deepEqual(pixel(surface, 0, 0), referenceBlend(background, foreground));
    });
  }
}

test('flipX()/flipY(): match their explicit flip options', (t) => {
  const surface = createSurface(3, 2);
  t.deepEqual(surface.flipX().rgba, surface.flip({ horizontal: true }).rgba);
  t.deepEqual(surface.flipY().rgba, surface.flip({ vertical: true }).rgba);
});

for (const [width, height, edge] of [[3, 2, 256], [513, 257, 256], [13, 5, 7], [1, 257, 256], [257, 1, 31]]) {
  test(`fitNearest(maxEdge): preserves preview sampling for ${width}x${height}, edge ${edge}`, (t) => {
    const surface = createSurface(width, height);
    const scale = Math.min(1, edge / Math.max(width, height));
    const fitted = surface.fitNearest(edge);
    t.is(fitted.width, Math.max(1, Math.floor(width * scale)));
    t.is(fitted.height, Math.max(1, Math.floor(height * scale)));
    t.not(fitted.rgba.buffer, surface.rgba.buffer);
    const expected = new Uint8Array(fitted.rgba.length);
    for (let y = 0; y < fitted.height; y++) {
      for (let x = 0; x < fitted.width; x++) {
        const sourceX = Math.min(width - 1, Math.floor(x / scale));
        const sourceY = Math.min(height - 1, Math.floor(y / scale));
        expected.set(pixel(surface, sourceX, sourceY), (y * fitted.width + x) * 4);
      }
    }
    t.deepEqual(fitted.rgba, expected);
  });
}

test('fitNearest(maxEdge, options): enlarges only when explicitly enabled', (t) => {
  const surface = createSurface(7, 5);
  const unchanged = surface.fitNearest(14);
  t.is(unchanged.width, 7);
  t.is(unchanged.height, 5);
  t.deepEqual(unchanged.rgba, surface.rgba);
  t.not(unchanged.rgba.buffer, surface.rgba.buffer);
  const enlarged = surface.fitNearest(14, { upscale: true });
  t.is(enlarged.width, 14);
  t.is(enlarged.height, 10);
  t.deepEqual(enlarged.rgba, surface.scaleNearest(14, 10).rgba);
});

test('fitNearest()/scaleNearest(): distinguish shared-scale fitting from exact-axis resampling', (t) => {
  const surface = createSurface(13, 5);
  const fitted = surface.fitNearest(7);
  const exact = surface.scaleNearest(7, 2);
  t.is(fitted.height, 2);
  // The fitted y=1 samples floor(1 / (7/13)) = 1; independently scaling
  // five source rows to two output rows instead samples floor(1 * 5/2) = 2.
  t.deepEqual(pixel(fitted, 0, 1), pixel(surface, 0, 1));
  t.deepEqual(pixel(exact, 0, 1), pixel(surface, 0, 2));
  t.notDeepEqual(fitted.rgba, exact.rgba);
});

for (const [x, y] of [[1, 1], [1, 4], [1, 7], [4, 1], [4, 4], [4, 7], [7, 1], [7, 4], [7, 7], [7, 6], [6, 7]]) {
  test(`line(x0, y0, x1, y1, color): includes endpoints from 4,4 to ${x},${y}`, (t) => {
    const surface = new RgbaSurface(9, 9);
    const color = [10, 20, 30, 255];
    t.is(surface.line(4, 4, x, y, color), surface);
    t.deepEqual(pixel(surface, 4, 4), color);
    t.deepEqual(pixel(surface, x, y), color);
    let count = 0;
    for (let offset = 3; offset < surface.rgba.length; offset += 4) {
      if (surface.rgba[offset] !== 0) {
        count++;
      }
    }
    t.is(count, Math.max(Math.abs(x - 4), Math.abs(y - 4)) + 1);
  });
}

test('line(): produces exact shallow and steep Bresenham strokes', (t) => {
  const shallow = new RgbaSurface(5, 3).line(0, 0, 4, 2, [1, 2, 3, 255]);
  const steep = new RgbaSurface(3, 5).line(0, 0, 2, 4, [1, 2, 3, 255]);
  const expected = new Set(['0,0', '1,1', '2,1', '3,2', '4,2']);
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 5; x++) {
      const alpha = expected.has(`${x},${y}`) ? 255 : 0;
      t.is(pixel(shallow, x, y)[3], alpha);
      t.is(pixel(steep, y, x)[3], alpha);
    }
  }
});

test('line(): clips distant endpoints before rasterizing and leaves invisible lines alone', (t) => {
  const horizontal = new RgbaSurface(8, 8).line(-1000000000, 3, 1000000000, 3, [1, 2, 3, 255]);
  const diagonal = new RgbaSurface(8, 8).line(-9999, -9999, 9999, 9999, [1, 2, 3, 255]);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      t.is(pixel(horizontal, x, y)[3], y === 3 ? 255 : 0);
      t.is(pixel(diagonal, x, y)[3], x === y ? 255 : 0);
    }
  }
  const before = diagonal.rgba.slice();
  t.is(diagonal.line(-10, -1, 20, -1, [9, 8, 7, 6]), diagonal);
  t.is(diagonal.line(-10, -10, -2, -2, [9, 8, 7, 6]), diagonal);
  t.deepEqual(diagonal.rgba, before);
});

test('line(): writes transparent stroke RGB in copy mode', (t) => {
  const surface = new RgbaSurface(3, 3).fill([1, 2, 3, 255]);
  surface.line(0, 0, 2, 2, [9, 8, 7, 0]);
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      t.deepEqual(pixel(surface, x, y), x === y ? [9, 8, 7, 0] : [1, 2, 3, 255]);
    }
  }
});

test('measureText()/drawText(): exposes caption metrics and chainable drawing', (t) => {
  const surface = new RgbaSurface(47, 7);
  t.is(surface.measureText('FRAME 01').width, 47);
  t.is(surface.measureText('FRAME 01').height, 7);
  t.is(surface.drawText('FRAME 01', 0, 0, [255, 255, 255, 255]), surface);
  t.true(surface.rgba.some((byte) => byte !== 0));
  const before = surface.rgba.slice();
  t.is(surface.drawText('', 0, 0, [1, 2, 3, 4]), surface);
  t.deepEqual(surface.rgba, before);
});

test('clone()/crop()/flip()/scaleNearest(): propagate the allocation budget', (t) => {
  const surface = new RgbaSurface(3, 3, undefined, { maxPixels: 9 });
  for (const result of [surface.clone(), surface.crop(0, 0, 2, 2), surface.flipX(), surface.scaleNearest(1, 1)]) {
    t.is(result.maxPixels, 9);
    t.throws(() => result.scaleNearest(4, 3), { instanceOf: RangeError });
  }
});

test('constructor(): rejects invalid geometry, limits, and mismatched pixel buffers', (t) => {
  for (const value of [0, -1, 0.5, NaN, Infinity, 0x80000000]) {
    t.throws(() => new RgbaSurface(value, 1), { instanceOf: RangeError });
    t.throws(() => new RgbaSurface(1, value), { instanceOf: RangeError });
  }
  for (const value of [0, -1, 0.5, NaN, Infinity]) {
    t.throws(() => new RgbaSurface(1, 1, undefined, { maxPixels: value }), { instanceOf: RangeError });
  }
  t.throws(() => new RgbaSurface(3, 3, undefined, { maxPixels: 8 }), { instanceOf: RangeError });
  t.throws(() => new RgbaSurface(1, 1, new Uint8Array(3)), { instanceOf: TypeError });
  t.throws(() => new RgbaSurface(1, 1, new Uint8Array(5)), { instanceOf: TypeError });
  t.throws(() => new RgbaSurface(1, 1, [0, 0, 0, 0]), { instanceOf: TypeError });
});

test('fill()/blit()/line()/drawText(): reject invalid parameters before mutation', (t) => {
  const surface = createSurface(3, 2);
  const before = surface.rgba.slice();
  const source = createSurface(1, 1);
  const calls = [
    () => surface.fill([256, 0, 0, 0]),
    () => surface.fill([0, 0, 0]),
    () => surface.fill([1, 2, 3, 4], { x: 0.5 }),
    () => surface.fill([1, 2, 3, 4], { height: -1 }),
    () => surface.blit(source, NaN, 0),
    () => surface.blit(source, 0, 0, { sx: 0.5 }),
    () => surface.blit(source, 0, 0, { width: -1 }),
    () => surface.blit(source, 0, 0, { mode: 'invalid' }),
    () => surface.line(0.5, 0, 1, 1, [1, 2, 3, 4]),
    () => surface.line(0, Infinity, 1, 1, [1, 2, 3, 4]),
    () => surface.drawText('A', 0, 0, [1, 2, 3]),
    () => surface.drawText('A', 0, 0, [1, 2, 3, 4], { scale: 0 }),
    () => surface.drawText('A'.repeat(4097), 0, 0, [1, 2, 3, 4]),
  ];
  for (const call of calls) {
    t.throws(call);
    t.deepEqual(surface.rgba, before);
  }
});

test('crop()/flip()/scaleNearest()/fitNearest(): reject invalid transformations', (t) => {
  const surface = createSurface(3, 2);
  const before = surface.rgba.slice();
  const calls = [
    () => surface.crop(-1, 0, 1, 1),
    () => surface.crop(0, 0, 0, 1),
    () => surface.crop(2, 1, 2, 2),
    () => surface.crop(0.5, 0, 1, 1),
    () => surface.flip({ horizontal: 1 }),
    () => surface.flip({ vertical: 'true' }),
    () => surface.scaleNearest(0, 1),
    () => surface.scaleNearest(1, 0),
    () => surface.scaleNearest(1.5, 2),
    () => surface.fitNearest(0),
    () => surface.fitNearest(NaN),
    () => surface.fitNearest(10, { upscale: 1 }),
  ];
  for (const call of calls) {
    t.throws(call);
    t.deepEqual(surface.rgba, before);
  }
});
