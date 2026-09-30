import test from 'ava';
import IPS from '../../dist/patch/data-patch-ips.js';
import DataBuffer from '../../dist/data-buffer.js';

test('constructor: creates an IPS instance', (t) => {
  const ips = new IPS();
  t.truthy(ips);
  t.deepEqual(ips.hunks, []);
  t.is(ips.truncate, 0);
});

test('constructor: creates an IPS instance with data', (t) => {
  const data = new Uint8Array([0x50, 0x41, 0x54, 0x43, 0x48, 0x45, 0x4F, 0x46]);
  const ips = new IPS(data, false);
  t.truthy(ips);
  t.is(ips.length, 8);
});

test('decodeHeader: validates correct PATCH header', (t) => {
  const data = new Uint8Array([0x50, 0x41, 0x54, 0x43, 0x48]); // "PATCH"
  const ips = new IPS(data, false);
  t.notThrows(() => ips.decodeHeader());
});

test('decodeHeader: throws on invalid header', (t) => {
  const data = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00]);
  const ips = new IPS(data, false);
  const error = t.throws(() => ips.decodeHeader());
  t.is(error.message, 'Missing or invalid IPS header.');
});

test('parse: parses minimal IPS patch with EOF only', (t) => {
  // PATCH + EOF
  const data = new Uint8Array([
    0x50, 0x41, 0x54, 0x43, 0x48, // "PATCH"
    0x45, 0x4F, 0x46,             // "EOF"
  ]);
  const ips = new IPS(data, false);
  ips.parse();
  t.is(ips.hunks.length, 0);
  t.is(ips.truncate, 0);
});

test('parse: parses simple hunk', (t) => {
  // PATCH + one simple hunk + EOF
  const data = new Uint8Array([
    0x50, 0x41, 0x54, 0x43, 0x48, // "PATCH"
    0x00, 0x00, 0x10,             // offset: 0x000010
    0x00, 0x03,                   // length: 3
    0xAA, 0xBB, 0xCC,             // data
    0x45, 0x4F, 0x46,             // "EOF"
  ]);
  const ips = new IPS(data, false);
  ips.parse();
  t.is(ips.hunks.length, 1);
  t.is(ips.hunks[0].offset, 0x10);
  t.is(ips.hunks[0].length, 3);
  t.deepEqual(Array.from(ips.hunks[0].data), [0xAA, 0xBB, 0xCC]);
  t.is(ips.hunks[0].rle, undefined);
});

test('parse: parses RLE hunk', (t) => {
  // PATCH + one RLE hunk + EOF
  const data = new Uint8Array([
    0x50, 0x41, 0x54, 0x43, 0x48, // "PATCH"
    0x00, 0x00, 0x20,             // offset: 0x000020
    0x00, 0x00,                   // length: 0 (indicates RLE)
    0x00, 0x10,                   // RLE length: 16
    0xFF,                         // RLE byte
    0x45, 0x4F, 0x46,             // "EOF"
  ]);
  const ips = new IPS(data, false);
  ips.parse();
  t.is(ips.hunks.length, 1);
  t.is(ips.hunks[0].offset, 0x20);
  t.is(ips.hunks[0].length, 16);
  t.is(ips.hunks[0].rle, 0xFF);
  t.is(ips.hunks[0].data, undefined);
});

test('parse: parses multiple hunks', (t) => {
  // PATCH + two simple hunks + EOF
  const data = new Uint8Array([
    0x50, 0x41, 0x54, 0x43, 0x48, // "PATCH"
    0x00, 0x00, 0x10,             // offset: 0x000010
    0x00, 0x02,                   // length: 2
    0xAA, 0xBB,                   // data
    0x00, 0x01, 0x00,             // offset: 0x000100
    0x00, 0x01,                   // length: 1
    0xCC,                         // data
    0x45, 0x4F, 0x46,             // "EOF"
  ]);
  const ips = new IPS(data, false);
  ips.parse();
  t.is(ips.hunks.length, 2);
  t.is(ips.hunks[0].offset, 0x10);
  t.is(ips.hunks[1].offset, 0x100);
});

test('parse: parses truncation command', (t) => {
  // PATCH + EOF + truncate length
  const data = new Uint8Array([
    0x50, 0x41, 0x54, 0x43, 0x48, // "PATCH"
    0x45, 0x4F, 0x46,             // "EOF"
    0x00, 0x10, 0x00,             // truncate to 0x001000
  ]);
  const ips = new IPS(data, false);
  ips.parse();
  t.is(ips.hunks.length, 0);
  t.is(ips.truncate, 0x1000);
});

