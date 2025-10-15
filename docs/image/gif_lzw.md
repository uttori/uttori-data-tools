<a name="GIFLZW"></a>

## GIFLZW
GIF LZW Compression
The compression method GIF uses is a variant of LZW (Lempel-Ziv-Welch) compression.

**Kind**: global class  

* [GIFLZW](#GIFLZW)
    * [new GIFLZW(input)](#new_GIFLZW_new)
    * [.output](#GIFLZW+output) : <code>Array.&lt;number&gt;</code>
    * [.buildDictionary(size, [compress])](#GIFLZW+buildDictionary) ⇒ <code>Record.&lt;(number\|string), (number\|string)&gt;</code>
    * [.pack(codeLength, code)](#GIFLZW+pack)
    * [.unpack(codeLength, [useInput])](#GIFLZW+unpack) ⇒ <code>number</code>
    * [.compress(codeSize)](#GIFLZW+compress) ⇒ <code>Array.&lt;number&gt;</code>
    * [.decompress(codeSize, [useInput])](#GIFLZW+decompress) ⇒ <code>string</code>

<a name="new_GIFLZW_new"></a>

### new GIFLZW(input)
Creates a new GIFLZW instance.


| Param | Type | Description |
| --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> | The input data |

<a name="GIFLZW+output"></a>

### giflzW.output : <code>Array.&lt;number&gt;</code>
**Kind**: instance property of [<code>GIFLZW</code>](#GIFLZW)  
<a name="GIFLZW+buildDictionary"></a>

### giflzW.buildDictionary(size, [compress]) ⇒ <code>Record.&lt;(number\|string), (number\|string)&gt;</code>
Initialize the compression or decompression dictionary based on the code size.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: <code>Record.&lt;(number\|string), (number\|string)&gt;</code> - The built to size dictionary.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| size | <code>number</code> |  | Size of lookup, `(1 << Code Size) + 2`, the extra two are Clear Code & End of Information |
| [compress] | <code>boolean</code> | <code>true</code> | Type of dictionary returned, compression when true, decompression when false. Defaults to true. |

<a name="GIFLZW+pack"></a>

### giflzW.pack(codeLength, code)
Pack the colors as a series of bits, based on the codeSize.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  

| Param | Type | Description |
| --- | --- | --- |
| codeLength | <code>number</code> | The code length |
| code | <code>number</code> | The code |

<a name="GIFLZW+unpack"></a>

### giflzW.unpack(codeLength, [useInput]) ⇒ <code>number</code>
Unpack

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: <code>number</code> - The unpacked code  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| codeLength | <code>number</code> |  | Code Length |
| [useInput] | <code>boolean</code> | <code>true</code> | Unpacking the `input` or the `output`. Defaults to true. |

<a name="GIFLZW+compress"></a>

### giflzW.compress(codeSize) ⇒ <code>Array.&lt;number&gt;</code>
Compress data.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: <code>Array.&lt;number&gt;</code> - The compressed output  

| Param | Type | Description |
| --- | --- | --- |
| codeSize | <code>number</code> | Code Size |

<a name="GIFLZW+decompress"></a>

### giflzW.decompress(codeSize, [useInput]) ⇒ <code>string</code>
Decompress data.

**Kind**: instance method of [<code>GIFLZW</code>](#GIFLZW)  
**Returns**: <code>string</code> - The decompressed output  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| codeSize | <code>number</code> |  | Code Size |
| [useInput] | <code>boolean</code> | <code>true</code> | Unpacking the `input` or the `output`. Defaults to true. |

