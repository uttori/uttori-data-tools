import { Buffer } from 'node:buffer';
import { deflateSync, gzipSync, inflateSync } from 'node:zlib';
import test from 'ava';

import DataBuffer from '../../dist/data-buffer.js';
import ImagePNG from '../../dist/image/data-image-png.js';
import RgbaSurface from '../../dist/image/rgba-surface.js';

// These fixtures deliberately use Node's zlib and an independent scalar CRC.
// Building every decoder input with ImagePNG.encode*() could hide matching bugs
// in the encoder and decoder. No generated files or additional packages are needed.
const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PASSES = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];
const LAYOUTS = [
  { colorType: 0, channels: 1, depths: [1, 2, 4, 8, 16] },
  { colorType: 2, channels: 3, depths: [8, 16] },
  { colorType: 3, channels: 1, depths: [1, 2, 4, 8] },
  { colorType: 4, channels: 2, depths: [8, 16] },
  { colorType: 6, channels: 4, depths: [8, 16] },
];

/**
 * Calculate a reference CRC without the implementation's lookup tables.
 * @param {Uint8Array} bytes Bytes containing the chunk type and payload.
 * @returns {number} Unsigned CRC-32.
 */
function referenceCrc(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc >>>= 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Frame a chunk independently of ImagePNG, including deliberately invalid types.
 * @param {string} type Four-byte chunk name.
 * @param {Uint8Array|number[]} [payload] Unframed payload.
 * @returns {Buffer} Length, type, payload, and checksum.
 */
function chunk(type, payload = []) {
  const bytes = Buffer.alloc(payload.length + 12);
  bytes.writeUInt32BE(payload.length, 0);
  bytes.write(type, 4, 4, 'ascii');
  bytes.set(payload, 8);
  bytes.writeUInt32BE(referenceCrc(bytes.subarray(4, bytes.length - 4)), bytes.length - 4);
  return bytes;
}

/**
 * Build an IHDR payload, including invalid combinations for rejection tests.
 * @param {number} [width] Pixel width.
 * @param {number} [height] Pixel height.
 * @param {number} [depth] Sample depth.
 * @param {number} [colorType] PNG color type.
 * @param {number} [interlace] Zero for ordinary rows, one for Adam7.
 * @returns {Buffer} Thirteen unframed header bytes.
 */
function header(width = 1, height = 1, depth = 8, colorType = 6, interlace = 0) {
  const bytes = Buffer.alloc(13);
  bytes.writeUInt32BE(width, 0);
  bytes.writeUInt32BE(height, 4);
  bytes[8] = depth;
  bytes[9] = colorType;
  bytes[12] = interlace;
  return bytes;
}

/**
 * Join independently framed chunks with the PNG signature.
 * @param {...Uint8Array} chunks Complete chunks in file order.
 * @returns {Uint8Array} Owned PNG bytes, not a Node Buffer.
 */
function png(...chunks) {
  return Uint8Array.from(Buffer.concat([SIGNATURE, ...chunks]));
}

/**
 * Build a small PNG from exact filtered rows.
 * @param {Uint8Array|number[]} [rows] Filter bytes and row payloads.
 * @param {Uint8Array} [ihdr] Unframed IHDR bytes.
 * @returns {Uint8Array} Complete source PNG.
 */
function basic(rows = [0, 17, 34, 51, 255], ihdr = header()) {
  return png(
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Uint8Array.from(rows))),
    chunk('IEND'),
  );
}

/**
 * Select a reference predictor. Stable candidate order handles Paeth ties.
 * @param {number} filter Filter type, zero through four.
 * @param {number} left Byte in the current unfiltered row.
 * @param {number} above Byte in the previous unfiltered row.
 * @param {number} corner Byte above and to the left.
 * @returns {number} Predictor before modulo-256 arithmetic.
 */
function predictor(filter, left, above, corner) {
  switch (filter) {
    case 0:
      return 0;
    case 1:
      return left;
    case 2:
      return above;
    case 3:
      return Math.floor((left + above) / 2);
    case 4: {
      const estimate = left + above - corner;
      let nearest = left;
      for (const candidate of [above, corner]) {
        if (Math.abs(estimate - candidate) < Math.abs(estimate - nearest)) {
          nearest = candidate;
        }
      }
      return nearest;
    }
    default:
      throw new Error(`Invalid reference filter ${filter}.`);
  }
}

/**
 * Port the original Python fixture matrix to an in-memory reference encoder.
 * Expected native samples and RGBA bytes are calculated before packing/filtering.
 * @param {number} width Pixel width.
 * @param {number} height Pixel height.
 * @param {number} colorType PNG color type.
 * @param {number} depth Native sample depth.
 * @param {number} interlace Interlace method.
 * @param {number} filter Filter type; five alternates all filters across passes/rows.
 * @returns {{bytes: Uint8Array, samples: number[], rgba: Uint8Array, palette: number[][]}}
 * Source PNG and independently calculated expectations.
 */
