import type { EqualityFunction } from "./diff.js";

export interface SplitResult {
  /** The start index of the first array. */
  s0: number;
  /** The end index of the first array. */
  s1: number;
  /** The start index of the second array. */
  t0: number;
  /** The end index of the second array. */
  t1: number;
}

export interface InitResult {
  /** The start index of the first array. */
  smin: number;
  /** The end index of the first array. */
  smax: number;
  /** The start index of the second array. */
  tmin: number;
  /** The end index of the second array. */
  tmax: number;
}

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
  x: string[] | number[] | Uint8Array[] = [];
  y: string[] | number[] | Uint8Array[] = [];

  // Arrays for forwards and backwards iteration respectively.
  // An array stores the furthest reaching endpoint of a d-path in diagonal k in v[v0+k] where v0 is the offset that translates k in [-d, d] to k0 = v0+k in [0, 2*d].
  // The endpoints only store the s-coordinate since t = s - k.
  vf: number[] = [];
  vb: number[] = [];
  v0: number = 0;

  // Mapping of s, t indices to the location in the result vectors.
  xidx: number[] = [];
  yidx: number[] = [];

  // Result vectors.
  resultVectorX: boolean[] = [];
  resultVectorY: boolean[] = [];

  // Equality function
  equal: EqualityFunction;

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
   * @param xidx Mapping of s indices to result vector positions
   * @param yidx Mapping of t indices to result vector positions
   * @param x0 The first array to compare
   * @param y0 The second array to compare
   * @param equal Equality function to compare elements
   */
  constructor(
    xidx: number[],
    yidx: number[],
    x0: string[] | number[] | Uint8Array[],
    y0: string[] | number[] | Uint8Array[],
    equal: EqualityFunction,
  ) {
    this.xidx = xidx;
    this.yidx = yidx;
    this.equal = equal;
    this.resultVectorX = this.createResultVector(xidx, x0.length);
    this.resultVectorY = this.createResultVector(yidx, y0.length);

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
    const vlen = N === 0 || M === 0 ? 0 : diagonals + 3;
    // Allocate space for vf and vb without copying a temporary combined buffer.

    this.x = x0;
    this.y = y0;
    this.vf = new Array<number>(vlen).fill(0);
    this.vb = new Array<number>(vlen).fill(0);
    // +1 for the middle point
    this.v0 = M + 1;
  }

  /**
   * Find an optimal d-path from (smin, tmin) to (smax, tmax).
   * @param smin The start index of the first array
   * @param smax The end index of the first array
   * @param tmin The start index of the second array
   * @param tmax The end index of the second array
   */
  compare(smin: number, smax: number, tmin: number, tmax: number): void {
    this.validateBounds(smin, smax, tmin, tmax);
    const pending: number[] = [];
    const equal = this.equal;
    const x = this.x;
    const y = this.y;

    for (;;) {
      // Strip common prefix/suffix for callers that pass untrimmed subranges.
      while (smin < smax && tmin < tmax && equal(x[smin], y[tmin])) {
        smin++;
        tmin++;
      }
      while (smax > smin && tmax > tmin && equal(x[smax - 1], y[tmax - 1])) {
        smax--;
        tmax--;
      }

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
        // (1) and (3) can retain a common suffix or prefix when the middle snake is empty.
        // Strip those common edges in compare before splitting the subranges again.
        const { s0, s1, t0, t1 } = this.split(smin, smax, tmin, tmax);

        // Recurse into (1) and (3) using an explicit stack instead of the JavaScript call stack.
        // Process (1) first, preserving the original left-before-right traversal.
        if (s1 < smax || t1 < tmax) {
          pending.push(s1, smax, t1, tmax);
        }
        smax = s0;
        tmax = t0;
        continue;
      }

      if (pending.length === 0) {
        return;
      }
      tmax = pending.pop()!;
      tmin = pending.pop()!;
      smax = pending.pop()!;
      smin = pending.pop()!;
    }
  }

  /**
   * Find the endpoints of a sequence of diagonals on an optimal path from (smin, tmin) to (smax, tmax).
   * @param smin The start index of the first array
   * @param smax The end index of the first array
   * @param tmin The start index of the second array
   * @param tmax The end index of the second array
   * @returns The endpoints of the sequence of diagonals
   */
  split(smin: number, smax: number, tmin: number, tmax: number): SplitResult {
    this.validateBounds(smin, smax, tmin, tmax);

    const equal = this.equal;
    const x = this.x;
    const y = this.y;

    // Public callers may supply empty ranges or ranges with common edges.
    if (smin === smax || tmin === tmax) {
      const s = smin + Math.floor((smax - smin) / 2);
      const t = tmin + Math.floor((tmax - tmin) / 2);
      return { s0: s, s1: s, t0: t, t1: t };
    }
    let s = smin;
    let t = tmin;
    while (s < smax && t < tmax && equal(x[s], y[t])) {
      s++;
      t++;
    }
    if (s > smin) {
      return { s0: smin, s1: s, t0: tmin, t1: t };
    }
    s = smax;
    t = tmax;
    while (s > smin && t > tmin && equal(x[s - 1], y[t - 1])) {
      s--;
      t--;
    }
    if (s < smax) {
      return { s0: s, s1: smax, t0: t, t1: tmax };
    }

    // Old length
    const N = smax - smin;
    // New length
    const M = tmax - tmin;
    // Recenter the workspace for this subrange, including shifted absolute diagonals.
    // A public compare/split call may cover more input than the constructor's trimmed bounds.
    const vlen = N + M + 3;
    if (this.vf.length < vlen) {
      this.vf = new Array<number>(vlen).fill(0);
      this.vb = new Array<number>(vlen).fill(0);
    }
    const vf = this.vf;
    const vb = this.vb;
    const v0 = M + 1 - (smin - tmin);
    this.v0 = v0;

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
        while (s < smax && t < tmax && equal(x[s], y[t])) {
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

        const s0 = s,
          t0 = t;
        while (s > smin && t > tmin && equal(x[s - 1], y[t - 1])) {
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

  /**
   * Creates a dense result vector with a false sentinel after the highest mapped element.
   * @param indices Mapping of input indices to result vector positions
   * @param length The number of input elements
   * @returns The initialized result vector.
   */
  private createResultVector(indices: number[], length: number): boolean[] {
    if (indices.length !== length) {
      throw new RangeError("Index mapping length must match the input length");
    }
    let maximum = length - 1;
    for (const index of indices) {
      // Reserve one array element for the sentinel; JavaScript array lengths are 32-bit unsigned.
      if (!Number.isInteger(index) || index < 0 || index > 0xfffffffd) {
        throw new RangeError("Index mappings must contain valid non-negative array indices");
      }
      if (index > maximum) {
        maximum = index;
      }
    }
    return new Array<boolean>(maximum + 2).fill(false);
  }

  /**
   * Validates half-open comparison bounds before entering the search loops.
   * @param smin The start index of the first array
   * @param smax The end index of the first array
   * @param tmin The start index of the second array
   * @param tmax The end index of the second array
   */
  private validateBounds(smin: number, smax: number, tmin: number, tmax: number): void {
    if (
      !Number.isInteger(smin) ||
      !Number.isInteger(smax) ||
      !Number.isInteger(tmin) ||
      !Number.isInteger(tmax) ||
      smin < 0 ||
      smin > smax ||
      smax > this.x.length ||
      tmin < 0 ||
      tmin > tmax ||
      tmax > this.y.length
    ) {
      throw new RangeError("Comparison bounds must be valid integer input ranges");
    }
  }
}

export default Myers;
