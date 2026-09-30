export declare const DEFAULT_CONTEXT = 3;
/**
 * Op describes an edit operation.
 */
export declare const Op: {
    Match: number;
    Delete: number;
    Insert: number;
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
export type EqualityFunction = (a: string | number | Uint8Array, b: string | number | Uint8Array) => boolean;
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
export declare function hunks(x: string[] | number[] | Uint8Array[], y: string[] | number[] | Uint8Array[], eq?: EqualityFunction, context?: number): Hunk[];
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
export declare function edits(x: string[] | number[] | Uint8Array[], y: string[] | number[] | Uint8Array[], eq?: EqualityFunction): Edit[];
/**
 * Main diff function.
 * @param x The first array to compare
 * @param y The second array to compare
 * @param eq Equality function to compare elements
 * @returns The result of the diff.
 */
export declare function diff(x: string[] | number[] | Uint8Array[], y: string[] | number[] | Uint8Array[], eq?: EqualityFunction): DiffResult;
//# sourceMappingURL=diff.d.ts.map