import test from 'ava';
import { spawnSync } from 'node:child_process';
import { formatTableLine } from '../dist/data-formating.js';
import {
  DataBuffer,
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
  diffBuffer,
} from '../dist/index.js';
import Myers from '../dist/diff/myers.js';

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
  const stream = new DataBuffer(Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0xA3, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81, 0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x88, 0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85, 0x81, 0x02, 0x18, 0x53, 0x80, 0x67, 0x01, 0x00, 0x00, 0x00, 0x01, 0x73, 0x6F, 0x24, 0x11, 0x4D, 0x9B, 0x74, 0xC2, 0xBF, 0x84, 0x1C, 0x4B, 0xB4, 0xE1, 0x4D, 0xBB, 0x8B, 0x53, 0xAB, 0x84, 0x15, 0x49, 0xA9, 0x66, 0x53, 0xAC, 0x81, 0xA1, 0x4D, 0xBB, 0x8B, 0x53, 0xAB, 0x84, 0x16, 0x54, 0xAE, 0x6B, 0x53, 0xAC, 0x81, 0xF1, 0x4D, 0xBB, 0x8C, 0x53, 0xAB, 0x84, 0x12, 0x54, 0xC3, 0x67, 0x53, 0xAC, 0x82, 0x01, 0x9C, 0x4D, 0xBB, 0x8E, 0x53, 0xAB, 0x84, 0x1C, 0x53, 0xBB, 0x6B, 0x53, 0xAC, 0x84, 0x01, 0x73, 0x6D, 0xD8, 0xEC, 0x01, 0x00, 0x00, 0x00]));
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
  const stream = new DataBuffer(Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0xA3, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81, 0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x88, 0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85]));
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
  const stream = new DataBuffer(Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0xA3, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81, 0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x88, 0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85]));
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
  t.is(formatTable(data, { align: ['left', 'right', 'left'], theme: formatTableThemeMySQL, padding: 1, title: '' }), `+-------+-----+-------+
| Name  | Age | color |
+-------+-----+-------+
| John  |  23 | green |
| Mary  |  16 | brown |
| Rita  |  47 | blue  |
| Peter |   8 | brown |
+-------+-----+-------+`);
});

test('formatTable: falls back to default options when none are provided', (t) => {
  const data = [
    ['Name', 'Age', 'color'],
    ['John', 23, 'green'],
  ];
  // Calling without options exercises the `options ?? {}` fallback and must match an explicit empty-options call.
  t.is(formatTable(data), formatTable(data, {}));
});

test('formatTable: tolerates rows with an uneven number of columns', (t) => {
  const data = [
    ['Name', 'Age'],
    ['John'],
  ];
  t.notThrows(() => formatTable(data));
});

test('formatTable: can create a table as Markdown', (t) => {
  const data = [
    ['Name', 'Age', 'color'],
    ['John', 23, 'green'],
    ['Mary', 16, 'brown'],
    ['Rita', 47, 'blue'],
    ['Peter', 8, 'brown'],
  ];
  t.is(formatTable(data, { align: ['right', 'left', 'right'], theme: formatTableThemeMarkdown, padding: 1, title: '' }), `|  Name | Age | color |
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
  t.is(formatTable(data, { align: ['right', 'left', 'right'], title: 'Emoji', theme: formatTableThemeUnicode, padding: 1 }), `╔═══════════════════════════╗
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
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: false });

  // Format has spaces between bytes
  t.true(output.includes('01 02 03 04'));
  t.true(output.includes('....'));
});

test('formatDiffHex: single byte change shows three rows', (t) => {
  const buf1 = new DataBuffer([0x20, 0x41, 0x42, 0x43]);
  const buf2 = new DataBuffer([0xFF, 0x41, 0x42, 0x43]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: false });

  t.true(output.includes('20 41 42 43')); // Original row
  t.true(output.includes('+DF')); // Delta
  t.true(output.includes('FF 41 42 43')); // Result row
});

test('formatDiffHex: multiple byte changes', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0xAA, 0x05, 0xBB]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: false });

  t.true(output.includes('+FD')); // 0x02 ➜ 0xFF: +253
  t.true(output.includes('+A6')); // 0x04 ➜ 0xAA: +166
  t.true(output.includes('+B5')); // 0x06 ➜ 0xBB: +181
});

test('formatDiffHex: with offset disabled', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0x01, 0x02]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showOffset: false, showBits: false });

  t.false(output.includes('00000000'));
  t.true(output.includes('01 02'));
});

