<a name="UnderflowError"></a>

## UnderflowError ⇐ <code>Error</code>
Error thrown when insufficient bytes are avaliable to process.

**Kind**: global class  
**Extends**: <code>Error</code>  
<a name="new_UnderflowError_new"></a>

### new UnderflowError(message)
Creates a new UnderflowError.


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | Message to show when the error is thrown. |

**Example** *(new UnderflowError(message))*  
```js
throw new UnderflowError('Insufficient Bytes: 1');
```
