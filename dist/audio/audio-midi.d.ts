export default AudioMIDI;
/**
 * No-op logger, replaced by the `debug` package when enabled.
 */
export type DebugLogger = (...args: any[]) => any;
/**
 * Constructor options stored on an {@link AudioMIDI} instance.
 */
export type AudioMidiConstructorOptions = {
    /**
     * The MIDI format: 0, 1, or 2.
     */
    format?: number | undefined;
    /**
     * Ticks per quarter note.
     */
    timeDivision?: number | undefined;
};
export type WritableNote = {
    /**
     * The delay in ticks until the next track.
     */
    ticks: number;
    /**
     * The MIDI note value.
     */
    midiNote: number;
    /**
     * The velocity of the note (0-127).
     */
    velocity: number;
    /**
     * The length of the note in ticks.
     */
    length: number;
};
export type WritableTrack = {
    /**
     * The BPM of the track, when blank no tempo event will be added.
     */
    bpm?: number | undefined;
    /**
     * A key value collection of meta events to add where they key is the event type and the value is the data to add.
     */
    metaStringEvents?: Record<number, string> | undefined;
    /**
     * A collection of notes to write on the track.
     */
    notes?: WritableNote[] | undefined;
};
/**
 * Note On / Note Off / Note Aftertouch data.
 */
export type NoteData = {
    /**
     * The MIDI note number (0-127).
     */
    note: number;
    /**
     * The velocity of the note (0-127).
     */
    velocity: number;
    /**
     * The length of the note in ticks; back-filled on the Note On when the matching Note Off is parsed.
     */
    length?: number | undefined;
};
/**
 * Control Change data.
 */
export type ControllerData = {
    /**
     * The controller number (0-127).
     */
    controller: number;
    /**
     * The controller value (0-127).
     */
    value: number;
    /**
     * The human-readable controller label.
     */
    label?: string | undefined;
};
/**
 * Pitch Bend data. `pitchValue` is the combined 14-bit value; `firstByte`/`secondByte` are the raw LSB/MSB bytes used when writing.
 */
export type PitchBendData = {
    /**
     * The combined 14-bit pitch value (0-16383).
     */
    pitchValue: number;
    /**
     * The least significant 7 bits (LSB).
     */
    firstByte: number;
    /**
     * The most significant 7 bits (MSB).
     */
    secondByte: number;
};
/**
 * Song Position Pointer data.
 */
export type SongPositionData = {
    /**
     * The most significant byte.
     */
    msb: number;
    /**
     * The least significant byte.
     */
    lsb: number;
};
/**
 * Song Select data (write side).
 */
export type SongSelectData = {
    /**
     * The song number to select.
     */
    songNumber: number;
};
/**
 * System Exclusive data.
 */
export type SysExData = {
    /**
     * The manufacturer's ID code.
     */
    manufacturerId: number;
    /**
     * The manufacturer's label based on the ID.
     */
    manufacturerLabel?: string | undefined;
    /**
     * The SysEx data bytes.
     */
    data: number[];
};
/**
 * Meta Sequence Number data.
 */
export type SequenceNumberData = {
    /**
     * The sequence number.
     */
    sequenceNumber: number;
    /**
     * How the sequence number was resolved (`Provided` or `Next Track Index`).
     */
    type?: string | undefined;
};
/**
 * Meta Set Tempo data.
 */
export type TempoData = {
    /**
     * The most significant tempo byte.
     */
    byte1: number;
    /**
     * The middle tempo byte.
     */
    byte2: number;
    /**
     * The least significant tempo byte.
     */
    byte3: number;
    /**
     * Microseconds per quarter note.
     */
    tempo?: number | undefined;
    /**
     * The tempo in Beats Per Minute.
     */
    bpm?: number | undefined;
};
/**
 * Meta SMPTE Offset data.
 */
