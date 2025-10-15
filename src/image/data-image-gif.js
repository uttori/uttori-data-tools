import { DataBitstream, DataBuffer } from '../index.js';
import GIFLZW from './gif_lzw.js';

let debug = (..._) => {};
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) { try { const { default: d } = await import('debug'); debug = d('Uttori.ImageGIF'); } catch {} }

/**
 * @typedef {Object} ImageGIFOptions
 * @property {object} rules Options for the ImageGIF instance.
 * @property {boolean} rules.strict_block_size Strictly enforce the block size.
 * @property {boolean} rules.strict_lzw_minimum_code_size Strictly enforce the LZW minimum code size.
 */

/**
 * @typedef {Object} ImageGIFImageDescriptor
 * @property {number} offset The offset of the image descriptor in the data
 * @property {number} leftPosition The left position of the image
 * @property {number} topPosition The top position of the image
 * @property {number} width The width of the image
 * @property {number} height The height of the image
 * @property {number} packed The packed fields of the image descriptor
 * @property {number} localColorTableFlag The local color table flag
 * @property {number} interlaceFlag The interlace flag
 * @property {number} sortFlag The sort flag
 * @property {number} localColorTableSize The local color table size
 * @property {Uint8Array} localColorTable The local color table
 * @property {number} lzwMinimumCodeSize The LZW minimum code size
 * @property {number[]} lzwData The LZW data
 */

/**
 * GIF Decoder
 *
 * @property {number} width Pixel Width
 * @property {number} height Pixel Height
 * @property {number} bitDepth Image Bit Depth, one of: 1, 2, 4, 8, 16
 * @property {number} colorType Defines pixel structure, one of: 0, 2, 3, 4, 6
 * @property {number} colors Number of colors in the image
 * @property {boolean} alpha True when the image has an alpha transparency layer
 * @property {number[] | Uint8Array} palette Raw Color data
 * @property {Uint8Array} pixels Raw Image Pixel data
 * @property {Uint8Array} transparency Raw Transparency data
 * @property {Uint8Array} header GIF Signature from the data
 * @see {@link http://www.w3.org/Graphics/GIF/spec-gif87.txt|Graphics Interchange Format (GIF) Specification}
 * @see {@link http://www.w3.org/Graphics/GIF/spec-gif89a.txt|GIF89a Specification}
 * @example <caption>new ImageGIF(list, options)</caption>
 * const image_data = await fs.readFile('./test/image/assets/sundisk04.gif');
 * const image = ImageGIF.fromFile(image_data);
 * image.decodePixels();
 * const length = image.pixels.length;
 *  ➜ 65536
 * const pixel = image.getPixel(0, 0);
 *  ➜ [255, 254, 254, 255]
 * @class
 */
class ImageGIF extends DataBuffer {
  /**
   * Creates a new ImageGIF.
   *
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} input The data to process.
   * @param {ImageGIFOptions} [options] Options for this ImageGIF instance.
   * @class
   */
  constructor(input, options = { rules: { strict_block_size: false, strict_lzw_minimum_code_size: false } }) {
    super(input);

    // GIF Specific Details
    this.header = '';
    this.version = 0;

    this.width = 0;
    this.height = 0;
    this.bitDepth = 0;
    this.colorType = 0;

    this.colors = 0;
    this.alpha = false;

    /** @type {Uint8Array} */
    this.palette = new Uint8Array();
    /** @type {number[]|Uint8Array} */
    this.pixels = new Uint8Array();
    /** @type {Uint8Array} */
    this.transparency = new Uint8Array();

    this.frames = [];
    this.comments = [];
    this.applicationExtensions = [];
    /** @type {ImageGIFImageDescriptor[]} */
    this.imageDescriptors = [];
    this.plainTextExtensions = [];

    this.imageNext = false;

    /** @type {ImageGIFOptions} */
    this.options = {
      rules: {
        strict_block_size: false,
        strict_lzw_minimum_code_size: false,
      },
      ...options,
    };
    debug('this.options', this.options);

    this.parse();
  }

