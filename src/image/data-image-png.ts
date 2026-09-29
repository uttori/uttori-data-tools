import { Inflate, deflate } from "pako";

import DataBuffer from "../data-buffer.js";
import { computeBytes } from "../data-hash-crc32.js";
import { RgbaSurface } from "./rgba-surface.js";
import type { IndexedInput, IndexedPixels, RGBA, RgbaImage } from "./types.js";

/** No-op logger, replaced by the `debug` package when enabled. */
let debug: (...args: unknown[]) => void = () => {};
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import("debug");
    debug = d("Uttori.ImagePNG");
  } catch {}
}

export interface PngChunk {
  readonly type: string;
  readonly offset: number;
  readonly end: number;
  readonly length: number;
  readonly data: Uint8Array;
  readonly raw: Uint8Array;
  readonly critical: boolean;
  readonly safeToCopy: boolean;
}

export interface Bounds {
  readonly maxInputBytes?: number;
  readonly maxPixels?: number;
  readonly maxInflatedBytes?: number;
  readonly maxOutputBytes?: number;
  readonly maxChunks?: number;
}
export interface DecodeOptions extends Bounds {
  readonly copyInput?: boolean;
  readonly allow16Bit?: boolean;
  readonly animation?: "reject" | "default-image";
}
export interface EncodeOptions extends Bounds {
  readonly filter?: "none" | "sub" | "adaptive";
  readonly level?: number;
}
export interface IndexedEncodeOptions extends EncodeOptions {
  readonly bitDepth?: IndexedDepth;
}
export interface RewriteOptions extends DecodeOptions, EncodeOptions {
  /** Optional synchronous application policy. Must not mutate the supplied pixels. Throw to reject. */
  readonly validateIndexed?: (image: IndexedPixels) => void;
}

/** The depth of indexed pixels. */
export type IndexedDepth = 1 | 2 | 4 | 8;

export interface IndexedImage extends IndexedInput {
  readonly kind: "indexed-image";
  readonly sourceBitDepth: IndexedDepth;
}

export interface IndexedPngEdit {
  readonly palette?: readonly RGBA[];
  readonly indexes?: Uint8Array;
  readonly dimensions?: { readonly width: number; readonly height: number };
  readonly preserveChunks?: readonly string[];
}

/** File inputs supported by DataBuffer; allocation lengths are not PNG file data. */
export type PngInput = number[] | ArrayBuffer | ArrayBufferView | DataBuffer | number | string;
/** One native sample or index per element; 16-bit samples retain their precision. */
export type PngPixels = Uint8Array | Uint16Array;
/** Starting x/y coordinates and horizontal/vertical strides for one image pass. */
type PngPass = readonly [number, number, number, number];
/** Allocation limits after applying defaults and validating each value. */
type PngLimits = Required<Bounds>;
/** Pako compression levels after runtime validation. */
type CompressionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
/**
 * Zlib counters Pako keeps on the inflator. `strm` is private, so intersecting
 * this with `Inflate` collapses to `never`.
 */
type PngZlibState = {
  avail_in: number;
  total_in: number;
  msg: string;
};

/**
 * Read the private zlib stream. The counters reject trailing bytes and a second zlib stream.
 * @param inflator Streaming inflator whose stream is not part of the public type.
 * @returns The live zlib counters for that inflator.
 */
function zlibState(inflator: Inflate): PngZlibState {
  return (inflator as unknown as { readonly strm: PngZlibState }).strm;
}

/** Eight-byte PNG signature. */
const PNG_SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
/** Adam7 pass order: start x, start y, step x, step y. */
const ADAM7_PASSES: readonly PngPass[] = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];
/** Non-interlaced images use the same row reconstruction with a single pass. */
const SINGLE_PASS: readonly PngPass[] = [[0, 0, 1, 1]];
/** Allowed sample depths for every PNG color type. */
const COLOR_DEPTHS: Readonly<Record<number, readonly number[]>> = {
  0: [1, 2, 4, 8, 16],
  2: [8, 16],
  3: [1, 2, 4, 8],
  4: [8, 16],
  6: [8, 16],
};
/** Animation is detected, but frame decoding is outside the static PNG API. */
const ANIMATION_CHUNKS = new Set(["acTL", "fcTL", "fdAT"]);
/** Default bounds for source data, decoded images, and encoded output. */
const DEFAULT_LIMITS: PngLimits = Object.freeze({
  maxInputBytes: 64 * 1024 * 1024,
  maxPixels: 4 * 1024 * 1024,
  maxInflatedBytes: 64 * 1024 * 1024,
  maxOutputBytes: 64 * 1024 * 1024,
  maxChunks: 16384,
});

/**
 * Resolve and validate caller-provided allocation limits.
 * @param options Optional limits, with omitted values using the defaults.
 * @returns The complete set of validated limits.
 */
function resolveLimits(options: Bounds = {}): PngLimits {
  const result = { ...DEFAULT_LIMITS };
  for (const key of Object.keys(result) as (keyof PngLimits)[]) {
    const value = options[key];
    if (value !== undefined) {
      if (!Number.isSafeInteger(value) || value < 1 || value > Number.MAX_SAFE_INTEGER) {
        throw new RangeError(
          `${String(key)} must be an integer in [1, ${Number.MAX_SAFE_INTEGER}].`,
        );
      }
      result[key] = value;
    }
  }
  return result;
}

/**
 * Normalize PNG input while respecting a typed array's exact byte range.
 * @param input The source bytes or DataBuffer.
 * @param options Input ownership and supported-format policies.
 * @param maxInputBytes Maximum source byte count.
 * @returns Owned bytes, or a borrowed view when copyInput is explicitly false.
 */
function prepareInput(input: PngInput, options: DecodeOptions, maxInputBytes: number): Uint8Array {
  if (options.copyInput !== undefined && typeof options.copyInput !== "boolean") {
    throw new TypeError("copyInput must be a boolean.");
  }
  if (options.allow16Bit !== undefined && typeof options.allow16Bit !== "boolean") {
    throw new TypeError("allow16Bit must be a boolean.");
  }
  if (
    options.animation !== undefined &&
    options.animation !== "reject" &&
    options.animation !== "default-image"
  ) {
    throw new Error("animation must be reject or default-image.");
  }
  if (input instanceof DataBuffer) {
    input = input.data;
  }
  if (typeof input === "number") {
    throw new TypeError("ImagePNG requires PNG data, not an allocation length.");
  }
  let bytes: Uint8Array;
  if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else if (ArrayBuffer.isView(input)) {
    // A plain Uint8Array view avoids DataBuffer making an extra Buffer copy.
    bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else if (Array.isArray(input) || typeof input === "string") {
    if (input.length > maxInputBytes) {
      throw new RangeError("PNG exceeds the input byte limit.");
    }
    bytes = new DataBuffer(input).data;
  } else {
    throw new TypeError("ImagePNG requires PNG bytes or a DataBuffer.");
  }
  if (bytes.length > maxInputBytes) {
    throw new RangeError("PNG exceeds the input byte limit.");
  }
  if (options.copyInput === false) {
    return bytes;
  }
  return Uint8Array.from(bytes);
}

/**
 * Count samples along one dimension of an interlace pass.
 * @param size The full image dimension.
 * @param start The pass's starting coordinate.
 * @param step The sampling stride.
 * @returns The sample count, including zero for an empty pass.
 */
function passLength(size: number, start: number, step: number): number {
  if (size <= start) {
    return 0;
  }
  return Math.ceil((size - start) / step);
}

/**
 * Select the Paeth predictor, resolving ties in left, above, upper-left order.
 * @param left The reconstructed byte to the left.
 * @param above The reconstructed byte in the preceding row.
 * @param upperLeft The previous row's byte to the left.
 * @returns The neighboring byte closest to the linear prediction.
 */
function paethPredictor(left: number, above: number, upperLeft: number): number {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  if (aboveDistance <= upperLeftDistance) {
    return above;
  }
  return upperLeft;
}

/**
 * Reconstruct an owned filtered row in place; no per-byte allocations are made.
 * @param row Filtered row bytes, replaced with reconstructed bytes.
 * @param previous Previous reconstructed row, zeroed at the start of each pass.
 * @param bpp Byte distance to the preceding pixel, rounded up to at least one.
 * @param length Number of bytes used by this row.
 * @param filter PNG filter number, zero through four.
 */
function unfilterRow(
  row: Uint8Array,
  previous: Uint8Array,
  bpp: number,
  length: number,
  filter: number,
): void {
  const leading = Math.min(bpp, length);
  switch (filter) {
    case 0:
      break;
    case 1:
      for (let i = bpp; i < length; i++) {
        row[i] += row[i - bpp];
      }
      break;
    case 2:
      for (let i = 0; i < length; i++) {
        row[i] += previous[i];
      }
      break;
    case 3:
      for (let i = 0; i < leading; i++) {
        row[i] += previous[i] >>> 1;
      }
      for (let i = leading; i < length; i++) {
        row[i] += (row[i - bpp] + previous[i]) >>> 1;
      }
      break;
    case 4:
      // With left and upper-left both zero, Paeth predicts the byte above.
      for (let i = 0; i < leading; i++) {
        row[i] += previous[i];
      }
      for (let i = leading; i < length; i++) {
        row[i] += paethPredictor(row[i - bpp], previous[i], previous[i - bpp]);
      }
      break;
    default:
      throw new Error(`Invalid PNG scanline filter ${filter}.`);
  }
  // Uint8Array writes supply the modulo-256 arithmetic required by PNG.
}

/**
 * Adapt the original public unfilter signature to the shared row implementation.
 * The main decoder reuses its own row buffers and does not allocate through this adapter.
 * @param filter PNG filter number.
 * @param pixels Destination bytes, including any preceding reconstructed row.
 * @param scanline Filtered scanline bytes.
 * @param bpp Byte distance to the preceding pixel.
 * @param offset Destination offset of this row.
 * @param length Row length in bytes.
 * @returns The same destination buffer.
 */
function unfilterScanline<T extends number[] | Uint8Array>(
  filter: number,
  pixels: T,
  scanline: number[] | Uint8Array,
  bpp: number,
  offset: number,
  length: number,
): T {
  if (!Number.isSafeInteger(bpp) || bpp < 1 || bpp > 0x7fffffff) {
    throw new RangeError("Unfilter stride must be an integer in [1, 2147483647].");
  }
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 0x7fffffff) {
    throw new RangeError("Unfilter offset must be an integer in [0, 2147483647].");
  }
  if (!Number.isSafeInteger(length) || length < 0 || length > 0x7fffffff) {
    throw new RangeError("Unfilter length must be an integer in [0, 2147483647].");
  }
  if (offset + length > pixels.length || length > scanline.length) {
    throw new RangeError("Unfilter buffer is too small.");
  }
  const row = Uint8Array.from(scanline.slice(0, length));
  const previous = new Uint8Array(length);
  if (offset >= length) {
    for (let i = 0; i < length; i++) {
      previous[i] = pixels[offset - length + i];
    }
  }
  unfilterRow(row, previous, bpp, length, filter);
  if (pixels instanceof Uint8Array) {
    pixels.set(row, offset);
  } else {
    for (let i = 0; i < length; i++) {
      pixels[offset + i] = row[i];
    }
  }
  return pixels;
}

