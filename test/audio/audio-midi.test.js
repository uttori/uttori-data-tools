import test from 'ava';
import { promises as fs } from 'fs';
import { DataBuffer, AudioMIDI } from '../../src/index.js';

/**
 * Build a 14 byte `MThd` header chunk.
 * @param {number} format The MIDI format (0, 1, or 2).
 * @param {number} trackCount The number of tracks.
 * @param {number} timeDivision The time division value.
 * @returns {number[]} The header bytes.
 */
const MThd = (format, trackCount, timeDivision) => [
  0x4D, 0x54, 0x68, 0x64, // 'MThd'
  0x00, 0x00, 0x00, 0x06, // Header length is always 6
  (format >> 8) & 0xFF, format & 0xFF,
  (trackCount >> 8) & 0xFF, trackCount & 0xFF,
  (timeDivision >> 8) & 0xFF, timeDivision & 0xFF,
];

/**
 * Build an `MTrk` chunk from a collection of event data bytes.
 * @param {number[]} dataBytes The track event bytes.
 * @returns {number[]} The track chunk bytes (header + data).
 */
const MTrk = (dataBytes) => [
  0x4D, 0x54, 0x72, 0x6B, // 'MTrk'
  (dataBytes.length >>> 24) & 0xFF,
  (dataBytes.length >>> 16) & 0xFF,
  (dataBytes.length >>> 8) & 0xFF,
  dataBytes.length & 0xFF,
  ...dataBytes,
];

/**
 * Build a complete MIDI file as a Uint8Array for a single track.
 * @param {number[]} trackData The track event bytes.
 * @param {object} [options] Header overrides.
 * @param {number} [options.format] The MIDI format.
 * @param {number} [options.trackCount] The track count to write in the header.
 * @param {number} [options.timeDivision] The time division.
 * @returns {Uint8Array} The MIDI file data.
 */
const buildMidi = (trackData, { format = 0, trackCount = 1, timeDivision = 480 } = {}) => new Uint8Array([
  ...MThd(format, trackCount, timeDivision),
  ...MTrk(trackData),
]);

/**
 * Parse track data bytes and return the parsed AudioMIDI instance.
 * @param {number[]} trackData The track event bytes.
 * @param {object} [options] Header overrides passed to {@link buildMidi}.
 * @returns {AudioMIDI} The parsed instance.
 */
const parseTrack = (trackData, options) => {
  const midi = new AudioMIDI(buildMidi(trackData, options));
  midi.parse();
  return midi;
};

/**
 * Write a single event and return the resulting bytes.
 * @param {import('../../src/audio/audio-midi.js').MidiTrackEvent} event The event to write.
 * @returns {number[]} The written bytes.
 */
const writeOne = (event) => {
  const midi = new AudioMIDI();
  const dataBuffer = new DataBuffer();
  midi.writeEvent(dataBuffer, event);
  dataBuffer.commit();
  return [...dataBuffer.data];
};

test('constructor: applies defaults when no options are provided', (t) => {
  const midi = new AudioMIDI();
  t.is(midi.format, 0);
  t.is(midi.trackCount, 0);
  t.is(midi.timeDivision, 480);
  t.deepEqual(midi.chunks, []);
  t.deepEqual(midi.options, {});
});

test('constructor: respects provided options', (t) => {
  const midi = new AudioMIDI(undefined, { format: 1, timeDivision: 96 });
  t.is(midi.format, 1);
  t.is(midi.timeDivision, 96);
  t.deepEqual(midi.options, { format: 1, timeDivision: 96 });
});

test('parse: reads the test.mid fixture (format 0)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/test.mid');
  const midi = new AudioMIDI(data);
  midi.parse();

  t.is(midi.format, 0);
  t.is(midi.trackCount, 1);
  t.is(midi.timeDivision, 128);
  t.is(midi.chunks.length, 1);
  t.is(midi.chunks[0].type, 'MTrk');
  t.is(midi.chunks[0].events.length, 158);

  const [first] = midi.chunks[0].events;
  t.is(first.label, 'Set Tempo');
  t.is(first.data.bpm, 128);
});

test('parse: reads the 2.MID fixture and resolves note lengths', async (t) => {
  const data = await fs.readFile('./test/audio/assets/2.MID');
  const midi = new AudioMIDI(data);
  midi.parse();

  t.is(midi.timeDivision, 96);
  t.is(midi.chunks.length, 1);
  const trackName = midi.chunks[0].events.find((event) => event.label === 'Sequence / Track Name');
  t.truthy(trackName);

  // Note On events get their length back-filled from the matching Note Off.
  const noteOn = midi.chunks[0].events.find((event) => event.label === 'Note On');
  t.true(typeof noteOn.data.length === 'number');
});

test('parse: stops when fewer tracks exist than the header claims', (t) => {
  // Header says 2 tracks, but only one MTrk is present.
  const midi = parseTrack([0x00, 0xFF, 0x2F, 0x00], { trackCount: 2 });
  t.is(midi.chunks.length, 1);
});

