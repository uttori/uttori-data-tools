/* eslint-disable import/extensions */
/* eslint-disable unicorn/import-index */
import { DataBuffer, DataBufferList, DataStream } from '../../esm/index.js';

const main = () => {
  const db = new DataBuffer();
  const dbl = new DataBufferList();
  const ds = new DataStream();

  return [db, dbl, ds];
};

export default main;
