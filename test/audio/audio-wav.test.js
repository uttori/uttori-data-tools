import test from 'ava';
import { promises as fs } from 'fs';
import { deflateSync } from 'node:zlib';
import { AudioWAV, DataBuffer } from '../../dist/index.js';

test('constructor(input, options): can initialize', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Kount Challenge November Drums.wav');
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
  // RIFF smpl fields are 32-bit; loop points above 255 detect byte-wide reads.
  const chunk = Buffer.alloc(69);
  chunk.write('smpl', 0);
  chunk.writeUInt32LE(61, 4);
  chunk.writeUInt32LE(1, 8); // manufacturer
  chunk.writeUInt32LE(2, 12); // product
  chunk.writeUInt32LE(3, 16); // sample period
  chunk.writeUInt32LE(60, 20); // MIDI unity note
  chunk.writeUInt32LE(1, 36); // sample loop count
  chunk.writeUInt32LE(1, 40); // sampler data size
  chunk.writeUInt32LE(10, 44); // loop ID
  chunk.writeUInt32LE(256, 52); // inclusive loop start
  chunk.writeUInt32LE(511, 56); // inclusive loop end
  chunk[68] = 0xAB;
  const value = AudioWAV.decodeSMPL(chunk);
  t.is(value.sampleLoopsCount, 1);
  t.is(value.sampleDataSize, 1);
  t.deepEqual(value.sampleLoops, [{ ID: 10, type: 0, start: 256, end: 511, fraction: 0, count: 0 }]);
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

test('AudioWAV.decodeFMT(): labels a combined extensible channel mask', (t) => {
  // Same as above but with a multi-bit channel mask, decoded as the combination of its speaker labels.
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
  t.is(value.channelMaskLabel, 'speaker_front_left | speaker_front_right');
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

test('AudioWAV.decodeBEXT(): excludes alignment from an odd declared chunk size', (t) => {
  const chunk = Buffer.alloc(612);
  chunk.write('bext', 0);
  chunk.writeUInt32LE(603, 4); // odd size: the 602-byte fixed header plus one coding-history byte
  chunk[610] = 0x41;
  chunk[611] = 0xFF; // alignment is not part of the coding history
  const value = AudioWAV.decodeBEXT(chunk, { roundOddChunks: true });
  t.is(value.size, 603);
  t.deepEqual([...value.codingHistory], [0x41]);
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
    list: '1',
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
  t.is(audio.chunks.length, 5);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'FLLR');
  t.is(audio.chunks[3].type, 'data');
  t.is(audio.chunks[4].type, 'LGWV');
});

// `DIST`
// `cart` with odd size
// `best` with odd size
test('AudioWAV.decodeChunk(): can decode a DISP chunk and odd size `bext` and `cart` (Waka SNARE ROLL PATTERN (43).WAV)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Waka SNARE ROLL PATTERN (43).WAV');
  const audio = AudioWAV.fromFile(data, { roundOddChunks: false });
  t.is(audio.chunks.length, 6);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'display');
  t.is(audio.chunks[4].type, 'broadcast_extension');
  t.is(audio.chunks[5].type, 'cart');
});

// `strc` chunk, Broken `ltx` as part of decodeLISTadtl
test('AudioWAV.decodeChunk(): can recover from a bad chunk (Bell.wav)', async (t) => {
  const data = await fs.readFile('./test/audio/assets/Bell.wav');
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
  t.is(audio.chunks[10].type, 'ID3 ');
  t.is(audio.chunks[11].type, 'list');
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
  t.is(audio.chunks.length, 7);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'list');
  t.is(audio.chunks[4].type, 'display');
  t.is(audio.chunks[5].type, 'broadcast_extension');
  t.is(audio.chunks[6].type, '(broken)');
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
  t.is(audio.chunks.length, 7);
  t.is(audio.chunks[0].type, 'header');
  t.is(audio.chunks[1].type, 'format');
  t.is(audio.chunks[2].type, 'data');
  t.is(audio.chunks[3].type, 'list');
  t.is(audio.chunks[4].type, 'display');
  t.is(audio.chunks[5].type, 'broadcast_extension');
  t.is(audio.chunks[6].type, '(broken)');
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
  t.is(audio.chunks.filter((chunk) => chunk.type === 'common').length, 1);
  t.is(audio.chunks.filter((chunk) => chunk.type === 'format_version').length, 1);
  t.is(audio.chunks.filter((chunk) => chunk.type === 'sound_data').length, 1);
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
  t.is(audio.chunks[5].type, 'sound_data');
  t.is(audio.chunks[6].type, 'ID3 ');
});


// Synthetic fixtures keep boundary and metadata regressions reproducible without external audio assets.
function wavChunksToArrays(chunks) {
  return chunks.map((chunk) => ({ ...chunk, chunk: chunk.chunk ? [...chunk.chunk] : undefined }));
}

