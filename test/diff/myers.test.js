import test from 'ava';
import Myers from '../../dist/diff/myers.js';

/**
 * Helper function to create an array with repeated patterns
 * @param {string} pattern - Pattern to repeat
 * @param {number} count - Number of times to repeat
 * @returns {string[]}
 */
function repeat(pattern, count) {
  return Array.from({ length: count }, (_, i) => `${pattern}${i}`);
}

/**
 * Helper to verify result vectors represent a valid diff
 * @param {import('ava').ExecutionContext<unknown>} t Test function
 * @param {boolean[]} rx Result vector for x
 * @param {boolean[]} ry Result vector for y
 * @param {Array<string|number|Uint8Array>} x Original x array
 * @param {Array<string|number|Uint8Array>} y Original y array
 */
function verifyResultVectors(t, rx, ry, x, y) {
  // Result vectors should have correct length
  t.is(rx.length, x.length + 1);
  t.is(ry.length, y.length + 1);

  // Extract operations from result vectors
  let xi = 0;
  let yi = 0;

  while (xi < x.length || yi < y.length) {
    if (xi < x.length && yi < y.length && !rx[xi] && !ry[yi]) {
      // Match
      t.is(x[xi], y[yi], `Match failed at x[${xi}] vs y[${yi}]`);
      xi++;
      yi++;
    } else if (xi < x.length && rx[xi]) {
      // Delete from x
      xi++;
    } else if (yi < y.length && ry[yi]) {
      // Insert from y
      yi++;
    } else {
      t.fail(`Invalid result vectors at xi=${xi}, yi=${yi}`);
    }
  }
}

test('Myers: identical sequences', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'b', 'c'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  // All should be matches (no marks in result vectors)
  t.true(m.resultVectorX.every(v => !v));
  t.true(m.resultVectorY.every(v => !v));
});

