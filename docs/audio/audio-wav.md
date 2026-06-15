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
<dt><a href="#WAVE_FORMAT_TAGS">WAVE_FORMAT_TAGS</a> : <code>Record.&lt;number, string&gt;</code></dt>
<dd><p>Maps the registered WAVE format tags (the <code>fmt </code> chunk&#39;s audio format code) to their human-readable names.</p>
</dd>
<dt><a href="#WAVE_CHANNEL_MASK_LABELS">WAVE_CHANNEL_MASK_LABELS</a> : <code>Record.&lt;number, string&gt;</code></dt>
<dd><p>Maps a single-bit WAVE_FORMAT_EXTENSIBLE channel mask to its speaker label.</p>
</dd>
<dt><a href="#ROLAND_SP404SX_PADS">ROLAND_SP404SX_PADS</a> : <code>Array.&lt;string&gt;</code></dt>
<dd><p>The Roland SP-404SX pad labels in sample-index order: pads <code>A1</code>–<code>J12</code> across banks <code>A</code>–<code>J</code>, twelve pads per bank.
The array index is the sample index (<code>0</code>–<code>119</code>) and the value is the pad label, so it serves both decode (index to label) and encode (label to index via <code>indexOf</code>).</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a> : <code><a href="#DebugLogger">DebugLogger</a></code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#DebugLogger">DebugLogger</a> : <code>function</code></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
<dt><a href="#WavHeader">WavHeader</a> : <code>object</code></dt>
<dd><p>A decoded WAV / AIFF file header.</p>
</dd>
<dt><a href="#WavFormat">WavFormat</a> : <code>object</code></dt>
<dd><p>A decoded <code>fmt </code> (format) chunk. Fields after <code>bitsPerSample</code> are only present for extended / extensible formats.</p>
</dd>
<dt><a href="#WavListInfo">WavListInfo</a> : <code>object</code></dt>
<dd><p>A single entry from a LIST <code>INFO</code> chunk.</p>
</dd>
<dt><a href="#WavListAdtl">WavListAdtl</a> : <code>object</code></dt>
<dd><p>A single entry from a LIST <code>adtl</code> (associated data list) chunk.</p>
</dd>
<dt><a href="#WavCuePoint">WavCuePoint</a> : <code>object</code></dt>
<dd><p>A single cue point from a <code>cue </code> chunk.</p>
</dd>
<dt><a href="#WavCue">WavCue</a> : <code>object</code></dt>
<dd><p>A decoded <code>cue </code> chunk.</p>
</dd>
<dt><a href="#WavResU">WavResU</a> : <code>object</code></dt>
<dd><p>A decoded <code>ResU</code> chunk (zlib-compressed JSON used by Logic Pro X).</p>
</dd>
<dt><a href="#WavChunk">WavChunk</a> : <code>object</code></dt>
<dd><p>A parsed chunk entry stored on <a href="#AudioWAV+chunks">chunks</a>.</p>
</dd>
<dt><a href="#WavData">WavData</a> : <code>object</code></dt>
<dd><p>A decoded <code>data</code> chunk value (the audio payload itself is not retained, only its computed duration).</p>
</dd>
<dt><a href="#WavList">WavList</a> : <code>object</code></dt>
<dd><p>A decoded <code>LIST</code> chunk.</p>
</dd>
<dt><a href="#WavTriggerList">WavTriggerList</a> : <code>object</code></dt>
<dd><p>A decoded <code>tlst</code> (Trigger List) chunk.</p>
</dd>
<dt><a href="#WavFact">WavFact</a> : <code>object</code></dt>
<dd><p>A decoded <code>fact</code> chunk.</p>
</dd>
<dt><a href="#WavPeak">WavPeak</a> : <code>object</code></dt>
<dd><p>A decoded <code>PEAK</code> chunk.</p>
</dd>
<dt><a href="#WavDisplay">WavDisplay</a> : <code>object</code></dt>
<dd><p>A decoded <code>DISP</code> (Display) chunk.</p>
</dd>
<dt><a href="#WavAcid">WavAcid</a> : <code>object</code></dt>
<dd><p>A decoded <code>acid</code> (ACID Loop) chunk.</p>
</dd>
<dt><a href="#WavInstrument">WavInstrument</a> : <code>object</code></dt>
<dd><p>A decoded <code>inst</code> (Instrument) chunk.</p>
</dd>
<dt><a href="#WavSampleLoop">WavSampleLoop</a> : <code>object</code></dt>
<dd><p>A single sample loop entry from a <code>smpl</code> chunk.</p>
</dd>
<dt><a href="#WavSample">WavSample</a> : <code>object</code></dt>
<dd><p>A decoded <code>smpl</code> (Sample) chunk.</p>
</dd>
<dt><a href="#WavRoland">WavRoland</a> : <code>object</code></dt>
<dd><p>A decoded <code>RLND</code> (Roland) chunk.</p>
</dd>
<dt><a href="#WavBext">WavBext</a> : <code>object</code></dt>
<dd><p>A decoded <code>bext</code> (Broadcast Wave Format extension) chunk.</p>
</dd>
<dt><a href="#WavDS64TableEntry">WavDS64TableEntry</a> : <code>object</code></dt>
<dd><p>A single table entry from a <code>ds64</code> chunk.</p>
</dd>
<dt><a href="#WavDS64">WavDS64</a> : <code>object</code></dt>
<dd><p>A decoded <code>ds64</code> (DataSize 64) chunk used by RF64 files.</p>
</dd>
<dt><a href="#WavStrcSlice">WavStrcSlice</a> : <code>object</code></dt>
<dd><p>A single slice entry from a <code>strc</code> chunk.</p>
</dd>
<dt><a href="#WavStrc">WavStrc</a> : <code>object</code></dt>
<dd><p>A decoded <code>strc</code> (ACID-related) chunk.</p>
</dd>
<dt><a href="#AiffCommon">AiffCommon</a> : <code>object</code></dt>
<dd><p>A decoded AIFF <code>COMM</code> (Common) chunk.</p>
</dd>
<dt><a href="#AiffSoundData">AiffSoundData</a> : <code>object</code></dt>
<dd><p>A decoded AIFF <code>SSND</code> (Sound Data) chunk.</p>
</dd>
<dt><a href="#AiffFormatVersion">AiffFormatVersion</a> : <code>object</code></dt>
<dd><p>A decoded AIFF-C <code>FVER</code> (Format Version) chunk.</p>
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
    * [new AudioWAV(input, [opts])](#new_AudioWAV_new)
    * _instance_
        * [.chunks](#AudioWAV+chunks) : [<code>Array.&lt;WavChunk&gt;</code>](#WavChunk)
        * [.parse()](#AudioWAV+parse)
        * [.decodeChunk()](#AudioWAV+decodeChunk) ⇒ <code>string</code>
    * _static_
        * [.fromFile(data, [options])](#AudioWAV.fromFile) ⇒ [<code>AudioWAV</code>](#AudioWAV)
        * [.fromBuffer(buffer, [options])](#AudioWAV.fromBuffer) ⇒ [<code>AudioWAV</code>](#AudioWAV)
        * [.decodeHeader(chunk)](#AudioWAV.decodeHeader) ⇒ [<code>WavHeader</code>](#WavHeader)
        * [.encodeHeader(data)](#AudioWAV.encodeHeader) ⇒ <code>Buffer</code>
        * [.decodeFMT(chunk)](#AudioWAV.decodeFMT) ⇒ [<code>WavFormat</code>](#WavFormat)
        * [.encodeFMT([data])](#AudioWAV.encodeFMT) ⇒ <code>Buffer</code>
        * [.decodeLIST(chunk)](#AudioWAV.decodeLIST) ⇒ [<code>WavList</code>](#WavList)
        * [.decodeLISTINFO(buffer)](#AudioWAV.decodeLISTINFO) ⇒ [<code>Array.&lt;WavListInfo&gt;</code>](#WavListInfo)
        * [.decodeLISTadtl(buffer)](#AudioWAV.decodeLISTadtl) ⇒ [<code>Array.&lt;WavListAdtl&gt;</code>](#WavListAdtl)
        * [.decodeDATA(chunk)](#AudioWAV.decodeDATA)
        * [.decodeTLST(chunk)](#AudioWAV.decodeTLST) ⇒ [<code>WavTriggerList</code>](#WavTriggerList)
        * [.decodeFACT(chunk)](#AudioWAV.decodeFACT) ⇒ [<code>WavFact</code>](#WavFact)
        * [.decodePEAK(chunk)](#AudioWAV.decodePEAK) ⇒ [<code>WavPeak</code>](#WavPeak)
        * [.decodeDISP(chunk)](#AudioWAV.decodeDISP) ⇒ [<code>WavDisplay</code>](#WavDisplay)
        * [.decodeACID(chunk)](#AudioWAV.decodeACID) ⇒ [<code>WavAcid</code>](#WavAcid)
        * [.decodeINST(chunk)](#AudioWAV.decodeINST) ⇒ [<code>WavInstrument</code>](#WavInstrument)
        * [.decodeSMPL(chunk)](#AudioWAV.decodeSMPL) ⇒ [<code>WavSample</code>](#WavSample)
        * [.decodeRLND(chunk)](#AudioWAV.decodeRLND) ⇒ [<code>WavRoland</code>](#WavRoland)
        * [.encodeRLND(data)](#AudioWAV.encodeRLND) ⇒ <code>Buffer.&lt;ArrayBuffer&gt;</code>
        * [.decodeJUNK(chunk, options)](#AudioWAV.decodeJUNK)
        * [.decodePAD(chunk)](#AudioWAV.decodePAD)
        * [.decodeBEXT(chunk, options)](#AudioWAV.decodeBEXT) ⇒ [<code>WavBext</code>](#WavBext)
        * [.decodeCue(chunk)](#AudioWAV.decodeCue) ⇒ [<code>WavCue</code>](#WavCue)
        * [.decodeResU(chunk)](#AudioWAV.decodeResU) ⇒ [<code>WavResU</code>](#WavResU)
        * [.decodeDS64(chunk)](#AudioWAV.decodeDS64) ⇒ [<code>WavDS64</code>](#WavDS64)
        * [.decodeSTRC(chunk)](#AudioWAV.decodeSTRC) ⇒ [<code>WavStrc</code>](#WavStrc)
        * [.decodeCOMM(chunk)](#AudioWAV.decodeCOMM) ⇒ [<code>AiffCommon</code>](#AiffCommon)
        * [.decodeSSND(chunk)](#AudioWAV.decodeSSND) ⇒ [<code>AiffSoundData</code>](#AiffSoundData)
        * [.decodeFVER(chunk)](#AudioWAV.decodeFVER) ⇒ [<code>AiffFormatVersion</code>](#AiffFormatVersion)

<a name="new_AudioWAV_new"></a>

### new AudioWAV(input, [opts])
Creates a new AudioWAV.


| Param | Type | Description |
| --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> | The data to process. |
| [opts] | <code>object</code> | Options for this AudioWAV instance. |

**Example** *(AudioWAV)*  
```js
const data = fs.readFileSync('./audio.wav');
const file = AudioWAV.fromFile(data);
console.log('Chunks:', file.chunks);
```
<a name="AudioWAV+chunks"></a>

### audioWAV.chunks : [<code>Array.&lt;WavChunk&gt;</code>](#WavChunk)
**Kind**: instance property of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+parse"></a>

### audioWAV.parse()
Parse the WAV file, decoding the supported chunks.

**Kind**: instance method of [<code>AudioWAV</code>](#AudioWAV)  
<a name="AudioWAV+decodeChunk"></a>

### audioWAV.decodeChunk() ⇒ <code>string</code>
Decodes the chunk type, and attempts to parse that chunk if supported.
Supported Chunk Types: `fmt `, `fact`, `inst`, `DISP`, `smpl`, `tlst`, `data`, `LIST`, `RLND`, `JUNK`, `acid`, `cue `, `bext`, `ResU`, `ds64`, `cart`

Chunk Structure:
Length: 4 bytes (integer)
Type:   4 bytes (string)
Chunk:  {length} bytes

**Kind**: instance method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: <code>string</code> - Chunk Type  
**Throws**:

- <code>Error</code> Invalid Chunk Length when less than 0

<a name="AudioWAV.fromFile"></a>

### AudioWAV.fromFile(data, [options]) ⇒ [<code>AudioWAV</code>](#AudioWAV)
Creates a new AudioWAV from file data.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>AudioWAV</code>](#AudioWAV) - the new AudioWAV instance for the provided file data  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> | The data of the file to process. |
| [options] | <code>object</code> | Options for returned AudioWAV instance. |

<a name="AudioWAV.fromBuffer"></a>

### AudioWAV.fromBuffer(buffer, [options]) ⇒ [<code>AudioWAV</code>](#AudioWAV)
Creates a new AudioWAV from a DataBuffer.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>AudioWAV</code>](#AudioWAV) - the new AudioWAV instance for the provided DataBuffer  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | The DataBuffer of the file to process. |
| [options] | <code>object</code> | Options for returned AudioWAV instance. |

<a name="AudioWAV.decodeHeader"></a>

### AudioWAV.decodeHeader(chunk) ⇒ [<code>WavHeader</code>](#WavHeader)
Decodes and validates WAV Header.
Checks for `RIFF` / `RF64` / `BW64` header, reads the size, and then checks for the `WAVE` header.

Signature (Decimal): [82, 73, 70, 70, ..., ..., ..., ..., 87, 65, 86, 69]
Signature (Hexadecimal): [52, 49, 46, 46, ..., ..., ..., ..., 57, 41, 56, 45]
Signature (ASCII): [R, I, F, F, ..., ..., ..., ..., W, A, V, E]

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavHeader</code>](#WavHeader) - The decoded values.  
**Throws**:

- <code>Error</code> Invalid WAV header


| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> | The data to process. |

<a name="AudioWAV.encodeHeader"></a>

### AudioWAV.encodeHeader(data) ⇒ <code>Buffer</code>
Enocdes JSON values to a valid Wave Header chunk Buffer.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: <code>Buffer</code> - The newley encoded header chunk.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | The values to encode to the header chunk chunk. |
| [data.riff] | <code>string</code> | RIFF Header, should contains the string `RIFF`, `RF64`, or `BW64` in ASCII form. |
| data.size | <code>number</code> | This is the size of the entire file in bytes minus 8 bytes for the 2 fields not included in this count. RF64 sets this to -1 = 0xFFFFFFFF as it doesn't use this to support larger sizes in the DS64 chunk. |
| [data.format] | <code>string</code> | WAVE Header, the string `WAVE` in ASCII form. |

<a name="AudioWAV.decodeFMT"></a>

### AudioWAV.decodeFMT(chunk) ⇒ [<code>WavFormat</code>](#WavFormat)
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
**Returns**: [<code>WavFormat</code>](#WavFormat) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.encodeFMT"></a>

### AudioWAV.encodeFMT([data]) ⇒ <code>Buffer</code>
Enocdes JSON values to a valid `fmt ` chunk Buffer.

Defaults are set to Red Book Compact Disc Digital Audio (CDDA or CD-DA) / Audio CD standards.

RF64 specific fields are currently unsupported.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: <code>Buffer</code> - The newley encoded `fmt ` chunk.  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | The values to encode to the `fmt ` chunk. |
| [data.audioFormatValue] | <code>number</code> | Format of the audio data, 1 is PCM and values other than 1 indicate some form of compression. See `decodeFMT` for a listing |
| [data.channels] | <code>number</code> | Mono = 1, Stereo = 2, etc. |
| [data.sampleRate] | <code>number</code> | 8000, 44100, 96000, etc. |
| [data.byteRate] | <code>number</code> | Sample Rate * Channels * Bits per Sample / 8 |
| [data.blockAlign] | <code>number</code> | The number of bytes for one sample including all channels. Channels * Bits per Sample / 8 |
| [data.bitsPerSample] | <code>number</code> | 8 bits = 8, 16 bits = 16, etc. |
| [data.extraParamSize] | <code>number</code> | The size of the extra paramteres to follow, or 0. |
| [data.extraParams] | <code>number</code> | Any extra data to encode. |

<a name="AudioWAV.decodeLIST"></a>

### AudioWAV.decodeLIST(chunk) ⇒ [<code>WavList</code>](#WavList)
Decode the LIST (LIST Information) chunk.

A LIST chunk defines a list of sub-chunks and has the following format.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavList</code>](#WavList) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeLISTINFO"></a>

### AudioWAV.decodeLISTINFO(buffer) ⇒ [<code>Array.&lt;WavListInfo&gt;</code>](#WavListInfo)
Decode the LIST INFO chunks.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>Array.&lt;WavListInfo&gt;</code>](#WavListInfo) - The parsed list.  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | List DataBuffer |

<a name="AudioWAV.decodeLISTadtl"></a>

### AudioWAV.decodeLISTadtl(buffer) ⇒ [<code>Array.&lt;WavListAdtl&gt;</code>](#WavListAdtl)
Decode the LIST adtl chunks.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>Array.&lt;WavListAdtl&gt;</code>](#WavListAdtl) - The parsed list.  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | List DataBuffer |

<a name="AudioWAV.decodeDATA"></a>

### AudioWAV.decodeDATA(chunk)
Decode the data (Audio Data) chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeTLST"></a>

### AudioWAV.decodeTLST(chunk) ⇒ [<code>WavTriggerList</code>](#WavTriggerList)
Decode the `tlst` (Trigger List) chunk.

Used in Sound Forge by Sonic Foundry

Specifies a list of triggers which can be used to trigger playback of a series of cue points or Playlist entries.

There's a historical bug in dwName (which is in fact an index, and the bug is that it's actually Index-1).

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavTriggerList</code>](#WavTriggerList) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeFACT"></a>

### AudioWAV.decodeFACT(chunk) ⇒ [<code>WavFact</code>](#WavFact)
Decode the fact chunk.

Fact chunks exist in all wave files that are compressed or that have a wave list chunk.
A fact chunk is not required in an uncompressed PCM file that does not have a wave list chunk.

According to the fact chunk's initial specification, the data portion of the fact chunk will contain only one 4-byte number that specifies the number of samples in the data chunk of the Wave file.
This number, when combined with the samples per second value in the format chunk of the Wave file, can be used to compute the length of the audio data in seconds.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavFact</code>](#WavFact) - The decoded values.  
**See**

- [ Fact chunk (of a Wave file)](https://www.recordingblogs.com/wiki/fact-chunk-of-a-wave-file)
- [ Audio File Format Specifications](http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html)


| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodePEAK"></a>

### AudioWAV.decodePEAK(chunk) ⇒ [<code>WavPeak</code>](#WavPeak)
Decode the PEAK chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavPeak</code>](#WavPeak) - The decoded values.  
**See**: [awesome-wav - WAVFormat.wiki](https://code.google.com/archive/p/awesome-wav/wikis/WAVFormat.wiki)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeDISP"></a>

### AudioWAV.decodeDISP(chunk) ⇒ [<code>WavDisplay</code>](#WavDisplay)
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
**Returns**: [<code>WavDisplay</code>](#WavDisplay) - The decoded values.  
**See**

- [New Multimedia Data Types and Data Techniques](http://netghost.narod.ru/gff/vendspec/micriff/ms_riff.txt)
- [Standard Clipboard Formats](https://docs.microsoft.com/en-us/windows/win32/dataxchg/standard-clipboard-formats)


| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeACID"></a>

### AudioWAV.decodeACID(chunk) ⇒ [<code>WavAcid</code>](#WavAcid)
ACID Loop File Format

 They were originally created for use with Acid, the loop-based, music-sequencing software, created by Sonic Foundry in 1998.

 "Acidized" loops contain tempo and key information, so that Acid and other programs that can read the "acidization" can properly time stretch and pitch shift them.

 Although the phrase "ACID loops" technically only refers to loops which have been "acidized", some people use the term to refer to loops in general, even when used with other software packages.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavAcid</code>](#WavAcid) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeINST"></a>

### AudioWAV.decodeINST(chunk) ⇒ [<code>WavInstrument</code>](#WavInstrument)
Decode the inst (Instrumet) chunk.

When a wave file is used as wave samples in a MIDI synthesizer,
the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavInstrument</code>](#WavInstrument) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeSMPL"></a>

### AudioWAV.decodeSMPL(chunk) ⇒ [<code>WavSample</code>](#WavSample)
Decode the smpl (Sample) chunk.

The sample chunk allows a MIDI sampler to use the Wave file as a collection of samples.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavSample</code>](#WavSample) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeRLND"></a>

### AudioWAV.decodeRLND(chunk) ⇒ [<code>WavRoland</code>](#WavRoland)
Decode the RLND (Roland) chunk.

Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.

This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavRoland</code>](#WavRoland) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.encodeRLND"></a>

### AudioWAV.encodeRLND(data) ⇒ <code>Buffer.&lt;ArrayBuffer&gt;</code>
Enocdes JSON values to a valid `RLND` (Roland) chunk Buffer.

Useful for use on SP-404 / SP-404SX / SP-404A samplers, perhaps others.

The unknown value may be an unsigned 32bit integer.

This chunk is sized and padded with zeros to ensure that the the sample data starts exactly at offset 512.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: <code>Buffer.&lt;ArrayBuffer&gt;</code> - The new RLND chunk.  
**See**: [SP-404SX Support Page](https://www.roland.com/global/support/by_product/sp-404sx/updates_drivers/)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | The JSON values to set in the RLND chunk. |
| data.device | <code>string</code> | An 8 character string representing the device label. SP-404SX Wave Converter v1.01 on macOS sets this value to `roifspsx`. |
| [data.unknown1] | <code>number</code> | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x04`. |
| [data.unknown2] | <code>number</code> | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`. |
| [data.unknown3] | <code>number</code> | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`. |
| [data.unknown4] | <code>number</code> | Unknown, SP-404SX Wave Converter v1.01 on macOS sets this value to `0x00`. |
| data.sampleIndex | <code>number</code> \| <code>string</code> | The pad the sample plays on, between `0` and `119` as a number or the pad label, `A1` - `J12`. Only the SP404SX (device === `roifspsx`) provided values can be converted from string corrently, and if it is not found it will defailt to `0` / `A1`. |

<a name="AudioWAV.decodeJUNK"></a>

### AudioWAV.decodeJUNK(chunk, options)
Decode the JUNK (Padding) chunk.

To align RIFF chunks to certain boundaries (i.e. 2048 bytes for CD-ROMs) the RIFF specification includes a JUNK chunk.
The contents are to be skipped when reading.
When writing RIFFs, JUNK chunks should not have an odd Size.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |
| options | <code>object</code> | Decoding options. |
| options.roundOddChunks | <code>boolean</code> | When true we will round odd chunk sizes up to keep in spec. |

<a name="AudioWAV.decodePAD"></a>

### AudioWAV.decodePAD(chunk)
Decode the `PAD ` (Padding) chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeBEXT"></a>

### AudioWAV.decodeBEXT(chunk, options) ⇒ [<code>WavBext</code>](#WavBext)
Decode the bext (Broadcast Wave Format (BWF) Broadcast Extension) chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavBext</code>](#WavBext) - The decoded values.  
**See**

- [Cue Chunk](https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue)
- [Spec](https://tech.ebu.ch/docs/tech/tech3285.pdf)


| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |
| options | <code>object</code> | Decoding options. |
| options.roundOddChunks | <code>boolean</code> | When true we will round odd chunk sizes up to keep in spec. |

<a name="AudioWAV.decodeCue"></a>

### AudioWAV.decodeCue(chunk) ⇒ [<code>WavCue</code>](#WavCue)
Decode the 'cue ' (Cue Points) chunk.

A cue chunk specifies one or more sample offsets which are often used to mark noteworthy sections of audio.
For example, the beginning and end of a verse in a song may have cue points to make them easier to find.
The cue chunk is optional and if included, a single cue chunk should specify all cue points for the "WAVE" chunk.
No more than one cue chunk is allowed in a "WAVE" chunk.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavCue</code>](#WavCue) - The decoded values.  
**See**: [Cue Chunk](https://sites.google.com/site/musicgapi/technical-documents/wav-file-format#cue)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeResU"></a>

### AudioWAV.decodeResU(chunk) ⇒ [<code>WavResU</code>](#WavResU)
Decode the 'ResU' chunk, a ZIP compressed JSON Data containg Time Signature, Tempo and other data for Logic Pro X.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavResU</code>](#WavResU) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeDS64"></a>

### AudioWAV.decodeDS64(chunk) ⇒ [<code>WavDS64</code>](#WavDS64)
DataSize 64 Parsing

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavDS64</code>](#WavDS64) - The decoded values.  
**See**: [RF64: An extended File Format for Audio](https://tech.ebu.ch/docs/tech/tech3306v1_0.pdf)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeSTRC"></a>

### AudioWAV.decodeSTRC(chunk) ⇒ [<code>WavStrc</code>](#WavStrc)
Decode the STRC (ACID Related) chunk.

When a wave file is used as wave samples in a MIDI synthesizer,
the instrument chunk helps the MIDI synthesizer define the sample pitch & relative volume of the samples.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>WavStrc</code>](#WavStrc) - The decoded values.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeCOMM"></a>

### AudioWAV.decodeCOMM(chunk) ⇒ [<code>AiffCommon</code>](#AiffCommon)
Decode the COMM (Common) chunk.
The Common Chunk describes fundamental parameters of the sampled sound.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>AiffCommon</code>](#AiffCommon) - The decoded values.  
**See**: [Audio File Format Specifications](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeSSND"></a>

### AudioWAV.decodeSSND(chunk) ⇒ [<code>AiffSoundData</code>](#AiffSoundData)
Decode the SSND (Sound Data) chunk.

Offset:     4 bytes
Block Size: 4 bytes
Sound Data: n bytes

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>AiffSoundData</code>](#AiffSoundData) - The decoded values.  
**See**: [Audio File Format Specifications](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="AudioWAV.decodeFVER"></a>

### AudioWAV.decodeFVER(chunk) ⇒ [<code>AiffFormatVersion</code>](#AiffFormatVersion)
Decode the FVER (Format Vers) chunk.

The Format Version Chunk contains a date field to indicate the format rules for an AIFF-C specification.
The timestamp holds the number of seconds since January 1, 1904.
The FVER chunk appears only in AIFF-C files.

**Kind**: static method of [<code>AudioWAV</code>](#AudioWAV)  
**Returns**: [<code>AiffFormatVersion</code>](#AiffFormatVersion) - The decoded values.  
**See**: [Audio File Format Specifications](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>string</code> \| <code>Buffer</code> \| <code>Uint8Array</code> | Data Blob |

<a name="WAVE_FORMAT_TAGS"></a>

## WAVE\_FORMAT\_TAGS : <code>Record.&lt;number, string&gt;</code>
Maps the registered WAVE format tags (the `fmt ` chunk's audio format code) to their human-readable names.

**Kind**: global constant  
**See**: [WAVE Format Tags](https://www.recordingblogs.com/wiki/format-chunk-of-a-wave-file)  
<a name="WAVE_CHANNEL_MASK_LABELS"></a>

## WAVE\_CHANNEL\_MASK\_LABELS : <code>Record.&lt;number, string&gt;</code>
Maps a single-bit WAVE_FORMAT_EXTENSIBLE channel mask to its speaker label.

**Kind**: global constant  
**See**: [Extensible Wave Format Descriptors](https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/extensible-wave-format-descriptors)  
<a name="ROLAND_SP404SX_PADS"></a>

## ROLAND\_SP404SX\_PADS : <code>Array.&lt;string&gt;</code>
The Roland SP-404SX pad labels in sample-index order: pads `A1`–`J12` across banks `A`–`J`, twelve pads per bank.
The array index is the sample index (`0`–`119`) and the value is the pad label, so it serves both decode (index to label) and encode (label to index via `indexOf`).

**Kind**: global constant  
<a name="debug"></a>

## debug() : [<code>DebugLogger</code>](#DebugLogger)
**Kind**: global function  
<a name="DebugLogger"></a>

## DebugLogger : <code>function</code>
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | The arguments to log. |

<a name="WavHeader"></a>

## WavHeader : <code>object</code>
A decoded WAV / AIFF file header.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The container ID: `RIFF`, `RF64`, `BW64`, `FORM`, `AIFF`, or `AIFC`. |
| size | <code>number</code> | The declared size of the rest of the file in bytes. |
| format | <code>string</code> | The format ID, e.g. `WAVE`, `AIFF`, or `AIFC`. |
| type | <code>string</code> | The normalized container type: `WAVE` or `AIFF`. |

<a name="WavFormat"></a>

## WavFormat : <code>object</code>
A decoded `fmt ` (format) chunk. Fields after `bitsPerSample` are only present for extended / extensible formats.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `fmt `. |
| size | <code>number</code> | The chunk size in bytes. |
| audioFormatValue | <code>number</code> | The numeric audio format code. |
| audioFormat | <code>string</code> | The human-readable audio format label. |
| channels | <code>number</code> | The number of channels. |
| sampleRate | <code>number</code> | The sample rate in Hz. |
| byteRate | <code>number</code> | The average bytes per second. |
| blockAlign | <code>number</code> | The block alignment (bytes per sample frame). |
| bitsPerSample | <code>number</code> | The number of bits per sample. |
| [extraParamSize] | <code>number</code> | The size of the extended parameter block, when present. |
| [validBitsPerSample] | <code>number</code> | The valid bits per sample (extensible format). |
| [channelMask] | <code>number</code> | The channel mask (extensible format). |
| [channelMaskLabel] | <code>string</code> | The human-readable channel mask label. |
| [subFormat_1] | <code>number</code> | The first GUID sub-format field. |
| [subFormat_2] | <code>number</code> | The second GUID sub-format field. |
| [subFormat_3] | <code>number</code> | The third GUID sub-format field. |
| [subFormat_4] | <code>number</code> | The fourth GUID sub-format field. |
| [subFormat_5] | <code>number</code> | The fifth GUID sub-format field. |
| [extraParams] | <code>Uint8Array</code> | The raw extended parameter bytes. |

<a name="WavListInfo"></a>

## WavListInfo : <code>object</code>
A single entry from a LIST `INFO` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The 4-character info ID. |
| size | <code>number</code> | The byte length of the text. |
| text | <code>string</code> | The info text. |

<a name="WavListAdtl"></a>

## WavListAdtl : <code>object</code>
A single entry from a LIST `adtl` (associated data list) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The 4-character sub-chunk ID. |
| size | <code>number</code> | The byte length of the sub-chunk. |
| [label] | <code>string</code> | The label text, for `labl` sub-chunks. |
| [ltxt] | <code>string</code> | The labeled text, for `ltxt` sub-chunks. |

<a name="WavCuePoint"></a>

## WavCuePoint : <code>object</code>
A single cue point from a `cue ` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The unique cue point identifier. |
| position | <code>number</code> | The sample offset of the cue in the play order. |
| chunkID | <code>string</code> | The data chunk ID the cue refers to (`data` or `slnt`). |
| chunkStart | <code>number</code> | The byte offset into the wave list chunk. |
| blockStart | <code>number</code> | The byte offset into the data / slnt chunk. |
| sampleOffset | <code>number</code> | The sample offset within the block. |

<a name="WavCue"></a>

## WavCue : <code>object</code>
A decoded `cue ` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `cue `. |
| size | <code>number</code> | The chunk size in bytes. |
| numberCuePoints | <code>number</code> | The number of cue points that follow. |
| data | [<code>Array.&lt;WavCuePoint&gt;</code>](#WavCuePoint) | The decoded cue points. |

<a name="WavResU"></a>

## WavResU : <code>object</code>
A decoded `ResU` chunk (zlib-compressed JSON used by Logic Pro X).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `ResU`. |
| size | <code>number</code> | The chunk size in bytes. |
| [data] | <code>unknown</code> | The parsed JSON payload, when it could be decompressed and parsed. |

<a name="WavChunk"></a>

## WavChunk : <code>object</code>
A parsed chunk entry stored on [chunks](#AudioWAV+chunks).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | The chunk type label (e.g. `header`, `format`, `data`). |
| [value] | <code>any</code> | The decoded value; the concrete shape depends on `type`. |
| [chunk] | <code>Uint8Array</code> | The raw bytes of the chunk, when retained. |
| [unknown] | <code>boolean</code> | Set when the chunk type is recognized but not decoded. |
| [description] | <code>string</code> | A human-readable note for special / opaque chunks. |

<a name="WavData"></a>

## WavData : <code>object</code>
A decoded `data` chunk value (the audio payload itself is not retained, only its computed duration).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| duration | <code>number</code> | The audio duration in seconds. |

<a name="WavList"></a>

## WavList : <code>object</code>
A decoded `LIST` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `LIST`. |
| size | <code>number</code> | The chunk size in bytes. |
| type | <code>string</code> | The list type, e.g. `INFO` or `adtl`. |
| [data] | [<code>Array.&lt;WavListInfo&gt;</code>](#WavListInfo) \| [<code>Array.&lt;WavListAdtl&gt;</code>](#WavListAdtl) | The parsed sub-list entries. |

<a name="WavTriggerList"></a>

## WavTriggerList : <code>object</code>
A decoded `tlst` (Trigger List) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| list | <code>number</code> | The referenced list (`cue` or `playlist`). |
| name | <code>string</code> | The cue point name / playlist entry index. |
| type | <code>number</code> | The trigger type (0: SMPTE, 1: MIDI Command, 2: MIDI SysEx). |
| triggerOn1 | <code>number</code> | Trigger value 1 (SMPTE hours / MIDI channel). |
| triggerOn2 | <code>number</code> | Trigger value 2 (SMPTE minutes / MIDI command). |
| triggerOn3 | <code>number</code> | Trigger value 3 (SMPTE seconds / MIDI param 1). |
| triggerOn4 | <code>number</code> | Trigger value 4 (SMPTE frames / MIDI param 2). |
| extra | <code>number</code> | The size of additional information. |
| extraData | <code>number</code> | The additional information value. |
| function | <code>number</code> | The trigger function (0: Play, 1: Stop, 2: Queue). |

<a name="WavFact"></a>

## WavFact : <code>object</code>
A decoded `fact` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| numberOfSamples | <code>number</code> | The number of samples per channel. |

<a name="WavPeak"></a>

## WavPeak : <code>object</code>
A decoded `PEAK` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| version | <code>number</code> | The peak chunk version. |
| timestamp | <code>number</code> | The Unix timestamp of creation. |
| ppeakPointer | <code>number</code> | The pointer to the per-channel PPEAK structs. |
| bitAlign | <code>number</code> | The 64-bit alignment padding. |

<a name="WavDisplay"></a>

## WavDisplay : <code>object</code>
A decoded `DISP` (Display) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>number</code> | The Windows clipboard format identifier. |
| data | <code>number</code> | The display data value. |

<a name="WavAcid"></a>

## WavAcid : <code>object</code>
A decoded `acid` (ACID Loop) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>number</code> | The file type bit mask. |
| rootNote | <code>number</code> | The root note. |
| unknown1 | <code>number</code> | An unknown 16-bit value. |
| unknown2 | <code>number</code> | An unknown 32-bit value. |
| beats | <code>number</code> | The number of beats. |
| meterDenominator | <code>number</code> | The meter denominator (e.g. the 4 in 3/4). |
| meterNumerator | <code>number</code> | The meter numerator (e.g. the 3 in 3/4). |
| tempo | <code>number</code> | The tempo. |

<a name="WavInstrument"></a>

## WavInstrument : <code>object</code>
A decoded `inst` (Instrument) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| unshiftedNote | <code>number</code> | The MIDI note for the sample's original pitch (0-127). |
| fineTuning | <code>number</code> | The fine tuning in cents (-50 to 50). |
| gain | <code>number</code> | The suggested volume in decibels. |
| lowNote | <code>number</code> | The lowest usable MIDI note (0-127). |
| highNote | <code>number</code> | The highest usable MIDI note (0-127). |
| lowVelocity | <code>number</code> | The lowest usable MIDI velocity (0-127). |
| highVelocity | <code>number</code> | The highest usable MIDI velocity (0-127). |

<a name="WavSampleLoop"></a>

## WavSampleLoop : <code>object</code>
A single sample loop entry from a `smpl` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| ID | <code>number</code> | The unique loop ID (may reference a cue point). |
| type | <code>number</code> | The loop type (0: forward, 1: alternating, 2: backward). |
| start | <code>number</code> | The loop start point in samples. |
| end | <code>number</code> | The loop end point in samples. |
| fraction | <code>number</code> | The fine-tune resolution. |
| count | <code>number</code> | The play count (0 means infinite). |

<a name="WavSample"></a>

## WavSample : <code>object</code>
A decoded `smpl` (Sample) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| manufacturer1 | <code>number</code> | Manufacturer code byte 1. |
| manufacturer2 | <code>number</code> | Manufacturer code byte 2. |
| manufacturer3 | <code>number</code> | Manufacturer code byte 3. |
| manufacturer4 | <code>number</code> | Manufacturer code byte 4. |
| product | <code>number</code> | The product / model ID. |
| samplePeriod | <code>number</code> | The period of one sample. |
| midiUnityNote | <code>number</code> | The MIDI note played at the sample's current pitch (0-127). |
| midiPitchFraction | <code>number</code> | The fraction of a semitone up from the unity note. |
| SMPTEFormat | <code>number</code> | The SMPTE format (0, 24, 25, 29, or 30). |
| SMPTEOffset1 | <code>number</code> | SMPTE offset byte 1 (hours). |
| SMPTEOffset2 | <code>number</code> | SMPTE offset byte 2 (minutes). |
| SMPTEOffset3 | <code>number</code> | SMPTE offset byte 3 (seconds). |
| SMPTEOffset4 | <code>number</code> | SMPTE offset byte 4 (frames). |
| sampleLoopsCount | <code>number</code> | The number of sample loops. |
| sampleDataSize | <code>number</code> | The number of bytes of sampler-specific data. |
| sampleLoops | [<code>Array.&lt;WavSampleLoop&gt;</code>](#WavSampleLoop) | The parsed sample loops. |
| [sampleData] | <code>Uint8Array</code> | The optional sampler-specific data. |

<a name="WavRoland"></a>

## WavRoland : <code>object</code>
A decoded `RLND` (Roland) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `RLND`. |
| size | <code>number</code> | The chunk size in bytes. |
| device | <code>string</code> | The 8-character device label (e.g. `roifspsx`). |
| unknown1 | <code>number</code> | An unknown byte. |
| unknown2 | <code>number</code> | An unknown byte. |
| unknown3 | <code>number</code> | An unknown byte. |
| unknown4 | <code>number</code> | An unknown byte. |
| sampleIndex | <code>number</code> | The pad sample index (0-119). |
| sampleLabel | <code>string</code> | The human-readable pad label (`A1` - `J12`). |

<a name="WavBext"></a>

## WavBext : <code>object</code>
A decoded `bext` (Broadcast Wave Format extension) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `bext`. |
| size | <code>number</code> | The chunk size in bytes. |
| [description] | <code>string</code> | The description of the sound sequence. |
| [originator] | <code>string</code> | The name of the originator. |
| [originatorReference] | <code>string</code> | The reference of the originator. |
| [originationDate] | <code>string</code> | The origination date (yyyy:mm:dd). |
| [originationTime] | <code>string</code> | The origination time (hh:mm:ss). |
| [timeReferenceLow] | <code>number</code> | The first sample count since midnight, low word. |
| [timeReferenceHigh] | <code>number</code> | The first sample count since midnight, high word. |
| [version] | <code>number</code> | The BWF version. |
| [umid] | <code>Uint8Array</code> | The SMPTE UMID (64 bytes). |
| [loudnessValue] | <code>number</code> | The integrated loudness value (LUFS x 100). |
| [loudnessRange] | <code>number</code> | The loudness range (LU x 100). |
| [maxTruePeakLevel] | <code>number</code> | The maximum true peak level (dBTP x 100). |
| [maxMomentaryLoudness] | <code>number</code> | The maximum momentary loudness (LUFS x 100). |
| [maxShortTermLoudness] | <code>number</code> | The maximum short-term loudness (LUFS x 100). |
| [reserved] | <code>Uint8Array</code> | 180 reserved bytes. |
| [codingHistory] | <code>Uint8Array</code> | The coding history. |

<a name="WavDS64TableEntry"></a>

## WavDS64TableEntry : <code>object</code>
A single table entry from a `ds64` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The referenced chunk ID. |
| chunkSizeLow | <code>number</code> | The low 4 bytes of the chunk size. |
| chunkSizeHigh | <code>number</code> | The high 4 bytes of the chunk size. |

<a name="WavDS64"></a>

## WavDS64 : <code>object</code>
A decoded `ds64` (DataSize 64) chunk used by RF64 files.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `ds64`. |
| size | <code>number</code> | The chunk size in bytes. |
| riffSizeLow | <code>number</code> | The low 4 bytes of the RF64 block size. |
| riffSizeHigh | <code>number</code> | The high 4 bytes of the RF64 block size. |
| dataSizeLow | <code>number</code> | The low 4 bytes of the data chunk size. |
| dataSizeHigh | <code>number</code> | The high 4 bytes of the data chunk size. |
| sampleCountLow | <code>number</code> | The low 4 bytes of the fact chunk sample count. |
| sampleCountHigh | <code>number</code> | The high 4 bytes of the fact chunk sample count. |
| tableLength | <code>number</code> | The number of valid entries in the table. |
| table | [<code>Array.&lt;WavDS64TableEntry&gt;</code>](#WavDS64TableEntry) | The chunk size table. |

<a name="WavStrcSlice"></a>

## WavStrcSlice : <code>object</code>
A single slice entry from a `strc` chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| header | <code>number</code> | An unknown header value (0 or 2). |
| ID1 | <code>number</code> | A seemingly random ID. |
| samplePositionUpper | <code>number</code> | The upper 32 bits of the slice sample position. |
| samplePositionLower | <code>number</code> | The lower 32 bits of the slice sample position. |
| samplePosition2Upper | <code>number</code> | The upper 32 bits of the secondary sample position. |
| samplePosition2Lower | <code>number</code> | The lower 32 bits of the secondary sample position. |
| data3 | <code>number</code> | An unknown value. |
| ID2 | <code>number</code> | A second seemingly random ID (constant per chunk). |

<a name="WavStrc"></a>

## WavStrc : <code>object</code>
A decoded `strc` (ACID-related) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| unknown1 | <code>number</code> | An unknown value (always 28). |
| numberOfSlices | <code>number</code> | The number of 32-byte slice blocks. |
| unknown2 | <code>number</code> | An unknown value. |
| unknown3 | <code>number</code> | An unknown value. |
| unknown4 | <code>number</code> | An unknown value (always 1). |
| unknown5 | <code>number</code> | An unknown value. |
| unknown6 | <code>number</code> | An unknown value. |
| slices | [<code>Array.&lt;WavStrcSlice&gt;</code>](#WavStrcSlice) | The parsed slices. |

<a name="AiffCommon"></a>

## AiffCommon : <code>object</code>
A decoded AIFF `COMM` (Common) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `COMM`. |
| size | <code>number</code> | The chunk size in bytes. |
| channels | <code>number</code> | The number of channels. |
| sampleFrames | <code>number</code> | The number of sample frames. |
| sampleSize | <code>number</code> | The number of bits per sample point (1-32). |
| sampleRate | <code>number</code> | The sample rate (decoded from an 80-bit extended float). |
| compressionType | <code>string</code> | The AIFF-C compression type, or empty for AIFF. |
| compressionTypeName | <code>string</code> | The AIFF-C compression name, or empty for AIFF. |

<a name="AiffSoundData"></a>

## AiffSoundData : <code>object</code>
A decoded AIFF `SSND` (Sound Data) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `SSND`. |
| size | <code>number</code> | The chunk size in bytes. |
| offset | <code>number</code> | The byte offset to the first sample frame. |
| blockSize | <code>number</code> | The block size used for block-aligning the sound data. |
| soundData | <code>Uint8Array</code> | The sample frames that make up the sound. |

<a name="AiffFormatVersion"></a>

## AiffFormatVersion : <code>object</code>
A decoded AIFF-C `FVER` (Format Version) chunk.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| chunkID | <code>string</code> | The chunk ID, `FVER`. |
| size | <code>number</code> | The chunk size in bytes. |
| timestamp | <code>number</code> | The format version timestamp (seconds since 1904-01-01). |
| versionName | <code>string</code> | The human-readable version name. |

