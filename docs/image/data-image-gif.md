## Classes

<dl>
<dt><a href="#ImageGIF">ImageGIF</a></dt>
<dd><p>GIF Decoder</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ImageGIFOptions">ImageGIFOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ImageGIFImageDescriptor">ImageGIFImageDescriptor</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="ImageGIF"></a>

## ImageGIF
GIF Decoder

**Kind**: global class  
**See**

- [Graphics Interchange Format (GIF) Specification](http://www.w3.org/Graphics/GIF/spec-gif87.txt)
- [GIF89a Specification](http://www.w3.org/Graphics/GIF/spec-gif89a.txt)

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| width | <code>number</code> | Pixel Width |
| height | <code>number</code> | Pixel Height |
| bitDepth | <code>number</code> | Image Bit Depth, one of: 1, 2, 4, 8, 16 |
| colorType | <code>number</code> | Defines pixel structure, one of: 0, 2, 3, 4, 6 |
| colors | <code>number</code> | Number of colors in the image |
| alpha | <code>boolean</code> | True when the image has an alpha transparency layer |
| palette | <code>Array.&lt;number&gt;</code> \| <code>Uint8Array</code> | Raw Color data |
| pixels | <code>Uint8Array</code> | Raw Image Pixel data |
| transparency | <code>Uint8Array</code> | Raw Transparency data |
| header | <code>Uint8Array</code> | GIF Signature from the data |


* [ImageGIF](#ImageGIF)
    * [new ImageGIF(input, [options])](#new_ImageGIF_new)
    * _instance_
        * [.palette](#ImageGIF+palette) : <code>Uint8Array</code>
        * [.pixels](#ImageGIF+pixels) : <code>Array.&lt;number&gt;</code> \| <code>Uint8Array</code>
        * [.transparency](#ImageGIF+transparency) : <code>Uint8Array</code>
        * [.imageDescriptors](#ImageGIF+imageDescriptors) : [<code>Array.&lt;ImageGIFImageDescriptor&gt;</code>](#ImageGIFImageDescriptor)
        * [.options](#ImageGIF+options) : [<code>ImageGIFOptions</code>](#ImageGIFOptions)
        * [.parse()](#ImageGIF+parse)
        * [.decodeDataSubBlocks()](#ImageGIF+decodeDataSubBlocks) ⇒ <code>Array.&lt;number&gt;</code>
        * [.decodeHeader()](#ImageGIF+decodeHeader)
        * [.decodeLogicalScreenDescriptor()](#ImageGIF+decodeLogicalScreenDescriptor)
        * [.decodeGlobalColorTable()](#ImageGIF+decodeGlobalColorTable)
        * [.decodePixels()](#ImageGIF+decodePixels)
        * [.getPixel(x, y)](#ImageGIF+getPixel) ⇒ <code>Array.&lt;number&gt;</code>
    * _static_
        * [.fromFile(data, opts)](#ImageGIF.fromFile) ⇒ [<code>ImageGIF</code>](#ImageGIF)
        * [.fromBuffer(buffer, opts)](#ImageGIF.fromBuffer) ⇒ [<code>ImageGIF</code>](#ImageGIF)

<a name="new_ImageGIF_new"></a>

### new ImageGIF(input, [options])
Creates a new ImageGIF.


| Param | Type | Description |
| --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> | The data to process. |
| [options] | [<code>ImageGIFOptions</code>](#ImageGIFOptions) | Options for this ImageGIF instance. |

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
<a name="ImageGIF+palette"></a>

### imageGIF.palette : <code>Uint8Array</code>
**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+pixels"></a>

### imageGIF.pixels : <code>Array.&lt;number&gt;</code> \| <code>Uint8Array</code>
**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+transparency"></a>

### imageGIF.transparency : <code>Uint8Array</code>
**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+imageDescriptors"></a>

### imageGIF.imageDescriptors : [<code>Array.&lt;ImageGIFImageDescriptor&gt;</code>](#ImageGIFImageDescriptor)
**Kind**: instance property of [<code>ImageGIF</code>](#ImageGIF)  
<a name="ImageGIF+options"></a>

### imageGIF.options : [<code>ImageGIFOptions</code>](#ImageGIFOptions)
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
<a name="ImageGIF+decodePixels"></a>

### imageGIF.decodePixels()
Decompress LZW image data to pixels using the first image descriptor.
GIF images are always palette-based (indexed color).

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
**Throws**:

- <code>Error</code> No image descriptors found

<a name="ImageGIF+getPixel"></a>

### imageGIF.getPixel(x, y) ⇒ <code>Array.&lt;number&gt;</code>
Get the pixel color at a specified x, y location.
GIF images are always palette-based (indexed color).

**Kind**: instance method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: <code>Array.&lt;number&gt;</code> - the color as [red, green, blue, alpha]  
**Throws**:

- <code>Error</code> Pixel data has not been decoded
- <code>Error</code> x is out of bound for the image
- <code>Error</code> y is out of bound for the image


| Param | Type | Description |
| --- | --- | --- |
| x | <code>number</code> | The horizontal offset to read. |
| y | <code>number</code> | The vertical offset to read. |

<a name="ImageGIF.fromFile"></a>

### ImageGIF.fromFile(data, opts) ⇒ [<code>ImageGIF</code>](#ImageGIF)
Creates a new ImageGIF from file data.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: [<code>ImageGIF</code>](#ImageGIF) - the new ImageGIF instance for the provided file data  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> | The data of the image to process. |
| opts | [<code>ImageGIFOptions</code>](#ImageGIFOptions) | Options for this ImageGIF instance. |

<a name="ImageGIF.fromBuffer"></a>

### ImageGIF.fromBuffer(buffer, opts) ⇒ [<code>ImageGIF</code>](#ImageGIF)
Creates a new ImageGIF from a DataBuffer.

**Kind**: static method of [<code>ImageGIF</code>](#ImageGIF)  
**Returns**: [<code>ImageGIF</code>](#ImageGIF) - the new ImageGIF instance for the provided DataBuffer  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | The DataBuffer of the image to process. |
| opts | [<code>ImageGIFOptions</code>](#ImageGIFOptions) | Options for this ImageGIF instance. |

<a name="ImageGIFOptions"></a>

## ImageGIFOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| rules | <code>object</code> | Options for the ImageGIF instance. |
| rules.strict_block_size | <code>boolean</code> | Strictly enforce the block size. |
| rules.strict_lzw_minimum_code_size | <code>boolean</code> | Strictly enforce the LZW minimum code size. |

<a name="ImageGIFImageDescriptor"></a>

## ImageGIFImageDescriptor : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | The offset of the image descriptor in the data |
| leftPosition | <code>number</code> | The left position of the image |
| topPosition | <code>number</code> | The top position of the image |
| width | <code>number</code> | The width of the image |
| height | <code>number</code> | The height of the image |
| packed | <code>number</code> | The packed fields of the image descriptor |
| localColorTableFlag | <code>number</code> | The local color table flag |
| interlaceFlag | <code>number</code> | The interlace flag |
| sortFlag | <code>number</code> | The sort flag |
| localColorTableSize | <code>number</code> | The local color table size |
| localColorTable | <code>Uint8Array</code> | The local color table |
| lzwMinimumCodeSize | <code>number</code> | The LZW minimum code size |
| lzwData | <code>Array.&lt;number&gt;</code> | The LZW data |