test('encode: creates minimal IPS file', (t) => {
  const ips = new IPS(0, false);
  const output = ips.encode();
  output.commit();
  t.is(output.length, 8); // PATCH + EOF
  output.seek(0);
  t.is(output.readString(5), 'PATCH');
  t.is(output.readString(3), 'EOF');
});

test('encode: encodes simple hunk', (t) => {
  const ips = new IPS(0, false);
  ips.hunks.push({
    offset: 0x10,
    length: 3,
    data: [0xAA, 0xBB, 0xCC],
  });
  const output = ips.encode();
  output.seek(0);

  t.is(output.readString(5), 'PATCH');
  t.is(output.readUInt24(), 0x10);
  t.is(output.readUInt16(), 3);
  t.deepEqual(Array.from(output.read(3)), [0xAA, 0xBB, 0xCC]);
  t.is(output.readString(3), 'EOF');
});

test('encode: encodes RLE hunk', (t) => {
  const ips = new IPS(0, false);
  ips.hunks.push({
    offset: 0x20,
    length: 16,
    rle: 0xFF,
  });
  const output = ips.encode();
  output.seek(0);

  t.is(output.readString(5), 'PATCH');
  t.is(output.readUInt24(), 0x20);
  t.is(output.readUInt16(), 0); // RLE indicator
  t.is(output.readUInt16(), 16); // RLE length
  t.is(output.readUInt8(), 0xFF); // RLE byte
  t.is(output.readString(3), 'EOF');
});

test('encode: encodes truncation', (t) => {
  const ips = new IPS(0, false);
  ips.truncate = 0x1000;
  const output = ips.encode();
  output.seek(0);

  t.is(output.readString(5), 'PATCH');
  t.is(output.readString(3), 'EOF');
  t.is(output.readUInt24(), 0x1000);
});

test('apply: applies simple hunk to data', (t) => {
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00]);
  const ips = new IPS(0, false);
  ips.hunks.push({
    offset: 1,
    length: 3,
    data: [0xAA, 0xBB, 0xCC],
  });

  const patched = ips.apply(original);
  patched.commit();
  patched.seek(0);
  t.is(patched.readUInt8(), 0x00);
  t.is(patched.readUInt8(), 0xAA);
  t.is(patched.readUInt8(), 0xBB);
  t.is(patched.readUInt8(), 0xCC);
  t.is(patched.readUInt8(), 0x00);
});

test('apply: applies RLE hunk to data', (t) => {
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00]);
  const ips = new IPS(0, false);
  ips.hunks.push({
    offset: 1,
    length: 3,
    rle: 0xFF,
  });

  const patched = ips.apply(original);
  patched.commit();
  patched.seek(0);
  t.is(patched.readUInt8(), 0x00);
  t.is(patched.readUInt8(), 0xFF);
  t.is(patched.readUInt8(), 0xFF);
  t.is(patched.readUInt8(), 0xFF);
  t.is(patched.readUInt8(), 0x00);
});

test('apply: truncates data when truncate is set', (t) => {
  const original = new DataBuffer([0x00, 0x01, 0x02, 0x03, 0x04]);
  const ips = new IPS(0, false);
  ips.truncate = 3;

  const patched = ips.apply(original);
  t.is(patched.length, 3);
  patched.seek(0);
  t.is(patched.readUInt8(), 0x00);
  t.is(patched.readUInt8(), 0x01);
  t.is(patched.readUInt8(), 0x02);
});

test('createIPSFromDataBuffers: creates patch for simple change', (t) => {
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const modified = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAA, 0xBB, 0x00]);

  const ips = IPS.createIPSFromDataBuffers(original, modified);

  t.is(ips.hunks.length, 1);
  t.is(ips.hunks[0].offset, 7);
  t.is(ips.hunks[0].length, 2);
  t.deepEqual(ips.hunks[0].data, [0xAA, 0xBB]);
});

test('createIPSFromDataBuffers: creates RLE patch for repeated bytes', (t) => {
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const modified = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF]);

  const ips = IPS.createIPSFromDataBuffers(original, modified);

  t.is(ips.hunks.length, 1);
  t.is(ips.hunks[0].offset, 7);
  t.is(ips.hunks[0].length, 3);
  t.is(ips.hunks[0].rle, 0xFF);
});

