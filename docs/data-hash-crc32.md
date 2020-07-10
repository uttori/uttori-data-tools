<a name="CRC32"></a>

## CRC32
Derive the Cyclic Redundancy Check of a data blob.
This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.

**Kind**: global class  
**See**

- [CRC-32](https://rosettacode.org/wiki/CRC-32)
- [Computation of cyclic redundancy checks](https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks)

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| crc | <code>number</code> | The internal CRC value |


* [CRC32](#CRC32)
    * [new CRC32()](#new_CRC32_new)
    * _instance_
        * [.update(buffer)](#CRC32+update)
        * [.toHex()](#CRC32+toHex) ⇒ <code>string</code>
    * _static_
        * [.of(data)](#CRC32.of) ⇒ <code>string</code>

<a name="new_CRC32_new"></a>

### new CRC32()
Creates an instance of CRC32.

**Example** *(CRC32.of(...))*  
```js
CRC32.of('The quick brown fox jumps over the lazy dog');
➜ '414FA339'
```
<a name="CRC32+update"></a>

### crC32.update(buffer)
Calculates the CRC for a chunk of data.

**Kind**: instance method of [<code>CRC32</code>](#CRC32)  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | The data buffer to calculate the checksum of |

<a name="CRC32+toHex"></a>

### crC32.toHex() ⇒ <code>string</code>
Returns the internal CRC value as a hexadecimal string.

**Kind**: instance method of [<code>CRC32</code>](#CRC32)  
**Returns**: <code>string</code> - The computed CRC value  
<a name="CRC32.of"></a>

### CRC32.of(data) ⇒ <code>string</code>
Creates an instance of CRC32 and calculates the checksum of a provided input.

**Kind**: static method of [<code>CRC32</code>](#CRC32)  
**Returns**: <code>string</code> - The computed CRC value  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | The data to calculate the checksum of |

