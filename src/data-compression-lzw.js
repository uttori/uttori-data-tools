/**
 * Lempel–Ziv–Welch (LZW) is a universal lossless data compression algorithm created by Abraham Lempel, Jacob Ziv, and Terry Welch.
 *
 * @example <caption>LZW.compress(...)</caption>
 * LZW.compress('TOBEORNOTTOBEORTOBEORNOT');
 * ➜ [84, 79, 66, 69, 79, 82, 78, 79, 84, 256, 258, 260, 265, 259, 261, 263]
 * LZW.decompress([84, 79, 66, 69, 79, 82, 78, 79, 84, 256, 258, 260, 265, 259, 261, 263]);
 * ➜ new DataBuffer('TOBEORNOTTOBEORTOBEORNOT')
 * @see {@link https://rosettacode.org/wiki/LZW_compression|LZW Compression}
 * @see {@link https://en.wikipedia.org/w/index.php?title=Lempel%E2%80%93Ziv%E2%80%93Welch&oldid=531967504#Packing_order|Lempel–Ziv–Welch (LZW)}
 */
const LZW = {
  /**
   * Builds the compression & decompression lookup tables for a provided bit depth.
   *
   * @param {number} depth The bit depth of the compression.
   * @returns {object} The built compressDictionary & decompressArray.
   * @static
   */
  buildDictionary(depth) {
    const compressDictionary = {};
    const decompressArray = [];
    const size = 1 << depth;
    let i = 0;
    while (i < size) {
      const value = String.fromCharCode(i);
      compressDictionary[value] = i;
      decompressArray.push(value);
      i++;
    }

    return { compressDictionary, decompressArray };
  },

  /**
   * Converts a string into a character code array.
   *
   * @static
   * @param {string} string The string to convert to hex.
   * @returns {number[]} The split up string.
   * @memberof LZW
   */
  stringToHexArray(string) {
    let values = [...string].map((c) => c.codePointAt(0).toString(16));
    values = values.map(((value) => {
      if (value.length > 2) {
        /* istanbul ignore else */
        if (value.length % 2 !== 0) {
          value = `0${value}`;
        }
        const size = Math.ceil(value.length / 2);
        const output = [];
        for (let i = 0; i < size; i++) {
          const chunk = value.slice((i * 2), (i * 2) + 2);
          output[i] = Number.parseInt(chunk, 16);
        }
        return output;
      }
      return Number.parseInt(value, 16);
    }));

    return values.flat();
  },

  /**
   *  Compresses the incoming data.
   *
   * @param {number[]} input The data to compress.
   * @param {number} [depth=8] The bit depth of the compression, defaults to 8, or 256 (1 << 8) value lookups.
   * @returns {number[]} The compressed version of the input.
   * @static
   */
  compress(input, depth = 8) {
    const { compressDictionary: dictionary } = LZW.buildDictionary(depth);
    let nextDictValue = 1 << depth;

    let key = '';
    const output = [];
    for (let i = 0; i < input.length; i++) {
      const byte = String.fromCharCode(input[i]);
      const joined = key + byte;
      if (Object.prototype.hasOwnProperty.call(dictionary, joined)) {
        key += byte;
      } else {
        output.push(dictionary[key]);
        dictionary[joined] = nextDictValue++;
        key = byte;
      }
    }

    /* istanbul ignore else */
    if (key !== '') {
      output.push(dictionary[key]);
    }

    return output;
  },

  /**
   * Decompressed the incoming data,
   *
   * @param {number[]} input The data to decompress.
   * @param {number} [depth=8] The bit depth of the compression, defaults to 8, or 256 (1 << 8) value lookups.
   * @returns {number[]} The decompressed data.
   * @static
   */
  decompress(input, depth = 8) {
    const { decompressArray: dictionary } = LZW.buildDictionary(depth);

    let key = input[0];
    let output = dictionary[key];
    let word = output;
    let entry = '';

    for (let i = 1; i < input.length; i++) {
      key = input[i];
      /* istanbul ignore else */
      if (key < dictionary.length) {
        entry = dictionary[key];
      } else {
        entry = word + word.charAt(0);
      }

      output += entry;
      dictionary.push(word + entry.charAt(0));
      word = entry;
    }

    return LZW.stringToHexArray(output);
  },
};

module.exports = LZW;