test('createIPSFromDataBuffers: detects truncation', (t) => {
  const original = new DataBuffer([0x00, 0x01, 0x02, 0x03, 0x04]);
  const modified = new DataBuffer([0x00, 0x01, 0x02]);

  const ips = IPS.createIPSFromDataBuffers(original, modified);

  t.is(ips.truncate, 3);
});

test('createIPSFromDataBuffers: merges close hunks', (t) => {
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const modified = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAA, 0x00, 0x00, 0xBB, 0x00]);

  const ips = IPS.createIPSFromDataBuffers(original, modified);

  // Should merge into one hunk since they're close together (distance < 6)
  t.is(ips.hunks.length, 1);
  t.is(ips.hunks[0].offset, 7);
});

test('createIPSFromDataBuffers: handles file expansion', (t) => {
  const original = new DataBuffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
  const modified = new DataBuffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0xAA, 0xBB]);

  const ips = IPS.createIPSFromDataBuffers(original, modified);

  // Should have hunks for the new data
  t.true(ips.hunks.length > 0);
  t.is(ips.truncate, 0);
});

test('createIPSFromDataBuffers: throws error for files too large', (t) => {
  // Create buffers that would cause an offset >= IPS_MAX_SIZE (0x1000000)
  const original = new DataBuffer(new Uint8Array(0x1000001));
  const modified = new DataBuffer(new Uint8Array(0x1000001));
  // Change at offset >= max size
  modified.data[0x1000000] = 0xFF;

  const error = t.throws(() => IPS.createIPSFromDataBuffers(original, modified));
  t.is(error.message, 'files are too big for IPS format');
});

test('createIPSFromDataBuffers: separates RLE when near previous hunk', (t) => {
  // This tests the case where a potential RLE hunk is close to the previous hunk but we want to keep it separate because it's RLE and > 6 bytes
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const modified = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAA, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00]);

  const ips = IPS.createIPSFromDataBuffers(original, modified);

  // Should create separate hunks: one for 0xAA and one RLE for the 0xFF bytes
  t.deepEqual(ips.hunks, [
    { offset: 7, length: 1, data: [0xAA] },
    { offset: 9, length: 8, rle: 0xFF },
  ]);
});

test('createIPSFromDataBuffers: adds padding hunk for file expansion beyond last change', (t) => {
  // This tests the case where file is expanded but the last change doesn't reach the end
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const modified = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAA, 0x00, 0x00, 0x00, 0x00]);

  const ips = IPS.createIPSFromDataBuffers(original, modified);

  // Should have hunks including padding for the expanded size
  t.true(ips.hunks.length > 0);
  // The last hunk should handle the file expansion
  const lastHunk = ips.hunks[ips.hunks.length - 1];
  // Should reach near the end
  t.is(lastHunk.offset + lastHunk.length, modified.length);
});

test('E2E: parse and encode produces same result', (t) => {
  const data = new Uint8Array([
    0x50, 0x41, 0x54, 0x43, 0x48, // "PATCH"
    0x00, 0x00, 0x10,             // offset: 0x000010
    0x00, 0x03,                   // length: 3
    0xAA, 0xBB, 0xCC,             // data
    0x00, 0x00, 0x20,             // offset: 0x000020
    0x00, 0x00,                   // length: 0 (RLE)
    0x00, 0x10,                   // RLE length: 16
    0xFF,                         // RLE byte
    0x45, 0x4F, 0x46,             // "EOF"
  ]);

  const ips = new IPS(data);
  const encoded = ips.encode();

  t.deepEqual(Array.from(encoded.data), Array.from(data));
});

test('E2E: create, encode, parse, and apply produces same result', (t) => {
  const original = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const modified = new DataBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAA, 0xBB, 0xCC, 0xFF, 0xFF]);

  // Create patch
  const ips1 = IPS.createIPSFromDataBuffers(original, modified);

  // Encode it
  const encoded = ips1.encode();

  // Parse it
  const ips2 = new IPS(encoded.data, false);
  ips2.parse();

  // Apply it
  const patched = ips2.apply(original);
  patched.commit();

  // Verify result matches modified
  t.deepEqual(Array.from(patched.data), Array.from(modified.data));
});


/** Apply through the complete file format round trip, rather than checking hunk counts alone. */
const roundTripIPS = (original, modified) => {
  const patch = IPS.createIPSFromDataBuffers(original, modified);
  const encoded = patch.encode();
  const parsed = new IPS(encoded.data);
  return { patch, parsed, encoded, output: parsed.apply(original) };
};

