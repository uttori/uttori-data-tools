import zlib from 'zlib';

import { DataBuffer, DataBufferList } from './../index.js';

/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */

/** @type {DebugLogger} */
let debug = () => {};
/* c8 ignore next */
if (process.env.UTTORI_AUDIOWAV_DEBUG) { try { const { default: d } = await import('debug'); debug = d('Uttori.AudioWAV'); } catch {} }

/**
 * A decoded WAV / AIFF file header.
 * @typedef {object} WavHeader
 * @property {string} chunkID The container ID: `RIFF`, `RF64`, `BW64`, `FORM`, `AIFF`, or `AIFC`.
 * @property {number} size The declared size of the rest of the file in bytes.
 * @property {string} format The format ID, e.g. `WAVE`, `AIFF`, or `AIFC`.
 * @property {string} type The normalized container type: `WAVE` or `AIFF`.
 */

/**
 * A decoded `fmt ` (format) chunk. Fields after `bitsPerSample` are only present for extended / extensible formats.
 * @typedef {object} WavFormat
 * @property {string} chunkID The chunk ID, `fmt `.
 * @property {number} size The chunk size in bytes.
 * @property {number} audioFormatValue The numeric audio format code.
 * @property {string} audioFormat The human-readable audio format label.
 * @property {number} channels The number of channels.
 * @property {number} sampleRate The sample rate in Hz.
 * @property {number} byteRate The average bytes per second.
 * @property {number} blockAlign The block alignment (bytes per sample frame).
 * @property {number} bitsPerSample The number of bits per sample.
 * @property {number} [extraParamSize] The size of the extended parameter block, when present.
 * @property {number} [validBitsPerSample] The valid bits per sample (extensible format).
 * @property {number} [channelMask] The channel mask (extensible format).
 * @property {string} [channelMaskLabel] The human-readable channel mask label.
 * @property {number} [subFormat_1] The first GUID sub-format field.
 * @property {number} [subFormat_2] The second GUID sub-format field.
 * @property {number} [subFormat_3] The third GUID sub-format field.
 * @property {number} [subFormat_4] The fourth GUID sub-format field.
 * @property {number} [subFormat_5] The fifth GUID sub-format field.
 * @property {Uint8Array} [extraParams] The raw extended parameter bytes.
 */

/**
 * A single entry from a LIST `INFO` chunk.
 * @typedef {object} WavListInfo
 * @property {string} id The 4-character info ID.
 * @property {number} size The byte length of the text.
 * @property {string} text The info text.
 */

/**
 * A single entry from a LIST `adtl` (associated data list) chunk.
 * @typedef {object} WavListAdtl
 * @property {string} id The 4-character sub-chunk ID.
 * @property {number} size The byte length of the sub-chunk.
 * @property {string} [label] The label text, for `labl` sub-chunks.
 * @property {string} [ltxt] The labeled text, for `ltxt` sub-chunks.
 */

/**
 * A single cue point from a `cue ` chunk.
 * @typedef {object} WavCuePoint
 * @property {number} id The unique cue point identifier.
 * @property {number} position The sample offset of the cue in the play order.
 * @property {string} chunkID The data chunk ID the cue refers to (`data` or `slnt`).
 * @property {number} chunkStart The byte offset into the wave list chunk.
 * @property {number} blockStart The byte offset into the data / slnt chunk.
 * @property {number} sampleOffset The sample offset within the block.
 */

/**
 * A decoded `cue ` chunk.
 * @typedef {object} WavCue
 * @property {string} chunkID The chunk ID, `cue `.
 * @property {number} size The chunk size in bytes.
 * @property {number} numberCuePoints The number of cue points that follow.
 * @property {WavCuePoint[]} data The decoded cue points.
 */

/**
 * A decoded `ResU` chunk (zlib-compressed JSON used by Logic Pro X).
 * @typedef {object} WavResU
 * @property {string} chunkID The chunk ID, `ResU`.
 * @property {number} size The chunk size in bytes.
 * @property {unknown} [data] The parsed JSON payload, when it could be decompressed and parsed.
 */

/**
 * A parsed chunk entry stored on {@link AudioWAV#chunks}.
 * @typedef {object} WavChunk
 * @property {string} type The chunk type label (e.g. `header`, `format`, `data`).
 * @property {any} [value] The decoded value; the concrete shape depends on `type`.
 * @property {Uint8Array} [chunk] The raw bytes of the chunk, when retained.
 * @property {boolean} [unknown] Set when the chunk type is recognized but not decoded.
 * @property {string} [description] A human-readable note for special / opaque chunks.
 */

/**
 * A decoded `data` chunk value (the audio payload itself is not retained, only its computed duration).
 * @typedef {object} WavData
 * @property {number} duration The audio duration in seconds.
 */

/**
 * A decoded `LIST` chunk.
 * @typedef {object} WavList
 * @property {string} chunkID The chunk ID, `LIST`.
 * @property {number} size The chunk size in bytes.
 * @property {string} type The list type, e.g. `INFO` or `adtl`.
 * @property {WavListInfo[] | WavListAdtl[]} [data] The parsed sub-list entries.
 */

/**
 * A decoded `tlst` (Trigger List) chunk.
 * @typedef {object} WavTriggerList
 * @property {number} list The referenced list (`cue` or `playlist`).
 * @property {string} name The cue point name / playlist entry index.
 * @property {number} type The trigger type (0: SMPTE, 1: MIDI Command, 2: MIDI SysEx).
 * @property {number} triggerOn1 Trigger value 1 (SMPTE hours / MIDI channel).
 * @property {number} triggerOn2 Trigger value 2 (SMPTE minutes / MIDI command).
 * @property {number} triggerOn3 Trigger value 3 (SMPTE seconds / MIDI param 1).
 * @property {number} triggerOn4 Trigger value 4 (SMPTE frames / MIDI param 2).
 * @property {number} extra The size of additional information.
 * @property {number} extraData The additional information value.
 * @property {number} function The trigger function (0: Play, 1: Stop, 2: Queue).
 */

/**
 * A decoded `fact` chunk.
 * @typedef {object} WavFact
 * @property {number} numberOfSamples The number of samples per channel.
 */

/**
 * A decoded `PEAK` chunk.
 * @typedef {object} WavPeak
 * @property {number} version The peak chunk version.
 * @property {number} timestamp The Unix timestamp of creation.
 * @property {number} ppeakPointer The pointer to the per-channel PPEAK structs.
 * @property {number} bitAlign The 64-bit alignment padding.
 */

/**
 * A decoded `DISP` (Display) chunk.
 * @typedef {object} WavDisplay
 * @property {number} type The Windows clipboard format identifier.
 * @property {number} data The display data value.
 */

/**
 * A decoded `acid` (ACID Loop) chunk.
 * @typedef {object} WavAcid
 * @property {number} type The file type bit mask.
 * @property {number} rootNote The root note.
 * @property {number} unknown1 An unknown 16-bit value.
 * @property {number} unknown2 An unknown 32-bit value.
 * @property {number} beats The number of beats.
 * @property {number} meterDenominator The meter denominator (e.g. the 4 in 3/4).
 * @property {number} meterNumerator The meter numerator (e.g. the 3 in 3/4).
 * @property {number} tempo The tempo.
 */

/**
 * A decoded `inst` (Instrument) chunk.
 * @typedef {object} WavInstrument
 * @property {number} unshiftedNote The MIDI note for the sample's original pitch (0-127).
 * @property {number} fineTuning The fine tuning in cents (-50 to 50).
 * @property {number} gain The suggested volume in decibels.
 * @property {number} lowNote The lowest usable MIDI note (0-127).
 * @property {number} highNote The highest usable MIDI note (0-127).
 * @property {number} lowVelocity The lowest usable MIDI velocity (0-127).
 * @property {number} highVelocity The highest usable MIDI velocity (0-127).
 */

/**
 * A single sample loop entry from a `smpl` chunk.
 * @typedef {object} WavSampleLoop
 * @property {number} ID The unique loop ID (may reference a cue point).
 * @property {number} type The loop type (0: forward, 1: alternating, 2: backward).
 * @property {number} start The loop start point in samples.
 * @property {number} end The loop end point in samples.
 * @property {number} fraction The fine-tune resolution.
 * @property {number} count The play count (0 means infinite).
 */

/**
 * A decoded `smpl` (Sample) chunk.
 * @typedef {object} WavSample
 * @property {number} manufacturer1 Manufacturer code byte 1.
 * @property {number} manufacturer2 Manufacturer code byte 2.
 * @property {number} manufacturer3 Manufacturer code byte 3.
 * @property {number} manufacturer4 Manufacturer code byte 4.
 * @property {number} product The product / model ID.
 * @property {number} samplePeriod The period of one sample.
 * @property {number} midiUnityNote The MIDI note played at the sample's current pitch (0-127).
 * @property {number} midiPitchFraction The fraction of a semitone up from the unity note.
 * @property {number} SMPTEFormat The SMPTE format (0, 24, 25, 29, or 30).
 * @property {number} SMPTEOffset1 SMPTE offset byte 1 (hours).
 * @property {number} SMPTEOffset2 SMPTE offset byte 2 (minutes).
 * @property {number} SMPTEOffset3 SMPTE offset byte 3 (seconds).
 * @property {number} SMPTEOffset4 SMPTE offset byte 4 (frames).
 * @property {number} sampleLoopsCount The number of sample loops.
 * @property {number} sampleDataSize The number of bytes of sampler-specific data.
 * @property {WavSampleLoop[]} sampleLoops The parsed sample loops.
 * @property {Uint8Array} [sampleData] The optional sampler-specific data.
 */

/**
 * A decoded `RLND` (Roland) chunk.
 * @typedef {object} WavRoland
 * @property {string} chunkID The chunk ID, `RLND`.
 * @property {number} size The chunk size in bytes.
 * @property {string} device The 8-character device label (e.g. `roifspsx`).
 * @property {number} unknown1 An unknown byte.
 * @property {number} unknown2 An unknown byte.
 * @property {number} unknown3 An unknown byte.
 * @property {number} unknown4 An unknown byte.
 * @property {number} sampleIndex The pad sample index (0-119).
 * @property {string} sampleLabel The human-readable pad label (`A1` - `J12`).
 */

