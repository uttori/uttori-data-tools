## Classes

<dl>
<dt><a href="#GifWriter">GifWriter</a></dt>
<dd><p>Small bounded byte writer, used for framing and owned file output.</p>
</dd>
<dt><a href="#ImageGIF">ImageGIF</a></dt>
<dd><p>GIF Decoder</p>
<p>Indexed decoding/editing and indexed/RGBA8 encoding share ImagePNG&#39;s surface contracts.
Native pixels are frame-local indexes; toRGBA() renders a logical-screen snapshot.
Files are copied by default. Borrowed bytes and block views are read-only by convention.
Container structure is checked immediately, while raster decompression remains lazy.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#DEFAULT_LIMITS">DEFAULT_LIMITS</a></dt>
<dd><p>Default allocation and work limits; caller overrides must be positive safe integers.</p>
</dd>
<dt><a href="#GIF_PASSES">GIF_PASSES</a></dt>
<dd><p>Four GIF interlace passes, expressed as starting row and row stride.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a> : <code><a href="#DebugLogger">DebugLogger</a></code></dt>
<dd></dd>
<dt><a href="#arrayLengthInRange">arrayLengthInRange()</a></dt>
<dd><p>Length check that does not apply <code>Array.isArray</code>&#39;s <code>any[]</code> predicate to the caller&#39;s binding.</p>
</dd>
<dt><a href="#byteString">byteString()</a></dt>
<dd><p>Decode byte-oriented GIF text without UTF-8 replacement or Windows-1252 remapping.</p>
</dd>
<dt><a href="#validateIndexed">validateIndexed()</a></dt>
<dd><p>Validate exact indexes and preserve every palette slot, including duplicates and unused slots.</p>
</dd>
<dt><a href="#writeControl">writeControl()</a></dt>
<dd><p>Write one fully validated graphics-control record.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#DebugLogger">DebugLogger</a> : <code>function</code></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
</dl>

<a name="GifWriter"></a>

## GifWriter
Small bounded byte writer, used for framing and owned file output.

**Kind**: global class  
<a name="ImageGIF"></a>

## ImageGIF
GIF Decoder

Indexed decoding/editing and indexed/RGBA8 encoding share ImagePNG's surface contracts.
Native pixels are frame-local indexes; toRGBA() renders a logical-screen snapshot.
Files are copied by default. Borrowed bytes and block views are read-only by convention.
Container structure is checked immediately, while raster decompression remains lazy.

**Kind**: global class  
**See**

