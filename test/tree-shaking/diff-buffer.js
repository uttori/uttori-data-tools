import { DataBuffer, diffBuffer } from '../../dist/index.js';

const main = () => {
  const left = new DataBuffer([1, 2, 3]);
  const right = new DataBuffer([1, 2, 4]);

  return diffBuffer(left, right);
};

export default main;
