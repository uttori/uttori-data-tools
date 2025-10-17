## Classes

<dl>
<dt><a href="#IPS">IPS</a></dt>
<dd><p>IPS as a format is a simple format for binary file patches, popular in the ROM hacking community
&quot;IPS&quot; allegedly stands for &quot;International Patching System&quot;.
FuSoYa&#39;s LunarIPS extension that writes beyond EOF to support a &quot;cut&quot; / truncate command is also supported.
IPS as a class can be used to:</p>
<ul>
<li>Parse IPS patch and apply to file</li>
<li>Create IPS from file and modified file</li>
<li>Debug IPS patch
An IPS file starts with the magic number &quot;PATCH&quot; (50 41 54 43 48), followed by a series of hunks and an end-of-file marker &quot;EOF&quot; (45 4f 46).
All numerical values are unsigned and stored big-endian.</li>
</ul>
<p>Regular hunks consist of a three-byte offset followed by a two-byte length of the payload and the payload itself.
Applying the hunk is done by writing the payload at the specified offset.</p>
<p>RLE hunks have their length field set to zero; in place of a payload there is a two-byte length of the run followed by a single byte indicating the value to be written.
Applying the RLE hunk is done by writing this byte the specified number of times at the specified offset.</p>
<p>As an extension, the end-of-file marker may be followed by a three-byte length to which the resulting file should be truncated.
Not every patching program will implement this extension, however.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#IPS_MAX_SIZE">IPS_MAX_SIZE</a> : <code>number</code></dt>
<dd><p>The maximum size of a file in the IPS format, 16 megabytes.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#IPSChunk">IPSChunk</a> : <code>object</code></dt>
<dd><p>A chunk of IPS data.</p>
</dd>
</dl>

<a name="IPS"></a>

## IPS
IPS as a format is a simple format for binary file patches, popular in the ROM hacking community
"IPS" allegedly stands for "International Patching System".
FuSoYa's LunarIPS extension that writes beyond EOF to support a "cut" / truncate command is also supported.
IPS as a class can be used to:
- Parse IPS patch and apply to file
- Create IPS from file and modified file
- Debug IPS patch
An IPS file starts with the magic number "PATCH" (50 41 54 43 48), followed by a series of hunks and an end-of-file marker "EOF" (45 4f 46).
All numerical values are unsigned and stored big-endian.

Regular hunks consist of a three-byte offset followed by a two-byte length of the payload and the payload itself.
Applying the hunk is done by writing the payload at the specified offset.

RLE hunks have their length field set to zero; in place of a payload there is a two-byte length of the run followed by a single byte indicating the value to be written.
Applying the RLE hunk is done by writing this byte the specified number of times at the specified offset.

As an extension, the end-of-file marker may be followed by a three-byte length to which the resulting file should be truncated.
Not every patching program will implement this extension, however.

**Kind**: global class  
**See**: [http://fileformats.archiveteam.org/wiki/IPS_(binary_patch_format)](http://fileformats.archiveteam.org/wiki/IPS_(binary_patch_format))  

* [IPS](#IPS)
    * [new IPS(input, [parse])](#new_IPS_new)
    * _instance_
        * [.hunks](#IPS+hunks) : [<code>Array.&lt;IPSChunk&gt;</code>](#IPSChunk)
        * [.truncate](#IPS+truncate) : <code>number</code>
        * [.parse()](#IPS+parse)
        * [.decodeHeader()](#IPS+decodeHeader)
        * [.encode()](#IPS+encode) ⇒ <code>DataBuffer</code>
        * [.apply(input)](#IPS+apply) ⇒ <code>DataBuffer</code>
    * _static_
        * [.createIPSFromDataBuffers(original, modified)](#IPS.createIPSFromDataBuffers) ⇒ [<code>IPS</code>](#IPS)

<a name="new_IPS_new"></a>

### new IPS(input, [parse])
Creates an instance of IPS.

**Throws**:

- <code>TypeError</code> Missing input data.
- <code>TypeError</code> Unknown type of input for DataBuffer: ${typeof input}


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>Array</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> | <code>0</code> | The data to process. |
| [parse] | <code>boolean</code> | <code>true</code> | Whether to immediately parse the IPS file. Default is true. |

<a name="IPS+hunks"></a>

### ipS.hunks : [<code>Array.&lt;IPSChunk&gt;</code>](#IPSChunk)
The changed to be made.

**Kind**: instance property of [<code>IPS</code>](#IPS)  
<a name="IPS+truncate"></a>

### ipS.truncate : <code>number</code>
The 3 byte length the file should be truncated to.

**Kind**: instance property of [<code>IPS</code>](#IPS)  
<a name="IPS+parse"></a>

### ipS.parse()
Parse the IPS file, decoding the hunks.

**Kind**: instance method of [<code>IPS</code>](#IPS)  
<a name="IPS+decodeHeader"></a>

### ipS.decodeHeader()
Decodes and validates IPS Header.

The header takes up the first five bytes of the file.
These bytes should all correspond to ASCII character codes.

Signature (Decimal): [80, 65, 84, 67, 72]
Signature (Hexadecimal): [50, 41, 54, 43, 48]
Signature (ASCII): [P, A, T, C, H]

**Kind**: instance method of [<code>IPS</code>](#IPS)  
**Throws**:

- <code>Error</code> Missing or invalid IPS header

<a name="IPS+encode"></a>

### ipS.encode() ⇒ <code>DataBuffer</code>
Convert the current instance to an IPS file Buffer instance.

**Kind**: instance method of [<code>IPS</code>](#IPS)  
**Returns**: <code>DataBuffer</code> - The new IPS file as a Buffer.  
<a name="IPS+apply"></a>

### ipS.apply(input) ⇒ <code>DataBuffer</code>
Apply the IPS patch to an input DataBuffer.

**Kind**: instance method of [<code>IPS</code>](#IPS)  
**Returns**: <code>DataBuffer</code> - The patched binary.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>DataBuffer</code> | The binary to patch. |

<a name="IPS.createIPSFromDataBuffers"></a>

### IPS.createIPSFromDataBuffers(original, modified) ⇒ [<code>IPS</code>](#IPS)
Calculate the difference between two DataBuffers and save it as an IPS patch.

**Kind**: static method of [<code>IPS</code>](#IPS)  
**Returns**: [<code>IPS</code>](#IPS) - The IPS patch file data as a Buffer.  

| Param | Type | Description |
| --- | --- | --- |
| original | <code>DataBuffer</code> | The original file to compare against. |
| modified | <code>DataBuffer</code> | The modified file. |

<a name="IPS_MAX_SIZE"></a>

## IPS\_MAX\_SIZE : <code>number</code>
The maximum size of a file in the IPS format, 16 megabytes.

**Kind**: global constant  
<a name="IPSChunk"></a>

## IPSChunk : <code>object</code>
A chunk of IPS data.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | 3 bytes. The starting offset of the change. |
| length | <code>number</code> | The length of the change. |
| [rle] | <code>number</code> | The type of change, value is not undefined when Run Length Encoding is being used. |
| [data] | <code>Array.&lt;number&gt;</code> | The data to be used for the change when not RLE. |

