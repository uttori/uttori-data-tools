## Constants

<dl>
<dt><a href="#formatBytes">formatBytes</a> ⇒</dt>
<dd><p>Format an amount of bytes to a human friendly string.</p>
</dd>
<dt><a href="#formatASCII">formatASCII</a> ⇒</dt>
<dd><p>ASCII text formatting function.</p>
</dd>
<dt><a href="#byteHex">byteHex</a></dt>
<dd><p>Cached representations of the 256 possible byte values.</p>
</dd>
<dt><a href="#hexTableFormaters">hexTableFormaters</a></dt>
<dd><p>Formatting functions for all value types.</p>
</dd>
<dt><a href="#hexTable">hexTable</a> ⇒</dt>
<dd><p>Generate a nicely formatted hex editor style table.</p>
</dd>
<dt><a href="#formatTableLine">formatTableLine</a> ⇒</dt>
<dd><p>Format a table line seperator for a given theme.</p>
</dd>
<dt><a href="#formatTableThemeMySQL">formatTableThemeMySQL</a></dt>
<dd><p>MySQL Style Table Layout</p>
</dd>
<dt><a href="#formatTableThemeUnicode">formatTableThemeUnicode</a></dt>
<dd><p>Unicode Style Table Layout</p>
</dd>
<dt><a href="#formatTableThemeMarkdown">formatTableThemeMarkdown</a></dt>
<dd><p>Markdown Style Table Layout</p>
</dd>
<dt><a href="#formatTable">formatTable</a> ⇒ <code>string</code></dt>
<dd><p>Create an ASCII table from provided data and configuration.</p>
</dd>
<dt><a href="#formatDiffHex">formatDiffHex</a> ⇒</dt>
<dd><p>Format diff edits as a hex-friendly table showing changes.
Shows three rows: original data, delta values, and resulting data. Missing bytes use --; offsets track each side independently.</p>
</dd>
<dt><a href="#formatDiffHunks">formatDiffHunks</a> ⇒</dt>
<dd><p>Format diff hunks as a unified diff style with hex values.</p>
</dd>
<dt><a href="#formatMyersGraph">formatMyersGraph</a> ⇒</dt>
<dd><p>Format Myers diff result vectors as an ASCII grid visualization.
Shows the edit graph with the path taken through it.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a> : <code><a href="#DebugLogger">DebugLogger</a></code></dt>
<dd></dd>
<dt><a href="#diffByte">diffByte()</a></dt>
<dd><p>Reject non-byte values rather than rendering misleading NaN, string, or overflowing cells.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#DebugLogger">DebugLogger</a> : <code>function</code></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
</dl>

<a name="formatBytes"></a>

## formatBytes ⇒
Format an amount of bytes to a human friendly string.

**Kind**: global constant  
**Returns**: The human friendly representation of the number of bytes.  
**See**: [Multiple-byte units](https://en.wikipedia.org/wiki/Byte#Multiple-byte_units)  

| Param | Description |
| --- | --- |
| input | The number of bytes. |
| decimals | The number of trailing decimal places to chop to, default is 2. |
| bytes | The byte division value, alternatively could be 1000 for decimal values rather than binary values, default is 1024. |
| sizes | An optional array of the various size suffixes in ascending order of size: `['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']` |

<a name="formatASCII"></a>

## formatASCII ⇒
ASCII text formatting function.

**Kind**: global constant  
**Returns**: Returns an array with the Character to represent this value and any flags for the function.  

| Param | Description |
| --- | --- |
| value | Input data to print out as a hex table. |
| asciiFlags | Any flags needed by the formatter. |
| _data | The data being processed. |

<a name="byteHex"></a>

## byteHex
Cached representations of the 256 possible byte values.

**Kind**: global constant  
<a name="hexTableFormaters"></a>

## hexTableFormaters
Formatting functions for all value types.

**Kind**: global constant  
<a name="hexTable"></a>

## hexTable ⇒
Generate a nicely formatted hex editor style table.

**Kind**: global constant  
**Returns**: The hex table ASCII.  

| Param | Description |
| --- | --- |
| input | Input data to print out as a hex table. |
| offset | Display offset for the first byte; reading starts at the input DataBuffer cursor. |
| dimensions | Table size parameters for columns, rows and byte grouping. |
| header | The values for building the table header with offset, bytes and ASCII values. |
| format | The formatting functions for displaying offset, bytes and ASCII values. |

<a name="formatTableLine"></a>

## formatTableLine ⇒
Format a table line seperator for a given theme.

**Kind**: global constant  
**Returns**: The seperator  

| Param | Description |
| --- | --- |
| columnLengths | An array with each columns length |
| type | The type of the separator |
| options | The options for the formatting including the theme and padding. |

<a name="formatTableThemeMySQL"></a>

## formatTableThemeMySQL
MySQL Style Table Layout

**Kind**: global constant  
<a name="formatTableThemeUnicode"></a>

## formatTableThemeUnicode
Unicode Style Table Layout

**Kind**: global constant  
<a name="formatTableThemeMarkdown"></a>

## formatTableThemeMarkdown
Markdown Style Table Layout

**Kind**: global constant  
<a name="formatTable"></a>

## formatTable ⇒ <code>string</code>
Create an ASCII table from provided data and configuration.

**Kind**: global constant  
**Returns**: <code>string</code> - The ASCII table of data.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array.&lt;unknown&gt;&gt;</code> | The data to add to the table; cells are converted to strings once. |
| [options] | <code>object</code> | Configuration. |
| options.align | <code>Array.&lt;string&gt;</code> | The alignment of each column, left or right. |
| options.padding | <code>number</code> | Amount of padding to add to each cell. |
| options.theme | <code>TableFormatStyle</code> | The theme to use for formatting. |
| options.title | <code>string</code> | The title to display at the top of the table. |

<a name="formatDiffHex"></a>

## formatDiffHex ⇒
Format diff edits as a hex-friendly table showing changes.
Shows three rows: original data, delta values, and resulting data. Missing bytes use --; offsets track each side independently.

**Kind**: global constant  
**Returns**: The formatted diff output.  

| Param | Description |
| --- | --- |
| edits | The diff edits to format. |
| options | Configuration options. |

<a name="formatDiffHunks"></a>

## formatDiffHunks ⇒
Format diff hunks as a unified diff style with hex values.

**Kind**: global constant  
**Returns**: The formatted diff output.  

| Param | Description |
| --- | --- |
| hunks | The diff hunks to format. |
| options | Configuration options. |

<a name="formatMyersGraph"></a>

## formatMyersGraph ⇒
Format Myers diff result vectors as an ASCII grid visualization.
Shows the edit graph with the path taken through it.

**Kind**: global constant  
**Returns**: The formatted Myers graph.  

| Param | Description |
| --- | --- |
| rx | Result vector for x (deletions). |
| ry | Result vector for y (insertions). |
| x | The original sequence. |
| y | The modified sequence. |
| options | Configuration options. |

<a name="debug"></a>

## debug() : [<code>DebugLogger</code>](#DebugLogger)
**Kind**: global function  
<a name="diffByte"></a>

## diffByte()
Reject non-byte values rather than rendering misleading NaN, string, or overflowing cells.

**Kind**: global function  
<a name="DebugLogger"></a>

## DebugLogger : <code>function</code>
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | The arguments to log. |

