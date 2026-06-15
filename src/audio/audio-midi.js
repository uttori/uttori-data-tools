/* eslint-disable no-bitwise */
import { DataBuffer, DataStream } from './../index.js';

/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */

/** @type {DebugLogger} */
let debug = () => {};
/* c8 ignore next */
if (process.env.UTTORI_AUDIOMIDI_DEBUG) { try { const { default: d } = await import('debug'); debug = d('Uttori.AudioMIDI'); } catch {} }

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
class AudioMIDI extends DataBuffer {
  /**
   * Creates a new AudioMIDI.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} [input] The data to process.
   * @param {object} [options] Options for this AudioMIDI instance.
   * @param {number} [options.format] The MIDI format: 0, 1, or 2, default is 0.
   * @param {number} [options.timeDivision] The indication of how MIDI ticks should be translated into time, default is 480.
   * @class
   */
  constructor(input, options = {}) {
    super(input);

    /** @type {number} The MIDI format: 0, 1, or 2 */
    this.format = options.format ?? 0;
    /** @type {number} The internal track count. */
    this.trackCount = 0;
    /** @type {number} The indication of how MIDI ticks should be translated into time (ticks per quarter note); `0` when the file uses SMPTE timing. */
    this.timeDivision = options.timeDivision ?? 480;
    /** @type {number | undefined} The SMPTE frames per second; only set when the file uses SMPTE timing. */
    this.framesPerSecond = undefined;
    /** @type {number | undefined} The number of ticks per SMPTE frame; only set when the file uses SMPTE timing. */
    this.ticksPerFrame = undefined;
    /** @type {Track[]} The parsed (or to-be-written) chunks. */
    this.chunks = [];

    /** @type {AudioMidiConstructorOptions} */
    this.options = {
      ...options,
    };
  }

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
  readVariableLengthValues = () => {
    let value = 0;
    let byte;
    // By shifting the current value left by 7 bits and adding the 7 least significant bits of the current byte,
    // we handle both single and multi-byte scenarios with minimal code.
    do {
      byte = this.readUInt8();
      value = (value << 7) + (byte & 0x7F);
    } while (byte & 0x80 && this.remainingBytes() > 0);

    return value;
  };

