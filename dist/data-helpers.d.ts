/**
 * Converts the provided `Uint8Array` into a Turbo Pascal 48 bit float value.
 * May be faulty with large numbers due to float percision.
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
 * @param {Uint8Array} uint8 The data to process to a float48 value.
 * @returns {number} The read value as a number.
 * @see {@link http://www.shikadi.net/moddingwiki/Turbo_Pascal_Real|Turbo Pascal Real}
 */
export declare const float48: (uint8: Uint8Array) => number;
/**
 * Convert the current buffer into an IEEE 80 bit extended float value.
 * @param {Uint8Array} uint8 The raw data to convert to a float80.
 * @returns {number} The read value as a number.
 * @see {@link https://en.wikipedia.org/wiki/Extended_precision|Extended_Precision}
 */
export declare const float80: (uint8: Uint8Array) => number;
/**
 * Convert 10-byte IEEE 754 extended precision float, as used by AIFF into a JavaScript Number.
 * Uses `>>> 0` to force unsigned 32-bit mantissas.
 * @param {Uint8Array | number[]} uint8 10-byte extended float.
 * @returns {number} The converted value.
 * @see {@link https://en.wikipedia.org/wiki/IEEE_754|IEEE 754}
 */
export declare const convertFromIeeeExtended: (uint8: Uint8Array | number[]) => number;
declare const _default: {
    float48: typeof float48;
    float80: typeof float80;
    convertFromIeeeExtended: typeof convertFromIeeeExtended;
};
export default _default;
//# sourceMappingURL=data-helpers.d.ts.map