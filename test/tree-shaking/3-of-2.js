import { CRC32 } from '../../src/index.js';

const main = () => {
  const crc = CRC32.of('test');

  return [crc];
};

export default main;
