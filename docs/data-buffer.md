<a name="DataBuffer"></a>

## DataBuffer
Helper class for manipulating binary data.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> \| <code>Uint8Array</code> | The data to process. |
| length | <code>number</code> | The size of the data in bytes. |
| next | [<code>DataBuffer</code>](#DataBuffer) | The next DataBuffer when part of a DataBufferList. |
| prev | [<code>DataBuffer</code>](#DataBuffer) | The previous DataBuffer when part of a DataBufferList. |


* [DataBuffer](#DataBuffer)
    * [new DataBuffer([input])](#new_DataBuffer_new)
    * _instance_
        * [.writing](#DataBuffer+writing) : <code>boolean</code>
        * [.data](#DataBuffer+data) : <code>Array.&lt;number&gt;</code> \| <code>Buffer</code> \| <code>Uint8Array</code>
        * [.lengthInBytes](#DataBuffer+lengthInBytes) : <code>number</code>
        * [.next](#DataBuffer+next) : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
        * [.prev](#DataBuffer+prev) : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
        * [.nativeEndian](#DataBuffer+nativeEndian) : <code>boolean</code>
        * [.offset](#DataBuffer+offset) : <code>number</code>
        * [.buffer](#DataBuffer+buffer) : <code>Array.&lt;number&gt;</code>
        * [.length](#DataBuffer+length) ⇒ <code>number</code>
        * [.compare(input, [offset])](#DataBuffer+compare) ⇒ <code>boolean</code>
        * [.diff(input, [offset])](#DataBuffer+diff) ⇒ <code>Array.&lt;Edit&gt;</code>
        * [.isNextBytes(input)](#DataBuffer+isNextBytes) ⇒ <code>boolean</code>
        * [.copy()](#DataBuffer+copy) ⇒ [<code>DataBuffer</code>](#DataBuffer)
        * [.slice(position, [length])](#DataBuffer+slice) ⇒ [<code>DataBuffer</code>](#DataBuffer)
        * [.remainingBytes()](#DataBuffer+remainingBytes) ⇒ <code>number</code>
        * [.available(bytes)](#DataBuffer+available) ⇒ <code>boolean</code>
        * [.availableAt(bytes, offset)](#DataBuffer+availableAt) ⇒ <code>boolean</code>
        * [.advance(bytes)](#DataBuffer+advance)
        * [.rewind(bytes)](#DataBuffer+rewind)
        * [.seek(position)](#DataBuffer+seek)
        * [.readUInt8()](#DataBuffer+readUInt8) ⇒ <code>number</code>
        * [.peekUInt8([offset])](#DataBuffer+peekUInt8) ⇒ <code>number</code>
        * [.read(bytes, [littleEndian])](#DataBuffer+read) ⇒ <code>Uint8Array</code>
        * [.peek(bytes, [offset], [littleEndian])](#DataBuffer+peek) ⇒ <code>Uint8Array</code>
        * [.peekBit(position, [length], [offset])](#DataBuffer+peekBit) ⇒ <code>number</code>
        * [.readInt8()](#DataBuffer+readInt8) ⇒ <code>number</code>
        * [.peekInt8([offset])](#DataBuffer+peekInt8) ⇒ <code>number</code>
        * [.readUInt16([littleEndian])](#DataBuffer+readUInt16) ⇒ <code>number</code>
        * [.peekUInt16([offset], [littleEndian])](#DataBuffer+peekUInt16) ⇒ <code>number</code>
        * [.readInt16([littleEndian])](#DataBuffer+readInt16) ⇒ <code>number</code>
        * [.peekInt16([offset], [littleEndian])](#DataBuffer+peekInt16) ⇒ <code>number</code>
        * [.readUInt24([littleEndian])](#DataBuffer+readUInt24) ⇒ <code>number</code>
        * [.peekUInt24([offset], [littleEndian])](#DataBuffer+peekUInt24) ⇒ <code>number</code>
        * [.readInt24([littleEndian])](#DataBuffer+readInt24) ⇒ <code>number</code>
        * [.peekInt24([offset], [littleEndian])](#DataBuffer+peekInt24) ⇒ <code>number</code>
        * [.readUInt32([littleEndian])](#DataBuffer+readUInt32) ⇒ <code>number</code>
        * [.peekUInt32([offset], [littleEndian])](#DataBuffer+peekUInt32) ⇒ <code>number</code>
        * [.readInt32([littleEndian])](#DataBuffer+readInt32) ⇒ <code>number</code>
        * [.peekInt32([offset], [littleEndian])](#DataBuffer+peekInt32) ⇒ <code>number</code>
        * [.readFloat32([littleEndian])](#DataBuffer+readFloat32) ⇒ <code>number</code>
        * [.peekFloat32([offset], [littleEndian])](#DataBuffer+peekFloat32) ⇒ <code>number</code>
        * [.readFloat48([littleEndian])](#DataBuffer+readFloat48) ⇒ <code>number</code>
        * [.peekFloat48([offset], [littleEndian])](#DataBuffer+peekFloat48) ⇒ <code>number</code>
        * [.readFloat64([littleEndian])](#DataBuffer+readFloat64) ⇒ <code>number</code>
        * [.peekFloat64([offset], [littleEndian])](#DataBuffer+peekFloat64) ⇒ <code>number</code>
        * [.readFloat80([littleEndian])](#DataBuffer+readFloat80) ⇒ <code>number</code>
        * [.peekFloat80([offset], [littleEndian])](#DataBuffer+peekFloat80) ⇒ <code>number</code>
        * [.readBuffer(length)](#DataBuffer+readBuffer) ⇒ [<code>DataBuffer</code>](#DataBuffer)
        * [.peekBuffer(offset, length)](#DataBuffer+peekBuffer) ⇒ [<code>DataBuffer</code>](#DataBuffer)
        * [.readString(length, [encoding])](#DataBuffer+readString) ⇒ <code>string</code>
        * [.peekString(offset, length, [encoding])](#DataBuffer+peekString) ⇒ <code>string</code>
        * [.decodeString(offset, length, encoding, advance)](#DataBuffer+decodeString) ⇒ <code>string</code> ℗
        * [.reset()](#DataBuffer+reset)
        * [.writeUInt8(data, [offset], [advance])](#DataBuffer+writeUInt8)
        * [.writeUInt16(data, [offset], [advance], [littleEndian])](#DataBuffer+writeUInt16)
        * [.writeUInt24(data, [offset], [advance], [littleEndian])](#DataBuffer+writeUInt24)
        * [.writeUInt32(data, [offset], [advance], [littleEndian])](#DataBuffer+writeUInt32)
        * [.writeBytes(data, [offset], [advance])](#DataBuffer+writeBytes)
        * [.writeString(string, [offset], [encoding], [advance])](#DataBuffer+writeString)
        * [.commit()](#DataBuffer+commit)
    * _static_
        * [.allocate(size)](#DataBuffer.allocate) ⇒ [<code>DataBuffer</code>](#DataBuffer)

<a name="new_DataBuffer_new"></a>

### new DataBuffer([input])
Creates an instance of DataBuffer.

**Throws**:

- <code>TypeError</code> Missing input data.
- <code>TypeError</code> Unknown type of input for DataBuffer: ${typeof input}


| Param | Type | Description |
| --- | --- | --- |
| [input] | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| [<code>DataBuffer</code>](#DataBuffer) \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> | The data to process. |

**Example** *(new DataBuffer(stream))*  
```js
const buffer = new DataBuffer(new Uint8Array([0xFC, 0x08]));
buffer.readUInt8();
➜ 0xFC
buffer.readUInt8();
➜ 0x08
```
<a name="DataBuffer+writing"></a>

### dataBuffer.writing : <code>boolean</code>
Is this instance for creating a new file?

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+data"></a>

### dataBuffer.data : <code>Array.&lt;number&gt;</code> \| <code>Buffer</code> \| <code>Uint8Array</code>
The bytes avaliable to read.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+lengthInBytes"></a>

### dataBuffer.lengthInBytes : <code>number</code>
The number of bytes avaliable to read.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+next"></a>

### dataBuffer.next : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
When the buffer is part of a bufferlist, the next DataBuffer in the list.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+prev"></a>

### dataBuffer.prev : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
When the buffer is part of a bufferlist, the previous DataBuffer in the list.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+nativeEndian"></a>

### dataBuffer.nativeEndian : <code>boolean</code>
Native Endianness of the machine, true is Little Endian, false is Big Endian

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+offset"></a>

### dataBuffer.offset : <code>number</code>
Reading / Writing offset

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+buffer"></a>

### dataBuffer.buffer : <code>Array.&lt;number&gt;</code>
Buffer for creating new files.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+length"></a>

### dataBuffer.length ⇒ <code>number</code>
Helper to match arrays by returning the data length.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The data length of the DataBuffer.  
<a name="DataBuffer+compare"></a>

### dataBuffer.compare(input, [offset]) ⇒ <code>boolean</code>
Compares another DataBuffer against the current data buffer at a specified offset.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>boolean</code> - Returns true when both DataBuffers are equal, false if there is any difference.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| [<code>DataBuffer</code>](#DataBuffer) \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> |  | The size of the requested DataBuffer. |
| [offset] | <code>number</code> | <code>0</code> | The size of the requested DataBuffer, default is 0. |

<a name="DataBuffer+diff"></a>

### dataBuffer.diff(input, [offset]) ⇒ <code>Array.&lt;Edit&gt;</code>
Diffs another DataBuffer against the current data buffer at a specified offset and returns the edits.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>Array.&lt;Edit&gt;</code> - Returns an array of edits describing the differences.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| [<code>DataBuffer</code>](#DataBuffer) \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> |  | The DataBuffer to compare against. |
| [offset] | <code>number</code> | <code>0</code> | The offset to start the comparison from, default is 0. |

<a name="DataBuffer+isNextBytes"></a>

### dataBuffer.isNextBytes(input) ⇒ <code>boolean</code>
Compares input data against the upcoming data, byte by byte.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>boolean</code> - True if the data is the upcoming data, false if it is not or there is not enough buffer remaining.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>Array.&lt;number&gt;</code> \| <code>Buffer</code> | The data to check for in upcoming bytes. |

<a name="DataBuffer+copy"></a>

### dataBuffer.copy() ⇒ [<code>DataBuffer</code>](#DataBuffer)
Creates a copy of the current DataBuffer.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - A new copy of the current DataBuffer.  
<a name="DataBuffer+slice"></a>

### dataBuffer.slice(position, [length]) ⇒ [<code>DataBuffer</code>](#DataBuffer)
Creates a copy of the current DataBuffer from a specified offset and a specified length.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - The new DataBuffer  

| Param | Type | Description |
| --- | --- | --- |
| position | <code>number</code> | The starting offset to begin the copy of the new DataBuffer. |
| [length] | <code>number</code> | The size of the new DataBuffer, defaults to the current length. |

<a name="DataBuffer+remainingBytes"></a>

### dataBuffer.remainingBytes() ⇒ <code>number</code>
Returns the remaining bytes to be read in the DataBuffer.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The remaining bytes to bre read in the DataBuffer.  
<a name="DataBuffer+available"></a>

### dataBuffer.available(bytes) ⇒ <code>boolean</code>
Checks if a given number of bytes are avaliable in the DataBuffer.
If writing mode is enabled, this is always true.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>boolean</code> - True if there are the requested amount, or more, of bytes left in the DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to check for. |

<a name="DataBuffer+availableAt"></a>

### dataBuffer.availableAt(bytes, offset) ⇒ <code>boolean</code>
Checks if a given number of bytes are avaliable after a given offset in the buffer.
If writing mode is enabled, this is always true.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>boolean</code> - True if there are the requested amount, or more, of bytes left in the stream.  

| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to check for. |
| offset | <code>number</code> | The offset to start from. |

<a name="DataBuffer+advance"></a>

### dataBuffer.advance(bytes)
Advance the offset by a given number of bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the DataBuffer.


| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to advance. |

<a name="DataBuffer+rewind"></a>

### dataBuffer.rewind(bytes)
Rewind the offset by a given number of bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the DataBuffer.


| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>number</code> | The number of bytes to go back. |

<a name="DataBuffer+seek"></a>

### dataBuffer.seek(position)
Go to a specified offset in the stream.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Description |
| --- | --- | --- |
| position | <code>number</code> | The offset to go to. |

<a name="DataBuffer+readUInt8"></a>

### dataBuffer.readUInt8() ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The UInt8 value at the current offset.  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the stream.

<a name="DataBuffer+peekUInt8"></a>

### dataBuffer.peekUInt8([offset]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The UInt8 value at the current offset.  
**Throws**:

- <code>UnderflowError</code> Insufficient Bytes in the stream.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |

<a name="DataBuffer+read"></a>

### dataBuffer.read(bytes, [littleEndian]) ⇒ <code>Uint8Array</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>Uint8Array</code> - The UInt8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bytes | <code>number</code> |  | The number of bytes to read. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peek"></a>

### dataBuffer.peek(bytes, [offset], [littleEndian]) ⇒ <code>Uint8Array</code>
Read from the provided offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>Uint8Array</code> - The UInt8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bytes | <code>number</code> |  | The number of bytes to read. |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekBit"></a>

### dataBuffer.peekBit(position, [length], [offset]) ⇒ <code>number</code>
Read the bits from the bytes from the provided offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The value at the provided bit position of a provided length at the provided offset.  
**Throws**:

- <code>Error</code> peekBit position is invalid: ${position}, must be an Integer between 0 and 7
- <code>Error</code> `peekBit length is invalid: ${length}, must be an Integer between 1 and 8


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| position | <code>number</code> |  | The bit position to read, 0 to 7. |
| [length] | <code>number</code> | <code>1</code> | The number of bits to read, 1 to 8, default is 1. |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |

<a name="DataBuffer+readInt8"></a>

### dataBuffer.readInt8() ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int8 value at the current offset.  
<a name="DataBuffer+peekInt8"></a>

### dataBuffer.peekInt8([offset]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |

<a name="DataBuffer+readUInt16"></a>

### dataBuffer.readUInt16([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The UInt16 value at the current offset.  

| Param | Type | Description |
| --- | --- | --- |
| [littleEndian] | <code>boolean</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekUInt16"></a>

### dataBuffer.peekUInt16([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readInt16"></a>

### dataBuffer.readInt16([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekInt16"></a>

### dataBuffer.peekInt16([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readUInt24"></a>

### dataBuffer.readUInt24([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The UInt24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekUInt24"></a>

### dataBuffer.peekUInt24([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The UInt24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readInt24"></a>

### dataBuffer.readInt24([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekInt24"></a>

### dataBuffer.peekInt24([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readUInt32"></a>

### dataBuffer.readUInt32([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The UInt32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekUInt32"></a>

### dataBuffer.peekUInt32([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The UInt32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readInt32"></a>

### dataBuffer.readInt32([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekInt32"></a>

### dataBuffer.peekInt32([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Int32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readFloat32"></a>

### dataBuffer.readFloat32([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekFloat32"></a>

### dataBuffer.peekFloat32([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readFloat48"></a>

### dataBuffer.readFloat48([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the Turbo Pascal 48 bit extended float value.
May be faulty with large numbers due to float percision.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float48 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekFloat48"></a>

### dataBuffer.peekFloat48([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
May be faulty with large numbers due to float percision.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float48 value at the specified offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readFloat64"></a>

### dataBuffer.readFloat64([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float64 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+peekFloat64"></a>

### dataBuffer.peekFloat64([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float64 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format, default is false. |

<a name="DataBuffer+readFloat80"></a>

### dataBuffer.readFloat80([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the IEEE 80 bit extended float value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float80 value at the current offset.  

| Param | Type | Description |
| --- | --- | --- |
| [littleEndian] | <code>boolean</code> | Read in Little Endian format, defaults to system value, default is the current nativeEndian value. |

<a name="DataBuffer+peekFloat80"></a>

### dataBuffer.peekFloat80([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float80 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from, default is 0. |
| [littleEndian] | <code>boolean</code> |  | Read in Little Endian format, defaults to system value, default is the current nativeEndian value. |

<a name="DataBuffer+readBuffer"></a>

### dataBuffer.readBuffer(length) ⇒ [<code>DataBuffer</code>](#DataBuffer)
Read from the current offset and return the value as a DataBuffer.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - The requested number of bytes as a DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>number</code> | The number of bytes to read. |

<a name="DataBuffer+peekBuffer"></a>

### dataBuffer.peekBuffer(offset, length) ⇒ [<code>DataBuffer</code>](#DataBuffer)
Read from the specified offset and return the value as a DataBuffer.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - The requested number of bytes as a DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | The offset to read from. |
| length | <code>number</code> | The number of bytes to read. |

<a name="DataBuffer+readString"></a>

### dataBuffer.readString(length, [encoding]) ⇒ <code>string</code>
Read from the current offset for a given length and return the value as a string.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>string</code> - The read value as a string.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| length | <code>number</code> |  | The number of bytes to read. |
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string, default is `ascii`. |

<a name="DataBuffer+peekString"></a>

### dataBuffer.peekString(offset, length, [encoding]) ⇒ <code>string</code>
Read from the specified offset for a given length and return the value as a string.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>string</code> - The read value as a string.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| offset | <code>number</code> |  | The offset to read from. |
| length | <code>number</code> |  | The number of bytes to read. |
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string, default is `ascii`. |

<a name="DataBuffer+decodeString"></a>

### dataBuffer.decodeString(offset, length, encoding, advance) ⇒ <code>string</code> ℗
Read from the specified offset for a given length and return the value as a string in a specified encoding, and optionally advance the offsets.
Supported Encodings: ascii / latin1, utf8 / utf-8, utf16-be, utf16be, utf16le, utf16-le, utf16bom, utf16-bom

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>string</code> - The read value as a string.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | The offset to read from. |
| length | <code>number</code> \| <code>null</code> | The number of bytes to read, if not defined it is the remaining bytes in the buffer. If NULL a null terminated string will be read. |
| encoding | <code>string</code> | The encoding of the string. |
| advance | <code>boolean</code> | Flag to optionally advance the offsets. |

<a name="DataBuffer+reset"></a>

### dataBuffer.reset()
Resets the instance offsets to 0.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+writeUInt8"></a>

### dataBuffer.writeUInt8(data, [offset], [advance])
Writes a single 8 bit byte.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>number</code> |  | The data to write. |
| [offset] | <code>number</code> |  | The offset to write the data to, default is current offset. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position, default is true. |

<a name="DataBuffer+writeUInt16"></a>

### dataBuffer.writeUInt16(data, [offset], [advance], [littleEndian])
Writes an unsigned 16 bit value, 2 bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>number</code> |  | The data to write. |
| [offset] | <code>number</code> |  | The offset to write the data to, default is current offset. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position, default is true. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Endianness of the write order, little Endian when `true`, default is big Endian `false`. |

<a name="DataBuffer+writeUInt24"></a>

### dataBuffer.writeUInt24(data, [offset], [advance], [littleEndian])
Writes an unsigned 24 bit value, 3 bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>number</code> |  | The data to write. |
| [offset] | <code>number</code> |  | The offset to write the data to, default is current offset. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position, default is true. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Endianness of the write order, little Endian when `true`, default is big Endian `false`. |

<a name="DataBuffer+writeUInt32"></a>

### dataBuffer.writeUInt32(data, [offset], [advance], [littleEndian])
Writes an unsigned 32 bit value, 4 bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>number</code> |  | The data to write. |
| [offset] | <code>number</code> |  | The offset to write the data to, default is current offset. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position, default is true. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Endianness of the write order, little Endian when `true`, default is big Endian `false`. |

<a name="DataBuffer+writeBytes"></a>

### dataBuffer.writeBytes(data, [offset], [advance])
Write a series of bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>Array.&lt;number&gt;</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> |  | The data to write. |
| [offset] | <code>number</code> |  | The offset to write the data to, default is current offset. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position, default is true. |

<a name="DataBuffer+writeString"></a>

### dataBuffer.writeString(string, [offset], [encoding], [advance])
Write a string as a given encoding.

Valid encodings are: 'ascii' aka 'latin1', 'utf8' / 'utf8', 'utf16be', 'utf16le'.

For UTF-8:
Up to 4 bytes per character can be used. The fewest number of bytes possible is used.
Characters up to U+007F are encoded with a single byte.
For multibyte sequences, the number of leading 1 bits in the first byte gives the number of bytes for the character. The rest of the bits of the first byte can be used to encode bits of the character.
The continuation bytes begin with 10, and the other 6 bits encode bits of the character.

UTF-8 conversion interpreted from https://stackoverflow.com/posts/18729931/revisions

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | The data to write. |
| [offset] | <code>number</code> |  | The offset to write the data to, default is current offset. |
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string, defailt is `ascii`. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position, default is true. |

<a name="DataBuffer+commit"></a>

### dataBuffer.commit()
Convert a write mode file into a read mode file.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer.allocate"></a>

### DataBuffer.allocate(size) ⇒ [<code>DataBuffer</code>](#DataBuffer)
Creates an instance of DataBuffer with given size.

**Kind**: static method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - The new DataBuffer.  

| Param | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | The size of the requested DataBuffer. |

