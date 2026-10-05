## Classes

<dl>
<dt><a href="#ImagePNG">ImagePNG</a> ⇐ <code>DataBuffer</code></dt>
<dd><p>PNG Decoder</p>
<p>Also supports indexed editing and indexed/RGBA8 encoding.
Native samples and rendering remain distinct:
depths 1/2/4/8 use one Uint8Array element per sample or palette index,
depth 16 uses one Uint16Array element per sample.
Duplicate palette colors retain separate slots. Use toRGBA() explicitly for rendering.</p>
<p>Input is copied by default. With <code>copyInput: false</code>,
you must not mutate the borrowed bytes while the instance is in use.
Chunk payloads are read-only views by convention.
Native pixels are decoded lazily and cached after success.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#PNG_SIGNATURE">PNG_SIGNATURE</a></dt>
<dd><p>Eight-byte PNG signature.</p>
</dd>
<dt><a href="#ADAM7_PASSES">ADAM7_PASSES</a></dt>
<dd><p>Adam7 pass order: start x, start y, step x, step y.</p>
</dd>
<dt><a href="#SINGLE_PASS">SINGLE_PASS</a></dt>
<dd><p>Non-interlaced images use the same row reconstruction with a single pass.</p>
</dd>
<dt><a href="#COLOR_DEPTHS">COLOR_DEPTHS</a></dt>
<dd><p>Allowed sample depths for every PNG color type.</p>
</dd>
<dt><a href="#ANIMATION_CHUNKS">ANIMATION_CHUNKS</a></dt>
<dd><p>Animation is detected, but frame decoding is outside the static PNG API.</p>
</dd>
<dt><a href="#DEFAULT_LIMITS">DEFAULT_LIMITS</a></dt>
<dd><p>Default bounds for source data, decoded images, and encoded output.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
<dt><a href="#zlibState">zlibState(inflator)</a> ⇒</dt>
<dd><p>Read the private zlib stream. The counters reject trailing bytes and a second zlib stream.</p>
</dd>
<dt><a href="#resolveLimits">resolveLimits(options)</a> ⇒</dt>
<dd><p>Resolve and validate caller-provided allocation limits.</p>
</dd>
<dt><a href="#prepareInput">prepareInput(input, options, maxInputBytes)</a> ⇒</dt>
<dd><p>Normalize PNG input while respecting a typed array&#39;s exact byte range.</p>
</dd>
<dt><a href="#passLength">passLength(size, start, step)</a> ⇒</dt>
<dd><p>Count samples along one dimension of an interlace pass.</p>
</dd>
<dt><a href="#paethPredictor">paethPredictor(left, above, upperLeft)</a> ⇒</dt>
<dd><p>Select the Paeth predictor, resolving ties in left, above, upper-left order.</p>
</dd>
<dt><a href="#unfilterRow">unfilterRow(row, previous, bpp, length, filter)</a></dt>
<dd><p>Reconstruct an owned filtered row in place; no per-byte allocations are made.</p>
</dd>
<dt><a href="#unfilterScanline">unfilterScanline(filter, pixels, scanline, bpp, offset, length)</a> ⇒</dt>
<dd><p>Adapt the original public unfilter signature to the shared row implementation.
The main decoder reuses its own row buffers and does not allocate through this adapter.</p>
</dd>
<dt><a href="#validateIndexed">validateIndexed(image, bitDepth, maxPixels)</a></dt>
<dd><p>Validate indexed input without quantization, reordering, or slot deduplication.</p>
</dd>
<dt><a href="#joinChunks">joinChunks(parts, maxBytes)</a> ⇒</dt>
<dd><p>Join complete PNG chunks into owned output after checking its total size.</p>
</dd>
<dt><a href="#makeChunk">makeChunk(type, data)</a> ⇒</dt>
<dd><p>Frame a PNG chunk and calculate its numeric CRC without hexadecimal conversion.</p>
</dd>
<dt><a href="#makeHeader">makeHeader(width, height, bitDepth, colorType)</a> ⇒</dt>
<dd><p>Build a non-interlaced IHDR payload from validated image properties.</p>
</dd>
<dt><a href="#makePaletteChunks">makePaletteChunks(palette)</a> ⇒</dt>
<dd><p>Create palette chunks retaining all slots, including duplicates and unused colors.</p>
</dd>
</dl>

<a name="ImagePNG"></a>

## ImagePNG ⇐ <code>DataBuffer</code>
PNG Decoder

Also supports indexed editing and indexed/RGBA8 encoding.
Native samples and rendering remain distinct:
depths 1/2/4/8 use one Uint8Array element per sample or palette index,
depth 16 uses one Uint16Array element per sample.
Duplicate palette colors retain separate slots. Use toRGBA() explicitly for rendering.

Input is copied by default. With `copyInput: false`,
you must not mutate the borrowed bytes while the instance is in use.
Chunk payloads are read-only views by convention.
Native pixels are decoded lazily and cached after success.

**Kind**: global class  
**Extends**: <code>DataBuffer</code>  
**See**

