import DataBuffer from "./../data-buffer.js";
/** FIFO matching is deterministic when the same channel plays overlapping notes of the same pitch. */
export interface ActiveNote {
    startTime: number;
    noteOnEvent: MidiTrackEvent;
    next?: ActiveNote;
}
/** Constructor options stored on an {@link AudioMIDI} instance. */
export interface AudioMidiConstructorOptions {
    /** The MIDI format: 0, 1, or 2. */
    format?: number;
    /** Ticks per quarter note. */
    timeDivision?: number;
}
export interface WritableNote {
    /** The delay in ticks from this note's start until the next note's start, including skipped notes. */
    ticks: number;
    /** The MIDI note value. */
    midiNote: number;
    /** The velocity of the note (0-127). */
    velocity: number;
    /** The length of the note in ticks. */
    length: number;
}
export interface WritableTrack {
    /** The BPM of the track; falls back to the shared BPM when provided. Independent tempos require format 2. */
    bpm?: number;
    /** A key value collection of meta events to add where they key is the event type and the value is the data to add. */
    metaStringEvents?: Record<number, string>;
    /** A collection of notes to write on the track. */
    notes?: WritableNote[];
}
/** Note On / Note Off / Note Aftertouch data. */
export interface NoteData {
    /** The MIDI note number (0-127). */
    note: number;
    /** The velocity of the note (0-127). */
    velocity: number;
    /** The length of the note in ticks; back-filled on the Note On when the matching Note Off is parsed. */
    length?: number;
}
/** Control Change data. */
export interface ControllerData {
    /** The controller number (0-127). */
    controller: number;
    /** The controller value (0-127). */
    value: number;
    /** The human-readable controller label. */
    label?: string;
}
/** Pitch Bend data. `pitchValue` is the combined 14-bit value; `firstByte`/`secondByte` are the raw LSB/MSB bytes used when writing. */
export interface PitchBendData {
    /** The combined 14-bit pitch value (0-16383), populated when parsing and optional when writing raw bytes. */
    pitchValue?: number;
    /** The least significant 7 bits (LSB). */
    firstByte: number;
    /** The most significant 7 bits (MSB). */
    secondByte: number;
}
/** Song Position Pointer data. */
export interface SongPositionData {
    /** The most significant byte. */
    msb: number;
    /** The least significant byte. */
    lsb: number;
}
/** Song Select data. */
export interface SongSelectData {
    /** The song number to select. */
    songNumber: number;
}
/** System Exclusive data. */
export interface SysExData {
    /** The manufacturer's ID code. */
    manufacturerId: number;
    /** The manufacturer's label based on the ID. */
    manufacturerLabel?: string;
    /** The SysEx data bytes, excluding the manufacturer ID and optional final EOX byte. */
    data: number[];
    /** A three-byte manufacturer ID beginning with 0x00; omitted for one-byte IDs. */
    manufacturerIdBytes?: number[];
    /** Whether this SMF packet ends with EOX (0xF7), default is true when writing. */
    terminated?: boolean;
}
/** Meta Sequence Number data. */
export interface SequenceNumberData {
    /** The sequence number. */
    sequenceNumber: number;
    /** How the sequence number was resolved (`Provided` or `Next Track Index`). */
    type?: string;
}
/** Meta Set Tempo data. */
export interface TempoData {
    /** The most significant tempo byte. */
    byte1: number;
    /** The middle tempo byte. */
    byte2: number;
    /** The least significant tempo byte. */
    byte3: number;
    /** The tempo in microseconds per quarter note. */
    tempo?: number;
    /** The tempo in Beats Per Minute. */
    bpm?: number;
}
/** Meta SMPTE Offset data. */
export interface SmpteOffsetData {
    /** The raw hour byte (encodes both frame rate and hour). */
    hourByte: number;
    /** The hour (0-23). */
    hour?: number;
    /** The minute (0-59). */
    minute: number;
    /** The second (0-59). */
    second: number;
    /** The frame (depends on the frame rate). */
    frame: number;
    /** The sub-frame (0-99). */
    subFrame: number;
    /** The decoded frame rate (24, 25, 29.97 or 30). */
    frameRate?: number | string;
}
/** Meta Time Signature data. */
export interface TimeSignatureData {
    /** The numerator of the time signature, the 3 in 3/4. */
    numerator: number;
    /** The encoded base-2 denominator exponent: 2 means a denominator of 4, as in 3/4. */
    denominator: number;
    /** The number of MIDI clocks in a metronome click. */
    metronome: number;
    /** The number of notated 32nd notes in a MIDI quarter note. */
    thirtySecondNotes: number;
}
/** Meta Key Signature data. `keySignature` is signed: negative for flats, positive for sharps (-7 to 7). */
export interface KeySignatureData {
    /** The number of sharps (positive) or flats (negative), -7 to 7. */
    keySignature: number;
    /** 0 for a major key, 1 for a minor key. */
    majorOrMinor: number;
    /** The human-readable key name (e.g., "C♯"). */
    keyName?: string;
    /** The mode, "Major" or "Minor". */
    mode?: string;
}
/** M-Live Tag data (non-standard meta event). */
export interface MLiveTagData {
    /** The tag byte. */
    tag: number;
    /** The human-readable tag label, populated when parsing. */
    tagLabel?: string;
    /** The raw tag value bytes. */
    tagValue: Uint8Array;
}
/**
 * The data associated with a MIDI event. The concrete shape depends on the event `type`/`metaType`:
 * primitives are used for single-value events (Program Change / Channel Pressure as `number`, text meta events as `string`),
 * a `Uint8Array` for raw/unparsed payloads, and the named shapes above for structured events.
 */