  /**
   * Creates a new ImageGIF from file data.
   *
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} data The data of the image to process.
   * @param {ImageGIFOptions} opts Options for this ImageGIF instance.
   * @returns {ImageGIF} the new ImageGIF instance for the provided file data
   * @static
   */
  static fromFile(data, opts = { rules: { strict_block_size: false, strict_lzw_minimum_code_size: false } }) {
    debug('fromFile:', data);
    return new ImageGIF(data, opts);
  }

  /**
   * Creates a new ImageGIF from a DataBuffer.
   *
   * @param {DataBuffer} buffer The DataBuffer of the image to process.
   * @param {ImageGIFOptions} opts Options for this ImageGIF instance.
   * @returns {ImageGIF} the new ImageGIF instance for the provided DataBuffer
   * @static
   */
  static fromBuffer(buffer, opts = { rules: { strict_block_size: false, strict_lzw_minimum_code_size: false } }) {
    debug('fromBuffer:', buffer.length);
    return new ImageGIF(buffer, opts);
  }

  /**
   * Parse the GIF file, decoding the chunks.
   */
  parse() {
    debug('parse');
    this.decodeHeader();
    this.decodeLogicalScreenDescriptor();

    /* istanbul ignore else */
    if (this.globalColorTable === 1) {
      this.decodeGlobalColorTable();
    }

    this.imageNext = false;
    while (this.remainingBytes()) {
      /* istanbul ignore else */
      if (this.isNextBytes([0x21, 0xFF])) {
        this.decodeApplicationExtension();
      } else if (this.isNextBytes([0x21, 0xFE])) {
        this.decodeCommentExtension();
      } else if (this.isNextBytes([0x21, 0xF9])) {
        this.decodeGraphicControlExtension();
      } /* c8 ignore next 5 */ else if (this.isNextBytes([0x21, 0xCE])) {
        debug('🎁 NAME:', this.offset);
        // NAME
        // the only reference to this extension I could find was in gifsicle.
        // I'm not sure if this is something gifsicle just made up or if this actually exists outside of this app
        this.decodeDataSubBlocks();
      } else if (this.isNextBytes([0x21, 0x01])) {
        this.decodePlainTextExtension();
      } else if (this.isNextBytes([0x2C])) {
        try {
          this.decodeImageDescriptor();
        } catch (error) {
          debug('Unexpected error in decodeImageDescriptor:', error);
          // TODO Throw errors here for strict
        }
      } else if (this.isNextBytes([0x3B])) {
        debug('TRAILER 0x3B');
        this.advance(1);
        return;
      } else {
        /* istanbul ignore next */
        const unknown = this.readUInt8();
        debug('UNKNOWN:', this.offset, unknown, `0x${unknown.toString(16)}`);
      }
    }
  }

