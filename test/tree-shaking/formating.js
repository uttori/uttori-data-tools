import {
  formatBytes,
  formatDiffHex,
  formatDiffHunks,
  formatMyersGraph,
  formatTable,
  hexTable,
} from '../../dist/index.js';

const main = () => {
  const bytes = formatBytes(1536);
  const table = formatTable([['a']]);
  const hex = formatDiffHex([]);
  const hunks = formatDiffHunks([]);
  const graph = formatMyersGraph([], [], [], []);
  const dump = hexTable({
    copy() {
      return { remainingBytes: () => 0 };
    },
  });
  return [bytes, table, hex, hunks, graph, dump];
};

export default main;