function wavChunk(id, payload = Buffer.alloc(0), options = {}) {
  const { littleEndian = true, padding = true, size = payload.length } = options;
  const header = Buffer.alloc(8);
  header.write(id, 0, 4, 'latin1');
  if (littleEndian) header.writeUInt32LE(size, 4);
  else header.writeUInt32BE(size, 4);
  return Buffer.concat([header, payload, padding && payload.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
}

function wavFile(chunks = [], options = {}) {
  const { riff = 'RIFF', format = riff === 'FORM' ? 'AIFF' : 'WAVE' } = options;
  const body = Buffer.concat(chunks);
  return Buffer.concat([AudioWAV.encodeHeader({ riff, format, size: options.size ?? 4 + body.length }), body]);
}

function wavUInt32(value) {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return bytes;
}

function wavFormat(overrides = {}) {
  const bytes = Buffer.alloc(16);
  bytes.writeUInt16LE(overrides.audioFormatValue ?? 1, 0);
  bytes.writeUInt16LE(overrides.channels ?? 1, 2);
  bytes.writeUInt32LE(overrides.sampleRate ?? 8000, 4);
  bytes.writeUInt32LE(overrides.byteRate ?? 8000, 8);
  bytes.writeUInt16LE(overrides.blockAlign ?? 1, 12);
  bytes.writeUInt16LE(overrides.bitsPerSample ?? 8, 14);
  return wavChunk('fmt ', bytes);
}

function wavDS64(chunks, entries = [], options = {}) {
  const payload = Buffer.alloc(28 + entries.length * 12);
  payload.writeUInt32LE(options.dataSize ?? 3, 8);
  payload.writeUInt32LE(options.dataSizeHigh ?? 0, 12);
  payload.writeUInt32LE(options.samples ?? 0, 16);
  payload.writeUInt32LE(options.sampleCountHigh ?? 0, 20);
  payload.writeUInt32LE(entries.length, 24);
  for (const [index, entry] of entries.entries()) {
    payload.write(entry.id, 28 + index * 12, 4, 'ascii');
    payload.writeUInt32LE(entry.size, 32 + index * 12);
    payload.writeUInt32LE(entry.high ?? 0, 36 + index * 12);
  }
  const ds64 = wavChunk('ds64', payload);
  const bytes = wavFile([ds64, ...chunks], { riff: options.riff ?? 'RF64', size: 0xFFFFFFFF });
  bytes.writeUInt32LE(options.riffSize ?? bytes.length - 8, 20);
  bytes.writeUInt32LE(options.riffSizeHigh ?? 0, 24);
  return bytes;
}

function wavAiffCommon(options = {}) {
  const bytes = Buffer.alloc(18);
  bytes.writeUInt16BE(1, 0);
  bytes.writeUInt32BE(options.frames ?? 3, 2);
  bytes.writeUInt16BE(8, 6);
  Buffer.from('400bfa00000000000000', 'hex').copy(bytes, 8); // 8000 Hz in 80-bit extended precision
  if (!options.compressed) return wavChunk('COMM', bytes, { littleEndian: false });
  const name = Buffer.from(options.name ?? 'not compressed');
  const extra = Buffer.concat([Buffer.from('NONE'), Buffer.from([name.length]), name, (name.length + 1) % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
  return wavChunk('COMM', Buffer.concat([bytes, extra]), { littleEndian: false });
}

function wavBext(version, history = Buffer.alloc(0)) {
  const payload = Buffer.alloc(602);
  payload.writeUInt16LE(version, 346);
  return wavChunk('bext', Buffer.concat([payload, history]));
}

test('AudioWAV.fromBuffer(): preserves caller cursor and linked-list pointers', (t) => {
  const buffer = new DataBuffer(wavFile([wavFormat(), wavChunk('data', Buffer.from([1, 2]))]));
  const next = new DataBuffer([1]);
  const prev = new DataBuffer([2]);
  buffer.next = next;
  buffer.prev = prev;
  buffer.seek(5);
  const audio = AudioWAV.fromBuffer(buffer);
  t.is(buffer.offset, 5);
  t.is(buffer.next, next);
  t.is(buffer.prev, prev);
  t.is(audio.container, 'WAVE');
  t.is(audio.type, 'WAVE');
  t.is(audio.chunks.length, 3);
});

test('AudioWAV.parse(): starts over without duplicate chunks or stale errors', (t) => {
  const audio = AudioWAV.fromFile(wavFile([wavFormat(), wavChunk('data', Buffer.from([1]))]));
  const expected = wavChunksToArrays(audio.chunks);
  audio.errors.push({ offset: 0, message: 'stale' });
  audio.parse();
  t.deepEqual(wavChunksToArrays(audio.chunks), expected);
  t.deepEqual(audio.errors, []);
  t.is(audio.remainingBytes(), 0);
});

test('AudioWAV.parse(): supports bounded Buffer and Uint8Array subviews', (t) => {
  const file = wavFile([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]))]);
  const surrounding = Buffer.concat([Buffer.alloc(13, 0xCC), file, Buffer.alloc(17, 0xDD)]);
  const expected = wavChunksToArrays(AudioWAV.fromFile(file).chunks);
  t.deepEqual(wavChunksToArrays(AudioWAV.fromFile(surrounding.subarray(13, 13 + file.length)).chunks), expected);
  t.deepEqual(wavChunksToArrays(new AudioWAV(new Uint8Array(surrounding.buffer, surrounding.byteOffset + 13, file.length)).chunks), expected);
});

test('AudioWAV.decodeChunk(): retains independent raw chunks including their alignment bytes', (t) => {
  const bytes = new Uint8Array(wavFile([wavChunk('abcd', Buffer.from([1, 2, 3]))]));
  const audio = new AudioWAV(bytes);
  const chunk = audio.chunks[1].chunk;
  t.deepEqual([...chunk.subarray(8)], [1, 2, 3, 0]);
  bytes[20] = 99;
  t.is(chunk[8], 1);
});

test('AudioWAV.decodeChunk(): preserves zero-sized chunks and their following chunks', (t) => {
  const bytes = wavFile([wavChunk('JUNK'), wavChunk('abcd'), wavFormat(), wavChunk('data'), wavChunk('TAIL')]);
  const audio = AudioWAV.fromFile(bytes, { strict: true });
  t.deepEqual(audio.chunks.map((chunk) => chunk.type), ['header', 'junk', 'abcd', 'format', 'data', 'TAIL']);
  t.is(audio.chunks[4].value.duration, 0);
  t.deepEqual(audio.errors, []);
});

for (let length = 0; length < 12; length++) {
  test(`AudioWAV.decodeHeader(): rejects a ${length}-byte truncated header`, (t) => {
    t.throws(() => AudioWAV.decodeHeader(Buffer.alloc(length)), { instanceOf: RangeError });
    t.throws(() => new AudioWAV(Buffer.alloc(length)), { instanceOf: RangeError });
  });
}

for (let length = 1; length < 8; length++) {
  test(`AudioWAV.parse(): consumes a ${length}-byte incomplete final chunk header`, (t) => {
    const bytes = wavFile([wavFormat(), Buffer.alloc(length, 0x41)]);
    const audio = AudioWAV.fromFile(bytes);
    t.is(audio.chunks.at(-1).type, '(broken)');
    t.is(audio.offset, bytes.length);
    t.is(audio.errors.length, 1);
    t.throws(() => AudioWAV.fromFile(bytes, { strict: true }), { message: /Truncated chunk header/ });
  });
}

test('AudioWAV.parse(): records container length mismatches but keeps legacy recovery', (t) => {
  const bytes = wavFile([wavFormat(), wavChunk('data', Buffer.from([1, 2]))], { size: 4 });
  const audio = AudioWAV.fromFile(bytes);
  t.is(audio.chunks.at(-1).type, 'data');
  t.is(audio.errors[0].offset, 4);
  t.throws(() => AudioWAV.fromFile(bytes, { strict: true }), { message: /Container declares/ });
});

test('AudioWAV.parse(): skips malformed metadata without consuming the next chunk', (t) => {
  const badCue = wavChunk('cue ', wavUInt32(0xFFFFFFFF));
  const bytes = wavFile([wavFormat(), badCue, wavChunk('data', Buffer.from([1, 2]))]);
  const audio = AudioWAV.fromFile(bytes);
  t.deepEqual(audio.chunks.map((chunk) => chunk.type), ['header', 'format', 'data']);
  t.is(audio.errors.length, 1);
  t.is(audio.errors[0].offset, 36);
  t.throws(() => AudioWAV.fromFile(bytes, { strict: true }), { message: /cue point count/ });
});

test('AudioWAV.decodeChunk(): clamps truncated audio and records the declared-size error', (t) => {
  const bytes = wavFile([wavFormat(), wavChunk('data', Buffer.from([1, 2]), { size: 20 })]);
  const audio = AudioWAV.fromFile(bytes);
  t.is(audio.chunks.at(-1).value.duration, 2 / 8000);
  t.is(audio.errors.length, 1);
  t.throws(() => AudioWAV.fromFile(bytes, { strict: true }), { message: /declares 20 payload/ });
});

test('AudioWAV.decodeChunk(): handles missing final alignment without including padding in duration', (t) => {
  const padded = AudioWAV.fromFile(wavFile([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]))]));
  t.is(padded.chunks.at(-1).value.duration, 3 / 8000);
  const bytes = wavFile([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]), { padding: false })]);
  const audio = AudioWAV.fromFile(bytes);
  t.is(audio.chunks.at(-1).value.duration, 3 / 8000);
  t.is(audio.errors.length, 1);
  t.throws(() => AudioWAV.fromFile(bytes, { strict: true }), { message: /alignment/ });
});

