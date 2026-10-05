## Members

<dl>
<dt><a href="#textEncoder">textEncoder</a></dt>
<dd><p>Text encoder for string inputs.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#DATA_BUFFER_BRAND">DATA_BUFFER_BRAND</a></dt>
<dd><p>Same brand DataBuffer defines, so this module does not import the buffer implementation.</p>
</dd>
<dt><a href="#CRC32_POLYNOMIAL">CRC32_POLYNOMIAL</a></dt>
<dd><p>Reflected polynomial for CRC-32/ISO-HDLC, used by PNG, ZIP, zlib, and <code>@uttori/asm-core</code>.</p>
</dd>
<dt><a href="#CRC32C_POLYNOMIAL">CRC32C_POLYNOMIAL</a></dt>
<dd><p>Reflected polynomial for CRC-32C/Castagnoli, used by ACT2 capture chunks.</p>
</dd>
<dt><a href="#CRC32_TABLE">CRC32_TABLE</a></dt>
<dd><p>256-entry reflected lookup table for <a href="#CRC32_POLYNOMIAL">CRC32_POLYNOMIAL</a>.</p>
</dd>
<dt><a href="#CRC32C_TABLE">CRC32C_TABLE</a></dt>
<dd><p>256-entry reflected lookup table for <a href="#CRC32C_POLYNOMIAL">CRC32C_POLYNOMIAL</a>.</p>
</dd>
<dt><a href="#computeBytes">computeBytes</a> ⇒</dt>
<dd><p>Allocation-free CRC-32 for an already-normalized byte view.
Preconditions: bytes is an Uint8Array (including Buffer) and it is not mutated concurrently.
The view&#39;s byteOffset and byteLength are honored by indexed access.</p>
</dd>
<dt><a href="#calculate">calculate</a> ⇒</dt>
<dd><p>Derive the Cyclic Redundancy Check of a data blob.
This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.
The same value is available as an unsigned integer from <a href="#compute">compute</a>.</p>
</dd>
<dt><a href="#compute">compute</a> ⇒</dt>
<dd><p>CRC-32/ISO-HDLC as an unsigned 32-bit integer.
Matches <code>@uttori/asm-core</code> <code>CRC32.compute</code>, <code>node:zlib</code> <code>crc32</code>, and the PNG chunk checksum.</p>
</dd>
<dt><a href="#crc32c">crc32c</a> ⇒</dt>
<dd><p>CRC-32C/Castagnoli as an unsigned 32-bit integer.
Initial value and final XOR are both <code>0xFFFFFFFF</code>, LSB first.
Pass <code>zeroChecksum</code> to hash bytes 56–59 as zero without modifying <code>data</code>, which is how an ACT2 chunk checks the word stored at that offset.</p>
</dd>
<dt><a href="#crc32cBytes">crc32cBytes</a> ⇒</dt>
<dd><p>Allocation-free CRC-32C for an already-normalized byte view.
The zeroChecksum positions are relative to this view, not its backing buffer.
This function never changes bytes. It has the same preconditions as <a href="#computeBytes">computeBytes</a>.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#reflectedTable">reflectedTable(polynomial)</a> ⇒</dt>
<dd><p>Build the 256-entry reflected lookup table for a polynomial.</p>
</dd>
<dt><a href="#sliceTable">sliceTable(table)</a> ⇒</dt>
<dd><p>Build the eight slicing tables that fold eight bytes per step.</p>
</dd>
<dt><a href="#isDataBuffer">isDataBuffer(data)</a> ⇒</dt>
<dd><p>DataBuffer stamps this brand in its constructor.</p>
</dd>
<dt><a href="#hashBytes">hashBytes(data)</a> ⇒</dt>
<dd><p>Normalize any accepted input to the bytes that will be hashed.
Matches DataBuffer&#39;s conversions without importing that module.</p>
</dd>
<dt><a href="#isoChecksum">isoChecksum(data)</a> ⇒</dt>
<dd><p>CRC-32/ISO-HDLC of <code>data</code> as an unsigned 32-bit integer.
Initial value and final XOR are both <code>0xFFFFFFFF</code>, LSB first.</p>
</dd>
</dl>

<a name="textEncoder"></a>

## textEncoder
Text encoder for string inputs.

**Kind**: global variable  
<a name="DATA_BUFFER_BRAND"></a>

## DATA\_BUFFER\_BRAND
Same brand DataBuffer defines, so this module does not import the buffer implementation.

**Kind**: global constant  
<a name="CRC32_POLYNOMIAL"></a>

## CRC32\_POLYNOMIAL
Reflected polynomial for CRC-32/ISO-HDLC, used by PNG, ZIP, zlib, and `@uttori/asm-core`.

**Kind**: global constant  
<a name="CRC32C_POLYNOMIAL"></a>

## CRC32C\_POLYNOMIAL
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
<a name="computeBytes"></a>