/**
 * A decoded `bext` (Broadcast Wave Format extension) chunk.
 * @typedef {object} WavBext
 * @property {string} chunkID The chunk ID, `bext`.
 * @property {number} size The chunk size in bytes.
 * @property {string} [description] The description of the sound sequence.
 * @property {string} [originator] The name of the originator.
 * @property {string} [originatorReference] The reference of the originator.
 * @property {string} [originationDate] The origination date (yyyy:mm:dd).
 * @property {string} [originationTime] The origination time (hh:mm:ss).
 * @property {number} [timeReferenceLow] The first sample count since midnight, low word.
 * @property {number} [timeReferenceHigh] The first sample count since midnight, high word.
 * @property {number} [version] The BWF version.
 * @property {Uint8Array} [umid] The SMPTE UMID (64 bytes).
 * @property {number} [loudnessValue] The integrated loudness value (LUFS x 100).
 * @property {number} [loudnessRange] The loudness range (LU x 100).
 * @property {number} [maxTruePeakLevel] The maximum true peak level (dBTP x 100).
 * @property {number} [maxMomentaryLoudness] The maximum momentary loudness (LUFS x 100).
 * @property {number} [maxShortTermLoudness] The maximum short-term loudness (LUFS x 100).
 * @property {Uint8Array} [reserved] 180 reserved bytes.
 * @property {Uint8Array} [codingHistory] The coding history.
 */

/**
 * A single table entry from a `ds64` chunk.
 * @typedef {object} WavDS64TableEntry
 * @property {string} chunkID The referenced chunk ID.
 * @property {number} chunkSizeLow The low 4 bytes of the chunk size.
 * @property {number} chunkSizeHigh The high 4 bytes of the chunk size.
 */

/**
 * A decoded `ds64` (DataSize 64) chunk used by RF64 files.
 * @typedef {object} WavDS64
 * @property {string} chunkID The chunk ID, `ds64`.
 * @property {number} size The chunk size in bytes.
 * @property {number} riffSizeLow The low 4 bytes of the RF64 block size.
 * @property {number} riffSizeHigh The high 4 bytes of the RF64 block size.
 * @property {number} dataSizeLow The low 4 bytes of the data chunk size.
 * @property {number} dataSizeHigh The high 4 bytes of the data chunk size.
 * @property {number} sampleCountLow The low 4 bytes of the fact chunk sample count.
 * @property {number} sampleCountHigh The high 4 bytes of the fact chunk sample count.
 * @property {number} tableLength The number of valid entries in the table.
 * @property {WavDS64TableEntry[]} table The chunk size table.
 */

/**
 * A single slice entry from a `strc` chunk.
 * @typedef {object} WavStrcSlice
 * @property {number} header An unknown header value (0 or 2).
 * @property {number} ID1 A seemingly random ID.
 * @property {number} samplePositionUpper The upper 32 bits of the slice sample position.
 * @property {number} samplePositionLower The lower 32 bits of the slice sample position.
 * @property {number} samplePosition2Upper The upper 32 bits of the secondary sample position.
 * @property {number} samplePosition2Lower The lower 32 bits of the secondary sample position.
 * @property {number} data3 An unknown value.
 * @property {number} ID2 A second seemingly random ID (constant per chunk).
 */

/**
 * A decoded `strc` (ACID-related) chunk.
 * @typedef {object} WavStrc
 * @property {number} unknown1 An unknown value (always 28).
 * @property {number} numberOfSlices The number of 32-byte slice blocks.
 * @property {number} unknown2 An unknown value.
 * @property {number} unknown3 An unknown value.
 * @property {number} unknown4 An unknown value (always 1).
 * @property {number} unknown5 An unknown value.
 * @property {number} unknown6 An unknown value.
 * @property {WavStrcSlice[]} slices The parsed slices.
 */

/**
 * A decoded AIFF `COMM` (Common) chunk.
 * @typedef {object} AiffCommon
 * @property {string} chunkID The chunk ID, `COMM`.
 * @property {number} size The chunk size in bytes.
 * @property {number} channels The number of channels.
 * @property {number} sampleFrames The number of sample frames.
 * @property {number} sampleSize The number of bits per sample point (1-32).
 * @property {number} sampleRate The sample rate (decoded from an 80-bit extended float).
 * @property {string} compressionType The AIFF-C compression type, or empty for AIFF.
 * @property {string} compressionTypeName The AIFF-C compression name, or empty for AIFF.
 */

/**
 * A decoded AIFF `SSND` (Sound Data) chunk.
 * @typedef {object} AiffSoundData
 * @property {string} chunkID The chunk ID, `SSND`.
 * @property {number} size The chunk size in bytes.
 * @property {number} offset The byte offset to the first sample frame.
 * @property {number} blockSize The block size used for block-aligning the sound data.
 * @property {Uint8Array} soundData The sample frames that make up the sound.
 */

/**
 * A decoded AIFF-C `FVER` (Format Version) chunk.
 * @typedef {object} AiffFormatVersion
 * @property {string} chunkID The chunk ID, `FVER`.
 * @property {number} size The chunk size in bytes.
 * @property {number} timestamp The format version timestamp (seconds since 1904-01-01).
 * @property {string} versionName The human-readable version name.
 */

/**
 * Maps the registered WAVE format tags (the `fmt ` chunk's audio format code) to their human-readable names.
 * @type {Record<number, string>}
 * @see {@link https://www.recordingblogs.com/wiki/format-chunk-of-a-wave-file|WAVE Format Tags}
 */
