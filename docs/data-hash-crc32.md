<a name="calculate"></a>

## calculate(data) ⇒ <code>string</code>
Derive the Cyclic Redundancy Check of a data blob.
This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.

**Kind**: global function  
**Returns**: <code>string</code> - The 8 character CRC32 value.  
**See**

- [CRC-32](https://rosettacode.org/wiki/CRC-32)
- [Computation of cyclic redundancy checks](https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks)


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> | The data to process. |

**Example** *(CRC32.of(...))*  
```js
import CRC32 from 'uttori-data-tools/data-hash-crc32';
CRC32.of('The quick brown fox jumps over the lazy dog');
➜ '414FA339'
```
