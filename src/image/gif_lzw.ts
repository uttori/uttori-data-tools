/** No-op logger, replaced by the `debug` package when enabled. */
let debug = (..._args: unknown[]) => {};
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import("debug");
    debug = d("Uttori.GIFLZW");
  } catch {}
}

/** Bounds for one complete GIF LZW operation. */
export interface GIFLZWOptions {
  readonly maxInputBytes?: number;
  readonly maxOutputBytes?: number;
  /** Require exactly this many decoded indexes, including zero for an empty stream. */
  readonly expectedLength?: number;
  /** Ignore complete bytes following EOI; unused bits in its final byte are always allowed. */
  readonly allowTrailingBytes?: boolean;
}

/** Resolve an allocation limit before allocating or growing a buffer. */
function byteLimit(value: number | undefined, name: string): number {
  const limit = value ?? 64 * 1024 * 1024;
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
  return limit;
}

/** GIF minimum code sizes are two through eight; the code stream grows to twelve bits. */
function validateCodeSize(codeSize: number): void {
  if (!Number.isInteger(codeSize) || codeSize < 2 || codeSize > 8) {
    throw new RangeError("GIF LZW minimum code size must be an integer in [2, 8].");
  }
}

/** Validate plain arrays without copying typed byte views or changing their byte offsets. */
function validateInput(input: number[] | Uint8Array, maximum: number, maxBytes: number): void {
  if (!Array.isArray(input) && !(input instanceof Uint8Array)) {
    throw new TypeError("GIF LZW input must be a number[] or Uint8Array.");
  }
  if (input.length > maxBytes) {
    throw new RangeError("GIF LZW exceeds the input byte limit.");
  }
  if (Array.isArray(input) || maximum < 255) {
    for (const value of input) {
      if (!Number.isInteger(value) || value < 0 || value > maximum) {
        throw new RangeError(`GIF LZW input value must be an integer in [0, ${maximum}].`);
      }
    }
  }
}

/** Validate the public bit cursor, including callers that deliberately rewind it. */
function validateCursor(offset: number, bitOffset: number, length: number): void {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > length) {
    throw new RangeError("GIF LZW byte offset is out of bounds.");
  }
  if (!Number.isInteger(bitOffset) || bitOffset < 0 || bitOffset > 7) {
    throw new RangeError("GIF LZW bit offset must be an integer in [0, 7].");
  }
}

/** Validate the public pack/unpack width independently of the minimum code size. */
function validateCodeLength(codeLength: number): void {
  if (!Number.isInteger(codeLength) || codeLength < 1 || codeLength > 12) {
    throw new RangeError("GIF LZW code length must be an integer in [1, 12].");
  }
}

/**
 * GIF LZW Compression
 * The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.
 *
 * Byte APIs avoid string dictionaries and per-bit loops. Complete operations rewind
 * their cursor automatically; pack()/unpack() still advance the public cursor.
 * @class
 */
class GIFLZW {
  /** The input data. */
  input: number[] | Uint8Array;
  /** The output data. */
  output: number[];
  /** The current offset in the output data. */
  offset: number;
  /** The current bit offset in the output data. */
  bitOffset: number;

  /**
   * Creates a new GIFLZW instance.
   * @param input The input data
   */
  constructor(input: number[] | Uint8Array = []) {
    debug("constructor:", input.length);
    this.input = input;
    this.output = [];
    this.offset = 0;
    this.bitOffset = 0;
  }

  /**
   * Initialize the compression or decompression dictionary based on the code size.
   * @param size Size of lookup, `(1 << Code Size) + 2`, the extra two are Clear Code & End of Information
   * @param compress Type of dictionary returned, compression when true, decompression when false. Defaults to true.
   * @returns The built to size dictionary.
   */
  buildDictionary(size: number, compress = true): Record<number | string, number | string> {
    debug("buildDictionary:", size);
    if (!Number.isInteger(size) || size < 0 || size > 4096) {
      throw new RangeError("Dictionary size must be an integer in [0, 4096].");
    }
    if (typeof compress !== "boolean") {
      throw new TypeError("compress must be a boolean.");
    }
    // Retained for compatibility; neither hot path builds strings or object dictionaries.
    const dictionary: Record<number | string, number | string> = {};
    let i = 0;
    while (i < size) {
      if (compress) {
        dictionary[String.fromCharCode(i)] = i;
      } else {
        dictionary[i] = String.fromCharCode(i);
      }
      i++;
    }
    return dictionary;
  }

