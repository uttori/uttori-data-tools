import DataBuffer from "../data-buffer.js";
/** Options controlling recovery and bounded metadata decompression. */
export interface WavOptions {
    /** Read the RIFF / AIFF alignment byte after odd-sized chunks. Defaults to true. */
    roundOddChunks?: boolean;
    /** Throw on structural errors instead of recording them and recovering. Defaults to false. */
    strict?: boolean;
    /** Maximum decompressed ResU JSON bytes. Defaults to 16 MiB. */
    maxResUSize?: number;
}
/** A recoverable parsing problem, with its byte offset in the input file. */
export interface WavParseError {
    /** The offset of the affected header or chunk. */
    offset: number;
    /** The diagnostic message. */
    message: string;
}
/** A decoded WAV / AIFF file header. */
export interface WavHeader {
    /** The container ID: `RIFF`, `RF64`, `BW64`, `FORM`, `AIFF`, or `AIFC`. */
    chunkID: string;
    /** The declared size of the rest of the file in bytes. */
    size: number;
    /** The format ID, e.g. `WAVE`, `AIFF`, or `AIFC`. */
    format: string;
    /** The normalized container type: `WAVE` or `AIFF`. */
    type: string;
}
/** A decoded `fmt ` (format) chunk. Fields after `bitsPerSample` are only present for extended / extensible formats. */
export interface WavFormat {
    /** The chunk ID, `fmt `. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The numeric audio format code. */
    audioFormatValue: number;
    /** The human-readable audio format label. */
    audioFormat: string;
    /** The number of channels. */
    channels: number;
    /** The sample rate in Hz. */
    sampleRate: number;
    /** The average bytes per second. */
    byteRate: number;
    /** The block alignment (bytes). */
    blockAlign: number;
    /** The number of bits per sample. */
    bitsPerSample: number;
    /** The size of the extended parameter block, when present. */
    extraParamSize?: number;
    /** The valid bits per sample (extensible format). */
    validBitsPerSample?: number;
    /** The channel mask (extensible format). */
    channelMask?: number;
    /** The human-readable channel mask label. */
    channelMaskLabel?: string;
    /** The first GUID sub-format field. */
    subFormat_1?: number;
    /** The second GUID sub-format field. */
    subFormat_2?: number;
    /** The third GUID sub-format field. */
    subFormat_3?: number;
    /** The fourth GUID sub-format field. */
    subFormat_4?: number;
    /** The fifth GUID sub-format field. */
    subFormat_5?: number;
    /** The raw extended parameter bytes. */
    extraParams?: Uint8Array;
}
/** A single entry from a LIST `INFO` chunk. */
export interface WavListInfo {
    /** The 4-character info ID. */
    id: string;
    /** The byte length of the text. */
    size: number;
    /** The info text. */
    text: string;
}
/** A single entry from a LIST `adtl` (associated data list) chunk. */
export interface WavListAdtl {
    /** The 4-character sub-chunk ID. */
    id: string;
    /** The byte length of the sub-chunk. */
    size: number;
    /** The label text, for `labl` sub-chunks. */
    label?: string;
    /** The labeled text, for `ltxt` sub-chunks. */
    ltxt?: string;
    /** The associated cue point identifier for labl, note, and ltxt entries. */
    cuePointID?: number;
    /** The note text, for note sub-chunks. */
    note?: string;
    /** The number of sample frames described by an ltxt entry. */
    sampleLength?: number;
    /** The four-character purpose code of an ltxt entry. */
    purposeID?: string;
    /** The country, language, dialect, and code-page identifiers of an ltxt entry. */
    country?: number;
    language?: number;
    dialect?: number;
    codePage?: number;
}
/** A single cue point from a `cue ` chunk. */
export interface WavCuePoint {
    /** The unique cue point identifier. */
    id: number;
    /** The sample offset of the cue in the play order. */
    position: number;
    /** The data chunk ID the cue refers to (`data` or `slnt`). */
    chunkID: string;
    /** The byte offset into the wave list chunk. */
    chunkStart: number;
    /** The byte offset into the data / slnt chunk. */
    blockStart: number;
    /** The sample offset within the block. */
    sampleOffset: number;
}
/** A decoded `cue ` chunk. */
export interface WavCue {
    /** The chunk ID, `cue `. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The number of cue points that follow. */
    numberCuePoints: number;
    /** The decoded cue points. */
    data: WavCuePoint[];
}
/** A decoded `ResU` chunk (zlib-compressed JSON used by Logic Pro X). */
export interface WavResU {
    /** The chunk ID, `ResU`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The parsed JSON payload, when it could be decompressed and parsed. */
    data?: unknown;
    /** The decompression or JSON error, when the payload could not be decoded. */
    error?: string;
}
/** A parsed chunk entry stored on {@link AudioWAV#chunks}. */
export interface WavChunk {
    /** The chunk type label (e.g. `header`, `format`, `data`). */
    type: string;
    /** The decoded value; the concrete shape depends on `type`. */
    value?: unknown;
    /** The raw bytes of the chunk, when retained. */
    chunk?: Uint8Array;
    /** Set when the chunk type is recognized but not decoded. */
    unknown?: boolean;
    /** A human-readable note for special / opaque chunks. */
    description?: string;
}
/** A decoded `data` chunk value (the audio payload is retained separately on WavChunk.chunk, not in this value). */
export interface WavData {
    /** The audio duration in seconds, or NaN when no usable timing information is available. */
    duration: number;
}
/** A decoded `LIST` chunk. */
export interface WavList {
    /** The chunk ID, `LIST`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The list type, e.g. `INFO` or `adtl`. */
    type: string;
    /** The parsed sub-list entries. */
    data?: WavListInfo[] | WavListAdtl[];
}
/** A decoded `tlst` (Trigger List) chunk. */
export interface WavTriggerList {
    /** The referenced list (`cue` or `playlist`). */
    list: string;
    /** The cue point name / playlist entry index. */
    name: string;
    /** The trigger type (0: SMPTE, 1: MIDI Command, 2: MIDI SysEx). */
    type: number;
    /** Trigger value 1 (SMPTE hours / MIDI channel). */
    triggerOn1: number;
    /** Trigger value 2 (SMPTE minutes / MIDI command). */
    triggerOn2: number;
    /** Trigger value 3 (SMPTE seconds / MIDI param 1). */
    triggerOn3: number;
    /** Trigger value 4 (SMPTE frames / MIDI param 2). */
    triggerOn4: number;
    /** The size of additional information. */
    extra: number;
    /** The additional information value. */
    extraData: number;
    /** The complete optional trigger data, including variable-length MIDI SysEx patterns. */
    extraDataBytes?: Uint8Array;
    /** The trigger function (0: Play, 1: Stop, 2: Queue). */
    function: number;
}
/** A decoded `fact` chunk. */
export interface WavFact {
    /** The number of samples per channel. */
    numberOfSamples: number;
}
/** A decoded `PEAK` chunk. */
export interface WavPeak {
    /** The peak chunk version. */
    version: number;
    /** The Unix timestamp of creation. */
    timestamp: number;
    /** Legacy raw bits of the first peak value; this is not a pointer. Prefer peaks. */
    ppeakPointer: number;
    /** Legacy first peak position; this is not alignment padding. Prefer peaks. */
    bitAlign: number;
    /** The peak amplitude and sample-frame position for each channel. */
    peaks: {
        value: number;
        position: number;
    }[];
}
/** A decoded `DISP` (Display) chunk. */
export interface WavDisplay {
    /** The Windows clipboard format identifier. */
    type: number;
    /** The first two display bytes as a legacy numeric value, zero-filled when shorter. */
    data: number;
    /** The complete clipboard-format-specific payload. */
    rawData: Uint8Array;
    /** Decoded CF_TEXT or CF_UNICODETEXT text, when applicable. */
    text?: string;
}
/** A decoded `acid` (ACID Loop) chunk. */
export interface WavAcid {
    /** The file type bit mask. */
    type: number;
    /** The root note. */
    rootNote: number;
    /** An unknown 16-bit value. */
    unknown1: number;
    /** An unknown 32-bit floating-point value. */
    unknown2: number;
    /** The number of beats. */
    beats: number;
    /** The meter denominator (e.g. the 4 in 3/4). */
    meterDenominator: number;
    /** The meter numerator (e.g. the 3 in 3/4). */
    meterNumerator: number;
    /** The tempo. */
    tempo: number;
}
/** A decoded `inst` (Instrument) chunk. */
export interface WavInstrument {
    /** The MIDI note for the sample's original pitch (0-127). */
    unshiftedNote: number;
    /** The fine tuning in cents (-50 to 50). */
    fineTuning: number;
    /** The suggested volume in decibels. */
    gain: number;
    /** The lowest usable MIDI note (0-127). */
    lowNote: number;
    /** The highest usable MIDI note (0-127). */
    highNote: number;
    /** The lowest usable MIDI velocity (0-127). */
    lowVelocity: number;
    /** The highest usable MIDI velocity (0-127). */
    highVelocity: number;
}
/** A single sample loop entry from a `smpl` chunk. */
export interface WavSampleLoop {
    /** The unique loop ID (may reference a cue point). */
    ID: number;
    /** The loop type (0: forward, 1: alternating, 2: backward). */
    type: number;
    /** The loop start point in samples. */
    start: number;
    /** The loop end point in samples. */
    end: number;
    /** The fine-tune resolution. */
    fraction: number;
    /** The play count (0 means infinite). */
    count: number;
}
/** A decoded `smpl` (Sample) chunk. */
export interface WavSample {
    /** The manufacturer code byte 1. */
    manufacturer1: number;
    /** The manufacturer code byte 2. */
    manufacturer2: number;
    /** The manufacturer code byte 3. */
    manufacturer3: number;
    /** The manufacturer code byte 4. */
    manufacturer4: number;
    /** The product / model ID. */
    product: number;
    /** The period of one sample. */
    samplePeriod: number;
    /** The MIDI note played at the sample's current pitch (0-127). */
    midiUnityNote: number;
    /** The fraction of a semitone up from the unity note. */
    midiPitchFraction: number;
    /** The SMPTE format (0, 24, 25, 29, or 30). */
    SMPTEFormat: number;
    /** The SMPTE offset byte 1 (hours). */
    SMPTEOffset1: number;
    /** The SMPTE offset byte 2 (minutes). */
    SMPTEOffset2: number;
    /** The SMPTE offset byte 3 (seconds). */
    SMPTEOffset3: number;
    /** The SMPTE offset byte 4 (frames). */
    SMPTEOffset4: number;
    /** The number of sample loops. */
    sampleLoopsCount: number;
    /** The number of bytes of sampler-specific data. */
    sampleDataSize: number;
    /** The parsed sample loops. */
    sampleLoops: WavSampleLoop[];
    /** The optional sampler-specific data. */
    sampleData: Uint8Array;
}
/** A decoded `RLND` (Roland) chunk. */
export interface WavRoland {
    /** The chunk ID, `RLND`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The 8-character device label (e.g. `roifspsx`). */
    device: string;
    /** An unknown byte. */
    unknown1: number;
    /** An unknown byte. */
    unknown2: number;
    /** An unknown byte. */
    unknown3: number;
    /** An unknown byte. */
    unknown4: number;
    /** The pad sample index (0-119). */
    sampleIndex: number;
    /** The human-readable pad label (`A1` - `J12`). */
    sampleLabel: string;
}
/** A decoded `bext` (Broadcast Wave Format extension) chunk. */
export interface WavBext {
    /** The chunk ID, `bext`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The description of the sound sequence. */
    description: string;
    /** The name of the originator. */
    originator: string;
    /** The reference of the originator. */
    originatorReference: string;
    /** The origination date (yyyy:mm:dd). */
    originationDate: string;
    /** The origination time (hh:mm:ss). */
    originationTime: string;
    /** The first sample count since midnight, low word. */
    timeReferenceLow: number;
    /** The first sample count since midnight, high word. */
    timeReferenceHigh: number;
    /** The BWF version. */
    version: number;
    /** The SMPTE UMID (64 bytes). */
    umid: Uint8Array;
    /** The integrated loudness value (LUFS x 100). */
    loudnessValue: number;
    /** The loudness range (LU x 100). */
    loudnessRange: number;
    /** The maximum true peak level (dBTP x 100). */
    maxTruePeakLevel: number;
    /** The maximum momentary loudness (LUFS x 100). */
    maxMomentaryLoudness: number;
    /** The maximum short-term loudness (LUFS x 100). */
    maxShortTermLoudness: number;
    /** Reserved bytes: 254 in version 0, 190 in version 1, and 180 in version 2 or later. */
    reserved: Uint8Array;
    /** The coding history. */
    codingHistory: Uint8Array;
}
/** A single table entry from a `ds64` chunk. */
export interface WavDS64TableEntry {
    /** The referenced chunk ID. */
    chunkID: string;
    /** The low 4 bytes of the chunk size. */
    chunkSizeLow: number;
    /** The high 4 bytes of the chunk size. */
    chunkSizeHigh: number;
}
/** A decoded `ds64` (DataSize 64) chunk used by RF64 files. */
export interface WavDS64 {
    /** The chunk ID, `ds64`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The low 4 bytes of the RF64 block size. */
    riffSizeLow: number;
    /** The high 4 bytes of the RF64 block size. */
    riffSizeHigh: number;
    /** The low 4 bytes of the data chunk size. */
    dataSizeLow: number;
    /** The high 4 bytes of the data chunk size. */
    dataSizeHigh: number;
    /** The low 4 bytes of the fact chunk sample count. */
    sampleCountLow: number;
    /** The high 4 bytes of the fact chunk sample count. */
    sampleCountHigh: number;
    /** The number of valid entries in the table. */
    tableLength: number;
    /** The chunk size table. */
    table: WavDS64TableEntry[];
}
/** A single slice entry from a `strc` chunk. */
export interface WavStrcSlice {
    /** An unknown header value (0 or 2). */
    header: number;
    /** A seemingly random ID. */
    ID1: number;
    /** The upper 32 bits of the slice sample position. */
    samplePositionUpper: number;
    /** The lower 32 bits of the slice sample position. */
    samplePositionLower: number;
    /** The lower 32 bits of the secondary sample position. */
    samplePosition2Upper: number;
    /** The lower 32 bits of the secondary sample position. */
    samplePosition2Lower: number;
    /** An unknown value. */
    data3: number;
    /** A second seemingly random ID (constant per chunk). */
    ID2: number;
}
/** A decoded `strc` (ACID-related) chunk. */
export interface WavStrc {
    /** An unknown value (always 28). */
    unknown1: number;
    /** The number of 32-byte slice blocks. */
    numberOfSlices: number;
    /** An unknown value. */
    unknown2: number;
    /** An unknown value. */
    unknown3: number;
    /** An unknown value. */
    unknown4: number;
    /** An unknown value. */
    unknown5: number;
    /** An unknown value. */
    unknown6: number;
    /** The parsed slices. */
    slices: WavStrcSlice[];
}
/** A decoded AIFF `COMM` (Common) chunk. */
export interface AiffCommon {
    /** The chunk ID, `COMM`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The number of channels. */
    channels: number;
    /** The number of sample frames. */
    sampleFrames: number;
    /** The number of bits per sample point (1-32). */
    sampleSize: number;
    /** The sample rate (decoded from an 80-bit extended float). */
    sampleRate: number;
    /** The AIFF-C compression type, or empty for AIFF. */
    compressionType: string;
    /** The AIFF-C compression name, or empty for AIFF. */
    compressionTypeName: string;
}
/** A decoded AIFF `SSND` (Sound Data) chunk. */
export interface AiffSoundData {
    /** The chunk ID, `SSND`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The byte offset to the first sample frame. */
    offset: number;
    /** The block size used for block-aligning the sound data. */
    blockSize: number;
    /** Encoded sound bytes after the SSND offset; container parsing trims block padding for known uncompressed formats. */
    soundData: Uint8Array;
}
/** A decoded AIFF-C `FVER` (Format Version) chunk. */
export interface AiffFormatVersion {
    /** The chunk ID, `FVER`. */
    chunkID: string;
    /** The chunk size in bytes. */
    size: number;
    /** The format version timestamp (seconds since 1904-01-01). */
    timestamp: number;
    /** The human-readable version name. */
    versionName: string;
}
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
declare class AudioWAV extends DataBuffer {
    #private;
    /** The container type, `WAVE` or `AIFF`. */
    container: string;
    /** The file type, `WAVE` or `AIFF`. */
    type: string;
    /** The parsed chunks. */
    chunks: WavChunk[];
    /** The options for the AudioWAV instance. */
    options: Required<WavOptions>;
    /** Recoverable structural and metadata errors from the most recent parse. */
    errors: WavParseError[];
    /**
     * Creates a new AudioWAV.
     * @param input The data to process.
     * @param opts Options for this AudioWAV instance.
     * @class
     */
    constructor(input: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array, opts?: WavOptions);
    /**
     * Creates a new AudioWAV from file data.
     * @param data The data of the file to process.
     * @param options Options for returned AudioWAV instance.
     * @returns the new AudioWAV instance for the provided file data
     * @static
     */
    static fromFile(data: Buffer, options?: WavOptions): AudioWAV;
    /**
     * Creates a new AudioWAV from a DataBuffer.
     * @param buffer The DataBuffer of the file to process.
     * @param options Options for returned AudioWAV instance.
     * @returns the new AudioWAV instance for the provided DataBuffer
     * @static
     */
    static fromBuffer(buffer: DataBuffer, options?: WavOptions): AudioWAV;
    /**
     * Parse the WAV file, decoding the supported chunks.
     */
    parse(): void;
    /**
     * Decodes and validates WAV Header.
     * Checks for `RIFF` / `RF64` / `BW64` header, reads the size, and then checks for the `WAVE` header.
     *
     * Signature (Decimal): [82, 73, 70, 70, ..., ..., ..., ..., 87, 65, 86, 69]
     * Signature (Hexadecimal): [52, 49, 46, 46, ..., ..., ..., ..., 57, 41, 56, 45]
     * Signature (ASCII): [R, I, F, F, ..., ..., ..., ..., W, A, V, E]
     * @param chunk The data to process.
     * @returns The decoded values.
     * @throws {Error} Invalid WAV header
     * @static
     */
    static decodeHeader(chunk: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array): WavHeader;
    /**
     * Enocdes JSON values to a valid Wave Header chunk Buffer.
     * @param data The values to encode to the header chunk chunk.
     * @param data.riff RIFF Header, should contains the string `RIFF`, `RF64`, or `BW64` in ASCII form.
     * @param data.size This is the size of the entire file in bytes minus 8 bytes for the 2 fields not included in this count. RF64 sets this to -1 = 0xFFFFFFFF as it doesn't use this to support larger sizes in the DS64 chunk.
     * @param data.format WAVE Header, the string `WAVE` in ASCII form.
     * @returns The newley encoded header chunk.
     * @static
     */
    static encodeHeader({ riff, size, format, }: {
        riff?: string;
        size: number;
        format?: string;
    }): Buffer;
    /**
     * Decodes the chunk type, and attempts to parse that chunk if supported.
     * Supported Chunk Types: `fmt `, `fact`, `inst`, `DISP`, `smpl`, `tlst`, `data`, `LIST`, `RLND`, `JUNK`, `acid`, `cue `, `bext`, `ResU`, `ds64`, `cart`
     *
     * Chunk Structure:
     * Type:   4 bytes (string)
     * Length: 4 bytes (unsigned integer, excluding the alignment byte)
     * Chunk:  {length} bytes
     * @returns {string} Chunk Type
     * @throws {Error} Invalid chunk boundaries or metadata when strict parsing is enabled
     */
    decodeChunk(): string;
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
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     */
    static decodeFMT(chunk: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array): WavFormat;
    /**
     * Enocdes JSON values to a valid `fmt ` chunk Buffer.
     *
     * Defaults are set to Red Book Compact Disc Digital Audio (CDDA or CD-DA) / Audio CD standards.
     *
     * Extensible format fields can be supplied as a complete binary extraParams block (at least 22 bytes).
     * @param data The values to encode to the `fmt ` chunk.
     * @param data.audioFormatValue Format of the audio data, 1 is PCM and values other than 1 indicate some form of compression. See `decodeFMT` for a listing
     * @param data.channels Mono = 1, Stereo = 2, etc.
     * @param data.sampleRate 8000, 44100, 96000, etc.
     * @param data.byteRate Sample Rate * Channels * Bits per Sample / 8
     * @param data.blockAlign The number of bytes for one sample including all channels. Channels * Bits per Sample / 8
     * @param data.bitsPerSample 8 bits = 8, 16 bits = 16, etc.
     * @param data.extraParamSize The size of the extra paramteres to follow, or 0.
     * @param data.extraParams Any extra data to encode. Byte arrays are copied verbatim; strings and legacy numeric values are encoded as UTF-8 text.
     * @returns The newley encoded `fmt ` chunk.
     * @static
     */
    static encodeFMT(data?: {
        audioFormatValue?: number;
        channels?: number;
        sampleRate?: number;
        byteRate?: number;
        blockAlign?: number;
        bitsPerSample?: number;
        extraParamSize?: number;
        extraParams?: number | string | Uint8Array | number[];
    }): Buffer;
    /**
     * Decode the LIST (LIST Information) chunk.
     *
     * A LIST chunk defines a list of sub-chunks and has the following format.
     * @param chunk Data Blob
     * @param options Nested chunk alignment options.
     * @returns The decoded values.
     * @static
     */
    static decodeLIST(chunk: number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array, options?: Pick<WavOptions, "roundOddChunks">): WavList;
    /**
     * Decode the LIST INFO chunks.
     * @param buffer List DataBuffer
     * @param options Nested chunk alignment options.
     * @returns The parsed list.
     */
    static decodeLISTINFO(buffer: DataBuffer, options?: Pick<WavOptions, "roundOddChunks">): WavListInfo[];
    /**
     * Decode the LIST adtl chunks.
     * @param buffer List DataBuffer
     * @param options Nested chunk alignment options.
     * @returns The parsed list.
     */
    static decodeLISTadtl(buffer: DataBuffer, options?: Pick<WavOptions, "roundOddChunks">): WavListAdtl[];
    /**
     * Decode the data (Audio Data) chunk.
     * @param chunk Data Blob
     * @static
     */
    static decodeDATA(chunk: string | Buffer | Uint8Array): void;
    /**
     * Decode the `tlst` (Trigger List) chunk.
     *
     * Used in Sound Forge by Sonic Foundry
     *
     * Specifies a list of triggers which can be used to trigger playback of a series of cue points or Playlist entries.
     *
     * There's a historical bug in dwName (which is in fact an index, and the bug is that it's actually Index-1).
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     */
    static decodeTLST(chunk: string | Buffer | Uint8Array): WavTriggerList;
    /**
     * Decode the fact chunk.
     *
     * Fact chunks exist in all wave files that are compressed or that have a wave list chunk.
     * A fact chunk is not required in an uncompressed PCM file that does not have a wave list chunk.
     *
     * According to the fact chunk's initial specification, the data portion of the fact chunk will contain only one 4-byte number that specifies the number of samples in the data chunk of the Wave file.
     * This number, when combined with the samples per second value in the format chunk of the Wave file, can be used to compute the length of the audio data in seconds.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     * @see {@link https://www.recordingblogs.com/wiki/fact-chunk-of-a-wave-file | Fact chunk (of a Wave file)}
     * @see {@link http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html | Audio File Format Specifications}
     */
    static decodeFACT(chunk: string | Buffer | Uint8Array): WavFact;
    /**
     * Decode the PEAK chunk.
     * @param chunk Data Blob
     * @param littleEndian True for WAVE, false for AIFF.
     * @returns The decoded values.
     * @static
     * @see {@link https://code.google.com/archive/p/awesome-wav/wikis/WAVFormat.wiki|awesome-wav - WAVFormat.wiki}
     */
    static decodePEAK(chunk: string | Buffer | Uint8Array, littleEndian?: boolean): WavPeak;
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
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     * @see {@link http://netghost.narod.ru/gff/vendspec/micriff/ms_riff.txt|New Multimedia Data Types and Data Techniques}
     * @see {@link https://docs.microsoft.com/en-us/windows/win32/dataxchg/standard-clipboard-formats|Standard Clipboard Formats}
     */
    static decodeDISP(chunk: string | Buffer | Uint8Array): WavDisplay;
    /**
     *  ACID Loop File Format
     *
     *  They were originally created for use with Acid, the loop-based, music-sequencing software, created by Sonic Foundry in 1998.
     *
     *  "Acidized" loops contain tempo and key information, so that Acid and other programs that can read the "acidization" can properly time stretch and pitch shift them.
     *
     *  Although the phrase "ACID loops" technically only refers to loops which have been "acidized", some people use the term to refer to loops in general, even when used with other software packages.
     * @static
     * @param chunk Data Blob
     * @returns The decoded values.
     * @memberof AudioWAV
     */
    static decodeACID(chunk: string | Buffer | Uint8Array): WavAcid;
    /**
     * Decode the inst (Instrumet) chunk.
     *
     * When a wave file is used as wave samples in a MIDI synthesizer,
     * the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     */
    static decodeINST(chunk: string | Buffer | Uint8Array): WavInstrument;
    /**
     * Decode the smpl (Sample) chunk.
     *
     * The sample chunk allows a MIDI sampler to use the Wave file as a collection of samples.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     */
    static decodeSMPL(chunk: string | Buffer | Uint8Array): WavSample;
    /**
     * Decode the RLND (Roland) chunk.
     *
     * Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.
     *
     * This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     */
    static decodeRLND(chunk: string | Buffer | Uint8Array): WavRoland;
    /**
     * Enocdes JSON values to a valid `RLND` (Roland) chunk Buffer.
     *
     * Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.
     *
     * The unknown value may be an unsigned 32bit integer.
     *
     * This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.
     * @static
     * @param data The JSON values to set in the RLND chunk.
     * @param data.device An 8 character string representing the device label. SP-404SX Wave Converter v1.01 on macOS sets this value to `roifspsx`.
     * @param data.unknown1 Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x04`.
     * @param data.unknown2 Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`.
     * @param data.unknown3 Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`.
     * @param data.unknown4 Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`.
     * @param data.sampleIndex The pad the sample plays on, between `0` and `119` as a number or the pad label, `A1` - `J12`. Only the SP404SX (device === `roifspsx`) provided values can be converted from string corrently, and if it is not found it will defailt to `0` / `A1`.
     * @returns The new RLND chunk.
     * @static
     * @see {@link https://www.roland.com/global/support/by_product/sp-404sx/updates_drivers/|SP-404SX Support Page}
     */
    static encodeRLND(data: {
        device: string;
        unknown1?: number;
        unknown2?: number;
        unknown3?: number;
        unknown4?: number;
        sampleIndex?: number | string;
    }): Buffer;
    /**
     * Decode the JUNK (Padding) chunk.
     *
     * To align RIFF chunks to certain boundaries (i.e. 2048 bytes for CD-ROMs) the RIFF specification includes a JUNK chunk.
     * The contents are to be skipped when reading.
     * When writing RIFFs, JUNK chunks should not have an odd Size.
     * @param chunk Data Blob
     * @param options Decoding options.
     * @param options.roundOddChunks When true we will round odd chunk sizes up to keep in spec.
     * @static
     */
    static decodeJUNK(chunk: string | Buffer | Uint8Array, options?: Pick<WavOptions, "roundOddChunks">): void;
    /**
     * Decode the `PAD ` (Padding) chunk.
     * @param chunk Data Blob
     * @static
     */
    static decodePAD(chunk: string | Buffer | Uint8Array): void;
    /**
     * Decode the bext (Broadcast Wave Format (BWF) Broadcast Extension) chunk.
     * @param {string|Buffer|Uint8Array} chunk Data Blob
     * @param options Decoding options.
     * @param options.roundOddChunks Retained for API compatibility; alignment is handled by the container, not included in the decoded size.
     * @returns The decoded values.
     * @static
     * @see {@link https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue|Cue Chunk}
     * @see {@link https://tech.ebu.ch/docs/tech/tech3285.pdf|Spec}
     */
    static decodeBEXT(chunk: string | Buffer | Uint8Array, options?: Pick<WavOptions, "roundOddChunks">): WavBext;
    /**
     * Decode the 'cue ' (Cue Points) chunk.
     *
     * A cue chunk specifies one or more sample offsets which are often used to mark noteworthy sections of audio.
     * For example, the beginning and end of a verse in a song may have cue points to make them easier to find.
     * The cue chunk is optional and if included, a single cue chunk should specify all cue points for the "WAVE" chunk.
     * No more than one cue chunk is allowed in a "WAVE" chunk.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     * @see {@link https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue|Cue Chunk}
     */
    static decodeCue(chunk: string | Buffer | Uint8Array): WavCue;
    /**
     * Decode the 'ResU' chunk, zlib-compressed JSON data containing Time Signature, Tempo and other data for Logic Pro X.
     * @param chunk Data Blob
     * @param options Decompression limits.
     * @param options.maxResUSize Maximum uncompressed JSON bytes, default 16 MiB.
     * @returns The decoded values.
     * @static
     */
    static decodeResU(chunk: string | Buffer | Uint8Array, options?: Pick<WavOptions, "maxResUSize">): WavResU;
    /**
     * DataSize 64 Parsing
     * @param chunk Data Blob
     * @returns The decoded values.
     * @see {@link https://tech.ebu.ch/docs/tech/tech3306v1_0.pdf|RF64: An extended File Format for Audio}
     * @static
     */
    static decodeDS64(chunk: string | Buffer | Uint8Array): WavDS64;
    /**
     * Decode the STRC (ACID Related) chunk.
     *
     * When a wave file is used as wave samples in a MIDI synthesizer,
     * the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @static
     */
    static decodeSTRC(chunk: string | Buffer | Uint8Array): WavStrc;
    /**
     * Decode the COMM (Common) chunk.
     * The Common Chunk describes fundamental parameters of the sampled sound.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @see {@link https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html|Audio File Format Specifications}
     * @static
     */
    static decodeCOMM(chunk: string | Buffer | Uint8Array): AiffCommon;
    /**
     * Decode the SSND (Sound Data) chunk.
     *
     * Offset:     4 bytes
     * Block Size: 4 bytes
     * Sound Data: n bytes
     * @param chunk Data Blob
     * @returns The decoded values.
     * @see {@link https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html|Audio File Format Specifications}
     * @static
     */
    static decodeSSND(chunk: string | Buffer | Uint8Array): AiffSoundData;
    /**
     * Decode the FVER (Format Vers) chunk.
     *
     * The Format Version Chunk contains a date field to indicate the format rules for an AIFF-C specification.
     * The timestamp holds the number of seconds since January 1, 1904.
     * The FVER chunk appears only in AIFF-C files.
     * @param chunk Data Blob
     * @returns The decoded values.
     * @see {@link https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html|Audio File Format Specifications}
     * @static
     */
    static decodeFVER(chunk: string | Buffer | Uint8Array): AiffFormatVersion;
}
export default AudioWAV;
//# sourceMappingURL=audio-wav.d.ts.map