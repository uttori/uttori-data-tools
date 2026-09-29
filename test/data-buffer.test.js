import test from 'ava';
import { DataBuffer, Op } from '../dist/index.js';

test('create from ArrayBuffer', (t) => {
  const buf = new DataBuffer(new ArrayBuffer(9));
  t.is(buf.length, 9);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 9);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(9)));
});

test('create from typed array', (t) => {
  const buf = new DataBuffer(new Uint32Array(9));
  t.is(buf.length, 36);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 36);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(36)));
});

test('create from sliced typed array', (t) => {
  const buf = new DataBuffer(new Uint32Array(9).subarray(2, 6));
  t.is(buf.length, 16);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 16);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(new ArrayBuffer(36), 8, 16)));
});

test('create from array', (t) => {
  const buf = new DataBuffer([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  t.is(buf.length, 9);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 9);
  t.deepEqual(buf, new DataBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])));
});

test('create from number', (t) => {
  const buf = new DataBuffer(9);
  t.is(buf.length, 9);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 9);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(9)));
});

test('create from another DataBuffer', (t) => {
  const buf = new DataBuffer(new DataBuffer(9));
  t.is(buf.length, 9);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 9);
  t.deepEqual(buf, new DataBuffer(new Uint8Array(9)));
});

test('create from node buffer (Buffer)', (t) => {
  const buf = new DataBuffer(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  t.is(buf.length, 9);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 9);
  t.deepEqual(buf, new DataBuffer(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9])));
});

test('create from node buffer (Uint8Array)', (t) => {
  const buf = new DataBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  t.is(buf.length, 9);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 9);
  t.deepEqual(buf, new DataBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])));
});

test('error constructing', (t) => {
  t.throws(() => new DataBuffer(null));
  t.throws(() => new DataBuffer(true));
});

test('length', (t) => {
  const buffer = new DataBuffer(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  t.is(buffer.length, 10);
});

test('allocate', (t) => {
  const buf = DataBuffer.allocate(10);
  t.is(buf.length, 10);
  t.truthy(buf.data instanceof Uint8Array);
  t.is(buf.data.length, 10);
});

test('compare: can validate buffers', (t) => {
  const buffer = new DataBuffer(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const copy = buffer.copy();

  const bad_bytes = new Uint8Array([0, 1, 2, 3, 0, 0, 6, 7, 8, 9]);
  const bad_buffer = new DataBuffer(bad_bytes);

  t.true(buffer.compare(copy));
  t.false(buffer.compare(bad_buffer));
});

test('compare: can fail early with an empty buffer', (t) => {
  const buffer = new DataBuffer(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const copy = buffer.copy();

  const empty_bytes = new Uint8Array([]);
  const empty_buffer = new DataBuffer(empty_bytes);

  t.true(buffer.compare(copy));
  t.false(buffer.compare(empty_buffer));
});

test('copy', (t) => {
  const buffer = new DataBuffer(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const copy = buffer.copy();

  t.is(buffer.length, copy.length);
  t.not(buffer.data, copy.data);
  t.is(buffer.data.length, copy.data.length);
});

test('slice', (t) => {
  const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const buffer = new DataBuffer(bytes);
  t.is(buffer.slice(0, 4).length, 4);
  t.not(bytes, buffer.slice(0, 100).data);
  t.deepEqual(bytes, buffer.slice(0, 100).data);
  t.deepEqual(new DataBuffer(bytes.slice(3, 6)), buffer.slice(3, 3));
  t.is(buffer.slice(5).length, 5);
});

test('advance', (t) => {
  const buf = new DataBuffer(new Uint8Array([10, 160, 20, 29, 119]));
  t.is(buf.offset, 0);

  buf.advance(2);
  t.is(buf.offset, 2);

  t.throws(() => buf.advance(10), { message: 'Insufficient Bytes: 10 <= 3' });
});

test('rewind', (t) => {
  const buf = new DataBuffer(new Uint8Array([10, 160, 20, 29, 119]));

  buf.advance(4);
  t.is(buf.offset, 4);

  buf.rewind(2);
  t.is(buf.offset, 2);

  buf.rewind(1);
  t.is(buf.offset, 1);

  buf.advance(3);
  t.is(buf.offset, 4);

  buf.rewind(4);
  t.is(buf.offset, 0);

  buf.advance(5);
  buf.rewind(4);
  t.is(buf.offset, 1);

  buf.reset();
  buf.advance(5);
  buf.rewind(5);
  t.is(buf.offset, 0);

  t.throws(() => buf.rewind(10), { message: 'Insufficient Bytes: 10 > 0' });
});

test('seek', (t) => {
  const buf = new DataBuffer(new Uint8Array([10, 160, 20, 29, 119]));

  buf.seek(3);
  t.is(buf.offset, 3);

  buf.seek(1);
  t.is(buf.offset, 1);

  // Testing the no-op equal branch of `position === this.offset`
  buf.seek(1);
  t.is(buf.offset, 1);

  t.throws(() => buf.seek(100), { message: 'Insufficient Bytes: 99 <= 4' });

  t.throws(() => buf.seek(-10), { instanceOf: RangeError, message: 'Invalid position: -10' });
});

test('remainingBytes', (t) => {
  const buf = new DataBuffer(new Uint8Array([10, 160, 20, 29, 119]));
  t.is(buf.remainingBytes(), 5);

  buf.advance(2);
  t.is(buf.remainingBytes(), 3);
});

test('uint8', (t) => {
  let value;
  let stream = new DataBuffer(new Uint8Array([10, 160, 20, 29, 119]));
  const values = [10, 160, 20, 29, 119];

  // check peek with correct offsets across buffers
  for (let i = 0; i < values.length; i++) {
    value = values[i];
    t.is(value, stream.peekUInt8(i === 0 ? undefined : i));
    t.is(value, stream.peek(1, i === 0 ? undefined : i)[0]);
  }

  t.throws(() => stream.peekUInt8(10), { message: 'Insufficient Bytes: 10 + 1' });

  // check reading across buffers
  for (value of [...values]) {
    t.is(value, stream.readUInt8());
  }

  t.throws(() => stream.readUInt8(), { message: 'Insufficient Bytes: 1' });

  // read(bytes) UnderflowError and littleEndian branch
  stream = new DataBuffer(new Uint8Array([0x12, 0x34]));
  t.throws(() => stream.read(3), { message: 'Insufficient Bytes: 3' });
  stream.seek(0);
  const le = stream.read(2, true);
  t.is(le[0], 0x34);
  t.is(le[1], 0x12);
  // peek(bytes) UnderflowError and littleEndian branch
  stream = new DataBuffer(new Uint8Array([0xAB, 0xCD]));
  t.throws(() => stream.peek(3, 0), { message: 'Insufficient Bytes: 0 + 3' });
  const peekLe = stream.peek(2, 0, true);
  t.is(peekLe[0], 0xCD);
  t.is(peekLe[1], 0xAB);

  // if it were a signed int, would be -1
  stream = new DataBuffer(new Uint8Array([255, 23]));
  t.is(stream.readUInt8(), 255);
});

test('int8', (t) => {
  let value;
  const stream = new DataBuffer(new Uint8Array([0x23, 0xFF, 0x87, 0xAB, 0x7C, 0xEF]));
  const values = [0x23, -1, -121, -85, 124, -17];

  // peeking
  t.is(values[0], stream.peekInt8());
  for (let i = 0; i < values.length; i++) {
    value = values[i];
    t.is(value, stream.peekInt8(i));
  }

  // reading
  return (() => {
    const result = [];
    for (value of [...values]) {
      result.push(t.is(value, stream.readInt8()));
    }
    return result;
  })();
});

test('int8: UnderflowError', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x23]));
  stream.readUInt8();
  t.throws(() => stream.readInt8(), { message: 'Insufficient Bytes: 1' });
  const s2 = new DataBuffer(new Uint8Array([0xFF]));
  t.throws(() => s2.peekInt8(1), { message: 'Insufficient Bytes: 1 + 1' });
});

test('uint16', (t) => {
  let stream = new DataBuffer(new Uint8Array([0, 0x23, 0x42, 0x3F]));
  const copy = new DataBuffer(new Uint8Array([0, 0x23, 0x42, 0x3F]));

  // peeking big endian
  const iterable = [0x23, 0x2342, 0x423F];
  t.is(iterable[0], stream.peekUInt16());
  for (let i = 0; i < iterable.length; i++) {
    const value = iterable[i];
    t.is(value, stream.peekUInt16(i));
  }

  // peeking little endian
  const iterable1 = [0x2300, 0x4223, 0x3F42];
  t.is(iterable1[0], stream.peekUInt16(undefined, true));
  for (let i = 0; i < iterable1.length; i++) {
    const value = iterable1[i];
    t.is(value, stream.peekUInt16(i, true));
  }

  // reading big endian
  for (const value of [0x23, 0x423F]) {
    t.is(value, stream.readUInt16());
  }

  // reading little endian
  for (const value of [0x2300, 0x3F42]) {
    t.is(value, copy.readUInt16(true));
  }

  // check that it interprets as unsigned
  stream = new DataBuffer(new Uint8Array([0xFE, 0xFE]));
  t.is(stream.peekUInt16(0), 0xFEFE);
  t.is(stream.peekUInt16(0, true), 0xFEFE);

  // UnderflowError
  const shortU16 = new DataBuffer(new Uint8Array([0x01]));
  t.throws(() => shortU16.peekUInt16(), { message: 'Insufficient Bytes: 0 + 2' });
});

test('int16', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x16, 0x79, 0xFF, 0x80]));
  const copy = stream.copy();

  // peeking big endian
  const iterable = [0x1679, -128];
  t.is(stream.peekInt16(), 0x1679);
  for (let i = 0; i < iterable.length; i++) {
    const value = iterable[i];
    t.is(value, stream.peekInt16(i * 2));
  }

  // peeking little endian
  const iterable1 = [0x7916, -32513];
  for (let i = 0; i < iterable1.length; i++) {
    const value = iterable1[i];
    t.is(value, stream.peekInt16(i * 2, true));
  }

  // reading big endian
  for (const value of [0x1679, -128]) {
    t.is(value, stream.readInt16());
  }

  // reading little endian
  for (const value of [0x7916, -32513]) {
    t.is(value, copy.readInt16(true));
  }

  // UnderflowError
  const shortI16 = new DataBuffer(new Uint8Array([0x01]));
  t.throws(() => shortI16.readInt16(), { message: 'Insufficient Bytes: 2' });
  t.throws(() => shortI16.peekInt16(), { message: 'Insufficient Bytes: 0 + 2' });
});

test('uint24', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x23, 0x16, 0x56, 0x11, 0x78, 0xAF]));
  const copy = stream.copy();

  // peeking big endian
  const iterable = [0x231656, 0x165611, 0x561178, 0x1178AF];
  t.is(iterable[0], stream.peekUInt24());
  for (let i = 0; i < iterable.length; i++) {
    const value = iterable[i];
    t.is(value, stream.peekUInt24(i));
  }

  // peeking little endian
  const iterable1 = [0x561623, 0x115616, 0x781156, 0xAF7811];
  t.is(iterable1[0], stream.peekUInt24(undefined, true));
  for (let i = 0; i < iterable1.length; i++) {
    const value = iterable1[i];
    t.is(value, stream.peekUInt24(i, true));
  }

  // reading big endian
  for (const value of [0x231656, 0x1178AF]) {
    t.is(value, stream.readUInt24());
  }

  return (() => {
    const result = [];
    for (const value of [0x561623, 0xAF7811]) {
      result.push(t.is(value, copy.readUInt24(true)));
    }
    return result;
  })();
});

test('int24', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x23, 0x16, 0x56, 0xFF, 0x10, 0xFA]));
  const copy = stream.copy();

  // peeking big endian
  const iterable = [0x231656, 0x1656FF, 0x56FF10, -61190];
  t.is(iterable[0], stream.peekInt24());
  for (let i = 0; i < iterable.length; i++) {
    const value = iterable[i];
    t.is(value, stream.peekInt24(i));
  }

  // peeking little endian
  const iterable1 = [0x561623, -43498, 0x10FF56, -388865];
  for (let i = 0; i < iterable1.length; i++) {
    const value = iterable1[i];
    t.is(value, stream.peekInt24(i, true));
  }

  // reading big endian
  for (const value of [0x231656, -61190]) {
    t.is(value, stream.readInt24());
  }

  // reading little endian
  return (() => {
    const result = [];
    for (const value of [0x561623, -388865]) {
      result.push(t.is(value, copy.readInt24(true)));
    }
    return result;
  })();
});

test('uint32', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x32, 0x65, 0x42, 0x56, 0x23, 0xFF, 0x45, 0x11]));
  const copy = stream.copy();

  // peeking big endian
  const iterable = [0x32654256, 0x65425623, 0x425623FF, 0x5623FF45, 0x23FF4511];
  t.is(iterable[0], stream.peekUInt32());
  for (let i = 0; i < iterable.length; i++) {
    const value = iterable[i];
    t.is(value, stream.peekUInt32(i));
  }

  // peeking little endian
  const iterable1 = [0x56426532, 0x23564265, 0xFF235642, 0x45FF2356, 0x1145FF23];
  t.is(iterable1[0], stream.peekUInt32(undefined, true));
  for (let i = 0; i < iterable1.length; i++) {
    const value = iterable1[i];
    t.is(value, stream.peekUInt32(i, true));
  }

  // reading big endian
  for (const value of [0x32654256, 0x23FF4511]) {
    t.is(value, stream.readUInt32());
  }

  // reading little endian
  return (() => {
    const result = [];
    for (const value of [0x56426532, 0x1145FF23]) {
      result.push(t.is(value, copy.readUInt32(true)));
    }
    return result;
  })();
});

test('uint32: UnderflowError', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x32, 0x65, 0x42]));
  t.throws(() => stream.peekUInt32(0), { message: 'Insufficient Bytes: 0 + 4' });
  t.throws(() => stream.peekUInt32(1), { message: 'Insufficient Bytes: 1 + 4' });
});

