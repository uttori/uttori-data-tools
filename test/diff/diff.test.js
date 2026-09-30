import test from 'ava';
import { hunks, edits, diff } from '../../dist/diff/diff.js';
import { Op } from '../../dist/diff/diff.js';

test('edits: should find differences between arrays', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'x', 'c'];

  const result = edits(x, y);

  t.is(result.length, 4);
  t.deepEqual(result[0], { op: Op.Match, x: 'a', y: 'a' });
  t.deepEqual(result[1], { op: Op.Delete, x: 'b', y: 'b' });
  t.deepEqual(result[2], { op: Op.Insert, x: 'x', y: 'x' });
  t.deepEqual(result[3], { op: Op.Match, x: 'c', y: 'c' });
});

test('edits: should handle identical arrays', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'b', 'c'];

  const result = edits(x, y);

  t.is(result.length, 3);
  t.true(result.every(edit => edit.op === Op.Match));
});

test('edits: should handle completely different arrays', (t) => {
  const x = ['a', 'b'];
  const y = ['x', 'y'];

  const result = edits(x, y);

  t.is(result.length, 4);
  t.deepEqual(result[0], { op: Op.Delete, x: 'a', y: 'a' });
  t.deepEqual(result[1], { op: Op.Delete, x: 'b', y: 'b' });
  t.deepEqual(result[2], { op: Op.Insert, x: 'x', y: 'x' });
  t.deepEqual(result[3], { op: Op.Insert, x: 'y', y: 'y' });
});

test('hunks: should create hunks with context', (t) => {
  const x = ['a', 'b', 'c', 'd', 'e'];
  const y = ['a', 'x', 'c', 'd', 'e'];

  const result = hunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 5);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 5);
});

test('hunks: identical arrays should return empty result', (t) => {
  const x = ['foo', 'bar', 'baz'];
  const y = ['foo', 'bar', 'baz'];

  const result = hunks(x, y);

  t.is(result.length, 0);
});

test('hunks: empty arrays should return empty result', (t) => {
  const x = [];
  const y = [];

  const result = hunks(x, y);

  t.is(result.length, 0);
});

test('hunks: x-empty should return insertion hunk', (t) => {
  const x = [];
  const y = ['foo', 'bar', 'baz'];

  const result = hunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 0);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 3);
  t.is(result[0].edits.length, 3);
  t.is(result[0].edits[0].op, Op.Insert);
  t.is(result[0].edits[1].op, Op.Insert);
  t.is(result[0].edits[2].op, Op.Insert);
});

test('hunks: y-empty should return deletion hunk', (t) => {
  const x = ['foo', 'bar', 'baz'];
  const y = [];

  const result = hunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 3);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 0);
  t.is(result[0].edits.length, 3);
  t.is(result[0].edits[0].op, Op.Delete);
  t.is(result[0].edits[1].op, Op.Delete);
  t.is(result[0].edits[2].op, Op.Delete);
});

test('hunks: same-prefix should return single hunk', (t) => {
  const x = ['foo', 'bar'];
  const y = ['foo', 'baz'];

  const result = hunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 2);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 2);
  t.is(result[0].edits.length, 3);
  t.is(result[0].edits[0].op, Op.Match);
  t.is(result[0].edits[1].op, Op.Delete);
  t.is(result[0].edits[2].op, Op.Insert);
});

test('hunks: same-suffix should return single hunk', (t) => {
  const x = ['foo', 'bar'];
  const y = ['loo', 'bar'];

  const result = hunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 2);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 2);
  t.is(result[0].edits.length, 3);
  t.is(result[0].edits[0].op, Op.Delete);
  t.is(result[0].edits[1].op, Op.Insert);
  t.is(result[0].edits[2].op, Op.Match);
});

