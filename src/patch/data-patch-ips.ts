/** No-op logger, replaced by the `debug` package when enabled. */
let debug = (..._args: unknown[]) => {};
/* c8 ignore next */
if (typeof process !== "undefined" && !!process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import("debug");
    debug = d("IPS");
  } catch {}
}

import DataBuffer from "../data-buffer.js";

/**  A chunk of IPS data. */
export interface IPSChunk {
  /** 3 bytes. The starting offset of the change. */
  offset: number;
  /** The length of the change. */
  length: number;
  /** The type of change, value is not undefined when Run Length Encoding is being used. */
  rle?: number;
  /** The data to be used for the change when not RLE. */
  data?: number[] | Uint8Array;
}

/** The maximum output file size supported by this implementation, 16 mebibytes. */
export const IPS_MAX_SIZE = 0x1000000;

/**
 * IPS as a format is a simple format for binary file patches, popular in the ROM hacking community
 * "IPS" allegedly stands for "International Patching System".
 * FuSoYa's LunarIPS extension that writes beyond EOF to support a "cut" / truncate command is also supported.
 * IPS as a class can be used to:
 * - Parse IPS patch and apply to file
 * - Create IPS from file and modified file
 * - Debug IPS patch
 * An IPS file starts with the magic number "PATCH" (50 41 54 43 48), followed by a series of hunks and an end-of-file marker "EOF" (45 4f 46).
 * All numerical values are unsigned and stored big-endian.
 *
 * Regular hunks consist of a three-byte offset followed by a two-byte length of the payload and the payload itself.
 * Applying the hunk is done by writing the payload at the specified offset.
 *
 * RLE hunks have their length field set to zero; in place of a payload there is a two-byte length of the run followed by a single byte indicating the value to be written.
 * Applying the RLE hunk is done by writing this byte the specified number of times at the specified offset.
 *
 * As an extension, the end-of-file marker may be followed by a three-byte length to which the resulting file should be truncated.
 * Not every patching program will implement this extension, however.
 * @see {@link http://fileformats.archiveteam.org/wiki/IPS_(binary_patch_format)}
 */
class IPS extends DataBuffer {
  /** The chunks to be applied to the data. */
  hunks: IPSChunk[] = [];

  /** The 3 byte length the file should be truncated to. */
  truncate = 0;

  /** Whether a truncate command is present, including an explicit truncate to zero bytes. */
  hasTruncate = false;

  /**
   * Creates an instance of IPS.
   * @param input The data to process.
   * @param parse Whether to immediately parse the IPS file. Default is true.
   * @throws {TypeError} Missing input data.
   * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
   */
  constructor(
    input:
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
      | Uint32Array = 0,
    parse = true,
  ) {
    super(input);

    // IPS Specific Fields
    this.hunks = [];
    this.truncate = 0;
    this.hasTruncate = false;

    if (input && parse) {
      this.parse();
    }
  }

  /**
   * Parse the IPS file, decoding the hunks.
   */
  parse(): void {
    debug("parse");
    const originalOffset = this.offset;
    const hunks: IPSChunk[] = [];
    let truncate = 0;
    let hasTruncate = false;
    try {
      // Verify the header of the patch file.
      this.seek(0);
      this.decodeHeader();

      // While there is data left, keep parsing. A complete EOF marker is required.
      while (true) {
        if (this.remainingBytes() < 3) {
          throw new Error("Missing or incomplete IPS EOF marker.");
        }
        const offset = this.readUInt24();

        // Check for "EOF" ASCII string as 0x454f46 for the end of patch data
        if (offset === 0x454f46) {
          // If there are no more remaining bytes, we are done.
          if (!this.remainingBytes()) {
            debug("EOF:", offset);
            break;
          } else if (this.remainingBytes() === 3) {
            // We have a truncate command after the "EOF" string.
            truncate = this.readUInt24();
            hasTruncate = true;
            debug("Truncate:", truncate, "at offset", offset);
            break;
          }
          throw new Error("Invalid IPS data after EOF; expected zero or three bytes.");
        }

        // Read the next 2 bytes for either 0 for a RLE hunk up to 0xFFFF long, or a number for a SIMPLE hunk.
        let length = this.readUInt16();
        let hunk: IPSChunk;
        if (length === 0x0000) {
          length = this.readUInt16();
          const rle = this.readUInt8();
          debug(
            "RLE:",
            `0x${rle.toString(16).toUpperCase().padStart(2, "0")}`,
            "with length",
            length,
            "at offset",
            offset,
          );
          hunk = { offset, rle, length };
        } else {
          const data = this.read(length);
          debug("XXX:", "with length", length, "at offset", offset);
          const payload = new Array<number>(length);
          for (let i = 0; i < length; i++) {
            payload[i] = data[i];
          }
          hunk = { offset, length, data: payload };
        }
        // Payload bytes came from a Uint8Array and need no second per-byte validity scan.
        IPS.validateHunk(hunk, false);
        hunks.push(hunk);
      }
    } catch (error) {
      // A malformed patch must not replace a previously parsed patch or leave its cursor half advanced.
      this.offset = originalOffset;
      throw error;
    }

    this.hunks = hunks;
    this.truncate = truncate;
    this.hasTruncate = hasTruncate;
    debug("Hunks:", this.hunks.length);
  }