function fixture(width, height, colorType, depth, interlace, filter) {
  const { channels } = LAYOUTS.find((layout) => layout.colorType === colorType);
  const maximum = 2 ** depth - 1;
  const native16 = [0, 255, 256, 0x1234, 0xff00, 0xffff, 0x8080, 0x8000, 0xabcd];
  const samples = Array.from({ length: width * height * channels }, (_, i) => {
    if (depth === 16) {
      return native16[(i * 7 + Math.floor(i / channels)) % native16.length];
    }
    return (i * 37 + Math.floor(i / channels) * 10 + (i % channels) * 113) & maximum;
  });
  const palette = [];
  if (colorType === 3) {
    for (let i = 0; i < Math.min(2 ** depth, 256); i++) {
      const pair = Math.floor(i / 2);
      palette.push([(pair * 17) & 255, (pair * 29) & 255, (pair * 43) & 255, (i * 71) & 255]);
    }
    // The last slot is omitted from tRNS and must default to fully opaque.
    palette.at(-1)[3] = 255;
  }
  let key = [];
  if (colorType === 0 || colorType === 2) {
    key = samples.slice(0, channels);
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const values = samples.slice(pixel * channels, (pixel + 1) * channels);
    const scaled = values.map((value) => Math.floor((value * 255) / maximum + 0.5));
    if (colorType === 3) {
      rgba.set(palette[values[0]], pixel * 4);
      continue;
    }
    let alpha = 255;
    if (colorType === 4 || colorType === 6) {
      alpha = scaled.at(-1);
    } else if (values.every((value, i) => value === key[i])) {
      alpha = 0;
    }
    if (colorType === 0 || colorType === 4) {
      rgba.set([scaled[0], scaled[0], scaled[0], alpha], pixel * 4);
    } else {
      rgba.set([scaled[0], scaled[1], scaled[2], alpha], pixel * 4);
    }
  }

  const rows = [];
  const passes = interlace === 1 ? PASSES : [[0, 0, 1, 1]];
  for (const [pass, [startX, startY, stepX, stepY]] of passes.entries()) {
    const xs = [];
    const ys = [];
    for (let x = startX; x < width; x += stepX) {
      xs.push(x);
    }
    for (let y = startY; y < height; y += stepY) {
      ys.push(y);
    }
    if (xs.length === 0 || ys.length === 0) {
      continue;
    }
    const rowBytes = Math.ceil((xs.length * channels * depth) / 8);
    const bpp = Math.max(1, Math.ceil((channels * depth) / 8));
    let previous = Buffer.alloc(rowBytes);
    for (const [rowIndex, y] of ys.entries()) {
      const values = xs.flatMap((x) => samples.slice((y * width + x) * channels, (y * width + x + 1) * channels));
      const row = Buffer.alloc(rowBytes);
      for (const [i, value] of values.entries()) {
        if (depth < 8) {
          const bit = i * depth;
          row[Math.floor(bit / 8)] |= value << (8 - depth - (bit % 8));
        } else if (depth === 8) {
          row[i] = value;
        } else {
          row.writeUInt16BE(value, i * 2);
        }
      }
      // Nonzero padding catches unpackers that accidentally consume another pixel
      // or carry unused bits into the next row or the next Adam7 pass.
      const usedBits = (values.length * depth) % 8;
      if (depth < 8 && usedBits !== 0) {
        row[row.length - 1] |= 2 ** (8 - usedBits) - 1;
      }
      const kind = filter === 5 ? (pass + rowIndex) % 5 : filter;
      rows.push(kind);
      for (let i = 0; i < row.length; i++) {
        const left = i >= bpp ? row[i - bpp] : 0;
        const corner = i >= bpp ? previous[i - bpp] : 0;
        rows.push((row[i] - predictor(kind, left, previous[i], corner)) & 255);
      }
      previous = row;
    }
  }

  const physical = Buffer.alloc(9);
  physical.writeUInt32BE(3780, 0);
  physical.writeUInt32BE(7560, 4);
  physical[8] = 1;
  const parts = [
    chunk('IHDR', header(width, height, depth, colorType, interlace)),
    chunk('vpAg', Buffer.from('safe-before')),
    chunk('vpAG', Buffer.from('unsafe')),
    chunk('pHYs', physical),
  ];
  if (palette.length !== 0) {
    parts.push(chunk('PLTE', palette.flatMap((color) => color.slice(0, 3))));
    parts.push(chunk('tRNS', palette.slice(0, -1).map((color) => color[3])));
  } else if (key.length !== 0) {
    const transparency = Buffer.alloc(key.length * 2);
    key.forEach((value, i) => transparency.writeUInt16BE(value, i * 2));
    parts.push(chunk('tRNS', transparency));
  }
  const compressed = deflateSync(Uint8Array.from(rows));
  parts.push(chunk('IDAT'));
  // Split the zlib stream inside headers, deflate blocks, and checksums.
  for (let offset = 0; offset < compressed.length; offset += 7) {
    parts.push(chunk('IDAT', compressed.subarray(offset, offset + 7)));
  }
  parts.push(chunk('IDAT'), chunk('vpBg', Buffer.from('safe-after')), chunk('IEND'));
  return { bytes: png(...parts), samples, rgba, palette };
}

/**
 * Inspect emitted chunks and verify CRCs without decoding with ImagePNG.
 * @param {import('ava').ExecutionContext} t Current AVA context.
 * @param {Uint8Array} bytes Encoded PNG.
 * @returns {{type: string, data: Uint8Array, raw: Uint8Array}[]} Validated chunk views.
 */
function inspectChunks(t, bytes) {
  t.deepEqual(bytes.subarray(0, 8), Uint8Array.from(SIGNATURE));
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  for (let offset = 8; offset < buffer.length;) {
    t.true(offset + 12 <= buffer.length, 'Complete chunk framing');
    const length = buffer.readUInt32BE(offset);
    const end = offset + length + 12;
    t.true(end <= buffer.length, 'Payload fits inside the file');
    t.is(buffer.readUInt32BE(end - 4), referenceCrc(buffer.subarray(offset + 4, end - 4)));
    chunks.push({
      type: buffer.toString('ascii', offset + 4, offset + 8),
      data: bytes.subarray(offset + 8, end - 4),
      raw: bytes.subarray(offset, end),
    });
    offset = end;
  }
  t.is(chunks[0].type, 'IHDR');
  t.is(chunks.at(-1).type, 'IEND');
  t.is(chunks.at(-1).data.length, 0);
  return chunks;
}

/**
 * Independently reconstruct non-interlaced writer output using native zlib.
 * @param {import('ava').ExecutionContext} t Current AVA context.
 * @param {Uint8Array} bytes Encoded PNG.
 * @param {number} rowBytes Packed byte count per row.
 * @param {number} height Row count.
 * @param {number} bpp Filtering distance in bytes.
 * @returns {{rows: Uint8Array, filters: number[]}} Unfiltered packed rows and filter types.
 */
function inspectRows(t, bytes, rowBytes, height, bpp) {
  const chunks = inspectChunks(t, bytes);
  t.is(chunks[0].data[12], 0);
  const compressed = Buffer.concat(chunks.filter((item) => item.type === 'IDAT').map((item) => item.data));
  const filtered = inflateSync(compressed);
  t.is(filtered.length, height * (rowBytes + 1));
  const rows = new Uint8Array(height * rowBytes);
  const filters = [];
  for (let y = 0; y < height; y++) {
    const filter = filtered[y * (rowBytes + 1)];
    t.true(filter >= 0 && filter <= 4);
    filters.push(filter);
    for (let x = 0; x < rowBytes; x++) {
      const offset = y * rowBytes + x;
      const left = x >= bpp ? rows[offset - bpp] : 0;
      const above = y > 0 ? rows[offset - rowBytes] : 0;
      let corner = 0;
      if (y > 0 && x >= bpp) {
        corner = rows[offset - rowBytes - bpp];
      }
      rows[offset] = filtered[y * (rowBytes + 1) + x + 1] + predictor(filter, left, above, corner);
    }
  }
  return { rows, filters };
}