test('hunks: ABCABBA_to_CBABAC should return correct diff', (t) => {
  const x = 'ABCABBA'.split('');
  const y = 'CBABAC'.split('');

  const result = hunks(x, y);

  t.is(result.length, 1);
  t.is(result[0].posX, 0);
  t.is(result[0].endX, 7);
  t.is(result[0].posY, 0);
  t.is(result[0].endY, 6);
  t.is(result[0].edits.length, 9);

  // Check the sequence of operations
  const ops = result[0].edits.map(edit => edit.op);
  t.deepEqual(ops, [
    Op.Delete,  // A
    Op.Insert,  // C
    Op.Match,   // B
    Op.Delete,  // C
    Op.Match,   // A
    Op.Match,   // B
    Op.Delete,  // B
    Op.Match,   // A
    Op.Insert,  // C
  ]);
});

test('hunks: ABCABBA_to_CBABAC with no context should return only changed ranges', (t) => {
  const x = 'ABCABBA'.split('');
  const y = 'CBABAC'.split('');

  const result = hunks(x, y, undefined, 0);

  t.deepEqual(result.map(({ posX, endX, posY, endY }) => ({ posX, endX, posY, endY })), [
    { posX: 0, endX: 1, posY: 0, endY: 1 },
    { posX: 2, endX: 3, posY: 2, endY: 2 },
    { posX: 5, endX: 6, posY: 4, endY: 4 },
    { posX: 7, endX: 7, posY: 5, endY: 6 },
  ]);
  t.true(result.every(hunk => hunk.edits.every(edit => edit.op !== Op.Match)));
});

test('edits: identical arrays should return all matches', (t) => {
  const x = ['foo', 'bar', 'baz'];
  const y = ['foo', 'bar', 'baz'];

  const result = edits(x, y);

  t.is(result.length, 3);
  t.true(result.every(edit => edit.op === Op.Match));
});

test('edits: empty arrays should return empty result', (t) => {
  const x = [];
  const y = [];

  const result = edits(x, y);

  t.is(result.length, 0);
});

test('edits: x-empty should return all insertions', (t) => {
  const x = [];
  const y = ['foo', 'bar', 'baz'];

  const result = edits(x, y);

  t.is(result.length, 3);
  t.true(result.every(edit => edit.op === Op.Insert));
});

test('edits: y-empty should return all deletions', (t) => {
  const x = ['foo', 'bar', 'baz'];
  const y = [];

  const result = edits(x, y);

  t.is(result.length, 3);
  t.true(result.every(edit => edit.op === Op.Delete));
});

test('edits: ABCABBA_to_CBABAC should return correct edit sequence', (t) => {
  const x = 'ABCABBA'.split('');
  const y = 'CBABAC'.split('');

  const result = edits(x, y);

  t.is(result.length, 9);

  // Check the sequence of operations
  const ops = result.map(edit => edit.op);
  t.deepEqual(ops, [
    Op.Delete,  // A
    Op.Insert,  // C
    Op.Match,   // B
    Op.Delete,  // C
    Op.Match,   // A
    Op.Match,   // B
    Op.Delete,  // B
    Op.Match,   // A
    Op.Insert,  // C
  ]);
});

test('edits: single element arrays', (t) => {
  const x = ['a'];
  const y = ['b'];

  const result = edits(x, y);

  t.is(result.length, 2);
  t.is(result[0].op, Op.Delete);
  t.is(result[1].op, Op.Insert);
});

test('edits: arrays with repeated elements', (t) => {
  const x = ['a', 'a', 'a'];
  const y = ['a', 'b', 'a'];

  const result = edits(x, y);

  t.is(result.length, 4);
  t.is(result[0].op, Op.Match);  // Match 'a'
  t.is(result[1].op, Op.Delete); // Delete 'a'
  t.is(result[2].op, Op.Insert); // Insert 'b'
  t.is(result[3].op, Op.Match);  // Match 'a'
});

test('edits: moderate length arrays', (t) => {
  const x = Array.from({ length: 10 }, (_, i) => `item${i}`);
  const y = Array.from({ length: 10 }, (_, i) => `item${i}`);

  const result = edits(x, y);

  t.is(result.length, 10);
  t.true(result.every(edit => edit.op === Op.Match));
});

