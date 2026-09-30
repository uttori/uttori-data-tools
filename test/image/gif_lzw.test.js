import test from 'ava';

import { GIFLZW } from '../../dist/index.js';

test('pack: computes the output stream correctly', (t) => {
  const lzw = new GIFLZW();
  const codeLength = 8;
  lzw.pack(codeLength, 1);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 0);
  t.deepEqual(lzw.output, [1]);

  lzw.pack(codeLength, 2);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 0);
  t.deepEqual(lzw.output, [1, 2]);

  lzw.pack(codeLength, 3);
  t.is(lzw.offset, 3);
  t.is(lzw.bitOffset, 0);
  t.deepEqual(lzw.output, [1, 2, 3]);
});

test('pack: computes the output stream correctly (code length > 8)', (t) => {
  const lzw = new GIFLZW();
  const codeLength = 9;
  lzw.pack(codeLength, 256);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 1);
  t.deepEqual(lzw.output, [0, 1]);
});

test('pack: computes the output stream correctly (code length < 8, progressive values)', (t) => {
  const lzw = new GIFLZW();
  const codeLength = 4;
  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 4);
  t.deepEqual(lzw.output, [0]);

  lzw.pack(codeLength, 1);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 0);
  t.deepEqual(lzw.output, [16]);

  lzw.pack(codeLength, 2);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 4);
  t.deepEqual(lzw.output, [16, 2]);

  lzw.pack(codeLength, 3);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 0);
  t.deepEqual(lzw.output, [16, 50]);
});

test('pack: computes the output stream correctly (code length < 8)', (t) => {
  const lzw = new GIFLZW();
  const codeLength = 4;
  lzw.pack(codeLength, 15);
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 4);
  t.deepEqual(lzw.output, [15]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 0);
  t.deepEqual(lzw.output, [15]);

  lzw.pack(codeLength, 15);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 4);
  t.deepEqual(lzw.output, [15, 15]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 0);
  t.deepEqual(lzw.output, [15, 15]);
});

test('pack: computes the output stream correctly (code length not a power of 2)', (t) => {
  const lzw = new GIFLZW();
  const codeLength = 5;
  lzw.pack(codeLength, 15);
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 5);
  t.deepEqual(lzw.output, [15]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 2);
  t.deepEqual(lzw.output, [15, 0]);

  lzw.pack(codeLength, 15);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 7);
  t.deepEqual(lzw.output, [15, 60]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 4);
  t.deepEqual(lzw.output, [15, 60, 0]);
});

test('pack: computes the output stream correctly (bit offset not 0)', (t) => {
  const lzw = new GIFLZW();
  lzw.bitOffset = 2;
  const codeLength = 5;
  lzw.pack(codeLength, 15);
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 7);
  t.deepEqual(lzw.output, [60]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 4);
  t.deepEqual(lzw.output, [60, 0]);

  lzw.pack(codeLength, 15);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 1);
  t.deepEqual(lzw.output, [60, 240, 0]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 6);
  t.deepEqual(lzw.output, [60, 240, 0]);
});

test('pack: computes the output stream correctly (bit offset not 0, non symmetrical values)', (t) => {
  const lzw = new GIFLZW();
  lzw.bitOffset = 2;
  const codeLength = 5;
  lzw.pack(codeLength, 13);
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 7);
  t.deepEqual(lzw.output, [52]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 4);
  t.deepEqual(lzw.output, [52, 0]);

  lzw.pack(codeLength, 13);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 1);
  t.deepEqual(lzw.output, [52, 208, 0]);

  lzw.pack(codeLength, 0);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 6);
  t.deepEqual(lzw.output, [52, 208, 0]);
});

test('unpack: unpacks the input stream correctly', (t) => {
  const lzw = new GIFLZW([1, 2, 3]);
  const codeLength = 8;
  t.is(lzw.unpack(codeLength), 1);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 0);

  t.is(lzw.unpack(codeLength), 2);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 0);

  t.is(lzw.unpack(codeLength), 3);
  t.is(lzw.offset, 3);
  t.is(lzw.bitOffset, 0);
});

