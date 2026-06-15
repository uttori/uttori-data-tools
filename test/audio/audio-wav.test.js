import test from 'ava';
import { promises as fs } from 'fs';
import { AudioWAV, DataBuffer, DataBufferList } from '../../src/index.js';

test('constructor(list, options): can initialize', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Kount Challenge November Drums.wav');
  const buffer = new DataBuffer(data);
  let audio;
  t.notThrows(() => {
    audio = new AudioWAV(data);
  });
  t.is(audio.chunks.length, 8);
});

test('AudioWAV.fromFile(data): can read a valid file', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Kount Challenge November Drums.wav');
  t.notThrows(() => {
    AudioWAV.fromFile(data);
  });
});

test('AudioWAV.fromBuffer(buffer): can read a valid file buffer', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Kount Challenge November Drums.wav');
  const buffer = new DataBuffer(data);
  t.notThrows(() => {
    AudioWAV.fromBuffer(buffer);
  });
});

test('AudioWAV.decodeHeader(): can detect a valid RF64 heade & decode DS64 tags', async (t) => {
  const data = await fs.readFile('./test/audio/assets/rect_24bit_rf64.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 4);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'data_size_64');
  t.is(audio.chunks[2].type, 'format');
  t.is(audio.chunks[3].type, 'data');
  t.deepEqual(audio.chunks[3].value, { duration: 0.5 });
});

test('AudioWAV.decodeHeader(): can detect a broken RIFF header', async (t) => {
  const data = await fs.readFile('./test/audio/assets/bad_header_riff.wav');
  t.throws(() => {
    AudioWAV.fromFile(data);
  }, { message: 'Invalid or unrecorgnized file header: \'RIFD\'' });
});

test('AudioWAV.decodeHeader(): can detect a broken WAVE header', async (t) => {
  const data = await fs.readFile('./test/audio/assets/bad_header_wave.wav');
  t.throws(() => {
    AudioWAV.fromFile(data);
  }, { message: 'Invalid WAVE header, expected \'WAVE\' and got \'WAVF\'' });
});

test('AudioWAV.decodeHeader(): can detect a broken AIFF header', (t) => {
  // 'FORM' marks an AIFF container, but the trailing format must be 'AIFF' or 'AIFC'.
  const chunk = Buffer.from([
    0x46, 0x4F, 0x52, 0x4D, // 'FORM'
    0x00, 0x00, 0x00, 0x00, // size
    0x58, 0x58, 0x58, 0x58, // 'XXXX' (invalid format)
  ]);
  t.throws(() => {
    AudioWAV.decodeHeader(chunk);
  }, { message: 'Invalid AIFF header, expected \'AIFF\' or \'AIFC\' and got \'XXXX\'' });
});

test('AudioWAV.encodeHeader(data): can encode a header chunk', async (t) => {
  const valid = await fs.readFile('./test/audio/assets/header_chunk.bin');
  const data = {
    size: 26590,
  };
  const chunk = AudioWAV.encodeHeader(data);
  t.deepEqual(chunk, valid);
});

test('AudioWAV.encodeHeader(data): can encode a header with nonsense', async (t) => {
  const valid = await fs.readFile('./test/audio/assets/header_chunk_bad.bin');
  const data = {
    riff: 'WIFF',
    size: 26590,
    format: 'RAVE',
  };
  const chunk = AudioWAV.encodeHeader(data);
  t.deepEqual(chunk, valid);
});

test('AudioWAV.decodeChunk(): can decode an unknown chunk', async (t) => {
  const data = await fs.readFile('./test/audio/assets/unknown_chunk.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 2);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'zmt ');
});

test('AudioWAV.decodeChunk(): can decode an odd JUNK size', async (t) => {
  const data = await fs.readFile('./test/audio/assets/odd_junk_size.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 3);
});

test('AudioWAV.decodeLISTINFO(): can decode a LIST INFO chunk', async (t) => {
  const data = await fs.readFile('./test/audio/assets/pluck-pcm8.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 4);
  t.is(audio.chunks[2].type, 'list');
  t.is(audio.chunks[2].value.type, 'INFO');
});

test('AudioWAV.decodeLISTINFO(): can handle the odd chunk alignment quirk', async (t) => {
  const data = await fs.readFile('./test/audio/assets/ODD-CHUNK-LIST-INFO.bin');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 3);
  t.is(audio.chunks[2].type, 'list');
  t.is(audio.chunks[2].value.type, 'INFO');
});

test('AudioWAV.decodeFMT(): can decode a Format chunk', async (t) => {
  const data = await fs.readFile('./test/audio/assets/A0000001.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 4);
  t.deepEqual(audio.chunks[1].value, {
    audioFormat: 'Microsoft Pulse Code Modulation (PCM) / Uncompressed',
    audioFormatValue: 1,
    bitsPerSample: 16,
    blockAlign: 4,
    byteRate: 176400,
    channels: 2,
    chunkID: 'fmt ',
    extraParamSize: 0,
    extraParams: new Uint8Array(),
    sampleRate: 44100,
    size: 18,
  });
  t.deepEqual(audio.chunks[3].value, { duration: 2.1818367346938774 });
});

test('AudioWAV.encodeFMT(data): can encode a fmt chunk', async (t) => {
  const valid = await fs.readFile('./test/audio/assets/fmt_chunk.bin');
  const data = {
    audioFormatValue: 1,
    channels: 2,
    sampleRate: 44100,
    byteRate: 176400,
    blockAlign: 4,
    bitsPerSample: 16,
    extraParamSize: 0,
    extraParams: new Uint8Array(),
  };
  let chunk = AudioWAV.encodeFMT(data);
  t.deepEqual(chunk, valid);
  chunk = AudioWAV.encodeFMT();
  t.deepEqual(chunk, valid);
});

test('AudioWAV.decodeRLND(): can decode a Roland SP-404SX chunk', async (t) => {
  const data = await fs.readFile('./test/audio/assets/J0000012.WAV');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 4);
  t.is(audio.chunks[2].type, 'roland');
  t.deepEqual(audio.chunks[2].value, {
    chunkID: 'RLND',
    device: 'roifspsx',
    sampleIndex: 119,
    sampleLabel: 'J12',
    size: 458,
    unknown1: 4,
    unknown2: 0,
    unknown3: 0,
    unknown4: 0,
  });
  t.deepEqual(audio.chunks[3].value, { duration: 0.2999546485260771 });
});

test('AudioWAV.decodeSMPL(): can decode a sampler chunk with sample loops and sampler data', (t) => {
  // Hand-built `smpl` chunk: header, one sample loop, and a single trailing sampler-specific data byte.
  const chunk = Buffer.from([
    0x73, 0x6D, 0x70, 0x6C, // 'smpl'
    0x00, 0x00, 0x00, 0x00, // size (unused by the decoder)
    0x01, 0x00, 0x00, 0x00, // manufacturer 1-4
    0x02, // product
    0x03, // samplePeriod
    0x3C, // midiUnityNote (60)
    0x00, // midiPitchFraction
    0x00, // SMPTEFormat
    0x00, 0x00, 0x00, 0x00, // SMPTEOffset 1-4
    0x01, // sampleLoopsCount
    0x01, // sampleDataSize
    0x0A, 0x00, 0x01, 0x02, 0x00, 0x00, // loop: ID, type, start, end, fraction, count
    0xAB, // sampler-specific data
  ]);
  const value = AudioWAV.decodeSMPL(chunk);
  t.is(value.sampleLoopsCount, 1);
  t.is(value.sampleDataSize, 1);
  t.deepEqual(value.sampleLoops, [{ ID: 10, type: 0, start: 1, end: 2, fraction: 0, count: 0 }]);
});

test('AudioWAV.decodeFMT(): labels an unrecognized audio format tag', (t) => {
  const chunk = Buffer.alloc(24);
  chunk.write('fmt ', 0);
  chunk.writeUInt32LE(16, 4); // size
  chunk.writeUInt16LE(0x9999, 8); // audioFormatValue: not in the lookup
  chunk.writeUInt16LE(2, 10); // channels
  chunk.writeUInt32LE(44100, 12); // sampleRate
  chunk.writeUInt32LE(176400, 16); // byteRate
  chunk.writeUInt16LE(4, 20); // blockAlign
  chunk.writeUInt16LE(16, 22); // bitsPerSample
  const value = AudioWAV.decodeFMT(chunk);
  t.is(value.audioFormatValue, 0x9999);
  t.is(value.audioFormat, 'Unknown: 9999');
});

test('AudioWAV.decodeFMT(): can decode a WAVE_FORMAT_EXTENSIBLE (0xFFFE) format chunk', (t) => {
  // Hand-built `fmt ` chunk flagged as extensible so the extended sub-fields are parsed.
  const chunk = Buffer.alloc(48);
  chunk.write('fmt ', 0);
  chunk.writeUInt32LE(40, 4); // size
  chunk.writeUInt16LE(0xFFFE, 8); // audioFormatValue: extensible
  chunk.writeUInt16LE(2, 10); // channels
  chunk.writeUInt32LE(44100, 12); // sampleRate
  chunk.writeUInt32LE(176400, 16); // byteRate
  chunk.writeUInt16LE(4, 20); // blockAlign
  chunk.writeUInt16LE(16, 22); // bitsPerSample
  chunk.writeUInt16LE(22, 24); // extraParamSize
  chunk.writeUInt16LE(16, 26); // validBitsPerSample
  chunk.writeUInt32LE(0x00000001, 28); // channelMask: speaker_front_left
  const value = AudioWAV.decodeFMT(chunk);
  t.is(value.audioFormatValue, 0xFFFE);
  t.is(value.validBitsPerSample, 16);
  t.is(value.channelMask, 1);
  t.is(value.channelMaskLabel, 'speaker_front_left');
  t.is(value.subFormat_1, 0);
});

test('AudioWAV.decodeFMT(): labels an unrecognized extensible channel mask', (t) => {
  // Same as above but with a multi-bit channel mask that is not in the speaker-label lookup.
  const chunk = Buffer.alloc(48);
  chunk.write('fmt ', 0);
  chunk.writeUInt32LE(40, 4); // size
  chunk.writeUInt16LE(0xFFFE, 8); // audioFormatValue: extensible
  chunk.writeUInt16LE(2, 10); // channels
  chunk.writeUInt32LE(44100, 12); // sampleRate
  chunk.writeUInt32LE(176400, 16); // byteRate
  chunk.writeUInt16LE(4, 20); // blockAlign
  chunk.writeUInt16LE(16, 22); // bitsPerSample
  chunk.writeUInt16LE(22, 24); // extraParamSize
  chunk.writeUInt16LE(16, 26); // validBitsPerSample
  chunk.writeUInt32LE(0x00000003, 28); // channelMask: front L+R, not a single-bit lookup entry
  const value = AudioWAV.decodeFMT(chunk);
  t.is(value.channelMask, 3);
  t.is(value.channelMaskLabel, 'unknown_3');
});

test('AudioWAV.decodeFMT(): can decode a format chunk with extra parameters', (t) => {
  // Hand-built non-extensible `fmt ` chunk that carries two bytes of extra parameter data.
  const chunk = Buffer.alloc(28);
  chunk.write('fmt ', 0);
  chunk.writeUInt32LE(20, 4); // size
  chunk.writeUInt16LE(1, 8); // audioFormatValue: PCM
  chunk.writeUInt16LE(2, 10); // channels
  chunk.writeUInt32LE(44100, 12); // sampleRate
  chunk.writeUInt32LE(176400, 16); // byteRate
  chunk.writeUInt16LE(4, 20); // blockAlign
  chunk.writeUInt16LE(16, 22); // bitsPerSample
  chunk.writeUInt16LE(2, 24); // extraParamSize
  chunk.writeUInt8(0xAB, 26); // extraParams
  chunk.writeUInt8(0xCD, 27);
  const value = AudioWAV.decodeFMT(chunk);
  t.is(value.extraParamSize, 2);
  t.deepEqual([...value.extraParams], [0xAB, 0xCD]);
});

test('AudioWAV.encodeFMT(data): can encode a fmt chunk with extra parameters', (t) => {
  const chunk = AudioWAV.encodeFMT({ extraParamSize: 4, extraParams: 'TEST' });
  // 26 header bytes + 4 extra param bytes.
  t.is(chunk.length, 30);
  t.is(chunk.toString('utf8', 26, 30), 'TEST');
});

test('AudioWAV.decodeLIST(): debug logs and skips an unknown LIST type', (t) => {
  const chunk = Buffer.alloc(12);
  chunk.write('LIST', 0);
  chunk.writeUInt32LE(4, 4); // size
  chunk.write('JUNK', 8); // unknown list type
  const value = AudioWAV.decodeLIST(chunk);
  t.is(value.type, 'JUNK');
  t.is(value.data, undefined);
});

test('AudioWAV.decodeRLND(): debug logs an unknown pad index', (t) => {
  const chunk = Buffer.alloc(21);
  chunk.write('RLND', 0);
  chunk.writeUInt32LE(13, 4); // size
  chunk.write('roifspsx', 8); // device
  chunk.writeUInt8(200, 20); // sampleIndex out of the 0-119 range
  const value = AudioWAV.decodeRLND(chunk);
  t.is(value.sampleIndex, 200);
  t.is(value.sampleLabel, '');
});

test('AudioWAV.encodeRLND(data): defaults an unknown sample label to index 0', (t) => {
  const chunk = AudioWAV.encodeRLND({ device: 'roifspsx', sampleIndex: 'ZZ' });
  t.is(chunk.length, 466);
  t.is(chunk.readUInt8(20), 0); // sampleIndex falls back to 0
});

test('AudioWAV.decodeBEXT(): rounds an odd chunk size up when requested', (t) => {
  const chunk = Buffer.alloc(610);
  chunk.write('bext', 0);
  chunk.writeUInt32LE(601, 4); // odd size
  const value = AudioWAV.decodeBEXT(chunk, { roundOddChunks: true });
  t.is(value.size, 602);
});

test('AudioWAV.decodeCue(): debug logs unexpected trailing bytes', (t) => {
  const chunk = Buffer.alloc(14);
  chunk.write('cue ', 0);
  chunk.writeUInt32LE(4, 4); // size
  chunk.writeUInt32LE(0, 8); // numberCuePoints
  chunk.writeUInt8(0xAA, 12); // unexpected trailing bytes
  chunk.writeUInt8(0xBB, 13);
  const value = AudioWAV.decodeCue(chunk);
  t.is(value.numberCuePoints, 0);
  t.is(value.data.length, 0);
});

test('AudioWAV.decodeResU(): tolerates data that fails to inflate or parse', (t) => {
  const chunk = Buffer.alloc(12);
  chunk.write('ResU', 0);
  chunk.writeUInt32LE(4, 4); // size
  chunk.write('junk', 8); // not zlib-compressed, not JSON
  const value = AudioWAV.decodeResU(chunk);
  t.is(value.chunkID, 'ResU');
  t.is(value.size, 4);
  t.is(value.data, undefined);
});

test('AudioWAV.decodeDS64(): parses the optional chunk size table', (t) => {
  const chunk = Buffer.alloc(48);
  chunk.write('ds64', 0);
  chunk.writeUInt32LE(40, 4); // size
  // riff / data / sampleCount 64-bit values (offsets 8-31) left as 0
  chunk.writeUInt32LE(1, 32); // tableLength
  chunk.write('data', 36); // table entry chunkID
  chunk.writeUInt32LE(0x10, 40); // chunkSizeLow
  chunk.writeUInt32LE(0x00, 44); // chunkSizeHigh
  const value = AudioWAV.decodeDS64(chunk);
  t.is(value.tableLength, 1);
  t.deepEqual(value.table, [{ chunkID: 'data', chunkSizeLow: 0x10, chunkSizeHigh: 0 }]);
});

test('AudioWAV.decodeFVER(): labels an unrecognized format version timestamp', (t) => {
  const chunk = Buffer.alloc(12);
  chunk.write('FVER', 0);
  chunk.writeUInt32BE(4, 4); // size (big-endian for AIFF)
  chunk.writeUInt32BE(1, 8); // timestamp that is not the AIFCVersion1 value
  const value = AudioWAV.decodeFVER(chunk);
  t.is(value.versionName, 'Unknown: 1');
});

test('AudioWAV.encodeRLND(data): can encode a RLND chunk', async (t) => {
  const valid = await fs.readFile('./test/audio/assets/rldn_chunk.bin');
  const data = { device: 'roifspsx', unknown1: 4, unknown2: 0, unknown3: 0, unknown4: 0, sampleIndex: 0 };
  let chunk = AudioWAV.encodeRLND(data);
  t.deepEqual(chunk, valid);
  chunk = AudioWAV.encodeRLND({ device: 'roifspsx', sampleIndex: 'a1' });
  t.deepEqual(chunk, valid);
});

test('AudioWAV.decodeResU(data): can read a valid ResU (Logic Pro X) chunk', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Kount Challenge November Drums.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 8);
  t.is(audio.chunks[4].type, 'logic_resu');
  t.is(audio.chunks[4].value.data.duration, 35.17240363);
});

test('AudioWAV.decodeChunk(): can decode an acid & instrument chunk (AM - Dark (808).wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/AM - Dark (808).wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 9);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'fact');
  t.is(audio.chunks[3].type, 'data');
  t.is(audio.chunks[4].type, 'sample');
  t.is(audio.chunks[5].type, 'instrument');
  t.deepEqual(audio.chunks[5].value, {
    unshiftedNote: 60,
    fineTuning: 0,
    gain: 0,
    lowNote: 0,
    highNote: 127,
    lowVelocity: 0,
    highVelocity: 127,
  });
  t.is(audio.chunks[6].type, 'acid');
  t.deepEqual(audio.chunks[6].value, {
    beats: 12,
    meterDenominator: 4,
    meterNumerator: 4,
    rootNote: 60,
    tempo: 0,
    type: 1,
    unknown1: 128,
    unknown2: 0,
  });
  t.is(audio.chunks[7].type, 'list');
  t.is(audio.chunks[8].type, 'list');
});