/**
 * Computes the minimum insert/delete distance independently of Myers.
 * @param {Array<string|number|Uint8Array>} x The first input
 * @param {Array<string|number|Uint8Array>} y The second input
 * @param {Function} eq Equality function
 * @returns {number} The minimum number of changes.
 */
function minimumChanges(x, y, eq = (a, b) => a === b) {
  const row = new Array(y.length + 1).fill(0);
  for (let i = 0; i < x.length; i++) {
    let diagonal = 0;
    for (let j = 1; j <= y.length; j++) {
      const previous = row[j];
      row[j] = eq(x[i], y[j - 1]) ? diagonal + 1 : Math.max(row[j], row[j - 1]);
      diagonal = previous;
    }
  }
  return x.length + y.length - 2 * row[y.length];
}

/**
 * Verifies every hunk consumes exactly its advertised ranges and reconstructs y.
 * @param {import('ava').ExecutionContext<unknown>} t Test function
 * @param {Array<string|number|Uint8Array>} x The first input
 * @param {Array<string|number|Uint8Array>} y The second input
 * @param {import('../../dist/diff/diff.js').Hunk[]} result The hunks
 */
function verifyHunks(t, x, y, result) {
  let endX = 0;
  let endY = 0;
  const restored = [];
  for (const hunk of result) {
    t.true(Number.isInteger(hunk.posX) && Number.isInteger(hunk.endX));
    t.true(Number.isInteger(hunk.posY) && Number.isInteger(hunk.endY));
    t.true(hunk.posX >= endX && hunk.posX <= hunk.endX && hunk.endX <= x.length);
    t.true(hunk.posY >= endY && hunk.posY <= hunk.endY && hunk.endY <= y.length);
    t.deepEqual(x.slice(endX, hunk.posX), y.slice(endY, hunk.posY));
    const left = hunk.edits.filter(edit => edit.op !== Op.Insert).map(edit => edit.x);
    const right = hunk.edits.filter(edit => edit.op !== Op.Delete).map(edit => edit.y);
    t.deepEqual(left, x.slice(hunk.posX, hunk.endX));
    t.deepEqual(right, y.slice(hunk.posY, hunk.endY));
    t.true(hunk.edits.some(edit => edit.op !== Op.Match));
    restored.push(...x.slice(endX, hunk.posX), ...right);
    endX = hunk.endX;
    endY = hunk.endY;
  }
  restored.push(...x.slice(endX));
  t.deepEqual(restored, y);
}

test('diff: result vectors include false sentinels for empty and non-empty inputs', (t) => {
  for (const [x, y] of [[[], []], [[1], []], [[], [1]], [[1], [2]], [[1], [1]]]) {
    const { rx, ry } = diff(x, y);
    t.is(rx.length, x.length + 1);
    t.is(ry.length, y.length + 1);
    t.false(rx[x.length]);
    t.false(ry[y.length]);
    t.true(rx.every(value => typeof value === 'boolean'));
    t.true(ry.every(value => typeof value === 'boolean'));
  }
});

test('diff: custom comparators receive original strings and preserve match values', (t) => {
  const eq = (a, b) => a.toLowerCase() === b.toLowerCase();
  const x = ['ALPHA', 'old', 'OMEGA'];
  const y = ['alpha', 'new', 'omega'];
  const result = edits(x, y, eq);
  t.deepEqual(result, [
    { op: Op.Match, x: 'ALPHA', y: 'alpha' },
    { op: Op.Delete, x: 'old', y: 'old' },
    { op: Op.Insert, x: 'new', y: 'new' },
    { op: Op.Match, x: 'OMEGA', y: 'omega' },
  ]);
  t.is(hunks(x, y, eq, 0).length, 1);
  t.deepEqual(diff(x, y, eq), { rx: [false, true, false, false], ry: [false, true, false, false] });
});

