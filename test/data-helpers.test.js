import test from 'ava';
import { readFile } from 'node:fs/promises';
import { convertFromIeeeExtended, float48, float80 } from '../dist/data-helpers.js';

test('convertFromIeeeExtended: zero', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 0);
  t.is(convertFromIeeeExtended([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), 0);
});

test('convertFromIeeeExtended: negative zero', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), -0);
  t.is((1 / convertFromIeeeExtended(new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))) < 0, true);
});

test('convertFromIeeeExtended: one', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x3F, 0xFF, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 1);
});

test('convertFromIeeeExtended: negative one', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0xBF, 0xFF, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), -1);
});

test('convertFromIeeeExtended: positive infinity', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x7F, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), Number.POSITIVE_INFINITY);
});

test('convertFromIeeeExtended: negative infinity', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), Number.NEGATIVE_INFINITY);
});

test('convertFromIeeeExtended: reserved exponent with mantissa', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x7F, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), Number.NaN);
  t.is(convertFromIeeeExtended(new Uint8Array([0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), Number.NaN);
});

test('convertFromIeeeExtended: pi', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x40, 0x00, 0xC9, 0x0F, 0xDA, 0x9E, 0x46, 0xA7, 0x88, 0x00])), 3.14159265);
});

test('convertFromIeeeExtended: AIFF sample rate', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x40, 0x0E, 0xAC, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 44100);
});

test('convertFromIeeeExtended: fractional values', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x40, 0x00, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 2.5);
  t.is(convertFromIeeeExtended(new Uint8Array([0x40, 0x0C, 0x8C, 0xA2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 9000.5);
  t.is(convertFromIeeeExtended(new Uint8Array([0x40, 0x05, 0xFA, 0xAA, 0xA6, 0x4C, 0x2F, 0x83, 0x7B, 0x4A])), 125.3333);
  t.is(convertFromIeeeExtended(new Uint8Array([0x40, 0x01, 0xAA, 0xAA, 0xA9, 0xF7, 0xB5, 0xAE, 0xA0, 0x00])), 5.333333);
  t.is(convertFromIeeeExtended(new Uint8Array([0x40, 0x01, 0xB5, 0x55, 0x56, 0x08, 0x4A, 0x51, 0x60, 0x00])), 5.666667);
  t.is(convertFromIeeeExtended(new Uint8Array([0x3F, 0xFD, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xA8, 0xFF])), 0.3333333333333333);
});

test('convertFromIeeeExtended: large value', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x41, 0x55, 0xAA, 0xAA, 0xAA, 0xAA, 0xAE, 0xA9, 0xF8, 0x00])), 1.1945305291680097e+103);
});

test('convertFromIeeeExtended: unsigned high mantissa', (t) => {
  // High mantissa bytes with the sign bit set must stay unsigned via >>> 0.
  t.is(convertFromIeeeExtended(new Uint8Array([0x3F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00])), 1.9999999995343387);
});

test('convertFromIeeeExtended: low mantissa only', (t) => {
  t.is(convertFromIeeeExtended(new Uint8Array([0x3F, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01])), 2 ** -63);
});

test('float48: zero exponent', (t) => {
  t.is(float48(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 0);
});

test('float80: zero', (t) => {
  t.is(float80(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 0);
});

test('float80: positive infinity', (t) => {
  t.is(float80(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x7F])), Number.POSITIVE_INFINITY);
});

test('float80: NaN', (t) => {
  t.true(Number.isNaN(float80(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x7F]))));
});

/** Encode a test significand independently in big-endian extended precision byte order. */
const extendedBytes = (exponent, mantissa, negative = false) => {
  const output = new Uint8Array(10);
  output[0] = (negative ? 0x80 : 0) | (exponent >>> 8);
  output[1] = exponent;
  for (let i = 9; i >= 2; i--) {
    output[i] = Number(mantissa & 255n);
    mantissa >>= 8n;
  }
  return output;
};

test('float48: preserves tiny values and the complete 39-bit fraction', (t) => {
  t.is(float48([0x81, 0, 0, 0, 0, 0]), 1);
  t.is(float48([0x81, 0, 0, 0, 0, 0x80]), -1);
  t.is(float48([1, 0, 0, 0, 0, 0]), 2 ** -128);
  t.is(float48([0x81, 1, 0, 0, 0, 0]), 1 + 2 ** -39);
  t.is(float48([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F]), (2 - 2 ** -39) * 2 ** 126);
  t.is(float48([0, 255, 255, 255, 255, 255]), 0);
});

test('float48: all exponent values match an integer significand oracle', (t) => {
  let seed = 0x48F10A7;
  for (let exponent = 0; exponent < 256; exponent++) {
    for (const sign of [0, 0x80]) {
      const bytes = [exponent];
      for (let i = 1; i < 6; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        bytes.push(seed >>> 24);
      }
      bytes[5] = (bytes[5] & 0x7F) | sign;
      let fraction = BigInt(bytes[5] & 0x7F);
      for (let i = 4; i > 0; i--) fraction = (fraction << 8n) | BigInt(bytes[i]);
      const expected = exponent === 0 ? 0 : (sign ? -1 : 1) * Number((1n << 39n) | fraction) * 2 ** (exponent - 168);
      t.is(float48(bytes), expected);
      t.is(float48(Uint8Array.from(bytes)), expected);
    }
  }
});

