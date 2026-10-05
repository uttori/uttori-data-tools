<a name="diffBuffer"></a>

## diffBuffer(buffer, input, offset) ⇒
Diffs `input` against `buffer` from `offset`.
Import this when a comparison is needed. Parsers that only read bytes do not pull in Myers.

**Kind**: global function  
**Returns**: Edits that turn `buffer`'s bytes, from `offset`, into `input`.  

| Param | Description |
| --- | --- |
| buffer | The buffer to compare from. |
| input | The bytes to compare against. |
| offset | Start index in `buffer`. Defaults to 0. |