  /**
   * Parse a MIDI file from a Uint8Array.
   * @see {@link https://midi.org/expanded-midi-1-0-messages-list | Expanded MIDI 1.0 Messages List (Status Bytes)}
   * @see {@link https://midi.org/midi-1-0-universal-system-exclusive-messages | MIDI 1.0 Universal System Exclusive Messages}
   * @see {@link https://midi.org/dls-proprietary-chunk-ids | DLS Proprietary Chunk IDs}
   */
  parse() {
    debug('parse');
    const chunk = this.read(14);
    const header = AudioMIDI.decodeHeader(chunk);
    this.format = header.format;
    this.trackCount = header.trackCount;
    // `timeDivision` is undefined for SMPTE timing; fall back to 0 and expose the SMPTE fields instead.
    this.timeDivision = header.timeDivision ?? 0;
    this.framesPerSecond = header.framesPerSecond;
    this.ticksPerFrame = header.ticksPerFrame;

    /** @type {Map<number, { startTime: number, velocity: number, noteOnEvent: MidiTrackEvent }>} Store active notes and their start times. */
    const activeNotes = new Map();
    /** @type {number} Track the current time in ticks. */
    let currentTime = 0;

    // Parse the remaining tracks
    debug(`parse: Reading ${header.trackCount} Tracks`);
    for (let t = 0; t < header.trackCount; t++) {
      debug('parse: Reading Track:', t);
      if (this.remainingBytes() === 0) {
        debug(`parse: No more data to read, but ony read ${t} of ${header.trackCount} expected tracks.`);
        break;
      }
      /** @type {Track} */
      const track = {
        type: this.readString(4),
        chunkLength: this.readUInt32(),
        events: [],
      };
      if (track.type !== 'MTrk') {
        debug('parse: Invalid Track Header:', track.type);
        break;
      }

      // Bound this track's events by its declared `chunkLength` so multi-track (format 1 / 2) files
      // do not bleed the next `MTrk` header into the current track as garbage events.
      const trackEnd = this.offset + track.chunkLength;

      /** @type {number | undefined} The last status byte seen, for running status. */
      let laststatusByte;
      while (this.offset < trackEnd && this.remainingBytes() > 0) {
        /** @type {MidiTrackEvent} */
        const event = {};
        // Read the delta time.
        event.deltaTime = this.readVariableLengthValues();
        // Update current time based on delta time
        currentTime += event.deltaTime;

        // Read the event type
        /** @type {number | undefined} */
        let eventType = this.readUInt8();
        if (eventType >= 0x80) {
          // Next event type
          laststatusByte = eventType;
        } else {
          // Not an event, go back one.
          eventType = laststatusByte;
          // move back the pointer (cause readed byte is not status byte)
          this.rewind(1);
        }

        // debug('parse: Event:', { eventType: eventType.toString(16), remainingBytes: this.remainingBytes(), offset: this.offset.toString(16) });
        switch (eventType) {
          // System Exclusive Events
          case 0xF0: {
            const manufacturerId = this.readUInt8();

            // Get the manufacturer's label using the static method
            const manufacturerLabel = AudioMIDI.getManufacturerLabel(manufacturerId);

            // Initialize an array to store the SysEx data bytes
            /** @type {number[]} */
            const data = [];
            // Initialize the first byte
            let byte = this.readUInt8();
            // Read all data bytes until the End of Exclusive (EOX) marker (0xF7)
            while (byte !== 0xF7) {
              data.push(byte);
              byte = this.readUInt8(); // Read the next byte
            }

            event.data = {
              // The Manufacturer's ID code
              manufacturerId,
              // Manufacturer's label based on the ID
              manufacturerLabel,
              // Array of SysEx data bytes
              data,
            };
            break;
          }

          // Song Position Pointer
          case 0xF2: {
            const msb = this.readUInt8();
            const lsb = this.readUInt8();
            event.data = { msb, lsb };
            event.label = 'Song Position Pointer';
            break;
          }
          // System Common Messages - Song Select
          // The Song Select message is used with MIDI equipment, such as sequencers or drum machines, which can store and recall a number of different songs.
          // The Song Position Pointer is used to set a sequencer to start playback of a song at some point other than at the beginning.
          // The Song Position Pointer value is related to the number of MIDI clocks which would have elapsed between the beginning of the song and the desired point in the song.
          // This message can only be used with equipment which recognizes MIDI System Real Time Messages (MIDI Sync).
          case 0xF3: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Common Messages - Song Select';
            break;
          }
          // System Real Time Messages - Undefined (Reserved)
          case 0xF4: {
            debug('⚠️ System Real Time Messages - Undefined 0xF4 (Reserved)');
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Undefined 0xF4 (Reserved)';
            break;
          }
          // System Real Time Messages - Undefined (Reserved)
          case 0xF5: {
            debug('⚠️ System Real Time Messages - Undefined 0xF5 (Reserved)');
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Undefined 0xF5 (Reserved)';
            break;
          }
          // System Common Messages - Tune Request
          // The Tune Request message is generally used to request an analog synthesizer to retune its' internal oscillators.
          // This message is generally not needed with digital synthesizers.
          case 0xF6: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Common Messages - Tune Request';
            break;
          }
          // System Common Messages - EOX
          // The EOX message is used to flag the end of a System Exclusive message, which can include a variable number of data bytes.
          case 0xF7: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Common Messages - EOX';
            break;
          }
          // System Real Time Messages - MIDI Clock / Timing Clock
          // The Timing Clock message is the master clock which sets the tempo for playback of a sequence.
          // The Timing Clock message is sent 24 times per quarter note.
          // The Start, Continue, and Stop messages are used to control playback of the sequence.
          case 0xF8: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - MIDI Clock';
            break;
          }
          // System Real Time Messages - Undefined (Reserved)
          case 0xF9: {
            debug('⚠️ System Real Time Messages - Undefined 0xF9 (Reserved)');
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Undefined 0xF9 (Reserved)';
            break;
          }
          // System Real Time Messages - Start
          case 0xFA: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Start';
            break;
          }
          // System Real Time Messages - Continue
          case 0xFB: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Continue';
            break;
          }
          // System Real Time Messages - Stop
          case 0xFC: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Stop';
            break;
          }
          // System Real Time Messages - Undefined (Reserved)
          case 0xFD: {
            debug('⚠️ System Real Time Messages - Undefined 0xFD (Reserved)');
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Undefined 0xFD (Reserved)';
            break;
          }
          // System Real Time Messages - Active Sensing
          // The Active Sensing signal is used to help eliminate "stuck notes" which may occur if a MIDI cable is disconnected during playback of a MIDI sequence.
          // Without Active Sensing, if a cable is disconnected during playback, then some notes may be left playing indefinitely because they have been activated by a Note On message, but the corresponding Note Off message will never be received.
          case 0xFE: {
            const length = this.readVariableLengthValues();
            event.data = this.read(length);
            event.label = 'System Real Time Messages - Active Sensing';
            break;
          }
          // Meta Event
          case 0xFF: {
            // assign metaEvent code to array
            event.type = 0xFF;
            event.metaType = this.readUInt8();
            // get the metaEvent length
            event.metaEventLength = this.readVariableLengthValues();
            switch (event.metaType) {
              // Sequence Number
              // This optional event must occur at the beginning of a track (ie, before any non-zero time and before any midi events).
              // It specifies the sequence number.
              // The two data bytes ss ss, are that number which corresponds to the MIDI Cue message.
              // In a format 2 MIDI file, this number identifies each "pattern" (ie, track) so that a "song" sequence can use the MIDI Cue message to refer to patterns.
              // If the length is 0, then the track's location in the file is used. (ie, The first track chunk is sequence number 0.
              // The second track is sequence number 1. Etc).
              // In format 0 or 1, which contain only one "pattern" (even though format 1 contains several tracks), this event is placed in only the track.
              // So, a group of format 0 or 1 files with different sequence numbers can comprise a "song collection".
              // There can be only one of these events per track chunk in a Format 2.
              // There can be only one of these events in a Format 0 or 1, and it must be in the first track.
              case 0x00: {
                /** @type {number} */
                let sequenceNumber;

                // Check if the event contains two data bytes (ss ss)
                /** @type {string} */
                let type;
                if (event.metaEventLength === 2) {
                  const byte1 = this.readUInt8();
                  const byte2 = this.readUInt8();
                  // Combine the two bytes into the sequence number

                  sequenceNumber = (byte1 << 8) + byte2;
                  type = 'Provided';
                } else {
                  debug('parse: Sequence Number has an invalid length:', event.metaEventLength, this.offset.toString(16));
                  this.advance(1);
                  // If no sequence number is provided, use the track's location in the file
                  /* c8 ignore next -- defensive fallback; the track loop cannot run when trackCount is 0, so this branch is unreachable */
                  sequenceNumber = this.trackCount || 0; // Assuming `this.trackCount` keeps track of the current track's index
                  type = 'Next Track Index';
                }

                event.data = {
                  // The sequence number (either provided or based on track index)
                  sequenceNumber,
                  type,
                };
                event.label = 'Sequence Number';
                break;
              }
              // Text Event
              // This meta-event supplies an arbitrary Text string tagged to the Track and Time.
              case 0x01: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Text Event';
                break;
              }
              // Copyright Notice
              // The Text specifies copyright information for the sequence.
              // This is usually placed at time 0 of the first track in the sequence.
              case 0x02: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Copyright Notice';
                break;
              }
              // Sequence / Track Name
              // The Text specifies the title of the track or sequence.
              // The first Title meta-event in a type 0 MIDI file, or in the first track of a type 1 file gives the name of the work.
              // Subsequent Title meta-events in other tracks give the names of those tracks.
              case 0x03: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Sequence / Track Name';
                break;
              }
              // Instrument Name
              // The Text names the instrument intended to play the contents of this track.
              // This is usually placed at time 0 of the track.
              // Note that this meta-event is simply a description; MIDI synthesisers are not required (and rarely if ever) respond to it.
              // This meta-event is particularly useful in sequences prepared for synthesisers which do not conform to the General MIDI patch set, as it documents the intended instrument for the track when the sequence is used on a synthesiser with a different patch set.
              case 0x04: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Instrument Name';
                break;
              }
              // Lyrics
              // The Text gives a lyric intended to be sung at the given Time.
              // Lyrics are often broken down into separate syllables to time-align them more precisely with the sequence.
              case 0x05: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Lyrics';
                break;
              }
              // Marker
              // The Text marks a point in the sequence which occurs at the given Time, for example "Third Movement".
              case 0x06: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Marker';
                break;
              }
              // Cue Point
              // The Text identifies synchronisation point which occurs at the specified Time, for example, "Door slams".
              case 0x07: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Cue Point';
                break;
              }
              // Program Name
              // The name of the program (ie, patch) used to play the track.
              // This may be different than the Sequence / Track Name.
              // For example, maybe the name of your sequence (ie, track) is "Butterfly", but since the track is played upon an electric piano patch, you may also include a Program Name of "ELECTRIC PIANO".
              case 0x08: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Program Name';
                break;
              }
              // Device (Port) Name
              // The name of the MIDI device (port) where the track is routed.
              // This replaces the "MIDI Port" Meta-Event which some sequencers formally used to route MIDI tracks to various MIDI ports (in order to support more than 16 MIDI channels).
              // For example, assume that you have a MIDI interface that has 4 MIDI output ports.
              // They are listed as "MIDI Out 1", "MIDI Out 2", "MIDI Out 3", and "MIDI Out 4".
              // If you wished a particular track to use "MIDI Out 1" then you would put a Port Name Meta-event at the beginning of the track, with "MIDI Out 1" as the text.
              // All MIDI events that occur in the track, after a given Port Name event, will be routed to that port.
              // In a format 0 MIDI file, it would be permissible to have numerous Port Name events intermixed with MIDI events, so that the one track could address numerous ports.
              // But that would likely make the MIDI file much larger than it need be.
              // The Port Name event is useful primarily in format 1 MIDI files, where each track gets routed to one particular port.
              case 0x09: {
                event.data = this.readString(event.metaEventLength);
                event.label = 'Device (Port) Name';
                break;
              }
              // Channel Prefix
              // This event is considered obsolete and should not be used.
              // The MIDI channel (0-15) contained in this event may be used to associate a MIDI channel with all events which follow, including System exclusive and meta-events.
              // This channel is "effective" until the next normal MIDI event (which contains a channel) or the next MIDI Channel Prefix meta-event.
              // If MIDI channels refer to "tracks", this message may be put into a format 0 file, keeping their non-MIDI data associated with a track.
              case 0x20: {
                event.data = this.readUInt8();
                event.label = 'Channel Prefix';
                break;
              }
              // MIDI Port
              // This event is considered obsolete and should not be used.
              // This optional event which normally occurs at the beginning of a track (ie, before any non-zero time and before any midi events) specifies out of which MIDI Port (ie, buss) the MIDI events in the track go.
              // The data byte pp, is the port number, where 0 would be the first MIDI buss in the system.
              // The MIDI spec has a limit of 16 MIDI channels per MIDI input/output (ie, port, buss, jack, or whatever terminology you use to describe the hardware for a single MIDI input/output).
              // The MIDI channel number for a given event is encoded into the lowest 4 bits of the event's Status byte.
              // Therefore, the channel number is always 0 to 15.
              // Many MIDI interfaces have multiple MIDI input/output busses in order to work around limitations in the MIDI bandwidth (ie, allow the MIDI data to be sent/received more efficiently to/from several external modules), and to give the musician more than 16 MIDI Channels.
              // Also, some sequencers support more than one MIDI interface used for simultaneous input/output.
              // Unfortunately, there is no way to encode more than 16 MIDI channels into a MIDI status byte, so a method was needed to identify events that would be output on, for example, channel 1 of the second MIDI port versus channel 1 of the first MIDI port.
              // This MetaEvent allows a sequencer to identify which track events get sent out of which MIDI port.
              // The MIDI events following a MIDI Port MetaEvent get sent out that specified port.
              case 0x21: {
                event.data = this.readUInt8();
                event.label = 'MIDI Port';
                break;
              }
              // End of Track
              // This event is not optional.
              // It must be the last event in every track.
              // It's used as a definitive marking of the end of a track.
              // Only 1 per track.
              case 0x2F: {
                if (event.metaEventLength !== 0) {
                  debug('parse: End of Track has an invalid length:', event.metaEventLength, this.offset.toString(16));
                }
                event.data = '';
                event.label = 'End of Track';
                break;
              }
              // M-Live Tag (non-standard)
              // The text specifies meta tag information for the sequence. This is usually placed at time 0 of the first track in the sequence. The data byte tt specifies the tag:
              case 0x4B: {
                const tag = this.readUInt8();
                let tagLabel = '';
                switch (tag) {
                  case 0x01: tagLabel = 'Genre'; break;
                  case 0x02: tagLabel = 'Artist'; break;
                  case 0x03: tagLabel = 'Composer'; break;
                  case 0x04: tagLabel = 'Duration (seconds)'; break;
                  case 0x05: tagLabel = 'BPM (Tempo)'; break;
                  default: tagLabel = `Unknown Tag: ${tag}`;
                }
                const tagValue = this.read(event.metaEventLength);
                event.data = {
                  tag,
                  tagLabel,
                  tagValue,
                }
                event.label = 'M-Live Tag';
                break;
              }
              // Tempo
              case 0x51: {
                if (event.metaEventLength !== 3) {
                  debug('parse: Tempo has an invalid length:', event.metaEventLength);
                  event.data = this.read(event.metaEventLength);
                  break;
                }
                const byte1 = this.readUInt8();
                const byte2 = this.readUInt8();
                const byte3 = this.readUInt8();

                // Combine the three bytes to get the tempo in microseconds per quarter note
                const tempo = (byte1 << 16) + (byte2 << 8) + byte3;

                // Convert the tempo to beats per minute (BPM)
                const bpm = Math.round(60000000 / tempo);

                event.data = {
                  byte1,
                  byte2,
                  byte3,
                  // Microseconds per quarter note
                  tempo,
                  // Beats Per Minute
                  bpm,
                };
                event.label = 'Set Tempo';
                break;
              }
              // SMPTE Offset
              // This meta event is used to specify the SMPTE starting point offset from the beginning of the track.
              // It is defined in terms of hours, minutes, seconds, frames and sub-frames (always 100 sub-frames per frame, no matter what sub-division is specified in the MIDI header chunk).
              // In a format 1 file, the SMPTE OFFSET must be stored with the tempo map (ie, the first track), and has no meaning in any other track.
              // The hourByte is used to specify the hour offset also specifies the frame rate in the following format: 0rrhhhhh where rr is two bits for the frame rate where 00=24 fps, 01=25 fps, 10=30 fps (drop frame), 11=30 fps and hhhhh is five bits for the hour (0-23).
              // The hourByte's top bit is always 0.
              // The frame byte's possible range depends on the encoded frame rate in the hour byte.
              // A 25 fps frame rate means that a maximum value of 24 may be set for the frame byte.
              // The subFrame byte contains fractional frames in 100ths of a frame.
              case 0x54: {
                const hourByte = this.readUInt8(); // Read the hour byte (includes frame rate and hour)
                const minute = this.readUInt8(); // Read the minute byte
                const second = this.readUInt8(); // Read the second byte
                const frame = this.readUInt8(); // Read the frame byte
                const subFrame = this.readUInt8(); // Read the sub-frame byte

                // Extract frame rate from the hour byte (bits 6 and 7)
                // 0rrhhhhh -> rr = (hr >> 5) & 0x03
                const frameRateBits = (hourByte >> 5) & 0x03;
                /** @type {Record<number, number>} */
                const frameRates = {
                  0: 24, // 00 = 24 fps
                  1: 25, // 01 = 25 fps
                  2: 29.97, // 10 = 30 fps (drop frame)
                  3: 30, // 11 = 30 fps
                };
                /* c8 ignore next -- defensive fallback; frameRateBits is masked to 0-3 so a frame rate is always found */
                const frameRate = frameRates[frameRateBits] || `Unknown Frame Rate: ${frameRateBits}`;

                // Extract the hour from the remaining 5 bits (bits 0 to 4)
                const hour = hourByte & 0x1F; // 0rrhhhhh -> hhhhh = hr & 0x1F

                // Event data
                event.data = {
                  // The raw hour byte
                  hourByte,
                  // Hour (0-23)
                  hour,
                  // Minute (0-59)
                  minute,
                  // Second (0-59)
                  second,
                  // Frame (depends on frame rate)
                  frame,
                  // Sub-frame (0-99)
                  subFrame,
                  // Frame rate (24, 25, 29.97, 30)
                  frameRate,
                };
                event.label = 'SMPTE Offset';
                break;
              }
              // Time Signature
              // If there are no time signature events in a MIDI file, then the time signature is assumed to be 4/4.
              case 0x58: {
                event.data = {
                  // The numerator of the time signature, the 3 in 3/4.
                  numerator: this.readUInt8(),
                  // The denominator of the time signature, the 4 in 3/4.
                  denominator: this.readUInt8(),
                  // The number of MIDI clocks in a metronome click.
                  metronome: this.readUInt8(),
                  // The number of notated 32nd notes in a MIDI quarter note (24 MIDI clocks).
                  // This event allows a program to relate what MIDI thinks of as a quarter, to something entirely different.
                  thirtySecondNotes: this.readUInt8(),
                };
                event.label = 'Time Signature';
                break;
              }
              // Key Signature
              // The key signature is specified by the numeric 1st byte Key value, which is 0 for the key of C, a positive value for each sharp above C, or a negative value for each flat below C, thus in the inclusive range -7 to 7.
              // The Major/Minor 2nd byte is a number value which will be 0 for a major key and 1 for a minor key.
              case 0x59: {
                if (event.metaEventLength !== 2) {
                  debug('parse: Key Signature has an invalid length:', event.metaEventLength);
                  event.data = this.read(event.metaEventLength);
                  break;
                }
                // Read the sharps / flats byte as a signed value: flats are negative (two's complement), e.g. -1 === one flat.
                const keySignature = this.readInt8();
                // Read the major / minor byte
                const majorOrMinor = this.readUInt8();

                // Map the keySignature values to their respective key signatures
                /** @type {Record<string | number, string>} */
                const keys = {
                  '-7': 'C♭',
                  '-6': 'G♭',
                  '-5': 'D♭',
                  '-4': 'A♭',
                  '-3': 'E♭',
                  '-2': 'B♭',
                  '-1': 'F',
                  0: 'C',
                  1: 'G',
                  2: 'D',
                  3: 'A',
                  4: 'E',
                  5: 'B',
                  6: 'F♯',
                  7: 'C♯',
                };

                event.data = {
                  // The raw keySignature byte
                  keySignature,
                  // The raw majorOrMinor byte
                  majorOrMinor,
                  // The name of the key (e.g., "C♯")
                  keyName: keys[`${keySignature}`] || 'Unknown Key',
                  // The mode (Major or Minor)
                  mode: majorOrMinor === 0 ? 'Major' : 'Minor',
                };
                event.label = 'Key Signature';
                break;
              }
              // Sequencer Specific
              case 0x7F: {
                debug('Sequencer Specific is unimplemented');
                event.data = this.read(event.metaEventLength);
                event.label = 'Sequencer Specific';
                break;
              }
              default: {
                debug('Unimplemented 0xFF Meta Event', event.metaType.toString(16).toUpperCase(), this.offset.toString(16).toUpperCase());
                event.data = this.read(event.metaEventLength);
              }
            }
            break;
          }
          default: {
            // MIDI Control Events OR System Exclusive Events
            // Extract the event type (upper 4 bits)
            event.type = eventType;

            // `eventType` may be undefined for an unrecognized running-status byte; treat it as 0 for the bitwise math.
            const statusByte = eventType ?? 0;

            // Extract the channel (lower 4 bits)
            event.channel = statusByte & 0x0F;

            const type = (statusByte >> 4) & 0x0F;
            switch (type) {
              // Note Off
              // The Note Off Event is used to signal when a MIDI key is released.
              // These events have two parameters identical to a Note On event.
              // The note number specifies which of the 128 MIDI keys is being played and the velocity determines how fast/hard the key was released.
              // The note number is normally used to specify which previously pressed key is being released and the velocity is usually ignored, but is sometimes used to adjust the slope of an instrument's release phase.
              case 0x8: {
                const note = this.readUInt8();
                const velocity = this.readUInt8(); // Read and ignore velocity byte for Note Off

                const noteOnData = activeNotes.get(note);
                if (noteOnData) {
                  // Calculate the note length using the time since Note On
                  const noteLength = currentTime - noteOnData.startTime;

                  // Update the Note On event with the calculated length
                  /** @type {NoteData} */ (noteOnData.noteOnEvent.data).length = noteLength;

                  event.data = {
                    note,
                    velocity,
                    length: noteLength,
                  };

                  // Remove the note from active notes after processing
                  activeNotes.delete(note);
                } else {
                  event.data = {
                    note,
                    velocity,
                    length: 0,
                  };
                  debug('Missing Note On Event for:', note)
                }
                event.label = 'Note Off';
                break;
              }
              // Note On
              // The Note On Event is used to signal when a MIDI key is pressed.
              // This type of event has two parameters.
              // The note number that specifies which of the 128 MIDI keys is being played and the velocity determines how fast/hard the key is pressed.
              // The note number is normally used to specify the instruments musical pitch and the velocity is usually used to specify the instruments playback volume and intensity.
              case 0x9: {
                const note = this.readUInt8();
                const velocity = this.readUInt8();

                event.data = {
                  note,
                  velocity,
                };
                event.label = 'Note On';

                // Track the note start time and velocity in the activeNotes map
                activeNotes.set(note, { startTime: currentTime, velocity, noteOnEvent: event });
                break;
              }
              // Note Aftertouch
              // The Note Aftertouch Event is used to indicate a pressure change on one of the currently pressed MIDI keys.
              // It has two parameters.
              // The note number of which key's pressure is changing and the aftertouch value which specifies amount of pressure being applied (0 = no pressure, 127 = full pressure).
              // Note Aftertouch is used for extra expression of particular notes, often introducing or increasing some type of modulation during the instrument's sustain phase
              case 0xA: {
                event.data = {
                  note: this.readUInt8(),
                  velocity: this.readUInt8(),
                };
                event.label = 'Note Aftertouch';
                break;
              }
              // Controller
              // The Controller Event signals the change in a MIDI channels state.
              // There are 128 controllers which define different attributes of the channel including volume, pan, modulation, effects, and more.
              // This event type has two parameters.
              // The controller number specifies which control is changing and the controller value defines it's new setting.
              case 0xB: {
                const controller = this.readUInt8();
                const value = this.readUInt8();
                event.data = {
                  controller,
                  value,
                  label: AudioMIDI.getControllerLabel(controller),
                };
                event.label = 'Controller';
                break;
              }
              // Program Change
              // The Program Change Event is used to change which program (instrument/patch) should be played on the MIDI channel.
              // This type of event takes only one parameter, the program number of the new instrument / patch.
              case 0xC: {
                event.data = this.readUInt8();
                event.label = 'Program Change';
                break;
              }
              // Channel Aftertouch
              // The Channel Aftertouch Event is similar to the Note Aftertouch message, except it effects all keys currently pressed on the specific MIDI channel.
              // This type of event takes only one parameter, the aftertouch amount (0 = no pressure, 127 = full pressure).
              case 0xD: {
                event.data = this.readUInt8();
                event.label = 'Channel Aftertouch';
                break;
              }
              // Pitch Bend
              // The Pitch Bend Event is similar to a controller event, except that it is a unique MIDI Channel Event that has two bytes to describe it's value.
              // The pitch value is defined by both parameters of the MIDI Channel Event by joining them in the format of yyyyyyyxxxxxxx where the y characters represent the last 7 bits of the second parameter and the x characters represent the last 7 bits of the first parameter.
              // The combining of both parameters enables high accuracy values (0 - 16383).
              // The pitch value affects all playing notes on the current channel.
              // Values below 8192 decrease the pitch, while values above 8192 increase the pitch.
              // The pitch range may vary from instrument to instrument, but is usually +/-2 semi-tones.
              case 0xE: {
                // Read the first parameter byte (xxxxxxx)
                const firstByte = this.readUInt8();
                // Read the second parameter byte (yyyyyyy)
                const secondByte = this.readUInt8();
                // Combine the two bytes into a 14-bit pitch value
                const pitchValue = (secondByte << 7) + firstByte;
                event.data = {
                  // The combined pitch value (0 - 16383)
                  pitchValue,
                  // The raw first parameter byte
                  firstByte,
                  // The raw second parameter byte
                  secondByte,
                };
                event.label = 'Pitch Bend Event';
                break;
              }
              // System Exclusive Events
              case 0xF: {
                debug('Unimplemented 0xFx Exclusive Events:', /** @type {number} */ (event.type).toString(16));
                const length = this.readVariableLengthValues();
                event.data = this.read(length);
                break;
              }
              default: {
                debug('Unknown Exclusive Events:', event.type);
                break;
              }
            }
          }
        }
        // Useful for debugging uncommon events.
        // if (!['Note On', 'Note Off', 'End of Track', 'Controller'].includes(event.label)) {
        //   debug('Event:', event);
        // }
        track.events.push(event);
      }
      debug('Track Events:', track.events.length);
      this.chunks.push(track);
    }
    debug('Chunks:', this.chunks);
  }

  /**
   * Adds a new track to the MIDI file.
   * Keeps {@link AudioMIDI#trackCount} in sync so the header written by {@link AudioMIDI#saveToDataBuffer} matches the number of chunks.
   * @returns {Track} The new track.
   */
  addTrack() {
    const track = {
      type: 'MTrk',
      chunkLength: 0,
      events: [],
    };
    this.chunks.push(track);
    this.trackCount = this.chunks.length;
    return track;
  }

  /**
   * Adds an event to a track.
   * @param {Track} track - The track to add the event to.
   * @param {MidiTrackEvent | MidiTrackEvent[]} event - The event to add.
   */
  addEvent(track, event) {
    if (Array.isArray(event)) {
      track.events = [...track.events, ...event]
    } else {
      track.events.push(event);
    }
  }

  /**
   * Writes the MIDI data to a binary file.
   * @returns {DataBuffer} The binary data buffer.
   */
  saveToDataBuffer() {
    debug('saveToDataBuffer: chunks', this.chunks.length);
    const dataBuffer = new DataBuffer();

    // Write the header
    dataBuffer.writeString('MThd');
     // Header length is always 6
    dataBuffer.writeUInt32(6);
    dataBuffer.writeUInt16(this.format);
    dataBuffer.writeUInt16(this.trackCount);
    dataBuffer.writeUInt16(this.timeDivision);

    // Write each track
    for (const chunk of this.chunks) {
      this.writeChunk(dataBuffer, chunk);
    }
    dataBuffer.commit();
    return dataBuffer;
  }

  /**
   * Write a track chunk to the data buffer.
   * @param {DataBuffer} dataBuffer The data buffer to write to.
   * @param {Track} chunk The track chunk to write.
   */
  writeChunk(dataBuffer, chunk) {
    // Convert the chunk into binary data and write it to the buffer
    if (chunk.type === 'MTrk') {
      // Write the track chunk (MTrk)
      dataBuffer.writeString('MTrk');

      // Placeholder for chunk length
      const chunkLengthPosition = dataBuffer.offset;
      dataBuffer.writeUInt32(0);

      // Remember the start position of the events
      const startPosition = dataBuffer.offset;

      // Write each event and calculate the total size
      chunk.events.forEach((event) => {
        this.writeEvent(dataBuffer, event);
      });

      // Calculate the chunk length
      const endPosition = dataBuffer.offset;
      const chunkLength = endPosition - startPosition;

      debug('writeChunk: track size', chunkLength);

      // Move back to where the chunk length was initially written
      dataBuffer.seek(chunkLengthPosition);
      // Write the correct chunk length
      dataBuffer.writeUInt32(chunkLength);

      // Write the chunk length to the chunk object
      chunk.chunkLength = chunkLength;

      // Move back to the end of the buffer to continue writing
      dataBuffer.seek(endPosition);
    } else {
      debug('skipping unknown chunk type:', chunk.type)
    }
  }

  /**
   * Helper function to write an event to the data buffer.
   * @param {DataBuffer} dataBuffer The data buffer to write to.
   * @param {MidiTrackEvent} event The event to write.
   */
  writeEvent(dataBuffer, event) {
    const { deltaTime, metaType, metaEventLength, data, channel } = event;
    const type = /** @type {number} */ (event.type);

    // Channel Voice messages (0x80 - 0xEF) carry the channel in the low nibble.
    // `parse()` stores the full status byte in `type` (e.g. 0x91), so normalize to the base type (0x90) and re-apply the channel for a clean round-trip.
    const isChannelVoice = type >= 0x80 && type <= 0xEF;
    const baseType = isChannelVoice ? (type & 0xF0) : type;

    // Calculate the status byte for channel-specific events
    const statusByte = isChannelVoice ? (baseType | ((channel ?? 0) & 0x0F)) : type;

    if (!statusByte) {
      throw new Error(`Invalid status byte ${statusByte} for event: ${JSON.stringify(event)}`);
    }
    if (deltaTime === undefined) {
      throw new Error(`Invalid delta time for event: ${JSON.stringify(event)}`);
    }

    // Write the delta time as a variable length value
    AudioMIDI.writeVariableLengthValue(dataBuffer, deltaTime);
    // Write the status byte
    dataBuffer.writeUInt8(statusByte);

    // debug('writeEvent:', event);
    switch (baseType) {
      // Note Off
      case 0x80:
      // Note On
      case 0x90:
      // Polyphonic Key Pressure
      case 0xA0: {
        // These events have two data bytes: key and velocity / pressure
        const note = /** @type {NoteData | undefined} */ (data);
        if (note?.note === undefined) {
          throw new Error(`Invalid note value`);
        }
        if (note?.velocity === undefined) {
          throw new Error(`Invalid velocity / pressure value`);
        }
        AudioMIDI.writeEventData(dataBuffer, [note.note, note.velocity]);
        break;
      }
      case 0xB0: { // Control Change
        // Control Change events have two data bytes: controller number and value.
        // Matches the `{ controller, value }` shape produced by `parse()`; `0` is valid for both.
        const cc = /** @type {ControllerData | undefined} */ (data);
        if (cc?.controller === undefined || cc?.value === undefined) {
          throw new Error(`Invalid controller number or value: ${JSON.stringify(data)}`);
        }
        AudioMIDI.writeEventData(dataBuffer, [cc.controller, cc.value]);
        break;
      }
      case 0xC0: { // Program Change
        // `parse()` stores the program number directly as `event.data` (a number); `0` is a valid program.
        if (typeof data !== 'number') {
          throw new Error(`Invalid programNumber ${JSON.stringify(data)} for event ${JSON.stringify(event)}`);
        }
        // Program Change events have one data byte: the program number
        AudioMIDI.writeEventData(dataBuffer, [data]);
        break;
      }
      case 0xD0: { // Channel Pressure
        // `parse()` stores the pressure amount directly as `event.data` (a number); `0` is valid.
        if (typeof data !== 'number') {
          throw new Error(`Invalid pressureAmount ${JSON.stringify(data)} for event ${JSON.stringify(event)}`);
        }
        // Channel Pressure events have one data byte: the pressure amount
        AudioMIDI.writeEventData(dataBuffer, [data]);
        break;
      }
      case 0xE0: { // Pitch Bend
        // Pitch Bend events have two data bytes, matching the `{ firstByte, secondByte }` produced by `parse()`.
        // `firstByte` is the LSB (xxxxxxx), `secondByte` is the MSB (yyyyyyy); `0` is valid for both.
        const pitchBend = /** @type {PitchBendData | undefined} */ (data);
        const firstByte = pitchBend?.firstByte;
        const secondByte = pitchBend?.secondByte;
        if (firstByte === undefined || secondByte === undefined) {
          throw new Error(`Invalid pitch bend bytes firstByte ${firstByte} or secondByte ${secondByte} for event ${JSON.stringify(data)}`);
        }
        AudioMIDI.writeEventData(dataBuffer, [firstByte, secondByte]);
        break;
      }
      case 0xF0: { // SysEx Event
        const sysex = /** @type {SysExData | undefined} */ (data);
        if (!sysex?.manufacturerId || !sysex?.data) {
          throw new Error(`Invalid manufacturerId or data for event ${JSON.stringify(data)}`);
        }
        dataBuffer.writeUInt8(sysex.manufacturerId);
        AudioMIDI.writeEventData(dataBuffer, sysex.data);
        dataBuffer.writeUInt8(0xF7); // EOX
        break;
      }
      case 0xF3: { // Song Select
        // `0` is a valid song number, so check for presence rather than truthiness.
        const songSelect = /** @type {SongSelectData | undefined} */ (data);
        if (songSelect?.songNumber === undefined) {
          throw new Error(`Invalid songNumber ${songSelect?.songNumber} for event ${JSON.stringify(data)}`);
        }
        AudioMIDI.writeEventData(dataBuffer, [songSelect.songNumber]);
        break;
      }
      case 0xF6: { // Tune Request
        // No additional data for Tune Request
        break;
      }
      case 0xF7: { // End of SysEx
        // No additional data for End of SysEx
        break;
      }
      case 0xF8: // MIDI Clock
      case 0xFA: // Start
      case 0xFB: // Continue
      case 0xFC: // Stop
      case 0xFE: { // Active Sensing
        // No additional data for these real-time messages
        break;
      }
      case 0xFF: { // Meta Event
        dataBuffer.writeUInt8(/** @type {number} */ (metaType)); // Write the metaType
        AudioMIDI.writeVariableLengthValue(dataBuffer, /** @type {number} */ (metaEventLength)); // Write the length

        switch (metaType) {
          // Sequence Number
          case 0x00: {
            const sequence = /** @type {SequenceNumberData | undefined} */ (data);
            if (sequence?.sequenceNumber === undefined) {
              throw new Error(`Invalid sequenceNumber ${sequence?.sequenceNumber} for event ${JSON.stringify(data)}`);
            }
            AudioMIDI.writeEventData(dataBuffer, [sequence.sequenceNumber >> 8, sequence.sequenceNumber & 0xFF]);
            break;
          }
          case 0x01: // Text Event
          case 0x02: // Copyright Notice
          case 0x03: // Sequence / Track Name
          case 0x04: // Instrument Name
          case 0x05: // Lyrics
          case 0x06: // Marker
          case 0x07: // Cue Point
          case 0x08: // Program Name
          case 0x09: { // Device (Port) Name
            if (!data) {
              throw new Error(`Invalid text data ${data} for event ${JSON.stringify(data)}`);
            }
            AudioMIDI.writeEventData(dataBuffer, /** @type {string} */ (data));
            break;
          }
          case 0x20: // MIDI Channel Prefix
          case 0x21: { // MIDI Port
            // `0` is a valid channel / port number, so check for presence rather than truthiness.
            if (data === undefined || data === null) {
              throw new Error(`Invalid data ${data} for event ${JSON.stringify(data)}`);
            }
            dataBuffer.writeUInt8(/** @type {number} */ (data));
            break;
          }
          case 0x2F: { // End of Track
            // No data to write for End of Track, just ensure the length is 0
            break;
          }
          case 0x51: { // Set Tempo
            const tempo = /** @type {TempoData | undefined} */ (data);
            if (!tempo) {
              throw new Error(`Invalid data for event ${JSON.stringify(data)}`);
            }
            const { byte1, byte2, byte3 } = tempo;
            AudioMIDI.writeEventData(dataBuffer, [byte1, byte2, byte3]);
            break;
          }
          case 0x54: { // SMPTE Offset
            const smpte = /** @type {SmpteOffsetData | undefined} */ (data);
            if (!smpte) {
              throw new Error(`Invalid data for event ${JSON.stringify(data)}`);
            }
            const { hourByte, minute, second, frame, subFrame } = smpte;
            AudioMIDI.writeEventData(dataBuffer, [hourByte, minute, second, frame, subFrame]);
            break;
          }
          case 0x58: { // Time Signature
            const timeSignature = /** @type {TimeSignatureData | undefined} */ (data);
            const { numerator, denominator, metronome, thirtySecondNotes } = timeSignature ?? {};
            // `0` is a legitimate value for these fields, so check for presence rather than truthiness.
            if (numerator === undefined || denominator === undefined || metronome === undefined || thirtySecondNotes === undefined) {
              throw new Error(`Invalid numerator ${numerator} or denominator ${denominator} or metronome ${metronome} or thirtySecondNotes ${thirtySecondNotes} for event ${JSON.stringify(data)}`);
            }
            AudioMIDI.writeEventData(dataBuffer, [numerator, denominator, metronome, thirtySecondNotes]);
            break;
          }
          case 0x59: { // Key Signature
            const keySignatureData = /** @type {KeySignatureData | undefined} */ (data);
            const { keySignature, majorOrMinor } = keySignatureData ?? {};
            // C Major is `keySignature: 0, majorOrMinor: 0`, and flats are negative, so check for presence rather than truthiness.
            if (keySignature === undefined || majorOrMinor === undefined) {
              throw new Error(`Invalid keySignature ${keySignature} or majorOrMinor ${majorOrMinor} for event ${JSON.stringify(data)}`);
            }
            // `keySignature` may be negative (flats); `writeUInt8` writes the two's-complement byte.
            AudioMIDI.writeEventData(dataBuffer, [keySignature, majorOrMinor]);
            break;
          }
          case 0x7F: { // Sequencer Specific Meta-Event
            if (!data) {
              throw new Error(`Invalid data ${data} for event ${JSON.stringify(data)}`);
            }
            AudioMIDI.writeEventData(dataBuffer, /** @type {Uint8Array | number[]} */ (data));
            break;
          }
          default: {
            debug(`Unhandled Meta Event Type: ${/** @type {number} */ (metaType).toString(16).toUpperCase()}`);
            break;
          }
        }
        break;
      }
      default: {
        debug(`Unhandled Event Type: ${type.toString(16).toUpperCase()}`);
        break;
      }
    }
  }

  /**
   * Returns a sorted list of all unique note numbers used in "Note On" events,
   * along with their note names (e.g. "C3", "D#4").
   * @returns {UsedNote[]} Array of note data
   */
  getUsedNotes() {
    /** @type {Set<number>} */
    const noteNumbers = new Set();

    // Gather all note-on events (with velocity > 0) from all tracks
    for (const track of this.chunks) {
      // Match Note On (0x9n) on any of the 16 channels, not just channel 0.
      /** @type {MidiTrackEvent[]} */
      const noteEvents = track.events.filter((event) => ((event.type ?? 0) & 0xF0) === 0x90)
      for (const event of noteEvents) {
        if (typeof event.data === 'object' && 'velocity' in event.data && event.data?.velocity > 0) {
          // event.data.note might be a string or number, so ensure we parse
          const noteNumber = typeof event.data.note === 'string'
            ? parseInt(event.data.note, 10)
            : event.data.note;

          if (!Number.isNaN(noteNumber)) {
            noteNumbers.add(noteNumber);
          }
        }
      }
    }

    // Convert the set to an array and sort numerically
    const sortedNoteNumbers = [...noteNumbers].sort((a, b) => a - b);

    // Return array of { noteNumber, noteString }
    return sortedNoteNumbers.map((noteNumber) => ({
      noteNumber,
      noteString: AudioMIDI.midiToNote(noteNumber),
    }));
  }

  /**
   * Validate a MIDI instance for common issues.
   * Matching Note Ons / Offs: A `velocity > 0` "Note On" increments `activeNotes[note]`. A "Note Off" or "Note On" with `velocity == 0` decrements. If the count is already 0, that is invalid. At the end of the track, if any notes still have a positive count, that is also invalid.
   * Meta Events: We do a small switch on `event.metaType` to check if the declared metaEventLength is correct for well-known meta events (End of Track, Set Tempo, Time Signature, etc.).
   * Chunk Length: Since the parser already stored each chunk's `chunkLength`, we do minimal checks: if `chunkLength > 0` but there are zero events, or vice versa, that is unusual.
   * @returns {string[]} Array of warning / error messages discovered, an empty array if no issues are found.
   */
  validate() {
    /** @type {string[]} */
    const issues = [];

    // Basic Header Checks
    if (this.format < 0 || this.format > 2) {
      issues.push(`Unsupported MIDI format: ${this.format}.`);
    }
    if (this.trackCount !== this.chunks.length) {
      issues.push(`Header trackCount=${this.trackCount}, but parsed chunk count=${this.chunks.length}.`);
    }

    // Per-Chunk Checks
    this.chunks.forEach((track, trackIndex) => {
      // Check chunk type
      if (track.type !== 'MThd' && track.type !== 'MTrk') {
        issues.push(`Track ${trackIndex} has unknown chunk type: "${track.type}".`);
      }

      // If chunkLength is zero but track has events, or vice versa
      if (track.type === 'MTrk') {
        if (track.chunkLength === 0 && track.events.length > 0) {
          issues.push(`Track ${trackIndex} chunkLength=0 but has ${track.events.length} events.`);
        } else if (track.chunkLength > 0 && track.events.length === 0) {
          issues.push(`Track ${trackIndex} chunkLength=${track.chunkLength} but has 0 events.`);
        }
      }

      // Track-by-Track Validation
      if (track.type !== 'MTrk') {
        // Skip non-track chunks like the main header
        return;
      }

      // For matching Note Ons / Offs.
      /** @type {Map<number, number>} noteNumber, how many times it is currently "On" */
      const activeNotes = new Map();
      let gotEndOfTrack = false;

      track.events.forEach((event, eventIndex) => {
        // Delta time must be >= 0
        if (event.deltaTime < 0) {
          issues.push(`Track ${trackIndex} event ${eventIndex} has negative deltaTime ${event.deltaTime}.`);
        }

        // Check well-formed event data.
        // Channel Voice messages (0x80 - 0xEF) embed the channel in the low nibble, so normalize to the base type to match all 16 channels.
        const statusByte = /** @type {number} */ (event.type);
        const eventBaseType = statusByte >= 0x80 && statusByte <= 0xEF ? (statusByte & 0xF0) : statusByte;
        switch (eventBaseType) {
          // Note On
          case 0x90: {
            const noteData = /** @type {NoteData | undefined} */ (event.data);
            if (!noteData || noteData.note === undefined || noteData.velocity === undefined) {
              issues.push(`Track ${trackIndex} event ${eventIndex} missing note/velocity data: ${JSON.stringify(event.data)}`);
            } else {
              const noteOnNumber = parseInt(`${noteData.note}`, 10);
              // If velocity > 0, it is a real Note On
              if (noteData.velocity > 0) {
                const count = activeNotes.get(noteOnNumber) || 0;
                activeNotes.set(noteOnNumber, count + 1);
              }
              // If velocity = 0, treat it like a Note Off
              else {
                const count = activeNotes.get(noteOnNumber) || 0;
                if (count <= 0) {
                  issues.push(`Track ${trackIndex} event ${eventIndex} tries to Note Off note ${noteOnNumber} which was not active.`);
                } else {
                  activeNotes.set(noteOnNumber, count - 1);
                }
              }
            }
            break;
          }

          // Note Off
          case 0x80: {
            const noteData = /** @type {NoteData | undefined} */ (event.data);
            if (!noteData || noteData.note === undefined) {
              issues.push(`Track ${trackIndex} event ${eventIndex} missing note for Note Off: ${JSON.stringify(event.data)}`);
            } else {
              const noteOffNumber = parseInt(`${noteData.note}`, 10);
              const count = activeNotes.get(noteOffNumber) || 0;
              if (count <= 0) {
                issues.push(`Track ${trackIndex} event ${eventIndex} tries to Note Off note ${noteOffNumber} which was not active.`);
              } else {
                activeNotes.set(noteOffNumber, count - 1);
              }
            }
            break;
          }

          // Meta Event
          case 0xFF:
            if (typeof event.metaType === 'undefined') {
              issues.push(`Track ${trackIndex} event ${eventIndex} has missing metaType: ${JSON.stringify(event)}`);
              break;
            }

            // Basic length checks for common meta events
            switch (event.metaType) {
              case 0x2F: // End of Track
                gotEndOfTrack = true;
                if (event.metaEventLength !== 0) {
                  issues.push(`Track ${trackIndex} event ${eventIndex} End-of-Track has metaEventLength=${event.metaEventLength}, expected=0`);
                }
                break;
              case 0x51: // Tempo
                if (event.metaEventLength !== 3) {
                  issues.push(`Track ${trackIndex} event ${eventIndex} Tempo event has metaEventLength=${event.metaEventLength}, expected=3`);
                }
                break;
              case 0x58: // Time Signature
                if (event.metaEventLength !== 4) {
                  issues.push(`Track ${trackIndex} event ${eventIndex} Time Signature has metaEventLength=${event.metaEventLength}, expected=4`);
                }
                break;
              case 0x59: // Key Signature
                if (event.metaEventLength !== 2) {
                  issues.push(`Track ${trackIndex} event ${eventIndex} Key Signature has metaEventLength=${event.metaEventLength}, expected=2`);
                }
                break;
              case 0x54: // SMPTE Offset
                if (event.metaEventLength !== 5) {
                  issues.push(`Track ${trackIndex} event ${eventIndex} SMPTE Offset has metaEventLength=${event.metaEventLength}, expected=5`);
                }
                break;
              case 0x00: // Sequence Number
                // Usually length=2 or 0
                if (event.metaEventLength !== 2 && event.metaEventLength !== 0) {
                  issues.push(`Track ${trackIndex} event ${eventIndex} Sequence Number has metaEventLength=${event.metaEventLength}, expected=2 or 0`);
                }
                break;
              default:
                // Unknown or variable-length meta event, no strict check by default
                break;
            }
            break;

          // Could also validate Program Change, Controller events, etc.
          // But it's optional for many users
          default:
            // No extra checks by default
            break;
        }
      });

      // Must have an End-of-Track
      if (!gotEndOfTrack) {
        issues.push(`Track ${trackIndex} missing End-of-Track (0xFF 2F) event.`);
      }

      // No leftover active notes
      for (const [noteNum, count] of activeNotes.entries()) {
        if (count > 0) {
          issues.push(`Track ${trackIndex} has ${count} unmatched Note On for note ${noteNum}.`);
        }
      }
    });

    return issues;
  }

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
  static decodeHeader(chunk) {
    debug('decodeHeader: length =', chunk.length);
    const header = DataStream.fromData(chunk);
    const type = header.readString(4);
    const chunkLength = header.readUInt32();
    const format = header.readUInt16();
    const trackCount = header.readUInt16();

    // get Time Division first byte
    const timeDivisionByte1 = header.readUInt8();
    // get Time Division second byte
    const timeDivisionByte2 = header.readUInt8();

    // Check the Time Division Mode (FPS or PPQN); each is only set in one branch, so they remain `undefined` otherwise.
    /** @type {number | undefined} */
    let timeDivision;
    /** @type {number | undefined} */
    let framesPerSecond;
    /** @type {number | undefined} */
    let ticksPerFrame;
    if (timeDivisionByte1 >= 128) {
      // frames per second MODE (1st byte)
      framesPerSecond = timeDivisionByte1 - 128;
      // ticks in each frame (2nd byte)
      ticksPerFrame = timeDivisionByte2;
    } else {
      // PPQN
      timeDivision = (timeDivisionByte1 * 256) + timeDivisionByte2;
    }

    const output = {
      type,
      chunkLength,
      format,
      trackCount,
      framesPerSecond,
      ticksPerFrame,
      timeDivision,
    };
    debug('decodeHeader:', output);
    return output;
  }

  /**
   * Return the human readable controller name from the ID.
   * @param {number} controller The controller ID.
   * @returns {string} The human-readable controller name.
   * @see {@link https://www.mixagesoftware.com/en/midikit/help/ | MidiKit Help Controllers}
   * @see {@link https://midi.org/midi-1-0-control-change-messages | MIDI 1.0 Control Change Messages (Data Bytes)}
   * @static
   */
  static getControllerLabel(controller) {
    switch (controller) {
      case 0x00: return 'Bank Select (MSB)';
      case 0x01: return 'Modulation Wheel (MSB)';
      case 0x02: return 'Breath Controller (MSB)';
      case 0x04: return 'Foot Controller (MSB)';
      case 0x05: return 'Portamento Time (MSB)';
      case 0x06: return 'Data Entry (MSB)';
      case 0x07: return 'Volume (MSB)';
      case 0x08: return 'Balance (MSB)';
      case 0x0A: return 'Pan (MSB)';
      case 0x0B: return 'Expression Controller (MSB)';
      case 0x0C: return 'Effect Control 1 (MSB)';
      case 0x0D: return 'Effect Control 2 (MSB)';
      case 0x10: return 'General Purpose Controller 1 (MSB)';
      case 0x11: return 'General Purpose Controller 2 (MSB)';
      case 0x12: return 'General Purpose Controller 3 (MSB)';
      case 0x13: return 'General Purpose Controller 4 (MSB)';
      case 0x20: return 'Bank Select (LSB)';
      case 0x21: return 'Modulation Wheel (LSB)';
      case 0x22: return 'Breath Controller (LSB)';
      case 0x24: return 'Foot Controller (LSB)';
      case 0x25: return 'Portamento Time (LSB)';
      case 0x26: return 'Data Entry (LSB)';
      case 0x27: return 'Volume (LSB)';
      case 0x28: return 'Balance (LSB)';
      case 0x2A: return 'Pan (LSB)';
      case 0x2B: return 'Expression Controller (LSB)';
      case 0x2C: return 'Effect Control 1 (LSB)';
      case 0x2D: return 'Effect Control 2 (LSB)';
      case 0x30: return 'General Purpose Controller 1 (LSB)';
      case 0x31: return 'General Purpose Controller 2 (LSB)';
      case 0x32: return 'General Purpose #3 LSB';
      case 0x33: return 'General Purpose #4 LSB';
      case 0x40: return 'Hold Pedal #1';
      case 0x41: return 'Portamento (GS)';
      case 0x42: return 'Sostenuto (GS)';
      case 0x43: return 'Soft Pedal (GS)';
      case 0x44: return 'Legato Pedal';
      case 0x45: return 'Hold Pedal #2';
      case 0x46: return 'Sound Variation';
      case 0x47: return 'Sound Timbre';
      case 0x48: return 'Sound Release Time';
      case 0x49: return 'Sound Attack Time';
      case 0x4A: return 'Sound Brightness';
      case 0x4B: return 'Sound Control #6';
      case 0x4C: return 'Sound Control #7';
      case 0x4D: return 'Sound Control #8';
      case 0x4E: return 'Sound Control #9';
      case 0x4F: return 'Sound Control #10';
      case 0x50: return 'GP Control #5';
      case 0x51: return 'GP Control #6';
      case 0x52: return 'GP Control #7';
      case 0x53: return 'GP Control #8';
      case 0x54: return 'Portamento Control (GS)';
      case 0x5B: return 'Reverb Level (GS)';
      case 0x5C: return 'Tremolo Depth';
      case 0x5D: return 'Chorus Level (GS)';
      case 0x5E: return 'Celeste Depth';
      case 0x5F: return 'Phaser Depth';
      case 0x60: return 'Data Increment';
      case 0x61: return 'Data Decrement';
      case 0x62: return 'NRPN Parameter LSB (GS)';
      case 0x63: return 'NRPN Parameter MSB (GS)';
      case 0x64: return 'RPN Parameter LSB';
      case 0x65: return 'RPN Parameter MSB';
      case 0x78: return 'All Sound Off (GS)';
      case 0x79: return 'Reset All Controllers';
      case 0x7A: return 'Local On/Off';
      case 0x7B: return 'All Notes Off';
      case 0x7C: return 'Omni Mode Off';
      case 0x7D: return 'Omni Mode On';
      case 0x7E: return 'Mono Mode On';
      case 0x7F: return 'Poly Mode On';
      default: return `Unknown Controller: ${controller}`;
    }
  }

  /**
   * Return the human readable manufacturer name from the ID.
   * @param {number} manufacturerId The manufacturer ID.
   * @returns {string} The human-readable manufacturer name.
   * @see {@link https://www.mixagesoftware.com/en/midikit/help/HTML/manufacturers.html | MidiKit Help MIDI Manufacturers List}
   * @static
   */
  static getManufacturerLabel(manufacturerId) {
    /** @type {Record<number, string>} */
    const manufacturers = {
      0x01: 'Sequential Circuits',
      0x02: 'Big Briar',
      0x03: 'Octave/Plateau',
      0x04: 'Moog',
      0x05: 'Passport Designs',
      0x06: 'Lexicon',
      0x07: 'Kurzweil',
      0x08: 'Fender',
      0x09: 'Gulbransen',
      0x0A: 'Delta Labs',
      0x0B: 'Sound Comp',
      0x0C: 'General Electro',
      0x0D: 'Matthews Research',
      0x0E: 'Effect control 2',
      0x10: 'Oberheim',
      0x11: 'PAIA',
      0x12: 'Simmons',
      0x13: 'DigiDesign',
      0x14: 'Fairlight',
      0x15: 'JL Cooper',
      0x16: 'Lowery',
      0x17: 'Lin',
      0x18: 'Emu',
      0x1B: 'Peavey',
      0x20: 'BonTempi',
      0x21: 'S.I.E.L.',
      0x23: 'SyntheAxe',
      0x24: 'Hohner',
      0x25: 'Crumar',
      0x26: 'Solton',
      0x27: 'Jellinghaus Ms',
      0x28: 'CTS',
      0x29: 'PPG',
      0x2F: 'Elka',
      0x36: 'Cheetah',
      0x3E: 'Waldorf',
      0x40: 'Kawai',
      0x41: 'Roland',
      0x42: 'Korg',
      0x43: 'Yamaha',
      0x44: 'Casio',
      0x46: 'Kamiya Studio',
      0x47: 'Akai',
      0x48: 'Victor',
      0x4B: 'Fujitsu',
      0x4C: 'Sony',
      0x4E: 'Teac',
      0x50: 'Matsushita',
      0x51: 'Fostex',
      0x52: 'Zoom',
      0x54: 'Matsushita',
      0x55: 'Suzuki',
      0x56: 'Fuji Sound',
      0x57: 'Acoustic Technical Laboratory',
      0x7E: 'Universal Non Realtime Message (UNRT)',
      0x7F: 'Universal Realtime Message (URT)',
    };

    return manufacturers[manufacturerId] || `Unknown Manufacturer: ${manufacturerId.toString(16).toUpperCase()}`;
  }

  /**
   * Write a variable-length value.
   * @param {DataBuffer} dataBuffer The data buffer to write to.
   * @param {number} value The value to write as a variable-length quantity.
   * @static
   */
  static writeVariableLengthValue(dataBuffer, value) {
    value = Math.round(value);
    const buffer = [];
    do {
      buffer.push(value & 0x7F);

      value >>= 7;
    } while (value > 0);

    while (buffer.length > 1) {
      dataBuffer.writeUInt8(/** @type {number} */ (buffer.pop()) | 0x80);
    }
    dataBuffer.writeUInt8(/** @type {number} */ (buffer.pop()));
  }

  /**
   * Write event data.
   * @param {DataBuffer} dataBuffer The data buffer to write to.
   * @param {Uint8Array | number[] | string} data The event data to write.
   * @static
   */
  static writeEventData(dataBuffer, data) {
    if (data instanceof Uint8Array) {
      dataBuffer.writeBytes(data);
    } else if (Array.isArray(data)) {
      if (data.some((byte) => byte === undefined)) {
        throw new Error(`Invalid data: ${JSON.stringify(data)}`);
      }
      data.forEach((byte) => dataBuffer.writeUInt8(byte));
    } else if (typeof data === 'string') {
      dataBuffer.writeBytes(new TextEncoder().encode(data));
    } else {
      debug(`Invalid writeEventData:`, data)
      throw new Error(`Invalid writeEventData: ${JSON.stringify(data)}`);
    }
  }

  /**
   * Generate a Set Tempo event with a provided BPM.
   * @param {number} bpm The desired tempo in Beats Per Minute.
   * @returns {MidiTrackEvent} The tempo event with the correct byte values.
   * @static
   */
  static generateTempoEvent(bpm) {
    // Convert BPM to microseconds per quarter note
    const tempo = Math.round(60000000 / bpm);

    // Extract byte1, the most significant byte
    const byte1 = (tempo >> 16) & 0xFF;

    // Extract byte2, the middle byte
    const byte2 = (tempo >> 8) & 0xFF;

    // Extract byte3, the least significant byte
    const byte3 = tempo & 0xFF;

    return {
      // Tempo events have a delta time of 0
      deltaTime: 0,
      // Meta Event
      type: 0xFF,
      // Set Tempo
      metaType: 0x51,
      // Length is always 3 for Set Tempo events
      metaEventLength: 3,
      data: {
        byte1,
        byte2,
        byte3,
        // Microseconds per quarter note
        tempo,
        // Beats Per Minute
        bpm,
      },
      label: 'Set Tempo',
    };
  }

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
  static generateMetaStringEvent(metaType, data) {
    const metaEventLength = new TextEncoder().encode(data).length; // Length of the encoded string

    /** @type {Record<number, string>} */
    const labels = {
      0x01: 'Text Event',
      0x02: 'Copyright Notice',
      0x03: 'Sequence / Track Name',
      0x04: 'Instrument Name',
      0x05: 'Lyrics',
      0x06: 'Marker',
      0x07: 'Cue Point',
      0x08: 'Program Name',
      0x09: 'Device (Port) Name',
    };

    /** @type {string} */
    const label = labels[metaType] ? labels[metaType] : `Meta Event 0x${metaType.toString(16).toUpperCase()}: ${data}`;

    return {
      // Meta events have a delta time of 0
      deltaTime: 0,
      type: 0xFF,
      // Meta event type
      metaType,
      // Length of the string data
      metaEventLength,
      // Encoded string data as a Uint8Array
      data,
      label,
    };
  }

  /**
   * Generate an end of track event.
   * @returns {MidiTrackEvent} The end of track event.
   * @static
   */
  static generateEndOfTrackEvent() {
    return {
      data: '',
      deltaTime: 0,
      type: 0xFF,
      metaType: 0x2F,
      metaEventLength: 0,
      label: 'End of Track',
    };
  }

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
  static convertToMidi({ ppq = 480, bpm, tracks, skipNotes = [] }) {
    /** The new MIDI instance. */
    const midi = new AudioMIDI('', { timeDivision: ppq });

    // Loop over the tracks to add (the `tracks` option is optional).
    for (const track of tracks ?? []) {
      const { notes, metaStringEvents } = track;
      /** The current track to write. */
      const currentTrack = midi.addTrack();

      /** The current time in ticks. */
      let currentTime = 0;

      // If a BPM is provided at a tempo event.
      if (bpm) {
        currentTrack.events.push(AudioMIDI.generateTempoEvent(bpm))
      }

      // Fill in any metaStringEvents that are provided (the field is optional).
      if (metaStringEvents && Object.keys(metaStringEvents).length > 0) {
        for (const [type, data] of Object.entries(metaStringEvents)) {
          currentTrack.events.push(AudioMIDI.generateMetaStringEvent(Number.parseInt(type, 10), data))
        }
      }

      // Step 1: Generate Note On and Note Off events (the `notes` field is optional).
      for (const note of notes ?? []) {
        debug('note:', note);
        if (!skipNotes.includes(note.midiNote)) {
          // Add a Note On event
          currentTrack.events.push({
            deltaTime: currentTime * ppq,
            type: 0x90,
            channel: 0,
            data: {
              // The MIDI note number
              note: note.midiNote,
              velocity: note.velocity,
              length: note.length,
            },
            label: 'Note On',
          });

          // Add a Note Off event
          currentTrack.events.push({
            deltaTime: (currentTime * ppq) + Math.ceil(note.length),
            type: 0x80,
            channel: 0,
            data: {
              note: note.midiNote,
              // Velocity for Note Off is usually 0
              velocity: 0,
              length: note.length,
            },
            label: 'Note Off',
          });
        } else {
          debug('skipping note:', note);
        }
        const ticks = note.ticks / ppq;
        if (ticks > 0) {
          debug('incrementing time by', ticks);
        }
        currentTime += ticks;
      }

      // Sort events by time so they are in the correct order
      currentTrack.events.sort((a, b) => a.deltaTime - b.deltaTime);

      // Convert absolute times to delta times
      let lastTime = 0;
      currentTrack.events.forEach((event) => {
        // For each event, the delta time is calculated as the difference between the event's time (event.deltaTime, which is still in absolute terms) and lastTime.
        const deltaTime = event.deltaTime - lastTime;
        event.deltaTime = deltaTime;
        // lastTime is then updated by adding the calculated delta time, ensuring it correctly reflects the cumulative time up to the current event.
        lastTime += deltaTime;
      });
    }

    return midi;
  }

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
  static noteToMidi(noteString, octaveOffset = 2, noteMap = {
    C: 0,
    'C#': 1,
    D: 2,
    'D#': 3,
    E: 4,
    'E#': 5,
    F: 5,
    'F#': 6,
    G: 7,
    'G#': 8,
    A: 9,
    'A#': 10,
    B: 11,
    'B#': 0,
  }) {
    // Extract the note (C, C#, D, etc.) and the octave (-2, -1, 1, 2, 3, 4, etc.)
    const match = noteString.match(/^([A-G]#?)(-?\d+)$/);

    if (!match) {
      throw new Error(`Invalid note format: ${noteString}`);
    }

    const [, note, octave] = match;

    // MIDI note number = (octave + 1) * 12 + note value
    /** @type {number} */
    const midiNumber = (parseInt(octave, 10) + octaveOffset) * 12 + Number(noteMap[note]);

    // Ensure the MIDI number is within the valid range (0-127)
    if (midiNumber < 0 || midiNumber > 127) {
      throw new Error(`Note out of valid MIDI range: ${noteString}`);
    }

    return midiNumber;
  }

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
  static midiToNote(midiValue, octaveOffset = 2, noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']) {
    if (midiValue < 0 || midiValue > 127) {
      throw new Error(`Invalid MIDI value: ${midiValue}. Must be between 0 and 127.`);
    }

    // Get the note index within the octave
    const noteIndex = midiValue % 12;
    // Calculate the octave
    const octave = Math.floor(midiValue / 12) - octaveOffset;

    // Return the note string with the octave
    return `${noteNames[noteIndex]}${octave}`;
  }
}

export default AudioMIDI;
