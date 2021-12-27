## Classes

<dl>
<dt><a href="#DataStream">DataStream</a></dt>
<dd><p>Helpter class to ease working with binary files.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a> : <code>function</code></dt>
<dd></dd>
</dl>

<a name="DataStream"></a>

## DataStream
Helpter class to ease working with binary files.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | ArrayBuffer byteLength |
| buf | <code>ArrayBuffer</code> | Instance of ArrayBuffer used for the various typed arrays |
| uint8 | <code>Uint8Array</code> | octet / uint8_t |
| int8 | <code>Int8Array</code> | byte / int8_t |
| uint16 | <code>Uint16Array</code> | unsigned short / uint16_t |
| int16 | <code>Int16Array</code> | short / int16_t |
| uint32 | <code>Uint32Array</code> | unsigned long / uint32_t |
| int32 | <code>Int32Array</code> | long / int32_t |
| float32 | <code>Float32Array</code> | unrestricted float / float |
| float64 | <code>Float64Array</code> | unrestricted double / double |
| int64 | <code>BigInt64Array</code> | bigint / int64_t (signed long long) |
| uint64 | <code>BigUint64Array</code> | bigint / uint64_t (unsigned long long) |
| nativeEndian | <code>boolean</code> | Native Endianness of the machine, true is Little Endian, false is Big Endian |
| list | <code>DataBufferList</code> | The DataBufferList to process |
| localOffset | <code>number</code> | Reading offset for the current chunk |
| offset | <code>number</code> | Reading offset for all chunks |


