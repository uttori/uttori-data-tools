import test from 'ava';
import {
  DataBuffer,
  DataStream,
  formatBytes,
  hexTable,
  formatTable,
  formatTableThemeMySQL,
  formatTableThemeUnicode,
  formatTableThemeMarkdown,
  formatDiffHex,
  formatDiffHunks,
  formatMyersGraph,
  hunks,
} from '../src/index.js';
import Myers from '../src/diff/myers.js';

test('formatBytes', (t) => {
  t.is(formatBytes(0), '0 Bytes');
  t.is(formatBytes(1), '1 Bytes');
  t.is(formatBytes(1024), '1 KB');
  t.is(formatBytes(1024 * 1024), '1 MB');
});

test('formatBytes: custom values', (t) => {
  const decimals = 4;
  const bytes = 1000;
  const sizes = ['Bytez', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  t.is(formatBytes(0, decimals, bytes, sizes), '0 Bytez');
  t.is(formatBytes(1, decimals, bytes, sizes), '1 Bytez');
  t.is(formatBytes(1024, decimals, bytes, sizes), '1.024 KiB');
  t.is(formatBytes(1024 * 1024 + 123, decimals, bytes, sizes), '1.0487 MiB');
});

test('hexTable: sane defaults', (t) => {
  const stream = DataStream.fromData(Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0xA3, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81, 0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x88, 0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85, 0x81, 0x02, 0x18, 0x53, 0x80, 0x67, 0x01, 0x00, 0x00, 0x00, 0x01, 0x73, 0x6F, 0x24, 0x11, 0x4D, 0x9B, 0x74, 0xC2, 0xBF, 0x84, 0x1C, 0x4B, 0xB4, 0xE1, 0x4D, 0xBB, 0x8B, 0x53, 0xAB, 0x84, 0x15, 0x49, 0xA9, 0x66, 0x53, 0xAC, 0x81, 0xA1, 0x4D, 0xBB, 0x8B, 0x53, 0xAB, 0x84, 0x16, 0x54, 0xAE, 0x6B, 0x53, 0xAC, 0x81, 0xF1, 0x4D, 0xBB, 0x8C, 0x53, 0xAB, 0x84, 0x12, 0x54, 0xC3, 0x67, 0x53, 0xAC, 0x82, 0x01, 0x9C, 0x4D, 0xBB, 0x8E, 0x53, 0xAB, 0x84, 0x1C, 0x53, 0xBB, 0x6B, 0x53, 0xAC, 0x84, 0x01, 0x73, 0x6D, 0xD8, 0xEC, 0x01, 0x00, 0x00, 0x00]));
  t.is(hexTable(stream), `| 76543210 | 00010203 04050607 08090A0B 0C0D0E0F | 0123456789ABCDEF |
|----------|-------------------------------------|------------------|
| 00000000 | 1A45DFA3 A3428681 0142F781 0142F281 |  E...B.. B.. B.. |
| 00000010 | 0442F381 08428288 6D617472 6F736B61 |  B.. B..matroska |
| 00000020 | 42878104 42858102 18538067 01000000 | B.. B..  S.g     |
| 00000030 | 01736F24 114D9B74 C2BF841C 4BB4E14D |  so$ M.t... K..M |
| 00000040 | BB8B53AB 841549A9 6653AC81 A14DBB8B | ..S.. I.fS...M.. |
| 00000050 | 53AB8416 54AE6B53 AC81F14D BB8C53AB | S.. T.kS...M..S. |
| 00000060 | 841254C3 6753AC82 019C4DBB 8E53AB84 | . T.gS.. .M..S.. |
| 00000070 | 1C53BB6B 53AC8401 736DD8EC 01000000 |  S.kS.. sm..     |`);
});

