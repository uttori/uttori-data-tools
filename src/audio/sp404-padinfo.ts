import DataBuffer from "../data-buffer.js";

// https://static.roland.com/manuals/sp-404mk2_reference/eng/17805468.html

/** Optional diagnostics; importing the parser does not load the debug package by default. */
let debug = (..._args: unknown[]): void => {};
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import("debug");
    debug = d("Uttori.SP404PadInfo");
  } catch {}
}

/** A decoded 32-byte SP-404/SX/A pad record. Invalid flag bytes remain numeric for inspection. */
export interface SP404Pad {
  /** If the pad is available because its sample offsets match the empty defaults. Legacy spelling retained for compatibility. */
  avaliable: boolean;
  /** The human readable pad text, `A1` - `J12`. */
  label: string;
  /** The filename for the corresponding Wave File, `A0000001.WAV` - `J0000012.WAV`. */
  filename: string;
  /** Sample start and end offsets are byte offsets relative to the original file. */
  originalSampleStart: number;
  /** Original end byte offset. SP-404SX Wave Converter v1.01 on macOS sets the start values to 512, the start of data. */
  originalSampleEnd: number;
  /** User-selected start byte offset. The length of the RIFF headers before the data chunk is always exactly 512 bytes. */
  userSampleStart: number;
  /** User-selected end byte offset. The sample end value is the length of the file, and when converted correctly this is the length of the whole file. */
  userSampleEnd: number;
  /** Volume is between 0 and 127 */
  volume: number;
  /** LoFi: false off, true on */
  lofi: boolean | number;
  /** Loop: false off, true on */
  loop: boolean | number;
  /** Gate: false off, true on */
  gate: boolean | number;
  /** Reverse: false off, true on */
  reverse: boolean | number;
  /** Format is 0 for an 'AIFF' sample, and 1 for a 'WAVE' sample */
  format: string;
  /** Mono or Stereo */
  channels: string;
  /** Tempo Mode: 0 = 'Off', 1 = 'Pattern', 2 = 'User' */
  tempoMode: string;
  /** BPM determined by the software. Tempo is BPM (beats per minute) mutiplied by 10, 0x4B0 = 1200 = 120 bpm */
  originalTempo: number;
  /** User set BPM on the device */
  userTempo: number;
}

/** Omitted fields use empty-pad defaults. Channel and tempo modes also accept their device codes. */
export type SP404PadInput = Partial<Omit<SP404Pad, "channels" | "tempoMode">> & {
  channels?: string | number;
  tempoMode?: string | number;
};

/** Decode known boolean codes while retaining unexpected bytes for damaged-file diagnostics. */
function readFlag(buffer: DataBuffer): boolean | number {
  const value = buffer.readUInt8();
  if (value === 0) {
    return false;
  }
  if (value === 1) {
    return true;
  }
  return value;
}

/** Reject truncation, coercion and wrapping before writing an unsigned device field. */
function unsignedInteger(value: number, maximum: number, name: string): number {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new RangeError(`${name} must be an integer between 0 and ${maximum}.`);
  }
  return value;
}

/** Encode boolean flags without silently interpreting damaged numeric flags as true. */
function encodeFlag(value: boolean | number, name: string): number {
  if (value === true || value === 1) {
    return 1;
  }
  if (value === false || value === 0) {
    return 0;
  }
  throw new RangeError(`${name} must be a boolean or 0 or 1.`);
}

/** Convert BPM to the unsigned fixed-point field, rejecting non-finite values and overflow. */
function encodeTempo(value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError("Tempo must be a finite nonnegative BPM value.");
  }
  return unsignedInteger(Math.round(value * 10), 0xffffffff, "Tempo in tenths of BPM");
}

/**
 * Uttori Pad Info - Utility to manipulate the PAD_INFO.BIN file for SP-404 series of samplers.
 * @property {SP404Pad[]} pads - Parsed Pads
 * @example <caption>SP404PadInfo</caption>
 * import fs from 'fs';
 * const data = fs.readFileSync('./PAD_INFO.bin');
 * const { pads } = new SP404PadInfo(data);
 * fs.writeFileSync('./output.json', JSON.stringify(pads, null, 2));
 * console.log('Pads:', pads);
 * ➜ [
 *     {
 *       "avaliable": false,
 *       "label": "A1",
 *       "filename": "A0000001.WAV",
 *       "originalSampleStart": 512,
 *       "originalSampleEnd": 385388,
 *       "userSampleStart": 512,
 *       "userSampleEnd": 385388,
 *       "volume": 87,
 *       "lofi": false,
 *       "loop": false,
 *       "gate": false,
 *       "reverse": true,
 *       "format": "WAVE",
 *       "channels": "Stereo",
 *       "tempoMode": "Off",
 *       "originalTempo": 109.9,
 *       "userTempo": 109.9
 *     },
 *     ...,
 *   {
 *       "avaliable": false,
 *       "label": "J12",
 *       "filename": "J0000012.WAV",
 *       "originalSampleStart": 512,
 *       "originalSampleEnd": 53424,
 *       "userSampleStart": 512,
 *       "userSampleEnd": 53424,
 *       "volume": 127,
 *       "lofi": false,
 *       "loop": false,
 *       "gate": true,
 *       "reverse": false,
 *       "format": "WAVE",
 *       "channels": "Stereo",
 *       "tempoMode": "Off",
 *       "originalTempo": 100,
 *       "userTempo": 100
 *     }
 *   ]
 * @class
 */
