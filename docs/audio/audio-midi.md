## Classes

<dl>
<dt><a href="#AudioMIDI">AudioMIDI</a> ⇐ <code>DataBuffer</code></dt>
<dd><p>AudioMIDI - MIDI Utility
MIDI File Format Parser &amp; Generator</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#MAX_VARIABLE_LENGTH">MAX_VARIABLE_LENGTH</a></dt>
<dd><p>Standard MIDI File variable-length quantities contain at most four bytes.</p>
</dd>
<dt><a href="#TEXT_ENCODER">TEXT_ENCODER</a></dt>
<dd><p>Text written by this class is UTF-8; invalid UTF-8 input retains its original bytes.</p>
</dd>
<dt><a href="#META_LENGTHS">META_LENGTHS</a></dt>
<dd><p>Fixed-size meta event payloads. Invalid-size payloads are retained as raw bytes.</p>
</dd>
<dt><a href="#MANUFACTURERS">MANUFACTURERS</a></dt>
<dd><p>Manufacturer labels are shared across calls.</p>
</dd>
<dt><a href="#MINOR_KEYS">MINOR_KEYS</a></dt>
<dd><p>Minor key names indexed by the signed number of sharps or flats.</p>
</dd>
<dt><a href="#NOTE_MAP">NOTE_MAP</a></dt>
<dd><p>Default note spellings preserve enharmonic octave crossings.</p>
</dd>
<dt><a href="#NOTE_NAMES">NOTE_NAMES</a></dt>
<dd><p>Default note names, shared by note-label conversions.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
<dt><a href="#decodeLegacyText">decodeLegacyText()</a></dt>
<dd><p>Decode legacy byte-oriented text without discarding or substituting any bytes.</p>
</dd>
</dl>

<a name="AudioMIDI"></a>

## AudioMIDI ⇐ <code>DataBuffer</code>
AudioMIDI - MIDI Utility
MIDI File Format Parser & Generator

**Kind**: global class  
**Extends**: <code>DataBuffer</code>  