/**
 * Get a fresh indexed input with duplicate RGB and differing alpha values.
 * @returns {{width: number, height: number, indexes: Uint8Array, palette: number[][]}}
 * An editable indexed image owned by the current test.
 */
function indexedInput() {
  return {
    width: 7,
    height: 3,
    indexes: Uint8Array.from({ length: 21 }, (_, i) => i % 4),
    palette: [
      [10, 20, 30, 255],
      [10, 20, 30, 255],
      [10, 20, 30, 0],
      [40, 50, 60, 128],
    ],
  };
}

// Preserve the original 1,260-case matrix: fifteen layouts, seven dimensions,
// both interlace methods, and all five filters plus mixed-filter rows.
for (const { colorType, channels, depths } of LAYOUTS) {
  for (const depth of depths) {
    for (const [width, height] of [[1, 1], [1, 9], [2, 3], [3, 2], [7, 5], [9, 9], [17, 11]]) {
      for (const interlace of [0, 1]) {
        for (const filter of [0, 1, 2, 3, 4, 5]) {
          const name = `${width}x${height}, color ${colorType}, depth ${depth}`
            + `, interlace ${interlace}, filter ${filter}`;
          test(`decodePixels(): reconstructs ${name}`, (t) => {
            const expected = fixture(width, height, colorType, depth, interlace, filter);
            const image = new ImagePNG(expected.bytes);
            t.false(image._decoded);
            t.is(image.pixels.length, 0);
            t.is(image.width, width);
            t.is(image.height, height);
            t.is(image.colors, channels);
            t.is(image.bitDepth, depth);
            t.is(image.colorType, colorType);
            t.is(image.interlaceMethod, interlace);
            t.deepEqual(Array.from(image.decodePixels()), expected.samples);
            t.true(image._decoded);
            t.is(image.pixels instanceof Uint16Array, depth === 16);
            t.is(image.pixels instanceof Uint8Array, depth !== 16);
            t.deepEqual(image.toRGBA().rgba, expected.rgba);
            t.deepEqual(image.physical, { width: 3780, height: 7560, unit: 1 });
            if (colorType === 3) {
              const indexed = image.toIndexed();
              t.deepEqual(Array.from(indexed.indexes), expected.samples);
              t.deepEqual(indexed.palette, expected.palette);
              t.is(indexed.sourceBitDepth, depth);
            }
          });
        }
      }
    }
  }
}

test('constructor(list, options): can initialize with a Node Buffer', (t) => {
  const data = Buffer.from(fixture(2, 3, 2, 8, 0, 0).bytes);
  let image;
  t.notThrows(() => {
    image = new ImagePNG(data);
  });
  t.true(image instanceof DataBuffer);
  t.is(image.colors, 3);
  t.is(image.offset, data.length);
  t.is(image.remainingBytes(), 0);
});

test('constructor(list, options): honors a view offset and copies input by default', (t) => {
  const source = basic();
  const backing = new Uint8Array(source.length + 20).fill(0xa5);
  backing.set(source, 9);
  const view = backing.subarray(9, 9 + source.length);
  const image = new ImagePNG(view);
  view.fill(0);
  t.deepEqual(image.data, source);
  t.not(image.data.buffer, view.buffer);
  t.deepEqual(image.getPixel(0, 0), [17, 34, 51, 255]);
  t.true(backing.subarray(0, 9).every((byte) => byte === 0xa5));
});

test('constructor(list, options): copyInput false borrows only the supplied view', (t) => {
  const source = basic();
  const backing = new Uint8Array(source.length + 15).fill(0xa5);
  backing.set(source, 5);
  const view = new DataView(backing.buffer, 5, source.length);
  const image = new ImagePNG(view, { copyInput: false });
  t.is(image.data.buffer, backing.buffer);
  t.is(image.data.byteOffset, 5);
  t.is(image.data.length, source.length);
  t.deepEqual(image.getPixel(0, 0), [17, 34, 51, 255]);
});

test('fromFile(data, options): accepts arrays, ArrayBuffers, and signed byte views', (t) => {
  const source = basic();
  const inputs = [Array.from(source), source.slice().buffer, new Int8Array(source.slice().buffer)];
  for (const input of inputs) {
    const image = ImagePNG.fromFile(input);
    t.deepEqual(image.getPixel(0, 0), [17, 34, 51, 255]);
  }
});

test('fromBuffer(buffer, options): reads the complete view without changing its cursor', (t) => {
  const buffer = new DataBuffer(basic());
  buffer.seek(9);
  const image = ImagePNG.fromBuffer(buffer);
  t.is(buffer.offset, 9);
  t.not(image.data.buffer, buffer.data.buffer);
  t.deepEqual(image.getPixel(0, 0), [17, 34, 51, 255]);
});

test('parse(): resets metadata and cached pixels rather than appending chunks', (t) => {
  const expected = fixture(7, 5, 3, 4, 1, 5);
  const image = new ImagePNG(expected.bytes);
  const count = image.chunks.length;
  const dataCount = image.dataChunks.length;
  image.decodePixels()[0] ^= 1;
  image.palette[0] ^= 255;
  t.is(image.parse(), image);
  t.false(image._decoded);
  t.is(image.chunks.length, count);
  t.is(image.dataChunks.length, dataCount);
  t.is(image.offset, image.data.length);
  t.deepEqual(Array.from(image.decodePixels()), expected.samples);
  t.deepEqual(image.toIndexed().palette, expected.palette);
});

test('decodePixels(options): caches success and force restores original samples', (t) => {
  const image = new ImagePNG(basic());
  const original = image.decodePixels();
  t.is(image.decodePixels(), original);
  original[0] = 99;
  t.is(image.getPixel(0, 0)[0], 99);
  const restored = image.decodePixels({ force: true });
  t.not(restored, original);
  t.deepEqual(restored, Uint8Array.of(17, 34, 51, 255));
  t.true(image._decoded);
});