test('parse: reads every track of a multi-track (format 1) file bounded by chunkLength', (t) => {
  // Two separate MTrk chunks; each event loop must stop at its own chunkLength
  // instead of bleeding the next MTrk header into the first track.
  const track1 = MTrk([
    0x00, 0xFF, 0x03, 0x01, 0x41, // Track Name 'A'
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const track2 = MTrk([
    0x00, 0x90, 0x40, 0x40, // Note On 64
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const data = new Uint8Array([...MThd(1, 2, 480), ...track1, ...track2]);
  const midi = new AudioMIDI(data);
  midi.parse();

  t.is(midi.chunks.length, 2);
  t.is(midi.chunks[0].events.at(-1).label, 'End of Track');
  t.is(midi.chunks[0].events[0].data, 'A');
  t.is(midi.chunks[1].events[0].label, 'Note On');
  t.is(midi.chunks[1].events[0].data.note, 64);
});

test('parse: stops on an invalid (non-MTrk) track header', (t) => {
  const data = new Uint8Array([
    ...MThd(0, 1, 480),
    0x41, 0x42, 0x43, 0x44, // 'ABCD' instead of 'MTrk'
    0x00, 0x00, 0x00, 0x00,
  ]);
  const midi = new AudioMIDI(data);
  midi.parse();
  t.is(midi.chunks.length, 0);
});

test('parse: throws on a truncated variable length quantity', (t) => {
  // A lone continuation byte (0x81) leaves no status byte to read.
  const midi = new AudioMIDI(buildMidi([0x81]));
  t.throws(() => midi.parse());
});

test('parse: reads multi-byte variable length delta times', (t) => {
  const midi = parseTrack([0x81, 0x00, 0xFF, 0x2F, 0x00]);
  t.is(midi.chunks[0].events[0].deltaTime, 128);
});

test('parse: System Exclusive (0xF0) reads until EOX', (t) => {
  const midi = parseTrack([
    0x00, 0xF0, 0x41, 0x10, 0x20, 0xF7, // SysEx, Roland, [0x10, 0x20]
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const sysex = midi.chunks[0].events[0];
  t.is(sysex.data.manufacturerId, 0x41);
  t.is(sysex.data.manufacturerLabel, 'Roland');
  t.deepEqual(sysex.data.data, [0x10, 0x20]);
});

test('parse: all System Common / Real-Time message types', (t) => {
  const midi = parseTrack([
    0x00, 0xF2, 0x10, 0x20, // Song Position Pointer
    0x00, 0xF3, 0x01, 0x40, // Song Select
    0x00, 0xF4, 0x00, // Undefined 0xF4
    0x00, 0xF5, 0x00, // Undefined 0xF5
    0x00, 0xF6, 0x00, // Tune Request
    0x00, 0xF7, 0x00, // EOX
    0x00, 0xF8, 0x00, // MIDI Clock
    0x00, 0xF9, 0x00, // Undefined 0xF9
    0x00, 0xFA, 0x00, // Start
    0x00, 0xFB, 0x00, // Continue
    0x00, 0xFC, 0x00, // Stop
    0x00, 0xFD, 0x00, // Undefined 0xFD
    0x00, 0xFE, 0x00, // Active Sensing
    0x00, 0xFF, 0x2F, 0x00, // End of Track
  ]);
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, [
    'Song Position Pointer',
    'System Common Messages - Song Select',
    'System Real Time Messages - Undefined 0xF4 (Reserved)',
    'System Real Time Messages - Undefined 0xF5 (Reserved)',
    'System Common Messages - Tune Request',
    'System Common Messages - EOX',
    'System Real Time Messages - MIDI Clock',
    'System Real Time Messages - Undefined 0xF9 (Reserved)',
    'System Real Time Messages - Start',
    'System Real Time Messages - Continue',
    'System Real Time Messages - Stop',
    'System Real Time Messages - Undefined 0xFD (Reserved)',
    'System Real Time Messages - Active Sensing',
    'End of Track',
  ]);
  t.deepEqual(midi.chunks[0].events[0].data, { msb: 0x10, lsb: 0x20 });
});

test('parse: all channel voice messages including running status', (t) => {
  const midi = parseTrack([
    0x00, 0x90, 0x3C, 0x40, // Note On 60
    0x10, 0x80, 0x3C, 0x00, // Note Off 60 (delta 16 -> length 16)
    0x00, 0x80, 0x3E, 0x40, // Note Off 62 (no matching Note On)
    0x00, 0xA0, 0x3C, 0x50, // Note Aftertouch
    0x00, 0xB0, 0x07, 0x7F, // Controller (Volume)
    0x00, 0xC0, 0x05, // Program Change
    0x00, 0xD0, 0x40, // Channel Aftertouch
    0x00, 0xE0, 0x00, 0x40, // Pitch Bend
    0x00, 0x90, 0x40, 0x40, // Note On 64
    0x00, 0x40, 0x00, // Running status -> Note On 64 velocity 0
    0x00, 0xF1, 0x01, 0x7F, // 0xF1 -> generic System Exclusive handler
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const events = midi.chunks[0].events;
  t.is(events[0].label, 'Note On');
  t.is(events[0].data.note, 60);
  // The matched Note Off computes a length from the elapsed ticks.
  t.is(events[1].label, 'Note Off');
  t.is(events[1].data.length, 16);
  // And it back-fills the original Note On length.
  t.is(events[0].data.length, 16);
  // Unmatched Note Off has a length of 0.
  t.is(events[2].label, 'Note Off');
  t.is(events[2].data.length, 0);
  t.is(events[3].label, 'Note Aftertouch');
  t.is(events[4].label, 'Controller');
  t.is(events[4].data.label, 'Volume (MSB)');
  t.is(events[5].label, 'Program Change');
  t.is(events[5].data, 0x05);
  t.is(events[6].label, 'Channel Aftertouch');
  t.is(events[7].label, 'Pitch Bend Event');
  t.is(events[7].data.pitchValue, (0x40 << 7) + 0x00);
  // Running status reuses the previous 0x90 status byte.
  t.is(events[9].label, 'Note On');
  t.is(events[9].data.note, 64);
  t.is(events[9].data.velocity, 0);
});

test('parse: unknown event with no preceding status byte', (t) => {
  // 0x10 (< 0x80) with no running status -> undefined event type.
  const midi = parseTrack([0x00, 0x10, 0xFF, 0x2F, 0x00]);
  t.is(midi.chunks[0].events.length, 2);
  t.is(midi.chunks[0].events[0].type, undefined);
  t.is(midi.chunks[0].events[1].label, 'End of Track');
});

test('parse: text-style and structural meta events', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x00, 0x02, 0x00, 0x07, // Sequence Number 7
    0x00, 0xFF, 0x01, 0x03, 0x41, 0x42, 0x43, // Text 'ABC'
    0x00, 0xFF, 0x02, 0x01, 0x43, // Copyright 'C'
    0x00, 0xFF, 0x03, 0x02, 0x48, 0x69, // Track Name 'Hi'
    0x00, 0xFF, 0x04, 0x01, 0x49, // Instrument 'I'
    0x00, 0xFF, 0x05, 0x01, 0x4C, // Lyrics 'L'
    0x00, 0xFF, 0x06, 0x01, 0x4D, // Marker 'M'
    0x00, 0xFF, 0x07, 0x01, 0x51, // Cue Point 'Q'
    0x00, 0xFF, 0x08, 0x01, 0x50, // Program Name 'P'
    0x00, 0xFF, 0x09, 0x01, 0x44, // Device (Port) Name 'D'
    0x00, 0xFF, 0x20, 0x01, 0x05, // Channel Prefix
    0x00, 0xFF, 0x21, 0x01, 0x03, // MIDI Port
    0x00, 0xFF, 0x7F, 0x02, 0x11, 0x22, // Sequencer Specific
    0x00, 0xFF, 0x60, 0x01, 0x99, // Unknown meta type
    0x00, 0xFF, 0x2F, 0x00, // End of Track
  ]);
  const events = midi.chunks[0].events;
  const byLabel = (label) => events.find((event) => event.label === label);

  t.deepEqual(byLabel('Sequence Number').data, { sequenceNumber: 7, type: 'Provided' });
  t.is(byLabel('Text Event').data, 'ABC');
  t.is(byLabel('Copyright Notice').data, 'C');
  t.is(byLabel('Sequence / Track Name').data, 'Hi');
  t.is(byLabel('Instrument Name').data, 'I');
  t.is(byLabel('Lyrics').data, 'L');
  t.is(byLabel('Marker').data, 'M');
  t.is(byLabel('Cue Point').data, 'Q');
  t.is(byLabel('Program Name').data, 'P');
  t.is(byLabel('Device (Port) Name').data, 'D');
  t.is(byLabel('Channel Prefix').data, 0x05);
  t.is(byLabel('MIDI Port').data, 0x03);
  t.is(byLabel('Sequencer Specific').data.length, 2);
});

test('parse: Sequence Number with an invalid length falls back to track index', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x00, 0x01, 0x05, // Sequence Number, length 1 (invalid)
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const seq = midi.chunks[0].events[0];
  t.is(seq.data.type, 'Next Track Index');
  t.is(seq.data.sequenceNumber, 1);
});

test('parse: End of Track with a non-zero length is tolerated', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x2F, 0x01, // End of Track, length 1 (invalid)
    0x00, 0xFF, 0x2F, 0x00, // End of Track, length 0
  ]);
  t.is(midi.chunks[0].events[0].label, 'End of Track');
  t.is(midi.chunks[0].events[0].data, '');
});

