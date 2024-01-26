import test from 'ava';
import { DataBitstream } from '../src/index.js';

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

  t.throws(() => bitstream.advance(40), { message: 'Insufficient Bytes: 5 <= 1' });
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

  t.throws(() => bitstream.rewind(10), { message: 'Insufficient Bytes: 1 > 0' });
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

  t.throws(() => bitstream.seek(100), { message: 'Insufficient Bytes: 12 <= 2' });

  t.throws(() => bitstream.seek(-10), { message: 'Insufficient Bytes: 2 > 0' });
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
  t.is(bitstream.read(16), 23919);
  t.is(bitstream.read(31), 783800164);
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
  t.throws(() => bitstream.read(8), { message: 'Insufficient Bytes: 1 <= 0' });
});

test('read/peek signed', (t) => {
  // 0101 1101 0110 1111 1010 1110 1100 1000 -> 0x5D6FAEC8 -> 1567600328
  // 0111 0000 1001 1010 0010 0101 1111 0011 -> 0x709A25F3 -> 1889150451
  let bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70, 0x9A, 0x25, 0xF3]);

  t.is(bitstream.read(0, true), 0);
  t.is(bitstream.read(4, true), 5);
  t.is(bitstream.read(4, true), -3);
  t.is(bitstream.read(4, true), 5);
  t.is(bitstream.read(4, true), -3);
  t.is(bitstream.read(8, true), 93);
  t.is(bitstream.read(12, true), 1494);
  t.is(bitstream.read(8, true), -42);
  t.is(bitstream.read(19, true), -84009);
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

  t.is(bitstream.peekLSB(1), 0);
  t.is(bitstream.readLSB(1), 0);

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

  t.is(bitstream.peekLSB(1, true), 0);
  t.is(bitstream.readLSB(1, true), 0);

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