test('hexTable: custom output options even', (t) => {
  const stream = DataStream.fromData(Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0xA3, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81, 0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x88, 0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85]));
  const output = hexTable(
    stream,
    0x10,
    {
      columns: 8,
      grouping: 2,
      maxRows: 7,
    },
    {
      offset: '3210',
      value: ['00', '11', '22', '33', '44', '55', '66', '77'],
      ascii: '01234567',
    },
    {
      offset: (value = 0) => value.toString(10).padStart(4, ' '),
      value: (value = 0) => value.toString(16).padStart(2, '0').toLowerCase(),
      ascii: (value = 0) => String.fromCharCode(value).replace(/[^\x20-\x7E]+/g, '*'),
    },
  );
  t.is(output, `| 3210 | 0011 2233 4455 6677 | 01234567 |
|------|---------------------|----------|
|   16 | 1a45 dfa3 a342 8681 | *E***B** |
|   24 | 0142 f781 0142 f281 | *B***B** |
|   32 | 0442 f381 0842 8288 | *B***B** |
|   40 | 6d61 7472 6f73 6b61 | matroska |
|   48 | 4287 8104 4285      | B***B*   |`);
});

test('hexTable: custom output options odd', (t) => {
  const stream = DataStream.fromData(Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0xA3, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81, 0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x88, 0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85]));
  const output = hexTable(
    stream,
    0x10,
    {
      columns: 7,
      grouping: 3,
      maxRows: 6,
    },
    {
      offset: '3210',
      value: ['00', '11', '22', '33', '44', '55', '66'],
      ascii: '0123456',
    },
    {
      offset: (value = 0) => value.toString(10).padStart(4, ' '),
      value: (value = 0) => value.toString(16).padStart(2, '0').toLowerCase(),
      ascii: (value = 0) => String.fromCharCode(value).replace(/[^\x20-\x7E]+/g, '*'),
    },
  );
  t.is(output, `| 3210 | 001122 334455 66 | 0123456 |
|------|------------------|---------|
|   16 | 1a45df a3a342 86 | *E***B* |
|   23 | 810142 f78101 42 | **B***B |
|   30 | f28104 42f381 08 | ***B*** |
|   37 | 428288 6d6174 72 | B**matr |
|   44 | 6f736b 614287 81 | oskaB** |
|   51 | 044285           | *B*     |`);
});

test('formatTable: can create a table like MySQL', (t) => {
  const data = [
    ['Name', 'Age', 'color'],
    ['John', 23, 'green'],
    ['Mary', 16, 'brown'],
    ['Rita', 47, 'blue'],
    ['Peter', 8, 'brown'],
  ];
  t.is(formatTable(data, { align: ['left', 'right', 'left'], theme: formatTableThemeMySQL }), `+-------+-----+-------+
| Name  | Age | color |
+-------+-----+-------+
| John  |  23 | green |
| Mary  |  16 | brown |
| Rita  |  47 | blue  |
| Peter |   8 | brown |
+-------+-----+-------+`);
});

test('formatTable: can create a table as Markdown', (t) => {
  const data = [
    ['Name', 'Age', 'color'],
    ['John', 23, 'green'],
    ['Mary', 16, 'brown'],
    ['Rita', 47, 'blue'],
    ['Peter', 8, 'brown'],
  ];
  t.is(formatTable(data, { align: ['right', 'left', 'right'], theme: formatTableThemeMarkdown }), `|  Name | Age | color |
|-------|-----|-------|
|  John | 23  | green |
|  Mary | 16  | brown |
|  Rita | 47  |  blue |
| Peter | 8   | brown |
`);
});

test('formatTable: can create a table with Emoji', (t) => {
  const data = [
    ['Name', 'Age', 'Emoji'],
    ['John', 23, '🫠'],
    ['Mary', 16, '👩‍👩‍👧‍👧'],
    ['Rita', 47, '💪🏼'],
    ['Peter', 8, '🕧'],
  ];
  t.is(formatTable(data, { align: ['right', 'left', 'right'], title: 'Emoji', theme: formatTableThemeUnicode }), `╔═══════════════════════════╗
║           Emoji           ║
╠═══════╦═════╦═════════════╣
║  Name ║ Age ║       Emoji ║
╠═══════╬═════╬═════════════╣
║  John ║ 23  ║          🫠 ║
║  Mary ║ 16  ║ 👩‍👩‍👧‍👧 ║
║  Rita ║ 47  ║        💪🏼 ║
║ Peter ║ 8   ║          🕧 ║
╚═══════╩═════╩═════════════╝`);
});

test('formatDiffHex: identical bytes show single row', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showBits: false });

  // Format has spaces between bytes
  t.true(output.includes('01 02 03 04'));
  t.true(output.includes('....'));
});