test('int32', (t) => {
  let stream = new DataBuffer(new Uint8Array([0x43, 0x53, 0x16, 0x79, 0xFF, 0xFE, 0xEF, 0xFA]));
  const copy = stream.copy();

  const stream2 = new DataBuffer(new Uint8Array([0x42, 0xC3, 0x95, 0xA9, 0x36, 0x17]));

  // peeking big endian
  const iterable = [0x43531679, -69638];
  for (let i = 0; i < iterable.length; i++) {
    const value = iterable[i];
    t.is(value, stream.peekInt32(i * 4));
  }

  const iterable1 = [0x42C395A9, -1013601994, -1784072681];
  for (let i = 0; i < iterable1.length; i++) {
    const value = iterable1[i];
    t.is(value, stream2.peekInt32(i));
  }

  // peeking little endian
  const iterable2 = [0x79165343, -84934913];
  for (let i = 0; i < iterable2.length; i++) {
    const value = iterable2[i];
    t.is(value, stream.peekInt32(i * 4, true));
  }

  const iterable3 = [-1449802942, 917083587, 389458325];
  for (let i = 0; i < iterable3.length; i++) {
    const value = iterable3[i];
    t.is(value, stream2.peekInt32(i, true));
  }

  // reading big endian
  for (const value of [0x43531679, -69638]) {
    t.is(value, stream.readInt32());
  }

  // reading little endian
  for (const value of [0x79165343, -84934913]) {
    t.is(value, copy.readInt32(true));
  }

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]));
  t.is(stream.peekInt32(), -1);
  t.is(stream.peekInt32(0, true), -1);
});

test('int32: UnderflowError', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x43, 0x53, 0x16]));
  t.throws(() => stream.readInt32(), { message: 'Insufficient Bytes: 4' });
  const s2 = new DataBuffer(new Uint8Array([0x43, 0x53, 0x16, 0x79]));
  s2.readInt32();
  t.throws(() => s2.peekInt32(1), { message: 'Insufficient Bytes: 1 + 4' });
});

test('float32', (t) => {
  const stream = new DataBuffer(new Uint8Array([
    0, 0, 0x80,
    0x3F, 0, 0, 0, 0xC0,
    0xAB, 0xAA,
    0xAA, 0x3E, 0, 0, 0, 0,
    0, 0, 0,
    0x80, 0, 0, 0x80,
    0x7F, 0, 0, 0x80, 0xFF,
  ]));
  const copy = stream.copy();

  const valuesBE = [4.600602988224807e-41, 2.6904930515036488e-43, -1.2126478207002966e-12, 0, 1.793662034335766e-43, 4.609571298396486e-41, 4.627507918739843e-41];
  const valuesLE = [1, -2, 0.3333333432674408, 0, -0, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

  // peeking big endian
  for (let i = 0; i < valuesBE.length; i++) {
    const value = valuesBE[i];
    t.is(value, stream.peekFloat32(i * 4));
  }

  // peeking little endian
  for (let i = 0; i < valuesLE.length; i++) {
    const value = valuesLE[i];
    t.is(value, stream.peekFloat32(i * 4, true));
  }

  // reading big endian
  for (const value of [...valuesBE]) {
    t.is(value, stream.readFloat32());
  }

  // reading little endian
  for (const value of [...valuesLE]) {
    t.is(value, copy.readFloat32(true));
  }

  // special cases
  const stream2 = new DataBuffer(new Uint8Array([0xFF, 0xFF, 0x7F, 0x7F]));
  t.true(Number.isNaN(stream2.peekFloat32()));
  t.true(Number.isNaN(stream2.peekFloat32(0)));
  t.is(stream2.peekFloat32(0, true), 3.4028234663852886e+38);
});

test('float32: UnderflowError', (t) => {
  const stream = new DataBuffer(new Uint8Array([0, 0, 0]));
  t.throws(() => stream.readFloat32(), { message: 'Insufficient Bytes: 4' });
  t.throws(() => stream.peekFloat32(1), { message: 'Insufficient Bytes: 1 + 4' });
});

test('float48', (t) => {
  let stream;
  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloat48(0, true), 0);
  t.is(stream.readFloat48(true), 0);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00]));
  t.is(stream.peekFloat48(0), 0);
  t.is(stream.readFloat48(), 0);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x81]));
  t.is(stream.peekFloat48(0), 1);
  t.is(stream.readFloat48(), 1);

  stream = new DataBuffer(new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x00, 0x81]));
  t.is(stream.peekFloat48(0), -1);
  t.is(stream.readFloat48(), -1);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x82]));
  t.is(stream.peekFloat48(0), 2);
  t.is(stream.readFloat48(), 2);

  stream = new DataBuffer(new Uint8Array([0x40, 0x00, 0x00, 0x00, 0x00, 0x81]));
  t.is(stream.peekFloat48(0), 1.5);
  t.is(stream.readFloat48(), 1.5);

  stream = new DataBuffer(new Uint8Array([0x20, 0x00, 0x00, 0x00, 0x00, 0x82]));
  t.is(stream.peekFloat48(0), 2.5);
  t.is(stream.readFloat48(), 2.5);

  stream = new DataBuffer(new Uint8Array([0x74, 0x23, 0xF4, 0x00, 0xD2, 0x94]));
  t.is(stream.peekFloat48(0), 999999.2502);
  t.is(stream.readFloat48(), 999999.2502);

  stream = new DataBuffer(new Uint8Array([0xF4, 0x23, 0xF4, 0x00, 0xD2, 0x94]));
  t.is(stream.peekFloat48(0), -999999.2502);
  t.is(stream.readFloat48(), -999999.2502);
});

test('float64', (t) => {
  let stream = new DataBuffer(new Uint8Array([0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0xD5, 0x3F]));
  let copy = stream.copy();
  t.is(stream.peekFloat64(), 1.1945305291680097e+103);
  t.is(stream.peekFloat64(0), 1.1945305291680097e+103);
  t.is(stream.peekFloat64(0, true), 0.3333333333333333);
  t.is(stream.readFloat64(), 1.1945305291680097e+103);
  t.is(copy.readFloat64(true), 0.3333333333333333);

  stream = new DataBuffer(new Uint8Array([1, 0, 0, 0, 0, 0, 0xF0, 0x3F]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 7.291122019655968e-304);
  t.is(stream.peekFloat64(0, true), 1.0000000000000002);
  t.is(stream.readFloat64(), 7.291122019655968e-304);
  t.is(copy.readFloat64(true), 1.0000000000000002);

  stream = new DataBuffer(new Uint8Array([2, 0, 0, 0, 0, 0, 0xF0, 0x3F]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 4.778309726801735e-299);
  t.is(stream.peekFloat64(0, true), 1.0000000000000004);
  t.is(stream.readFloat64(), 4.778309726801735e-299);
  t.is(copy.readFloat64(true), 1.0000000000000004);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x0F, 0x00]));
  copy = stream.copy();
  t.true(Number.isNaN(stream.peekFloat64(0)));
  t.is(stream.peekFloat64(0, true), 2.225073858507201e-308);
  t.true(Number.isNaN(stream.readFloat64()));
  t.is(copy.readFloat64(true), 2.225073858507201e-308);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xEF, 0x7F]));
  copy = stream.copy();
  t.true(Number.isNaN(stream.peekFloat64(0)));
  t.is(stream.peekFloat64(0, true), 1.7976931348623157e+308);
  t.true(Number.isNaN(stream.readFloat64()));
  t.is(copy.readFloat64(true), 1.7976931348623157e+308);

  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0xF0, 0x3F]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 3.03865e-319);
  t.is(stream.peekFloat64(0, true), 1);
  t.is(stream.readFloat64(), 3.03865e-319);
  t.is(copy.readFloat64(true), 1);

  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0x10, 0]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 2.0237e-320);
  t.is(stream.peekFloat64(0, true), 2.2250738585072014e-308);
  t.is(stream.readFloat64(), 2.0237e-320);
  t.is(copy.readFloat64(true), 2.2250738585072014e-308);

  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 0);
  t.is(stream.peekFloat64(0, true), 0);
  t.is((1 / stream.peekFloat64(0, true)) < 0, false);
  t.is(stream.readFloat64(), 0);
  t.is(copy.readFloat64(true), 0);

  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0x80]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 6.3e-322);
  t.is(stream.peekFloat64(0, true), -0);
  t.is((1 / stream.peekFloat64(0, true)) < 0, true);
  t.is(stream.readFloat64(), 6.3e-322);
  t.is(copy.readFloat64(true), -0);

  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0xF0, 0x7F]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 3.0418e-319);
  t.is(Number.POSITIVE_INFINITY, stream.peekFloat64(0, true));
  t.is(stream.readFloat64(), 3.0418e-319);
  t.is(Number.POSITIVE_INFINITY, copy.readFloat64(true));

  // UnderflowError
  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0]));
  t.throws(() => stream.readFloat64(), { message: 'Insufficient Bytes: 8' });
  t.throws(() => stream.peekFloat64(2), { message: 'Insufficient Bytes: 2 + 8' });

  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0xF0, 0xFF]));
  copy = stream.copy();
  t.is(stream.peekFloat64(0), 3.04814e-319);
  t.is(Number.NEGATIVE_INFINITY, stream.peekFloat64(0, true));
  t.is(stream.readFloat64(), 3.04814e-319);
  t.is(Number.NEGATIVE_INFINITY, copy.readFloat64(true));
});

