import test from 'ava';
import { textEdits, unified, htmlTable, textHunks } from '../../src/diff/textdiff.js';
import { Op } from '../../src/diff/diff.js';

test('textHunks: identical text should return empty result', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nline2\nline3';

  const result = textHunks(x, y);

  t.is(result.length, 0);
});

test('textHunks: empty text should return empty result', (t) => {
  const x = '';
  const y = '';

  const result = textHunks(x, y);

  t.is(result.length, 0);
});

test('textHunks: x-empty should return insertion hunk', (t) => {
  const x = '';
  const y = 'line1\nline2\nline3';

  const result = textHunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 0);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 3);
  t.is(result[0].edits.length, 3);
  t.true(result[0].edits.every(edit => edit.op === Op.Insert));
});

test('textHunks: y-empty should return deletion hunk', (t) => {
  const x = 'line1\nline2\nline3';
  const y = '';

  const result = textHunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 3);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 0);
  t.is(result[0].edits.length, 3);
  t.true(result[0].edits.every(edit => edit.op === Op.Delete));
});

test('textHunks: single line change', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nmodified\nline3';

  const result = textHunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 3);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 3);
  t.is(result[0].edits.length, 4);
});

test('textHunks: multiple line changes', (t) => {
  const x = 'line1\nline2\nline3\nline4';
  const y = 'line1\nmodified2\nmodified3\nline4';

  const result = textHunks(x, y);

  t.deepEqual(result, [
    {
      edits: [
        {
          line: 'line1\n',
          op: Op.Match,
        },
        {
          line: 'line2\n',
          op: Op.Delete,
        },
        {
          line: 'line3\n',
          op: Op.Delete,
        },
        {
          line: 'modified2\n',
          op: Op.Insert,
        },
        {
          line: 'modified3\n',
          op: Op.Insert,
        },
        {
          line: 'line4',
          op: Op.Match,
        },
      ],
      endX: 4,
      endY: 4,
      posX: 0,
      posY: 0,
    },
  ]);
});

test('textEdits: should find differences between strings', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nmodified\nline3';

  const result = textEdits(x, y);

  t.deepEqual(result, [
    {
      line: 'line1\n',
      op: Op.Match,
    },
    {
      line: 'line2\n',
      op: Op.Delete,
    },
    {
      line: 'modified\n',
      op: Op.Insert,
    },
    {
      line: 'line3',
      op: Op.Match,
    },
  ]);
});

test('textEdits: identical text should return all matches', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nline2\nline3';

  const result = textEdits(x, y);

  t.is(result.length, 3);
  // All edits should be Match operations for identical text
  t.true(result.every(edit => edit.op === Op.Match));
});

test('textEdits: empty text should return empty result', (t) => {
  const x = '';
  const y = '';

  const result = textEdits(x, y);

  t.is(result.length, 0);
});

test('textEdits: single line text', (t) => {
  const x = 'hello';
  const y = 'world';

  const result = textEdits(x, y);

  t.deepEqual(result, [
    {
      line: 'hello',
      op: Op.Delete,
    },
    {
      line: 'world',
      op: Op.Insert,
    },
  ]);
});

test('textEdits: text with only newlines', (t) => {
  const x = '\n\n';
  const y = '\n\n\n';

  const result = textEdits(x, y);

  t.deepEqual(result, [
    {
      line: '\n',
      op: Op.Match,
    },
    {
      line: '\n',
      op: Op.Match,
    },
    {
      line: '\n',
      op: Op.Insert,
    },
  ]);
});

test('textEdits: moderate length text', (t) => {
  const lines = Array.from({ length: 10 }, (_, i) => `line${i}`);
  const x = lines.join('\n');
  const y = lines.join('\n');

  const result = textEdits(x, y);

  t.is(result.length, 10);
  t.true(result.every(edit => edit.op === Op.Match));
});

test('textEdits: text with special characters', (t) => {
  const x = 'line with spaces\nline\twith\ttabs\nline\nwith\nnewlines';
  const y = 'line with spaces\nline\twith\ttabs\nline\nwith\nnewlines';

  const result = textEdits(x, y);

  t.is(result.length, 5);
  t.true(result.every(edit => edit.op === Op.Match));
});

test('unified: should generate unified diff format', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nmodified\nline3';

  const result = unified(x, y);

  t.is(result, '@@ -1,3 +1,3 @@\n line1\n-line2\n+modified\n line3\n');
});

test('unified: should handle single line changes', (t) => {
  const x = 'single line';
  const y = 'modified line';

  const result = unified(x, y);

  t.is(result, '@@ -1 +1 @@\n-single line\n+modified line\n');
});

test('unified: identical text should return empty unified diff', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nline2\nline3';

  const result = unified(x, y);

  t.is(result, '');
});

test('unified: empty text should return empty unified diff', (t) => {
  const x = '';
  const y = '';

  const result = unified(x, y);

  t.is(result, '');
});

test('unified: should handle text without trailing newline', (t) => {
  const x = 'line1\nline2';
  const y = 'line1\nmodified';

  const result = unified(x, y);

  t.is(result, '@@ -1,2 +1,2 @@\n line1\n-line2\n+modified\n');
});

test('htmlTable: should generate HTML table diff', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nmodified\nline3';

  const result = htmlTable(x, y);

  t.is(result, '<table class="diff">\n<tbody><tr class="src match" data-op="match"  data-block-start=""><td class="line-no">1</td><td class="line-no">1</td><td class="op"> </td><td class="code"><code>line1\n</code></td></tr><tr class="src delete" data-op="delete" ><td class="line-no">2</td><td class="line-no"></td><td class="op">-</td><td class="code"><code>line2\n</code></td></tr><tr class="src insert" data-op="insert" ><td class="line-no"></td><td class="line-no">2</td><td class="op">+</td><td class="code"><code>modified\n</code></td></tr><tr class="src match" data-op="match"  data-block-end=""><td class="line-no">3</td><td class="line-no">3</td><td class="op"> </td><td class="code"><code>line3</code></td></tr></tbody>\n</table>');
});