test('AudioWAV.decodeChunk(): supports deliberately unpadded producer files', (t) => {
  const bytes = wavFile([wavChunk('odd!', Buffer.from([1]), { padding: false }), wavFormat(), wavChunk('data', Buffer.from([1]), { padding: false })]);
  const audio = AudioWAV.fromFile(bytes, { roundOddChunks: false, strict: true });
  t.deepEqual(audio.chunks.map((chunk) => chunk.type), ['header', 'odd!', 'format', 'data']);
  t.is(audio.chunks.at(-1).value.duration, 1 / 8000);
});

test('AudioWAV.parse(): computes duration when data precedes the format', (t) => {
  const audio = AudioWAV.fromFile(wavFile([wavChunk('data', Buffer.from([1, 2, 3])), wavFormat()]));
  t.is(audio.chunks[1].value.duration, 3 / 8000);
  t.deepEqual(audio.errors, []);
});

test('AudioWAV.parse(): retains data without format and reports unavailable duration', (t) => {
  const audio = AudioWAV.fromFile(wavFile([wavChunk('data', Buffer.from([1, 2]))]));
  t.true(Number.isNaN(audio.chunks[1].value.duration));
  t.is(audio.errors.length, 1);
});

test('AudioWAV.parse(): uses late fact samples for a single compressed data chunk', (t) => {
  const audio = AudioWAV.fromFile(wavFile([wavFormat({ audioFormatValue: 2, byteRate: 4000, bitsPerSample: 4 }), wavChunk('data', Buffer.alloc(10)), wavChunk('fact', wavUInt32(16000))]));
  t.is(audio.chunks[2].value.duration, 2);
});

test('AudioWAV.parse(): does not apply file-wide fact count independently to multiple data chunks', (t) => {
  const audio = AudioWAV.fromFile(wavFile([wavFormat({ audioFormatValue: 2 }), wavChunk('fact', wavUInt32(16000)), wavChunk('data', Buffer.alloc(4)), wavChunk('data', Buffer.alloc(8))]));
  t.deepEqual(audio.chunks.filter((chunk) => chunk.type === 'data').map((chunk) => chunk.value.duration), [4 / 8000, 8 / 8000]);
});

test('AudioWAV.parse(): uses a PCM rate fallback without creating infinite durations', (t) => {
  const pcm = AudioWAV.fromFile(wavFile([wavFormat({ byteRate: 0 }), wavChunk('data', Buffer.alloc(4))]));
  t.is(pcm.chunks.at(-1).value.duration, 4 / 8000);
  const unknown = AudioWAV.fromFile(wavFile([wavFormat({ audioFormatValue: 2, byteRate: 0 }), wavChunk('data', Buffer.alloc(4))]));
  t.true(Number.isNaN(unknown.chunks.at(-1).value.duration));
});

for (const riff of ['RF64', 'BW64']) {
  test(`AudioWAV.decodeChunk(): resolves ${riff} primary data size before following metadata`, (t) => {
    const bytes = wavDS64([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]), { size: 0xFFFFFFFF }), wavChunk('TAIL', Buffer.from([4, 5]))], [], { riff, samples: 3 });
    const audio = AudioWAV.fromFile(bytes, { strict: true });
    t.deepEqual(audio.chunks.map((chunk) => chunk.type), ['header', 'data_size_64', 'format', 'data', 'TAIL']);
    t.is(audio.chunks[3].value.duration, 3 / 8000);
    t.is(new DataView(audio.chunks[3].chunk.buffer, audio.chunks[3].chunk.byteOffset, audio.chunks[3].chunk.byteLength).getUint32(4, true), 0xFFFFFFFF);
  });
}

test('AudioWAV.decodeDS64(): resolves repeated table IDs in occurrence order', (t) => {
  const bytes = wavDS64([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]), { size: 0xFFFFFFFF }), wavChunk('more', Buffer.from([1, 2]), { size: 0xFFFFFFFF }), wavChunk('more', Buffer.from([3, 4, 5]), { size: 0xFFFFFFFF }), wavChunk('TAIL')], [{ id: 'more', size: 2 }, { id: 'more', size: 3 }]);
  const audio = AudioWAV.fromFile(bytes, { strict: true });
  t.is(audio.chunks.at(-1).type, 'TAIL');
  t.deepEqual(audio.chunks.filter((chunk) => chunk.type === 'more').map((chunk) => chunk.chunk.length), [10, 12]);
});

test('AudioWAV.decodeDS64(): uses table entries for later data chunks, not the primary size twice', (t) => {
  const bytes = wavDS64([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]), { size: 0xFFFFFFFF }), wavChunk('data', Buffer.from([4, 5]), { size: 0xFFFFFFFF }), wavChunk('TAIL')], [{ id: 'data', size: 2 }]);
  const audio = AudioWAV.fromFile(bytes, { strict: true });
  t.deepEqual(audio.chunks.filter((chunk) => chunk.type === 'data').map((chunk) => chunk.value.duration), [3 / 8000, 2 / 8000]);
});

test('AudioWAV.decodeDS64(): resolves sentinel sizes for known metadata as well as audio', (t) => {
  const bytes = wavDS64([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]), { size: 0xFFFFFFFF }), wavChunk('fact', wavUInt32(3), { size: 0xFFFFFFFF })], [{ id: 'fact', size: 4 }]);
  const audio = AudioWAV.fromFile(bytes, { strict: true });
  t.deepEqual(audio.chunks.at(-1).value, { numberOfSamples: 3 });
});