- [Graphics Interchange Format (GIF) Specification](http://www.w3.org/Graphics/GIF/spec-gif87.txt)
- [GIF89a Specification](http://www.w3.org/Graphics/GIF/spec-gif89a.txt)

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| width | <code>number</code> | Pixel Width |
| height | <code>number</code> | Pixel Height |
| bitDepth | <code>number</code> | Palette index depth, from 1 through 8 |
| colorType | <code>number</code> | Defines pixel structure, always 3 for indexed GIF pixels |
| colors | <code>number</code> | Number of colors in the image |
| alpha | <code>boolean</code> | True when the image has an alpha transparency layer |
| palette | <code>Array.&lt;number&gt;</code> \| <code>Uint8Array</code> | Raw Color data |
| pixels | <code>Uint8Array</code> | Raw Image Pixel data |
| transparency | <code>Uint8Array</code> | Raw Transparency data |
| header | <code>string</code> | GIF Signature from the data |


* [ImageGIF](#ImageGIF)
    * [new ImageGIF(input, options)](#new_ImageGIF_new)
    * _instance_
        * [.header](#ImageGIF+header)
        * [.version](#ImageGIF+version)
        * [.width](#ImageGIF+width)
        * [.height](#ImageGIF+height)
        * [.bitDepth](#ImageGIF+bitDepth)
        * [.colorType](#ImageGIF+colorType)
        * [.colors](#ImageGIF+colors)
        * [.alpha](#ImageGIF+alpha)
        * [.palette](#ImageGIF+palette)
        * [.pixels](#ImageGIF+pixels)
        * [.transparency](#ImageGIF+transparency)
        * [.frames](#ImageGIF+frames)
        * [.comments](#ImageGIF+comments)
        * [.applicationExtensions](#ImageGIF+applicationExtensions)
        * [.imageDescriptors](#ImageGIF+imageDescriptors)
        * [.plainTextExtensions](#ImageGIF+plainTextExtensions)
        * [.imageNext](#ImageGIF+imageNext)
        * [.options](#ImageGIF+options)
        * [.sizeOfGlobalColorTable](#ImageGIF+sizeOfGlobalColorTable)
        * [.globalColorTable](#ImageGIF+globalColorTable)
        * [.colorResolution](#ImageGIF+colorResolution)
        * [.sortFlag](#ImageGIF+sortFlag)
        * [.backgroundColorIndex](#ImageGIF+backgroundColorIndex)
        * [.pixelAspectRatio](#ImageGIF+pixelAspectRatio)
        * [.packed](#ImageGIF+packed)
        * [.blocks](#ImageGIF+blocks)
        * [.loopCount](#ImageGIF+loopCount)
        * [.animated](#ImageGIF+animated)
        * [._decoded](#ImageGIF+_decoded)
        * [.parse()](#ImageGIF+parse)
        * [.decodeDataSubBlocks()](#ImageGIF+decodeDataSubBlocks) ⇒ <code>Array.&lt;number&gt;</code>
        * [._decodeDataSubBlocks()](#ImageGIF+_decodeDataSubBlocks)
        * [._requireBytes()](#ImageGIF+_requireBytes)
        * [._countBlock()](#ImageGIF+_countBlock)
        * [.decodeHeader()](#ImageGIF+decodeHeader)
        * [.decodeLogicalScreenDescriptor()](#ImageGIF+decodeLogicalScreenDescriptor)
        * [.decodeGlobalColorTable()](#ImageGIF+decodeGlobalColorTable)
        * [.invalidatePixels()](#ImageGIF+invalidatePixels)
        * [._frame()](#ImageGIF+_frame)
        * [._paletteForFrame()](#ImageGIF+_paletteForFrame)
        * [._paletteRGBA()](#ImageGIF+_paletteRGBA)
        * [.decodePixels(options)](#ImageGIF+decodePixels) ⇒
        * [.toIndexed()](#ImageGIF+toIndexed)
        * [._renderOptions()](#ImageGIF+_renderOptions)
        * [._backgroundWord()](#ImageGIF+_backgroundWord)
        * [._background()](#ImageGIF+_background)
        * [._render(lastIndex, background)](#ImageGIF+_render) ⇒
        * [.toRGBA()](#ImageGIF+toRGBA)
        * [.decodeFrame()](#ImageGIF+decodeFrame)
        * [.decodeFrames()](#ImageGIF+decodeFrames)
        * [.getPixel(x, y, options)](#ImageGIF+getPixel) ⇒
        * [.getPixelInto()](#ImageGIF+getPixelInto)
        * [._writePixel()](#ImageGIF+_writePixel)
    * _static_
        * [.fromFile(data, opts)](#ImageGIF.fromFile) ⇒
        * [.fromBuffer(buffer, opts)](#ImageGIF.fromBuffer) ⇒
        * [.encodeIndexed()](#ImageGIF.encodeIndexed)
        * [.createIndexedGif()](#ImageGIF.createIndexedGif)
        * [.encodeRGBA()](#ImageGIF.encodeRGBA)
        * [.encodeIndexedFrames()](#ImageGIF.encodeIndexedFrames)
        * [._encodePixels()](#ImageGIF._encodePixels)
        * [.rewriteIndexed()](#ImageGIF.rewriteIndexed)
        * [.rewriteIndexedGif()](#ImageGIF.rewriteIndexedGif)

<a name="new_ImageGIF_new"></a>

### new ImageGIF(input, options)
Creates a new ImageGIF.


| Param | Description |
| --- | --- |
| input | The data to process. |
| options | Options for this ImageGIF instance. |

**Example** *(new ImageGIF(list, options))*  
```js
const image_data = await fs.readFile('./test/image/assets/sundisk04.gif');
const image = ImageGIF.fromFile(image_data);
image.decodePixels();
const length = image.pixels.length;
 ➜ 65536
const pixel = image.getPixel(0, 0);
 ➜ [255, 254, 254, 255]
```
<a name="ImageGIF+header"></a>

### imageGIF.header
The GIF signature.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+version"></a>

### imageGIF.version
The GIF version.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+width"></a>

### imageGIF.width
The width of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+height"></a>

### imageGIF.height
The height of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+bitDepth"></a>

### imageGIF.bitDepth
The bit depth of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+colorType"></a>

### imageGIF.colorType
The color type of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+colors"></a>

### imageGIF.colors
The number of colors in the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+alpha"></a>

### imageGIF.alpha
Whether the image has an alpha transparency layer.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+palette"></a>

### imageGIF.palette
The palette of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+pixels"></a>

### imageGIF.pixels
The pixels of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+transparency"></a>

### imageGIF.transparency
The transparency of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+frames"></a>

### imageGIF.frames
The frames of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+comments"></a>

### imageGIF.comments
The comments of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+applicationExtensions"></a>

### imageGIF.applicationExtensions
The application extensions of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+imageDescriptors"></a>

### imageGIF.imageDescriptors
The image descriptors of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+plainTextExtensions"></a>

### imageGIF.plainTextExtensions
The plain text extensions of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+imageNext"></a>

### imageGIF.imageNext
Whether the next byte is an image descriptor.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+options"></a>

### imageGIF.options
Options for the ImageGIF instance.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+sizeOfGlobalColorTable"></a>

### imageGIF.sizeOfGlobalColorTable
The size of the global color table, set while decoding the logical screen descriptor.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+globalColorTable"></a>

### imageGIF.globalColorTable
The global color table of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+colorResolution"></a>

### imageGIF.colorResolution
The color resolution of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+sortFlag"></a>

### imageGIF.sortFlag
The sort flag of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+backgroundColorIndex"></a>

### imageGIF.backgroundColorIndex
The background color index of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+pixelAspectRatio"></a>

### imageGIF.pixelAspectRatio
The pixel aspect ratio of the image.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+packed"></a>

### imageGIF.packed
The packed fields of the image descriptor.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+blocks"></a>

### imageGIF.blocks
Parsed original block boundaries, including the trailer.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+loopCount"></a>

### imageGIF.loopCount
Netscape loop count; zero means infinite and undefined means no loop extension.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+animated"></a>

### imageGIF.animated
Whether more than one raster frame is present.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_decoded"></a>

### imageGIF.\_decoded
True once the first frame's indexes have decoded successfully.

**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+parse"></a>

### imageGIF.parse()
Parse the GIF file, decoding the chunks.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+decodeDataSubBlocks"></a>

### imageGIF.decodeDataSubBlocks() ⇒ <code>Array.&lt;number&gt;</code>
Decodes the Data Sub Blocks.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: <code>Array.&lt;number&gt;</code> - The decoded data  
<a name="ImageGIF+_decodeDataSubBlocks"></a>

### imageGIF.\_decodeDataSubBlocks()
Join validated payloads in one allocation, retaining no per-byte boxed array.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_requireBytes"></a>

### imageGIF.\_requireBytes()
Enforce framing before asking DataBuffer to consume a field.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_countBlock"></a>

### imageGIF.\_countBlock()
Bound parser work even for many empty extensions or one-byte payloads.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+decodeHeader"></a>

### imageGIF.decodeHeader()
Decodes and validates GIF Header.

The header takes up the first six bytes of the file.
These bytes should all correspond to ASCII character codes.
The first three bytes are called the signature.
The next three specify the version of the specification that was used to encode the image.

Signature + Version (Decimal): [71, 73, 70, 56, 57, 97]
Signature + Version (Hexadecimal): [47, 49, 46, 38, 39, 61]
Signature + Version (ASCII): [G, I, F, 8, 9, a]

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
**Throws**:

- <code>Error</code> Missing or invalid GIF header

<a name="ImageGIF+decodeLogicalScreenDescriptor"></a>

### imageGIF.decodeLogicalScreenDescriptor()
Decodes and parse GIF Logical Screen Descriptor.
The logical screen descriptor always immediately follows the header.
This block tells the decoder how much room this image will take up.
It is exactly seven bytes long.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+decodeGlobalColorTable"></a>

### imageGIF.decodeGlobalColorTable()
Decodes the Global Color Table.

GIFs can have either a global color table or local color tables for each sub-image.
Each color table consists of a list of RGB (Red-Green-Blue) color component intensities, three bytes for each color, with intensities ranging from 0 (least) to 255 (most).
The color (0,0,0) is deepest black, the color (255,255,255) brightest white.
This block is "optional" as not every GIF has to specify a global color table.
If the global color table flag is set to 1 in the logical screen descriptor block, the global color table is then required to immediately follow that block.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+invalidatePixels"></a>

### imageGIF.invalidatePixels()
Discard cached native indexes without modifying the original compressed image data.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_frame"></a>

### imageGIF.\_frame()
Validate a raster frame reference independently of the publicly mutable pixel cache.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_paletteForFrame"></a>

### imageGIF.\_paletteForFrame()
Local tables override the global table; missing tables cannot be invented for rendering.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_paletteRGBA"></a>

### imageGIF.\_paletteRGBA()
Expand palette slots without merging duplicate colors or losing transparent RGB.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+decodePixels"></a>

### imageGIF.decodePixels(options) ⇒
Decompress LZW image data to pixels using the first image descriptor by default.
GIF images are always palette-based (indexed color).
Native pixels belong to the image rectangle, not the entire logical screen.
Successful decodes are cached. A forced decode discards edits to that cache.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: Row-major, deinterlaced native palette indexes.  
**Throws**:

- <code>Error</code> No image descriptors found
- <code>Error</code> Invalid LZW codes, pixel count, or palette indexes.


| Param | Description |
| --- | --- |
| options | Frame selection and cache control. |

<a name="ImageGIF+toIndexed"></a>

### imageGIF.toIndexed()
Return native frame indexes and newly owned RGBA slots, preserving palette identity.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_renderOptions"></a>

### imageGIF.\_renderOptions()
Validate rendering choices before allocating pixels or interpreting unsupported graphics.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_backgroundWord"></a>

### imageGIF.\_backgroundWord()
Resolve the logical background as a packed RGBA word without allocating a color tuple.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_background"></a>

### imageGIF.\_background()
Expand a background word for RgbaSurface.fill(); individual pixel reads avoid this allocation.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_render"></a>

### imageGIF.\_render(lastIndex, background) ⇒
Render working snapshots sequentially. The yielded surface is borrowed until iteration resumes.
Restore-to-previous saves only the affected rectangle, rather than an entire canvas per frame.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: A generator of RgbaSurface objects.  

| Param | Description |
| --- | --- |
| lastIndex | The index of the last frame to render. |
| background | The background color to use for the render. |

<a name="ImageGIF+toRGBA"></a>

### imageGIF.toRGBA()
Convert to an owned RgbaSurface for drawing, blitting, cropping, flipping, scaling, or text.
By default return the selected composited logical-screen snapshot. Native indexes are unchanged.
Set composited: false to convert only the selected frame rectangle, retaining hidden RGB.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+decodeFrame"></a>

### imageGIF.decodeFrame()
Decode one animation snapshot, preserving the same rendering choices as toRGBA().

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+decodeFrames"></a>

### imageGIF.decodeFrames()
Decode independently owned logical-screen snapshots with timing and disposal metadata.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+getPixel"></a>

### imageGIF.getPixel(x, y, options) ⇒
Get the pixel color at a specified x, y location.
GIF images are always palette-based (indexed color).
Decode lazily and resolve the selected logical-screen pixel, including frame offsets and disposal.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: The color as [red, green, blue, alpha]  
**Throws**:

- <code>Error</code> Pixel data cannot be decoded
- <code>Error</code> x is out of bound for the image
- <code>Error</code> y is out of bound for the image


| Param | Description |
| --- | --- |
| x | The horizontal offset to read. |
| y | The vertical offset to read. |
| options | Frame and background selection, or composited: false for native coordinates. |

<a name="ImageGIF+getPixelInto"></a>

### imageGIF.getPixelInto()
Write one rendered pixel without allocating a tuple or a full RGBA canvas.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+_writePixel"></a>

### imageGIF.\_writePixel()
Resolve only one pixel through the animation; decoded native frames are reused.

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF.fromFile"></a>

### ImageGIF.fromFile(data, opts) ⇒
Creates a new ImageGIF from file data.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: The new ImageGIF instance for the provided file data  

| Param | Description |
| --- | --- |
| data | The data of the image to process. |
| opts | Options for this ImageGIF instance. |

<a name="ImageGIF.fromBuffer"></a>

### ImageGIF.fromBuffer(buffer, opts) ⇒
Creates a new ImageGIF from a DataBuffer.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: The new ImageGIF instance for the provided DataBuffer  

| Param | Description |
| --- | --- |
| buffer | The DataBuffer of the image to process. |
| opts | Options for this ImageGIF instance. |

<a name="ImageGIF.encodeIndexed"></a>

### ImageGIF.encodeIndexed()
Encode one indexed GIF without quantization, reordering, or palette-slot deduplication.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF.createIndexedGif"></a>

### ImageGIF.createIndexedGif()
Create an indexed GIF using the encodeIndexed() implementation.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF.encodeRGBA"></a>

### ImageGIF.encodeRGBA()
Encode exact RGBA8 colors, including the RGB components beneath transparent alpha.
GIF permits at most 256 palette entries and one transparent slot. Reject unsupported
input rather than silently quantizing colors, merging transparent RGB, or thresholding alpha.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF.encodeIndexedFrames"></a>

### ImageGIF.encodeIndexedFrames()
Encode raster animation frames with local palettes, offsets, delays, looping, and disposal.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF._encodePixels"></a>

### ImageGIF.\_encodePixels()
Convert row-major indexes to GIF pass order only when interlacing is requested.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF.rewriteIndexed"></a>

### ImageGIF.rewriteIndexed()
Rewrite one frame without an RGBA round trip. No-op edits return an exact owned copy.
Same-slot palette changes retain the original framed LZW bytes and interlacing. A local
replacement table isolates edits from other frames that share the global table.
Other extensions are retained byte-for-byte; application-specific payload semantics are not rewritten.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF.rewriteIndexedGif"></a>

### ImageGIF.rewriteIndexedGif()
Rewrite indexed GIF bytes using rewriteIndexed().

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
<a name="DEFAULT_LIMITS"></a>

## DEFAULT\_LIMITS
Default allocation and work limits; caller overrides must be positive safe integers.

**Kind**: global constant  
<a name="GIF_PASSES"></a>

## GIF\_PASSES
Four GIF interlace passes, expressed as starting row and row stride.

**Kind**: global constant  
<a name="debug"></a>

## debug() : [<code>DebugLogger</code>](#DebugLogger)
**Kind**: global function  
<a name="arrayLengthInRange"></a>

## arrayLengthInRange()
Length check that does not apply `Array.isArray`'s `any[]` predicate to the caller's binding.

**Kind**: global function  
<a name="byteString"></a>

## byteString()
Decode byte-oriented GIF text without UTF-8 replacement or Windows-1252 remapping.

**Kind**: global function  
<a name="validateIndexed"></a>

## validateIndexed()
Validate exact indexes and preserve every palette slot, including duplicates and unused slots.

**Kind**: global function  
<a name="writeControl"></a>

## writeControl()
Write one fully validated graphics-control record.

**Kind**: global function  
<a name="DebugLogger"></a>

## DebugLogger : <code>function</code>
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | The arguments to log. |

