## Constants

<dl>
<dt><a href="#Op">Op</a></dt>
<dd><p>Op describes an edit operation.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#hunks">hunks(x, y, eq, context)</a> ⇒</dt>
<dd><p>Compares the contents of x and y using the provided equality comparison and returns the
changes necessary to convert from one to the other.
The output is a sequence of hunks that each describe a number of consecutive edits.
Hunks include a number of matching elements before and after the last delete or insert operation.
If x and y are identical, the output has length zero.
Computing a minimal diff can be expensive for inputs with many changes.</p>
</dd>
<dt><a href="#createHunks">createHunks(x, y, rx, ry, context)</a> ⇒</dt>
<dd></dd>
<dt><a href="#edits">edits(x, y, eq)</a> ⇒</dt>
<dd><p>Compares the contents of x and y using the provided equality comparison and returns the
changes necessary to convert from one to the other.
Returns edits for every element in the input.
If both x and y are identical, the output will consist of a match edit for every input element.
Computing a minimal diff can be expensive for inputs with many changes.</p>
</dd>
<dt><a href="#createEdits">createEdits(x, y, rx, ry, startX, endX, startY, endY)</a> ⇒</dt>
<dd></dd>
<dt><a href="#diff">diff(x, y, eq)</a> ⇒</dt>
<dd><p>Main diff function.</p>
</dd>
</dl>

<a name="Op"></a>

## Op
Op describes an edit operation.

**Kind**: global constant  
<a name="hunks"></a>

## hunks(x, y, eq, context) ⇒
Compares the contents of x and y using the provided equality comparison and returns the
changes necessary to convert from one to the other.
The output is a sequence of hunks that each describe a number of consecutive edits.
Hunks include a number of matching elements before and after the last delete or insert operation.
If x and y are identical, the output has length zero.
Computing a minimal diff can be expensive for inputs with many changes.

**Kind**: global function  
**Returns**: The hunks for the diff. The hunks describe the changes necessary to convert from x to y.  

| Param | Description |
| --- | --- |
| x | The first array to compare |
| y | The second array to compare |
| eq | Equality function to compare elements |
| context | Non-negative safe integer number of matching elements to include around changes (default: 3) |

<a name="createHunks"></a>

## createHunks(x, y, rx, ry, context) ⇒
**Kind**: global function  
**Returns**: The hunks for the diff. The hunks describe the changes necessary to convert from x to y.  

| Param | Description |
| --- | --- |
| x | The first array to compare |
| y | The second array to compare |
| rx | The first array of booleans |
| ry | The second array of booleans |
| context | The context |

<a name="edits"></a>

## edits(x, y, eq) ⇒
Compares the contents of x and y using the provided equality comparison and returns the
changes necessary to convert from one to the other.
Returns edits for every element in the input.
If both x and y are identical, the output will consist of a match edit for every input element.
Computing a minimal diff can be expensive for inputs with many changes.

**Kind**: global function  
**Returns**: The edits for the diff.  

| Param | Description |
| --- | --- |
| x | The first array to compare |
| y | The second array to compare |
| eq | Equality function to compare elements |

<a name="createEdits"></a>

## createEdits(x, y, rx, ry, startX, endX, startY, endY) ⇒
**Kind**: global function  
**Returns**: The edits for the diff.  

| Param | Default | Description |
| --- | --- | --- |
| x |  | The first array to compare |
| y |  | The second array to compare |
| rx |  | The first array of booleans |
| ry |  | The second array of booleans |
| startX | <code>0</code> | The start position in x |
| endX |  | The end position in x (exclusive) |
| startY | <code>0</code> | The start position in y |
| endY |  | The end position in y (exclusive) |

<a name="diff"></a>

## diff(x, y, eq) ⇒
Main diff function.

**Kind**: global function  
**Returns**: The result of the diff.  

| Param | Description |
| --- | --- |
| x | The first array to compare |
| y | The second array to compare |
| eq | Equality function to compare elements |

