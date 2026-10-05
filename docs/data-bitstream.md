## Classes

<dl>
<dt><a href="#DataBitstream">DataBitstream</a></dt>
<dd><p>Read a DataBuffer as a stream of bits.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#debug">debug()</a></dt>
<dd><p>No-op logger, replaced by the <code>debug</code> package when enabled.</p>
</dd>
</dl>

<a name="DataBitstream"></a>

## DataBitstream
Read a DataBuffer as a stream of bits.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| stream | <code>DataBuffer</code> | The DataBuffer to process. |
| bitPosition | <code>number</code> | The bit offset within the current byte, from 0 through 7. |


* [DataBitstream](#DataBitstream)
    * [new DataBitstream(stream)](#new_DataBitstream_new)
    * _instance_
        * [.stream](#DataBitstream+stream)
        * [.bitPosition](#DataBitstream+bitPosition)
        * [.copy()](#DataBitstream+copy) ⇒
        * [.offset()](#DataBitstream+offset) ⇒
        * [.available(bits)](#DataBitstream+available) ⇒
        * [.advance(bits)](#DataBitstream+advance)
        * [.rewind(bits)](#DataBitstream+rewind)
        * [.seek(offset)](#DataBitstream+seek)
        * [.align()](#DataBitstream+align)
        * [.read(bits, signed, advance)](#DataBitstream+read) ⇒
        * [.peek(bits, signed)](#DataBitstream+peek) ⇒
        * [.readLSB(bits, signed, advance)](#DataBitstream+readLSB) ⇒
        * [.peekLSB(bits, signed)](#DataBitstream+peekLSB) ⇒
        * [.validateBits()](#DataBitstream+validateBits)
        * [.validateRead()](#DataBitstream+validateRead)
    * _static_
        * [.fromData(data)](#DataBitstream.fromData) ⇒
        * [.fromBytes(bytes)](#DataBitstream.fromBytes) ⇒

<a name="new_DataBitstream_new"></a>

### new DataBitstream(stream)
Creates an instance of DataBitstream.


| Param | Description |
| --- | --- |
| stream | The DataBuffer to process. |

**Example** *(new DataBitstream(stream))*  
```js
const stream = new DataBuffer(new Uint8Array([0xFC, 0x08]));
const bitstream = new DataBitstream(stream);
bitstream.readLSB(0);
➜ 0
bitstream.readLSB(4);
➜ 12
```
<a name="DataBitstream+stream"></a>

### dataBitstream.stream
The DataBuffer being processed.

**Kind**: instance property of [<code>DataBitstream</code>](#DataBitstream)  
<a name="DataBitstream+bitPosition"></a>

### dataBitstream.bitPosition
The bit offset within the current byte, from 0 through 7.

**Kind**: instance property of [<code>DataBitstream</code>](#DataBitstream)  
<a name="DataBitstream+copy"></a>

### dataBitstream.copy() ⇒
Creates a copy of the DataBitstream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The copied DataBitstream, including its byte and bit offsets.  
<a name="DataBitstream+offset"></a>

### dataBitstream.offset() ⇒
Returns the current stream offset in bits.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The number of bits read thus far.  
<a name="DataBitstream+available"></a>

### dataBitstream.available(bits) ⇒
Returns if the specified number of bits is avaliable in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: If the requested number of bits are avaliable in the stream.  

| Param | Description |
| --- | --- |
| bits | The number of bits to check for avaliablity. |

<a name="DataBitstream+advance"></a>

### dataBitstream.advance(bits)
Advance the bit position by the specified number of bits in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  

| Param | Description |
| --- | --- |
| bits | The number of bits to advance. |

<a name="DataBitstream+rewind"></a>

### dataBitstream.rewind(bits)
Rewind the bit position by the specified number of bits in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  

| Param | Description |
| --- | --- |
| bits | The number of bits to go back. |

<a name="DataBitstream+seek"></a>

### dataBitstream.seek(offset)
Go to the specified offset in the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  

| Param | Description |
| --- | --- |
| offset | The offset to go to. |

<a name="DataBitstream+align"></a>

### dataBitstream.align()
Reset the bit position back to 0 and advance the stream.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
<a name="DataBitstream+read"></a>

### dataBitstream.read(bits, signed, advance) ⇒
Read the specified number of bits, from 0 through 40 at any bit alignment.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The value read in from the stream.  

| Param | Default | Description |
| --- | --- | --- |
| bits |  | The number of bits to be read. |
| signed | <code>false</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false. |
| advance | <code>true</code> | If true, advance the bit position, default is true. |

<a name="DataBitstream+peek"></a>

### dataBitstream.peek(bits, signed) ⇒
Read the specified number of bits without advancing the bit position.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The value read in from the stream.  

| Param | Default | Description |
| --- | --- | --- |
| bits |  | The number of bits to be read. |
| signed | <code>false</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false. |

<a name="DataBitstream+readLSB"></a>

### dataBitstream.readLSB(bits, signed, advance) ⇒
Read the specified number of bits, from 0 through 40 at any bit alignment.
In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The value read in from the stream.  
**Throws**:

- <code>Error</code> Too Large, too many bits.


| Param | Default | Description |
| --- | --- | --- |
| bits |  | The number of bits to be read. |
| signed | <code>false</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false. |
| advance | <code>true</code> | If true, advance the bit position, default is true. |

<a name="DataBitstream+peekLSB"></a>

### dataBitstream.peekLSB(bits, signed) ⇒
Read the specified number of bits without advancing the bit position.
In computing, the least significant bit (LSB) is the bit position in a binary integer giving the units value, that is, determining whether the number is even or odd.
The LSB is sometimes referred to as the low-order bit or right-most bit, due to the convention in positional notation of writing less significant digits further to the right.
It is analogous to the least significant digit of a decimal integer, which is the digit in the ones (right-most) position.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The value read in from the stream.  
**Throws**:

- <code>Error</code> Too Large, too many bits.


| Param | Default | Description |
| --- | --- | --- |
| bits |  | The number of bits to be read. |
| signed | <code>false</code> | If the sign bit is turned on, flip the bits and add one to convert to a negative value, default is false. |

<a name="DataBitstream+validateBits"></a>

### dataBitstream.validateBits()
Validate a bit count without applying the 40-bit numeric read limit.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
<a name="DataBitstream+validateRead"></a>

### dataBitstream.validateRead()
Validate the entire read before accessing bytes or changing either cursor.

**Kind**: instance method of [<code>DataBitstream</code>](#DataBitstream)  
<a name="DataBitstream.fromData"></a>

### DataBitstream.fromData(data) ⇒
Creates a new DataBitstream from file data.

**Kind**: static method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The new DataBitstream instance for the provided file data.  

| Param | Description |
| --- | --- |
| data | The data of the image to process. |

<a name="DataBitstream.fromBytes"></a>

### DataBitstream.fromBytes(bytes) ⇒
Creates a new DataBitstream from an array of bytes.

**Kind**: static method of [<code>DataBitstream</code>](#DataBitstream)  
**Returns**: The new DataBitstream instance for the provided bytes.  

| Param | Description |
| --- | --- |
| bytes | The data to read as a bitstream. |

<a name="debug"></a>

## debug()
No-op logger, replaced by the `debug` package when enabled.

**Kind**: global function  