test('AudioWAV.decodeDS64(): rejects missing, truncated, and unsafe size mappings in strict mode', (t) => {
  const chunks = [wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]), { size: 0xFFFFFFFF })];
  t.throws(() => AudioWAV.fromFile(wavFile(chunks, { riff: 'RF64', size: 0xFFFFFFFF }), { strict: true }), { message: /ds64/ });
  t.throws(() => AudioWAV.fromFile(wavDS64(chunks, [], { dataSizeHigh: 0x200000 }), { strict: true }), { message: /MAX_SAFE_INTEGER/ });
  t.throws(() => AudioWAV.fromFile(wavDS64(chunks, [], { dataSize: 200 }), { strict: true }), { message: /payload/ });
  t.throws(() => AudioWAV.fromFile(wavDS64(chunks, [], { riffSizeHigh: 0x200000 }), { strict: true }), { message: /MAX_SAFE_INTEGER/ });
});

test('AudioWAV.decodeDS64(): obeys tableLength instead of reading trailing reserved bytes', (t) => {
  const bytes = Buffer.alloc(52);
  bytes.writeUInt32LE(1, 24);
  bytes.write('abcd', 28);
  bytes.writeUInt32LE(2, 32);
  bytes.fill(0xFE, 40);
  const value = AudioWAV.decodeDS64(wavChunk('ds64', bytes));
  t.deepEqual(value.table, [{ chunkID: 'abcd', chunkSizeLow: 2, chunkSizeHigh: 0 }]);
});

test('AudioWAV.decodeDS64(): rejects a table count that cannot fit before iterating', (t) => {
  const bytes = Buffer.alloc(28);
  bytes.writeUInt32LE(0xFFFFFFFF, 24);
  t.throws(() => AudioWAV.decodeDS64(wavChunk('ds64', bytes)), { message: /table length/ });
});

test('AudioWAV.decodeFMT(): ignores bytes after the declared format payload', (t) => {
  const chunk = Buffer.concat([wavFormat(), wavChunk('JUNK', Buffer.alloc(10, 0xFF))]);
  const value = AudioWAV.decodeFMT(chunk);
  t.is(value.size, 16);
  t.is(value.extraParamSize, undefined);
});

test('AudioWAV.decodeFMT(): rejects short base fields, cbSize, and truncated extensions', (t) => {
  t.throws(() => AudioWAV.decodeFMT(wavChunk('fmt ', Buffer.alloc(15))), { instanceOf: RangeError });
  t.throws(() => AudioWAV.decodeFMT(wavChunk('fmt ', Buffer.alloc(17))), { message: /extension size/ });
  const extra = Buffer.alloc(18);
  extra.writeUInt16LE(20, 16);
  t.throws(() => AudioWAV.decodeFMT(wavChunk('fmt ', extra)), { message: /extension data/ });
});

test('AudioWAV.decodeFMT(): rejects extensible formats without all 22 extension bytes', (t) => {
  const noExtra = wavFormat({ audioFormatValue: 0xFFFE });
  t.throws(() => AudioWAV.decodeFMT(noExtra), { message: /missing its extension/ });
  const bytes = Buffer.alloc(40);
  bytes.writeUInt16LE(0xFFFE, 0);
  bytes.writeUInt16LE(0, 16);
  t.throws(() => AudioWAV.decodeFMT(wavChunk('fmt ', bytes)), { message: /at least 22/ });
});

test('AudioWAV.decodeFMT(): labels zero, high-bit, combined, and reserved masks', (t) => {
  for (const [mask, expected] of [[0, 'unspecified'], [0x80000000, 'speaker_all'], [0x80000001, 'speaker_front_left | speaker_all'], [0x40000001, 'speaker_front_left | unknown_1073741824']]) {
    const bytes = Buffer.alloc(40);
    bytes.writeUInt16LE(0xFFFE, 0);
    bytes.writeUInt16LE(22, 16);
    bytes.writeUInt32LE(mask, 20);
    t.is(AudioWAV.decodeFMT(wavChunk('fmt ', bytes)).channelMaskLabel, expected);
  }
});

test('AudioWAV.encodeFMT(): writes binary extensions, infers length, and adds external alignment', (t) => {
  for (const extraParams of [new Uint8Array([0xAB, 0xCD, 0xEF]), [0xAB, 0xCD, 0xEF]]) {
    const chunk = AudioWAV.encodeFMT({ extraParams });
    t.is(chunk.length, 30);
    t.is(chunk.readUInt32LE(4), 21);
    t.deepEqual([...AudioWAV.decodeFMT(chunk).extraParams], [0xAB, 0xCD, 0xEF]);
    t.is(chunk[29], 0);
  }
});

test('AudioWAV.encodeFMT(): derives dependent defaults and preserves explicit rates', (t) => {
  const derived = AudioWAV.decodeFMT(AudioWAV.encodeFMT({ channels: 1, sampleRate: 48000, bitsPerSample: 24 }));
  t.is(derived.blockAlign, 3);
  t.is(derived.byteRate, 144000);
  const explicit = AudioWAV.decodeFMT(AudioWAV.encodeFMT({ channels: 1, byteRate: 123, blockAlign: 7 }));
  t.is(explicit.byteRate, 123);
  t.is(explicit.blockAlign, 7);
  t.is(AudioWAV.encodeFMT().length, 26);
});

test('AudioWAV.encodeFMT(): preserves numeric text compatibility and zero-fills extra capacity', (t) => {
  t.is(AudioWAV.encodeFMT({ extraParams: 123 }).subarray(26, 29).toString(), '123');
  t.deepEqual([...AudioWAV.decodeFMT(AudioWAV.encodeFMT({ extraParams: [1], extraParamSize: 4 })).extraParams], [1, 0, 0, 0]);
});

test('AudioWAV.encodeFMT(): rejects invalid lengths, rates, and binary arrays', (t) => {
  for (const data of [{ extraParamSize: -1 }, { extraParamSize: 65536 }, { extraParamSize: 1, extraParams: [1, 2] }, { channels: 1.5 }, { sampleRate: Infinity }, { byteRate: NaN }, { extraParams: [256] }, { extraParams: [-1] }, { extraParams: Array(2) }, { audioFormatValue: 0xFFFE }]) {
    t.throws(() => AudioWAV.encodeFMT(data), { instanceOf: RangeError });
  }
});