  decodeImageDescriptor() {
    // 0x00: Image Separator - Identifies the beginning of an Image Descriptor. This field contains the fixed value 0x2C.
    debug('decodeImageDescriptor: at offset', this.offset);
    /** @type {ImageGIFImageDescriptor} */
    const imageDescriptor = {
      offset: this.offset,
      leftPosition: 0,
      topPosition: 0,
      width: 0,
      height: 0,
      packed: 0,
      localColorTableFlag: 0,
      interlaceFlag: 0,
      sortFlag: 0,
      localColorTableSize: 0,
      localColorTable: new Uint8Array(),
      lzwMinimumCodeSize: 0,
      lzwData: [],
    };
    this.advance(1);

    if (!this.imageNext) {
      // This is a bare image, not prefaced with a Graphics Control Extension so we should treat it as a frame.
      this.frames.push({ index: this.frames.length, delay: 0 });
    }
    this.imageNext = false;

    // 0x01: Image Left Position - Column number, in pixels, of the left edge of the image, with respect to the left edge of the Logical Screen. Leftmost column of the Logical Screen is 0.
    imageDescriptor.leftPosition = this.readUInt16(true);
    debug('Left Position:', imageDescriptor.leftPosition);

    // 0x03: Image Top Position - Row number, in pixels, of the top edge of the image with respect to the top edge of the Logical Screen. Top row of the Logical Screen is 0.
    imageDescriptor.topPosition = this.readUInt16(true);
    debug('top position:', imageDescriptor.topPosition);

    // 0x05: Image Width - Width of the image in pixels.
    imageDescriptor.width = this.readUInt16(true);
    debug('Width:', imageDescriptor.width);

    // 0x07: Image Height - Height of the image in pixels.
    imageDescriptor.height = this.readUInt16(true);
    debug('Height:', imageDescriptor.height);

    // 0x09: Packed Field:
    //         Local Color Table Flag        1 Bit
    //         Interlace Flag                1 Bit
    //         Sort Flag                     1 Bit
    //         Reserved                      2 Bits
    //         Size of Local Color Table     3 Bits
    const packed = this.readUInt8();
    imageDescriptor.packed = packed;

    const localColorTableFlag = packed >> 7;
    imageDescriptor.localColorTableFlag = localColorTableFlag;

    const interlaceFlag = (packed >> 6) & 1;
    imageDescriptor.interlaceFlag = interlaceFlag;

    const sortFlag = (packed >> 5) & 1;
    imageDescriptor.sortFlag = sortFlag;

    const localColorTableSize = packed & 7;
    imageDescriptor.localColorTableSize = localColorTableSize;

    if (localColorTableFlag) {
      debug(`LOCAL COLOR TABLE IS ${3 * (2 ** (localColorTableSize + 1))} BYTES`);
      imageDescriptor.localColorTable = this.read(3 * (2 ** (localColorTableSize + 1)));
      debug('localColorTable bytes:', imageDescriptor.localColorTable.length);
    } else {
      debug('NO LOCAL COLOR TABLE');
    }

    const lzwMinimumCodeSize = this.readUInt8();
    if ((lzwMinimumCodeSize < 2) || (lzwMinimumCodeSize > 8)) {
      const error = `Invalid LZW Minimum Code Size: ${lzwMinimumCodeSize} < 2 or ${lzwMinimumCodeSize} > 8`;
      debug(this.options.rules);
      /* c8 ignore next 3 */
      if (this.options.rules.strict_lzw_minimum_code_size) {
        throw new Error(error);
      }
    }
    debug(`LZW Minimum Code Size: ${this.offset} === 0x${lzwMinimumCodeSize.toString(16)} / ${lzwMinimumCodeSize}`);
    debug('Table Based Image Data:', this.offset);
    imageDescriptor.lzwMinimumCodeSize = lzwMinimumCodeSize;

    imageDescriptor.lzwData = this.decodeDataSubBlocks();
    this.imageDescriptors.push(imageDescriptor);
  }