for (const [name, decode, length] of [
  ['float48', float48, 6],
  ['float80', float80, 10],
  ['convertFromIeeeExtended', convertFromIeeeExtended, 10],
]) {
  test(`${name}: rejects every truncated input length`, (t) => {
    for (let i = 0; i < length; i++) {
      t.throws(() => decode(new Uint8Array(i)), { instanceOf: RangeError });
    }
    t.notThrows(() => decode(new Uint8Array(length + 5)));
  });
}

for (const [name, decode, length] of [['float48', float48, 6], ['convertFromIeeeExtended', convertFromIeeeExtended, 10]]) {
  test(`${name}: validates ordinary array bytes instead of silently coercing them`, (t) => {
    for (const invalid of [-1, 256, 0.5, Number.NaN, Infinity, undefined]) {
      const bytes = Array(length).fill(0);
      bytes[length - 1] = invalid;
      t.throws(() => decode(bytes), { instanceOf: RangeError });
    }
    t.throws(() => decode(Array(length)), { instanceOf: RangeError });
  });
}

test('extended precision: canonical and legacy infinities, NaNs, and signed zero agree across byte orders', (t) => {
  for (const negative of [false, true]) {
    for (const [exponent, mantissa, expected] of [
      [0, 0n, negative ? -0 : 0],
      [0x7FFF, 0x8000000000000000n, negative ? -Infinity : Infinity],
      [0x7FFF, 0n, negative ? -Infinity : Infinity],
      [0x7FFF, 0xC000000000000000n, Number.NaN],
      [0x7FFF, 0x8000000000000001n, Number.NaN],
      [0x7FFF, 1n, Number.NaN],
      [0, 0x8000000000000000n, negative ? -0 : 0],
      [1, 0x8000000000000000n, negative ? -0 : 0],
    ]) {
      const bytes = extendedBytes(exponent, mantissa, negative);
      t.is(convertFromIeeeExtended(bytes), expected);
      t.is(float80(bytes.slice().reverse()), expected);
    }
  }
});

test('float80: accepts unaligned subviews without reading unrelated bytes', (t) => {
  const one = extendedBytes(0x3FFF, 0x8000000000000000n).reverse();
  for (let offset = 0; offset < 8; offset++) {
    const storage = new Uint8Array(30).fill(0xFF);
    storage.set(one, offset);
    t.is(float80(storage.subarray(offset, offset + 10)), 1);
    t.is(float80(storage.subarray(offset, offset + 14)), 1);
  }
});

const extendedRoundingCases = [
  [-1075, 0x8000000000000000n, 0],
  [-1075, 0x8000000000000001n, Number.MIN_VALUE],
  [-1074, 0x8000000000000000n, Number.MIN_VALUE],
  [-1074, 0xBFFFFFFFFFFFFFFFn, Number.MIN_VALUE],
  [-1074, 0xC000000000000000n, 2 * Number.MIN_VALUE],
  [-1074, 0xC000000000000001n, 2 * Number.MIN_VALUE],
  [-1073, 0xA000000000000000n, 2 * Number.MIN_VALUE],
  [-1073, 0xA000000000000001n, 3 * Number.MIN_VALUE],
  [-1023, 0xFFFFFFFFFFFFF7FFn, 2 ** -1022 - Number.MIN_VALUE],
  [-1023, 0xFFFFFFFFFFFFF800n, 2 ** -1022],
  [-1022, 0x8000000000000000n, 2 ** -1022],
  [0, 0x8000000000000400n, 1],
  [0, 0x8000000000000401n, 1 + Number.EPSILON],
  [1023, 0xFFFFFFFFFFFFF800n, Number.MAX_VALUE],
  [1023, 0xFFFFFFFFFFFFFBFFn, Number.MAX_VALUE],
  [1023, 0xFFFFFFFFFFFFFC00n, Infinity],
  [1024, 0x8000000000000000n, Infinity],
  [1050, 1n, 2 ** 987],
];

test('extended precision: correct rounding at normal, subnormal, underflow, and overflow boundaries', (t) => {
  for (const [power, mantissa, expected] of extendedRoundingCases) {
    for (const negative of [false, true]) {
      const bytes = extendedBytes(power + 16383, mantissa, negative);
      const signedExpected = negative ? -expected : expected;
      t.is(convertFromIeeeExtended(bytes), signedExpected, `${power}/${mantissa.toString(16)}/${negative}`);
      t.is(float80(bytes.slice().reverse()), signedExpected);
    }
  }
});

test('extended precision: byte order agreement across a deterministic significand/exponent sweep', (t) => {
  let seed = 0x80F10A7;
  for (let i = 0; i < 2000; i++) {
    const bytes = new Uint8Array(10);
    for (let j = 0; j < bytes.length; j++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      bytes[j] = seed >>> 24;
    }
    t.is(float80(bytes.slice().reverse()), convertFromIeeeExtended(bytes));
  }
});


test('extended precision: independent Python Fraction oracle covers 4096 exact binary64 results', async (t) => {
  const cases = JSON.parse(await readFile(new URL('./fixtures/data-helpers-float-oracle.json', import.meta.url), 'utf8'));
  const storage = new Uint8Array(8);
  const view = new DataView(storage.buffer);
  for (const [hex, expected] of cases) {
    const bytes = Uint8Array.from(Buffer.from(hex, 'hex'));
    for (const actual of [convertFromIeeeExtended(bytes), float80(bytes.slice().reverse())]) {
      if (expected === 'NaN') {
        t.true(Number.isNaN(actual), hex);
      } else {
        view.setFloat64(0, actual, false);
        t.is(Buffer.from(storage).toString('hex'), expected, hex);
      }
    }
  }
});
