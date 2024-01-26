import { DataBuffer, DataBufferList, DataStream } from '../../src/index.js';

const main = () => {
  const data_buffer = new DataBuffer();
  const data_buffer_list = new DataBufferList();
  const data_stream = new DataStream();

  return [data_buffer, data_buffer_list, data_stream];
};

export default main;
