## Classes

<dl>
<dt><a href="#SP404PadInfo">SP404PadInfo</a></dt>
<dd><p>Uttori Pad Info - Utility to manipulate the PAD_INFO.BIN file for SP-404 series of samplers.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>Optional diagnostics; importing the parser does not load the debug package by default.</p>
</dd>
<dt><a href="#readFlag">readFlag()</a></dt>
<dd><p>Decode known boolean codes while retaining unexpected bytes for damaged-file diagnostics.</p>
</dd>
<dt><a href="#unsignedInteger">unsignedInteger()</a></dt>
<dd><p>Reject truncation, coercion and wrapping before writing an unsigned device field.</p>
</dd>
<dt><a href="#encodeFlag">encodeFlag()</a></dt>
<dd><p>Encode boolean flags without silently interpreting damaged numeric flags as true.</p>
</dd>
<dt><a href="#encodeTempo">encodeTempo()</a></dt>
<dd><p>Convert BPM to the unsigned fixed-point field, rejecting non-finite values and overflow.</p>
</dd>
</dl>

<a name="SP404PadInfo"></a>

## SP404PadInfo
Uttori Pad Info - Utility to manipulate the PAD_INFO.BIN file for SP-404 series of samplers.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| pads | <code>Array.&lt;SP404Pad&gt;</code> | Parsed Pads |