test('float80', (t) => {
  let stream;
  let copy;
  stream = new DataBuffer(new Uint8Array([0x3F, 0xFF, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  copy = stream.copy();
  t.is(stream.peekFloat80(), 1);
  t.is(stream.peekFloat80(0, false), 0);
  t.is(stream.readFloat80(), 1);
  t.is(copy.readFloat80(false), 0);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xFF, 0x3F]));
  t.is(stream.peekFloat80(0, false), 1);
  t.is(stream.readFloat80(false), 1);

  stream = new DataBuffer(new Uint8Array([0xBF, 0xFF, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  copy = stream.copy();
  t.is(stream.peekFloat80(), -1);
  t.is(stream.peekFloat80(0, false), 0);
  t.is(stream.readFloat80(), -1);
  t.is(copy.readFloat80(false), 0);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xFF, 0xBF]));
  t.is(stream.peekFloat80(0, false), -1);
  t.is(stream.readFloat80(false), -1);

  stream = new DataBuffer(new Uint8Array([0x40, 0x0E, 0xAC, 0x44, 0, 0, 0, 0, 0, 0]));
  copy = stream.copy();
  t.is(stream.peekFloat80(), 44100);
  t.is(stream.peekFloat80(0, false), 0);
  t.is(stream.readFloat80(), 44100);
  t.is(copy.readFloat80(false), 0);

  stream = new DataBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0x44, 0xAC, 0x0E, 0x40]));
  t.is(stream.peekFloat80(0, false), 44100);
  t.is(stream.readFloat80(false), 44100);

  stream = new DataBuffer(new Uint8Array([0x7F, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  copy = stream.copy();
  t.is(Number.POSITIVE_INFINITY, stream.peekFloat80());
  t.is(stream.peekFloat80(0, false), 0);
  t.is(Number.POSITIVE_INFINITY, stream.readFloat80());
  t.is(copy.readFloat80(false), 0);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x7F]));
  t.is(Number.POSITIVE_INFINITY, stream.peekFloat80(0, false));
  t.is(Number.POSITIVE_INFINITY, stream.readFloat80(false));

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(Number.NEGATIVE_INFINITY, stream.peekFloat80());
  t.is(Number.NEGATIVE_INFINITY, stream.readFloat80());

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF]));
  t.is(Number.NEGATIVE_INFINITY, stream.peekFloat80(0, false));
  t.is(Number.NEGATIVE_INFINITY, stream.readFloat80(false));

  stream = new DataBuffer(new Uint8Array([0x7F, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.true(Number.isNaN(stream.peekFloat80()));
  t.true(Number.isNaN(stream.readFloat80()));

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x7F]));
  t.true(Number.isNaN(stream.peekFloat80(0, false)));
  t.true(Number.isNaN(stream.readFloat80(false)));

  stream = new DataBuffer(new Uint8Array([0x40, 0x00, 0xC9, 0x0F, 0xDA, 0x9E, 0x46, 0xA7, 0x88, 0x00]));
  t.is(stream.peekFloat80(), 3.14159265);
  t.is(stream.readFloat80(), 3.14159265);

  stream = new DataBuffer(new Uint8Array([0x00, 0x88, 0xA7, 0x46, 0x9E, 0xDA, 0x0F, 0xC9, 0x00, 0x40]));
  t.is(stream.peekFloat80(0, false), 3.14159265);
  t.is(stream.readFloat80(false), 3.14159265);

  stream = new DataBuffer(new Uint8Array([0x3F, 0xFD, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xA8, 0xFF]));
  copy = stream.copy();
  t.is(stream.peekFloat80(), 0.3333333333333333);
  t.is(Number.NEGATIVE_INFINITY, stream.peekFloat80(0, false));
  t.is(stream.readFloat80(), 0.3333333333333333);
  t.is(Number.NEGATIVE_INFINITY, copy.readFloat80(false));

  stream = new DataBuffer(new Uint8Array([0x41, 0x55, 0xAA, 0xAA, 0xAA, 0xAA, 0xAE, 0xA9, 0xF8, 0x00]));
  t.is(stream.peekFloat80(), 1.1945305291680097e+103);
  t.is(stream.readFloat80(), 1.1945305291680097e+103);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloat80(), 0);

  stream = new DataBuffer(new Uint8Array([0x40, 0x02, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloat80(0), 10);
  t.is(stream.readFloat80(), 10);

  stream = new DataBuffer(new Uint8Array([0x40, 0x00, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloat80(0, true), 2.5);
  t.is(stream.readFloat80(true), 2.5);

  stream = new DataBuffer(new Uint8Array([0x40, 0x0C, 0x8C, 0xA2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloat80(0, true), 9000.5);
  t.is(stream.readFloat80(true), 9000.5);

  stream = new DataBuffer(new Uint8Array([0x40, 0x05, 0xFA, 0xAA, 0xA6, 0x4C, 0x2F, 0x83, 0x7B, 0x4A]));
  t.is(stream.peekFloat80(0, true), 125.3333);
  t.is(stream.readFloat80(true), 125.3333);

  stream = new DataBuffer(new Uint8Array([0x40, 0x01, 0xAA, 0xAA, 0xA9, 0xF7, 0xB5, 0xAE, 0xA0, 0x00]));
  t.is(stream.peekFloat80(0, true), 5.333333);
  t.is(stream.readFloat80(true), 5.333333);

  stream = new DataBuffer(new Uint8Array([0x40, 0x01, 0xB5, 0x55, 0x56, 0x08, 0x4A, 0x51, 0x60, 0x00]));
  t.is(stream.peekFloat80(0, true), 5.666667);
  t.is(stream.readFloat80(true), 5.666667);
});

test('floatIEEE754', (t) => {
  let stream;
  let copy;

  stream = new DataBuffer(new Uint8Array([0x3F, 0xFF, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  copy = stream.copy();
  t.is(stream.peekFloatIEEE754(), 1);
  t.is(stream.readFloatIEEE754(), 1);
  t.is(copy.readFloatIEEE754(), 1);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xFF, 0x3F]));
  t.is(stream.peekFloatIEEE754(0, true), 1);
  t.is(stream.readFloatIEEE754(true), 1);

  stream = new DataBuffer(new Uint8Array([0xBF, 0xFF, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  copy = stream.copy();
  t.is(stream.peekFloatIEEE754(), -1);
  t.is(stream.readFloatIEEE754(), -1);
  t.is(copy.readFloatIEEE754(), -1);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xFF, 0xBF]));
  t.is(stream.peekFloatIEEE754(0, true), -1);
  t.is(stream.readFloatIEEE754(true), -1);

  stream = new DataBuffer(new Uint8Array([0x40, 0x0E, 0xAC, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  copy = stream.copy();
  t.is(stream.peekFloatIEEE754(), 44100);
  t.is(stream.readFloatIEEE754(), 44100);
  t.is(copy.readFloatIEEE754(), 44100);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x44, 0xAC, 0x0E, 0x40]));
  t.is(stream.peekFloatIEEE754(0, true), 44100);
  t.is(stream.readFloatIEEE754(true), 44100);

  stream = new DataBuffer(new Uint8Array([0x7F, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  copy = stream.copy();
  t.is(Number.POSITIVE_INFINITY, stream.peekFloatIEEE754());
  t.is(Number.POSITIVE_INFINITY, stream.readFloatIEEE754());
  t.is(Number.POSITIVE_INFINITY, copy.readFloatIEEE754());

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x7F]));
  t.is(Number.POSITIVE_INFINITY, stream.peekFloatIEEE754(0, true));
  t.is(Number.POSITIVE_INFINITY, stream.readFloatIEEE754(true));

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(Number.NEGATIVE_INFINITY, stream.peekFloatIEEE754());
  t.is(Number.NEGATIVE_INFINITY, stream.readFloatIEEE754());

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF]));
  t.is(Number.NEGATIVE_INFINITY, stream.peekFloatIEEE754(0, true));
  t.is(Number.NEGATIVE_INFINITY, stream.readFloatIEEE754(true));

  stream = new DataBuffer(new Uint8Array([0x7F, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(Number.POSITIVE_INFINITY, stream.peekFloatIEEE754());
  t.is(Number.POSITIVE_INFINITY, stream.readFloatIEEE754());

  stream = new DataBuffer(new Uint8Array([0x40, 0x00, 0xC9, 0x0F, 0xDA, 0x9E, 0x46, 0xA7, 0x88, 0x00]));
  t.is(stream.peekFloatIEEE754(), 3.14159265);
  t.is(stream.readFloatIEEE754(), 3.14159265);

  stream = new DataBuffer(new Uint8Array([0x00, 0x88, 0xA7, 0x46, 0x9E, 0xDA, 0x0F, 0xC9, 0x00, 0x40]));
  t.is(stream.peekFloatIEEE754(0, true), 3.14159265);
  t.is(stream.readFloatIEEE754(true), 3.14159265);

  stream = new DataBuffer(new Uint8Array([0x3F, 0xFD, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xA8, 0xFF]));
  copy = stream.copy();
  t.is(stream.peekFloatIEEE754(), 0.3333333333333333);
  t.is(stream.readFloatIEEE754(), 0.3333333333333333);
  t.is(copy.readFloatIEEE754(), 0.3333333333333333);

  stream = new DataBuffer(new Uint8Array([0x41, 0x55, 0xAA, 0xAA, 0xAA, 0xAA, 0xAE, 0xA9, 0xF8, 0x00]));
  t.is(stream.peekFloatIEEE754(), 1.1945305291680097e+103);
  t.is(stream.readFloatIEEE754(), 1.1945305291680097e+103);

  stream = new DataBuffer(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloatIEEE754(), 0);

  stream = new DataBuffer(new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloatIEEE754(), -0);
  t.is((1 / stream.peekFloatIEEE754()) < 0, true);
  t.is(stream.readFloatIEEE754(), -0);

  stream = new DataBuffer(new Uint8Array([0x40, 0x02, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloatIEEE754(0), 10);
  t.is(stream.readFloatIEEE754(), 10);

  stream = new DataBuffer(new Uint8Array([0x40, 0x00, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloatIEEE754(0), 2.5);
  t.is(stream.readFloatIEEE754(), 2.5);

  stream = new DataBuffer(new Uint8Array([0x40, 0x0C, 0x8C, 0xA2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloatIEEE754(0), 9000.5);
  t.is(stream.readFloatIEEE754(), 9000.5);

  stream = new DataBuffer(new Uint8Array([0x40, 0x05, 0xFA, 0xAA, 0xA6, 0x4C, 0x2F, 0x83, 0x7B, 0x4A]));
  t.is(stream.peekFloatIEEE754(0), 125.3333);
  t.is(stream.readFloatIEEE754(), 125.3333);

  stream = new DataBuffer(new Uint8Array([0x40, 0x01, 0xAA, 0xAA, 0xA9, 0xF7, 0xB5, 0xAE, 0xA0, 0x00]));
  t.is(stream.peekFloatIEEE754(0), 5.333333);
  t.is(stream.readFloatIEEE754(), 5.333333);

  stream = new DataBuffer(new Uint8Array([0x40, 0x01, 0xB5, 0x55, 0x56, 0x08, 0x4A, 0x51, 0x60, 0x00]));
  t.is(stream.peekFloatIEEE754(0), 5.666667);
  t.is(stream.readFloatIEEE754(), 5.666667);

  stream = new DataBuffer(new Uint8Array([0x3F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00]));
  t.is(stream.peekFloatIEEE754(0), 1.9999999995343387);
  t.is(stream.readFloatIEEE754(), 1.9999999995343387);

  stream = new DataBuffer(new Uint8Array([0x3F, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]));
  t.is(stream.peekFloatIEEE754(0), 2 ** -63);
  t.is(stream.readFloatIEEE754(), 2 ** -63);

  stream = new DataBuffer(new Uint8Array([0x3F, 0xFF, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  t.throws(() => stream.readFloatIEEE754(), { message: 'Insufficient Bytes: 10' });
  t.throws(() => stream.peekFloatIEEE754(1), { message: 'Insufficient Bytes: 1 + 10' });
});

test('buffer', (t) => {
  const stream = new DataBuffer(new Uint8Array([10, 160, 20, 29, 119]));
  t.deepEqual(new DataBuffer(new Uint8Array([10, 160, 20, 29])), stream.peekBuffer(0, 4));
  t.deepEqual(new DataBuffer(new Uint8Array([160, 20, 29, 119])), stream.peekBuffer(1, 4));
  t.deepEqual(new DataBuffer(new Uint8Array([10, 160, 20, 29])), stream.readBuffer(4));
  t.throws(() => stream.readBuffer(10), { message: 'Insufficient Bytes: 10' });
  stream.seek(0);
  t.throws(() => stream.peekBuffer(0, 10), { message: 'Insufficient Bytes: 0 + 10' });
  stream.readBuffer(1);
  t.throws(() => stream.peekBuffer(1, 10), { message: 'Insufficient Bytes: 1 + 10' });
});

test('decodeString: ascii/latin1', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F]));
  t.is(stream.peekString(0, 5), 'hello');
  t.is(stream.peekString(0, 5, 'ascii'), 'hello');
  t.is(stream.peekString(0, 5, 'latin1'), 'hello');
  t.is(stream.readString(5, 'ascii'), 'hello');
  t.is(stream.offset, 5);
});

test('decodeString: ascii/latin1 null terminated', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F, 0]));
  t.is(stream.peekString(0, 6), 'hello\0');
  t.is(stream.peekString(0, null), 'hello');
  t.is(stream.readString(null), 'hello');
  t.is(stream.offset, 6);
});

test('decodeString: utf8', (t) => {
  let stream = new DataBuffer(new Uint8Array([195, 188, 98, 101, 114]));
  t.is(stream.peekString(0, 5, 'utf8'), 'über');
  t.is(stream.readString(5, 'utf8'), 'über');
  t.is(stream.offset, 5);

  stream = new DataBuffer(new Uint8Array([0xC3, 0xB6, 0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC, 0xE8, 0xAA, 0x9E]));
  t.is(stream.peekString(0, 11, 'utf-8'), 'ö日本語');
  t.is(stream.readString(11, 'utf-8'), 'ö日本語');
  t.is(stream.offset, 11);

  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F, 0x91, 0x8D]));
  t.is(stream.peekString(0, 4, 'utf8'), '👍');
  t.is(stream.readString(4, 'utf8'), '👍');
  t.is(stream.offset, 4);

  stream = new DataBuffer(new Uint8Array([0xE2, 0x82, 0xAC]));
  t.is(stream.peekString(0, 3, 'utf8'), '€');
  t.is(stream.readString(3, 'utf8'), '€');
  t.is(stream.offset, 3);
});

test('decodeString: utf-8 null terminated', (t) => {
  let stream = new DataBuffer(new Uint8Array([195, 188, 98, 101, 114, 0]));
  t.is(stream.peekString(0, null, 'utf-8'), 'über');
  t.is(stream.readString(null, 'utf-8'), 'über');
  t.is(stream.offset, 6);

  stream = new DataBuffer(new Uint8Array([0xC3, 0xB6, 0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC, 0xE8, 0xAA, 0x9E, 0]));
  t.is(stream.peekString(0, null, 'utf8'), 'ö日本語');
  t.is(stream.readString(null, 'utf8'), 'ö日本語');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F, 0x91, 0x8D, 0]));
  t.is(stream.peekString(0, null, 'utf8'), '👍');
  t.is(stream.readString(null, 'utf8'), '👍');
  t.is(stream.offset, 5);

  stream = new DataBuffer(new Uint8Array([0xE2, 0x82, 0xAC, 0]));
  t.is(stream.peekString(0, null, 'utf8'), '€');
  t.is(stream.readString(null, 'utf8'), '€');
  t.is(stream.offset, 4);
});

test('decodeString: utf16be', (t) => {
  let stream = new DataBuffer(new Uint8Array([0, 252, 0, 98, 0, 101, 0, 114]));
  t.is(stream.peekString(0, 8, 'utf16be'), 'über');
  t.is(stream.readString(8, 'utf16be'), 'über');
  t.is(stream.offset, 8);

  stream = new DataBuffer(new Uint8Array([4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66]));
  t.is(stream.peekString(0, 12, 'utf16be'), 'привет');
  t.is(stream.readString(12, 'utf16be'), 'привет');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0, 0xF6, 0x65, 0xE5, 0x67, 0x2C, 0x8A, 0x9E]));
  t.is(stream.peekString(0, 8, 'utf16be'), 'ö日本語');
  t.is(stream.readString(8, 'utf16be'), 'ö日本語');
  t.is(stream.offset, 8);

  stream = new DataBuffer(new Uint8Array([0xD8, 0x3D, 0xDC, 0x4D]));
  t.is(stream.peekString(0, 4, 'utf16be'), '👍');
  t.is(stream.readString(4, 'utf16be'), '👍');
  t.is(stream.offset, 4);
});

