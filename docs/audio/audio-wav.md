## Classes

<dl>
<dt><a href="#AudioWAV">AudioWAV</a> ⇐ <code>DataBuffer</code></dt>
<dd><p>AudioWAV - WAVE Audio Utility
The WAVE file format is a subset of Microsoft&#39;s RIFF specification for the storage of multimedia files.
The AIFF file format Audio Interchange File Format (Audio IFF) provides a standard for storing sampled sounds.
Audio IFF conforms to the &quot;EA IFF 85&quot; Standard for Interchange Format Files developed by Electronic Arts.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#WAVE_FORMAT_TAGS">WAVE_FORMAT_TAGS</a></dt>
<dd><p>Maps the registered WAVE format tags (the <code>fmt </code> chunk&#39;s audio format code) to their human-readable names.</p>
</dd>
<dt><a href="#WAVE_CHANNEL_MASK_LABELS">WAVE_CHANNEL_MASK_LABELS</a></dt>
<dd><p>Maps a single-bit WAVE_FORMAT_EXTENSIBLE channel mask to its speaker label.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
<dt><a href="#rolandPads">rolandPads()</a></dt>
<dd><p>The Roland SP-404SX pad labels in sample-index order: pads <code>A1</code>–<code>J12</code> across banks <code>A</code>–<code>J</code>, twelve pads per bank.
The array index is the sample index (<code>0</code>–<code>119</code>) and the value is the pad label, so it serves both decode (index to label) and encode (label to index via <code>indexOf</code>).
Wrapped so the unused table can be dropped; a bare <code>flatMap</code> call is a side effect to bundlers.</p>
</dd>
<dt><a href="#AudioWAV.">AudioWAV.()</a></dt>
<dd><p>Combine unsigned 64-bit words only when JavaScript can represent the result exactly.</p>
</dd>
<dt><a href="#AudioWAV.">AudioWAV.()</a></dt>
<dd><p>Restrict a standalone decoder to its declared payload, excluding padding and later chunks.</p>
</dd>
<dt><a href="#AudioWAV.">AudioWAV.()</a></dt>
<dd><p>Validate integer writer fields without allocating a temporary validation table.</p>
</dd>
<dt><a href="#AudioWAV.">AudioWAV.()</a></dt>
<dd><p>Check count-derived ranges before allocating objects or entering a loop.</p>
</dd>
</dl>

<a name="AudioWAV"></a>

## AudioWAV ⇐ <code>DataBuffer</code>
AudioWAV - WAVE Audio Utility
The WAVE file format is a subset of Microsoft's RIFF specification for the storage of multimedia files.
The AIFF file format Audio Interchange File Format (Audio IFF) provides a standard for storing sampled sounds.
Audio IFF conforms to the "EA IFF 85" Standard for Interchange Format Files developed by Electronic Arts.

**Kind**: global class  
**Extends**: <code>DataBuffer</code>  

* [AudioWAV](#AudioWAV) ⇐ <code>DataBuffer</code>
    * [new AudioWAV(input, opts)](#new_AudioWAV_new)
    * _instance_
        * [.container](#AudioWAV+container)
        * [.type](#AudioWAV+type)
        * [.chunks](#AudioWAV+chunks)
        * [.options](#AudioWAV+options)
        * [.errors](#AudioWAV+errors)
        * [.format](#AudioWAV+format) ℗
        * [.parse()](#AudioWAV+parse)
        * [.decodeChunk()](#AudioWAV+decodeChunk) ⇒ <code>string</code>
    * _static_
        * [.fromFile(data, options)](#AudioWAV.fromFile) ⇒
        * [.fromBuffer(buffer, options)](#AudioWAV.fromBuffer) ⇒
        * [.decodeHeader(chunk)](#AudioWAV.decodeHeader) ⇒
        * [.encodeHeader(data)](#AudioWAV.encodeHeader) ⇒
        * [.decodeFMT(chunk)](#AudioWAV.decodeFMT) ⇒
        * [.encodeFMT(data)](#AudioWAV.encodeFMT) ⇒
        * [.decodeLIST(chunk, options)](#AudioWAV.decodeLIST) ⇒
        * [.decodeLISTINFO(buffer, options)](#AudioWAV.decodeLISTINFO) ⇒
        * [.decodeLISTadtl(buffer, options)](#AudioWAV.decodeLISTadtl) ⇒
        * [.decodeDATA(chunk)](#AudioWAV.decodeDATA)
        * [.decodeTLST(chunk)](#AudioWAV.decodeTLST) ⇒
        * [.decodeFACT(chunk)](#AudioWAV.decodeFACT) ⇒
        * [.decodePEAK(chunk, littleEndian)](#AudioWAV.decodePEAK) ⇒
        * [.decodeDISP(chunk)](#AudioWAV.decodeDISP) ⇒
        * [.decodeACID(chunk)](#AudioWAV.decodeACID) ⇒
        * [.decodeINST(chunk)](#AudioWAV.decodeINST) ⇒
        * [.decodeSMPL(chunk)](#AudioWAV.decodeSMPL) ⇒
        * [.decodeRLND(chunk)](#AudioWAV.decodeRLND) ⇒
        * [.encodeRLND(data)](#AudioWAV.encodeRLND) ⇒
        * [.decodeJUNK(chunk, options)](#AudioWAV.decodeJUNK)
        * [.decodePAD(chunk)](#AudioWAV.decodePAD)
        * [.decodeBEXT(chunk, options)](#AudioWAV.decodeBEXT) ⇒
        * [.decodeCue(chunk)](#AudioWAV.decodeCue) ⇒
        * [.decodeResU(chunk, options)](#AudioWAV.decodeResU) ⇒
        * [.decodeDS64(chunk)](#AudioWAV.decodeDS64) ⇒
        * [.decodeSTRC(chunk)](#AudioWAV.decodeSTRC) ⇒
        * [.decodeCOMM(chunk)](#AudioWAV.decodeCOMM) ⇒
        * [.decodeSSND(chunk)](#AudioWAV.decodeSSND) ⇒
        * [.decodeFVER(chunk)](#AudioWAV.decodeFVER) ⇒

<a name="new_AudioWAV_new"></a>

### new AudioWAV(input, opts)
Creates a new AudioWAV.


| Param | Description |
| --- | --- |
| input | The data to process. |
| opts | Options for this AudioWAV instance. |

**Example** *(AudioWAV)*  
```js
const data = fs.readFileSync('./audio.wav');
const file = AudioWAV.fromFile(data);
console.log('Chunks:', file.chunks);
```
<a name="AudioWAV+container"></a>

### audioWAV.container
The container type, `WAVE` or `AIFF`.

**Kind**: instance property of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+type"></a>

### audioWAV.type
The file type, `WAVE` or `AIFF`.

**Kind**: instance property of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+chunks"></a>

### audioWAV.chunks
The parsed chunks.

**Kind**: instance property of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+options"></a>

### audioWAV.options
The options for the AudioWAV instance.

**Kind**: instance property of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+errors"></a>

### audioWAV.errors
Recoverable structural and metadata errors from the most recent parse.

**Kind**: instance property of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+format"></a>

### audioWAV.format ℗
The first decoded format and file-wide sample-count metadata.

**Kind**: instance property of [<code>AudioWAV</code>](#AudioWAV)  
**Access**: private  
<a name="AudioWAV+parse"></a>

### audioWAV.parse()
Parse the WAV file, decoding the supported chunks.

**Kind**: instance method of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+decodeChunk"></a>

### audioWAV.decodeChunk() ⇒ <code>string</code>
Decodes the chunk type, and attempts to parse that chunk if supported.
Supported Chunk Types: `fmt `, `fact`, `inst`, `DISP`, `smpl`, `tlst`, `data`, `LIST`, `RLND`, `JUNK`, `acid`, `cue `, `bext`, `ResU`, `ds64`, `cart`

Chunk Structure:
Type:   4 bytes (string)
Length: 4 bytes (unsigned integer, excluding the alignment byte)
Chunk:  {length} bytes

**Kind**: instance method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: <code>string</code> - Chunk Type  
**Throws**:

- <code>Error</code> Invalid chunk boundaries or metadata when strict parsing is enabled

<a name="AudioWAV.fromFile"></a>

### AudioWAV.fromFile(data, options) ⇒
Creates a new AudioWAV from file data.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: the new AudioWAV instance for the provided file data  

| Param | Description |
| --- | --- |
| data | The data of the file to process. |
| options | Options for returned AudioWAV instance. |

<a name="AudioWAV.fromBuffer"></a>

### AudioWAV.fromBuffer(buffer, options) ⇒
Creates a new AudioWAV from a DataBuffer.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: the new AudioWAV instance for the provided DataBuffer  

| Param | Description |
| --- | --- |
| buffer | The DataBuffer of the file to process. |
| options | Options for returned AudioWAV instance. |

<a name="AudioWAV.decodeHeader"></a>

### AudioWAV.decodeHeader(chunk) ⇒
Decodes and validates WAV Header.
Checks for `RIFF` / `RF64` / `BW64` header, reads the size, and then checks for the `WAVE` header.

Signature (Decimal): [82, 73, 70, 70, ..., ..., ..., ..., 87, 65, 86, 69]
Signature (Hexadecimal): [52, 49, 46, 46, ..., ..., ..., ..., 57, 41, 56, 45]
Signature (ASCII): [R, I, F, F, ..., ..., ..., ..., W, A, V, E]

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**Throws**:

- <code>Error</code> Invalid WAV header


| Param | Description |
| --- | --- |
| chunk | The data to process. |

<a name="AudioWAV.encodeHeader"></a>

### AudioWAV.encodeHeader(data) ⇒
Enocdes JSON values to a valid Wave Header chunk Buffer.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The newley encoded header chunk.  

| Param | Description |
| --- | --- |
| data | The values to encode to the header chunk chunk. |
| data.riff | RIFF Header, should contains the string `RIFF`, `RF64`, or `BW64` in ASCII form. |
| data.size | This is the size of the entire file in bytes minus 8 bytes for the 2 fields not included in this count. RF64 sets this to -1 = 0xFFFFFFFF as it doesn't use this to support larger sizes in the DS64 chunk. |
| data.format | WAVE Header, the string `WAVE` in ASCII form. |

<a name="AudioWAV.decodeFMT"></a>

### AudioWAV.decodeFMT(chunk) ⇒
Decode the FMT (Format) chunk.
Should be the first chunk in the data stream.

Audio Format:       2 bytes
Channels:           2 bytes
Sample Rate:        4 bytes
Byte Rate:          4 bytes
Block Align:        2 bytes
Bits per Sample     2 bytes
[Extra Param Size]  2 bytes
[Extra Params]      n bytes

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.encodeFMT"></a>

### AudioWAV.encodeFMT(data) ⇒
Enocdes JSON values to a valid `fmt ` chunk Buffer.

Defaults are set to Red Book Compact Disc Digital Audio (CDDA or CD-DA) / Audio CD standards.

Extensible format fields can be supplied as a complete binary extraParams block (at least 22 bytes).

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The newley encoded `fmt ` chunk.  

| Param | Description |
| --- | --- |
| data | The values to encode to the `fmt ` chunk. |
| data.audioFormatValue | Format of the audio data, 1 is PCM and values other than 1 indicate some form of compression. See `decodeFMT` for a listing |
| data.channels | Mono = 1, Stereo = 2, etc. |
| data.sampleRate | 8000, 44100, 96000, etc. |
| data.byteRate | Sample Rate * Channels * Bits per Sample / 8 |
| data.blockAlign | The number of bytes for one sample including all channels. Channels * Bits per Sample / 8 |
| data.bitsPerSample | 8 bits = 8, 16 bits = 16, etc. |
| data.extraParamSize | The size of the extra paramteres to follow, or 0. |
| data.extraParams | Any extra data to encode. Byte arrays are copied verbatim; strings and legacy numeric values are encoded as UTF-8 text. |

<a name="AudioWAV.decodeLIST"></a>

### AudioWAV.decodeLIST(chunk, options) ⇒
Decode the LIST (LIST Information) chunk.

A LIST chunk defines a list of sub-chunks and has the following format.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |
| options | Nested chunk alignment options. |

<a name="AudioWAV.decodeLISTINFO"></a>

### AudioWAV.decodeLISTINFO(buffer, options) ⇒
Decode the LIST INFO chunks.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The parsed list.  

| Param | Description |
| --- | --- |
| buffer | List DataBuffer |
| options | Nested chunk alignment options. |

<a name="AudioWAV.decodeLISTadtl"></a>

### AudioWAV.decodeLISTadtl(buffer, options) ⇒
Decode the LIST adtl chunks.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The parsed list.  

| Param | Description |
| --- | --- |
| buffer | List DataBuffer |
| options | Nested chunk alignment options. |

<a name="AudioWAV.decodeDATA"></a>

### AudioWAV.decodeDATA(chunk)
Decode the data (Audio Data) chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeTLST"></a>

### AudioWAV.decodeTLST(chunk) ⇒
Decode the `tlst` (Trigger List) chunk.

Used in Sound Forge by Sonic Foundry

Specifies a list of triggers which can be used to trigger playback of a series of cue points or Playlist entries.

There's a historical bug in dwName (which is in fact an index, and the bug is that it's actually Index-1).

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeFACT"></a>

### AudioWAV.decodeFACT(chunk) ⇒
Decode the fact chunk.

Fact chunks exist in all wave files that are compressed or that have a wave list chunk.
A fact chunk is not required in an uncompressed PCM file that does not have a wave list chunk.

According to the fact chunk's initial specification, the data portion of the fact chunk will contain only one 4-byte number that specifies the number of samples in the data chunk of the Wave file.
This number, when combined with the samples per second value in the format chunk of the Wave file, can be used to compute the length of the audio data in seconds.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**

- [ Fact chunk (of a Wave file)](https://www.recordingblogs.com/wiki/fact-chunk-of-a-wave-file)
- [ Audio File Format Specifications](http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html)


| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodePEAK"></a>

### AudioWAV.decodePEAK(chunk, littleEndian) ⇒
Decode the PEAK chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**: [awesome-wav - WAVFormat.wiki](https://code.google.com/archive/p/awesome-wav/wikis/WAVFormat.wiki)  

| Param | Default | Description |
| --- | --- | --- |
| chunk |  | Data Blob |
| littleEndian | <code>true</code> | True for WAVE, false for AIFF. |

<a name="AudioWAV.decodeDISP"></a>

### AudioWAV.decodeDISP(chunk) ⇒
Decode the DISP (Display) chunk.

The DISP chunk should be used as a direct child of the RIFF chunk so that any RIFF aware application can find it.
There can be multiple DISP chunks with each containing different types of displayable data, but all representative of the same object.
The DISP chunks should be stored in the file in order of preference (just as in the clipboard).

The DISP chunk is especially beneficial when representing OLE data within an application.
For example, when pasting a wave file into Excel, the creating application can use the DISP chunk to associate an icon and a text description to represent the embedded wave file.
This text should be short so that it can be easily displayed in menu bars and under icons.
Note: do not use a CF_TEXT for a description of the data.
Bibliographic data chunks will be added to support the standard MARC (Machine Readable Cataloging) data.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**

- [New Multimedia Data Types and Data Techniques](http://netghost.narod.ru/gff/vendspec/micriff/ms_riff.txt)
- [Standard Clipboard Formats](https://docs.microsoft.com/en-us/windows/win32/dataxchg/standard-clipboard-formats)


| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeACID"></a>

### AudioWAV.decodeACID(chunk) ⇒
ACID Loop File Format

 They were originally created for use with Acid, the loop-based, music-sequencing software, created by Sonic Foundry in 1998.

 "Acidized" loops contain tempo and key information, so that Acid and other programs that can read the "acidization" can properly time stretch and pitch shift them.

 Although the phrase "ACID loops" technically only refers to loops which have been "acidized", some people use the term to refer to loops in general, even when used with other software packages.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeINST"></a>

### AudioWAV.decodeINST(chunk) ⇒
Decode the inst (Instrumet) chunk.

When a wave file is used as wave samples in a MIDI synthesizer,
the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeSMPL"></a>

### AudioWAV.decodeSMPL(chunk) ⇒
Decode the smpl (Sample) chunk.

The sample chunk allows a MIDI sampler to use the Wave file as a collection of samples.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeRLND"></a>

### AudioWAV.decodeRLND(chunk) ⇒
Decode the RLND (Roland) chunk.

Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.

This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.encodeRLND"></a>

### AudioWAV.encodeRLND(data) ⇒
Enocdes JSON values to a valid `RLND` (Roland) chunk Buffer.

Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.

The unknown value may be an unsigned 32bit integer.

This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The new RLND chunk.  
**See**: [SP-404SX Support Page](https://www.roland.com/global/support/by_product/sp-404sx/updates_drivers/)  

| Param | Description |
| --- | --- |
| data | The JSON values to set in the RLND chunk. |
| data.device | An 8 character string representing the device label. SP-404SX Wave Converter v1.01 on macOS sets this value to `roifspsx`. |
| data.unknown1 | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x04`. |
| data.unknown2 | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`. |
| data.unknown3 | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`. |
| data.unknown4 | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`. |
| data.sampleIndex | The pad the sample plays on, between `0` and `119` as a number or the pad label, `A1` - `J12`. Only the SP404SX (device === `roifspsx`) provided values can be converted from string corrently, and if it is not found it will defailt to `0` / `A1`. |

<a name="AudioWAV.decodeJUNK"></a>

### AudioWAV.decodeJUNK(chunk, options)
Decode the JUNK (Padding) chunk.

To align RIFF chunks to certain boundaries (i.e. 2048 bytes for CD-ROMs) the RIFF specification includes a JUNK chunk.
The contents are to be skipped when reading.
When writing RIFFs, JUNK chunks should not have an odd Size.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |
| options | Decoding options. |
| options.roundOddChunks | When true we will round odd chunk sizes up to keep in spec. |

<a name="AudioWAV.decodePAD"></a>

### AudioWAV.decodePAD(chunk)
Decode the `PAD ` (Padding) chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeBEXT"></a>

### AudioWAV.decodeBEXT(chunk, options) ⇒
Decode the bext (Broadcast Wave Format (BWF) Broadcast Extension) chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**

- [Cue Chunk](https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue)
- [Spec](https://tech.ebu.ch/docs/tech/tech3285.pdf)


| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |
| options |  | Decoding options. |
| options.roundOddChunks |  | Retained for API compatibility; alignment is handled by the container, not included in the decoded size. |

<a name="AudioWAV.decodeCue"></a>

### AudioWAV.decodeCue(chunk) ⇒
Decode the 'cue ' (Cue Points) chunk.

A cue chunk specifies one or more sample offsets which are often used to mark noteworthy sections of audio.
For example, the beginning and end of a verse in a song may have cue points to make them easier to find.
The cue chunk is optional and if included, a single cue chunk should specify all cue points for the "WAVE" chunk.
No more than one cue chunk is allowed in a "WAVE" chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**: [Cue Chunk](https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeResU"></a>

### AudioWAV.decodeResU(chunk, options) ⇒
Decode the 'ResU' chunk, zlib-compressed JSON data containing Time Signature, Tempo and other data for Logic Pro X.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |
| options | Decompression limits. |
| options.maxResUSize | Maximum uncompressed JSON bytes, default 16 MiB. |

<a name="AudioWAV.decodeDS64"></a>

### AudioWAV.decodeDS64(chunk) ⇒
DataSize 64 Parsing

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**: [RF64: An extended File Format for Audio](https://tech.ebu.ch/docs/tech/tech3306v1_0.pdf)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeSTRC"></a>

### AudioWAV.decodeSTRC(chunk) ⇒
Decode the STRC (ACID Related) chunk.

When a wave file is used as wave samples in a MIDI synthesizer,
the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeCOMM"></a>

### AudioWAV.decodeCOMM(chunk) ⇒
Decode the COMM (Common) chunk.
The Common Chunk describes fundamental parameters of the sampled sound.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**: [Audio File Format Specifications](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeSSND"></a>

### AudioWAV.decodeSSND(chunk) ⇒
Decode the SSND (Sound Data) chunk.

Offset:     4 bytes
Block Size: 4 bytes
Sound Data: n bytes

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**: [Audio File Format Specifications](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioWAV.decodeFVER"></a>

### AudioWAV.decodeFVER(chunk) ⇒
Decode the FVER (Format Vers) chunk.

The Format Version Chunk contains a date field to indicate the format rules for an AIFF-C specification.
The timestamp holds the number of seconds since January 1, 1904.
The FVER chunk appears only in AIFF-C files.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: The decoded values.  
**See**: [Audio File Format Specifications](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="WAVE_FORMAT_TAGS"></a>

## WAVE\_FORMAT\_TAGS
Maps the registered WAVE format tags (the `fmt ` chunk's audio format code) to their human-readable names.

**Kind**: global constant  
**See**: [WAVE Format Tags](https://www.recordingblogs.com/wiki/format-chunk-of-a-wave-file)  
<a name="WAVE_CHANNEL_MASK_LABELS"></a>

## WAVE\_CHANNEL\_MASK\_LABELS
Maps a single-bit WAVE_FORMAT_EXTENSIBLE channel mask to its speaker label.

**Kind**: global constant  
**See**: [Extensible Wave Format Descriptors](https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/extensible-wave-format-descriptors)  
<a name="debug"></a>

## debug()
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global function  
<a name="rolandPads"></a>

## rolandPads()
The Roland SP-404SX pad labels in sample-index order: pads `A1`–`J12` across banks `A`–`J`, twelve pads per bank.
The array index is the sample index (`0`–`119`) and the value is the pad label, so it serves both decode (index to label) and encode (label to index via `indexOf`).
Wrapped so the unused table can be dropped; a bare `flatMap` call is a side effect to bundlers.

**Kind**: global function  
<a name="AudioWAV."></a>

## AudioWAV.()
Combine unsigned 64-bit words only when JavaScript can represent the result exactly.

**Kind**: global function  
<a name="AudioWAV."></a>

## AudioWAV.()
Restrict a standalone decoder to its declared payload, excluding padding and later chunks.

**Kind**: global function  
<a name="AudioWAV."></a>

## AudioWAV.()
Validate integer writer fields without allocating a temporary validation table.

**Kind**: global function  
<a name="AudioWAV."></a>

## AudioWAV.()
Check count-derived ranges before allocating objects or entering a loop.

**Kind**: global function  