class SP404PadInfo extends DataBuffer {
  /** Parsed Pads in bank order; short files may contain fewer than 120 complete records. */
  pads: SP404Pad[] = [];

  /**
   * Creates and parses a PAD_INFO.BIN file from binary data.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} data The PAD_INFO.BIN data to parse.
   * @returns {SP404PadInfo} The parsed PAD_INFO helper.
   * @static
   */
  static fromFile(data?: ConstructorParameters<typeof DataBuffer>[0]): SP404PadInfo {
    return new SP404PadInfo(data);
  }

  /**
   * Creates an instance of SP404PadInfo.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} [input] The data to process.
   * Omitted input creates an empty instance. Partial records and more than 120 pads are rejected.
   * @class
   */
  constructor(input?: ConstructorParameters<typeof DataBuffer>[0]) {
    super(input);
    this.parse();
  }

  /**
   * Parse the PAD_INFO.BIN file, decoding the supported pad info.
   *
   * This is stored alongside the samples in PAD_INFO.BIN and contains 120 × 32-byte records, one for each pad from A1 to J12.
   * In this file, values are stored in big-endian order.
   * Reparse from byte zero; invalid record layouts throw before replacing pads.
   */
  parse(): void {
    // Check the layout first so a truncated record cannot leave partially replaced parser state.
    if (this.length % 32 !== 0 || this.length > 120 * 32) {
      throw new RangeError("PAD_INFO.BIN must contain at most 120 complete 32-byte records.");
    }
    this.reset();
    this.pads = [];
    while (this.remainingBytes() > 0) {
      const label = SP404PadInfo.getPadLabel(this.pads.length);
      // Sample start and end offsets are relative to the original file.
      // SP-404SX Wave Converter v1.01 on macOS sets the start values to 512, the start of data.
      // The length of the RIFF headers before the data chunk is always exactly 512 bytes.
      // The sample end value is the length of the file, and when converted correctly this is the length of the whole file.
      const originalSampleStart = this.readUInt32();
      const originalSampleEnd = this.readUInt32();
      const userSampleStart = this.readUInt32();
      const userSampleEnd = this.readUInt32();
      const volume = this.readUInt8();
      const lofi = readFlag(this);
      const loop = readFlag(this);
      const gate = readFlag(this);
      const reverse = readFlag(this);
      // Format is 0 for an AIFF sample, and 1 for a WAVE sample.
      // This may simply correspond to the endianness of the data (0 = big endian, 1 = little endian).
      const formatByte = this.readUInt8();
      const channelsByte = this.readUInt8();
      const tempoModeByte = this.readUInt8();
      const formats: Record<number, string> = { 0: "AIFF", 1: "WAVE" };
      const channels: Record<number, string> = { 1: "Mono", 2: "Stereo" };
      const tempoModes: Record<number, string> = { 0: "Off", 1: "Pattern", 2: "User" };
      // Tempo is BPM (beats per minute) multiplied by 10, 0x4B0 = 1200 = 120 bpm.
      // SP-404SX Wave Converter v1.01 on macOS computes the original tempo as 120 / sample length.
      const pad: SP404Pad = {
        avaliable: false,
        label,
        filename: `${label[0]}${label.slice(1).padStart(7, "0")}.WAV`,
        originalSampleStart,
        originalSampleEnd,
        userSampleStart,
        userSampleEnd,
        volume,
        lofi,
        loop,
        gate,
        reverse,
        format: formats[formatByte] ?? `Invalid (${formatByte})`,
        channels: channels[channelsByte] ?? `Invalid (${channelsByte})`,
        tempoMode: tempoModes[tempoModeByte] ?? "Invalid",
        originalTempo: this.readUInt32() / 10,
        userTempo: this.readUInt32() / 10,
      };
      // Check to see if this is the default values, meaning the pad is not taken.
      pad.avaliable = SP404PadInfo.checkDefault(pad);
      debug("Pad:", pad);
      this.pads.push(pad);
    }
  }