test('decodeString: utf16-be null terminated', (t) => {
  let stream = new DataBuffer(new Uint8Array([0, 252, 0, 98, 0, 101, 0, 114, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16-be'), 'über');
  t.is(stream.readString(null, 'utf16-be'), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16be'), 'привет');
  t.is(stream.readString(null, 'utf16be'), 'привет');
  t.is(stream.offset, 14);

  stream = new DataBuffer(new Uint8Array([0, 0xF6, 0x65, 0xE5, 0x67, 0x2C, 0x8A, 0x9E, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16be'), 'ö日本語');
  t.is(stream.readString(null, 'utf16be'), 'ö日本語');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([0xD8, 0x3D, 0xDC, 0x4D, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16be'), '👍');
  t.is(stream.readString(null, 'utf16be'), '👍');
  t.is(stream.offset, 6);
});

test('decodeString: utf16le', (t) => {
  let stream = new DataBuffer(new Uint8Array([252, 0, 98, 0, 101, 0, 114, 0]));
  t.is(stream.peekString(0, 8, 'utf16le'), 'über');
  t.is(stream.readString(8, 'utf16le'), 'über');
  t.is(stream.offset, 8);

  stream = new DataBuffer(new Uint8Array([63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4]));
  t.is(stream.peekString(0, 12, 'utf16le'), 'привет');
  t.is(stream.readString(12, 'utf16le'), 'привет');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0xF6, 0, 0xE5, 0x65, 0x2C, 0x67, 0x9E, 0x8A]));
  t.is(stream.peekString(0, 8, 'utf16le'), 'ö日本語');
  t.is(stream.readString(8, 'utf16le'), 'ö日本語');
  t.is(stream.offset, 8);

  stream = new DataBuffer(new Uint8Array([0x42, 0x30, 0x44, 0x30, 0x46, 0x30, 0x48, 0x30, 0x4A, 0x30]));
  t.is(stream.peekString(0, 10, 'utf16le'), 'あいうえお');
  t.is(stream.readString(10, 'utf16le'), 'あいうえお');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([0x3D, 0xD8, 0x4D, 0xDC]));
  t.is(stream.peekString(0, 4, 'utf16le'), '👍');
  t.is(stream.readString(4, 'utf16le'), '👍');
  t.is(stream.offset, 4);
});

test('decodeString: utf16-le null terminated', (t) => {
  let stream = new DataBuffer(new Uint8Array([252, 0, 98, 0, 101, 0, 114, 0, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16-le'), 'über');
  t.is(stream.readString(null, 'utf16-le'), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16le'), 'привет');
  t.is(stream.readString(null, 'utf16le'), 'привет');
  t.is(stream.offset, 14);

  stream = new DataBuffer(new Uint8Array([0xF6, 0, 0xE5, 0x65, 0x2C, 0x67, 0x9E, 0x8A, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16le'), 'ö日本語');
  t.is(stream.readString(null, 'utf16le'), 'ö日本語');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([0x42, 0x30, 0x44, 0x30, 0x46, 0x30, 0x48, 0x30, 0x4A, 0x30, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16le'), 'あいうえお');
  t.is(stream.readString(null, 'utf16le'), 'あいうえお');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0x3D, 0xD8, 0x4D, 0xDC, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16le'), '👍');
  t.is(stream.readString(null, 'utf16le'), '👍');
  t.is(stream.offset, 6);
});

test('decodeString: utf16bom big endian', (t) => {
  let stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 0, 252, 0, 98, 0, 101, 0, 114]));
  t.is(stream.peekString(0, 10, 'utf16bom'), 'über');
  t.is(stream.readString(10, 'utf16bom'), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66]));
  t.is(stream.peekString(0, 14, 'utf16bom'), 'привет');
  t.is(stream.readString(14, 'utf16bom'), 'привет');
  t.is(stream.offset, 14);

  stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 0, 0xF6, 0x65, 0xE5, 0x67, 0x2C, 0x8A, 0x9E]));
  t.is(stream.peekString(0, 10, 'utf16bom'), 'ö日本語');
  t.is(stream.readString(10, 'utf16bom'), 'ö日本語');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 0xD8, 0x3D, 0xDC, 0x4D]));
  t.is(stream.peekString(0, 6, 'utf16bom'), '👍');
  t.is(stream.readString(6, 'utf16bom'), '👍');
  t.is(stream.offset, 6);
});

test('decodeString: utf16-bom big endian, null terminated', (t) => {
  let stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 0, 252, 0, 98, 0, 101, 0, 114, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16-bom'), 'über');
  t.is(stream.readString(null, 'utf16-bom'), 'über');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16-bom'), 'привет');
  t.is(stream.readString(null, 'utf16-bom'), 'привет');
  t.is(stream.offset, 16);

  stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 0, 0xF6, 0x65, 0xE5, 0x67, 0x2C, 0x8A, 0x9E, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16bom'), 'ö日本語');
  t.is(stream.readString(null, 'utf16bom'), 'ö日本語');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0xFE, 0xFF, 0xD8, 0x3D, 0xDC, 0x4D, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16bom'), '👍');
  t.is(stream.readString(null, 'utf16bom'), '👍');
  t.is(stream.offset, 8);
});

test('decodeString: utf16bom little endian', (t) => {
  let stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 252, 0, 98, 0, 101, 0, 114, 0]));
  t.is(stream.peekString(0, 10, 'utf16bom'), 'über');
  t.is(stream.readString(10, 'utf16bom'), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4]));
  t.is(stream.peekString(0, 14, 'utf16bom'), 'привет');
  t.is(stream.readString(14, 'utf16bom'), 'привет');
  t.is(stream.offset, 14);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 0xF6, 0, 0xE5, 0x65, 0x2C, 0x67, 0x9E, 0x8A]));
  t.is(stream.peekString(0, 10, 'utf16bom'), 'ö日本語');
  t.is(stream.readString(10, 'utf16bom'), 'ö日本語');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 0x3D, 0xD8, 0x4D, 0xDC]));
  t.is(stream.peekString(0, 6, 'utf16bom'), '👍');
  t.is(stream.readString(6, 'utf16bom'), '👍');
  t.is(stream.offset, 6);
});

test('decodeString: UTF16-BOM little endian, null terminated', (t) => {
  let stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 252, 0, 98, 0, 101, 0, 114, 0, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16-bom'), 'über');
  t.is(stream.readString(null, 'utf16-bom'), 'über');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16bom'), 'привет');
  t.is(stream.readString(null, 'utf16bom'), 'привет');
  t.is(stream.offset, 16);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 0xF6, 0, 0xE5, 0x65, 0x2C, 0x67, 0x9E, 0x8A, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16bom'), 'ö日本語');
  t.is(stream.readString(null, 'utf16bom'), 'ö日本語');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 0x3D, 0xD8, 0x4D, 0xDC, 0, 0]));
  t.is(stream.peekString(0, null, 'utf16bom'), '👍');
  t.is(stream.readString(null, 'utf16bom'), '👍');
  t.is(stream.offset, 8);
});

test('decodeString: UTF16-BOM', (t) => {
  const stream = new DataBuffer(new Uint8Array([0xFF, 0xFE, 252, 0, 98, 0, 101, 0, 114, 0, 0, 0]));
  t.throws(() => stream.decodeString(0, 1, 'utf16-bom', true), { message: 'Invalid utf16 sequence.' });
  t.is(stream.offset, 0);
  t.throws(() => stream.decodeString(0, 1, 'utf16-bom', false), { message: 'Invalid utf16 sequence.' });
});

test('decodeString: invalid encoding', (t) => {
  const stream = new DataBuffer(new Uint8Array([0xDC, 0x00, 0xDC, 0xBB, 0xDC, 0x00]));
  const error = t.throws(() => {
    stream.decodeString(0, null, 'magic');
  }, { message: 'Unknown Encoding: magic' });

  t.is(error.message, 'Unknown Encoding: magic');
});

test('decodeString: invalid utf16-sequence', (t) => {
  const stream = new DataBuffer(new Uint8Array([0xDC, 0x00, 0xE0, 0xBB, 0xDC, 0x00]));
  const error = t.throws(() => {
    stream.decodeString(0, null, 'utf16be');
  }, { message: 'Invalid utf16 sequence.' });

  t.is(error.message, 'Invalid utf16 sequence.');
});

test('readNullTerminatedString: ascii/latin1 default nullValue', (t) => {
  const stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F, 0]));
  t.is(stream.peekNullTerminatedString(0), 'hello');
  t.is(stream.peekNullTerminatedString(0, 'ascii'), 'hello');
  t.is(stream.peekNullTerminatedString(0, 'latin1'), 'hello');
  t.is(stream.readNullTerminatedString('ascii'), 'hello');
  t.is(stream.offset, 6);
});

test('readNullTerminatedString: ascii/latin1 custom nullValue', (t) => {
  let stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'ascii', 0xFF), 'hello');
  t.is(stream.readNullTerminatedString('ascii', 0xFF), 'hello');
  t.is(stream.offset, 6);

  stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x00]));
  t.is(stream.peekNullTerminatedString(0, 'latin1', 0x20), 'hello');
  t.is(stream.readNullTerminatedString('latin1', 0x20), 'hello');
  t.is(stream.offset, 6);

  stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F, 0x0A]));
  t.is(stream.peekNullTerminatedString(0, 'ascii', 0x0A), 'hello');
  t.is(stream.readNullTerminatedString('ascii', 0x0A), 'hello');
  t.is(stream.offset, 6);
});

