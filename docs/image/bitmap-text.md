## Constants

<dl>
<dt><a href="#GLYPHS">GLYPHS</a></dt>
<dd><p>Pure so an unused glyph table is not a bundler side effect.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#freezeGlyphs">freezeGlyphs()</a></dt>
<dd><p>Hand-authored 5×7 caption glyphs, not extracted from an installed font.
ASCII lowercase intentionally uses the uppercase glyph. Unsupported code points use &#39;?&#39;.
Five low bits describe each row, with the leftmost pixel in bit 4.</p>
</dd>
<dt><a href="#layout">layout(text, options)</a> ⇒</dt>
<dd><p>Layout a text string for bitmap text rendering.</p>
</dd>
<dt><a href="#drawBitmapText">drawBitmapText(surface, text, x, y, color, options)</a></dt>
<dd><p>Draw a text string on a surface.</p>
</dd>
</dl>

<a name="GLYPHS"></a>

## GLYPHS
Pure so an unused glyph table is not a bundler side effect.

**Kind**: global constant  
<a name="freezeGlyphs"></a>

## freezeGlyphs()
Hand-authored 5×7 caption glyphs, not extracted from an installed font.
ASCII lowercase intentionally uses the uppercase glyph. Unsupported code points use '?'.
Five low bits describe each row, with the leftmost pixel in bit 4.

**Kind**: global function  
<a name="layout"></a>

## layout(text, options) ⇒
Layout a text string for bitmap text rendering.

**Kind**: global function  
**Returns**: The layout object.  

| Param | Description |
| --- | --- |
| text | The text to layout. |
| options | The options for the layout. |
| options.scale | The scale of the text, defaults to 1. |


* [layout(text, options)](#layout) ⇒
    * [~scale](#layout..scale)
    * [~lines](#layout..lines)

<a name="layout..scale"></a>

### layout~scale
Between 1 and 64.

**Kind**: inner constant of [<code>layout</code>](#layout)  
<a name="layout..lines"></a>

### layout~lines
Tabs are exactly four spaces, not context-dependent tab stops.

**Kind**: inner constant of [<code>layout</code>](#layout)  
<a name="drawBitmapText"></a>

## drawBitmapText(surface, text, x, y, color, options)
Draw a text string on a surface.

**Kind**: global function  

| Param | Description |
| --- | --- |
| surface | The surface to draw on. |
| text | The text to draw. |
| x | The x coordinate of the text. |
| y | The y coordinate of the text. |
| color | The color of the text. |
| options | The options for the drawing. |

