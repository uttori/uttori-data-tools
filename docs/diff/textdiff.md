## Functions

<dl>
<dt><a href="#splitLines">splitLines(text)</a> ⇒</dt>
<dd><p>Splits text into lines, preserving newline characters</p>
</dd>
<dt><a href="#textHunks">textHunks(x, y, context)</a> ⇒</dt>
<dd><p>Hunks compares the lines in x and y and returns the changes necessary to convert from one to the other.
The output is a sequence of hunks that each describe a number of consecutive edits.
Hunks include a number of matching elements before and after the last delete or insert operation.
If x and y are identical, the output has length zero.</p>
</dd>
<dt><a href="#textEdits">textEdits(x, y)</a> ⇒ <code>Array.&lt;TextEdit&gt;</code></dt>
<dd><p>textEdits compares the lines in x and y and returns the changes necessary to convert from one to the other.
textEdits returns edits for every element in the input. If x and y are identical, the output will consist of a match edit for every input element.</p>
</dd>
<dt><a href="#unified">unified(x, y, context)</a> ⇒</dt>
<dd><p>Unified compares the lines in x and y and returns the changes necessary to convert from one to the other in unified format.</p>
</dd>
<dt><a href="#createTextHunks">createTextHunks(x, y, rx, ry, context)</a> ⇒</dt>
<dd><p>Creates hunks with context support, based on Go&#39;s rvecs.Hunks implementation</p>
</dd>
<dt><a href="#createTextEditsForRange">createTextEditsForRange(x, y, rx, ry, startX, endX, startY, endY)</a> ⇒</dt>
<dd></dd>
<dt><a href="#createTextEdits">createTextEdits(x, y, rx, ry)</a> ⇒</dt>
<dd></dd>
<dt><a href="#escapeHtml">escapeHtml(str)</a> ⇒</dt>
<dd><p>Escapes HTML special characters</p>
</dd>
<dt><a href="#htmlTable">htmlTable(x, y, context)</a> ⇒</dt>
<dd><p>htmlTable compares the lines in x and y and returns an HTML table showing the differences.</p>
</dd>
</dl>

<a name="splitLines"></a>

## splitLines(text) ⇒
Splits text into lines, preserving newline characters

**Kind**: global function  
**Returns**: Array of lines with newlines preserved  

| Param | Description |
| --- | --- |
| text | The text to split |

<a name="textHunks"></a>

## textHunks(x, y, context) ⇒
Hunks compares the lines in x and y and returns the changes necessary to convert from one to the other.
The output is a sequence of hunks that each describe a number of consecutive edits.
Hunks include a number of matching elements before and after the last delete or insert operation.
If x and y are identical, the output has length zero.

**Kind**: global function  
**Returns**: The hunks for the diff. The hunks describe the changes necessary to convert from x to y.  

| Param | Description |
| --- | --- |
| x | The first text to compare |
| y | The second text to compare |
| context | Non-negative safe integer number of matching lines to include around changes (default: 3) |

<a name="textEdits"></a>

## textEdits(x, y) ⇒ <code>Array.&lt;TextEdit&gt;</code>
textEdits compares the lines in x and y and returns the changes necessary to convert from one to the other.
textEdits returns edits for every element in the input. If x and y are identical, the output will consist of a match edit for every input element.

**Kind**: global function  
**Returns**: <code>Array.&lt;TextEdit&gt;</code> - The edits for the diff.  

| Param | Type | Description |
| --- | --- | --- |
| x | <code>string</code> | The first text to compare |
| y | <code>string</code> | The second text to compare |

<a name="unified"></a>

## unified(x, y, context) ⇒
Unified compares the lines in x and y and returns the changes necessary to convert from one to the other in unified format.

**Kind**: global function  
**Returns**: The unified diff in string format.  

| Param | Description |
| --- | --- |
| x | The first text to compare |
| y | The second text to compare |
| context | Non-negative safe integer number of matching lines to include around changes (default: 3) |

<a name="createTextHunks"></a>

## createTextHunks(x, y, rx, ry, context) ⇒
Creates hunks with context support, based on Go's rvecs.Hunks implementation

**Kind**: global function  
**Returns**: The hunks for the diff. The hunks describe the changes necessary to convert from x to y.  

| Param | Description |
| --- | --- |
| x | The first text to compare |
| y | The second text to compare |
| rx | The first array of booleans |
| ry | The second array of booleans |
| context | Non-negative safe integer number of matching lines to include around changes (default: 3) |

<a name="createTextEditsForRange"></a>

## createTextEditsForRange(x, y, rx, ry, startX, endX, startY, endY) ⇒
**Kind**: global function  
**Returns**: The edits for the diff.  

| Param | Description |
| --- | --- |
| x | The first text to compare |
| y | The second text to compare |
| rx | The first array of booleans |
| ry | The second array of booleans |
| startX | The start line in x (zero-based) |
| endX | The end line in x (zero-based) |
| startY | The start line in y (zero-based) |
| endY | The end line in y (zero-based) |

<a name="createTextEdits"></a>

## createTextEdits(x, y, rx, ry) ⇒
**Kind**: global function  
**Returns**: The edits for the diff.  

| Param | Description |
| --- | --- |
| x | The first text to compare |
| y | The second text to compare |
| rx | The first array of booleans |
| ry | The second array of booleans |

<a name="escapeHtml"></a>

## escapeHtml(str) ⇒
Escapes HTML special characters

**Kind**: global function  
**Returns**: The escaped string.  

| Param | Description |
| --- | --- |
| str | The string to escape |

<a name="htmlTable"></a>

## htmlTable(x, y, context) ⇒
htmlTable compares the lines in x and y and returns an HTML table showing the differences.

**Kind**: global function  
**Returns**: HTML table string  

| Param | Description |
| --- | --- |
| x | The first text to compare (old version) |
| y | The second text to compare (new version) |
| context | Non-negative safe integer number of matching lines to include around changes (default: 3) |

