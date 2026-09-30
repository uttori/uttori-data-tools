import test from 'ava';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { textEdits, unified, htmlTable, textHunks } from '../../dist/diff/textdiff.js';
import { Op } from '../../dist/diff/diff.js';

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

  t.is(result, '@@ -1,3 +1,3 @@\n line1\n-line2\n+modified\n line3\n\\ No newline at end of file\n');
});

test('unified: should handle single line changes', (t) => {
  const x = 'single line';
  const y = 'modified line';

  const result = unified(x, y);

  t.is(result, '@@ -1 +1 @@\n-single line\n\\ No newline at end of file\n+modified line\n\\ No newline at end of file\n');
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

  t.is(result, '@@ -1,2 +1,2 @@\n line1\n-line2\n\\ No newline at end of file\n+modified\n\\ No newline at end of file\n');
});

test('htmlTable: should generate HTML table diff', (t) => {
  const x = 'line1\nline2\nline3';
  const y = 'line1\nmodified\nline3';

  const result = htmlTable(x, y);

  t.is(result, '<table class="diff">\n<tbody><tr class="src match" data-op="match"  data-block-start=""><td class="line-no">1</td><td class="line-no">1</td><td class="op"> </td><td class="code"><code>line1\n</code></td></tr><tr class="src delete" data-op="delete" ><td class="line-no">2</td><td class="line-no"></td><td class="op">-</td><td class="code"><code>line2\n</code></td></tr><tr class="src insert" data-op="insert" ><td class="line-no"></td><td class="line-no">2</td><td class="op">+</td><td class="code"><code>modified\n</code></td></tr><tr class="src match" data-op="match"  data-block-end=""><td class="line-no">3</td><td class="line-no">3</td><td class="op"> </td><td class="code"><code>line3</code></td></tr></tbody>\n</table>');
});

test('textEdits: CRLF, lone carriage returns, and mixed endings are preserved exactly', (t) => {
  const cases = [
    ['a\r\nb\r\n', 'a\r\nc\r\n'],
    ['a\r\nb\nlast\r', 'a\nb\r\nlast\r'],
    ['a\rb\r', 'a\rc\r'],
    ['\r\n\n\r\n', '\n\r\n'],
  ];
  for (const [x, y] of cases) {
    const result = textEdits(x, y);
    t.is(result.filter(edit => edit.op !== Op.Insert).map(edit => edit.line).join(''), x);
    t.is(result.filter(edit => edit.op !== Op.Delete).map(edit => edit.line).join(''), y);
  }
  t.deepEqual(textEdits('a\rb\r', 'a\rc\r').map(edit => edit.op), [Op.Delete, Op.Insert]);
});

test('textEdits: Unicode, NUL, tabs, and Unicode separators are not normalized', (t) => {
  const x = '😀\0\t\nA\u0301\nleft\u2028right\u2029end';
  const y = '😀\0\t\nÁ\nleft\u2028right\u2029end';
  t.deepEqual(textEdits(x, y), [
    { op: Op.Match, line: '😀\0\t\n' },
    { op: Op.Delete, line: 'A\u0301\n' },
    { op: Op.Insert, line: 'Á\n' },
    { op: Op.Match, line: 'left\u2028right\u2029end' },
  ]);
});

test('textEdits: final newlines do not create phantom empty lines', (t) => {
  for (const [input, expected] of [['', []], ['\n', ['\n']], ['a\n', ['a\n']],
    ['a\n\n', ['a\n', '\n']], ['a\nb', ['a\n', 'b']]]) {
    t.deepEqual(textEdits(input, input), expected.map(line => ({ op: Op.Match, line })));
  }
});

test('textEdits: adding and removing a final newline are real edits', (t) => {
  t.deepEqual(textEdits('same', 'same\n'), [
    { op: Op.Delete, line: 'same' },
    { op: Op.Insert, line: 'same\n' },
  ]);
  t.deepEqual(textEdits('same\n', 'same'), [
    { op: Op.Delete, line: 'same\n' },
    { op: Op.Insert, line: 'same' },
  ]);
});

test('textHunks: zero context produces correctly positioned insertion and deletion hunks', (t) => {
  t.deepEqual(textHunks('a\nb\n', 'a\nnew\nb\n', 0), [{
    posX: 1, endX: 1, posY: 1, endY: 2,
    edits: [{ op: Op.Insert, line: 'new\n' }],
  }]);
  t.deepEqual(textHunks('a\nold\nb\n', 'a\nb\n', 0), [{
    posX: 1, endX: 2, posY: 1, endY: 1,
    edits: [{ op: Op.Delete, line: 'old\n' }],
  }]);
});

test('textHunks: touching context windows merge and separated windows remain separate', (t) => {
  for (const gap of [1, 2, 3, 4]) {
    const middle = Array.from({ length: gap }, (_, i) => `same${i}\n`).join('');
    const result = textHunks(`old0\n${middle}old1\n`, `new0\n${middle}new1\n`, 1);
    t.is(result.length, gap <= 2 ? 1 : 2);
    if (result.length === 2) {
      t.is(result[0].endX, 2);
      t.is(result[1].posX, gap);
      t.is(result[0].endY, 2);
      t.is(result[1].posY, gap);
    }
  }
});

