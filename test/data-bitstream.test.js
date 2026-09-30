import test from 'ava';
import { DataBitstream, DataBuffer } from '../dist/index.js';

/**
 * Creates a DataBitstream from an array of bytes.
 * @param {number[]} bytes The bytes to create the DataBitstream from.
 * @returns {DataBitstream} The created DataBitstream.
 */
const makeDataBitstream = (bytes) => DataBitstream.fromBytes(bytes);

const tooLargeError = 'Too Large: 128 bits';

test('fromData / fromBytes', (t) => {
  const bitstream = makeDataBitstream([10, 160]);
  const copy = DataBitstream.fromData(new Uint8Array([10, 160]));

  t.not(copy, bitstream);
  t.deepEqual(copy, bitstream);
});

test('copy', (t) => {
  const bitstream = makeDataBitstream([10, 160]);
  const copy = bitstream.copy();

  t.not(copy, bitstream);
  t.deepEqual(copy, bitstream);
});

test('available', (t) => {
  const bitstream = makeDataBitstream([10, 160]);
  let available = bitstream.available(1);

  t.true(available);

  available = bitstream.available(2);
  t.true(available);

  available = bitstream.available(32);
  t.false(available);
});

test('advance', (t) => {
  const bitstream = makeDataBitstream([10, 160]);

  t.is(bitstream.bitPosition, 0);
  t.is(bitstream.offset(), 0);

  bitstream.advance(2);
  t.is(bitstream.bitPosition, 2);
  t.is(bitstream.offset(), 2);

  bitstream.advance(7);
  t.is(bitstream.bitPosition, 1);
  t.is(bitstream.offset(), 9);

  t.throws(() => bitstream.advance(40), { message: 'Insufficient Bits: 40 <= 7' });
});

test('rewind', (t) => {
  const bitstream = makeDataBitstream([10, 160]);

  t.is(bitstream.bitPosition, 0);
  t.is(bitstream.offset(), 0);

  bitstream.advance(2);
  t.is(bitstream.bitPosition, 2);
  t.is(bitstream.offset(), 2);

  bitstream.rewind(2);
  t.is(bitstream.bitPosition, 0);
  t.is(bitstream.offset(), 0);

  bitstream.advance(10);
  t.is(bitstream.bitPosition, 2);
  t.is(bitstream.offset(), 10);

  bitstream.rewind(4);
  t.is(bitstream.bitPosition, 6);
  t.is(bitstream.offset(), 6);

  t.throws(() => bitstream.rewind(10), { message: 'Insufficient Bits: 10 > 6' });
});

test('seek', (t) => {
  const bitstream = makeDataBitstream([10, 160]);

  t.is(bitstream.bitPosition, 0);
  t.is(bitstream.offset(), 0);

  bitstream.seek(3);
  t.is(bitstream.bitPosition, 3);
  t.is(bitstream.offset(), 3);

  bitstream.seek(10);
  t.is(bitstream.bitPosition, 2);
  t.is(bitstream.offset(), 10);

  bitstream.seek(4);
  t.is(bitstream.bitPosition, 4);
  t.is(bitstream.offset(), 4);

  // Test the no-op `offset === current_offset` else branch.
  bitstream.seek(4);
  t.is(bitstream.bitPosition, 4);
  t.is(bitstream.offset(), 4);

  t.throws(() => bitstream.seek(100), { message: 'Insufficient Bits: 96 <= 12' });

  t.throws(() => bitstream.seek(-10), { message: 'Invalid bit count: -10' });
});

test('align', (t) => {
  const bitstream = makeDataBitstream([10, 160]);

  t.is(bitstream.bitPosition, 0);
  t.is(bitstream.offset(), 0);

  bitstream.align();
  t.is(bitstream.bitPosition, 0);
  t.is(bitstream.offset(), 0);

  bitstream.seek(2);
  bitstream.align();
  t.is(bitstream.bitPosition, 0);
  return t.is(bitstream.offset(), 8);
});

