/** Validate the required bytes, including ordinary arrays that do not coerce values to bytes. */
const validateBytes = (uint8: Uint8Array | number[], length: number): void => {
  if (uint8.length < length) {
    throw new RangeError(
      `Insufficient bytes: expected at least ${length}, received ${uint8.length}.`,
    );
  }
  if (Array.isArray(uint8)) {
    for (let i = 0; i < length; i++) {
      if (!Number.isInteger(uint8[i]) || uint8[i] < 0 || uint8[i] > 255) {
        throw new RangeError(`Invalid byte at index ${i}: ${uint8[i]}`);
      }
    }
  }
};

/** Decode either byte order after its exponent and unsigned significand words have been read. */
const decodeExtended = (sign: number, exponent: number, high: number, low: number): number => {
  // Preserve the historical zero-significand infinity encoding as well as canonical IEEE infinity.
  if (exponent === 0x7fff) {
    return (high & 0x7fffffff) === 0 && low === 0 ? sign * Infinity : Number.NaN;
  }
  if (high === 0 && low === 0) {
    return sign * 0;
  }

  // Bias is 16383, which is 0x3FFF; subnormals and pseudo-denormals use exponent 1.
  const adjustedExponent = (exponent === 0 ? 1 : exponent) - 16383;
  if (high >= 0x80000000 && adjustedExponent >= -1022 && adjustedExponent <= 1023) {
    // Ordinary normalized values need only one variable power and never allocate a BigInt.
    return sign * ((high / 0x80000000 + low / 0x8000000000000000) * 2 ** adjustedExponent);
  }
  const highestBit = high === 0 ? 31 - Math.clz32(low) : 63 - Math.clz32(high);
  const power = adjustedExponent + highestBit - 63;
  if (power > 1023) {
    return sign * Infinity;
  }
  if (power < -1075) {
    return sign * 0;
  }
  if (power >= -1022) {
    // The addition rounds the 64-bit significand once; subsequent power-of-two scaling is exact.
    const mantissa = high * 0x100000000 + low;
    return sign * ((mantissa / 2 ** highestBit) * 2 ** power);
  }

  // Round directly to binary64 subnormal units to avoid double rounding or early power underflow.
  const mantissa = (BigInt(high) << 32n) | BigInt(low);
  const shift = adjustedExponent + 1011;
  let rounded: bigint;
  if (shift >= 0) {
    rounded = mantissa << BigInt(shift);
  } else {
    const discarded = BigInt(-shift);
    rounded = mantissa >> discarded;
    const remainder = mantissa - (rounded << discarded);
    const half = 1n << (discarded - 1n);
    if (remainder > half || (remainder === half && (rounded & 1n) !== 0n)) {
      rounded++;
    }
  }
  return sign * (Number(rounded) * Number.MIN_VALUE);
};

/**
 * Converts the provided `Uint8Array` into a Turbo Pascal 48 bit float value.
 * Real48 values are exactly representable by a JavaScript Number; no decimal rounding is applied.
 *
 * While most languages use a 32-bit or 64-bit floating point decimal variable, usually called single or double,
 * Turbo Pascal featured an uncommon 48-bit float called a real which served the same function as a float.
 *
 * The Real48 type exists for backward compatibility with Turbo Pascal. It defines a 6-byte floating-point type.
 * The Real48 type has an 8-bit exponent and a 39-bit normalized mantissa. It cannot store denormalized values, infinity, or not-a-number. If the exponent is zero, the number is zero.
 *
 * Structure (Bytes, Big Endian)
 * 5: SMMMMMMM 4: MMMMMMMM 3: MMMMMMMM 2: MMMMMMMM 1: MMMMMMMM 0: EEEEEEEE
 *
 * Structure (Bytes, Little Endian)
 * 0: EEEEEEEE 1: MMMMMMMM 2: MMMMMMMM 3: MMMMMMMM 4: MMMMMMMM 5: SMMMMMMM
 *
 * E[8]: Exponent
 * M[39]: Mantissa
 * S[1]: Sign
 *
 * Value: (-1)^s * 2^(e - 129) * (1.f)
 * @param uint8 The data to process to a float48 value.
 * @returns The read value as a number.
 * @see {@link http://www.shikadi.net/moddingwiki/Turbo_Pascal_Real|Turbo Pascal Real}
 */
export const float48 = (uint8: Uint8Array | number[]): number => {
  validateBytes(uint8, 6);
  let mantissa = 0;

  // Bias is 129, which is 0x81
  let exponent = uint8[0];
  if (exponent === 0) {
    return 0;
  }
  exponent = uint8[0] - 0x81;

  for (let i = 1; i <= 4; i++) {
    mantissa += uint8[i];
    mantissa /= 256;
  }
  mantissa += uint8[5] & 0x7f;
  mantissa /= 128;
  mantissa += 1;

  // Sign bit check
  if (uint8[5] & 0x80) {
    mantissa = -mantissa;
  }

  const output = mantissa * 2 ** exponent;
  return output;
};

/**
 * Convert the current little-endian buffer into an IEEE 80 bit extended float value.
 * @param uint8 The raw data to convert to a float80.
 * @returns The read value as a number.
 * @see {@link https://en.wikipedia.org/wiki/Extended_precision|Extended_Precision}
 */
export const float80 = (uint8: Uint8Array): number => {
  validateBytes(uint8, 10);
  // Read little-endian words explicitly: Uint32Array views require alignment and use host byte order.
  const high = ((uint8[7] << 24) | (uint8[6] << 16) | (uint8[5] << 8) | uint8[4]) >>> 0;
  const low = ((uint8[3] << 24) | (uint8[2] << 16) | (uint8[1] << 8) | uint8[0]) >>> 0;
  const a0 = uint8[9];
  const a1 = uint8[8];

  // 1 bit sign, -1 or +1
  const sign = 1 - (a0 >>> 7) * 2;
  // 15 bit exponent
  // let exponent = (((a0 << 1) & 0xFF) << 7) | a1;
  const exponent = ((a0 & 0x7f) << 8) | a1;

  // 0x7FFF is a reserved value; infinity and NaN are distinguished by the fraction bits.
  return decodeExtended(sign, exponent, high, low);
};

/**
 * Convert 10-byte IEEE 754 extended precision float, as used by AIFF into a JavaScript Number.
 * Uses `>>> 0` to force unsigned 32-bit mantissas.
 * @param uint8 10-byte extended float.
 * @returns The converted value.
 * @see {@link https://en.wikipedia.org/wiki/IEEE_754|IEEE 754}
 */
export const convertFromIeeeExtended = (uint8: Uint8Array | number[]): number => {
  validateBytes(uint8, 10);
  const sign = uint8[0] & 0x80 ? -1 : 1;
  const exponent = ((uint8[0] & 0x7f) << 8) | uint8[1];

  const hiMant = ((uint8[2] << 24) | (uint8[3] << 16) | (uint8[4] << 8) | uint8[5]) >>> 0;

  const loMant = ((uint8[6] << 24) | (uint8[7] << 16) | (uint8[8] << 8) | uint8[9]) >>> 0;

  return decodeExtended(sign, exponent, hiMant, loMant);
};

export default {
  float48,
  float80,
  convertFromIeeeExtended,
};