test('createIPSFromDataBuffers: preserves changes at every offset near the beginning', (t) => {
  for (let offset = 0; offset < 8; offset++) {
    const original = new DataBuffer(new Uint8Array(10));
    const modified = original.copy();
    modified.data[offset] = 0xFF;
    const { patch, output } = roundTripIPS(original, modified);
    t.is(patch.hunks.length, 1);
    t.is(patch.hunks[0].offset, offset);
    t.deepEqual(output.data, modified.data);
  }
});

test('createIPSFromDataBuffers: a long RLE run at offset zero terminates and round trips', (t) => {
  const original = new DataBuffer(new Uint8Array(512));
  const modified = new DataBuffer(new Uint8Array(512).fill(0xCC));
  const { patch, output } = roundTripIPS(original, modified);
  t.deepEqual(patch.hunks, [{ offset: 0, length: 512, rle: 0xCC }]);
  t.deepEqual(output.data, modified.data);
});

test('createIPSFromDataBuffers: uses whole committed buffers and leaves both cursors unchanged', (t) => {
  const original = new DataBuffer([1, 2, 3, 4]);
  const modified = new DataBuffer([9, 2, 3, 8]);
  original.seek(3);
  modified.seek(2);
  const { output } = roundTripIPS(original, modified);
  t.deepEqual(output.data, modified.data);
  t.is(original.offset, 3);
  t.is(modified.offset, 2);
  t.deepEqual(Array.from(original.data), [1, 2, 3, 4]);
});

test('createIPSFromDataBuffers: empty, identical, zero-filled expansion, and zero truncation', (t) => {
  for (const [a, b] of [[[], []], [[1], [1]], [[], [0]], [[], [0, 0, 0]], [[1], [1, 0, 0]], [[1, 2, 3], []]]) {
    const { patch, parsed, encoded, output } = roundTripIPS(new DataBuffer(a), new DataBuffer(b));
    t.deepEqual(Array.from(output.data), b);
    if (b.length < a.length) {
      t.true(patch.hasTruncate);
      t.true(parsed.hasTruncate);
      t.is(parsed.truncate, 0);
      t.deepEqual(Array.from(encoded.data.slice(-6)), [0x45, 0x4F, 0x46, 0, 0, 0]);
    }
  }
});

test('apply: zero-valued RLE, out-of-order overlapping records, and holes', (t) => {
  const original = new DataBuffer([1, 2, 3]);
  original.seek(2);
  const patch = new IPS(0, false);
  patch.hunks = [
    { offset: 6, length: 2, rle: 0xFF },
    { offset: 1, length: 2, data: [0xAA, 0xBB] },
    { offset: 2, length: 5, rle: 0 },
  ];
  const output = patch.apply(original);
  t.deepEqual(Array.from(output.data), [1, 0xAA, 0, 0, 0, 0, 0, 0xFF]);
  t.is(output.offset, 0);
  t.is(output.readUInt8(), 1);
  t.is(original.offset, 2);
  t.deepEqual(Array.from(original.data), [1, 2, 3]);
  output.data[0] = 0;
  t.is(original.data[0], 1);
});

test('apply: truncation is a final size operation after all records', (t) => {
  const patch = new IPS(0, false);
  patch.hunks = [{ offset: 1, length: 4, data: [9, 8, 7, 6] }, { offset: 7, length: 2, rle: 0xFF }];
  patch.truncate = 3;
  t.deepEqual(Array.from(patch.apply(new DataBuffer([1, 2, 3, 4, 5])).data), [1, 9, 8]);
  patch.hasTruncate = true;
  patch.truncate = 0;
  t.is(patch.apply(new DataBuffer([1, 2, 3])).length, 0);
  patch.hunks = [];
  patch.truncate = 5;
  t.deepEqual(Array.from(patch.apply(new DataBuffer([1, 2])).data), [1, 2, 0, 0, 0]);
});

test('parse: explicit zero truncation survives parsing and re-encoding', (t) => {
  const bytes = Uint8Array.from([0x50, 0x41, 0x54, 0x43, 0x48, 0x45, 0x4F, 0x46, 0, 0, 0]);
  const patch = new IPS(bytes);
  t.true(patch.hasTruncate);
  t.is(patch.truncate, 0);
  t.deepEqual(patch.encode().data, bytes);
  t.is(patch.apply(new DataBuffer([1])).length, 0);
});

