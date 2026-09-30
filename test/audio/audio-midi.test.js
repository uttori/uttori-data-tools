import test from 'ava';
import { promises as fs } from 'fs';
import { DataBuffer, AudioMIDI } from '../../dist/index.js';

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
 * @param {import('../../dist/audio/audio-midi.js').MidiTrackEvent} event The event to write.
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
  // A second End of Track sits after the real one and is trailing data, not another event.
  t.is(midi.chunks[0].events.length, 157);
  t.deepEqual([...midi.chunks[0].trailingData], [0x00, 0xff, 0x2f, 0x00]);

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

test('parse: System Exclusive (0xF0) reads the length-delimited SMF payload', (t) => {
  const midi = parseTrack([
    0x00, 0xF0, 0x04, 0x41, 0x10, 0x20, 0xF7, // SysEx length 4, Roland, [0x10, 0x20]
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
    0x00, 0xF3, 0x40, // Song Select
    0x00, 0xF4, // Undefined 0xF4
    0x00, 0xF5, // Undefined 0xF5
    0x00, 0xF6, // Tune Request
    0x00, 0xF7, 0x00, // EOX
    0x00, 0xF8, // MIDI Clock
    0x00, 0xF9, // Undefined 0xF9
    0x00, 0xFA, // Start
    0x00, 0xFB, // Continue
    0x00, 0xFC, // Stop
    0x00, 0xFD, // Undefined 0xFD
    0x00, 0xFE, // Active Sensing
    0x00, 0xFF, 0x2F, 0x00, // End of Track
  ]);
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, [
    'Song Position Pointer',
    'System Common Messages - Song Select',
    'System Common Messages - Undefined 0xF4 (Reserved)',
    'System Common Messages - Undefined 0xF5 (Reserved)',
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
  t.deepEqual(midi.chunks[0].events[0].data, { msb: 0x20, lsb: 0x10 });
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
    0x00, 0xF1, 0x7F, // 0xF1 -> MIDI Time Code Quarter Frame
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
  // 0x10 (< 0x80) with no preceding channel status cannot start an event.
  t.throws(() => parseTrack([0x00, 0x10, 0xFF, 0x2F, 0x00]), { message: /running status/ });
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

test('parse: Sequence Number with an invalid length preserves its raw payload', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x00, 0x01, 0x05, // Sequence Number, length 1 (invalid)
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const seq = midi.chunks[0].events[0];
  t.deepEqual(seq.data, new Uint8Array([0x05]));
  t.true(midi.validate().some((issue) => issue.includes('Sequence Number has metaEventLength=1')));
});

test('parse: End of Track with a non-zero length is preserved and reported', (t) => {
  const midi = parseTrack([
    0x00, 0xFF, 0x2F, 0x01, 0x12, // End of Track, length 1 (invalid)
    0x00, 0xFF, 0x2F, 0x00, // Preserved trailing bytes after the first End of Track
  ]);
  t.is(midi.chunks[0].events[0].label, 'End of Track');
  t.deepEqual(midi.chunks[0].events[0].data, new Uint8Array([0x12]));
  t.true(midi.validate().some((issue) => issue.includes('End-of-Track has metaEventLength=1')));
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
    0x00, 0xFF, 0x59, 0x02, 0x02, 0x01, // B Minor (two sharps)
    0x00, 0xFF, 0x59, 0x02, 0xFF, 0x00, // -1 (one flat) -> F Major
    0x00, 0xFF, 0x59, 0x02, 0x08, 0x00, // 8 sharps (out of range) -> Unknown Key
    0x00, 0xFF, 0x59, 0x03, 0x00, 0x00, 0x00, // Invalid length
    0x00, 0xFF, 0x2F, 0x00,
  ]);
  const keys = midi.chunks[0].events.filter((event) => event.label === 'Key Signature');
  t.is(keys[0].data.keyName, 'C');
  t.is(keys[0].data.mode, 'Major');
  t.is(keys[1].data.keyName, 'B');
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
    0x00, 0xFF, 0x4B, 0x03, 0x01, 0x41, 0x42, // Genre
    0x00, 0xFF, 0x4B, 0x03, 0x02, 0x41, 0x42, // Artist
    0x00, 0xFF, 0x4B, 0x03, 0x03, 0x41, 0x42, // Composer
    0x00, 0xFF, 0x4B, 0x03, 0x04, 0x41, 0x42, // Duration
    0x00, 0xFF, 0x4B, 0x03, 0x05, 0x41, 0x42, // BPM
    0x00, 0xFF, 0x4B, 0x03, 0x09, 0x41, 0x42, // Unknown tag
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
  t.is(header.framesPerSecond, 25);
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
  t.deepEqual(writeOne({ type: 0xF0, deltaTime: 0, data: { manufacturerId: 0x41, data: [0x10, 0x20] } }), [0x00, 0xF0, 0x04, 0x41, 0x10, 0x20, 0xF7]);
  t.throws(() => writeOne({ type: 0xF0, deltaTime: 0, data: { data: [0x10] } }), { message: /Invalid manufacturerId/ });
});

test('writeEvent: Song Select', (t) => {
  t.deepEqual(writeOne({ type: 0xF3, deltaTime: 0, data: { songNumber: 3 } }), [0x00, 0xF3, 0x03]);
  t.throws(() => writeOne({ type: 0xF3, deltaTime: 0, data: {} }), { message: /Invalid songNumber/ });
});

test('writeEvent: data-less system messages', (t) => {
  t.deepEqual(writeOne({ type: 0xF6, deltaTime: 0 }), [0x00, 0xF6]); // Tune Request
  t.deepEqual(writeOne({ type: 0xF7, deltaTime: 0 }), [0x00, 0xF7, 0x00]); // Empty SMF continuation / escape packet
  t.deepEqual(writeOne({ type: 0xF8, deltaTime: 0 }), [0x00, 0xF8]); // MIDI Clock
  t.deepEqual(writeOne({ type: 0xFA, deltaTime: 0 }), [0x00, 0xFA]); // Start
  t.deepEqual(writeOne({ type: 0xFB, deltaTime: 0 }), [0x00, 0xFB]); // Continue
  t.deepEqual(writeOne({ type: 0xFC, deltaTime: 0 }), [0x00, 0xFC]); // Stop
  t.deepEqual(writeOne({ type: 0xFE, deltaTime: 0 }), [0x00, 0xFE]); // Active Sensing
});

test('writeEvent: rejects a data byte used as an event type', (t) => {
  // A value below 0x80 cannot be a status byte and must not produce an incomplete event.
  t.throws(() => writeOne({ type: 0x70, deltaTime: 0 }), { message: /Invalid status byte/ });
});

test('writeEvent: Meta Sequence Number', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 2, data: { sequenceNumber: 0x0102 } }), [0x00, 0xFF, 0x00, 0x02, 0x01, 0x02]);
  // A sequence number of `0` is valid.
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 2, data: { sequenceNumber: 0 } }), [0x00, 0xFF, 0x00, 0x02, 0x00, 0x00]);
  t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 2, data: {} }), { message: /Invalid sequenceNumber/ });
});

test('writeEvent: Meta text events', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x03, metaEventLength: 3, data: 'abc' }), [0x00, 0xFF, 0x03, 0x03, 0x61, 0x62, 0x63]);
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x01, metaEventLength: 0, data: '' }), [0x00, 0xFF, 0x01, 0x00]);
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