export type SmpteOffsetData = {
    /**
     * The raw hour byte (encodes both frame rate and hour).
     */
    hourByte: number;
    /**
     * The hour (0-23).
     */
    hour?: number | undefined;
    /**
     * The minute (0-59).
     */
    minute: number;
    /**
     * The second (0-59).
     */
    second: number;
    /**
     * The frame (depends on the frame rate).
     */
    frame: number;
    /**
     * The sub-frame (0-99).
     */
    subFrame: number;
    /**
     * The decoded frame rate (24, 25, 29.97 or 30).
     */
    frameRate?: string | number | undefined;
};
/**
 * Meta Time Signature data.
 */
export type TimeSignatureData = {
    /**
     * The numerator of the time signature, the 3 in 3/4.
     */
    numerator: number;
    /**
     * The denominator of the time signature, the 4 in 3/4.
     */
    denominator: number;
    /**
     * The number of MIDI clocks in a metronome click.
     */
    metronome: number;
    /**
     * The number of notated 32nd notes in a MIDI quarter note.
     */
    thirtySecondNotes: number;
};
/**
 * Meta Key Signature data. `keySignature` is signed: negative for flats, positive for sharps (-7 to 7).
 */
export type KeySignatureData = {
    /**
     * The number of sharps (positive) or flats (negative), -7 to 7.
     */
    keySignature: number;
    /**
     * 0 for a major key, 1 for a minor key.
     */
    majorOrMinor: number;
    /**
     * The human-readable key name (e.g., "C♯").
     */
    keyName?: string | undefined;
    /**
     * The mode, "Major" or "Minor".
     */
    mode?: string | undefined;
};
/**
 * M-Live Tag data (non-standard meta event).
 */
export type MLiveTagData = {
    /**
     * The tag byte.
     */
    tag: number;
    /**
     * The human-readable tag label.
     */
    tagLabel: string;
    /**
     * The raw tag value bytes.
     */
    tagValue: Uint8Array;
};
/**
 * The data associated with a MIDI event. The concrete shape depends on the event `type`/`metaType`:
 * primitives are used for single-value events (Program Change / Channel Pressure as `number`, text meta events as `string`),
 * a `Uint8Array` for raw/unparsed payloads, and the named shapes above for structured events.
 */
export type EventData = string | number | Uint8Array | number[] | NoteData | ControllerData | PitchBendData | SongPositionData | SongSelectData | SysExData | SequenceNumberData | TempoData | SmpteOffsetData | TimeSignatureData | KeySignatureData | MLiveTagData;
export type MidiTrackEvent = {
    /**
     * The delta time of the MIDI event.
     */
    deltaTime: number;
    /**
     * The status byte / type of the event; may be `undefined` for an unrecognized running-status byte.
     */
    type?: number | undefined;
    /**
     * A human-readable label describing the event.
     */
    label?: string | undefined;
    /**
     * The data associated with the event.
     */
    data?: EventData | undefined;
    /**
     * The subtype of the meta event.
     */
    metaType?: number | undefined;
    /**
     * The length of the meta event data.
     */
    metaEventLength?: number | undefined;
    /**
     * The MIDI channel the event is for.
     */
    channel?: number | undefined;
    /**
     * The tag for the M-Live Tag event.
     */
    tag?: number | undefined;
};
export type Header = {
    /**
     * The type of the chunk (e.g., MThd, MTrk).
     */
    type: string;
    /**
     * The format of the MIDI file (header only).
     */
    format: number;
    /**
     * The number of tracks in the MIDI file (header only).
     */
    trackCount: number;
    /**
     * The time division of the MIDI file in ticks per quarter note (header only); undefined when the file uses SMPTE timing.
     */
    timeDivision?: number | undefined;
    /**
     * The SMPTE frames per second (header only); only set when the file uses SMPTE timing.
     */
    framesPerSecond?: number | undefined;
    /**
     * The number of ticks per SMPTE frame (header only); only set when the file uses SMPTE timing.
     */
    ticksPerFrame?: number | undefined;
    /**
     * The length of the chunk data.
     */
    chunkLength: number;
};
export type Track = {
    /**
     * The type of the chunk (e.g., MThd, MTrk).
     */
    type: string;
    /**
     * The length of the chunk data.
     */
    chunkLength: number;
    /**
     * The collection of events in the track.
     */
    events: MidiTrackEvent[];
};
export type UsedNote = {
    /**
     * The numeric value of the note.
     */
    noteNumber: number;
    /**
     * The human-readable note string.
     */
    noteString: string;
};
/**
 * Constructor options stored on an {@link AudioMIDI} instance.
 * @typedef {object} AudioMidiConstructorOptions
 * @property {number} [format] The MIDI format: 0, 1, or 2.
 * @property {number} [timeDivision] Ticks per quarter note.
 */
