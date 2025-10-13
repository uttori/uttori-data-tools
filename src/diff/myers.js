/**
 * @typedef {object} SplitResult
 * @property {number} s0 The start index of the first array
 * @property {number} s1 The end index of the first array
 * @property {number} t0 The start index of the second array
 * @property {number} t1 The end index of the second array
 */

/**
 * @typedef {object} InitResult
 * @property {number} smin The start index of the first array
 * @property {number} smax The end index of the first array
 * @property {number} tmin The start index of the second array
 * @property {number} tmax The end index of the second array
 */

/**
 * Myers Algorithm for computing diffs.
 * This is inspired by `znkr.io/diff` which is based on "An O(ND) Difference Algorithm and its Variations" by Eugene W. Myers.
 * We do not implement any additional heuristics like znkr.io/diff does, just the algorithm itself.
 * @class
 * @see {@link https://dl.acm.org/doi/abs/10.1007/BF01840446}
 * @see {@link https://flo.znkr.io/diff/}
 * @see {@link https://pkg.go.dev/znkr.io/diff}
 * @see {@link https://github.com/znkr/diff}
 * @see {@link https://tools.bartlweb.net/diff/}
 * @see {@link https://docs.moonbitlang.com/en/latest/example/myers-diff/myers-diff.html}
 * @see {@link https://blog.jcoglan.com/2017/03/22/myers-diff-in-linear-space-theory/}
 * @see {@link https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/}
 */
class Myers {
  // Inputs to compare.
  /** @type {string[] | number[] | Uint8Array[]} */
  x = [];
  /** @type {string[] | number[] | Uint8Array[]} */
  y = [];

  // arrays for forwards and backwards iteration respectively.
  // An array stores the furthest reaching endpoint of a d-path in diagonal k in v[v0+k] where v0 is the offset that translates k in [-d, d] to k0 = v0+k in [0, 2*d].
  // The endpoints only store the s-coordinate since t = s - k.
  /** @type {number[]} */
  vf = [];
  /** @type {number[]} */
  vb = [];
  /** @type {number} */
  v0 = 0;

  // Mapping of s, t indices to the location in the result vectors.
  /** @type {number[]} */
  xidx = [];
  /** @type {number[]} */
  yidx = [];

  // Result vectors.
  /** @type {boolean[]} */
  resultVectorX = [];
  /** @type {boolean[]} */
  resultVectorY = [];

  // Equality function
  /** @type {import('./diff.js').EqualityFunction} */
  equal;

  // Bounds after stripping common prefix/suffix
  /** @type {number} */
  smin = 0;
  /** @type {number} */
  smax = 0;
  /** @type {number} */
  tmin = 0;
  /** @type {number} */
  tmax = 0;

  /**
   * @param {number[]} xidx Mapping of s indices to result vector positions
   * @param {number[]} yidx Mapping of t indices to result vector positions
   * @param {string[] | number[] | Uint8Array[]} x0 The first array to compare
   * @param {string[] | number[] | Uint8Array[]} y0 The second array to compare
   * @param {import('./diff.js').EqualityFunction} equal Equality function to compare elements
   */
  constructor(xidx, yidx, x0, y0, equal) {
    this.xidx = xidx;
    this.yidx = yidx;
    this.equal = equal;
    this.resultVectorX = new Array(x0.length + 1).fill(false);
    this.resultVectorY = new Array(y0.length + 1).fill(false);

    // Initialize bounds
    let smin = 0;
    let tmin = 0;
    let smax = x0.length;
    let tmax = y0.length;

    // Strip common prefix.
    while (smin < smax && tmin < tmax && equal(x0[smin], y0[tmin])) {
      smin++;
      tmin++;
    }

    // Strip common suffix.
    while (smax > smin && tmax > tmin && equal(x0[smax - 1], y0[tmax - 1])) {
      smax--;
      tmax--;
    }

    this.smin = smin;
    this.smax = smax;
    this.tmin = tmin;
    this.tmax = tmax;

    const N = smax - smin;
    const M = tmax - tmin;
    const diagonals = N + M;
    // +1 for the middle point and +2 for the borders
    const vlen = 2 * diagonals + 3;
    // allocate space for vf and vb with a single allocation
    const buf = new Array(2 * vlen).fill(0);

    this.x = x0;
    this.y = y0;
    this.vf = buf.slice(0, vlen);
    this.vb = buf.slice(vlen);
    // +1 for the middle point
    this.v0 = diagonals + 1;
  }

