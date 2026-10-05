import DataBuffer from "../data-buffer.js";
import AudioMIDI from "./audio-midi.js";
/** One eight-byte pattern event. A raw note value of 128 is a timing placeholder. */
export interface SP404Note {
    /** The delay in ticks from the previous event (0-255). */
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
    /** The length of the note in ticks (2 Bytes). */
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
    /** Original SP-404 layout and 96 PPQ when true; MKII and 480 PPQ otherwise. */
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
declare class SP404Pattern extends DataBuffer {
    /** The number of bars in the pattern, so 1 bar is 1; OG files store zero here. */
    bars: number;
    /** The time signature of the pattern: 0 = 4/4, 1 = 3/4, 2 = 2/4, 3 = 1/4, 4 = 5/4, 5 = 6/4, 7 = 7/4. Unknown codes are retained. */
    timeSignature: number;
    /** Includes timing placeholders so silent gaps can survive conversion. */
    notes: SP404Note[];
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
    constructor(input?: ConstructorParameters<typeof DataBuffer>[0], options?: SP404PatternOptions);
    /** Original device ticks per quarter note. */
    static get defaultPPQOG(): number;
    /** MKII ticks per quarter note. */
    static get defaultPPQ(): number;
    /**
     * The default mapping of pads `A1` to `J16` to MIDI notes.
     * Returns a fresh map owned by the caller.
     * @returns {Record<string, SP404PadMapping>} The default mapping of pads `A1` to `J16` to MIDI notes.
     */
    static get defaultMap(): Record<string, SP404PadMapping>;
    /**
     * The default mapping of pads `A1` to `J12` to MIDI notes for the OG SP404.
     * https://support.roland.com/hc/en-us/articles/201932129-SP-404-Playing-the-SP-404-via-MIDI
     * Returns a fresh map owned by the caller.
     * @returns {Record<string, SP404PadMapping>} The default mapping of pads `A1` to `J12` to MIDI notes.
     */
    static get defaultMapOG(): Record<string, SP404PadMapping>;
    /** Reject layouts that would desynchronize event reads from the fixed sixteen-byte footer. */
    private validateOptions;
    /**
     * Parse the pattern into notes and extract the bar count from the footer.
     * Reparse from byte zero. Incomplete notes and footers throw before state changes.
     * @param {object} options The options for parsing the pattern.
     * @param {number} [options.bytesPerNote] The number of bytes for each note; default is 8.
     * @param {number} [options.padsPerBank] The number of pads per bank, 12 or 16 for the MKii; default is 12 for OG and 16 for MKii.
     * @param {boolean} [options.og] When true, process for the original SP404s, when false for the MKii; default is false.
     */
    parse(options?: SP404PatternOptions): void;
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
    toMidi({ bpm, ppq, fileName, noteMap }: SP404ToMidiOptions): AudioMIDI;
    /**
     * Gathers all pads used in this pattern in first-use order, excluding placeholders and unknown pad addresses.
     * @returns {string[]} An array of distinct pad labels.
     */
    getUsedPads(): string[];
    /**
     * Converts a AudioMIDI structure back into a pad file format.
     * Pads that play all the way through will have 2 on notes, one to start the sound and one to end it.
     * @param {import('./audio-midi.js').default} audioMIDI The AudioMIDI instance to convert back to a pad file.
     * @param {Record<number, string>} noteMap A map of MIDI note numbers to pad labels `A1` to `J16`.
     * @param {number} patternPPQN The pulses per quarter note of the pattern; OG is 96, MKii is 480.
     * @param {boolean} [og] When true, process for the original SP404s, when false for the MKii; default is false.
     * Durations come from Note On length or matching FIFO Note Off events within each track/channel.
     * Missing durations become zero; unmapped notes, SMPTE timing, non-4/4 signatures, independent
     * format-2 tracks and unrepresentable lengths throw. Patterns are limited to 64 bars.
     * @returns {DataBuffer} A committed DataBuffer representing the pad file.
     */
    static fromMidi(audioMIDI: AudioMIDI, noteMap: Record<number, string>, patternPPQN: number, og?: boolean): DataBuffer;
}
export default SP404Pattern;
//# sourceMappingURL=sp404-pattern.d.ts.map