test('parse: Tempo (valid and invalid length)', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20, // 500000 us -> 120 BPM
    0x00, 0xFF, 0x51, 0x04, 0x00, 0x00, 0x00, 0x00, // Invalid length
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const tempo = midi.chunks[0].events[0];
  t.is(tempo.label, 'Set Tempo');
  t.is(tempo.data.tempo, 500000);
  t.is(tempo.data.bpm, 120);
  // The invalid-length tempo stores its raw bytes and has no label.
  t.is(midi.chunks[0].events[1].label, undefined);
  t.is(midi.chunks[0].events[1].data.length, 4);
});

test('parse: SMPTE Offset decodes all frame rates', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x54, 0x05, 0x00, 0x01, 0x02, 0x03, 0x04, // rr=00 -> 24
    0x00, 0xFF, 0x54, 0x05, 0x20, 0x01, 0x02, 0x03, 0x04, // rr=01 -> 25
    0x00, 0xFF, 0x54, 0x05, 0x40, 0x01, 0x02, 0x03, 0x04, // rr=10 -> 29.97
    0x00, 0xFF, 0x54, 0x05, 0x60, 0x01, 0x02, 0x03, 0x04, // rr=11 -> 30
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const rates = midi.chunks[0].events
    .filter((event) => event.label === 'SMPTE Offset')
    .map((event) => event.data.frameRate);
  t.deepEqual(rates, [24, 25, 29.97, 30]);
});

test('parse: Time Signature', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08,
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  t.deepEqual(midi.chunks[0].events[0].data, {
    numerator: 4,
    denominator: 2,
    metronome: 0x18,
    thirtySecondNotes: 8,
  });
});

test('parse: Key Signature (major, minor, flats, unknown, invalid length)', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x59, 0x02, 0x00, 0x00, // C Major
    0x00, 0xFF, 0x59, 0x02, 0x02, 0x01, // D Minor
    0x00, 0xFF, 0x59, 0x02, 0xFF, 0x00, // -1 (one flat) -> F Major
    0x00, 0xFF, 0x59, 0x02, 0x08, 0x00, // 8 sharps (out of range) -> Unknown Key
    0x00, 0xFF, 0x59, 0x03, 0x00, 0x00, 0x00, // Invalid length
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const keys = midi.chunks[0].events.filter((event) => event.label === 'Key Signature');
  t.is(keys[0].data.keyName, 'C');
  t.is(keys[0].data.mode, 'Major');
  t.is(keys[1].data.keyName, 'D');
  t.is(keys[1].data.mode, 'Minor');
  // Flats are negative two's-complement values (0xFF -> -1) and decode correctly now.
  t.is(keys[2].data.keySignature, -1);
  t.is(keys[2].data.keyName, 'F');
  t.is(keys[3].data.keyName, 'Unknown Key');
  // The invalid-length key signature stores its raw bytes (no label).
  t.is(midi.chunks[0].events[4].data.length, 3);
});

test('parse: M-Live Tag (known tags and unknown tag)', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x4B, 0x02, 0x01, 0x41, 0x42, // Genre
    0x00, 0xFF, 0x4B, 0x02, 0x02, 0x41, 0x42, // Artist
    0x00, 0xFF, 0x4B, 0x02, 0x03, 0x41, 0x42, // Composer
    0x00, 0xFF, 0x4B, 0x02, 0x04, 0x41, 0x42, // Duration
    0x00, 0xFF, 0x4B, 0x02, 0x05, 0x41, 0x42, // BPM
    0x00, 0xFF, 0x4B, 0x02, 0x09, 0x41, 0x42, // Unknown tag
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const tags = midi.chunks[0].events.filter((event) => event.label === 'M-Live Tag');
  t.deepEqual(tags.map((event) => event.data.tagLabel), [
    'Genre',
    'Artist',
    'Composer',
    'Duration (seconds)',
    'BPM (Tempo)',
    'Unknown Tag: 9',
  ]);
});

test('AudioMIDI.decodeHeader: decodes a PPQN header', (t) => {
  const header = AudioMIDI.decodeHeader(new Uint8Array(MThd(1, 2, 480)));
  t.is(header.type, 'MThd');
  t.is(header.chunkLength, 6);
  t.is(header.format, 1);
  t.is(header.trackCount, 2);
  t.is(header.timeDivision, 480);
  t.is(header.framesPerSecond, undefined);
  t.is(header.ticksPerFrame, undefined);
});

test('AudioMIDI.decodeHeader: decodes an SMPTE (frames per second) header', (t) => {
  // 0xE728: top byte >= 128 indicates frames-per-second mode.
  const header = AudioMIDI.decodeHeader(new Uint8Array(MThd(0, 1, 0xE728)));
  t.is(header.framesPerSecond, 0xE7 - 128);
  t.is(header.ticksPerFrame, 0x28);
  t.is(header.timeDivision, undefined);
});

test('addTrack: appends a new MTrk chunk and keeps trackCount in sync', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  t.is(track.type, 'MTrk');
  t.is(track.chunkLength, 0);
  t.deepEqual(track.events, []);
  t.is(midi.chunks.length, 1);
  t.is(midi.trackCount, 1);
  midi.addTrack();
  t.is(midi.trackCount, 2);
});

test('addEvent: appends a single event or an array of events', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  midi.addEvent(track, { deltaTime: 0, label: 'one' });
  t.is(track.events.length, 1);
  midi.addEvent(track, [{ deltaTime: 0, label: 'two' }, { deltaTime: 0, label: 'three' }]);
  t.is(track.events.length, 3);
});

test('writeEvent: Note On / Note Off / Poly Key Pressure', (t) => {
  t.deepEqual(writeOne({ type: 0x90, channel: 0, deltaTime: 0, data: { note: 60, velocity: 100 } }), [0x00, 0x90, 0x3C, 0x64]);
  t.deepEqual(writeOne({ type: 0x80, channel: 1, deltaTime: 0, data: { note: 60, velocity: 0 } }), [0x00, 0x81, 0x3C, 0x00]);
  t.deepEqual(writeOne({ type: 0xA0, channel: 0, deltaTime: 0, data: { note: 60, velocity: 10 } }), [0x00, 0xA0, 0x3C, 0x0A]);
  // A channel voice event with no `channel` defaults to channel 0.
  t.deepEqual(writeOne({ type: 0x90, deltaTime: 0, data: { note: 60, velocity: 100 } }), [0x00, 0x90, 0x3C, 0x64]);
});

test('writeEvent: throws for an invalid status byte', (t) => {
  t.throws(() => writeOne({ type: 0x00, deltaTime: 0 }), { message: /Invalid status byte/ });
});

test('writeEvent: throws for an undefined delta time', (t) => {
  t.throws(() => writeOne({ type: 0x90, channel: 0, data: { note: 60, velocity: 1 } }), { message: /Invalid delta time/ });
});

