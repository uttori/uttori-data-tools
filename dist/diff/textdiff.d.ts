export declare const DEFAULT_CONTEXT = 3;
/** Edit describes a single edit of a line-by-line diff. */
export interface TextEdit {
    /** The edit operation. */
    op: number;
    /** The line. */
    line: string;
}
/** Hunk describes a sequence of consecutive edits. */
export interface TextHunk {
    /** The start line in x (zero-based). */
    posX: number;
    /** The end line in x (zero-based). */
    endX: number;
    /** The start line in y (zero-based). */
    posY: number;
    /** The end line in y (zero-based). */
    endY: number;
    /** The edits to transform x lines PosX..EndX to y lines PosY..EndY. */
    edits: TextEdit[];
}
/**
 * Hunks compares the lines in x and y and returns the changes necessary to convert from one to the other.
 * The output is a sequence of hunks that each describe a number of consecutive edits.
 * Hunks include a number of matching elements before and after the last delete or insert operation.
 * If x and y are identical, the output has length zero.
 * @param x The first text to compare
 * @param y The second text to compare
 * @param context Number of matching lines to include around changes (default: 3)
 * @returns The hunks for the diff. The hunks describe the changes necessary to convert from x to y.
 */
export declare function textHunks(x: string, y: string, context?: number): TextHunk[];
/**
 * textEdits compares the lines in x and y and returns the changes necessary to convert from one to the other.
 * textEdits returns edits for every element in the input. If x and y are identical, the output will consist of a match edit for every input element.
 * @param {string} x The first text to compare
 * @param {string} y The second text to compare
 * @returns {TextEdit[]} The edits for the diff.
 */
export declare function textEdits(x: string, y: string): TextEdit[];
/**
 * Unified compares the lines in x and y and returns the changes necessary to convert from one to the other in unified format.
 *
 * @param x The first text to compare
 * @param y The second text to compare
 * @param context Number of matching lines to include around changes (default: 3)
 * @returns The unified diff in string format.
 */
export declare function unified(x: string, y: string, context?: number): string;
/**
 * htmlTable compares the lines in x and y and returns an HTML table showing the differences.
 * @param x The first text to compare (old version)
 * @param y The second text to compare (new version)
 * @param context Number of matching lines to include around changes (default: 3)
 * @returns HTML table string
 */
export declare function htmlTable(x: string, y: string, context?: number): string;
//# sourceMappingURL=textdiff.d.ts.map