test('writeEvent: an unknown meta event supports an empty payload', (t) => {
  // An unknown meta type still writes the status, metaType and actual payload length,
  // followed by its raw data (empty in this case).
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
    0x00, 0xFF, 0x59, 0x02, 0xFE, 0x01, // Key Signature -2 (G Minor)
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
  t.is(midi.framesPerSecond, 25);
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
  // Non-integer values are rejected rather than silently rounded.
  t.throws(() => encode(0.4), { message: /variable-length value/ });
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
  // The tempo and track name plus a single (non-skipped) note on/off pair and End of Track.
  t.deepEqual(labels, ['Set Tempo', 'Sequence / Track Name', 'Note On', 'Note Off', 'End of Track']);
});

test('convertToMidi: omits the tempo event when no BPM is provided', (t) => {
  const midi = AudioMIDI.convertToMidi({
    tracks: [{
      notes: [{ midiNote: 60, velocity: 100, length: 240, ticks: 480 }],
      metaStringEvents: {},
    }],
  });
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, ['Note On', 'Note Off', 'End of Track']);
});

test('convertToMidi: tolerates a track that omits metaStringEvents', (t) => {
  // `metaStringEvents` is documented optional and must not be dereferenced when missing.
  const midi = AudioMIDI.convertToMidi({
    tracks: [{ notes: [{ midiNote: 60, velocity: 100, length: 240, ticks: 480 }] }],
  });
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, ['Note On', 'Note Off', 'End of Track']);
});