const WAVE_FORMAT_TAGS = {
  0x0001: 'Microsoft Pulse Code Modulation (PCM) / Uncompressed',
  0x0002: 'Microsoft ADPCM',
  0x0003: 'Microsoft IEEE Float LPCM',
  0x0004: 'Compaq VSELP',
  0x0005: 'IBM CVSD',
  0x0006: 'Microsoft ITU G.711 a-law',
  0x0007: 'Microsoft ITU G.711 µ-law',
  0x0008: 'Microsoft DTS',
  0x0009: 'DRM',
  0x000A: 'WMA 9 Speech',
  0x000B: 'Microsoft Windows Media RT Voice',
  0x0010: 'OKI-ADPCM',
  0x0011: 'Intel IMA / DVI-ADPCM',
  0x0012: 'Videologic Mediaspace ADPCM',
  0x0013: 'Sierra ADPCM',
  0x0014: 'Antex G.723 ADPCM',
  0x0015: 'DSP Solutions DIGISTD',
  0x0016: 'DSP Solutions DIGIFIX / ITU G.723 ADPCM (Yamaha)',
  0x0017: 'Dialoic OKI ADPCM',
  0x0018: 'Media Vision ADPCM',
  0x0019: 'HP CU',
  0x001A: 'HP Dynamic Voice',
  0x0020: 'Yamaha ADPCM',
  0x0021: 'SONARC Speech Compression',
  0x0022: 'DSP Group True Speech',
  0x0023: 'Echo Speech Corp.',
  0x0024: 'Virtual Music Audiofile AF36',
  0x0025: 'Audio Processing Tech.',
  0x0026: 'Virtual Music Audiofile AF10',
  0x0027: 'Aculab Prosody 1612',
  0x0028: 'Merging Tech. LRC',
  0x0030: 'Dolby AC2',
  0x0031: 'Microsoft 6.10',
  0x0032: 'MSN Audio',
  0x0033: 'Antex ADPCME',
  0x0034: 'Control Resources VQLPC',
  0x0035: 'DSP Solutions DIGIREAL',
  0x0036: 'DSP Solutions DIGIADPCM',
  0x0037: 'Control Resources CR10',
  0x0038: 'Natural MicroSystems VBX ADPCM',
  0x0039: 'Crystal Semiconductor IMA ADPCM',
  0x003A: 'Echo Speech ECHOSC3',
  0x003B: 'Rockwell ADPCM',
  0x003C: 'Rockwell DIGITALK',
  0x003D: 'Xebec Multimedia',
  0x0040: 'Antex ITU G.721 ADPCM',
  0x0041: 'Antex G.728 CELP',
  0x0042: 'Microsoft MSG723',
  0x0043: 'IBM AVC ADPCM',
  0x0045: 'ITU-T G.726',
  0x0050: 'Microsoft MPEG',
  0x0051: 'RT23 or PAC',
  0x0052: 'InSoft RT24',
  0x0053: 'InSoft PAC',
  0x0055: 'MP3',
  0x0059: 'Cirrus',
  0x0060: 'Cirrus Logic',
  0x0061: 'ESS Tech. PCM',
  0x0062: 'Voxware Inc.',
  0x0063: 'Canopus ATRAC',
  0x0064: 'APICOM G.726 ADPCM',
  0x0065: 'APICOM G.722 ADPCM',
  0x0066: 'Microsoft DSAT',
  0x0067: 'Microsoft DSAT DISPLAY',
  0x0069: 'Voxware Byte Aligned',
  0x0070: 'Voxware AC8',
  0x0071: 'Voxware AC10',
  0x0072: 'Voxware AC16',
  0x0073: 'Voxware AC20',
  0x0074: 'Voxware MetaVoice',
  0x0075: 'Voxware MetaSound',
  0x0076: 'Voxware RT29HW',
  0x0077: 'Voxware VR12',
  0x0078: 'Voxware VR18',
  0x0079: 'Voxware TQ40',
  0x007A: 'Voxware SC3',
  0x007B: 'Voxware SC3',
  0x0080: 'Soundsoft',
  0x0081: 'Voxware TQ60',
  0x0082: 'Microsoft MSRT24',
  0x0083: 'AT&T G.729A',
  0x0084: 'Motion Pixels MVI MV12',
  0x0085: 'DataFusion G.726',
  0x0086: 'DataFusion GSM610',
  0x0088: 'Iterated Systems Audio',
  0x0089: 'Onlive',
  0x008A: 'Multitude, Inc. FT SX20',
  0x008B: 'Infocom ITS A/S G.721 ADPCM',
  0x008C: 'Convedia G729',
  0x008D: 'Not specified congruency, Inc.',
  0x0091: 'Siemens SBC24',
  0x0092: 'Sonic Foundry Dolby AC3 APDIF',
  0x0093: 'MediaSonic G.723',
  0x0094: 'Aculab Prosody 8kbps',
  0x0097: 'ZyXEL ADPCM',
  0x0098: 'Philips LPCBB',
  0x0099: 'Studer Professional Audio Packed',
  0x00A0: 'Malden PhonyTalk',
  0x00A1: 'Racal Recorder GSM',
  0x00A2: 'Racal Recorder G720.a',
  0x00A3: 'Racal G723.1',
  0x00A4: 'Racal Tetra ACELP',
  0x00B0: 'NEC AAC NEC Corporation',
  0x00FF: 'AAC',
  0x0100: 'Rhetorex ADPCM',
  0x0101: 'IBM u-Law',
  0x0102: 'IBM a-Law',
  0x0103: 'IBM ADPCM',
  0x0111: 'Vivo G.723',
  0x0112: 'Vivo Siren',
  0x0120: 'Philips Speech Processing CELP',
  0x0121: 'Philips Speech Processing GRUNDIG',
  0x0123: 'Digital G.723',
  0x0125: 'Sanyo LD ADPCM',
  0x0130: 'Sipro Lab ACEPLNET',
  0x0131: 'Sipro Lab ACELP4800',
  0x0132: 'Sipro Lab ACELP8V3',
  0x0133: 'Sipro Lab G.729',
  0x0134: 'Sipro Lab G.729A',
  0x0135: 'Sipro Lab Kelvin',
  0x0136: 'VoiceAge AMR',
  0x0140: 'Dictaphone G.726 ADPCM',
  0x0150: 'Qualcomm PureVoice',
  0x0151: 'Qualcomm HalfRate',
  0x0155: 'Ring Zero Systems TUBGSM',
  0x0160: 'Microsoft Audio1',
  0x0161: 'Windows Media Audio V2 V7 V8 V9 / DivX audio (WMA) / Alex AC3 Audio',
  0x0162: 'Windows Media Audio Professional V9',
  0x0163: 'Windows Media Audio Lossless V9',
  0x0164: 'WMA Pro over S/PDIF',
  0x0170: 'UNISYS NAP ADPCM',
  0x0171: 'UNISYS NAP ULAW',
  0x0172: 'UNISYS NAP ALAW',
  0x0173: 'UNISYS NAP 16K',
  0x0174: 'MM SYCOM ACM SYC008 SyCom Technologies',
  0x0175: 'MM SYCOM ACM SYC701 G726L SyCom Technologies',
  0x0176: 'MM SYCOM ACM SYC701 CELP54 SyCom Technologies',
  0x0177: 'MM SYCOM ACM SYC701 CELP68 SyCom Technologies',
  0x0178: 'Knowledge Adventure ADPCM',
  0x0180: 'Fraunhofer IIS MPEG2AAC',
  0x0190: 'Digital Theater Systems DTS DS',
  0x0200: 'Creative Labs ADPCM',
  0x0202: 'Creative Labs FASTSPEECH8',
  0x0203: 'Creative Labs FASTSPEECH10',
  0x0210: 'UHER ADPCM',
  0x0215: 'Ulead DV ACM',
  0x0216: 'Ulead DV ACM',
  0x0220: 'Quarterdeck Corp.',
  0x0230: 'I-Link VC',
  0x0240: 'Aureal Semiconductor Raw Sport',
  0x0241: 'ESST AC3',
  0x0250: 'Interactive Products HSX',
  0x0251: 'Interactive Products RPELP',
  0x0260: 'Consistent CS2',
  0x0270: 'Sony SCX',
  0x0271: 'Sony SCY',
  0x0272: 'Sony ATRAC3',
  0x0273: 'Sony SPC',
  0x0280: 'TELUM Telum Inc.',
  0x0281: 'TELUMIA Telum Inc.',
  0x0285: 'Norcom Voice Systems ADPCM',
  0x0300: 'Fujitsu FM TOWNS SND',
  0x0301: 'Fujitsu (not specified)',
  0x0302: 'Fujitsu (not specified)',
  0x0303: 'Fujitsu (not specified)',
  0x0304: 'Fujitsu (not specified)',
  0x0305: 'Fujitsu (not specified)',
  0x0306: 'Fujitsu (not specified)',
  0x0307: 'Fujitsu (not specified)',
  0x0308: 'Fujitsu (not specified)',
  0x0350: 'Micronas Semiconductors, Inc. Development',
  0x0351: 'Micronas Semiconductors, Inc. CELP833',
  0x0400: 'Brooktree Digital',
  0x0401: 'Intel Music Coder (IMC)',
  0x0402: 'Ligos Indeo Audio',
  0x0450: 'QDesign Music',
  0x0500: 'On2 VP7 On2 Technologies',
  0x0501: 'On2 VP6 On2 Technologies',
  0x0680: 'AT&T VME VMPCM',
  0x0681: 'AT&T TCP',
  0x0700: 'YMPEG Alpha (dummy for MPEG-2 compressor)',
  0x08AE: 'ClearJump LiteWave (lossless)',
  0x1000: 'Olivetti GSM',
  0x1001: 'Olivetti ADPCM',
  0x1002: 'Olivetti CELP',
  0x1003: 'Olivetti SBC',
  0x1004: 'Olivetti OPR',
  0x1100: 'Lernout & Hauspie',
  0x1101: 'Lernout & Hauspie CELP codec',
  0x1102: 'Lernout & Hauspie SBC codec',
  0x1103: 'Lernout & Hauspie SBC codec',
  0x1104: 'Lernout & Hauspie SBC codec',
  0x1400: 'Norris Comm. Inc.',
  0x1401: 'ISIAudio',
  0x1500: 'AT&T Soundspace Music Compression',
  0x181C: 'VoxWare RT24 speech codec',
  0x181E: 'Lucent elemedia AX24000P Music codec',
  0x1971: 'Sonic Foundry LOSSLESS',
  0x1979: 'Innings Telecom Inc. ADPCM',
  0x1C07: 'Lucent SX8300P speech codec',
  0x1C0C: 'Lucent SX5363S G.723 compliant codec',
  0x1F03: 'CUseeMe DigiTalk (ex-Rocwell)',
  0x1FC4: 'NCT Soft ALF2CD ACM',
  0x2000: 'FAST Multimedia DVM',
  0x2001: 'Dolby DTS (Digital Theater System)',
  0x2002: 'RealAudio 1 / 2 14.4',
  0x2003: 'RealAudio 1 / 2 28.8',
  0x2004: 'RealAudio G2 / 8 Cook (low bitrate)',
  0x2005: 'RealAudio 3 / 4 / 5 Music (DNET)',
  0x2006: 'RealAudio 10 AAC (RAAC)',
  0x2007: 'RealAudio 10 AAC+ (RACP)',
  0x2500: 'Reserved range to 0x2600 Microsoft',
  0x3313: 'makeAVIS (ffvfw fake AVI sound from AviSynth scripts)',
  0x4143: 'Divio MPEG-4 AAC audio',
  0x4201: 'Nokia adaptive multirate',
  0x4243: 'Divio G726 Divio, Inc.',
  0x434C: 'LEAD Speech',
  0x564C: 'LEAD Vorbis',
  0x5756: 'WavPack Audio',
  0x674F: 'Ogg Vorbis (mode 1)',
  0x6750: 'Ogg Vorbis (mode 2)',
  0x6751: 'Ogg Vorbis (mode 3)',
  0x676F: 'Ogg Vorbis (mode 1+)',
  0x6770: 'Ogg Vorbis (mode 2+)',
  0x6771: 'Ogg Vorbis (mode 3+)',
  0x7000: '3COM NBX 3Com Corporation',
  0x706D: 'FAAD AAC',
  0x7A21: 'GSM-AMR (CBR, no SID)',
  0x7A22: 'GSM-AMR (VBR, including SID)',
  0xA100: 'Comverse Infosys Ltd. G723 1',
  0xA101: 'Comverse Infosys Ltd. AVQSBC',
  0xA102: 'Comverse Infosys Ltd. OLDSBC',
  0xA103: 'Symbol Technologies G729A',
  0xA104: 'VoiceAge AMR WB VoiceAge Corporation',
  0xA105: 'Ingenient Technologies Inc. G726',
  0xA106: 'ISO/MPEG-4 advanced audio Coding',
  0xA107: 'Encore Software Ltd G726',
  0xA109: 'Speex ACM Codec xiph.org',
  0xDFAC: 'DebugMode SonicFoundry Vegas FrameServer ACM Codec',
  0xF1AC: 'Free Lossless Audio Codec FLAC',
  0xFFFE: 'Extensible',
  0xFFFF: 'Development',
};

/**
 * Maps a single-bit WAVE_FORMAT_EXTENSIBLE channel mask to its speaker label.
 * @type {Record<number, string>}
 * @see {@link https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/extensible-wave-format-descriptors|Extensible Wave Format Descriptors}
 */
const WAVE_CHANNEL_MASK_LABELS = {
  0x00000001: 'speaker_front_left',
  0x00000002: 'speaker_front_right',
  0x00000004: 'speaker_front_center',
  0x00000008: 'speaker_low_frequency',
  0x00000010: 'speaker_back_left',
  0x00000020: 'speaker_back_right',
  0x00000040: 'speaker_front_left_of_center',
  0x00000080: 'speaker_front_right_of_center',
  0x00000100: 'speaker_back_center',
  0x00000200: 'speaker_side_left',
  0x00000400: 'speaker_side_right',
  0x00000800: 'speaker_top_center',
  0x00001000: 'speaker_top_front_left',
  0x00002000: 'speaker_top_front_center',
  0x00004000: 'speaker_top_front_right',
  0x00008000: 'speaker_top_back_left',
  0x00010000: 'speaker_top_back_center',
  0x00020000: 'speaker_top_back_right',
  0x80000000: 'speaker_all',
};

/**
 * The Roland SP-404SX pad labels in sample-index order: pads `A1`–`J12` across banks `A`–`J`, twelve pads per bank.
 * The array index is the sample index (`0`–`119`) and the value is the pad label, so it serves both decode (index to label) and encode (label to index via `indexOf`).
 * @type {string[]}
 */
const ROLAND_SP404SX_PADS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
  .flatMap((bank) => Array.from({ length: 12 }, (_value, pad) => `${bank}${pad + 1}`));

/**
 * AudioWAV - WAVE Audio Utility
 * The WAVE file format is a subset of Microsoft's RIFF specification for the storage of multimedia files.
 * The AIFF file format Audio Interchange File Format (Audio IFF) provides a standard for storing sampled sounds.
 * Audio IFF conforms to the "EA IFF 85" Standard for Interchange Format Files developed by Electronic Arts.
 * @example <caption>AudioWAV</caption>
 * const data = fs.readFileSync('./audio.wav');
 * const file = AudioWAV.fromFile(data);
 * console.log('Chunks:', file.chunks);
 * @class
 * @augments DataBuffer
 */
class AudioWAV extends DataBuffer {
  /**
   * Creates a new AudioWAV.
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} input The data to process.
   * @param {object} [opts] Options for this AudioWAV instance.
   * @class
   */
  constructor(input, opts = {}) {
    super(input);

    this.container = '';
    this.type = '';
    /** @type {WavChunk[]} */
    this.chunks = [];

    this.options = {
      // This keeps in spec, some files fail with this.
      roundOddChunks: true,
      ...opts,
    };

    this.parse();
  }

  /**
   * Creates a new AudioWAV from file data.
   * @param {Buffer} data The data of the file to process.
   * @param {object} [options] Options for returned AudioWAV instance.
   * @returns {AudioWAV} the new AudioWAV instance for the provided file data
   * @static
   */
  static fromFile(data, options) {
    debug('fromFile:', data.length, data.byteLength);
    const buffer = new DataBuffer(data);
    const list = new DataBufferList();
    list.append(buffer);
    return new AudioWAV(data, options);
  }

  /**
   * Creates a new AudioWAV from a DataBuffer.
   * @param {DataBuffer} buffer The DataBuffer of the file to process.
   * @param {object} [options] Options for returned AudioWAV instance.
   * @returns {AudioWAV} the new AudioWAV instance for the provided DataBuffer
   * @static
   */
  static fromBuffer(buffer, options) {
    debug('fromBuffer:', buffer.length);
    const list = new DataBufferList();
    list.append(buffer);
    return new AudioWAV(buffer, options);
  }