test('parse: repeated parses reset hunks and truncation rather than appending', (t) => {
  const patch = new IPS(0, false);
  patch.hunks = [{ offset: 0, length: 1, data: [0xFF] }];
  const parsed = new IPS(patch.encode().data);
  const first = structuredClone(parsed.hunks);
  parsed.parse();
  t.deepEqual(parsed.hunks, first);
  parsed.truncate = 10;
  parsed.hasTruncate = true;
  parsed.parse();
  t.is(parsed.truncate, 0);
  t.false(parsed.hasTruncate);
});

test('parse: a failed reparse preserves the previously parsed state and cursor', (t) => {
  const patch = new IPS(0, false);
  patch.hunks = [{ offset: 0, length: 1, data: [0xAA] }];
  const parsed = new IPS(patch.encode().data);
  const hunks = parsed.hunks;
  const offset = parsed.offset;
  parsed.data[parsed.length - 1] = 0;
  t.throws(() => parsed.parse());
  t.is(parsed.hunks, hunks);
  t.is(parsed.offset, offset);
  t.is(parsed.truncate, 0);
  t.false(parsed.hasTruncate);
});

test('parse: rejects incomplete headers, records, EOF, and invalid trailers', (t) => {
  const header = [0x50, 0x41, 0x54, 0x43, 0x48];
  const eof = [0x45, 0x4F, 0x46];
  for (let length = 0; length < 5; length++) {
    t.throws(() => new IPS(Uint8Array.from(header.slice(0, length))));
  }
  for (const tail of [[], [0x45], [0x45, 0x4F], [0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 2, 0xAA], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0xFF, ...eof],
    [...eof, 0], [...eof, 0, 0], [...eof, 0, 0, 0, 0], [...eof, 0, 1, 0, 1, 0xAA],
  ]) {
    t.throws(() => new IPS(Uint8Array.from([...header, ...tail])), undefined, tail.join(','));
  }
});

for (const [name, hunk] of [
  ['negative offset', { offset: -1, length: 1, data: [0] }],
  ['fractional offset', { offset: 0.5, length: 1, data: [0] }],
  ['NaN offset', { offset: Number.NaN, length: 1, data: [0] }],
  ['reserved EOF offset', { offset: 0x454F46, length: 1, data: [0] }],
  ['offset past maximum', { offset: 0x1000000, length: 1, data: [0] }],
  ['end past maximum', { offset: 0xFFFFFF, length: 2, data: [0, 0] }],
  ['zero-length run', { offset: 0, length: 0, rle: 0 }],
  ['oversized run', { offset: 0, length: 0x10000, rle: 0 }],
  ['fractional length', { offset: 0, length: 1.5, rle: 0 }],
  ['mismatched data length', { offset: 0, length: 2, data: [0] }],
  ['missing payload', { offset: 0, length: 1 }],
  ['two payload types', { offset: 0, length: 1, rle: 0, data: [0] }],
  ['invalid literal byte', { offset: 0, length: 1, data: [256] }],
  ['sparse literal bytes', { offset: 0, length: 1, data: Array(1) }],
  ['invalid RLE byte', { offset: 0, length: 1, rle: -1 }],
]) {
  test(`encode/apply: reject ${name} before mutating input`, (t) => {
    const patch = new IPS(0, false);
    patch.hunks = [hunk];
    const input = new DataBuffer([1, 2, 3]);
    input.seek(2);
    t.throws(() => patch.encode(), { instanceOf: RangeError });
    t.throws(() => patch.apply(input), { instanceOf: RangeError });
    t.deepEqual(Array.from(input.data), [1, 2, 3]);
    t.is(input.offset, 2);
  });
}

test('encode/apply: validate the three-byte truncate size', (t) => {
  const patch = new IPS(0, false);
  for (const truncate of [-1, 0.5, Number.NaN, Infinity, 0x1000000]) {
    patch.truncate = truncate;
    t.throws(() => patch.encode(), { instanceOf: RangeError });
    t.throws(() => patch.apply(new DataBuffer([1])), { instanceOf: RangeError });
  }
});

test('encode/apply: Uint8Array payload subviews are supported', (t) => {
  const patch = new IPS(0, false);
  patch.hunks = [{ offset: 0, length: 2, data: new Uint8Array([0xFF, 0xAA, 0xBB, 0xFF]).subarray(1, 3) }];
  t.deepEqual(Array.from(new IPS(patch.encode().data).apply(new DataBuffer(0)).data), [0xAA, 0xBB]);
});

