import { DataBuffer, ImagePNG } from '../../dist/index.js';

const main = () => {
  const png = new ImagePNG(new DataBuffer());

  return [png];
};

export default main;