  /**
   * Find an optimal d-path from (smin, tmin) to (smax, tmax).
   * @param {number} smin The start index of the first array
   * @param {number} smax The end index of the first array
   * @param {number} tmin The start index of the second array
   * @param {number} tmax The end index of the second array
   */
  compare(smin, smax, tmin, tmax) {
    if (smin === smax) {
      // Data S is empty, therefore everything in tmin to tmax is an insertion.
      for (let t = tmin; t < tmax; t++) {
        this.resultVectorY[this.yidx[t]] = true;
      }
    } else if (tmin === tmax) {
      // Data T is empty, therefore everything in smin to smax is a deletion.
      for (let s = smin; s < smax; s++) {
        this.resultVectorX[this.xidx[s]] = true;
      }
    } else {
      // Use split to divide the input into three pieces:
      //
      //   (1) A, possibly empty, rect (smin, tmin) to (s0, t0)
      //   (2) A, possibly empty, sequence of diagonals (matches) (s0, t0) to (s1, t1)
      //   (3) A, possibly empty, rect (s1, t1) to (smax, tmax)
      //
      // (1) and (3) will not have a common suffix or a common prefix, so we can use them directly as inputs to compare.
      const { s0, s1, t0, t1 } = this.split(smin, smax, tmin, tmax);

      // Recurse into (1) and (3).
      this.compare(smin, s0, tmin, t0);
      this.compare(s1, smax, t1, tmax);
    }
  }