  // 0x00: Extension Introducer - Identifies the beginning of an extension block. This field contains the fixed value 0x21.
  // 0x01: Graphic Control Label - Identifies the current block as a Graphic Control Extension. This field contains the fixed value 0xF9.
  // 0x03: Block Size - Number of bytes in the block, after the Block Size field and up to but not including the Block Terminator. This field should contain the fixed value 0x04.
  // 0x04: Packed Fields:
  //       Reserved: 3 Bits
  //       Disposal Method: 3 Bits
  //       User Input Flag: 1 Bit
  //       Transparent Color Flag: 1 Bit
  // Disposal Method - Indicates the way in which the graphic is to be treated after being displayed.
  // Values: 0 - No disposal specified. The decoder is not required to take any action.
  //         1 - Do not dispose. The graphic is to be left in place.
  //         2 - Restore to background color. The area used by the graphic must be restored to the background color.
  //         3 - Restore to previous. The decoder is required to restore the area overwritten by the graphic with what was there prior to rendering the graphic.
  //       4-7 - Unused.
  // User Input Flag - Indicates whether or not user input is expected before continuing. If the flag is set, processing will continue when user input is entered. The nature of the User input is determined by the application (Carriage Return, Mouse Button Click, etc.).
  // Values: 0 - User input is not expected.
  //         1 - User input is expected.
  // When a Delay Time is used and the User Input Flag is set, processing will continue when user input is received or when the delay time expires, whichever occurs first.
  // Transparency Flag - Indicates whether a transparency index is given in the Transparent Index field. (This field is the least significant bit of the byte.)
  // Values: 0 - Transparent Index is not given.
  //         1 - Transparent Index is given.
  // 0x05 - 0x06: Delay Time - If not 0, this field specifies the number of hundredths (1/100) of a second to wait before continuing with the processing of the Data Stream. The clock starts ticking immediately after the graphic is rendered. This field may be used in conjunction with the User Input Flag field.
  // 0x07: Transparent Color Index - The Transparency Index is such that when encountered, the corresponding pixel of the display device is not modified and processing goes on to the next pixel. The index is present if and only if the Transparency Flag is set to 1.
  decodeGraphicControlExtension() {
    debug('decodeGraphicControlExtension: offset', this.offset);
    this.advance(2);

    const blockSize = this.readUInt8();
    debug('blockSize:', blockSize);
    if (blockSize !== 4) {
      const error = `Invalid Graphic Control Block Size: ${blockSize} !== 4`;
      debug(error);
      if (this.options.rules.strict_block_size) {
        throw new Error(error);
      }
    }

    const disposalMethod = this.readUInt8() >> 2;
    debug(`DISPOSAL ${disposalMethod}`);
    const delay = this.readUInt8() + this.readUInt8() * 256;
    this.frames.push({ index: this.frames.length, delay, disposal: disposalMethod });
    debug(`FRAME DELAY ${delay}`);
    this.advance(2);
    this.imageNext = true;
  }

  decodeApplicationExtension() {
    debug('decodeApplicationExtension:', this.offset);
    // 0x00: Extension Label - Defines this block as an extension. This field contains the fixed value 0x21 (33).
    // 0x01: Application Extension Label - Identifies the block as an Application Extension. This field contains the fixed value 0xFF (255).
    this.advance(2);
    // 0x02: Block Size - Number of bytes in this extension block, following the Block Size field, up to but not including the beginning of the Application Data.
    const blockSize = this.readUInt8();
    debug('blockSize:', blockSize);
    // 0x03: Application Identifier - Sequence of eight printable ASCII characters used to identify the application owning the Application Extension.
    const applicationIdentifier = this.readString(8);
    debug('applicationIdentifier:', applicationIdentifier);
    // 0x0B: Application Authentication Code - Sequence of three bytes used to authenticate the Application Identifier. An Application program may use an algorithm to compute a binary code that uniquely identifies it as the application owning the Application Extension. This field contains the fixed value "2.0". Sometimes Application Identifier and Application Authentication Code fields are referred as one "NETSCAPE2.0" field.
    const applicationAuthenticationCode = this.readString(3);
    debug('applicationAuthenticationCode:', applicationAuthenticationCode);

    switch (applicationIdentifier) {
      /* c8 ignore next 1 */
      case 'ANIMEXTS':
      case 'NETSCAPE': {
        // 0x0E: Sub-block Data Size - Indicates the number of data bytes to follow. The size of the block does not account for the size byte itself.
        const subblockDataSize = this.readUInt8();
        debug('subblockDataSize:', subblockDataSize);
        // 0x0F: Sub-block ID - Identifies the Netscape Looping Extension.
        const subblockID = this.readUInt8();
        debug('subblockID:', subblockID);
        // 0x10: Loop Count - Indicates the number of iterations the animated GIF should be executed. This field is an unsigned 2-byte integer in little-endian (least significant byte first) byte order. 0x00 (0) means infinite loop.
        const loopCount = this.readUInt16(true);
        debug('loopCount:', loopCount);
        // 0x12: Block Terminator - This zero-length data block marks the end of the Application Extension.
        const blockTerminator = this.readUInt8();
        debug('blockTerminator:', blockTerminator);
        break;
      }
      /* c8 ignore next 9 */
      case 'GIFCONnb': {
        debug('GIF Construction Set Extension: Unsupported');
        this.advance(blockSize - (8 + 3));
        while (!this.isNextBytes([0x00])) {
          this.advance(1);
        }
        this.advance(1);
        break;
      }
      /* c8 ignore next 8 */
      default: {
        debug('Unsupported:', applicationIdentifier);
        this.advance(blockSize - (8 + 3));
        while (!this.isNextBytes([0x00])) {
          this.advance(1);
        }
        this.advance(1);
      }
    }
  }