test('convertToMidi: tolerates a track that omits notes', (t) => {
  // `notes` is optional; the metaStringEvents and required End of Track should be emitted.
  const midi = AudioMIDI.convertToMidi({
    tracks: [{ metaStringEvents: { 0x03: 'Empty' } }],
  });
  const labels = midi.chunks[0].events.map((event) => event.label);
  t.deepEqual(labels, ['Sequence / Track Name', 'End of Track']);
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

  // Each track needs an End of Track to be a valid, re-parseable chunk; conversion now adds it.
  for (const chunk of midi.chunks) {
    t.is(chunk.events.at(-1).metaType, 0x2F);
  }
  t.is(midi.format, 1);
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

// Regression coverage for SMF framing, malformed input, serialization and utility edge cases.

/** Reparse a saved instance without relying on external MIDI fixtures. */
const roundTrip = (midi) => {
  const result = new AudioMIDI(midi.saveToDataBuffer().data);
  result.parse();
  return result;
};

/** Encode a delta time independently of the track-building helpers. */
const encodeVLQ = (value) => {
  const buffer = new DataBuffer();
  AudioMIDI.writeVariableLengthValue(buffer, value);
  buffer.commit();
  return [...buffer.data];
};

for (const [value, bytes] of [
  [0, [0x00]], [127, [0x7F]], [128, [0x81, 0x00]],
  [16383, [0xFF, 0x7F]], [16384, [0x81, 0x80, 0x00]],
  [2097151, [0xFF, 0xFF, 0x7F]], [2097152, [0x81, 0x80, 0x80, 0x00]],
  [0x0FFFFFFF, [0xFF, 0xFF, 0xFF, 0x7F]],
]) {
  test(`variable-length quantities: boundary ${value}`, (t) => {
    t.deepEqual(encodeVLQ(value), bytes);
    const midi = new AudioMIDI(new Uint8Array(bytes));
    t.is(midi.readVariableLengthValues(), value);
    t.is(midi.offset, bytes.length);
  });
}

for (const value of [-1, -0.1, 0.5, NaN, Infinity, -Infinity, 0x10000000, 0xFFFFFFFF, undefined, null, '1']) {
  test(`writeVariableLengthValue: rejects ${String(value)} (${typeof value})`, (t) => {
    const buffer = new DataBuffer();
    t.throws(() => AudioMIDI.writeVariableLengthValue(buffer, value), { instanceOf: RangeError });
    t.is(buffer.offset, 0);
    t.is(buffer.buffer.length, 0);
  });
}

for (const bytes of [[], [0x80], [0x80, 0x80], [0x80, 0x80, 0x80], [0x80, 0x80, 0x80, 0x80], [0x81, 0x80, 0x80, 0x80, 0x00]]) {
  test(`readVariableLengthValues: rejects truncated or overlong ${JSON.stringify(bytes)}`, (t) => {
    const midi = new AudioMIDI(new Uint8Array(bytes));
    t.throws(() => midi.readVariableLengthValues(), { instanceOf: RangeError });
    t.true(midi.offset <= Math.min(bytes.length, 4));
  });
}

test('readVariableLengthValues: obeys an explicit end boundary', (t) => {
  const midi = new AudioMIDI(new Uint8Array([0x81, 0x00]));
  t.throws(() => midi.readVariableLengthValues(1), { message: /Truncated/ });
  t.is(midi.offset, 1);
  t.throws(() => midi.readVariableLengthValues(3), { message: /boundary/ });
});

test('decodeHeader: rejects every truncated required header prefix', (t) => {
  const bytes = new Uint8Array(MThd(0, 1, 480));
  for (let length = 0; length < bytes.length; length++) {
    t.throws(() => AudioMIDI.decodeHeader(bytes.subarray(0, length)));
  }
});

test('decodeHeader: rejects invalid magic, header length, format and zero PPQN', (t) => {
  const magic = new Uint8Array(MThd(0, 1, 480));
  magic[0] = 0;
  t.throws(() => AudioMIDI.decodeHeader(magic), { message: /header/ });
  const shortHeader = new Uint8Array(MThd(0, 1, 480));
  shortHeader[7] = 5;
  t.throws(() => AudioMIDI.decodeHeader(shortHeader), { message: /header length/ });
  t.throws(() => AudioMIDI.decodeHeader(new Uint8Array(MThd(3, 1, 480))), { message: /format/ });
  t.throws(() => AudioMIDI.decodeHeader(new Uint8Array(MThd(0, 1, 0))), { message: /PPQN/ });
});

test('parse: skips extended header fields and unknown chunks without counting them as tracks', (t) => {
  const header = MThd(1, 2, 480);
  header[7] = 9;
  const unknown = [0x4A, 0x55, 0x4E, 0x4B, 0, 0, 0, 3, 1, 2, 3];
  const end = MTrk([0, 0xFF, 0x2F, 0]);
  const midi = new AudioMIDI(new Uint8Array([...header, 10, 20, 30, ...unknown, ...end, ...unknown, ...end]));
  midi.parse();
  t.is(midi.chunks.length, 2);
  t.deepEqual(midi.validate(), []);
});

test('parse: rejects a truncated header extension and truncated chunk headers', (t) => {
  const header = MThd(0, 1, 480);
  header[7] = 7;
  t.throws(() => new AudioMIDI(new Uint8Array(header)).parse(), { message: /header extension/ });
  for (let length = 1; length < 8; length++) {
    const midi = new AudioMIDI(new Uint8Array([...MThd(0, 1, 480), ...new Array(length).fill(0)]));
    t.throws(() => midi.parse(), { message: /chunk header/ });
  }
});

test('parse: rejects declared track payloads longer than the remaining file', (t) => {
  const bytes = buildMidi([0, 0xFF, 0x2F, 0]);
  bytes[21]++;
  t.throws(() => new AudioMIDI(bytes).parse(), { message: /Truncated MTrk/ });
});

for (const [name, data] of [
  ['delta time', [0x81]],
  ['status byte', [0]],
  ['note velocity', [0, 0x90, 60]],
  ['program number', [0, 0xC0]],
  ['meta type', [0, 0xFF]],
  ['meta length', [0, 0xFF, 1, 0x81]],
  ['meta payload', [0, 0xFF, 1, 3, 65]],
  ['SysEx length', [0, 0xF0, 0x81]],
  ['SysEx payload', [0, 0xF0, 4, 0x41]],
  ['F7 payload', [0, 0xF7, 4, 0x10]],
  ['song position', [0, 0xF2, 0x10]],
]) {
  test(`parse: ${name} cannot consume the following track header`, (t) => {
    const midi = new AudioMIDI(new Uint8Array([
      ...MThd(1, 2, 480), ...MTrk(data), ...MTrk([0, 0xFF, 0x2F, 0]),
    ]));
    const trackEnd = 22 + data.length;
    t.throws(() => midi.parse());
    t.true(midi.offset <= trackEnd);
  });
}

test('parse: rejects high-bit channel data and invalid meta subtypes', (t) => {
  for (const data of [[0, 0x90, 0x80, 1], [0, 0x90, 60, 0xFF], [0, 0xC0, 0x80], [0, 0xFF, 0x80, 0]]) {
    t.throws(() => parseTrack([...data, 0, 0xFF, 0x2F, 0]), { message: /Invalid/ });
  }
});

test('parse: repeated calls reset the cursor, tracks and active-note state', (t) => {
  const midi = parseTrack([0, 0x90, 60, 100, 10, 0x80, 60, 0, 0, 0xFF, 0x2F, 0]);
  const first = JSON.stringify(midi.chunks);
  midi.parse();
  t.is(JSON.stringify(midi.chunks), first);
  t.is(midi.offset, midi.data.length);
  t.is(midi.chunks.length, 1);
});

test('parse: respects non-zero Uint8Array and Buffer view offsets', (t) => {
  const bytes = buildMidi([0, 0xFF, 0x2F, 0]);
  const storage = Buffer.alloc(bytes.length + 8, 0xCC);
  storage.set(bytes, 4);
  for (const input of [storage.subarray(4, -4), new Uint8Array(storage.buffer, storage.byteOffset + 4, bytes.length)]) {
    const midi = new AudioMIDI(input);
    midi.parse();
    t.is(midi.chunks.length, 1);
    t.is(midi.timeDivision, 480);
  }
});

for (const [name, event] of [
  ['meta', [0, 0xFF, 1, 0]],
  ['SysEx', [0, 0xF0, 2, 0x41, 0xF7]],
  ['F7 escape', [0, 0xF7, 0]],
  ['quarter frame', [0, 0xF1, 0]],
  ['song position', [0, 0xF2, 0, 0]],
  ['song select', [0, 0xF3, 0]],
  ['reserved F4', [0, 0xF4]],
  ['reserved F5', [0, 0xF5]],
  ['tune request', [0, 0xF6]],
]) {
  test(`parse: ${name} cancels channel running status`, (t) => {
    t.throws(() => parseTrack([0, 0x90, 60, 100, ...event, 0, 60, 0, 0, 0xFF, 0x2F, 0]), { message: /running status/ });
  });
}

test('parse: direct real-time compatibility messages preserve channel running status', (t) => {
  const statuses = [0xF8, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE];
  for (const status of statuses) {
    const midi = parseTrack([0, 0x90, 60, 100, 5, status, 5, 60, 0, 0, 0xFF, 0x2F, 0]);
    t.is(midi.chunks[0].events[0].data.length, 10);
    t.is(midi.chunks[0].events[1].type, status);
    t.deepEqual(roundTrip(midi).chunks, midi.chunks);
  }
});

test('parse: running status uses the correct one-byte lengths for programs and pressure', (t) => {
  const midi = parseTrack([0, 0xC5, 1, 10, 2, 0, 0xD9, 3, 10, 4, 0, 0xFF, 0x2F, 0]);
  t.deepEqual(midi.chunks[0].events.slice(0, 4).map((event) => [event.type, event.data]), [[0xC5, 1], [0xC5, 2], [0xD9, 3], [0xD9, 4]]);
});

test('parse: matches equal pitches independently on all sixteen channels', (t) => {
  const bytes = [];
  for (let channel = 0; channel < 16; channel++) bytes.push(1, 0x90 | channel, 60, 100);
  for (let channel = 0; channel < 16; channel++) bytes.push(1, 0x80 | channel, 60, 0);
  const midi = parseTrack([...bytes, 0, 0xFF, 0x2F, 0]);
  t.deepEqual(midi.chunks[0].events.slice(0, 32).map((event) => event.data.length), new Array(32).fill(16));
  t.deepEqual(midi.validate(), []);
  t.deepEqual(roundTrip(midi).chunks, midi.chunks);
});

test('parse: notes in one track never release notes from another track', (t) => {
  const midi = new AudioMIDI(new Uint8Array([
    ...MThd(1, 2, 480),
    ...MTrk([100, 0x90, 60, 100, 0, 0xFF, 0x2F, 0]),
    ...MTrk([5, 0x80, 60, 0, 0, 0x90, 62, 100, 10, 0x80, 62, 0, 0, 0xFF, 0x2F, 0]),
  ]));
  midi.parse();
  t.is(midi.chunks[0].events[0].data.length, undefined);
  t.is(midi.chunks[1].events[0].data.length, 0);
  t.is(midi.chunks[1].events[1].data.length, 10);
});

test('parse: overlapping equal-pitch notes use FIFO release matching', (t) => {
  const midi = parseTrack([0, 0x90, 60, 100, 10, 0x90, 60, 80, 10, 0x80, 60, 0, 10, 0x90, 60, 0, 0, 0xFF, 0x2F, 0]);
  t.deepEqual(midi.chunks[0].events.slice(0, 4).map((event) => event.data.length), [20, 20, 20, 20]);
  t.is(midi.chunks[0].events[3].label, 'Note On');
  t.deepEqual(midi.validate(), []);
});

test('parse: long overlapping-note queues do not lose Note On events', (t) => {
  const bytes = [];
  for (let i = 0; i < 2000; i++) bytes.push(1, 0x90, 60, 100);
  for (let i = 0; i < 2000; i++) bytes.push(1, 0x80, 60, 0);
  const midi = parseTrack([...bytes, 0, 0xFF, 0x2F, 0]);
  t.true(midi.chunks[0].events.slice(0, 4000).every((event) => event.data.length === 2000));
  t.deepEqual(midi.validate(), []);
});

test('parse: a zero-velocity Note On releases rather than replacing the active note', (t) => {
  const midi = parseTrack([0, 0x90, 60, 100, 12, 60, 0, 3, 0x80, 60, 0, 0, 0xFF, 0x2F, 0]);
  t.is(midi.chunks[0].events[0].data.length, 12);
  t.is(midi.chunks[0].events[1].data.length, 12);
  t.is(midi.chunks[0].events[2].data.length, 0);
  t.deepEqual(midi.getUsedNotes().map((note) => note.noteNumber), [60]);
});

test('parse: MIDI Port changes keep active notes on different ports separate', (t) => {
  const midi = parseTrack([
    0, 0x90, 60, 100,
    0, 0xFF, 0x21, 1, 1,
    10, 0x80, 60, 0,
    0, 0xFF, 0x21, 1, 0,
    10, 0x80, 60, 0,
    0, 0xFF, 0x2F, 0,
  ]);
  t.is(midi.chunks[0].events[0].data.length, 20);
  t.is(midi.chunks[0].events[2].data.length, 0);
  t.true(midi.validate().some((issue) => issue.includes('not active')));
});

test('parse: zero-length Sequence Number uses the zero-based current track index', (t) => {
  const bytes = [0, 0xFF, 0, 0, 0, 0xFF, 0x2F, 0];
  const midi = new AudioMIDI(new Uint8Array([...MThd(2, 2, 480), ...MTrk(bytes), ...MTrk(bytes)]));
  midi.parse();
  t.deepEqual(midi.chunks.map((track) => track.events[0].data.sequenceNumber), [0, 1]);
  t.deepEqual(roundTrip(midi).chunks, midi.chunks);
});

for (const [metaType, payload] of [[0x00, [1]], [0x20, []], [0x21, [1, 2]], [0x4B, []], [0x51, [1, 2]], [0x54, [1, 2]], [0x58, [1, 2]], [0x59, [1, 2, 3]]]) {
  test(`parse: invalid meta length for ${metaType.toString(16)} remains bounded and round-trips`, (t) => {
    const midi = parseTrack([0, 0xFF, metaType, payload.length, ...payload, 0, 0xFF, 0x2F, 0]);
    t.deepEqual(midi.chunks[0].events[0].data, new Uint8Array(payload));
    t.is(midi.chunks[0].events[1].metaType, 0x2F);
    t.deepEqual(roundTrip(midi).chunks, midi.chunks);
    t.true(midi.validate().length > 0);
  });
}

test('parse: M-Live Tag consumes its tag exactly once and supports an empty tag value', (t) => {
  const midi = parseTrack([0, 0xFF, 0x4B, 1, 1, 0, 0xFF, 0x4B, 3, 2, 65, 66, 0, 0xFF, 0x2F, 0]);
  t.deepEqual(midi.chunks[0].events[0].data.tagValue, new Uint8Array());
  t.deepEqual(midi.chunks[0].events[1].data.tagValue, new Uint8Array([65, 66]));
  t.deepEqual(roundTrip(midi).chunks, midi.chunks);
});

test('parse: unknown meta payloads preserve arbitrary bytes including status values', (t) => {
  const data = [0, 0xFF, 0x60, 4, 0, 0x80, 0xF7, 0xFF, 0, 0xFF, 0x2F, 0];
  const midi = parseTrack(data);
  t.deepEqual(midi.chunks[0].events[0].data, new Uint8Array([0, 0x80, 0xF7, 0xFF]));
  t.deepEqual([...midi.saveToDataBuffer().data], [...buildMidi(data)]);
});

test('parse: stops at End of Track and preserves trailing bytes without inventing events', (t) => {
  const bytes = [0, 0xFF, 0x2F, 0, 0, 0xFF, 0x2F, 0, 0x81];
  const midi = parseTrack(bytes);
  t.is(midi.chunks[0].events.length, 1);
  t.deepEqual(midi.chunks[0].trailingData, new Uint8Array(bytes.slice(4)));
  t.deepEqual([...midi.saveToDataBuffer().data], [...buildMidi(bytes)]);
  t.true(midi.validate().some((issue) => issue.includes('trailing bytes')));
});

test('parse: fractional tempo is not rounded and zero tempo never creates Infinity', (t) => {
  const event = AudioMIDI.generateTempoEvent(123.45);
  const midi = parseTrack([...writeOne(event), 0, 0xFF, 0x2F, 0]);
  t.is(midi.chunks[0].events[0].data.bpm, 60000000 / event.data.tempo);
  const zero = parseTrack([0, 0xFF, 0x51, 3, 0, 0, 0, 0, 0xFF, 0x2F, 0]);
  t.is(zero.chunks[0].events[0].data.bpm, undefined);
  t.true(zero.validate().some((issue) => issue.includes('Tempo')));
});

test('parse: all minor key names reflect their signed key signatures', (t) => {
  const names = ['A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];
  for (let key = -7; key <= 7; key++) {
    const midi = parseTrack([0, 0xFF, 0x59, 2, key & 0xFF, 1, 0, 0xFF, 0x2F, 0]);
    t.is(midi.chunks[0].events[0].data.keyName, names[key + 7]);
    t.deepEqual(roundTrip(midi).chunks, midi.chunks);
  }
});

for (const [code, rate] of [[24, 24], [25, 25], [29, 29.97], [30, 30]]) {
  test(`SMPTE: frame code -${code} decodes and writes back unchanged`, (t) => {
    const division = ((256 - code) << 8) | 80;
    const midi = parseTrack([0, 0xFF, 0x2F, 0], { timeDivision: division });
    t.is(midi.framesPerSecond, rate);
    t.is(midi.timeDivision, 0);
    t.is(midi.ticksPerFrame, 80);
    const bytes = midi.saveToDataBuffer().data;
    t.is((bytes[12] << 8) | bytes[13], division);
    t.is(roundTrip(midi).framesPerSecond, rate);
    t.deepEqual(midi.validate(), []);
  });
}

test('SMPTE: invalid frame codes and zero ticks per frame are rejected', (t) => {
  for (const division of [0x8001, 0xE601, 0xE701, 0xE700]) {
    if (division === 0xE701) {
      t.is(AudioMIDI.decodeHeader(new Uint8Array(MThd(0, 1, division))).framesPerSecond, 25);
    } else {
      t.throws(() => AudioMIDI.decodeHeader(new Uint8Array(MThd(0, 1, division))), { message: /SMPTE/ });
    }
  }
});

for (const text of ['', '日本語 🎹 café', '\uFEFFBOM\0text', 'x'.repeat(300), 'replacement \uFFFD']) {
  test(`text meta events: exact UTF-8 round-trip for ${JSON.stringify(text).slice(0, 45)}`, (t) => {
    const event = AudioMIDI.generateMetaStringEvent(3, text);
    const midi = parseTrack([...writeOne(event), 0, 0xFF, 0x2F, 0]);
    t.is(midi.chunks[0].events[0].data, text);
    t.is(midi.chunks[0].events[0].metaEventLength, new TextEncoder().encode(text).length);
    t.deepEqual(roundTrip(midi).chunks, midi.chunks);
  });
}

test('text meta events: legacy non-UTF-8 bytes are retained until the text is edited', (t) => {
  const bytes = [0, 0xFF, 3, 4, 0xFF, 0xFE, 0x80, 0, 0, 0xFF, 0x2F, 0];
  const midi = parseTrack(bytes);
  t.deepEqual(midi.chunks[0].events[0].textBytes, new Uint8Array([0xFF, 0xFE, 0x80, 0]));
  t.deepEqual([...midi.saveToDataBuffer().data], [...buildMidi(bytes)]);
  midi.chunks[0].events[0].data = 'New 🎹';
  t.is(roundTrip(midi).chunks[0].events[0].data, 'New 🎹');
});

test('writeEvent: text lengths are derived from encoded bytes, not stale character counts', (t) => {
  const event = { type: 0xFF, metaType: 3, deltaTime: 0, metaEventLength: 1, data: '🎹' };
  t.deepEqual(writeOne(event), [0, 0xFF, 3, 4, 0xF0, 0x9F, 0x8E, 0xB9]);
  t.is(event.metaEventLength, 1);
  t.deepEqual(writeOne({ type: 0xFF, metaType: 3, deltaTime: 0, data: '' }), [0, 0xFF, 3, 0]);
});

test('SysEx: zero-length, partial, split and escaped SMF packets round-trip exactly', (t) => {
  const packets = [
    [0, 0xF0, 0],
    [0, 0xF0, 1, 0],
    [0, 0xF0, 2, 0, 1],
    [0, 0xF0, 3, 0x41, 1, 2],
    [4, 0xF7, 3, 3, 4, 0xF7],
    [0, 0xF7, 4, 0xF2, 1, 2, 0xF8],
    [0, 0xF7, 0],
  ];
  const bytes = [...packets.flat(), 0, 0xFF, 0x2F, 0];
  const midi = parseTrack(bytes);
  t.is(midi.chunks[0].events[3].data.terminated, false);
  t.deepEqual([...midi.saveToDataBuffer().data], [...buildMidi(bytes)]);
  t.deepEqual(roundTrip(midi).chunks, midi.chunks);
});

test('SysEx: three-byte manufacturer IDs beginning with zero are not rejected or lost', (t) => {
  const event = { type: 0xF0, deltaTime: 0, data: { manufacturerId: 0, manufacturerIdBytes: [0, 0x20, 0x33], data: [1, 2] } };
  const bytes = writeOne(event);
  t.deepEqual(bytes, [0, 0xF0, 6, 0, 0x20, 0x33, 1, 2, 0xF7]);
  const midi = parseTrack([...bytes, 0, 0xFF, 0x2F, 0]);
  t.deepEqual(midi.chunks[0].events[0].data.manufacturerIdBytes, [0, 0x20, 0x33]);
  t.deepEqual(roundTrip(midi).chunks, midi.chunks);
});

test('SysEx: payloads longer than 127 bytes use multi-byte lengths', (t) => {
  const payload = new Uint8Array(300).fill(1);
  payload[0] = 0x41;
  payload[299] = 0xF7;
  const bytes = writeOne({ type: 0xF0, deltaTime: 0, data: payload });
  t.deepEqual(bytes.slice(0, 4), [0, 0xF0, 0x82, 0x2C]);
  const midi = parseTrack([...bytes, 0, 0xFF, 0x2F, 0]);
  t.is(midi.chunks[0].events[0].data.data.length, 298);
  t.deepEqual(roundTrip(midi).chunks, midi.chunks);
});

test('writeEvent: validates structured SysEx without confusing zero with a missing ID', (t) => {
  for (const data of [
    { manufacturerId: 0, data: [] },
    { manufacturerId: 0, manufacturerIdBytes: [0, 1], data: [] },
    { manufacturerId: 0, manufacturerIdBytes: [0, 1, 128], data: [] },
    { manufacturerId: 0x41, data: [128] },
    { manufacturerId: 0x41, data: [], terminated: 'false' },
  ]) t.throws(() => writeOne({ type: 0xF0, deltaTime: 0, data }));
  t.deepEqual(writeOne({ type: 0xF0, deltaTime: 0, data: { manufacturerId: 0x41, data: [], terminated: false } }), [0, 0xF0, 1, 0x41]);
});

test('writeEvent: direct system compatibility messages have the correct data widths', (t) => {
  t.deepEqual(writeOne({ type: 0xF1, deltaTime: 0, data: 0x7F }), [0, 0xF1, 0x7F]);
  t.deepEqual(writeOne({ type: 0xF2, deltaTime: 0, data: { lsb: 1, msb: 2 } }), [0, 0xF2, 1, 2]);
  t.deepEqual(writeOne({ type: 0xF3, deltaTime: 0, data: { songNumber: 0 } }), [0, 0xF3, 0]);
  for (const type of [0xF4, 0xF5, 0xF6, 0xF8, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE]) {
    t.deepEqual(writeOne({ type, deltaTime: 0 }), [0, type]);
    t.throws(() => writeOne({ type, deltaTime: 0, data: [1] }));
  }
});

test('writeEvent: preserves an embedded channel unless an explicit channel overrides it', (t) => {
  const event = { type: 0x9A, deltaTime: 0, data: { note: 60, velocity: 100 } };
  t.is(writeOne(event)[1], 0x9A);
  t.is(writeOne({ ...event, channel: 0 })[1], 0x90);
  t.is(writeOne({ ...event, channel: 15 })[1], 0x9F);
});

test('writeEvent: rejects invalid channels, status bytes and delta times before writing', (t) => {
  const base = { type: 0x90, deltaTime: 0, data: { note: 60, velocity: 100 } };
  const changes = [
    ...[-1, 16, 0.5, NaN, Infinity, '1'].map((channel) => ({ channel })),
    ...[undefined, null, 127, 256, 128.5, NaN, '144'].map((type) => ({ type })),
    ...[-1, 0.5, NaN, Infinity, 0x10000000, '0'].map((deltaTime) => ({ deltaTime })),
  ];
  const midi = new AudioMIDI();
  for (const change of changes) {
    const buffer = new DataBuffer();
    buffer.writeUInt8(0xAA);
    t.throws(() => midi.writeEvent(buffer, { ...base, ...change }));
    t.is(buffer.offset, 1);
    t.deepEqual(buffer.buffer, [0xAA]);
  }
});

test('writeEvent: validates every channel voice data field as a seven-bit integer', (t) => {
  for (const invalid of [-1, 128, 1.5, NaN, Infinity, '60']) {
    const cases = [
      { type: 0x90, data: { note: invalid, velocity: 100 } },
      { type: 0x80, data: { note: 60, velocity: invalid } },
      { type: 0xA0, data: { note: 60, velocity: invalid } },
      { type: 0xB0, data: { controller: invalid, value: 0 } },
      { type: 0xB0, data: { controller: 0, value: invalid } },
      { type: 0xC0, data: invalid },
      { type: 0xD0, data: invalid },
      { type: 0xE0, data: { firstByte: invalid, secondByte: 0 } },
      { type: 0xF2, data: { lsb: invalid, msb: 0 } },
      { type: 0xF3, data: { songNumber: invalid } },
    ];
    for (const event of cases) t.throws(() => writeOne({ deltaTime: 0, ...event }));
  }
});

test('writeEvent: validates fixed-size structured meta fields', (t) => {
  const cases = [
    { metaType: 0x00, data: { sequenceNumber: -1 } },
    { metaType: 0x00, data: { sequenceNumber: 65536 } },
    { metaType: 0x20, data: 16 },
    { metaType: 0x21, data: 128 },
    { metaType: 0x51, data: { byte1: 0, byte2: 0, byte3: 0 } },
    { metaType: 0x51, data: { byte1: 256, byte2: 0, byte3: 1 } },
    { metaType: 0x54, data: { hourByte: 24, minute: 0, second: 0, frame: 0, subFrame: 0 } },
    { metaType: 0x54, data: { hourByte: 0, minute: 60, second: 0, frame: 0, subFrame: 0 } },
    { metaType: 0x54, data: { hourByte: 0, minute: 0, second: 0, frame: 24, subFrame: 0 } },
    { metaType: 0x58, data: { numerator: 0, denominator: 2, metronome: 24, thirtySecondNotes: 8 } },
    { metaType: 0x59, data: { keySignature: 8, majorOrMinor: 0 } },
    { metaType: 0x59, data: { keySignature: 0, majorOrMinor: 2 } },
    { metaType: 0x80, data: [] },
    { metaType: undefined, data: [] },
  ];
  for (const event of cases) t.throws(() => writeOne({ type: 0xFF, deltaTime: 0, ...event }));
});

test('writeEvent: raw unknown and fixed-size malformed meta payloads are not discarded', (t) => {
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x60, data: [0x80, 0xFF] }), [0, 0xFF, 0x60, 2, 0x80, 0xFF]);
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x51, data: new Uint8Array([1, 2]) }), [0, 0xFF, 0x51, 2, 1, 2]);
  t.deepEqual(writeOne({ type: 0xFF, deltaTime: 0, metaType: 0x00, metaEventLength: 0, data: { sequenceNumber: 7 } }), [0, 0xFF, 0, 0]);
});

