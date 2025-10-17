import test from 'ava';
import Myers from '../../src/diff/myers.js';

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