  decodeCommentExtension() {
    debug('decodeCommentExtension:', this.offset);
    const comment = { offset: this.offset };
    this.advance(2);

    let data = '';
    let blockSize = this.readUInt8();
    debug('blockSize:', blockSize);
    while (blockSize > 0) {
      data += this.readString(blockSize);
      blockSize = this.readUInt8();
    }
    comment.comment = data;
    this.comments.push(comment);
    debug('comment:', comment.comment);
  }

  decodePlainTextExtension() {
    debug('decodePlainTextExtension:', this.offset);
    const plainText = { offset: this.offset };
    // Extension Introducer - Identifies the beginning of an extension block. This field contains the fixed value 0x21.
    // Plain Text Label - Identifies the current block as a Plain Text Extension. This field contains the fixed value 0x01.
    this.advance(2);

    // Block Size - Number of bytes in the extension, after the Block Size field and up to but not including the beginning of the data portion. This field contains the fixed value 12.
    const blockSize = this.readUInt8();
    debug('blockSize:', blockSize);

    // Text Grid Left Position - Column number, in pixels, of the left edge of the text grid, with respect to the left edge of the Logical Screen.
    plainText.textGridLeftPosition = this.readUInt16(true);
    debug('Text Grid Left Position:', plainText.textGridLeftPosition);

    // Text Grid Top Position - Row number, in pixels, of the top edge of the text grid, with respect to the top edge of the Logical Screen.
    plainText.textGridTopPosition = this.readUInt16(true);
    debug('Text Grid Top Position:', plainText.textGridTopPosition);

    // Image Grid Width - Width of the text grid in pixels.
    plainText.imageGridWidth = this.readUInt16(true);
    debug('Image Grid Width:', plainText.imageGridWidth);

    // Image Grid Height - Height of the text grid in pixels.
    plainText.imageGridHeight = this.readUInt16(true);
    debug('Image Grid Height:', plainText.imageGridHeight);

    // Character Cell Width - Width, in pixels, of each cell in the grid.
    plainText.characterCellWidth = this.readUInt8();
    debug('Character Cell Width:', plainText.characterCellWidth);

    // Character Cell Height - Height, in pixels, of each cell in the grid.
    plainText.characterCellHeight = this.readUInt8();
    debug('Character Cell Height:', plainText.characterCellHeight);

    // Text Foreground Color Index - Index into the Global Color Table to be used to render the text foreground.
    plainText.textForegroundColorIndex = this.readUInt8();
    debug('Text Foreground Color Index:', plainText.textForegroundColorIndex);

    // Text Background Color Index - Index into the Global Color Table to be used to render the text background.
    plainText.textBackgroundColorIndex = this.readUInt8();
    debug('Text Background Color Index:', plainText.textBackgroundColorIndex);

    // Plain Text Data - Sequence of sub-blocks, each of size at most 255 bytes and at least 1 byte, with the size in a byte preceding the data. The end of the sequence is marked by the Block Terminator.
    // Block Terminator - This zero-length data block marks the end of the Plain Text Data Blocks.
    let plainTextData = '';
    let ptdBlockSize = this.readUInt8();
    while (ptdBlockSize > 0) {
      plainTextData += this.readString(ptdBlockSize);
      ptdBlockSize = this.readUInt8();
    }

    plainText.plainText = plainTextData;
    this.plainTextExtensions.push(plainText);
    debug('plainTextData:', plainText.plainText);
  }

  /**
   * Decodes the Data Sub Blocks.
   * @returns {number[]} The decoded data
   */
  decodeDataSubBlocks() {
    debug('decodeDataSubBlocks:', this.offset);
    let blockSize = this.readUInt8();
    // debug('blockSize:', blockSize);
    const data = [];
    while (blockSize > 0) {
      // this.advance(blockSize);
      for (let i = 0; i < blockSize; i++) {
        data.push(this.readUInt8());
      }
      blockSize = this.readUInt8();
      // debug('blockSize:', blockSize);
    }
    return data;
  }