test('writeEventData: rejects sparse arrays and invalid bytes without partial writes', (t) => {
  for (const input of [[1, , 2], [-1], [256], [0.5], [NaN], [Infinity], ['1'], [null]]) {
    const buffer = new DataBuffer();
    t.throws(() => AudioMIDI.writeEventData(buffer, input));
    t.is(buffer.offset, 0);
  }
});

test('addEvent: keeps the existing event array and safely supports self-append', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  const events = track.events;
  midi.addEvent(track, [{ deltaTime: 0, label: 'a' }, { deltaTime: 0, label: 'b' }]);
  t.is(track.events, events);
  midi.addEvent(track, events);
  t.deepEqual(events.map((event) => event.label), ['a', 'b', 'a', 'b']);
});

test('addEvent: appends large arrays without function argument limits', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  const events = Array.from({ length: 150000 }, () => ({ deltaTime: 0 }));
  midi.addEvent(track, events);
  t.is(track.events.length, events.length);
  t.is(track.events.at(-1), events.at(-1));
});

test('saveToDataBuffer: derives the track count from the tracks actually serialized', (t) => {
  const midi = new AudioMIDI(undefined, { format: 1 });
  midi.chunks = [
    { type: 'MTrk', chunkLength: 0, events: [AudioMIDI.generateEndOfTrackEvent()] },
    { type: 'JUNK', chunkLength: 0, events: [] },
    { type: 'MTrk', chunkLength: 0, events: [AudioMIDI.generateEndOfTrackEvent()] },
  ];
  midi.trackCount = 99;
  const reparsed = roundTrip(midi);
  t.is(midi.trackCount, 2);
  t.is(reparsed.trackCount, 2);
  t.is(reparsed.chunks.length, 2);
});