test('invalidatePixels(): discards samples without discarding compressed data', (t) => {
  const image = new ImagePNG(basic());
  const compressed = image.dataChunks[0];
  image.decodePixels();
  image.invalidatePixels();
  t.false(image._decoded);
  t.is(image.pixels.length, 0);
  t.is(image.dataChunks[0], compressed);
  t.deepEqual(image.decodePixels(), Uint8Array.of(17, 34, 51, 255));
});

for (const [method, value] of [['setBitDepth', 8], ['setColorType', 6], ['setInterlaceMethod', 0]]) {
  test(`${method}(): invalidates decoded samples`, (t) => {
    const image = new ImagePNG(basic());
    image.decodePixels();
    image[method](value);
    t.false(image._decoded);
    t.is(image.pixels.length, 0);
    t.deepEqual(image.getPixel(0, 0), [17, 34, 51, 255]);
  });
}

test('decodePixels(): does not expose partially reconstructed pixels after failure', (t) => {
  const image = new ImagePNG(basic());
  image.decodePixels();
  // A valid zlib stream and row length, but an invalid scanline filter.
  image.dataChunks = [Uint8Array.from(deflateSync(Uint8Array.of(5, 17, 34, 51, 255)))];
  t.throws(() => image.decodePixels({ force: true }), { message: /filter/ });
  t.false(image._decoded);
  t.is(image.pixels.length, 0);
  image.parse();
  t.deepEqual(image.getPixel(0, 0), [17, 34, 51, 255]);
});

test('interlaceNone(data): writes successive rows without accumulating source offsets', (t) => {
  const expected = Uint8Array.from({ length: 2 * 5 * 4 }, (_, i) => i * 3);
  const rows = new Uint8Array(5 * 9);
  for (let y = 0; y < 5; y++) {
    rows.set(expected.subarray(y * 8, y * 8 + 8), y * 9 + 1);
  }
  const image = new ImagePNG(basic(rows, header(2, 5)));
  t.deepEqual(image.interlaceNone(rows), expected);
  t.is(image.decodePixels(), image.pixels);
  t.deepEqual(image.getPixel(1, 4), Array.from(expected.subarray(-4)));
});

test('interlaceAdam7(data): accepts exact decompressed passes and rejects truncated rows', (t) => {
  const expected = fixture(17, 11, 3, 2, 1, 5);
  const image = new ImagePNG(expected.bytes);
  const rows = Uint8Array.from(inflateSync(Buffer.concat(image.dataChunks)));
  t.deepEqual(Array.from(image.interlaceAdam7(rows)), expected.samples);
  t.throws(() => image.interlaceAdam7(rows.subarray(0, rows.length - 1)), { message: /length/ });
  t.false(image._decoded);
  t.is(image.pixels.length, 0);
});

test('decodePixels(): accepts empty IDAT chunks between single-byte zlib fragments', (t) => {
  const compressed = deflateSync(Uint8Array.of(0, 17, 34, 51, 255));
  const parts = [chunk('IHDR', header())];
  for (const byte of compressed) {
    parts.push(chunk('IDAT'), chunk('IDAT', [byte]));
  }
  parts.push(chunk('IDAT'), chunk('IEND'));
  t.deepEqual(new ImagePNG(png(...parts)).decodePixels(), Uint8Array.of(17, 34, 51, 255));
});

test('getPixelInto(x, y, output, offset): writes four bytes and preserves surrounding data', (t) => {
  const image = new ImagePNG(basic());
  const backing = new Uint8Array(12).fill(0xa5);
  const output = backing.subarray(2, 10);
  t.is(image.getPixelInto(0, 0, output, 1), output);
  t.deepEqual(backing, Uint8Array.of(165, 165, 165, 17, 34, 51, 255, 165, 165, 165, 165, 165));
  t.deepEqual(image.getPixel(0, 0), Array.from(output.subarray(1, 5)));
});

test('toIndexed(options): copies by default and preserves duplicate palette slots', (t) => {
  const input = indexedInput();
  const image = new ImagePNG(ImagePNG.encodeIndexed(input));
  const copy = image.toIndexed();
  const borrowed = image.toIndexed({ copy: false });
  t.is(borrowed.indexes, image.pixels);
  t.not(copy.indexes.buffer, image.pixels.buffer);
  t.deepEqual(copy.palette, input.palette);
  t.not(copy.palette[0], copy.palette[1]);
  copy.indexes[0] = 3;
  copy.palette[0][0] = 222;
  t.is(image.pixels[0], 0);
  t.is(image.palette[0], 10);
  borrowed.indexes[0] = 3;
  t.deepEqual(image.getPixel(0, 0), input.palette[3]);
  t.throws(() => new ImagePNG(basic()).toIndexed(), { message: /indexed/ });
});

test('toRGBA(options): borrows RGBA8 only when explicitly requested', (t) => {
  const image = new ImagePNG(basic());
  const copy = image.toRGBA();
  const borrowed = image.toRGBA({ copy: false });
  t.true(copy instanceof RgbaSurface);
  t.not(copy.rgba.buffer, image.pixels.buffer);
  t.is(borrowed.rgba, image.pixels);
  copy.rgba[0] = 99;
  t.is(image.pixels[0], 17);
  borrowed.rgba[0] = 77;
  t.is(image.getPixel(0, 0)[0], 77);
  const indexed = new ImagePNG(ImagePNG.encodeIndexed(indexedInput()));
  const indexes = indexed.decodePixels().slice();
  const surface = indexed.toRGBA({ copy: false });
  t.not(surface.rgba.buffer, indexed.pixels.buffer);
  surface.fill([1, 2, 3, 4]);
  t.deepEqual(indexed.pixels, indexes);
});

test('toRGBA(): compares 16-bit transparency keys before rounding to RGBA8', (t) => {
  const source = png(
    chunk('IHDR', header(2, 1, 16, 2)),
    chunk('tRNS', [0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc]),
    chunk('IDAT', deflateSync(Uint8Array.of(
      0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc,
      0x12, 0x35, 0x56, 0x78, 0x9a, 0xbc,
    ))),
    chunk('IEND'),
  );
  const image = new ImagePNG(source);
  const transparent = image.getPixel(0, 0);
  const opaque = image.getPixel(1, 0);
  t.deepEqual(transparent.slice(0, 3), opaque.slice(0, 3));
  t.is(transparent[3], 0);
  t.is(opaque[3], 255);
  t.deepEqual(Array.from(image.decodePixels()), [0x1234, 0x5678, 0x9abc, 0x1235, 0x5678, 0x9abc]);
});