/**
 * @typedef {object} WritableNote
 * @property {number} ticks The delay in ticks until the next track.
 * @property {number} midiNote The MIDI note value.
 * @property {number} velocity The velocity of the note (0-127).
 * @property {number} length The length of the note in ticks.
 */
/**
 * @typedef {object} WritableTrack
 * @property {number} [bpm] The BPM of the track, when blank no tempo event will be added.
 * @property {Record<number, string>} [metaStringEvents] A key value collection of meta events to add where they key is the event type and the value is the data to add.
 * @property {WritableNote[]} [notes] A collection of notes to write on the track.
 */
/**
 * Note On / Note Off / Note Aftertouch data.
 * @typedef {object} NoteData
 * @property {number} note The MIDI note number (0-127).
 * @property {number} velocity The velocity of the note (0-127).
 * @property {number} [length] The length of the note in ticks; back-filled on the Note On when the matching Note Off is parsed.
 */
/**
 * Control Change data.
 * @typedef {object} ControllerData
 * @property {number} controller The controller number (0-127).
 * @property {number} value The controller value (0-127).
 * @property {string} [label] The human-readable controller label.
 */
/**
 * Pitch Bend data. `pitchValue` is the combined 14-bit value; `firstByte`/`secondByte` are the raw LSB/MSB bytes used when writing.
 * @typedef {object} PitchBendData
 * @property {number} pitchValue The combined 14-bit pitch value (0-16383).
 * @property {number} firstByte The least significant 7 bits (LSB).
 * @property {number} secondByte The most significant 7 bits (MSB).
 */
/**
 * Song Position Pointer data.
 * @typedef {object} SongPositionData
 * @property {number} msb The most significant byte.
 * @property {number} lsb The least significant byte.
 */
/**
 * Song Select data (write side).
 * @typedef {object} SongSelectData
 * @property {number} songNumber The song number to select.
 */
/**
 * System Exclusive data.
 * @typedef {object} SysExData
 * @property {number} manufacturerId The manufacturer's ID code.
 * @property {string} [manufacturerLabel] The manufacturer's label based on the ID.
 * @property {number[]} data The SysEx data bytes.
 */
/**
 * Meta Sequence Number data.
 * @typedef {object} SequenceNumberData
 * @property {number} sequenceNumber The sequence number.
 * @property {string} [type] How the sequence number was resolved (`Provided` or `Next Track Index`).
 */
/**
 * Meta Set Tempo data.
 * @typedef {object} TempoData
 * @property {number} byte1 The most significant tempo byte.
 * @property {number} byte2 The middle tempo byte.
 * @property {number} byte3 The least significant tempo byte.
 * @property {number} [tempo] Microseconds per quarter note.
 * @property {number} [bpm] The tempo in Beats Per Minute.
 */
/**
 * Meta SMPTE Offset data.
 * @typedef {object} SmpteOffsetData
 * @property {number} hourByte The raw hour byte (encodes both frame rate and hour).
 * @property {number} [hour] The hour (0-23).
 * @property {number} minute The minute (0-59).
 * @property {number} second The second (0-59).
 * @property {number} frame The frame (depends on the frame rate).
 * @property {number} subFrame The sub-frame (0-99).
 * @property {number | string} [frameRate] The decoded frame rate (24, 25, 29.97 or 30).
 */
/**
 * Meta Time Signature data.
 * @typedef {object} TimeSignatureData
 * @property {number} numerator The numerator of the time signature, the 3 in 3/4.
 * @property {number} denominator The denominator of the time signature, the 4 in 3/4.
 * @property {number} metronome The number of MIDI clocks in a metronome click.
 * @property {number} thirtySecondNotes The number of notated 32nd notes in a MIDI quarter note.
 */
