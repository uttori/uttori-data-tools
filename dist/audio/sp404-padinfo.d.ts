import DataBuffer from "../data-buffer.js";
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
declare class SP404PadInfo extends DataBuffer {
    /** Parsed Pads in bank order; short files may contain fewer than 120 complete records. */
    pads: SP404Pad[];
    /**
     * Creates and parses a PAD_INFO.BIN file from binary data.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} data The PAD_INFO.BIN data to parse.
     * @returns {SP404PadInfo} The parsed PAD_INFO helper.
     * @static
     */
    static fromFile(data?: ConstructorParameters<typeof DataBuffer>[0]): SP404PadInfo;
    /**
     * Creates an instance of SP404PadInfo.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array|undefined} [input] The data to process.
     * Omitted input creates an empty instance. Partial records and more than 120 pads are rejected.
     * @class
     */
    constructor(input?: ConstructorParameters<typeof DataBuffer>[0]);
    /**
     * Parse the PAD_INFO.BIN file, decoding the supported pad info.
     *
     * This is stored alongside the samples in PAD_INFO.BIN and contains 120 × 32-byte records, one for each pad from A1 to J12.
     * In this file, values are stored in big-endian order.
     * Reparse from byte zero; invalid record layouts throw before replacing pads.
     */
    parse(): void;
    /**
     * Encode JSON values to a valid pad structure.
     * @param {SP404PadInput} [data] - The JSON values to encode.
     * @returns {Buffer} - The new pad Buffer.
     * Defaults match the OEM converter; invalid fields throw before return.
     * @static
     */
    static encodePad(data?: SP404PadInput): Buffer;
    /**
     * Checks to see if a Pad is set to the default values, if so it is likely unused.
     * @param {SP404PadInput} [pad] - The JSON values to check.
     * @param {boolean} [strict] - When strict all values are checked for defaults, otherwise just the offsets are checked.
     * @returns {boolean} - Returns true if the Pad is set the the default values, false otherwise.
     * @static
     */
    static checkDefault(pad?: SP404PadInput, strict?: boolean): boolean;
    /**
     * Convert a numberic value used in the PAD_INFO.bin file for that pad to the pad label like `A1` or `J12`.
     * @param {number} index The numberic value used in the PAD_INFO.bin file.
     * @returns {string} The pad label like `A1` or `J12`, or an empty string for an invalid index.
     * @static
     */
    static getPadLabel(index?: number): string;
    /**
     * Convert a pad label like `A1` or `J12` to the numberic value used in the PAD_INFO.bin file for that pad.
     * @param {string} label The pad label like `A1` or `J12`.
     * @returns {number} The numeric value used in the PAD_INFO.bin file, or -1 for an invalid label.
     * @static
     */
    static getPadIndex(label?: string): number;
}
export default SP404PadInfo;
//# sourceMappingURL=sp404-padinfo.d.ts.map