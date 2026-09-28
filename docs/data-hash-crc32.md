## Constants

<dl>
<dt><a href="#CRC32_POLYNOMIAL">CRC32_POLYNOMIAL</a> : <code>number</code></dt>
<dd><p>Reflected polynomial for CRC-32/ISO-HDLC, used by PNG, ZIP, zlib, and <code>@uttori/asm-core</code>.</p>
</dd>
<dt><a href="#CRC32C_POLYNOMIAL">CRC32C_POLYNOMIAL</a> : <code>number</code></dt>
<dd><p>Reflected polynomial for CRC-32C/Castagnoli, used by ACT2 capture chunks.</p>
</dd>
<dt><a href="#CRC32_TABLE">CRC32_TABLE</a></dt>
<dd><p>256-entry reflected lookup table for <a href="#CRC32_POLYNOMIAL">CRC32_POLYNOMIAL</a>.</p>
</dd>
<dt><a href="#CRC32C_TABLE">CRC32C_TABLE</a></dt>
<dd><p>256-entry reflected lookup table for <a href="#CRC32C_POLYNOMIAL">CRC32C_POLYNOMIAL</a>.</p>
</dd>
<dt><a href="#calculate">calculate</a> ⇒ <code>string</code></dt>
<dd><p>Derive the Cyclic Redundancy Check of a data blob.
This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.
The same value is available as an unsigned integer from <a href="#compute">compute</a>.</p>
</dd>
<dt><a href="#compute">compute</a> ⇒ <code>number</code></dt>
<dd><p>CRC-32/ISO-HDLC as an unsigned 32-bit integer.
Matches <code>@uttori/asm-core</code> <code>CRC32.compute</code>, <code>node:zlib</code> <code>crc32</code>, and the PNG chunk checksum.</p>
</dd>
<dt><a href="#crc32c">crc32c</a> ⇒ <code>number</code></dt>
<dd><p>CRC-32C/Castagnoli as an unsigned 32-bit integer.
Initial value and final XOR are both <code>0xFFFFFFFF</code>, LSB first.
Pass <code>zeroChecksum</code> to hash bytes 56–59 as zero without modifying <code>data</code>, which is how an ACT2 chunk checks the word stored at that offset.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#HashInput">HashInput</a> : <code>Array.&lt;number&gt;</code> | <code>ArrayBuffer</code> | <code>Buffer</code> | <code>DataBuffer</code> | <code>Int8Array</code> | <code>Int16Array</code> | <code>Int32Array</code> | <code>number</code> | <code>string</code> | <code>Uint8Array</code> | <code>Uint16Array</code> | <code>Uint32Array</code></dt>
<dd><p>Bytes accepted by the checksum helpers. Strings are encoded as UTF-8.
A number is a zero-filled length, matching <code>DataBuffer</code>.</p>
</dd>
</dl>

<a name="CRC32_POLYNOMIAL"></a>

## CRC32\_POLYNOMIAL : <code>number</code>
Reflected polynomial for CRC-32/ISO-HDLC, used by PNG, ZIP, zlib, and `@uttori/asm-core`.

**Kind**: global constant  
<a name="CRC32C_POLYNOMIAL"></a>

## CRC32C\_POLYNOMIAL : <code>number</code>
Reflected polynomial for CRC-32C/Castagnoli, used by ACT2 capture chunks.

**Kind**: global constant  
<a name="CRC32_TABLE"></a>

## CRC32\_TABLE
256-entry reflected lookup table for [CRC32_POLYNOMIAL](#CRC32_POLYNOMIAL).

**Kind**: global constant  
<a name="CRC32C_TABLE"></a>

## CRC32C\_TABLE
256-entry reflected lookup table for [CRC32C_POLYNOMIAL](#CRC32C_POLYNOMIAL).

**Kind**: global constant  
<a name="calculate"></a>

## calculate ⇒ <code>string</code>
Derive the Cyclic Redundancy Check of a data blob.
This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.
The same value is available as an unsigned integer from [compute](#compute).

**Kind**: global constant  
**Returns**: <code>string</code> - Uppercase hexadecimal CRC-32. Values below `0x10000000` are not padded.  
**See**

- [CRC-32](https://rosettacode.org/wiki/CRC-32)
- [CRC-32/ISO-HDLC](https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32-iso-hdlc)


| Param | Type | Description |
| --- | --- | --- |
| data | [<code>HashInput</code>](#HashInput) | The data to process. |

**Example** *(CRC32.of(...))*  
```js
import CRC32 from '@uttori/data-tools/data-hash-crc32';
CRC32.of('The quick brown fox jumps over the lazy dog');
➜ '414FA339'
```
<a name="compute"></a>

## compute ⇒ <code>number</code>
CRC-32/ISO-HDLC as an unsigned 32-bit integer.
Matches `@uttori/asm-core` `CRC32.compute`, `node:zlib` `crc32`, and the PNG chunk checksum.

**Kind**: global constant  
**Returns**: <code>number</code> - Unsigned CRC-32 value.  
**See**: [CRC-32/ISO-HDLC](https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32-iso-hdlc)  

| Param | Type | Description |
| --- | --- | --- |
| data | [<code>HashInput</code>](#HashInput) | The data to process. |

**Example** *(CRC32.compute(...))*  
```js
import CRC32 from '@uttori/data-tools/data-hash-crc32';
CRC32.compute('123456789');
➜ 0xCBF43926
```
<a name="crc32c"></a>

## crc32c ⇒ <code>number</code>
CRC-32C/Castagnoli as an unsigned 32-bit integer.
Initial value and final XOR are both `0xFFFFFFFF`, LSB first.
Pass `zeroChecksum` to hash bytes 56–59 as zero without modifying `data`, which is how an ACT2 chunk checks the word stored at that offset.

**Kind**: global constant  
**Returns**: <code>number</code> - Unsigned CRC-32C value.  
**See**: [CRC-32C](https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32c)  

| Param | Type | Description |
| --- | --- | --- |
| data | [<code>HashInput</code>](#HashInput) | The data to process. |
| [zeroChecksum] | <code>boolean</code> | Treat ACT2 checksum bytes 56–59 as zero. Defaults to false. |

**Example** *(CRC32.crc32c(...))*  
```js
import CRC32 from '@uttori/data-tools/data-hash-crc32';
CRC32.crc32c('123456789');
➜ 0xE3069283
CRC32.crc32c(chunk, true);
➜ checksum with bytes 56–59 treated as zero
```
<a name="HashInput"></a>

## HashInput : <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code>
Bytes accepted by the checksum helpers. Strings are encoded as UTF-8.
A number is a zero-filled length, matching `DataBuffer`.

**Kind**: global typedef  
