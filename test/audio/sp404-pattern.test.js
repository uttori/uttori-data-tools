import test from 'ava';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { AudioMIDI, DataBuffer, SP404PadInfo, SP404Pattern } from '../../dist/index.js';
import tools from '../../dist/index.js';
import PublicPadInfo from '@uttori/data-tools/audio/sp404-padinfo';
import PublicPattern from '@uttori/data-tools/audio/sp404-pattern';

/** Build independent raw eight-byte records plus a footer; avoids using the converter as its own oracle. */
const patternBytes = (records, { og = false, bars = 1, timeSignature = 0 } = {}) => {
  const footer = new Uint8Array(16);
  footer[1] = 140;
  footer[8] = og ? 0 : bars;
  footer[9] = og ? 2 : 0;
  footer[12] = timeSignature;
  footer[13] = og ? 0 : 128;
  footer[14] = og ? 0 : bars;
  footer[15] = og ? 0 : 1;
  return new Uint8Array([...records.flat(), ...footer]);
};

/** Create an in-memory MIDI with one or more simultaneous tracks. Event deltas remain track-local. */
const midiTracks = (tracks, ppq = 480, format = 1) => {
  const midi = new AudioMIDI(undefined, { timeDivision: ppq, format });
  midi.chunks = tracks.map((events) => ({ type: 'MTrk', chunkLength: 0, events }));
  midi.trackCount = tracks.length;
  return midi;
};

/** Positive-velocity Note On; length may be omitted to test matching actual Note Off events. */
const noteOn = (deltaTime, note = 60, length = 480, channel = 0) => ({
  deltaTime, type: 0x90, channel, data: { note, velocity: 100, length },
});

/** Read the absolute starts and lengths of real pad events, including delays consumed by padding. */
const positions = (pattern) => {
  let time = 0;
  const notes = [];
  for (const note of pattern.notes) {
    time += note.ticks;
    if (note.midiNote !== 128) notes.push({ time, pad: note.padLabel, length: note.length });
  }
  return { notes, time };
};

test('public exports: named, default, and device subpaths expose the same constructors', (t) => {
  t.is(PublicPadInfo, SP404PadInfo);
  t.is(PublicPattern, SP404Pattern);
  t.is(tools.SP404PadInfo, SP404PadInfo);
  t.is(tools.SP404Pattern, SP404Pattern);
});

test('public TypeScript declarations: root and subpath consumers type-check', (t) => {
  const compiler = fileURLToPath(new URL('../../node_modules/.bin/tsc', import.meta.url));
  const fixture = fileURLToPath(new URL('./sp404-types.ts', import.meta.url));
  t.notThrows(() => execFileSync(compiler, [
    '--ignoreConfig', '--strict', '--noEmit', '--skipLibCheck', '--module', 'NodeNext',
    '--target', 'ES2024', fixture,
  ], { timeout: 30000 }));
});

test('parse(): reads raw MKII events, little-endian lengths, footer, and empty timing records', (t) => {
  const pattern = new SP404Pattern(patternBytes([
    [10, 47, 64, 141, 99, 64, 0x34, 0x12],
    [20, 47, 65, 0, 100, 64, 0, 1],
    [255, 128, 0, 0, 0, 0, 0, 0],
    [0, 47, 255, 0, 100, 64, 0, 0],
  ], { bars: 3, timeSignature: 1 }));
  t.deepEqual(pattern.notes[0], {
    ticks: 10, midiNote: 47, bankSwitch: 64, pitchMode: 141, velocity: 99,
    unknown3: 64, length: 0x1234, sampleNumber: 1, padLabel: 'A1',
  });
  t.is(pattern.notes[1].padLabel, 'F1');
  t.is(pattern.notes[1].sampleNumber, 81);
  t.is(pattern.notes[1].length, 256);
  t.is(pattern.notes[2].padLabel, '');
  t.is(pattern.notes[2].sampleNumber, 0);
  t.is(pattern.notes[3].padLabel, '');
  t.deepEqual(pattern.getUsedPads(), ['A1', 'F1']);
  t.is(pattern.bars, 3);
  t.is(pattern.timeSignature, 1);
  const notes = pattern.notes;
  pattern.parse();
  t.deepEqual(pattern.notes, notes);
});

test('parse(): accepts old MKII bank-switch aliases', (t) => {
  const pattern = new SP404Pattern(patternBytes([
    [0, 47, 0, 0, 100, 64, 0, 0], [0, 47, 1, 0, 100, 64, 0, 0],
  ]));
  t.deepEqual(pattern.getUsedPads(), ['A1', 'F1']);
});

