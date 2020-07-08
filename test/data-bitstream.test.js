const test = require('ava');
const { DataBitstream } = require('../src');

const makeDataBitstream = (bytes) => DataBitstream.fromBytes(bytes);

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

  t.is(0, bitstream.bitPosition);
  t.is(0, bitstream.offset());

  bitstream.advance(2);
  t.is(2, bitstream.bitPosition);
  t.is(2, bitstream.offset());

  bitstream.advance(7);
  t.is(1, bitstream.bitPosition);
  t.is(9, bitstream.offset());

  t.throws(() => bitstream.advance(40), { message: 'Insufficient Bytes: 5 <= 1' });
});

test('rewind', (t) => {
  const bitstream = makeDataBitstream([10, 160]);

  t.is(0, bitstream.bitPosition);
  t.is(0, bitstream.offset());

  bitstream.advance(2);
  t.is(2, bitstream.bitPosition);
  t.is(2, bitstream.offset());

  bitstream.rewind(2);
  t.is(0, bitstream.bitPosition);
  t.is(0, bitstream.offset());

  bitstream.advance(10);
  t.is(2, bitstream.bitPosition);
  t.is(10, bitstream.offset());

  bitstream.rewind(4);
  t.is(6, bitstream.bitPosition);
  t.is(6, bitstream.offset());

  t.throws(() => bitstream.rewind(10), { message: 'Insufficient Bytes: 1 > 0' });
});

test('seek', (t) => {
  const bitstream = makeDataBitstream([10, 160]);

  t.is(0, bitstream.bitPosition);
  t.is(0, bitstream.offset());

  bitstream.seek(3);
  t.is(3, bitstream.bitPosition);
  t.is(3, bitstream.offset());

  bitstream.seek(10);
  t.is(2, bitstream.bitPosition);
  t.is(10, bitstream.offset());

  bitstream.seek(4);
  t.is(4, bitstream.bitPosition);
  t.is(4, bitstream.offset());

  // Test the no-op `offset === current_offset` else branch.
  bitstream.seek(4);
  t.is(4, bitstream.bitPosition);
  t.is(4, bitstream.offset());

  t.throws(() => bitstream.seek(100), { message: 'Insufficient Bytes: 12 <= 2' });

  t.throws(() => bitstream.seek(-10), { message: 'Insufficient Bytes: 2 > 0' });
});

test('align', (t) => {
  const bitstream = makeDataBitstream([10, 160]);

  t.is(0, bitstream.bitPosition);
  t.is(0, bitstream.offset());

  bitstream.align();
  t.is(0, bitstream.bitPosition);
  t.is(0, bitstream.offset());

  bitstream.seek(2);
  bitstream.align();
  t.is(0, bitstream.bitPosition);
  return t.is(8, bitstream.offset());
});

test('read/peek unsigned', (t) => {
  // 0101 1101 0110 1111 1010 1110 1100 1000 -> 0x5d6faec8
  // 0111 0000 1001 1010 0010 0101 1111 0011 -> 0x709a25f3
  let bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70, 0x9A, 0x25, 0xF3]);

  t.is(0, bitstream.peek(0));
  t.is(0, bitstream.read(0));

  t.is(1, bitstream.peek(2));
  t.is(1, bitstream.read(2));

  t.is(7, bitstream.peek(4));
  t.is(7, bitstream.read(4));

  t.is(0x16F, bitstream.peek(10));
  t.is(0x16F, bitstream.read(10));

  t.is(0xAEC8, bitstream.peek(16));
  t.is(0xAEC8, bitstream.read(16));

  t.is(0x709A25F3, bitstream.peek(32));
  t.is(0x384D12F9, bitstream.peek(31));
  t.is(0x384D12F9, bitstream.read(31));

  t.is(1, bitstream.peek(1));
  t.is(1, bitstream.read(1));

  bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70]);
  t.is(0x5D6FAEC870, bitstream.peek(40));
  t.is(0x5D6FAEC870, bitstream.read(40));

  bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70]);
  t.is(1, bitstream.read(2));
  t.is(0xEB7D7643, bitstream.peek(33));
  t.is(0xEB7D7643, bitstream.read(33));

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(0xF, bitstream.peek(4));
  t.is(0xFF, bitstream.peek(8));
  t.is(0xFFF, bitstream.peek(12));
  t.is(0xFFFF, bitstream.peek(16));
  t.is(0xFFFFF, bitstream.peek(20));
  t.is(0xFFFFFF, bitstream.peek(24));
  t.is(0xFFFFFFF, bitstream.peek(28));
  t.is(0xFFFFFFFF, bitstream.peek(32));
  t.is(0xFFFFFFFFF, bitstream.peek(36));
  t.is(0xFFFFFFFFFF, bitstream.peek(40));

  t.throws(() => bitstream.read(128), { message: 'Too Large: 128 bits' });
});