/**
 * Validate indexed input without quantization, reordering, or slot deduplication.
 * @param image Dimensions, native indexes, and RGBA palette slots.
 * @param bitDepth Packed index depth.
 * @param maxPixels Maximum number of image pixels.
 */
function validateIndexed(image: IndexedInput, bitDepth: number, maxPixels: number): void {
  if (!Number.isSafeInteger(image.width) || image.width < 1 || image.width > 0x7fffffff) {
    throw new RangeError("Width must be an integer in [1, 2147483647].");
  }
  if (!Number.isSafeInteger(image.height) || image.height < 1 || image.height > 0x7fffffff) {
    throw new RangeError("Height must be an integer in [1, 2147483647].");
  }
  if (!Number.isSafeInteger(image.width * image.height) || image.width * image.height > maxPixels) {
    throw new RangeError(
      `Image dimensions ${image.width}x${image.height} exceed the pixel limit ${maxPixels}.`,
    );
  }
  if (bitDepth !== 1 && bitDepth !== 2 && bitDepth !== 4 && bitDepth !== 8) {
    throw new Error("Indexed bit depth must be 1, 2, 4, or 8.");
  }
  if (!Array.isArray(image.palette)) {
    throw new TypeError("Palette must be an array of RGBA8 slots.");
  }
  if (
    !Number.isSafeInteger(image.palette.length) ||
    image.palette.length < 1 ||
    image.palette.length > 2 ** bitDepth
  ) {
    throw new RangeError(`Palette slots must be an integer in [1, ${2 ** bitDepth}].`);
  }
  for (const color of image.palette) {
    if (!Array.isArray(color) || color.length !== 4) {
      throw new Error("Palette entries require RGBA8.");
    }
    for (const value of color) {
      if (!Number.isSafeInteger(value) || value < 0 || value > 255) {
        throw new RangeError("Palette component must be an integer in [0, 255].");
      }
    }
  }
  if (
    !(image.indexes instanceof Uint8Array) ||
    image.indexes.length !== image.width * image.height
  ) {
    throw new Error("Indexed buffer length does not match dimensions.");
  }
  for (const index of image.indexes) {
    if (index >= image.palette.length) {
      throw new Error("PNG pixel index exceeds palette slots.");
    }
  }
}

/**
 * Join complete PNG chunks into owned output after checking its total size.
 * @param parts Signature and framed chunks in file order.
 * @param maxBytes Maximum output byte count.
 * @returns The complete file bytes.
 */
