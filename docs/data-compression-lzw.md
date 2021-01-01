<a name="LZW"></a>

## LZW
Lempel–Ziv–Welch (LZW) is a universal lossless data compression algorithm created by Abraham Lempel, Jacob Ziv, and Terry Welch.

**Kind**: global class  
**See**

- [LZW Compression](https://rosettacode.org/wiki/LZW_compression)
- [Lempel–Ziv–Welch (LZW)](https://en.wikipedia.org/w/index.php?title=Lempel%E2%80%93Ziv%E2%80%93Welch&oldid=531967504#Packing_order)


* [LZW](#LZW)
    * [.buildDictionary(depth)](#LZW.buildDictionary) ⇒ <code>object</code>
    * [.stringToHexArray(string)](#LZW.stringToHexArray) ⇒ <code>Array.&lt;number&gt;</code>
    * [.compress(input, [depth])](#LZW.compress) ⇒ <code>Array.&lt;number&gt;</code>
    * [.decompress(input, [depth])](#LZW.decompress) ⇒ <code>Array.&lt;number&gt;</code>

<a name="LZW.buildDictionary"></a>

### LZW.buildDictionary(depth) ⇒ <code>object</code>
Builds the compression & decompression lookup tables for a provided bit depth.

**Kind**: static method of [<code>LZW</code>](#LZW)  
**Returns**: <code>object</code> - The built compressDictionary & decompressArray.  

| Param | Type | Description |
| --- | --- | --- |
| depth | <code>number</code> | The bit depth of the compression. |

<a name="LZW.stringToHexArray"></a>

### LZW.stringToHexArray(string) ⇒ <code>Array.&lt;number&gt;</code>
Converts a string into a character code array.

**Kind**: static method of [<code>LZW</code>](#LZW)  
**Returns**: <code>Array.&lt;number&gt;</code> - The split up string.  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | The string to convert to hex. |

<a name="LZW.compress"></a>

### LZW.compress(input, [depth]) ⇒ <code>Array.&lt;number&gt;</code>
Compresses the incoming data.

**Kind**: static method of [<code>LZW</code>](#LZW)  
**Returns**: <code>Array.&lt;number&gt;</code> - The compressed version of the input.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> |  | The data to compress. |
| [depth] | <code>number</code> | <code>8</code> | The bit depth of the compression, defaults to 8, or 256 (1 << 8) value lookups. |

<a name="LZW.decompress"></a>

### LZW.decompress(input, [depth]) ⇒ <code>Array.&lt;number&gt;</code>
Decompressed the incoming data,

**Kind**: static method of [<code>LZW</code>](#LZW)  
**Returns**: <code>Array.&lt;number&gt;</code> - The decompressed data.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> |  | The data to decompress. |
| [depth] | <code>number</code> | <code>8</code> | The bit depth of the compression, defaults to 8, or 256 (1 << 8) value lookups. |

