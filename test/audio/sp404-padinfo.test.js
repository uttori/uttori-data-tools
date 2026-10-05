import fs from 'fs';
import test from 'ava';
import SP404PadInfo from '../../dist/audio/sp404-padinfo.js';

test('constructor(list, options): can initialize', (t) => {
  const data = fs.readFileSync('./test/audio/assets/sp404/PAD_INFO.BIN');
  const audio = new SP404PadInfo(data);
  t.is(audio.pads.length, 120);
});

test('.parse(): can decode all entires in a PAD_INFO.BIN file', (t) => {
  const data = fs.readFileSync('./test/audio/assets/sp404/PAD_INFO.BIN');
  const { pads } = new SP404PadInfo(data);
  t.is(pads.length, 120);
  t.deepEqual(pads[0], {
    avaliable: false,
    channels: 'Stereo',
    format: 'WAVE',
    gate: false,
    label: 'A1',
    filename: 'A0000001.WAV',
    lofi: false,
    loop: false,
    originalSampleEnd: 385388,
    originalSampleStart: 512,
    originalTempo: 109.9,
    reverse: true,
    tempoMode: 'Off',
    userSampleEnd: 385388,
    userSampleStart: 512,
    userTempo: 109.9,
    volume: 87,
  });
  t.deepEqual(pads[119], {
    avaliable: false,
    channels: 'Stereo',
    format: 'WAVE',
    gate: true,
    label: 'J12',
    filename: 'J0000012.WAV',
    lofi: false,
    loop: false,
    originalSampleEnd: 53424,
    originalSampleStart: 512,
    originalTempo: 100,
    reverse: false,
    tempoMode: 'Off',
    userSampleEnd: 53424,
    userSampleStart: 512,
    userTempo: 100,
    volume: 127,
  });
});

test('.parse(): can decode an invalid entry (all 0xFF)', (t) => {
  const data = fs.readFileSync('./test/audio/assets/sp404/BAD_PAD.BIN');
  const { pads } = new SP404PadInfo(data);
  t.is(pads.length, 1);
  t.deepEqual(pads[0], {
    avaliable: false,
    channels: 'Invalid (255)',
    format: 'Invalid (255)',
    gate: 255,
    label: 'A1',
    filename: 'A0000001.WAV',
    lofi: 255,
    loop: 255,
    originalSampleEnd: 4294967295,
    originalSampleStart: 4294967295,
    originalTempo: 429496729.5,
    reverse: 255,
    tempoMode: 'Invalid',
    userSampleEnd: 4294967295,
    userSampleStart: 4294967295,
    userTempo: 429496729.5,
    volume: 255,
  });
});

test('.parse(): can decode edge cases, incompatible flags', (t) => {
  const data = fs.readFileSync('./test/audio/assets/sp404/OPTIONS_A.BIN');
  const { pads } = new SP404PadInfo(data);
  t.is(pads.length, 1);
  t.deepEqual(pads[0], {
    avaliable: false,
    channels: 'Mono',
    format: 'AIFF',
    gate: true,
    label: 'A1',
    filename: 'A0000001.WAV',
    lofi: true,
    loop: true,
    originalSampleEnd: 385388,
    originalSampleStart: 512,
    originalTempo: 109.9,
    reverse: true,
    tempoMode: 'Pattern',
    userSampleEnd: 385388,
    userSampleStart: 512,
    userTempo: 109.9,
    volume: 87,
  });
});

test('.parse(): can decode edge cases, ivalid volume flags', (t) => {
  const data = fs.readFileSync('./test/audio/assets/sp404/OPTIONS_B.BIN');
  const { pads } = new SP404PadInfo(data);
  t.is(pads.length, 1);
  t.deepEqual(pads[0], {
    avaliable: false,
    channels: 'Mono',
    format: 'AIFF',
    gate: true,
    label: 'A1',
    filename: 'A0000001.WAV',
    lofi: true,
    loop: true,
    originalSampleEnd: 385388,
    originalSampleStart: 512,
    originalTempo: 109.9,
    reverse: true,
    tempoMode: 'User',
    userSampleEnd: 385388,
    userSampleStart: 512,
    userTempo: 109.9,
    volume: 255,
  });
});

