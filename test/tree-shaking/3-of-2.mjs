/* eslint-disable import/extensions */
import { CRC32 } from '../../esm/index.js';

const main = () => {
  const crc = CRC32.of('test');

  return [crc];
};

export default main;
