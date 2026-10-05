## Classes

<dl>
<dt><a href="#SP404Pattern">SP404Pattern</a> ⇐ <code>DataBuffer</code></dt>
<dd><p>SP404Pattern - Roland SP-404SX / SP-404 MKii Pattern Utility
A utility to read, modify and write pattern files from a Roland SP-404SX / SP-404 MKii <code>PTN</code> files.
Can also convert patterns to MIDI or convert from MIDI to pattern.
Several values are not saved into the pattern but are configured when recording a pattern:</p>
<ul>
<li>BPM</li>
<li>Quantization Strength / Shuffle Rate</li>
<li>Quantization Grid Size</li>
<li>Metronome Volume</li>
</ul>
<p>Substep on Sequencer Mode actually generates multiple notes depending on the substep type offset by a set number of ticks, no other designation is set on the note.</p>
<p>Notes in the pattern grid will typically line up, but if the last note or a note near the end plays a sample beyond the length of the bar, there needs to be place holder notes for however long that is.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>Optional diagnostics, disabled by default so unrelated imports can discard this module.</p>
</dd>
<dt><a href="#integer">integer()</a></dt>
<dd><p>Validate before quantization or byte writes can hide invalid numeric input.</p>
</dd>
<dt><a href="#padMap">padMap()</a></dt>
<dd><p>Select a fresh device map without import-time allocations or shared mutable defaults.</p>
</dd>
<dt><a href="#isNoteData">isNoteData()</a></dt>
<dd><p>Narrow the MIDI event&#39;s union payload without relying on labels or legacy string note values.</p>
</dd>
</dl>

<a name="SP404Pattern"></a>

## SP404Pattern ⇐ <code>DataBuffer</code>
SP404Pattern - Roland SP-404SX / SP-404 MKii Pattern Utility
A utility to read, modify and write pattern files from a Roland SP-404SX / SP-404 MKii `PTN` files.
Can also convert patterns to MIDI or convert from MIDI to pattern.
Several values are not saved into the pattern but are configured when recording a pattern:
- BPM
- Quantization Strength / Shuffle Rate
- Quantization Grid Size
- Metronome Volume

Substep on Sequencer Mode actually generates multiple notes depending on the substep type offset by a set number of ticks, no other designation is set on the note.

Notes in the pattern grid will typically line up, but if the last note or a note near the end plays a sample beyond the length of the bar, there needs to be place holder notes for however long that is.

**Kind**: global class  
**Extends**: <code>DataBuffer</code>  