test('formatDiffHex: with ASCII disabled', (t) => {
  const buf1 = new DataBuffer([0x41, 0x42, 0x43, 0x44]); // ABCD
  const buf2 = new DataBuffer([0x41, 0x42, 0x43, 0x44]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showAscii: false, showBits: false });

  t.false(output.includes('ABCD'));
  t.true(output.includes('41 42 43 44'));
});

test('formatDiffHex: with bits enabled shows binary', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0x01, 0x02]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: true });

  t.true(output.includes('00000001')); // Binary for 0x01
  t.true(output.includes('00000010')); // Binary for 0x02
});

test('formatDiffHex: bit changes show XOR markers', (t) => {
  const buf1 = new DataBuffer([0x42]); // 01000010
  const buf2 = new DataBuffer([0x52]); // 01010010
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: true });

  // Should show ^ where bits changed (bit 4 flipped)
  t.true(output.includes('^'));
});

test('formatDiffHex: custom bytes per row', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { bytesPerRow: 4, showBits: false });

  // Should have two rows (8 bytes / 4 per row)
  const lines = output.split('\n');
  t.true(lines.length >= 2);
});

test('formatDiffHex: negative delta', (t) => {
  const buf1 = new DataBuffer([0xFF]);
  const buf2 = new DataBuffer([0x20]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: false });

  t.true(output.includes('-DF')); // 0xFF ➜ 0x20: -223
});

test('formatDiffHex: empty edits', (t) => {
  const edits = [];

  const output = formatDiffHex(edits, { showBits: false });

  t.is(output, '');
});

test('formatDiffHex: insert operations', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: false });

  // Should show the inserted bytes
  t.true(output.includes('03') || output.includes('04'));
});

test('formatDiffHex: handles partial rows correctly', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03]);
  const buf2 = new DataBuffer([0x01, 0x02, 0x03]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { bytesPerRow: 16, showBits: false });

  // Should pad to 16 bytes but only show 3
  t.true(output.includes('01 02 03'));
});

test('formatDiffHex: standalone delete operation (not followed by insert)', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02, 0x03]);
  const buf2 = new DataBuffer([0x01, 0x03]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: false });

  // Should show the deleted byte (0x02)
  t.true(output.includes('02'));
  t.true(output.includes('--'));
  // Standalone delete should preserve surrounding matches and show an absent resulting byte
  t.true(output.includes('01') && output.includes('03'));
});

test('formatDiffHex: non-printable ASCII characters (< 0x20 or > 0x7E)', (t) => {
  // Test with non-printable characters: 0x1F (< 0x20) and 0xFF (> 0x7E)
  const buf1 = new DataBuffer([0x1F, 0x20, 0x7E, 0xFF]);
  const buf2 = new DataBuffer([0x1F, 0x20, 0x7E, 0xFF]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showAscii: true, showBits: false });

  // Non-printable characters should show as '.' in ASCII column
  // 0x1F and 0xFF should be '.', 0x20 should be ' ', 0x7E should be '~'
  t.true(output.includes('.'));
});

test('formatDiffHex: showOffset false in three-row format (hasChanges)', (t) => {
  const buf1 = new DataBuffer([0x01, 0x02]);
  const buf2 = new DataBuffer([0xFF, 0x02]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showOffset: false, showBits: false });

  // Should not include offset prefix in three-row format
  t.false(output.includes('00000000'));
  // Should still show the changes
  t.true(output.includes('01') || output.includes('FF'));
});

test('formatDiffHex: showBits false in match case (three-row format)', (t) => {
  // Create a diff with both matches and changes to ensure we hit the match case (op === 0)
  // in the three-row format with showBits: false
  // The match case with showBits: false should skip adding bits to row2Bits (line 548 false branch)
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0xAA]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: false, bytesPerRow: 4 });

  // Should not include binary bits
  t.false(output.includes('00000001'));
  t.false(output.includes('00000010'));
  // Should show hex values
  t.true(output.includes('01') || output.includes('FF'));
  // Should have matches (op === 0) which won't add bits when showBits is false
  t.true(output.includes('03')); // This should be a match
});