test('read/peek unsigned', (t) => {
  // 0101 1101 0110 1111 1010 1110 1100 1000 -> 0x5D6FAEC8 -> 1567600328
  // 0111 0000 1001 1010 0010 0101 1111 0011 -> 0x709A25F3 -> 1889150451
  // 0101 1101 0110 1111 1010 1110 1100 1000 0111 0000 1001 1010 0010 0101 1111 0011 -> 0x5D6FAEC8709A25F3 -> 6732792143848023539
  let bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70, 0x9A, 0x25, 0xF3]);

  t.is(bitstream.peek(0), 0);

  // 0
  t.is(bitstream.peek(1), 0);
  // 01
  t.is(bitstream.peek(2), 1);
  // 010
  t.is(bitstream.peek(3), 2);
  // 0101
  t.is(bitstream.peek(4), 5);
  // 0101 1
  t.is(bitstream.peek(5), 11);
  // 0101 11
  t.is(bitstream.peek(6), 23);
  // 0101 110
  t.is(bitstream.peek(7), 46);
  // 0101 1101
  t.is(bitstream.peek(8), 93);
  // 0101 1101 0
  t.is(bitstream.peek(9), 186);
  // 0101 1101 01
  t.is(bitstream.peek(10), 373);
  // 0101 1101 011
  t.is(bitstream.peek(11), 747);
  // 0101 1101 0110
  t.is(bitstream.peek(12), 1494);
  // 0101 1101 0110 1111
  t.is(bitstream.peek(16), 23919);
  // 0101 1101 0110 1111 1010
  t.is(bitstream.peek(20), 382714);
  // 0101 1101 0110 1111 1010 1110
  t.is(bitstream.peek(24), 6123438);
  // 0101 1101 0110 1111 1010 1110 1100 100
  t.is(bitstream.peek(31), 783800164);
  // 0101 1101 0110 1111 1010 1110 1100 1000
  t.is(bitstream.peek(32), 1567600328);

  t.is(bitstream.read(0), 0);
  t.is(bitstream.read(2), 1);
  t.is(bitstream.read(4), 7);
  t.is(bitstream.read(10), 367);
  t.is(bitstream.read(16), 0xAEC8);
  t.is(bitstream.read(31), 0x384D12F9);
  t.is(bitstream.read(1), 1);

  bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70]);
  t.is(bitstream.peek(40), 0x5D6FAEC870);
  t.is(bitstream.read(40), 0x5D6FAEC870);

  bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70]);
  t.is(bitstream.read(2), 1);
  t.is(bitstream.peek(33), 0xEB7D7643);
  t.is(bitstream.read(33), 0xEB7D7643);

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(bitstream.peek(4), 0xF);
  t.is(bitstream.peek(8), 0xFF);
  t.is(bitstream.peek(12), 0xFFF);
  t.is(bitstream.peek(16), 0xFFFF);
  t.is(bitstream.peek(20), 0xFFFFF);
  t.is(bitstream.peek(24), 0xFFFFFF);
  t.is(bitstream.peek(28), 0xFFFFFFF);
  t.is(bitstream.peek(32), 0xFFFFFFFF);
  t.is(bitstream.peek(36), 0xFFFFFFFFF);
  t.is(bitstream.peek(40), 0xFFFFFFFFFF);

  t.throws(() => bitstream.read(128), { message: tooLargeError });

  // 101010101010101010101010
  bitstream = makeDataBitstream([0xAA, 0xAA, 0xAA]);
  t.is(bitstream.read(8), 170);
  t.is(bitstream.read(8), 170);
  t.is(bitstream.read(8), 170);
  t.throws(() => bitstream.read(8), { message: 'Insufficient Bits: 8 <= 0' });
});

test('read/peek signed', (t) => {
  // 0101 1101 0110 1111 1010 1110 1100 1000 -> 0x5D6FAEC8 -> 1567600328
  // 0111 0000 1001 1010 0010 0101 1111 0011 -> 0x709A25F3 -> 1889150451
  let bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70, 0x9A, 0x25, 0xF3]);

  t.is(bitstream.read(0, true), 0);
  t.is(bitstream.read(4, true), 5);
  t.is(bitstream.read(4, true), -3);
  t.is(bitstream.read(4, true), 6);
  t.is(bitstream.read(4, true), -1);
  t.is(bitstream.read(8, true), -82);
  t.is(bitstream.read(12, true), -889);
  t.is(bitstream.read(8, true), 9);
  t.is(bitstream.read(19, true), -191751);
  t.is(bitstream.read(1, true), -1);

  bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70, 0x9A, 0x25, 0xF3]);
  bitstream.advance(1);

  t.is(bitstream.peek(35, true), -9278133113);
  t.is(bitstream.read(35, true), -9278133113);

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(bitstream.peek(4, true), -1);
  t.is(bitstream.peek(8, true), -1);
  t.is(bitstream.peek(12, true), -1);
  t.is(bitstream.peek(16, true), -1);
  t.is(bitstream.peek(20, true), -1);
  t.is(bitstream.peek(24, true), -1);
  t.is(bitstream.peek(28, true), -1);
  t.is(bitstream.peek(31, true), -1);
  t.is(bitstream.peek(32, true), -1);
  t.is(bitstream.peek(36, true), -1);
  t.is(bitstream.peek(40, true), -1);

  t.throws(() => bitstream.read(128), { message: tooLargeError });
});