test('AudioWAV.decodeChunk(): can decode a sample chunk (AM - Heaven (808).wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/AM - Heaven (808).wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 5);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'sample');
  t.is(audio.chunks[4].type, 'list');
});

// https://www.yumpu.com/en/document/read/49734369/sound-forge-50-manualpdf page 362
test('AudioWAV.decodeChunk(): can decode a `tlst` chunk and an edge case LIST adtl chunk (AM - Quick (Fill).wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/AM - Quick (Fill).wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 8);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'sample');
  t.is(audio.chunks[4].type, 'cue_points');
  t.is(audio.chunks[5].type, 'list');
  t.is(audio.chunks[6].type, 'trigger_list');
  t.deepEqual(audio.chunks[6].value, {
    extra: 0,
    extraData: 0,
    function: 9452799,
    list: 1,
    name: 'cue ',
    triggerOn1: 1,
    triggerOn2: 0,
    triggerOn3: 0,
    triggerOn4: 0,
    type: 0,
  });
  t.is(audio.chunks[7].type, 'list');
});

// LGWV: Logic Pro (Old), LoGicWaV
// FLLR: Padding? (FiLLeR?)
test('AudioWAV.decodeChunk(): can decode a `LGWV` & `FLLR` an edge case chunk where data should be odd (clp_clap10000.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/clp_clap10000.wav');
  const audio = AudioWAV.fromFile(data, { roundOddChunks: false });
  t.is(audio.chunks.length, 6);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'list');
  t.is(audio.chunks[3].type, 'FLLR');
  t.is(audio.chunks[4].type, 'data');
  t.is(audio.chunks[5].type, 'LGWV');
});