test('formatDiffHex: showBits true in match case (three-row format)', (t) => {
  // Create a diff with matches to ensure we hit the match case (op === 0)
  // in the three-row format with showBits: true
  // The match case with showBits: true should add bits to row2Bits (line 548 true branch)
  const buf1 = new DataBuffer([0x01, 0x02, 0x03, 0x04]);
  const buf2 = new DataBuffer([0x01, 0xFF, 0x03, 0xAA]);
  const edits = diffBuffer(buf1, buf2);

  const output = formatDiffHex(edits, { showBits: true, bytesPerRow: 4 });

  // Should include binary bits for matches
  // The match at position 2 (0x03) should have bits added to row2Bits
  t.true(output.includes('00000011')); // Binary for 0x03
  // Should show hex values
  t.true(output.includes('01') || output.includes('FF'));
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

test('formatDiffHunks: hunk with all matches (no changes)', (t) => {
  // Create a hunk with only matches
  const diffHunks = [{
    posX: 0,
    posY: 0,
    edits: [
      { op: 0, x: 0x01, y: 0x01 },
      { op: 0, x: 0x02, y: 0x02 },
      { op: 0, x: 0x03, y: 0x03 },
    ],
  }];

  const output = formatDiffHunks(diffHunks);

  // Hunk with all matches should be skipped (empty output)
  t.is(output, '');
});

test('formatDiffHunks: printable ASCII characters (0x20-0x7E)', (t) => {
  const buf1 = new DataBuffer([0x20, 0x41, 0x7E, 0x1F]); // Space, 'A', '~', non-printable
  const buf2 = new DataBuffer([0x20, 0x42, 0x7E, 0x1F]); // Space, 'B', '~', non-printable
  const x = Array.from(buf1.data);
  const y = Array.from(buf2.data);
  const diffHunks = hunks(x, y, (a, b) => a === b);

  const output = formatDiffHunks(diffHunks);

  // Should show printable characters (0x20 = space, 0x41 = 'A', 0x42 = 'B', 0x7E = '~')
  // Non-printable 0x1F should show as '.'
  t.true(output.includes(' ') || output.includes('A') || output.includes('B') || output.includes('~'));
});

test('formatDiffHunks: non-number x and y values', (t) => {
  // Create a hunk with edits where one of x or y is a number (to pass the typeof check)
  // but the value used (op === 2 ? y : x) is not a number, triggering the '??' branch
  const diffHunks = [{
    posX: 0,
    posY: 0,
    edits: [
      // Case 1: op === 0 (match), x is not a number, y is a number -> value = x -> '??'
      { op: 0, x: null, y: 0x41 },
      // Case 2: op === 1 (delete), x is not a number, y is a number -> value = x -> '??'
      { op: 1, x: undefined, y: 0x42 },
      // Case 3: op === 2 (insert), x is a number, y is not a number -> value = y -> '??'
      { op: 2, x: 0x43, y: 'string' },
      // Case 4: op === 2 (insert), x is a number, y is null -> value = y -> '??'
      { op: 2, x: 0x44, y: null },
    ],
  }];

  const output = formatDiffHunks(diffHunks);

  // Should handle non-number values gracefully (show '??' for hex)
  // Output should not crash and should be a string
  t.true(typeof output === 'string');
  // Should contain '??' for non-number values
  t.true(output.includes('??'));
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

test('formatMyersGraph: path building break condition', (t) => {
  // Create a scenario where path building reaches a break condition
  // This happens when none of the move conditions are met:
  // - Can't move diagonally (no match or at boundary)
  // - Can't move right (no delete or at boundary)
  // - Can't move down (no insert or at boundary)
  // This occurs when we've exhausted one dimension but can't move in the other
  // Example: xi >= width but yi < height and !ry[yi] (can't move down)
  const x = [0x01, 0x02];
  const y = [0x03, 0x04, 0x05];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  // Manually create rx/ry arrays that will cause break condition
  // where we exhaust x but can't move down in y
  const rx = [true, true]; // Both are deletes (move right)
  const ry = [false, false, false]; // None are inserts (can't move down after exhausting x)

  const output = formatMyersGraph(rx, ry, x, y);

  // Should complete successfully (break condition handled)
  t.true(output.includes('o'));
  // Should show path
  t.true(output.length > 0);
});

test('formatBytes: negative, fractional, and out-of-suffix-range values', (t) => {
  t.is(formatBytes(-1024), '-1 KB');
  t.is(formatBytes(-0.5), '-0.5 Bytes');
  t.is(formatBytes(0.5), '0.5 Bytes');
  t.is(formatBytes(-0), '0 Bytes');
  t.is(formatBytes(2048, 2, 1024, ['Bytes']), '2048 Bytes');
  t.true(formatBytes(Number.MAX_VALUE).endsWith(' YB'));
  t.false(formatBytes(Number.MAX_VALUE).includes('undefined'));
  t.is(formatBytes(1024 ** 5 - 0.125, 0).split(' ').pop(), 'TB');
});

test('formatBytes: rejects invalid configuration even for zero input', (t) => {
  for (const input of [Number.NaN, Infinity, -Infinity]) {
    t.throws(() => formatBytes(input), { instanceOf: RangeError });
  }
  for (const decimals of [-1, 1.5, 101, Number.NaN, Infinity]) {
    t.throws(() => formatBytes(0, decimals), { instanceOf: RangeError });
  }
  for (const bytes of [0, 1, -1, Infinity, Number.NaN]) {
    t.throws(() => formatBytes(0, 2, bytes), { instanceOf: RangeError });
  }
  t.throws(() => formatBytes(0, 2, 1024, []), { instanceOf: RangeError });
});

test('hexTable: starts at the DataBuffer cursor without changing it', (t) => {
  const data = new DataBuffer([0x11, 0x22, 0x33, 0x44]);
  data.seek(2);
  const output = hexTable(data, 0x20, { columns: 2, grouping: 1, maxRows: 1 });
  t.true(output.includes('| 00000020 | 33 44 | 3D |'));
  t.is(data.offset, 2);
  t.deepEqual(Array.from(data.data), [0x11, 0x22, 0x33, 0x44]);
});

test('hexTable: default headers follow custom column counts and rows end at the same width', (t) => {
  for (const columns of [1, 2, 3, 4, 7, 8, 16, 20]) {
    const output = hexTable(new DataBuffer([0x41]), 0, { columns, grouping: 3, maxRows: 1 });
    const lines = output.split('\n');
    t.is(lines.length, 3);
    t.is(lines[0].length, lines[1].length);
    t.is(lines[1].length, lines[2].length);
  }
  const output = hexTable(new DataBuffer([0x41]), 0, { columns: 4, grouping: 2, maxRows: 0 });
  t.is(output.split('\n').length, 2);
  t.true(output.includes('0001 0203'));
});

test('hexTable: preserves complete strings returned by custom ASCII formatters', (t) => {
  const output = hexTable(new DataBuffer([0x41]), 0, { columns: 1, grouping: 1, maxRows: 1 },
    { offset: '00', value: ['00'], ascii: 'A' },
    { offset: () => '00', value: () => '41', ascii: () => '[A]' });
  t.true(output.includes('| [A] |'));
});

test('hexTable: tuple formatter flags persist and callback mutations are isolated', (t) => {
  const data = new DataBuffer([0x41, 0x42]);
  const output = hexTable(data, 0, { columns: 2, grouping: 1, maxRows: 1 },
    { offset: '00', value: ['00', '01'], ascii: 'AB' },
    {
      offset: () => '00',
      value: (value) => value.toString(16),
      ascii: (_value, flags, copy) => {
        const count = (flags.count ?? 0) + 1;
        copy.data[0] = 0;
        return [String(count), { count }];
      },
    });
  t.true(output.includes('| 12 |'));
  t.deepEqual(Array.from(data.data), [0x41, 0x42]);
  t.is(data.offset, 0);
});

test('hexTable: validates dimensions and display offsets', (t) => {
  const data = new DataBuffer([0x41]);
  for (const invalid of [-1, 0.5, Infinity, Number.NaN]) {
    t.throws(() => hexTable(data, invalid), { instanceOf: RangeError });
    t.throws(() => hexTable(data, 0, { columns: invalid, grouping: 1, maxRows: 1 }), { instanceOf: RangeError });
    t.throws(() => hexTable(data, 0, { columns: 1, grouping: invalid, maxRows: 1 }), { instanceOf: RangeError });
  }
  t.throws(() => hexTable(data, 0, { columns: 0, grouping: 1, maxRows: 1 }), { instanceOf: RangeError });
  t.throws(() => hexTable(data, 0, { columns: 1, grouping: 0, maxRows: 1 }), { instanceOf: RangeError });
  t.throws(() => hexTable(data, 0, { columns: 1, grouping: 1, maxRows: -1 }), { instanceOf: RangeError });
  t.notThrows(() => hexTable(data, 0, { columns: 1, grouping: 1, maxRows: Infinity }));
});

test('formatTable: empty inputs and rows have no malformed frame', (t) => {
  t.is(formatTable([]), '');
  t.is(formatTable([[], []]), '');
  t.is(formatTable([], { title: 'Nothing' }), '');
});

test('formatTable: pads ragged rows without mutating frozen input', (t) => {
  const data = Object.freeze([Object.freeze(['A', 'B']), Object.freeze(['x']), Object.freeze([])]);
  const output = formatTable(data);
  t.is(output, '+---+---+\n| A | B |\n+---+---+\n| x |   |\n|   |   |\n+---+---+');
  t.is(data[1].length, 1);
  t.is(data[2].length, 0);
});

test('formatTable: titles wider than the body and multiline values retain the frame', (t) => {
  const output = formatTable([['A', 'B'], ['x\ny', 'z']], { title: 'A title much wider than this table\nSecond title line' });
  const lines = output.split('\n');
  t.true(lines.every((line) => line.length === lines[0].length));
  t.true(output.includes('Second title line'));
  t.true(output.includes('| y '));
});

test('formatTable: normalizes cells exactly once without structured cloning', (t) => {
  let calls = 0;
  const cell = { toString: () => { calls++; return 'value'; } };
  const output = formatTable([['Header'], [cell]]);
  t.true(output.includes('value'));
  t.is(calls, 1);
  t.notThrows(() => formatTable([['Function'], [() => 'hello']]));
});

test('formatTable: invalid padding fails before rendering', (t) => {
  for (const padding of [-1, 0.5, Number.NaN, Infinity]) {
    t.throws(() => formatTable([['A']], { padding }), { instanceOf: RangeError });
  }
  t.is(formatTable([['A']], { padding: 0 }), '+-+\n|A|\n+-+\n+-+');
});

test('formatDiffHex: standalone zero-byte insertions and deletions remain visible', (t) => {
  const deleted = formatDiffHex([{ op: 1, x: 0, y: 0 }], { bytesPerRow: 1, showAscii: false, showBits: false });
  const inserted = formatDiffHex([{ op: 2, x: 0, y: 0 }], { bytesPerRow: 1, showAscii: false, showBits: false });
  t.is(deleted, '00000000 | 00\n          -00\n00000000 | --');
  t.is(inserted, '00000000 | --\n          +00\n00000000 | 00');
});

test('formatDiffHex: complete delete/insert runs pair in order', (t) => {
  const edits = [
    { op: 1, x: 1, y: 1 }, { op: 1, x: 2, y: 2 }, { op: 1, x: 3, y: 3 },
    { op: 2, x: 4, y: 4 }, { op: 2, x: 5, y: 5 }, { op: 2, x: 6, y: 6 },
  ];
  const output = formatDiffHex(edits, { bytesPerRow: 3, showAscii: false, showBits: false });
  t.is(output, '00000000 | 01 02 03\n          +03+03+03\n00000000 | 04 05 06');
  const reverseOrder = formatDiffHex([...edits.slice(3), ...edits.slice(0, 3)], { bytesPerRow: 3, showAscii: false, showBits: false });
  t.is(reverseOrder, output);
});

test('formatDiffHex: original and resulting offsets count their own consumed bytes', (t) => {
  const output = formatDiffHex([
    { op: 2, x: 0x99, y: 0x99 },
    { op: 0, x: 0x11, y: 0x11 },
    { op: 0, x: 0x22, y: 0x22 },
    { op: 0, x: 0x33, y: 0x33 },
  ], { bytesPerRow: 2, showBits: false, showAscii: false });
  const lines = output.split('\n');
  t.true(lines[0].startsWith('00000000 | -- 11'));
  t.true(lines[2].startsWith('00000000 | 99 11'));
  t.true(lines[3].startsWith('00000001 | 22 33'));
  t.true(lines[5].startsWith('00000002 | 22 33'));
});

test('formatDiffHex: signs align with byte cells when offsets are disabled', (t) => {
  const output = formatDiffHex([{ op: 1, x: 0xFF, y: 0xFF }, { op: 2, x: 0x20, y: 0x20 }],
    { bytesPerRow: 1, showOffset: false, showBits: false, showAscii: false });
  t.is(output, ' FF\n-DF\n 20');
  t.is(formatDiffHex([{ op: 0, x: 1, y: 1 }], { bytesPerRow: 1, showOffset: false, showBits: false, showAscii: false }), '01');
});

test('formatDiffHex: absent bytes show absent bits rather than invented zeroes', (t) => {
  const output = formatDiffHex([{ op: 1, x: 0, y: 0 }], { bytesPerRow: 1, showBits: true, showAscii: false });
  t.true(output.includes('--------'));
  t.true(output.includes('^^^^^^^^'));
});

test('formatDiffHex: rejects invalid widths, operations, and byte values', (t) => {
  for (const bytesPerRow of [0, -1, 0.5, Number.NaN, Infinity]) {
    t.throws(() => formatDiffHex([], { bytesPerRow }), { instanceOf: RangeError });
  }
  for (const value of [-1, 256, 0.5, Number.NaN, Infinity, 'A', null]) {
    t.throws(() => formatDiffHex([{ op: 1, x: value, y: value }]), { instanceOf: RangeError });
    t.throws(() => formatDiffHex([{ op: 2, x: value, y: value }]), { instanceOf: RangeError });
  }
  t.throws(() => formatDiffHex([{ op: 9, x: 1, y: 1 }]), { instanceOf: RangeError });
  t.throws(() => formatDiffHex([{ op: 0, x: 1, y: 2 }]), { instanceOf: RangeError });
});

test('formatDiffHunks: partial options, zero context, and byte-based positions', (t) => {
  const data = [{ posX: 10, posY: 20, edits: [
    { op: 0, x: 0x41, y: 0x41 }, { op: 1, x: 0x42, y: 0x42 },
    { op: 2, x: 0x43, y: 0x43 }, { op: 0, x: 0x44, y: 0x44 },
  ] }];
  t.is(formatDiffHunks(data, {}), formatDiffHunks(data));
  t.is(formatDiffHunks(data, { context: 0 }), '@@ -11,1 +21,1 @@\n-42  B\n+43  C');
});

test('formatDiffHunks: malformed byte values retain placeholders and accurate counts', (t) => {
  const output = formatDiffHunks([{ posX: 0, posY: 0, edits: [{ op: 1, x: 'bad', y: 'bad' }, { op: 2, x: 256, y: 256 }] }]);
  t.is(output, '@@ -0,1 +0,1 @@\n-??  .\n+??  .');
  for (const context of [-1, 0.5, Infinity, Number.NaN]) {
    t.throws(() => formatDiffHunks([], { context }), { instanceOf: RangeError });
  }
  t.throws(() => formatDiffHunks([{ posX: 0, posY: 0, edits: [{ op: 9, x: 1, y: 1 }] }]), { instanceOf: RangeError });
});

test('formatMyersGraph: partial options retain default labels and allocations are bounded', (t) => {
  const output = formatMyersGraph([false], [false], ['A'], ['A'], { showFull: true });
  t.regex(output, /^\s+0/);
  t.throws(() => formatMyersGraph([], [], [], [], { maxCells: 7 }), { instanceOf: RangeError });
  t.notThrows(() => formatMyersGraph([], [], [], [], { maxCells: 8 }));
  for (const maxCells of [0, -1, 1.5, Number.NaN, Infinity]) {
    t.throws(() => formatMyersGraph([], [], [], [], { maxCells }), { instanceOf: RangeError });
  }
  t.throws(() => formatMyersGraph(Array(400).fill(false), Array(400).fill(false), Array(400).fill('A'), Array(400).fill('A')), { instanceOf: RangeError });
});

test('hexTable: padding does not call the value formatter with invented bytes', (t) => {
  const values = [];
  const output = hexTable(new DataBuffer([0x41]), 0, { columns: 2, grouping: 1, maxRows: 1 },
    { offset: '00', value: ['000', '001'], ascii: 'AB' },
    { offset: () => '00', value: (value) => { values.push(value); return value.toString(16).padStart(3, '0'); }, ascii: () => 'A' });
  t.deepEqual(values, [0x41]);
  const lines = output.split('\n');
  t.is(lines[0].length, lines[2].length);
});

test('hexTable: default formatting copies only visible bytes from a large input', (t) => {
  class TrackingBuffer extends DataBuffer {
    slice(position, length) {
      t.is(position, 10);
      t.is(length, 16);
      return super.slice(position, length);
    }
    copy() { t.fail('The default formatter should not copy the full input.'); }
  }
  const data = new TrackingBuffer(new Uint8Array(1024 * 1024));
  data.seek(10);
  t.notThrows(() => hexTable(data, 0, { columns: 8, grouping: 4, maxRows: 2 }));
  t.is(data.offset, 10);
});

test('formatMyersGraph: rejects oversized grids before reading any path vector entries', (t) => {
  const rx = new Proxy([], { get() { t.fail('Size validation must precede path tracing.'); } });
  t.throws(() => formatMyersGraph(rx, [], Array(100000).fill('A'), [], { maxCells: 8 }), { instanceOf: RangeError });
});

test('formatDiffHex: randomized rendered rows reconstruct both original byte sequences', (t) => {
  let seed = 0xD1FF;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  const decodeRow = (row) => row.slice(11).trim().split(/\s+/).filter((value) => value && value !== '--').map((value) => Number.parseInt(value, 16));
  for (let sample = 0; sample < 200; sample++) {
    const original = new DataBuffer(Uint8Array.from({ length: next() % 25 }, () => next() >>> 28));
    const modified = new DataBuffer(Uint8Array.from({ length: next() % 25 }, () => next() >>> 28));
    const output = formatDiffHex(diffBuffer(original, modified), { bytesPerRow: 1 + next() % 8, showBits: false, showAscii: false });
    const before = [];
    const after = [];
    const lines = output ? output.split('\n') : [];
    for (let i = 0; i < lines.length;) {
      t.is(Number.parseInt(lines[i].slice(0, 8), 16), before.length);
      const a = decodeRow(lines[i]);
      const changed = i + 1 < lines.length && !/^[0-9a-f]{8} \| /.test(lines[i + 1]);
      const b = changed ? decodeRow(lines[i + 2]) : a;
      if (changed) t.is(Number.parseInt(lines[i + 2].slice(0, 8), 16), after.length);
      before.push(...a);
      after.push(...b);
      i += changed ? 3 : 1;
    }
    t.deepEqual(before, Array.from(original.data), `original ${sample}`);
    t.deepEqual(after, Array.from(modified.data), `modified ${sample}`);
  }
});

test('formatTableLine: all separator variants retain valid frames and reject invalid sizes', (t) => {
  const options = { padding: 1, theme: formatTableThemeUnicode, align: [], title: '' };
  for (const [type, expected] of [
    ['top', '╔═══╦═══╗'], ['bottom', '╚═══╩═══╝'], ['title_top', '╔═══════╗'],
    ['title_bottom', '╠═══╦═══╣'], ['middle', '╠═══╬═══╣'],
  ]) t.is(formatTableLine([1, 1], type, options), expected);
  t.is(formatTableLine([], 'top', options), '');
  for (const invalid of [-1, 0.5, Number.NaN, Infinity]) {
    t.throws(() => formatTableLine([invalid], 'top', options), { instanceOf: RangeError });
    t.throws(() => formatTableLine([1], 'top', { ...options, padding: invalid }), { instanceOf: RangeError });
  }
});

test('formatMyersGraph: wide column numbers align with their grid nodes', (t) => {
  const count = 10000;
  const output = formatMyersGraph(Array(count).fill(true), [], Array(count).fill('A'), [], { maxCells: 130000 });
  const [labels, nodes] = output.split('\n');
  t.is(labels.indexOf('10000') + 4, nodes.lastIndexOf('o'));
});

test('module imports: helpers work when process and Buffer globals are absent', (t) => {
  const url = (name) => new URL(`../dist/${name}.js`, import.meta.url).href;
  const script = `
    globalThis.process = undefined;
    globalThis.Buffer = undefined;
    const { default: DataBuffer } = await import(${JSON.stringify(url('data-buffer'))});
    const { default: DataBitstream } = await import(${JSON.stringify(url('data-bitstream'))});
    const { default: IPS } = await import(${JSON.stringify(url('patch/data-patch-ips'))});
    const { hexTable, formatBytes } = await import(${JSON.stringify(url('data-formating'))});
    const buffer = new DataBuffer([0x12, 0x34]);
    if (new DataBitstream(buffer).read(16) !== 0x1234) throw new Error('Bitstream failed');
    buffer.seek(0);
    if (!hexTable(buffer).includes('1234')) throw new Error('Hex table failed');
    if (formatBytes(1024) !== '1 KB') throw new Error('Formatting failed');
    if (new IPS(new IPS().encode().data).hunks.length !== 0) throw new Error('IPS failed');
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', timeout: 10000 });
  t.is(result.status, 0, result.stderr);
});