test('unpack: unpacks the input stream correctly (code length > 8)', (t) => {
  const lzw = new GIFLZW([0, 1]);
  const codeLength = 9;
  t.is(lzw.unpack(codeLength), 256);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 1);
});

test('unpack: unpacks the input stream correctly (code length > 8, first 2 bytes of message)', (t) => {
  const lzw = new GIFLZW([0, 169, 60, 17]);
  const codeLength = 9;
  t.is(lzw.unpack(codeLength), 256);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 1);

  t.is(lzw.unpack(codeLength), 84);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 2);

  t.is(lzw.unpack(codeLength), 79);
  t.is(lzw.offset, 3);
  t.is(lzw.bitOffset, 3);
});

test('unpack: unpacks the input stream correctly (code length > 8, empty message)', (t) => {
  const lzw = new GIFLZW([0, 3, 2]);
  const codeLength = 9;
  t.is(lzw.unpack(codeLength), 256);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 1);

  t.is(lzw.unpack(codeLength), 257);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 2);
});

test('unpack: unpacks the input stream correctly (code length < 8)', (t) => {
  const lzw = new GIFLZW([15, 15]);
  const codeLength = 4;
  t.is(lzw.unpack(codeLength), 15);
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 4);

  t.is(lzw.unpack(codeLength), 0);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 0);

  t.is(lzw.unpack(codeLength), 15);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 4);

  t.is(lzw.unpack(codeLength), 0);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 0);
});

test('unpack: unpacks the input stream correctly (code length not a power of 2)', (t) => {
  const lzw = new GIFLZW([15, 60, 0]);
  const codeLength = 5;
  t.is(lzw.unpack(codeLength), 15);
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 5);

  t.is(lzw.unpack(codeLength), 0);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 2);

  t.is(lzw.unpack(codeLength), 15);
  t.is(lzw.offset, 1);
  t.is(lzw.bitOffset, 7);

  t.is(lzw.unpack(codeLength), 0);
  t.is(lzw.offset, 2);
  t.is(lzw.bitOffset, 4);
});

test('compress: prepends the code stream with the clear code', (t) => {
  const buffer = Buffer.from('', 'ascii');
  const bytes = [...buffer];
  //    Hex: [256, 257]
  // Binary: [100000000, 100000001]
  // Packed: [00000000, 00000011, 00000010]
  const lzw = new GIFLZW(bytes);
  t.deepEqual(lzw.compress(8), [0, 3, 2]);
});

test('compress: returns the correct code stream', (t) => {
  const buffer = Buffer.from('TOBEORNOTTOBEORTOBEORNOT', 'ascii');
  const bytes = [...buffer];
  // Codes: [256, 84, 79, 66, 69, 79, 82, 78, 79, 84, 258, 260, 262, 267, 261, 263, 265, 257]
  // Codes (binary): [100000000, 001010100, 001001111, 001000010]
  // Packed: [00000000, 10101001, 00111100, 00010001, ...]
  const lzw = new GIFLZW(bytes);
  t.deepEqual(lzw.compress(8), [0, 169, 60, 17, 82, 228, 137, 20, 39, 79, 168, 8, 36, 104, 112, 97, 193, 131, 9, 3, 2]);
});

test('compress/decompress: reject codeSize 12 because GIF minimum code sizes stop at 8', (t) => {
  const lzw = new GIFLZW([...Buffer.from('TOBEORNOTTOBEORTOBEORNOT', 'ascii')]);
  t.throws(() => lzw.compress(12), { instanceOf: RangeError });
  t.throws(() => lzw.decompress(12), { instanceOf: RangeError });
});

test('decompress: returns the correct string: empty', (t) => {
  const input = '';
  const buffer = Buffer.from(input, 'ascii');
  const bytes = [...buffer];
  const lzw_i = new GIFLZW(bytes);
  const compressed = lzw_i.compress(8);
  const lzw_o = new GIFLZW(compressed);
  t.deepEqual(lzw_o.decompress(8), input);
});