/**
 * Meta Key Signature data. `keySignature` is signed: negative for flats, positive for sharps (-7 to 7).
 * @typedef {object} KeySignatureData
 * @property {number} keySignature The number of sharps (positive) or flats (negative), -7 to 7.
 * @property {number} majorOrMinor 0 for a major key, 1 for a minor key.
 * @property {string} [keyName] The human-readable key name (e.g., "C♯").
 * @property {string} [mode] The mode, "Major" or "Minor".
 */
/**
 * M-Live Tag data (non-standard meta event).
 * @typedef {object} MLiveTagData
 * @property {number} tag The tag byte.
 * @property {string} tagLabel The human-readable tag label.
 * @property {Uint8Array} tagValue The raw tag value bytes.
 */
/**
 * The data associated with a MIDI event. The concrete shape depends on the event `type`/`metaType`:
 * primitives are used for single-value events (Program Change / Channel Pressure as `number`, text meta events as `string`),
 * a `Uint8Array` for raw/unparsed payloads, and the named shapes above for structured events.
 * @typedef {string | number | Uint8Array | number[] | NoteData | ControllerData | PitchBendData | SongPositionData | SongSelectData | SysExData | SequenceNumberData | TempoData | SmpteOffsetData | TimeSignatureData | KeySignatureData | MLiveTagData} EventData
 */
/**
 * @typedef {object} MidiTrackEvent
 * @property {number} deltaTime The delta time of the MIDI event.
 * @property {number} [type] The status byte / type of the event; may be `undefined` for an unrecognized running-status byte.
 * @property {string} [label] A human-readable label describing the event.
 * @property {EventData} [data] The data associated with the event.
 * @property {number} [metaType] The subtype of the meta event.
 * @property {number} [metaEventLength] The length of the meta event data.
 * @property {number} [channel] The MIDI channel the event is for.
 * @property {number} [tag] The tag for the M-Live Tag event.
 */
/**
 * @typedef {object} Header
 * @property {string} type The type of the chunk (e.g., MThd, MTrk).
 * @property {number} format The format of the MIDI file (header only).
 * @property {number} trackCount The number of tracks in the MIDI file (header only).
 * @property {number} [timeDivision] The time division of the MIDI file in ticks per quarter note (header only); undefined when the file uses SMPTE timing.
 * @property {number} [framesPerSecond] The SMPTE frames per second (header only); only set when the file uses SMPTE timing.
 * @property {number} [ticksPerFrame] The number of ticks per SMPTE frame (header only); only set when the file uses SMPTE timing.
 * @property {number} chunkLength The length of the chunk data.
 */
/**
 * @typedef {object} Track
 * @property {string} type The type of the chunk (e.g., MThd, MTrk).
 * @property {number} chunkLength The length of the chunk data.
 * @property {MidiTrackEvent[]} events The collection of events in the track.
 */