test('diff: custom byte-array comparators do not receive numeric IDs', (t) => {
  const x = [new Uint8Array([1, 2]), new Uint8Array([3])];
  const y = [new Uint8Array([1, 2]), new Uint8Array([4])];
  const eq = (a, b) => {
    t.true(a instanceof Uint8Array);
    t.true(b instanceof Uint8Array);
    return a.length === b.length && a.every((value, i) => value === b[i]);
  };
  const result = edits(x, y, eq);
  t.deepEqual(result.map(edit => edit.op), [Op.Match, Op.Delete, Op.Insert]);
  t.is(result[0].x, x[0]);
  t.is(result[0].y, y[0]);
});

test('diff: byte arrays use reference equality by default', (t) => {
  const shared = new Uint8Array([1]);
  t.deepEqual(diff([shared], [shared]), { rx: [false, false], ry: [false, false] });
  t.deepEqual(diff([shared], [new Uint8Array([1])]), { rx: [true, false], ry: [true, false] });
});

test('diff: numeric comparison uses values rather than interned IDs', (t) => {
  const eq = (a, b) => Math.abs(a - b) <= 1;
  t.deepEqual(diff([100], [200], eq), { rx: [true, false], ry: [true, false] });
  t.deepEqual(diff([100], [101], eq), { rx: [false, false], ry: [false, false] });
});

test('diff: directional and non-transitive comparators retain minimum edit distance', (t) => {
  const cases = [
    { x: [0, 2, 4, 1], y: [1, 3, 5, 0], eq: (a, b) => Math.abs(a - b) <= 1 },
    { x: [2, 0, 3, 1], y: [1, 2, 0, 4], eq: (a, b) => a < b },
    { x: ['abc', 'd', 'ab'], y: ['b', 'a', 'd'], eq: (a, b) => a.includes(b) },
  ];
  for (const { x, y, eq } of cases) {
    const result = edits(x, y, eq);
    t.is(result.filter(edit => edit.op !== Op.Match).length, minimumChanges(x, y, eq));
    t.true(result.filter(edit => edit.op === Op.Match).every(edit => eq(edit.x, edit.y)));
    t.deepEqual(result.filter(edit => edit.op !== Op.Insert).map(edit => edit.x), x);
    t.deepEqual(result.filter(edit => edit.op !== Op.Delete).map(edit => edit.y), y);
  }
});

test('diff: comparator arguments always come from the correct side and use no receiver', (t) => {
  const x = ['x1', 'x2', 'x3'];
  const y = ['y3', 'y2', 'y1'];
  const eq = function(a, b) {
    t.is(this, undefined);
    t.true(x.includes(a));
    t.true(y.includes(b));
    return a.slice(1) === b.slice(1);
  };
  const result = edits(x, y, eq);
  t.is(result.filter(edit => edit.op === Op.Match).length, 1);
});

test('diff: strict equality preserves NaN, signed zero, and infinity semantics', (t) => {
  const input = [NaN, -0, Infinity, -Infinity];
  t.deepEqual(diff(input, input), {
    rx: [true, false, false, false, false],
    ry: [true, false, false, false, false],
  });
  t.deepEqual(diff([-0], [0]), { rx: [false, false], ry: [false, false] });
  t.deepEqual(diff([-0], [0], Object.is), { rx: [true, false], ry: [true, false] });
  t.deepEqual(diff([NaN], [NaN], Object.is), { rx: [false, false], ry: [false, false] });
});

test('diff: an always-false comparator still compares a shared input', (t) => {
  const x = [1, 2, 3];
  t.deepEqual(diff(x, x, () => false), {
    rx: [true, true, true, false],
    ry: [true, true, true, false],
  });
});

test('diff: comparator errors propagate unchanged', (t) => {
  const error = new Error('comparison failed');
  t.throws(() => diff([1], [2], () => { throw error; }), { is: error });
});

