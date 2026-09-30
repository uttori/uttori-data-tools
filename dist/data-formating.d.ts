/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */
import type DataBuffer from "./data-buffer.js";
import type { Edit, Hunk } from "./diff/diff.js";
/**
 * Format a numeric value for display.
 * @param value The number to format.
 * @returns The formatted number as a string.
 */
export type FormatNumber = (value: number) => string;
/** ASCII formatting result: a two-element array of `[character, flags]`. */
export type FormatASCIIOutput = [string, Record<string, boolean | number | string>];
/**
 * Format a byte value for ASCII display in a hex table.
 * @param value Input data to print out as a hex table.
 * @param asciiFlags Any flags needed by the formatter.
 * @param data The data being processed.
 * @returns Character to represent this value and any flags for the function.
 */
export type FormatNumberToASCII = (value: number, asciiFlags: Record<string, boolean | number | string>, data: DataBuffer) => FormatASCIIOutput | string;
/**
 * Format an amount of bytes to a human friendly string.
 * @param input The number of bytes.
 * @param decimals The number of trailing decimal places to chop to, default is 2.
 * @param bytes The byte division value, alternatively could be 1000 for decimal values rather than binary values, default is 1024.
 * @param sizes An optional array of the various size suffixes in ascending order of size: `['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']`
 * @returns The human friendly representation of the number of bytes.
 * @see {@link https://en.wikipedia.org/wiki/Byte#Multiple-byte_units|Multiple-byte units}
 */
export declare const formatBytes: (input: number, decimals?: number, bytes?: number, sizes?: string[]) => string;
/**
 * ASCII text formatting function.
 * @param value Input data to print out as a hex table.
 * @param asciiFlags Any flags needed by the formatter.
 * @param _data The data being processed.
 * @returns Returns an array with the Character to represent this value and any flags for the function.
 */
export declare const formatASCII: (value: number, asciiFlags: Record<string, boolean | number | string>, _data: DataBuffer) => FormatASCIIOutput;
/** Formatting functions for all value types. */
export interface HexTableFormater {
    /** Offset formatting fuction. */
    offset: FormatNumber;
    /** Byte value formating function. */
    value: FormatNumber;
    /** ASCII text formatting function. */
    ascii: FormatNumberToASCII;
}
/** Formatting functions for all value types. */
export declare const hexTableFormaters: HexTableFormater;
/**
 * Header layout definitions.
 * GNU poke hexTableHeader.value = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99', 'aa', 'bb', 'cc', 'dd', 'ee', 'ff']
 */
export interface HexTableHeader {
    /** Offset header column presentation. */
    offset: string;
    /** Byte value header values, grouped as defined in the provided HexTableDimensions. */
    value: string[];
    /** ASCII text presentation. */
    ascii: string;
}
export declare const hexTableHeader: HexTableHeader;
/** Header layout definitions. */
export interface HexTableDimensions {
    /** The number of columns to show in the byte value section of the table. */
    columns: number;
    /** The number of bytes to cluster together in the byte value section of the table. */
    grouping: number;
    /** The maxiumum number of rows to show excluding the header & seperator rows. */
    maxRows: number;
}
export declare const hexTableDimensions: HexTableDimensions;
/**
 * Generate a nicely formatted hex editor style table.
 * @param input Input data to print out as a hex table.
 * @param offset Display offset for the first byte; reading starts at the input DataBuffer cursor.
 * @param dimensions Table size parameters for columns, rows and byte grouping.
 * @param header The values for building the table header with offset, bytes and ASCII values.
 * @param format The formatting functions for displaying offset, bytes and ASCII values.
 * @returns The hex table ASCII.
 */
export declare const hexTable: (input: DataBuffer, offset?: number, dimensions?: HexTableDimensions, header?: HexTableHeader, format?: HexTableFormater) => string;
/**
 * Format a table line seperator for a given theme.
 * @param columnLengths An array with each columns length
 * @param type The type of the separator
 * @param options The options for the formatting including the theme and padding.
 * @returns The seperator
 */
export declare const formatTableLine: (columnLengths: number[], type: string, options: FormatTableOptions) => string;
/**
 * Table Format Style definitions.
 * @typedef {object} TableFormatStyle
 * @property {boolean} topRow If true, show the top frame, if false, hide the top frame. Typically used for full framed styles.
 * @property {boolean} bottomRow If true, show the bottom frame, if false, hide the top frame. Typically used for full framed styles.
 * @property {string} upperLeft Top Left Character
 * @property {string} upperRight Top Right Chcaracter
 * @property {string} lowerLeft Bottom Left Character
 * @property {string} lowerRight Bottom Right Character
 * @property {string} intersection 4 Way Intersection Character
 * @property {string} line Horizontal Line Character
 * @property {string} wall Vertical Line Character
 * @property {string} intersectionTop 2 Way Intersection from the bottom Character
 * @property {string} intersectionBottom 2 Way Intersection from the top Character
 * @property {string} intersectionLeft 2 Way Intersection from the right Character
 * @property {string} intersectionRight 2 Way Intersection from the left Character
 */