* [SP404PadInfo](#SP404PadInfo)
    * [new SP404PadInfo([input])](#new_SP404PadInfo_new)
    * _instance_
        * [.pads](#SP404PadInfo+pads)
        * [.parse()](#SP404PadInfo+parse)
    * _static_
        * [.fromFile(data)](#SP404PadInfo.fromFile) ⇒ [<code>SP404PadInfo</code>](#SP404PadInfo)
        * [.encodePad([data])](#SP404PadInfo.encodePad) ⇒ <code>Buffer</code>
        * [.checkDefault([pad], [strict])](#SP404PadInfo.checkDefault) ⇒ <code>boolean</code>
        * [.getPadLabel(index)](#SP404PadInfo.getPadLabel) ⇒ <code>string</code>
        * [.getPadIndex(label)](#SP404PadInfo.getPadIndex) ⇒ <code>number</code>

<a name="new_SP404PadInfo_new"></a>

### new SP404PadInfo([input])
Creates an instance of SP404PadInfo.


| Param | Type | Description |
| --- | --- | --- |
| [input] | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> | The data to process. Omitted input creates an empty instance. Partial records and more than 120 pads are rejected. |

**Example** *(SP404PadInfo)*  
```js
import fs from 'fs';
const data = fs.readFileSync('./PAD_INFO.bin');
const { pads } = new SP404PadInfo(data);
fs.writeFileSync('./output.json', JSON.stringify(pads, null, 2));
console.log('Pads:', pads);
➜ [
    {
      "avaliable": false,
      "label": "A1",
      "filename": "A0000001.WAV",
      "originalSampleStart": 512,
      "originalSampleEnd": 385388,
      "userSampleStart": 512,
      "userSampleEnd": 385388,
      "volume": 87,
      "lofi": false,
      "loop": false,
      "gate": false,
      "reverse": true,
      "format": "WAVE",
      "channels": "Stereo",
      "tempoMode": "Off",
      "originalTempo": 109.9,
      "userTempo": 109.9
    },
    ...,
  {
      "avaliable": false,
      "label": "J12",
      "filename": "J0000012.WAV",
      "originalSampleStart": 512,
      "originalSampleEnd": 53424,
      "userSampleStart": 512,
      "userSampleEnd": 53424,
      "volume": 127,
      "lofi": false,
      "loop": false,
      "gate": true,
      "reverse": false,
      "format": "WAVE",
      "channels": "Stereo",
      "tempoMode": "Off",
      "originalTempo": 100,
      "userTempo": 100
    }
  ]
```
<a name="SP404PadInfo+pads"></a>

### sP404PadInfo.pads
Parsed Pads in bank order; short files may contain fewer than 120 complete records.

**Kind**: instance property of [<code>SP404PadInfo</code>](#SP404PadInfo)  
<a name="SP404PadInfo+parse"></a>

### sP404PadInfo.parse()
Parse the PAD_INFO.BIN file, decoding the supported pad info.

This is stored alongside the samples in PAD_INFO.BIN and contains 120 × 32-byte records, one for each pad from A1 to J12.
In this file, values are stored in big-endian order.
Reparse from byte zero; invalid record layouts throw before replacing pads.

**Kind**: instance method of [<code>SP404PadInfo</code>](#SP404PadInfo)  
<a name="SP404PadInfo.fromFile"></a>

### SP404PadInfo.fromFile(data) ⇒ [<code>SP404PadInfo</code>](#SP404PadInfo)
Creates and parses a PAD_INFO.BIN file from binary data.

**Kind**: static method of [<code>SP404PadInfo</code>](#SP404PadInfo)  
**Returns**: [<code>SP404PadInfo</code>](#SP404PadInfo) - The parsed PAD_INFO helper.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> | The PAD_INFO.BIN data to parse. |

<a name="SP404PadInfo.encodePad"></a>

### SP404PadInfo.encodePad([data]) ⇒ <code>Buffer</code>
Encode JSON values to a valid pad structure.

**Kind**: static method of [<code>SP404PadInfo</code>](#SP404PadInfo)  
**Returns**: <code>Buffer</code> - - The new pad Buffer.
Defaults match the OEM converter; invalid fields throw before return.  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>SP404PadInput</code> | The JSON values to encode. |

<a name="SP404PadInfo.checkDefault"></a>

### SP404PadInfo.checkDefault([pad], [strict]) ⇒ <code>boolean</code>
Checks to see if a Pad is set to the default values, if so it is likely unused.

**Kind**: static method of [<code>SP404PadInfo</code>](#SP404PadInfo)  
**Returns**: <code>boolean</code> - - Returns true if the Pad is set the the default values, false otherwise.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [pad] | <code>SP404PadInput</code> |  | The JSON values to check. |
| [strict] | <code>boolean</code> | <code>false</code> | When strict all values are checked for defaults, otherwise just the offsets are checked. |

<a name="SP404PadInfo.getPadLabel"></a>

### SP404PadInfo.getPadLabel(index) ⇒ <code>string</code>
Convert a numberic value used in the PAD_INFO.bin file for that pad to the pad label like `A1` or `J12`.

**Kind**: static method of [<code>SP404PadInfo</code>](#SP404PadInfo)  
**Returns**: <code>string</code> - The pad label like `A1` or `J12`, or an empty string for an invalid index.  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | The numberic value used in the PAD_INFO.bin file. |

<a name="SP404PadInfo.getPadIndex"></a>

### SP404PadInfo.getPadIndex(label) ⇒ <code>number</code>
Convert a pad label like `A1` or `J12` to the numberic value used in the PAD_INFO.bin file for that pad.

**Kind**: static method of [<code>SP404PadInfo</code>](#SP404PadInfo)  
**Returns**: <code>number</code> - The numeric value used in the PAD_INFO.bin file, or -1 for an invalid label.  

| Param | Type | Description |
| --- | --- | --- |
| label | <code>string</code> | The pad label like `A1` or `J12`. |

<a name="debug"></a>

## debug()
Optional diagnostics; importing the parser does not load the debug package by default.

**Kind**: global function  
<a name="readFlag"></a>

## readFlag()
Decode known boolean codes while retaining unexpected bytes for damaged-file diagnostics.

**Kind**: global function  
<a name="unsignedInteger"></a>

## unsignedInteger()
Reject truncation, coercion and wrapping before writing an unsigned device field.

**Kind**: global function  
<a name="encodeFlag"></a>

## encodeFlag()
Encode boolean flags without silently interpreting damaged numeric flags as true.

**Kind**: global function  
<a name="encodeTempo"></a>

## encodeTempo()
Convert BPM to the unsigned fixed-point field, rejecting non-finite values and overflow.

**Kind**: global function  