test('read/peek signed', (t) => {
  let bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70, 0x9A, 0x25, 0xF3]);

  t.is(0, bitstream.peek(0));
  t.is(0, bitstream.read(0));

  t.is(5, bitstream.peek(4, true));
  t.is(5, bitstream.read(4, true));

  t.is(-3, bitstream.peek(4, true));
  t.is(-3, bitstream.read(4, true));

  t.is(6, bitstream.peek(4, true));
  t.is(6, bitstream.read(4, true));

  t.is(-1, bitstream.peek(4, true));
  t.is(-1, bitstream.read(4, true));

  t.is(-82, bitstream.peek(8, true));
  t.is(-82, bitstream.read(8, true));

  t.is(-889, bitstream.peek(12, true));
  t.is(-889, bitstream.read(12, true));

  t.is(9, bitstream.peek(8, true));
  t.is(9, bitstream.read(8, true));

  t.is(-191751, bitstream.peek(19, true));
  t.is(-191751, bitstream.read(19, true));

  t.is(-1, bitstream.peek(1, true));
  t.is(-1, bitstream.read(1, true));

  bitstream = makeDataBitstream([0x5D, 0x6F, 0xAE, 0xC8, 0x70, 0x9A, 0x25, 0xF3]);
  bitstream.advance(1);

  t.is(-9278133113, bitstream.peek(35, true));
  t.is(-9278133113, bitstream.read(35, true));

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(-1, bitstream.peek(4, true));
  t.is(-1, bitstream.peek(8, true));
  t.is(-1, bitstream.peek(12, true));
  t.is(-1, bitstream.peek(16, true));
  t.is(-1, bitstream.peek(20, true));
  t.is(-1, bitstream.peek(24, true));
  t.is(-1, bitstream.peek(28, true));
  t.is(-1, bitstream.peek(31, true));
  t.is(-1, bitstream.peek(32, true));
  t.is(-1, bitstream.peek(36, true));
  t.is(-1, bitstream.peek(40, true));

  t.throws(() => bitstream.read(128), { message: 'Too Large: 128 bits' });
});

test('readLSB unsigned', (t) => {
  // {      byte 1   }{    byte 2   }
  // {  3   2      1 }{       3     }
  // { [1111] [1100] }{ [0000 1000] } -> 0xFC08
  let bitstream = makeDataBitstream([0xFC, 0x08]);

  t.is(0, bitstream.peekLSB(0));
  t.is(0, bitstream.readLSB(0));

  t.is(12, bitstream.peekLSB(4));
  t.is(12, bitstream.readLSB(4));

  t.is(7, bitstream.peekLSB(3));
  t.is(7, bitstream.readLSB(3));

  t.is(0x11, bitstream.peekLSB(9));
  t.is(0x11, bitstream.readLSB(9));

  //      4            3           2           1
  // [0111 0000] [1001 1010] [0010 0101] [1111 0011] -> 0x709a25f3
  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xF3]);
  t.is(0xF3259A70, bitstream.peekLSB(32));
  t.is(0x73259A70, bitstream.peekLSB(31));
  t.is(0x73259A70, bitstream.readLSB(31));

  t.is(1, bitstream.peekLSB(1));
  t.is(1, bitstream.readLSB(1));

  bitstream = makeDataBitstream([0xC8, 0x70, 0x9A, 0x25, 0xF3]);
  t.is(0xF3259A70C8, bitstream.peekLSB(40));
  t.is(0xF3259A70C8, bitstream.readLSB(40));

  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xFF, 0xF3]);
  t.is(0xF3FF259A70, bitstream.peekLSB(40));
  t.is(0xF3FF259A70, bitstream.readLSB(40));

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(0xF, bitstream.peekLSB(4));
  t.is(0xFF, bitstream.peekLSB(8));
  t.is(0xFFF, bitstream.peekLSB(12));
  t.is(0xFFFF, bitstream.peekLSB(16));
  t.is(0xFFFFF, bitstream.peekLSB(20));
  t.is(0xFFFFFF, bitstream.peekLSB(24));
  t.is(0xFFFFFFF, bitstream.peekLSB(28));
  t.is(0xFFFFFFFF, bitstream.peekLSB(32));
  t.is(0xFFFFFFFFF, bitstream.peekLSB(36));
  t.is(0xFFFFFFFFFF, bitstream.peekLSB(40));

  t.throws(() => bitstream.readLSB(128), { message: 'Too Large: 128 bits' });
});

test('readLSB signed', (t) => {
  let bitstream = makeDataBitstream([0xFC, 0x08]);

  t.is(0, bitstream.peekLSB(0));
  t.is(0, bitstream.readLSB(0));

  t.is(-4, bitstream.peekLSB(4, true));
  t.is(-4, bitstream.readLSB(4, true));

  t.is(-1, bitstream.peekLSB(3, true));
  t.is(-1, bitstream.readLSB(3, true));

  t.is(0x11, bitstream.peekLSB(9, true));
  t.is(0x11, bitstream.readLSB(9, true));

  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xF3]);
  t.is(-215639440, bitstream.peekLSB(32, true));
  t.is(-215639440, bitstream.peekLSB(31, true));
  t.is(-215639440, bitstream.readLSB(31, true));

  t.is(-1, bitstream.peekLSB(1, true));
  t.is(-1, bitstream.readLSB(1, true));

  bitstream = makeDataBitstream([0xC8, 0x70, 0x9A, 0x25, 0xF3]);
  t.is(-55203696440, bitstream.peekLSB(40, true));
  t.is(-55203696440, bitstream.readLSB(40, true));

  bitstream = makeDataBitstream([0x70, 0x9A, 0x25, 0xFF, 0xF3]);
  t.is(-51553920400, bitstream.peekLSB(40, true));
  t.is(-51553920400, bitstream.readLSB(40, true));

  bitstream = makeDataBitstream([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  t.is(-1, bitstream.peekLSB(4, true));
  t.is(-1, bitstream.peekLSB(8, true));
  t.is(-1, bitstream.peekLSB(12, true));
  t.is(-1, bitstream.peekLSB(16, true));
  t.is(-1, bitstream.peekLSB(20, true));
  t.is(-1, bitstream.peekLSB(24, true));
  t.is(-1, bitstream.peekLSB(28, true));
  t.is(-1, bitstream.peekLSB(31, true));
  t.is(-1, bitstream.peekLSB(32, true));
  t.is(-1, bitstream.peekLSB(36, true));
  t.is(-1, bitstream.peekLSB(40, true));

  t.throws(() => bitstream.readLSB(128), { message: 'Too Large: 128 bits' });
});