// `DIST`
// `cart` with odd size
// `best` with odd size
test('AudioWAV.decodeChunk(): can decode a DISP chunk and odd size `bext` and `cart` (Waka SNARE ROLL PATTERN (43).WAV)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Waka SNARE ROLL PATTERN (43).WAV');
  const audio = AudioWAV.fromFile(data, { roundOddChunks: false });
  t.is(audio.chunks.length, 7);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'list');
  t.is(audio.chunks[4].type, 'display');
  t.is(audio.chunks[5].type, 'broadcast_extension');
  t.is(audio.chunks[6].type, 'cart');
});

// `strc` chunk, Broken `ltx` as part of decodeLISTadtl
test('AudioWAV.decodeChunk(): can recover from a bad chunk (Bell.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Bell.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 11);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'fact');
  t.is(audio.chunks[3].type, 'data');
  t.is(audio.chunks[4].type, 'sample');
  t.is(audio.chunks[5].type, 'instrument');
  t.is(audio.chunks[6].type, 'acid');
  t.is(audio.chunks[7].type, 'strc');
  t.is(audio.chunks[8].type, 'cue_points');
  t.is(audio.chunks[9].type, 'ID3 ');
  t.is(audio.chunks[10].type, 'list');
});

// Weird `muma` chunk, MAGIX AG related?
test('AudioWAV.decodeChunk(): can recover from a bad chunk (Scream_FX_1.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Scream_FX_1.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 10);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'acid');
  t.is(audio.chunks[4].type, 'sample');
  t.is(audio.chunks[5].type, 'cue_points');
  t.is(audio.chunks[6].type, 'list');
  t.is(audio.chunks[7].type, 'list');
  t.is(audio.chunks[8].type, 'muma');
});