  /**
   * Pack the colors as a series of bits, based on the codeSize.
   * @param codeLength The code length
   * @param code The code
   */
  pack(codeLength: number, code: number): void {
    validateCodeLength(codeLength);
    validateCursor(this.offset, this.bitOffset, this.output.length);
    if (!Number.isInteger(code) || code < 0 || code >= 1 << codeLength) {
      throw new RangeError("GIF LZW code does not fit the code length.");
    }
    // Write at most three byte fragments, replacing rather than adding existing bits.
    let remaining = codeLength;
    while (remaining > 0) {
      const count = Math.min(8 - this.bitOffset, remaining);
      const mask = (1 << count) - 1;
      this.output[this.offset] =
        ((this.output[this.offset] ?? 0) & ~(mask << this.bitOffset)) |
        ((code & mask) << this.bitOffset);
      code >>>= count; // code = Math.floor(code / 2 ** count);
      this.bitOffset += count;
      remaining -= count;
      if (this.bitOffset === 8) {
        this.offset++;
        this.bitOffset = 0;
      }
    }
    // debug('data =', this.output);
  }

  /**
   * Unpack
   * @param codeLength Code Length
   * @param useInput Unpacking the `input` or the `output`. Defaults to true, using the input.
   * @returns The unpacked code
   */
  unpack(codeLength: number, useInput = true): number {
    validateCodeLength(codeLength);
    if (typeof useInput !== "boolean") {
      throw new TypeError("useInput must be a boolean.");
    }
    const data = useInput ? this.input : this.output;
    validateCursor(this.offset, this.bitOffset, data.length);
    if (this.offset * 8 + this.bitOffset + codeLength > data.length * 8) {
      throw new Error("Truncated GIF LZW code.");
    }
    let value = 0;
    const byteCount = Math.ceil((this.bitOffset + codeLength) / 8);
    for (let i = 0; i < byteCount; i++) {
      const byte = data[this.offset + i];
      if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
        throw new RangeError("GIF LZW packed input must contain bytes.");
      }
      value |= byte << (i * 8);
    }
    const code = (value >>> this.bitOffset) & ((1 << codeLength) - 1);
    const next = this.bitOffset + codeLength;
    this.offset += next >>> 3;
    this.bitOffset = next & 7;
    return code;
  }

  /**
   * Compress data.
   * @param codeSize Code Size
   * @param options Input and output allocation limits.
   * @returns The compressed output
   */
  compress(codeSize: number, options: GIFLZWOptions = {}): number[] {
    const bytes = this.compressBytes(codeSize, options);
    this.output = Array.from(bytes);
    return this.output;
  }

  /**
   * Compress native indexes directly to bytes without an intermediate number array.
   * @param codeSize GIF minimum code size, two through eight.
   * @param options Input and output allocation limits.
   * @returns An owned, unframed GIF LZW stream, including clear and EOI codes.
   */
  compressBytes(codeSize: number, options: GIFLZWOptions = {}): Uint8Array {
    validateCodeSize(codeSize);
    const maxInputBytes = byteLimit(options.maxInputBytes, "maxInputBytes");
    const maxOutputBytes = byteLimit(options.maxOutputBytes, "maxOutputBytes");
    validateInput(this.input, (1 << codeSize) - 1, maxInputBytes);
    this.offset = 0;
    this.bitOffset = 0;
    this.output = [];
    let codeLength = codeSize + 1;
    // Dictionary size is 1 code for each of the colors in the global/local color table.
    // Plus two special control codes.
    let dictionarySize = (1 << codeSize) + 2; // Math.pow(2, codeSize) + 2;

    // The value of the special codes depends on the value of the LZW minimum code size from the image data block.
    // If the LZW minimum code size is the same as the color table size, then special codes immediately follow the colors;
    // however it is possible to specify a larger LZW minimum code size which may leave a gap in the codes where no colors are assigned.
    // Clear Code (CC) in the image data is our cue to reinitialize the code table.
    const clearCode = 1 << codeSize;
    // End Of Information code (EOI) means we've reached the end of the image.
    const endOfInformation = clearCode + 1;
    let output = new Uint8Array(
      Math.min(maxOutputBytes, Math.max(16, Math.min(this.input.length, 4096))),
    );
    let written = 0;
    let bits = 0;
    let accumulator = 0;
    const writeByte = (byte: number): void => {
      if (written === maxOutputBytes) {
        throw new RangeError("GIF LZW exceeds the output byte limit.");
      }
      if (written === output.length) {
        const grown = new Uint8Array(Math.min(maxOutputBytes, Math.max(16, output.length * 2)));
        grown.set(output);
        output = grown;
      }
      output[written++] = byte;
    };
    const emit = (code: number): void => {
      accumulator |= code << bits;
      bits += codeLength;
      while (bits >= 8) {
        writeByte(accumulator & 255);
        accumulator >>>= 8;
        bits -= 8;
      }
    };

    // Start the code stream with the Clear Code (CC)
    emit(clearCode);
    // If the input was empty, we don't actually have any data to compress.
    if (this.input.length !== 0) {
      // Initialize the code table. Literal codes are implicit; pairs use a numeric key.
      const dictionary = new Map<number, number>();
      let sequence = this.input[0];
      // Read each color index from the index stream into our index buffer.
      for (let i = 1; i < this.input.length; i++) {
        // Read the next index in the index stream into char.
        const char = this.input[i];
        // Check if we have a record for (index buffer + char) in the code stream.
        const join = sequence * 256 + char;
        const found = dictionary.get(join);
        if (found !== undefined) {
          // We add join to the end of the index buffer and clear out join.
          sequence = found;
          continue;
        }
        // Add a new row to our code table that does contain this value.
        emit(sequence);
        // GIF format specifies a maximum code of 4095, the largest 12-bit number.
        // To add another code once the table is full, this encoder clears its old codes.
        // A decoder must also accept encoders that defer clearing and keep the full table.
        // Start building the codes again, starting just after the value of the end-of-information code.
        if (dictionarySize === 4096) {
          emit(clearCode);
          codeLength = codeSize + 1;
          dictionarySize = clearCode + 2;
          dictionary.clear();
        } else {
          // The encoder is one dictionary insertion ahead of the decoder.
          if (dictionarySize === 1 << codeLength && codeLength < 12) {
            codeLength++;
          }
          dictionary.set(join, dictionarySize++);
        }
        sequence = char;
      }
      // Output code for contents of index buffer
      emit(sequence);
      // The final literal can make the decoder widen before reading EOI.
      if (dictionarySize === 1 << codeLength && codeLength < 12) {
        codeLength++;
      }
    }
    // Output end-of-information code
    emit(endOfInformation);
    this.offset = written;
    this.bitOffset = bits;
    if (bits !== 0) {
      writeByte(accumulator & 255);
    }
    return output.slice(0, written);
  }

  /**
   * Decompress data.
   * @param codeSize Code Size
   * @param useInput Unpacking the `input` or the `output`. Defaults to true.
   * @param options Allocation limits, exact decoded length, and trailing-byte policy.
   * @returns The decompressed output
   */
  decompress(codeSize: number, useInput = true, options: GIFLZWOptions = {}): string {
    const bytes = this.decompressBytes(codeSize, useInput, options);
    const output: string[] = [];
    // Bounded argument counts avoid stack overflow; Latin-1 byte values are not UTF-8.
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      output.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
    }
    return output.join("");
  }

  /**
   * Decode with a fixed 4096-entry prefix/suffix dictionary and a bounded output buffer.
   * @param codeSize GIF minimum code size, two through eight.
   * @param useInput Read input, or the compatibility compress() output.
   * @param options Allocation limits, exact decoded length, and trailing-byte policy.
   * @returns Owned row-order indexes; GIF interlacing belongs to the image container.
   */
  decompressBytes(codeSize: number, useInput = true, options: GIFLZWOptions = {}): Uint8Array {
    debug("decompress:", { codeSize, useInput });
    validateCodeSize(codeSize);
    if (typeof useInput !== "boolean") {
      throw new TypeError("useInput must be a boolean.");
    }
    if (
      options.allowTrailingBytes !== undefined &&
      typeof options.allowTrailingBytes !== "boolean"
    ) {
      throw new TypeError("allowTrailingBytes must be a boolean.");
    }
    const maxInputBytes = byteLimit(options.maxInputBytes, "maxInputBytes");
    const maxOutputBytes = byteLimit(options.maxOutputBytes, "maxOutputBytes");
    const expected = options.expectedLength;
    if (
      expected !== undefined &&
      (!Number.isSafeInteger(expected) || expected < 0 || expected > maxOutputBytes)
    ) {
      throw new RangeError(
        "expectedLength must be a nonnegative integer within the output byte limit.",
      );
    }
    const data = useInput ? this.input : this.output;
    validateInput(data, 255, maxInputBytes);
    this.offset = 0;
    this.bitOffset = 0;
    // Clear Code (CC) in the image data is our cue to reinitialize the code table.
    const clearCode = 1 << codeSize;
    // End Of Information code (EOI) means we have reached the end of the image.
    const endOfInformation = clearCode + 1;
    // In decompress mode the dictionary maps codes to prefix codes and final bytes.
    const prefix = new Uint16Array(4096);
    const suffix = new Uint8Array(4096);
    const stack = new Uint8Array(4096);
    let dictionarySize = clearCode + 2;
    let codeLength = codeSize + 1;
    // A negative code represents "no previous sequence" (e.g. immediately after a clear code).
    let prevSequence = -1;
    let first = 0;
    let written = 0;
    let output = new Uint8Array(expected ?? Math.min(4096, maxOutputBytes));
    const outputLimit = expected ?? maxOutputBytes;
    let position = 0;
    let available = 0;
    let accumulator = 0;
    let consumed = 0;
    const readCode = (): number => {
      while (available < codeLength) {
        if (position === data.length) {
          throw new Error("Truncated GIF LZW stream or missing EOI code.");
        }
        accumulator |= data[position++] << available;
        available += 8;
      }
      const code = accumulator & ((1 << codeLength) - 1);
      accumulator >>>= codeLength;
      available -= codeLength;
      consumed += codeLength;
      return code;
    };
    // The first value in the code stream should be a clear code.
    let code = readCode();
    if (code !== clearCode) {
      throw new Error(`First code should be a clear code (${clearCode}), got: ${code}`);
    }
    while (true) {
      if (code === endOfInformation) {
        if (expected !== undefined && written !== expected) {
          throw new Error(
            `GIF LZW decoded length ${written} does not match expected length ${expected}.`,
          );
        }
        if (!options.allowTrailingBytes && Math.ceil(consumed / 8) !== data.length) {
          throw new Error("GIF LZW has trailing bytes after EOI.");
        }
        this.offset = Math.floor(consumed / 8);
        this.bitOffset = consumed & 7;
        return written === output.length ? output : output.slice(0, written);
      }
      // Initialize our code table.
      if (code === clearCode) {
        codeLength = codeSize + 1;
        // To do this we must know how many colors are in our color table.
        dictionarySize = clearCode + 2;
        prevSequence = -1;
        // Read the first color code. Repeated clear codes and an immediate EOI are legal.
        code = readCode();
        continue;
      }
      if (code > dictionarySize || code >= 4096 || (code === dictionarySize && prevSequence < 0)) {
        throw new Error(`Invalid GIF LZW code ${code}; next dictionary code is ${dictionarySize}.`);
      }
      let sequence = code;
      let count = 0;
      // Check to see if this value is in our code table.
      if (code === dictionarySize) {
        // Code not in dictionary (the KwKwK case): the entry is the previous sequence plus its own first character.
        // This branch is only reached after a real code, so the previous sequence is always non-empty.
        stack[count++] = first;
        sequence = prevSequence;
      }
      while (sequence >= clearCode) {
        if (sequence < clearCode + 2 || sequence >= dictionarySize || count >= 4095) {
          throw new Error("Invalid GIF LZW dictionary chain.");
        }
        stack[count++] = suffix[sequence];
        sequence = prefix[sequence];
      }
      // Code exists in dictionary: use the first byte of the dictionary entry.
      first = sequence;
      stack[count++] = first;
      if (written + count > outputLimit) {
        throw new RangeError(
          "GIF LZW decoded data exceeds the output byte limit or declared dimensions.",
        );
      }
      if (written + count > output.length) {
        const grown = new Uint8Array(
          Math.min(outputLimit, Math.max(written + count, output.length * 2)),
        );
        grown.set(output);
        output = grown;
      }
      while (count > 0) {
        output[written++] = stack[--count];
      }
      // Output code - 1 + K to the index stream and add this value to our code table.
      if (prevSequence >= 0 && dictionarySize < 4096) {
        prefix[dictionarySize] = prevSequence;
        suffix[dictionarySize++] = first;
        // Cap the code length to 12 bits, 1 << 12 = 4096 = 2 ** 12.
        if (dictionarySize === 1 << codeLength && codeLength < 12) {
          codeLength++;
        }
      }
      // Store the previous sequence for reference
      prevSequence = code;
      // Start the loop again by reading the next code.
      code = readCode();
    }
  }
}

export default GIFLZW;
