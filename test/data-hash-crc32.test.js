import test from 'ava';
import { CRC32 } from '../src/index.js';

test('CRC32.of(data)', (t) => {
  let input;
  let checksum;

  // String
  input = 'The quick brown fox jumps over the lazy dog';
  checksum = '414FA339';
  t.is(CRC32.of(input), checksum);

  // Uint8Array - Counting Up
  input = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F]);
  checksum = '91267E8A';
  t.is(CRC32.of(input), checksum);

  // All zero / `0x00`
  input = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  checksum = '190A55AD';
  t.is(CRC32.of(input), checksum);

  // All 255 / `0xFF`
  input = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  checksum = 'FF6CAB0B';
  t.is(CRC32.of(input), checksum);
});