test('setPalette(palette): changes colors without remapping or discarding decoded indexes', (t) => {
  const image = new ImagePNG(ImagePNG.encodeIndexed(indexedInput()));
  const indexes = image.decodePixels();
  const replacement = Array.from(image.palette);
  replacement[0] = 123;
  image.setPalette(replacement);
  replacement[0] = 99;
  t.is(image.pixels, indexes);
  t.true(image._decoded);
  t.is(image.getPixel(0, 0)[0], 123);
  t.throws(() => image.setPalette([1, 2, 3]), { message: /Transparency/ });
  image.decodeTRNS(Uint8Array.of(255));
  t.throws(() => image.setPalette([1, 2, 3]), { message: /Decoded index/ });
});

for (const bitDepth of [1, 2, 4, 8]) {
  for (const filter of ['none', 'sub', 'adaptive']) {
    test(`encodeIndexed(image, options): retains slots and packs ${bitDepth}-bit ${filter} rows`, (t) => {
      const input = indexedInput();
      if (bitDepth === 1) {
        input.palette = input.palette.slice(0, 2);
        input.indexes = Uint8Array.from(input.indexes, (index) => index % 2);
      }
      const beforeIndexes = input.indexes.slice();
      const beforePalette = structuredClone(input.palette);
      const bytes = ImagePNG.encodeIndexed(input, { bitDepth, filter });
      const rowBytes = Math.ceil((input.width * bitDepth) / 8);
      const inspected = inspectRows(t, bytes, rowBytes, input.height, 1);
      const packed = new Uint8Array(rowBytes * input.height);
      for (let y = 0; y < input.height; y++) {
        for (let x = 0; x < input.width; x++) {
          const bit = x * bitDepth;
          const index = input.indexes[y * input.width + x];
          packed[y * rowBytes + Math.floor(bit / 8)] |= index << (8 - bitDepth - (bit % 8));
        }
      }
      t.deepEqual(inspected.rows, packed);
      if (filter === 'none') {
        t.deepEqual(inspected.filters, [0, 0, 0]);
      } else if (filter === 'sub') {
        t.deepEqual(inspected.filters, [1, 1, 1]);
      }
      const image = new ImagePNG(bytes);
      t.is(image.bitDepth, bitDepth);
      t.is(image.colorType, 3);
      t.deepEqual(image.toIndexed().indexes, input.indexes);
      t.deepEqual(image.toIndexed().palette, input.palette);
      t.deepEqual(input.indexes, beforeIndexes);
      t.deepEqual(input.palette, beforePalette);
    });
  }
}

test('createIndexedPng(image, options): matches encodeIndexed and defaults to eight-bit indexes', (t) => {
  const input = indexedInput();
  const bytes = ImagePNG.createIndexedPng(input);
  t.deepEqual(bytes, ImagePNG.encodeIndexed(input));
  t.is(new ImagePNG(bytes).bitDepth, 8);
  t.deepEqual(
    ImagePNG.createIndexedPng(input, { bitDepth: 2, filter: 'sub' }),
    ImagePNG.encodeIndexed(input, { bitDepth: 2, filter: 'sub' }),
  );
});

for (const filter of ['none', 'sub', 'adaptive']) {
  for (const level of [0, 1, 6, 9]) {
    test(`encodeRGBA(image, options): preserves every channel with ${filter}, level ${level}`, (t) => {
      const rgba = Uint8Array.from({ length: 17 * 9 * 4 }, (_, i) => (i * 13) & 255);
      rgba[3] = 0;
      const before = rgba.slice();
      const bytes = ImagePNG.encodeRGBA({ width: 17, height: 9, rgba }, { filter, level });
      const inspected = inspectRows(t, bytes, 17 * 4, 9, 4);
      t.deepEqual(inspected.rows, rgba);
      t.deepEqual(new ImagePNG(bytes).toRGBA().rgba, rgba);
      t.deepEqual(rgba, before);
      t.deepEqual(bytes, ImagePNG.encodeRGBA({ width: 17, height: 9, rgba }, { filter, level }));
    });
  }
}

test('encodeRGBA(image): accepts an RgbaSurface and a nonzero byte-offset view', (t) => {
  const backing = new Uint8Array(19).fill(0xa5);
  const rgba = backing.subarray(3, 19);
  const surface = new RgbaSurface(2, 2, rgba, { copy: false }).fill([123, 45, 67, 0]);
  const bytes = ImagePNG.encodeRGBA(surface);
  t.deepEqual(inspectRows(t, bytes, 8, 2, 4).rows, rgba);
  t.deepEqual(backing.subarray(0, 3), Uint8Array.of(165, 165, 165));
});

test('rewriteIndexed(source, edit): returns a byte-exact owned copy for unchanged edits', (t) => {
  const original = fixture(17, 11, 3, 4, 1, 5);
  const result = ImagePNG.rewriteIndexed(original.bytes);
  t.deepEqual(result, original.bytes);
  t.not(result.buffer, original.bytes.buffer);
  const explicit = ImagePNG.rewriteIndexed(original.bytes, {
    indexes: Uint8Array.from(original.samples),
    palette: structuredClone(original.palette),
    dimensions: { width: 17, height: 11 },
  });
  t.deepEqual(explicit, original.bytes);
  t.deepEqual(ImagePNG.rewriteIndexedPng(original.bytes), original.bytes);
});

test('rewriteIndexed(source, edit): palette-only edits preserve Adam7 and every framed IDAT', (t) => {
  const original = fixture(17, 11, 3, 4, 1, 5);
  const palette = structuredClone(original.palette);
  palette[0][0] ^= 255;
  palette[1][3] = 127;
  const before = original.bytes.slice();
  const result = ImagePNG.rewriteIndexed(original.bytes, { palette });
  const image = new ImagePNG(result);
  const originalChunks = inspectChunks(t, original.bytes);
  const resultChunks = inspectChunks(t, result);
  t.is(image.interlaceMethod, 1);
  t.deepEqual(image.toIndexed().indexes, Uint8Array.from(original.samples));
  t.deepEqual(image.toIndexed().palette, palette);
  t.deepEqual(
    resultChunks.filter((item) => item.type === 'IDAT').map((item) => item.raw),
    originalChunks.filter((item) => item.type === 'IDAT').map((item) => item.raw),
  );
  t.deepEqual(original.bytes, before);
  t.deepEqual(ImagePNG.rewriteIndexedPng(original.bytes, { palette }), result);
});

