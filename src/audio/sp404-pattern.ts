import DataBuffer from "../data-buffer.js";
import AudioMIDI, { type MidiTrackEvent, type NoteData, type Track } from "./audio-midi.js";

/** Optional diagnostics, disabled by default so unrelated imports can discard this module. */
let debug = (..._args: unknown[]): void => {};
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import("debug");
    debug = d("Uttori.SP404Pattern");
  } catch {}
}

/** One eight-byte pattern event. A raw note value of 128 is a timing placeholder. */
export interface SP404Note {
  /** Device delay (0–255 ticks): after this event on SX/OG, before this event on MKII. */
  ticks: number;
  /** The MIDI note value used as a device pad code (47-126); 128 is a timing placeholder. */
  midiNote: number;
  /** The device bank group code; OG and MKii use different conventions. */
  bankSwitch: number;
  /** The pitch mode of Step Sequencer notes. */
  pitchMode: number;
  /** The velocity of the note (0-127). */
  velocity: number;
  /** An unknown value, commonly 64 / 0x40. */
  unknown3: number;
  /** Note duration in native ticks; SX stores it big-endian, MKII little-endian. */
  length: number;
  /** The calculated sample number based on MIDI note and bank switch. Zero for placeholders and unknown pad codes. */
  sampleNumber: number;
  /** The label of the pad, constructed from the sample number and bank. Empty for placeholders and unknown pad codes. */
  padLabel: string;
}

/** A device's pad label and its two-byte pattern address. */
export interface SP404PadMapping {
  /** The MIDI note numeric value used as the device pad address. */
  midiNote: number;
  /** The human friendly pad label. */
  pad: string;
  /** The value for the bank switch byte. */
  bankSwitch: number;
}

/** Select the device layout. Only the documented eight-byte event layout is supported. */
export interface SP404PatternOptions {
  bytesPerNote?: number;
  /** Defaults to 12 for OG, 16 for MKII; a different layout is rejected. */
  padsPerBank?: number;
  /** SX/original-family twelve-pad pattern format and 96 PPQ when true; MKII and 480 PPQ otherwise. */
  og?: boolean;
}

/** Destination MIDI settings. Map pad labels to MIDI notes 0-127; unmapped pads are skipped. */
export interface SP404ToMidiOptions {
  /** Optional tempo in BPM. */
  bpm?: number;
  /** Destination ticks per quarter note; defaults to the device's native PPQ. */
  ppq?: number;
  fileName?: string;
  noteMap: Record<string, number>;
}