* [DataStream](#DataStream)
    * [new DataStream(list, options)](#new_DataStream_new)
    * _instance_
        * [.size](#DataStream+size) : <code>number</code>
        * [.buf](#DataStream+buf) : <code>ArrayBuffer</code>
        * [.uint8](#DataStream+uint8) : <code>Uint8Array</code>
        * [.int8](#DataStream+int8) : <code>Int8Array</code>
        * [.uint16](#DataStream+uint16) : <code>Uint16Array</code>
        * [.int16](#DataStream+int16) : <code>Int16Array</code>
        * [.uint32](#DataStream+uint32) : <code>Uint32Array</code>
        * [.int32](#DataStream+int32) : <code>Int32Array</code>
        * [.float32](#DataStream+float32) : <code>Float32Array</code>
        * [.float64](#DataStream+float64) : <code>Float64Array</code>
        * [.int64](#DataStream+int64) : <code>BigInt64Array</code>
        * [.uint64](#DataStream+uint64) : <code>BigUint64Array</code>
        * [.nativeEndian](#DataStream+nativeEndian) : <code>boolean</code>
        * [.list](#DataStream+list) : <code>DataBufferList</code>
        * [.localOffset](#DataStream+localOffset) : <code>number</code>
        * [.offset](#DataStream+offset) : <code>number</code>
        * [.compare(input, [offset])](#DataStream+compare) ⇒ <code>boolean</code>
        * [.next(input)](#DataStream+next) ⇒ <code>boolean</code>
        * [.copy()](#DataStream+copy) ⇒ [<code>DataStream</code>](#DataStream)
        * [.available(bytes)](#DataStream+available) ⇒ <code>boolean</code>
        * [.availableAt(bytes, offset)](#DataStream+availableAt) ⇒ <code>boolean</code>
        * [.remainingBytes()](#DataStream+remainingBytes) ⇒ <code>number</code>
        * [.advance(bytes)](#DataStream+advance) ⇒ [<code>DataStream</code>](#DataStream)
        * [.rewind(bytes)](#DataStream+rewind) ⇒ [<code>DataStream</code>](#DataStream)
        * [.seek(position)](#DataStream+seek) ⇒ [<code>DataStream</code>](#DataStream)
        * [.readUInt8()](#DataStream+readUInt8) ⇒ <code>\*</code>
        * [.peekUInt8([offset])](#DataStream+peekUInt8) ⇒ <code>\*</code>
        * [.read(bytes, [littleEndian])](#DataStream+read) ⇒ <code>Uint8Array</code>
        * [.peek(bytes, [offset], [littleEndian])](#DataStream+peek) ⇒ <code>\*</code>
        * [.peekBit(position, [length], [offset])](#DataStream+peekBit) ⇒ <code>number</code>
        * [.readInt8()](#DataStream+readInt8) ⇒ <code>\*</code>
        * [.peekInt8([offset])](#DataStream+peekInt8) ⇒ <code>\*</code>
        * [.readUInt16([littleEndian])](#DataStream+readUInt16) ⇒ <code>\*</code>
        * [.peekUInt16([offset], [littleEndian])](#DataStream+peekUInt16) ⇒ <code>\*</code>
        * [.readInt16([littleEndian])](#DataStream+readInt16) ⇒ <code>\*</code>
        * [.peekInt16([offset], [littleEndian])](#DataStream+peekInt16) ⇒ <code>\*</code>
        * [.readUInt24([littleEndian])](#DataStream+readUInt24) ⇒ <code>\*</code>
        * [.peekUInt24([offset], [littleEndian])](#DataStream+peekUInt24) ⇒ <code>\*</code>
        * [.readInt24([littleEndian])](#DataStream+readInt24) ⇒ <code>\*</code>
        * [.peekInt24([offset], [littleEndian])](#DataStream+peekInt24) ⇒ <code>\*</code>
        * [.readUInt32([littleEndian])](#DataStream+readUInt32) ⇒ <code>\*</code>
        * [.peekUInt32([offset], [littleEndian])](#DataStream+peekUInt32) ⇒ <code>\*</code>
        * [.readInt32([littleEndian])](#DataStream+readInt32) ⇒ <code>\*</code>
        * [.peekInt32([offset], [littleEndian])](#DataStream+peekInt32) ⇒ <code>\*</code>
        * [.readFloat32([littleEndian])](#DataStream+readFloat32) ⇒ <code>\*</code>
        * [.peekFloat32([offset], [littleEndian])](#DataStream+peekFloat32) ⇒ <code>\*</code>
        * [.readFloat48([littleEndian])](#DataStream+readFloat48) ⇒ <code>number</code>
        * [.peekFloat48([offset], [littleEndian])](#DataStream+peekFloat48) ⇒ <code>number</code>
        * [.readFloat64([littleEndian])](#DataStream+readFloat64) ⇒ <code>\*</code>
        * [.peekFloat64([offset], [littleEndian])](#DataStream+peekFloat64) ⇒ <code>\*</code>
        * [.readFloat80([littleEndian])](#DataStream+readFloat80) ⇒ <code>\*</code>
        * [.peekFloat80([offset], [littleEndian])](#DataStream+peekFloat80) ⇒ <code>\*</code>
        * [.readBuffer(length)](#DataStream+readBuffer) ⇒ <code>DataBuffer</code>
        * [.peekBuffer(offset, length)](#DataStream+peekBuffer) ⇒ <code>DataBuffer</code>
        * [.readSingleBuffer(length)](#DataStream+readSingleBuffer) ⇒ <code>DataBuffer</code>
        * [.peekSingleBuffer(offset, length)](#DataStream+peekSingleBuffer) ⇒ <code>DataBuffer</code>
        * [.readString(length, [encoding])](#DataStream+readString) ⇒ <code>string</code>
        * [.peekString(offset, length, [encoding])](#DataStream+peekString) ⇒ <code>string</code>
        * [.decodeString(offset, length, encoding, advance)](#DataStream+decodeString) ⇒ <code>string</code> ℗
        * [.reset()](#DataStream+reset)
    * _static_
        * [.fromData(data)](#DataStream.fromData) ⇒ [<code>DataStream</code>](#DataStream)
        * [.fromBuffer(buffer)](#DataStream.fromBuffer) ⇒ [<code>DataStream</code>](#DataStream)

<a name="new_DataStream_new"></a>

### new DataStream(list, options)
Creates a new DataStream.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| list | <code>DataBufferList</code> |  | The DataBufferList to process |
| options | <code>object</code> |  | Options for this instance |
| [options.size] | <code>number</code> | <code>16</code> | ArrayBuffer byteLength for the underlying binary parsing |

**Example** *(new DataStream(list, options))*  
```js
```
<a name="DataStream+size"></a>

### dataStream.size : <code>number</code>
ArrayBuffer byteLength

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+buf"></a>

### dataStream.buf : <code>ArrayBuffer</code>
Instance of ArrayBuffer used for the various typed arrays

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+uint8"></a>

### dataStream.uint8 : <code>Uint8Array</code>
octet / uint8_t

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+int8"></a>

### dataStream.int8 : <code>Int8Array</code>
byte / int8_t

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+uint16"></a>

### dataStream.uint16 : <code>Uint16Array</code>
unsigned short / uint16_t

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+int16"></a>

### dataStream.int16 : <code>Int16Array</code>
short / int16_t

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+uint32"></a>

### dataStream.uint32 : <code>Uint32Array</code>
unsigned long / uint32_t

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+int32"></a>

### dataStream.int32 : <code>Int32Array</code>
long / int32_t

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+float32"></a>

### dataStream.float32 : <code>Float32Array</code>
unrestricted float / float

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+float64"></a>

### dataStream.float64 : <code>Float64Array</code>
unrestricted double / double

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+int64"></a>

### dataStream.int64 : <code>BigInt64Array</code>
bigint / int64_t (signed long long)

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+uint64"></a>

### dataStream.uint64 : <code>BigUint64Array</code>
bigint / uint64_t (unsigned long long)

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+nativeEndian"></a>

### dataStream.nativeEndian : <code>boolean</code>
Native Endianness of the machine, true is Little Endian, false is Big Endian

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+list"></a>

### dataStream.list : <code>DataBufferList</code>
The DataBufferList to process

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+localOffset"></a>

### dataStream.localOffset : <code>number</code>
Reading offset for the current chunk

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+offset"></a>

### dataStream.offset : <code>number</code>
Reading offset for all chunks

**Kind**: instance property of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+compare"></a>

### dataStream.compare(input, [offset]) ⇒ <code>boolean</code>
Compares input data against the current data.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>boolean</code> - - True if the data is the same as the input, starting at the offset, false is there is any difference.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | [<code>DataStream</code>](#DataStream) |  | The DataStream to compare against. |
| [offset] | <code>number</code> | <code>0</code> | The offset to begin comparing at. |

<a name="DataStream+next"></a>

### dataStream.next(input) ⇒ <code>boolean</code>
Compares input data against the upcoming data, byte by byte.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>boolean</code> - - True if the data is the upcoming data, false if it is not or there is not enough buffer remaining.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> \| <code>Buffer</code> | The data to check for in upcoming bytes. |

<a name="DataStream+copy"></a>

### dataStream.copy() ⇒ [<code>DataStream</code>](#DataStream)
Create a copy of the current DataStream and offset.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - - A new copy of the DataStream.  
<a name="DataStream+available"></a>

### dataStream.available(bytes) ⇒ <code>boolean</code>
Checks if a given number of bytes are avaliable in the stream.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>boolean</code> - True if there are the requested amount, or more, of bytes left in the stream.  

| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to check for. |

<a name="DataStream+availableAt"></a>

### dataStream.availableAt(bytes, offset) ⇒ <code>boolean</code>
Checks if a given number of bytes are avaliable after a given offset in the stream.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>boolean</code> - - True if there are the requested amount, or more, of bytes left in the stream.  

| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to check for. |
| offset | <code>number</code> | The offset to start from. |

<a name="DataStream+remainingBytes"></a>

### dataStream.remainingBytes() ⇒ <code>number</code>
Returns the remaining bytes in the stream.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>number</code> - The remaining bytes in the stream.  
<a name="DataStream+advance"></a>

### dataStream.advance(bytes) ⇒ [<code>DataStream</code>](#DataStream)
Advance the stream by a given number of bytes.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - The current DataStream.  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the stream.


| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to advance. |

<a name="DataStream+rewind"></a>

### dataStream.rewind(bytes) ⇒ [<code>DataStream</code>](#DataStream)
Rewind the stream by a given number of bytes.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - The current DataStream.  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the stream.


| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to go back. |

<a name="DataStream+seek"></a>

### dataStream.seek(position) ⇒ [<code>DataStream</code>](#DataStream)
Go to a specified offset in the stream.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - The current DataStream.  

| Param | Type | Description |
| --- | --- | --- |
| position | <code>number</code> | The offset to go to. |

<a name="DataStream+readUInt8"></a>

### dataStream.readUInt8() ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt8 value at the current offset.  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the stream.

<a name="DataStream+peekUInt8"></a>

### dataStream.peekUInt8([offset]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt8 value at the current offset.  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the stream.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |

<a name="DataStream+read"></a>

### dataStream.read(bytes, [littleEndian]) ⇒ <code>Uint8Array</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Uint8Array</code> - - The UInt8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bytes | <code>number</code> |  | The number of bytes to read. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peek"></a>

### dataStream.peek(bytes, [offset], [littleEndian]) ⇒ <code>\*</code>
Read from the provided offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bytes | <code>number</code> |  | The number of bytes to read. |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekBit"></a>

### dataStream.peekBit(position, [length], [offset]) ⇒ <code>number</code>
Read the bits from the bytes from the provided offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>number</code> - The value at the provided bit position of a provided length at the provided offset.  
**Throws**:

- <code>Error</code> peekBit position is invalid: ${position}, must be an Integer between 0 and 7
- <code>Error</code> `peekBit length is invalid: ${length}, must be an Integer between 1 and 8


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| position | <code>number</code> |  | The bit position to read, 0 to 7. |
| [length] | <code>number</code> | <code>1</code> | The number of bits to read, 1 to 8. |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |

<a name="DataStream+readInt8"></a>

### dataStream.readInt8() ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int8 value at the current offset.  
<a name="DataStream+peekInt8"></a>

### dataStream.peekInt8([offset]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |

<a name="DataStream+readUInt16"></a>

### dataStream.readUInt16([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekUInt16"></a>

### dataStream.peekUInt16([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readInt16"></a>

### dataStream.readInt16([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekInt16"></a>

### dataStream.peekInt16([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readUInt24"></a>

### dataStream.readUInt24([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekUInt24"></a>

### dataStream.peekUInt24([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readInt24"></a>

### dataStream.readInt24([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekInt24"></a>

### dataStream.peekInt24([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readUInt32"></a>

### dataStream.readUInt32([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekUInt32"></a>

### dataStream.peekUInt32([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The UInt32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readInt32"></a>

### dataStream.readInt32([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekInt32"></a>

### dataStream.peekInt32([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Int32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readFloat32"></a>

### dataStream.readFloat32([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Float32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekFloat32"></a>

### dataStream.peekFloat32([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Float32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readFloat48"></a>

### dataStream.readFloat48([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the Turbo Pascal 48 bit extended float value.
May be faulty with large numbers due to float percision.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>number</code> - The Float48 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekFloat48"></a>

### dataStream.peekFloat48([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
May be faulty with large numbers due to float percision.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>number</code> - The Float48 value at the specified offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readFloat64"></a>

### dataStream.readFloat64([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Float64 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekFloat64"></a>

### dataStream.peekFloat64([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Float64 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readFloat80"></a>

### dataStream.readFloat80([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the IEEE 80 bit extended float value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Float80 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+peekFloat80"></a>

### dataStream.peekFloat80([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - The Float80 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataStream+readBuffer"></a>

### dataStream.readBuffer(length) ⇒ <code>DataBuffer</code>
Read from the current offset and return the value as a DataBuffer.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>DataBuffer</code> - The requested number of bytes as a DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>number</code> | The number of bytes to read. |

<a name="DataStream+peekBuffer"></a>

### dataStream.peekBuffer(offset, length) ⇒ <code>DataBuffer</code>
Read from the specified offset and return the value as a DataBuffer.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>DataBuffer</code> - The requested number of bytes as a DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | The offset to read from. |
| length | <code>number</code> | The number of bytes to read. |

<a name="DataStream+readSingleBuffer"></a>

### dataStream.readSingleBuffer(length) ⇒ <code>DataBuffer</code>
Read from the current offset of the current buffer for a given length and return the value as a DataBuffer.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>DataBuffer</code> - The requested number of bytes as a DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>number</code> | The number of bytes to read. |

<a name="DataStream+peekSingleBuffer"></a>

### dataStream.peekSingleBuffer(offset, length) ⇒ <code>DataBuffer</code>
Read from the specified offset of the current buffer for a given length and return the value as a DataBuffer.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>DataBuffer</code> - The requested number of bytes as a DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | The offset to read from. |
| length | <code>number</code> | The number of bytes to read. |

<a name="DataStream+readString"></a>

### dataStream.readString(length, [encoding]) ⇒ <code>string</code>
Read from the current offset for a given length and return the value as a string.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>string</code> - The read value as a string.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| length | <code>number</code> |  | The number of bytes to read. |
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string. |

<a name="DataStream+peekString"></a>

### dataStream.peekString(offset, length, [encoding]) ⇒ <code>string</code>
Read from the specified offset for a given length and return the value as a string.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>string</code> - The read value as a string.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| offset | <code>number</code> |  | The offset to read from. |
| length | <code>number</code> |  | The number of bytes to read. |
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string. |

<a name="DataStream+decodeString"></a>

### dataStream.decodeString(offset, length, encoding, advance) ⇒ <code>string</code> ℗
Read from the specified offset for a given length and return the value as a string in a specified encoding, and optionally advance the offsets.
Supported Encodings: ascii / latin1, utf8 / utf-8, utf16-be, utf16be, utf16le, utf16-le, utf16bom, utf16-bom

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>string</code> - The read value as a string.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | The offset to read from. |
| length | <code>number</code> | The number of bytes to read, if not defined it is the remaining bytes in the buffer. |
| encoding | <code>string</code> | The encoding of the string. |
| advance | <code>boolean</code> | Flag to optionally advance the offsets. |

<a name="DataStream+reset"></a>

### dataStream.reset()
Resets the instance offsets to 0.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream.fromData"></a>

### DataStream.fromData(data) ⇒ [<code>DataStream</code>](#DataStream)
Creates a new DataStream from file data.

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - The new DataStream instance for the provided file data.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>string</code> \| <code>Buffer</code> | The data of the image to process. |

<a name="DataStream.fromBuffer"></a>

### DataStream.fromBuffer(buffer) ⇒ [<code>DataStream</code>](#DataStream)
Creates a new DataStream from a DataBuffer.

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - The new DataStream instance for the provided DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | The DataBuffer of the image to process. |

<a name="debug"></a>

## debug() : <code>function</code>
**Kind**: global function  