test('writeEvent: throws for a missing note or velocity', (t) => {
  t.throws(() => writeOne({ type: 0x90, channel: 0, deltaTime: 0, data: { velocity: 1 } }), { message: /Invalid note value/ });
  t.throws(() => writeOne({ type: 0x90, channel: 0, deltaTime: 0, data: { note: 1 } }), { message: /Invalid velocity/ });
});

test('writeEvent: Control Change', (t) => {
  // Matches the `{ controller, value }` shape produced by `parse()`; `0` is a valid controller / value.
  t.deepEqual(writeOne({ type: 0xB0, channel: 0, deltaTime: 0, data: { controller: 7, value: 100 } }), [0x00, 0xB0, 0x07, 0x64]);
  t.deepEqual(writeOne({ type: 0xB0, channel: 0, deltaTime: 0, data: { controller: 0, value: 0 } }), [0x00, 0xB0, 0x00, 0x00]);
  t.throws(() => writeOne({ type: 0xB0, channel: 0, deltaTime: 0, data: { value: 100 } }), { message: /Invalid controller number/ });
});

test('writeEvent: Program Change', (t) => {
  // `parse()` stores the program number directly as a number; `0` is a valid program.
  t.deepEqual(writeOne({ type: 0xC0, channel: 0, deltaTime: 0, data: 5 }), [0x00, 0xC0, 0x05]);
  t.deepEqual(writeOne({ type: 0xC0, channel: 0, deltaTime: 0, data: 0 }), [0x00, 0xC0, 0x00]);
  t.throws(() => writeOne({ type: 0xC0, channel: 0, deltaTime: 0, data: {} }), { message: /Invalid programNumber/ });
});

test('writeEvent: Channel Pressure', (t) => {
  // `parse()` stores the pressure amount directly as a number; `0` is a valid amount.
  t.deepEqual(writeOne({ type: 0xD0, channel: 0, deltaTime: 0, data: 64 }), [0x00, 0xD0, 0x40]);
  t.deepEqual(writeOne({ type: 0xD0, channel: 0, deltaTime: 0, data: 0 }), [0x00, 0xD0, 0x00]);
  t.throws(() => writeOne({ type: 0xD0, channel: 0, deltaTime: 0, data: {} }), { message: /Invalid pressureAmount/ });
});

test('writeEvent: Pitch Bend', (t) => {
  // Matches the `{ firstByte, secondByte }` shape produced by `parse()`; `0` is valid for both bytes.
  t.deepEqual(writeOne({ type: 0xE0, channel: 0, deltaTime: 0, data: { firstByte: 0x10, secondByte: 0x40 } }), [0x00, 0xE0, 0x10, 0x40]);
  t.deepEqual(writeOne({ type: 0xE0, channel: 0, deltaTime: 0, data: { firstByte: 0x00, secondByte: 0x40 } }), [0x00, 0xE0, 0x00, 0x40]);
  t.throws(() => writeOne({ type: 0xE0, channel: 0, deltaTime: 0, data: { secondByte: 0x40 } }), { message: /Invalid pitch bend/ });
  // A missing `data` object is rejected too.
  t.throws(() => writeOne({ type: 0xE0, channel: 0, deltaTime: 0 }), { message: /Invalid pitch bend/ });
});

test('writeEvent: System Exclusive', (t) => {
  t.deepEqual(writeOne({ type: 0xF0, deltaTime: 0, data: { manufacturerId: 0x41, data: [0x10, 0x20] } }), [0x00, 0xF0, 0x41, 0x10, 0x20, 0xF7]);
  t.throws(() => writeOne({ type: 0xF0, deltaTime: 0, data: { data: [0x10] } }), { message: /Invalid manufacturerId/ });
});

test('writeEvent: Song Select', (t) => {
  t.deepEqual(writeOne({ type: 0xF3, deltaTime: 0, data: { songNumber: 3 } }), [0x00, 0xF3, 0x03]);
  t.throws(() => writeOne({ type: 0xF3, deltaTime: 0, data: {} }), { message: /Invalid songNumber/ });
});

test('writeEvent: data-less system messages', (t) => {
  t.deepEqual(writeOne({ type: 0xF6, deltaTime: 0 }), [0x00, 0xF6]); // Tune Request
  t.deepEqual(writeOne({ type: 0xF7, deltaTime: 0 }), [0x00, 0xF7]); // End of SysEx
  t.deepEqual(writeOne({ type: 0xF8, deltaTime: 0 }), [0x00, 0xF8]); // MIDI Clock
  t.deepEqual(writeOne({ type: 0xFA, deltaTime: 0 }), [0x00, 0xFA]); // Start
  t.deepEqual(writeOne({ type: 0xFB, deltaTime: 0 }), [0x00, 0xFB]); // Continue
  t.deepEqual(writeOne({ type: 0xFC, deltaTime: 0 }), [0x00, 0xFC]); // Stop
  t.deepEqual(writeOne({ type: 0xFE, deltaTime: 0 }), [0x00, 0xFE]); // Active Sensing
});

test('writeEvent: an unhandled event type writes only the delta time & status byte', (t) => {
  // Unhandled types fall through to the default case (which only logs via debug),
  // so only the delta time and status byte are emitted.
  t.deepEqual(writeOne({ type: 0x70, deltaTime: 0 }), [0x00, 0x70]);
});

test('writeEvent: Meta Sequence Number', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 2, data: { sequenceNumber: 0x0102 } }), [0x00, 0xFF, 0x00, 0x02, 0x01, 0x02]);
  // A sequence number of `0` is valid.
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 2, data: { sequenceNumber: 0 } }), [0x00, 0xFF, 0x00, 0x02, 0x00, 0x00]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 2, data: {} }), { message: /Invalid sequenceNumber/ });
});

test('writeEvent: Meta text events', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x03, metaEventLength: 3, data: 'abc' }), [0x00, 0xFF, 0x03, 0x03, 0x61, 0x62, 0x63]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x01, metaEventLength: 0, data: '' }), { message: /Invalid text data/ });
});

test('writeEvent: Meta Channel Prefix / MIDI Port', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x20, metaEventLength: 1, data: 5 }), [0x00, 0xFF, 0x20, 0x01, 0x05]);
  // A channel / port of `0` is valid.
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x21, metaEventLength: 1, data: 0 }), [0x00, 0xFF, 0x21, 0x01, 0x00]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x21, metaEventLength: 1, data: undefined }), { message: /Invalid data/ });
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x21, metaEventLength: 1, data: null }), { message: /Invalid data/ });
});

test('writeEvent: Meta End of Track', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x2F, metaEventLength: 0, data: '' }), [0x00, 0xFF, 0x2F, 0x00]);
});

test('writeEvent: Meta Set Tempo', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x51, metaEventLength: 3, data: { byte1: 0x07, byte2: 0xA1, byte3: 0x20 } }), [0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x51, metaEventLength: 3, data: 0 }), { message: /Invalid data/ });
});

test('writeEvent: Meta SMPTE Offset', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x54, metaEventLength: 5, data: { hourByte: 1, minute: 2, second: 3, frame: 4, subFrame: 5 } }), [0x00, 0xFF, 0x54, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x54, metaEventLength: 5, data: 0 }), { message: /Invalid data/ });
});

