const test = require('ava');
const { DataBuffer } = require('../src');

const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buffer = new DataBuffer(bytes);

test('length', (t) => {
  t.is(10, buffer.length);
});

test('allocate', (t) => {
  const buf = DataBuffer.allocate(10);
  t.is(10, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(10, buf.data.length);
});

test('compare: can validate buffers', (t) => {
  const copy = buffer.copy();

  const bad_bytes = new Uint8Array([0, 1, 2, 3, 0, 0, 6, 7, 8, 9]);
  const bad_buffer = new DataBuffer(bad_bytes);

  t.true(buffer.compare(copy));
  t.false(buffer.compare(bad_buffer));
});

test('compare: can fail early with an empty buffer', (t) => {
  const copy = buffer.copy();

  const empty_bytes = new Uint8Array([]);
  const empty_buffer = new DataBuffer(empty_bytes);

  t.true(buffer.compare(copy));
  t.false(buffer.compare(empty_buffer));
});

test('copy', (t) => {
  const copy = buffer.copy();

  t.is(buffer.length, copy.length);
  t.not(buffer.data, copy.data);
  t.is(buffer.data.length, copy.data.length);
});

test('slice', (t) => {
  t.is(4, buffer.slice(0, 4).length);
  t.is(bytes, buffer.slice(0, 100).data);
  t.deepEqual(new DataBuffer(bytes.subarray(3, 6)), buffer.slice(3, 3));
  t.is(5, buffer.slice(5).length);
});

test('create from ArrayBuffer', (t) => {
  const buf = new DataBuffer(new ArrayBuffer(9));
  t.is(9, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(9, buf.data.length);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(9)));
});

test('create from typed array', (t) => {
  const buf = new DataBuffer(new Uint32Array(9));
  t.is(36, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(36, buf.data.length);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(36)));
});

test('create from sliced typed array', (t) => {
  const buf = new DataBuffer(new Uint32Array(9).subarray(2, 6));
  t.is(16, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(16, buf.data.length);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(new ArrayBuffer(36), 8, 16)));
});

test('create from array', (t) => {
  const buf = new DataBuffer([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  t.is(9, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(9, buf.data.length);
  t.deepEqual(buf, new DataBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])));
});

test('create from number', (t) => {
  const buf = new DataBuffer(9);
  t.is(9, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(9, buf.data.length);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(9)));
});

test('create from another DataBuffer', (t) => {
  const buf = new DataBuffer(new DataBuffer(9));
  t.is(9, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(9, buf.data.length);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(9)));
});

test('create from node buffer (Buffer)', (t) => {
  const buf = new DataBuffer(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  t.is(9, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(9, buf.data.length);
  t.deepEqual(buf, new DataBuffer(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9])));
});

test('create from node buffer (Uint8Array)', (t) => {
  const buf = new DataBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  t.is(9, buf.length);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(9, buf.data.length);
  t.deepEqual(buf, new DataBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])));
});

test('error constructing', (t) => {
  t.throws(() => new DataBuffer());
  t.throws(() => new DataBuffer(null));
  t.throws(() => new DataBuffer(undefined));
  t.throws(() => new DataBuffer(true));
});
