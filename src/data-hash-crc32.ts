import type DataBuffer from "./data-buffer.js";

/** Same brand DataBuffer defines, so this module does not import the buffer implementation. */
const DATA_BUFFER_BRAND = "uttori.DataBuffer";

/** Reflected polynomial for CRC-32/ISO-HDLC, used by PNG, ZIP, zlib, and `@uttori/asm-core`. */
export const CRC32_POLYNOMIAL = 0xedb88320;

/** Reflected polynomial for CRC-32C/Castagnoli, used by ACT2 capture chunks. */
export const CRC32C_POLYNOMIAL = 0x82f63b78;

/**
 * Bytes accepted by the checksum helpers. Strings are encoded as UTF-8.
 * A number is a zero-filled length, matching `DataBuffer`.
 */
export type HashInput =
  | number[]
  | ArrayBuffer
  | Buffer
  | DataBuffer
  | Int8Array
  | Int16Array
  | Int32Array
  | number
  | string
  | Uint8Array
  | Uint16Array
  | Uint32Array;

/**
 * Build the 256-entry reflected lookup table for a polynomial.
 * @param polynomial Reflected CRC polynomial.
 * @returns Unsigned table entries.
 */
const reflectedTable = (polynomial: number): number[] =>
  Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? polynomial ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
  });

/**
 * Build the eight slicing tables that fold eight bytes per step.
 * @param table Byte lookup table.
 * @returns Slicing tables, index 0 is the byte table.
 */
const sliceTable = (table: number[]): Uint32Array[] => {
  const slices: Uint32Array[] = [Uint32Array.from(table)];
  for (let width = 1; width < 8; width++) {
    const previous = slices[width - 1];
    slices.push(Uint32Array.from(previous, (crc) => (crc >>> 8) ^ table[crc & 0xff]));
  }
  // A fresh literal so destructuring the return is not a property-read side effect.
  return [slices[0], slices[1], slices[2], slices[3], slices[4], slices[5], slices[6], slices[7]];
};

/** 256-entry reflected lookup table for {@link CRC32_POLYNOMIAL}. */
export const CRC32_TABLE = /* @__PURE__ */ reflectedTable(CRC32_POLYNOMIAL);

/** 256-entry reflected lookup table for {@link CRC32C_POLYNOMIAL}. */
export const CRC32C_TABLE = /* @__PURE__ */ reflectedTable(CRC32C_POLYNOMIAL);

// Each set occupies 8 KiB of typed-array payload.
// Exported number[] tables remain available, but should be treated as constants, not customization hooks.
// Pure so importing the module for nothing else does not keep the tables.
const crc32Slices = /* @__PURE__ */ sliceTable(CRC32_TABLE);
const crc32cSlices = /* @__PURE__ */ sliceTable(CRC32C_TABLE);
const [i0, i1, i2, i3, i4, i5, i6, i7] = crc32Slices;
const [c0, c1, c2, c3, c4, c5, c6, c7] = crc32cSlices;

/** Text encoder for string inputs. */
let textEncoder: TextEncoder;

/**
 * DataBuffer stamps this brand in its constructor.
 * @param data Value that might be a DataBuffer.
 * @returns Whether checksums should read `data.data`.
 */
function isDataBuffer(data: HashInput): data is DataBuffer {
  return typeof data === "object" && data !== null && Symbol.for(DATA_BUFFER_BRAND) in data;
}

/**
 * Normalize any accepted input to the bytes that will be hashed.
 * Matches DataBuffer's conversions without importing that module.
 * @param data The data to process.
 * @returns Bytes to hash.
 */
const hashBytes = (data: HashInput): Uint8Array => {
  // This also covers Node.js Buffer.
  if (data instanceof Uint8Array) {
    return data;
  }
  if (isDataBuffer(data)) {
    return data.data;
  }
  if (typeof data === "string") {
    textEncoder ??= new TextEncoder();
    return textEncoder.encode(data);
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  if (typeof data === "number") {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data) && data.buffer instanceof ArrayBuffer) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  const error = `Unknown type of input for DataBuffer: ${typeof data}`;
  throw new TypeError(error);
};

/**
 * Allocation-free CRC-32 for an already-normalized byte view.
 * Preconditions: bytes is an Uint8Array (including Buffer) and it is not mutated concurrently.
 * The view's byteOffset and byteLength are honored by indexed access.
 * @param bytes Bytes to hash.
 * @returns Unsigned CRC-32.
 */
export const computeBytes = (bytes: Uint8Array): number => {
  let crc = -1;
  let index = 0;
  const length = bytes.length;
  const blockEnd = length - 7;
  for (; index < blockEnd; index += 8) {
    const mixed =
      crc ^
      (bytes[index] |
        (bytes[index + 1] << 8) |
        (bytes[index + 2] << 16) |
        (bytes[index + 3] << 24));
    crc =
      i7[mixed & 0xff] ^
      i6[(mixed >>> 8) & 0xff] ^
      i5[(mixed >>> 16) & 0xff] ^
      i4[mixed >>> 24] ^
      i3[bytes[index + 4]] ^
      i2[bytes[index + 5]] ^
      i1[bytes[index + 6]] ^
      i0[bytes[index + 7]];
  }
  for (; index < length; index++) {
    crc = (crc >>> 8) ^ i0[(crc ^ bytes[index]) & 0xff];
  }
  return ~crc >>> 0;
};

/**
 * CRC-32/ISO-HDLC of `data` as an unsigned 32-bit integer.
 * Initial value and final XOR are both `0xFFFFFFFF`, LSB first.
 * @param data The data to process.
 * @returns Unsigned CRC-32 value.
 */
const isoChecksum = (data: HashInput): number => computeBytes(hashBytes(data));

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
export const calculate = (data: HashInput): string => isoChecksum(data).toString(16).toUpperCase();

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
export const compute = (data: HashInput): number => isoChecksum(data);

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
export const crc32c = (data: HashInput, zeroChecksum = false): number =>
  crc32cBytes(hashBytes(data), zeroChecksum);

/**
 * Allocation-free CRC-32C for an already-normalized byte view.
 * The zeroChecksum positions are relative to this view, not its backing buffer.
 * This function never changes bytes. It has the same preconditions as {@link computeBytes}.
 * @param bytes Bytes to hash.
 * @param zeroChecksum Treat existing bytes 56-59 as zero.
 * @returns Unsigned CRC-32C.
 */
export const crc32cBytes = (bytes: Uint8Array, zeroChecksum = false): number => {
  let crc = -1;
  let index = 0;
  const length = bytes.length;
  const blockEnd = length - 7;
  for (; index < blockEnd; index += 8) {
    let low =
      bytes[index] | (bytes[index + 1] << 8) | (bytes[index + 2] << 16) | (bytes[index + 3] << 24);
    if (zeroChecksum && index === 56) {
      low = 0;
    }
    const mixed = crc ^ low;
    crc =
      c7[mixed & 0xff] ^
      c6[(mixed >>> 8) & 0xff] ^
      c5[(mixed >>> 16) & 0xff] ^
      c4[mixed >>> 24] ^
      c3[bytes[index + 4]] ^
      c2[bytes[index + 5]] ^
      c1[bytes[index + 6]] ^
      c0[bytes[index + 7]];
  }
  for (; index < length; index++) {
    const byte = zeroChecksum && index >= 56 && index < 60 ? 0 : bytes[index];
    crc = (crc >>> 8) ^ c0[(crc ^ byte) & 0xff];
  }
  return ~crc >>> 0;
};

export default {
  of: calculate,
  compute,
  crc32c,
  computeBytes,
  crc32cBytes,
};
