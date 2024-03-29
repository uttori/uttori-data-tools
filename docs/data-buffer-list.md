<a name="DataBufferList"></a>

## DataBufferList
A linked list of DataBuffers.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| first | <code>DataBuffer</code> | The first DataBuffer in the list. |
| last | <code>DataBuffer</code> | The last DataBuffer in the list. |
| totalBuffers | <code>number</code> | The number of buffers in the list. |
| availableBytes | <code>number</code> | The number of bytes avaliable to read. |
| availableBuffers | <code>number</code> | The number of buffers avaliable to read. |


* [DataBufferList](#DataBufferList)
    * [new DataBufferList([buffers])](#new_DataBufferList_new)
    * [.first](#DataBufferList+first) : <code>DataBuffer</code> \| <code>null</code>
    * [.last](#DataBufferList+last) : <code>DataBuffer</code> \| <code>null</code>
    * [.totalBuffers](#DataBufferList+totalBuffers) : <code>number</code>
    * [.availableBytes](#DataBufferList+availableBytes) : <code>number</code>
    * [.availableBuffers](#DataBufferList+availableBuffers) : <code>number</code>
    * [.copy()](#DataBufferList+copy) ⇒ [<code>DataBufferList</code>](#DataBufferList)
    * [.append(buffer)](#DataBufferList+append) ⇒ <code>number</code>
    * [.moreAvailable()](#DataBufferList+moreAvailable) ⇒ <code>boolean</code>
    * [.advance()](#DataBufferList+advance) ⇒ <code>boolean</code>
    * [.rewind()](#DataBufferList+rewind) ⇒ <code>boolean</code>
    * [.reset()](#DataBufferList+reset)

<a name="new_DataBufferList_new"></a>

### new DataBufferList([buffers])
Creates an instance of DataBufferList.


| Param | Type | Description |
| --- | --- | --- |
| [buffers] | <code>Array.&lt;DataBuffer&gt;</code> | DataBuffers to initialize with. |

**Example** *(new DataBufferList(buffers))*  
```js
const buffer = new DataBuffer(data);
const list = new DataBufferList([buffer]);
```
<a name="DataBufferList+first"></a>

### dataBufferList.first : <code>DataBuffer</code> \| <code>null</code>
The first DataBuffer in the list.

**Kind**: instance property of [<code>DataBufferList</code>](#DataBufferList)  
<a name="DataBufferList+last"></a>

### dataBufferList.last : <code>DataBuffer</code> \| <code>null</code>
The last DataBuffer in the list.

**Kind**: instance property of [<code>DataBufferList</code>](#DataBufferList)  
<a name="DataBufferList+totalBuffers"></a>

### dataBufferList.totalBuffers : <code>number</code>
The number of buffers in the list.

**Kind**: instance property of [<code>DataBufferList</code>](#DataBufferList)  
<a name="DataBufferList+availableBytes"></a>

### dataBufferList.availableBytes : <code>number</code>
The number of bytes avaliable to read.

**Kind**: instance property of [<code>DataBufferList</code>](#DataBufferList)  
<a name="DataBufferList+availableBuffers"></a>

### dataBufferList.availableBuffers : <code>number</code>
The number of buffers avaliable to read.

**Kind**: instance property of [<code>DataBufferList</code>](#DataBufferList)  
<a name="DataBufferList+copy"></a>

### dataBufferList.copy() ⇒ [<code>DataBufferList</code>](#DataBufferList)
Creates a copy of the DataBufferList.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: [<code>DataBufferList</code>](#DataBufferList) - The copied DataBufferList.  
<a name="DataBufferList+append"></a>

### dataBufferList.append(buffer) ⇒ <code>number</code>
Appends a DataBuffer to the DataBufferList.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: <code>number</code> - The new number of buffers in the DataBufferList.  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | The DataBuffer to add to the list. |

<a name="DataBufferList+moreAvailable"></a>

### dataBufferList.moreAvailable() ⇒ <code>boolean</code>
Checks if we are on the last buffer in the list.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: <code>boolean</code> - Returns false if there are more buffers in the list, returns true when we are on the last buffer.  
<a name="DataBufferList+advance"></a>

### dataBufferList.advance() ⇒ <code>boolean</code>
Advance the buffer list to the next DataBuffer or to `null` when at the end of avaliable DataBuffers.

If there is no next buffer, the current buffer is set to null.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: <code>boolean</code> - Returns false if there is no more buffers, returns true when the next buffer is set.  
<a name="DataBufferList+rewind"></a>

### dataBufferList.rewind() ⇒ <code>boolean</code>
Rewind the buffer list to the previous buffer.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: <code>boolean</code> - Returns false if there is no previous buffer, returns true when the previous buffer is set.  
<a name="DataBufferList+reset"></a>

### dataBufferList.reset()
Reset the list to the beginning.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