test('diff: empty sides require no comparator calls', (t) => {
  const eq = () => { throw new Error('Unexpected comparison'); };
  t.deepEqual(diff([], [1, 2], eq), { rx: [false], ry: [true, true, false] });
  t.deepEqual(diff([1, 2], [], eq), { rx: [true, true, false], ry: [false] });
});

test('diff: sparse arrays and undefined elements remain aligned', (t) => {
  const x = new Array(3);
  const y = [undefined, 'inserted', undefined, undefined];
  const result = edits(x, y);
  t.deepEqual(result.map(edit => edit.op), [Op.Match, Op.Insert, Op.Match, Op.Match]);
  t.deepEqual(result.filter(edit => edit.op !== Op.Delete).map(edit => edit.y), y);
});

test('diff: frozen arrays and byte contents are not mutated', (t) => {
  const a = new Uint8Array([1, 2]);
  const b = new Uint8Array([3, 4]);
  const x = Object.freeze([a, b]);
  const y = Object.freeze([b, a]);
  t.notThrows(() => edits(x, y));
  t.notThrows(() => hunks(x, y));
  t.deepEqual(a, new Uint8Array([1, 2]));
  t.deepEqual(b, new Uint8Array([3, 4]));
});

test('diff: exhaustive binary sequences match an independent minimum-distance oracle', (t) => {
  const sequences = [[]];
  for (let length = 1; length <= 6; length++) {
    for (let bits = 0; bits < 2 ** length; bits++) {
      sequences.push(Array.from({ length }, (_, i) => (bits >> i) & 1));
    }
  }
  let cases = 0;
  for (const x of sequences) {
    for (const y of sequences) {
      const { rx, ry } = diff(x, y);
      t.deepEqual(x.filter((_, i) => !rx[i]), y.filter((_, i) => !ry[i]));
      t.is(rx.filter(Boolean).length + ry.filter(Boolean).length, minimumChanges(x, y));
      t.false(rx[x.length]);
      t.false(ry[y.length]);
      cases++;
    }
  }
  t.is(cases, 16129);
});

test('diff: seeded randomized edits reconstruct both inputs and remain minimal', (t) => {
  let seed = 0x13579BDF;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let i = 0; i < 2000; i++) {
    const x = Array.from({ length: random() % 41 }, () => (random() >>> 16) % 9);
    const y = Array.from({ length: random() % 41 }, () => (random() >>> 16) % 9);
    const result = edits(x, y);
    t.deepEqual(result.filter(edit => edit.op !== Op.Insert).map(edit => edit.x), x);
    t.deepEqual(result.filter(edit => edit.op !== Op.Delete).map(edit => edit.y), y);
    t.true(result.filter(edit => edit.op === Op.Match).every(edit => edit.x === edit.y));
    t.is(result.filter(edit => edit.op !== Op.Match).length, minimumChanges(x, y));
  }
});

test('diff: long equal and nearly equal inputs do not incur quadratic comparator calls', (t) => {
  const x = Array.from({ length: 10000 }, (_, i) => i);
  const y = x.slice();
  y[5000] = -1;
  let calls = 0;
  const eq = (a, b) => { calls++; return a === b; };
  const result = diff(x, y, eq);
  t.true(calls < x.length + 100);
  t.is(result.rx.filter(Boolean).length, 1);
  t.is(result.ry.filter(Boolean).length, 1);
});

test('hunks: zero context handles insertion-only ranges at the start, middle, and end', (t) => {
  const x = ['a', 'b'];
  for (let position = 0; position <= x.length; position++) {
    const y = [...x.slice(0, position), 'inserted', ...x.slice(position)];
    const result = hunks(x, y, undefined, 0);
    t.deepEqual(result, [{
      posX: position,
      endX: position,
      posY: position,
      endY: position + 1,
      edits: [{ op: Op.Insert, x: 'inserted', y: 'inserted' }],
    }]);
    verifyHunks(t, x, y, result);
  }
});

