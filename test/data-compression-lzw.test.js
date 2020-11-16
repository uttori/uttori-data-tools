// @ts-nocheck
const test = require('ava');
const { LZW } = require('../src');

const simple = 'TOBEORNOTTOBEORTOBEORNOT';
const complex = '💾🙏🏼'; // 240, 159, 146, 190, 256, 153, 143, 256, 143, 188
// [...string].map((c) => c.charCodeAt(0).toString(16));
const makeInputCharCode = (string) => [...string].map((c) => c.charCodeAt(0));
const makeInput = (string) => LZW.stringToHexArray(string);

test('LZW.compress(input, depth): simple, char code', (t) => {
  const input = makeInputCharCode(simple);
  t.deepEqual(LZW.compress(input), [84, 79, 66, 69, 79, 82, 78, 79, 84, 256, 258, 260, 265, 259, 261, 263]);
});

test('LZW.compress(input, depth): simple, code point', (t) => {
  const input = makeInput(simple);
  t.deepEqual(LZW.compress(input), [84, 79, 66, 69, 79, 82, 78, 79, 84, 256, 258, 260, 265, 259, 261, 263]);
});

// test('LZW.compress(input, depth): complex, char code', (t) => {
//   const input = makeInputCharCode(complex);
//   t.deepEqual(LZW.compress(input), []);
// });

test('LZW.compress(input, depth): complex, code point', (t) => {
  const input = makeInput(complex);
  t.deepEqual(LZW.compress(input), [1, 244, 190, 1, 246, 79, 1, 243, 252]);
});

test('LZW.decompress(input, depth): simple, char code', (t) => {
  const input = makeInputCharCode(simple);
  const compressed = LZW.compress(input, 8);
  t.deepEqual(LZW.decompress(compressed), input);
});

test('LZW.decompress(input, depth): simple, code point', (t) => {
  const input = makeInput(simple);
  const compressed = LZW.compress(input, 8);
  t.deepEqual(LZW.decompress(compressed), input);
});

// test('LZW.decompress(input, depth): complex, char code', (t) => {
//   const input = makeInputCharCode(complex);
//   const compressed = LZW.compress(input, 8);
//   t.deepEqual(LZW.decompress(compressed), input);
// });

test('LZW.decompress(input, depth): complex, code point', (t) => {
  const input = makeInput(complex);
  const compressed = LZW.compress(input, 8);
  t.deepEqual(LZW.decompress(compressed), input);
});

test('LZW.stringToHexArray(string): simple', (t) => {
  t.deepEqual(LZW.stringToHexArray(simple), [84, 79, 66, 69, 79, 82, 78, 79, 84, 84, 79, 66, 69, 79, 82, 84, 79, 66, 69, 79, 82, 78, 79, 84]);
});

test('LZW.stringToHexArray(string): complex', (t) => {
  // Hex from file UTF-8: [240, 159, 146, 190, 240, 159, 153, 143, 240, 159, 143, 188]
  t.deepEqual(LZW.stringToHexArray(complex), [1, 244, 190, 1, 246, 79, 1, 243, 252]);
});
