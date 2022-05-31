## Constants

<dl>
<dt><a href="#characterEncoding">characterEncoding</a> : <code>Object.&lt;number, UttoriCharacterEncoding&gt;</code></dt>
<dd><p>Shift JIS (Shift Japanese Industrial Standards, also SJIS, MIME name Shift_JIS, known as PCK in Solaris contexts) is a character encoding for the Japanese language, originally developed by a Japanese company called ASCII Corporation in conjunction with Microsoft and standardized as JIS X 0208 Appendix 1.
Shift-JIS is also called MS Kanji, or DOS Kanji, and is a Microsoft standard (codepage 932).
Shift-JIS is an 8-bit encoding with 1 to 2 bytes per character.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#parse">parse(data)</a> ⇒ <code>string</code></dt>
<dd><p>Convert Shift-JIS data to Unicode text.</p>
<p>Does not check for out of bounds characters and will use the <code>String.fromCharCode</code> value.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#UttoriCharacterEncoding">UttoriCharacterEncoding</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="characterEncoding"></a>

## characterEncoding : <code>Object.&lt;number, UttoriCharacterEncoding&gt;</code>
Shift JIS (Shift Japanese Industrial Standards, also SJIS, MIME name Shift_JIS, known as PCK in Solaris contexts) is a character encoding for the Japanese language, originally developed by a Japanese company called ASCII Corporation in conjunction with Microsoft and standardized as JIS X 0208 Appendix 1.
Shift-JIS is also called MS Kanji, or DOS Kanji, and is a Microsoft standard (codepage 932).
Shift-JIS is an 8-bit encoding with 1 to 2 bytes per character.

**Kind**: global constant  
**See**: [Shift-JIS](https://en.wikipedia.org/wiki/Shift_JIS)  
<a name="parse"></a>

## parse(data) ⇒ <code>string</code>
Convert Shift-JIS data to Unicode text.

Does not check for out of bounds characters and will use the `String.fromCharCode` value.

**Kind**: global function  
**Returns**: <code>string</code> - The Shift-JIS data converted to Unicode text.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>DataBuffer</code> | The data to convert to text. |

<a name="UttoriCharacterEncoding"></a>

## UttoriCharacterEncoding : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| shiftjs | <code>number</code> | Shift-JIS code as an integer. |
| unicode | <code>number</code> | Unicode value as an integer. |
| string | <code>string</code> | Unicode string representation. |
| ascii | <code>string</code> | ASCII string representation. |
| name | <code>string</code> | Unicode Name |