// Infinite Loop on broken tags
test('AudioWAV.decodeChunk(): can recover from a bad chunk (Waka SNARE ROLL PATTERN (45).wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Waka SNARE ROLL PATTERN (45).wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 8);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'list');
  t.is(audio.chunks[4].type, 'display');
  t.is(audio.chunks[5].type, 'broadcast_extension');
  // t.is(audio.chunks[6].type, 'art');
  t.is(audio.chunks[7].type, '(broken)');
});

// TODO: AVID Pro Tools automatically embeds the following chunks: media information ('minf'), elm1, regn, umid and DGDA. `ovwf`
// https://www.arsc-audio.org/pdf/ARSC_TC_MD_Study.pdf
test('AudioWAV.decodeChunk(): can decode ProTools chunks (without ovwf) (RONNY 808 04.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/RONNY 808 04.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 9);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'broadcast_extension');
  t.is(audio.chunks[2].type, 'format');
  t.is(audio.chunks[3].type, 'minf');
  t.is(audio.chunks[4].type, 'elm1');
  t.is(audio.chunks[5].type, 'data');
  t.is(audio.chunks[6].type, 'regn');
  t.is(audio.chunks[7].type, 'umid');
  t.is(audio.chunks[8].type, 'DGDA');
});

test('AudioWAV.decodeChunk(): can decode ProTools chunks (with ovwf) (Waka Clap 3 (9).wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Waka Clap 3 (9).wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 9);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'broadcast_extension');
  t.is(audio.chunks[2].type, 'format');
  t.is(audio.chunks[3].type, 'minf');
  t.is(audio.chunks[4].type, 'elm1');
  t.is(audio.chunks[5].type, 'data');
  t.is(audio.chunks[6].type, 'regn');
  t.is(audio.chunks[7].type, 'ovwf');
  t.is(audio.chunks[8].type, 'umid');
});