test('SP404PadInfo.encodePad(data): can encode a default PAD_INFO.BIN pad', (t) => {
  const valid = fs.readFileSync('./test/audio/assets/sp404/PAD_DEFAULTS.BIN');
  const data = {
    originalSampleStart: 512,
    originalSampleEnd: 512,
    userSampleStart: 512,
    userSampleEnd: 512,
    volume: 127,
    lofi: false,
    loop: false,
    gate: true,
    reverse: false,
    format: 'WAVE',
    channels: 2,
    tempoMode: 'Off',
    originalTempo: 120,
    userTempo: 120,
  };
  let pad = SP404PadInfo.encodePad(data);
  t.deepEqual(pad, valid);
  pad = SP404PadInfo.encodePad({});
  t.deepEqual(pad, valid);

  // Lo-Fi
  pad = SP404PadInfo.encodePad({ lofi: true });
  t.true(new SP404PadInfo(pad).pads[0].lofi);
  pad = SP404PadInfo.encodePad({ lofi: false });
  t.false(new SP404PadInfo(pad).pads[0].lofi);

  // Loop
  pad = SP404PadInfo.encodePad({ loop: true });
  t.true(new SP404PadInfo(pad).pads[0].loop);
  pad = SP404PadInfo.encodePad({ loop: false });
  t.false(new SP404PadInfo(pad).pads[0].loop);

  // Gate
  pad = SP404PadInfo.encodePad({ gate: true });
  t.true(new SP404PadInfo(pad).pads[0].gate);
  pad = SP404PadInfo.encodePad({ gate: false });
  t.false(new SP404PadInfo(pad).pads[0].gate);

  // Reverse
  pad = SP404PadInfo.encodePad({ reverse: true });
  t.true(new SP404PadInfo(pad).pads[0].reverse);
  pad = SP404PadInfo.encodePad({ reverse: false });
  t.false(new SP404PadInfo(pad).pads[0].reverse);

  // Format
  pad = SP404PadInfo.encodePad({ format: 'AIFF' });
  t.is(new SP404PadInfo(pad).pads[0].format, 'AIFF');
  pad = SP404PadInfo.encodePad({ format: 'WAVE' });
  t.is(new SP404PadInfo(pad).pads[0].format, 'WAVE');

  // Channels
  pad = SP404PadInfo.encodePad({ channels: 'Stereo' });
  t.is(new SP404PadInfo(pad).pads[0].channels, 'Stereo');
  pad = SP404PadInfo.encodePad({ channels: 2 });
  t.is(new SP404PadInfo(pad).pads[0].channels, 'Stereo');
  pad = SP404PadInfo.encodePad({ channels: 'Mono' });
  t.is(new SP404PadInfo(pad).pads[0].channels, 'Mono');
  pad = SP404PadInfo.encodePad({ channels: 1 });
  t.is(new SP404PadInfo(pad).pads[0].channels, 'Mono');

  // Tempo Mode
  pad = SP404PadInfo.encodePad({ tempoMode: 'User' });
  t.is(new SP404PadInfo(pad).pads[0].tempoMode, 'User');
  pad = SP404PadInfo.encodePad({ tempoMode: 2 });
  t.is(new SP404PadInfo(pad).pads[0].tempoMode, 'User');
  pad = SP404PadInfo.encodePad({ tempoMode: 'Pattern' });
  t.is(new SP404PadInfo(pad).pads[0].tempoMode, 'Pattern');
  pad = SP404PadInfo.encodePad({ tempoMode: 1 });
  t.is(new SP404PadInfo(pad).pads[0].tempoMode, 'Pattern');
  pad = SP404PadInfo.encodePad({ tempoMode: 'Off' });
  t.is(new SP404PadInfo(pad).pads[0].tempoMode, 'Off');
  pad = SP404PadInfo.encodePad({ tempoMode: 0 });
  t.is(new SP404PadInfo(pad).pads[0].tempoMode, 'Off');
});