test('decompress: returns the correct string: long', (t) => {
  const input = 'TOBEORNOTTOBEORTOBEORNOT';
  const buffer = Buffer.from(input, 'ascii');
  const bytes = [...buffer];
  const lzw_i = new GIFLZW(bytes);
  const compressed = lzw_i.compress(8);
  const lzw_o = new GIFLZW(compressed);
  t.deepEqual(lzw_o.decompress(8), input);
});

test('decompress: returns the correct output', (t) => {
  const buffer = Buffer.from([8, 33, 67, 101, 7, 36]);
  const bytes = [...buffer];
  const lzw = new GIFLZW(bytes);
  const decompressed = lzw.decompress(3);
  t.deepEqual(Buffer.from(decompressed, 'ascii'), Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 0]));
});

test('decompress(compress(data)) is equal to data (codeSize: 7)', (t) => {
  const codeSize = 7;
  const input = 'TOBEORNOTTOBEORTOBEORNOT';
  const buffer = Buffer.from(input, 'ascii');
  const bytes = [...buffer];
  const lzw_i = new GIFLZW(bytes);
  const compressed = lzw_i.compress(codeSize);
  const lzw_o = new GIFLZW(compressed);
  t.deepEqual(lzw_o.decompress(codeSize), input);
});

test('decompress(compress(data)) is equal to datat (codeSize: 8)', (t) => {
  const codeSize = 8;
  const input = 'TOBEORNOTTOBEORTOBEORNOT';
  const buffer = Buffer.from(input, 'ascii');
  const bytes = [...buffer];
  const lzw_i = new GIFLZW(bytes);
  const compressed = lzw_i.compress(codeSize);
  const lzw_o = new GIFLZW(compressed);
  t.deepEqual(lzw_o.decompress(codeSize), input);
});

test('decompress: throws when the stream does not begin with a clear code', (t) => {
  // For codeSize 8 the clear code is 256; a leading 0 code must be rejected.
  const lzw = new GIFLZW([0, 0]);
  t.throws(() => lzw.decompress(8), { message: 'First code should be a clear code (256), got: 0' });
});

test('decompress: can read back from the output buffer (useInput = false)', (t) => {
  const codeSize = 8;
  const input = 'TOBEORNOTTOBEORTOBEORNOT';
  const bytes = [...Buffer.from(input, 'ascii')];
  const lzw = new GIFLZW(bytes);
  // compress() writes the packed stream to `this.output`; rewind so decompress reads it from the start.
  lzw.compress(codeSize);
  lzw.offset = 0;
  lzw.bitOffset = 0;
  t.is(lzw.decompress(codeSize, false), input);
});

test('decompress(compress(data)) round-trips repetitive input (KwKwK case)', (t) => {
  // A run of identical bytes forces the decoder to reference a code in the same step it is defined,
  // exercising the "code not yet in the dictionary" branch.
  const codeSize = 8;
  const input = 'AAAAAAAAAA';
  const bytes = [...Buffer.from(input, 'ascii')];
  const lzw_i = new GIFLZW(bytes);
  const compressed = lzw_i.compress(codeSize);
  const lzw_o = new GIFLZW(compressed);
  t.is(lzw_o.decompress(codeSize), input);
});

// Independent little-endian code framing for decoder regressions; not GIFLZW.pack().
const packCodes = (codes) => {
  const bytes = [];
  let bit = 0;
  for (const [code, width] of codes) {
    for (let i = 0; i < width; i++, bit++) {
      bytes[bit >>> 3] = (bytes[bit >>> 3] ?? 0) | (((code >>> i) & 1) << (bit & 7));
    }
  }
  return Uint8Array.from(bytes);
};

const seededBytes = (length, codeSize = 8) => {
  let seed = 0x12345678;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    bytes[i] = (seed >>> 16) & ((1 << codeSize) - 1);
  }
  return bytes;
};