test('readLSB unsigned', (t) => {
  // {      byte 1   }{    byte 2   }
  // {  3   2      1 }{       3     }
  // { [1111] [1100] }{ [0000 1000] } -> 0xFC08
  let bitstream = makeDataBitstream([0xFC, 0x08]);

  t.is(bitstream.peekLSB(0), 0);
  t.is(bitstream.readLSB(0), 0);

  t.is(bitstream.peekLSB(4), 12);
  t.is(bitstream.readLSB(4), 12);

  t.is(bitstream.peekLSB(3), 7);
  t.is(bitstream.readLSB(3), 7);

  t.is(bitstream.peekLSB(9), 0x11);
  t.is(bitstream.readLSB(9), 0x11);

  //      4            3           2           1
  // [0111 0000] [1001 1010] [0010 0101] [1111 0011] -> 0x709a25f3
  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xF3]);
  t.is(bitstream.peekLSB(32), 0xF3259A70);
  t.is(bitstream.peekLSB(31), 0x73259A70);
  t.is(bitstream.readLSB(31), 0x73259A70);

  t.is(bitstream.peekLSB(1), 1);
  t.is(bitstream.readLSB(1), 1);

  bitstream = makeDataBitstream([0xC8, 0x70, 0x9A, 0x25, 0xF3]);
  t.is(bitstream.peekLSB(40), 0xF3259A70C8);
  t.is(bitstream.readLSB(40), 0xF3259A70C8);

  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xFF, 0xF3]);
  t.is(bitstream.peekLSB(40), 0xF3FF259A70);
  t.is(bitstream.readLSB(40), 0xF3FF259A70);

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(bitstream.peekLSB(4), 0xF);
  t.is(bitstream.peekLSB(8), 0xFF);
  t.is(bitstream.peekLSB(12), 0xFFF);
  t.is(bitstream.peekLSB(16), 0xFFFF);
  t.is(bitstream.peekLSB(20), 0xFFFFF);
  t.is(bitstream.peekLSB(24), 0xFFFFFF);
  t.is(bitstream.peekLSB(28), 0xFFFFFFF);
  t.is(bitstream.peekLSB(32), 0xFFFFFFFF);
  t.is(bitstream.peekLSB(36), 0xFFFFFFFFF);
  t.is(bitstream.peekLSB(40), 0xFFFFFFFFFF);

  t.throws(() => bitstream.readLSB(128), { message: tooLargeError });
});

