let debug = (..._) => {};
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) { try { const { default: d } = await import('debug'); debug = d('IPS'); } catch {} }

import DataBuffer from '@uttori/data-tools/data-buffer';
import { hexTable } from '../data-formating.js';

/**
 * A chunk of IPS data.
 * @typedef {object} IPSChunk
 * @property {number} offset 3 bytes. The starting offset of the change.
 * @property {number} length The length of the change.
 * @property {number} [rle] The type of change, value is not undefined when Run Length Encoding is being used.
 * @property {number[]} [data] The data to be used for the change when not RLE.
 */

/** @type {number} The maximum size of a file in the IPS format, 16 megabytes. */
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
  /**
   * Creates an instance of IPS.
   * @param {Array|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} input The data to process.
   * @param {boolean} [parse] Whether to immediately parse the IPS file. Default is true.
   * @throws {TypeError} Missing input data.
   * @throws {TypeError} Unknown type of input for DataBuffer: ${typeof input}
   * @class
   */
  constructor(input = 0, parse = true) {
    super(input);

    // IPS Specific Fields
    /** @type {IPSChunk[]} The changed to be made. */
    this.hunks = [];
    /** @type {number} The 3 byte length the file should be truncated to. */
    this.truncate = 0;

    if (input && parse) {
      this.parse();
    }
  }

  /**
   * Parse the IPS file, decoding the hunks.
   */
  parse() {
    debug('parse');
    // Verify the header of the patch file.
    this.decodeHeader();

    // While there is data left, keep parsing.
    while (this.remainingBytes()) {
      const offset = this.readUInt24();

      // Check for "EOF" ASCII string as 0x454f46 for the end of patch data
      if (offset === 0x454F46) {
        // If there are no more remaining bytes, we are done.
        if (!this.remainingBytes()) {
          debug('EOF:', offset);
          break;
        } else if (this.remainingBytes() === 3) {
          // We have a truncate command after the "EOF" string.
          this.truncate = this.readUInt24();
          debug('Truncate:', this.truncate, 'at offset', offset);
          break;
        }
      }

      // Read the next 2 bytes for either 0 for a RLE hunk up to 0xFFFF long, or a number for a SIMPLE hunk.
      let length = this.readUInt16();
      if (length === 0x0000) {
        length = this.readUInt16();
        const rle = this.readUInt8();
        debug('RLE:', `0x${rle.toString(16).toUpperCase().padStart(2, '0')}`, 'with length', length, 'at offset', offset);
        this.hunks.push({ offset, rle, length });
      } else {
        const data = this.read(length);
        debug('XXX:', 'with length', length, 'at offset', offset);
        debug(hexTable(new DataBuffer(data)));
        this.hunks.push({ offset, length, data: Array.from(data) });
      }
    }

    debug('Hunks:', this.hunks.length);
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
  decodeHeader() {
    debug('decodeHeader:', this.offset);
    const header = this.readString(5);
    debug('Header:', header);
    if (header !== 'PATCH') {
      throw new Error('Missing or invalid IPS header.');
    }
  }

  /**
   * Convert the current instance to an IPS file Buffer instance.
   * @returns {DataBuffer} The new IPS file as a Buffer.
   */
  encode() {
    // Calculate the final size of the patch.
    // PATCH string
    let bytes = 5;
    // Calculate all the hunks sizes.
    for (const hunk of this.hunks) {
      if (typeof hunk.rle !== 'undefined') {
        // offset + 0x0000 + length + RLE byte to be written
        bytes += (3 + 2 + 2 + 1);
      } else if (typeof hunk.data !== 'undefined') {
        // offset + length + data
        bytes += (3 + 2 + hunk.data.length);
      }
    }
    // EOF string
    bytes += 3;
    // Truncate
    if (this.truncate) {
      bytes += 3;
    }

    debug('encode bytes:', bytes);
    const patch = new DataBuffer();
    patch.writeString('PATCH', 0);

    // Loop over the hunks to export
    for (const hunk of this.hunks) {
      patch.writeUInt24(hunk.offset);
      if (typeof hunk.rle !== 'undefined') {
        patch.writeUInt16(0x0000);
        patch.writeUInt16(hunk.length);
        patch.writeUInt8(hunk.rle);
      } else if (typeof hunk.data !== 'undefined') {
        patch.writeUInt16(hunk.data.length);
        patch.writeBytes(hunk.data);
      }
    }
    // Close the patch.
    patch.writeString('EOF');

    // Check for the "cut" command data.
    if (this.truncate) {
      patch.writeUInt24(this.truncate);
    }

    patch.commit();
    return patch;
  }

  /**
   * Apply the IPS patch to an input DataBuffer.
   * @param {DataBuffer} input The binary to patch.
   * @returns {DataBuffer} The patched binary.
   */
  apply(input) {
    let output = input.copy();
    if (this.truncate) {
      output = input.slice(0, this.truncate);
    }

    input.seek(0);

    for (const hunk of this.hunks) {
      output.seek(hunk.offset);
      if (hunk.rle) {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let j = 0; j < hunk.length; j++) {
          output.writeUInt8(hunk.rle);
        }
      } else if (hunk.data) {
        output.writeBytes(hunk.data);
      }
    }

    return output;
  }

  /**
   * Calculate the difference between two DataBuffers and save it as an IPS patch.
   * @static
   * @param {DataBuffer} original The original file to compare against.
   * @param {DataBuffer} modified The modified file.
   * @returns {IPS} The IPS patch file data as a Buffer.
   */
  static createIPSFromDataBuffers(original, modified) {
    const patch = new IPS(0, false);

    // Check for truncation.
    const modifiedFileSize = modified.remainingBytes();
    const originalFileSize = original.remainingBytes();
    if (modifiedFileSize < originalFileSize) {
      patch.truncate = modifiedFileSize;
    }

    // solution: save startOffset and endOffset (go looking from 6 to 6 backwards)
    /** @type {IPSChunk} */
    let previousRecord = { offset: 0, length: 0 };
    while (modified.remainingBytes()) {
      let b1 = !original.remainingBytes() ? 0x00 : original.readUInt8();
      let b2 = modified.readUInt8();

      if (b1 !== b2) {
        let RLEmode = true;
        const differentData = [];
        const startOffset = modified.offset - 1;

        while (b1 !== b2 && differentData.length < 0xffff) {
          differentData.push(b2);
          if (b2 !== differentData[0]) {
            RLEmode = false;
          }

          if (!modified.remainingBytes() || differentData.length === 0xFFFF) {
            break;
          }

          b1 = !original.remainingBytes() ? 0x00 : original.readUInt8();
          b2 = modified.readUInt8();
        }

        // check if this record is near the previous one
        let distance = startOffset - (previousRecord.offset + previousRecord.length);
        if (!previousRecord.rle && distance < 6 && (previousRecord.length + distance + differentData.length) < 0xFFFF) {
          if (RLEmode && differentData.length > 6) {
            // separate a potential RLE record
            original.seek(startOffset);
            modified.seek(startOffset);
            previousRecord = { offset: 0, length: 0 };
          } else {
            // merge both records
            while (distance--) {
              previousRecord.data.push(modified.data[previousRecord.offset + previousRecord.length]);
              previousRecord.length++;
            }
            previousRecord.data = previousRecord.data.concat(differentData);
            previousRecord.length = previousRecord.data.length;
          }
        } else {
          if (startOffset >= IPS_MAX_SIZE) {
            throw new Error('files are too big for IPS format');
          }

          if (RLEmode && differentData.length > 2) {
            patch.hunks.push({
              offset: startOffset,
              rle: differentData[0],
              length: differentData.length,
            });
          } else {
            patch.hunks.push({
              offset: startOffset,
              length: differentData.length,
              data: differentData,
            });
          }
          previousRecord = patch.hunks[patch.hunks.length - 1];
        }
      }
    }

    if (modifiedFileSize > originalFileSize) {
      const lastRecord = patch.hunks[patch.hunks.length - 1];
      const lastOffset = lastRecord.offset + lastRecord.length;
      if (lastOffset < modifiedFileSize) {
        patch.hunks.push({
          offset: modifiedFileSize - 1,
          length: 1,
          data: [0x00],
        });
      }
    }

    return patch;
  }
}

export default IPS;
