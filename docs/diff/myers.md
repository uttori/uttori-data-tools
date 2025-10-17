## Classes

<dl>
<dt><a href="#Myers">Myers</a></dt>
<dd><p>Myers Algorithm for computing diffs.
This is inspired by <code>znkr.io/diff</code> which is based on &quot;An O(ND) Difference Algorithm and its Variations&quot; by Eugene W. Myers.
We do not implement any additional heuristics like znkr.io/diff does, just the algorithm itself.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#SplitResult">SplitResult</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#InitResult">InitResult</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="Myers"></a>

## Myers
Myers Algorithm for computing diffs.
This is inspired by `znkr.io/diff` which is based on "An O(ND) Difference Algorithm and its Variations" by Eugene W. Myers.
We do not implement any additional heuristics like znkr.io/diff does, just the algorithm itself.

**Kind**: global class  
**See**

- [https://dl.acm.org/doi/abs/10.1007/BF01840446](https://dl.acm.org/doi/abs/10.1007/BF01840446)
- [https://flo.znkr.io/diff/](https://flo.znkr.io/diff/)
- [https://pkg.go.dev/znkr.io/diff](https://pkg.go.dev/znkr.io/diff)
- [https://github.com/znkr/diff](https://github.com/znkr/diff)
- [https://tools.bartlweb.net/diff/](https://tools.bartlweb.net/diff/)
- [https://docs.moonbitlang.com/en/latest/example/myers-diff/myers-diff.html](https://docs.moonbitlang.com/en/latest/example/myers-diff/myers-diff.html)
- [https://blog.jcoglan.com/2017/03/22/myers-diff-in-linear-space-theory/](https://blog.jcoglan.com/2017/03/22/myers-diff-in-linear-space-theory/)
- [https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/](https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/)


* [Myers](#Myers)
    * [new Myers(xidx, yidx, x0, y0, equal)](#new_Myers_new)
    * [.x](#Myers+x) : <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;number&gt;</code> \| <code>Array.&lt;Uint8Array&gt;</code>
    * [.y](#Myers+y) : <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;number&gt;</code> \| <code>Array.&lt;Uint8Array&gt;</code>
    * [.vf](#Myers+vf) : <code>Array.&lt;number&gt;</code>
    * [.vb](#Myers+vb) : <code>Array.&lt;number&gt;</code>
    * [.v0](#Myers+v0) : <code>number</code>
    * [.xidx](#Myers+xidx) : <code>Array.&lt;number&gt;</code>
    * [.yidx](#Myers+yidx) : <code>Array.&lt;number&gt;</code>
    * [.resultVectorX](#Myers+resultVectorX) : <code>Array.&lt;boolean&gt;</code>
    * [.resultVectorY](#Myers+resultVectorY) : <code>Array.&lt;boolean&gt;</code>
    * [.equal](#Myers+equal) : <code>EqualityFunction</code>
    * [.smin](#Myers+smin) : <code>number</code>
    * [.smax](#Myers+smax) : <code>number</code>
    * [.tmin](#Myers+tmin) : <code>number</code>
    * [.tmax](#Myers+tmax) : <code>number</code>
    * [.compare(smin, smax, tmin, tmax)](#Myers+compare)
    * [.split(smin, smax, tmin, tmax)](#Myers+split) ⇒ [<code>SplitResult</code>](#SplitResult)

<a name="new_Myers_new"></a>

### new Myers(xidx, yidx, x0, y0, equal)

| Param | Type | Description |
| --- | --- | --- |
| xidx | <code>Array.&lt;number&gt;</code> | Mapping of s indices to result vector positions |
| yidx | <code>Array.&lt;number&gt;</code> | Mapping of t indices to result vector positions |
| x0 | <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;number&gt;</code> \| <code>Array.&lt;Uint8Array&gt;</code> | The first array to compare |
| y0 | <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;number&gt;</code> \| <code>Array.&lt;Uint8Array&gt;</code> | The second array to compare |
| equal | <code>EqualityFunction</code> | Equality function to compare elements |

<a name="Myers+x"></a>

### myers.x : <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;number&gt;</code> \| <code>Array.&lt;Uint8Array&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+y"></a>

### myers.y : <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;number&gt;</code> \| <code>Array.&lt;Uint8Array&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+vf"></a>

### myers.vf : <code>Array.&lt;number&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+vb"></a>

### myers.vb : <code>Array.&lt;number&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+v0"></a>

### myers.v0 : <code>number</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+xidx"></a>

### myers.xidx : <code>Array.&lt;number&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+yidx"></a>

### myers.yidx : <code>Array.&lt;number&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+resultVectorX"></a>

### myers.resultVectorX : <code>Array.&lt;boolean&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+resultVectorY"></a>

### myers.resultVectorY : <code>Array.&lt;boolean&gt;</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+equal"></a>

### myers.equal : <code>EqualityFunction</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+smin"></a>

### myers.smin : <code>number</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+smax"></a>

### myers.smax : <code>number</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+tmin"></a>

### myers.tmin : <code>number</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+tmax"></a>

### myers.tmax : <code>number</code>
**Kind**: instance property of [<code>Myers</code>](#Myers)  
<a name="Myers+compare"></a>

### myers.compare(smin, smax, tmin, tmax)
Find an optimal d-path from (smin, tmin) to (smax, tmax).

**Kind**: instance method of [<code>Myers</code>](#Myers)  

| Param | Type | Description |
| --- | --- | --- |
| smin | <code>number</code> | The start index of the first array |
| smax | <code>number</code> | The end index of the first array |
| tmin | <code>number</code> | The start index of the second array |
| tmax | <code>number</code> | The end index of the second array |

<a name="Myers+split"></a>

### myers.split(smin, smax, tmin, tmax) ⇒ [<code>SplitResult</code>](#SplitResult)
Find the endpoints of sequence of diagonals in the middle of an optimal path from (smin, tmin) to (smax, tmax).

**Kind**: instance method of [<code>Myers</code>](#Myers)  
**Returns**: [<code>SplitResult</code>](#SplitResult) - The endpoints of the sequence of diagonals  

| Param | Type | Description |
| --- | --- | --- |
| smin | <code>number</code> | The start index of the first array |
| smax | <code>number</code> | The end index of the first array |
| tmin | <code>number</code> | The start index of the second array |
| tmax | <code>number</code> | The end index of the second array |

<a name="SplitResult"></a>

## SplitResult : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| s0 | <code>number</code> | The start index of the first array |
| s1 | <code>number</code> | The end index of the first array |
| t0 | <code>number</code> | The start index of the second array |
| t1 | <code>number</code> | The end index of the second array |

<a name="InitResult"></a>

## InitResult : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| smin | <code>number</code> | The start index of the first array |
| smax | <code>number</code> | The end index of the first array |
| tmin | <code>number</code> | The start index of the second array |
| tmax | <code>number</code> | The end index of the second array |