  /**
   * Decodes and validates IPS Header.
   *
   * The header takes up the first five bytes of the file.
   * These bytes should all correspond to ASCII character codes.
   *
   * Signature (Decimal): [80, 65, 84, 67, 72]
   * Signature (Hexadecimal): [50, 41, 54, 43, 48]
   * Signature (ASCII): [P, A, T, C, H]
   *
   * @throws {Error} Missing or invalid IPS header
   */
  decodeHeader(): void {
    debug("decodeHeader:", this.offset);
    if (this.remainingBytes() < 5) {
      throw new Error("Missing or invalid IPS header.");
    }
    const header = this.readString(5);
    debug("Header:", header);
    if (header !== "PATCH") {
      throw new Error("Missing or invalid IPS header.");
    }
  }

  /**
   * Convert the current instance to an IPS file Buffer instance.
   * @returns The new IPS file as a Buffer.
   */
  encode(): DataBuffer {
    this.validateTruncate();
    // Calculate the final size of the patch.
    // PATCH string
    let bytes = 5;
    // Calculate all the hunks sizes.
    for (const hunk of this.hunks) {
      IPS.validateHunk(hunk);
      if (typeof hunk.rle !== "undefined") {
        // offset + 0x0000 + length + RLE byte to be written
        bytes += 3 + 2 + 2 + 1;
      } else if (typeof hunk.data !== "undefined") {
        // offset + length + data
        bytes += 3 + 2 + hunk.data.length;
      }
    }
    // EOF string
    bytes += 3;
    // Truncate
    const hasTruncate = this.hasTruncate || this.truncate !== 0;
    if (hasTruncate) {
      bytes += 3;
    }

    debug("encode bytes:", bytes);
    // Allocate exactly once instead of staging every output byte in a number array.
    const data = new Uint8Array(bytes);
    data.set([0x50, 0x41, 0x54, 0x43, 0x48]);
    let offset = 5;

    // Loop over the hunks to export
    for (const hunk of this.hunks) {
      data[offset++] = hunk.offset >>> 16;
      data[offset++] = hunk.offset >>> 8;
      data[offset++] = hunk.offset;
      if (typeof hunk.rle !== "undefined") {
        data[offset++] = 0;
        data[offset++] = 0;
        data[offset++] = hunk.length >>> 8;
        data[offset++] = hunk.length;
        data[offset++] = hunk.rle;
      } else if (typeof hunk.data !== "undefined") {
        data[offset++] = hunk.length >>> 8;
        data[offset++] = hunk.length;
        data.set(hunk.data, offset);
        offset += hunk.length;
      }
    }
    // Close the patch.
    data.set([0x45, 0x4f, 0x46], offset);
    offset += 3;

    // Check for the "cut" command data.
    if (hasTruncate) {
      data[offset++] = this.truncate >>> 16;
      data[offset++] = this.truncate >>> 8;
      data[offset++] = this.truncate;
    }

    const patch = new DataBuffer(data);
    patch.offset = offset;
    return patch;
  }

  /**
   * Apply the IPS patch to an input DataBuffer.
   * @param input The binary to patch.
   * @returns The patched binary.
   */
  apply(input: DataBuffer): DataBuffer {
    this.validateTruncate();
    let length = input.data.length;
    for (const hunk of this.hunks) {
      IPS.validateHunk(hunk);
      length = Math.max(length, hunk.offset + hunk.length);
    }
    if (this.hasTruncate || this.truncate !== 0) {
      // The EOF extension specifies the final length, after all records have been applied.
      length = this.truncate;
    }
    if (length > IPS_MAX_SIZE) {
      throw new Error("files are too big for IPS format");
    }

    const data = new Uint8Array(length);
    data.set(input.data.subarray(0, length));
    for (const hunk of this.hunks) {
      if (hunk.offset >= length) {
        continue;
      }
      const end = Math.min(length, hunk.offset + hunk.length);
      if (typeof hunk.rle !== "undefined") {
        data.fill(hunk.rle, hunk.offset, end);
      } else if (hunk.data) {
        const payload =
          end === hunk.offset + hunk.length ? hunk.data : hunk.data.slice(0, end - hunk.offset);
        data.set(payload, hunk.offset);
      }
    }

    // Return committed bytes at offset zero without mutating the input bytes or cursor.
    return new DataBuffer(data);
  }