  /**
   * Decodes and validates GIF Header.
   *
   * The header takes up the first six bytes of the file.
   * These bytes should all correspond to ASCII character codes.
   * The first three bytes are called the signature.
   * The next three specify the version of the specification that was used to encode the image.
   *
   * Signature + Version (Decimal): [71, 73, 70, 56, 57, 97]
   * Signature + Version (Hexadecimal): [47, 49, 46, 38, 39, 61]
   * Signature + Version (ASCII): [G, I, F, 8, 9, a]
   *
   * @throws {Error} Missing or invalid GIF header
   */
  decodeHeader() {
    debug('decodeHeader:', this.offset);
    /* c8 ignore next 3 */
    if (this.offset !== 0) {
      debug('Offset should be at 0 to read the header.');
    }

    const header = this.readString(6);
    debug('Header:', header);
    if (header === 'GIF89a') {
      this.version = 89;
    } else if (header === 'GIF87a') {
      this.version = 87;
    } /* c8 ignore next 3 */ else {
      throw new Error('Missing or invalid GIF header.');
    }

    this.header = header;
  }

  /**
   * Decodes and parse GIF Logical Screen Descriptor.
   * The logical screen descriptor always immediately follows the header.
   * This block tells the decoder how much room this image will take up.
   * It is exactly seven bytes long.
   */
  decodeLogicalScreenDescriptor() {
    debug('decodeLogicalScreenDescriptor:', this.offset);
    /* c8 ignore next 3 */
    if (this.offset !== 6) {
      debug('Offset should be at 6, just after the header.');
    }

    // Width & Height are 16-bit, nonnegative integers (0-65,535).
    this.width = this.readInt16(true);
    this.height = this.readInt16(true);

    // The next byte contains four fields of packed data, the "logical screen descriptor".
    this.packed = this.readInt8();
    const packed = DataBitstream.fromBytes([this.packed]);

    // The first (most-significant) bit is the global color table flag.
    // If it's 0, then there is no global color table.
    // If it's 1, then a global color table will follow.
    this.globalColorTable = packed.read(1);

    // The next three bits are the color resolution.
    // They are only meaningful if there is a global color table, and allow you to compute its size.
    // If the value of this filed is N, the number of entries in the global color table will be 2 ^ (N+1) - that is, two raised to the power (N+1).
    this.colorResolution = packed.read(3);

    // The next single bit is the sort flag.
    // If the values is 1, then the colors in the global color table are sorted in order of "decreasing importance," which typically means "decreasing frequency" in the image.
    // This can help the image decoder, but is not required.
    this.sortFlag = packed.read(1);

    // The length of the global color table is 2^(N+1) entries where N is the value of the color depth field in the logical screen descriptor.
    // The table will take up 3*2^(N+1) bytes in the stream.
    // | LSD | Colors | Bytes |
    // |-----|--------|-------|
    // |   0 |      2 |     6 |
    // |   1 |      4 |    12 |
    // |   2 |      8 |    24 |
    // |   3 |     16 |    48 |
    // |   4 |     32 |    96 |
    // |   5 |     64 |   192 |
    // |   6 |    128 |   384 |
    // |   7 |    256 |   768 |
    this.sizeOfGlobalColorTable = packed.read(3);

    // The next byte gives us the background color index.
    // This byte is only meaningful if the global color table flag is 1, and if there is no global color table, this byte should be 0.
    // To understand it you have to remember the original "picture wall" rendering model for GIFs in which sub-images are composited onto a larger canvas.
    // It represents which index in the global color table should be used for pixels on the virtual canvas that aren't overlayed by an image.
    this.backgroundColorIndex = this.readInt8();

    // The last byte of the logical screen descriptor is the pixel aspect ratio.
    // The GIF standard doesn't give a rationale for it, but it seems likely that the designers intended it for representing image captures from the analog television of the day, which had rectangular pixel-equivalents.
    // The GIF specification says that if there was a value specified in this byte, N, the actual ratio used would be (N + 15) / 64 for all N<>0.
    this.pixelAspectRatio = this.readInt8();

    const output = JSON.stringify({
      width: this.width,
      height: this.height,
      globalColorTable: this.globalColorTable,
      colorResolution: this.colorResolution,
      sortFlag: this.sortFlag,
      sizeOfGlobalColorTable: this.sizeOfGlobalColorTable,
      backgroundColorIndex: this.backgroundColorIndex,
      pixelAspectRatio: this.pixelAspectRatio,
    });
    debug(`decodeLogicalScreenDescriptor: ${output}`);
  }

