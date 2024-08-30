## Constants

<dl>
<dt><a href="#formatBytes">formatBytes</a> ⇒ <code>string</code></dt>
<dd><p>Format an amount of bytes to a human friendly string.</p>
</dd>
<dt><a href="#formatASCII">formatASCII</a> ⇒ <code>FormatASCIIOutput</code></dt>
<dd><p>ASCII text formatting function.</p>
</dd>
<dt><a href="#hexTableFormaters">hexTableFormaters</a> : <code><a href="#HexTableFormater">HexTableFormater</a></code></dt>
<dd></dd>
<dt><a href="#hexTableHeader">hexTableHeader</a> : <code><a href="#HexTableHeader">HexTableHeader</a></code></dt>
<dd></dd>
<dt><a href="#hexTableDimensions">hexTableDimensions</a> : <code><a href="#HexTableDimensions">HexTableDimensions</a></code></dt>
<dd></dd>
<dt><a href="#hexTable">hexTable</a> ⇒ <code>string</code></dt>
<dd><p>Generate a nicely formatted hex editor style table.</p>
</dd>
<dt><a href="#formatTableLine">formatTableLine</a> ⇒ <code>string</code></dt>
<dd><p>Format a table line seperator for a given theme.</p>
</dd>
<dt><a href="#formatTableThemeMySQL">formatTableThemeMySQL</a> : <code><a href="#TableFormatStyle">TableFormatStyle</a></code></dt>
<dd><p>MySQL Style Table Layout</p>
</dd>
<dt><a href="#formatTableThemeUnicode">formatTableThemeUnicode</a> : <code><a href="#TableFormatStyle">TableFormatStyle</a></code></dt>
<dd><p>Unicode Table Layout</p>
</dd>
<dt><a href="#formatTableThemeMarkdown">formatTableThemeMarkdown</a> : <code><a href="#TableFormatStyle">TableFormatStyle</a></code></dt>
<dd><p>Markdown Table Layout</p>
</dd>
<dt><a href="#formatTable">formatTable</a> ⇒ <code>string</code></dt>
<dd><p>Create an ASCII table from provided data and configuration.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#HexTableFormater">HexTableFormater</a> : <code>object</code></dt>
<dd><p>Formatting functions for all value types.</p>
</dd>
<dt><a href="#HexTableHeader">HexTableHeader</a> : <code>object</code></dt>
<dd><p>Header layout definitions.
GNU poke hexTableHeader.value = [&#39;00&#39;, &#39;11&#39;, &#39;22&#39;, &#39;33&#39;, &#39;44&#39;, &#39;55&#39;, &#39;66&#39;, &#39;77&#39;, &#39;88&#39;, &#39;99&#39;, &#39;aa&#39;, &#39;bb&#39;, &#39;cc&#39;, &#39;dd&#39;, &#39;ee&#39;, &#39;ff&#39;]</p>
</dd>
<dt><a href="#HexTableDimensions">HexTableDimensions</a> : <code>object</code></dt>
<dd><p>Header layout definitions.</p>
</dd>
<dt><a href="#TableFormatStyle">TableFormatStyle</a> : <code>object</code></dt>
<dd><p>Table Format Style definitions.</p>
</dd>
</dl>

<a name="formatBytes"></a>

## formatBytes ⇒ <code>string</code>
Format an amount of bytes to a human friendly string.

**Kind**: global constant  
**Returns**: <code>string</code> - The human friendly representation of the number of bytes.  
**See**: [Multiple-byte units](https://en.wikipedia.org/wiki/Byte#Multiple-byte_units)  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>number</code> | The number of bytes. |
| [decimals] | <code>number</code> | The number of trailing decimal places to chop to, default is 2. |
| [bytes] | <code>number</code> | The byte division value, alternatively could be 1000 for decimal values rather than binary values, default is 1024. |
| [sizes] | <code>Array.&lt;string&gt;</code> | An optional array of the various size suffixes in ascending order of size: `['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']` |

<a name="formatASCII"></a>

## formatASCII ⇒ <code>FormatASCIIOutput</code>
ASCII text formatting function.

**Kind**: global constant  
**Returns**: <code>FormatASCIIOutput</code> - Returns an array with the Character to represent this value and any flags for the function.  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | Input data to print out as a hex table. |
| asciiFlags | <code>Record.&lt;string, (boolean\|number\|string)&gt;</code> | Any flags needed by the formatter. |
| _data | <code>DataBuffer</code> \| <code>DataStream</code> | The data being processed. |

<a name="hexTableFormaters"></a>

## hexTableFormaters : [<code>HexTableFormater</code>](#HexTableFormater)
**Kind**: global constant  
<a name="hexTableHeader"></a>

## hexTableHeader : [<code>HexTableHeader</code>](#HexTableHeader)
**Kind**: global constant  
<a name="hexTableDimensions"></a>

## hexTableDimensions : [<code>HexTableDimensions</code>](#HexTableDimensions)
**Kind**: global constant  
<a name="hexTable"></a>

## hexTable ⇒ <code>string</code>
Generate a nicely formatted hex editor style table.

**Kind**: global constant  
**Returns**: <code>string</code> - The hex table ASCII.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>DataBuffer</code> \| <code>DataStream</code> | Input data to print out as a hex table. |
| offset | <code>number</code> | Offset in the DataStream to start from. |
| dimensions | [<code>HexTableDimensions</code>](#HexTableDimensions) | Table size parameters for columns, rows and byte grouping. |
| header | [<code>HexTableHeader</code>](#HexTableHeader) | The values for building the table header with offset, bytes and ASCII values. |
| format | [<code>HexTableFormater</code>](#HexTableFormater) | The formatting functions for displaying offset, bytes and ASCII values. |

<a name="hexTable..asciiFlags"></a>

### hexTable~asciiFlags : <code>Record.&lt;string, (boolean\|number\|string)&gt;</code>
**Kind**: inner property of [<code>hexTable</code>](#hexTable)  
<a name="formatTableLine"></a>

## formatTableLine ⇒ <code>string</code>
Format a table line seperator for a given theme.

**Kind**: global constant  
**Returns**: <code>string</code> - The seperator  

| Param | Type | Description |
| --- | --- | --- |
| columnLengths | <code>Array.&lt;number&gt;</code> | An array with each columns length |
| type | <code>string</code> | The type of the separator |
| options | <code>object</code> | The options |
| options.theme | [<code>TableFormatStyle</code>](#TableFormatStyle) | The theme to use for formatting. |
| options.padding | <code>number</code> | The amount of padding to use. |

<a name="formatTableThemeMySQL"></a>

## formatTableThemeMySQL : [<code>TableFormatStyle</code>](#TableFormatStyle)
MySQL Style Table Layout

**Kind**: global constant  
<a name="formatTableThemeUnicode"></a>

## formatTableThemeUnicode : [<code>TableFormatStyle</code>](#TableFormatStyle)
Unicode Table Layout

**Kind**: global constant  
<a name="formatTableThemeMarkdown"></a>

## formatTableThemeMarkdown : [<code>TableFormatStyle</code>](#TableFormatStyle)
Markdown Table Layout

**Kind**: global constant  
<a name="formatTable"></a>

## formatTable ⇒ <code>string</code>
Create an ASCII table from provided data and configuration.

**Kind**: global constant  
**Returns**: <code>string</code> - The ASCII table of data.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;Array.&lt;string&gt;&gt;</code> | The data to add to the table. |
| options | <code>object</code> | Configuration. |
| options.align | <code>Array.&lt;string&gt;</code> | The alignment of each column, left or right. |
| options.padding | <code>number</code> | Amount of padding to add to each cell. |
| options.theme | [<code>TableFormatStyle</code>](#TableFormatStyle) | The theme to use for formatting. |
| options.title | <code>string</code> | The title to display at the top of the table. |

<a name="HexTableFormater"></a>

## HexTableFormater : <code>object</code>
Formatting functions for all value types.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| offset | <code>FormatNumber</code> | Offset formatting fuction. |
| value | <code>FormatNumber</code> | Byte value formating function. |
| ascii | <code>FormatNumberToASCII</code> | ASCII text formatting function. |

<a name="HexTableHeader"></a>

## HexTableHeader : <code>object</code>
Header layout definitions.
GNU poke hexTableHeader.value = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99', 'aa', 'bb', 'cc', 'dd', 'ee', 'ff']

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| offset | <code>string</code> | Offset header column presentation. |
| value | <code>Array.&lt;string&gt;</code> | Byte value header values, grouped as defined in the provided HexTableDimensions. |
| ascii | <code>string</code> | ASCII text presentation. |

<a name="HexTableDimensions"></a>

## HexTableDimensions : <code>object</code>
Header layout definitions.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| columns | <code>number</code> | The number of columns to show in the byte value section of the table. |
| grouping | <code>number</code> | The number of bytes to cluster together in the byte value section of the table. |
| maxRows | <code>number</code> | The maxiumum number of rows to show excluding the header & seperator rows. |

<a name="TableFormatStyle"></a>

## TableFormatStyle : <code>object</code>
Table Format Style definitions.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| topRow | <code>boolean</code> | If true, show the top frame, if false, hide the top frame. Typically used for full framed styles. |
| bottomRow | <code>boolean</code> | If true, show the bottom frame, if false, hide the top frame. Typically used for full framed styles. |
| upperLeft | <code>string</code> | Top Left Character |
| upperRight | <code>string</code> | Top Right Chcaracter |
| lowerLeft | <code>string</code> | Bottom Left Character |
| lowerRight | <code>string</code> | Bottom Right Character |
| intersection | <code>string</code> | 4 Way Intersection Character |
| line | <code>string</code> | Horizontal Line Character |
| wall | <code>string</code> | Vertical Line Character |
| intersectionTop | <code>string</code> | 2 Way Intersection from the bottom Character |
| intersectionBottom | <code>string</code> | 2 Way Intersection from the top Character |
| intersectionLeft | <code>string</code> | 2 Way Intersection from the right Character |
| intersectionRight | <code>string</code> | 2 Way Intersection from the left Character |