test('writeEvent: Meta Time Signature', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x58, metaEventLength: 4, data: { numerator: 4, denominator: 2, metronome: 0x18, thirtySecondNotes: 8 } }), [0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08]);
  // A denominator of `0` (whole note) is valid; only a missing field is rejected.
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x58, metaEventLength: 4, data: { numerator: 4, denominator: 0, metronome: 0x18, thirtySecondNotes: 8 } }), [0x00, 0xFF, 0x58, 0x04, 0x04, 0x00, 0x18, 0x08]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x58, metaEventLength: 4, data: { denominator: 2, metronome: 0x18, thirtySecondNotes: 8 } }), { message: /Invalid numerator/ });
  // A missing `data` object is rejected too.
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x58, metaEventLength: 4 }), { message: /Invalid numerator/ });
});

test('writeEvent: Meta Key Signature', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x59, metaEventLength: 2, data: { keySignature: 2, majorOrMinor: 1 } }), [0x00, 0xFF, 0x59, 0x02, 0x02, 0x01]);
  // C Major (keySignature 0, majorOrMinor 0) is valid and must round-trip.
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x59, metaEventLength: 2, data: { keySignature: 0, majorOrMinor: 0 } }), [0x00, 0xFF, 0x59, 0x02, 0x00, 0x00]);
  // Flats are negative and written as a two's-complement byte (-2 -> 0xFE).
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x59, metaEventLength: 2, data: { keySignature: -2, majorOrMinor: 0 } }), [0x00, 0xFF, 0x59, 0x02, 0xFE, 0x00]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x59, metaEventLength: 2, data: { majorOrMinor: 1 } }), { message: /Invalid keySignature/ });
  // A missing `data` object is rejected too.
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x59, metaEventLength: 2 }), { message: /Invalid keySignature/ });
});

test('writeEvent: Meta Sequencer Specific', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x7F, metaEventLength: 2, data: [0x11, 0x22] }), [0x00, 0xFF, 0x7F, 0x02, 0x11, 0x22]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x7F, metaEventLength: 0, data: 0 }), { message: /Invalid data/ });
});

test('writeEvent: an unhandled meta event type writes only the header bytes', (t) => {
  // An unhandled meta type still writes the status, metaType and length bytes,
  // then falls through to the default case (which only logs via debug).
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x60, metaEventLength: 0, data: '' }), [0x00, 0xFF, 0x60, 0x00]);
});

test('writeChunk: skips unknown chunk types', (t) => {
  const midi = new AudioMIDI();
  const dataBuffer = new DataBuffer();
  midi.writeChunk(dataBuffer, { type: 'XXXX', events: [] });
  dataBuffer.commit();
  // Nothing should have been written for an unknown chunk type.
  t.is(dataBuffer.data.length, 0);
});

test('saveToDataBuffer: writes a valid header and track', (t) => {
  const midi = new AudioMIDI(undefined, { format: 0, timeDivision: 480 });
  midi.trackCount = 1;
  const track = midi.addTrack();
  track.events.push({ type: 0x90, channel: 0, deltaTime: 0, data: { note: 60, velocity: 100 } });
  track.events.push(AudioMIDI.generateEndOfTrackEvent());

  const dataBuffer = midi.saveToDataBuffer();
  // The header should start with 'MThd'.
  t.deepEqual([...dataBuffer.data.slice(0, 4)], [0x4D, 0x54, 0x68, 0x64]);
  // The track chunk should report a non-zero length on the chunk object.
  t.true(track.chunkLength > 0);
});

test('saveToDataBuffer: round-trips through parse', (t) => {
  const midi = new AudioMIDI(undefined, { format: 0, timeDivision: 480 });
  midi.trackCount = 1;
  const track = midi.addTrack();
  track.events.push(AudioMIDI.generateTempoEvent(120));
  track.events.push(AudioMIDI.generateMetaStringEvent(0x03, 'Round Trip'));
  track.events.push({ type: 0x90, channel: 0, deltaTime: 0, data: { note: 60, velocity: 100 } });
  track.events.push({ type: 0x80, channel: 0, deltaTime: 240, data: { note: 60, velocity: 0 } });
  track.events.push(AudioMIDI.generateEndOfTrackEvent());

  const dataBuffer = midi.saveToDataBuffer();
  const reparsed = new AudioMIDI(dataBuffer.data);
  reparsed.parse();

  t.is(reparsed.chunks.length, 1);
  const labels = reparsed.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, ['Set Tempo', 'Sequence / Track Name', 'Note On', 'Note Off', 'End of Track']);
});

test('round-trip: parse -> save -> parse is idempotent for one of each event type', (t) => {
  // A single track containing a representative event of every type that supports a clean round-trip.
  const midi = parseTrack([
    0x00, 0xFF, 0x00, 0x02, 0x00, 0x07, // Sequence Number 7
    0x00, 0xFF, 0x03, 0x03, 0x41, 0x42, 0x43, // Track Name 'ABC'
    0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20, // Set Tempo (120 BPM)
    0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08, // Time Signature 4/4
    0x00, 0xFF, 0x59, 0x02, 0xFE, 0x01, // Key Signature -2 (B♭) Minor
    0x00, 0xFF, 0x54, 0x05, 0x41, 0x02, 0x03, 0x04, 0x05, // SMPTE Offset (29.97 fps)
    0x00, 0x90, 0x3C, 0x40, // Note On 60 channel 0
    0x10, 0x80, 0x3C, 0x40, // Note Off 60 (delta 16)
    0x00, 0xA5, 0x3E, 0x50, // Poly Key Pressure on channel 5
    0x00, 0xB0, 0x07, 0x7F, // Controller (Volume)
    0x00, 0xC0, 0x05, // Program Change 5
    0x00, 0xD0, 0x40, // Channel Pressure 64
    0x00, 0xE0, 0x00, 0x40, // Pitch Bend
    0x00, 0xFF, 0x2F, 0x00, // End of Track
  ]);

  const reparsed = new AudioMIDI(midi.saveToDataBuffer().data);
  reparsed.parse();

  // Header metadata survives the round-trip.
  t.is(reparsed.format, midi.format);
  t.is(reparsed.trackCount, midi.trackCount);
  t.is(reparsed.timeDivision, midi.timeDivision);
  // Every event (including computed fields like tempo/bpm, keyName, frameRate, back-filled note length) is identical.
  t.deepEqual(reparsed.chunks, midi.chunks);
});

test('round-trip: parse -> save -> parse is idempotent for the test.mid fixture', async (t) => {
  const data = await fs.readFile('./test/audio/assets/test.mid');
  const midi = new AudioMIDI(data);
  midi.parse();

  const reparsed = new AudioMIDI(midi.saveToDataBuffer().data);
  reparsed.parse();

  t.is(reparsed.trackCount, midi.trackCount);
  t.is(reparsed.timeDivision, midi.timeDivision);
  t.deepEqual(reparsed.chunks, midi.chunks);
});

test('round-trip: parse -> save -> parse is idempotent for the 2.MID fixture', async (t) => {
  const data = await fs.readFile('./test/audio/assets/2.MID');
  const midi = new AudioMIDI(data);
  midi.parse();

  const reparsed = new AudioMIDI(midi.saveToDataBuffer().data);
  reparsed.parse();

  t.is(reparsed.trackCount, midi.trackCount);
  t.is(reparsed.timeDivision, midi.timeDivision);
  t.deepEqual(reparsed.chunks, midi.chunks);
});

