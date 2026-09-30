import { diff, edits, hunks } from '../../dist/index.js';

const main = () => {
  const left = [1, 2, 3];
  const right = [1, 2, 4];

  return [diff(left, right), edits(left, right), hunks(left, right)];
};

export default main;