* [SP404Pattern](#SP404Pattern) ⇐ <code>DataBuffer</code>
    * [new SP404Pattern([input], options)](#new_SP404Pattern_new)
    * _instance_
        * [.bars](#SP404Pattern+bars)
        * [.timeSignature](#SP404Pattern+timeSignature)
        * [.notes](#SP404Pattern+notes)
        * [.defaultMap](#SP404Pattern+defaultMap)
        * [.options](#SP404Pattern+options)
        * [.validateOptions()](#SP404Pattern+validateOptions)
        * [.parse(options)](#SP404Pattern+parse)
        * [.toMidi(options)](#SP404Pattern+toMidi) ⇒ <code>AudioMIDI</code>
        * [.getUsedPads()](#SP404Pattern+getUsedPads) ⇒ <code>Array.&lt;string&gt;</code>
    * _static_
        * [.defaultPPQOG](#SP404Pattern.defaultPPQOG)
        * [.defaultPPQ](#SP404Pattern.defaultPPQ)
        * [.defaultMap](#SP404Pattern.defaultMap) ⇒ <code>Record.&lt;string, SP404PadMapping&gt;</code>
        * [.defaultMapOG](#SP404Pattern.defaultMapOG)
        * [.fromMidi(audioMIDI, noteMap, patternPPQN, [og])](#SP404Pattern.fromMidi) ⇒ <code>DataBuffer</code>

<a name="new_SP404Pattern_new"></a>

### new SP404Pattern([input], options)
Creates a new SP404Pattern.


| Param | Type | Description |
| --- | --- | --- |
| [input] | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> | The data to process. |
| options | <code>object</code> | The options for parsing the pattern. |
| [options.bytesPerNote] | <code>number</code> | The number of bytes for each note; default is 8. |
| [options.padsPerBank] | <code>number</code> | The number of pads per bank, 12 or 16 for the MKii; default is 12 for OG and 16 for MKii. |
| [options.og] | <code>boolean</code> | When true, process for the original SP404s, when false for the MKii; default is false. Omitted input creates an empty instance. Partial records or footers are rejected. |

**Example** *(SP404Pattern)*  
```js
const data = fs.readFileSync('./PTN00025.BIN');
const file = new SP404Pattern(data);
console.log('Notes:', file.notes);
```
<a name="SP404Pattern+bars"></a>

### sP404Pattern.bars
Footer bar count (normally 1–64), an empty instance starts at zero.

**Kind**: instance property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern+timeSignature"></a>

### sP404Pattern.timeSignature
The time signature of the pattern: 0 = 4/4, 1 = 3/4, 2 = 2/4, 3 = 1/4, 4 = 5/4, 5 = 6/4, 7 = 7/4. Unknown codes are retained.

**Kind**: instance property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern+notes"></a>

### sP404Pattern.notes
Includes timing placeholders so silent gaps can survive conversion.

**Kind**: instance property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern+defaultMap"></a>

### sP404Pattern.defaultMap
Address map for the selected device, owned by this instance.

**Kind**: instance property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern+options"></a>

### sP404Pattern.options
Validated layout reused by subsequent parse() calls.

**Kind**: instance property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern+validateOptions"></a>

### sP404Pattern.validateOptions()
Reject layouts that would desynchronize event reads from the fixed sixteen-byte footer.

**Kind**: instance method of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern+parse"></a>

### sP404Pattern.parse(options)
Parse the pattern into notes and extract the bar count from the footer.
Reparse from byte zero. Incomplete notes and footers throw before state changes.

**Kind**: instance method of [<code>SP404Pattern</code>](#SP404Pattern)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options for parsing the pattern. |
| [options.bytesPerNote] | <code>number</code> | The number of bytes for each note; default is 8. |
| [options.padsPerBank] | <code>number</code> | The number of pads per bank, 12 or 16 for the MKii; default is 12 for OG and 16 for MKii. |
| [options.og] | <code>boolean</code> | When true, process for the original SP404s, when false for the MKii; default is false. |

<a name="SP404Pattern+toMidi"></a>

### sP404Pattern.toMidi(options) ⇒ <code>AudioMIDI</code>
Convert the parsed notes to a AudioMidi instance ready to be saved as MIDI file or manipulated further.

**Kind**: instance method of [<code>SP404Pattern</code>](#SP404Pattern)  
**Returns**: <code>AudioMIDI</code> - A new AudioMIDI instance populated from the pattern.  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options |
| [options.bpm] | <code>number</code> | The BPM of the track, when undefined no tempo event will be added. |
| [options.ppq] | <code>number</code> | The pulses per quarter note; defaults to 96 for OG or 480 for MKii. |
| [options.fileName] | <code>string</code> | The name of the pattern file being converted. |
| options.noteMap | <code>Record.&lt;string, number&gt;</code> | A map of Pads `A1` to `J16` that correspond to which MIDI note. Timing is rescaled to the destination PPQ; placeholders and unmapped pads retain their delays. Known time signatures are exported as MIDI meta events; unknown codes throw. The footer bar count also preserves the pattern duration when final padding is absent. |

<a name="SP404Pattern+getUsedPads"></a>

### sP404Pattern.getUsedPads() ⇒ <code>Array.&lt;string&gt;</code>
Gathers all pads used in this pattern in first-use order, excluding placeholders and unknown pad addresses.

**Kind**: instance method of [<code>SP404Pattern</code>](#SP404Pattern)  
**Returns**: <code>Array.&lt;string&gt;</code> - An array of distinct pad labels.  
<a name="SP404Pattern.defaultPPQOG"></a>

### SP404Pattern.defaultPPQOG
Original device ticks per quarter note.

**Kind**: static property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern.defaultPPQ"></a>

### SP404Pattern.defaultPPQ
MKII ticks per quarter note.

**Kind**: static property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern.defaultMap"></a>

### SP404Pattern.defaultMap ⇒ <code>Record.&lt;string, SP404PadMapping&gt;</code>
The default mapping of pads `A1` to `J16` to MIDI notes.
Returns a fresh map owned by the caller.

**Kind**: static property of [<code>SP404Pattern</code>](#SP404Pattern)  
**Returns**: <code>Record.&lt;string, SP404PadMapping&gt;</code> - The default mapping of pads `A1` to `J16` to MIDI notes.  
<a name="SP404Pattern.defaultMapOG"></a>

### SP404Pattern.defaultMapOG
Native SX twelve-pad addresses, shared by A–E and F–J with separate bank selectors.
These are pattern-file addresses, independent of the MIDI notes used to trigger the device.
Returns a fresh map owned by the caller.

**Kind**: static property of [<code>SP404Pattern</code>](#SP404Pattern)  
<a name="SP404Pattern.fromMidi"></a>

### SP404Pattern.fromMidi(audioMIDI, noteMap, patternPPQN, [og]) ⇒ <code>DataBuffer</code>
Converts a AudioMIDI structure back into a pad file format.
Pads that play all the way through will have 2 on notes, one to start the sound and one to end it.

**Kind**: static method of [<code>SP404Pattern</code>](#SP404Pattern)  
**Returns**: <code>DataBuffer</code> - A committed DataBuffer representing the pad file.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| audioMIDI | <code>default</code> |  | The AudioMIDI instance to convert back to a pad file. |
| noteMap | <code>Record.&lt;number, string&gt;</code> |  | A map of MIDI note numbers to pad labels `A1` to `J16`. |
| patternPPQN | <code>number</code> |  | The pulses per quarter note of the pattern; OG is 96, MKii is 480. |
| [og] | <code>boolean</code> | <code>false</code> | When true, process for the original SP404s, when false for the MKii; default is false. Native SX output uses following delays, big-endian durations, and footer byte 9 for bars. Durations come from Note On length or matching FIFO Note Off events within each track/channel. Missing durations become zero; unmapped notes, SMPTE timing, non-4/4 signatures, independent format-2 tracks and unrepresentable lengths throw. Patterns are limited to 64 bars. |

<a name="debug"></a>

## debug()
Optional diagnostics, disabled by default so unrelated imports can discard this module.

**Kind**: global function  
<a name="integer"></a>

## integer()
Validate before quantization or byte writes can hide invalid numeric input.

**Kind**: global function  
<a name="padMap"></a>

## padMap()
Select a fresh device map without import-time allocations or shared mutable defaults.

**Kind**: global function  
<a name="isNoteData"></a>

## isNoteData()
Narrow the MIDI event's union payload without relying on labels or legacy string note values.

**Kind**: global function  