test('saveToDataBuffer: rejects invalid formats, division values and format-0 track counts', (t) => {
  for (const format of [-1, 3, 0.5, NaN]) {
    const midi = new AudioMIDI(undefined, { format });
    midi.addTrack().events.push(AudioMIDI.generateEndOfTrackEvent());
    t.throws(() => midi.saveToDataBuffer());
  }
  for (const timeDivision of [-1, 0, 0.5, NaN, 32768]) {
    const midi = new AudioMIDI(undefined, { timeDivision });
    midi.addTrack().events.push(AudioMIDI.generateEndOfTrackEvent());
    t.throws(() => midi.saveToDataBuffer());
  }
  const midi = new AudioMIDI();
  t.throws(() => midi.saveToDataBuffer());
  midi.addTrack().events.push(AudioMIDI.generateEndOfTrackEvent());
  midi.addTrack().events.push(AudioMIDI.generateEndOfTrackEvent());
  t.throws(() => midi.saveToDataBuffer(), { message: /track count/ });
});

test('saveToDataBuffer: requires exactly one final End of Track event', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  t.throws(() => midi.saveToDataBuffer(), { message: /End of Track/ });
  track.events.push(AudioMIDI.generateEndOfTrackEvent(), AudioMIDI.generateEndOfTrackEvent());
  t.throws(() => midi.saveToDataBuffer(), { message: /End of Track/ });
});