test('readLSB signed', (t) => {
  let bitstream = makeDataBitstream([0xFC, 0x08]);

  t.is(bitstream.peekLSB(0), 0);
  t.is(bitstream.readLSB(0), 0);

  t.is(bitstream.peekLSB(4, true), -4);
  t.is(bitstream.readLSB(4, true), -4);

  t.is(bitstream.peekLSB(3, true), -1);
  t.is(bitstream.readLSB(3, true), -1);

  t.is(bitstream.peekLSB(9, true), 0x11);
  t.is(bitstream.readLSB(9, true), 0x11);

  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xF3]);
  t.is(bitstream.peekLSB(32, true), -215639440);
  t.is(bitstream.peekLSB(31, true), -215639440);
  t.is(bitstream.readLSB(31, true), -215639440);

  t.is(bitstream.peekLSB(1, true), -1);
  t.is(bitstream.readLSB(1, true), -1);

  bitstream = makeDataBitstream([0xC8, 0x70, 0x9A, 0x25, 0xF3]);
  t.is(bitstream.peekLSB(40, true), -55203696440);
  t.is(bitstream.readLSB(40, true), -55203696440);

  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xFF, 0xF3]);
  t.is(bitstream.peekLSB(40, true), -51553920400);
  t.is(bitstream.readLSB(40, true), -51553920400);

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(bitstream.peekLSB(4, true), -1);
  t.is(bitstream.peekLSB(8, true), -1);
  t.is(bitstream.peekLSB(12, true), -1);
  t.is(bitstream.peekLSB(16, true), -1);
  t.is(bitstream.peekLSB(20, true), -1);
  t.is(bitstream.peekLSB(24, true), -1);
  t.is(bitstream.peekLSB(28, true), -1);
  t.is(bitstream.peekLSB(31, true), -1);
  t.is(bitstream.peekLSB(32, true), -1);
  t.is(bitstream.peekLSB(36, true), -1);
  t.is(bitstream.peekLSB(40, true), -1);

  t.throws(() => bitstream.readLSB(128), { message: tooLargeError });
});

/** Read each bit independently so expected values do not share the implementation's byte arithmetic. */
const referenceBits = (bytes, offset, bits, lsb, signed) => {
  let value = 0;
  for (let i = 0; i < bits; i++) {
    const position = offset + i;
    const byte = bytes[Math.floor(position / 8)];
    const bit = (byte >>> (lsb ? position % 8 : 7 - position % 8)) & 1;
    if (lsb) value += bit * 2 ** i;
    else value = value * 2 + bit;
  }
  return signed && bits > 0 && value >= 2 ** (bits - 1) ? value - 2 ** bits : value;
};

test('constructor: accepts a DataBuffer at its current byte cursor', (t) => {
  const buffer = new DataBuffer([0x12, 0x34, 0x56]);
  buffer.seek(1);
  const bitstream = new DataBitstream(buffer);
  t.is(bitstream.stream, buffer);
  t.is(bitstream.read(8), 0x34);
  t.is(buffer.offset, 2);
  t.throws(() => new DataBitstream({ data: new Uint8Array(1) }), { instanceOf: TypeError });
});

test('copy: preserves both cursors and owns independent bytes', (t) => {
  const original = makeDataBitstream([0x12, 0x34, 0x56, 0x78]);
  original.seek(13);
  const copy = original.copy();
  t.is(copy.offset(), 13);
  t.is(copy.peek(11), original.peek(11));
  copy.read(11);
  copy.stream.data[0] = 0;
  t.is(original.offset(), 13);
  t.is(original.stream.data[0], 0x12);
});

test('available: exact boundaries, zero bits, and the final partial byte', (t) => {
  const bitstream = makeDataBitstream([0xFF, 0x80]);
  for (let offset = 0; offset <= 16; offset++) {
    bitstream.seek(offset);
    t.true(bitstream.available(0));
    t.true(bitstream.available(16 - offset));
    t.false(bitstream.available(17 - offset));
  }
  t.is(bitstream.read(0), 0);
  t.is(bitstream.readLSB(0, true), 0);
  t.is(bitstream.peek(0, true), 0);
  t.is(bitstream.peekLSB(0), 0);
  t.is(makeDataBitstream([]).read(0), 0);
});