test('createIPSFromDataBuffers: literal and RLE records split at the 65535-byte limit', (t) => {
  for (const length of [0xFFFF, 0x10000, 0x20001]) {
    for (const repeated of [false, true]) {
      const bytes = Uint8Array.from({ length }, (_, i) => repeated ? 0xFF : 1 + i % 255);
      const { patch, output } = roundTripIPS(new DataBuffer(0), new DataBuffer(bytes));
      t.true(patch.hunks.every((hunk) => hunk.length > 0 && hunk.length <= 0xFFFF));
      t.is(patch.hunks[0].length, Math.min(length, 0xFFFF));
      t.deepEqual(output.data, bytes);
    }
  }
});

test('createIPSFromDataBuffers: reserved EOF record offsets are escaped', (t) => {
  const marker = 0x454F46;
  const original = new DataBuffer(new Uint8Array(marker + 2));
  original.data[marker - 1] = 0x34;
  const modified = original.copy();
  modified.data[marker] = 0xAB;
  const { patch, output } = roundTripIPS(original, modified);
  t.true(patch.hunks.every((hunk) => hunk.offset !== marker));
  t.is(patch.hunks[0].offset, marker - 1);
  t.deepEqual(output.data, modified.data);
});

test('createIPSFromDataBuffers: a record split and zero-filled expansion at the EOF address round trip', (t) => {
  const marker = 0x454F46;
  const original = new DataBuffer(new Uint8Array(marker + 2));
  const modified = original.copy();
  modified.data.fill(0xFF, marker - 0xFFFF, marker + 2);
  const result = roundTripIPS(original, modified);
  t.true(result.patch.hunks.every((hunk) => hunk.offset !== marker));
  t.deepEqual(result.output.data, modified.data);
  const zeros = new DataBuffer(new Uint8Array(marker + 1));
  const expanded = roundTripIPS(new DataBuffer(0), zeros);
  t.true(expanded.patch.hunks.every((hunk) => hunk.offset !== marker));
  t.deepEqual(expanded.output.data, zeros.data);
});

test('createIPSFromDataBuffers: the supported 16 MiB boundary can be reached exactly', (t) => {
  const modified = new DataBuffer(new Uint8Array(0x1000000));
  const { patch, output } = roundTripIPS(new DataBuffer(0), modified);
  t.deepEqual(patch.hunks, [{ offset: 0xFFFFFF, length: 1, data: [0] }]);
  t.is(output.length, 0x1000000);
  t.deepEqual(output.data, modified.data);
});

/** A deliberately simple IPS reader/applicator independent of DataBuffer and the IPS class. */
const referenceApplyIPS = (patch, input) => {
  const output = Array.from(input);
  let position = 5;
  const read = (length) => {
    let value = 0;
    while (length-- > 0) value = value * 256 + patch[position++];
    return value;
  };
  while (position < patch.length) {
    const offset = read(3);
    if (offset === 0x454F46) {
      if (position < patch.length) output.length = read(3);
      return Uint8Array.from(output);
    }
    const length = read(2);
    if (length === 0) {
      const count = read(2);
      const value = read(1);
      for (let i = 0; i < count; i++) output[offset + i] = value;
    } else {
      for (let i = 0; i < length; i++) output[offset + i] = read(1);
    }
  }
  throw new Error('Missing reference IPS EOF.');
};

test('E2E: deterministic randomized binary transformations round trip with stable input cursors', (t) => {
  let seed = 0x495053;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  for (let iteration = 0; iteration < 1000; iteration++) {
    const a = Uint8Array.from({ length: next() % 300 }, () => next() >>> 24);
    const b = new Uint8Array(next() % 300);
    b.set(a.subarray(0, b.length));
    for (let i = 0; i < b.length; i++) {
      if (next() % 5 === 0) b[i] = next() >>> 24;
    }
    if (iteration % 4 === 0) b.fill(0, next() % (b.length + 1));
    const original = new DataBuffer(a);
    const modified = new DataBuffer(b);
    original.seek(next() % (a.length + 1));
    modified.seek(next() % (b.length + 1));
    const beforeA = original.offset;
    const beforeB = modified.offset;
    const { output, patch, encoded } = roundTripIPS(original, modified);
    t.deepEqual(output.data, b, `iteration ${iteration}`);
    t.deepEqual(referenceApplyIPS(encoded.data, a), b, `independent application ${iteration}`);
    t.is(original.offset, beforeA);
    t.is(modified.offset, beforeB);
    t.true(patch.hunks.every((hunk) => hunk.offset !== 0x454F46 && hunk.length > 0 && hunk.length <= 0xFFFF));
  }
});