test('AudioWAV.decodeChunk(): can decode `PAD ` chunks (Supa Chant.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Supa Chant.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 5);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'padding');
  t.is(audio.chunks[3].type, 'data');
  t.is(audio.chunks[4].type, 'padding');
});

// TODO: LGWV LoGicWaV, `ID3 `, Logic Pro, Native Instruments
test('AudioWAV.decodeChunk(): can decode LGWV & `ID3 ` chunks (MB Hi Hat (2).wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/MB Hi Hat (2).wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 6);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'padding');
  t.is(audio.chunks[3].type, 'data');
  t.is(audio.chunks[4].type, 'LGWV');
  t.is(audio.chunks[5].type, 'ID3 ');
});

// TODO: `id3 `
test('AudioWAV.decodeChunk(): can decode fact & `id3 ` chunks (Hard Hard_Vox.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Hard Hard_Vox.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 12);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'fact');
  t.is(audio.chunks[3].type, 'data');
  t.is(audio.chunks[4].type, 'sample');
  t.is(audio.chunks[5].type, 'instrument');
  t.is(audio.chunks[6].type, 'acid');
  t.is(audio.chunks[7].type, 'strc');
  t.is(audio.chunks[8].type, 'cue_points');
  t.is(audio.chunks[9].type, 'list');
  t.is(audio.chunks[10].type, 'list');
  t.is(audio.chunks[11].type, 'id3 ');
});

