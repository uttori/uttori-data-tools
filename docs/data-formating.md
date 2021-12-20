## Functions

<dl>
<dt><a href="#formatBytes">formatBytes(input, [decimals], [bytes], [sizes])</a> ⇒ <code>string</code></dt>
<dd><p>Format an amount of bytes to a human friendly string.</p>
</dd>
<dt><a href="#formatASCII">formatASCII(value, asciiFlags, _data)</a> ⇒ <code>Array.&lt;any&gt;</code></dt>
<dd><p>ASCII text formatting function.</p>
</dd>
<dt><a href="#hexTable">hexTable(input, offset, dimensions, header, format)</a> ⇒ <code>string</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#HexTableFormater">HexTableFormater</a> : <code>object</code></dt>
<dd><p>Formatting functions for all value types.</p>
</dd>
<dt><a href="#HexTableHeader">HexTableHeader</a> : <code>object</code></dt>
<dd><p>Header layout definitions.</p>
</dd>
<dt><a href="#HexTableDimensions">HexTableDimensions</a> : <code>object</code></dt>
<dd><p>Header layout definitions.</p>
</dd>
</dl>

<a name="formatBytes"></a>

## formatBytes(input, [decimals], [bytes], [sizes]) ⇒ <code>string</code>
Format an amount of bytes to a human friendly string.

**Kind**: global function  
**Returns**: <code>string</code> - The human friendly representation of the number of bytes.  
**See**: [Multiple-byte units](https://en.wikipedia.org/wiki/Byte#Multiple-byte_units)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>number</code> |  | The number of bytes. |
| [decimals] | <code>number</code> | <code>2</code> | The number of trailing decimal places to chop to. |
| [bytes] | <code>number</code> | <code>1024</code> | The byte division value, alternatively could be 1000 for decimal values rather than binary values. |
| [sizes] | <code>Array.&lt;string&gt;</code> | <code>[&#x27;Bytes&#x27;, &#x27;KB&#x27;, &#x27;MB&#x27;, &#x27;GB&#x27;, &#x27;TB&#x27;, &#x27;PB&#x27;, &#x27;EB&#x27;, &#x27;ZB&#x27;, &#x27;YB&#x27;]</code> | An array of the various size suffixes. |

<a name="formatASCII"></a>

## formatASCII(value, asciiFlags, _data) ⇒ <code>Array.&lt;any&gt;</code>
ASCII text formatting function.

**Kind**: global function  
**Returns**: <code>Array.&lt;any&gt;</code> - Returns an array with the Character to represent this value and any flags for the function.  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | Input data to print out as a hex table. |
| asciiFlags | <code>object</code> | Any flags needed by the formatter. |
| _data | <code>DataBuffer</code> \| <code>DataStream</code> | The data being processed. |

<a name="hexTable"></a>

## hexTable(input, offset, dimensions, header, format) ⇒ <code>string</code>
**Kind**: global function  
**Returns**: <code>string</code> - The hex table output  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>DataBuffer</code> \| <code>DataStream</code> |  | Input data to print out as a hex table. |
| offset | <code>number</code> | <code>0</code> | Offset in the DataStream to start from. |
| dimensions | [<code>HexTableDimensions</code>](#HexTableDimensions) |  | Table size parameters for columns, rows and byte grouping. |
| header | [<code>HexTableHeader</code>](#HexTableHeader) |  | The values for building the table header with offset, bytes and ASCII values. |
| format | [<code>HexTableFormater</code>](#HexTableFormater) |  | The formatting functions for displaying offset, bytes and ASCII values. |

<a name="HexTableFormater"></a>

## HexTableFormater : <code>object</code>
Formatting functions for all value types.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| offset | <code>function</code> | Offset formatting fuction. |
| value | <code>function</code> | Byte value formating function. |
| ascii | <code>function</code> | ASCII text formatting function. |

<a name="HexTableHeader"></a>

## HexTableHeader : <code>object</code>
Header layout definitions.

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