test('hunks: zero context handles deletion-only ranges at the start, middle, and end', (t) => {
  const x = ['a', 'b', 'c'];
  for (let position = 0; position < x.length; position++) {
    const y = [...x.slice(0, position), ...x.slice(position + 1)];
    const result = hunks(x, y, undefined, 0);
    t.deepEqual(result, [{
      posX: position,
      endX: position + 1,
      posY: position,
      endY: position,
      edits: [{ op: Op.Delete, x: x[position], y: x[position] }],
    }]);
    verifyHunks(t, x, y, result);
  }
});

test('hunks: touching context windows merge and separated windows do not', (t) => {
  for (const gap of [1, 2, 3, 4]) {
    const middle = Array.from({ length: gap }, (_, i) => `same${i}`);
    const x = ['old0', ...middle, 'old1'];
    const y = ['new0', ...middle, 'new1'];
    const result = hunks(x, y, undefined, 1);
    t.is(result.length, gap <= 2 ? 1 : 2);
    verifyHunks(t, x, y, result);
  }
});

test('hunks: large finite context includes the whole changed input without invalid coordinates', (t) => {
  const x = ['a', 'old', 'z'];
  const y = ['a', 'new', 'z'];
  const result = hunks(x, y, undefined, Number.MAX_SAFE_INTEGER);
  t.deepEqual(result, [{ posX: 0, endX: 3, posY: 0, endY: 3, edits: edits(x, y) }]);
});

test('hunks: invalid contexts are rejected before comparisons, including unchanged inputs', (t) => {
  for (const context of [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, null, '3']) {
    let called = false;
    const eq = (a, b) => { called = true; return a === b; };
    t.throws(() => hunks(['a'], ['b'], eq, context), { instanceOf: RangeError });
    t.throws(() => hunks([], [], undefined, context), { instanceOf: RangeError });
    t.false(called);
  }
});

test('hunks: context limits edit allocation for large inputs with a small change', (t) => {
  const x = Array.from({ length: 10000 }, (_, i) => i);
  const y = x.slice();
  y.splice(5000, 0, -1);
  const result = hunks(x, y);
  t.is(result.length, 1);
  t.is(result[0].edits.length, 7);
  t.is(result[0].posX, 4997);
  t.is(result[0].endX, 5003);
  t.is(result[0].posY, 4997);
  t.is(result[0].endY, 5004);
});

test('hunks: exhaustive small sequences reconstruct their target for multiple contexts', (t) => {
  const sequences = [[]];
  for (let length = 1; length <= 4; length++) {
    for (let bits = 0; bits < 2 ** length; bits++) {
      sequences.push(Array.from({ length }, (_, i) => (bits >> i) & 1));
    }
  }
  for (const x of sequences) {
    for (const y of sequences) {
      for (const context of [0, 1, 2, Number.MAX_SAFE_INTEGER]) {
        verifyHunks(t, x, y, hunks(x, y, undefined, context));
      }
    }
  }
});

test('diff: seeded arbitrary stable relations do not require equivalence-class interning', (t) => {
  let seed = 0xABCDEF01;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let i = 0; i < 1000; i++) {
    const relation = Array.from({ length: 25 }, () => Boolean((random() >>> 16) & 1));
    const eq = (a, b) => relation[a * 5 + b];
    const x = Array.from({ length: random() % 12 }, () => (random() >>> 16) % 5);
    const y = Array.from({ length: random() % 12 }, () => (random() >>> 16) % 5);
    const result = edits(x, y, eq);
    t.is(result.filter(edit => edit.op !== Op.Match).length, minimumChanges(x, y, eq));
    t.true(result.filter(edit => edit.op === Op.Match).every(edit => eq(edit.x, edit.y)));
    t.deepEqual(result.filter(edit => edit.op !== Op.Insert).map(edit => edit.x), x);
    t.deepEqual(result.filter(edit => edit.op !== Op.Delete).map(edit => edit.y), y);
  }
});