test('formatDiffHex: single byte change shows three rows', (t) => {
  const buf1 = new DataBuffer([0x20, 0x41, 0x42, 0x43]);
  const buf2 = new DataBuffer([0xFF, 0x41, 0x42, 0x43]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showBits: false });

  t.true(output.includes('20 41 42 43')); // Original row
  t.true(output.includes('+DF')); // Delta
  t.true(output.includes('FF 41 42 43')); // Result row
});

test('formatDiffHex: multiple byte changes', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0xAA, 0x05, 0xBB]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showBits: false });

  t.true(output.includes('+FD')); // 0x02 → 0xFF: +253
  t.true(output.includes('+A6')); // 0x04 → 0xAA: +166
  t.true(output.includes('+B5')); // 0x06 → 0xBB: +181
});

test('formatDiffHex: with offset disabled', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0x01, 0x02]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showOffset: false, showBits: false });

  t.false(output.includes('00000000'));
  t.true(output.includes('01 02'));
});

test('formatDiffHex: with ASCII disabled', (t) => {
  const buf1 = new DataBuffer([0x41, 0x42, 0x43, 0x44]); // ABCD
  const buf2 = new DataBuffer([0x41, 0x42, 0x43, 0x44]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showAscii: false, showBits: false });

  t.false(output.includes('ABCD'));
  t.true(output.includes('41 42 43 44'));
});

test('formatDiffHex: with bits enabled shows binary', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0x01, 0x02]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showBits: true });

  t.true(output.includes('00000001')); // Binary for 0x01
  t.true(output.includes('00000010')); // Binary for 0x02
});

test('formatDiffHex: bit changes show XOR markers', (t) => {
  const buf1 = new DataBuffer([0x42]); // 01000010
  const buf2 = new DataBuffer([0x52]); // 01010010
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showBits: true });

  // Should show ^ where bits changed (bit 4 flipped)
  t.true(output.includes('^'));
});

test('formatDiffHex: custom bytes per row', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { bytesPerRow: 4, showBits: false });

  // Should have two rows (8 bytes / 4 per row)
  const lines = output.split('\n');
  t.true(lines.length >= 2);
});

test('formatDiffHex: negative delta', (t) => {
  const buf1 = new DataBuffer([0xFF]);
  const buf2 = new DataBuffer([0x20]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showBits: false });

  t.true(output.includes('-DF')); // 0xFF → 0x20: -223
});

test('formatDiffHex: empty edits', (t) => {
  const edits = [];

  const output = formatDiffHex(edits, { showBits: false });

  t.is(output, '');
});

test('formatDiffHex: insert operations', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { showBits: false });

  // Should show the inserted bytes
  t.true(output.includes('03') || output.includes('04'));
});

test('formatDiffHex: handles partial rows correctly', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03]);
  const edits = buf1.diff(buf2);

  const output = formatDiffHex(edits, { bytesPerRow: 16, showBits: false });

  // Should pad to 16 bytes but only show 3
  t.true(output.includes('01 02 03'));
});

test('formatDiffHunks: basic hunk formatting', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0x04]);
  const x = Array.from(buf1.data);
  const y = Array.from(buf2.data);
  const diffHunks = hunks(x, y, (a, b) => a === b);

  const output = formatDiffHunks(diffHunks);

  // Should have hunk header
  t.true(output.includes('@'));
  // Should have - for deletions
  t.true(output.includes('-'));
  // Should have + for insertions
  t.true(output.includes('+'));
});

test('formatDiffHunks: with context option', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
  const buf2 = new DataBuffer([0x01, 0x02, 0xFF, 0x04, 0x05, 0x06]);
  const x = Array.from(buf1.data);
  const y = Array.from(buf2.data);

  const diffHunksNoContext = hunks(x, y, (a, b) => a === b, 0);
  const diffHunksWithContext = hunks(x, y, (a, b) => a === b, 2);

  const outputNoContext = formatDiffHunks(diffHunksNoContext, { context: 0 });
  const outputWithContext = formatDiffHunks(diffHunksWithContext, { context: 2 });

  // With context should be longer (includes surrounding lines)
  t.true(outputWithContext.length >= outputNoContext.length);
});

test('formatDiffHunks: empty edits', (t) => {
  const edits = [];

  const output = formatDiffHunks(edits);

  t.is(output, '');
});

