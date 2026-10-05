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
<dt><a href="#IPS_MAX_SIZE">IPS_MAX_SIZE</a></dt>
<dd><p>The maximum output file size supported by this implementation, 16 mebibytes.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
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
    * [new IPS(input, parse)](#new_IPS_new)
    * _instance_
        * [.hunks](#IPS+hunks)
        * [.truncate](#IPS+truncate)
        * [.hasTruncate](#IPS+hasTruncate)
        * [.parse()](#IPS+parse)
        * [.decodeHeader()](#IPS+decodeHeader)
        * [.encode()](#IPS+encode) ⇒
        * [.apply(input)](#IPS+apply) ⇒
        * [.validateTruncate()](#IPS+validateTruncate)
    * _static_
        * [.createIPSFromDataBuffers(original, modified)](#IPS.createIPSFromDataBuffers) ⇒
        * [.validateHunk()](#IPS.validateHunk)

<a name="new_IPS_new"></a>

### new IPS(input, parse)
Creates an instance of IPS.

**Throws**:

- <code>TypeError</code> Missing input data.
- <code>TypeError</code> Unknown type of input for DataBuffer: ${typeof input}


| Param | Default | Description |
| --- | --- | --- |
| input | <code>0</code> | The data to process. |
| parse | <code>true</code> | Whether to immediately parse the IPS file. Default is true. |

<a name="IPS+hunks"></a>

### ipS.hunks
The chunks to be applied to the data.

**Kind**: instance property of [<code>IPS</code>](#IPS)  
<a name="IPS+truncate"></a>

### ipS.truncate
The 3 byte length the file should be truncated to.

**Kind**: instance property of [<code>IPS</code>](#IPS)  
<a name="IPS+hasTruncate"></a>

### ipS.hasTruncate
Whether a truncate command is present, including an explicit truncate to zero bytes.

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

### ipS.encode() ⇒
Convert the current instance to an IPS file Buffer instance.

**Kind**: instance method of [<code>IPS</code>](#IPS)  
**Returns**: The new IPS file as a Buffer.  
<a name="IPS+apply"></a>

### ipS.apply(input) ⇒
Apply the IPS patch to an input DataBuffer.

**Kind**: instance method of [<code>IPS</code>](#IPS)  
**Returns**: The patched binary.  

| Param | Description |
| --- | --- |
| input | The binary to patch. |

<a name="IPS+validateTruncate"></a>

### ipS.validateTruncate()
Validate the optional three-byte final size, including an explicit zero-length result.

**Kind**: instance method of [<code>IPS</code>](#IPS)  
<a name="IPS.createIPSFromDataBuffers"></a>

### IPS.createIPSFromDataBuffers(original, modified) ⇒
Calculate the difference between two DataBuffers and save it as an IPS patch.

**Kind**: static method of [<code>IPS</code>](#IPS)  
**Returns**: The IPS patch file data as a Buffer.  

| Param | Description |
| --- | --- |
| original | The original file to compare against, using all committed bytes regardless of its cursor. |
| modified | The modified file, using all committed bytes regardless of its cursor. |

<a name="IPS.validateHunk"></a>

### IPS.validateHunk()
Validate manually supplied or parsed records before encoding or applying any of them.

**Kind**: static method of [<code>IPS</code>](#IPS)  
<a name="IPS_MAX_SIZE"></a>

## IPS\_MAX\_SIZE
The maximum output file size supported by this implementation, 16 mebibytes.

**Kind**: global constant  
<a name="debug"></a>

## debug()
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global function  
