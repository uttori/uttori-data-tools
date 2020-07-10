<a name="DataBitstream"></a>

## DataBitstream
Read a DataStream as a stream of bits.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| stream | <code>DataStream</code> | The DataStream to process |
| bitPosition | <code>number</code> | The number of buffers in the list |


* [DataBitstream](#DataBitstream)
    * [new DataBitstream(stream)](#new_DataBitstream_new)
    * _instance_
        * [.copy()](#DataBitstream+copy) ⇒ [<code>DataBitstream</code>](#DataBitstream)
        * [.offset()](#DataBitstream+offset) ⇒ <code>number</code>
        * [.available(bits)](#DataBitstream+available) ⇒ <code>boolean</code>
        * [.advance(bits)](#DataBitstream+advance)
        * [.rewind(bits)](#DataBitstream+rewind)
        * [.seek(offset)](#DataBitstream+seek)
        * [.align()](#DataBitstream+align)
        * [.read(bits, [signed], [advance])](#DataBitstream+read) ⇒ <code>number</code>
        * [.peek(bits, [signed])](#DataBitstream+peek) ⇒ <code>number</code>
        * [.readLSB(bits, [signed], [advance])](#DataBitstream+readLSB) ⇒ <code>number</code>
        * [.peekLSB(bits, [signed])](#DataBitstream+peekLSB) ⇒ <code>number</code>
    * _static_
        * [.fromData(data)](#DataBitstream.fromData) ⇒ [<code>DataBitstream</code>](#DataBitstream)
        * [.fromBytes(bytes)](#DataBitstream.fromBytes) ⇒ [<code>DataBitstream</code>](#DataBitstream)

<a name="new_DataBitstream_new"></a>

### new DataBitstream(stream)
Creates an instance of DataBitstream.


| Param | Type | Description |
| --- | --- | --- |
| stream | <code>DataStream</code> | The DataStream to process |

**Example** *(new DataBitstream(stream))*  
```js
const stream = DataStream.fromBuffer(new DataBuffer(new Uint8Array([0xFC, 0x08])));
const bitstream = new DataBitstream(stream);
bitstream.readLSB(0);
➜ 0
bitstream.readLSB(4);
➜ 12
```
<a name="DataBitstream+copy"></a>

### dataBitstream.copy() ⇒ [<code>DataBitstream</code>](#DataBitstream)
Creates a copy of the DataBitstream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: [<code>DataBitstream</code>](#DataBitstream) - - The copied DataBufferList  
<a name="DataBitstream+offset"></a>

### dataBitstream.offset() ⇒ <code>number</code>
Returns the current stream offset in bits.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: <code>number</code> - - The number of bits read thus far  
<a name="DataBitstream+available"></a>

### dataBitstream.available(bits) ⇒ <code>boolean</code>
Returns if the specified number of bits is avaliable in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: <code>boolean</code> - - If the requested number of bits are avaliable in the stream  

| Param | Type | Description |
| --- | --- | --- |
| bits | <code>number</code> | The number of bits to check for avaliablity |

<a name="DataBitstream+advance"></a>

### dataBitstream.advance(bits)
Advance the bit position by the specified number of bits in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  

| Param | Type | Description |
| --- | --- | --- |
| bits | <code>number</code> | The number of bits to advance |

<a name="DataBitstream+rewind"></a>

### dataBitstream.rewind(bits)
Rewind the bit position by the specified number of bits in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  

| Param | Type | Description |
| --- | --- | --- |
| bits | <code>number</code> | The number of bits to go back |

<a name="DataBitstream+seek"></a>

### dataBitstream.seek(offset)
Go to the specified offset in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  

| Param | Type | Description |
| --- | --- | --- |
| offset | <code>number</code> | The offset to go to |

<a name="DataBitstream+align"></a>

### dataBitstream.align()
Reset the bit position back to 0 and advance the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
<a name="DataBitstream+read"></a>

### dataBitstream.read(bits, [signed], [advance]) ⇒ <code>number</code>
Read the specified number of bits.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: <code>number</code> - The value read in from the stream  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bits | <code>number</code> |  | The number of bits to be read |
| [signed] | <code>boolean</code> | <code>false</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value |
| [advance] | <code>boolean</code> | <code>true</code> | If true, advance the bit position. |

<a name="DataBitstream+peek"></a>

### dataBitstream.peek(bits, [signed]) ⇒ <code>number</code>
Read the specified number of bits without advancing the bit position.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: <code>number</code> - The value read in from the stream  

| Param | Type | Description |
| --- | --- | --- |
| bits | <code>number</code> | The number of bits to be read |
| [signed] | <code>boolean</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value |

<a name="DataBitstream+readLSB"></a>

### dataBitstream.readLSB(bits, [signed], [advance]) ⇒ <code>number</code>
Read the specified number of bits.
In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: <code>number</code> - The value read in from the stream  
**Throws**:

- <code>Error</code> Too Large, too many bits


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bits | <code>number</code> |  | The number of bits to be read |
| [signed] | <code>boolean</code> | <code>false</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value |
| [advance] | <code>boolean</code> | <code>true</code> | If true, advance the bit position. |

<a name="DataBitstream+peekLSB"></a>

### dataBitstream.peekLSB(bits, [signed]) ⇒ <code>number</code>
Read the specified number of bits without advancing the bit position.
In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: <code>number</code> - The value read in from the stream  
**Throws**:

- <code>Error</code> Too Large, too many bits


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bits | <code>number</code> |  | The number of bits to be read |
| [signed] | <code>boolean</code> | <code>false</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value |

<a name="DataBitstream.fromData"></a>

### DataBitstream.fromData(data) ⇒ [<code>DataBitstream</code>](#DataBitstream)
Creates a new DataBitstream from file data.

**Kind**: static method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: [<code>DataBitstream</code>](#DataBitstream) - the new DataBitstream instance for the provided file data  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| <code>DataBuffer</code> \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint32Array</code> | The data of the image to process. |

<a name="DataBitstream.fromBytes"></a>

### DataBitstream.fromBytes(bytes) ⇒ [<code>DataBitstream</code>](#DataBitstream)
Creates a new DataBitstream from an array of bytes.

**Kind**: static method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: [<code>DataBitstream</code>](#DataBitstream) - the new DataBitstream instance for the provided bytes  

| Param | Type | Description |
| --- | --- | --- |
| bytes | <code>Array.&lt;number&gt;</code> | The data to read as a bitstream. |