test('getUsedNotes: ignores null and malformed note values instead of throwing', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  track.events.push(
    { type: 0x90, data: null }, { type: 0x90, data: { velocity: 100 } },
    ...[-1, 128, 1.5, NaN, Infinity, '60tail', '', null].map((note) => ({ type: 0x90, data: { note, velocity: 100 } })),
    { type: 0x90, data: { note: '60', velocity: 100 } },
  );
  t.deepEqual(midi.getUsedNotes().map((note) => note.noteNumber), [60]);
});

test('validate: equal pitches on different channels cannot cancel each other', (t) => {
  const midi = parseTrack([0, 0x90, 60, 100, 10, 0x81, 60, 0, 0, 0xFF, 0x2F, 0]);
  const issues = midi.validate();
  t.true(issues.some((issue) => issue.includes('not active')));
  t.true(issues.some((issue) => issue.includes('unmatched Note On for note 60')));
});

test('validate: reports missing, duplicate and non-final End of Track events', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  t.true(midi.validate().some((issue) => issue.includes('missing End-of-Track')));
  track.events.push(AudioMIDI.generateEndOfTrackEvent(), AudioMIDI.generateEndOfTrackEvent());
  const issues = midi.validate();
  t.true(issues.some((issue) => issue.includes('after End-of-Track')));
  t.true(issues.some((issue) => issue.includes('duplicate End-of-Track')));
});

test('validate: reports non-integer times, bad statuses, channels and payloads', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  track.events.push(
    { type: 0x90, channel: 16, deltaTime: NaN, data: { note: 128, velocity: 100 } },
    { type: 0x70, deltaTime: 0.5 },
    { type: 0xC0, deltaTime: 0, data: 128 },
    AudioMIDI.generateEndOfTrackEvent(),
  );
  const issues = midi.validate();
  for (const phrase of ['deltaTime', 'status byte', 'channel', 'note value', 'programNumber']) {
    t.true(issues.some((issue) => issue.includes(phrase)));
  }
});

test('validate: reports stale text payload lengths and direct non-SMF system events', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  track.events.push({ type: 0xFF, metaType: 3, metaEventLength: 1, deltaTime: 0, data: '🎹' });
  track.events.push({ type: 0xF8, deltaTime: 0 });
  track.events.push(AudioMIDI.generateEndOfTrackEvent());
  const issues = midi.validate();
  t.true(issues.some((issue) => issue.includes('payload has 4 bytes')));
  t.true(issues.some((issue) => issue.includes('escape packet')));
});

test('generateTempoEvent: rejects nonpositive, nonfinite and unrepresentable BPM values', (t) => {
  for (const bpm of [0, -1, NaN, Infinity, -Infinity, 1, 120000001]) {
    t.throws(() => AudioMIDI.generateTempoEvent(bpm), { instanceOf: RangeError });
  }
  t.is(AudioMIDI.generateTempoEvent(60000000).data.tempo, 1);
  t.is(AudioMIDI.generateTempoEvent(60000000 / 0xFFFFFF).data.tempo, 0xFFFFFF);
});

test('convertToMidi: integer tick arithmetic preserves dense non-divisible note spacing', (t) => {
  const notes = Array.from({ length: 1000 }, (_, i) => ({ midiNote: i % 128, ticks: 1, velocity: 100, length: 1 }));
  const midi = AudioMIDI.convertToMidi({ ppq: 480, tracks: [{ notes }] });
  t.true(midi.chunks[0].events.every((event) => Number.isInteger(event.deltaTime)));
  const parsed = roundTrip(midi);
  t.true(parsed.chunks[0].events.filter((event) => event.type === 0x90).every((event) => event.data.length === 1));
  t.is(parsed.chunks[0].events.reduce((ticks, event) => ticks + event.deltaTime, 0), 1000);
});

test('convertToMidi: skipped and zero-velocity notes preserve subsequent start times and trailing silence', (t) => {
  const midi = AudioMIDI.convertToMidi({
    tracks: [{ notes: [
      { midiNote: 128, ticks: 10, velocity: 100, length: 1 },
      { midiNote: 60, ticks: 10, velocity: 0, length: 1 },
      { midiNote: 62, ticks: 30, velocity: 100, length: 5 },
    ] }],
    skipNotes: [128],
  });
  const events = roundTrip(midi).chunks[0].events;
  t.deepEqual(events.map((event) => event.deltaTime), [20, 5, 25]);
  t.is(events[0].data.note, 62);
  t.is(events.at(-1).metaType, 0x2F);
});