test('parse: decodes SMPTE timing into framesPerSecond / ticksPerFrame', (t) => {
  // 0xE728 top byte >= 128 -> SMPTE timing; timeDivision falls back to 0.
  const midi = new AudioMIDI(new Uint8Array([...MThd(0, 0, 0xE728)]));
  midi.parse();
  t.is(midi.timeDivision, 0);
  t.is(midi.framesPerSecond, 0xE7 - 128);
  t.is(midi.ticksPerFrame, 0x28);
});

test('getUsedNotes: returns sorted unique notes from Note On events', (t) => {
  const midi = new AudioMIDI();
  midi.chunks = [{
    type: 'MTrk',
    chunkLength: 0,
    events: [
      { type: 0x90, data: { note: 62, velocity: 100 } },
      { type: 0x90, data: { note: '60', velocity: 90 } }, // String note
      { type: 0x90, data: { note: 62, velocity: 80 } }, // Duplicate
      { type: 0x90, data: { note: 64, velocity: 0 } }, // Velocity 0 -> ignored
      { type: 0x90, data: { note: 'xyz', velocity: 50 } }, // NaN -> ignored
      { type: 0x90, data: 5 }, // Non-object data -> ignored
      { type: 0x80, data: { note: 70, velocity: 0 } }, // Note Off -> ignored
      { data: { note: 99, velocity: 100 } }, // Missing type -> ignored
    ],
  }];
  t.deepEqual(midi.getUsedNotes(), [
    { noteNumber: 60, noteString: AudioMIDI.midiToNote(60) },
    { noteNumber: 62, noteString: AudioMIDI.midiToNote(62) },
  ]);
});

test('getUsedNotes: collects Note On events from any channel', (t) => {
  const midi = new AudioMIDI();
  midi.chunks = [{
    type: 'MTrk',
    chunkLength: 0,
    events: [
      { type: 0x90, data: { note: 60, velocity: 100 } }, // Channel 0
      { type: 0x95, data: { note: 67, velocity: 100 } }, // Channel 5
      { type: 0x9F, data: { note: 72, velocity: 100 } }, // Channel 15
    ],
  }];
  t.deepEqual(midi.getUsedNotes().map((note) => note.noteNumber), [60, 67, 72]);
});

test('validate: returns no issues for a well-formed track', (t) => {
  const midi = new AudioMIDI();
  midi.trackCount = 1;
  midi.chunks = [{
    type: 'MTrk',
    chunkLength: 10,
    events: [
      { type: 0x90, deltaTime: 0, data: { note: 60, velocity: 100 } },
      { type: 0x80, deltaTime: 10, data: { note: 60, velocity: 0 } },
      { type: 0xFF, deltaTime: 0, metaType: 0x2F, metaEventLength: 0, data: '' },
    ],
  }];
  t.deepEqual(midi.validate(), []);
});

test('validate: matches Note On / Note Off across non-zero channels', (t) => {
  const midi = new AudioMIDI();
  midi.trackCount = 1;
  midi.chunks = [{
    type: 'MTrk',
    chunkLength: 10,
    events: [
      { type: 0x95, deltaTime: 0, data: { note: 60, velocity: 100 } }, // Note On, channel 5
      { type: 0x85, deltaTime: 10, data: { note: 60, velocity: 0 } }, // Note Off, channel 5
      { type: 0xFF, deltaTime: 0, metaType: 0x2F, metaEventLength: 0, data: '' },
    ],
  }];
  // Before the fix, the channel-5 Note On/Off were ignored, causing a false "unmatched" error.
  t.deepEqual(midi.validate(), []);
});

test('validate: reports an unmatched Note On on a non-zero channel', (t) => {
  const midi = new AudioMIDI();
  midi.trackCount = 1;
  midi.chunks = [{
    type: 'MTrk',
    chunkLength: 10,
    events: [
      { type: 0x9A, deltaTime: 0, data: { note: 64, velocity: 100 } }, // Note On, channel 10, never released
      { type: 0xFF, deltaTime: 0, metaType: 0x2F, metaEventLength: 0, data: '' },
    ],
  }];
  t.true(midi.validate().some((issue) => issue.includes('unmatched Note On for note 64')));
});

test('validate: reports header and chunk-level issues', (t) => {
  const midi = new AudioMIDI();
  midi.format = 3; // Unsupported
  midi.trackCount = 5; // Mismatch with chunks.length
  midi.chunks = [
    { type: 'WTF?', chunkLength: 0, events: [] },
    { type: 'MTrk', chunkLength: 0, events: [{ type: 0xFF, deltaTime: 0, metaType: 0x2F, metaEventLength: 0, data: '' }] },
    { type: 'MTrk', chunkLength: 12, events: [] },
  ];
  const issues = midi.validate();
  t.true(issues.some((issue) => issue.includes('Unsupported MIDI format: 3')));
  t.true(issues.some((issue) => issue.includes('Header trackCount=5')));
  t.true(issues.some((issue) => issue.includes('unknown chunk type')));
  t.true(issues.some((issue) => issue.includes('chunkLength=0 but has 1 events')));
  t.true(issues.some((issue) => issue.includes('chunkLength=12 but has 0 events')));
});

test('validate: reports note matching and meta length issues', (t) => {
  const midi = new AudioMIDI();
  midi.trackCount = 1;
  midi.chunks = [{
    type: 'MTrk',
    chunkLength: 10,
    events: [
      { type: 0x90, deltaTime: -1, data: { note: 60, velocity: 100 } }, // Negative deltaTime + unmatched at end
      { type: 0x90, deltaTime: 0, data: {} }, // Missing note/velocity
      { type: 0x90, deltaTime: 0, data: { note: 70, velocity: 0 } }, // Note Off (velocity 0) with no active note
      { type: 0x80, deltaTime: 0, data: {} }, // Missing note for Note Off
      { type: 0x80, deltaTime: 0, data: { note: 80, velocity: 0 } }, // Note Off with no active note
      { type: 0xFF, deltaTime: 0 }, // Missing metaType
      { type: 0xFF, deltaTime: 0, metaType: 0x51, metaEventLength: 2, data: {} }, // Bad tempo length
      { type: 0xFF, deltaTime: 0, metaType: 0x58, metaEventLength: 2, data: {} }, // Bad time signature length
      { type: 0xFF, deltaTime: 0, metaType: 0x59, metaEventLength: 1, data: {} }, // Bad key signature length
      { type: 0xFF, deltaTime: 0, metaType: 0x54, metaEventLength: 2, data: {} }, // Bad SMPTE length
      { type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 1, data: {} }, // Bad sequence number length
      { type: 0xFF, deltaTime: 0, metaType: 0x01, metaEventLength: 1, data: 'x' }, // Unknown-length meta (no check)
      { type: 0xC0, deltaTime: 0, data: 1 }, // Default event (no check)
    ],
  }];
  const issues = midi.validate();
  t.true(issues.some((issue) => issue.includes('negative deltaTime')));
  t.true(issues.some((issue) => issue.includes('missing note/velocity data')));
  t.true(issues.some((issue) => issue.includes('missing note for Note Off')));
  t.true(issues.some((issue) => issue.includes('Tempo event has metaEventLength=2')));
  t.true(issues.some((issue) => issue.includes('Time Signature has metaEventLength=2')));
  t.true(issues.some((issue) => issue.includes('Key Signature has metaEventLength=1')));
  t.true(issues.some((issue) => issue.includes('SMPTE Offset has metaEventLength=2')));
  t.true(issues.some((issue) => issue.includes('Sequence Number has metaEventLength=1')));
  t.true(issues.some((issue) => issue.includes('has missing metaType')));
  t.true(issues.some((issue) => issue.includes('not active')));
  t.true(issues.some((issue) => issue.includes('missing End-of-Track')));
  t.true(issues.some((issue) => issue.includes('unmatched Note On')));
});

