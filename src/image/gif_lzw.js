let debug = (..._) => {};
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) { try { const { default: d } = await import('debug'); debug = d('Uttori.GIFLZW'); } catch {} }

/**
 * GIF LZW Compression
 * The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.
 * @class
 */
class GIFLZW {
  /**
   * Creates a new GIFLZW instance.
   * @param {number[]} input The input data
   */
  constructor(input = []) {
    debug('constructor:', input);
    this.input = input;
    /** @type {number[]} */
    this.output = [];
    this.offset = 0;
    this.bitOffset = 0;
  }

  /**
   * Initialize the compression or decompression dictionary based on the code size.
   * @param {number} size Size of lookup, `(1 << Code Size) + 2`, the extra two are Clear Code & End of Information
   * @param {boolean} [compress] Type of dictionary returned, compression when true, decompression when false. Defaults to true.
   * @returns {Record<number|string, number|string>} The built to size dictionary.
   */
  buildDictionary(size, compress = true) {
    debug('buildDictionary:', size);
    /** @type {Record<number|string, number|string>} */
    const dictionary = {};
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
   * @param {number} codeLength The code length
   * @param {number} code The code
   */
  pack(codeLength, code) {
    debug('pack:', { codeLength, code });
    if (!this.output[this.offset]) {
      debug('new offset, next byte:', this.offset);
      this.output[this.offset] = 0;
    }

    for (let i = 0; i < codeLength; i++) {
      if (this.bitOffset > 7) {
        this.output[++this.offset] = 0;
        this.bitOffset = 0;
        debug('bitOffset > 7, next byte:', this.offset);
      }
      const value = (code & 0x1) << this.bitOffset;
      debug('value:', value);
      this.output[this.offset] += value;
      code >>= 1; // code = Math.floor(code / 2);
      this.bitOffset++;
    }

    this.offset += Math.floor(this.bitOffset / 8);
    this.bitOffset %= 8;
    // debug('data =', this.output);
  }

  /**
   * Unpack
   * @param {number} codeLength Code Length
   * @param {boolean} [useInput] Unpacking the `input` or the `output`. Defaults to true.
   * @returns {number} The unpacked code
   */
  unpack(codeLength, useInput = true) {
    debug('unpack:', codeLength);
    const data = useInput ? this.input : this.output;
    let code = 0;
    for (let i = 0; i < codeLength; i++) {
      let bit = data[this.offset] & (0x1 << this.bitOffset);
      if (this.bitOffset > i) {
        bit >>= this.bitOffset - i;
      } else {
        bit <<= i - this.bitOffset;
      }
      code += bit;
      this.bitOffset++;
      if (this.bitOffset > 7) {
        this.offset++;
        this.bitOffset = 0;
      }
    }

    return code;
  }

  /**
   * Compress data.
   * @param {number} codeSize Code Size
   * @returns {number[]} The compressed output
   */
  compress(codeSize) {
    debug('compress:', { codeSize });
    let codeLength = codeSize + 1;
    // Dictionary size is 1 code for each of the colors in the global/local color table.
    // Plus two special control codes.
    let dictionarySize = (1 << codeSize) + 2; // Math.pow(2, codeSize) + 2;
    debug('dictionarySize:', dictionarySize);

    // The value of the special codes depends on the value of the LZW minimum code size from the image data block.
    // If the LZW minimum code size is the same as the color table size, then special codes immediatly follow the colors;
    // however it is possible to specify a larger LWZ minimum code size which may leave a gap in the codes where no colors are assigned.
    // Clear Code (CC) in the image data is our cue to reinitialize the code table.
    const clearCode = 1 << codeSize;
    // End Of Information code (EOI) means we've reached the end of the image.
    const endOfInformation = (1 << codeSize) + 1;

    // Start the code stream with the Clear Code (CC)
    this.pack(codeLength, clearCode);

    // If the input was empty, we don't actually have any data to compress.
    if (this.input.length === 0) {
      debug('No data provided.');
      this.pack(codeLength, endOfInformation);
      return this.output;
    }

    // Initialized the code table
    let dictionary = this.buildDictionary(dictionarySize);
    let sequence = '';
    // Read each color index from the index stream into our index buffer.
    for (const i of this.input) {
      // Read the next index in the index stream into char.
      const char = String.fromCharCode(i);

      // Check if we have a record for (index buffer + char) in the code stream.
      const join = sequence + char;
      if (Object.prototype.hasOwnProperty.call(dictionary, join)) {
        // We add join to the end of the index buffer and clear out join.
        sequence = join;
        continue;
      }

      // Add a new row to our code table that does contain this value.
      this.pack(codeLength, Number(dictionary[sequence]));
      dictionary[join] = dictionarySize++;
      sequence = char;

      // GIF format specifies a maximum code of 4095, the largest 12-bit number.
      // If you want to use a new code, you have to clear out all of your old codes.
      // Start building the codes again, starting just after the value of the end-of-information code.
      if (dictionarySize > 4095) {
        this.pack(codeLength, clearCode);
        codeLength = codeSize + 1;
        dictionarySize = (1 << codeSize) + 2;
        dictionary = this.buildDictionary(dictionarySize);
      } else if (dictionarySize > 1 << codeLength) {
        codeLength++;
      }
    }

    // Output code for contents of index buffer
    this.pack(codeLength, Number(dictionary[sequence]));
    // Output end-of-information code
    this.pack(codeLength, endOfInformation);

    return this.output;
  }

  /**
   * Decompress data.
   * @param {number} codeSize Code Size
   * @param {boolean} [useInput] Unpacking the `input` or the `output`. Defaults to true.
   * @returns {string} The decompressed output
   */
  decompress(codeSize, useInput = true) {
    debug('decompress:', { codeSize, useInput });

    // Clear Code (CC) in the image data is our cue to reinitialize the code table.
    const clearCode = 1 << codeSize;
    // End Of Information code (EOI) means we have reached the end of the image.
    const endOfInformation = (1 << codeSize) + 1;
    debug('clearCode:', clearCode);
    debug('endOfInformation:', endOfInformation);

    let dict;
    let dictionarySize;
    let codeLength;
    let sequence;
    let prevSequence;

    const output = [];

    // The first value in the code stream should be a clear code.
    let code = this.unpack(codeSize + 1, useInput);
    if (code !== clearCode) {
      /* istanbul ignore next */
      throw new Error(`First code should be a clear code (${clearCode}), got: ${code}`);
    }

    debug('code:', code);
    while (code !== endOfInformation) {
      // Initialize our code table.
      if (code === clearCode) {
        codeLength = codeSize + 1;
        debug('codeLength:', codeLength);
        // To do this we must know how many colors are in our color table.
        dictionarySize = (1 << codeSize) + 2;
        debug('dictionarySize:', dictionarySize);
        dict = this.buildDictionary(dictionarySize, false);
        debug('dict:', Object.keys(dict).length);
        // Read the first color code.
        code = this.unpack(codeLength, useInput);
        debug('code:', code);
        prevSequence = null;
        continue;
      }

      // Check to see if this value is in our code table.
      sequence = Object.prototype.hasOwnProperty.call(dict, code) ? prevSequence + dict[code][0] : prevSequence + prevSequence[0];

      // Output code - 1 + K to the index stream and add this value to our code table.
      if (prevSequence) {
        dict[dictionarySize++] = sequence;
      }

      // Store the previous sequence for reference
      prevSequence = dict[code];
      output.push(dict[code]);

      // Cap the codeLendtg to 12 bits, 1 << 12 = 4096 = 2 ** 12
      if (dictionarySize >= 1 << codeLength) {
        codeLength = Math.min(codeLength + 1, 12);
      }

      // Start the loop again by reading the next code.
      code = this.unpack(codeLength, useInput);
      debug('code:', code);
    }

    debug('output:', output);
    return output.join('');
  }
}

export default GIFLZW;
