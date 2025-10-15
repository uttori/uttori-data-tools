import zlib from 'node:zlib';
import DataBuffer from '../data-buffer.js';

let debug = (..._) => {};
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) { try { const { default: d } = await import('debug'); debug = d('Uttori.ImagePNG'); } catch {} }

/**
 * PNG Decoder
 * @property {number} width Pixel Width
 * @property {number} height Pixel Height
 * @property {number} bitDepth Image Bit Depth, one of: 1, 2, 4, 8, 16
 * @property {number} colorType Defines pixel structure, one of: 0, 2, 3, 4, 6
 * @property {number} compressionMethod Type of compression, always 0
 * @property {number} filterMethod Type of filtering, always 0
 * @property {number} interlaceMethod Type of interlacing, one of: 0, 1
 * @property {number} colors Number of bytes for each pixel
 * @property {boolean} alpha True when the image has an alpha transparency layer
 * @property {number[] | Uint8Array} palette Raw Color data
 * @property {Uint8Array} pixels Raw Image Pixel data
 * @property {Uint8Array} transparency Raw Transparency data
 * @property {object} physical Object containing physical dimension information
 * @property {number} physical.width Physical Dimension Width
 * @property {number} physical.height Physical Dimension Height
 * @property {number} physical.unit Physical Dimension Units, with 0 being unknown and 1 being Meters
 * @property {Uint8Array[]} dataChunks Image Data pieces
 * @property {Uint8Array} header PNG Signature from the data
 * @see {@link http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html|Chunk Specifications}
 * @see {@link https://ucnv.github.io/pnglitch/|The Art of PNG Glitch}
 * @see {@link http://www.schaik.com/pngsuite/|PngSuite, test-suite for PNG}
 * @see {@link http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html|Chunk Specifications (LibPNG)}
 * @see {@link https://www.w3.org/TR/PNG-Chunks.html|Chunk Specifications (W3C)}
 * @see {@link http://www.simplesystems.org/libpng/FFFF/|PNGs containing a chunk with length 0xffffffff}
 * @see {@link https://news.ycombinator.com/item?id=27579759|PNG files can be animated via network latency}
 * @see {@link https://github.com/jsummers/tweakpng|TweakPNG}
 * @example <caption>new ImagePNG(list, options)</caption>
 * const image_data = await FileUtility.readFile('./test/assets/PngSuite', 'oi1n0g16', 'png', null);
 * const image = ImagePNG.fromFile(image_data);
 * image.decodePixels();
 * const length = image.pixels.length;
 *  ➜ 6144
 * const pixel = image.getPixel(0, 0);
 *  ➜ [255, 255, 255, 255]
 * @class
 * @augments DataBuffer
 */
class ImagePNG extends DataBuffer {
  /**
   * Creates a new ImagePNG.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} input The data to process.
   */
  constructor(input) {
    super(input);

    /** @type {number} Pixel Width */
    this.width = 0;
    /** @type {number} Pixel Height */
    this.height = 0;
    /** @type {number} Image Bit Depth, one of: 1, 2, 4, 8, 16 */
    this.bitDepth = 0;
    /** @type {number} Defines pixel structure, one of: 0, 2, 3, 4, 6 */
    this.colorType = 0;
    /** @type {number} Type of compression, always 0 */
    this.compressionMethod = 0;
    /** @type {number} Type of filtering, always 0 */
    this.filterMethod = 0;
    /** @type {number} Type of interlacing, one of: 0, 1 */
    this.interlaceMethod = 0;

    /** @type {number} Number of bytes for each pixel */
    this.colors = 0;
    /** @type {boolean} True when the image has an alpha transparency layer */
    this.alpha = false;

    /** @type {number[] | Uint8Array} Raw Color data */
    this.palette = [];
    /** @type {number[]|Uint8Array} Raw Image Pixel data */
    this.pixels = undefined;
    /** @type {Uint8Array} Raw Transparency data */
    this.transparency = undefined;

    /** @type {object} physical - Object containing physical dimension information */
    this.physical = {
      /** @type {number} Physical Dimension Width */
      width: 0,
      /** @type {number} Physical Dimension Height */
      height: 0,
      /** @type {number} Physical Dimension Units, with 0 being unknown and 1 being Meters */
      unit: 0,
    };

    /** @type {Uint8Array[]} Image Data pieces */
    this.dataChunks = [];
    /** @type {number[]|Uint8Array} PNG Signature from the data */
    this.header = [];

    this.parse();
  }