  /**
   * Parse the WAV file, decoding the supported chunks.
   */
  parse() {
    debug('parse');
    const chunk = this.read(12, false);
    const value = AudioWAV.decodeHeader(chunk);
    this.chunks.push({ type: 'header', value });
    this.type = value.type;

    while (this.remainingBytes()) {
      try {
        this.decodeChunk();
      } catch (error) {
        debug('Error Parsing:', error);
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }

  /**
   * Decodes and validates WAV Header.
   * Checks for `RIFF` / `RF64` / `BW64` header, reads the size, and then checks for the `WAVE` header.
   *
   * Signature (Decimal): [82, 73, 70, 70, ..., ..., ..., ..., 87, 65, 86, 69]
   * Signature (Hexadecimal): [52, 49, 46, 46, ..., ..., ..., ..., 57, 41, 56, 45]
   * Signature (ASCII): [R, I, F, F, ..., ..., ..., ..., W, A, V, E]
   * @param {number[]|ArrayBuffer|Buffer|DataBuffer|Int8Array|Int16Array|Int32Array|number|string|Uint8Array|Uint16Array|Uint32Array} chunk The data to process.
   * @static
   * @returns {WavHeader} The decoded values.
   * @throws {Error} Invalid WAV header
   */
  static decodeHeader(chunk) {
    debug('decodeHeader');
    const header = new DataBuffer(chunk);

    const chunkID = header.readString(4);
    let type = '';
    // WAVE: Contains the letters `RIFF`, `RF64`, or `BW64` in ASCII form.
    if (['RIFF', 'RF64', 'BW64'].includes(chunkID)) {
      type = 'WAVE';
    } else if (['FORM', 'AIFF', 'AIFC'].includes(chunkID)) {
      type = 'AIFF';
    }

    if (!type) {
      throw new Error(`Invalid or unrecorgnized file header: '${chunkID}'`);
    }

    /**
     * For WAVE:
     * This is the size of the rest of the chunk following this number.
     *
     * This is the size of the entire file in bytes minus 8 bytes for the 2 fields not included in this count: ChunkID and ChunkSize.
     *
     * RF64 sets this to -1 = 0xFFFFFFFF as it doesn't use this to support larger sizes in the DS64 chunk.
     *
     * For AIFF:
     * This is the size of the data portion of the chunk minus 8 bytes for the 2 fields not included in this count: ChunkID and ChunkSize.
     */
    const size = header.readUInt32(type !== 'AIFF');

    // For WAVE, contains the letters `WAVE` in ASCII form.
    const format = header.readString(4);
    if (type === 'WAVE' && format !== 'WAVE') {
      throw new Error(`Invalid WAVE header, expected 'WAVE' and got '${format}'`);
    }

    // For AIFF, contains the letters `AIFF` in ASCII form, or `AIFC` for compressed files.
    if (type === 'AIFF' && !['AIFF', 'AIFC'].includes(format)) {
      throw new Error(`Invalid AIFF header, expected 'AIFF' or 'AIFC' and got '${format}'`);
    }

    return {
      chunkID,
      size,
      format,
      type,
    };
  }

  /**
   * Enocdes JSON values to a valid Wave Header chunk Buffer.
   * @param {object} data - The values to encode to the header chunk chunk.
   * @param {string} [data.riff] - RIFF Header, should contains the string `RIFF`, `RF64`, or `BW64` in ASCII form.
   * @param {number} data.size - This is the size of the entire file in bytes minus 8 bytes for the 2 fields not included in this count. RF64 sets this to -1 = 0xFFFFFFFF as it doesn't use this to support larger sizes in the DS64 chunk.
   * @param {string} [data.format] - WAVE Header, the string `WAVE` in ASCII form.
   * @returns {Buffer} The newley encoded header chunk.
   * @static
   */
  static encodeHeader({ riff = 'RIFF', size, format = 'WAVE' }) {
    debug('encodeHeader:', { riff, size, format });

    const header = Buffer.alloc(12);
    header.write(riff, 0);
    header.writeUInt32LE(size, 4);
    header.write(format, 8);

    return header;
  }

  /**
   * Decodes the chunk type, and attempts to parse that chunk if supported.
   * Supported Chunk Types: `fmt `, `fact`, `inst`, `DISP`, `smpl`, `tlst`, `data`, `LIST`, `RLND`, `JUNK`, `acid`, `cue `, `bext`, `ResU`, `ds64`, `cart`
   *
   * Chunk Structure:
   * Length: 4 bytes (integer)
   * Type:   4 bytes (string)
   * Chunk:  {length} bytes
   * @returns {string} Chunk Type
   * @throws {Error} Invalid Chunk Length when less than 0
   */
  decodeChunk() {
    debug('decodeChunk at offset', this.offset, 'with', this.remainingBytes(), 'remaining bytes');
    let type = this.readString(4);
    debug('decodeChunk type', type);
    let size = this.readUInt32(this.type !== 'AIFF');
    debug('decodeChunk size', size);

    // `readUInt32` always returns an unsigned value, so this guard is defensive only and cannot be reached.
    /* c8 ignore next 3 */
    if (size < 0) {
      throw new Error(`Invalid SubChunk Size: ${0xFFFFFFFF & size}`);
    }

    // Size should be even.
    if (this.options.roundOddChunks && size % 2 !== 0) {
      size += 1;
    }
    if (size > this.remainingBytes()) {
      debug('decodeChunk size', size, 'too large, using remaining bytes', this.remainingBytes());
      size = this.remainingBytes();
    }

    // Check for really broken cases to avoid infinte loops.
    if (!type || size === 0) {
      debug('decodeChunk something is wrong, ending');
      type = '(broken)';
      size = this.remainingBytes();
    }

    switch (type) {
      case 'fmt ': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeFMT(chunk);
        this.chunks.push({ type: 'format', value, chunk });
        break;
      }
      case 'fact': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeFACT(chunk);
        this.chunks.push({ type: 'fact', value, chunk });
        break;
      }
      case 'inst': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeINST(chunk);
        this.chunks.push({ type: 'instrument', value, chunk });
        break;
      }
      case 'DISP': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeDISP(chunk);
        this.chunks.push({ type: 'display', value, chunk });
        break;
      }
      case 'smpl': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeSMPL(chunk);
        this.chunks.push({ type: 'sample', value, chunk });
        break;
      }
      case 'tlst': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeTLST(chunk);
        this.chunks.push({ type: 'trigger_list', value, chunk });
        break;
      }
      case 'data': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        AudioWAV.decodeDATA(chunk);

        // Calculate the duration: ((chunk_size) / (sample_rate * channels * (bits_per_sample / 8)))
        const format = this.chunks.find((c) => c.type === 'format');
        const formatValue = /** @type {WavFormat} */ (format?.value);
        const duration = size / formatValue.byteRate;
        this.chunks.push({ type: 'data', chunk, value: { duration } });
        break;
      }
      case 'LIST': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeLIST(chunk);
        this.chunks.push({ type: 'list', value, chunk });
        break;
      }
      case 'RLND': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeRLND(chunk);
        this.chunks.push({ type: 'roland', value, chunk });
        break;
      }
      case 'JUNK': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        AudioWAV.decodeJUNK(chunk, this.options);
        this.chunks.push({ type: 'junk', chunk });
        break;
      }
      case 'PAD ': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        AudioWAV.decodePAD(chunk);
        this.chunks.push({ type: 'padding', chunk });
        break;
      }
      case 'PEAK': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodePEAK(chunk);
        this.chunks.push({ type: 'peak', value, chunk });
        break;
      }
      case 'acid': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeACID(chunk);
        this.chunks.push({ type: 'acid', value, chunk });
        break;
      }
      case 'strc': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeSTRC(chunk);
        this.chunks.push({ type: 'strc', value, chunk });
        break;
      }
      case 'cue ': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeCue(chunk);
        this.chunks.push({ type: 'cue_points', value, chunk });
        break;
      }
      case 'bext': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeBEXT(chunk, this.options);
        this.chunks.push({ type: 'broadcast_extension', value, chunk });
        break;
      }
      case 'ResU': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeResU(chunk);
        this.chunks.push({ type: 'logic_resu', value, chunk });
        break;
      }
      case 'ds64': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeDS64(chunk);
        this.chunks.push({ type: 'data_size_64', value, chunk });
        break;
      }
      case 'cart': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        this.chunks.push({ type: 'cart', chunk, unknown: true });
        break;
      }
      case 'AFAn':
      case 'AFmd': {
        // Seems to be the result of a NSKeyedArchiver.
        debug(`macOS Special Binary Chunk: '${type}' with ${size} bytes`);
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        this.chunks.push({ type, chunk, description: 'macOS Special Binary Chunk' });
        break;
      }
      case 'minf':
      case 'elm1':
      case 'regn':
      case 'ovwf':
      case 'umid': {
        debug(`ProTools Special Chunk: '${type}' with ${size} bytes`);
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        this.chunks.push({ type, chunk, description: 'ProTools Special Chunk' });
        break;
      }
      case 'COMM': {
        // AIFF Common Chunk
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeCOMM(chunk);
        this.chunks.push({ type: 'common', value, chunk });
        break;
      }
      case 'SSND': {
        // AIFF Sound Data Chunk
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeSSND(chunk);
        this.chunks.push({ type: 'common', value, chunk });
        break;
      }
      case 'FVER': {
        // AIFF Format Version
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const value = AudioWAV.decodeFVER(chunk);
        this.chunks.push({ type: 'common', value, chunk });
        break;
      }
      case 'ANNO':
      case 'AUTH':
      case 'NAME': {
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        const stream = new DataBuffer(chunk);
        const chunkID = stream.readString(4);
        const nameSize = stream.readUInt32();
        const name = stream.readString(nameSize);
        const value = { chunkID, size: nameSize, name };
        debug('decodeGenericText =', JSON.stringify(value, null, 2));
        this.chunks.push({ type: chunkID.toLowerCase(), value, chunk });
        break;
      }
      default: {
        debug(`Unsupported Chunk: '${type}' with ${size} bytes`);
        this.rewind(8);
        const chunk = this.read(8 + size, false);
        this.chunks.push({ type, chunk, unknown: true });
        break;
      }
    }

    return type;
  }

  /**
   * Decode the FMT (Format) chunk.
   * Should be the first chunk in the data stream.
   *
   * Audio Format:       2 bytes
   * Channels:           2 bytes
   * Sample Rate:        4 bytes
   * Byte Rate:          4 bytes
   * Block Align:        2 bytes
   * Bits per Sample     2 bytes
   * [Extra Param Size]  2 bytes
   * [Extra Params]      n bytes
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavFormat} The decoded values.
   * @static
   */
  static decodeFMT(chunk) {
    debug('decodeFMT');
    const format = new DataBuffer(chunk);
    const chunkID = format.readString(4);
    const size = format.readUInt32(true);

    // Values other than 1 indicate some form of compression.
    const audioFormatValue = format.readUInt16(true);
    // Unknown tags keep the original `Unknown: ` label (with an empty suffix) for backwards compatibility.
    const audioFormat = WAVE_FORMAT_TAGS[audioFormatValue] ?? `Unknown: ${audioFormatValue.toString(16)}`;

    // Mono = 1, Stereo = 2, etc.
    const channels = format.readUInt16(true);

    // 8000, 44100, 96000, etc.
    const sampleRate = format.readUInt32(true);

    // Sample Rate * Channels * (Bits per Sample / 8)
    const byteRate = format.readUInt32(true);

    // Channels * Bits per Sample / 8
    // The number of bytes for one sample including all channels.
    const blockAlign = format.readUInt16(true);

    // 8 bits = 8, 16 bits = 16, etc.
    const bitsPerSample = format.readUInt16(true);

    /** @type {WavFormat} */
    const value = {
      chunkID,
      size,
      audioFormatValue,
      audioFormat,
      channels,
      sampleRate,
      byteRate,
      blockAlign,
      bitsPerSample,
    };

    // Not all formats contain these extra values.
    if (format.remainingBytes()) {
      value.extraParamSize = format.readUInt16(true);
      // RF64 specific fields
      if (audioFormatValue === 0xFFFE) {
        // Valid bits per sample i.e. 8, 16, 20, 24
        value.validBitsPerSample = format.readUInt16(true);
        // Channel mask for channel allocation
        value.channelMask = format.readUInt32(true);

        value.channelMaskLabel = WAVE_CHANNEL_MASK_LABELS[value.channelMask];
        if (value.channelMaskLabel === undefined) {
          debug('Unknown Channel Mask:', value.channelMask);
          value.channelMaskLabel = `unknown_${value.channelMask}`;
        }

        // GUID / Subformat
        value.subFormat_1 = format.readUInt32(true);
        value.subFormat_2 = format.readUInt16(true);
        value.subFormat_3 = format.readUInt16(true);
        value.subFormat_4 = format.readUInt32(true);
        value.subFormat_5 = format.readUInt32(true);
      } else if (value.extraParamSize > 0) {
        value.extraParams = format.read(value.extraParamSize, false);
      } else {
        value.extraParams = new Uint8Array();
      }
    }

    debug('decodeFMT =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Enocdes JSON values to a valid `fmt ` chunk Buffer.
   *
   * Defaults are set to Red Book Compact Disc Digital Audio (CDDA or CD-DA) / Audio CD standards.
   *
   * RF64 specific fields are currently unsupported.
   * @param {object} [data] The values to encode to the `fmt ` chunk.
   * @param {number} [data.audioFormatValue] Format of the audio data, 1 is PCM and values other than 1 indicate some form of compression. See `decodeFMT` for a listing
   * @param {number} [data.channels] Mono = 1, Stereo = 2, etc.
   * @param {number} [data.sampleRate] 8000, 44100, 96000, etc.
   * @param {number} [data.byteRate] Sample Rate * Channels * Bits per Sample / 8
   * @param {number} [data.blockAlign] The number of bytes for one sample including all channels. Channels * Bits per Sample / 8
   * @param {number} [data.bitsPerSample] 8 bits = 8, 16 bits = 16, etc.
   * @param {number} [data.extraParamSize] The size of the extra paramteres to follow, or 0.
   * @param {number} [data.extraParams] Any extra data to encode.
   * @returns {Buffer} The newley encoded `fmt ` chunk.
   * @static
   */
  static encodeFMT(data = {}) {
    debug('encodeFMT:', data);
    const {
      audioFormatValue = 1,
      channels = 2,
      sampleRate = 44100,
      byteRate = 176400,
      blockAlign = 4,
      bitsPerSample = 16,
      extraParamSize = 0,
      extraParams = 0,
    } = data;

    // Padding
    const buffer = Buffer.alloc(26 + extraParamSize, 0);

    // Chunk ID
    buffer.write('fmt ', 0);

    // Chunk Size
    buffer.writeUInt32LE(26 - 8 + extraParamSize, 4);

    // Audio Format: 1 for PCM
    buffer.writeUInt16LE(audioFormatValue, 8);

    // Channels: 1 or 2
    buffer.writeUInt16LE(channels, 10);

    // Sample Rate: 44100 Hz (44 AC 00 00)
    buffer.writeUInt32LE(sampleRate, 12);

    // Byte Rate: Sample Rate × Channels × Bits Per Sample / 8, or more simply, Sample Rate × Block Align
    buffer.writeUInt32LE(byteRate, 16);

    // Block Align: Channels × Bits Per Sample / 8, example, 2 for a Mono sample and 4 for Stereo.
    buffer.writeUInt16LE(blockAlign, 20);

    // Bits Per Sample: 16-bit
    buffer.writeUInt16LE(bitsPerSample, 22);

    // Extra Param Size: Usually not set
    buffer.writeUInt16LE(extraParamSize, 24);

    // Extra Params
    if (extraParamSize > 0 && extraParams) {
      // Fill the space incase the extraParamSize is larger than the extraParams.
      buffer.fill(0, 26, 26 + extraParamSize);
      buffer.write(String(extraParams), 26);
    }

    debug('Buffer:', buffer.toString('hex'));
    return buffer;
  }

  /**
   * Decode the LIST (LIST Information) chunk.
   *
   * A LIST chunk defines a list of sub-chunks and has the following format.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavList} The decoded values.
   * @static
   */
  static decodeLIST(chunk) {
    debug('decodeLIST');
    const list = new DataBuffer(chunk);
    const chunkID = list.readString(4);
    const size = list.readUInt32(true);
    const type = list.readString(4);
    /** @type {WavList} */
    const value = {
      chunkID,
      size,
      type,
    };

    switch (type) {
      case 'INFO': {
        value.data = AudioWAV.decodeLISTINFO(list);
        break;
      }
      case 'adtl': {
        value.data = AudioWAV.decodeLISTadtl(list);
        break;
      }
      default: {
        debug(`Unknown LIST Type: ${type}`);
      }
    }

    debug('decodeLIST =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the LIST INFO chunks.
   * @param {DataBuffer} buffer List DataBuffer
   * @returns {WavListInfo[]} The parsed list.
   */
  static decodeLISTINFO(buffer) {
    debug('decodeLISTINFO');
    /** @type {WavListInfo[]} */
    const value = [];
    while (buffer.remainingBytes()) {
      const info = /** @type {WavListInfo} */ ({});
      // TODO: Switch for listID to have nice human labels for IDs
      info.id = buffer.readString(4);
      debug('decodeLISTINFO chunk id:', info.id);
      info.size = buffer.readUInt32(true);
      debug('decodeLISTINFO chunk size:', info.size);
      info.text = buffer.readString(info.size);
      debug('decodeLISTINFO chunk text:', info.text);
      // All blocks must begin on an EVEN boundary and the block size MUST NOT include the padding byte, if required.
      if (info.size % 2 !== 0) {
        buffer.advance(1);
      }
      value.push(info);
    }
    return value;
  }

  /**
   * Decode the LIST adtl chunks.
   * @param {DataBuffer} buffer List DataBuffer
   * @returns {WavListAdtl[]} The parsed list.
   */
  static decodeLISTadtl(buffer) {
    debug('decodeLISTadtl');
    /** @type {WavListAdtl[]} */
    const value = [];
    while (buffer.remainingBytes()) {
      const adtl = /** @type {WavListAdtl} */ ({});
      adtl.id = buffer.readString(4);
      adtl.size = buffer.readUInt32(true);

      switch (adtl.id) {
        case 'labl': {
          adtl.label = buffer.readString(adtl.size).trim();
          break;
        }
        case 'ltxt': {
          adtl.ltxt = buffer.readString(adtl.size).trim();
          break;
        }
        default: {
          debug(`Unknown ID: ${adtl.id}`);
          buffer.advance(adtl.size);
        }
      }
      value.push(adtl);
    }
    return value;
  }

  /**
   * Decode the data (Audio Data) chunk.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @static
   */
  static decodeDATA(chunk) {
    debug(`decodeDATA: ${chunk.length} data bytes`);
  }

  /**
   * Decode the `tlst` (Trigger List) chunk.
   *
   * Used in Sound Forge by Sonic Foundry
   *
   * Specifies a list of triggers which can be used to trigger playback of a series of cue points or Playlist entries.
   *
   * There's a historical bug in dwName (which is in fact an index, and the bug is that it's actually Index-1).
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavTriggerList} The decoded values.
   * @static
   */
  static decodeTLST(chunk) {
    debug('decodeTLST');
    const tlst = new DataBuffer(chunk);
    const _chunkID = tlst.readString(4);
    const size = tlst.readUInt32(true);
    debug('decodeTLST size', size);

    // Specifies the list which this list entry references.
    // References either `cue` or `playlist`.
    const list = tlst.readUInt32(true);

    // Cue Point Name / Playlist Entry by Index
    const name = tlst.readString(4);

    // Type of trigger:
    // 0: SMPTE Trigger, 1: MIDI Command Trigger, 2: MIDI SySEx Trigger
    const type = tlst.readUInt32(true);

    // Specifies the value that will cause a trigger to be generated.
    // The value will change value depending on the type of trigger.
    // SMPTE: Hours
    // MIDI Command: Channel
    const triggerOn1 = tlst.readUInt8();
    // SMPTE: Minues
    // MIDI Command: Command
    const triggerOn2 = tlst.readUInt8();
    // SMPTE: Seconds
    // MIDI Command: Param1
    const triggerOn3 = tlst.readUInt8();
    // SMPTE: Frames
    // MIDI Command: Param2
    const triggerOn4 = tlst.readUInt8();

    // The function of this trigger.
    // 0: Play, 1: Stop, 2: Queue
    const func = tlst.readUInt32(true);

    // Specifies the size of additional information.
    // For the case of a MIDI SySx Trigger, this is the size of the matching MIDI SySxTrigger immediately following the structure.
    const extra = tlst.readUInt32(true);

    const extraData = tlst.readUInt32(true);

    /** @type {WavTriggerList} */
    const value = {
      list,
      name,
      type,
      triggerOn1,
      triggerOn2,
      triggerOn3,
      triggerOn4,
      extra,
      extraData,
      function: func,
    };
    debug('decodeTLST =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the fact chunk.
   *
   * Fact chunks exist in all wave files that are compressed or that have a wave list chunk.
   * A fact chunk is not required in an uncompressed PCM file that does not have a wave list chunk.
   *
   * According to the fact chunk's initial specification, the data portion of the fact chunk will contain only one 4-byte number that specifies the number of samples in the data chunk of the Wave file.
   * This number, when combined with the samples per second value in the format chunk of the Wave file, can be used to compute the length of the audio data in seconds.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavFact} The decoded values.
   * @static
   * @see {@link https://www.recordingblogs.com/wiki/fact-chunk-of-a-wave-file | Fact chunk (of a Wave file)}
   * @see {@link http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html | Audio File Format Specifications}
   */
  static decodeFACT(chunk) {
    debug('decodeFACT');
    const fact = new DataBuffer(chunk);
    const _chunkID = fact.readString(4);
    const size = fact.readUInt32(true);
    debug('decodeFACT size', size);

    // Various information about the contents of the file, depending on the compression code.
    // For Non-PCM, Number of samples (per channel)
    const numberOfSamples = fact.readUInt32(true);
    /** @type {WavFact} */
    const value = { numberOfSamples };
    debug('decodeFACT =', JSON.stringify(value, null, 2));
    return value;
  }

  // TODO: Should have more entries by number of channels, https://github.com/libsndfile/libsndfile/blob/08d802a3d18fa19c74f38ed910d9e33f80248187/src/aiff.c#L110
  /**
   * Decode the PEAK chunk.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavPeak} The decoded values.
   * @static
   * @see {@link https://code.google.com/archive/p/awesome-wav/wikis/WAVFormat.wiki|awesome-wav - WAVFormat.wiki}
   */
  static decodePEAK(chunk) {
    debug('decodePEAK');
    const peak = new DataBuffer(chunk);
    const _chunkID = peak.readString(4);
    const size = peak.readUInt32(true);
    debug('decodePEAK size', size);

    // Peak Chunk Version
    const version = peak.readUInt32(true);

    // Unix timestamp of creation
    const timestamp = peak.readUInt32(true);

    // Pointer to the PPEAK structs (one for each channel), Sample frame for peak
    const ppeakPointer = peak.readUInt32(true);

    // Space for the 64-bit alignment variable
    const bitAlign = peak.readUInt32(true);

    /** @type {WavPeak} */
    const value = {
      version,
      timestamp,
      ppeakPointer,
      bitAlign,
    };

    debug('decodePEAK =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the DISP (Display) chunk.
   *
   * The DISP chunk should be used as a direct child of the RIFF chunk so that any RIFF aware application can find it.
   * There can be multiple DISP chunks with each containing different types of displayable data, but all representative of the same object.
   * The DISP chunks should be stored in the file in order of preference (just as in the clipboard).
   *
   * The DISP chunk is especially beneficial when representing OLE data within an application.
   * For example, when pasting a wave file into Excel, the creating application can use the DISP chunk to associate an icon and a text description to represent the embedded wave file.
   * This text should be short so that it can be easily displayed in menu bars and under icons.
   * Note: do not use a CF_TEXT for a description of the data.
   * Bibliographic data chunks will be added to support the standard MARC (Machine Readable Cataloging) data.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavDisplay} The decoded values.
   * @static
   * @see {@link http://netghost.narod.ru/gff/vendspec/micriff/ms_riff.txt|New Multimedia Data Types and Data Techniques}
   * @see {@link https://docs.microsoft.com/en-us/windows/win32/dataxchg/standard-clipboard-formats|Standard Clipboard Formats}
   */
  static decodeDISP(chunk) {
    debug('decodeDISP');
    const disp = new DataBuffer(chunk);
    const _chunkID = disp.readString(4);
    const size = disp.readUInt32(true);
    debug('decodeDISP size', size);

    // Identifies the data as one of the standard Windows clipboard formats:
    // CF_METAFILE, CF_DIB, CF_TEXT, etc. as defined in windows.h.
    const type = disp.readUInt32(true);
    const data = disp.readUInt16(true);

    /** @type {WavDisplay} */
    const value = { type, data };
    debug('decodeDISP =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   *  ACID Loop File Format
   *
   *  They were originally created for use with Acid, the loop-based, music-sequencing software, created by Sonic Foundry in 1998.
   *
   *  "Acidized" loops contain tempo and key information, so that Acid and other programs that can read the "acidization" can properly time stretch and pitch shift them.
   *
   *  Although the phrase "ACID loops" technically only refers to loops which have been "acidized", some people use the term to refer to loops in general, even when used with other software packages.
   * @static
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavAcid} The decoded values.
   * @memberof AudioWAV
   */
  static decodeACID(chunk) {
    debug('decodeACID');
    const acid = new DataBuffer(chunk);
    const _chunkID = acid.readString(4);
    const size = acid.readUInt32(true);
    debug('decodeACID size', size);

    // Type of file, appears to be a bit mask, however some combinations are probably impossible and/or qualified as "errors"
    // 0x01 On: One Shot         Off: Loop
    // 0x02 On: Root note is Set Off: No root
    // 0x04 On: Stretch is On,   Off: Strech is OFF
    // 0x08 On: Disk Based       Off: Ram based
    // 0x10 On: ??????????       Off: ????????? (Acidizer puts that ON)
    const type = acid.readUInt32(true);

    // Root Note
    // When type `0x10` is OFF : [C,C#,(...),B] -> [0x30 to 0x3B]
    // When type `0x10` is ON  : [C,C#,(...),B] -> [0x3C to 0x47]
    const rootNote = acid.readUInt16(true);

    const unknown1 = acid.readUInt16(true);
    const unknown2 = acid.readUInt32(true);

    // Number of beats
    const beats = acid.readUInt32(true);

    // Meter Denominator, like the 4 in 5/4
    const meterDenominator = acid.readUInt16(true);

    // Meter Numerator, like the 3 in 3/4
    const meterNumerator = acid.readUInt16(true);

    // Tempo
    const tempo = acid.readUInt32(true);

    /** @type {WavAcid} */
    const value = {
      type,
      rootNote,
      unknown1,
      unknown2,
      beats,
      meterDenominator,
      meterNumerator,
      tempo,
    };
    debug('decodeACID =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the inst (Instrumet) chunk.
   *
   * When a wave file is used as wave samples in a MIDI synthesizer,
   * the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavInstrument} The decoded values.
   * @static
   */
  static decodeINST(chunk) {
    debug('decodeINST');
    const inst = new DataBuffer(chunk);
    const _chunkID = inst.readString(4);
    const size = inst.readUInt32(true);
    debug('decodeINST size', size);

    // The MIDI note that corresponds to the original (unshifted) pitch of the sample.
    // This value is between 0 to 127.
    const unshiftedNote = inst.readUInt8();

    // Fine tuning of the pitch in cents. Values are between -50 to 50.
    const fineTuning = inst.readUInt8();

    // The volume setting (suggested) for the sample in decibels.
    const gain = inst.readUInt8();

    // The lowest usable MIDI note for the sample (suggested). This value is between 0 and 127.
    const lowNote = inst.readUInt8();

    // The highest usable MIDI note for the sample (suggested). This value is between 0 and 127.
    const highNote = inst.readUInt8();

    // The lowest usable MIDI velocity for the sample (suggested). This value is between 0 and 127.
    const lowVelocity = inst.readUInt8();

    // The highest usable MIDI velocity for the sample (suggested). This value is between 0 and 127.
    const highVelocity = inst.readUInt8();

    /** @type {WavInstrument} */
    const value = {
      unshiftedNote,
      fineTuning,
      gain,
      lowNote,
      highNote,
      lowVelocity,
      highVelocity,
    };
    debug('decodeINST =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the smpl (Sample) chunk.
   *
   * The sample chunk allows a MIDI sampler to use the Wave file as a collection of samples.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavSample} The decoded values.
   * @static
   */
  static decodeSMPL(chunk) {
    debug('decodeSMPL');
    const smpl = new DataBuffer(chunk);
    const _chunkID = smpl.readString(4);
    const size = smpl.readUInt32(true);
    debug('decodeSMPL size', size);

    // The MIDI Manufacturers Association manufacturer code (see MIDI System Exclusive message).
    // A value of zero implies that there is no specific manufacturer.
    // The first byte of the four bytes specifies the number of bytes in the manufacturer code that are relevant (1 or 3).
    // For example, Roland would be specified as 0x01000041 (0x41), where as Microsoft would be 0x03000041 (0x00 0x00 0x41)
    const manufacturer1 = smpl.readUInt8();
    const manufacturer2 = smpl.readUInt8();
    const manufacturer3 = smpl.readUInt8();
    const manufacturer4 = smpl.readUInt8();

    // The product / model ID of the target device, specific to the manufacturer.
    // A value of zero means no specific product.
    const product = smpl.readUInt8();

    // The period of one sample in nanoseconds.
    // For example, at the sampling rate 44.1 KHz the size of one sample is (1 / 44100) * 1,000,000,000 = 22675 nanoseconds = 0x00005893
    const samplePeriod = smpl.readUInt8();

    // The MIDI note that will play when this sample is played at its current pitch.
    // The values are between 0 and 127.
    const midiUnityNote = smpl.readUInt8();

    // The fraction of a semitone up from the specified note.
    // For example, one-half semitone is 50 cents and will be specified as 0x80.
    const midiPitchFraction = smpl.readUInt8();

    // The SMPTE format. Possible values are 0, 24, 25, 29, and 30.
    const SMPTEFormat = smpl.readUInt8();

    // Specifies a time offset for the sample, if the sample should start at a later time and not immediately.
    // The first byte of this value specifies the number of hours and is in between -23 and 23.
    // The second byte is the number of minutes and is between 0 and 59.
    // he third byte is the number of seconds (0 to 59).
    // The last byte is the number of frames and is between 0 and the frames specified by the SMPTE format.
    // For example, if the SMPTE format is 24, then the number of frames is between 0 and 23
    const SMPTEOffset1 = smpl.readUInt8();
    const SMPTEOffset2 = smpl.readUInt8();
    const SMPTEOffset3 = smpl.readUInt8();
    const SMPTEOffset4 = smpl.readUInt8();

    // Specifies the number of sample loops that are contained in this chunk's data.
    const sampleLoopsCount = smpl.readUInt8();

    // The number of bytes of optional sampler specific data that follows the sample loops.
    const sampleDataSize = smpl.readUInt8();

    // Sample Loops
    /** @type {WavSampleLoop[]} */
    const sampleLoops = [];
    if (sampleLoopsCount > 0) {
      debug('decodeSMPL sampleLoopsCount', sampleLoopsCount);
      for (let i = 0; i < sampleLoopsCount; i++) {
        // A unique ID of the loop, which could be a cue point.
        const ID = smpl.readUInt8();

        // A type of 0 means normal forward looping type.
        // A value of 1 means alternating (forward and backward) looping type.
        // A value of 2 means backward looping type.
        // The values 3-31 are reserved for future standard types.
        // The values 32 and above are sampler / manufacturer specific types.
        const type = smpl.readUInt8();

        // The start point of the loop in samples.
        const start = smpl.readUInt8();

        // he end point of the loop in samples.
        // The end sample is also played.
        const end = smpl.readUInt8();

        // The resolution at which this loop should be fine tuned.
        // A value of zero means current resolution.
        // A value of 50 cents (0x80) means 1/2 sample.
        const fraction = smpl.readUInt8();

        // The number of times to play the loop.
        // A value of zero means infinitely
        //  In a MIDI sampler that may mean infinite sustain.
        const count = smpl.readUInt8();
        sampleLoops.push({
          ID,
          type,
          start,
          end,
          fraction,
          count,
        });
      }
    }

    // If there is no such data, the number of bytes is zero.
    /** @type {Uint8Array | undefined} */
    let sampleData;
    if (sampleDataSize > 0) {
      sampleData = smpl.read(sampleDataSize, false);
    }

    // The sample loops
    // const sampleLoops =
    // This sampler specific data is optional
    // samplerSpecificData

    /** @type {WavSample} */
    const value = {
      manufacturer1,
      manufacturer2,
      manufacturer3,
      manufacturer4,
      product,
      samplePeriod,
      midiUnityNote,
      midiPitchFraction,
      SMPTEFormat,
      SMPTEOffset1,
      SMPTEOffset2,
      SMPTEOffset3,
      SMPTEOffset4,
      sampleLoopsCount,
      sampleDataSize,
      sampleLoops,
      sampleData,
    };
    debug('decodeSMPL =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the RLND (Roland) chunk.
   *
   * Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.
   *
   * This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavRoland} The decoded values.
   * @static
   */
  static decodeRLND(chunk) {
    debug('decodeRLND');
    const roland = new DataBuffer(chunk);
    const chunkID = roland.readString(4);
    const size = roland.readUInt32(true);

    // SP-404SX Wave Converter v1.01 on macOS sets this value to `roifspsx`
    const device = roland.readString(8);

    // SP-404SX Wave Converter v1.01 on macOS sets this value to `0x04`
    const unknown1 = roland.readUInt8();
    // SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`
    const unknown2 = roland.readUInt8();
    // SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`
    const unknown3 = roland.readUInt8();
    // SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`
    const unknown4 = roland.readUInt8();

    // Sample Index starts at 0 for A1 and increases by 12 for each bank, i.e. A1 = 0x00 / 0, A5 = 0x04 / 4, B5 = 0x10 / 16, ..., J12 = 0x77 / 119.
    const sampleIndex = roland.readUInt8();
    let sampleLabel = '';
    if (device === 'roifspsx') {
      const label = ROLAND_SP404SX_PADS[sampleIndex];
      if (label === undefined) {
        debug('Unknown Pad:', sampleIndex);
      } else {
        sampleLabel = label;
      }
    }

    /** @type {WavRoland} */
    const value = {
      chunkID,
      size,
      device,
      unknown1,
      unknown2,
      unknown3,
      unknown4,
      sampleIndex,
      sampleLabel,
    };

    debug('decodeRLND =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Enocdes JSON values to a valid `RLND` (Roland) chunk Buffer.
   *
   * Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.
   *
   * The unknown value may be an unsigned 32bit integer.
   *
   * This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.
   * @static
   * @param {object} data The JSON values to set in the RLND chunk.
   * @param {string} data.device An 8 character string representing the device label. SP-404SX Wave Converter v1.01 on macOS sets this value to `roifspsx`.
   * @param {number} [data.unknown1] Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x04`.
   * @param {number} [data.unknown2] Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`.
   * @param {number} [data.unknown3] Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`.
   * @param {number} [data.unknown4] Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`.
   * @param {number|string} data.sampleIndex The pad the sample plays on, between `0` and `119` as a number or the pad label, `A1` - `J12`. Only the SP404SX (device === `roifspsx`) provided values can be converted from string corrently, and if it is not found it will defailt to `0` / `A1`.
   * @returns {Buffer<ArrayBuffer>} The new RLND chunk.
   * @static
   * @see {@link https://www.roland.com/global/support/by_product/sp-404sx/updates_drivers/|SP-404SX Support Page}
   */
  static encodeRLND(data) {
    const {
      device,
      unknown1 = 4,
      unknown2 = 0,
      unknown3 = 0,
      unknown4 = 0,
    } = data;
    let { sampleIndex } = data;
    debug('encodeRLND:', device, unknown1, unknown2, unknown3, unknown4, sampleIndex);
    // Padding
    const buffer = Buffer.alloc(466, 0);

    // ChunkID
    buffer.write('RLND', 0);

    // Chunk Size
    buffer.writeUInt32LE(458, 4);

    // Device, ie: 'roifspsx'
    buffer.write(device, 8);

    // Unknown
    buffer.writeUInt8(unknown1, 16);
    buffer.writeUInt8(unknown2, 17);
    buffer.writeUInt8(unknown3, 18);
    buffer.writeUInt8(unknown4, 19);

    // Determine the sample index from the string.
    if (device === 'roifspsx' && typeof sampleIndex === 'string') {
      const index = ROLAND_SP404SX_PADS.indexOf(sampleIndex.toUpperCase());
      if (index === -1) {
        debug('Unknown Pad:', sampleIndex);
        sampleIndex = 0;
      } else {
        sampleIndex = index;
      }
    }

    // Sample Index
    buffer.writeUInt8(Number(sampleIndex), 20);

    debug('Buffer:', buffer.toString('hex'));
    return buffer;
  }

  /**
   * Decode the JUNK (Padding) chunk.
   *
   * To align RIFF chunks to certain boundaries (i.e. 2048 bytes for CD-ROMs) the RIFF specification includes a JUNK chunk.
   * The contents are to be skipped when reading.
   * When writing RIFFs, JUNK chunks should not have an odd Size.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @param {object} options Decoding options.
   * @param {boolean} options.roundOddChunks When true we will round odd chunk sizes up to keep in spec.
   * @static
   */
  static decodeJUNK(chunk, options) {
    const junk = new DataBuffer(chunk);
    const chunkID = junk.readString(4);
    let size = junk.readUInt32(true);
    if (options.roundOddChunks && size % 2 !== 0) {
      size += 1;
    }
    debug(`decodeJUNK: ${chunk.length} bytes, chunkID: ${chunkID}, junk size: ${size}`);
  }

  /**
   * Decode the `PAD ` (Padding) chunk.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @static
   */
  static decodePAD(chunk) {
    const pad = new DataBuffer(chunk);
    const chunkID = pad.readString(4);
    const size = pad.readUInt32(true);
    debug(`decodePAD: ${chunk.length} bytes, chunkID: ${chunkID}, pad size: ${size}`);
  }

  /**
   * Decode the bext (Broadcast Wave Format (BWF) Broadcast Extension) chunk.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @param {object} options Decoding options.
   * @param {boolean} options.roundOddChunks When true we will round odd chunk sizes up to keep in spec.
   * @returns {WavBext} The decoded values.
   * @static
   * @see {@link https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue|Cue Chunk}
   * @see {@link https://tech.ebu.ch/docs/tech/tech3285.pdf|Spec}
   */
  static decodeBEXT(chunk, options) {
    debug('decodeBEXT');
    const bext = new DataBuffer(chunk);
    const chunkID = bext.readString(4);
    let size = bext.readUInt32(true);

    if (options.roundOddChunks && size % 2 !== 0) {
      size += 1;
    }

    /** @type {WavBext} */
    const value = {
      chunkID,
      size,
    };
    // Description of the sound sequence
    value.description = bext.readString(256);
    // Name of the originator
    value.originator = bext.readString(32);
    // Reference of the originator
    value.originatorReference = bext.readString(32);
    // yyyy:mm:dd
    value.originationDate = bext.readString(10);
    // hh:mm:ss
    value.originationTime = bext.readString(8);
    // First sample count since midnight, low word
    value.timeReferenceLow = bext.readUInt32(true);
    // First sample count since midnight, high word
    value.timeReferenceHigh = bext.readUInt32(true);
    // Version of the BWF; unsigned binary number
    value.version = bext.readUInt16(true);
    // SMPTE UMID
    value.umid = bext.read(64, false);
    // Integrated Loudness Value of the file in LUFS (multiplied by 100)
    value.loudnessValue = bext.readUInt16(true);
    // Loudness Range of the file in LU (multiplied by 100)
    value.loudnessRange = bext.readUInt16(true);
    // Maximum True Peak Level of the file expressed as dBTP (multiplied by 100)
    value.maxTruePeakLevel = bext.readUInt16(true);
    // Highest value of the Momentary Loudness Level of the file in LUFS (multiplied by 100)
    value.maxMomentaryLoudness = bext.readUInt16(true);
    // Highest value of the Short-Term Loudness Level of the file in LUFS (multiplied by 100)
    value.maxShortTermLoudness = bext.readUInt16(true);
    // 180 bytes, reserved for future use
    value.reserved = bext.read(180, false);
    // History coding
    value.codingHistory = bext.read(bext.remainingBytes(), true);

    debug('decodeBEXT =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the 'cue ' (Cue Points) chunk.
   *
   * A cue chunk specifies one or more sample offsets which are often used to mark noteworthy sections of audio.
   * For example, the beginning and end of a verse in a song may have cue points to make them easier to find.
   * The cue chunk is optional and if included, a single cue chunk should specify all cue points for the "WAVE" chunk.
   * No more than one cue chunk is allowed in a "WAVE" chunk.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavCue} The decoded values.
   * @static
   * @see {@link https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue|Cue Chunk}
   */
  static decodeCue(chunk) {
    debug('decodeCue');
    const cue = new DataBuffer(chunk);
    const chunkID = cue.readString(4);
    const size = cue.readUInt32(true);
    debug('decodeCue size', size);

    // This value specifies the number of following cue points in this chunk.
    const numberCuePoints = cue.readUInt32(true);
    debug('decodeCue numberCuePoints', numberCuePoints);

    const value = /** @type {WavCue} */ ({
      chunkID,
      size,
      numberCuePoints,
      data: [],
    });
    for (let i = 0; i < numberCuePoints; i++) {
      const point = /** @type {WavCuePoint} */ ({});

      // Each cue point has a unique identification value used to associate cue points with information in other chunks.
      // For example, a Label chunk contains text that describes a point in the wave file by referencing the associated cue point.
      point.id = cue.readUInt32(true);

      // Position
      // The position specifies the sample offset associated with the cue point in terms of the sample's position in the final stream of samples generated by the play list.
      // Said in another way, if a play list chunk is specified, the position value is equal to the sample number at which this cue point will occur during playback of the entire play list as defined by the play list's order.
      // If no play list chunk is specified this value should be 0.
      point.position = cue.readUInt32(true);

      // This value specifies the four byte ID used by the chunk containing the sample that corresponds to this cue point.
      // A Wave file with no play list is always "data".
      // A Wave file with a play list containing both sample data and silence may be either "data" or "slnt".
      point.chunkID = cue.readString(4);

      // The Chunk Start value specifies the byte offset into the Wave List Chunk of the chunk containing the sample that corresponds to this cue point.
      // This is the same chunk described by the Data Chunk ID value.
      // If no Wave List Chunk exists in the Wave file, this value is 0.
      // If a Wave List Chunk exists, this is the offset into the "wavl" chunk.
      // The first chunk in the Wave List Chunk would be specified with a value of 0.
      point.chunkStart = cue.readUInt32(true);

      // The Block Start value specifies the byte offset into the "data" or "slnt" Chunk to the start of the block containing the sample.
      // The start of a block is defined as the first byte in uncompressed PCM wave data or the last byte in compressed wave data where decompression can begin to find the value of the corresponding sample value.
      point.blockStart = cue.readUInt32(true);

      // The Sample Offset specifies an offset into the block (specified by Block Start) for the sample that corresponds to the cue point.
      // In uncompressed PCM waveform data, this is simply the byte offset into the "data" chunk.
      // In compressed waveform data, this value is equal to the number of samples (may or may not be bytes) from the Block Start to the sample that corresponds to the cue point.
      point.sampleOffset = cue.readUInt32(true);

      value.data.push(point);
    }

    if (cue.remainingBytes() > 0) {
      debug(`Unexpected ${cue.remainingBytes()} bytes remaining`);
    }

    debug('decodeCue =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the 'ResU' chunk, a ZIP compressed JSON Data containg Time Signature, Tempo and other data for Logic Pro X.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavResU} The decoded values.
   * @static
   */
  static decodeResU(chunk) {
    debug('decodeResU');
    const resu = new DataBuffer(chunk);
    const chunkID = resu.readString(4);
    const size = resu.readUInt32(true);
    const data = resu.read(size, false);

    let decompressed = '';
    try {
      decompressed = zlib.inflateSync(data).toString('utf8');
      debug('Inflated Size:', decompressed.length);
    } catch (error) {
      debug('Error Inflating ResU:', error);
    }

    /** @type {WavResU} */
    const value = {
      chunkID,
      size,
    };
    try {
      value.data = /** @type {unknown} */ (JSON.parse(decompressed));
    } catch (error) {
      debug('Error Parsing ResU JSON:', error);
    }

    debug('decodeResU =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * DataSize 64 Parsing
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavDS64} The decoded values.
   * @see {@link https://tech.ebu.ch/docs/tech/tech3306v1_0.pdf|RF64: An extended File Format for Audio}
   * @static
   */
  static decodeDS64(chunk) {
    const ds64 = new DataBuffer(chunk);
    const chunkID = ds64.readString(4);
    const size = ds64.readUInt32(true);

    // low 4 byte size of RF64 block
    const riffSizeLow = ds64.readUInt32(true);
    // high 4 byte size of RF64 block
    const riffSizeHigh = ds64.readUInt32(true);
    // low 4 byte size of data chunk
    const dataSizeLow = ds64.readUInt32(true);
    // high 4 byte size of data chunk
    const dataSizeHigh = ds64.readUInt32(true);
    // low 4 byte sample count of fact chunk
    const sampleCountLow = ds64.readUInt32(true);
    // high 4 byte sample count of fact chunk
    const sampleCountHigh = ds64.readUInt32(true);
    // Number of valid entries in the following table
    const tableLength = ds64.readUInt32(true);

    /** @type {WavDS64TableEntry[]} */
    const table = [];
    if (tableLength > 0) {
      while (ds64.remainingBytes() > 0) {
        table.push({
          chunkID: ds64.readString(4),
          chunkSizeLow: ds64.readUInt32(true),
          chunkSizeHigh: ds64.readUInt32(true),
        });
      }
    }

    /** @type {WavDS64} */
    const value = {
      chunkID,
      size,
      riffSizeLow,
      riffSizeHigh,
      dataSizeLow,
      dataSizeHigh,
      sampleCountLow,
      sampleCountHigh,
      tableLength,
      table,
    };

    debug('decodeDS64 =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the STRC (ACID Related) chunk.
   *
   * When a wave file is used as wave samples in a MIDI synthesizer,
   * the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {WavStrc} The decoded values.
   * @static
   */
  static decodeSTRC(chunk) {
    debug('decodeSTRC');
    const strc = new DataBuffer(chunk);
    const _chunkID = strc.readString(4);
    const size = strc.readUInt32(true);
    debug('decodeSTRC size:', size);

    const unknown1 = strc.readUInt32(true); // always 28 (0x1C)
    const numberOfSlices = strc.readUInt32(true); // i.e. number of 32 byte blocks following this header
    const unknown2 = strc.readUInt32(true); // either 0, 25 (0x19) or 65 (0x41)
    const unknown3 = strc.readUInt32(true); // either 10 (0x0A) or 5 (0x05) seems to be linked to value of unknown 2, i.e. 25 and 10 go together, or 65 and 5
    const unknown4 = strc.readUInt32(true); // always 1 (0x01)
    const unknown5 = strc.readUInt32(true); // either 0, 1 or 10
    const unknown6 = strc.readUInt32(true); // have seen values 0,2,3,4 and 5

    /** @type {WavStrcSlice[]} */
    const slices = [];
    debug('decodeSTRC numberOfSlices:', numberOfSlices);
    for (let i = 0; i < numberOfSlices - 1; i++) {
      const header = strc.readUInt32(true); // either 0 or 2
      const ID1 = strc.readUInt32(true); // Random?

      // sample position of this slice
      const samplePositionUpper = strc.readUInt32(true);
      const samplePositionLower = strc.readUInt32(true);

      // first set of slices this will be zero, second set it will be the same as samplePosition
      const samplePosition2Upper = strc.readUInt32(true);
      const samplePosition2Lower = strc.readUInt32(true);

      // first set of slices this is a large number, different every time, but in similar order of magnitude, doesn't seem to be a float.
      // could be some kind of volume representation? Second set of slices it will be zero
      const data3 = strc.readUInt32(true);

      // another seemingly random number, but the same value for every slice
      const ID2 = strc.readUInt32(true);

      const slice = {
        header,
        ID1,
        samplePositionUpper,
        samplePositionLower,
        samplePosition2Upper,
        samplePosition2Lower,
        data3,
        ID2,
      };
      debug('decodeSTRC slice:', i, slice);
      debug('remaining', strc.remainingBytes());
      slices.push(slice);
    }
    debug('decodeSTRC remaining', strc.remainingBytes());

    /** @type {WavStrc} */
    const value = {
      unknown1,
      numberOfSlices,
      unknown2,
      unknown3,
      unknown4,
      unknown5,
      unknown6,
      slices,
    };
    debug('decodeSTRC =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the COMM (Common) chunk.
   * The Common Chunk describes fundamental parameters of the sampled sound.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {AiffCommon} The decoded values.
   * @see {@link https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html|Audio File Format Specifications}
   * @static
   */
  static decodeCOMM(chunk) {
    debug('decodeCOMM');
    const commonChunk = new DataBuffer(chunk);
    const chunkID = commonChunk.readString(4);
    const size = commonChunk.readUInt32();

    // Mono = 1, Stereo = 2, etc.
    const channels = commonChunk.readUInt16();

    // Sample Frames contains the number of sample frames in the Sound Data Chunk.
    // Note that numSampleFrames is the number of sample frames, not the number of bytes nor the number of sample points in the Sound Data Chunk.
    // The total number of sample points in the file is calculated: Sample Frames x Channels
    const sampleFrames = commonChunk.readUInt32();

    // Sample Size is the number of bits in each sample point.
    // It can be any number from 1 to 32.
    const sampleSize = commonChunk.readUInt16();

    // Sample Rate is the sample rate at which the sound is to be played back, in sample frames per second.
    const sampleRate = commonChunk.readFloatIEEE754(false);

    // AIFF-C files have additional fields
    let compressionType = '';
    let compressionTypeName = '';
    if (size !== 18) {
      // Compression Type is used by programs to identify the compression algorithm, if any, used on the sound data.
      compressionType = commonChunk.readString(4);

      // The name is stored as a Pascal string, first byte is the length.
      const nameLength = commonChunk.readUInt8();

      // Compression Name is used by people to identify the compression algorithm.
      // Remember to pad the end of compressionName with a zero byte if the pstring length is not an even number of bytes, but do not include the pad byte in the count.
      compressionTypeName = commonChunk.readString(nameLength);
    }

    /** @type {AiffCommon} */
    const value = {
      chunkID,
      size,
      channels,
      sampleFrames,
      sampleSize,
      sampleRate,
      compressionType,
      compressionTypeName,
    };

    debug('decodeCOMM =', JSON.stringify(value, null, 2));
    return value;
  }

  /**
   * Decode the SSND (Sound Data) chunk.
   *
   * Offset:     4 bytes
   * Block Size: 4 bytes
   * Sound Data: n bytes
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {AiffSoundData} The decoded values.
   * @see {@link https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html|Audio File Format Specifications}
   * @static
   */
  static decodeSSND(chunk) {
    debug('decodeSSND');
    const ssndChunk = new DataBuffer(chunk);
    const chunkID = ssndChunk.readString(4);
    const size = ssndChunk.readUInt32();

    // Determines where the first sample frame in the soundData starts, in bytes.
    // Most applications won't use offset and should set it to zero.
    const offset = ssndChunk.readUInt32();

    // Used in conjunction with offset for block-aligning sound data.
    // It contains the size in bytes of the blocks that sound data is aligned to.
    // As with offset, most applications won't use blockSize and should set it to zero.
    const blockSize = ssndChunk.readUInt32();

    // Contains the sample frames that make up the sound.
    // The number of sample frames in the soundData is determined by the sampleFrames parameter in the Common Chunk.
    const soundData = ssndChunk.read(ssndChunk.remainingBytes());

    /** @type {AiffSoundData} */
    const value = {
      chunkID,
      size,
      offset,
      blockSize,
      soundData,
    };

    debug('decodeSSND =', JSON.stringify({ chunkID, size, offset, blockSize }, null, 2));
    return value;
  }

  /**
   * Decode the FVER (Format Vers) chunk.
   *
   * The Format Version Chunk contains a date field to indicate the format rules for an AIFF-C specification.
   * The timestamp holds the number of seconds since January 1, 1904.
   * The FVER chunk appears only in AIFF-C files.
   * @param {string|Buffer|Uint8Array} chunk Data Blob
   * @returns {AiffFormatVersion} The decoded values.
   * @see {@link https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html|Audio File Format Specifications}
   * @static
   */
  static decodeFVER(chunk) {
    debug('decodeFVER');
    const formatVersionChunk = new DataBuffer(chunk);
    const chunkID = formatVersionChunk.readString(4);
    const size = formatVersionChunk.readUInt32();

    const timestamp = formatVersionChunk.readUInt32();
    const versionName = timestamp === 2726318400 ? 'AIFCVersion1' : `Unknown: ${timestamp}`;

    /** @type {AiffFormatVersion} */
    const value = {
      chunkID,
      size,
      timestamp,
      versionName,
    };

    debug('decodeFVER =', JSON.stringify(value, null, 2));
    return value;
  }
}

export default AudioWAV;