test('readNullTerminatedString: utf8 default nullValue', (t) => {
  let stream = new DataBuffer(new Uint8Array([195, 188, 98, 101, 114, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), 'über');
  t.is(stream.readNullTerminatedString('utf8'), 'über');
  t.is(stream.offset, 6);

  stream = new DataBuffer(new Uint8Array([0xC3, 0xB6, 0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC, 0xE8, 0xAA, 0x9E, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf-8'), 'ö日本語');
  t.is(stream.readNullTerminatedString('utf-8'), 'ö日本語');
  t.is(stream.offset, 12);

  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F, 0x91, 0x8D, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '👍');
  t.is(stream.readNullTerminatedString('utf8'), '👍');
  t.is(stream.offset, 5);
});

test('readNullTerminatedString: utf8 custom nullValue', (t) => {
  let stream = new DataBuffer(new Uint8Array([195, 188, 98, 101, 114, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), 'über');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), 'über');
  t.is(stream.offset, 6);

  stream = new DataBuffer(new Uint8Array([0xC3, 0xB6, 0xE6, 0x97, 0xA5, 0x20, 0x00]));
  t.is(stream.peekNullTerminatedString(0, 'utf-8', 0x20), 'ö日');
  t.is(stream.readNullTerminatedString('utf-8', 0x20), 'ö日');
  t.is(stream.offset, 6);

  // Test that nullValue in continuation bytes also terminates
  // The incomplete preceding sequence is replaced with U+FFFD, rather than silently discarded.
  stream = new DataBuffer(new Uint8Array([0xE6, 0x97, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), '\uFFFD');
  t.is(stream.offset, 3);
});

test('readNullTerminatedString: utf8 edge cases - buffer length and nullValue in continuation bytes', (t) => {
  // 2-byte UTF-8 sequence: buffer ends before b2
  let stream = new DataBuffer(new Uint8Array([0xC3]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 1);

  // 2-byte UTF-8 sequence: b2 equals nullValue
  stream = new DataBuffer(new Uint8Array([0xC3, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), '\uFFFD');
  t.is(stream.offset, 2);

  // 2-byte UTF-8 sequence: b2 equals nullValue (with default 0x00)
  stream = new DataBuffer(new Uint8Array([0xC3, 0x00]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 2);

  // 3-byte UTF-8 sequence: buffer ends before b2
  stream = new DataBuffer(new Uint8Array([0xE6]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 1);

  // 3-byte UTF-8 sequence: b2 equals nullValue
  stream = new DataBuffer(new Uint8Array([0xE6, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), '\uFFFD');
  t.is(stream.offset, 2);

  // 3-byte UTF-8 sequence: buffer ends before b3
  stream = new DataBuffer(new Uint8Array([0xE6, 0x97]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 2);

  // 3-byte UTF-8 sequence: b3 equals nullValue
  stream = new DataBuffer(new Uint8Array([0xE6, 0x97, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), '\uFFFD');
  t.is(stream.offset, 3);

  // 3-byte UTF-8 sequence: b3 equals nullValue (with default 0x00)
  stream = new DataBuffer(new Uint8Array([0xE6, 0x97, 0x00]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 3);

  // 4-byte UTF-8 sequence: buffer ends before b2
  stream = new DataBuffer(new Uint8Array([0xF0]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 1);

  // 4-byte UTF-8 sequence: b2 equals nullValue
  stream = new DataBuffer(new Uint8Array([0xF0, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), '\uFFFD');
  t.is(stream.offset, 2);

  // 4-byte UTF-8 sequence: buffer ends before b3
  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 2);

  // 4-byte UTF-8 sequence: b3 equals nullValue
  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), '\uFFFD');
  t.is(stream.offset, 3);

  // 4-byte UTF-8 sequence: buffer ends before b4
  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F, 0x91]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 3);

  // 4-byte UTF-8 sequence: b4 equals nullValue
  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F, 0x91, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf8', 0xFF), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8', 0xFF), '\uFFFD');
  t.is(stream.offset, 4);

  // 4-byte UTF-8 sequence: b4 equals nullValue (with default 0x00)
  stream = new DataBuffer(new Uint8Array([0xF0, 0x9F, 0x91, 0x00]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '\uFFFD');
  t.is(stream.offset, 4);

  // Mixed: valid 2-byte sequence followed by incomplete 3-byte sequence
  stream = new DataBuffer(new Uint8Array([0xC3, 0xB6, 0xE6, 0x97]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), 'ö\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), 'ö\uFFFD');
  t.is(stream.offset, 4);

  // Mixed: valid 3-byte sequence followed by incomplete 4-byte sequence
  stream = new DataBuffer(new Uint8Array([0xE6, 0x97, 0xA5, 0xF0, 0x9F]));
  t.is(stream.peekNullTerminatedString(0, 'utf8'), '日\uFFFD');
  t.is(stream.readNullTerminatedString('utf8'), '日\uFFFD');
  t.is(stream.offset, 5);
});

test('readNullTerminatedString: utf16be default nullValue', (t) => {
  let stream = new DataBuffer(new Uint8Array([0, 252, 0, 98, 0, 101, 0, 114, 0, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf16be'), 'über');
  t.is(stream.readNullTerminatedString('utf16be'), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 0, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf16-be'), 'привет');
  t.is(stream.readNullTerminatedString('utf16-be'), 'привет');
  t.is(stream.offset, 14);

  stream = new DataBuffer(new Uint8Array([0xD8, 0x3D, 0xDC, 0x4D, 0, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf16be'), '👍');
  t.is(stream.readNullTerminatedString('utf16be'), '👍');
  t.is(stream.offset, 6);
});

test('readNullTerminatedString: utf16be custom nullValue', (t) => {
  let stream = new DataBuffer(new Uint8Array([0, 252, 0, 98, 0, 101, 0, 114, 0xFF, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf16be', 0xFF), 'über');
  t.is(stream.readNullTerminatedString('utf16be', 0xFF), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([4, 63, 4, 64, 4, 56, 0x20, 0x20]));
  t.is(stream.peekNullTerminatedString(0, 'utf16-be', 0x20), 'при');
  t.is(stream.readNullTerminatedString('utf16-be', 0x20), 'при');
  t.is(stream.offset, 8);

  stream = new DataBuffer(new Uint8Array([0, 252, 0, 98, 0, 101, 0, 114, 0x00, 0x00]));
  // Should still work with 0x00 when explicitly specified
  t.is(stream.peekNullTerminatedString(0, 'utf16be', 0x00), 'über');
  t.is(stream.readNullTerminatedString('utf16be', 0x00), 'über');
  t.is(stream.offset, 10);
});

test('readNullTerminatedString: utf16le default nullValue', (t) => {
  let stream = new DataBuffer(new Uint8Array([252, 0, 98, 0, 101, 0, 114, 0, 0, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf16le'), 'über');
  t.is(stream.readNullTerminatedString('utf16le'), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4, 0, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf16-le'), 'привет');
  t.is(stream.readNullTerminatedString('utf16-le'), 'привет');
  t.is(stream.offset, 14);

  stream = new DataBuffer(new Uint8Array([0x3D, 0xD8, 0x4D, 0xDC, 0, 0]));
  t.is(stream.peekNullTerminatedString(0, 'utf16le'), '👍');
  t.is(stream.readNullTerminatedString('utf16le'), '👍');
  t.is(stream.offset, 6);
});

test('readNullTerminatedString: utf16le custom nullValue', (t) => {
  let stream = new DataBuffer(new Uint8Array([252, 0, 98, 0, 101, 0, 114, 0, 0xFF, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'utf16le', 0xFF), 'über');
  t.is(stream.readNullTerminatedString('utf16le', 0xFF), 'über');
  t.is(stream.offset, 10);

  stream = new DataBuffer(new Uint8Array([63, 4, 64, 4, 56, 4, 0x20, 0x20]));
  t.is(stream.peekNullTerminatedString(0, 'utf16-le', 0x20), 'при');
  t.is(stream.readNullTerminatedString('utf16-le', 0x20), 'при');
  t.is(stream.offset, 8);

  stream = new DataBuffer(new Uint8Array([252, 0, 98, 0, 101, 0, 114, 0, 0x00, 0x00]));
  // Should still work with 0x00 when explicitly specified
  t.is(stream.peekNullTerminatedString(0, 'utf16le', 0x00), 'über');
  t.is(stream.readNullTerminatedString('utf16le', 0x00), 'über');
  t.is(stream.offset, 10);
});

test('readNullTerminatedString: edge cases', (t) => {
  // Empty string (null terminator at start)
  let stream = new DataBuffer(new Uint8Array([0]));
  t.is(stream.peekNullTerminatedString(0), '');
  t.is(stream.readNullTerminatedString(), '');
  t.is(stream.offset, 1);

  // Empty string with custom nullValue
  stream = new DataBuffer(new Uint8Array([0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'ascii', 0xFF), '');
  t.is(stream.readNullTerminatedString('ascii', 0xFF), '');
  t.is(stream.offset, 1);

  // String with nullValue in the middle (should stop there)
  stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x00, 0x6C, 0x6C, 0x6F, 0]));
  t.is(stream.peekNullTerminatedString(0), 'he');
  t.is(stream.readNullTerminatedString(), 'he');
  t.is(stream.offset, 3);

  // String with custom nullValue in the middle
  stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0xFF, 0x6C, 0x6C, 0x6F, 0xFF]));
  t.is(stream.peekNullTerminatedString(0, 'ascii', 0xFF), 'he');
  t.is(stream.readNullTerminatedString('ascii', 0xFF), 'he');
  t.is(stream.offset, 3);

  // No null terminator (reads to end of buffer)
  stream = new DataBuffer(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F]));
  t.is(stream.peekNullTerminatedString(0), 'hello');
  t.is(stream.readNullTerminatedString(), 'hello');
  t.is(stream.offset, 5);
});

test('peekBit: can peek the bits at a given offset', (t) => {
  let stream = new DataBuffer(new Uint8Array([255])); // 11111111

  t.is(stream.peekBit(0, 1, 0), 1);
  t.is(stream.peekBit(0, 2, 0), 3);
  t.is(stream.peekBit(0, 3, 0), 7);
  t.is(stream.peekBit(0, 4, 0), 15);
  t.is(stream.peekBit(0, 5, 0), 31);
  t.is(stream.peekBit(0, 6, 0), 63);
  t.is(stream.peekBit(0, 7, 0), 127);
  t.is(stream.peekBit(0, 8, 0), 255);

  stream = new DataBuffer(new Uint8Array([170])); // 10101010

  t.is(stream.peekBit(0), 1);
  t.is(stream.peekBit(0, 2, 0), 2);
  t.is(stream.peekBit(0, 3, 0), 5);
  t.is(stream.peekBit(0, 4, 0), 10);
  t.is(stream.peekBit(0, 5, 0), 21);
  t.is(stream.peekBit(0, 6, 0), 42);
  t.is(stream.peekBit(0, 7, 0), 85);
  t.is(stream.peekBit(0, 8, 0), 170);

  t.is(stream.peekBit(0, 1), 1);
  t.is(stream.peekBit(1, 1, 0), 0);
  t.is(stream.peekBit(2, 1, 0), 1);
  t.is(stream.peekBit(3, 1, 0), 0);
  t.is(stream.peekBit(4, 1, 0), 1);
  t.is(stream.peekBit(5, 1, 0), 0);
  t.is(stream.peekBit(6, 1, 0), 1);
  t.is(stream.peekBit(7, 1, 0), 0);

  t.throws(() => {
    stream.peekBit(undefined, 1, 0);
  }, { message: 'peekBit position is invalid: undefined, must be an Integer between 0 and 7' });
  t.throws(() => {
    stream.peekBit(null, 1, 0);
  }, { message: 'peekBit position is invalid: null, must be an Integer between 0 and 7' });
  t.throws(() => {
    stream.peekBit({}, 1, 0);
  }, { message: 'peekBit position is invalid: [object Object], must be an Integer between 0 and 7' });
  t.throws(() => {
    stream.peekBit([], 1, 0);
  }, { message: 'peekBit position is invalid: , must be an Integer between 0 and 7' });
  t.throws(() => {
    stream.peekBit(Number.NaN, 1, 0);
  }, { message: 'peekBit position is invalid: NaN, must be an Integer between 0 and 7' });
  t.throws(() => {
    stream.peekBit(8, 1, 0);
  }, { message: 'peekBit position is invalid: 8, must be an Integer between 0 and 7' });
  t.throws(() => {
    stream.peekBit(-1, 1, 0);
  }, { message: 'peekBit position is invalid: -1, must be an Integer between 0 and 7' });

  t.throws(() => {
    stream.peekBit(0, null, 0);
  }, { message: 'peekBit length is invalid: null, must be an Integer between 1 and 8' });
  t.throws(() => {
    stream.peekBit(0, {}, 10);
  }, { message: 'peekBit length is invalid: [object Object], must be an Integer between 1 and 8' });
  t.throws(() => {
    stream.peekBit(0, [], 10);
  }, { message: 'peekBit length is invalid: , must be an Integer between 1 and 8' });
  t.throws(() => {
    stream.peekBit(0, Number.NaN, 0);
  }, { message: 'peekBit length is invalid: NaN, must be an Integer between 1 and 8' });
  t.throws(() => {
    stream.peekBit(0, 9, 0);
  }, { message: 'peekBit length is invalid: 9, must be an Integer between 1 and 8' });
  t.throws(() => {
    stream.peekBit(0, 0, 0);
  }, { message: 'peekBit length is invalid: 0, must be an Integer between 1 and 8' });
});

test('writeUInt8', (t) => {
  const stream = new DataBuffer();
  const values = [10, 160, 20, 29, 119];

  for (const byte of values) {
    stream.writeUInt8(byte);
  }

  t.is(stream.offset, 5);
  stream.writeUInt8(0xFF, 5, false);
  t.is(stream.offset, 5);
  stream.advance(1);

  stream.commit();
  stream.seek(0);

  for (const byte of values) {
    t.is(byte, stream.readUInt8());
  }

  stream.advance(1);
  t.throws(() => stream.readUInt8(), { message: 'Insufficient Bytes: 1' });

  // buffer getter lazy-init with empty data (branch: this.data.length ? Array.from : [])
  const emptyReadOnly = new DataBuffer(new Uint8Array([]));
  emptyReadOnly.writeUInt8(0x42);
  emptyReadOnly.commit();
  emptyReadOnly.seek(0);
  t.is(emptyReadOnly.readUInt8(), 0x42);
});

test('writeUInt16', (t) => {
  const stream = new DataBuffer();
  const values = [0xdead, 0xbeef];

  for (const byte of values) {
    stream.writeUInt16(byte);
  }

  t.is(stream.offset, 4);
  stream.writeUInt16(0xFFFF, 4, false);
  t.is(stream.offset, 4);
  stream.advance(2);

  stream.commit();
  stream.seek(0);

  for (const byte of values) {
    t.is(byte, stream.readUInt16());
  }
  stream.advance(2);

  t.throws(() => stream.readUInt16(), { message: 'Insufficient Bytes: 2' });
});

test('writeUInt16 - littleEndian', (t) => {
  const stream = new DataBuffer();
  const values = [0xDEAD, 0xBEEF];
  const littleEndianValues = [0xADDE, 0xEFBE];

  for (const byte of values) {
    stream.writeUInt16(byte, stream.offset, true, true);
  }

  stream.commit();

  // Read as Big Endian values
  stream.seek(0);
  for (const byte of values) {
    t.is(byte.toString(16), stream.readUInt16(true).toString(16));
  }

  // Read of Little Endian values
  stream.seek(0);
  for (const byte of littleEndianValues) {
    t.is(byte.toString(16), stream.readUInt16().toString(16));
  }

  t.throws(() => stream.readUInt16(), { message: 'Insufficient Bytes: 2' });
});

test('writeUint24', (t) => {
  const stream = new DataBuffer();
  const values = [0xdeadbe, 0xbeefac];

  for (const byte of values) {
    stream.writeUInt24(byte);
  }

  stream.commit();
  stream.seek(0);

  for (const byte of values) {
    t.is(byte, stream.readUInt24());
  }

  t.throws(() => stream.readUInt24(), { message: 'Insufficient Bytes: 3' });
});

test('writeUint24 - littleEndian, no advance', (t) => {
  const stream = new DataBuffer();
  const values = [0xDEADBE, 0xBEEFAC];
  const littleEndianValues = [0xBEADDE, 0xACEFBE];

  let offset = 0;
  for (const byte of values) {
    stream.writeUInt24(byte, offset, false, true);
    offset += 3;
  }
  t.is(stream.offset, 0);

  stream.commit();

  // Read as Big Endian values
  stream.seek(0);
  for (const byte of values) {
    t.is(byte.toString(16), stream.readUInt24(true).toString(16));
  }

  // Read of Little Endian values
  stream.seek(0);
  for (const byte of littleEndianValues) {
    t.is(byte.toString(16), stream.readUInt24().toString(16));
  }

  t.throws(() => stream.readUInt24(), { message: 'Insufficient Bytes: 3' });
});

test('writeUint32', (t) => {
  const stream = new DataBuffer();
  const values = [0xdeadbeef, 0xabacdaba];

  for (const byte of values) {
    stream.writeUInt32(byte);
  }

  stream.commit();
  stream.seek(0);

  for (const byte of values) {
    t.is(byte, stream.readUInt32());
  }

  t.throws(() => stream.readUInt32(), { message: 'Insufficient Bytes: 4' });
});

test('writeUint32 - littleEndian, no advance', (t) => {
  const stream = new DataBuffer();
  const values = [0xDEADBEEF, 0xABACDABA];
  const littleEndianValues = [0xEFBEADDE, 0xBADAACAB];

  let offset = 0;
  for (const byte of values) {
    stream.writeUInt32(byte, offset, false, true);
    offset += 4;
  }
  t.is(stream.offset, 0);

  stream.commit();

  // Read as Big Endian values
  stream.seek(0);
  for (const byte of values) {
    t.is(byte.toString(16), stream.readUInt32(true).toString(16));
  }

  // Read of Little Endian values
  stream.seek(0);
  for (const byte of littleEndianValues) {
    t.is(byte.toString(16), stream.readUInt32().toString(16));
  }

  t.throws(() => stream.readUInt32(), { message: 'Insufficient Bytes: 4' });
});

test('writeBytes', (t) => {
  const stream = new DataBuffer();
  const values = [0xDE, 0xAD, 0xBE, 0xEF, 0xAB, 0xAC, 0xDA, 0xBA];
  const output = [0xDEADBEEF, 0xABACDABA];
  const littleEndianValues = [0xEFBEADDE, 0xBADAACAB];

  stream.writeBytes(values);

  t.is(stream.offset, 8);
  stream.writeBytes(values, stream.offset, false);
  t.is(stream.offset, 8);

  stream.commit();

  // Read as Big Endian values
  stream.seek(0);
  for (const byte of output) {
    t.is(byte.toString(16), stream.readUInt32().toString(16));
  }

  // Read of Little Endian values
  stream.seek(0);
  for (const byte of littleEndianValues) {
    t.is(byte.toString(16), stream.readUInt32(true).toString(16));
  }

  stream.advance(8);
  t.throws(() => stream.readUInt32(), { message: 'Insufficient Bytes: 4' });
});

test('writeString - ASCII', (t) => {
  const stream = new DataBuffer();
  const value = 'Woof 🐕';
  // const output = [0xDEADBEEF, 0xABACDABA];
  // const littleEndianValues = [0xEFBEADDE, 0xBADAACAB];

  stream.writeString(value);
  stream.commit();
  stream.seek(0);

  const output = stream.readString(value.length);
  // Check each byte incase we mess up encoding.
  t.is(value[0], output[0]);
  t.is(value[1], output[1]);
  t.is(value[2], output[2]);
  t.is(value[3], output[3]);
  t.is(value[4], output[4]);
  // These values are truncated:
  // t.is(value[5], output[5]);
  // t.is(value[5], output[5]);
});

test('writeString - UTF-8', (t) => {
  const stream = new DataBuffer();
  const value = 'Woof 🐕';

  stream.writeString(value, stream.offset, 'utf8');
  stream.commit();
  stream.seek(0);

  const output = stream.readString(Buffer.byteLength(value, 'utf8'), 'utf8');
  // Check each byte incase we mess up encoding.
  t.is(value[0], output[0]);
  t.is(value[1], output[1]);
  t.is(value[2], output[2]);
  t.is(value[3], output[3]);
  t.is(value[4], output[4]);
  t.is(value[5], output[5]);
  t.is(value[6], output[6]);
  t.is(value, output);
});

test('writeString - UTF-8 Branches', (t) => {
  const stream = new DataBuffer();
  const value = `${String.fromCharCode(0x7FF)}${String.fromCharCode(0xD7FF)}${String.fromCharCode(0xE000)}`;

  stream.writeString(value, stream.offset, 'utf8');
  stream.commit();
  stream.seek(0);

  // NOTE: In a browser without Buffer: (new TextEncoder().encode(value)).length
  const output = stream.readString(Buffer.byteLength(value, 'utf-8'), 'utf8');
  // Check each byte incase we mess up encoding.
  t.is(value[0], output[0]);
  t.is(value[1], output[1]);
  t.is(value[2], output[2]);
  t.is(value, output);
});

test('writeString - UTF16BE', (t) => {
  const stream = new DataBuffer();
  const value = 'Woof 🐕';

  stream.writeString(value, stream.offset, 'utf16be');
  stream.commit();
  stream.seek(0);

  // NOTE: In a browser without Buffer: (new TextEncoder().encode(value)).length
  const output = stream.readString(stream.length, 'utf16be');
  // Check each byte incase we mess up encoding.
  t.is(value[0], output[0]);
  t.is(value[1], output[1]);
  t.is(value[2], output[2]);
  t.is(value[3], output[3]);
  t.is(value[4], output[4]);
  t.is(value[5], output[5]);
  t.is(value[6], output[6]);
  t.is(value, output);
});

test('writeString - UTF16LE', (t) => {
  const stream = new DataBuffer();
  const value = 'Woof 🐕';

  stream.writeString(value, stream.offset, 'utf16le');
  stream.commit();
  stream.seek(0);

  // NOTE: In a browser without Buffer: (new TextEncoder().encode(value)).length
  const output = stream.readString(stream.length, 'utf16le');
  // Check each byte incase we mess up encoding.
  t.is(value[0], output[0]);
  t.is(value[1], output[1]);
  t.is(value[2], output[2]);
  t.is(value[3], output[3]);
  t.is(value[4], output[4]);
  t.is(value[5], output[5]);
  t.is(value[6], output[6]);
  t.is(value, output);
});

test('writeString - Unknown Encoding', (t) => {
  const stream = new DataBuffer();
  const value = 'Woof 🐕';

  t.throws(() => stream.writeString(value, stream.offset, 'magic'), { message: 'Unknown Encoding: magic' });
});

test('isNextBytes: no input provided', (t) => {
  const stream = new DataBuffer();
  t.false(stream.isNextBytes(null));
  t.false(stream.isNextBytes(undefined));
  t.false(stream.isNextBytes([]));
  t.false(stream.isNextBytes({}));
});

test('isNextBytes: can compare against upcoming data', (t) => {
  const stream = new DataBuffer([10, 160, 20, 29, 119]);

  t.is(stream.isNextBytes(null), false);
  t.is(stream.isNextBytes(undefined), false);
  t.is(stream.isNextBytes({}), false);
  t.is(stream.isNextBytes([]), false);
  t.is(stream.isNextBytes([11]), false);

  t.is(stream.isNextBytes([10]), true);
  t.is(stream.isNextBytes([10, 160]), true);
  t.is(stream.isNextBytes([10, 160, 20]), true);
  t.is(stream.isNextBytes([10, 160, 20, 29]), true);
  t.is(stream.isNextBytes([]), false);
  t.is(stream.isNextBytes([11]), false);

  t.is(stream.isNextBytes([10]), true);
  t.is(stream.isNextBytes([10, 160]), true);
  t.is(stream.isNextBytes([10, 160, 20]), true);
  t.is(stream.isNextBytes([10, 160, 20, 29]), true);
  t.is(stream.isNextBytes([10, 160, 20, 29, 119]), true);
  t.notThrows(() => {
    stream.isNextBytes([10, 160, 20, 29, 119, 255]);
  });
  t.is(stream.isNextBytes([10, 160, 20, 29, 119, 255]), false);
});

test('diff: identical buffers', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);

  const edits = buf1.diff(buf2);

  t.is(edits.length, 4);
  for (const edit of edits) {
    t.is(edit.op, Op.Match);
  }
});

test('diff: empty buffers', (t) => {
  const buf1 = new DataBuffer([]);
  const buf2 = new DataBuffer([]);

  const edits = buf1.diff(buf2);

  t.is(edits.length, 0);
});

test('diff: completely different buffers', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03]);
  const buf2 = new DataBuffer([0xAA, 0xBB, 0xCC]);

  const edits = buf1.diff(buf2);

  // Should have 3 delete + 3 insert operations
  t.true(edits.length >= 3);
  const deleteOps = edits.filter(e => e.op === Op.Delete);
  const insertOps = edits.filter(e => e.op === Op.Insert);
  t.is(deleteOps.length, 3);
  t.is(insertOps.length, 3);
});

test('diff: buffer with single byte change', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0x04]);

  const edits = buf1.diff(buf2);

  // Should have matches, and one delete + insert for the changed byte
  const matchOps = edits.filter(e => e.op === Op.Match);
  const deleteOps = edits.filter(e => e.op === Op.Delete);
  const insertOps = edits.filter(e => e.op === Op.Insert);

  t.is(matchOps.length, 3); // Bytes at positions 0, 2, 3 match
  t.is(deleteOps.length, 1); // One byte deleted (0x02)
  t.is(insertOps.length, 1); // One byte inserted (0xFF)

  // Check the changed byte
  const deleteEdit = deleteOps[0];
  const insertEdit = insertOps[0];
  t.is(deleteEdit.x, 0x02);
  t.is(insertEdit.y, 0xFF);
});

test('diff: shorter buffer', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03]);

  const edits = buf1.diff(buf2);

  const matchOps = edits.filter(e => e.op === Op.Match);
  const deleteOps = edits.filter(e => e.op === Op.Delete);

  t.is(matchOps.length, 3); // First 3 bytes match
  t.is(deleteOps.length, 2); // Last 2 bytes deleted
});

test('diff: longer buffer', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05]);

  const edits = buf1.diff(buf2);

  const matchOps = edits.filter(e => e.op === Op.Match);
  const insertOps = edits.filter(e => e.op === Op.Insert);

  t.is(matchOps.length, 3); // First 3 bytes match
  t.is(insertOps.length, 2); // 2 bytes inserted

  // Check the inserted bytes
  const inserts = insertOps.map(e => e.y);
  t.deepEqual(inserts, [0x04, 0x05]);
});

test('diff: with offset', (t) => {
  const buf1 = new DataBuffer([0xFF, 0xFF, 0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);

  // Compare starting from offset 2 in buf1
  const edits = buf1.diff(buf2, 2);

  // Should match all 4 bytes when comparing from offset 2
  t.is(edits.length, 4);
  for (const edit of edits) {
    t.is(edit.op, Op.Match);
  }
});

test('diff: accepts different input types', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03]);

  // Test with array
  const edits1 = buf1.diff([0x01, 0x02, 0x03]);
  t.is(edits1.filter(e => e.op === Op.Match).length, 3);

  // Test with Uint8Array
  const edits2 = buf1.diff(new Uint8Array([0x01, 0x02, 0x03]));
  t.is(edits2.filter(e => e.op === Op.Match).length, 3);

  // Test with Buffer
  const edits3 = buf1.diff(Buffer.from([0x01, 0x02, 0x03]));
  t.is(edits3.filter(e => e.op === Op.Match).length, 3);
});