  /**
   * Creates a new ImagePNG from file data.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} data The data of the image to process.
   * @returns {ImagePNG} the new ImagePNG instance for the provided file data
   * @static
   */
  static fromFile(data) {
    debug('fromFile:', data);
    return new ImagePNG(data);
  }

  /**
   * Creates a new ImagePNG from a DataBuffer.
   * @param {DataBuffer} buffer The DataBuffer of the image to process.
   * @returns {ImagePNG} the new ImagePNG instance for the provided DataBuffer
   * @static
   */
  static fromBuffer(buffer) {
    debug('fromBuffer:', buffer.length);
    return new ImagePNG(buffer);
  }

  /**
   * Sets the bitDepth on the ImagePNG instance.
   * @param {number} bitDepth The bitDepth to set, one of: 1, 2, 4, 8, 16
   */
  setBitDepth(bitDepth) {
    debug('setBitDepth:', bitDepth);
    if (![1, 2, 4, 8, 16].includes(bitDepth)) {
      throw new Error(`Invalid Bit Depth: ${bitDepth}, can be one of: 1, 2, 4, 8, 16`);
    }
    this.bitDepth = bitDepth;
  }

  /**
   * Sets the colorType on the ImagePNG instance.
   * Both color and alpha properties are inferred from the colorType.
   *
   * | Color Type | Allowed Bit Depths | Interpretation |
   * |------------|--------------------|----------------|
   * | 0          | 1, 2, 4, 8, 16     | Each pixel is a grayscale sample.
   * | 2          | 8, 16              | Each pixel is an R, G, B triple.
   * | 3          | 1, 2, 4, 8         | Each pixel is a palette index; a `PLTE` chunk must appear.
   * | 4          | 8, 16              | Each pixel is a grayscale sample, followed by an alpha sample.
   * | 6          | 8, 16              | Each pixel is an R, G, B triple, followed by an alpha sample.
   * @param {number} colorType - The colorType to set, one of: 0, 2, 3, 4, 6
   * @throws {Error} Invalid Color Type, anything other than 0, 2, 3, 4, 6
   */
  setColorType(colorType) {
    debug('setColorType:', colorType);
    let colors = 0;
    let alpha = false;

    switch (colorType) {
      case 0: colors = 1; break;
      case 2: colors = 3; break;
      case 3: colors = 1; break;
      case 4: colors = 2; alpha = true; break;
      case 6: colors = 4; alpha = true; break;
      default: throw new Error(`Invalid Color Type: ${colorType}, can be one of: 0, 2, 3, 4, 6`);
    }

    this.colors = colors;
    this.alpha = alpha;
    this.colorType = colorType;
  }

  /**
   * Sets the compressionMethod on the ImagePNG instance.
   * The compressionMethod should always be 0.
   * @param {number} compressionMethod - The compressionMethod to set, always 0
   * @throws {Error} Unsupported Compression Method, anything other than 0
   */
  setCompressionMethod(compressionMethod) {
    debug('setCompressionMethod:', compressionMethod);
    if (compressionMethod !== 0) {
      throw new Error(`Unsupported Compression Method: ${compressionMethod}, should be 0`);
    }
    this.compressionMethod = compressionMethod;
  }

  /**
   * Sets the filterMethod on the ImagePNG instance.
   * The filterMethod should always be 0.
   * @param {number} filterMethod - The filterMethod to set, always 0
   * @throws {Error} Unsupported Filter Method, anything other than 0
   */
  setFilterMethod(filterMethod) {
    debug('setFilterMethod:', filterMethod);
    if (filterMethod !== 0) {
      throw new Error(`Unsupported Filter Method: ${filterMethod}, should be 0`);
    }
    this.filterMethod = filterMethod;
  }

  /**
   * Sets the interlaceMethod on the ImagePNG instance.
   * The interlaceMethod should always be 0 or 1.
   * @param {number} interlaceMethod The interlaceMethod to set, always 0 or 1
   * @throws {Error} Unsupported Interlace Method, anything other than 0 or 1
   */
  setInterlaceMethod(interlaceMethod) {
    debug('setInterlaceMethod:', interlaceMethod);
    if (interlaceMethod !== 0 && interlaceMethod !== 1) {
      throw new Error(`Unsupported Interlace Method: ${interlaceMethod}`);
    }
    this.interlaceMethod = interlaceMethod;
  }

