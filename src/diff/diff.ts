import Myers from "./myers.js";

export const DEFAULT_CONTEXT = 3;

/**
 * Op describes an edit operation.
 */
export const Op = {
  Match: 0, // Two slice elements match
  Delete: 1, // A deletion from an element on the left slice
  Insert: 2, // An insertion of an element from the right side
};

/**
 * Edit describes a single edit of a diff.
 * - For Match, both X and Y contain the matching element.
 * - For Delete, X contains the deleted element and Y mirrors X for backwards compatibility.
 * - For Insert, Y contains the inserted element and X mirrors Y for backwards compatibility.
 */
export interface Edit {
  /** The edit operation: Match = 0, Delete = 1, Insert = 2. */
  op: number;
  /** The element from the left slice. */
  x: string | number | Uint8Array;
  /** The element from the right slice. */
  y: string | number | Uint8Array;
}

/** Hunk describes a sequence of consecutive edits. */
export interface Hunk {
  /** The start position in x. */
  posX: number;
  /** The end position in x. */
  endX: number;
  /** The start position in y. */
  posY: number;
  /** The end position in y. */
  endY: number;
  /** The edits to transform x[PosX:EndX] to y[PosY:EndY]. */
  edits: Edit[];
}

export interface DiffResult {
  /** The first array of booleans, with a trailing false sentinel. */
  rx: boolean[];
  /** The second array of booleans, with a trailing false sentinel. */
  ry: boolean[];
}

/** Compares original left and right elements. The result must be stable during a diff. */
export type EqualityFunction = (
  a: string | number | Uint8Array,
  b: string | number | Uint8Array,
) => boolean;

/**
 * Compares the contents of x and y using the provided equality comparison and returns the
 * changes necessary to convert from one to the other.
 * The output is a sequence of hunks that each describe a number of consecutive edits.
 * Hunks include a number of matching elements before and after the last delete or insert operation.
 * If x and y are identical, the output has length zero.
 * Computing a minimal diff can be expensive for inputs with many changes.
 * @param x The first array to compare
 * @param y The second array to compare
 * @param eq Equality function to compare elements
 * @param context Non-negative safe integer number of matching elements to include around changes (default: 3)
 * @returns The hunks for the diff. The hunks describe the changes necessary to convert from x to y.
 */
export function hunks(
  x: string[] | number[] | Uint8Array[],
  y: string[] | number[] | Uint8Array[],
  eq: EqualityFunction = (a, b) => a === b,
  context = DEFAULT_CONTEXT,
): Hunk[] {
  if (!Number.isSafeInteger(context) || context < 0) {
    throw new RangeError("context must be a non-negative safe integer");
  }

  const { rx, ry } = diff(x, y, eq);
  return createHunks(x, y, rx, ry, context);
}

/**
 * @param x The first array to compare
 * @param y The second array to compare
 * @param rx The first array of booleans
 * @param ry The second array of booleans
 * @param context The context
 * @returns The hunks for the diff. The hunks describe the changes necessary to convert from x to y.
 */
function createHunks(
  x: string[] | number[] | Uint8Array[],
  y: string[] | number[] | Uint8Array[],
  rx: boolean[],
  ry: boolean[],
  context: number,
): Hunk[] {
  const hunks: Hunk[] = [];

  // Handle special cases
  if (x.length === 0 && y.length === 0) {
    return hunks; // Both empty
  }

  // Track positions in both inputs so insertion-only and deletion-only ranges stay aligned.
  let s = 0;
  let t = 0;
  let s0 = -1;
  let t0 = -1;
  let run = 0;

  while (s < x.length || t < y.length) {
    if ((s < x.length && rx[s]) || (t < y.length && ry[t])) {
      run = 0;
      if (s0 < 0) {
        s0 = Math.max(0, s - context);
        t0 = Math.max(0, t - context);
      }

      // Process deletions
      while (s < x.length && rx[s]) {
        s++;
      }
      // Process insertions
      while (t < y.length && ry[t]) {
        t++;
      }
    } else {
      // Process matches
      while (s < x.length && t < y.length && !rx[s] && !ry[t]) {
        s++;
        t++;
        run++;
      }
    }

    // Merge touching context windows and close the hunk once they no longer overlap.
    if (s0 >= 0 && (run > 2 * context || (s === x.length && t === y.length))) {
      const delta = Math.min(0, context - run);
      const s1 = s + delta;
      const t1 = t + delta;
      hunks.push({
        posX: s0,
        endX: s1,
        posY: t0,
        endY: t1,
        edits: createEdits(x, y, rx, ry, s0, s1, t0, t1),
      });
      s0 = -1;
      t0 = -1;
      run = 0;
    }
  }

  return hunks;
}

