## Classes

<dl>
<dt><a href="#GIFLZW">GIFLZW</a></dt>
<dd><p>GIF LZW Compression
The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.</p>
<p>Byte APIs avoid string dictionaries and per-bit loops. Complete operations rewind
their cursor automatically; pack()/unpack() still advance the public cursor.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
<dt><a href="#byteLimit">byteLimit()</a></dt>
<dd><p>Resolve an allocation limit before allocating or growing a buffer.</p>
</dd>
<dt><a href="#validateCodeSize">validateCodeSize()</a></dt>
<dd><p>GIF minimum code sizes are two through eight; the code stream grows to twelve bits.</p>
</dd>
<dt><a href="#validateInput">validateInput()</a></dt>
<dd><p>Validate plain arrays without copying typed byte views or changing their byte offsets.</p>
</dd>
<dt><a href="#validateCursor">validateCursor()</a></dt>
<dd><p>Validate the public bit cursor, including callers that deliberately rewind it.</p>
</dd>
<dt><a href="#validateCodeLength">validateCodeLength()</a></dt>
<dd><p>Validate the public pack/unpack width independently of the minimum code size.</p>
</dd>
</dl>

<a name="GIFLZW"></a>

## GIFLZW
GIF LZW Compression
The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.

Byte APIs avoid string dictionaries and per-bit loops. Complete operations rewind
their cursor automatically; pack()/unpack() still advance the public cursor.

**Kind**: global class  

* [GIFLZW](#GIFLZW)
    * [new GIFLZW(input)](#new_GIFLZW_new)
    * [.input](#GIFLZW+input)
    * [.output](#GIFLZW+output)
    * [.offset](#GIFLZW+offset)
    * [.bitOffset](#GIFLZW+bitOffset)
    * [.buildDictionary(size, compress)](#GIFLZW+buildDictionary) ⇒
    * [.pack(codeLength, code)](#GIFLZW+pack)
    * [.unpack(codeLength, useInput)](#GIFLZW+unpack) ⇒
    * [.compress(codeSize, options)](#GIFLZW+compress) ⇒
    * [.compressBytes(codeSize, options)](#GIFLZW+compressBytes) ⇒
    * [.decompress(codeSize, useInput, options)](#GIFLZW+decompress) ⇒
    * [.decompressBytes(codeSize, useInput, options)](#GIFLZW+decompressBytes) ⇒

<a name="new_GIFLZW_new"></a>

### new GIFLZW(input)
Creates a new GIFLZW instance.


| Param | Description |
| --- | --- |
| input | The input data |

<a name="GIFLZW+input"></a>

### giflzW.input
The input data.

**Kind**: instance property of [<code>GIFLZW</code>](#GIFLZW)  
<a name="GIFLZW+output"></a>

### giflzW.output
The output data.

**Kind**: instance property of [<code>GIFLZW</code>](#GIFLZW)  
<a name="GIFLZW+offset"></a>

### giflzW.offset
The current offset in the output data.

**Kind**: instance property of [<code>GIFLZW</code>](#GIFLZW)  
<a name="GIFLZW+bitOffset"></a>

### giflzW.bitOffset
The current bit offset in the output data.

**Kind**: instance property of [<code>GIFLZW</code>](#GIFLZW)  
<a name="GIFLZW+buildDictionary"></a>

### giflzW.buildDictionary(size, compress) ⇒
Initialize the compression or decompression dictionary based on the code size.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: The built to size dictionary.  

| Param | Default | Description |
| --- | --- | --- |
| size |  | Size of lookup, `(1 << Code Size) + 2`, the extra two are Clear Code & End of Information |
| compress | <code>true</code> | Type of dictionary returned, compression when true, decompression when false. Defaults to true. |

<a name="GIFLZW+pack"></a>

### giflzW.pack(codeLength, code)
Pack the colors as a series of bits, based on the codeSize.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  

| Param | Description |
| --- | --- |
| codeLength | The code length |
| code | The code |

<a name="GIFLZW+unpack"></a>

### giflzW.unpack(codeLength, useInput) ⇒
Unpack

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: The unpacked code  

| Param | Default | Description |
| --- | --- | --- |
| codeLength |  | Code Length |
| useInput | <code>true</code> | Unpacking the `input` or the `output`. Defaults to true, using the input. |

<a name="GIFLZW+compress"></a>

### giflzW.compress(codeSize, options) ⇒
Compress data.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: The compressed output  

| Param | Description |
| --- | --- |
| codeSize | Code Size |
| options | Input and output allocation limits. |

<a name="GIFLZW+compressBytes"></a>

### giflzW.compressBytes(codeSize, options) ⇒
Compress native indexes directly to bytes without an intermediate number array.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: An owned, unframed GIF LZW stream, including clear and EOI codes.  

| Param | Description |
| --- | --- |
| codeSize | GIF minimum code size, two through eight. |
| options | Input and output allocation limits. |

<a name="GIFLZW+decompress"></a>

### giflzW.decompress(codeSize, useInput, options) ⇒
Decompress data.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: The decompressed output  

| Param | Default | Description |
| --- | --- | --- |
| codeSize |  | Code Size |
| useInput | <code>true</code> | Unpacking the `input` or the `output`. Defaults to true. |
| options |  | Allocation limits, exact decoded length, and trailing-byte policy. |

<a name="GIFLZW+decompressBytes"></a>

### giflzW.decompressBytes(codeSize, useInput, options) ⇒
Decode with a fixed 4096-entry prefix/suffix dictionary and a bounded output buffer.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: Owned row-order indexes; GIF interlacing belongs to the image container.  

| Param | Default | Description |
| --- | --- | --- |
| codeSize |  | GIF minimum code size, two through eight. |
| useInput | <code>true</code> | Read input, or the compatibility compress() output. |
| options |  | Allocation limits, exact decoded length, and trailing-byte policy. |

<a name="debug"></a>

## debug()
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global function  
<a name="byteLimit"></a>

## byteLimit()
Resolve an allocation limit before allocating or growing a buffer.

**Kind**: global function  
<a name="validateCodeSize"></a>

## validateCodeSize()
GIF minimum code sizes are two through eight; the code stream grows to twelve bits.

**Kind**: global function  
<a name="validateInput"></a>

## validateInput()
Validate plain arrays without copying typed byte views or changing their byte offsets.

**Kind**: global function  
<a name="validateCursor"></a>

## validateCursor()
Validate the public bit cursor, including callers that deliberately rewind it.

**Kind**: global function  
<a name="validateCodeLength"></a>

## validateCodeLength()
Validate the public pack/unpack width independently of the minimum code size.

**Kind**: global function  