test('Myers: completely different sequences', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['x', 'y', 'z'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  // All x items should be deleted
  t.true(m.resultVectorX.slice(0, x.length).every(v => v));
  // All y items should be inserted
  t.true(m.resultVectorY.slice(0, y.length).every(v => v));

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: single element change', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'x', 'c'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  t.truthy(m);
  t.is(m.resultVectorX.length, x.length + 1);
  t.is(m.resultVectorY.length, y.length + 1);

  // 'a' matches (not marked)
  t.false(m.resultVectorX[0]);
  t.false(m.resultVectorY[0]);

  // 'b' deleted, 'x' inserted
  t.true(m.resultVectorX[1]);
  t.true(m.resultVectorY[1]);

  // 'c' matches (not marked)
  t.false(m.resultVectorX[2]);
  t.false(m.resultVectorY[2]);

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: large input with heuristics', (t) => {
  // Test with larger input to ensure heuristics work on realistic data
  const size = 100;
  const x = repeat('line', size);
  const y = [...repeat('line', 50), ...repeat('modified', 10), ...repeat('line', 40)];

  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: custom heuristic parameters', (t) => {
  const x = repeat('x', 30);
  const y = repeat('y', 30);

  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  // Test with custom parameters
  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: insertions only', (t) => {
  const x = ['a', 'b', 'c'];
  const y = ['a', 'x', 'y', 'z', 'b', 'c'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: deletions only', (t) => {
  const x = ['a', 'x', 'y', 'z', 'b', 'c'];
  const y = ['a', 'b', 'c'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: empty sequences', (t) => {
  const x = [];
  const y = [];
  const xidx = [];
  const yidx = [];

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  t.is(m.resultVectorX.length, 1);
  t.is(m.resultVectorY.length, 1);
});

test('Myers: one empty sequence', (t) => {
  const x = ['a', 'b', 'c'];
  const y = [];
  const xidx = x.map((_, i) => i);
  const yidx = [];

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  // All items in x should be marked as deleted
  t.true(m.resultVectorX.slice(0, x.length).every(v => v));

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: complex interleaved changes', (t) => {
  const x = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const y = ['a', 'x', 'c', 'y', 'e', 'z', 'g', 'w'];
  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: high quality diagonal in forward direction', (t) => {
  // Create input that will have many changes, then a long matching sequence
  // This should trigger the GOOD_DIAGONAL heuristic and find a good forward diagonal
  const prefix = ['x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9'];
  const diagonal = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11'];
  const suffix = ['y0', 'y1', 'y2', 'y3', 'y4'];

  const x = [...prefix, ...diagonal, ...suffix];
  const y = [...['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9'], ...diagonal, ...['b0', 'b1', 'b2', 'b3', 'b4']];

  const xidx = x.map((_, i) => i);
  const yidx = y.map((_, i) => i);

  const m = new Myers(xidx, yidx, x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  // Verify the diagonal section matched
  for (let i = 10; i < 22; i++) {
    t.false(m.resultVectorX[i], `Expected match at x[${i}]`);
    t.false(m.resultVectorY[i], `Expected match at y[${i}]`);
  }

  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

test('Myers: sparse index mappings allocate dense vectors through the sentinel', (t) => {
  const m = new Myers([2, 5], [1, 4], ['a', 'b'], ['a', 'c'], (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);
  t.deepEqual(m.resultVectorX, [false, false, false, false, false, true, false]);
  t.deepEqual(m.resultVectorY, [false, false, false, false, true, false]);
  t.is(Object.keys(m.resultVectorX).length, m.resultVectorX.length);
  t.is(Object.keys(m.resultVectorY).length, m.resultVectorY.length);
});

test('Myers: invalid index mappings fail before comparison', (t) => {
  const eq = (a, b) => a === b;
  for (const indices of [[], [0, 1], [-1], [0.5], [NaN], [Infinity], [0xFFFFFFFE]]) {
    t.throws(() => new Myers(indices, [0], ['a'], ['b'], eq), { instanceOf: RangeError });
    t.throws(() => new Myers([0], indices, ['a'], ['b'], eq), { instanceOf: RangeError });
  }
});

test('Myers: compare accepts full untrimmed bounds', (t) => {
  const x = ['same', 'a', 'b', 'c', 'end'];
  const y = ['same', 'a', 'changed', 'c', 'end'];
  const m = new Myers(x.map((_, i) => i), y.map((_, i) => i), x, y, (a, b) => a === b);
  m.compare(0, x.length, 0, y.length);
  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
  t.deepEqual(m.resultVectorX, [false, false, true, false, false, false]);
  t.deepEqual(m.resultVectorY, [false, false, true, false, false, false]);
});

test('Myers: compare accepts identical full bounds without splitting forever', (t) => {
  const x = ['a', 'b', 'c'];
  const m = new Myers([0, 1, 2], [0, 1, 2], x, x, (a, b) => a === b);
  m.compare(0, x.length, 0, x.length);
  t.deepEqual(m.resultVectorX, [false, false, false, false]);
  t.deepEqual(m.resultVectorY, [false, false, false, false]);
});

test('Myers: shifted subranges resize an initially empty workspace', (t) => {
  const x = Array.from({ length: 20 }, (_, i) => i);
  const indices = x.map((_, i) => i);
  for (const [smin, smax, tmin, tmax] of [[15, 18, 0, 3], [0, 3, 15, 18]]) {
    const m = new Myers(indices, indices, x, x, (a, b) => a === b);
    t.is(m.vf.length, 0);
    m.compare(smin, smax, tmin, tmax);
    for (let i = 0; i <= x.length; i++) {
      t.is(m.resultVectorX[i], i >= smin && i < smax);
      t.is(m.resultVectorY[i], i >= tmin && i < tmax);
    }
    t.is(m.vf.length, smax - smin + tmax - tmin + 3);
    t.is(m.vb.length, m.vf.length);
  }
});

test('Myers: invalid comparison and split bounds throw RangeError', (t) => {
  const m = new Myers([0], [0], ['a'], ['b'], (a, b) => a === b);
  for (const bounds of [[-1, 1, 0, 1], [1, 0, 0, 1], [0, 2, 0, 1], [0, 1, -1, 1],
    [0, 1, 1, 0], [0, 1, 0, 2], [NaN, 1, 0, 1], [0, 1.5, 0, 1],
    [0, 1, Infinity, 1], [0, 1, 0, NaN]]) {
    t.throws(() => m.compare(...bounds), { instanceOf: RangeError });
    t.throws(() => m.split(...bounds), { instanceOf: RangeError });
  }
});

test('Myers: split supports empty ranges and common prefixes or suffixes', (t) => {
  const cases = [
    { x: [], y: [], expected: { s0: 0, s1: 0, t0: 0, t1: 0 } },
    { x: [], y: ['a', 'b'], expected: { s0: 0, s1: 0, t0: 1, t1: 1 } },
    { x: ['a', 'b'], y: [], expected: { s0: 1, s1: 1, t0: 0, t1: 0 } },
    { x: ['a', 'b'], y: ['a', 'b'], expected: { s0: 0, s1: 2, t0: 0, t1: 2 } },
    { x: ['a', 'b'], y: ['a', 'c'], expected: { s0: 0, s1: 1, t0: 0, t1: 1 } },
    { x: ['a', 'b'], y: ['c', 'b'], expected: { s0: 1, s1: 2, t0: 1, t1: 2 } },
  ];
  for (const { x, y, expected } of cases) {
    const m = new Myers(x.map((_, i) => i), y.map((_, i) => i), x, y, (a, b) => a === b);
    t.deepEqual(m.split(0, x.length, 0, y.length), expected);
    t.true(m.resultVectorX.every(value => value === false));
    t.true(m.resultVectorY.every(value => value === false));
  }
});

test('Myers: direct custom comparator receives original values in a stable direction', (t) => {
  const x = ['X0', 'X1', 'X2', 'X3'];
  const y = ['y3', 'y2', 'y1', 'y0'];
  const equal = function(a, b) {
    t.is(this, undefined);
    t.true(a.startsWith('X'));
    t.true(b.startsWith('y'));
    return a.slice(1) === b.slice(1);
  };
  const m = new Myers([0, 1, 2, 3], [0, 1, 2, 3], x, y, equal);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);
  t.is(m.resultVectorX.filter(Boolean).length, 3);
  t.is(m.resultVectorY.filter(Boolean).length, 3);
});

test('Myers: unbalanced inputs preserve a single interior match', (t) => {
  const long = Array.from({ length: 2000 }, (_, i) => `line${i}`);
  const short = ['line1000'];
  for (const [x, y] of [[short, long], [long, short]]) {
    const m = new Myers(x.map((_, i) => i), y.map((_, i) => i), x, y, (a, b) => a === b);
    m.compare(m.smin, m.smax, m.tmin, m.tmax);
    verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
    t.is(m.resultVectorX.filter(Boolean).length + m.resultVectorY.filter(Boolean).length, 1999);
  }
});

test('Myers: only insertion or deletion after trimming needs no diagonal workspace', (t) => {
  for (const [x, y] of [[[], [1, 2]], [[1, 2], []], [[1, 2], [1, 3, 2]], [[1, 3, 2], [1, 2]]]) {
    const m = new Myers(x.map((_, i) => i), y.map((_, i) => i), x, y, (a, b) => a === b);
    t.is(m.vf.length, 0);
    t.is(m.vb.length, 0);
    m.compare(m.smin, m.smax, m.tmin, m.tmax);
    verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
  }
});

test('Myers: long common edges keep workspace proportional to the changed region', (t) => {
  const x = Array.from({ length: 50000 }, (_, i) => i);
  const y = x.slice();
  y[25000] = -1;
  const m = new Myers(x.map((_, i) => i), y.map((_, i) => i), x, y, (a, b) => a === b);
  t.is(m.smin, 25000);
  t.is(m.smax, 25001);
  t.is(m.vf.length, 5);
  t.is(m.vb.length, 5);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);
  t.is(m.resultVectorX.filter(Boolean).length, 1);
  t.is(m.resultVectorY.filter(Boolean).length, 1);
});

test('Myers: comparison uses an explicit stack rather than recursively invoking compare', (t) => {
  class CountingMyers extends Myers {
    calls = 0;

    compare(...bounds) {
      this.calls++;
      super.compare(...bounds);
    }
  }
  const x = Array.from({ length: 2000 }, (_, i) => i);
  const y = x.map(value => value % 7 === 0 ? -value - 1 : value);
  const m = new CountingMyers(x.map((_, i) => i), y.map((_, i) => i), x, y, (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);
  t.is(m.calls, 1);
  verifyResultVectors(t, m.resultVectorX, m.resultVectorY, x, y);
});

/**
 * Computes edit distance with a dynamic-programming row, independent of Myers.
 * @param {number[]} x The first input
 * @param {number[]} y The second input
 * @returns {number} Minimum insertion/deletion count.
 */
function minimumDistance(x, y) {
  const row = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= y.length; j++) {
      const above = row[j];
      row[j] = x[i - 1] === y[j - 1] ? diagonal : Math.min(above, row[j - 1]) + 1;
      diagonal = above;
    }
  }
  return row[y.length];
}

test('Myers: exhaustive split endpoints lie on minimum-cost paths, including shifted ranges', (t) => {
  const sequences = [[]];
  for (let length = 1; length <= 5; length++) {
    for (let bits = 0; bits < 2 ** length; bits++) {
      sequences.push(Array.from({ length }, (_, i) => (bits >> i) & 1));
    }
  }
  for (const left of sequences) {
    for (const right of sequences) {
      const x = [9, 8, 7, ...left, 6];
      const y = [5, ...right, 4];
      const m = new Myers(x.map((_, i) => i), y.map((_, i) => i), x, y, (a, b) => a === b);
      const { s0, s1, t0, t1 } = m.split(3, x.length - 1, 1, y.length - 1);
      t.true(s0 >= 3 && s0 <= s1 && s1 <= x.length - 1);
      t.true(t0 >= 1 && t0 <= t1 && t1 <= y.length - 1);
      t.is(s1 - s0, t1 - t0);
      t.deepEqual(x.slice(s0, s1), y.slice(t0, t1));
      const splitDistance = minimumDistance(x.slice(3, s0), y.slice(1, t0)) +
        minimumDistance(x.slice(s1, -1), y.slice(t1, -1));
      t.is(splitDistance, minimumDistance(left, right));
    }
  }
});

test('Myers: seeded arbitrary subranges match an independent edit-distance oracle', (t) => {
  let seed = 0xDEADBEEF;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let i = 0; i < 2000; i++) {
    const x = Array.from({ length: random() % 30 }, () => (random() >>> 16) % 5);
    const y = Array.from({ length: random() % 30 }, () => (random() >>> 16) % 5);
    const smin = random() % (x.length + 1);
    const smax = smin + random() % (x.length - smin + 1);
    const tmin = random() % (y.length + 1);
    const tmax = tmin + random() % (y.length - tmin + 1);
    const m = new Myers(x.map((_, j) => j), y.map((_, j) => j), x, y, (a, b) => a === b);
    m.compare(smin, smax, tmin, tmax);
    t.deepEqual(
      x.slice(smin, smax).filter((_, j) => !m.resultVectorX[smin + j]),
      y.slice(tmin, tmax).filter((_, j) => !m.resultVectorY[tmin + j]),
    );
    t.is(m.resultVectorX.filter(Boolean).length + m.resultVectorY.filter(Boolean).length,
      minimumDistance(x.slice(smin, smax), y.slice(tmin, tmax)));
    t.true(m.resultVectorX.slice(0, smin).every(value => !value));
    t.true(m.resultVectorX.slice(smax).every(value => !value));
    t.true(m.resultVectorY.slice(0, tmin).every(value => !value));
    t.true(m.resultVectorY.slice(tmax).every(value => !value));
  }
});


test('Myers: reordered and repeated index mappings retain their existing mapping semantics', (t) => {
  const m = new Myers([5, 2], [4, 1], ['a', 'b'], ['a', 'c'], (a, b) => a === b);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);
  t.deepEqual(m.resultVectorX, [false, false, true, false, false, false, false]);
  t.deepEqual(m.resultVectorY, [false, true, false, false, false, false]);

  const repeated = new Myers([0, 0], [], ['a', 'b'], [], (a, b) => a === b);
  repeated.compare(repeated.smin, repeated.smax, repeated.tmin, repeated.tmax);
  t.deepEqual(repeated.resultVectorX, [true, false, false]);
});
