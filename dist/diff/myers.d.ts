export default Myers;
export type SplitResult = {
    /**
     * The start index of the first array
     */
    s0: number;
    /**
     * The end index of the first array
     */
    s1: number;
    /**
     * The start index of the second array
     */
    t0: number;
    /**
     * The end index of the second array
     */
    t1: number;
};
export type InitResult = {
    /**
     * The start index of the first array
     */
    smin: number;
    /**
     * The end index of the first array
     */
    smax: number;
    /**
     * The start index of the second array
     */
    tmin: number;
    /**
     * The end index of the second array
     */
    tmax: number;
};
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
declare class Myers {
    /**
     * @param {number[]} xidx Mapping of s indices to result vector positions
     * @param {number[]} yidx Mapping of t indices to result vector positions
     * @param {string[] | number[] | Uint8Array[]} x0 The first array to compare
     * @param {string[] | number[] | Uint8Array[]} y0 The second array to compare
     * @param {import('./diff.js').EqualityFunction} equal Equality function to compare elements
     */
    constructor(xidx: number[], yidx: number[], x0: string[] | number[] | Uint8Array[], y0: string[] | number[] | Uint8Array[], equal: import("./diff.js").EqualityFunction);
    /** @type {string[] | number[] | Uint8Array[]} */
    x: string[] | number[] | Uint8Array[];
    /** @type {string[] | number[] | Uint8Array[]} */
    y: string[] | number[] | Uint8Array[];
    /** @type {number[]} */
    vf: number[];
    /** @type {number[]} */
    vb: number[];
    /** @type {number} */
    v0: number;
    /** @type {number[]} */
    xidx: number[];
    /** @type {number[]} */
    yidx: number[];
    /** @type {boolean[]} */
    resultVectorX: boolean[];
    /** @type {boolean[]} */
    resultVectorY: boolean[];
    /** @type {import('./diff.js').EqualityFunction} */
    equal: import("./diff.js").EqualityFunction;
    /** @type {number} */
    smin: number;
    /** @type {number} */
    smax: number;
    /** @type {number} */
    tmin: number;
    /** @type {number} */
    tmax: number;
    /**
     * Find an optimal d-path from (smin, tmin) to (smax, tmax).
     * @param {number} smin The start index of the first array
     * @param {number} smax The end index of the first array
     * @param {number} tmin The start index of the second array
     * @param {number} tmax The end index of the second array
     */
    compare(smin: number, smax: number, tmin: number, tmax: number): void;
    /**
     * Find the endpoints of sequence of diagonals in the middle of an optimal path from (smin, tmin) to (smax, tmax).
     * @param {number} smin The start index of the first array
     * @param {number} smax The end index of the first array
     * @param {number} tmin The start index of the second array
     * @param {number} tmax The end index of the second array
     * @returns {SplitResult} The endpoints of the sequence of diagonals
     */
    split(smin: number, smax: number, tmin: number, tmax: number): SplitResult;
}
//# sourceMappingURL=myers.d.ts.map