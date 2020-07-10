<a name="DataBufferList"></a>

## DataBufferList
A linked list of DataBuffers.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| first | <code>DataBuffer</code> | The first DataBuffer in the list |
| last | <code>DataBuffer</code> | The last DataBuffer in the list |
| totalBuffers | <code>number</code> | The number of buffers in the list |
| availableBytes | <code>number</code> | The number of bytes avaliable to read |
| availableBuffers | <code>number</code> | The number of buffers avaliable to read |


* [DataBufferList](#DataBufferList)
    * [new DataBufferList()](#new_DataBufferList_new)
    * [.copy()](#DataBufferList+copy) ⇒ [<code>DataBufferList</code>](#DataBufferList)
    * [.append(buffer)](#DataBufferList+append) ⇒ <code>number</code>
    * [.advance()](#DataBufferList+advance) ⇒ <code>boolean</code>
    * [.rewind()](#DataBufferList+rewind) ⇒ <code>boolean</code>
    * [.reset()](#DataBufferList+reset)

<a name="new_DataBufferList_new"></a>

### new DataBufferList()
Creates an instance of DataBufferList.

**Example** *(new DataBufferList())*  
```js
const buffer = new DataBuffer(data);
const list = new DataBufferList();
list.append(buffer);
```
<a name="DataBufferList+copy"></a>

### dataBufferList.copy() ⇒ [<code>DataBufferList</code>](#DataBufferList)
Creates a copy of the DataBufferList.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: [<code>DataBufferList</code>](#DataBufferList) - - The copied DataBufferList  
<a name="DataBufferList+append"></a>

### dataBufferList.append(buffer) ⇒ <code>number</code>
Creates a copy of the DataBufferList.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: <code>number</code> - - The new number of buffers in the DataBufferList  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>DataBuffer</code> | The DataBuffer to add to the list |

<a name="DataBufferList+advance"></a>

### dataBufferList.advance() ⇒ <code>boolean</code>
Advance the buffer list to the next buffer.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: <code>boolean</code> - - Returns false if there is no more buffers, returns true when the next buffer is set  
<a name="DataBufferList+rewind"></a>

### dataBufferList.rewind() ⇒ <code>boolean</code>
Rewind the buffer list to the previous buffer.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
**Returns**: <code>boolean</code> - - Returns false if there is no previous buffer, returns true when the previous buffer is set  
<a name="DataBufferList+reset"></a>

### dataBufferList.reset()
Reset the list to the beginning.

**Kind**: instance method of [<code>DataBufferList</code>](#DataBufferList)  
