import test from 'ava';

import { GIFLZW } from '../../src/index.js';

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

test('compress: returns the correct code stream (codeSize 12)', (t) => {
  const input = 'TOBEORNOTTOBEORTOBEORNOT';
  const buffer = Buffer.from(input, 'ascii');
  const bytes = [...buffer];
  const lzw = new GIFLZW(bytes);
  const compressed = lzw.compress(12);
  t.deepEqual(compressed, [0, 144, 10, 0, 192, 39, 0, 0, 133, 0, 0, 44, 2, 0, 240, 9, 0, 64, 41, 0, 0, 157, 0, 0, 124, 2, 0, 144, 10, 0, 64, 42, 0, 0, 159, 0, 0, 20, 2, 0, 176, 8, 0, 192, 39, 0, 0, 165, 0, 0, 164, 2, 0, 240, 9, 0, 64, 33, 0, 0, 139, 0, 0, 124, 2, 0, 80, 10, 0, 64, 39, 0, 0, 159, 0, 0, 164, 2, 1, 16]);
  const lzw_o = new GIFLZW(compressed);
  t.deepEqual(lzw_o.decompress(12), input);
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