test('validate: reports a bad End-of-Track length and decrements matched notes', (t) => {
  const midi = new AudioMIDI();
  midi.trackCount = 1;
  midi.chunks = [{
    type: 'MTrk',
    chunkLength: 10,
    events: [
      { type: 0x90, deltaTime: 0, data: { note: 60, velocity: 100 } },
      { type: 0x90, deltaTime: 0, data: { note: 60, velocity: 0 } }, // velocity 0 -> note off, decrements
      { type: 0x80, deltaTime: 0, data: { note: 62, velocity: 0 } }, // never turned on -> issue
      { type: 0x90, deltaTime: 0, data: { note: 62, velocity: 100 } }, // on, then off below
      { type: 0x80, deltaTime: 0, data: { note: 62, velocity: 0 } },
      { type: 0xFF, deltaTime: 0, metaType: 0x2F, metaEventLength: 3, data: '' }, // Bad EoT length
    ],
  }];
  const issues = midi.validate();
  t.true(issues.some((issue) => issue.includes('End-of-Track has metaEventLength=3')));
  t.true(issues.some((issue) => issue.includes('Note Off note 62 which was not active')));
});

test('AudioMIDI.getControllerLabel: maps every known controller and the default', (t) => {
  /** @type {Record<number, string>} */
  const expected = {
    0x00: 'Bank Select (MSB)',
    0x01: 'Modulation Wheel (MSB)',
    0x02: 'Breath Controller (MSB)',
    0x04: 'Foot Controller (MSB)',
    0x05: 'Portamento Time (MSB)',
    0x06: 'Data Entry (MSB)',
    0x07: 'Volume (MSB)',
    0x08: 'Balance (MSB)',
    0x0A: 'Pan (MSB)',
    0x0B: 'Expression Controller (MSB)',
    0x0C: 'Effect Control 1 (MSB)',
    0x0D: 'Effect Control 2 (MSB)',
    0x10: 'General Purpose Controller 1 (MSB)',
    0x11: 'General Purpose Controller 2 (MSB)',
    0x12: 'General Purpose Controller 3 (MSB)',
    0x13: 'General Purpose Controller 4 (MSB)',
    0x20: 'Bank Select (LSB)',
    0x21: 'Modulation Wheel (LSB)',
    0x22: 'Breath Controller (LSB)',
    0x24: 'Foot Controller (LSB)',
    0x25: 'Portamento Time (LSB)',
    0x26: 'Data Entry (LSB)',
    0x27: 'Volume (LSB)',
    0x28: 'Balance (LSB)',
    0x2A: 'Pan (LSB)',
    0x2B: 'Expression Controller (LSB)',
    0x2C: 'Effect Control 1 (LSB)',
    0x2D: 'Effect Control 2 (LSB)',
    0x30: 'General Purpose Controller 1 (LSB)',
    0x31: 'General Purpose Controller 2 (LSB)',
    0x32: 'General Purpose #3 LSB',
    0x33: 'General Purpose #4 LSB',
    0x40: 'Hold Pedal #1',
    0x41: 'Portamento (GS)',
    0x42: 'Sostenuto (GS)',
    0x43: 'Soft Pedal (GS)',
    0x44: 'Legato Pedal',
    0x45: 'Hold Pedal #2',
    0x46: 'Sound Variation',
    0x47: 'Sound Timbre',
    0x48: 'Sound Release Time',
    0x49: 'Sound Attack Time',
    0x4A: 'Sound Brightness',
    0x4B: 'Sound Control #6',
    0x4C: 'Sound Control #7',
    0x4D: 'Sound Control #8',
    0x4E: 'Sound Control #9',
    0x4F: 'Sound Control #10',
    0x50: 'GP Control #5',
    0x51: 'GP Control #6',
    0x52: 'GP Control #7',
    0x53: 'GP Control #8',
    0x54: 'Portamento Control (GS)',
    0x5B: 'Reverb Level (GS)',
    0x5C: 'Tremolo Depth',
    0x5D: 'Chorus Level (GS)',
    0x5E: 'Celeste Depth',
    0x5F: 'Phaser Depth',
    0x60: 'Data Increment',
    0x61: 'Data Decrement',
    0x62: 'NRPN Parameter LSB (GS)',
    0x63: 'NRPN Parameter MSB (GS)',
    0x64: 'RPN Parameter LSB',
    0x65: 'RPN Parameter MSB',
    0x78: 'All Sound Off (GS)',
    0x79: 'Reset All Controllers',
    0x7A: 'Local On/Off',
    0x7B: 'All Notes Off',
    0x7C: 'Omni Mode Off',
    0x7D: 'Omni Mode On',
    0x7E: 'Mono Mode On',
    0x7F: 'Poly Mode On',
  };
  for (const [controller, label] of Object.entries(expected)) {
    t.is(AudioMIDI.getControllerLabel(Number(controller)), label);
  }
  t.is(AudioMIDI.getControllerLabel(0x03), 'Unknown Controller: 3');
});

test('AudioMIDI.getManufacturerLabel: known and unknown manufacturers', (t) => {
  t.is(AudioMIDI.getManufacturerLabel(0x41), 'Roland');
  t.is(AudioMIDI.getManufacturerLabel(0x43), 'Yamaha');
  t.is(AudioMIDI.getManufacturerLabel(0x7E), 'Universal Non Realtime Message (UNRT)');
  t.is(AudioMIDI.getManufacturerLabel(0x77), 'Unknown Manufacturer: 77');
});

test('AudioMIDI.writeVariableLengthValue: encodes single and multi-byte values', (t) => {
  const encode = (value) => {
    const dataBuffer = new DataBuffer();
    AudioMIDI.writeVariableLengthValue(dataBuffer, value);
    dataBuffer.commit();
    return [...dataBuffer.data];
  };
  t.deepEqual(encode(0), [0x00]);
  t.deepEqual(encode(127), [0x7F]);
  t.deepEqual(encode(128), [0x81, 0x00]);
  t.deepEqual(encode(0x4000), [0x81, 0x80, 0x00]);
  // Non-integer values are rounded.
  t.deepEqual(encode(0.4), [0x00]);
});