## computeBytes ⇒
Allocation-free CRC-32 for an already-normalized byte view.
Preconditions: bytes is an Uint8Array (including Buffer) and it is not mutated concurrently.
The view's byteOffset and byteLength are honored by indexed access.

**Kind**: global constant  
**Returns**: Unsigned CRC-32.  

| Param | Description |
| --- | --- |
| bytes | Bytes to hash. |

<a name="calculate"></a>

## calculate ⇒
Derive the Cyclic Redundancy Check of a data blob.
This variant of CRC-32 uses LSB-first order, sets the initial CRC to FFFFFFFF16, and complements the final CRC.
The same value is available as an unsigned integer from [compute](#compute).

**Kind**: global constant  
**Returns**: Uppercase hexadecimal CRC-32. Values below `0x10000000` are not padded.  
**See**

- [CRC-32](https://rosettacode.org/wiki/CRC-32)
- [CRC-32/ISO-HDLC](https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32-iso-hdlc)


| Param | Description |
| --- | --- |
| data | The data to process. |

**Example** *(CRC32.of(...))*  
```js
import CRC32 from '@uttori/data-tools/data-hash-crc32';
CRC32.of('The quick brown fox jumps over the lazy dog');
➜ '414FA339'
```
<a name="compute"></a>

## compute ⇒
CRC-32/ISO-HDLC as an unsigned 32-bit integer.
Matches `@uttori/asm-core` `CRC32.compute`, `node:zlib` `crc32`, and the PNG chunk checksum.

**Kind**: global constant  
**Returns**: Unsigned CRC-32 value.  
**See**: [CRC-32/ISO-HDLC](https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32-iso-hdlc)  

| Param | Description |
| --- | --- |
| data | The data to process. |

**Example** *(CRC32.compute(...))*  
```js
import CRC32 from '@uttori/data-tools/data-hash-crc32';
CRC32.compute('123456789');
➜ 0xCBF43926
```
<a name="crc32c"></a>

## crc32c ⇒
CRC-32C/Castagnoli as an unsigned 32-bit integer.
Initial value and final XOR are both `0xFFFFFFFF`, LSB first.
Pass `zeroChecksum` to hash bytes 56–59 as zero without modifying `data`, which is how an ACT2 chunk checks the word stored at that offset.

**Kind**: global constant  
**Returns**: Unsigned CRC-32C value.  
**See**: [CRC-32C](https://reveng.sourceforge.io/crc-catalogue/17plus.htm#crc.cat.crc-32c)  

| Param | Description |
| --- | --- |
| data | The data to process. |
| zeroChecksum | Treat ACT2 checksum bytes 56–59 as zero. Defaults to false. |

**Example** *(CRC32.crc32c(...))*  
```js
import CRC32 from '@uttori/data-tools/data-hash-crc32';
CRC32.crc32c('123456789');
➜ 0xE3069283
CRC32.crc32c(chunk, true);
➜ checksum with bytes 56–59 treated as zero
```
<a name="crc32cBytes"></a>

## crc32cBytes ⇒
Allocation-free CRC-32C for an already-normalized byte view.
The zeroChecksum positions are relative to this view, not its backing buffer.
This function never changes bytes. It has the same preconditions as [computeBytes](#computeBytes).

**Kind**: global constant  
**Returns**: Unsigned CRC-32C.  

| Param | Description |
| --- | --- |
| bytes | Bytes to hash. |
| zeroChecksum | Treat existing bytes 56-59 as zero. |

<a name="reflectedTable"></a>

## reflectedTable(polynomial) ⇒
Build the 256-entry reflected lookup table for a polynomial.

**Kind**: global function  
**Returns**: Unsigned table entries.  

| Param | Description |
| --- | --- |
| polynomial | Reflected CRC polynomial. |

<a name="sliceTable"></a>

## sliceTable(table) ⇒
Build the eight slicing tables that fold eight bytes per step.

**Kind**: global function  
**Returns**: Slicing tables, index 0 is the byte table.  

| Param | Description |
| --- | --- |
| table | Byte lookup table. |

<a name="isDataBuffer"></a>

## isDataBuffer(data) ⇒
DataBuffer stamps this brand in its constructor.

**Kind**: global function  
**Returns**: Whether checksums should read `data.data`.  

| Param | Description |
| --- | --- |
| data | Value that might be a DataBuffer. |

<a name="hashBytes"></a>

## hashBytes(data) ⇒
Normalize any accepted input to the bytes that will be hashed.
Matches DataBuffer's conversions without importing that module.

**Kind**: global function  
**Returns**: Bytes to hash.  

| Param | Description |
| --- | --- |
| data | The data to process. |

<a name="isoChecksum"></a>

## isoChecksum(data) ⇒
CRC-32/ISO-HDLC of `data` as an unsigned 32-bit integer.
Initial value and final XOR are both `0xFFFFFFFF`, LSB first.

**Kind**: global function  
**Returns**: Unsigned CRC-32 value.  

| Param | Description |
| --- | --- |
| data | The data to process. |