export type EventData = string | number | Uint8Array | number[] | NoteData | ControllerData | PitchBendData | SongPositionData | SongSelectData | SysExData | SequenceNumberData | TempoData | SmpteOffsetData | TimeSignatureData | KeySignatureData | MLiveTagData;
export interface MidiTrackEvent {
    /** The delta time of the MIDI event. */
    deltaTime: number;
    /** The status byte / type of the event; required when writing. Invalid running status is rejected when parsing. */
    type?: number;
    /** A human-readable label describing the event. */
    label?: string;
    /** The data associated with the event. */
    data?: EventData;
    /** The subtype of the meta event. */
    metaType?: number;
    /** The declared length of parsed meta data. When writing, the length is derived from the payload. */
    metaEventLength?: number;
    /** The MIDI channel the event is for. */
    channel?: number;
    /** Original non-UTF-8 text bytes. Reused when saving if the decoded text is unchanged. */
    textBytes?: Uint8Array;
    /** The tag for the M-Live Tag event. */
    tag?: number;
}
export interface Header {
    /** The type of the chunk (e.g., MThd, MTrk). */
    type: string;
    /** The format of the MIDI file (header only). */
    format: number;
    /** The number of tracks in the MIDI file (header only). */
    trackCount: number;
    /** The time division of the MIDI file in ticks per quarter note (header only); undefined when the file uses SMPTE timing. */
    timeDivision?: number;
    /** The SMPTE frames per second (header only); only set when the file uses SMPTE timing. */
    framesPerSecond?: number;
    /** The number of ticks per SMPTE frame (header only); only set when the file uses SMPTE timing. */
    ticksPerFrame?: number;
    /** The length of the chunk data. */
    chunkLength: number;
}
export interface Track {
    /** The type of the chunk (e.g., MThd, MTrk). */
    type: string;
    /** The length of the chunk data. */
    chunkLength: number;
    /** The collection of events in the track. */
    events: MidiTrackEvent[];
    /** Bytes following End of Track, preserved without interpreting them as events. */
    trailingData?: Uint8Array;
}
export interface UsedNote {
    /** The numeric value of the note. */
    noteNumber: number;
    /** The human-readable note string. */
    noteString: string;
}
/**
 * AudioMIDI - MIDI Utility
 * MIDI File Format Parser & Generator
 * @example <caption>AudioMIDI</caption>
 * const data = fs.readFileSync('./song.mid');
 * const file = new AudioMIDI(data);
 * file.parse();
 * console.log('Chunks:', file.chunks);
 * @class
 * @augments DataBuffer
 */