test('convertToMidi: long releases and zero-length notes retain valid chronological order', (t) => {
  const midi = AudioMIDI.convertToMidi({ tracks: [{ notes: [
    { midiNote: 60, ticks: 10, velocity: 100, length: 100 },
    { midiNote: 62, ticks: 10, velocity: 100, length: 0 },
  ] }] });
  const parsed = roundTrip(midi);
  t.is(parsed.chunks[0].events.at(-1).deltaTime, 0);
  t.is(parsed.chunks[0].events.reduce((total, event) => total + event.deltaTime, 0), 100);
  t.deepEqual(parsed.validate(), []);
});

test('convertToMidi: rounds positive fractional note durations up without fractional delta times', (t) => {
  const midi = AudioMIDI.convertToMidi({ tracks: [{ notes: [{ midiNote: 60, ticks: 10, velocity: 100, length: 1.2 }] }] });
  t.is(roundTrip(midi).chunks[0].events[0].data.length, 2);
});

test('convertToMidi: validates PPQ, ticks, note values, BPM and variable-length delta limits', (t) => {
  const note = { midiNote: 60, ticks: 10, velocity: 100, length: 5 };
  for (const ppq of [0, -1, 0.5, NaN, 32768]) t.throws(() => AudioMIDI.convertToMidi({ ppq }));
  for (const ticks of [-1, 0.5, NaN, Infinity, 0x10000010]) {
    t.throws(() => AudioMIDI.convertToMidi({ tracks: [{ notes: [{ ...note, ticks }] }] }));
  }
  for (const change of [{ midiNote: 128 }, { velocity: 128 }, { length: -1 }, { length: Infinity }]) {
    t.throws(() => AudioMIDI.convertToMidi({ tracks: [{ notes: [{ ...note, ...change }] }] }));
  }
  t.throws(() => AudioMIDI.convertToMidi({ bpm: 0, tracks: [{ notes: [note] }] }));
  t.throws(() => AudioMIDI.convertToMidi({ tracks: [{ bpm: 0, notes: [note] }] }));
});

test('convertToMidi: honors per-track BPM and adds End of Track to otherwise empty tracks', (t) => {
  const midi = AudioMIDI.convertToMidi({ bpm: 120, tracks: [{ bpm: 90 }] });
  t.is(midi.chunks[0].events[0].data.bpm, 90);
  t.is(midi.chunks[0].events.at(-1).metaType, 0x2F);
  t.is(AudioMIDI.convertToMidi().trackCount, 0);
});

test('note utilities: all MIDI values round-trip under several octave conventions', (t) => {
  for (const offset of [0, 1, 2, 3]) {
    for (let midi = 0; midi <= 127; midi++) {
      t.is(AudioMIDI.noteToMidi(AudioMIDI.midiToNote(midi, offset), offset), midi);
    }
  }
});

test('noteToMidi: flat spellings and enharmonic octave crossings are correct', (t) => {
  t.is(AudioMIDI.noteToMidi('B#3'), AudioMIDI.noteToMidi('C4'));
  t.is(AudioMIDI.noteToMidi('Cb3'), AudioMIDI.noteToMidi('B2'));
  for (const [flat, sharp] of [['Db3', 'C#3'], ['Eb3', 'D#3'], ['Gb3', 'F#3'], ['Ab3', 'G#3'], ['Bb3', 'A#3'], ['Fb3', 'E3']]) {
    t.is(AudioMIDI.noteToMidi(flat), AudioMIDI.noteToMidi(sharp));
  }
  t.throws(() => AudioMIDI.noteToMidi('Cb-2'));
});

test('note utilities: reject nonfinite values, fractional values and incomplete custom maps', (t) => {
  for (const value of [NaN, Infinity, -Infinity, 60.5, '60', null]) t.throws(() => AudioMIDI.midiToNote(value));
  for (const offset of [0.5, NaN, Infinity]) {
    t.throws(() => AudioMIDI.midiToNote(60, offset));
    t.throws(() => AudioMIDI.noteToMidi('C3', offset));
  }
  t.throws(() => AudioMIDI.noteToMidi('C3', 2, {}));
  t.throws(() => AudioMIDI.noteToMidi('C3', 2, { C: NaN }));
  t.throws(() => AudioMIDI.noteToMidi('C3', 2, { C: 0.5 }));
  t.throws(() => AudioMIDI.midiToNote(61, 2, ['C']));
});

test('convertToMidi: format 1 writes one shared tempo map in the first track', (t) => {
  const midi = AudioMIDI.convertToMidi({ bpm: 120, tracks: [{}, {}, {}] });
  t.is(midi.format, 1);
  t.deepEqual(midi.chunks.map((track) => track.events.filter((event) => event.metaType === 0x51).length), [1, 0, 0]);
  t.deepEqual(roundTrip(midi).validate(), []);
});

test('convertToMidi: format 2 supports independent track tempos explicitly', (t) => {
  const options = { tracks: [{ bpm: 90 }, { bpm: 120 }] };
  t.throws(() => AudioMIDI.convertToMidi(options), { message: /shared tempo/ });
  const midi = AudioMIDI.convertToMidi({ ...options, format: 2 });
  t.is(midi.format, 2);
  t.deepEqual(midi.chunks.map((track) => track.events[0].data.bpm), [90, 120]);
  t.deepEqual(roundTrip(midi).validate(), []);
  t.throws(() => AudioMIDI.convertToMidi({ ...options, format: 0 }), { message: /format/ });
});

test('validate: checks raw known-meta fields without preventing raw byte preservation', (t) => {
  const midi = new AudioMIDI();
  const track = midi.addTrack();
  for (const [metaType, bytes] of [[0x20, [16]], [0x51, [0, 0, 0]], [0x54, [24, 0, 0, 0, 0]], [0x58, [0, 2, 24, 8]], [0x59, [8, 0]]]) {
    track.events.push({ type: 0xFF, deltaTime: 0, metaType, data: new Uint8Array(bytes) });
  }
  track.events.push(AudioMIDI.generateEndOfTrackEvent());
  const issues = midi.validate();
  for (const name of ['Invalid data', 'Tempo', 'SMPTE', 'numerator', 'keySignature']) {
    t.true(issues.some((issue) => issue.includes(name)));
  }
  t.notThrows(() => midi.saveToDataBuffer());
});

test('validate: permits properly completed split SysEx and diagnoses incomplete sequences', (t) => {
  const complete = parseTrack([0, 0xF0, 2, 0x41, 1, 0, 0xFF, 1, 0, 10, 0xF7, 2, 2, 0xF7, 0, 0xFF, 0x2F, 0]);
  t.deepEqual(complete.validate(), []);
  const incomplete = parseTrack([0, 0xF0, 2, 0x41, 1, 0, 0xFF, 0x2F, 0]);
  t.true(incomplete.validate().some((issue) => issue.includes('unterminated SysEx')));
  const interrupted = parseTrack([0, 0xF0, 2, 0x41, 1, 0, 0xC0, 2, 0, 0xFF, 0x2F, 0]);
  t.true(interrupted.validate().some((issue) => issue.includes('interrupts')));
});