for (const codeSize of [2, 3, 4, 5, 6, 7, 8]) {
  test(`regression: byte LZW round trips dictionary boundaries at minimum size ${codeSize}`, (t) => {
    for (const length of [0, 1, 2, 3, 4, 7, 12, 31, 255, 256, 257, 1024, 4096, 20000]) {
      const bytes = seededBytes(length, codeSize);
      const compressed = new GIFLZW(bytes).compressBytes(codeSize);
      t.true(compressed instanceof Uint8Array);
      t.deepEqual(new GIFLZW(compressed).decompressBytes(codeSize, true, { expectedLength: length }), bytes);
    }
  });
}

for (const size of [0, 1, 9, 12, -1, 2.5, NaN, Infinity]) {
  test(`regression: invalid GIF minimum size ${size} is rejected`, (t) => {
    t.throws(() => new GIFLZW().compressBytes(size), { instanceOf: RangeError });
    t.throws(() => new GIFLZW([0]).decompressBytes(size), { instanceOf: RangeError });
  });
}

test('regression: LZW final EOI uses the widened code length', (t) => {
  // Clear, three literals, then EOI. The third literal expands the decoder to four bits.
  const expected = packCodes([[4, 3], [0, 3], [1, 3], [2, 3], [5, 4]]);
  t.deepEqual(new GIFLZW([0, 1, 2]).compressBytes(2), expected);
  t.deepEqual(new GIFLZW(expected).decompressBytes(2), Uint8Array.of(0, 1, 2));
});

test('regression: full dictionary accepts deferred clear and subsequent reset', (t) => {
  const codes = [[256, 9]];
  const expected = [];
  let width = 9;
  let next = 258;
  for (let i = 0; i < 6000; i++) {
    const literal = i & 255;
    codes.push([literal, width]);
    expected.push(literal);
    if (i > 0 && next < 4096) {
      next++;
      if (next === 1 << width && width < 12) width++;
    }
  }
  codes.push([256, 12], [42, 9], [257, 9]);
  expected.push(42);
  t.deepEqual(new GIFLZW(packCodes(codes)).decompressBytes(8), Uint8Array.from(expected));
});

test('regression: repeated clears and clear followed immediately by EOI', (t) => {
  t.deepEqual(new GIFLZW(packCodes([[4, 3], [4, 3], [5, 3]])).decompressBytes(2), new Uint8Array());
  t.deepEqual(new GIFLZW(packCodes([[4, 3], [0, 3], [4, 3], [1, 3], [5, 3]])).decompressBytes(2), Uint8Array.of(0, 1));
});

test('regression: illegal forward references are not treated as KwKwK', (t) => {
  for (const codes of [[[4, 3], [6, 3]], [[4, 3], [0, 3], [7, 3]]]) {
    t.throws(() => new GIFLZW(packCodes(codes)).decompressBytes(2), { message: /Invalid GIF LZW code/ });
  }
});

test('regression: independent KwKwK vector expands the previous phrase', (t) => {
  t.deepEqual(new GIFLZW(packCodes([[4, 3], [0, 3], [6, 3], [5, 3]])).decompressBytes(2), Uint8Array.of(0, 0, 0));
});

test('regression: every truncated prefix of a valid LZW stream terminates with an error', (t) => {
  const compressed = new GIFLZW(seededBytes(1000)).compressBytes(8);
  for (let i = 0; i < compressed.length; i++) {
    t.throws(() => new GIFLZW(compressed.subarray(0, i)).decompressBytes(8));
  }
});

test('regression: LZW output bounds and exact lengths apply before writes', (t) => {
  const compressed = new GIFLZW(new Uint8Array(4096)).compressBytes(2);
  t.throws(() => new GIFLZW(compressed).decompressBytes(2, true, { maxOutputBytes: 4095 }), { instanceOf: RangeError });
  t.throws(() => new GIFLZW(compressed).decompressBytes(2, true, { expectedLength: 4095 }));
  t.throws(() => new GIFLZW(compressed).decompressBytes(2, true, { expectedLength: 4097 }));
  t.throws(() => new GIFLZW([0]).compressBytes(2, { maxOutputBytes: 1 }), { instanceOf: RangeError });
  t.throws(() => new GIFLZW(compressed).decompressBytes(2, true, { maxInputBytes: 1 }), { instanceOf: RangeError });
});