test('device mappings: every OG and MKII pad decodes back to its own label', (t) => {
  for (const og of [false, true]) {
    const mappings = og ? SP404Pattern.defaultMapOG : SP404Pattern.defaultMap;
    const records = Object.values(mappings).map(({ midiNote, bankSwitch }) => [0, midiNote, bankSwitch, 0, 100, 64, 1, 0]);
    const pattern = new SP404Pattern(patternBytes(records, { og }), { og });
    t.deepEqual(pattern.getUsedPads(), Object.keys(mappings));
    t.is(pattern.notes.at(-1).sampleNumber, og ? 120 : 160);
    t.deepEqual(pattern.options, { og, bytesPerNote: 8, padsPerBank: og ? 12 : 16 });
  }
  t.deepEqual(SP404Pattern.defaultMapOG.G1, { pad: 'G1', midiNote: 71, bankSwitch: 64 });
  t.deepEqual(SP404Pattern.defaultMapOG.F1, { pad: 'F1', midiNote: 107, bankSwitch: 0 });
  t.is(SP404Pattern.defaultPPQ, 480);
  t.is(SP404Pattern.defaultPPQOG, 96);
  const map = SP404Pattern.defaultMap;
  map.A1.midiNote = 0;
  t.is(SP404Pattern.defaultMap.A1.midiNote, 47);
});

test('parse(): rejects unsupported layouts and truncated structures without replacing notes', (t) => {
  for (const size of [1, 8, 15, 17, 23]) {
    t.throws(() => new SP404Pattern(new Uint8Array(size)), { instanceOf: RangeError });
  }
  for (const options of [{ bytesPerNote: 4 }, { padsPerBank: 12 }, { og: true, padsPerBank: 16 }]) {
    t.throws(() => new SP404Pattern(undefined, options), { instanceOf: RangeError });
  }
  const pattern = new SP404Pattern(patternBytes([[0, 47, 64, 0, 100, 64, 0, 0]]));
  const notes = pattern.notes;
  pattern.data = new Uint8Array(17);
  t.throws(() => pattern.parse(), { instanceOf: RangeError });
  t.is(pattern.notes, notes);
  t.deepEqual(new SP404Pattern().notes, []);
  t.deepEqual(new SP404Pattern(patternBytes([])).getUsedPads(), []);
});

test('toMidi(): retains skipped delays, note zero, trailing silence, and matching off events', (t) => {
  const pattern = new SP404Pattern(patternBytes([
    [10, 47, 64, 0, 100, 64, 20, 0],
    [50, 48, 64, 0, 100, 64, 0, 0],
    [100, 128, 0, 0, 0, 0, 0, 0],
  ]));
  const midi = pattern.toMidi({ bpm: 120, fileName: 'test', ppq: 960, noteMap: { A1: 0, '': 99 } });
  t.is(midi.timeDivision, 960);
  const events = midi.chunks[0].events;
  t.is(events[0].metaType, 0x51);
  t.is(events[1].data, 'SP404 Pattern test');
  t.deepEqual(events.slice(2, 4).map(({ deltaTime, type, data }) => ({ deltaTime, type, data })), [
    { deltaTime: 20, type: 0x90, data: { note: 0, velocity: 100, length: 40 } },
    { deltaTime: 40, type: 0x80, data: { note: 0, velocity: 0 } },
  ]);
  t.is(events.at(-1).metaType, 0x2f);
  t.is(events.at(-1).deltaTime, 3780);
  const saved = midi.saveToDataBuffer();
  const parsed = new AudioMIDI(saved);
  parsed.parse();
  t.deepEqual(parsed.validate(), []);
  t.is(parsed.chunks[0].events.find((event) => event.type === 0x90).data.note, 0);
});

test('toMidi(): note ends are ordered chronologically, including zero-length and simultaneous notes', (t) => {
  const pattern = new SP404Pattern(patternBytes([
    [0, 47, 64, 0, 100, 64, 100, 0],
    [10, 48, 64, 0, 100, 64, 0, 0],
    [0, 49, 64, 0, 100, 64, 20, 0],
  ]));
  const midi = pattern.toMidi({ noteMap: { A1: 60, A2: 61, A3: 62 } });
  t.deepEqual(midi.chunks[0].events.filter((event) => event.type !== 0xff).map((event) => [event.deltaTime, event.type, event.data.note]), [
    [0, 0x90, 60], [10, 0x90, 61], [0, 0x80, 61], [0, 0x90, 62], [20, 0x80, 62], [70, 0x80, 60],
  ]);
  // Chunk lengths are populated by AudioMIDI when the track is serialized.
  midi.saveToDataBuffer();
  t.deepEqual(midi.validate(), []);
});