test('AudioWAV.encodeHeader(): keeps custom FourCCs, encodes AIFF big-endian, and accepts the RF64 sentinel', (t) => {
  t.is(AudioWAV.encodeHeader({ riff: 'WIFF', format: 'RAVE', size: 4 }).toString('ascii', 0, 4), 'WIFF');
  t.is(AudioWAV.decodeHeader(AudioWAV.encodeHeader({ riff: 'FORM', format: 'AIFF', size: 0x123456 })).size, 0x123456);
  t.is(AudioWAV.encodeHeader({ riff: 'RF64', size: -1 }).readUInt32LE(4), 0xFFFFFFFF);
});

test('AudioWAV.encodeHeader(): rejects fractional sizes and FourCC overflow', (t) => {
  for (const size of [-1, 1.5, NaN, Infinity, 0x100000000]) t.throws(() => AudioWAV.encodeHeader({ size }), { instanceOf: RangeError });
  for (const riff of ['', 'RIF', 'RIFFF', '🦊abc']) t.throws(() => AudioWAV.encodeHeader({ riff, size: 4 }), { instanceOf: TypeError });
});

test('AudioWAV.decodeLISTINFO(): supports empty text followed by nonempty text', (t) => {
  const chunk = wavChunk('LIST', Buffer.concat([Buffer.from('INFO'), wavChunk('INAM'), wavChunk('IART', Buffer.from('AB'))]));
  t.deepEqual(AudioWAV.decodeLIST(chunk).data, [{ id: 'INAM', size: 0, text: '' }, { id: 'IART', size: 2, text: 'AB' }]);
});

test('AudioWAV.decodeLIST(): never reads sub-chunks after its declared payload', (t) => {
  const first = wavChunk('LIST', Buffer.from('INFO'));
  const extra = wavChunk('INAM', Buffer.from('later'));
  t.deepEqual(AudioWAV.decodeLIST(Buffer.concat([first, extra])).data, []);
});

test('AudioWAV.decodeLISTINFO(): validates short headers, text lengths, and alignment', (t) => {
  for (const payload of [Buffer.from('INFOx'), Buffer.concat([Buffer.from('INFO'), wavChunk('INAM', Buffer.from('x'), { size: 20 })]), Buffer.concat([Buffer.from('INFO'), wavChunk('INAM', Buffer.from('x'), { padding: false })])]) {
    t.throws(() => AudioWAV.decodeLIST(wavChunk('LIST', payload)), { instanceOf: RangeError });
  }
});

test('AudioWAV.decodeLISTadtl(): decodes cue identifiers, note text, and label alignment', (t) => {
  const payload = Buffer.concat([Buffer.from('adtl'), wavChunk('labl', Buffer.concat([wavUInt32(1234), Buffer.from('AB\0')])), wavChunk('note', Buffer.concat([wavUInt32(5678), Buffer.from('note\0')])), wavChunk('misc')]);
  const value = AudioWAV.decodeLIST(wavChunk('LIST', payload));
  t.is(value.data[0].cuePointID, 1234);
  t.is(value.data[0].label, 'AB');
  t.is(value.data[1].cuePointID, 5678);
  t.is(value.data[1].note, 'note');
  t.is(value.data[2].id, 'misc');
});

test('AudioWAV.decodeLISTadtl(): decodes the fixed ltxt header separately from its text', (t) => {
  const bytes = Buffer.alloc(20);
  bytes.writeUInt32LE(10, 0);
  bytes.writeUInt32LE(200, 4);
  bytes.write('rgn ', 8);
  bytes.writeUInt16LE(1, 12);
  bytes.writeUInt16LE(2, 14);
  bytes.writeUInt16LE(3, 16);
  bytes.writeUInt16LE(1252, 18);
  const value = AudioWAV.decodeLIST(wavChunk('LIST', Buffer.concat([Buffer.from('adtl'), wavChunk('ltxt', Buffer.concat([bytes, Buffer.from('region\0')]))]))).data[0];
  t.deepEqual(value, { id: 'ltxt', size: 27, label: undefined, ltxt: 'region', cuePointID: 10, sampleLength: 200, purposeID: 'rgn ', country: 1, language: 2, dialect: 3, codePage: 1252 });
});

test('AudioWAV.decodeLISTadtl(): applies roundOddChunks consistently to nested entries', (t) => {
  const payload = Buffer.concat([Buffer.from('adtl'), wavChunk('labl', Buffer.concat([wavUInt32(1), Buffer.from('A')]), { padding: false }), wavChunk('note', wavUInt32(2))]);
  const value = AudioWAV.decodeLIST(wavChunk('LIST', payload), { roundOddChunks: false });
  t.is(value.data.length, 2);
  t.is(value.data[1].note, '');
});

test('AudioWAV.decodeLISTadtl(): rejects labels without cue identifiers and short ltxt headers', (t) => {
  for (const [id, count] of [['labl', 3], ['note', 3], ['ltxt', 19]]) {
    t.throws(() => AudioWAV.decodeLIST(wavChunk('LIST', Buffer.concat([Buffer.from('adtl'), wavChunk(id, Buffer.alloc(count))]))), { instanceOf: RangeError });
  }
});

test('AudioWAV.decodeINST(): reads signed tuning and gain', (t) => {
  const value = AudioWAV.decodeINST(wavChunk('inst', Buffer.from([60, 206, 244, 0, 127, 1, 127])));
  t.is(value.fineTuning, -50);
  t.is(value.gain, -12);
});

test('AudioWAV.decodeACID(): reads floating-point tempo and reserved float', (t) => {
  const bytes = Buffer.alloc(24);
  bytes.writeFloatLE(0.5, 8);
  bytes.writeFloatLE(123.75, 20);
  const value = AudioWAV.decodeACID(wavChunk('acid', bytes));
  t.is(value.tempo, 123.75);
  t.is(value.unknown2, 0.5);
});

test('AudioWAV.decodePEAK(): decodes all channels and retains legacy first-channel aliases', (t) => {
  const bytes = Buffer.alloc(24);
  bytes.writeUInt32LE(1, 0);
  bytes.writeUInt32LE(123, 4);
  bytes.writeFloatLE(0.75, 8);
  bytes.writeUInt32LE(1000, 12);
  bytes.writeFloatLE(0.5, 16);
  bytes.writeUInt32LE(2000, 20);
  const value = AudioWAV.decodePEAK(wavChunk('PEAK', bytes));
  t.deepEqual(value.peaks, [{ value: 0.75, position: 1000 }, { value: 0.5, position: 2000 }]);
  t.is(value.ppeakPointer, bytes.readUInt32LE(8));
  t.is(value.bitAlign, 1000);
  t.throws(() => AudioWAV.decodePEAK(wavChunk('PEAK', bytes.subarray(0, 23))), { message: /Incomplete PEAK/ });
});