// TODO: PEAK file with more than one entry
test('AudioWAV.decodeChunk(): can decode PEAK chunks (63138__uzerx__SUB_A_2_secs.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/63138__uzerx__SUB_A_2_secs.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 5);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'fact');
  t.is(audio.chunks[3].type, 'peak');
  t.is(audio.chunks[4].type, 'data');
});

// Broken Tags
test('AudioWAV.decodeChunk(): can decode PEAK chunks (Gated Rizer.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Gated Rizer.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 8);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'list');
  t.is(audio.chunks[4].type, 'display');
  t.is(audio.chunks[5].type, 'broadcast_extension');
  // t.is(audio.chunks[6].type, 'art');
  t.is(audio.chunks[7].type, '(broken)');
});

// https://www.finetunedmac.com/forums/ubbthreads.php?ubb=showflat&Number=8940s
test('AudioWAV.decodeChunk(): can decode strc chunks with many slices (01 fx 01.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/01 fx 01.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 10);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'sample');
  t.is(audio.chunks[3].type, 'instrument');
  t.is(audio.chunks[4].type, 'list');
  t.is(audio.chunks[5].type, 'data');
  t.is(audio.chunks[6].type, 'AFAn');
  t.is(audio.chunks[7].type, 'acid');
  t.is(audio.chunks[8].type, 'strc');
  t.is(audio.chunks[9].type, 'AFmd');
});