test('SP404PadInfo.encodePad(data): throws an error with invalid volumes', (t) => {
  t.throws(() => {
    SP404PadInfo.encodePad({ volume: -1 });
  }, { message: 'Volume is invalid, -1 should be an integer between 0 and 127.' });
  t.throws(() => {
    SP404PadInfo.encodePad({ volume: 255 });
  }, { message: 'Volume is invalid, 255 should be an integer between 0 and 127.' });
  t.throws(() => {
    SP404PadInfo.encodePad({ volume: '127' });
  }, { message: 'Volume is invalid, 127 should be an integer between 0 and 127.' });
});

test('SP404PadInfo.encodePad(data): throws an error with invalid channels', (t) => {
  t.throws(() => {
    SP404PadInfo.encodePad({ channels: -1 });
  }, { message: 'Channels is invalid, -1 should be an integer between 1 and 2.' });
  t.throws(() => {
    SP404PadInfo.encodePad({ channels: 5.1 });
  }, { message: 'Channels is invalid, 5.1 should be an integer between 1 and 2.' });
  t.throws(() => {
    SP404PadInfo.encodePad({ channels: 'mono' });
  }, { message: 'Channels is invalid, mono should be an integer between 1 and 2.' });
});

test('SP404PadInfo.encodePad(data): throws an error with invalid tempoMode', (t) => {
  t.throws(() => {
    SP404PadInfo.encodePad({ tempoMode: -1 });
  }, { message: 'Tempo Mode is invalid, -1 should be one of \'Off\', \'Pattern\', or \'User\'.' });
});

test('SP404PadInfo.encodePad(data): can encode the same way as the OEM software', (t) => {
  let valid = fs.readFileSync('./test/audio/assets/sp404/PAD_A1.BIN');
  let data = {
    originalSampleStart: 512,
    originalSampleEnd: 385388,
    userSampleStart: 512,
    userSampleEnd: 385388,
    volume: 87,
    lofi: false,
    loop: false,
    gate: false,
    reverse: true,
    format: 'WAVE',
    channels: 'Stereo',
    tempoMode: 'Off',
    originalTempo: 109.9,
    userTempo: 109.9,
  };
  let pad = SP404PadInfo.encodePad(data);
  t.deepEqual(pad, valid);

  valid = fs.readFileSync('./test/audio/assets/sp404/PAD_J12.BIN');
  data = {
    originalSampleStart: 512,
    originalSampleEnd: 53424,
    userSampleStart: 512,
    userSampleEnd: 53424,
    volume: 127,
    lofi: false,
    loop: false,
    gate: true,
    reverse: false,
    format: 'WAVE',
    channels: 'Stereo',
    tempoMode: 'Off',
    originalTempo: 100,
    userTempo: 100,
  };
  pad = SP404PadInfo.encodePad(data);
  t.deepEqual(pad, valid);
});

test('SP404PadInfo.getPadLabel(index): returns a pad label or empty string', (t) => {
  t.is(SP404PadInfo.getPadLabel(0), 'A1');
  t.is(SP404PadInfo.getPadLabel(119), 'J12');
  t.is(SP404PadInfo.getPadLabel(), '');

  for (let i = 0; i < 120; i++) {
    t.true(SP404PadInfo.getPadLabel(i).length >= 2);
  }
});

test('SP404PadInfo.getPadIndex(label): returns a pad index or -1', (t) => {
  t.is(SP404PadInfo.getPadIndex('A1'), 0);
  t.is(SP404PadInfo.getPadIndex('j12'), 119);
  t.is(SP404PadInfo.getPadIndex(), -1);

  for (let i = 0; i < 120; i++) {
    t.true(SP404PadInfo.getPadIndex(SP404PadInfo.getPadLabel(i)) < 120);
    t.true(SP404PadInfo.getPadIndex(SP404PadInfo.getPadLabel(i)) > -1);
  }
});