test('rewriteIndexed(source, edit): keeps safe ancillary chunks on both sides of IDAT', (t) => {
  const original = fixture(7, 5, 3, 4, 1, 5);
  const palette = structuredClone(original.palette);
  palette[0][0] ^= 255;
  const result = inspectChunks(t, ImagePNG.rewriteIndexed(original.bytes, { palette }));
  const source = inspectChunks(t, original.bytes);
  for (const type of ['vpAg', 'vpBg']) {
    t.deepEqual(result.find((item) => item.type === type).raw, source.find((item) => item.type === type).raw);
  }
  const firstData = result.findIndex((item) => item.type === 'IDAT');
  const lastData = result.findLastIndex((item) => item.type === 'IDAT');
  t.true(result.findIndex((item) => item.type === 'vpAg') < firstData);
  t.true(result.findIndex((item) => item.type === 'vpBg') > lastData);
  t.false(result.some((item) => item.type === 'vpAG'));
  const retained = inspectChunks(t, ImagePNG.rewriteIndexed(original.bytes, {
    palette,
    preserveChunks: ['vpAG'],
  }));
  t.deepEqual(retained.find((item) => item.type === 'vpAG').raw, source.find((item) => item.type === 'vpAG').raw);
});

test('rewriteIndexed(source, edit): adds transparency next to PLTE when tRNS was absent', (t) => {
  const input = indexedInput();
  const encoded = ImagePNG.encodeIndexed(input);
  const source = png(...inspectChunks(t, encoded).filter((item) => item.type !== 'tRNS').map((item) => item.raw));
  const palette = input.palette.map(([r, g, b]) => [r, g, b, 255]);
  palette[1][3] = 0;
  const result = ImagePNG.rewriteIndexed(source, { palette });
  const chunks = inspectChunks(t, result);
  const palettePosition = chunks.findIndex((item) => item.type === 'PLTE');
  t.is(chunks[palettePosition + 1].type, 'tRNS');
  t.is(chunks.filter((item) => item.type === 'tRNS').length, 1);
  t.deepEqual(new ImagePNG(result).toIndexed().palette, palette);
});

for (const bitDepth of [1, 2, 4, 8]) {
  test(`rewriteIndexed(source, edit): pixel edits retain ${bitDepth}-bit indexes and remove interlacing`, (t) => {
    const original = fixture(17, 11, 3, bitDepth, 1, 5);
    const indexes = Uint8Array.from(original.samples);
    indexes[2] = (indexes[2] + 1) % original.palette.length;
    const result = ImagePNG.rewriteIndexed(original.bytes, { indexes });
    const image = new ImagePNG(result);
    t.is(image.interlaceMethod, 0);
    t.is(image.bitDepth, bitDepth);
    t.deepEqual(image.toIndexed().indexes, indexes);
    t.deepEqual(image.toIndexed().palette, original.palette);
    t.is(inspectChunks(t, result).filter((item) => item.type === 'IDAT').length, 1);
  });
}

test('rewriteIndexed(source, edit): resizes only with a complete replacement index buffer', (t) => {
  const original = fixture(17, 11, 3, 4, 1, 5);
  const indexes = Uint8Array.from({ length: 15 }, (_, i) => i);
  const result = ImagePNG.rewriteIndexed(original.bytes, { dimensions: { width: 5, height: 3 }, indexes });
  const image = new ImagePNG(result);
  t.is(image.width, 5);
  t.is(image.height, 3);
  t.deepEqual(image.toIndexed().indexes, indexes);
  t.throws(() => ImagePNG.rewriteIndexed(original.bytes, { dimensions: { width: 5, height: 3 } }), {
    message: /replacement/,
  });
  t.throws(() => ImagePNG.rewriteIndexed(original.bytes, { palette: original.palette.slice(1) }), {
    message: /slot count/,
  });
});

test('rewriteIndexed(source, edit, options): calls host validation once even for a no-op', (t) => {
  const input = indexedInput();
  const source = ImagePNG.encodeIndexed(input);
  let calls = 0;
  const result = ImagePNG.rewriteIndexed(source, {}, {
    validateIndexed: (image) => {
      calls++;
      t.deepEqual(image.indexes, input.indexes);
      t.is(image.width, input.width);
      t.is(image.height, input.height);
    },
  });
  t.is(calls, 1);
  t.deepEqual(result, source);
  const failure = new Error('Host policy');
  t.throws(() => ImagePNG.rewriteIndexed(source, {}, {
    validateIndexed: () => {
      throw failure;
    },
  }), { is: failure });
});

test('rewriteIndexed(source, edit): compares against source bytes, not an edited decoded instance', (t) => {
  const source = ImagePNG.encodeIndexed(indexedInput());
  const image = new ImagePNG(source);
  const indexes = image.toIndexed({ copy: false }).indexes;
  indexes[0] = 3;
  const rewritten = ImagePNG.rewriteIndexed(source, { indexes });
  t.is(new ImagePNG(rewritten).toIndexed().indexes[0], 3);
  t.is(new ImagePNG(source).toIndexed().indexes[0], 0);
});