test('AudioMIDI.writeEventData: handles Uint8Array, arrays and strings', (t) => {
  const collect = (data) => {
    const dataBuffer = new DataBuffer();
    AudioMIDI.writeEventData(dataBuffer, data);
    dataBuffer.commit();
    return [...dataBuffer.data];
  };
  t.deepEqual(collect(new Uint8Array([0x01, 0x02])), [0x01, 0x02]);
  t.deepEqual(collect([0x03, 0x04]), [0x03, 0x04]);
  t.deepEqual(collect('AB'), [0x41, 0x42]);
});

test('AudioMIDI.writeEventData: throws on invalid data', (t) => {
  const dataBuffer = new DataBuffer();
  t.throws(() => AudioMIDI.writeEventData(dataBuffer, [0x01, undefined]), { message: /Invalid data/ });
  t.throws(() => AudioMIDI.writeEventData(dataBuffer, 123), { message: /Invalid writeEventData/ });
});

test('AudioMIDI.generateTempoEvent: computes the tempo bytes from BPM', (t) => {
  const event = AudioMIDI.generateTempoEvent(120);
  t.is(event.type, 0xFF);
  t.is(event.metaType, 0x51);
  t.is(event.metaEventLength, 3);
  t.is(event.data.tempo, 500000);
  t.is(event.data.bpm, 120);
  t.deepEqual([event.data.byte1, event.data.byte2, event.data.byte3], [0x07, 0xA1, 0x20]);
});

test('AudioMIDI.generateMetaStringEvent: known and unknown meta types', (t) => {
  const known = AudioMIDI.generateMetaStringEvent(0x03, 'Track');
  t.is(known.label, 'Sequence / Track Name');
  t.is(known.metaEventLength, 5);
  t.is(known.data, 'Track');

  const unknown = AudioMIDI.generateMetaStringEvent(0x60, 'Custom');
  t.is(unknown.label, 'Meta Event 0x60: Custom');
});

test('AudioMIDI.generateEndOfTrackEvent: returns the canonical EoT event', (t) => {
  t.deepEqual(AudioMIDI.generateEndOfTrackEvent(), {
    data: '',
    deltaTime: 0,
    type: 0xFF,
    metaType: 0x2F,
    metaEventLength: 0,
    label: 'End of Track',
  });
});

test('convertToMidi: builds a track with tempo, meta and notes', (t) => {
  const midi = AudioMIDI.convertToMidi({
    ppq: 480,
    bpm: 120,
    tracks: [{
      notes: [
        { midiNote: 60, velocity: 100, length: 240, ticks: 480 },
        { midiNote: 62, velocity: 90, length: 240, ticks: 480 },
      ],
      metaStringEvents: { 0x03: 'Custom MIDI' },
    }],
    skipNotes: [62],
  });
  t.is(midi.chunks.length, 1);
  t.is(midi.timeDivision, 480);
  const labels = midi.chunks[0].events.map((event) => event.label);
  // The tempo and track name plus a single (non-skipped) note on/off pair.
  t.deepEqual(labels, ['Set Tempo', 'Sequence / Track Name', 'Note On', 'Note Off']);
});

test('convertToMidi: omits the tempo event when no BPM is provided', (t) => {
  const midi = AudioMIDI.convertToMidi({
    tracks: [{
      notes: [{ midiNote: 60, velocity: 100, length: 240, ticks: 480 }],
      metaStringEvents: {},
    }],
  });
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, ['Note On', 'Note Off']);
});

test('convertToMidi: tolerates a track that omits metaStringEvents', (t) => {
  // `metaStringEvents` is documented optional and must not be dereferenced when missing.
  const midi = AudioMIDI.convertToMidi({
    tracks: [{ notes: [{ midiNote: 60, velocity: 100, length: 240, ticks: 480 }] }],
  });
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, ['Note On', 'Note Off']);
});

test('convertToMidi: tolerates a track that omits notes', (t) => {
  // `notes` is optional; only the metaStringEvents should be emitted.
  const midi = AudioMIDI.convertToMidi({
    tracks: [{ metaStringEvents: { 0x03: 'Empty' } }],
  });
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, ['Sequence / Track Name']);
});

test('convertToMidi: tolerates being called with no tracks', (t) => {
  // `tracks` is optional; the result is an empty MIDI instance.
  const midi = AudioMIDI.convertToMidi({});
  t.is(midi.chunks.length, 0);
  t.is(midi.trackCount, 0);
});

test('convertToMidi: keeps trackCount in sync so the file round-trips', (t) => {
  const midi = AudioMIDI.convertToMidi({
    bpm: 120,
    tracks: [
      { notes: [{ midiNote: 60, velocity: 100, length: 240, ticks: 480 }], metaStringEvents: {} },
      { notes: [{ midiNote: 64, velocity: 100, length: 240, ticks: 480 }], metaStringEvents: {} },
    ],
  });
  // trackCount must match the number of chunks, otherwise the saved header is wrong.
  t.is(midi.trackCount, 2);
  t.is(midi.chunks.length, 2);

  // Each track needs an End of Track to be a valid, re-parseable chunk.
  for (const chunk of midi.chunks) {
    chunk.events.push(AudioMIDI.generateEndOfTrackEvent());
  }
  midi.format = 1;
  const reparsed = new AudioMIDI(midi.saveToDataBuffer().data);
  reparsed.parse();
  // Without the trackCount fix the header would claim 0 tracks and nothing would parse.
  t.is(reparsed.trackCount, 2);
  t.is(reparsed.chunks.length, 2);
});

test('AudioMIDI.noteToMidi: converts notes to MIDI values', (t) => {
  t.is(AudioMIDI.noteToMidi('C4'), 72);
  t.is(AudioMIDI.noteToMidi('C3'), 60);
  t.is(AudioMIDI.noteToMidi('C1'), 36);
  t.is(AudioMIDI.noteToMidi('C-1'), 12);
  t.is(AudioMIDI.noteToMidi('C-2'), 0);
  t.is(AudioMIDI.noteToMidi('C#4'), 73);
});

test('AudioMIDI.noteToMidi: throws on invalid format', (t) => {
  t.throws(() => AudioMIDI.noteToMidi('H9'), { message: /Invalid note format/ });
});

test('AudioMIDI.noteToMidi: throws when out of MIDI range', (t) => {
  t.throws(() => AudioMIDI.noteToMidi('C9'), { message: /out of valid MIDI range/ });
  t.throws(() => AudioMIDI.noteToMidi('C-3'), { message: /out of valid MIDI range/ });
});

test('AudioMIDI.midiToNote: converts MIDI values to notes', (t) => {
  t.is(AudioMIDI.midiToNote(72), 'C4');
  t.is(AudioMIDI.midiToNote(60), 'C3');
  t.is(AudioMIDI.midiToNote(36), 'C1');
  t.is(AudioMIDI.midiToNote(12), 'C-1');
  t.is(AudioMIDI.midiToNote(0), 'C-2');
  t.is(AudioMIDI.midiToNote(73), 'C#4');
});

test('AudioMIDI.midiToNote: throws when out of range', (t) => {
  t.throws(() => AudioMIDI.midiToNote(128), { message: /Invalid MIDI value/ });
  t.throws(() => AudioMIDI.midiToNote(-1), { message: /Invalid MIDI value/ });
});
