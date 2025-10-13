export default Myers;
export type SplitResult = {
    s0: number;
    s1: number;
    t0: number;
    t1: number;
};
export type InitResult = {
    smin: number;
    smax: number;
    tmin: number;
    tmax: number;
};
/**
 * @typedef {object} SplitResult
 * @property {number} s0
 * @property {number} s1
 * @property {number} t0
 * @property {number} t1
 */
/**
 * @typedef {object} InitResult
 * @property {number} smin
 * @property {number} smax
 * @property {number} tmin
 * @property {number} tmax
 */
/**
 * Myers algorithm implementation for diff computation.
 * This is a full implementation based on "An O(ND) Difference Algorithm and its Variations"
 * by Eugene W. Myers.
 */
declare class Myers {
    /**
     * @param {number[]} xidx - Mapping of s indices to result vector positions
     * @param {number[]} yidx - Mapping of t indices to result vector positions
     * @param {string[] | number[] | Uint8Array[]} x0 - The first array to compare
     * @param {string[] | number[] | Uint8Array[]} y0 - The second array to compare
     * @param {function(string | number | Uint8Array, string | number | Uint8Array): boolean} eq - Equality function to compare elements
     */
    constructor(xidx: number[], yidx: number[], x0: string[] | number[] | Uint8Array[], y0: string[] | number[] | Uint8Array[], eq: (arg0: string | number | Uint8Array, arg1: string | number | Uint8Array) => boolean);
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
    /** @type {function(string | number | Uint8Array, string | number | Uint8Array): boolean} */
    eq: (arg0: string | number | Uint8Array, arg1: string | number | Uint8Array) => boolean;
    /** @type {number} */
    smin: number;
    /** @type {number} */
    smax: number;
    /** @type {number} */
    tmin: number;
    /** @type {number} */
    tmax: number;
    /**
     * compare finds an optimal d-path from (smin, tmin) to (smax, tmax).
     * @param {number} smin
     * @param {number} smax
     * @param {number} tmin
     * @param {number} tmax
     */
    compare(smin: number, smax: number, tmin: number, tmax: number): void;
    /**
     * split finds the endpoints of sequence of diagonals in the middle of an optimal path from (smin, tmin) to (smax, tmax).
     * @param {number} smin
     * @param {number} smax
     * @param {number} tmin
     * @param {number} tmax
     * @returns {SplitResult}
     */
    split(smin: number, smax: number, tmin: number, tmax: number): SplitResult;
}
//# sourceMappingURL=myers.d.ts.map