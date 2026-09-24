import DataBuffer from './data-buffer.js';
export declare const CRC32_TABLE: number[];
/**
 * Derive the Cyclic Redundancy Check of a data blob.
 * This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.
 * @see {@link https://rosettacode.org/wiki/CRC-32|CRC-32}
 * @see {@link https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks|Computation of cyclic redundancy checks}
 * @example <caption>CRC32.of(...)</caption>
 * import CRC32 from '@uttori/data-tools/data-hash-crc32';
 * CRC32.of('The quick brown fox jumps over the lazy dog');
 * ➜ '414FA339'
 * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} data The data to process.
 * @returns {string} The 8 character CRC32 value.
 */
export declare const calculate: (data: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array) => string;
declare const _default: {
    of: typeof calculate;
};
export default _default;
//# sourceMappingURL=data-hash-crc32.d.ts.map