  /**
   * Encode JSON values to a valid pad structure.
   * @param {SP404PadInput} [data] - The JSON values to encode.
   * @returns {Buffer} - The new pad Buffer.
   * Defaults match the OEM converter; invalid fields throw before return.
   * @static
   */
  static encodePad(data: SP404PadInput = {}): Buffer {
    const {
      originalSampleStart = 512,
      originalSampleEnd = 512,
      userSampleStart = 512,
      userSampleEnd = 512,
      volume = 127,
      lofi = false,
      loop = false,
      gate = true,
      reverse = false,
      format = "WAVE",
      channels = 2,
      tempoMode = "Off",
      originalTempo = 120,
      userTempo = 120,
    } = data;
    if (!Number.isInteger(volume) || volume < 0 || volume > 127) {
      throw new RangeError(`Volume is invalid, ${volume} should be an integer between 0 and 127.`);
    }
    if (!["Mono", "Stereo", 1, 2].includes(channels)) {
      throw new RangeError(
        `Channels is invalid, ${channels} should be an integer between 1 and 2.`,
      );
    }
    if (format !== "WAVE" && format !== "AIFF") {
      throw new RangeError("Format must be WAVE or AIFF.");
    }
    let tempoModeByte: number;
    // Tempo Mode: 0 = 'Off', 1 = 'Pattern', 2 = 'User'.
    if (tempoMode === 0 || tempoMode === "Off") {
      tempoModeByte = 0;
    } else if (tempoMode === 1 || tempoMode === "Pattern") {
      tempoModeByte = 1;
    } else if (tempoMode === 2 || tempoMode === "User") {
      tempoModeByte = 2;
    } else {
      throw new RangeError(
        `Tempo Mode is invalid, ${tempoMode} should be one of 'Off', 'Pattern', or 'User'.`,
      );
    }
    const pad = Buffer.alloc(32);
    pad.writeUInt32BE(unsignedInteger(originalSampleStart, 0xffffffff, "Original sample start"), 0);
    pad.writeUInt32BE(unsignedInteger(originalSampleEnd, 0xffffffff, "Original sample end"), 4);
    pad.writeUInt32BE(unsignedInteger(userSampleStart, 0xffffffff, "User sample start"), 8);
    pad.writeUInt32BE(unsignedInteger(userSampleEnd, 0xffffffff, "User sample end"), 12);
    pad[16] = volume;
    pad[17] = encodeFlag(lofi, "LoFi");
    pad[18] = encodeFlag(loop, "Loop");
    pad[19] = encodeFlag(gate, "Gate");
    pad[20] = encodeFlag(reverse, "Reverse");
    pad[21] = format === "WAVE" ? 1 : 0;
    pad[22] = channels === 1 || channels === "Mono" ? 1 : 2;
    pad[23] = tempoModeByte;
    // Tempo is BPM (beats per minute) multiplied by 10, 0x4B0 = 1200 = 120 bpm.
    // SP-404SX Wave Converter v1.01 on macOS computes the original tempo as 120 / sample length.
    pad.writeUInt32BE(encodeTempo(originalTempo), 24);
    pad.writeUInt32BE(encodeTempo(userTempo), 28);
    return pad;
  }

  /**
   * Checks to see if a Pad is set to the default values, if so it is likely unused.
   * @param {SP404PadInput} [pad] - The JSON values to check.
   * @param {boolean} [strict] - When strict all values are checked for defaults, otherwise just the offsets are checked.
   * @returns {boolean} - Returns true if the Pad is set the the default values, false otherwise.
   * @static
   */
  static checkDefault(pad?: SP404PadInput, strict = false): boolean {
    if (
      !pad ||
      pad.originalSampleStart !== 512 ||
      pad.originalSampleEnd !== 512 ||
      pad.userSampleStart !== 512 ||
      pad.userSampleEnd !== 512
    ) {
      return false;
    }
    if (!strict) {
      return true;
    }
    // Parsed records use the label while callers may supply the numeric channel code.
    return (
      pad.volume === 127 &&
      pad.lofi === false &&
      pad.loop === false &&
      pad.gate === true &&
      pad.reverse === false &&
      pad.format === "WAVE" &&
      (pad.channels === 2 || pad.channels === "Stereo") &&
      pad.tempoMode === "Off" &&
      pad.originalTempo === 120 &&
      pad.userTempo === 120
    );
  }

  /**
   * Convert a numberic value used in the PAD_INFO.bin file for that pad to the pad label like `A1` or `J12`.
   * @param {number} index The numberic value used in the PAD_INFO.bin file.
   * @returns {string} The pad label like `A1` or `J12`, or an empty string for an invalid index.
   * @static
   */
  static getPadLabel(index?: number): string {
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= 120) {
      return "";
    }
    return `${String.fromCharCode(65 + Math.floor(index / 12))}${(index % 12) + 1}`;
  }

  /**
   * Convert a pad label like `A1` or `J12` to the numberic value used in the PAD_INFO.bin file for that pad.
   * @param {string} label The pad label like `A1` or `J12`.
   * @returns {number} The numeric value used in the PAD_INFO.bin file, or -1 for an invalid label.
   * @static
   */
  static getPadIndex(label = ""): number {
    if (typeof label !== "string" || !/^[a-j](?:[1-9]|1[0-2])$/i.test(label)) {
      return -1;
    }
    return (label.toUpperCase().charCodeAt(0) - 65) * 12 + Number(label.slice(1)) - 1;
  }
}

export default SP404PadInfo;