test('textHunks: huge finite context remains bounded by the input', (t) => {
  const result = textHunks('a\nold\nz', 'a\nnew\nz', Number.MAX_SAFE_INTEGER);
  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 3);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 3);
});

test('text formatting: invalid contexts consistently throw, even for identical text', (t) => {
  for (const format of [textHunks, unified, htmlTable]) {
    for (const context of [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, null, '3']) {
      t.throws(() => format('old', 'new', context), { instanceOf: RangeError });
      t.throws(() => format('', '', context), { instanceOf: RangeError });
    }
  }
});

test('textHunks: seeded text cases reconstruct each advertised range and full target', (t) => {
  let seed = 0x2468ACE0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const tokens = ['a\n', 'b\r\n', '\n', '😀\n', '\t\0\n'];
  for (let i = 0; i < 1000; i++) {
    const xlines = Array.from({ length: random() % 21 }, () => tokens[(random() >>> 16) % tokens.length]);
    const ylines = Array.from({ length: random() % 21 }, () => tokens[(random() >>> 16) % tokens.length]);
    if (xlines.length > 0 && random() % 2 === 0) xlines[xlines.length - 1] = 'tail';
    if (ylines.length > 0 && random() % 2 === 0) ylines[ylines.length - 1] = 'other tail';
    const x = xlines.join('');
    const y = ylines.join('');
    for (const context of [0, 1, 3]) {
      const result = textHunks(x, y, context);
      let endX = 0;
      let endY = 0;
      let restored = '';
      for (const hunk of result) {
        t.true(hunk.posX >= endX && hunk.posX <= hunk.endX && hunk.endX <= xlines.length);
        t.true(hunk.posY >= endY && hunk.posY <= hunk.endY && hunk.endY <= ylines.length);
        t.deepEqual(xlines.slice(endX, hunk.posX), ylines.slice(endY, hunk.posY));
        const left = hunk.edits.filter(edit => edit.op !== Op.Insert).map(edit => edit.line);
        const right = hunk.edits.filter(edit => edit.op !== Op.Delete).map(edit => edit.line);
        t.deepEqual(left, xlines.slice(hunk.posX, hunk.endX));
        t.deepEqual(right, ylines.slice(hunk.posY, hunk.endY));
        restored += xlines.slice(endX, hunk.posX).join('') + right.join('');
        endX = hunk.endX;
        endY = hunk.endY;
      }
      restored += xlines.slice(endX).join('');
      t.is(restored, y);
    }
  }
});

test('unified: empty-file insertion and deletion use zero-based empty ranges', (t) => {
  t.is(unified('', 'one\n', 0), '@@ -0,0 +1 @@\n+one\n');
  t.is(unified('one\n', '', 0), '@@ -1 +0,0 @@\n-one\n');
  t.is(unified('', 'one\ntwo\n'), '@@ -0,0 +1,2 @@\n+one\n+two\n');
  t.is(unified('one\ntwo\n', ''), '@@ -1,2 +0,0 @@\n-one\n-two\n');
});

test('unified: insertion ranges identify the preceding line at all positions', (t) => {
  t.is(unified('a\nb\n', 'new\na\nb\n', 0), '@@ -0,0 +1 @@\n+new\n');
  t.is(unified('a\nb\n', 'a\nnew\nb\n', 0), '@@ -1,0 +2 @@\n+new\n');
  t.is(unified('a\nb\n', 'a\nb\nnew\n', 0), '@@ -2,0 +3 @@\n+new\n');
});

test('unified: deletion ranges identify the preceding target line at all positions', (t) => {
  t.is(unified('a\nb\nc\n', 'b\nc\n', 0), '@@ -1 +0,0 @@\n-a\n');
  t.is(unified('a\nb\nc\n', 'a\nc\n', 0), '@@ -2 +1,0 @@\n-b\n');
  t.is(unified('a\nb\nc\n', 'a\nb\n', 0), '@@ -3 +2,0 @@\n-c\n');
});

test('unified: newline-only changes include markers on the correct side', (t) => {
  t.is(unified('same', 'same\n'), '@@ -1 +1 @@\n-same\n\\ No newline at end of file\n+same\n');
  t.is(unified('same\n', 'same'), '@@ -1 +1 @@\n-same\n+same\n\\ No newline at end of file\n');
  t.is(unified('', 'same'), '@@ -0,0 +1 @@\n+same\n\\ No newline at end of file\n');
  t.is(unified('same', ''), '@@ -1 +0,0 @@\n-same\n\\ No newline at end of file\n');
});

test('unified: unterminated matching context has a newline marker', (t) => {
  t.is(unified('old\nsame', 'new\nsame'), '@@ -1,2 +1,2 @@\n-old\n+new\n same\n\\ No newline at end of file\n');
});