/**
 * @typedef {object} UsedNote
 * @property {number} noteNumber The numeric value of the note.
 * @property {string} noteString The human-readable note string.
 */
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
    /**
     * Decodes and validates MIDI Header.
     * Checks for `MThd` header, reads the chunk length, format, track count, and PPQN (pulses per quarter note) / PPQ (pulses per quarter) / PQN (per quarter note) / TPQN (ticks per quarter note) / TPB (ticks per beat).
     *
     * Signature (Decimal): [77, 84, 104, 100, ...]
     * Signature (Hexadecimal): [4D, 54, 68, 64, ...]
     * Signature (ASCII): [M, T, h, d, ...]
     * @static
     * @param {Buffer|string|Uint8Array} chunk  Data Blob
     * @returns {Header} The decoded values.
     */
    static decodeHeader(chunk: Buffer | string | Uint8Array): Header;
    /**
     * Return the human readable controller name from the ID.
     * @param {number} controller The controller ID.
     * @returns {string} The human-readable controller name.
     * @see {@link https://www.mixagesoftware.com/en/midikit/help/ | MidiKit Help Controllers}
     * @see {@link https://midi.org/midi-1-0-control-change-messages | MIDI 1.0 Control Change Messages (Data Bytes)}
     * @static
     */
    static getControllerLabel(controller: number): string;
    /**
     * Return the human readable manufacturer name from the ID.
     * @param {number} manufacturerId The manufacturer ID.
     * @returns {string} The human-readable manufacturer name.
     * @see {@link https://www.mixagesoftware.com/en/midikit/help/HTML/manufacturers.html | MidiKit Help MIDI Manufacturers List}
     * @static
     */
    static getManufacturerLabel(manufacturerId: number): string;
    /**
     * Write a variable-length value.
     * @param {DataBuffer} dataBuffer The data buffer to write to.
     * @param {number} value The value to write as a variable-length quantity.
     * @static
     */
    static writeVariableLengthValue(dataBuffer: DataBuffer, value: number): void;
    /**
     * Write event data.
     * @param {DataBuffer} dataBuffer The data buffer to write to.
     * @param {Uint8Array | number[] | string} data The event data to write.
     * @static
     */
    static writeEventData(dataBuffer: DataBuffer, data: Uint8Array | number[] | string): void;
    /**
     * Generate a Set Tempo event with a provided BPM.
     * @param {number} bpm The desired tempo in Beats Per Minute.
     * @returns {MidiTrackEvent} The tempo event with the correct byte values.
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
     * @param {number} metaType The meta event type. (e.g., 0x03 for Track Name).
     * @param {string} data The string value for the event (e.g., the name of the track).
     * @returns {MidiTrackEvent} The meta string event with the encoded string data.
     * @static
     */
    static generateMetaStringEvent(metaType: number, data: string): MidiTrackEvent;
    /**
     * Generate an end of track event.
     * @returns {MidiTrackEvent} The end of track event.
     * @static
     */
    static generateEndOfTrackEvent(): MidiTrackEvent;
    /**
     * Convert a collection of tracks and notes into a new AudioMIDI instance.
     * @param {object} options The options
     * @param {number} [options.ppq] The pulses per quarter note, default is 480.
     * @param {number} [options.bpm] The BPM of the track, when blank no tempo event will be added.
     * @param {WritableTrack[]} [options.tracks] The MIDI tracks to write.
     * @param {number[]} [options.skipNotes] The MIDI notes to skip, if any.
     * @returns {AudioMIDI} The newly constructed MIDI
     * @static
     * @example
     * const midi = AudioMIDI.convertToMidi({
     *   bpm,
     *   ppq,
     *   tracks: [
     *     {
     *       notes: myCustomNotes.map((note) => {
     *         return {
     *           note: note.midiNote,
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
    static convertToMidi({ ppq, bpm, tracks, skipNotes }: {
        ppq?: number | undefined;
        bpm?: number | undefined;
        tracks?: WritableTrack[] | undefined;
        skipNotes?: number[] | undefined;
    }): AudioMIDI;
    /**
     * Convert a note string like `C1` or `D#2` to the MIDI value.
     * @param {string} noteString The notation string.
     * @param {number} [octaveOffset] The default octave offset for C1, where a value of 2 means C1 = 36; default is 2.
     * @param {Record<string, number>} [noteMap] The note map to use for the conversion.
     * @returns {number} The MIDI value for the provided note.
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
     * @param {number} midiValue The MIDI value (0-127).
     * @param {number} [octaveOffset] The default octave offset for C1, where a value of 2 means C1 = 36; default is 2.
     * @param {string[]} [noteNames] The note names to use for the conversion.
     * @returns {string} The note label corresponding to the MIDI value.
     * @example
     * AudioMIDI.midiToNote(72) === 'C4'
     * AudioMIDI.midiToNote(60) === 'C3'
     * AudioMIDI.midiToNote(48) === 'C2'
     * AudioMIDI.midiToNote(36) === 'C1'
     * AudioMIDI.midiToNote(12) === 'C-1'
     * AudioMIDI.midiToNote(0) === 'C-2'
     */
    static midiToNote(midiValue: number, octaveOffset?: number, noteNames?: string[]): string;
    /**
     * Creates a new AudioMIDI.
     * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} [input] The data to process.
     * @param {object} [options] Options for this AudioMIDI instance.
     * @param {number} [options.format] The MIDI format: 0, 1, or 2, default is 0.
     * @param {number} [options.timeDivision] The indication of how MIDI ticks should be translated into time, default is 480.
     * @class
     */
    constructor(input?: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array, options?: {
        format?: number | undefined;
        timeDivision?: number | undefined;
    });
    /** @type {number} The MIDI format: 0, 1, or 2 */
    format: number;
    /** @type {number} The internal track count. */
    trackCount: number;
    /** @type {number} The indication of how MIDI ticks should be translated into time (ticks per quarter note); `0` when the file uses SMPTE timing. */
    timeDivision: number;
    /** @type {number | undefined} The SMPTE frames per second; only set when the file uses SMPTE timing. */
    framesPerSecond: number | undefined;
    /** @type {number | undefined} The number of ticks per SMPTE frame; only set when the file uses SMPTE timing. */
    ticksPerFrame: number | undefined;
    /** @type {Track[]} The parsed (or to-be-written) chunks. */
    chunks: Track[];
    /** @type {AudioMidiConstructorOptions} */
    options: AudioMidiConstructorOptions;
    /**
     * Several different values in events are expressed as variable length quantities (e.g. delta time values).
     * A variable length value uses a minimum number of bytes to hold the value, and in most circumstances this leads to some degree of data compresssion.
     *
     * A variable length value uses the low order 7 bits of a byte to represent the value or part of the value.
     * The high order bit is an "escape" or "continuation" bit.
     * All but the last byte of a variable length value have the high order bit set.
     * The last byte has the high order bit cleared.
     * The bytes always appear most significant byte first.
     * @returns {number} The length of the next chunk.
     */
    readVariableLengthValues: () => number;
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
     * @param {Track} track - The track to add the event to.
     * @param {MidiTrackEvent | MidiTrackEvent[]} event - The event to add.
     */
    addEvent(track: Track, event: MidiTrackEvent | MidiTrackEvent[]): void;
    /**
     * Writes the MIDI data to a binary file.
     * @returns {DataBuffer} The binary data buffer.
     */
    saveToDataBuffer(): DataBuffer;
    /**
     * Write a track chunk to the data buffer.
     * @param {DataBuffer} dataBuffer The data buffer to write to.
     * @param {Track} chunk The track chunk to write.
     */
    writeChunk(dataBuffer: DataBuffer, chunk: Track): void;
    /**
     * Helper function to write an event to the data buffer.
     * @param {DataBuffer} dataBuffer The data buffer to write to.
     * @param {MidiTrackEvent} event The event to write.
     */
    writeEvent(dataBuffer: DataBuffer, event: MidiTrackEvent): void;
    /**
     * Returns a sorted list of all unique note numbers used in "Note On" events,
     * along with their note names (e.g. "C3", "D#4").
     * @returns {UsedNote[]} Array of note data
     */
    getUsedNotes(): UsedNote[];
    /**
     * Validate a MIDI instance for common issues.
     * Matching Note Ons / Offs: A `velocity > 0` "Note On" increments `activeNotes[note]`. A "Note Off" or "Note On" with `velocity == 0` decrements. If the count is already 0, that is invalid. At the end of the track, if any notes still have a positive count, that is also invalid.
     * Meta Events: We do a small switch on `event.metaType` to check if the declared metaEventLength is correct for well-known meta events (End of Track, Set Tempo, Time Signature, etc.).
     * Chunk Length: Since the parser already stored each chunk's `chunkLength`, we do minimal checks: if `chunkLength > 0` but there are zero events, or vice versa, that is unusual.
     * @returns {string[]} Array of warning / error messages discovered, an empty array if no issues are found.
     */
    validate(): string[];
}
import { DataBuffer } from '@uttori/data-tools';
//# sourceMappingURL=audio-midi.d.ts.map