test('toMidi(): validates map values, PPQ, and explicit invalid tempo', (t) => {
  const pattern = new SP404Pattern(patternBytes([[0, 47, 64, 0, 100, 64, 0, 0]]));
  for (const value of [-1, 128, 0.5, NaN, '60']) {
    t.throws(() => pattern.toMidi({ noteMap: { A1: value } }), { instanceOf: RangeError });
  }
  t.throws(() => pattern.toMidi({ noteMap: {}, ppq: 0 }), { instanceOf: RangeError });
  t.throws(() => pattern.toMidi({ noteMap: {}, bpm: 0 }));
  t.throws(() => pattern.toMidi({ noteMap: null }), { instanceOf: TypeError });
});

test('toMidi(): preserves footer duration and known meter even without explicit padding', (t) => {
  const pattern = new SP404Pattern(patternBytes([], { bars: 2, timeSignature: 1 }));
  const midi = pattern.toMidi({ noteMap: {} });
  const events = midi.chunks[0].events;
  t.deepEqual(events.find((event) => event.metaType === 0x58).data, {
    numerator: 3, denominator: 2, metronome: 24, thirtySecondNotes: 8,
  });
  t.is(events.at(-1).deltaTime, 2 * 3 * 480);
  midi.saveToDataBuffer();
  t.deepEqual(midi.validate(), []);
  pattern.timeSignature = 6;
  t.throws(() => pattern.toMidi({ noteMap: {} }), { message: /Unsupported pattern time signature/ });
});

test('fromMidi(): splits long gaps, includes sustained ends, and returns committed data', (t) => {
  const midi = midiTracks([[noteOn(1000), noteOn(600, 61, 240), noteOn(0, 62, 3000)]]);
  const data = SP404Pattern.fromMidi(midi, { 60: 'A1', 61: 'F1', 62: 'J16' }, 480);
  t.true(data instanceof DataBuffer);
  t.false(data.writing);
  t.true(data.data.length > 16);
  const pattern = new SP404Pattern(data);
  t.deepEqual(positions(pattern), {
    notes: [{ time: 1000, pad: 'A1', length: 480 }, { time: 1600, pad: 'F1', length: 240 }, { time: 1600, pad: 'J16', length: 3000 }],
    time: 5760,
  });
  t.is(pattern.bars, 3);
  t.true(pattern.notes.every((note) => note.ticks <= 255));
  t.deepEqual([...data.data.slice(-16)], [0, 140, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 128, 3, 1]);
});

test('fromMidi(): merges track-local clocks, rescales absolute positions, and avoids rounding drift', (t) => {
  const midi = midiTracks([[noteOn(1, 60, 1), noteOn(1, 61, 1), noteOn(1, 62, 1)], [noteOn(2, 63, 1)]], 960);
  const pattern = new SP404Pattern(SP404Pattern.fromMidi(midi, { 60: 'A1', 61: 'A2', 62: 'A3', 63: 'A4' }, 480));
  t.deepEqual(positions(pattern).notes, [
    { time: 1, pad: 'A1', length: 0 }, { time: 1, pad: 'A2', length: 1 },
    { time: 1, pad: 'A4', length: 1 }, { time: 2, pad: 'A3', length: 0 },
  ]);
});

test('fromMidi(): matches Note Off events by channel and FIFO order, including zero-velocity on', (t) => {
  const midi = midiTracks([[
    noteOn(0, 60, null, 0), noteOn(5, 60, null, 0), noteOn(0, 60, null, 1),
    { deltaTime: 5, type: 0x80, channel: 1, data: { note: 60, velocity: 0 } },
    { deltaTime: 10, type: 0x90, channel: 0, data: { note: 60, velocity: 0 } },
    { deltaTime: 10, type: 0x80, channel: 0, data: { note: 60, velocity: 0 } },
  ].map((event) => {
    // Omitted lengths exercise matching; null is never a valid MIDI duration.
    if (event.data.length === null) delete event.data.length;
    return event;
  })]);
  const pattern = new SP404Pattern(SP404Pattern.fromMidi(midi, { 60: 'A1' }, 480));
  t.deepEqual(positions(pattern).notes, [
    { time: 0, pad: 'A1', length: 20 }, { time: 5, pad: 'A1', length: 25 }, { time: 5, pad: 'A1', length: 5 },
  ]);
});