* [AudioMIDI](#AudioMIDI) ⇐ <code>DataBuffer</code>
    * [new AudioMIDI([input], [options])](#new_AudioMIDI_new)
    * _instance_
        * [.format](#AudioMIDI+format)
        * [.trackCount](#AudioMIDI+trackCount)
        * [.timeDivision](#AudioMIDI+timeDivision)
        * [.framesPerSecond](#AudioMIDI+framesPerSecond)
        * [.ticksPerFrame](#AudioMIDI+ticksPerFrame)
        * [.chunks](#AudioMIDI+chunks)
        * [.options](#AudioMIDI+options)
        * [.readVariableLengthValues](#AudioMIDI+readVariableLengthValues) ⇒
        * [.parse()](#AudioMIDI+parse)
        * [.addTrack()](#AudioMIDI+addTrack) ⇒ <code>Track</code>
        * [.addEvent(track, event)](#AudioMIDI+addEvent)
        * [.saveToDataBuffer()](#AudioMIDI+saveToDataBuffer) ⇒
        * [.encodeTimeDivision()](#AudioMIDI+encodeTimeDivision)
        * [.writeChunk(dataBuffer, chunk)](#AudioMIDI+writeChunk)
        * [.writeEvent(dataBuffer, event)](#AudioMIDI+writeEvent)
        * [.getUsedNotes()](#AudioMIDI+getUsedNotes) ⇒
        * [.validate()](#AudioMIDI+validate) ⇒ <code>Array.&lt;string&gt;</code>
    * _static_
        * [.encodeEventData(event)](#AudioMIDI.encodeEventData) ⇒
        * [.decodeHeader(chunk)](#AudioMIDI.decodeHeader) ⇒
        * [.getControllerLabel(controller)](#AudioMIDI.getControllerLabel) ⇒
        * [.getManufacturerLabel(manufacturerId)](#AudioMIDI.getManufacturerLabel) ⇒
        * [.writeVariableLengthValue(dataBuffer, value)](#AudioMIDI.writeVariableLengthValue)
        * [.writeEventData(dataBuffer, data)](#AudioMIDI.writeEventData)
        * [.generateTempoEvent(bpm)](#AudioMIDI.generateTempoEvent) ⇒
        * [.generateMetaStringEvent(metaType, data)](#AudioMIDI.generateMetaStringEvent) ⇒
        * [.generateEndOfTrackEvent()](#AudioMIDI.generateEndOfTrackEvent) ⇒
        * [.convertToMidi(options)](#AudioMIDI.convertToMidi) ⇒
        * [.noteToMidi(noteString, [octaveOffset], [noteMap])](#AudioMIDI.noteToMidi) ⇒
        * [.midiToNote(midiValue, [octaveOffset], [noteNames])](#AudioMIDI.midiToNote) ⇒

<a name="new_AudioMIDI_new"></a>

### new AudioMIDI([input], [options])
Creates a new AudioMIDI.


| Param | Type | Description |
| --- | --- | --- |
| [input] | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> | The data to process. |
| [options] | <code>object</code> | Options for this AudioMIDI instance. |
| [options.format] | <code>number</code> | The MIDI format: 0, 1, or 2, default is 0. |
| [options.timeDivision] | <code>number</code> | The indication of how MIDI ticks should be translated into time, default is 480. |

**Example** *(AudioMIDI)*  
```js
const data = fs.readFileSync('./song.mid');
const file = new AudioMIDI(data);
file.parse();
console.log('Chunks:', file.chunks);
```
<a name="AudioMIDI+format"></a>

### audioMIDI.format
The MIDI format: 0, 1, or 2.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+trackCount"></a>

### audioMIDI.trackCount
The internal track count.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+timeDivision"></a>

### audioMIDI.timeDivision
The indication of how MIDI ticks should be translated into time (ticks per quarter note); `0` when the file uses SMPTE timing.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+framesPerSecond"></a>

### audioMIDI.framesPerSecond
The SMPTE frames per second; only set when the file uses SMPTE timing.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+ticksPerFrame"></a>

### audioMIDI.ticksPerFrame
The number of ticks per SMPTE frame; only set when the file uses SMPTE timing.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+chunks"></a>

### audioMIDI.chunks
The parsed (or to-be-written) chunks.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+options"></a>

### audioMIDI.options
The options for the AudioMIDI instance.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+readVariableLengthValues"></a>

### audioMIDI.readVariableLengthValues ⇒
Several different values in events are expressed as variable length quantities (e.g. delta time values).
A variable length value uses a minimum number of bytes to hold the value, and in most circumstances this leads to some degree of data compresssion.

A variable length value uses the low order 7 bits of a byte to represent the value or part of the value.
The high order bit is an "escape" or "continuation" bit.
All but the last byte of a variable length value have the high order bit set.
The last byte has the high order bit cleared.
The bytes always appear most significant byte first.

**Kind**: instance property of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The decoded variable-length quantity.  

| Param | Description |
| --- | --- |
| end | The exclusive read boundary, default is the end of the buffer. |

<a name="AudioMIDI+parse"></a>

### audioMIDI.parse()
Parse a MIDI file from a Uint8Array.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  
**See**

- [ Expanded MIDI 1.0 Messages List (Status Bytes)](https://midi.org/expanded-midi-1-0-messages-list)
- [ MIDI 1.0 Universal System Exclusive Messages](https://midi.org/midi-1-0-universal-system-exclusive-messages)
- [ DLS Proprietary Chunk IDs](https://midi.org/dls-proprietary-chunk-ids)

<a name="AudioMIDI+addTrack"></a>

### audioMIDI.addTrack() ⇒ <code>Track</code>
Adds a new track to the MIDI file.
Keeps [trackCount](#AudioMIDI+trackCount) in sync so the header written by [saveToDataBuffer](#AudioMIDI+saveToDataBuffer) matches the number of chunks.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: <code>Track</code> - The new track.  
<a name="AudioMIDI+addEvent"></a>

### audioMIDI.addEvent(track, event)
Adds an event to a track.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  

| Param | Description |
| --- | --- |
| track | The track to add the event to. |
| event | The event to add. |

<a name="AudioMIDI+saveToDataBuffer"></a>

### audioMIDI.saveToDataBuffer() ⇒
Writes the MIDI data to a binary file.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The binary data buffer.  
<a name="AudioMIDI+encodeTimeDivision"></a>

### audioMIDI.encodeTimeDivision()
Encode either PPQN or the signed SMPTE frame-rate code used in the header.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  
<a name="AudioMIDI+writeChunk"></a>

### audioMIDI.writeChunk(dataBuffer, chunk)
Write a track chunk to the data buffer.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  

| Param | Description |
| --- | --- |
| dataBuffer | The data buffer to write to. |
| chunk | The track chunk to write. |

<a name="AudioMIDI+writeEvent"></a>

### audioMIDI.writeEvent(dataBuffer, event)
Helper function to write an event to the data buffer.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  

| Param | Description |
| --- | --- |
| dataBuffer | The data buffer to write to. |
| event | The event to write. |

<a name="AudioMIDI+getUsedNotes"></a>

### audioMIDI.getUsedNotes() ⇒
Returns a sorted list of all unique note numbers used in "Note On" events,
along with their note names (e.g. "C3", "D#4").

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: Array of note data  
<a name="AudioMIDI+validate"></a>

### audioMIDI.validate() ⇒ <code>Array.&lt;string&gt;</code>
Validate a MIDI instance for common issues.
Matching Note Ons / Offs: A `velocity > 0` "Note On" increments the active count for its port, channel and note. A "Note Off" or "Note On" with `velocity == 0` decrements. If the count is already 0, that is invalid. At the end of the track, if any notes still have a positive count, that is also invalid.
Meta Events: We do a small switch on `event.metaType` to check if the declared metaEventLength is correct for well-known meta events (End of Track, Set Tempo, Time Signature, etc.).
Chunk Length: Since the parser already stored each chunk's `chunkLength`, we do minimal checks: if `chunkLength > 0` but there are zero events, or vice versa, that is unusual.

**Kind**: instance method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of warning / error messages discovered, an empty array if no issues are found.  
<a name="AudioMIDI.encodeEventData"></a>

### AudioMIDI.encodeEventData(event) ⇒
Prepare and validate event payloads without writing partial events on validation failure.
Raw meta/SysEx bytes are accepted to preserve unrecognized and malformed-but-bounded input.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The validated payload, without delta time, status, subtype or length bytes.  

| Param | Description |
| --- | --- |
| event | The event to encode. |

<a name="AudioMIDI.decodeHeader"></a>

### AudioMIDI.decodeHeader(chunk) ⇒
Decodes and validates MIDI Header.
Checks for `MThd` header, reads the chunk length, format, track count, and PPQN (pulses per quarter note) / PPQ (pulses per quarter) / PQN (per quarter note) / TPQN (ticks per quarter note) / TPB (ticks per beat).

Signature (Decimal): [77, 84, 104, 100, ...]
Signature (Hexadecimal): [4D, 54, 68, 64, ...]
Signature (ASCII): [M, T, h, d, ...]

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The decoded values.  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="AudioMIDI.getControllerLabel"></a>

### AudioMIDI.getControllerLabel(controller) ⇒
Return the human readable controller name from the ID.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The human-readable controller name.  
**See**

- [ MidiKit Help Controllers](https://www.mixagesoftware.com/en/midikit/help/)
- [ MIDI 1.0 Control Change Messages (Data Bytes)](https://midi.org/midi-1-0-control-change-messages)


| Param | Description |
| --- | --- |
| controller | The controller ID. |

<a name="AudioMIDI.getManufacturerLabel"></a>

### AudioMIDI.getManufacturerLabel(manufacturerId) ⇒
Return the human readable manufacturer name from the ID.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The human-readable manufacturer name.  
**See**: [ MidiKit Help MIDI Manufacturers List](https://www.mixagesoftware.com/en/midikit/help/HTML/manufacturers.html)  

| Param | Description |
| --- | --- |
| manufacturerId | The manufacturer ID. |

<a name="AudioMIDI.writeVariableLengthValue"></a>

### AudioMIDI.writeVariableLengthValue(dataBuffer, value)
Write a variable-length value.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  

| Param | Description |
| --- | --- |
| dataBuffer | The data buffer to write to. |
| value | The value to write as a variable-length quantity. |

<a name="AudioMIDI.writeEventData"></a>

### AudioMIDI.writeEventData(dataBuffer, data)
Write event data.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  

| Param | Description |
| --- | --- |
| dataBuffer | The data buffer to write to. |
| data | The event data to write. |

<a name="AudioMIDI.generateTempoEvent"></a>

### AudioMIDI.generateTempoEvent(bpm) ⇒
Generate a Set Tempo event with a provided BPM.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The tempo event with the correct byte values.  

| Param | Description |
| --- | --- |
| bpm | The desired tempo in Beats Per Minute. |

<a name="AudioMIDI.generateMetaStringEvent"></a>

### AudioMIDI.generateMetaStringEvent(metaType, data) ⇒
Generate a Meta String event:
- 0x01: 'Text Event'
- 0x02: 'Copyright Notice'
- 0x03: 'Sequence / Track Name'
- 0x04: 'Instrument Name'
- 0x05: 'Lyrics'
- 0x06: 'Marker'
- 0x07: 'Cue Point'
- 0x08: 'Program Name'
- 0x09: 'Device (Port) Name'

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The meta string event with the encoded string data.  

| Param | Description |
| --- | --- |
| metaType | The meta event type. (e.g., 0x03 for Track Name). |
| data | The string value for the event (e.g., the name of the track). |

<a name="AudioMIDI.generateEndOfTrackEvent"></a>

### AudioMIDI.generateEndOfTrackEvent() ⇒
Generate an end of track event.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The end of track event.  
<a name="AudioMIDI.convertToMidi"></a>

### AudioMIDI.convertToMidi(options) ⇒
Convert a collection of tracks and notes into a new AudioMIDI instance.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The newly constructed MIDI  

| Param | Description |
| --- | --- |
| options | The options |
| [options.ppq] | The pulses per quarter note, default is 480. |
| [options.bpm] | The BPM of the track, when blank no tempo event will be added. |
| [options.tracks] | The MIDI tracks to write. |
| [options.format] | The MIDI format, default is 0 for one track or 1 for multiple tracks. Use 2 for independent track tempos. |
| [options.skipNotes] | The MIDI notes to skip, if any. |

**Example**  
```js
const midi = AudioMIDI.convertToMidi({
  bpm,
  ppq,
  tracks: [
    {
      notes: myCustomNotes.map((note) => {
        return {
          midiNote: note.midiNote,
          ticks: note.ticks,
          velocity: note.velocity,
          length: note.length,
        }
      }),
      metaStringEvents: {
        0x03: `Custom MIDI`,
      },
    }
  ],
  skipNotes: [128],
});
return midi;
```
<a name="AudioMIDI.noteToMidi"></a>

### AudioMIDI.noteToMidi(noteString, [octaveOffset], [noteMap]) ⇒
Convert a note string like `C1` or `D#2` to the MIDI value.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The MIDI value for the provided note.  

| Param | Default | Description |
| --- | --- | --- |
| noteString |  | The notation string. |
| [octaveOffset] | <code>2</code> | The default octave offset for C1, where a value of 2 means C1 = 36; default is 2. |
| [noteMap] |  | The note map to use for the conversion. |

**Example**  
```js
AudioMIDI.noteToMidi('C4') === 72
AudioMIDI.noteToMidi('C3') === 60
AudioMIDI.noteToMidi('C2') === 48
AudioMIDI.noteToMidi('C1') === 36
AudioMIDI.noteToMidi('C-1') === 12
AudioMIDI.noteToMidi('C-2') === 0
```
<a name="AudioMIDI.midiToNote"></a>

### AudioMIDI.midiToNote(midiValue, [octaveOffset], [noteNames]) ⇒
Convert a MIDI value back to a note string like `C1` or `D#2`.

**Kind**: static method of [<code>AudioMIDI</code>](#AudioMIDI)  
**Returns**: The note label corresponding to the MIDI value.  

| Param | Default | Description |
| --- | --- | --- |
| midiValue |  | The MIDI value (0-127). |
| [octaveOffset] | <code>2</code> | The default octave offset for C1, where a value of 2 means C1 = 36; default is 2. |
| [noteNames] |  | The note names to use for the conversion. |

**Example**  
```js
AudioMIDI.midiToNote(72) === 'C4'
AudioMIDI.midiToNote(60) === 'C3'
AudioMIDI.midiToNote(48) === 'C2'
AudioMIDI.midiToNote(36) === 'C1'
AudioMIDI.midiToNote(12) === 'C-1'
AudioMIDI.midiToNote(0) === 'C-2'
```
<a name="MAX_VARIABLE_LENGTH"></a>

## MAX\_VARIABLE\_LENGTH
Standard MIDI File variable-length quantities contain at most four bytes.

**Kind**: global constant  
<a name="TEXT_ENCODER"></a>

## TEXT\_ENCODER
Text written by this class is UTF-8; invalid UTF-8 input retains its original bytes.

**Kind**: global constant  
<a name="META_LENGTHS"></a>

## META\_LENGTHS
Fixed-size meta event payloads. Invalid-size payloads are retained as raw bytes.

**Kind**: global constant  
<a name="MANUFACTURERS"></a>

## MANUFACTURERS
Manufacturer labels are shared across calls.

**Kind**: global constant  
<a name="MINOR_KEYS"></a>

## MINOR\_KEYS
Minor key names indexed by the signed number of sharps or flats.

**Kind**: global constant  
<a name="NOTE_MAP"></a>

## NOTE\_MAP
Default note spellings preserve enharmonic octave crossings.

**Kind**: global constant  
<a name="NOTE_NAMES"></a>

## NOTE\_NAMES
Default note names, shared by note-label conversions.

**Kind**: global constant  
<a name="debug"></a>

## debug()
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global function  
<a name="decodeLegacyText"></a>

## decodeLegacyText()
Decode legacy byte-oriented text without discarding or substituting any bytes.

**Kind**: global function  
