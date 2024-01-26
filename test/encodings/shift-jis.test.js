import fs from 'fs';
import test from 'ava';
import { DataBuffer } from '../../src/index.js';
import { parse } from '../../src/encodings/shift-jis.js';

test('can decode Shift-JIS to Unicode', (t) => {
  const file = fs.readFileSync('./test/data/shift-jis.txt');
  const data = new DataBuffer(file);
  const output = parse(data);
  t.is(output, 'ほげふが日本語テキストファイルテスト\n');
});

test('can decode Shift-JIS to Unicode (edge cases)', (t) => {
  t.is(parse(new DataBuffer([0xE0, 0x40])), '漾');
  t.is(parse(new DataBuffer([0xA1, 0xDF])), '｡ﾟ');
  t.is(parse(new DataBuffer([0xFD, 0x40])), 'ý@');
});