test('formatDiffHunks: all matches', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03]);
  const x = Array.from(buf1.data);
  const y = Array.from(buf2.data);
  const diffHunks = hunks(x, y, (a, b) => a === b);

  const output = formatDiffHunks(diffHunks);

  // When all match, hunks are empty
  t.is(output, '');
});

test('formatDiffHunks: handles insertions at end', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const x = Array.from(buf1.data);
  const y = Array.from(buf2.data);
  const diffHunks = hunks(x, y, (a, b) => a === b);

  const output = formatDiffHunks(diffHunks);

  // Should show + lines for insertions
  t.true(output.includes('+'));
  t.true(output.includes('3') || output.includes('4'));
});

test('formatDiffHunks: handles deletions at end', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0x02]);
  const x = Array.from(buf1.data);
  const y = Array.from(buf2.data);
  const diffHunks = hunks(x, y, (a, b) => a === b);

  const output = formatDiffHunks(diffHunks);

  // Should show - lines for deletions
  t.true(output.includes('-'));
  t.true(output.includes('3') || output.includes('4'));
});

test('formatDiffHunks: multiple hunks', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0xAA, 0x0A]);
  const x = Array.from(buf1.data);
  const y = Array.from(buf2.data);
  const diffHunks = hunks(x, y, (a, b) => a === b, 1);

  const output = formatDiffHunks(diffHunks, { context: 1 });

  // Should have multiple @@ hunk headers if changes are far apart
  const hunkCount = (output.match(/@@/g) || []).length;
  t.true(hunkCount >= 1);
});

test('formatMyersGraph: simple path only', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'x', 'c'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y);

  // Should contain nodes
  t.true(output.includes('o'));
  // Should have labels
  t.true(output.includes('0'));
  // Should show path with diagonal
  t.true(output.includes('\\'));
});

test('formatMyersGraph: path with labels off', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'x', 'c'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y, { showLabels: false });

  // Should contain nodes
  t.true(output.includes('o'));
  // Should not start with numbers
  t.false(/^\s*\d/.test(output));
});

test('formatMyersGraph: full grid display', (t) => {
  const x = ['a', 'b'];
  const y = ['a', 'x'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y, { showFull: true });

  // Should contain nodes
  t.true(output.includes('o'));
  // Should show horizontal edges in full grid
  t.true(output.includes('---'));
  // Should show vertical edges in full grid
  t.true(output.includes('|'));
  // Should show diagonal for match
  t.true(output.includes('\\'));
});

test('formatMyersGraph: identical sequences', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'b', 'c'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y);

  // Should be all diagonal (matches)
  const diagonals = (output.match(/\\/g) || []).length;
  t.is(diagonals, 3);
});

test('formatMyersGraph: completely different sequences', (t) => {
  const x = ['a', 'b'];
  const y = ['x', 'y'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y);

  // Should show path with no diagonals
  const diagonals = (output.match(/\\/g) || []).length;
  t.is(diagonals, 0);
  // Should have vertical and horizontal edges
  t.true(output.includes('|'));
  t.true(output.includes('---'));
});

test('formatMyersGraph: empty sequences', (t) => {
  const x = [];
  const y = [];
  const xidx = [];
  const yidx = [];

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y);

  // Should just have one node
  t.true(output.includes('o'));
  const nodes = (output.match(/o/g) || []).length;
  t.is(nodes, 1);
});

test('formatMyersGraph: insertion only', (t) => {
  const x = [];
  const y = ['a', 'b'];
  const xidx = [];
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y);

  // Should show vertical path (insertions)
  t.true(output.includes('|'));
  // Should not have diagonals
  const diagonals = (output.match(/\\/g) || []).length;
  t.is(diagonals, 0);
});

test('formatMyersGraph: deletion only', (t) => {
  const x = ['a', 'b'];
  const y = [];
  const xidx = x.map((_, i) => i);
  const yidx = [];

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  const output = formatMyersGraph(m.resultVectorX, m.resultVectorY, x, y);

  // Should show horizontal path (deletions)
  t.true(output.includes('---'));
  // Should not have diagonals
  const diagonals = (output.match(/\\/g) || []).length;
  t.is(diagonals, 0);
});
