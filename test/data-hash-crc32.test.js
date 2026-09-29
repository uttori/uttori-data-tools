import { crc32 as zlibCrc32 } from 'node:zlib';
import test from 'ava';
import { CRC32, DataBuffer } from '../dist/index.js';

const isoBitwise = (bytes) => {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (~crc) >>> 0;
};

const crc32cBitwise = (bytes, zeroChecksum = false) => {
  let crc = 0xFFFFFFFF;
  for (let index = 0; index < bytes.length; index++) {
    crc ^= zeroChecksum && index >= 56 && index < 60 ? 0 : bytes[index];
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0x82F63B78 : 0);
    }
  }
  return (~crc) >>> 0;
};

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

  const bytes = new Uint8Array([0x31, 0x32, 0x33, 0x34]);
  t.is(CRC32.of(new DataBuffer(bytes)), CRC32.of(bytes));
  t.is(CRC32.of(new Uint16Array(bytes.buffer)), CRC32.of(bytes));
  t.is(CRC32.compute(4), CRC32.compute(new Uint8Array(4)));
});

test('CRC32.compute matches ISO-HDLC, zlib, and CRC32.of', (t) => {
  t.is(CRC32.compute(''), 0);
  t.is(CRC32.of(''), '0');
  t.is(CRC32.compute('123456789'), 0xCBF43926);
  t.is(CRC32.of('123456789'), 'CBF43926');
  t.is(CRC32.compute('The quick brown fox jumps over the lazy dog'), 0x414FA339);

  const samples = [
    new Uint8Array(),
    Uint8Array.from('123456789', (char) => char.charCodeAt(0)),
    Uint8Array.from({ length: 32 }, () => 0),
    Uint8Array.from({ length: 32 }, () => 0xFF),
    Uint8Array.from({ length: 300 }, (_, index) => (index * 17 + 3) & 0xFF),
  ];
  for (const bytes of samples) {
    t.is(CRC32.compute(bytes), isoBitwise(bytes));
    t.is(CRC32.compute(bytes), zlibCrc32(bytes));
    t.is(CRC32.of(bytes), CRC32.compute(bytes).toString(16).toUpperCase());
  }
});

test('CRC32.crc32c matches Castagnoli', (t) => {
  t.is(CRC32.crc32c(''), 0);
  t.is(CRC32.crc32c('123456789'), 0xE3069283);
  t.is(CRC32.crc32c([0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39]), 0xE3069283);

  const lengths = [...Array.from({ length: 81 }, (_, index) => index), 255, 1024];
  for (const length of lengths) {
    const bytes = Uint8Array.from({ length }, (_, index) => (index * 137 + (index >>> 3)) & 0xFF);
    const original = bytes.slice();
    for (const zeroChecksum of [false, true]) {
      t.is(CRC32.crc32c(bytes, zeroChecksum), crc32cBitwise(bytes, zeroChecksum));
      t.deepEqual(bytes, original);
    }
  }

  const marked = Uint8Array.from({ length: 80 }, (_, index) => index + 1);
  t.not(CRC32.crc32c(marked, false), CRC32.crc32c(marked, true));
  const short = marked.subarray(0, 40);
  t.is(CRC32.crc32c(short, true), CRC32.crc32c(short, false));
});