test('AudioWAV.decodePEAK(): uses big-endian fields in an AIFF container', (t) => {
  const bytes = Buffer.alloc(16);
  bytes.writeUInt32BE(1, 0);
  bytes.writeUInt32BE(123, 4);
  bytes.writeFloatBE(0.25, 8);
  bytes.writeUInt32BE(500, 12);
  const audio = AudioWAV.fromFile(wavFile([wavChunk('PEAK', bytes, { littleEndian: false })], { riff: 'FORM' }));
  t.deepEqual(audio.chunks[1].value.peaks, [{ value: 0.25, position: 500 }]);
});

test('AudioWAV.decodeDISP(): retains complete binary, ANSI, Unicode, and empty payloads', (t) => {
  const text = AudioWAV.decodeDISP(wavChunk('DISP', Buffer.concat([wavUInt32(1), Buffer.from('hello\0')])));
  t.is(text.text, 'hello');
  t.deepEqual([...text.rawData], [104, 101, 108, 108, 111, 0]);
  const unicode = AudioWAV.decodeDISP(wavChunk('DISP', Buffer.concat([wavUInt32(13), Buffer.from('こんにちは\0', 'utf16le')])));
  t.is(unicode.text, 'こんにちは');
  const binary = AudioWAV.decodeDISP(wavChunk('DISP', Buffer.concat([wavUInt32(8), Buffer.from([1, 2, 3])])));
  t.deepEqual([...binary.rawData], [1, 2, 3]);
  t.is(binary.data, 513);
  t.is(AudioWAV.decodeDISP(wavChunk('DISP', wavUInt32(8))).data, 0);
});

test('AudioWAV.decodeTLST(): accepts the 24-byte fixed header without an optional trailer', (t) => {
  const value = AudioWAV.decodeTLST(wavChunk('tlst', Buffer.alloc(24)));
  t.is(value.extra, 0);
  t.is(value.extraData, 0);
});

test('AudioWAV.decodeTLST(): retains variable-length extra data and rejects truncation', (t) => {
  const fixed = Buffer.alloc(24);
  fixed.writeUInt32LE(3, 20);
  const value = AudioWAV.decodeTLST(wavChunk('tlst', Buffer.concat([fixed, Buffer.from([0xF0, 0x41, 0xF7])])));
  t.deepEqual([...value.extraDataBytes], [0xF0, 0x41, 0xF7]);
  t.is(value.extraData, 0);
  t.throws(() => AudioWAV.decodeTLST(wavChunk('tlst', fixed)), { message: /Truncated tlst/ });
});

for (const version of [0, 1, 2]) {
  test(`AudioWAV.decodeBEXT(): handles version ${version} reserved bytes and coding-history order`, (t) => {
    const chunk = wavBext(version, Buffer.from('A=PCM\r\nB=24\r\n'));
    const value = AudioWAV.decodeBEXT(chunk);
    t.is(value.version, version);
    t.is(value.reserved.length, version === 0 ? 254 : version === 1 ? 190 : 180);
    t.is(value.umid.length, version === 0 ? 0 : 64);
    t.is(Buffer.from(value.codingHistory).toString(), 'A=PCM\r\nB=24\r\n');
  });
}

test('AudioWAV.decodeBEXT(): reads signed loudness and preserves the undefined sentinel', (t) => {
  const chunk = wavBext(2);
  for (const [index, value] of [-2300, 400, -100, -1800, 0x7FFF].entries()) chunk.writeInt16LE(value, 420 + index * 2);
  const value = AudioWAV.decodeBEXT(chunk);
  t.deepEqual([value.loudnessValue, value.loudnessRange, value.maxTruePeakLevel, value.maxMomentaryLoudness, value.maxShortTermLoudness], [-2300, 400, -100, -1800, 0x7FFF]);
  t.throws(() => AudioWAV.decodeBEXT(wavChunk('bext', Buffer.alloc(601))), { instanceOf: RangeError });
});

test('AudioWAV.decodeSMPL(): validates loop counts and sampler-data lengths before allocation', (t) => {
  const bytes = Buffer.alloc(36);
  bytes.writeUInt32LE(0xFFFFFFFF, 28);
  t.throws(() => AudioWAV.decodeSMPL(wavChunk('smpl', bytes)), { message: /sample loop count/ });
  bytes.writeUInt32LE(0, 28);
  bytes.writeUInt32LE(0xFFFFFFFF, 32);
  t.throws(() => AudioWAV.decodeSMPL(wavChunk('smpl', bytes)), { message: /sampler-specific/ });
});

test('AudioWAV.decodeSMPL(): retains all sampler data but excludes an odd alignment byte', (t) => {
  const bytes = Buffer.alloc(36);
  bytes.writeUInt32LE(3, 32);
  const value = AudioWAV.decodeSMPL(wavChunk('smpl', Buffer.concat([bytes, Buffer.from([1, 2, 3])])));
  t.deepEqual([...value.sampleData], [1, 2, 3]);
});

test('AudioWAV.decodeCue(): validates counts against declared bytes rather than later chunks', (t) => {
  const bad = wavChunk('cue ', wavUInt32(1));
  t.throws(() => AudioWAV.decodeCue(Buffer.concat([bad, Buffer.alloc(24)])), { message: /cue point count/ });
});

