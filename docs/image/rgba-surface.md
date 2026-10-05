## Classes

<dl>
<dt><a href="#RgbaSurface">RgbaSurface</a></dt>
<dd><p>Mutable straight RGBA8 pixels. Geometry and buffer identity are immutable.
Fill/blit/line/text mutate and return this. Crop/flip/scale return owned new surfaces.
This module does not import PNG, Pako, Canvas, DOM, Node, or a font runtime.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#DEFAULT_MAX_PIXELS">DEFAULT_MAX_PIXELS</a></dt>
<dd><p>The default maximum number of pixels for a surface. Size is 4MB.</p>
</dd>
<dt><a href="#LITTLE_ENDIAN">LITTLE_ENDIAN</a></dt>
<dd><p>Pure so the unused probe is not a bundler side effect.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#colorRGBA">colorRGBA()</a></dt>
<dd><p>Validate and normalize an RGBA color.</p>
</dd>
<dt><a href="#validateRGBA">validateRGBA()</a></dt>
<dd><p>Validate an RGBA image.</p>
</dd>
</dl>

<a name="DEFAULT_MAX_PIXELS"></a>

## DEFAULT\_MAX\_PIXELS
The default maximum number of pixels for a surface. Size is 4MB.

**Kind**: global constant  
<a name="LITTLE_ENDIAN"></a>

## LITTLE\_ENDIAN
Pure so the unused probe is not a bundler side effect.

**Kind**: global constant  
<a name="colorRGBA"></a>

## colorRGBA()
Validate and normalize an RGBA color.

**Kind**: global function  
<a name="validateRGBA"></a>

## validateRGBA()
Validate an RGBA image.

**Kind**: global function  
