## Classes

<dl>
<dt><a href="#DataBuffer">DataBuffer</a></dt>
<dd><p>Helper class for manipulating binary data.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a> : <code>function</code></dt>
<dd></dd>
</dl>

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
        * [.data](#DataBuffer+data) : <code>Array</code> \| <code>Buffer</code> \| <code>Uint8Array</code>
        * [.next](#DataBuffer+next) : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
        * [.prev](#DataBuffer+prev) : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
        * [.nativeEndian](#DataBuffer+nativeEndian) : <code>boolean</code>
        * [.offset](#DataBuffer+offset) : <code>number</code>
        * [.buffer](#DataBuffer+buffer) : <code>Array.&lt;number&gt;</code>
        * [.length](#DataBuffer+length) ⇒ <code>number</code>
        * [.compare(input, [offset])](#DataBuffer+compare) ⇒ <code>boolean</code>
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
        * [.readInt8()](#DataBuffer+readInt8) ⇒ <code>\*</code>
        * [.peekInt8([offset])](#DataBuffer+peekInt8) ⇒ <code>\*</code>
        * [.readUInt16([littleEndian])](#DataBuffer+readUInt16) ⇒ <code>\*</code>
        * [.peekUInt16([offset], [littleEndian])](#DataBuffer+peekUInt16) ⇒ <code>\*</code>
        * [.readInt16([littleEndian])](#DataBuffer+readInt16) ⇒ <code>\*</code>
        * [.peekInt16([offset], [littleEndian])](#DataBuffer+peekInt16) ⇒ <code>\*</code>
        * [.readUInt24([littleEndian])](#DataBuffer+readUInt24) ⇒ <code>\*</code>
        * [.peekUInt24([offset], [littleEndian])](#DataBuffer+peekUInt24) ⇒ <code>\*</code>
        * [.readInt24([littleEndian])](#DataBuffer+readInt24) ⇒ <code>\*</code>
        * [.peekInt24([offset], [littleEndian])](#DataBuffer+peekInt24) ⇒ <code>\*</code>
        * [.readUInt32([littleEndian])](#DataBuffer+readUInt32) ⇒ <code>\*</code>
        * [.peekUInt32([offset], [littleEndian])](#DataBuffer+peekUInt32) ⇒ <code>\*</code>
        * [.readInt32([littleEndian])](#DataBuffer+readInt32) ⇒ <code>\*</code>
        * [.peekInt32([offset], [littleEndian])](#DataBuffer+peekInt32) ⇒ <code>\*</code>
        * [.readFloat32([littleEndian])](#DataBuffer+readFloat32) ⇒ <code>\*</code>
        * [.peekFloat32([offset], [littleEndian])](#DataBuffer+peekFloat32) ⇒ <code>\*</code>
        * [.readFloat48([littleEndian])](#DataBuffer+readFloat48) ⇒ <code>number</code>
        * [.peekFloat48([offset], [littleEndian])](#DataBuffer+peekFloat48) ⇒ <code>number</code>
        * [.readFloat64([littleEndian])](#DataBuffer+readFloat64) ⇒ <code>\*</code>
        * [.peekFloat64([offset], [littleEndian])](#DataBuffer+peekFloat64) ⇒ <code>\*</code>
        * [.readFloat80([littleEndian])](#DataBuffer+readFloat80) ⇒ <code>\*</code>
        * [.peekFloat80([offset], [littleEndian])](#DataBuffer+peekFloat80) ⇒ <code>\*</code>
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
| [input] | <code>Array</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| [<code>DataBuffer</code>](#DataBuffer) \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> | The data to process. |

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

### dataBuffer.data : <code>Array</code> \| <code>Buffer</code> \| <code>Uint8Array</code>
The bytes avaliable to read.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+next"></a>

### dataBuffer.next : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
The next DataBuffer in the list.

**Kind**: instance property of [<code>DataBuffer</code>](#DataBuffer)  
<a name="DataBuffer+prev"></a>

### dataBuffer.prev : [<code>DataBuffer</code>](#DataBuffer) \| <code>null</code>
The previous DataBuffer in the list.

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
| input | <code>Array</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| [<code>DataBuffer</code>](#DataBuffer) \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> \| <code>undefined</code> |  | The size of the requested DataBuffer. |
| [offset] | <code>number</code> | <code>0</code> | The size of the requested DataBuffer. |

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

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| position | <code>number</code> |  | The starting offset to begin the copy of the new DataBuffer. |
| [length] | <code>number</code> | <code>this.length</code> | The size of the new DataBuffer. |

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
**Returns**: <code>boolean</code> - - True if there are the requested amount, or more, of bytes left in the stream.  

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
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |

<a name="DataBuffer+read"></a>

### dataBuffer.read(bytes, [littleEndian]) ⇒ <code>Uint8Array</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>Uint8Array</code> - - The UInt8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bytes | <code>number</code> |  | The number of bytes to read. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peek"></a>

### dataBuffer.peek(bytes, [offset], [littleEndian]) ⇒ <code>Uint8Array</code>
Read from the provided offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>Uint8Array</code> - The UInt8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bytes | <code>number</code> |  | The number of bytes to read. |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

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
| [length] | <code>number</code> | <code>1</code> | The number of bits to read, 1 to 8. |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |

<a name="DataBuffer+readInt8"></a>

### dataBuffer.readInt8() ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int8 value at the current offset.  
<a name="DataBuffer+peekInt8"></a>

### dataBuffer.peekInt8([offset]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |

<a name="DataBuffer+readUInt16"></a>

### dataBuffer.readUInt16([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The UInt16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekUInt16"></a>

### dataBuffer.peekUInt16([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int8 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readInt16"></a>

### dataBuffer.readInt16([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekInt16"></a>

### dataBuffer.peekInt16([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int16 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readUInt24"></a>

### dataBuffer.readUInt24([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The UInt24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekUInt24"></a>

### dataBuffer.peekUInt24([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The UInt24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readInt24"></a>

### dataBuffer.readInt24([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekInt24"></a>

### dataBuffer.peekInt24([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int24 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readUInt32"></a>

### dataBuffer.readUInt32([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The UInt32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekUInt32"></a>

### dataBuffer.peekUInt32([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The UInt32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readInt32"></a>

### dataBuffer.readInt32([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekInt32"></a>

### dataBuffer.peekInt32([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Int32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readFloat32"></a>

### dataBuffer.readFloat32([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Float32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekFloat32"></a>

### dataBuffer.peekFloat32([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Float32 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readFloat48"></a>

### dataBuffer.readFloat48([littleEndian]) ⇒ <code>number</code>
Read from the current offset and return the Turbo Pascal 48 bit extended float value.
May be faulty with large numbers due to float percision.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float48 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekFloat48"></a>

### dataBuffer.peekFloat48([offset], [littleEndian]) ⇒ <code>number</code>
Read from the specified offset without advancing the offsets and return the Turbo Pascal 48 bit extended float value.
May be faulty with large numbers due to float percision.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>number</code> - The Float48 value at the specified offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readFloat64"></a>

### dataBuffer.readFloat64([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Float64 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+peekFloat64"></a>

### dataBuffer.peekFloat64([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Float64 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Read in Little Endian format. |

<a name="DataBuffer+readFloat80"></a>

### dataBuffer.readFloat80([littleEndian]) ⇒ <code>\*</code>
Read from the current offset and return the IEEE 80 bit extended float value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Float80 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [littleEndian] | <code>boolean</code> | <code>this.nativeEndian</code> | Read in Little Endian format, defaults to system value. |

<a name="DataBuffer+peekFloat80"></a>

### dataBuffer.peekFloat80([offset], [littleEndian]) ⇒ <code>\*</code>
Read from the specified offset without advancing the offsets and return the IEEE 80 bit extended float value.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>\*</code> - The Float80 value at the current offset.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | <code>number</code> | <code>0</code> | The offset to read from. |
| [littleEndian] | <code>boolean</code> | <code>this.nativeEndian</code> | Read in Little Endian format, defaults to system value. |

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
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string. |

<a name="DataBuffer+peekString"></a>

### dataBuffer.peekString(offset, length, [encoding]) ⇒ <code>string</code>
Read from the specified offset for a given length and return the value as a string.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>string</code> - The read value as a string.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| offset | <code>number</code> |  | The offset to read from. |
| length | <code>number</code> |  | The number of bytes to read. |
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string. |

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
| [offset] | <code>number</code> | <code>this.offset</code> | The offset to write the data to. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position. |

<a name="DataBuffer+writeUInt16"></a>

### dataBuffer.writeUInt16(data, [offset], [advance], [littleEndian])
Writes an unsigned 16 bit value, 2 bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>number</code> |  | The data to write. |
| [offset] | <code>number</code> | <code>this.offset</code> | The offset to write the data to. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Endianness of the write order. |

<a name="DataBuffer+writeUInt24"></a>

### dataBuffer.writeUInt24(data, [offset], [advance], [littleEndian])
Writes an unsigned 24 bit value, 3 bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>number</code> |  | The data to write. |
| [offset] | <code>number</code> | <code>this.offset</code> | The offset to write the data to. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Endianness of the write order. |

<a name="DataBuffer+writeUInt32"></a>

### dataBuffer.writeUInt32(data, [offset], [advance], [littleEndian])
Writes an unsigned 32 bit value, 4 bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>number</code> |  | The data to write. |
| [offset] | <code>number</code> | <code>this.offset</code> | The offset to write the data to. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position. |
| [littleEndian] | <code>boolean</code> | <code>false</code> | Endianness of the write order. |

<a name="DataBuffer+writeBytes"></a>

### dataBuffer.writeBytes(data, [offset], [advance])
Write a series of bytes.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>Array.&lt;number&gt;</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>Int32Array</code> \| <code>Uint8Array</code> \| <code>Uint16Array</code> \| <code>Uint32Array</code> |  | The data to write. |
| [offset] | <code>number</code> | <code>this.offset</code> | The offset to write the data to. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position. |

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
| [offset] | <code>number</code> | <code>this.offset</code> | The offset to write the data to. |
| [encoding] | <code>string</code> | <code>&quot;ascii&quot;</code> | The encoding of the string. |
| [advance] | <code>boolean</code> | <code>true</code> | Flag to increment the offset to the next position. |

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

<a name="debug"></a>

## debug() : <code>function</code>
**Kind**: global function  