test('AudioWAV.decodeSTRC(): keeps the existing slice-count convention and bounds large counts', (t) => {
  const bytes = Buffer.alloc(60);
  bytes.writeUInt32LE(28, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(1234, 32);
  t.is(AudioWAV.decodeSTRC(wavChunk('strc', bytes)).slices[0].ID1, 1234);
  bytes.writeUInt32LE(0xFFFFFFFF, 4);
  t.throws(() => AudioWAV.decodeSTRC(wavChunk('strc', bytes)), { message: /slice count/ });
});

test('AudioWAV.encodeRLND(): does not overwrite fields with an oversized device name', (t) => {
  t.throws(() => AudioWAV.encodeRLND({ device: 'roifspsxOVERFLOW' }), { instanceOf: TypeError });
  t.is(AudioWAV.decodeRLND(AudioWAV.encodeRLND({ device: 'roifspsx', sampleIndex: 'j12' })).sampleIndex, 119);
  t.is(AudioWAV.decodeRLND(AudioWAV.encodeRLND({ device: 'roifspsx', unknown1: 0 })).unknown1, 0);
  for (const sampleIndex of [-1, 256, 1.5, NaN]) t.throws(() => AudioWAV.encodeRLND({ device: 'roifspsx', sampleIndex }), { instanceOf: RangeError });
});

test('AudioWAV.decodeResU(): decodes UTF-8 JSON across streaming output boundaries', (t) => {
  const expected = { duration: 3.5, name: `${'A'.repeat(16378)}日本語🙂`, nested: [true, null, 2] };
  const chunk = wavChunk('ResU', deflateSync(JSON.stringify(expected)));
  t.deepEqual(AudioWAV.decodeResU(chunk).data, expected);
});

test('AudioWAV.decodeResU(): enforces the uncompressed-byte limit before retaining excessive output', (t) => {
  const payload = JSON.stringify({ text: 'A'.repeat(100000) });
  const chunk = wavChunk('ResU', deflateSync(payload));
  const value = AudioWAV.decodeResU(chunk, { maxResUSize: 64 });
  t.is(value.data, undefined);
  t.true(value.error.includes('maxResUSize'));
  t.deepEqual(AudioWAV.decodeResU(chunk, { maxResUSize: Buffer.byteLength(payload) }).data, JSON.parse(payload));
  t.throws(() => AudioWAV.fromFile(wavFile([chunk]), { strict: true, maxResUSize: 64 }), { message: /maxResUSize/ });
});

test('AudioWAV.decodeResU(): diagnoses invalid JSON and truncated compressed streams', (t) => {
  const notJSON = AudioWAV.decodeResU(wavChunk('ResU', deflateSync('not json')));
  t.is(notJSON.data, undefined);
  t.truthy(notJSON.error);
  const compressed = deflateSync('{"ok":true}');
  const truncated = AudioWAV.decodeResU(wavChunk('ResU', compressed.subarray(0, compressed.length - 2)));
  t.is(truncated.data, undefined);
  t.truthy(truncated.error);
  const audio = AudioWAV.fromFile(wavFile([wavChunk('ResU', Buffer.from('junk')), wavChunk('TAIL')]));
  t.is(audio.chunks.at(-1).type, 'TAIL');
  t.is(audio.errors.length, 1);
});

test('AudioWAV.decodeResU(): validates limit options and supports a zero-byte budget', (t) => {
  const chunk = wavChunk('ResU', deflateSync('{}'));
  for (const maxResUSize of [-1, 1.5, NaN, Infinity]) {
    t.throws(() => AudioWAV.decodeResU(chunk, { maxResUSize }), { instanceOf: RangeError });
    t.throws(() => AudioWAV.fromFile(wavFile(), { maxResUSize }), { instanceOf: RangeError });
  }
  t.truthy(AudioWAV.decodeResU(chunk, { maxResUSize: 0 }).error);
});

test('AudioWAV.decodeCOMM(): decodes AIFF and empty or nonempty AIFF-C Pascal names', (t) => {
  const aiff = AudioWAV.decodeCOMM(wavAiffCommon());
  t.is(aiff.sampleRate, 8000);
  t.is(aiff.sampleFrames, 3);
  t.is(aiff.compressionType, '');
  for (const name of ['', 'A', 'AB', 'not compressed']) {
    const aifc = AudioWAV.decodeCOMM(wavAiffCommon({ compressed: true, name }));
    t.is(aifc.compressionType, 'NONE');
    t.is(aifc.compressionTypeName, name);
  }
});

test('AudioWAV.decodeCOMM(): validates compression-name lengths and Pascal padding', (t) => {
  const chunk = wavAiffCommon({ compressed: true, name: 'AB' });
  chunk[30] = 100;
  t.throws(() => AudioWAV.decodeCOMM(chunk), { message: /compression name/ });
  const bytes = Buffer.concat([wavAiffCommon().subarray(8), Buffer.from('NONE'), Buffer.from([0])]);
  t.throws(() => AudioWAV.decodeCOMM(wavChunk('COMM', bytes, { littleEndian: false })), { message: /Pascal string padding/ });
});

test('AudioWAV.decodeSSND(): excludes offset bytes and external alignment from sound data', (t) => {
  const payload = Buffer.alloc(13);
  payload.writeUInt32BE(2, 0);
  payload[8] = 0xAA;
  payload[9] = 0xBB;
  payload.set([1, 2, 3], 10);
  const value = AudioWAV.decodeSSND(wavChunk('SSND', payload, { littleEndian: false }));
  t.is(value.offset, 2);
  t.deepEqual([...value.soundData], [1, 2, 3]);
  payload.writeUInt32BE(6, 0);
  t.throws(() => AudioWAV.decodeSSND(wavChunk('SSND', payload, { littleEndian: false })), { message: /offset exceeds/ });
});

test('AudioWAV.decodeChunk(): distinguishes AIFF common, sound-data, and format-version chunks', (t) => {
  const fver = Buffer.alloc(4);
  fver.writeUInt32BE(2726318400);
  const file = wavFile([wavChunk('FVER', fver, { littleEndian: false }), wavAiffCommon({ compressed: true, frames: 0 }), wavChunk('NAME', Buffer.from('Test'), { littleEndian: false }), wavChunk('SSND', Buffer.alloc(8), { littleEndian: false })], { riff: 'FORM', format: 'AIFC' });
  const audio = AudioWAV.fromFile(file, { strict: true });
  t.is(audio.container, 'AIFF');
  t.deepEqual(audio.chunks.map((chunk) => chunk.type), ['header', 'format_version', 'common', 'name', 'sound_data']);
  t.is(audio.chunks[1].value.versionName, 'AIFCVersion1');
  t.is(audio.chunks[3].value.name, 'Test');
  t.is(audio.chunks[4].value.soundData.length, 0);
});

test('AudioWAV.decodeChunk(): handles empty AIFF text before the next chunk', (t) => {
  const audio = AudioWAV.fromFile(wavFile([wavChunk('NAME', Buffer.alloc(0), { littleEndian: false }), wavChunk('AUTH', Buffer.from('AB'), { littleEndian: false })], { riff: 'FORM' }));
  t.is(audio.chunks[1].value.name, '');
  t.is(audio.chunks[2].value.name, 'AB');
});

test('AudioWAV.parse(): deterministic malformed-input corpus terminates with bounded chunks', (t) => {
  let seed = 0x12345678;
  const next = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
  const ids = ['fmt ', 'data', 'LIST', 'cue ', 'smpl', 'ds64', 'strc', 'JUNK', 'inst', 'ResU', 'abcd'];
  for (let index = 0; index < 1200; index++) {
    const payload = Buffer.alloc(next() % 128);
    for (let byte = 0; byte < payload.length; byte++) payload[byte] = next() & 0xFF;
    const chunk = wavChunk(ids[next() % ids.length], payload, { size: next() % 3 === 0 ? next() : payload.length });
    const bytes = wavFile([chunk, Buffer.alloc(next() % 8)]);
    const audio = AudioWAV.fromFile(bytes, { maxResUSize: 1024 });
    t.is(audio.offset, bytes.length);
    t.true(audio.chunks.length <= Math.floor((bytes.length - 12) / 8) + 2);
  }
});


test('AudioWAV.decodeChunk(): trims AIFF block-fill bytes after late COMM metadata', (t) => {
  const payload = Buffer.alloc(20, 0xAA);
  payload.writeUInt32BE(2, 0);
  payload.writeUInt32BE(16, 4);
  payload.set([1, 2, 3], 10);
  const file = wavFile([wavChunk('SSND', payload, { littleEndian: false }), wavAiffCommon()], { riff: 'FORM' });
  const audio = AudioWAV.fromFile(file, { strict: true });
  t.deepEqual([...audio.chunks[1].value.soundData], [1, 2, 3]);
  t.is(audio.chunks[1].chunk.length, 28);
});

test('AudioWAV.decodeChunk(): diagnoses truncated AIFF sample frames', (t) => {
  const file = wavFile([wavAiffCommon(), wavChunk('SSND', Buffer.alloc(8), { littleEndian: false })], { riff: 'FORM' });
  const audio = AudioWAV.fromFile(file);
  t.is(audio.errors.length, 1);
  t.throws(() => AudioWAV.fromFile(file, { strict: true }), { message: /COMM requires 3/ });
});

test('AudioWAV.decodeChunk(): does not trim compressed AIFF-C bytes by decoded sample width', (t) => {
  const common = wavAiffCommon({ compressed: true, frames: 1 });
  common.write('ima4', 26);
  const audio = AudioWAV.fromFile(wavFile([common, wavChunk('SSND', Buffer.alloc(40), { littleEndian: false })], { riff: 'FORM', format: 'AIFC' }), { strict: true });
  t.is(audio.chunks.at(-1).value.soundData.length, 32);
});

test('AudioWAV.decodeChunk(): never mutates RF64 sentinel headers during metadata decoding', (t) => {
  const bytes = wavDS64([wavFormat(), wavChunk('data', Buffer.from([1, 2, 3]), { size: 0xFFFFFFFF }), wavChunk('fact', wavUInt32(3), { size: 0xFFFFFFFF })], [{ id: 'fact', size: 4 }]);
  const original = Buffer.from(bytes);
  const audio = AudioWAV.fromFile(bytes, { strict: true });
  const fact = audio.chunks.at(-1).chunk;
  t.is(new DataView(fact.buffer, fact.byteOffset, fact.byteLength).getUint32(4, true), 0xFFFFFFFF);
  t.deepEqual(bytes, original);
  t.deepEqual([...audio.data], [...original]);
});

test('AudioWAV.decodeChunk(): does not use sample counts when a sentinel size cannot be resolved', (t) => {
  const file = wavDS64([wavFormat({ audioFormatValue: 2 }), wavChunk('data', Buffer.alloc(0)), wavChunk('data', Buffer.from([1, 2, 3]), { size: 0xFFFFFFFF })], [], { samples: 16000 });
  const audio = AudioWAV.fromFile(file);
  t.true(audio.errors.some((error) => error.message.includes('Missing ds64 size')));
  t.is(audio.chunks.at(-1).value.duration, 4 / 8000); // Only the available bytes can be estimated when the actual size is unknown.
});

test('AudioWAV.parse(): keeps an empty audio duration at zero despite contradictory fact metadata', (t) => {
  const audio = AudioWAV.fromFile(wavFile([wavFormat({ audioFormatValue: 2 }), wavChunk('data'), wavChunk('fact', wavUInt32(1000))]));
  t.is(audio.chunks[2].value.duration, 0);
});

test('AudioWAV.encodeRLND(): validates all parameter bytes before writing', (t) => {
  for (const name of ['unknown1', 'unknown2', 'unknown3', 'unknown4']) {
    for (const value of [-1, 256, 1.5, NaN]) t.throws(() => AudioWAV.encodeRLND({ device: 'roifspsx', [name]: value }), { instanceOf: RangeError });
  }
});

test('AudioWAV standalone decoders: enforce minimum declared payload lengths', (t) => {
  for (const [method, id, minimum, littleEndian] of [
    ['decodeFMT', 'fmt ', 16, true], ['decodeLIST', 'LIST', 4, true],
    ['decodeTLST', 'tlst', 24, true], ['decodeFACT', 'fact', 4, true],
    ['decodePEAK', 'PEAK', 8, true], ['decodeDISP', 'DISP', 4, true],
    ['decodeACID', 'acid', 24, true], ['decodeINST', 'inst', 7, true],
    ['decodeSMPL', 'smpl', 36, true], ['decodeRLND', 'RLND', 13, true],
    ['decodeBEXT', 'bext', 602, true], ['decodeCue', 'cue ', 4, true],
    ['decodeDS64', 'ds64', 28, true], ['decodeSTRC', 'strc', 28, true],
    ['decodeCOMM', 'COMM', 18, false], ['decodeSSND', 'SSND', 8, false],
    ['decodeFVER', 'FVER', 4, false],
  ]) {
    for (const length of [0, 1, 7]) t.throws(() => AudioWAV[method](Buffer.alloc(length)), { instanceOf: RangeError });
    // Physical bytes after the declared payload may not satisfy a missing field.
    const chunk = wavChunk(id, Buffer.alloc(minimum), { littleEndian, size: minimum - 1 });
    t.throws(() => AudioWAV[method](chunk), { instanceOf: RangeError });
    // A declaration larger than the actual input is independently invalid.
    if (littleEndian) chunk.writeUInt32LE(chunk.length - 7, 4);
    else chunk.writeUInt32BE(chunk.length - 7, 4);
    t.throws(() => AudioWAV[method](chunk), { instanceOf: RangeError });
  }
});


test('AudioWAV.decodeSMPL(): decodes packed SMPTE hours, minutes, seconds, and frames', (t) => {
  for (const hours of [-23, -1, 0, 12, 23]) {
    const bytes = Buffer.alloc(36);
    bytes.writeUInt32LE(30, 20);
    bytes.writeUInt32LE((((hours & 0xFF) << 24) | (45 << 16) | (12 << 8) | 29) >>> 0, 24);
    const value = AudioWAV.decodeSMPL(wavChunk('smpl', bytes));
    t.deepEqual([value.SMPTEOffset1, value.SMPTEOffset2, value.SMPTEOffset3, value.SMPTEOffset4], [hours, 45, 12, 29]);
  }
});
