const test = require('ava');
const { DataBuffer, DataBufferList } = require('../src');

test('constructor', (t) => {
  const list = new DataBufferList([DataBuffer.allocate(3), DataBuffer.allocate(3)]);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 2);
  t.is(list.availableBytes, 6);
});

test('append', (t) => {
  const list = new DataBufferList();
  const buffer = new DataBuffer(new Uint8Array([1, 2, 3]));
  list.append(buffer);

  t.is(list.totalBuffers, 1);
  t.is(list.availableBuffers, 1);
  t.is(list.availableBytes, 3);
  t.is(buffer, list.first);
  t.is(buffer, list.last);
  t.is(buffer.prev, null);
  t.is(buffer.next, null);

  const buffer2 = new DataBuffer(new Uint8Array([4, 5, 6]));
  list.append(buffer2);

  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 2);
  t.is(list.availableBytes, 6);
  t.is(list.first, buffer);
  t.is(list.last, buffer2);

  t.is(buffer.prev, null);
  t.is(buffer.next, buffer2);
  t.is(buffer2.prev, buffer);
  t.is(buffer2.next, null);
});

test('advance', (t) => {
  const list = new DataBufferList();
  const buffer1 = DataBuffer.allocate(3);
  const buffer2 = DataBuffer.allocate(3);
  list.append(buffer1);
  list.append(buffer2);

  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 2);
  t.is(list.availableBytes, 6);
  t.is(buffer1, list.first);

  t.is(list.advance(), true);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 1);
  t.is(list.availableBytes, 3);
  t.is(list.first, buffer2);

  // Last buffer, no where to advance to so the current buffer is left in place.
  t.is(list.advance(), false);
  t.is(list.first, null);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 0);
  t.is(list.availableBytes, 0);

  delete list.first;
  t.is(list.advance(), false);
});

test('rewind', (t) => {
  const list = new DataBufferList();
  const buffer1 = DataBuffer.allocate(3);
  const buffer2 = DataBuffer.allocate(3);
  list.append(buffer1);
  list.append(buffer2);

  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 2);
  t.is(list.availableBytes, 6);

  t.is(list.advance(), true);
  t.is(list.first, buffer2);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 1);
  t.is(list.availableBytes, 3);

  t.is(list.rewind(), true);
  t.is(list.first, buffer1);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 2);
  t.is(list.availableBytes, 6);

  // Can't rewind anymore so nothing should change
  t.is(list.rewind(), false);
  t.is(list.first, buffer1);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 2);
  t.is(list.availableBytes, 6);

  // Advancing past the end of the list and then rewinding should give us the last buffer
  t.is(list.advance(), true);
  t.is(list.advance(), false);
  t.is(list.first, null);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 0);
  t.is(list.availableBytes, 0);

  t.is(list.rewind(), true);
  t.is(list.first, buffer2);
  t.is(list.totalBuffers, 2);
  t.is(list.availableBuffers, 1);
  t.is(list.availableBytes, 3);
});

test('reset', (t) => {
  const list = new DataBufferList();
  const buffer1 = DataBuffer.allocate(3);
  const buffer2 = DataBuffer.allocate(3);
  const buffer3 = DataBuffer.allocate(3);
  list.append(buffer1);
  list.append(buffer2);
  list.append(buffer3);

  t.is(buffer1, list.first);
  t.is(list.totalBuffers, 3);
  t.is(list.availableBuffers, 3);
  t.is(list.availableBytes, 9);

  t.is(list.advance(), true);
  t.is(buffer2, list.first);
  t.is(list.totalBuffers, 3);
  t.is(list.availableBuffers, 2);
  t.is(list.availableBytes, 6);

  t.is(list.advance(), true);
  t.is(buffer3, list.first);
  t.is(list.totalBuffers, 3);
  t.is(list.availableBuffers, 1);
  t.is(list.availableBytes, 3);

  list.reset();
  t.is(buffer1, list.first);
  t.is(list.totalBuffers, 3);
  t.is(list.availableBuffers, 3);
  t.is(list.availableBytes, 9);
});

test('copy', (t) => {
  const list = new DataBufferList();
  const buffer = DataBuffer.allocate(3);
  list.append(buffer);

  const copy = list.copy();

  t.is(list.totalBuffers, copy.totalBuffers);
  t.is(list.availableBuffers, copy.availableBuffers);
  t.is(list.availableBytes, copy.availableBytes);
  t.is(list.first, copy.first);
});