test('unified: CRLF bytes and lone carriage returns remain part of line content', (t) => {
  t.is(unified('old\r\n', 'new\r\n'), '@@ -1 +1 @@\n-old\r\n+new\r\n');
  t.is(unified('old\r', 'new\r'), '@@ -1 +1 @@\n-old\r\n\\ No newline at end of file\n+new\r\n\\ No newline at end of file\n');
});

test('unified: multiple hunks account for earlier insertions and deletions', (t) => {
  const x = 'a\nb\nc\nd\ne\nf\ng\nh\ni\n';
  const y = 'a\nadded\nb\nc\nd\ne\nf\ng\nchanged\ni\n';
  t.is(unified(x, y, 0), '@@ -1,0 +2 @@\n+added\n@@ -8 +9 @@\n-h\n+changed\n');
});

test('htmlTable: escapes every special character without exposing injected markup', (t) => {
  const result = htmlTable('<script a="x">&\'</script>\n', '<img onerror="x">\n', 0);
  t.true(result.includes('&lt;script a=&quot;x&quot;&gt;&amp;&#039;&lt;/script&gt;'));
  t.true(result.includes('&lt;img onerror=&quot;x&quot;&gt;'));
  t.false(result.includes('<script'));
  t.false(result.includes('<img'));
});

test('htmlTable: a single context match carries both block boundary markers', (t) => {
  for (const [x, y] of [['a\nold\n', 'a\nnew\n'], ['old\na\n', 'new\na\n']]) {
    const result = htmlTable(x, y, 1);
    t.true(result.includes('data-block-start="" data-block-end=""'));
    t.is(result.split('data-block-start').length - 1, 1);
    t.is(result.split('data-block-end').length - 1, 1);
  }
});

test('htmlTable: zero-context changes have no block markers and correct side-specific numbers', (t) => {
  const result = htmlTable('a\nb\n', 'a\nnew\nb\n', 0);
  t.false(result.includes('data-block-start'));
  t.false(result.includes('data-block-end'));
  t.true(result.includes('<td class="line-no"></td><td class="line-no">2</td>'));
});

test('htmlTable: unchanged and empty text produce an empty table', (t) => {
  t.is(htmlTable('', ''), '<table class="diff">\n<tbody></tbody>\n</table>');
  t.is(htmlTable('same', 'same'), '<table class="diff">\n<tbody></tbody>\n</table>');
});


// Opt in to the external integration check without requiring GNU patch on every supported platform.
const patchTest = process.env.DIFF_TEST_GNU_PATCH === '1' ? test : test.skip;
patchTest('unified: GNU patch applies and reverses generated patches byte-for-byte', (t) => {
  const version = spawnSync('patch', ['--version'], { encoding: 'utf8' });
  t.is(version.error, undefined);
  t.is(version.status, 0);
  t.true(version.stdout.includes('GNU patch'));

  const directory = mkdtempSync(join(tmpdir(), 'diff-patch-validation-'));
  const path = join(directory, 'content.txt');
  let cases = 0;
  let applications = 0;

  const check = (x, y, context) => {
    const body = unified(x, y, context);
    cases++;
    if (x === y) {
      t.is(body, '');
      return;
    }
    const patch = `--- content.txt\n+++ content.txt\n${body}`;
    for (const reverse of [false, true]) {
      writeFileSync(path, reverse ? y : x);
      const args = ['--batch', '--silent', '--fuzz=0', '--binary', '--no-backup-if-mismatch'];
      if (reverse) args.push('--reverse');
      args.push(path);
      const result = spawnSync('patch', args, { cwd: directory, input: patch, encoding: 'utf8', timeout: 5000 });
      t.is(result.error, undefined);
      t.is(result.status, 0, JSON.stringify({ x, y, context, reverse, patch, stdout: result.stdout, stderr: result.stderr }));
      t.deepEqual(readFileSync(path), Buffer.from(reverse ? x : y));
      applications++;
    }
  };

  try {
    const edgeTexts = ['', '\n', 'a', 'a\n', 'a\r\n', 'a\r', 'a\nb', '\n\n', '😀\0\nlast'];
    for (const x of edgeTexts) {
      for (const y of edgeTexts) {
        for (const context of [0, 1, 3]) check(x, y, context);
      }
    }
    let seed = 0xFEDCBA98;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    const tokens = ['a\n', 'b\r\n', '\n', '😀\n', '\t\0\n', 'quote"&<>\n'];
    for (let i = 0; i < 300; i++) {
      const x = Array.from({ length: random() % 40 }, () => tokens[(random() >>> 16) % tokens.length]);
      const y = Array.from({ length: random() % 40 }, () => tokens[(random() >>> 16) % tokens.length]);
      if (x.length && random() % 2 === 0) x[x.length - 1] = 'unterminated\r';
      if (y.length && random() % 2 === 0) y[y.length - 1] = 'unterminated';
      check(x.join(''), y.join(''), i % 4);
    }
    t.is(cases, 543);
    t.is(applications, 1032);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
