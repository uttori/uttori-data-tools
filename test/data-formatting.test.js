const test = require('ava');
const { formatBytes } = require('../src');

test('formatBytes', (t) => {
  t.is(formatBytes(0), '0 Bytes');
  t.is(formatBytes(1), '1 Bytes');
  t.is(formatBytes(1024), '1 KB');
  t.is(formatBytes(1024 * 1024), '1 MB');
});

test('formatBytes: custom values', (t) => {
  const decimals = 4;
  const bytes = 1000;
  const sizes = ['Bytez', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  t.is(formatBytes(0, decimals, bytes, sizes), '0 Bytez');
  t.is(formatBytes(1, decimals, bytes, sizes), '1 Bytez');
  t.is(formatBytes(1024, decimals, bytes, sizes), '1.024 KiB');
  t.is(formatBytes(1024 * 1024 + 123, decimals, bytes, sizes), '1.0487 MiB');
});