export interface TableFormatStyle {
    /** If true, show the top frame, if false, hide the top frame. Typically used for full framed styles. */
    topRow: boolean;
    /** If true, show the bottom frame, if false, hide the top frame. Typically used for full framed styles. */
    bottomRow: boolean;
    /** Top Left Character */
    upperLeft: string;
    /** Top Right Character */
    upperRight: string;
    /** Bottom Left Character */
    lowerLeft: string;
    /** Bottom Right Character */
    lowerRight: string;
    /** 4 Way Intersection Character */
    intersection: string;
    /** Horizontal Line Character */
    line: string;
    /** Vertical Line Character */
    wall: string;
    /** 2 Way Intersection from the bottom Character */
    intersectionTop: string;
    /** 2 Way Intersection from the top Character */
    intersectionBottom: string;
    /** 2 Way Intersection from the right Character */
    intersectionLeft: string;
    /** 2 Way Intersection from the left Character */
    intersectionRight: string;
}
/** MySQL Style Table Layout */
export declare const formatTableThemeMySQL: TableFormatStyle;
/** Unicode Style Table Layout */
export declare const formatTableThemeUnicode: TableFormatStyle;
/** Markdown Style Table Layout */
export declare const formatTableThemeMarkdown: TableFormatStyle;
export interface FormatTableOptions {
    align: string[];
    padding: number;
    theme: TableFormatStyle;
    title: string;
}
/**
 * Create an ASCII table from provided data and configuration.
 * @param {unknown[][]} data The data to add to the table; cells are converted to strings once.
 * @param {object} [options] Configuration.
 * @param {string[]} options.align The alignment of each column, left or right.
 * @param {number} options.padding Amount of padding to add to each cell.
 * @param {TableFormatStyle} options.theme The theme to use for formatting.
 * @param {string} options.title The title to display at the top of the table.
 * @returns {string} The ASCII table of data.
 */
export declare const formatTable: (data: readonly (readonly unknown[])[], options?: Partial<FormatTableOptions>) => string;
export interface FormatDiffHexOptions {
    /** Number of bytes per row, default is 16. */
    bytesPerRow: number;
    /** Show byte offsets, default is true. */
    showOffset: boolean;
    /** Show ASCII representation, default is true. */
    showAscii: boolean;
    /** Show binary representation, default is true. */
    showBits: boolean;
}
/**
 * Format diff edits as a hex-friendly table showing changes.
 * Shows three rows: original data, delta values, and resulting data. Missing bytes use --; offsets track each side independently.
 * @param edits The diff edits to format.
 * @param options Configuration options.
 * @returns The formatted diff output.
 */
export declare const formatDiffHex: (edits: Edit[], options?: Partial<FormatDiffHexOptions>) => string;
export interface FormatDiffHunksOptions {
    /** Number of context lines to show around changes, default is 3. */
    context: number;
}
/**
 * Format diff hunks as a unified diff style with hex values.
 * @param hunks The diff hunks to format.
 * @param options Configuration options.
 * @returns The formatted diff output.
 */
export declare const formatDiffHunks: (hunks: Hunk[], options?: Partial<FormatDiffHunksOptions>) => string;
/**
 * A single node along the traced path through the Myers edit graph.
 */
export interface MyersPathNode {
    /** The column (x sequence) index. */
    x: number;
    /** The row (y sequence) index. */
    y: number;
    /** True when the edge into this node is a diagonal (match) move. */
    diagonal?: boolean;
    /** True when the edge into this node is a horizontal (delete) move. */
    horizontal?: boolean;
    /** True when the edge into this node is a vertical (insert) move. */
    vertical?: boolean;
}
export interface FormatMyersGraphOptions {
    /** Show full grid or just the path, default is false (path only). */
    showFull: boolean;
    /** Show axis labels, default is true. */
    showLabels: boolean;
    /** Maximum character cells to allocate, default is 1,000,000. */
    maxCells?: number;
}
/**
 * Format Myers diff result vectors as an ASCII grid visualization.
 * Shows the edit graph with the path taken through it.
 * @param rx Result vector for x (deletions).
 * @param ry Result vector for y (insertions).
 * @param x The original sequence.
 * @param y The modified sequence.
 * @param options Configuration options.
 * @returns The formatted Myers graph.
 */
export declare const formatMyersGraph: (rx: boolean[], ry: boolean[], x: unknown[], y: unknown[], options?: Partial<FormatMyersGraphOptions>) => string;
declare const _default: {
    formatBytes: typeof formatBytes;
    formatASCII: typeof formatASCII;
    hexTable: typeof hexTable;
    hexTableDimensions: HexTableDimensions;
    hexTableHeader: HexTableHeader;
    hexTableFormaters: HexTableFormater;
    formatTable: typeof formatTable;
    formatTableThemeMySQL: TableFormatStyle;
    formatTableThemeUnicode: TableFormatStyle;
    formatTableThemeMarkdown: TableFormatStyle;
    formatDiffHex: typeof formatDiffHex;
    formatDiffHunks: typeof formatDiffHunks;
    formatMyersGraph: typeof formatMyersGraph;
};
export default _default;
//# sourceMappingURL=data-formating.d.ts.map