test('diff: multiple changes', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0xAA, 0x05, 0xBB]);

  const edits = buf1.diff(buf2);

  // Should have 3 matches and 6 changes (3 deletes + 3 inserts)
  const matchOps = edits.filter(e => e.op === Op.Match);
  const deleteOps = edits.filter(e => e.op === Op.Delete);
  const insertOps = edits.filter(e => e.op === Op.Insert);

  t.is(matchOps.length, 3); // Bytes at positions 0, 2, 4
  t.is(deleteOps.length, 3); // Changed bytes: 0x02, 0x04, 0x06
  t.is(insertOps.length, 3); // New bytes: 0xFF, 0xAA, 0xBB
});

// Regression coverage for bounds, ownership, write state, and bounded Unicode decoding.

test('constructor: invalid lengths and view-like objects are rejected', (t) => {
  for (const length of [-1, 0.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    t.throws(() => new DataBuffer(length), { instanceOf: RangeError });
    t.throws(() => DataBuffer.allocate(length), { instanceOf: RangeError });
  }
  const backing = new ArrayBuffer(8);
  t.throws(() => new DataBuffer(new DataView(backing)), { instanceOf: TypeError });
  t.throws(() => new DataBuffer({ buffer: backing, byteOffset: 1, length: 2, BYTES_PER_ELEMENT: 1 }), { instanceOf: TypeError });
  t.is(new DataBuffer(0).length, 0);
  t.false(new DataBuffer(0).writing);
  t.true(new DataBuffer().writing);
});

test('constructor: ownership and branding remain compatible', (t) => {
  const bytes = new Uint8Array([1, 2, 3]);
  const buffer = new DataBuffer(bytes);
  const shallow = new DataBuffer(buffer);
  t.is(buffer.data, bytes);
  t.is(shallow.data, bytes);
  bytes[0] = 9;
  t.is(buffer.readUInt8(), 9);
  t.is(shallow.readUInt8(), 9);
  const nodeBytes = Buffer.from([1, 2, 3]);
  const nodeBuffer = new DataBuffer(nodeBytes);
  t.not(nodeBuffer.data, nodeBytes);
  nodeBytes[0] = 9;
  t.is(nodeBuffer.readUInt8(), 1);
  const brand = Symbol.for('uttori.DataBuffer');
  t.true(buffer[brand]);
  t.false(Object.getOwnPropertyDescriptor(buffer, brand).enumerable);
  t.is(buffer.nativeEndian, new Uint16Array(new Uint8Array([0x12, 0x34]).buffer)[0] === 0x3412);
});

test('constructor: shared Uint8Array input retains its independent-copy policy', (t) => {
  const shared = new Uint8Array(new SharedArrayBuffer(8), 2, 4);
  shared.set([1, 2, 3, 4]);
  const buffer = new DataBuffer(shared);
  t.not(buffer.data.buffer, shared.buffer);
  shared[0] = 99;
  t.is(buffer.readUInt32(), 0x01020304);
});

for (const backing of ['Uint8Array', 'Buffer']) {
  const make = (bytes) => backing === 'Buffer' ? Buffer.from(bytes) : new Uint8Array(bytes);

  test(`ownership: copies and slices are independent with ${backing}`, (t) => {
    const parent = new DataBuffer(make([1, 2, 3, 4]));
    for (const copy of [parent.copy(), parent.slice(0), parent.slice(0, 100), parent.slice(0, 4)]) {
      t.not(parent.data.buffer, copy.data.buffer);
      t.deepEqual(Array.from(copy.data), [1, 2, 3, 4]);
      copy.data[0] = 9;
      t.is(parent.data[0], 1);
    }
    const partial = parent.slice(1, 2);
    t.deepEqual(Array.from(partial.data), [2, 3]);
    partial.data[0] = 8;
    t.is(parent.data[1], 2);
    t.is(parent.slice(4).length, 0);
    t.is(parent.slice(100).length, 0);
    t.is(parent.slice(0, 0).length, 0);
    t.is(parent.offset, 0);
  });

  test(`ownership: read/peek and readBuffer/peekBuffer copy ${backing}`, (t) => {
    for (const littleEndian of [false, true]) {
      const parent = new DataBuffer(make([1, 2, 3, 4]));
      const peek = parent.peek(3, 0, littleEndian);
      const read = parent.read(3, littleEndian);
      t.is(parent.offset, 3);
      t.deepEqual(Array.from(read), littleEndian ? [3, 2, 1] : [1, 2, 3]);
      peek.fill(0);
      read.fill(0);
      t.deepEqual(Array.from(parent.data), [1, 2, 3, 4]);
      parent.reset();
      parent.peekBuffer(0, 2).data.fill(0);
      parent.readBuffer(2).data.fill(0);
      t.is(parent.offset, 2);
      t.deepEqual(Array.from(parent.data), [1, 2, 3, 4]);
    }
  });

  test(`bounds: invalid peeks cannot escape a ${backing} subview`, (t) => {
    const parent = make([0xAA, 0xBB, 0x11, 0x22, 0xCC, 0xDD]);
    const buffer = new DataBuffer(parent.subarray(2, 4));
    const numeric = ['peekUInt8', 'peekInt8', 'peekUInt16', 'peekInt16', 'peekUInt24', 'peekInt24', 'peekUInt32', 'peekInt32', 'peekFloat32', 'peekFloat48', 'peekFloat64', 'peekFloat80', 'peekFloatIEEE754'];
    for (const offset of [-2, -1, 0.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      for (const method of numeric) {
        t.throws(() => buffer[method](offset), { name: 'UnderflowError' }, `${method} at ${offset}`);
      }
      t.throws(() => buffer.peek(1, offset), { name: 'UnderflowError' });
      t.throws(() => buffer.peekBuffer(offset, 1), { name: 'UnderflowError' });
      t.throws(() => buffer.peekString(offset, 1), { name: 'UnderflowError' });
      t.throws(() => buffer.peekNullTerminatedString(offset), { name: 'UnderflowError' });
      t.throws(() => buffer.peekBit(0, 1, offset), { name: 'UnderflowError' });
    }
    t.is(buffer.peekUInt16(), 0x1122);
    t.throws(() => buffer.peekUInt16(1), { name: 'UnderflowError' });
    t.is(buffer.offset, 0);
  });

  test(`numeric: unaligned ${backing} subviews match DataView`, (t) => {
    const bytes = make(Array.from({ length: 35 }, (_, i) => (i * 73 + 17) & 0xFF));
    const buffer = new DataBuffer(bytes.subarray(3, 30));
    const native = new DataView(buffer.data.buffer, buffer.data.byteOffset, buffer.data.byteLength);
    const methods = [['UInt8', 'getUint8', 1], ['Int8', 'getInt8', 1], ['UInt16', 'getUint16', 2], ['Int16', 'getInt16', 2], ['UInt32', 'getUint32', 4], ['Int32', 'getInt32', 4], ['Float32', 'getFloat32', 4], ['Float64', 'getFloat64', 8]];
    for (const [suffix, getter, width] of methods) {
      for (const littleEndian of [false, true]) {
        for (let offset = 0; offset <= buffer.length - width; offset++) {
          const expected = native[getter](offset, littleEndian);
          const oldOffset = buffer.offset;
          t.is(buffer[`peek${suffix}`](offset, littleEndian), expected);
          t.is(buffer.offset, oldOffset);
          buffer.seek(offset);
          t.is(buffer[`read${suffix}`](littleEndian), expected);
          t.is(buffer.offset, offset + width);
        }
      }
    }
  });
}

test('bounds: byte counts and zero-length boundaries are validated', (t) => {
  const buffer = new DataBuffer([1, 2, 3]);
  for (const bytes of [-1, 0.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    t.false(buffer.available(bytes));
    t.false(buffer.availableAt(bytes, 0));
    t.throws(() => buffer.read(bytes), { name: 'UnderflowError' });
    t.throws(() => buffer.peek(bytes), { name: 'UnderflowError' });
    t.throws(() => buffer.readBuffer(bytes), { name: 'UnderflowError' });
    t.throws(() => buffer.peekBuffer(0, bytes), { name: 'UnderflowError' });
    t.throws(() => buffer.readString(bytes), { name: 'UnderflowError' });
    t.throws(() => buffer.advance(bytes), { instanceOf: RangeError });
    t.throws(() => buffer.rewind(bytes), { instanceOf: RangeError });
    t.throws(() => buffer.slice(0, bytes), { instanceOf: RangeError });
    t.throws(() => buffer.slice(bytes), { instanceOf: RangeError });
    t.is(buffer.offset, 0);
  }
  buffer.seek(3);
  t.true(buffer.available(0));
  t.true(buffer.availableAt(0, 3));
  t.false(buffer.availableAt(0, 4));
  t.is(buffer.read(0).length, 0);
  t.is(buffer.readBuffer(0).length, 0);
  t.is(buffer.peek(0, 3).length, 0);
  t.is(buffer.readString(0), '');
  t.is(buffer.readString(), '');
  t.is(buffer.readNullTerminatedString(), '');
  t.is(buffer.offset, 3);
});

test('bounds: invalid and corrupted cursors do not silently succeed', (t) => {
  const buffer = new DataBuffer([1, 2, 3, 4]);
  const methods = ['readUInt8', 'readInt8', 'readUInt16', 'readInt16', 'readUInt24', 'readInt24', 'readUInt32', 'readInt32', 'readFloat32', 'readFloat48', 'readFloat64', 'readFloat80', 'readFloatIEEE754'];
  for (const offset of [-1, 0.5, Number.NaN, Infinity, -Infinity]) {
    buffer.offset = offset;
    for (const method of methods) {
      t.throws(() => buffer[method](), { name: 'UnderflowError' });
      t.is(buffer.offset, offset);
    }
    t.throws(() => buffer.advance(0), { instanceOf: RangeError });
    t.throws(() => buffer.rewind(0), { instanceOf: RangeError });
    t.throws(() => buffer.seek(0), { instanceOf: RangeError });
    buffer.reset();
    t.is(buffer.offset, 0);
    t.throws(() => buffer.seek(offset), { instanceOf: RangeError });
  }
  buffer.offset = 10;
  t.throws(() => buffer.seek(10), { name: 'UnderflowError' });
  buffer.reset();
  buffer.advance(4);
  t.throws(() => buffer.advance(1), { name: 'UnderflowError' });
  t.is(buffer.offset, 4);
});

test('writing mode: growth is allowed but uncommitted bytes are never readable', (t) => {
  const buffer = new DataBuffer();
  t.true(buffer.available(10));
  t.true(buffer.availableAt(10, 10));
  t.false(buffer.available(1, false));
  t.false(buffer.availableAt(1, 0, false));
  t.false(buffer.availableAt(1, -1));
  t.false(buffer.availableAt(1, Number.MAX_SAFE_INTEGER));
  t.false(buffer.available(-1));
  t.throws(() => buffer.readUInt8(), { name: 'UnderflowError' });
  t.throws(() => buffer.peekUInt8(), { name: 'UnderflowError' });
  t.throws(() => buffer.read(2, true), { name: 'UnderflowError' });
  t.throws(() => buffer.readBuffer(1), { name: 'UnderflowError' });
  t.false(buffer.isNextBytes([0]));
  t.false(buffer.compare([0]));
  t.is(buffer.offset, 0);
  buffer.writeUInt32(0x12345678);
  buffer.reset();
  t.throws(() => buffer.readUInt32(), { name: 'UnderflowError' });
  t.is(buffer.offset, 0);
  buffer.seek(100);
  t.is(buffer.offset, 100);
  buffer.rewind(100);
  buffer.commit();
  t.false(buffer.writing);
  t.is(buffer.readUInt32(), 0x12345678);
});

for (const suffix of ['UInt24', 'Int24']) {
  for (const littleEndian of [false, true]) {
    test(`read${suffix}: complete preflight and cursor preservation, littleEndian=${littleEndian}`, (t) => {
      for (const remaining of [0, 1, 2]) {
        const buffer = new DataBuffer(new Uint8Array(remaining + 1));
        buffer.seek(1);
        t.throws(() => buffer[`read${suffix}`](littleEndian), { name: 'UnderflowError', message: 'Insufficient Bytes: 3' });
        t.is(buffer.offset, 1);
        t.throws(() => buffer[`peek${suffix}`](1, littleEndian), { name: 'UnderflowError', message: 'Insufficient Bytes: 1 + 3' });
        t.is(buffer.offset, 1);
      }
    });
  }
}

test('numeric: cached DataView follows replacement data and committed writes', (t) => {
  const buffer = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const keys = Reflect.ownKeys(buffer);
  t.is(buffer.peekUInt32(), 0x01020304);
  t.deepEqual(Reflect.ownKeys(buffer), keys);
  t.deepEqual(buffer, new DataBuffer([0x01, 0x02, 0x03, 0x04]));
  buffer.data[0] = 0xAA;
  t.is(buffer.peekUInt32(), 0xAA020304);
  const bytes = new Uint8Array([0xEE, 0x10, 0x20, 0x30, 0x40, 0xDD]);
  buffer.data = bytes.subarray(1, 5);
  t.is(buffer.peekUInt32(), 0x10203040);
  buffer.data = bytes.subarray(2, 6);
  t.is(buffer.peekUInt32(), 0x203040DD);
  buffer.writeUInt32(0xFFFFFFFF, 0, false);
  t.is(buffer.peekUInt32(), 0x203040DD);
  buffer.commit();
  t.is(buffer.peekUInt32(), 0xFFFFFFFF);
  buffer.data = new Uint8Array([7]);
  t.throws(() => buffer.peekUInt32(), { name: 'UnderflowError' });
  t.is(buffer.peekInt8(), 7);
});

test('numeric: cached DataView handles resizable and detached ArrayBuffers', (t) => {
  const backing = new ArrayBuffer(12, { maxByteLength: 32 });
  const data = new Uint8Array(backing);
  data.set([1, 2, 3, 4, 5, 6, 7, 8]);
  const buffer = new DataBuffer(data);
  t.is(buffer.peekUInt32(), 0x01020304);
  backing.resize(2);
  t.is(buffer.peekUInt16(), 0x0102);
  t.throws(() => buffer.peekUInt32(), { name: 'UnderflowError' });
  backing.resize(24);
  data.set([9, 10, 11, 12], 20);
  t.is(buffer.peekUInt32(20), 0x090A0B0C);
  backing.resize(0);
  t.throws(() => buffer.peekUInt8(), { name: 'UnderflowError' });
  backing.resize(8);
  data.set([0xAB, 0xCD, 0xEF, 0x12]);
  t.is(buffer.peekUInt32(), 0xABCDEF12);
  structuredClone(backing, { transfer: [backing] });
  t.throws(() => buffer.readUInt8(), { name: 'UnderflowError' });
  t.throws(() => buffer.peekUInt32(), { name: 'UnderflowError' });
  t.is(buffer.offset, 0);
});

test('numeric: fixed-length resizable subviews recover after becoming out of bounds', (t) => {
  const backing = new ArrayBuffer(16, { maxByteLength: 32 });
  const data = new Uint8Array(backing, 4, 8);
  data.set([1, 2, 3, 4]);
  const buffer = new DataBuffer(data);
  t.is(buffer.peekUInt32(), 0x01020304);
  backing.resize(6);
  t.throws(() => buffer.peekUInt16(), { name: 'UnderflowError' });
  backing.resize(16);
  data.set([5, 6, 7, 8]);
  t.is(buffer.peekUInt32(), 0x05060708);
});

test('float48: explicit endian flags work independently of nativeEndian', (t) => {
  const be = [0x74, 0x23, 0xF4, 0x00, 0xD2, 0x94];
  for (const nativeEndian of [false, true]) {
    for (const littleEndian of [false, true]) {
      const bytes = littleEndian ? [...be].reverse() : be;
      const buffer = new DataBuffer(bytes);
      buffer.nativeEndian = nativeEndian;
      t.is(buffer.peekFloat48(0, littleEndian), 999999.2502);
      t.is(buffer.offset, 0);
      t.is(buffer.readFloat48(littleEndian), 999999.2502);
      t.is(buffer.offset, 6);
    }
  }
});

test('float80: existing byte-reversal flag also works with unaligned Buffer data', (t) => {
  const be = [0x3F, 0xFF, 0x80, 0, 0, 0, 0, 0, 0, 0];
  const buffer = new DataBuffer([]);
  buffer.data = Buffer.from([99, ...be.toReversed(), 99]).subarray(1, 11);
  t.is(buffer.peekFloat80(0, false), 1);
  t.is(buffer.readFloat80(false), 1);
});

test('peekBit: exhaustive single-byte extraction preserves right-side zero filling', (t) => {
  const buffer = new DataBuffer([0]);
  for (let byte = 0; byte <= 255; byte++) {
    buffer.data[0] = byte;
    const bits = byte.toString(2).padStart(8, '0');
    for (let position = 0; position <= 7; position++) {
      for (let length = 1; length <= 8; length++) {
        const expected = Number.parseInt(bits.slice(position, position + length).padEnd(length, '0'), 2);
        t.is(buffer.peekBit(position, length), expected);
      }
    }
  }
  t.is(buffer.offset, 0);
});

const writeCases = [
  ['writeUInt8', 0x12, [0x12]],
  ['writeUInt16', 0x1234, [0x12, 0x34]],
  ['writeUInt24', 0x123456, [0x12, 0x34, 0x56]],
  ['writeUInt32', 0x89ABCDEF, [0x89, 0xAB, 0xCD, 0xEF]],
  ['writeBytes', [0x12, 0x34], [0x12, 0x34]],
];
for (const [method, value, bytes] of writeCases) {
  test(`${method}: explicit offsets determine the resulting cursor`, (t) => {
    const buffer = new DataBuffer();
    buffer.offset = 3;
    buffer[method](value, 10);
    t.is(buffer.offset, 10 + bytes.length);
    t.deepEqual(buffer.buffer.slice(10), bytes);
    buffer[method](value, 1, true);
    t.is(buffer.offset, 1 + bytes.length);
    buffer[method](value, 6, false);
    t.is(buffer.offset, 1 + bytes.length);
    buffer.commit();
    t.deepEqual(Array.from(buffer.data.slice(10)), bytes);
    t.is(buffer.data[0], 0);
  });

  test(`${method}: invalid offsets fail before initializing or mutating staging`, (t) => {
    for (const offset of [-1, 0.25, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER, 0xFFFFFFFF, 0xFFFFFFFF - bytes.length + 1]) {
      const buffer = new DataBuffer([1, 2, 3]);
      t.is(buffer._buffer, null);
      t.throws(() => buffer[method](value, offset), { instanceOf: RangeError });
      t.is(buffer._buffer, null);
      t.is(buffer.offset, 0);
      t.deepEqual(Array.from(buffer.data), [1, 2, 3]);
      const staging = buffer.buffer;
      t.throws(() => buffer[method](value, offset, false), { instanceOf: RangeError });
      t.is(buffer.buffer, staging);
      t.deepEqual(staging, [1, 2, 3]);
    }
  });
}

test('writeString: explicit offsets and advance=false match the byte writers', (t) => {
  const buffer = new DataBuffer();
  buffer.offset = 2;
  buffer.writeString('é', 10, 'utf8');
  t.is(buffer.offset, 12);
  t.deepEqual(buffer.buffer.slice(10), [0xC3, 0xA9]);
  buffer.writeString('AB', 1, 'ascii');
  t.is(buffer.offset, 3);
  buffer.writeString('C', 5, 'ascii', false);
  t.is(buffer.offset, 3);
  const staging = buffer.buffer.slice();
  for (const offset of [-1, 0.5, Number.NaN, Infinity, 0xFFFFFFFF]) {
    t.throws(() => buffer.writeString('A', offset), { instanceOf: RangeError });
    t.deepEqual(buffer.buffer, staging);
    t.is(buffer.offset, 3);
  }
});

test('writeBytes: overlapping staging input is snapshotted before writes', (t) => {
  for (const offset of [0, 1, 2, 3, 8]) {
    const buffer = new DataBuffer([1, 2, 3]);
    const staging = buffer.buffer;
    const expected = [1, 2, 3];
    for (let i = 0; i < 3; i++) expected[offset + i] = i + 1;
    buffer.writeBytes(staging, offset);
    t.is(buffer.buffer, staging);
    t.deepEqual(buffer.buffer, expected);
    t.is(buffer.offset, offset + 3);
    buffer.commit();
    t.deepEqual(buffer.data, new Uint8Array(expected));
  }
});

test('staging: lazy snapshots, commit, public mutation, and repeated writes stay compatible', (t) => {
  const source = new Uint8Array([1, 2, 3]);
  const buffer = new DataBuffer(source);
  t.is(buffer._buffer, null);
  source[0] = 9;
  const staging = buffer.buffer;
  t.deepEqual(staging, [9, 2, 3]);
  source[1] = 8;
  staging[2] = 7;
  staging.push(6);
  t.is(buffer.peekUInt8(1), 8);
  t.is(buffer.peekUInt8(2), 3);
  t.is(buffer.length, 3);
  buffer.commit();
  t.is(buffer._buffer, null);
  t.false(buffer.writing);
  t.deepEqual(Array.from(buffer.data), [9, 2, 7, 6]);
  t.deepEqual(Array.from(source), [9, 8, 3]);
  t.is(buffer.lengthInBytes, 4);
  const committed = buffer.data;
  buffer.writeUInt8(5, 0, false);
  t.is(buffer.data, committed);
  t.is(buffer.peekUInt8(), 9);
  buffer.commit();
  t.is(buffer.peekUInt8(), 5);
  t.is(buffer.lengthInBytes, 4);
  t.is(buffer.offset, 0);
  buffer.commit();
  t.deepEqual(Array.from(buffer.data), [5, 2, 7, 6]);
});

test('commit: metadata tracks appended bytes, sparse writes, and empty files', (t) => {
  const buffer = new DataBuffer();
  buffer.writeUInt16(0x1234, 5);
  t.is(buffer.lengthInBytes, 0);
  t.is(buffer.offset, 7);
  buffer.commit();
  t.is(buffer.lengthInBytes, 7);
  t.is(buffer.length, 7);
  t.is(buffer.offset, 7);
  t.deepEqual(Array.from(buffer.data), [0, 0, 0, 0, 0, 0x12, 0x34]);
  buffer.buffer.length = 0;
  buffer.commit();
  t.is(buffer.lengthInBytes, 0);
  t.is(buffer.length, 0);
  t.is(buffer.offset, 7);
  buffer.reset();
  t.throws(() => buffer.readUInt8(), { name: 'UnderflowError' });
});

test('writes: wider typed arrays remain element-wise and stage original numeric values', (t) => {
  for (const input of [new Uint16Array([0x1234, 0xABCD]), new Int16Array([-1, -128]), new Uint32Array([0x89ABCDEF, 0x12345678]), new Int32Array([-1, -2147483648])]) {
    const buffer = new DataBuffer();
    buffer.writeBytes(input);
    t.deepEqual(buffer.buffer, Array.from(input));
    t.is(buffer.offset, input.length);
    buffer.commit();
    t.deepEqual(buffer.data, new Uint8Array(Array.from(input)));
    const readOnly = new DataBuffer(input);
    t.is(readOnly.length, input.byteLength);
    t.deepEqual(readOnly.data, new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
  }
  const buffer = new DataBuffer();
  buffer.writeUInt8(0x1234);
  buffer.writeUInt8(-1);
  t.deepEqual(buffer.buffer, [0x1234, -1]);
  buffer.commit();
  t.deepEqual(Array.from(buffer.data), [0x34, 0xFF]);
});

test('writeUInt32: staged high bytes are unsigned in both endian orders', (t) => {
  for (const littleEndian of [false, true]) {
    const buffer = new DataBuffer();
    buffer.writeUInt32(0x89ABCDEF, 0, true, littleEndian);
    t.deepEqual(buffer.buffer, littleEndian ? [0xEF, 0xCD, 0xAB, 0x89] : [0x89, 0xAB, 0xCD, 0xEF]);
    t.true(buffer.buffer.every(byte => byte >= 0 && byte <= 0xFF));
  }
});

test('empty writes: do not initialize staging but still honor an explicit advancing offset', (t) => {
  const buffer = new DataBuffer([1, 2, 3]);
  buffer.writeBytes([], 2);
  t.is(buffer.offset, 2);
  t.is(buffer._buffer, null);
  buffer.writeString('', 1);
  t.is(buffer.offset, 1);
  t.is(buffer._buffer, null);
  buffer.writeBytes([], 0, false);
  t.is(buffer.offset, 1);
  t.is(buffer._buffer, null);
});

test('compare: preserves region matching, input conversion, empty and insufficient cases', (t) => {
  const buffer = new DataBuffer([0xAA, 1, 2, 3, 0xBB]);
  buffer.seek(2);
  for (const input of [new DataBuffer([1, 2, 3]), [1, 2, 3], new Uint8Array([1, 2, 3]), Buffer.from([1, 2, 3]), new Uint8Array([1, 2, 3]).buffer]) {
    t.true(buffer.compare(input, 1));
    t.false(buffer.compare(input));
    t.false(buffer.compare(input, 3));
  }
  t.true(buffer.compare(buffer));
  t.true(buffer.compare(buffer.data));
  t.true(buffer.compare([0x101, 0x102], 1));
  t.false(buffer.compare([]));
  t.false(buffer.compare(undefined));
  for (const offset of [-1, 0.5, Number.NaN, Infinity, 6]) {
    t.false(buffer.compare([1], offset));
  }
  t.is(buffer.offset, 2);
  t.is(buffer._buffer, null);
  const letters = new DataBuffer('xABCy');
  t.true(letters.compare('ABC', 1));
  t.true(new DataBuffer([0, 0, 7]).compare(2));
  t.false(new DataBuffer([0, 0, 7]).compare(3));
});

test('diff: offset bounds and independent outputs with direct Buffer input', (t) => {
  const buffer = new DataBuffer([1, 2, 3]);
  for (const offset of [-1, 0.5, Number.NaN, Infinity, 4]) {
    t.throws(() => buffer.diff([1], offset), { name: 'UnderflowError' });
  }
  const input = Buffer.from([1, 2, 3]);
  const output = buffer.diff(input);
  input[0] = 9;
  t.is(output[0].x, 1);
  t.is(output[0].y, 1);
  t.is(buffer.diff([], 3).length, 0);
  t.is(buffer.offset, 0);
  t.is(buffer._buffer, null);
});

test('strings: zero, omitted, null, and explicit-offset lengths have distinct behavior', (t) => {
  const buffer = new DataBuffer([65, 0, 66, 67, 0, 68]);
  buffer.seek(2);
  t.is(buffer.readString(0), '');
  t.is(buffer.offset, 2);
  t.is(buffer.peekString(0), 'A\0BC\0D');
  t.is(buffer.peekString(3), 'C\0D');
  t.is(buffer.offset, 2);
  t.is(buffer.readString(null), 'BC');
  t.is(buffer.offset, 5);
  t.is(buffer.readUInt8(), 68);
  buffer.reset();
  t.is(buffer.readString(), 'A\0BC\0D');
  t.is(buffer.offset, 6);
  buffer.reset();
  t.is(buffer.decodeString(2, 2, 'ascii', true), 'BC');
  t.is(buffer.offset, 4);
  t.is(buffer.decodeNullTerminatedString(0, 'ascii', true), 'A');
  t.is(buffer.offset, 2);
});

test('strings: unknown encodings throw consistently without reading or writing', (t) => {
  const buffer = new DataBuffer([65, 0]);
  const operations = [
    () => buffer.readString(1, 'MAGIC'),
    () => buffer.peekString(0, 1, 'MAGIC'),
    () => buffer.readString(null, 'MAGIC'),
    () => buffer.peekString(0, null, 'MAGIC'),
    () => buffer.readNullTerminatedString('MAGIC'),
    () => buffer.peekNullTerminatedString(0, 'MAGIC'),
    () => buffer.writeString('A', 0, 'MAGIC'),
    () => buffer.readString(0, 'MAGIC'),
  ];
  for (const operation of operations) {
    t.throws(operation, { message: 'Unknown Encoding: magic' });
    t.is(buffer.offset, 0);
    t.is(buffer._buffer, null);
  }
});

for (const encoding of ['ascii', 'latin1', 'utf8', 'utf-8', 'utf16be', 'utf16-be', 'utf16le', 'utf16-le', 'utf16bom', 'utf16-bom']) {
  test(`strings: ${encoding} aliases are case-insensitive across all APIs`, (t) => {
    const buffer = new DataBuffer();
    buffer.writeString('AB', 0, encoding.toUpperCase());
    const length = buffer.offset;
    buffer.writeBytes(encoding.startsWith('utf16') ? [0, 0] : [0]);
    buffer.commit();
    buffer.reset();
    t.is(buffer.peekString(0, length, encoding.toUpperCase()), 'AB');
    t.is(buffer.peekNullTerminatedString(0, encoding.toUpperCase()), 'AB');
    t.is(buffer.readNullTerminatedString(encoding.toUpperCase()), 'AB');
    t.is(buffer.offset, buffer.length);
    buffer.reset();
    t.is(buffer.readString(null, encoding.toUpperCase()), 'AB');
    t.is(buffer.offset, buffer.length);
    buffer.reset();
    t.is(buffer.readString(length, encoding.toUpperCase()), 'AB');
    t.is(buffer.offset, length);
  });
}

test('strings: ASCII and Latin-1 preserve every byte including 0x80–0x9F', (t) => {
  const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
  const expected = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  for (const encoding of ['ascii', 'latin1']) {
    const buffer = new DataBuffer(bytes);
    t.is(buffer.readString(256, encoding), expected);
    const writer = new DataBuffer();
    writer.writeString(expected, 0, encoding);
    writer.commit();
    t.deepEqual(writer.data, bytes);
  }
});

test('strings: malformed UTF-8 matches bounded TextDecoder replacement behavior', (t) => {
  const reference = new TextDecoder('utf-8', { ignoreBOM: true });
  const cases = [
    [0xC0, 0xAF], [0xC1, 0xBF], [0x80], [0xBF], [0xFF], [0xF5, 0x80, 0x80, 0x80],
    [0xE0, 0x80, 0xAF], [0xED, 0xA0, 0x80], [0xF4, 0x90, 0x80, 0x80],
    [0xC2], [0xE2, 0x82], [0xF0, 0x9F, 0x91], [0xC2, 65], [0xE2, 0x82, 65],
    [0xF0, 0x9F, 0x91, 65], [0xEF, 0xBB, 0xBF, 65], [0xF4, 0x8F, 0xBF, 0xBF],
  ];
  for (const bytes of cases) {
    const expected = reference.decode(new Uint8Array(bytes));
    const buffer = new DataBuffer([...bytes, 0, 66]);
    t.is(buffer.peekString(0, bytes.length, 'utf8'), expected);
    t.is(buffer.offset, 0);
    t.is(buffer.readString(bytes.length, 'utf8'), expected);
    t.is(buffer.offset, bytes.length);
    buffer.reset();
    t.is(buffer.readNullTerminatedString('utf8'), expected);
    t.is(buffer.offset, bytes.length + 1);
    t.is(buffer.readUInt8(), 66);
  }
  const buffer = new DataBuffer([0xC3, 0xA9, 65]);
  t.is(buffer.readString(1, 'utf8'), '\uFFFD');
  t.is(buffer.offset, 1);
  t.is(buffer.readUInt8(), 0xA9);
});

test('strings: UTF-8 writing replaces lone surrogates without losing neighboring characters', (t) => {
  const reference = new TextEncoder();
  for (const value of ['\uD800', '\uDC00', '\uD800A', '\uDC00A', '\uD800\uD800', '\uDC00\uDC00', 'A\uD800B', '\uD83D\uDC4D', '\uDBFF\uDFFF']) {
    const buffer = new DataBuffer();
    buffer.writeString(value, 0, 'utf8');
    buffer.commit();
    t.deepEqual(buffer.data, reference.encode(value));
    t.is(buffer.offset, reference.encode(value).length);
    buffer.reset();
    t.is(buffer.readString(undefined, 'utf8'), new TextDecoder().decode(reference.encode(value)));
  }
});

for (const encoding of ['utf16be', 'utf16le', 'utf16bom']) {
  test(`strings: ${encoding} truncation and invalid surrogates are atomic`, (t) => {
    const order = (units) => units.flatMap(unit => encoding === 'utf16le' ? [unit & 0xFF, unit >>> 8] : [unit >>> 8, unit & 0xFF]);
    for (const units of [[0xDC00], [0xDC00, 0xDC01], [0xD800, 0x0041], [0xD800, 0xD800], [0xD800]]) {
      const bytes = order(units);
      const buffer = new DataBuffer([99, ...bytes, 0, 0, 66, 0]);
      buffer.seek(1);
      t.throws(() => buffer.readString(bytes.length, encoding), { message: 'Invalid utf16 sequence.' });
      t.is(buffer.offset, 1);
      t.throws(() => buffer.readNullTerminatedString(encoding), { message: 'Invalid utf16 sequence.' });
      t.is(buffer.offset, 1);
    }
    const pair = new DataBuffer(order([0xD83D, 0xDC4D]));
    t.throws(() => pair.readString(2, encoding), { message: 'Invalid utf16 sequence.' });
    t.is(pair.offset, 0);
    t.is(pair.readString(4, encoding), '👍');
    const odd = new DataBuffer([65]);
    t.throws(() => odd.readString(1, encoding), { message: 'Invalid utf16 sequence.' });
    t.throws(() => odd.readNullTerminatedString(encoding), { message: 'Invalid utf16 sequence.' });
    t.is(odd.offset, 0);
  });
}

test('strings: UTF-16 BOM handling is bounded and does not discard ordinary characters', (t) => {
  for (const bytes of [[0, 65, 0, 66], [0xFE, 0xFF, 0, 65, 0, 66], [0xFF, 0xFE, 65, 0, 66, 0]]) {
    const buffer = new DataBuffer([99, ...bytes, 0, 0, 99]);
    buffer.seek(1);
    t.is(buffer.peekString(1, bytes.length, 'utf16bom'), 'AB');
    t.is(buffer.readString(null, 'utf16bom'), 'AB');
    t.is(buffer.offset, bytes.length + 3);
    t.is(buffer.readUInt8(), 99);
  }
  const bomOnly = new DataBuffer([0xFE, 0xFF]);
  t.is(bomOnly.readString(2, 'utf16bom'), '');
  t.is(bomOnly.offset, 2);
  bomOnly.reset();
  t.is(bomOnly.readString(0, 'utf16bom'), '');
  t.is(bomOnly.offset, 0);
  const writer = new DataBuffer();
  writer.writeString('', 0, 'utf16bom');
  t.deepEqual(writer.buffer, [0xFE, 0xFF]);
  t.is(writer.offset, 2);
});

test('strings: null terminator validation and missing-terminator behavior', (t) => {
  const buffer = new DataBuffer([65, 0]);
  for (const nullValue of [-1, 0.5, 256, Number.NaN, Infinity]) {
    t.throws(() => buffer.readNullTerminatedString('ascii', nullValue), { instanceOf: RangeError });
    t.is(buffer.offset, 0);
  }
  const missing = new DataBuffer([65, 66]);
  t.is(missing.readString(null), 'AB');
  t.is(missing.offset, 2);
  const utf16 = new DataBuffer([0, 65, 0, 66]);
  t.is(utf16.readNullTerminatedString('utf16be'), 'AB');
  t.is(utf16.offset, 4);
});

test('strings: large fixed and null-terminated strings do not exceed argument limits', (t) => {
  for (const encoding of ['ascii', 'latin1', 'utf8', 'utf16be', 'utf16le', 'utf16bom']) {
    const value = encoding === 'ascii' || encoding === 'latin1' ? 'A'.repeat(200000) : 'Aé日👍'.repeat(40000);
    const buffer = new DataBuffer();
    buffer.writeString(value, 0, encoding);
    const length = buffer.offset;
    buffer.writeBytes(encoding.startsWith('utf16') ? [0, 0] : [0]);
    buffer.commit();
    buffer.reset();
    t.is(buffer.readString(length, encoding), value);
    t.is(buffer.offset, length);
    buffer.reset();
    t.is(buffer.readNullTerminatedString(encoding), value);
    t.is(buffer.offset, buffer.length);
  }
});