for (const method of ['read', 'peek', 'readLSB', 'peekLSB', 'advance', 'rewind', 'seek']) {
  test(`${method}: rejects invalid counts without changing either cursor`, (t) => {
    const bitstream = makeDataBitstream([0x12, 0x34]);
    bitstream.seek(3);
    for (const invalid of [-1, 0.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      t.throws(() => bitstream[method](invalid), { instanceOf: RangeError });
      t.is(bitstream.offset(), 3);
      t.false(bitstream.available(invalid));
    }
  });
}

for (const lsb of [false, true]) {
  test(`${lsb ? 'LSB' : 'MSB'}: all widths and alignments match an independent bit oracle`, (t) => {
    let seed = 0xC0FFEE;
    for (let sample = 0; sample < 20; sample++) {
      const bytes = Array.from({ length: 8 }, () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return sample === 0 ? 0 : sample === 1 ? 255 : seed >>> 24;
      });
      const bitstream = makeDataBitstream(bytes);
      const peek = lsb ? 'peekLSB' : 'peek';
      const read = lsb ? 'readLSB' : 'read';
      for (let offset = 0; offset < 8; offset++) {
        for (let width = 0; width <= 40; width++) {
          for (const signed of [false, true]) {
            bitstream.seek(offset);
            const expected = referenceBits(bytes, offset, width, lsb, signed);
            t.is(bitstream[peek](width, signed), expected, `${sample}/${offset}/${width}/${signed}`);
            t.is(bitstream.offset(), offset);
            t.is(bitstream[read](width, signed), expected);
            t.is(bitstream.offset(), offset + width);
          }
        }
      }
    }
  });

  test(`${lsb ? 'LSB' : 'MSB'}: sequential fields follow the current cursor`, (t) => {
    const bytes = [0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0];
    const bitstream = makeDataBitstream(bytes);
    const method = lsb ? 'readLSB' : 'read';
    let offset = 0;
    for (const width of [1, 7, 3, 13, 9, 31]) {
      t.is(bitstream[method](width), referenceBits(bytes, offset, width, lsb, false));
      offset += width;
      t.is(bitstream.offset(), offset);
    }
    t.false(bitstream.available(1));
  });

  test(`${lsb ? 'LSB' : 'MSB'}: failing reads and advances do not consume the remaining bits`, (t) => {
    const bitstream = makeDataBitstream([0xFF]);
    bitstream.seek(7);
    const method = lsb ? 'readLSB' : 'read';
    t.throws(() => bitstream[method](2), { name: 'UnderflowError' });
    t.throws(() => bitstream.advance(2), { name: 'UnderflowError' });
    t.throws(() => bitstream.seek(9), { name: 'UnderflowError' });
    t.is(bitstream.stream.offset, 0);
    t.is(bitstream.bitPosition, 7);
    t.is(bitstream[method](1), 1);
    t.is(bitstream.offset(), 8);
    t.throws(() => bitstream[method](41), { message: 'Too Large: 41 bits' });
    t.is(bitstream.offset(), 8);
  });
}

test('advance/rewind/seek: do not wrap bit counts at 32 bits', (t) => {
  // Only cursor arithmetic is under test; a virtual length avoids allocating a gigabyte of unused bytes.
  class CursorBuffer extends DataBuffer {
    get length() { return 0x40000000; }
  }
  const bitstream = new DataBitstream(new CursorBuffer(0));
  bitstream.advance(0x100000009);
  t.is(bitstream.offset(), 0x100000009);
  t.is(bitstream.stream.offset, 0x20000001);
  t.is(bitstream.bitPosition, 1);
  bitstream.rewind(0x100000002);
  t.is(bitstream.offset(), 7);
  bitstream.seek(0x100000000);
  t.is(bitstream.offset(), 0x100000000);
  bitstream.seek(0);
  t.is(bitstream.offset(), 0);
});

test('align: advances to EOF and is atomic when externally supplied cursor state is invalid', (t) => {
  const bitstream = makeDataBitstream([0xFF]);
  bitstream.seek(7);
  bitstream.align();
  t.is(bitstream.offset(), 8);
  bitstream.align();
  t.is(bitstream.offset(), 8);
  bitstream.bitPosition = 1;
  t.throws(() => bitstream.align(), { name: 'UnderflowError' });
  t.is(bitstream.stream.offset, 1);
  t.is(bitstream.bitPosition, 1);
});

test('fromData: respects a typed array subview and includes all supported integer view types', (t) => {
  const bytes = new Uint8Array([0xAA, 0x12, 0x34, 0xBB]);
  t.is(DataBitstream.fromData(bytes.subarray(1, 3)).read(16), 0x1234);
  for (const Type of [Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array]) {
    const view = new Type([0x12, 0x34]);
    const bitstream = DataBitstream.fromData(view);
    t.deepEqual(bitstream.stream.data, new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  }
});

test('available/read: uncommitted write capacity is not readable input', (t) => {
  const buffer = new DataBuffer();
  buffer.writeUInt8(0xFF);
  buffer.seek(0);
  const bitstream = new DataBitstream(buffer);
  t.false(bitstream.available(1));
  t.throws(() => bitstream.read(1), { name: 'UnderflowError' });
  buffer.commit();
  t.is(bitstream.read(8), 0xFF);
});