  /**
   * Find the endpoints of sequence of diagonals in the middle of an optimal path from (smin, tmin) to (smax, tmax).
   * @param {number} smin The start index of the first array
   * @param {number} smax The end index of the first array
   * @param {number} tmin The start index of the second array
   * @param {number} tmax The end index of the second array
   * @returns {SplitResult} The endpoints of the sequence of diagonals
   */
  split(smin, smax, tmin, tmax) {
    // Old length
    const N = smax - smin;
    // New length
    const M = tmax - tmin;
    const x = this.x;
    const y = this.y;
    const vf = this.vf;
    const vb = this.vb;
    const v0 = this.v0;

    // Bounds for k. Since t = s - k, we can determine the min and max for k using: k = s - t.
    const kmin = smin - tmax;
    const kmax = smax - tmin;

    // In contrast to the paper, we're going to number all diagonals with consistent k's by
    // centering the forwards and backwards searches around different midpoints.
    // This way, we don't need to convert k's when checking for overlap and it improves readability.
    const fmid = smin - tmin;
    const bmid = smax - tmax;
    let fmin = fmid;
    let fmax = fmid;
    let bmin = bmid;
    let bmax = bmid;

    // We know from Corollary 1 that the optimal diff length is going to be odd or even as (N-M) is odd or even.
    // We're going to use this below to decide on when to check for path overlaps.
    const odd = (N - M) % 2 !== 0;

    // Since we can assume that split is not called with a common prefix or suffix,
    // we know that x != y, therefore there is no 0-path.
    // Furthermore, the d=0 iteration would result in the following trivial result:
    vf[v0 + fmid] = smin;
    vb[v0 + bmid] = smax;
    // Consequently, we can start at d=1 which allows us to omit special handling of d==0 in the hot k-loops below.
    //
    // We know from Lemma 3 that there's a d-path with d = ⌈N + M⌉/2.
    // Therefore, we can omit the loop condition and instead blindly increment d.
    for (let d = 1; ; d++) {
      // Each loop iteration, we're trying to find a d-path by first searching forwards and then searching backwards for a d-path.
      // If two paths overlap, we have found a d-path, if not we're going to continue searching.
      //
      // Forwards Iteration:
      // First determine which diagonals k to search. Originally, we would search k = [fmid-d,
      // fmid+d] in steps of 2, but that would lead us to move outside the edit grid and would
      // require more memory, more work, and special handling for s and t coordinates outside x and y.
      //
      // Instead we put a few tighter bounds on k.
      // We need to make sure to pick a start and end point in the original search space.
      // Since we're searching in steps of 2, this requires changing the min and max for k when outside the boundary.
      //
      // Additionally, we're also initializing the array such that we can avoid a special case
      // in the k-loop below (for that we allocated an extra two elements up front):
      // It let's us handle the top and left hand border with the same logic as any other value.
      if (fmin > kmin) {
        fmin--;
        vf[v0 + fmin - 1] = Number.MIN_SAFE_INTEGER;
      } else {
        fmin++;
      }
      if (fmax < kmax) {
        fmax++;
        vf[v0 + fmax + 1] = Number.MIN_SAFE_INTEGER;
      } else {
        fmax--;
      }
      // The k-loop searches for the furthest reaching d-path from (0,0) to (N,M) in diagonal k.
      //
      // The array, v[i] = vf[v0+fmid+i] (modulo bounds on k), contains the endpoints for the
      // furthest reaching (d-1)-path in elements v[-d-1], v[-d+1], ..., v[d-1], v[d+1].
      // We know from Lemma 1 that these elements will be disjoined from where we're going to store the
      // endpoint for the furthest reaching d-path that we're computing here.
      for (let k = fmin; k <= fmax; k += 2) {
        const k0 = k + v0; // k as an index into vf
        // According to Lemma 2 there are two possible furthest reaching d-paths:
        //
        //   1) A furthest reaching d-path on diagonal k-1, followed by a horizontal edge,
        //      followed by the longest possible sequence of diagonals.
        //   2) A furthest reaching d-path on diagonal k+1, followed by a vertical edge,
        //      followed by the longest possible sequence of diagonals
        //
        // First find the endpoint of the furthest reaching d-path followed by a horizontal or vertical edge.
        /** @type {number} */
        let s;
        if (vf[k0 - 1] < vf[k0 + 1]) {
          // Case 2. The vertical edge is implied by t = s - k.
          s = vf[k0 + 1];
        } else {
          // Case 1 or case 2 when v[k-1] == v[k+1]. Handling the v[k-1] == v[k+1] case here prioritizes deletions over insertions.
          s = vf[k0 - 1] + 1;
        }
        let t = s - k;

        // Then follow the diagonals as long as possible.
        const s0 = s;
        const t0 = t;
        while (s < smax && t < tmax && this.equal(x[s], y[t])) {
          s++;
          t++;
        }

        // Then store the endpoint of the furthest reaching d-path.
        vf[k0] = s;

        // Potentially, check for an overlap with a backwards d-path. We're done when we found it.
        if (odd && bmin <= k && k <= bmax && s >= vb[k0]) {
          return {
            s0: s0,
            s1: s,
            t0: t0,
            t1: t,
          };
        }
      }

      // Backwards iteration.
      // This is mostly analogous to the forward iteration.
      if (bmin > kmin) {
        bmin--;
        vb[v0 + bmin - 1] = Number.MAX_SAFE_INTEGER;
      } else {
        bmin++;
      }
      if (bmax < kmax) {
        bmax++;
        vb[v0 + bmax + 1] = Number.MAX_SAFE_INTEGER;
      } else {
        bmax--;
      }
      for (let k = bmin; k <= bmax; k += 2) {
        const k0 = k + v0;
        /** @type {number} */
        let s;
        if (vb[k0 - 1] < vb[k0 + 1]) {
          s = vb[k0 - 1];
        } else {
          s = vb[k0 + 1] - 1;
        }
        let t = s - k;

        const s0 = s, t0 = t;
        while (s > smin && t > tmin && this.equal(x[s - 1], y[t - 1])) {
          s--;
          t--;
        }

        vb[k0] = s;

        if (!odd && fmin <= k && k <= fmax && s <= vf[v0 + k]) {
          return {
            s0: s,
            s1: s0,
            t0: t,
            t1: t0,
          };
        }
      }
    }
  }
}

export default  Myers;
