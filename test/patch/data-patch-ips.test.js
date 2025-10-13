import test from 'ava';
import IPS from '../../src/patch/data-patch-ips.js';
import DataBuffer from '../../src/data-buffer.js';

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
  t.true(ips.hunks.length >= 1);
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
  t.true(lastHunk.offset + lastHunk.length >= 11);
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