test('AudioWAV.decodeChunk(): can decode strc chunks with many slices (02 fx 02.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/02 fx 02.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 10);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'sample');
  t.is(audio.chunks[3].type, 'instrument');
  t.is(audio.chunks[4].type, 'list');
  t.is(audio.chunks[5].type, 'data');
  t.is(audio.chunks[6].type, 'AFAn');
  t.is(audio.chunks[7].type, 'acid');
  t.is(audio.chunks[8].type, 'strc');
  t.is(audio.chunks[9].type, 'AFmd');
});

test('AudioWAV.decodeChunk(): can decode AIFF files', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Amen_1.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 3);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'common');
});

test('AudioWAV.decodeChunk(): can decode AIFC files', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Amen Break Vinyl - by Reddit user HlCKELPICKLE.wav');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 4);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'common');
});

test('AudioWAV.decodeLISTINFO(): can decode an AIFF chunk', async (t) => {
  const data = await fs.readFile('./test/audio/assets/pluck-pcm8.aiff');
  const audio = AudioWAV.fromFile(data);
  t.is(audio.chunks.length, 7);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'common');
  t.is(audio.chunks[2].type, 'name');
  t.is(audio.chunks[3].type, 'auth');
  t.is(audio.chunks[4].type, 'anno');
  t.is(audio.chunks[5].type, 'common');
  t.is(audio.chunks[6].type, 'ID3 ');
});