/** Validate before quantization or byte writes can hide invalid numeric input. */
function integer(value: number, minimum: number, maximum: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

/** Select a fresh device map without import-time allocations or shared mutable defaults. */
function padMap(og: boolean): Record<string, SP404PadMapping> {
  return og ? SP404Pattern.defaultMapOG : SP404Pattern.defaultMap;
}

/** Narrow the MIDI event's union payload without relying on labels or legacy string note values. */
function isNoteData(data: MidiTrackEvent["data"]): data is NoteData {
  return typeof data === "object" && data !== null && "note" in data && "velocity" in data;
}

/** Internal absolute-time note used when merging MIDI tracks and rescaling PPQ. */
interface TimedNote {
  /** Absolute start in source MIDI ticks, before conversion to device PPQ. */
  time: number;
  note: number;
  velocity: number;
  /** Source MIDI duration, or undefined until a matching Note Off supplies it. */
  length?: number;
}

/**
 * SP404Pattern - Roland SP-404SX / SP-404 MKii Pattern Utility
 * A utility to read, modify and write pattern files from a Roland SP-404SX / SP-404 MKii `PTN` files.
 * Can also convert patterns to MIDI or convert from MIDI to pattern.
 * Several values are not saved into the pattern but are configured when recording a pattern:
 * - BPM
 * - Quantization Strength / Shuffle Rate
 * - Quantization Grid Size
 * - Metronome Volume
 *
 * Substep on Sequencer Mode actually generates multiple notes depending on the substep type offset by a set number of ticks, no other designation is set on the note.
 *
 * Notes in the pattern grid will typically line up, but if the last note or a note near the end plays a sample beyond the length of the bar, there needs to be place holder notes for however long that is.
 * @example <caption>SP404Pattern</caption>
 * const data = fs.readFileSync('./PTN00025.BIN');
 * const file = new SP404Pattern(data);
 * console.log('Notes:', file.notes);
 * @class
 * @augments DataBuffer
 */
class SP404Pattern extends DataBuffer {
  /** Footer bar count (normally 1–64), an empty instance starts at zero. */
  bars = 0;
  /** The time signature of the pattern: 0 = 4/4, 1 = 3/4, 2 = 2/4, 3 = 1/4, 4 = 5/4, 5 = 6/4, 7 = 7/4. Unknown codes are retained. */
  timeSignature = 0;
  /** Includes timing placeholders so silent gaps can survive conversion. */
  notes: SP404Note[] = [];
  /** Address map for the selected device, owned by this instance. */
  defaultMap: Record<string, SP404PadMapping>;
  /** Validated layout reused by subsequent parse() calls. */
  options: Required<SP404PatternOptions>;

  /**
   * Creates a new SP404Pattern.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} [input] The data to process.
   * @param {object} options The options for parsing the pattern.
   * @param {number} [options.bytesPerNote] The number of bytes for each note; default is 8.
   * @param {number} [options.padsPerBank] The number of pads per bank, 12 or 16 for the MKii; default is 12 for OG and 16 for MKii.
   * @param {boolean} [options.og] When true, process for the original SP404s, when false for the MKii; default is false.
   * Omitted input creates an empty instance. Partial records or footers are rejected.
   * @class
   */
  constructor(
    input?: ConstructorParameters<typeof DataBuffer>[0],
    options: SP404PatternOptions = {},
  ) {
    super(input);
    this.options = this.validateOptions(options);
    this.defaultMap = padMap(this.options.og);
    this.parse();
  }

  /** Original device ticks per quarter note. */
  static get defaultPPQOG(): number {
    return 96;
  }
  /** MKII ticks per quarter note. */
  static get defaultPPQ(): number {
    return 480;
  }
  /**
   * The default mapping of pads `A1` to `J16` to MIDI notes.
   * Returns a fresh map owned by the caller.
   * @returns {Record<string, SP404PadMapping>} The default mapping of pads `A1` to `J16` to MIDI notes.
   */
  static get defaultMap(): Record<string, SP404PadMapping> {
    return {
      // Bank A
      A1: { midiNote: 47, pad: "A1", bankSwitch: 64 },
      A2: { midiNote: 48, pad: "A2", bankSwitch: 64 },
      A3: { midiNote: 49, pad: "A3", bankSwitch: 64 },
      A4: { midiNote: 50, pad: "A4", bankSwitch: 64 },
      A5: { midiNote: 51, pad: "A5", bankSwitch: 64 },
      A6: { midiNote: 52, pad: "A6", bankSwitch: 64 },
      A7: { midiNote: 53, pad: "A7", bankSwitch: 64 },
      A8: { midiNote: 54, pad: "A8", bankSwitch: 64 },
      A9: { midiNote: 55, pad: "A9", bankSwitch: 64 },
      A10: { midiNote: 56, pad: "A10", bankSwitch: 64 },
      A11: { midiNote: 57, pad: "A11", bankSwitch: 64 },
      A12: { midiNote: 58, pad: "A12", bankSwitch: 64 },
      A13: { midiNote: 59, pad: "A13", bankSwitch: 64 },
      A14: { midiNote: 60, pad: "A14", bankSwitch: 64 },
      A15: { midiNote: 61, pad: "A15", bankSwitch: 64 },
      A16: { midiNote: 62, pad: "A16", bankSwitch: 64 },

      // Bank B
      B1: { midiNote: 63, pad: "B1", bankSwitch: 64 },
      B2: { midiNote: 64, pad: "B2", bankSwitch: 64 },
      B3: { midiNote: 65, pad: "B3", bankSwitch: 64 },
      B4: { midiNote: 66, pad: "B4", bankSwitch: 64 },
      B5: { midiNote: 67, pad: "B5", bankSwitch: 64 },
      B6: { midiNote: 68, pad: "B6", bankSwitch: 64 },
      B7: { midiNote: 69, pad: "B7", bankSwitch: 64 },
      B8: { midiNote: 70, pad: "B8", bankSwitch: 64 },
      B9: { midiNote: 71, pad: "B9", bankSwitch: 64 },
      B10: { midiNote: 72, pad: "B10", bankSwitch: 64 },
      B11: { midiNote: 73, pad: "B11", bankSwitch: 64 },
      B12: { midiNote: 74, pad: "B12", bankSwitch: 64 },
      B13: { midiNote: 75, pad: "B13", bankSwitch: 64 },
      B14: { midiNote: 76, pad: "B14", bankSwitch: 64 },
      B15: { midiNote: 77, pad: "B15", bankSwitch: 64 },
      B16: { midiNote: 78, pad: "B16", bankSwitch: 64 },

      // Bank C
      C1: { midiNote: 79, pad: "C1", bankSwitch: 64 },
      C2: { midiNote: 80, pad: "C2", bankSwitch: 64 },
      C3: { midiNote: 81, pad: "C3", bankSwitch: 64 },
      C4: { midiNote: 82, pad: "C4", bankSwitch: 64 },
      C5: { midiNote: 83, pad: "C5", bankSwitch: 64 },
      C6: { midiNote: 84, pad: "C6", bankSwitch: 64 },
      C7: { midiNote: 85, pad: "C7", bankSwitch: 64 },
      C8: { midiNote: 86, pad: "C8", bankSwitch: 64 },
      C9: { midiNote: 87, pad: "C9", bankSwitch: 64 },
      C10: { midiNote: 88, pad: "C10", bankSwitch: 64 },
      C11: { midiNote: 89, pad: "C11", bankSwitch: 64 },
      C12: { midiNote: 90, pad: "C12", bankSwitch: 64 },
      C13: { midiNote: 91, pad: "C13", bankSwitch: 64 },
      C14: { midiNote: 92, pad: "C14", bankSwitch: 64 },
      C15: { midiNote: 93, pad: "C15", bankSwitch: 64 },
      C16: { midiNote: 94, pad: "C16", bankSwitch: 64 },

      // Bank D
      D1: { midiNote: 95, pad: "D1", bankSwitch: 64 },
      D2: { midiNote: 96, pad: "D2", bankSwitch: 64 },
      D3: { midiNote: 97, pad: "D3", bankSwitch: 64 },
      D4: { midiNote: 98, pad: "D4", bankSwitch: 64 },
      D5: { midiNote: 99, pad: "D5", bankSwitch: 64 },
      D6: { midiNote: 100, pad: "D6", bankSwitch: 64 },
      D7: { midiNote: 101, pad: "D7", bankSwitch: 64 },
      D8: { midiNote: 102, pad: "D8", bankSwitch: 64 },
      D9: { midiNote: 103, pad: "D9", bankSwitch: 64 },
      D10: { midiNote: 104, pad: "D10", bankSwitch: 64 },
      D11: { midiNote: 105, pad: "D11", bankSwitch: 64 },
      D12: { midiNote: 106, pad: "D12", bankSwitch: 64 },
      D13: { midiNote: 107, pad: "D13", bankSwitch: 64 },
      D14: { midiNote: 108, pad: "D14", bankSwitch: 64 },
      D15: { midiNote: 109, pad: "D15", bankSwitch: 64 },
      D16: { midiNote: 110, pad: "D16", bankSwitch: 64 },

      // Bank E
      E1: { midiNote: 111, pad: "E1", bankSwitch: 64 },
      E2: { midiNote: 112, pad: "E2", bankSwitch: 64 },
      E3: { midiNote: 113, pad: "E3", bankSwitch: 64 },
      E4: { midiNote: 114, pad: "E4", bankSwitch: 64 },
      E5: { midiNote: 115, pad: "E5", bankSwitch: 64 },
      E6: { midiNote: 116, pad: "E6", bankSwitch: 64 },
      E7: { midiNote: 117, pad: "E7", bankSwitch: 64 },
      E8: { midiNote: 118, pad: "E8", bankSwitch: 64 },
      E9: { midiNote: 119, pad: "E9", bankSwitch: 64 },
      E10: { midiNote: 120, pad: "E10", bankSwitch: 64 },
      E11: { midiNote: 121, pad: "E11", bankSwitch: 64 },
      E12: { midiNote: 122, pad: "E12", bankSwitch: 64 },
      E13: { midiNote: 123, pad: "E13", bankSwitch: 64 },
      E14: { midiNote: 124, pad: "E14", bankSwitch: 64 },
      E15: { midiNote: 125, pad: "E15", bankSwitch: 64 },
      E16: { midiNote: 126, pad: "E16", bankSwitch: 64 },

      // Bank F
      F1: { midiNote: 47, pad: "F1", bankSwitch: 65 },
      F2: { midiNote: 48, pad: "F2", bankSwitch: 65 },
      F3: { midiNote: 49, pad: "F3", bankSwitch: 65 },
      F4: { midiNote: 50, pad: "F4", bankSwitch: 65 },
      F5: { midiNote: 51, pad: "F5", bankSwitch: 65 },
      F6: { midiNote: 52, pad: "F6", bankSwitch: 65 },
      F7: { midiNote: 53, pad: "F7", bankSwitch: 65 },
      F8: { midiNote: 54, pad: "F8", bankSwitch: 65 },
      F9: { midiNote: 55, pad: "F9", bankSwitch: 65 },
      F10: { midiNote: 56, pad: "F10", bankSwitch: 65 },
      F11: { midiNote: 57, pad: "F11", bankSwitch: 65 },
      F12: { midiNote: 58, pad: "F12", bankSwitch: 65 },
      F13: { midiNote: 59, pad: "F13", bankSwitch: 65 },
      F14: { midiNote: 60, pad: "F14", bankSwitch: 65 },
      F15: { midiNote: 61, pad: "F15", bankSwitch: 65 },
      F16: { midiNote: 62, pad: "F16", bankSwitch: 65 },

      // Bank G
      G1: { midiNote: 63, pad: "G1", bankSwitch: 65 },
      G2: { midiNote: 64, pad: "G2", bankSwitch: 65 },
      G3: { midiNote: 65, pad: "G3", bankSwitch: 65 },
      G4: { midiNote: 66, pad: "G4", bankSwitch: 65 },
      G5: { midiNote: 67, pad: "G5", bankSwitch: 65 },
      G6: { midiNote: 68, pad: "G6", bankSwitch: 65 },
      G7: { midiNote: 69, pad: "G7", bankSwitch: 65 },
      G8: { midiNote: 70, pad: "G8", bankSwitch: 65 },
      G9: { midiNote: 71, pad: "G9", bankSwitch: 65 },
      G10: { midiNote: 72, pad: "G10", bankSwitch: 65 },
      G11: { midiNote: 73, pad: "G11", bankSwitch: 65 },
      G12: { midiNote: 74, pad: "G12", bankSwitch: 65 },
      G13: { midiNote: 75, pad: "G13", bankSwitch: 65 },
      G14: { midiNote: 76, pad: "G14", bankSwitch: 65 },
      G15: { midiNote: 77, pad: "G15", bankSwitch: 65 },
      G16: { midiNote: 78, pad: "G16", bankSwitch: 65 },

      // Bank H
      H1: { midiNote: 79, pad: "H1", bankSwitch: 65 },
      H2: { midiNote: 80, pad: "H2", bankSwitch: 65 },
      H3: { midiNote: 81, pad: "H3", bankSwitch: 65 },
      H4: { midiNote: 82, pad: "H4", bankSwitch: 65 },
      H5: { midiNote: 83, pad: "H5", bankSwitch: 65 },
      H6: { midiNote: 84, pad: "H6", bankSwitch: 65 },
      H7: { midiNote: 85, pad: "H7", bankSwitch: 65 },
      H8: { midiNote: 86, pad: "H8", bankSwitch: 65 },
      H9: { midiNote: 87, pad: "H9", bankSwitch: 65 },
      H10: { midiNote: 88, pad: "H10", bankSwitch: 65 },
      H11: { midiNote: 89, pad: "H11", bankSwitch: 65 },
      H12: { midiNote: 90, pad: "H12", bankSwitch: 65 },
      H13: { midiNote: 91, pad: "H13", bankSwitch: 65 },
      H14: { midiNote: 92, pad: "H14", bankSwitch: 65 },
      H15: { midiNote: 93, pad: "H15", bankSwitch: 65 },
      H16: { midiNote: 94, pad: "H16", bankSwitch: 65 },

      // Bank I
      I1: { midiNote: 95, pad: "I1", bankSwitch: 65 },
      I2: { midiNote: 96, pad: "I2", bankSwitch: 65 },
      I3: { midiNote: 97, pad: "I3", bankSwitch: 65 },
      I4: { midiNote: 98, pad: "I4", bankSwitch: 65 },
      I5: { midiNote: 99, pad: "I5", bankSwitch: 65 },
      I6: { midiNote: 100, pad: "I6", bankSwitch: 65 },
      I7: { midiNote: 101, pad: "I7", bankSwitch: 65 },
      I8: { midiNote: 102, pad: "I8", bankSwitch: 65 },
      I9: { midiNote: 103, pad: "I9", bankSwitch: 65 },
      I10: { midiNote: 104, pad: "I10", bankSwitch: 65 },
      I11: { midiNote: 105, pad: "I11", bankSwitch: 65 },
      I12: { midiNote: 106, pad: "I12", bankSwitch: 65 },
      I13: { midiNote: 107, pad: "I13", bankSwitch: 65 },
      I14: { midiNote: 108, pad: "I14", bankSwitch: 65 },
      I15: { midiNote: 109, pad: "I15", bankSwitch: 65 },
      I16: { midiNote: 110, pad: "I16", bankSwitch: 65 },

      // Bank J
      J1: { midiNote: 111, pad: "J1", bankSwitch: 65 },
      J2: { midiNote: 112, pad: "J2", bankSwitch: 65 },
      J3: { midiNote: 113, pad: "J3", bankSwitch: 65 },
      J4: { midiNote: 114, pad: "J4", bankSwitch: 65 },
      J5: { midiNote: 115, pad: "J5", bankSwitch: 65 },
      J6: { midiNote: 116, pad: "J6", bankSwitch: 65 },
      J7: { midiNote: 117, pad: "J7", bankSwitch: 65 },
      J8: { midiNote: 118, pad: "J8", bankSwitch: 65 },
      J9: { midiNote: 119, pad: "J9", bankSwitch: 65 },
      J10: { midiNote: 120, pad: "J10", bankSwitch: 65 },
      J11: { midiNote: 121, pad: "J11", bankSwitch: 65 },
      J12: { midiNote: 122, pad: "J12", bankSwitch: 65 },
      J13: { midiNote: 123, pad: "J13", bankSwitch: 65 },
      J14: { midiNote: 124, pad: "J14", bankSwitch: 65 },
      J15: { midiNote: 125, pad: "J15", bankSwitch: 65 },
      J16: { midiNote: 126, pad: "J16", bankSwitch: 65 },
    };
  }
  /**
   * Native SX twelve-pad addresses, shared by A–E and F–J with separate bank selectors.
   * These are pattern-file addresses, independent of the MIDI notes used to trigger the device.
   * Returns a fresh map owned by the caller.
   */
  static get defaultMapOG(): Record<string, SP404PadMapping> {
    const mappings: Record<string, SP404PadMapping> = {};
    for (let bank = 0; bank < 10; bank++) {
      for (let pad = 1; pad <= 12; pad++) {
        const label = `${String.fromCharCode(65 + bank)}${pad}`;
        mappings[label] = {
          midiNote: 47 + (bank % 5) * 12 + pad - 1,
          pad: label,
          bankSwitch: bank >= 5 ? 1 : 0,
        };
      }
    }
    return mappings;
  }

  /** Reject layouts that would desynchronize event reads from the fixed sixteen-byte footer. */
  private validateOptions(options: SP404PatternOptions): Required<SP404PatternOptions> {
    const og = options.og ?? false;
    const bytesPerNote = options.bytesPerNote ?? 8;
    const padsPerBank = options.padsPerBank ?? (og ? 12 : 16);
    if (typeof og !== "boolean" || bytesPerNote !== 8 || padsPerBank !== (og ? 12 : 16)) {
      throw new RangeError("Patterns require 8 bytes per note and 12 OG or 16 MKII pads per bank.");
    }
    return { og, bytesPerNote, padsPerBank };
  }

  /**
   * Parse the pattern into notes and extract the bar count from the footer.
   * Reparse from byte zero. Incomplete notes and footers throw before state changes.
   * @param {object} options The options for parsing the pattern.
   * @param {number} [options.bytesPerNote] The number of bytes for each note; default is 8.
   * @param {number} [options.padsPerBank] The number of pads per bank, 12 or 16 for the MKii; default is 12 for OG and 16 for MKii.
   * @param {boolean} [options.og] When true, process for the original SP404s, when false for the MKii; default is false.
   */
  parse(options: SP404PatternOptions = this.options): void {
    const validated = this.validateOptions(options);
    if (this.length !== 0 && (this.length < 16 || (this.length - 16) % 8 !== 0)) {
      throw new RangeError("A pattern must contain complete 8-byte notes and a 16-byte footer.");
    }
    this.options = validated;
    this.defaultMap = padMap(validated.og);
    this.reset();
    this.notes = [];
    this.bars = 0;
    this.timeSignature = 0;
    if (this.length === 0) {
      return;
    }

    // The native selector's bit 6 may vary without changing the selected bank in either family.
    const addresses = new Map<string, SP404PadMapping>();
    for (const mapping of Object.values(this.defaultMap)) {
      addresses.set(`${mapping.bankSwitch}:${mapping.midiNote}`, mapping);
      addresses.set(`${mapping.bankSwitch ^ 64}:${mapping.midiNote}`, mapping);
    }
    while (this.offset < this.length - 16) {
      const ticks = this.readUInt8();
      const midiNote = this.readUInt8();
      const bankSwitch = this.readUInt8();
      // Pitch Mode
      // When not step sequencer, value is 0.
      // When step sequence pattern:
      //   0 => Pitch Pad
      // 129 => -12 Pitch
      // 130 => -11 Pitch
      // 131 => -10 Pitch
      // 139 => -2 Pitch
      // 141 => +0 Pitch
      // 142 => +1 Pitch
      // 143 => +2 Pitch
      // 144 => +3 Pitch
      // 145 => +4 Pitch
      // 146 => +5 Pitch
      // 147 => +6 Pitch
      // 148 => +7 Pitch
      // 149 => +8 Pitch
      // 150 => +9 Pitch
      // 151 => +10 Pitch
      // 152 => +11 Pitch
      const pitchMode = this.readUInt8();
      const velocity = this.readUInt8();
      // Unknown 3: 64 / 0x40 / 1000000; occasionally 0 / 0 / 0.
      const unknown3 = this.readUInt8();
      // Hardware SX records use big-endian lengths, MKII records retain their little-endian layout.
      const length = this.readUInt16(!validated.og);
      const mapping = addresses.get(`${bankSwitch}:${midiNote}`);
      const padLabel = mapping?.pad ?? "";
      let sampleNumber = 0;
      if (padLabel) {
        sampleNumber =
          (padLabel.charCodeAt(0) - 65) * validated.padsPerBank + Number(padLabel.slice(1));
      }
      this.notes.push({
        ticks,
        midiNote,
        bankSwitch,
        pitchMode,
        velocity,
        unknown3,
        length,
        sampleNumber,
        padLabel,
      });
    }
    const footer = this.read(16);
    if (footer[0] !== 0) {
      debug("parse Unique Footer Byte 0:", footer[0]);
    }
    if (footer[1] !== 140) {
      debug("parse Unique Footer Byte 1:", footer[1]);
    }
    if (footer[2] !== 0) {
      debug("parse Unique Footer Byte 2:", footer[2]);
    }
    if (footer[3] !== 0) {
      debug("parse Unique Footer Byte 3:", footer[3]);
    }
    if (footer[4] !== 0) {
      debug("parse Unique Footer Byte 4:", footer[4]);
    }
    if (footer[5] !== 0) {
      debug("parse Unique Footer Byte 5:", footer[5]);
    }
    if (footer[6] !== 0) {
      debug("parse Unique Footer Byte 6:", footer[6]);
    }
    if (footer[7] !== 0) {
      debug("parse Unique Footer Byte 7:", footer[7]);
    }
    // Bars (MKii: 1-64; OG: 0)
    if (validated.og) {
      if (footer[8] !== 0) {
        debug("parse Unique Footer Byte 8 (OG):", footer[8]);
      }
    } else {
      if (footer[8] < 1 || footer[8] > 64) {
        debug("parse Unique Footer Byte 8 (MKii):", footer[8]);
      }
    }
    // SX stores its actual bar count here, including bars with no recorded hits.
    if (validated.og) {
      if (footer[1] !== 140) {
        throw new RangeError("Invalid SX pattern footer.");
      }
      integer(footer[9], 1, 64, "SX pattern bars");
    } else if (footer[9] !== 0) {
      debug("parse Unique Footer Byte 9 (MKii):", footer[9]);
    }
    if (footer[10] !== 0) {
      debug("parse Unique Footer Byte 10:", footer[10]);
    }
    if (footer[11] !== 0) {
      debug("parse Unique Footer Byte 11:", footer[11]);
    }
    // Time Signature
    if (![0, 1, 2, 3, 4, 5, 6, 7].includes(footer[12])) {
      debug("parse Unique Footer Byte 12:", footer[12]);
    }
    // OG: 0; MKii: 128
    if (validated.og) {
      if (footer[13] !== 0) {
        debug("parse Unique Footer Byte 13 (OG):", footer[13]);
      }
    } else {
      if (footer[13] !== 128) {
        debug("parse Unique Footer Byte 13 (MKii):", footer[13]);
      }
    }
    // Bars (OG: 0; MKii: 1-64)
    if (validated.og) {
      if (footer[14] !== 0) {
        debug("parse Unique Footer Byte 14 (OG):", footer[14]);
      }
    } else {
      if (footer[14] < 1 || footer[14] > 64) {
        debug("parse Unique Footer Byte 14 (MKii):", footer[14]);
      }
    }
    // OG: 0; MKii: 1
    if (validated.og) {
      if (footer[15] !== 0) {
        debug("parse Unique Footer Byte 15 (OG):", footer[15]);
      }
    } else {
      if (footer[15] !== 1) {
        debug("parse Unique Footer Byte 15 (MKii):", footer[15]);
      }
    }

    if (footer[8] !== footer[14]) {
      debug("parse Bars bytes 8 and 14 mismatch:", footer[8], footer[14]);
    }

    // SX and MKII store their bar counts at different footer offsets.
    this.bars = footer[validated.og ? 9 : 8];
    this.timeSignature = footer[12];
    debug("Parsed pattern:", this.notes.length, this.bars, this.timeSignature);
  }

  /**
   * Convert the parsed notes to a AudioMidi instance ready to be saved as MIDI file or manipulated further.
   * @param {object} options The options
   * @param {number} [options.bpm] The BPM of the track, when undefined no tempo event will be added.
   * @param {number} [options.ppq] The pulses per quarter note; defaults to 96 for OG or 480 for MKii.
   * @param {string} [options.fileName] The name of the pattern file being converted.
   * @param {Record<string, number>} options.noteMap A map of Pads `A1` to `J16` that correspond to which MIDI note.
   * Timing is rescaled to the destination PPQ; placeholders and unmapped pads retain their delays.
   * Known time signatures are exported as MIDI meta events; unknown codes throw.
   * The footer bar count also preserves the pattern duration when final padding is absent.
   * @returns {AudioMIDI} A new AudioMIDI instance populated from the pattern.
   */
  toMidi({ bpm, ppq, fileName = "", noteMap }: SP404ToMidiOptions): AudioMIDI {
    const nativePPQ = this.options.og ? SP404Pattern.defaultPPQOG : SP404Pattern.defaultPPQ;
    const targetPPQ = integer(ppq ?? nativePPQ, 1, 0x7fff, "MIDI PPQ");
    if (!noteMap || typeof noteMap !== "object") {
      throw new TypeError("A pad-to-MIDI note map is required.");
    }
    const ratio = targetPPQ / nativePPQ;
    // Preserve the documented device codes, including the gap at the undocumented code 6.
    const signatureNumerators = [4, 3, 2, 1, 5, 6, undefined, 7];
    integer(this.timeSignature, 0, 7, "Pattern time signature code");
    const numerator = signatureNumerators[this.timeSignature];
    if (numerator === undefined) {
      throw new RangeError(`Unsupported pattern time signature code: ${this.timeSignature}.`);
    }
    // We will build a single track.
    const events: (MidiTrackEvent & { absoluteTime: number })[] = [];
    // Running absolute time in pattern ticks for each note.
    let absoluteTime = 0;
    // Preserve silent bars described by the footer even when there are no trailing placeholders.
    let endTime = Math.round(integer(this.bars, 0, 64, "Pattern bars") * numerator * targetPPQ);
    for (const note of this.notes) {
      // SX delays follow the hit, MKII delays precede it. Advance placeholders and skipped hits too.
      const delay = integer(note.ticks, 0, 255, "Pattern delay");
      if (!this.options.og) {
        absoluteTime += delay;
      }
      const startTime = absoluteTime;
      const start = Math.round(startTime * ratio);
      if (this.options.og) {
        absoluteTime += delay;
      }
      endTime = Math.max(endTime, Math.round(absoluteTime * ratio));
      // Placeholders advance the clock even when a user map accidentally contains their empty label.
      if (note.midiNote === 128 || !note.padLabel) {
        continue;
      }
      // Map the Pad Label to MIDI Note. MIDI note 0 is valid.
      const midiNote = noteMap[note.padLabel];
      if (midiNote === undefined) {
        continue;
      }
      integer(midiNote, 0, 127, "MIDI note");
      integer(note.velocity, 0, 127, "Velocity");
      integer(note.length, 0, 0xffff, "Pattern note length");
      const end = Math.round((startTime + note.length) * ratio);
      const length = end - start;
      // Create a Note On event.
      events.push({
        absoluteTime: start,
        deltaTime: 0,
        type: 0x90,
        channel: 0,
        data: { note: midiNote, velocity: note.velocity, length },
        label: "Note On",
      });
      // Even zero-duration notes need a matching off event to avoid leaving a MIDI voice active.
      events.push({
        absoluteTime: end,
        deltaTime: 0,
        type: 0x80,
        channel: 0,
        data: { note: midiNote, velocity: 0 },
        label: "Note Off",
      });
      endTime = Math.max(endTime, end);
    }
    // Sort all the events by absolute time. Stable sorting keeps a zero-duration on/off pair in order,
    // and an earlier off before a retrigger.
    events.sort((a, b) => a.absoluteTime - b.absoluteTime);
    // Build one MIDI track.
    const track: Track = { type: "MTrk", chunkLength: 0, events: [] };
    // Optionally add tempo or other meta events at time 0.
    if (bpm !== undefined) {
      track.events.push(AudioMIDI.generateTempoEvent(bpm));
    }
    track.events.push(AudioMIDI.generateMetaStringEvent(0x03, `SP404 Pattern ${fileName}`));
    if (this.timeSignature !== 0) {
      track.events.push({
        deltaTime: 0,
        type: 0xff,
        metaType: 0x58,
        data: { numerator, denominator: 2, metronome: 24, thirtySecondNotes: 8 },
      });
    }
    // Convert the absolute times to delta times.
    let lastTime = 0;
    for (const { absoluteTime: time, ...event } of events) {
      event.deltaTime = time - lastTime;
      lastTime = time;
      track.events.push(event);
    }
    // End-of-track meta retains trailing silence after the final note.
    const endEvent = AudioMIDI.generateEndOfTrackEvent();
    endEvent.deltaTime = endTime - lastTime;
    track.events.push(endEvent);
    // Create an AudioMIDI with that single track.
    const midi = new AudioMIDI(undefined, { format: 1, timeDivision: targetPPQ });
    midi.trackCount = 1;
    midi.chunks = [track];
    return midi;
  }

  /**
   * Gathers all pads used in this pattern in first-use order, excluding placeholders and unknown pad addresses.
   * @returns {string[]} An array of distinct pad labels.
   */
  getUsedPads(): string[] {
    return [
      ...new Set(
        this.notes
          .filter((note) => note.midiNote !== 128 && note.padLabel !== "")
          .map((note) => note.padLabel),
      ),
    ];
  }

  /**
   * Converts a AudioMIDI structure back into a pad file format.
   * Pads that play all the way through will have 2 on notes, one to start the sound and one to end it.
   * @param {import('./audio-midi.js').default} audioMIDI The AudioMIDI instance to convert back to a pad file.
   * @param {Record<number, string>} noteMap A map of MIDI note numbers to pad labels `A1` to `J16`.
   * @param {number} patternPPQN The pulses per quarter note of the pattern; OG is 96, MKii is 480.
   * @param {boolean} [og] When true, process for the original SP404s, when false for the MKii; default is false.
   * Native SX output uses following delays, big-endian durations, and footer byte 9 for bars.
   * Durations come from Note On length or matching FIFO Note Off events within each track/channel.
   * Missing durations become zero; unmapped notes, SMPTE timing, non-4/4 signatures, independent
   * format-2 tracks and unrepresentable lengths throw. Patterns are limited to 64 bars.
   * @returns {DataBuffer} A committed DataBuffer representing the pad file.
   */
  static fromMidi(
    audioMIDI: AudioMIDI,
    noteMap: Record<number, string>,
    patternPPQN: number,
    og = false,
  ): DataBuffer {
    if (!audioMIDI || typeof audioMIDI !== "object" || !Array.isArray(audioMIDI.chunks)) {
      throw new TypeError("No audioMIDI provided, please provide an AudioMIDI instance.");
    }
    if (!noteMap || typeof noteMap !== "object") {
      throw new TypeError("No noteMap provided, please provide a mapping of MIDI notes to pads.");
    }
    const midiPPQN = integer(audioMIDI.timeDivision, 1, 0x7fff, "MIDI PPQ (SMPTE is unsupported)");
    const nativePPQ = og ? SP404Pattern.defaultPPQOG : SP404Pattern.defaultPPQ;
    if (patternPPQN !== nativePPQ) {
      throw new RangeError(`Pattern PPQN must be ${nativePPQ} for this device.`);
    }
    if (audioMIDI.format === 2 && audioMIDI.chunks.length > 1) {
      throw new RangeError("Independent format-2 MIDI tracks cannot be merged into one pattern.");
    }
    // Ensure we handle different PPQNs.
    const ratio = patternPPQN / midiPPQN;
    // 1920 ticks per bar for MKii (4/4 time signature); 384 for OG.
    const ticksPerBar = patternPPQN * 4;
    // Maximum length is 64 bars (122880 ticks for MKii).
    const maximumTime = ticksPerBar * 64;
    // Flatten all events into a single list with absolute time.
    const notes: TimedNote[] = [];
    let trackEnd = 0;
    for (const track of audioMIDI.chunks) {
      const active = new Map<string, TimedNote[]>();
      let time = 0;
      for (const event of track.events) {
        time += integer(event.deltaTime, 0, 0x0fffffff, "MIDI delta time");
        integer(time, 0, Number.MAX_SAFE_INTEGER, "MIDI absolute time");
        // MIDI stores the denominator as a base-2 exponent: 2 means quarter notes (4/4).
        if (event.type === 0xff && event.metaType === 0x58) {
          const signature = event.data;
          if (
            typeof signature !== "object" ||
            signature === null ||
            !("numerator" in signature) ||
            !("denominator" in signature) ||
            signature.numerator !== 4 ||
            signature.denominator !== 2
          ) {
            throw new RangeError("MIDI import currently supports only 4/4 patterns.");
          }
        }
        if ((event.type !== 0x90 && event.type !== 0x80) || !isNoteData(event.data)) {
          continue;
        }
        const data = event.data;
        integer(data.note, 0, 127, "MIDI note");
        integer(data.velocity, 0, 127, "Velocity");
        const channel = integer(event.channel ?? 0, 0, 15, "MIDI channel");
        const key = `${channel}:${data.note}`;
        if (event.type === 0x90 && data.velocity > 0) {
          const length = data.length;
          if (length !== undefined) {
            integer(length, 0, Number.MAX_SAFE_INTEGER, "MIDI note length");
          }
          const note: TimedNote = { time, note: data.note, velocity: data.velocity, length };
          notes.push(note);
          const queue = active.get(key) ?? [];
          queue.push(note);
          active.set(key, queue);
        } else {
          // Match within channel and track, including velocity-zero Note On as MIDI's alternate off form.
          const note = active.get(key)?.shift();
          if (note && note.length === undefined) {
            note.length = time - note.time;
          }
        }
      }
      trackEnd = Math.max(trackEnd, Math.round(time * ratio));
    }
    // Sort by absolute time so events from multiple tracks are truly chronological.
    notes.sort((a, b) => a.time - b.time);
    const buffer = new DataBuffer();
    const mappings = padMap(og);
    // Track the current time in pattern ticks, including inserted timing placeholders.
    let currentTime = 0;
    let endTime = trackEnd;

    // SX needs the next event's gap before its current record can be committed.
    let pendingRecord: Uint8Array | undefined;
    /** Write native records, holding an SX hit until its following delay is known. */
    const writeRecord = (
      delay: number,
      midiNote: number,
      bankSwitch: number,
      velocity: number,
      length: number,
    ): void => {
      const record = new Uint8Array(8);
      record.set([og ? 0 : delay, midiNote, bankSwitch, 0, velocity, midiNote === 128 ? 0 : 64]);
      new DataView(record.buffer).setUint16(6, length, !og);
      if (og) {
        if (pendingRecord) {
          pendingRecord[0] = delay;
          buffer.writeBytes(pendingRecord);
        } else if (delay > 0) {
          // Following-delay records require an initial silent event when the first hit is late.
          buffer.writeBytes([delay, 128, 0, 0, 0, 0, 0, 0]);
        }
        pendingRecord = record;
      } else {
        buffer.writeBytes(record);
      }
    };

    /** Split a silent gap into byte-sized delays while advancing the same absolute clock as notes. */
    const insertEmptyNotes = (gap: number): void => {
      while (gap > 0) {
        // Insert no more than 255 ticks at a time; empty notes use pad 128 and a zero length.
        const ticks = Math.min(gap, 255);
        writeRecord(ticks, 128, 0, 0, 0);
        currentTime += ticks;
        gap -= ticks;
      }
    };
    for (const note of notes) {
      // Quantize absolute positions, not individual deltas, so rounding cannot accumulate timing drift.
      const start = Math.round(note.time * ratio);
      const end = Math.round((note.time + (note.length ?? 0)) * ratio);
      integer(start, 0, maximumTime, "Pattern note start");
      integer(end, 0, maximumTime, "Pattern note end");
      const length = integer(end - start, 0, 0xffff, "Pattern note length");
      // We pass in noteMap, mapping the MIDI values to Pads, then look the pads up in the appropriate map.
      // If we are in a different bank we will need to set bank switch.
      const label = noteMap[note.note];
      const mapping = Object.hasOwn(mappings, label) ? mappings[label] : undefined;
      if (!mapping) {
        throw new RangeError(`No valid pad mapping for MIDI note ${note.note}: ${label}.`);
      }
      let gap = start - currentTime;
      if (gap > 255) {
        insertEmptyNotes(gap - 255);
        gap = 255;
      }
      writeRecord(gap, mapping.midiNote, mapping.bankSwitch, note.velocity, length);
      currentTime = start;
      endTime = Math.max(endTime, end);
    }
    // Include sustained notes and trailing rests. Empty patterns still occupy one complete bar.
    const bars = Math.max(1, Math.ceil(endTime / ticksPerBar));
    integer(bars, 1, 64, "Pattern bars");
    insertEmptyNotes(bars * ticksPerBar - currentTime);
    // Flush the final SX placeholder with zero following delay before writing its footer.
    if (pendingRecord) {
      buffer.writeBytes(pendingRecord);
    }
    // Add footer and other necessary data to the buffer.
    const footer = new Uint8Array(16);
    footer[1] = 140;
    footer[8] = og ? 0 : bars;
    footer[9] = og ? bars : 0;
    footer[13] = og ? 0 : 128;
    footer[14] = og ? 0 : bars;
    footer[15] = og ? 0 : 1;
    buffer.writeBytes(footer);
    buffer.commit();
    return buffer;
  }
}

export default SP404Pattern;