function joinChunks(parts: readonly Uint8Array[], maxBytes: number): Uint8Array {
  let length = 0;
  for (const part of parts) {
    length += part.length;
  }
  if (!Number.isSafeInteger(length) || length > maxBytes) {
    throw new RangeError("PNG exceeds the output byte limit.");
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

/**
 * Frame a PNG chunk and calculate its numeric CRC without hexadecimal conversion.
 * @param type The four-letter chunk identifier.
 * @param data Unframed payload bytes.
 * @returns Length, type, payload, and CRC in PNG byte order.
 */
function makeChunk(type: string, data: Uint8Array): Uint8Array {
  if (!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)) {
    throw new Error(`Invalid PNG chunk type '${type}'.`);
  }
  if (!Number.isSafeInteger(data.length) || data.length < 0 || data.length > 0x7fffffff) {
    throw new RangeError("Chunk length must be an integer in [0, 2147483647].");
  }
  const header = DataBuffer.allocate(8);
  header.writeUInt32(data.length);
  header.writeString(type);
  header.commit();

  // Only the small framing fields use DataBuffer's write buffer. Copy the payload
  // directly into its final position rather than staging a large IDAT as number[].
  const output = new Uint8Array(data.length + 12);
  output.set(header.data);
  output.set(data, 8);
  // CRC covers the chunk's type and payload, but not its length field.
  const checksum = DataBuffer.allocate(4);
  checksum.writeUInt32(computeBytes(output.subarray(4, data.length + 8)));
  checksum.commit();
  output.set(checksum.data, data.length + 8);
  return output;
}

/**
 * Build a non-interlaced IHDR payload from validated image properties.
 * @param width Image width.
 * @param height Image height.
 * @param bitDepth Sample depth.
 * @param colorType PNG color type.
 * @returns Thirteen IHDR bytes with compression, filtering, and interlacing set to zero.
 */
function makeHeader(
  width: number,
  height: number,
  bitDepth: number,
  colorType: number,
): Uint8Array {
  const header = DataBuffer.allocate(13);
  header.writeUInt32(width);
  header.writeUInt32(height);
  header.writeUInt8(bitDepth);
  header.writeUInt8(colorType);
  header.writeUInt8(0); // Compression method.
  header.writeUInt8(0); // Filter method.
  header.writeUInt8(0); // Non-interlaced output.
  header.commit();
  return header.data;
}

/**
 * Create palette chunks retaining all slots, including duplicates and unused colors.
 * @param palette Validated RGBA8 palette slots in original order.
 * @returns Framed PLTE and tRNS chunks.
 */
function makePaletteChunks(palette: readonly RGBA[]): Uint8Array[] {
  const rgb = new Uint8Array(palette.length * 3);
  const alpha = new Uint8Array(palette.length);
  for (let i = 0; i < palette.length; i++) {
    const color = palette[i];
    rgb[i * 3] = color[0];
    rgb[i * 3 + 1] = color[1];
    rgb[i * 3 + 2] = color[2];
    alpha[i] = color[3];
  }
  return [makeChunk("PLTE", rgb), makeChunk("tRNS", alpha)];
}

/**
 * PNG Decoder
 *
 * Also supports indexed editing and indexed/RGBA8 encoding.
 * Native samples and rendering remain distinct:
 * depths 1/2/4/8 use one Uint8Array element per sample or palette index,
 * depth 16 uses one Uint16Array element per sample.
 * Duplicate palette colors retain separate slots. Use toRGBA() explicitly for rendering.
 *
 * Input is copied by default. With `copyInput: false`,
 * you must not mutate the borrowed bytes while the instance is in use.
 * Chunk payloads are read-only views by convention.
 * Native pixels are decoded lazily and cached after success.
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
 * // One element per native sample, including 16-bit samples.
 * const pixel = image.getPixel(0, 0);
 *  ➜ [255, 255, 255, 255]
 * @class
 * @augments DataBuffer
 */
class ImagePNG extends DataBuffer {
  /** Pixel Width */
  width: number;
  /** Pixel Height */
  height: number;
  /** Image Bit Depth, one of: 1, 2, 4, 8, 16 */
  bitDepth: number;
  /** Defines pixel structure, one of: 0, 2, 3, 4, 6 */
  colorType: number;
  /** Type of compression, always 0 */
  compressionMethod: number;
  /** Type of filtering, always 0 */
  filterMethod: number;
  /** Type of interlacing, one of: 0, 1 */
  interlaceMethod: number;
  /** Number of native samples per pixel, not the number of packed bytes. */
  colors: number;
  /** True when the image has an alpha transparency layer */
  alpha: boolean;
  /** Raw Color data */
  palette: Uint8Array;
  /** Row-major native samples, with one element per sample or index. */
  pixels: PngPixels;
  /** Raw Transparency data */
  transparency: Uint8Array;
  /** Object containing physical dimension information */
  physical: { width: number; height: number; unit: number };
  /** Image Data pieces */
  dataChunks: Uint8Array[];
  /** PNG Signature from the data */
  header: Uint8Array;
  /** Validated chunks, including views of their original framing and CRC. */
  chunks: PngChunk[];
  /** Whether animation chunks were found under the explicit default-image policy. */
  animated: boolean;
  /** Decoder policies captured at construction. */
  readonly options: Readonly<DecodeOptions>;
  /** True when the image has been decoded */
  _decoded: boolean;
  /** Validated allocation bounds, reused for parsing and decoding. */
  private readonly _limits: PngLimits;
  /** Chunk names used for singleton and ordering checks. */
  private readonly _seenChunks: Set<string>;
  /** Whether a non-IDAT chunk has ended the contiguous IDAT sequence. */
  private _dataEnded: boolean;

  /**
   * Creates a new ImagePNG.
   *
   * The container is validated immediately; native pixels are decoded on demand.
   * @param input The data to process.
   * @param options Ownership, allocation limits, and format policies.
   * @throws {Error} Signature, framing, CRC, ordering, or metadata are invalid.
   */
  constructor(input: PngInput, options: DecodeOptions = {}) {
    const limits = resolveLimits(options);
    super(prepareInput(input, options, limits.maxInputBytes));
    this.width = 0;
    this.height = 0;
    this.bitDepth = 0;
    this.colorType = 0;
    this.compressionMethod = 0;
    this.filterMethod = 0;
    this.interlaceMethod = 0;
    this.colors = 0;
    this.alpha = false;
    this.palette = new Uint8Array();
    this.pixels = new Uint8Array();
    this.transparency = new Uint8Array();
    this.physical = { width: 0, height: 0, unit: 0 };
    this.dataChunks = [];
    this.header = new Uint8Array();

    this.chunks = [];
    this.animated = false;
    this.options = Object.freeze({ ...options });
    this._decoded = false;
    this._limits = Object.freeze(limits);
    this._seenChunks = new Set();
    this._dataEnded = false;
    this.parse();
  }

  /**
   * Creates a new ImagePNG from file data.
   *
   * The container is validated immediately; native pixels are decoded on demand.
   * @param data The data of the image to process.
   * @param options Ownership, allocation limits, and format policies.
   * @returns {ImagePNG} the new ImagePNG instance for the provided file data
   * @static
   */
  static fromFile(data: PngInput, options: DecodeOptions = {}): ImagePNG {
    debug("fromFile");
    return new ImagePNG(data, options);
  }

  /**
   * Creates a new ImagePNG from a DataBuffer.
   *
   * The container is validated immediately; native pixels are decoded on demand.
   * @param buffer The DataBuffer of the image to process.
   * @param options Ownership, allocation limits, and format policies.
   * @returns the new ImagePNG instance for the provided DataBuffer
   * @static
   */
  static fromBuffer(buffer: DataBuffer, options: DecodeOptions = {}): ImagePNG {
    debug("fromBuffer:", buffer.length);
    return new ImagePNG(buffer, options);
  }

  /**
   * Sets the bitDepth on the ImagePNG instance.
   *
   * Discard samples decoded with the old layout. The complete color/depth
   * combination is checked before decoding.
   * @param bitDepth The bitDepth to set, one of: 1, 2, 4, 8, 16
   * @throws {Error} The depth is invalid or disabled by caller policy.
   */
  setBitDepth(bitDepth: number): void {
    debug("setBitDepth:", bitDepth);
    if (![1, 2, 4, 8, 16].includes(bitDepth)) {
      throw new Error(`Invalid Bit Depth: ${bitDepth}, can be one of: 1, 2, 4, 8, 16`);
    }
    if (bitDepth === 16 && this.options.allow16Bit === false) {
      throw new Error("16-bit PNG samples are disabled by caller policy.");
    }
    this.bitDepth = bitDepth;
    this.invalidatePixels();
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
   *
   * Discard samples decoded with the old layout.
   * @param colorType The colorType to set, one of: 0, 2, 3, 4, 6
   * @throws {Error} Invalid Color Type, anything other than 0, 2, 3, 4, 6
   */
  setColorType(colorType: number): void {
    debug("setColorType:", colorType);
    let colors = 0;
    let alpha = false;
    switch (colorType) {
      case 0:
      case 3:
        colors = 1;
        break;
      case 2:
        colors = 3;
        break;
      case 4:
        colors = 2;
        alpha = true;
        break;
      case 6:
        colors = 4;
        alpha = true;
        break;
      default:
        throw new Error(`Invalid Color Type: ${colorType}, can be one of: 0, 2, 3, 4, 6`);
    }
    this.colors = colors;
    this.alpha = alpha;
    this.colorType = colorType;
    this.invalidatePixels();
  }

  /**
   * Sets the compressionMethod on the ImagePNG instance.
   * The compressionMethod should always be 0.
   * @param compressionMethod The compressionMethod to set, always 0
   * @throws {Error} Unsupported Compression Method, anything other than 0
   */
  setCompressionMethod(compressionMethod: number): void {
    if (compressionMethod !== 0) {
      throw new Error(`Unsupported Compression Method: ${compressionMethod}, should be 0`);
    }
    this.compressionMethod = compressionMethod;
  }

  /**
   * Sets the filterMethod on the ImagePNG instance.
   * The filterMethod should always be 0.
   * @param filterMethod The filterMethod to set, always 0
   * @throws {Error} Unsupported Filter Method, anything other than 0
   */
  setFilterMethod(filterMethod: number): void {
    if (filterMethod !== 0) {
      throw new Error(`Unsupported Filter Method: ${filterMethod}, should be 0`);
    }
    this.filterMethod = filterMethod;
  }

  /**
   * Sets the interlaceMethod on the ImagePNG instance.
   * The interlaceMethod should always be 0 or 1.
   *
   * Discard samples decoded with the old layout.
   * @param interlaceMethod The interlaceMethod to set, always 0 or 1
   * @throws {Error} Unsupported Interlace Method, anything other than 0 or 1
   */
  setInterlaceMethod(interlaceMethod: number): void {
    if (interlaceMethod !== 0 && interlaceMethod !== 1) {
      throw new Error(`Unsupported Interlace Method: ${interlaceMethod}`);
    }
    this.interlaceMethod = interlaceMethod;
    this.invalidatePixels();
  }

  /**
   * Sets the palette on the ImagePNG instance.
   *
   * Palette slots retain their identity; duplicate RGB triples are not deduplicated.
   * @param palette The palette to set
   * @throws {Error} No colors in the palette
   * @throws {Error} Too many colors for the current bit depth
   * @throws {Error} Components, transparency length, or referenced slots are invalid.
   */
  setPalette(palette: number[] | Uint8Array): void {
    if (
      (!Array.isArray(palette) && !(palette instanceof Uint8Array)) ||
      palette.length === 0 ||
      palette.length % 3 !== 0 ||
      palette.length > 768
    ) {
      throw new Error("Invalid PNG palette; expected 1 to 256 RGB triples.");
    }
    const count = palette.length / 3;
    if (this.colorType === 3 && count > 2 ** this.bitDepth) {
      throw new Error(`Palette contains more than ${2 ** this.bitDepth} colors.`);
    }
    for (const value of palette) {
      if (!Number.isSafeInteger(value) || value < 0 || value > 255) {
        throw new RangeError("Palette byte must be an integer in [0, 255].");
      }
    }
    if (this.colorType === 3) {
      if (this.transparency.length > count) {
        throw new Error("Transparency exceeds the new palette.");
      }
      if (this._decoded) {
        for (const index of this.pixels) {
          if (index >= count) {
            throw new Error("Decoded index exceeds the new palette.");
          }
        }
      }
    }
    this.palette = Uint8Array.from(palette);
  }

  /** Discard decoded native samples without changing the original compressed IDAT data. */
  invalidatePixels(): void {
    this._decoded = false;
    if (this.pixels.length !== 0) {
      this.pixels = new Uint8Array();
    }
  }

  /**
   * Parse the PNG file, decoding the supported chunks.
   *
   * Start from the beginning and reset metadata and cached samples.
   * @returns This image.
   * @throws {Error} Required chunks are missing or any chunk fails validation.
   */
  parse(): this {
    debug("parse");
    if (this.data.length > this._limits.maxInputBytes) {
      throw new RangeError("PNG exceeds the input byte limit.");
    }
    this.reset();
    this.palette = new Uint8Array();
    this.transparency = new Uint8Array();
    this.physical = { width: 0, height: 0, unit: 0 };
    this.dataChunks = [];
    this.chunks = [];
    this.animated = false;
    this._seenChunks.clear();
    this._dataEnded = false;
    this.invalidatePixels();
    this.decodeHeader();

    while (this.remainingBytes() > 0) {
      if (this.decodeChunk() === "IEND") {
        break;
      }
    }
    if (!this._seenChunks.has("IHDR") || !this._seenChunks.has("IEND")) {
      throw new Error("PNG is missing IHDR or IEND.");
    }
    // Validate decompressed size before allocating scanlines or native samples.
    this._expectedInflatedBytes();
    return this;
  }

  /**
   * Decodes and validates PNG Header.
   * Signature (Decimal): [137, 80, 78, 71, 13, 10, 26, 10]
   * Signature (Hexadecimal): [89, 50, 4E, 47, 0D, 0A, 1A, 0A]
   * Signature (ASCII): [\211, P, N, G, \r, \n, \032, \n]
   * @throws {Error} Missing or invalid PNG header
   * @throws {Error} The header is not being read from offset zero.
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature|PNG Signature}
   */
  decodeHeader(): void {
    if (this.offset !== 0) {
      throw new Error("PNG header must be read at offset zero.");
    }
    if (!this.isNextBytes(PNG_SIGNATURE)) {
      throw new Error("Missing or invalid PNG header.");
    }
    this.header = this.read(PNG_SIGNATURE.length);
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
   *
   * Validate CRCs, chunk ordering, and bounds before dispatching.
   * Ancillary records retain their original framing for indexed rewriting.
   * @returns {string} Chunk Type
   * @throws {Error} Invalid chunk length, CRC, ordering, or critical chunk type.
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout|Chunk Layout}
   */
  decodeChunk(): string {
    const offset = this.offset;
    if (!Number.isSafeInteger(offset) || offset < 8 || offset > this.data.length) {
      throw new RangeError(`Chunk offset must be an integer in [8, ${this.data.length}].`);
    }
    if (this.chunks.length >= this._limits.maxChunks) {
      throw new RangeError("PNG exceeds the chunk count limit.");
    }
    if (this._seenChunks.has("IEND")) {
      throw new Error("PNG contains data after IEND.");
    }
    if (!this.available(12)) {
      throw new Error("Truncated PNG chunk header.");
    }

    // Peek until validation succeeds so a rejected chunk does not advance the cursor.
    const length = this.peekUInt32(offset);
    if (length > 0x7fffffff || length > this.data.length - offset - 12) {
      throw new Error("Invalid PNG chunk length.");
    }

    const end = offset + length + 12;
    const type = this.peekString(offset + 4, 4);
    if (!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)) {
      throw new Error(`Invalid PNG chunk type '${type}'.`);
    }

    const expectedCrc = this.peekUInt32(end - 4);
    const actualCrc = computeBytes(this.data.subarray(offset + 4, end - 4));
    if (expectedCrc !== actualCrc) {
      throw new Error(`PNG ${type} CRC mismatch.`);
    }
    if (!this._seenChunks.has("IHDR") && type !== "IHDR") {
      throw new Error("PNG IHDR must be first.");
    }

    // Keep payloads as views: DataBuffer.read() copies, which is unnecessary for IDAT.
    const chunk = this.data.subarray(offset + 8, end - 4);
    const critical = (this.peekUInt8(offset + 4) & 32) === 0;
    const dataSeen = this.dataChunks.length !== 0;

    debug("decodeChunk:", type, "length:", length);
    switch (type) {
      case "IHDR":
        if (this._seenChunks.has(type)) {
          throw new Error("PNG requires exactly one IHDR.");
        }
        this.decodeIHDR(chunk);
        break;
      case "PLTE":
        if (
          this._seenChunks.has(type) ||
          dataSeen ||
          this._seenChunks.has("tRNS") ||
          this.colorType === 0 ||
          this.colorType === 4
        ) {
          throw new Error("Invalid PNG PLTE placement.");
        }
        this.decodePLTE(chunk);
        break;
      case "tRNS":
        if (this._seenChunks.has(type) || dataSeen) {
          throw new Error("Invalid PNG tRNS placement.");
        }
        this.decodeTRNS(chunk);
        break;
      case "pHYs":
        if (this._seenChunks.has(type) || dataSeen) {
          throw new Error("Invalid PNG pHYs placement.");
        }
        this.decodePHYS(chunk);
        break;
      case "IDAT":
        if (this._dataEnded || (this.colorType === 3 && !this._seenChunks.has("PLTE"))) {
          throw new Error("PNG IDAT chunks must be contiguous and follow PLTE.");
        }
        this.decodeIDAT(chunk);
        break;
      case "IEND":
        if (!dataSeen || end !== this.data.length) {
          throw new Error("Invalid PNG IEND chunk or trailing file bytes.");
        }
        this.decodeIEND(chunk);
        break;
      // case 'cHRM': decodeCHRM(chunk); break;
      // case 'gAMA': decodeGAMA(chunk); break;
      // case 'bKGD': decodeBKGD(chunk); break;
      // case 'tIME': decodeTIME(chunk); break;
      // case 'tEXt': decodeTEXT(chunk); break;
      // case 'iTXt': decodeITXT(chunk); break;
      // case 'sRGB': decodeSRGB(chunk); break;
      // case 'sBIT': decodeSBIT(chunk); break;
      default:
        if (critical) {
          throw new Error(`Unsupported critical PNG chunk '${type}'.`);
        }
        if (ANIMATION_CHUNKS.has(type)) {
          if (this.options.animation !== "default-image") {
            throw new Error(
              "Animated PNG is not supported; request animation: default-image explicitly.",
            );
          }
          this.animated = true;
        }
        break;
    }
    this.chunks.push({
      type,
      offset,
      end,
      length,
      data: chunk,
      raw: this.data.subarray(offset, end),
      critical,
      safeToCopy: (this.peekUInt8(offset + 7) & 32) !== 0,
    });
    this._seenChunks.add(type);
    if (dataSeen && type !== "IDAT") {
      this._dataEnded = true;
    }
    this.seek(end);
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
   * @param chunk Data Blob
   * @throws {Error} Dimensions, sample layout, or PNG methods are invalid.
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR|Image Header}
   * @see {@link http://www.libpng.org/pub/png/spec/1.2/png-1.2-pdg.html#C.IHDR|Image Header}
   */
  decodeIHDR(chunk: Uint8Array): void {
    if (chunk.length !== 13) {
      throw new Error("PNG requires a 13-byte IHDR.");
    }
    const header = new DataBuffer(chunk);
    const width = header.readUInt32();
    const height = header.readUInt32();
    const bitDepth = header.readUInt8();
    const colorType = header.readUInt8();
    const compressionMethod = header.readUInt8();
    const filterMethod = header.readUInt8();
    const interlaceMethod = header.readUInt8();
    if (!Number.isSafeInteger(width) || width < 1 || width > 0x7fffffff) {
      throw new RangeError("Width must be an integer in [1, 2147483647].");
    }
    if (!Number.isSafeInteger(height) || height < 1 || height > 0x7fffffff) {
      throw new RangeError("Height must be an integer in [1, 2147483647].");
    }
    if (!Number.isSafeInteger(width * height) || width * height > this._limits.maxPixels) {
      throw new RangeError(
        `Image dimensions ${width}x${height} exceed the pixel limit ${this._limits.maxPixels}.`,
      );
    }
    if (!COLOR_DEPTHS[colorType]?.includes(bitDepth)) {
      throw new Error(`Invalid PNG color type ${colorType} at ${bitDepth} bits.`);
    }
    this.width = width;
    this.height = height;
    this.setBitDepth(bitDepth);
    this.setColorType(colorType);
    this.setCompressionMethod(compressionMethod);
    this.setFilterMethod(filterMethod);
    this.setInterlaceMethod(interlaceMethod);
  }

  /**
   * Decode the PLTE (Palette) chunk.
   * The PLTE chunk contains from 1 to 256 palette entries, each a three-byte series of the form.
   * The number of entries is determined from the chunk length. A chunk length not divisible by 3 is an error.
   *
   * Preserve the original palette slot order, including duplicate colors.
   * @param chunk Data Blob
   * @see {@link http://www.w3.org/TR/PNG/#11PLTE|Palette}
   */
  decodePLTE(chunk: Uint8Array): void {
    this.setPalette(chunk);
  }

  /**
   * Decode the IDAT (Image Data) chunk.
   * The IDAT chunk contains the actual image data which is the output stream of the compression algorithm.
   *
   * Retain a payload view for bounded inflation on demand and invalidate cached
   * samples. Empty IDAT chunks are legal.
   * @param chunk Data Blob
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT|Image Data}
   */
  decodeIDAT(chunk: Uint8Array): void {
    this.dataChunks.push(chunk);
    this.invalidatePixels();
  }

  /**
   * Decode the tRNS (Transparency) chunk.
   * The tRNS chunk specifies that the image uses simple transparency: either alpha values associated with palette entries (for indexed-color images) or a single transparent color (for grayscale and truecolor images). Although simple transparency is not as elegant as the full alpha channel, it requires less storage space and is sufficient for many common cases.
   * @param chunk Data Blob
   * @throws {Error} Transparency is incompatible with the color type or sample depth.
   * @see {@link https://www.w3.org/TR/PNG/#11tRNS|Transparency}
   */
  decodeTRNS(chunk: Uint8Array): void {
    switch (this.colorType) {
      case 3:
        if (
          this.palette.length === 0 ||
          chunk.length === 0 ||
          chunk.length > this.palette.length / 3
        ) {
          throw new Error("Invalid indexed PNG tRNS chunk.");
        }
        break;
      case 0:
        if (chunk.length !== 2) {
          throw new Error("Grayscale PNG tRNS requires two bytes.");
        }
        break;
      case 2:
        if (chunk.length !== 6) {
          throw new Error("RGB PNG tRNS requires six bytes.");
        }
        break;
      default:
        throw new Error("PNG color types with alpha cannot contain tRNS.");
    }
    if (this.colorType !== 3) {
      const maximum = 2 ** this.bitDepth - 1;
      const buffer = new DataBuffer(chunk);
      while (buffer.remainingBytes() > 0) {
        if (buffer.readUInt16() > maximum) {
          throw new Error("PNG tRNS sample exceeds bit depth.");
        }
      }
    }
    this.transparency = Uint8Array.from(chunk);
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
   *
   * Keep the raw pixels-per-unit values. When unit is 1, multiplying by 0.0254
   * converts pixels per meter to pixels per inch without changing stored metadata.
   * @param chunk Data Blob
   * @throws {Error} The length or unit specifier is invalid.
   * @see {@link https://www.w3.org/TR/PNG/#11pHYs|Pixel Dimensions}
   */
  decodePHYS(chunk: Uint8Array): void {
    if (chunk.length !== 9) {
      throw new Error("Invalid PNG pHYs chunk.");
    }
    const buffer = new DataBuffer(chunk);
    const width = buffer.readUInt32();
    const height = buffer.readUInt32();
    const unit = buffer.readUInt8();
    if (unit > 1) {
      throw new Error("Invalid PNG pHYs chunk.");
    }
    this.physical = { width, height, unit };
  }

  /**
   * Decode the IEND (Image trailer) chunk.
   * The IEND chunk marks the end of the PNG DataBuffer. The chunk's data field is empty.
   * @param chunk The IEND payload, which must have no bytes.
   * @throws {Error} IEND contains data.
   * @see {@link http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND|Image Trailer}
   */
  decodeIEND(chunk: Uint8Array): void {
    if (chunk.length !== 0) {
      throw new Error("IEND must be empty.");
    }
  }

  /**
   * Measure the exact decompressed layout, including filter bytes for each pass.
   * @param interlaceMethod The layout to measure; defaults to the current IHDR value.
   * @returns Expected filtered scanline byte count.
   * @throws {Error} The layout is invalid or exceeds the inflation limit.
   */
  private _expectedInflatedBytes(interlaceMethod = this.interlaceMethod): number {
    if (!Number.isSafeInteger(this.width) || this.width < 1 || this.width > 0x7fffffff) {
      throw new RangeError("Width must be an integer in [1, 2147483647].");
    }
    if (!Number.isSafeInteger(this.height) || this.height < 1 || this.height > 0x7fffffff) {
      throw new RangeError("Height must be an integer in [1, 2147483647].");
    }
    if (
      !Number.isSafeInteger(this.width * this.height) ||
      this.width * this.height > this._limits.maxPixels
    ) {
      throw new RangeError(
        `Image dimensions ${this.width}x${this.height} exceed the pixel limit ${this._limits.maxPixels}.`,
      );
    }
    if (!COLOR_DEPTHS[this.colorType]?.includes(this.bitDepth)) {
      throw new Error(`Invalid PNG color type ${this.colorType} at ${this.bitDepth} bits.`);
    }
    if (interlaceMethod !== 0 && interlaceMethod !== 1) {
      throw new Error(`Unsupported Interlace Method: ${interlaceMethod}`);
    }
    let passes = SINGLE_PASS;
    if (interlaceMethod === 1) {
      passes = ADAM7_PASSES;
    }
    let expected = 0;
    for (const [startX, startY, stepX, stepY] of passes) {
      const width = passLength(this.width, startX, stepX);
      const height = passLength(this.height, startY, stepY);
      if (width !== 0 && height !== 0) {
        const rowBytes = Math.ceil((width * this.colors * this.bitDepth) / 8);
        expected += height * (rowBytes + 1);
      }
    }
    if (!Number.isSafeInteger(expected) || expected > this._limits.maxInflatedBytes) {
      throw new RangeError("PNG exceeds the inflated byte limit.");
    }
    return expected;
  }

  /**
   * Uncompress IDAT chunks.
   *
   * Reverse scanline filters and unpack native samples after bounded inflation.
   * Successful decodes are cached. Forcing a decode discards in-memory pixel edits
   * and reconstructs the source IDAT; failures never expose partial pixel buffers.
   * @param options Cache control for this decode.
   * @param options.force Discard cached samples and decode the source again.
   * @returns Row-major native samples, retaining original palette indexes.
   * @throws {Error} No IDAT chunks to decode
   * @throws {Error} Deinterlacing Error
   * @throws {Error} Inflating Error
   * @throws {Error} Compressed data, scanline lengths, filters, or indexes are invalid.
   */
  decodePixels({ force = false }: { readonly force?: boolean } = {}): PngPixels {
    if (typeof force !== "boolean") {
      throw new TypeError("force must be a boolean.");
    }
    if (this._decoded && !force) {
      return this.pixels;
    }
    this.invalidatePixels();
    if (this.dataChunks.length === 0) {
      throw new Error("No IDAT chunks to decode.");
    }
    const expected = this._expectedInflatedBytes();
    const output = new Uint8Array(expected);
    const inflator = new Inflate({
      windowBits: 15,
      chunkSize: 16 * 1024,
    });
    const zlib = zlibState(inflator);
    let written = 0;
    let compressedLength = 0;
    let ended = false;
    let errorCode = 0;

    // Enforce the declared size before each write, not after an unbounded inflate.
    // Explicit windowBits also disables Pako's gzip auto-detection.
    inflator.onData = (chunk: Uint8Array): void => {
      if (written + chunk.length > expected) {
        throw new Error("PNG inflated data exceeds declared dimensions.");
      }
      output.set(chunk, written);
      written += chunk.length;
    };
    inflator.onEnd = (status: number): void => {
      ended = true;
      errorCode = status;
    };

    // Feed existing IDAT views without a second concatenated compressed buffer.
    // Require natural zlib end, including the Adler checksum; forcing Z_FINISH
    // can accept a truncated stream with older Pako releases.
    for (const chunk of this.dataChunks) {
      if (chunk.length === 0) {
        continue;
      }
      if (ended) {
        throw new Error("PNG has compressed data after the zlib stream.");
      }
      compressedLength += chunk.length;
      if (compressedLength > this._limits.maxInputBytes) {
        throw new RangeError("PNG exceeds the input byte limit.");
      }
      if (!inflator.push(chunk, false) || errorCode !== 0) {
        throw new Error(`Invalid PNG image data: ${zlib.msg || "inflate failure"}.`);
      }
      if (zlib.avail_in !== 0) {
        throw new Error("PNG has trailing bytes after the zlib stream.");
      }
    }
    if (!ended || errorCode !== 0 || written !== expected) {
      throw new Error(
        "Invalid PNG image data: incomplete zlib stream or scanline length mismatch.",
      );
    }
    // A second zlib stream resets Pako's counter. PNG allows exactly one stream.
    if (zlib.total_in !== compressedLength) {
      throw new Error("PNG IDAT must contain exactly one zlib stream.");
    }
    if (this.interlaceMethod === 0) {
      return this.interlaceNone(output);
    }
    return this.interlaceAdam7(output);
  }

  /**
   * Deinterlace with no interlacing.
   * @param data Data to deinterlace.
   * @returns Native samples, also stored in pixels on success.
   * @see {@link https://www.w3.org/TR/PNG-Filters.html|PNG Filters}
   */
  interlaceNone(data: Uint8Array): PngPixels {
    return this._decodeScanlines(data, 0);
  }

  /**
   * Deinterlace with Adam7 interlacing.
   * Adam7 divides the image into 7 passes with different starting positions and step sizes.
   *
   * Empty passes consume neither filter bytes nor row bytes. Scatter decoded
   * samples into row-major image order without converting palette indexes.
   * @param data Data to deinterlace.
   * @returns Native samples, also stored in pixels on success.
   * @see {@link https://www.w3.org/TR/PNG/#8Interlace|PNG Adam7 Interlacing}
   * @see {@link https://github.com/em2046/lens/blob/master/assets/js/interlace.js}
   * @see {@link https://github.com/em2046/aperture/tree/master/lib/png/chunks}
   * @see {@link https://github.com/beejjorgensen/jsmandel/blob/master/src/js/adam7.js}
   * @see {@link http://diyhpl.us/~yenatch/pokecrystal/src/pypng/code/png.py}
   * @see {@link https://github.com/SixLabors/ImageSharp/blob/master/src/ImageSharp/Formats/Png/Adam7.cs}
   */
  interlaceAdam7(data: Uint8Array): PngPixels {
    return this._decodeScanlines(data, 1);
  }

  /**
   * Share row reconstruction and native sample unpacking across interlace modes.
   * @param data Exact filtered scanline bytes.
   * @param interlaceMethod Zero for the full image, or one for Adam7 passes.
   * @returns The fully reconstructed native sample buffer.
   */
  private _decodeScanlines(data: Uint8Array, interlaceMethod: number): PngPixels {
    this.invalidatePixels();
    if (data.length !== this._expectedInflatedBytes(interlaceMethod)) {
      throw new Error("PNG scanline length mismatch.");
    }
    const { width, height, colors, bitDepth } = this;
    const sampleCount = width * height * colors;
    let samples: PngPixels;
    if (bitDepth === 16) {
      samples = new Uint16Array(sampleCount);
    } else {
      samples = new Uint8Array(sampleCount);
    }
    let passes = SINGLE_PASS;
    if (interlaceMethod === 1) {
      passes = ADAM7_PASSES;
    }
    // Filtering operates on packed bytes, not unpacked samples.
    // Sub-byte images use a filter stride of one byte, even though that byte holds multiple pixels.
    const bytesPerPixel = Math.max(1, Math.ceil((colors * bitDepth) / 8));
    const maxRowBytes = Math.ceil((width * colors * bitDepth) / 8);
    let current = new DataBuffer(maxRowBytes);
    let previous = new DataBuffer(maxRowBytes);
    const scanlines = new DataBuffer(data);
    for (const [startX, startY, stepX, stepY] of passes) {
      const passWidth = passLength(width, startX, stepX);
      const passHeight = passLength(height, startY, stepY);
      if (passWidth === 0 || passHeight === 0) {
        continue;
      }
      const rowBytes = Math.ceil((passWidth * colors * bitDepth) / 8);
      previous.data.fill(0, 0, rowBytes);
      for (let y = 0; y < passHeight; y++) {
        const filter = scanlines.readUInt8();
        current.data.set(data.subarray(scanlines.offset, scanlines.offset + rowBytes));
        scanlines.advance(rowBytes);
        current.reset();
        unfilterRow(current.data, previous.data, bytesPerPixel, rowBytes, filter);

        // Input advances by packed byte count; output uses image coordinates.
        // Keeping these offsets separate handles Adam7 gaps and avoids cumulative
        // destination-offset errors in the non-interlaced path.
        let destination = ((startY + y * stepY) * width + startX) * colors;
        if (bitDepth === 8 && stepX === 1) {
          samples.set(current.data.subarray(0, rowBytes), destination);
        } else if (bitDepth < 8) {
          const mask = (1 << bitDepth) - 1;
          for (let x = 0, bit = 0; x < passWidth; x++, bit += bitDepth, destination += stepX) {
            // The leftmost sample occupies the most significant bits of its byte.
            samples[destination] = (current.data[bit >>> 3] >>> (8 - bitDepth - (bit & 7))) & mask;
          }
        } else {
          for (let x = 0; x < passWidth; x++, destination += stepX * colors) {
            for (let channel = 0; channel < colors; channel++) {
              if (bitDepth === 16) {
                samples[destination + channel] = current.readUInt16();
              } else {
                samples[destination + channel] = current.readUInt8();
              }
            }
          }
        }
        // Swap row storage rather than allocating or copying a preceding row.
        const temporary = previous;
        previous = current;
        current = temporary;
      }
    }
    if (this.colorType === 3) {
      const paletteSize = this.palette.length / 3;
      for (const index of samples) {
        if (index >= paletteSize) {
          throw new Error(`PNG palette index ${index} is out of range.`);
        }
      }
    }
    this.pixels = samples;
    this._decoded = true;
    return samples;
  }

  /**
   * Get indexed pixels without flattening duplicate palette colors.
   * @param options Index-buffer ownership.
   * @param options.copy False to borrow decoded indexes; defaults to true.
   * @returns Native indexes, newly expanded RGBA slots, and original index depth.
   * @throws {Error} The source is not indexed.
   */
  toIndexed({ copy = true }: { readonly copy?: boolean } = {}): IndexedImage {
    if (typeof copy !== "boolean") {
      throw new TypeError("copy must be a boolean.");
    }
    if (this.colorType !== 3) {
      throw new Error("PNG does not contain indexed pixels.");
    }
    const pixels = this.decodePixels();
    if (!(pixels instanceof Uint8Array)) {
      throw new Error("Indexed PNG pixels must be byte-sized samples.");
    }
    let indexes = pixels;
    if (copy) {
      indexes = Uint8Array.from(pixels);
    }
    return {
      kind: "indexed-image",
      width: this.width,
      height: this.height,
      indexes,
      palette: this._paletteRGBA(),
      sourceBitDepth: this.bitDepth as IndexedDepth,
    };
  }

  /**
   * Convert native samples to straight-alpha RGBA8 for rendering.
   * Sixteen-bit values are rounded to the nearest eight-bit value after testing
   * native transparency keys. Native samples and indexes remain unchanged.
   * @param options Output-buffer ownership for an RGBA8 source.
   * @param options.copy False to share existing RGBA8 samples; defaults to true.
   * @returns The RGBA surface; other source formats always require a new buffer.
   */
  toRGBA({ copy = true }: { readonly copy?: boolean } = {}): RgbaSurface {
    if (typeof copy !== "boolean") {
      throw new TypeError("copy must be a boolean.");
    }
    const pixels = this.decodePixels();
    if (this.colorType === 6 && this.bitDepth === 8 && pixels instanceof Uint8Array) {
      return new RgbaSurface(this.width, this.height, pixels, {
        copy,
        maxPixels: this._limits.maxPixels,
      });
    }
    const rgba = new Uint8Array(this.width * this.height * 4);
    const key = this._transparencyKey();
    for (let pixel = 0, offset = 0; pixel < this.width * this.height; pixel++, offset += 4) {
      this._writePixel(pixel, rgba, offset, key);
    }
    return new RgbaSurface(this.width, this.height, rgba, {
      copy: false,
      maxPixels: this._limits.maxPixels,
    });
  }

  /**
   * Get the pixel color at a specified x, y location.
   *
   * Decode native samples on demand, then convert the selected pixel to RGBA8.
   * Sixteen-bit samples are rounded after testing native transparency keys.
   * Prefer toRGBA() for bulk conversion or getPixelInto() for reusable output.
   * @param x The hoizontal offset to read.
   * @param y The vertical offset to read.
   * @returns the color as [red, green, blue, alpha]
   * @throws {Error} x is out of bound for the image
   * @throws {Error} y is out of bound for the image
   * @throws {Error} Unknown color types
   */
  getPixel(x: number, y: number): [number, number, number, number] {
    if (!Number.isSafeInteger(x) || x < 0 || x > this.width - 1) {
      throw new RangeError(`x position must be an integer in [0, ${this.width - 1}].`);
    }
    if (!Number.isSafeInteger(y) || y < 0 || y > this.height - 1) {
      throw new RangeError(`y position must be an integer in [0, ${this.height - 1}].`);
    }
    this.decodePixels();
    const output: [number, number, number, number] = [0, 0, 0, 0];
    this._writePixel(y * this.width + x, output, 0, this._transparencyKey());
    return output;
  }

  /**
   * Write an RGBA8 pixel into a caller-owned buffer without allocating an output tuple.
   * @param x Horizontal pixel coordinate.
   * @param y Vertical pixel coordinate.
   * @param output Destination bytes.
   * @param offset First of four writable destination bytes.
   * @returns The same output buffer.
   */
  getPixelInto(x: number, y: number, output: Uint8Array, offset = 0): Uint8Array {
    if (!Number.isSafeInteger(x) || x < 0 || x > this.width - 1) {
      throw new RangeError(`x position must be an integer in [0, ${this.width - 1}].`);
    }
    if (!Number.isSafeInteger(y) || y < 0 || y > this.height - 1) {
      throw new RangeError(`y position must be an integer in [0, ${this.height - 1}].`);
    }
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 0x7fffffff) {
      throw new RangeError("Output offset must be an integer in [0, 2147483647].");
    }
    if (!(output instanceof Uint8Array) || offset + 4 > output.length) {
      throw new RangeError("Output needs four writable bytes.");
    }
    this.decodePixels();
    this._writePixel(y * this.width + x, output, offset, this._transparencyKey());
    return output;
  }

  /**
   * Expand RGB palette metadata into newly owned RGBA tuples without remapping slots.
   * @returns Palette slots, with full opacity for entries omitted from tRNS.
   */
  private _paletteRGBA(): RGBA[] {
    const palette: RGBA[] = [];
    for (let index = 0; index < this.palette.length / 3; index++) {
      const offset = index * 3;
      palette.push([
        this.palette[offset],
        this.palette[offset + 1],
        this.palette[offset + 2],
        this.transparency[index] ?? 255,
      ]);
    }
    return palette;
  }

  /**
   * Read a grayscale/RGB transparency key in native sample precision.
   * @returns Key components, or an empty array when there is no color key.
   */
  private _transparencyKey(): number[] {
    const key: number[] = [];
    if (this.colorType !== 0 && this.colorType !== 2) {
      return key;
    }
    if (this.transparency.length !== 0) {
      const buffer = new DataBuffer(this.transparency);
      while (buffer.remainingBytes() > 0) {
        key.push(buffer.readUInt16());
      }
    }
    return key;
  }

  /**
   * Write one native pixel as RGBA8, retaining RGB beneath transparent alpha.
   * @param pixel Row-major pixel index, not a byte offset.
   * @param output Destination array or byte buffer.
   * @param offset Destination byte offset.
   * @param key Native transparency components, resolved once per bulk conversion.
   */
  private _writePixel(
    pixel: number,
    output: number[] | Uint8Array,
    offset: number,
    key: readonly number[],
  ): void {
    const source = pixel * this.colors;
    let scale = 1;
    if (this.bitDepth !== 8) {
      scale = 255 / (2 ** this.bitDepth - 1);
    }
    switch (this.colorType) {
      case 3: {
        const index = this.pixels[source];
        const paletteOffset = index * 3;
        output[offset] = this.palette[paletteOffset];
        output[offset + 1] = this.palette[paletteOffset + 1];
        output[offset + 2] = this.palette[paletteOffset + 2];
        output[offset + 3] = this.transparency[index] ?? 255;
        break;
      }
      case 0:
      case 4: {
        const gray = Math.round(this.pixels[source] * scale);
        let alpha = 255;
        if (this.colorType === 4) {
          alpha = Math.round(this.pixels[source + 1] * scale);
        } else if (this.pixels[source] === key[0]) {
          alpha = 0;
        }
        output[offset] = gray;
        output[offset + 1] = gray;
        output[offset + 2] = gray;
        output[offset + 3] = alpha;
        break;
      }
      case 2:
      case 6: {
        let alpha = 255;
        if (this.colorType === 6) {
          alpha = Math.round(this.pixels[source + 3] * scale);
        } else if (
          this.pixels[source] === key[0] &&
          this.pixels[source + 1] === key[1] &&
          this.pixels[source + 2] === key[2]
        ) {
          // Distinct 16-bit colors may round to identical RGB8 values; match first.
          alpha = 0;
        }
        output[offset] = Math.round(this.pixels[source] * scale);
        output[offset + 1] = Math.round(this.pixels[source + 1] * scale);
        output[offset + 2] = Math.round(this.pixels[source + 2] * scale);
        output[offset + 3] = alpha;
        break;
      }
      default:
        throw new Error(`Unknown Color Type: ${this.colorType}`);
    }
  }

  /**
   * Encode indexed pixels without quantization, palette reordering, or deduplication.
   * @param image Native indexes and RGBA palette slots.
   * @param options Bit depth, filters, compression level, and allocation limits.
   * @returns Owned non-interlaced PNG bytes; the default index depth is eight bits.
   * @static
   */
  static encodeIndexed(image: IndexedInput, options: IndexedEncodeOptions = {}): Uint8Array {
    const limits = resolveLimits(options);
    const bitDepth = options.bitDepth ?? 8;
    validateIndexed(image, bitDepth, limits.maxPixels);
    const compressed = ImagePNG._encodeIndexedData(image, bitDepth, options, limits);
    return joinChunks(
      [
        PNG_SIGNATURE,
        makeChunk("IHDR", makeHeader(image.width, image.height, bitDepth, 3)),
        ...makePaletteChunks(image.palette),
        makeChunk("IDAT", compressed),
        makeChunk("IEND", new Uint8Array()),
      ],
      limits.maxOutputBytes,
    );
  }

  /**
   * Create an indexed PNG using the encodeIndexed() implementation.
   * @param image Native indexes and RGBA palette slots.
   * @param options Bit depth, filters, compression level, and allocation limits.
   * @returns Owned PNG bytes retaining each supplied palette slot.
   * @static
   */
  static createIndexedPng(image: IndexedInput, options: IndexedEncodeOptions = {}): Uint8Array {
    return ImagePNG.encodeIndexed(image, options);
  }

  /**
   * Encode straight-alpha RGBA8 without changing hidden RGB components.
   * @param image Dimensions and an exact row-major RGBA8 buffer.
   * @param options Filters, compression level, and allocation limits.
   * @returns Owned non-interlaced RGBA8 PNG bytes.
   * @static
   */
  static encodeRGBA(image: RgbaImage, options: EncodeOptions = {}): Uint8Array {
    const limits = resolveLimits(options);
    if (!Number.isSafeInteger(image.width) || image.width < 1 || image.width > 0x7fffffff) {
      throw new RangeError("Width must be an integer in [1, 2147483647].");
    }
    if (!Number.isSafeInteger(image.height) || image.height < 1 || image.height > 0x7fffffff) {
      throw new RangeError("Height must be an integer in [1, 2147483647].");
    }
    if (
      !Number.isSafeInteger(image.width * image.height) ||
      image.width * image.height > limits.maxPixels
    ) {
      throw new RangeError(
        `Image dimensions ${image.width}x${image.height} exceed the pixel limit ${limits.maxPixels}.`,
      );
    }
    if (
      !(image.rgba instanceof Uint8Array) ||
      image.rgba.length !== image.width * image.height * 4
    ) {
      throw new Error("RGBA buffer length does not match dimensions.");
    }
    const rowBytes = image.width * 4;
    const compressed = ImagePNG._encodeRows(
      image.height,
      rowBytes,
      4,
      (row, y): void => {
        row.set(image.rgba.subarray(y * rowBytes, (y + 1) * rowBytes));
      },
      options,
      limits,
    );
    return joinChunks(
      [
        PNG_SIGNATURE,
        makeChunk("IHDR", makeHeader(image.width, image.height, 8, 6)),
        makeChunk("IDAT", compressed),
        makeChunk("IEND", new Uint8Array()),
      ],
      limits.maxOutputBytes,
    );
  }

  /**
   * Rewrite indexed pixels, dimensions, or same-slot palette entries without an RGBA round trip.
   * No-op edits return an exact owned copy. Palette-only changes keep the original
   * IDAT bytes, including Adam7. Pixel edits use new non-interlaced packed rows.
   * Safe-to-copy ancillary chunks survive edits. Unsafe chunks require explicit
   * retention after caller-supplied, format-specific validation.
   * @param source Original PNG file bytes, rather than a mutable decoded model.
   * @param edit Palette edits and optional complete pixel/canvas replacements.
   * @param options Decoder/encoder limits and optional application validation.
   * @returns Owned PNG bytes preserving palette slot identities.
   * @throws {Error} Palette slot count changes or resizing omits replacement pixels.
   * @static
   */
  static rewriteIndexed(
    source: PngInput,
    edit: IndexedPngEdit = {},
    options: RewriteOptions = {},
  ): Uint8Array {
    // A fresh decode keeps edit comparison independent of publicly mutable pixels.
    const image = new ImagePNG(source, options);
    if (image.colorType !== 3) {
      throw new Error("PNG editing requires indexed pixels.");
    }
    const original = image.toIndexed({ copy: false });
    const palette = edit.palette ?? original.palette;
    const width = edit.dimensions?.width ?? original.width;
    const height = edit.dimensions?.height ?? original.height;
    const resized = width !== original.width || height !== original.height;
    if (resized && edit.indexes === undefined) {
      throw new Error("Resizing requires replacement indexed pixels.");
    }
    if (palette.length !== original.palette.length) {
      throw new Error("Palette edit must preserve slot count.");
    }
    const indexes = edit.indexes ?? original.indexes;
    const next: IndexedInput = { width, height, palette, indexes };
    validateIndexed(next, image.bitDepth, image._limits.maxPixels);
    if (options.validateIndexed !== undefined) {
      if (typeof options.validateIndexed !== "function") {
        throw new TypeError("validateIndexed must be a function.");
      }
      // This is a synchronous validation policy, not an editing callback.
      // It must not mutate the supplied indexes or any replacement palette.
      options.validateIndexed({ width, height, indexes });
    }
    const retained = new Set(edit.preserveChunks ?? []);
    for (const type of retained) {
      if (
        typeof type !== "string" ||
        !/^[a-z][A-Za-z][A-Z][A-Za-z]$/.test(type) ||
        ANIMATION_CHUNKS.has(type)
      ) {
        throw new Error(`Invalid preserved ancillary chunk '${type}'.`);
      }
    }
    let pixelsChanged = resized;
    if (!pixelsChanged) {
      for (let i = 0; i < indexes.length; i++) {
        if (indexes[i] !== original.indexes[i]) {
          pixelsChanged = true;
          break;
        }
      }
    }
    let paletteChanged = false;
    for (let i = 0; i < palette.length; i++) {
      const color = palette[i];
      const previous = original.palette[i];
      if (
        color[0] !== previous[0] ||
        color[1] !== previous[1] ||
        color[2] !== previous[2] ||
        color[3] !== previous[3]
      ) {
        paletteChanged = true;
        break;
      }
    }
    if (!pixelsChanged && !paletteChanged) {
      if (image.data.length > image._limits.maxOutputBytes) {
        throw new RangeError("PNG exceeds the output byte limit.");
      }
      return Uint8Array.from(image.data);
    }
    if (image.animated) {
      throw new Error("Cannot rewrite an animated PNG through the static indexed editor.");
    }
    let compressed: Uint8Array | undefined;
    if (pixelsChanged) {
      compressed = ImagePNG._encodeIndexedData(
        next,
        original.sourceBitDepth,
        options,
        image._limits,
      );
    }
    const parts: Uint8Array[] = [PNG_SIGNATURE];
    let wrotePixels = false;
    for (const chunk of image.chunks) {
      const { type } = chunk;
      if (type === "IHDR" && pixelsChanged) {
        parts.push(makeChunk(type, makeHeader(width, height, image.bitDepth, 3)));
      } else if (type === "PLTE" && paletteChanged) {
        parts.push(...makePaletteChunks(palette));
      } else if (type === "tRNS" && paletteChanged) {
        // The replacement is adjacent to PLTE, even when the source lacked tRNS.
        continue;
      } else if (type === "IDAT" && compressed !== undefined) {
        if (!wrotePixels) {
          parts.push(makeChunk(type, compressed));
          wrotePixels = true;
        }
      } else if (
        type === "IHDR" ||
        type === "PLTE" ||
        type === "tRNS" ||
        type === "IDAT" ||
        type === "IEND" ||
        chunk.safeToCopy ||
        retained.has(type)
      ) {
        parts.push(chunk.raw);
      }
    }
    return joinChunks(parts, image._limits.maxOutputBytes);
  }

  /**
   * Rewrite an indexed PNG using rewriteIndexed().
   * @param source Original indexed PNG bytes.
   * @param edit Palette edits and optional complete pixel/canvas replacements.
   * @param options Decoder/encoder limits and optional application validation.
   * @returns Owned PNG bytes preserving palette slot identities.
   * @static
   */
  static rewriteIndexedPng(
    source: PngInput,
    edit: IndexedPngEdit = {},
    options: RewriteOptions = {},
  ): Uint8Array {
    return ImagePNG.rewriteIndexed(source, edit, options);
  }

  /**
   * Pack validated indexes into scanlines and compress them for IDAT.
   * @param image A validated indexed surface.
   * @param bitDepth Number of bits per index.
   * @param options Filtering and compression options.
   * @param limits Resolved allocation limits.
   * @returns A complete zlib stream.
   */
  private static _encodeIndexedData(
    image: IndexedInput,
    bitDepth: IndexedDepth,
    options: EncodeOptions,
    limits: PngLimits,
  ): Uint8Array {
    const rowBytes = Math.ceil((image.width * bitDepth) / 8);
    return ImagePNG._encodeRows(
      image.height,
      rowBytes,
      1,
      (row, y): void => {
        const source = y * image.width;
        if (bitDepth === 8) {
          row.set(image.indexes.subarray(source, source + image.width));
          return;
        }
        // Zero-initialized rows leave unused low bits in the last byte unset.
        for (let x = 0, bit = 0; x < image.width; x++, bit += bitDepth) {
          row[bit >>> 3] |= image.indexes[source + x] << (8 - bitDepth - (bit & 7));
        }
      },
      options,
      limits,
    );
  }

  /**
   * Filter and compress rows for indexed and RGBA8 output.
   * None is the deterministic, low-CPU default. Adaptive filtering tries all five
   * predictors and selects the lowest signed-byte residual score for each row.
   * @param height Number of scanlines.
   * @param rowBytes Packed byte count per row, excluding its filter byte.
   * @param bpp Byte distance to the previous pixel for filtering.
   * @param fillRow Callback writing one unfiltered row into zero-initialized storage.
   * @param options Filtering and compression options.
   * @param limits Resolved allocation limits.
   * @returns A complete zlib stream.
   */
  private static _encodeRows(
    height: number,
    rowBytes: number,
    bpp: number,
    fillRow: (row: Uint8Array, y: number) => void,
    options: EncodeOptions,
    limits: PngLimits,
  ): Uint8Array {
    const length = height * (rowBytes + 1);
    if (!Number.isSafeInteger(length) || length > limits.maxInflatedBytes) {
      throw new RangeError("PNG exceeds the scanline byte limit.");
    }
    const filter = options.filter ?? "none";
    if (filter !== "none" && filter !== "sub" && filter !== "adaptive") {
      throw new Error("Filter must be none, sub, or adaptive.");
    }
    const level = (options.level ?? 6) as CompressionLevel;
    if (!Number.isSafeInteger(level) || level < 0 || level > 9) {
      throw new RangeError("Compression level must be an integer in [0, 9].");
    }
    const rows = new Uint8Array(length);
    if (filter === "none") {
      for (let y = 0; y < height; y++) {
        const offset = y * (rowBytes + 1);
        fillRow(rows.subarray(offset + 1, offset + rowBytes + 1), y);
      }
    } else {
      let current = new Uint8Array(rowBytes);
      let previous = new Uint8Array(rowBytes);
      const candidate = new Uint8Array(rowBytes);
      let firstFilter = 0;
      let lastFilter = 4;
      if (filter === "sub") {
        firstFilter = 1;
        lastFilter = 1;
      }
      for (let y = 0; y < height; y++) {
        current.fill(0);
        fillRow(current, y);
        const offset = y * (rowBytes + 1);
        let bestScore = Infinity;
        for (let type = firstFilter; type <= lastFilter; type++) {
          let score = 0;
          for (let i = 0; i < rowBytes; i++) {
            let left = 0;
            let upperLeft = 0;
            if (i >= bpp) {
              left = current[i - bpp];
              upperLeft = previous[i - bpp];
            }
            const above = previous[i];
            let predictor = 0;
            switch (type) {
              case 1:
                predictor = left;
                break;
              case 2:
                predictor = above;
                break;
              case 3:
                predictor = (left + above) >>> 1;
                break;
              case 4:
                predictor = paethPredictor(left, above, upperLeft);
                break;
              default:
                break;
            }
            const byte = (current[i] - predictor) & 255;
            candidate[i] = byte;
            // Residuals are signed values modulo 256. Ties retain the earlier filter.
            if (byte < 128) {
              score += byte;
            } else {
              score += 256 - byte;
            }
          }
          if (score < bestScore) {
            bestScore = score;
            rows[offset] = type;
            rows.set(candidate, offset + 1);
          }
        }
        const temporary = previous;
        previous = current;
        current = temporary;
      }
    }
    return deflate(rows, { level });
  }

  /**
   * No filtering, direct copy.
   * @param pixels Pixels to update.
   * @param scanline Scanline to search for pixels in.
   * @param bpp Bytes Per Pixel
   * @param offset Offset
   * @param length Length
   * @returns Pixels
   */
  static unFilterNone<T extends number[] | Uint8Array>(
    pixels: T,
    scanline: number[] | Uint8Array,
    bpp: number,
    offset: number,
    length: number,
  ): T {
    return unfilterScanline(0, pixels, scanline, bpp, offset, length);
  }

  /**
   * The Sub() filter transmits the difference between each byte and the value of the corresponding byte of the prior pixel.
   * Sub(x) = Raw(x) + Raw(x - bpp)
   * @param pixels Pixels to update.
   * @param scanline Scanline to search for pixels in.
   * @param bpp Bytes Per Pixel
   * @param offset Offset
   * @param length Length
   * @returns Pixels
   */
  static unFilterSub<T extends number[] | Uint8Array>(
    pixels: T,
    scanline: number[] | Uint8Array,
    bpp: number,
    offset: number,
    length: number,
  ): T {
    return unfilterScanline(1, pixels, scanline, bpp, offset, length);
  }

  /**
   * The Up() filter is just like the Sub() filter except that the pixel immediately above the current pixel, rather than just to its left, is used as the predictor.
   * Up(x) = Raw(x) + Prior(x)
   * @param pixels Pixels to update.
   * @param scanline - Scanline to search for pixels in.
   * @param bpp Bytes Per Pixel
   * @param offset Offset
   * @param length Length
   * @returns Pixels
   */
  static unFilterUp<T extends number[] | Uint8Array>(
    pixels: T,
    scanline: number[] | Uint8Array,
    bpp: number,
    offset: number,
    length: number,
  ): T {
    return unfilterScanline(2, pixels, scanline, bpp, offset, length);
  }

  /**
   * The Average() filter uses the average of the two neighboring pixels (left and above) to predict the value of a pixel.
   * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
   * @param pixels Pixels to update.
   * @param scanline Scanline to search for pixels in.
   * @param bpp Bytes Per Pixel
   * @param offset Offset
   * @param length Length
   * @returns Pixels
   */
  static unFilterAverage<T extends number[] | Uint8Array>(
    pixels: T,
    scanline: number[] | Uint8Array,
    bpp: number,
    offset: number,
    length: number,
  ): T {
    return unfilterScanline(3, pixels, scanline, bpp, offset, length);
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
   * @param pixels Pixels to update.
   * @param scanline Scanline to search for pixels in.
   * @param bpp Bytes Per Pixel
   * @param offset Offset
   * @param length Length
   * @returns Pixels
   */
  static unFilterPaeth<T extends number[] | Uint8Array>(
    pixels: T,
    scanline: number[] | Uint8Array,
    bpp: number,
    offset: number,
    length: number,
  ): T {
    return unfilterScanline(4, pixels, scanline, bpp, offset, length);
  }
}

export default ImagePNG;