test('regression: LZW trailing bytes have an explicit compatibility policy', (t) => {
  const compressed = new GIFLZW([0]).compressBytes(2);
  const trailing = Uint8Array.from([...compressed, 0]);
  t.throws(() => new GIFLZW(trailing).decompressBytes(2), { message: /trailing bytes/ });
  t.deepEqual(new GIFLZW(trailing).decompressBytes(2, true, { allowTrailingBytes: true }), Uint8Array.of(0));
  // Unused high bits in the final EOI byte are not interpreted as another code.
  compressed[compressed.length - 1] |= 0xfe;
  t.deepEqual(new GIFLZW(compressed).decompressBytes(2), Uint8Array.of(0));
});

test('regression: complete operations rewind automatically and retain legacy wrappers', (t) => {
  const bytes = seededBytes(100);
  const encoder = new GIFLZW(bytes);
  const packed = encoder.compress(8);
  t.deepEqual(encoder.compress(8), packed);
  t.deepEqual(encoder.decompressBytes(8, false), bytes);
  t.deepEqual(Uint8Array.from(encoder.decompress(8, false), (char) => char.charCodeAt(0)), bytes);
  const decoder = new GIFLZW(packed);
  t.deepEqual(decoder.decompressBytes(8), decoder.decompressBytes(8));
});

test('regression: LZW uses the exact typed-array subview', (t) => {
  const bytes = seededBytes(32);
  const backing = new Uint8Array(40).fill(255);
  backing.set(bytes, 4);
  const view = backing.subarray(4, 36);
  t.deepEqual(new GIFLZW(view).compressBytes(8), new GIFLZW(bytes).compressBytes(8));
});

test('regression: pack can overwrite existing bits and unpack never advances on truncation', (t) => {
  const lzw = new GIFLZW();
  lzw.pack(8, 255);
  lzw.offset = 0;
  lzw.pack(4, 0);
  t.deepEqual(lzw.output, [240]);
  lzw.offset = 0;
  lzw.bitOffset = 0;
  t.throws(() => lzw.unpack(9, false));
  t.is(lzw.offset, 0);
  t.is(lzw.bitOffset, 0);
});

for (const value of [-1, 256, 1.5, NaN, undefined]) {
  test(`regression: plain-array LZW input rejects invalid byte ${value}`, (t) => {
    t.throws(() => new GIFLZW([value]).compressBytes(8));
    t.throws(() => new GIFLZW([value]).decompressBytes(8));
  });
}

test('regression: LZW validates booleans, symbol alphabets, limits, and bit cursors', (t) => {
  t.throws(() => new GIFLZW([4]).compressBytes(2));
  t.throws(() => new GIFLZW().decompressBytes(2, 'true'));
  t.throws(() => new GIFLZW().decompressBytes(2, true, { allowTrailingBytes: 1 }));
  for (const maximum of [0, -1, 1.1, NaN, Infinity]) {
    t.throws(() => new GIFLZW().compressBytes(2, { maxOutputBytes: maximum }));
    t.throws(() => new GIFLZW().decompressBytes(2, true, { maxInputBytes: maximum }));
  }
  for (const length of [0, 13, -1, 1.5]) {
    t.throws(() => new GIFLZW().pack(length, 0));
    t.throws(() => new GIFLZW().unpack(length));
  }
  const cursor = new GIFLZW([0]);
  cursor.bitOffset = 8;
  t.throws(() => cursor.unpack(1));
  cursor.bitOffset = 0;
  cursor.offset = -1;
  t.throws(() => cursor.unpack(1));
  t.throws(() => new GIFLZW().pack(2, 4));
});