  /**
   * Calculate the difference between two DataBuffers and save it as an IPS patch.
   * @static
   * @param original The original file to compare against, using all committed bytes regardless of its cursor.
   * @param modified The modified file, using all committed bytes regardless of its cursor.
   * @returns The IPS patch file data as a Buffer.
   */
  static createIPSFromDataBuffers(original: DataBuffer, modified: DataBuffer): IPS {
    const patch = new IPS(0, false);
    const source = original.data;
    const target = modified.data;

    // Check for truncation.
    const modifiedFileSize = target.length;
    const originalFileSize = source.length;
    if (modifiedFileSize > IPS_MAX_SIZE) {
      throw new Error("files are too big for IPS format");
    }
    if (modifiedFileSize < originalFileSize) {
      patch.truncate = modifiedFileSize;
      patch.hasTruncate = true;
    }

    // solution: save startOffset and endOffset (go looking from 6 to 6 backwards)
    // Scan committed bytes directly; creation never consumes either input cursor.
    let position = 0;
    while (position < modifiedFileSize) {
      if ((source[position] ?? 0) === target[position]) {
        position++;
        continue;
      }

      // A record cannot start at the reserved EOF marker; include the preceding target byte instead.
      const startOffset = position === 0x454f46 ? position - 1 : position;
      let endOffset = startOffset;
      let RLEmode = true;
      const rle = target[startOffset];
      while (endOffset < modifiedFileSize && endOffset - startOffset < 0xffff) {
        if (endOffset >= position && (source[endOffset] ?? 0) === target[endOffset]) {
          break;
        }
        if (target[endOffset] !== rle) {
          RLEmode = false;
        }
        endOffset++;
      }
      position = endOffset;
      const length = endOffset - startOffset;
      const previousRecord = patch.hunks[patch.hunks.length - 1];

      // check if this record is near the previous one
      const previousEnd = previousRecord ? previousRecord.offset + previousRecord.length : 0;
      const distance = startOffset - previousEnd;
      if (
        Array.isArray(previousRecord?.data) &&
        distance >= 0 &&
        distance < 6 &&
        previousRecord.length + distance + length <= 0xffff &&
        !(RLEmode && length > 6)
      ) {
        // merge both records
        for (let i = previousEnd; i < endOffset; i++) {
          previousRecord.data.push(target[i]);
        }
        previousRecord.length = endOffset - previousRecord.offset;
      } else {
        // separate a potential RLE record without rewinding or retrying the same input region
        if (RLEmode && length > 2) {
          patch.hunks.push({ offset: startOffset, rle, length });
        } else {
          patch.hunks.push({
            offset: startOffset,
            length,
            data: Array.from(target.subarray(startOffset, endOffset)),
          });
        }
      }
    }

    if (modifiedFileSize > originalFileSize) {
      const lastRecord = patch.hunks[patch.hunks.length - 1];
      const lastOffset = lastRecord ? lastRecord.offset + lastRecord.length : 0;
      if (lastOffset < modifiedFileSize) {
        const offset =
          modifiedFileSize - 1 === 0x454f46 ? modifiedFileSize - 2 : modifiedFileSize - 1;
        patch.hunks.push({
          offset,
          length: modifiedFileSize - offset,
          data: Array.from(target.subarray(offset)),
        });
      }
    }

    return patch;
  }

  /** Validate manually supplied or parsed records before encoding or applying any of them. */
  private static validateHunk(hunk: IPSChunk, validateData = true): void {
    if (
      !Number.isInteger(hunk.offset) ||
      hunk.offset < 0 ||
      hunk.offset >= IPS_MAX_SIZE ||
      hunk.offset === 0x454f46
    ) {
      throw new RangeError(`Invalid IPS hunk offset: ${hunk.offset}`);
    }
    if (
      !Number.isInteger(hunk.length) ||
      hunk.length < 1 ||
      hunk.length > 0xffff ||
      hunk.offset + hunk.length > IPS_MAX_SIZE
    ) {
      throw new RangeError(`Invalid IPS hunk length: ${hunk.length}`);
    }
    if (typeof hunk.rle !== "undefined") {
      if (
        !Number.isInteger(hunk.rle) ||
        hunk.rle < 0 ||
        hunk.rle > 255 ||
        typeof hunk.data !== "undefined"
      ) {
        throw new RangeError("Invalid IPS RLE payload.");
      }
    } else {
      if (
        (!Array.isArray(hunk.data) && !(hunk.data instanceof Uint8Array)) ||
        hunk.data.length !== hunk.length
      ) {
        throw new RangeError("IPS hunk data length must match its declared length.");
      }
      if (validateData && Array.isArray(hunk.data)) {
        for (let i = 0; i < hunk.data.length; i++) {
          if (!Number.isInteger(hunk.data[i]) || hunk.data[i] < 0 || hunk.data[i] > 255) {
            throw new RangeError(`Invalid IPS byte at index ${i}: ${hunk.data[i]}`);
          }
        }
      }
    }
  }

  /** Validate the optional three-byte final size, including an explicit zero-length result. */
  private validateTruncate(): void {
    if (!Number.isInteger(this.truncate) || this.truncate < 0 || this.truncate >= IPS_MAX_SIZE) {
      throw new RangeError(`Invalid IPS truncate length: ${this.truncate}`);
    }
  }
}

export default IPS;