/**
 * Compares the contents of x and y using the provided equality comparison and returns the
 * changes necessary to convert from one to the other.
 * Returns edits for every element in the input.
 * If both x and y are identical, the output will consist of a match edit for every input element.
 * Computing a minimal diff can be expensive for inputs with many changes.
 * @param x The first array to compare
 * @param y The second array to compare
 * @param eq Equality function to compare elements
 * @returns The edits for the diff.
 */
export function edits(
  x: string[] | number[] | Uint8Array[],
  y: string[] | number[] | Uint8Array[],
  eq: EqualityFunction = (a, b) => a === b,
): Edit[] {
  const { rx, ry } = diff(x, y, eq);
  return createEdits(x, y, rx, ry);
}

/**
 * @param x The first array to compare
 * @param y The second array to compare
 * @param rx The first array of booleans
 * @param ry The second array of booleans
 * @param startX The start position in x
 * @param endX The end position in x (exclusive)
 * @param startY The start position in y
 * @param endY The end position in y (exclusive)
 * @returns The edits for the diff.
 */
function createEdits(
  x: string[] | number[] | Uint8Array[],
  y: string[] | number[] | Uint8Array[],
  rx: boolean[],
  ry: boolean[],
  startX = 0,
  endX = x.length,
  startY = 0,
  endY = y.length,
): Edit[] {
  const edits: Edit[] = [];
  const n = endX;
  const m = endY;

  let s = startX,
    t = startY;
  while (s < n || t < m) {
    // Process deletions
    while (s < n && rx[s]) {
      edits.push({
        op: Op.Delete,
        x: x[s],
        y: x[s], // Mirror the active value for backwards compatibility
      });
      s++;
    }

    // Process insertions
    while (t < m && ry[t]) {
      edits.push({
        op: Op.Insert,
        x: y[t], // Mirror the active value for backwards compatibility
        y: y[t],
      });
      t++;
    }

    // Process matches
    while (s < n && t < m && !rx[s] && !ry[t]) {
      edits.push({
        op: Op.Match,
        x: x[s],
        y: y[t],
      });
      s++;
      t++;
    }
  }

  return edits;
}

/**
 * Main diff function.
 * @param x The first array to compare
 * @param y The second array to compare
 * @param eq Equality function to compare elements
 * @returns The result of the diff.
 */
export function diff(
  x: string[] | number[] | Uint8Array[],
  y: string[] | number[] | Uint8Array[],
  eq: EqualityFunction = (a, b) => a === b,
): DiffResult {
  const xidx: number[] = new Array<number>(x.length);
  const yidx: number[] = new Array<number>(y.length);

  // Process x
  for (let i = 0; i < x.length; i++) {
    xidx[i] = i;
  }

  // Process y
  for (let i = 0; i < y.length; i++) {
    yidx[i] = i;
  }

  // Compare the original elements, not interned numeric IDs. This also avoids
  // quadratic interning work and preserves directional and non-transitive comparators.
  const m: Myers = new Myers(xidx, yidx, x, y, eq);
  m.compare(m.smin, m.smax, m.tmin, m.tmax);

  return { rx: m.resultVectorX, ry: m.resultVectorY };
}