test('fromMidi(): empty, one-note-at-zero, and OG patterns occupy complete bars', (t) => {
  for (const events of [[], [noteOn(0, 60, 480)]]) {
    const midi = midiTracks([events]);
    const pattern = new SP404Pattern(SP404Pattern.fromMidi(midi, { 60: 'A1' }, 480));
    t.is(pattern.bars, 1);
    t.is(positions(pattern).time, 1920);
  }
  const midi = midiTracks([[noteOn(0, 60, 480), noteOn(960, 61, 240)]]);
  const pattern = new SP404Pattern(SP404Pattern.fromMidi(midi, { 60: 'G1', 61: 'J12' }, 96, true), { og: true });
  t.is(pattern.bars, 0);
  t.deepEqual(positions(pattern), { notes: [{ time: 0, pad: 'G1', length: 96 }, { time: 192, pad: 'J12', length: 48 }], time: 384 });
  t.is(pattern.toMidi({ noteMap: { G1: 60, J12: 61 } }).timeDivision, 96);
});

test('fromMidi(): accepts 4/4 meta events and retains MIDI trailing silence', (t) => {
  const midi = midiTracks([[
    { deltaTime: 0, type: 0xff, metaType: 0x58, data: { numerator: 4, denominator: 2, metronome: 24, thirtySecondNotes: 8 } },
    noteOn(0, 60, 480), { ...AudioMIDI.generateEndOfTrackEvent(), deltaTime: 3840 },
  ]]);
  const pattern = new SP404Pattern(SP404Pattern.fromMidi(midi, { 60: 'A1' }, 480));
  t.is(pattern.bars, 2);
  t.is(positions(pattern).time, 3840);
});

test('fromMidi(): rejects invalid inputs, unsupported timing, bad mappings, and overflow', (t) => {
  const midi = midiTracks([[noteOn(0)]]);
  t.throws(() => SP404Pattern.fromMidi(null, {}, 480), { instanceOf: TypeError });
  t.throws(() => SP404Pattern.fromMidi(midi, null, 480), { instanceOf: TypeError });
  t.throws(() => SP404Pattern.fromMidi(midi, {}, 480), { message: /No valid pad mapping/ });
  for (const pad of ['A17', 'K1', '__proto__']) t.throws(() => SP404Pattern.fromMidi(midi, { 60: pad }, 480));
  t.throws(() => SP404Pattern.fromMidi(midi, { 60: 'A1' }, 96), { instanceOf: RangeError });
  for (const ppq of [0, -1, NaN, 32768]) {
    t.throws(() => SP404Pattern.fromMidi(midiTracks([[noteOn(0)]], ppq), { 60: 'A1' }, 480), { instanceOf: RangeError });
  }
  for (const events of [[noteOn(-1)], [noteOn(0, 60, NaN)], [noteOn(0, 60, 65536)], [noteOn(122881, 60, 0)]]) {
    t.throws(() => SP404Pattern.fromMidi(midiTracks([events]), { 60: 'A1' }, 480), { instanceOf: RangeError });
  }
  const signature = midiTracks([[{ deltaTime: 0, type: 0xff, metaType: 0x58, data: { numerator: 3, denominator: 2 } }]]);
  t.throws(() => SP404Pattern.fromMidi(signature, {}, 480), { message: /only 4\/4/ });
  t.throws(() => SP404Pattern.fromMidi(midiTracks([[], []], 480, 2), {}, 480), { message: /format-2/ });
  const maximum = new SP404Pattern(SP404Pattern.fromMidi(midiTracks([[noteOn(122879, 60, 1)]]), { 60: 'A1' }, 480));
  t.is(maximum.bars, 64);
  t.is(positions(maximum).time, 122880);
});

test('MIDI bytes round trip: pad identity, velocity, starts, duration, and silence survive', (t) => {
  const original = new SP404Pattern(SP404Pattern.fromMidi(
    midiTracks([[noteOn(0, 0, 480), noteOn(960, 1, 240), noteOn(960, 2, 1000)]]),
    { 0: 'A1', 1: 'F1', 2: 'J16' }, 480,
  ));
  const midi = original.toMidi({ noteMap: { A1: 0, F1: 1, J16: 2 }, ppq: 960 });
  const parsed = new AudioMIDI(midi.saveToDataBuffer());
  parsed.parse();
  const restored = new SP404Pattern(SP404Pattern.fromMidi(parsed, { 0: 'A1', 1: 'F1', 2: 'J16' }, 480));
  t.deepEqual(positions(restored), positions(original));
  t.deepEqual(restored.notes.filter((note) => note.midiNote !== 128).map((note) => note.velocity), [100, 100, 100]);
  t.is(restored.bars, original.bars);
  t.deepEqual(parsed.validate(), []);
});
