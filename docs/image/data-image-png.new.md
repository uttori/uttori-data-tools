<a name="ImagePNG"></a>

## ImagePNG
PNG container + lossless native sample decoder, still extending DataBuffer.

pixels: one Uint8Array element per sample/index for depths 1/2/4/8;
        one Uint16Array element per native sample for depth 16.
palette: original RGB bytes, in original slot order, including duplicate colors.
transparency: original tRNS bytes. No RGBA cache is kept beside mutable native pixels.

Copy input by default. copyInput:false borrows the exact byte view: the caller must
not mutate it while this object is in use. Parsed chunk payloads are read-only views.

Static encoder methods produce non-interlaced indexed PNG or RGBA8 PNG.
Rewriting indexed PNG preserves the stronger original-byte and IDAT contracts.

**Kind**: global class  

* [ImagePNG](#ImagePNG)
    * [.decodePixels()](#ImagePNG+decodePixels)
    * [.toIndexed()](#ImagePNG+toIndexed)
    * [.toRGBA()](#ImagePNG+toRGBA)
    * [.getPixel()](#ImagePNG+getPixel)

<a name="ImagePNG+decodePixels"></a>

### imagePNG.decodePixels()
Decode once; force:true discards the decoded cache and rechecks compressed samples.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+toIndexed"></a>

### imagePNG.toIndexed()
Returned palette slots and indexes are owned unless copy:false is explicit.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+toRGBA"></a>

### imagePNG.toRGBA()
Explicit rendering conversion. Sixteen-bit values round to nearest RGBA8; native samples remain intact.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
<a name="ImagePNG+getPixel"></a>

### imagePNG.getPixel()
Compatibility accessor. Bulk rendering should use toRGBA(), not allocate an array for every pixel.

**Kind**: instance method of [<code>ImagePNG</code>](#ImagePNG)  