// Each mutation preserves all unrelated framing/CRCs unless CRC itself is the
// property being tested, so a failure cannot be explained by an earlier check.
const malformed = [
  ['signature', () => new Uint8Array(8), /header/],
  ['truncated chunk header', () => Uint8Array.from([...SIGNATURE, 0, 0]), /Truncated/],
  ['CRC mismatch', () => {
    const bytes = basic();
    bytes[29] ^= 1;
    return bytes;
  }, /CRC/],
  ['zero width', () => basic(undefined, header(0)), /Width/],
  ['oversized width', () => basic(undefined, header(0x80000000)), /Width/],
  ['invalid color and depth', () => basic(undefined, header(1, 1, 4, 6)), /color type/],
  ['invalid interlace method', () => basic(undefined, header(1, 1, 8, 6, 2)), /Interlace/],
  ['missing IEND', () => basic().slice(0, -12), /missing/],
  ['trailing file bytes', () => Uint8Array.from([...basic(), 0]), /trailing/],
  ['duplicate IHDR', () => png(chunk('IHDR', header()), chunk('IHDR', header()), chunk('IEND')), /exactly one/],
  ['IHDR not first', () => png(chunk('vpAg'), chunk('IHDR', header()), chunk('IEND')), /first/],
  ['unknown critical chunk', () => png(chunk('IHDR', header()), chunk('ABCD'), chunk('IEND')), /critical/],
  ['invalid chunk name', () => png(chunk('IHDR', header()), chunk('a1Ag'), chunk('IEND')), /chunk type/],
  ['invalid reserved chunk bit', () => png(chunk('IHDR', header()), chunk('vpbg'), chunk('IEND')), /chunk type/],
  ['noncontiguous IDAT', () => png(
    chunk('IHDR', header()),
    chunk('IDAT'),
    chunk('vpAg'),
    chunk('IDAT'),
    chunk('IEND'),
  ), /contiguous/],
  ['invalid filter', () => basic([5, 1, 2, 3, 4]), /filter/],
  ['short inflated row', () => basic([0, 1, 2, 3]), /length/],
  ['excess inflated data', () => basic(new Uint8Array(100000)), /exceeds/],
  ['missing IDAT', () => png(chunk('IHDR', header()), chunk('IEND')), /IEND/],
  ['empty zlib stream', () => png(chunk('IHDR', header()), chunk('IDAT'), chunk('IEND')), /incomplete/],
  ['truncated zlib trailer', () => {
    const compressed = deflateSync(Uint8Array.of(0, 1, 2, 3, 4));
    return png(
      chunk('IHDR', header()),
      chunk('IDAT', compressed.subarray(0, -1)),
      chunk('IEND'),
    );
  }, /incomplete/],
  ['invalid Adler checksum', () => {
    const compressed = deflateSync(Uint8Array.of(0, 1, 2, 3, 4));
    compressed[compressed.length - 1] ^= 1;
    return png(chunk('IHDR', header()), chunk('IDAT', compressed), chunk('IEND'));
  }, /image data/],
  ['gzip rather than zlib', () => png(
    chunk('IHDR', header()),
    chunk('IDAT', gzipSync(Uint8Array.of(0, 1, 2, 3, 4))),
    chunk('IEND'),
  ), /image data/],
  ['missing indexed palette', () => png(chunk('IHDR', header(1, 1, 1, 3)), chunk('IDAT'), chunk('IEND')), /PLTE/],
  ['incomplete RGB triple', () => png(
    chunk('IHDR', header(1, 1, 1, 3)),
    chunk('PLTE', [0, 0]),
    chunk('IEND'),
  ), /palette/],
  ['palette on grayscale', () => png(
    chunk('IHDR', header(1, 1, 8, 0)),
    chunk('PLTE', [0, 0, 0]),
    chunk('IEND'),
  ), /PLTE/],
  ['out-of-range palette index', () => png(
    chunk('IHDR', header(1, 1, 1, 3)),
    chunk('PLTE', [0, 0, 0]),
    chunk('IDAT', deflateSync(Uint8Array.of(0, 128))),
    chunk('IEND'),
  ), /index/],
  ['tRNS on RGBA', () => png(chunk('IHDR', header()), chunk('tRNS', [0, 0]), chunk('IEND')), /tRNS/],
  ['grayscale tRNS beyond sample depth', () => png(
    chunk('IHDR', header(1, 1, 1, 0)),
    chunk('tRNS', [0, 2]),
    chunk('IEND'),
  ), /bit depth/],
];
for (const [name, makeSource, message] of malformed) {
  test(`constructor()/decodePixels(): rejects ${name}`, (t) => {
    t.throws(() => new ImagePNG(makeSource()).decodePixels(), { message });
  });
}

test('decodePixels(): rejects a second zlib stream or bytes following the first stream', (t) => {
  const compressed = deflateSync(Uint8Array.of(0, 17, 34, 51, 255));
  for (const trailing of [Uint8Array.of(1), compressed]) {
    for (const separateChunks of [false, true]) {
      const data = [chunk('IDAT', compressed)];
      if (separateChunks) {
        data.push(chunk('IDAT', trailing));
      } else {
        data[0] = chunk('IDAT', Buffer.concat([compressed, trailing]));
      }
      t.throws(() => new ImagePNG(png(chunk('IHDR', header()), ...data, chunk('IEND'))).decodePixels());
    }
  }
});

test('decodeChunk(): rejects invalid framing without advancing the inherited cursor', (t) => {
  const image = new ImagePNG(basic());
  image.reset();
  image.decodeHeader();
  const before = image.offset;
  image.data[before + 8] ^= 1;
  t.throws(() => image.parse(), { message: /CRC/ });
  t.is(image.offset, before);
  t.throws(() => image.decodeChunk(), { message: /CRC/ });
  t.is(image.offset, before);
});

test('constructor(list, options): enforces input, pixel, inflated-byte, and chunk limits', (t) => {
  t.throws(() => new ImagePNG(basic(), { maxInputBytes: 10 }), { instanceOf: RangeError });
  t.throws(() => new ImagePNG(basic(undefined, header(2, 1)), { maxPixels: 1 }), { instanceOf: RangeError });
  t.throws(() => new ImagePNG(basic(), { maxInflatedBytes: 4 }), { instanceOf: RangeError });
  t.throws(() => new ImagePNG(basic(), { maxChunks: 2 }), { instanceOf: RangeError });
  t.notThrows(() => new ImagePNG(basic(), { maxInflatedBytes: 5, maxPixels: 1, maxChunks: 3 }));
  for (const value of [0, -1, 0.5, NaN, Infinity]) {
    t.throws(() => new ImagePNG(basic(), { maxPixels: value }), { instanceOf: RangeError });
  }
});

test('encodeIndexed()/encodeRGBA()/rewriteIndexed(): enforce output budgets', (t) => {
  const input = indexedInput();
  const source = ImagePNG.encodeIndexed(input);
  t.throws(() => ImagePNG.encodeIndexed(input, { maxOutputBytes: 20 }), { instanceOf: RangeError });
  t.throws(() => ImagePNG.encodeRGBA(new RgbaSurface(1, 1), { maxOutputBytes: 20 }), { instanceOf: RangeError });
  t.throws(() => ImagePNG.encodeRGBA(new RgbaSurface(1, 1), { maxInflatedBytes: 4 }), { instanceOf: RangeError });
  t.throws(() => ImagePNG.rewriteIndexed(source, {}, { maxOutputBytes: source.length - 1 }), {
    instanceOf: RangeError,
  });
  t.deepEqual(ImagePNG.rewriteIndexed(source, {}, { maxOutputBytes: source.length }), source);
});

