<a name="DataBuffer"></a>

## DataBuffer
Helper class for manipulating binary data.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> \| <code>Uint8Array</code> | The data to process |
| length | <code>number</code> | The size of the data in bytes |
| next | [<code>DataBuffer</code>](#DataBuffer) | The next DataBuffer when part of a DataBufferList |
| prev | [<code>DataBuffer</code>](#DataBuffer) | The previous DataBuffer when part of a DataBufferList |


* [DataBuffer](#DataBuffer)
    * [new DataBuffer(input)](#new_DataBuffer_new)
    * _instance_
        * [.compare(input, [offset])](#DataBuffer+compare) ⇒ <code>boolean</code>
        * [.copy()](#DataBuffer+copy) ⇒ [<code>DataBuffer</code>](#DataBuffer)
        * [.slice(position, [length])](#DataBuffer+slice) ⇒ [<code>DataBuffer</code>](#DataBuffer)
    * _static_
        * [.allocate(size)](#DataBuffer.allocate) ⇒ [<code>DataBuffer</code>](#DataBuffer)

<a name="new_DataBuffer_new"></a>

### new DataBuffer(input)
Creates an instance of DataBitstream.


| Param | Type | Description |
| --- | --- | --- |
| input | <code>Array</code> \| <code>ArrayBuffer</code> \| <code>Buffer</code> \| [<code>DataBuffer</code>](#DataBuffer) \| <code>Int8Array</code> \| <code>Int16Array</code> \| <code>number</code> \| <code>string</code> \| <code>Uint8Array</code> \| <code>Uint32Array</code> | The DataStream to process |

**Example** *(new DataBitstream(stream))*  
```js
const stream = DataStream.fromBuffer(new DataBuffer(new Uint8Array([0xFC, 0x08])));
const bitstream = new DataBitstream(stream);
bitstream.readLSB(0);
➜ 0
bitstream.readLSB(4);
➜ 12
```
<a name="DataBuffer+compare"></a>

### dataBuffer.compare(input, [offset]) ⇒ <code>boolean</code>
Compares another DataBuffer against the current data buffer at a specified offset.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: <code>boolean</code> - Returns true when both DataBuffers are equal, false if there is any difference.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | [<code>DataBuffer</code>](#DataBuffer) |  | The size of the requested DataBuffer |
| [offset] | <code>number</code> | <code>0</code> | The size of the requested DataBuffer |

<a name="DataBuffer+copy"></a>

### dataBuffer.copy() ⇒ [<code>DataBuffer</code>](#DataBuffer)
Creates a copy of the current DataBuffer.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - A new copy of the current DataBuffer  
<a name="DataBuffer+slice"></a>

### dataBuffer.slice(position, [length]) ⇒ [<code>DataBuffer</code>](#DataBuffer)
Creates a copy of the current DataBuffer from a specified offset and a specified length.

**Kind**: instance method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - The new DataBuffer  

| Param | Type | Description |
| --- | --- | --- |
| position | <code>number</code> | The starting offset to begin the copy of the new DataBuffer |
| [length] | <code>number</code> | The size of the new DataBuffer |

<a name="DataBuffer.allocate"></a>

### DataBuffer.allocate(size) ⇒ [<code>DataBuffer</code>](#DataBuffer)
Creates an instance of DataBuffer with given size.

**Kind**: static method of [<code>DataBuffer</code>](#DataBuffer)  
**Returns**: [<code>DataBuffer</code>](#DataBuffer) - The new DataBuffer  

| Param | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | The size of the requested DataBuffer |