test('validate: diagnoses metadata that belongs at the start of a track or in a format-1 conductor track', (t) => {
  const midi = new AudioMIDI(undefined, { format: 1 });
  midi.addTrack().events.push(AudioMIDI.generateEndOfTrackEvent());
  const track = midi.addTrack();
  track.events.push({ type: 0xC0, deltaTime: 10, data: 1 });
  track.events.push({ type: 0xFF, metaType: 0, deltaTime: 0, data: { sequenceNumber: 1 } });
  track.events.push({ type: 0xFF, metaType: 0, deltaTime: 0, data: { sequenceNumber: 2 } });
  track.events.push(AudioMIDI.generateTempoEvent(120), AudioMIDI.generateEndOfTrackEvent());
  const issues = midi.validate();
  for (const phrase of ['time zero', 'precede', 'Sequence Number', 'first track']) t.true(issues.some((issue) => issue.includes(phrase)));
});

test('getUsedNotes: ignores a null event object', (t) => {
  const midi = new AudioMIDI();
  midi.addTrack().events.push(null);
  t.deepEqual(midi.getUsedNotes(), []);
  t.true(midi.validate().some((issue) => issue.includes('not an event object')));
});

/** A deterministic generator keeps randomized regressions reproducible. */
const seededRandom = (initial) => {
  let state = initial >>> 0;
  return (limit) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % limit;
  };
};

/** Independent arithmetic VLQ encoding; intentionally does not call AudioMIDI. */
const referenceVLQ = (value) => {
  const bytes = [value % 128];
  for (let rest = Math.floor(value / 128); rest > 0; rest = Math.floor(rest / 128)) bytes.unshift((rest % 128) + 128);
  return bytes;
};

test('round-trip: 500 deterministic generated files retain canonical event bytes', (t) => {
  const random = seededRandom(0x4D494449);
  for (let iteration = 0; iteration < 500; iteration++) {
    const format = random(3);
    const count = format === 0 ? 1 : random(3) + 1;
    const division = iteration % 5 === 0 ? ((256 - [24, 25, 29, 30][random(4)]) << 8) | (random(255) + 1) : random(32767) + 1;
    const input = MThd(format, count, division);
    const expected = MThd(format, count, division);
    for (let track = 0; track < count; track++) {
      const bytes = [];
      const canonical = [];
      let running;
      for (let event = 0; event < 50; event++) {
        const delta = referenceVLQ(random(0x10000));
        const kind = random(6);
        if (kind < 3) {
          const status = running !== undefined && random(2) === 0 ? running : [0x80, 0x90, 0xA0, 0xB0, 0xC0, 0xD0, 0xE0][random(7)] | random(16);
          const payload = [random(128)];
          if ((status & 0xE0) !== 0xC0) payload.push(random(128));
          bytes.push(...delta);
          if (running !== status || random(2) === 0) bytes.push(status);
          bytes.push(...payload);
          canonical.push(...delta, status, ...payload);
          running = status;
        } else {
          running = undefined;
          const length = random(200);
          let encoded;
          if (kind === 3) {
            const metaType = random(2) ? 0x60 : 0x03;
            const payload = Array.from({ length }, () => random(256));
            encoded = [0xFF, metaType, ...referenceVLQ(payload.length), ...payload];
          } else if (kind === 4) {
            const payload = [0x41, ...Array.from({ length }, () => random(128))];
            if (random(2)) payload.push(0xF7);
            encoded = [0xF0, ...referenceVLQ(payload.length), ...payload];
          } else {
            const payload = Array.from({ length }, () => random(256));
            encoded = [0xF7, ...referenceVLQ(payload.length), ...payload];
          }
          bytes.push(...delta, ...encoded);
          canonical.push(...delta, ...encoded);
        }
      }
      bytes.push(0, 0xFF, 0x2F, 0);
      canonical.push(0, 0xFF, 0x2F, 0);
      input.push(...MTrk(bytes));
      expected.push(...MTrk(canonical));
    }
    const midi = new AudioMIDI(new Uint8Array(input));
    midi.parse();
    t.deepEqual([...midi.saveToDataBuffer().data], expected);
    t.deepEqual(roundTrip(midi).chunks, midi.chunks);
  }
});

test('parse: 10000 deterministic malformed tracks remain bounded and terminate', (t) => {
  const random = seededRandom(0x41564131);
  let accepted = 0;
  let rejected = 0;
  for (let iteration = 0; iteration < 10000; iteration++) {
    const length = random(80);
    const bytes = Array.from({ length }, () => random(256));
    const midi = new AudioMIDI(buildMidi(bytes));
    try {
      midi.parse();
      accepted++;
    } catch (error) {
      t.true(error instanceof Error);
      rejected++;
    }
    t.true(midi.offset >= 0 && midi.offset <= midi.data.length);
  }
  t.is(accepted + rejected, 10000);
  t.true(rejected > 0);
});

test('parse: every truncation of a multi-track file either reports a missing track or throws without overreading', (t) => {
  const bytes = new Uint8Array([
    ...MThd(1, 2, 480),
    ...MTrk([0, 0xFF, 3, 3, 65, 66, 67, 0, 0x90, 60, 100, 10, 0x80, 60, 0, 0, 0xFF, 0x2F, 0]),
    ...MTrk([0, 0xF0, 4, 0x41, 1, 2, 0xF7, 0, 0xFF, 0x2F, 0]),
  ]);
  for (let length = 0; length < bytes.length; length++) {
    const midi = new AudioMIDI(bytes.subarray(0, length));
    try {
      midi.parse();
      t.true(midi.chunks.length < midi.trackCount);
      t.true(midi.validate().some((issue) => issue.includes('trackCount')));
    } catch (error) {
      t.true(error instanceof Error);
    }
    t.true(midi.offset <= length);
  }
});

test('parse: an unknown key-signature mode does not receive a misleading minor key name', (t) => {
  const midi = parseTrack([0, 0xFF, 0x59, 2, 0, 2, 0, 0xFF, 0x2F, 0]);
  t.is(midi.chunks[0].events[0].data.mode, 'Unknown Mode');
  t.is(midi.chunks[0].events[0].data.keyName, 'Unknown Key');
  t.true(midi.validate().some((issue) => issue.includes('majorOrMinor')));
});

test('convertToMidi: generated length metadata matches rounded duration bytes', (t) => {
  const midi = AudioMIDI.convertToMidi({ tracks: [{ notes: [{ midiNote: 60, velocity: 100, length: 1.2, ticks: 10 }] }] });
  t.deepEqual(midi.chunks[0].events.slice(0, 2).map((event) => event.data.length), [2, 2]);
});

test('parse: preserves extra track chunks when the header understates the track count', (t) => {
  const bytes = MTrk([0, 0xFF, 0x2F, 0]);
  const midi = new AudioMIDI(new Uint8Array([...MThd(1, 1, 480), ...bytes, ...bytes]));
  midi.parse();
  t.is(midi.chunks.length, 2);
  t.is(midi.trackCount, 1);
  t.true(midi.validate().some((issue) => issue.includes('trackCount=1')));
  t.is(roundTrip(midi).trackCount, 2);
});

test('parse: skips well-formed unknown chunks after the last declared track', (t) => {
  const midi = new AudioMIDI(new Uint8Array([
    ...buildMidi([0, 0xFF, 0x2F, 0]), 0x4A, 0x55, 0x4E, 0x4B, 0, 0, 0, 1, 0x80,
  ]));
  midi.parse();
  t.is(midi.offset, midi.data.length);
  t.is(midi.chunks.length, 1);
  t.deepEqual(midi.validate(), []);
});

test('readVariableLengthValues: rejects invalid publicly assigned cursors', (t) => {
  for (const offset of [-1, 0.5, NaN, Infinity]) {
    const midi = new AudioMIDI(new Uint8Array([0]));
    midi.offset = offset;
    t.throws(() => midi.readVariableLengthValues(), { instanceOf: RangeError });
  }
});