test('constructor(list, options): supports explicit 16-bit and animation policies', (t) => {
  const sixteen = fixture(2, 3, 0, 16, 1, 5);
  t.throws(() => new ImagePNG(sixteen.bytes, { allow16Bit: false }), { message: /16-bit/ });
  t.true(new ImagePNG(sixteen.bytes).decodePixels() instanceof Uint16Array);
  const source = png(
    chunk('IHDR', header()),
    chunk('acTL', [0, 0, 0, 1, 0, 0, 0, 0]),
    chunk('IDAT', deflateSync(Uint8Array.of(0, 0, 0, 0, 255))),
    chunk('IEND'),
  );
  t.throws(() => new ImagePNG(source), { message: /Animated/ });
  const image = new ImagePNG(source, { animation: 'default-image' });
  t.true(image.animated);
  t.deepEqual(image.getPixel(0, 0), [0, 0, 0, 255]);
});

test('rewriteIndexed(): rejects edits to animated sources even after default-image opt-in', (t) => {
  const input = indexedInput();
  const chunks = inspectChunks(t, ImagePNG.encodeIndexed(input));
  const source = png(
    chunks[0].raw,
    chunk('acTL', [0, 0, 0, 1, 0, 0, 0, 0]),
    ...chunks.slice(1).map((item) => item.raw),
  );
  const palette = structuredClone(input.palette);
  palette[0][0] ^= 255;
  t.throws(() => ImagePNG.rewriteIndexed(source, { palette }, { animation: 'default-image' }), { message: /animated/ });
});

test('getPixel()/getPixelInto(): reject invalid coordinates and output buffers', (t) => {
  const image = new ImagePNG(basic());
  for (const value of [-1, 1, 0.5, NaN, Infinity]) {
    t.throws(() => image.getPixel(value, 0), { instanceOf: RangeError });
    t.throws(() => image.getPixel(0, value), { instanceOf: RangeError });
  }
  const output = new Uint8Array(6).fill(0xa5);
  for (const offset of [-1, 0.5, 3, Infinity]) {
    t.throws(() => image.getPixelInto(0, 0, output, offset), { instanceOf: RangeError });
  }
  t.throws(() => image.getPixelInto(0, 0, [0, 0, 0, 0]), { instanceOf: RangeError });
  t.deepEqual(output, new Uint8Array(6).fill(0xa5));
  t.false(image._decoded);
});

test('encodeIndexed(image, options): rejects invalid palettes, indexes, and options', (t) => {
  const input = indexedInput();
  for (const palette of [[], [[1, 2, 3]], [[256, 2, 3, 4]], [[1, 2, 3, -1]]]) {
    t.throws(() => ImagePNG.encodeIndexed({ ...input, palette }));
  }
  t.throws(() => ImagePNG.encodeIndexed(input, { bitDepth: 1 }));
  t.throws(() => ImagePNG.encodeIndexed(input, { bitDepth: 16 }));
  t.throws(() => ImagePNG.encodeIndexed({ ...input, indexes: new Uint8Array(1) }));
  t.throws(() => ImagePNG.encodeIndexed({ ...input, indexes: new Uint8Array(21).fill(4) }));
  t.throws(() => ImagePNG.encodeIndexed(input, { filter: 'invalid' }));
  t.throws(() => ImagePNG.encodeIndexed(input, { level: 10 }));
  t.throws(() => ImagePNG.encodeRGBA({ width: 1, height: 1, rgba: new Uint8Array(3) }));
  for (const name of ['IHDR', 'vpbg', 'a1Ag', 'acTL']) {
    t.throws(() => ImagePNG.rewriteIndexed(ImagePNG.encodeIndexed(input), { preserveChunks: [name] }));
  }
});

test('constructor()/decodePixels()/toIndexed()/toRGBA(): validate option types', (t) => {
  t.throws(() => new ImagePNG(10), { instanceOf: TypeError });
  t.throws(() => new ImagePNG(basic(), { copyInput: 'false' }), { instanceOf: TypeError });
  t.throws(() => new ImagePNG(basic(), { allow16Bit: 'false' }), { instanceOf: TypeError });
  t.throws(() => new ImagePNG(basic(), { animation: 'all-frames' }));
  const image = new ImagePNG(basic());
  t.throws(() => image.decodePixels({ force: 1 }), { instanceOf: TypeError });
  t.throws(() => image.toRGBA({ copy: 0 }), { instanceOf: TypeError });
  t.throws(() => image.toIndexed({ copy: 'true' }), { instanceOf: TypeError });
});

const unfilters = [
  ['unFilterNone', [2, 3, 4]],
  ['unFilterSub', [2, 5, 9]],
  ['unFilterUp', [12, 23, 34]],
  ['unFilterAverage', [7, 16, 27]],
  ['unFilterPaeth', [12, 23, 34]],
];
for (const [method, expected] of unfilters) {
  for (const typed of [false, true]) {
    test(`${method}(pixels, scanline, bpp, offset, length): supports ${typed ? 'Uint8Array' : 'number[]'}`, (t) => {
      let pixels = [10, 20, 30, 0, 0, 0, 99];
      let scanline = [2, 3, 4];
      if (typed) {
        pixels = Uint8Array.from(pixels);
        scanline = Uint8Array.from(scanline);
      }
      t.is(ImagePNG[method](pixels, scanline, 1, 3, 3), pixels);
      t.deepEqual(Array.from(pixels), [10, 20, 30, ...expected, 99]);
      t.deepEqual(Array.from(scanline), [2, 3, 4]);
    });
  }
}

test('unFilter*(): handles first rows, short rows, and modulo-256 reconstruction', (t) => {
  for (const [method] of unfilters) {
    const output = new Uint8Array(1);
    t.is(ImagePNG[method](output, Uint8Array.of(250), 4, 0, 1), output);
    t.is(output[0], 250);
  }
  const output = [250, 250, 0, 0];
  ImagePNG.unFilterUp(output, [10, 20], 1, 2, 2);
  t.deepEqual(output, [250, 250, 4, 14]);
  t.throws(() => ImagePNG.unFilterSub(new Uint8Array(2), [1, 2], 0, 0, 2), { instanceOf: RangeError });
  t.throws(() => ImagePNG.unFilterNone(new Uint8Array(2), [1], 1, 0, 2), { instanceOf: RangeError });
});