  /**
   * Decodes the Global Color Table.
   *
   * GIFs can have either a global color table or local color tables for each sub-image.
   * Each color table consists of a list of RGB (Red-Green-Blue) color component intensities, three bytes for each color, with intensities ranging from 0 (least) to 255 (most).
   * The color (0,0,0) is deepest black, the color (255,255,255) brightest white.
   * This block is "optional" as not every GIF has to specify a global color table.
   * If the global color table flag is set to 1 in the logical screen descriptor block, the global color table is then required to immediately follow that block.
   */
  decodeGlobalColorTable() {
    debug('decodeGlobalColorTable:', this.offset);
    this.colors = 2 ** (this.sizeOfGlobalColorTable + 1);
    this.palette = this.read(this.colors * 3, true);
    debug('colors =', this.colors);
    debug('palette size =', this.colors * 3);
  }

  /**
   * Decompress LZW image data to pixels using the first image descriptor.
   * GIF images are always palette-based (indexed color).
   * @throws {Error} No image descriptors found
   */
  decodePixels() {
    debug('decodePixels');
    if (this.imageDescriptors.length === 0) {
      throw new Error('No image descriptors found');
    }

    // Use the first image descriptor
    const imageDescriptor = this.imageDescriptors[0];
    const { lzwMinimumCodeSize, lzwData } = imageDescriptor;

    // Decompress the LZW data
    const lzw = new GIFLZW(lzwData);
    const decompressed = lzw.decompress(lzwMinimumCodeSize);

    // Convert the string to a Uint8Array of palette indices
    this.pixels = new Uint8Array(decompressed.length);
    for (let i = 0; i < decompressed.length; i++) {
      this.pixels[i] = decompressed.charCodeAt(i);
    }

    debug('Decompressed', this.pixels.length, 'pixels');
  }

  /**
   * Get the pixel color at a specified x, y location.
   * GIF images are always palette-based (indexed color).
   *
   * @param {number} x The horizontal offset to read.
   * @param {number} y The vertical offset to read.
   * @returns {Array<number>} the color as [red, green, blue, alpha]
   * @throws {Error} Pixel data has not been decoded
   * @throws {Error} x is out of bound for the image
   * @throws {Error} y is out of bound for the image
   */
  getPixel(x, y) {
    if (!this.pixels || this.pixels.length === 0) {
      throw new Error('Pixel data has not been decoded.');
    }
    if (!Number.isInteger(x) || x >= this.width || x < 0) {
      throw new Error(`x position out of bounds or invalid: ${x}`);
    }
    if (!Number.isInteger(y) || y >= this.height || y < 0) {
      throw new Error(`y position out of bounds or invalid: ${y}`);
    }

    // Calculate the index in the pixels array
    const i = y * this.width + x;
    const paletteIndex = this.pixels[i];

    // Look up the color in the palette
    // Each palette entry is 3 bytes (RGB)
    let alpha = 255;
    /* c8 ignore next 3 */
    if (this.transparency && this.transparency[paletteIndex] != null) {
      alpha = this.transparency[paletteIndex];
    }

    return [
      this.palette[paletteIndex * 3 + 0],
      this.palette[paletteIndex * 3 + 1],
      this.palette[paletteIndex * 3 + 2],
      alpha,
    ];
  }
}

export default ImageGIF;