declare class AudioMIDI extends DataBuffer {
    /** The MIDI format: 0, 1, or 2. */
    format: number;
    /** The internal track count. */
    trackCount: number;
    /** The indication of how MIDI ticks should be translated into time (ticks per quarter note); `0` when the file uses SMPTE timing. */
    timeDivision: number;
    /** The SMPTE frames per second; only set when the file uses SMPTE timing. */
    framesPerSecond?: number;
    /** The number of ticks per SMPTE frame; only set when the file uses SMPTE timing. */
    ticksPerFrame?: number;
    /** The parsed (or to-be-written) chunks. */
    chunks: Track[];
    /** The options for the AudioMIDI instance. */
    options: AudioMidiConstructorOptions;
    /**
     * Creates a new AudioMIDI.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} [input] The data to process.
     * @param {object} [options] Options for this AudioMIDI instance.
     * @param {number} [options.format] The MIDI format: 0, 1, or 2, default is 0.
     * @param {number} [options.timeDivision] The indication of how MIDI ticks should be translated into time, default is 480.
     * @class
     */
    constructor(input?: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array, options?: AudioMidiConstructorOptions);
    /**
     * Several different values in events are expressed as variable length quantities (e.g. delta time values).
     * A variable length value uses a minimum number of bytes to hold the value, and in most circumstances this leads to some degree of data compresssion.
     *
     * A variable length value uses the low order 7 bits of a byte to represent the value or part of the value.
     * The high order bit is an "escape" or "continuation" bit.
     * All but the last byte of a variable length value have the high order bit set.
     * The last byte has the high order bit cleared.
     * The bytes always appear most significant byte first.
     * @param end The exclusive read boundary, default is the end of the buffer.
     * @returns The decoded variable-length quantity.
     */
    readVariableLengthValues: (end?: number) => number;
    /**
     * Parse a MIDI file from a Uint8Array.
     * @see {@link https://midi.org/expanded-midi-1-0-messages-list | Expanded MIDI 1.0 Messages List (Status Bytes)}
     * @see {@link https://midi.org/midi-1-0-universal-system-exclusive-messages | MIDI 1.0 Universal System Exclusive Messages}
     * @see {@link https://midi.org/dls-proprietary-chunk-ids | DLS Proprietary Chunk IDs}
     */
    parse(): void;
    /**
     * Adds a new track to the MIDI file.
     * Keeps {@link AudioMIDI#trackCount} in sync so the header written by {@link AudioMIDI#saveToDataBuffer} matches the number of chunks.
     * @returns {Track} The new track.
     */
    addTrack(): Track;
    /**
     * Adds an event to a track.
     * @param track The track to add the event to.
     * @param event The event to add.
     */
    addEvent(track: Track, event: MidiTrackEvent | MidiTrackEvent[]): void;
    /**
     * Writes the MIDI data to a binary file.
     * @returns The binary data buffer.
     */
    saveToDataBuffer(): DataBuffer;
    /** Encode either PPQN or the signed SMPTE frame-rate code used in the header. */
    private encodeTimeDivision;
    /**
     * Write a track chunk to the data buffer.
     * @param dataBuffer The data buffer to write to.
     * @param chunk The track chunk to write.
     */
    writeChunk(dataBuffer: DataBuffer, chunk: Track): void;
    /**
     * Helper function to write an event to the data buffer.
     * @param dataBuffer The data buffer to write to.
     * @param event The event to write.
     */
    writeEvent(dataBuffer: DataBuffer, event: MidiTrackEvent): void;
    /**
     * Prepare and validate event payloads without writing partial events on validation failure.
     * Raw meta/SysEx bytes are accepted to preserve unrecognized and malformed-but-bounded input.
     * @param event The event to encode.
     * @returns The validated payload, without delta time, status, subtype or length bytes.
     */
    private static encodeEventData;
    /**
     * Returns a sorted list of all unique note numbers used in "Note On" events,
     * along with their note names (e.g. "C3", "D#4").
     * @returns Array of note data
     */
    getUsedNotes(): UsedNote[];
    /**
     * Validate a MIDI instance for common issues.
     * Matching Note Ons / Offs: A `velocity > 0` "Note On" increments the active count for its port, channel and note. A "Note Off" or "Note On" with `velocity == 0` decrements. If the count is already 0, that is invalid. At the end of the track, if any notes still have a positive count, that is also invalid.
     * Meta Events: We do a small switch on `event.metaType` to check if the declared metaEventLength is correct for well-known meta events (End of Track, Set Tempo, Time Signature, etc.).
     * Chunk Length: Since the parser already stored each chunk's `chunkLength`, we do minimal checks: if `chunkLength > 0` but there are zero events, or vice versa, that is unusual.
     * @returns {string[]} Array of warning / error messages discovered, an empty array if no issues are found.
     */
    validate(): string[];
    /**
     * Decodes and validates MIDI Header.
     * Checks for `MThd` header, reads the chunk length, format, track count, and PPQN (pulses per quarter note) / PPQ (pulses per quarter) / PQN (per quarter note) / TPQN (ticks per quarter note) / TPB (ticks per beat).
     *
     * Signature (Decimal): [77, 84, 104, 100, ...]
     * Signature (Hexadecimal): [4D, 54, 68, 64, ...]
     * Signature (ASCII): [M, T, h, d, ...]
     * @static
     * @param chunk Data Blob
     * @returns The decoded values.
     */
    static decodeHeader(chunk: Buffer | string | Uint8Array): Header;
    /**
     * Return the human readable controller name from the ID.
     * @param controller The controller ID.
     * @returns The human-readable controller name.
     * @see {@link https://www.mixagesoftware.com/en/midikit/help/ | MidiKit Help Controllers}
     * @see {@link https://midi.org/midi-1-0-control-change-messages | MIDI 1.0 Control Change Messages (Data Bytes)}
     * @static
     */
    static getControllerLabel(controller: number): string;
    /**
     * Return the human readable manufacturer name from the ID.
     * @param manufacturerId The manufacturer ID.
     * @returns The human-readable manufacturer name.
     * @see {@link https://www.mixagesoftware.com/en/midikit/help/HTML/manufacturers.html | MidiKit Help MIDI Manufacturers List}
     * @static
     */
    static getManufacturerLabel(manufacturerId: number): string;
    /**
     * Write a variable-length value.
     * @param dataBuffer The data buffer to write to.
     * @param value The value to write as a variable-length quantity.
     * @static
     */
    static writeVariableLengthValue(dataBuffer: DataBuffer, value: number): void;
    /**
     * Write event data.
     * @param dataBuffer The data buffer to write to.
     * @param data The event data to write.
     * @static
     */
    static writeEventData(dataBuffer: DataBuffer, data: Uint8Array | number[] | string): void;
    /**
     * Generate a Set Tempo event with a provided BPM.
     * @param bpm The desired tempo in Beats Per Minute.
     * @returns The tempo event with the correct byte values.
     * @static
     */
    static generateTempoEvent(bpm: number): MidiTrackEvent;
    /**
     * Generate a Meta String event:
     * - 0x01: 'Text Event'
     * - 0x02: 'Copyright Notice'
     * - 0x03: 'Sequence / Track Name'
     * - 0x04: 'Instrument Name'
     * - 0x05: 'Lyrics'
     * - 0x06: 'Marker'
     * - 0x07: 'Cue Point'
     * - 0x08: 'Program Name'
     * - 0x09: 'Device (Port) Name'
     * @param metaType The meta event type. (e.g., 0x03 for Track Name).
     * @param data The string value for the event (e.g., the name of the track).
     * @returns The meta string event with the encoded string data.
     * @static
     */
    static generateMetaStringEvent(metaType: number, data: string): MidiTrackEvent;
    /**
     * Generate an end of track event.
     * @returns The end of track event.
     * @static
     */
    static generateEndOfTrackEvent(): MidiTrackEvent;
    /**
     * Convert a collection of tracks and notes into a new AudioMIDI instance.
     * @param options The options
     * @param [options.ppq] The pulses per quarter note, default is 480.
     * @param [options.bpm] The BPM of the track, when blank no tempo event will be added.
     * @param [options.tracks] The MIDI tracks to write.
     * @param [options.format] The MIDI format, default is 0 for one track or 1 for multiple tracks. Use 2 for independent track tempos.
     * @param [options.skipNotes] The MIDI notes to skip, if any.
     * @returns The newly constructed MIDI
     * @static
     * @example
     * const midi = AudioMIDI.convertToMidi({
     *   bpm,
     *   ppq,
     *   tracks: [
     *     {
     *       notes: myCustomNotes.map((note) => {
     *         return {
     *           midiNote: note.midiNote,
     *           ticks: note.ticks,
     *           velocity: note.velocity,
     *           length: note.length,
     *         }
     *       }),
     *       metaStringEvents: {
     *         0x03: `Custom MIDI`,
     *       },
     *     }
     *   ],
     *   skipNotes: [128],
     * });
     * return midi;
     */
    static convertToMidi({ ppq, bpm, tracks, format, skipNotes, }?: {
        ppq?: number;
        bpm?: number;
        tracks?: WritableTrack[];
        format?: number;
        skipNotes?: number[];
    }): AudioMIDI;
    /**
     * Convert a note string like `C1` or `D#2` to the MIDI value.
     * @param noteString The notation string.
     * @param [octaveOffset] The default octave offset for C1, where a value of 2 means C1 = 36; default is 2.
     * @param [noteMap] The note map to use for the conversion.
     * @returns The MIDI value for the provided note.
     * @example
     * AudioMIDI.noteToMidi('C4') === 72
     * AudioMIDI.noteToMidi('C3') === 60
     * AudioMIDI.noteToMidi('C2') === 48
     * AudioMIDI.noteToMidi('C1') === 36
     * AudioMIDI.noteToMidi('C-1') === 12
     * AudioMIDI.noteToMidi('C-2') === 0
     */
    static noteToMidi(noteString: string, octaveOffset?: number, noteMap?: Record<string, number>): number;
    /**
     * Convert a MIDI value back to a note string like `C1` or `D#2`.
     * @param midiValue The MIDI value (0-127).
     * @param [octaveOffset] The default octave offset for C1, where a value of 2 means C1 = 36; default is 2.
     * @param [noteNames] The note names to use for the conversion.
     * @returns The note label corresponding to the MIDI value.
     * @example
     * AudioMIDI.midiToNote(72) === 'C4'
     * AudioMIDI.midiToNote(60) === 'C3'
     * AudioMIDI.midiToNote(48) === 'C2'
     * AudioMIDI.midiToNote(36) === 'C1'
     * AudioMIDI.midiToNote(12) === 'C-1'
     * AudioMIDI.midiToNote(0) === 'C-2'
     */
    static midiToNote(midiValue: number, octaveOffset?: number, noteNames?: string[]): string;
}
export default AudioMIDI;
//# sourceMappingURL=audio-midi.d.ts.map