import type DataBuffer from "./data-buffer.js";
/** Reflected polynomial for CRC-32/ISO-HDLC, used by PNG, ZIP, zlib, and `@uttori/asm-core`. */
export declare const CRC32_POLYNOMIAL = 3988292384;
/** Reflected polynomial for CRC-32C/Castagnoli, used by ACT2 capture chunks. */
export declare const CRC32C_POLYNOMIAL = 2197175160;
/**
 * Bytes accepted by the checksum helpers. Strings are encoded as UTF-8.
 * A number is a zero-filled length, matching `DataBuffer`.
 */
export type HashInput = number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array;
/** 256-entry reflected lookup table for {@link CRC32_POLYNOMIAL}. */
export declare const CRC32_TABLE: number[];
/** 256-entry reflected lookup table for {@link CRC32C_POLYNOMIAL}. */
export declare const CRC32C_TABLE: number[];
/**
 * Allocation-free CRC-32 for an already-normalized byte view.
 * Preconditions: bytes is an Uint8Array (including Buffer) and it is not mutated concurrently.
 * The view's byteOffset and byteLength are honored by indexed access.
 * @param bytes Bytes to hash.
 * @returns Unsigned CRC-32.
 */
export declare const computeBytes: (bytes: Uint8Array) => number;
/**
 * Derive the Cyclic Redundancy Check of a data blob.
 * This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.
 * The same value is available as an unsigned integer from {@link compute}.
 * @see {@link https://rosettacode.org/wiki/CRC-32|CRC-32}
 * @see {@link https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32-iso-hdlc|CRC-32/ISO-HDLC}
 * @example <caption>CRC32.of(...)</caption>
 * import CRC32 from '@uttori/data-tools/data-hash-crc32';
 * CRC32.of('The quick brown fox jumps over the lazy dog');
 * ➜ '414FA339'
 * @param data The data to process.
 * @returns Uppercase hexadecimal CRC-32. Values below `0x10000000` are not padded.
 */
export declare const calculate: (data: HashInput) => string;
/**
 * CRC-32/ISO-HDLC as an unsigned 32-bit integer.
 * Matches `@uttori/asm-core` `CRC32.compute`, `node:zlib` `crc32`, and the PNG chunk checksum.
 * @see {@link https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32-iso-hdlc|CRC-32/ISO-HDLC}
 * @example <caption>CRC32.compute(...)</caption>
 * import CRC32 from '@uttori/data-tools/data-hash-crc32';
 * CRC32.compute('123456789');
 * ➜ 0xCBF43926
 * @param data The data to process.
 * @returns Unsigned CRC-32 value.
 */
export declare const compute: (data: HashInput) => number;
/**
 * CRC-32C/Castagnoli as an unsigned 32-bit integer.
 * Initial value and final XOR are both `0xFFFFFFFF`, LSB first.
 * Pass `zeroChecksum` to hash bytes 56–59 as zero without modifying `data`, which is how an ACT2 chunk checks the word stored at that offset.
 * @see {@link https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32c|CRC-32C}
 * @example <caption>CRC32.crc32c(...)</caption>
 * import CRC32 from '@uttori/data-tools/data-hash-crc32';
 * CRC32.crc32c('123456789');
 * ➜ 0xE3069283
 * CRC32.crc32c(chunk, true);
 * ➜ checksum with bytes 56–59 treated as zero
 * @param data The data to process.
 * @param zeroChecksum Treat ACT2 checksum bytes 56–59 as zero. Defaults to false.
 * @returns Unsigned CRC-32C value.
 */
export declare const crc32c: (data: HashInput, zeroChecksum?: boolean) => number;
/**
 * Allocation-free CRC-32C for an already-normalized byte view.
 * The zeroChecksum positions are relative to this view, not its backing buffer.
 * This function never changes bytes. It has the same preconditions as {@link computeBytes}.
 * @param bytes Bytes to hash.
 * @param zeroChecksum Treat existing bytes 56-59 as zero.
 * @returns Unsigned CRC-32C.
 */
export declare const crc32cBytes: (bytes: Uint8Array, zeroChecksum?: boolean) => number;
declare const _default: {
    of: typeof calculate;
    compute: typeof compute;
    crc32c: typeof crc32c;
    computeBytes: typeof computeBytes;
    crc32cBytes: typeof crc32cBytes;
};
export default _default;
//# sourceMappingURL=data-hash-crc32.d.ts.map