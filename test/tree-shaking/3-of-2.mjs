/* eslint-disable import/extensions */
/* eslint-disable unicorn/import-index */
import { CRC32, LZW } from '../../esm/index.js';

const main = () => {
  const crc = CRC32.of('test');
  const lzw = new LZW();

  return [crc, lzw];
};

export default main;