  /**
   * Sets the palette on the ImagePNG instance.
   * @param {number[] | Uint8Array} palette The palette to set
   * @throws {Error} No colors in the palette
   * @throws {Error} Too many colors for the current bit depth
   */
  setPalette(palette) {
    debug('setPalette:', palette);
    if (!Array.isArray(palette) && !ArrayBuffer.isView(palette)) {
      debug('Invalid palette provided.');
      return;
    }
    if (palette.length === 0) {
      throw new Error('Palette contains no colors');
    }
    if (palette.length > (2 ** (this.bitDepth) * 3)) {
      throw new Error(`Palette contains more colors than ${2 ** (this.bitDepth) * 3} ((2 ^ ${this.bitDepth}) * 3)`);
    }
    this.palette = palette;
  }

  /**
   * Get the pixel color at a specified x, y location.
   * @param {number} x The hoizontal offset to read.
   * @param {number} y The vertical offset to read.
   * @returns {Array<number>} the color as [red, green, blue, alpha]
   * @throws {Error} x is out of bound for the image
   * @throws {Error} y is out of bound for the image
   * @throws {Error} Unknown color types
   */
  getPixel(x, y) {
    if (!this.pixels) {
      throw new Error('Pixel data has not been decoded.');
    }
    if (!Number.isInteger(x) || x >= this.width || x < 0) {
      throw new Error(`x position out of bounds or invalid: ${x}`);
    }
    if (!Number.isInteger(y) || y >= this.height || y < 0) {
      throw new Error(`y position out of bounds or invalid: ${y}`);
    }
    debug('getPixel x:', x, 'y:', y, 'colorType:', this.colorType, 'colors:', this.colors, 'bitDepth:', this.bitDepth);
    // const i = (y * this.width + x) * this.bitDepth;
    // const i = (this.colors * this.bitDepth) / (8 * (y * this.width + x));
    const i = ((this.colors * this.bitDepth) / 8) * (y * this.width + x);

    debug('index:', i);
    switch (this.colorType) {
      case 0: {
        return [this.pixels[i], this.pixels[i], this.pixels[i], 255];
      }
      case 2: {
        return [this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], 255];
      }
      case 3: {
        let alpha = 255;
        if (this.transparency != null && this.transparency[this.pixels[i]] != null) {
          alpha = this.transparency[this.pixels[i]];
        }
        return [
          this.palette[this.pixels[i] * 3 + 0],
          this.palette[this.pixels[i] * 3 + 1],
          this.palette[this.pixels[i] * 3 + 2],
          alpha,
        ];
      }
      case 4: {
        // For 16 bitDepth grey image we need to pick up lower 8 bit for each pixel.
        if (this.bitDepth === 8) {
          return [this.pixels[i], this.pixels[i], this.pixels[i], this.pixels[i + 1]];
        }
        return [this.pixels[i + 1], this.pixels[i + 1], this.pixels[i + 1], this.pixels[i + 3]];
      }
      case 6: {
        // For 16 bitDepth grey image we need to pick up lower 8 bit for each pixel.
        if (this.bitDepth === 8) {
          return [this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], this.pixels[i + 3]];
        }
        return [this.pixels[i + 1], this.pixels[i + 3], this.pixels[i + 5], this.pixels[i + 7]];
      }
      default: {
        throw new Error(`Unknown Color Type: ${this.colorType}`);
      }
    }
  }

  /**
   * Parse the PNG file, decoding the supported chunks.
   */
  parse() {
    debug('parse');
    this.decodeHeader();

    while (this.remainingBytes()) {
      const type = this.decodeChunk();
      // Stop after IEND
      if (type === 'IEND') {
        const leftover = this.remainingBytes();
        // TODO: Find a PNG file with other data types in it?
        /* c8 ignore next 3 */
        if (leftover > 0) {
          debug('ending with data left:', leftover, 'bytes left');
        }
        break;
      }
    }
  }

  /**
   * Decodes and validates PNG Header.
   * Signature (Decimal): [137, 80, 78, 71, 13, 10, 26, 10]
   * Signature (Hexadecimal): [89, 50, 4E, 47, 0D, 0A, 1A, 0A]
   * Signature (ASCII): [\211, P, N, G, \r, \n, \032, \n]
   * @throws {Error} Missing or invalid PNG header
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature|PNG Signature}
   */
  decodeHeader() {
    debug('decodeHeader: offset =', this.offset);
    /* c8 ignore next 3 */
    if (this.offset !== 0) {
      debug('Offset should be at 0 to read the header.');
    }

    const header = this.read(8);
    debug('header:', header);
    const header_buffer = new DataBuffer(header);
    if (!header_buffer.compare([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
      throw new Error('Missing or invalid PNG header.');
    }

    this.header = header;
  }

  /**
   * Decodes the chunk type, and attempts to parse that chunk if supported.
   * Supported Chunk Types: IHDR, PLTE, IDAT, IEND, tRNS, pHYs
   *
   * Chunk Structure:
   * Length: 4 bytes
   * Type:   4 bytes (IHDR, PLTE, IDAT, IEND, etc.)
   * Chunk:  {length} bytes
   * CRC:    4 bytes
   * @returns {string} Chunk Type
   * @throws {Error} Invalid Chunk Length when less than 0
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout|Chunk Layout}
   */
  decodeChunk() {
    debug('decodeChunk');
    const length = this.readUInt32();

    /* c8 ignore next 3 */
    if (length < 0) {
      throw new Error(`Invalid Chunk Length: ${0xFFFFFFFF & length}`);
    }

    const type = this.readString(4);
    const chunk = this.read(length);
    const crc = this.readUInt32();

    debug('decodeChunk type', type, 'chunk size', length, 'crc', crc.toString(16).toUpperCase());
    switch (type) {
      case 'IHDR': this.decodeIHDR(chunk); break;
      case 'PLTE': this.decodePLTE(chunk); break;
      case 'IDAT': this.decodeIDAT(chunk); break;
      case 'IEND': this.decodeIEND(chunk); break;
      case 'tRNS': this.decodeTRNS(chunk); break;
      case 'pHYs': this.decodePHYS(chunk); break;
      // case 'cHRM': decodeCHRM(chunk); break;
      // case 'gAMA': decodeGAMA(chunk); break;
      // case 'bKGD': decodeBKGD(chunk); break;
      // case 'tIME': decodeTIME(chunk); break;
      // case 'tEXt': decodeTEXT(chunk); break;
      // case 'iTXt': decodeITXT(chunk); break;
      // case 'sRGB': decodeSRGB(chunk); break;
      // case 'sBIT': decodeSBIT(chunk); break;
      default:
        debug(`Unsupported Chunk: '${type}'`);
        break;
    }

    return type;
  }

  /**
   * Decode the IHDR (Image header) chunk.
   * Should be the first chunk in the data stream.
   *
   * Width:              4 bytes
   * Height:             4 bytes
   * Bit Depth:          1 byte
   * Colour Type:        1 byte
   * Compression Method: 1 byte
   * Filter Method:      1 byte
   * Interlace Method:   1 byte
   * @param {Uint8Array} chunk - Data Blob
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR|Image Header}
   * @see {@link http://www.libpng.org/pub/png/spec/1.2/png-1.2-pdg.html#C.IHDR|Image Header}
   */
  decodeIHDR(chunk) {
    debug('decodeIHDR');
    const header = new DataBuffer(chunk);

    const width = header.readUInt32();
    const height = header.readUInt32();
    const bit_depth = header.readUInt8();
    const color_type = header.readUInt8();
    const compression_method = header.readUInt8();
    const filter_method = header.readUInt8();
    const interlace_method = header.readUInt8();

    this.width = width;
    this.height = height;
    this.setBitDepth(bit_depth);
    this.setColorType(color_type);
    this.setCompressionMethod(compression_method);
    this.setFilterMethod(filter_method);
    this.setInterlaceMethod(interlace_method);

    debug('decodeIHDR =', JSON.stringify({
      width, height, bit_depth, color_type, compression_method, filter_method, interlace_method,
    }));
  }

  /**
   * Decode the PLTE (Palette) chunk.
   * The PLTE chunk contains from 1 to 256 palette entries, each a three-byte series of the form.
   * The number of entries is determined from the chunk length. A chunk length not divisible by 3 is an error.
   * @param {Uint8Array} chunk - Data Blob
   * @see {@link http://www.w3.org/TR/PNG/#11PLTE|Palette}
   */
  decodePLTE(chunk) {
    debug('decodePLTE');
    this.setPalette(chunk);
  }

  /**
   * Decode the IDAT (Image Data) chunk.
   * The IDAT chunk contains the actual image data which is the output stream of the compression algorithm.
   * @param {Uint8Array} chunk - Data Blob
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT|Image Data}
   */
  decodeIDAT(chunk) {
    debug('decodeIDAT:', chunk.length, 'bytes');
    this.dataChunks.push(chunk);
  }

  /**
   * Decode the tRNS (Transparency) chunk.
   * The tRNS chunk specifies that the image uses simple transparency: either alpha values associated with palette entries (for indexed-color images) or a single transparent color (for grayscale and truecolor images). Although simple transparency is not as elegant as the full alpha channel, it requires less storage space and is sufficient for many common cases.
   * @param {Uint8Array} chunk - Data Blob
   * @see {@link https://www.w3.org/TR/PNG/#11tRNS|Transparency}
   */
  decodeTRNS(chunk) {
    debug('decodeTRNS');
    this.transparency = chunk;
  }

  /**
   * Decode the pHYs (Pixel Dimensions) chunk.
   * The pHYs chunk specifies the intended pixel size or aspect ratio for display of the image.
   * When the unit specifier is 0, the pHYs chunk defines pixel aspect ratio only; the actual size of the pixels remains unspecified.
   * If the pHYs chunk is not present, pixels are assumed to be square, and the physical size of each pixel is unspecified.
   *
   * Structure:
   * Pixels per unit, X axis: 4 bytes (unsigned integer)
   * Pixels per unit, Y axis: 4 bytes (unsigned integer)
   * Unit specifier:          1 byte
   * 0: unit is unknown
   * 1: unit is the meter
   * @param {Uint8Array} chunk - Data Blob
   * @see {@link https://www.w3.org/TR/PNG/#11pHYs|Pixel Dimensions}
   */
  decodePHYS(chunk) {
    const INCH_TO_METERS = 0.0254;
    const buffer = new DataBuffer(chunk);
    let width = buffer.readUInt32();
    let height = buffer.readUInt32();
    const unit = buffer.readUInt8();

    if (unit === 1) {
      width = Math.floor(width * INCH_TO_METERS);
      height = Math.floor(height * INCH_TO_METERS);
    }

    this.physical = { width, height, unit };
  }

  /**
   * Decode the IEND (Image trailer) chunk.
   * The IEND chunk marks the end of the PNG DataBuffer. The chunk's data field is empty.
   * @param {Uint8Array} _chunk - Unused.
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND|Image Trailer}
   */

  decodeIEND(_chunk) {
    debug('decodeIEND');
  }

  /**
   * Uncompress IDAT chunks.
   * @throws {Error} No IDAT chunks to decode
   * @throws {Error} Deinterlacing Error
   * @throws {Error} Inflating Error
   * @throws {Error} Adam7 interlaced format is unsupported
   */
  decodePixels() {
    debug('decodePixels');
    if (this.dataChunks.length === 0) {
      throw new Error('No IDAT chunks to decode.');
    }
    const length = this.dataChunks.reduce((accumulator, chunk) => accumulator + chunk.length, 0);
    debug('Data Chunks Total Size:', length);
    const data = new Uint8Array(length);
    let k = 0;
    for (const chunk of this.dataChunks) {
      for (const j of chunk) {
        data[k++] = j;
      }
    }

    let out;
    try {
      out = zlib.inflateSync(data);
    } /* c8 ignore next 3 */ catch (err) {
      debug('Error Inflating:', err);
      throw err;
    }
    debug('Inflated Size:', out.length);
    // debug('Inflated:', out);

    try {
      if (this.interlaceMethod === 0) {
        this.interlaceNone(out);
      } else {
        this.interlaceAdam7(out);
      }
    } /* c8 ignore next 3 */ catch (e) {
      debug('Error Deinterlacing:', e);
      throw e;
    }
  }

  /**
   * Deinterlace with no interlacing.
   * @param {Buffer} data - Data to deinterlace.
   * @see {@link https://www.w3.org/TR/PNG-Filters.html|PNG Filters}
   */
  interlaceNone(data) {
    const bytes_per_pixel = Math.max(1, (this.colors * this.bitDepth) / 8);
    const color_bytes_per_row = bytes_per_pixel * this.width;

    this.pixels = new Uint8Array(bytes_per_pixel * this.width * this.height);

    const chunk = new DataBuffer(data);
    debug('interlaceNone: bytes:', chunk.remainingBytes(), 'bytes_per_pixel:', bytes_per_pixel, 'color_bytes_per_row:', color_bytes_per_row);
    let offset = 0;
    while (chunk.remainingBytes() > 0) {
      const type = chunk.readUInt8();
      const scanline = chunk.read(chunk.remainingBytes() < color_bytes_per_row ? chunk.remainingBytes() : color_bytes_per_row);
      // debug('chunk filter type:', type);
      switch (type) {
        case 0: {
          this.pixels = ImagePNG.unFilterNone(this.pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
          break;
        }
        case 1: {
          this.pixels = ImagePNG.unFilterSub(this.pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
          break;
        }
        case 2: {
          this.pixels = ImagePNG.unFilterUp(this.pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
          break;
        }
        case 3: {
          this.pixels = ImagePNG.unFilterAverage(this.pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
          break;
        }
        case 4: {
          this.pixels = ImagePNG.unFilterPaeth(this.pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
          break;
        }
        default: {
          debug(`Unknown filtered scanline type: '${type}', at offset`, offset);
        }
      }
      offset += chunk.offset;
      // debug('chunk.remainingBytes()', chunk.remainingBytes());
    }
  }

  /**
   * Deinterlace with Adam7 interlacing.
   * Adam7 divides the image into 7 passes with different starting positions and step sizes.
   * @param {Buffer} data - Data to deinterlace.
   * @see {@link https://www.w3.org/TR/PNG/#8Interlace|PNG Adam7 Interlacing}
   * @see {@link https://github.com/em2046/lens/blob/master/assets/js/interlace.js}
   * @see {@link https://github.com/em2046/aperture/tree/master/lib/png/chunks}
   * @see {@link https://github.com/beejjorgensen/jsmandel/blob/master/src/js/adam7.js}
   * @see {@link http://diyhpl.us/~yenatch/pokecrystal/src/pypng/code/png.py}
   * @see {@link https://github.com/SixLabors/ImageSharp/blob/master/src/ImageSharp/Formats/Png/Adam7.cs}
   */
  interlaceAdam7(data) {
    const bytes_per_pixel = Math.max(1, (this.colors * this.bitDepth) / 8);

    // Adam7 pass parameters
    const xoffset = [0, 4, 0, 2, 0, 1, 0];
    const yoffset = [0, 0, 4, 0, 2, 0, 1];
    const xstep = [8, 8, 4, 4, 2, 2, 1];
    const ystep = [8, 8, 8, 4, 4, 2, 2];

    this.pixels = new Uint8Array(bytes_per_pixel * this.width * this.height);

    const chunk = new DataBuffer(data);
    debug('interlaceAdam7: bytes:', chunk.remainingBytes(), 'bytes_per_pixel:', bytes_per_pixel);

    // Process each of the 7 passes
    for (let pass = 0; pass < 7; pass++) {
      // Calculate dimensions for this pass
      const pass_width = Math.ceil((this.width - xoffset[pass]) / xstep[pass]);
      const pass_height = Math.ceil((this.height - yoffset[pass]) / ystep[pass]);

      debug(`Adam7 pass ${pass + 1}: width=${pass_width}, height=${pass_height}`);

      // Process only non-empty passes
      if (pass_width > 0 && pass_height > 0) {
        const color_bytes_per_row = bytes_per_pixel * pass_width;
        /** @type {number[]|Uint8Array} */
        let pass_pixels = new Uint8Array(bytes_per_pixel * pass_width * pass_height);

        // Read and unfilter scanlines for this pass
        for (let row = 0; row < pass_height; row++) {
          if (chunk.remainingBytes() === 0) {
            break;
          }

          const type = chunk.readUInt8();
          const scanline = chunk.read(chunk.remainingBytes() < color_bytes_per_row ? chunk.remainingBytes() : color_bytes_per_row);
          const offset = row * color_bytes_per_row;

          // Apply the appropriate filter
          switch (type) {
            case 0: {
              pass_pixels = ImagePNG.unFilterNone(pass_pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
              break;
            }
            case 1: {
              pass_pixels = ImagePNG.unFilterSub(pass_pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
              break;
            }
            case 2: {
              pass_pixels = ImagePNG.unFilterUp(pass_pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
              break;
            }
            case 3: {
              pass_pixels = ImagePNG.unFilterAverage(pass_pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
              break;
            }
            case 4: {
              pass_pixels = ImagePNG.unFilterPaeth(pass_pixels, scanline, bytes_per_pixel, offset, color_bytes_per_row);
              break;
            }
            default: {
              debug(`Unknown filtered scanline type: '${type}', at pass ${pass + 1}, row ${row}`);
            }
          }
        }

        // Copy pass pixels to final image at correct positions
        for (let row = 0; row < pass_height; row++) {
          const y = yoffset[pass] + row * ystep[pass];
          for (let col = 0; col < pass_width; col++) {
            const x = xoffset[pass] + col * xstep[pass];
            const pass_index = (row * pass_width + col) * bytes_per_pixel;
            const image_index = (y * this.width + x) * bytes_per_pixel;

            for (let b = 0; b < bytes_per_pixel; b++) {
              this.pixels[image_index + b] = pass_pixels[pass_index + b];
            }
          }
        }
      }
    }
  }

  // TODO Make these static so we can use them in Adam7 as well.
  // Unfiltering

  /**
   * No filtering, direct copy.
   * @param {number[]|Uint8Array} pixels Pixels to update.
   * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
   * @param {number} bpp Bytes Per Pixel
   * @param {number} offset Offset
   * @param {number} length Length
   * @returns {number[]|Uint8Array} Pixels
   */
  static unFilterNone(pixels, scanline, bpp, offset, length) {
    debug('unFilterNone:', 'bpp:', bpp, 'offset:', offset, 'length:', length);
    for (let i = 0, to = length; i < to; i++) {
      // debug(`this.pixels[${offset + i}] = ${scanline[i]}`);
      pixels[offset + i] = scanline[i];
    }
    return pixels;
  }

  /**
   * The Sub() filter transmits the difference between each byte and the value of the corresponding byte of the prior pixel.
   * Sub(x) = Raw(x) + Raw(x - bpp)
   * @param {number[]|Uint8Array} pixels Pixels to update.
   * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
   * @param {number} bpp - Bytes Per Pixel
   * @param {number} offset Offset
   * @param {number} length Length
   * @returns {number[]|Uint8Array} Pixels
   */
  static unFilterSub(pixels, scanline, bpp, offset, length) {
    debug('unFilterSub:', 'bpp:', bpp, 'offset:', offset, 'length:', length);
    let i = 0;
    for (; i < bpp; i++) {
      // debug(`this.pixels[${offset + i}] = ${scanline[i]}`);
      pixels[offset + i] = scanline[i];
    }
    for (; i < length; i++) {
      // Raw(x) + Raw(x - bpp)
      // debug(`this.pixels[${offset + i}] = ${(scanline[i] + this.pixels[offset + i - bpp]) & 0xFF}`);
      pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
    }
    return pixels;
  }

  /**
   * The Up() filter is just like the Sub() filter except that the pixel immediately above the current pixel, rather than just to its left, is used as the predictor.
   * Up(x) = Raw(x) + Prior(x)
   * @param {number[]|Uint8Array} pixels Pixels to update.
   * @param {number[]|Uint8Array} scanline - Scanline to search for pixels in.
   * @param {number} _bpp Bytes Per Pixel, Unused
   * @param {number} offset Offset
   * @param {number} length Length
   * @returns {number[]|Uint8Array} Pixels
   */
  static unFilterUp(pixels, scanline, _bpp, offset, length) {
    debug('unFilterUp:', 'offset:', offset, 'length:', length);
    let i = 0;
    let byte;
    let prev;
    // Prior(x) is 0 for all x on the first scanline
    if ((offset - length) < 0) {
      for (; i < length; i++) {
        pixels[offset + i] = scanline[i];
      }
    } else {
      for (; i < length; i++) {
      // Raw(x)
        byte = scanline[i];
        // Prior(x)
        prev = pixels[offset + i - length];
        pixels[offset + i] = (byte + prev) & 0xFF;
      }
    }
    return pixels;
  }

  /**
   * The Average() filter uses the average of the two neighboring pixels (left and above) to predict the value of a pixel.
   * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
   * @param {number[]|Uint8Array} pixels Pixels to update.
   * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
   * @param {number} bpp Bytes Per Pixel
   * @param {number} offset Offset
   * @param {number} length Length
   * @returns {number[]|Uint8Array} Pixels
   */
  static unFilterAverage(pixels, scanline, bpp, offset, length) {
    debug('unFilterAverage:', 'bpp:', bpp, 'offset:', offset, 'length:', length);
    let i = 0; let byte; let prev; let
      prior;
    if ((offset - length) < 0) {
      // Prior(x) == 0 && Raw(x - bpp) == 0
      for (; i < bpp; i++) {
        pixels[offset + i] = scanline[i];
      }
      // Prior(x) == 0 && Raw(x - bpp) != 0 (right shift, prevent doubles)
      for (; i < length; i++) {
        pixels[offset + i] = (scanline[i] + (pixels[offset + i - bpp] >> 1)) & 0xFF;
      }
    } else {
      // Prior(x) != 0 && Raw(x - bpp) == 0
      for (; i < bpp; i++) {
        pixels[offset + i] = (scanline[i] + (pixels[offset - length + i] >> 1)) & 0xFF;
      }
      // Prior(x) != 0 && Raw(x - bpp) != 0
      for (; i < length; i++) {
        byte = scanline[i];
        prev = pixels[offset + i - bpp];
        prior = pixels[offset + i - length];
        pixels[offset + i] = (byte + (prev + prior >> 1)) & 0xFF;
      }
    }
    return pixels;
  }

  /**
   * The Paeth() filter computes a simple linear function of the three neighboring pixels (left, above, upper left), then chooses as predictor the neighboring pixel closest to the computed value.
   * This technique was developed by Alan W. Paeth.
   * Paeth(x) = Raw(x) + PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
   * function PaethPredictor (a, b, c)
   * begin
   * ; a = left, b = above, c = upper left
   * p := a + b - c        ; initial estimate
   * pa := abs(p - a)      ; distances to a, b, c
   * pb := abs(p - b)
   * pc := abs(p - c)
   * ; return nearest of a,b,c,
   * ; breaking ties in order a,b,c.
   * if pa <= pb AND pa <= pc then return a
   * else if pb <= pc then return b
   * else return c
   * end
   * @param {number[]|Uint8Array} pixels Pixels to update.
   * @param {number[]|Uint8Array} scanline Scanline to search for pixels in.
   * @param {number} bpp Bytes Per Pixel
   * @param {number} offset Offset
   * @param {number} length Length
   * @returns {number[]|Uint8Array} Pixels
   */
  static unFilterPaeth(pixels, scanline, bpp, offset, length) {
    debug('unFilterPaeth:', 'bpp:', bpp, 'offset:', offset, 'length:', length);
    let i = 0;
    let raw;
    let a;
    let b;
    let c;
    let p;
    let pa;
    let pb;
    let pc;
    let pr;
    if ((offset - length) < 0) {
      // Prior(x) == 0 && Raw(x - bpp) == 0
      for (; i < bpp; i++) {
        pixels[offset + i] = scanline[i];
      }
      // Prior(x) == 0 && Raw(x - bpp) != 0
      // paethPredictor(x, 0, 0) is always x
      for (; i < length; i++) {
        pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
      }
    } else {
      // Prior(x) != 0 && Raw(x - bpp) == 0
      // paethPredictor(x, 0, 0) is always x
      for (; i < bpp; i++) {
        pixels[offset + i] = (scanline[i] + pixels[offset + i - length]) & 0xFF;
      }
      // Prior(x) != 0 && Raw(x - bpp) != 0
      for (; i < length; i++) {
        raw = scanline[i];
        a = pixels[offset + i - bpp];
        b = pixels[offset + i - length];
        c = pixels[offset + i - length - bpp];
        p = a + b - c;
        pa = Math.abs(p - a);
        pb = Math.abs(p - b);
        pc = Math.abs(p - c);
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        else pr = c;
        pixels[offset + i] = (raw + pr) & 0xFF;
      }
    }
    return pixels;
  }
}

export default ImagePNG;
