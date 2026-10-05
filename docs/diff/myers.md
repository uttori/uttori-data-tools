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
    * [.smin](#Myers+smin) : <code>number</code>
    * [.smax](#Myers+smax) : <code>number</code>
    * [.tmin](#Myers+tmin) : <code>number</code>
    * [.tmax](#Myers+tmax) : <code>number</code>
    * [.compare(smin, smax, tmin, tmax)](#Myers+compare)
    * [.split(smin, smax, tmin, tmax)](#Myers+split) ⇒
    * [.createResultVector(indices, length)](#Myers+createResultVector) ⇒
    * [.validateBounds(smin, smax, tmin, tmax)](#Myers+validateBounds)

<a name="new_Myers_new"></a>

### new Myers(xidx, yidx, x0, y0, equal)

| Param | Description |
| --- | --- |
| xidx | Mapping of s indices to result vector positions |
| yidx | Mapping of t indices to result vector positions |
| x0 | The first array to compare |
| y0 | The second array to compare |
| equal | Equality function to compare elements |

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

| Param | Description |
| --- | --- |
| smin | The start index of the first array |
| smax | The end index of the first array |
| tmin | The start index of the second array |
| tmax | The end index of the second array |

<a name="Myers+split"></a>

### myers.split(smin, smax, tmin, tmax) ⇒
Find the endpoints of a sequence of diagonals on an optimal path from (smin, tmin) to (smax, tmax).

**Kind**: instance method of [<code>Myers</code>](#Myers)  
**Returns**: The endpoints of the sequence of diagonals  

| Param | Description |
| --- | --- |
| smin | The start index of the first array |
| smax | The end index of the first array |
| tmin | The start index of the second array |
| tmax | The end index of the second array |

<a name="Myers+createResultVector"></a>

### myers.createResultVector(indices, length) ⇒
Creates a dense result vector with a false sentinel after the highest mapped element.

**Kind**: instance method of [<code>Myers</code>](#Myers)  
**Returns**: The initialized result vector.  

| Param | Description |
| --- | --- |
| indices | Mapping of input indices to result vector positions |
| length | The number of input elements |

<a name="Myers+validateBounds"></a>

### myers.validateBounds(smin, smax, tmin, tmax)
Validates half-open comparison bounds before entering the search loops.

**Kind**: instance method of [<code>Myers</code>](#Myers)  

| Param | Description |
| --- | --- |
| smin | The start index of the first array |
| smax | The end index of the first array |
| tmin | The start index of the second array |
| tmax | The end index of the second array |