- [Chunk Specifications](http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html)
- [The Art of PNG Glitch](https://ucnv.github.io/pnglitch/)
- [PngSuite, test-suite for PNG](http://www.schaik.com/pngsuite/)
- [Chunk Specifications (LibPNG)](http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html)
- [Chunk Specifications (W3C)](https://www.w3.org/TR/PNG-Chunks.html)
- [PNGs containing a chunk with length 0xffffffff](http://www.simplesystems.org/libpng/FFFF/)
- [PNG files can be animated via network latency](https://news.ycombinator.com/item?id=27579759)
- [TweakPNG](https://github.com/jsummers/tweakpng)


* [ImagePNG](#ImagePNG) ⇐ <code>DataBuffer</code>
    * [new ImagePNG(input, options)](#new_ImagePNG_new)
    * _instance_
        * [.width](#ImagePNG+width)
        * [.height](#ImagePNG+height)
        * [.bitDepth](#ImagePNG+bitDepth)
        * [.colorType](#ImagePNG+colorType)
        * [.compressionMethod](#ImagePNG+compressionMethod)
        * [.filterMethod](#ImagePNG+filterMethod)
        * [.interlaceMethod](#ImagePNG+interlaceMethod)
        * [.colors](#ImagePNG+colors)
        * [.alpha](#ImagePNG+alpha)
        * [.palette](#ImagePNG+palette)
        * [.pixels](#ImagePNG+pixels)
        * [.transparency](#ImagePNG+transparency)
        * [.physical](#ImagePNG+physical)
        * [.dataChunks](#ImagePNG+dataChunks)
        * [.header](#ImagePNG+header)
        * [.chunks](#ImagePNG+chunks)
        * [.animated](#ImagePNG+animated)
        * [.options](#ImagePNG+options)
        * [._decoded](#ImagePNG+_decoded)
        * [._limits](#ImagePNG+_limits)
        * [._seenChunks](#ImagePNG+_seenChunks)
        * [._dataEnded](#ImagePNG+_dataEnded)
        * [.setBitDepth(bitDepth)](#ImagePNG+setBitDepth)
        * [.setColorType(colorType)](#ImagePNG+setColorType)
        * [.setCompressionMethod(compressionMethod)](#ImagePNG+setCompressionMethod)
        * [.setFilterMethod(filterMethod)](#ImagePNG+setFilterMethod)
        * [.setInterlaceMethod(interlaceMethod)](#ImagePNG+setInterlaceMethod)
        * [.setPalette(palette)](#ImagePNG+setPalette)
        * [.invalidatePixels()](#ImagePNG+invalidatePixels)
        * [.parse()](#ImagePNG+parse) ⇒
        * [.decodeHeader()](#ImagePNG+decodeHeader)
        * [.decodeChunk()](#ImagePNG+decodeChunk) ⇒ <code>string</code>
        * [.decodeIHDR(chunk)](#ImagePNG+decodeIHDR)
        * [.decodePLTE(chunk)](#ImagePNG+decodePLTE)
        * [.decodeIDAT(chunk)](#ImagePNG+decodeIDAT)
        * [.decodeTRNS(chunk)](#ImagePNG+decodeTRNS)
        * [.decodePHYS(chunk)](#ImagePNG+decodePHYS)
        * [.decodeIEND(chunk)](#ImagePNG+decodeIEND)
        * [._expectedInflatedBytes(interlaceMethod)](#ImagePNG+_expectedInflatedBytes) ⇒
        * [.decodePixels(options)](#ImagePNG+decodePixels) ⇒
        * [.interlaceNone(data)](#ImagePNG+interlaceNone) ⇒
        * [.interlaceAdam7(data)](#ImagePNG+interlaceAdam7) ⇒
        * [._decodeScanlines(data, interlaceMethod)](#ImagePNG+_decodeScanlines) ⇒
        * [.toIndexed(options)](#ImagePNG+toIndexed) ⇒
        * [.toRGBA(options)](#ImagePNG+toRGBA) ⇒
        * [.getPixel(x, y)](#ImagePNG+getPixel) ⇒
        * [.getPixelInto(x, y, output, offset)](#ImagePNG+getPixelInto) ⇒
        * [._paletteRGBA()](#ImagePNG+_paletteRGBA) ⇒
        * [._transparencyKey()](#ImagePNG+_transparencyKey) ⇒
        * [._writePixel(pixel, output, offset, key)](#ImagePNG+_writePixel)
    * _static_
        * [.fromFile(data, options)](#ImagePNG.fromFile) ⇒ [<code>ImagePNG</code>](#ImagePNG)
        * [.fromBuffer(buffer, options)](#ImagePNG.fromBuffer) ⇒
        * [.encodeIndexed(image, options)](#ImagePNG.encodeIndexed) ⇒
        * [.createIndexedPng(image, options)](#ImagePNG.createIndexedPng) ⇒
        * [.encodeRGBA(image, options)](#ImagePNG.encodeRGBA) ⇒
        * [.rewriteIndexed(source, edit, options)](#ImagePNG.rewriteIndexed) ⇒
        * [.rewriteIndexedPng(source, edit, options)](#ImagePNG.rewriteIndexedPng) ⇒
        * [._encodeIndexedData(image, bitDepth, options, limits)](#ImagePNG._encodeIndexedData) ⇒
        * [._encodeRows(height, rowBytes, bpp, fillRow, options, limits)](#ImagePNG._encodeRows) ⇒
        * [.unFilterNone(pixels, scanline, bpp, offset, length)](#ImagePNG.unFilterNone) ⇒
        * [.unFilterSub(pixels, scanline, bpp, offset, length)](#ImagePNG.unFilterSub) ⇒
        * [.unFilterUp(pixels, scanline, bpp, offset, length)](#ImagePNG.unFilterUp) ⇒
        * [.unFilterAverage(pixels, scanline, bpp, offset, length)](#ImagePNG.unFilterAverage) ⇒
        * [.unFilterPaeth(pixels, scanline, bpp, offset, length)](#ImagePNG.unFilterPaeth) ⇒

<a name="new_ImagePNG_new"></a>

### new ImagePNG(input, options)
Creates a new ImagePNG.

The container is validated immediately; native pixels are decoded on demand.

**Throws**:

- <code>Error</code> Signature, framing, CRC, ordering, or metadata are invalid.


| Param | Description |
| --- | --- |
| input | The data to process. |
| options | Ownership, allocation limits, and format policies. |

**Example** *(new ImagePNG(list, options))*  
```js
const image_data = await FileUtility.readFile('./test/assets/PngSuite', 'oi1n0g16', 'png', null);
const image = ImagePNG.fromFile(image_data);
image.decodePixels();
const length = image.pixels.length;
// One element per native sample, including 16-bit samples.
const pixel = image.getPixel(0, 0);
 ➜ [255, 255, 255, 255]
```
<a name="ImagePNG+width"></a>

### imagePNG.width
Pixel Width

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+height"></a>

### imagePNG.height
Pixel Height

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+bitDepth"></a>

### imagePNG.bitDepth
Image Bit Depth, one of: 1, 2, 4, 8, 16

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+colorType"></a>

### imagePNG.colorType
Defines pixel structure, one of: 0, 2, 3, 4, 6

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+compressionMethod"></a>

### imagePNG.compressionMethod
Type of compression, always 0

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+filterMethod"></a>

### imagePNG.filterMethod
Type of filtering, always 0

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+interlaceMethod"></a>

### imagePNG.interlaceMethod
Type of interlacing, one of: 0, 1

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+colors"></a>

### imagePNG.colors
Number of native samples per pixel, not the number of packed bytes.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+alpha"></a>

### imagePNG.alpha
True when the image has an alpha transparency layer

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+palette"></a>

### imagePNG.palette
Raw Color data

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+pixels"></a>

### imagePNG.pixels
Row-major native samples, with one element per sample or index.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+transparency"></a>

### imagePNG.transparency
Raw Transparency data

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+physical"></a>

### imagePNG.physical
Object containing physical dimension information

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+dataChunks"></a>

### imagePNG.dataChunks
Image Data pieces

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+header"></a>

### imagePNG.header
PNG Signature from the data

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+chunks"></a>

### imagePNG.chunks
Validated chunks, including views of their original framing and CRC.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+animated"></a>

### imagePNG.animated
Whether animation chunks were found under the explicit default-image policy.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+options"></a>

### imagePNG.options
Decoder policies captured at construction.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+_decoded"></a>

### imagePNG.\_decoded
True when the image has been decoded

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+_limits"></a>

### imagePNG.\_limits
Validated allocation bounds, reused for parsing and decoding.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+_seenChunks"></a>

### imagePNG.\_seenChunks
Chunk names used for singleton and ordering checks.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+_dataEnded"></a>

### imagePNG.\_dataEnded
Whether a non-IDAT chunk has ended the contiguous IDAT sequence.

**Kind**: instance property of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+setBitDepth"></a>

### imagePNG.setBitDepth(bitDepth)
Sets the bitDepth on the ImagePNG instance.

Discard samples decoded with the old layout. The complete color/depth
combination is checked before decoding.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> The depth is invalid or disabled by caller policy.


| Param | Description |
| --- | --- |
| bitDepth | The bitDepth to set, one of: 1, 2, 4, 8, 16 |

<a name="ImagePNG+setColorType"></a>

### imagePNG.setColorType(colorType)
Sets the colorType on the ImagePNG instance.
Both color and alpha properties are inferred from the colorType.

| Color Type | Allowed Bit Depths | Interpretation |
|------------|--------------------|----------------|
| 0          | 1, 2, 4, 8, 16     | Each pixel is a grayscale sample.
| 2          | 8, 16              | Each pixel is an R, G, B triple.
| 3          | 1, 2, 4, 8         | Each pixel is a palette index; a `PLTE` chunk must appear.
| 4          | 8, 16              | Each pixel is a grayscale sample, followed by an alpha sample.
| 6          | 8, 16              | Each pixel is an R, G, B triple, followed by an alpha sample.

Discard samples decoded with the old layout.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> Invalid Color Type, anything other than 0, 2, 3, 4, 6


| Param | Description |
| --- | --- |
| colorType | The colorType to set, one of: 0, 2, 3, 4, 6 |

<a name="ImagePNG+setCompressionMethod"></a>

### imagePNG.setCompressionMethod(compressionMethod)
Sets the compressionMethod on the ImagePNG instance.
The compressionMethod should always be 0.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> Unsupported Compression Method, anything other than 0


| Param | Description |
| --- | --- |
| compressionMethod | The compressionMethod to set, always 0 |

<a name="ImagePNG+setFilterMethod"></a>

### imagePNG.setFilterMethod(filterMethod)
Sets the filterMethod on the ImagePNG instance.
The filterMethod should always be 0.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> Unsupported Filter Method, anything other than 0


| Param | Description |
| --- | --- |
| filterMethod | The filterMethod to set, always 0 |

<a name="ImagePNG+setInterlaceMethod"></a>

### imagePNG.setInterlaceMethod(interlaceMethod)
Sets the interlaceMethod on the ImagePNG instance.
The interlaceMethod should always be 0 or 1.

Discard samples decoded with the old layout.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> Unsupported Interlace Method, anything other than 0 or 1


| Param | Description |
| --- | --- |
| interlaceMethod | The interlaceMethod to set, always 0 or 1 |

<a name="ImagePNG+setPalette"></a>

### imagePNG.setPalette(palette)
Sets the palette on the ImagePNG instance.

Palette slots retain their identity; duplicate RGB triples are not deduplicated.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> No colors in the palette
- <code>Error</code> Too many colors for the current bit depth
- <code>Error</code> Components, transparency length, or referenced slots are invalid.


| Param | Description |
| --- | --- |
| palette | The palette to set |

<a name="ImagePNG+invalidatePixels"></a>

### imagePNG.invalidatePixels()
Discard decoded native samples without changing the original compressed IDAT data.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+parse"></a>

### imagePNG.parse() ⇒
Parse the PNG file, decoding the supported chunks.

Start from the beginning and reset metadata and cached samples.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: This image.  
**Throws**:

- <code>Error</code> Required chunks are missing or any chunk fails validation.

<a name="ImagePNG+decodeHeader"></a>

### imagePNG.decodeHeader()
Decodes and validates PNG Header.
Signature (Decimal): [137, 80, 78, 71, 13, 10, 26, 10]
Signature (Hexadecimal): [89, 50, 4E, 47, 0D, 0A, 1A, 0A]
Signature (ASCII): [\211, P, N, G, \r, \n, \032, \n]

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> Missing or invalid PNG header
- <code>Error</code> The header is not being read from offset zero.

**See**: [PNG Signature](http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature)  
<a name="ImagePNG+decodeChunk"></a>

### imagePNG.decodeChunk() ⇒ <code>string</code>
Decodes the chunk type, and attempts to parse that chunk if supported.
Supported Chunk Types: IHDR, PLTE, IDAT, IEND, tRNS, pHYs

Chunk Structure:
Length: 4 bytes
Type:   4 bytes (IHDR, PLTE, IDAT, IEND, etc.)
Chunk:  {length} bytes
CRC:    4 bytes

Validate CRCs, chunk ordering, and bounds before dispatching.
Ancillary records retain their original framing for indexed rewriting.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: <code>string</code> - Chunk Type  
**Throws**:

- <code>Error</code> Invalid chunk length, CRC, ordering, or critical chunk type.

**See**: [Chunk Layout](http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout)  
<a name="ImagePNG+decodeIHDR"></a>

### imagePNG.decodeIHDR(chunk)
Decode the IHDR (Image header) chunk.
Should be the first chunk in the data stream.

Width:              4 bytes
Height:             4 bytes
Bit Depth:          1 byte
Colour Type:        1 byte
Compression Method: 1 byte
Filter Method:      1 byte
Interlace Method:   1 byte

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> Dimensions, sample layout, or PNG methods are invalid.

**See**

- [Image Header](http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR)
- [Image Header](http://www.libpng.org/pub/png/spec/1.2/png-1.2-pdg.html#C.IHDR)


| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="ImagePNG+decodePLTE"></a>

### imagePNG.decodePLTE(chunk)
Decode the PLTE (Palette) chunk.
The PLTE chunk contains from 1 to 256 palette entries, each a three-byte series of the form.
The number of entries is determined from the chunk length. A chunk length not divisible by 3 is an error.

Preserve the original palette slot order, including duplicate colors.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**See**: [Palette](http://www.w3.org/TR/PNG/#11PLTE)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="ImagePNG+decodeIDAT"></a>

### imagePNG.decodeIDAT(chunk)
Decode the IDAT (Image Data) chunk.
The IDAT chunk contains the actual image data which is the output stream of the compression algorithm.

Retain a payload view for bounded inflation on demand and invalidate cached
samples. Empty IDAT chunks are legal.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**See**: [Image Data](http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="ImagePNG+decodeTRNS"></a>

### imagePNG.decodeTRNS(chunk)
Decode the tRNS (Transparency) chunk.
The tRNS chunk specifies that the image uses simple transparency: either alpha values associated with palette entries (for indexed-color images) or a single transparent color (for grayscale and truecolor images). Although simple transparency is not as elegant as the full alpha channel, it requires less storage space and is sufficient for many common cases.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> Transparency is incompatible with the color type or sample depth.

**See**: [Transparency](https://www.w3.org/TR/PNG/#11tRNS)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="ImagePNG+decodePHYS"></a>

### imagePNG.decodePHYS(chunk)
Decode the pHYs (Pixel Dimensions) chunk.
The pHYs chunk specifies the intended pixel size or aspect ratio for display of the image.
When the unit specifier is 0, the pHYs chunk defines pixel aspect ratio only; the actual size of the pixels remains unspecified.
If the pHYs chunk is not present, pixels are assumed to be square, and the physical size of each pixel is unspecified.

Structure:
Pixels per unit, X axis: 4 bytes (unsigned integer)
Pixels per unit, Y axis: 4 bytes (unsigned integer)
Unit specifier:          1 byte
0: unit is unknown
1: unit is the meter

Keep the raw pixels-per-unit values. When unit is 1, multiplying by 0.0254
converts pixels per meter to pixels per inch without changing stored metadata.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> The length or unit specifier is invalid.

**See**: [Pixel Dimensions](https://www.w3.org/TR/PNG/#11pHYs)  

| Param | Description |
| --- | --- |
| chunk | Data Blob |

<a name="ImagePNG+decodeIEND"></a>

### imagePNG.decodeIEND(chunk)
Decode the IEND (Image trailer) chunk.
The IEND chunk marks the end of the PNG DataBuffer. The chunk's data field is empty.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Throws**:

- <code>Error</code> IEND contains data.

**See**: [Image Trailer](http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND)  

| Param | Description |
| --- | --- |
| chunk | The IEND payload, which must have no bytes. |

<a name="ImagePNG+_expectedInflatedBytes"></a>

### imagePNG.\_expectedInflatedBytes(interlaceMethod) ⇒
Measure the exact decompressed layout, including filter bytes for each pass.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Expected filtered scanline byte count.  
**Throws**:

- <code>Error</code> The layout is invalid or exceeds the inflation limit.


| Param | Description |
| --- | --- |
| interlaceMethod | The layout to measure; defaults to the current IHDR value. |

<a name="ImagePNG+decodePixels"></a>

### imagePNG.decodePixels(options) ⇒
Uncompress IDAT chunks.

Reverse scanline filters and unpack native samples after bounded inflation.
Successful decodes are cached. Forcing a decode discards in-memory pixel edits
and reconstructs the source IDAT; failures never expose partial pixel buffers.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Row-major native samples, retaining original palette indexes.  
**Throws**:

- <code>Error</code> No IDAT chunks to decode
- <code>Error</code> Deinterlacing Error
- <code>Error</code> Inflating Error
- <code>Error</code> Compressed data, scanline lengths, filters, or indexes are invalid.


| Param | Description |
| --- | --- |
| options | Cache control for this decode. |
| options.force | Discard cached samples and decode the source again. |

<a name="ImagePNG+interlaceNone"></a>

### imagePNG.interlaceNone(data) ⇒
Deinterlace with no interlacing.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Native samples, also stored in pixels on success.  
**See**: [PNG Filters](https://www.w3.org/TR/PNG-Filters.html)  

| Param | Description |
| --- | --- |
| data | Data to deinterlace. |

<a name="ImagePNG+interlaceAdam7"></a>

### imagePNG.interlaceAdam7(data) ⇒
Deinterlace with Adam7 interlacing.
Adam7 divides the image into 7 passes with different starting positions and step sizes.

Empty passes consume neither filter bytes nor row bytes. Scatter decoded
samples into row-major image order without converting palette indexes.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Native samples, also stored in pixels on success.  
**See**

- [PNG Adam7 Interlacing](https://www.w3.org/TR/PNG/#8Interlace)
- [https://github.com/em2046/lens/blob/master/assets/js/interlace.js](https://github.com/em2046/lens/blob/master/assets/js/interlace.js)
- [https://github.com/em2046/aperture/tree/master/lib/png/chunks](https://github.com/em2046/aperture/tree/master/lib/png/chunks)
- [https://github.com/beejjorgensen/jsmandel/blob/master/src/js/adam7.js](https://github.com/beejjorgensen/jsmandel/blob/master/src/js/adam7.js)
- [http://diyhpl.us/~yenatch/pokecrystal/src/pypng/code/png.py](http://diyhpl.us/~yenatch/pokecrystal/src/pypng/code/png.py)
- [https://github.com/SixLabors/ImageSharp/blob/master/src/ImageSharp/Formats/Png/Adam7.cs](https://github.com/SixLabors/ImageSharp/blob/master/src/ImageSharp/Formats/Png/Adam7.cs)


| Param | Description |
| --- | --- |
| data | Data to deinterlace. |

<a name="ImagePNG+_decodeScanlines"></a>

### imagePNG.\_decodeScanlines(data, interlaceMethod) ⇒
Share row reconstruction and native sample unpacking across interlace modes.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: The fully reconstructed native sample buffer.  

| Param | Description |
| --- | --- |
| data | Exact filtered scanline bytes. |
| interlaceMethod | Zero for the full image, or one for Adam7 passes. |

<a name="ImagePNG+toIndexed"></a>

### imagePNG.toIndexed(options) ⇒
Get indexed pixels without flattening duplicate palette colors.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Native indexes, newly expanded RGBA slots, and original index depth.  
**Throws**:

- <code>Error</code> The source is not indexed.


| Param | Description |
| --- | --- |
| options | Index-buffer ownership. |
| options.copy | False to borrow decoded indexes; defaults to true. |

<a name="ImagePNG+toRGBA"></a>

### imagePNG.toRGBA(options) ⇒
Convert native samples to straight-alpha RGBA8 for rendering.
Sixteen-bit values are rounded to the nearest eight-bit value after testing
native transparency keys. Native samples and indexes remain unchanged.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: The RGBA surface; other source formats always require a new buffer.  

| Param | Description |
| --- | --- |
| options | Output-buffer ownership for an RGBA8 source. |
| options.copy | False to share existing RGBA8 samples; defaults to true. |

<a name="ImagePNG+getPixel"></a>

### imagePNG.getPixel(x, y) ⇒
Get the pixel color at a specified x, y location.

Decode native samples on demand, then convert the selected pixel to RGBA8.
Sixteen-bit samples are rounded after testing native transparency keys.
Prefer toRGBA() for bulk conversion or getPixelInto() for reusable output.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: the color as [red, green, blue, alpha]  
**Throws**:

- <code>Error</code> x is out of bound for the image
- <code>Error</code> y is out of bound for the image
- <code>Error</code> Unknown color types


| Param | Description |
| --- | --- |
| x | The hoizontal offset to read. |
| y | The vertical offset to read. |

<a name="ImagePNG+getPixelInto"></a>

### imagePNG.getPixelInto(x, y, output, offset) ⇒
Write an RGBA8 pixel into a caller-owned buffer without allocating an output tuple.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: The same output buffer.  

| Param | Default | Description |
| --- | --- | --- |
| x |  | Horizontal pixel coordinate. |
| y |  | Vertical pixel coordinate. |
| output |  | Destination bytes. |
| offset | <code>0</code> | First of four writable destination bytes. |

<a name="ImagePNG+_paletteRGBA"></a>

### imagePNG.\_paletteRGBA() ⇒
Expand RGB palette metadata into newly owned RGBA tuples without remapping slots.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Palette slots, with full opacity for entries omitted from tRNS.  
<a name="ImagePNG+_transparencyKey"></a>

### imagePNG.\_transparencyKey() ⇒
Read a grayscale/RGB transparency key in native sample precision.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Key components, or an empty array when there is no color key.  
<a name="ImagePNG+_writePixel"></a>

### imagePNG.\_writePixel(pixel, output, offset, key)
Write one native pixel as RGBA8, retaining RGB beneath transparent alpha.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  

| Param | Description |
| --- | --- |
| pixel | Row-major pixel index, not a byte offset. |
| output | Destination array or byte buffer. |
| offset | Destination byte offset. |
| key | Native transparency components, resolved once per bulk conversion. |

<a name="ImagePNG.fromFile"></a>

### ImagePNG.fromFile(data, options) ⇒ [<code>ImagePNG</code>](#ImagePNG)
Creates a new ImagePNG from file data.

The container is validated immediately; native pixels are decoded on demand.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: [<code>ImagePNG</code>](#ImagePNG) - the new ImagePNG instance for the provided file data  

| Param | Description |
| --- | --- |
| data | The data of the image to process. |
| options | Ownership, allocation limits, and format policies. |

<a name="ImagePNG.fromBuffer"></a>

### ImagePNG.fromBuffer(buffer, options) ⇒
Creates a new ImagePNG from a DataBuffer.

The container is validated immediately; native pixels are decoded on demand.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: the new ImagePNG instance for the provided DataBuffer  

| Param | Description |
| --- | --- |
| buffer | The DataBuffer of the image to process. |
| options | Ownership, allocation limits, and format policies. |

<a name="ImagePNG.encodeIndexed"></a>

### ImagePNG.encodeIndexed(image, options) ⇒
Encode indexed pixels without quantization, palette reordering, or deduplication.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Owned non-interlaced PNG bytes; the default index depth is eight bits.  

| Param | Description |
| --- | --- |
| image | Native indexes and RGBA palette slots. |
| options | Bit depth, filters, compression level, and allocation limits. |

<a name="ImagePNG.createIndexedPng"></a>

### ImagePNG.createIndexedPng(image, options) ⇒
Create an indexed PNG using the encodeIndexed() implementation.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Owned PNG bytes retaining each supplied palette slot.  

| Param | Description |
| --- | --- |
| image | Native indexes and RGBA palette slots. |
| options | Bit depth, filters, compression level, and allocation limits. |

<a name="ImagePNG.encodeRGBA"></a>

### ImagePNG.encodeRGBA(image, options) ⇒
Encode straight-alpha RGBA8 without changing hidden RGB components.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Owned non-interlaced RGBA8 PNG bytes.  

| Param | Description |
| --- | --- |
| image | Dimensions and an exact row-major RGBA8 buffer. |
| options | Filters, compression level, and allocation limits. |

<a name="ImagePNG.rewriteIndexed"></a>

### ImagePNG.rewriteIndexed(source, edit, options) ⇒
Rewrite indexed pixels, dimensions, or same-slot palette entries without an RGBA round trip.
No-op edits return an exact owned copy. Palette-only changes keep the original
IDAT bytes, including Adam7. Pixel edits use new non-interlaced packed rows.
Safe-to-copy ancillary chunks survive edits. Unsafe chunks require explicit
retention after caller-supplied, format-specific validation.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Owned PNG bytes preserving palette slot identities.  
**Throws**:

- <code>Error</code> Palette slot count changes or resizing omits replacement pixels.


| Param | Description |
| --- | --- |
| source | Original PNG file bytes, rather than a mutable decoded model. |
| edit | Palette edits and optional complete pixel/canvas replacements. |
| options | Decoder/encoder limits and optional application validation. |

<a name="ImagePNG.rewriteIndexedPng"></a>

### ImagePNG.rewriteIndexedPng(source, edit, options) ⇒
Rewrite an indexed PNG using rewriteIndexed().

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Owned PNG bytes preserving palette slot identities.  

| Param | Description |
| --- | --- |
| source | Original indexed PNG bytes. |
| edit | Palette edits and optional complete pixel/canvas replacements. |
| options | Decoder/encoder limits and optional application validation. |

<a name="ImagePNG._encodeIndexedData"></a>

### ImagePNG.\_encodeIndexedData(image, bitDepth, options, limits) ⇒
Pack validated indexes into scanlines and compress them for IDAT.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: A complete zlib stream.  

| Param | Description |
| --- | --- |
| image | A validated indexed surface. |
| bitDepth | Number of bits per index. |
| options | Filtering and compression options. |
| limits | Resolved allocation limits. |

<a name="ImagePNG._encodeRows"></a>

### ImagePNG.\_encodeRows(height, rowBytes, bpp, fillRow, options, limits) ⇒
Filter and compress rows for indexed and RGBA8 output.
None is the deterministic, low-CPU default. Adaptive filtering tries all five
predictors and selects the lowest signed-byte residual score for each row.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: A complete zlib stream.  

| Param | Description |
| --- | --- |
| height | Number of scanlines. |
| rowBytes | Packed byte count per row, excluding its filter byte. |
| bpp | Byte distance to the previous pixel for filtering. |
| fillRow | Callback writing one unfiltered row into zero-initialized storage. |
| options | Filtering and compression options. |
| limits | Resolved allocation limits. |

<a name="ImagePNG.unFilterNone"></a>

### ImagePNG.unFilterNone(pixels, scanline, bpp, offset, length) ⇒
No filtering, direct copy.

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Pixels  

| Param | Description |
| --- | --- |
| pixels | Pixels to update. |
| scanline | Scanline to search for pixels in. |
| bpp | Bytes Per Pixel |
| offset | Offset |
| length | Length |

<a name="ImagePNG.unFilterSub"></a>

### ImagePNG.unFilterSub(pixels, scanline, bpp, offset, length) ⇒
The Sub() filter transmits the difference between each byte and the value of the corresponding byte of the prior pixel.
Sub(x) = Raw(x) + Raw(x - bpp)

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Pixels  

| Param | Description |
| --- | --- |
| pixels | Pixels to update. |
| scanline | Scanline to search for pixels in. |
| bpp | Bytes Per Pixel |
| offset | Offset |
| length | Length |

<a name="ImagePNG.unFilterUp"></a>

### ImagePNG.unFilterUp(pixels, scanline, bpp, offset, length) ⇒
The Up() filter is just like the Sub() filter except that the pixel immediately above the current pixel, rather than just to its left, is used as the predictor.
Up(x) = Raw(x) + Prior(x)

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Pixels  

| Param | Description |
| --- | --- |
| pixels | Pixels to update. |
| scanline | Scanline to search for pixels in. |
| bpp | Bytes Per Pixel |
| offset | Offset |
| length | Length |

<a name="ImagePNG.unFilterAverage"></a>

### ImagePNG.unFilterAverage(pixels, scanline, bpp, offset, length) ⇒
The Average() filter uses the average of the two neighboring pixels (left and above) to predict the value of a pixel.
Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Pixels  

| Param | Description |
| --- | --- |
| pixels | Pixels to update. |
| scanline | Scanline to search for pixels in. |
| bpp | Bytes Per Pixel |
| offset | Offset |
| length | Length |

<a name="ImagePNG.unFilterPaeth"></a>

### ImagePNG.unFilterPaeth(pixels, scanline, bpp, offset, length) ⇒
The Paeth() filter computes a simple linear function of the three neighboring pixels (left, above, upper left), then chooses as predictor the neighboring pixel closest to the computed value.
This technique was developed by Alan W. Paeth.
Paeth(x) = Raw(x) + PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
function PaethPredictor (a, b, c)
begin
; a = left, b = above, c = upper left
p := a + b - c        ; initial estimate
pa := abs(p - a)      ; distances to a, b, c
pb := abs(p - b)
pc := abs(p - c)
; return nearest of a,b,c,
; breaking ties in order a,b,c.
if pa <= pb AND pa <= pc then return a
else if pb <= pc then return b
else return c
end

**Kind**: static method of [<code>ImagePNG</code>](#ImagePNG)  
**Returns**: Pixels  

| Param | Description |
| --- | --- |
| pixels | Pixels to update. |
| scanline | Scanline to search for pixels in. |
| bpp | Bytes Per Pixel |
| offset | Offset |
| length | Length |

<a name="PNG_SIGNATURE"></a>

## PNG\_SIGNATURE
Eight-byte PNG signature.

**Kind**: global constant  
<a name="ADAM7_PASSES"></a>

## ADAM7\_PASSES
Adam7 pass order: start x, start y, step x, step y.

**Kind**: global constant  
<a name="SINGLE_PASS"></a>

## SINGLE\_PASS
Non-interlaced images use the same row reconstruction with a single pass.

**Kind**: global constant  
<a name="COLOR_DEPTHS"></a>

## COLOR\_DEPTHS
Allowed sample depths for every PNG color type.

**Kind**: global constant  
<a name="ANIMATION_CHUNKS"></a>

## ANIMATION\_CHUNKS
Animation is detected, but frame decoding is outside the static PNG API.

**Kind**: global constant  
<a name="DEFAULT_LIMITS"></a>

## DEFAULT\_LIMITS
Default bounds for source data, decoded images, and encoded output.

**Kind**: global constant  
<a name="debug"></a>

## debug()
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global function  
<a name="zlibState"></a>

## zlibState(inflator) ⇒
Read the private zlib stream. The counters reject trailing bytes and a second zlib stream.

**Kind**: global function  
**Returns**: The live zlib counters for that inflator.  

| Param | Description |
| --- | --- |
| inflator | Streaming inflator whose stream is not part of the public type. |

<a name="resolveLimits"></a>

## resolveLimits(options) ⇒
Resolve and validate caller-provided allocation limits.

**Kind**: global function  
**Returns**: The complete set of validated limits.  

| Param | Description |
| --- | --- |
| options | Optional limits, with omitted values using the defaults. |

<a name="prepareInput"></a>

## prepareInput(input, options, maxInputBytes) ⇒
Normalize PNG input while respecting a typed array's exact byte range.

**Kind**: global function  
**Returns**: Owned bytes, or a borrowed view when copyInput is explicitly false.  

| Param | Description |
| --- | --- |
| input | The source bytes or DataBuffer. |
| options | Input ownership and supported-format policies. |
| maxInputBytes | Maximum source byte count. |

<a name="passLength"></a>

## passLength(size, start, step) ⇒
Count samples along one dimension of an interlace pass.

**Kind**: global function  
**Returns**: The sample count, including zero for an empty pass.  

| Param | Description |
| --- | --- |
| size | The full image dimension. |
| start | The pass's starting coordinate. |
| step | The sampling stride. |

<a name="paethPredictor"></a>

## paethPredictor(left, above, upperLeft) ⇒
Select the Paeth predictor, resolving ties in left, above, upper-left order.

**Kind**: global function  
**Returns**: The neighboring byte closest to the linear prediction.  

| Param | Description |
| --- | --- |
| left | The reconstructed byte to the left. |
| above | The reconstructed byte in the preceding row. |
| upperLeft | The previous row's byte to the left. |

<a name="unfilterRow"></a>

## unfilterRow(row, previous, bpp, length, filter)
Reconstruct an owned filtered row in place; no per-byte allocations are made.

**Kind**: global function  

| Param | Description |
| --- | --- |
| row | Filtered row bytes, replaced with reconstructed bytes. |
| previous | Previous reconstructed row, zeroed at the start of each pass. |
| bpp | Byte distance to the preceding pixel, rounded up to at least one. |
| length | Number of bytes used by this row. |
| filter | PNG filter number, zero through four. |

<a name="unfilterScanline"></a>

## unfilterScanline(filter, pixels, scanline, bpp, offset, length) ⇒
Adapt the original public unfilter signature to the shared row implementation.
The main decoder reuses its own row buffers and does not allocate through this adapter.

**Kind**: global function  
**Returns**: The same destination buffer.  

| Param | Description |
| --- | --- |
| filter | PNG filter number. |
| pixels | Destination bytes, including any preceding reconstructed row. |
| scanline | Filtered scanline bytes. |
| bpp | Byte distance to the preceding pixel. |
| offset | Destination offset of this row. |
| length | Row length in bytes. |

<a name="validateIndexed"></a>

## validateIndexed(image, bitDepth, maxPixels)
Validate indexed input without quantization, reordering, or slot deduplication.

**Kind**: global function  

| Param | Description |
| --- | --- |
| image | Dimensions, native indexes, and RGBA palette slots. |
| bitDepth | Packed index depth. |
| maxPixels | Maximum number of image pixels. |

<a name="joinChunks"></a>

## joinChunks(parts, maxBytes) ⇒
Join complete PNG chunks into owned output after checking its total size.

**Kind**: global function  
**Returns**: The complete file bytes.  

| Param | Description |
| --- | --- |
| parts | Signature and framed chunks in file order. |
| maxBytes | Maximum output byte count. |

<a name="makeChunk"></a>

## makeChunk(type, data) ⇒
Frame a PNG chunk and calculate its numeric CRC without hexadecimal conversion.

**Kind**: global function  
**Returns**: Length, type, payload, and CRC in PNG byte order.  

| Param | Description |
| --- | --- |
| type | The four-letter chunk identifier. |
| data | Unframed payload bytes. |

<a name="makeHeader"></a>

## makeHeader(width, height, bitDepth, colorType) ⇒
Build a non-interlaced IHDR payload from validated image properties.

**Kind**: global function  
**Returns**: Thirteen IHDR bytes with compression, filtering, and interlacing set to zero.  

| Param | Description |
| --- | --- |
| width | Image width. |
| height | Image height. |
| bitDepth | Sample depth. |
| colorType | PNG color type. |

<a name="makePaletteChunks"></a>

## makePaletteChunks(palette) ⇒
Create palette chunks retaining all slots, including duplicates and unused colors.

**Kind**: global function  
**Returns**: Framed PLTE and tRNS chunks.  

| Param | Description |
| --- | --- |
| palette | Validated RGBA8 palette slots in original order. |