test('SP404PadInfo.checkDefault(pad): returns the booelan value of the default status', (t) => {
  const data = {
    originalSampleStart: 512,
    originalSampleEnd: 512,
    userSampleStart: 512,
    userSampleEnd: 512,
    volume: 127,
    lofi: false,
    loop: false,
    gate: true,
    reverse: false,
    format: 'WAVE',
    channels: 2,
    tempoMode: 'Off',
    originalTempo: 120,
    userTempo: 120,
  };
  t.true(SP404PadInfo.checkDefault(data));
  t.true(SP404PadInfo.checkDefault(data, true));

  // Not matching defaults
  t.false(SP404PadInfo.checkDefault());
  t.false(SP404PadInfo.checkDefault({ ...data, originalSampleStart: 0 }));

  // Not Strict vs Strict
  t.true(SP404PadInfo.checkDefault({ ...data, format: 'AIFF' }));
  t.false(SP404PadInfo.checkDefault({ ...data, format: 'AIFF' }, true));
});

test('encodePad(): omitted input and parsed strict defaults work', (t) => {
  const valid = fs.readFileSync('./test/audio/assets/sp404/PAD_DEFAULTS.BIN');
  t.deepEqual(SP404PadInfo.encodePad(), valid);
  const parser = SP404PadInfo.fromFile(valid);
  t.true(parser.pads[0].avaliable);
  t.true(SP404PadInfo.checkDefault(parser.pads[0], true));
  t.deepEqual(SP404PadInfo.encodePad(parser.pads[0]), valid);
  parser.parse();
  t.is(parser.pads.length, 1);
  t.deepEqual(parser.data, valid);
});

test('parse(): rejects incomplete records and records outside the device pad count', (t) => {
  for (const size of [1, 31, 33, 121 * 32]) {
    t.throws(() => new SP404PadInfo(new Uint8Array(size)), { instanceOf: RangeError });
  }
  t.deepEqual(new SP404PadInfo().pads, []);
  const parser = new SP404PadInfo(SP404PadInfo.encodePad());
  const previous = parser.pads;
  parser.data = new Uint8Array(31);
  t.throws(() => parser.parse(), { instanceOf: RangeError });
  t.is(parser.pads, previous);
});

test('encodePad(): validates offsets, tempos, formats, and flags without coercion', (t) => {
  for (const originalSampleStart of [-1, 0x100000000, 0.5, NaN, Infinity, '512']) {
    t.throws(() => SP404PadInfo.encodePad({ originalSampleStart }), { instanceOf: RangeError });
  }
  for (const field of ['originalSampleEnd', 'userSampleStart', 'userSampleEnd']) {
    t.throws(() => SP404PadInfo.encodePad({ [field]: -1 }), { instanceOf: RangeError });
  }
  for (const value of [-1, NaN, Infinity, '120', 429496729.6]) {
    t.throws(() => SP404PadInfo.encodePad({ originalTempo: value }), { instanceOf: RangeError });
    t.throws(() => SP404PadInfo.encodePad({ userTempo: value }), { instanceOf: RangeError });
  }
  for (const field of ['lofi', 'loop', 'gate', 'reverse']) {
    t.throws(() => SP404PadInfo.encodePad({ [field]: 2 }), { instanceOf: RangeError });
  }
  t.throws(() => SP404PadInfo.encodePad({ format: 'MP3' }), { instanceOf: RangeError });
  const pad = new SP404PadInfo(SP404PadInfo.encodePad({ originalTempo: 123.45, userTempo: 0 })).pads[0];
  t.is(pad.originalTempo, 123.5);
  t.is(pad.userTempo, 0);
});

test('pad labels: reject malformed labels and noninteger indices', (t) => {
  for (const index of [-1, 120, 0.5, NaN, Infinity, '0']) t.is(SP404PadInfo.getPadLabel(index), '');
  for (const label of ['A0', 'A01', 'A13', 'K1', 'J12 ', '', null, 0]) {
    t.is(SP404PadInfo.getPadIndex(label), -1);
  }
});
