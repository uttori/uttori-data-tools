/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */
export type DebugLogger = (...args: any) => any;
export type FormatNumber = (value: number) => string;
export type FormatASCIIOutput = Array<string | Record<string, boolean | number | string>>;
export type FormatNumberToASCII = (value: number, asciiFlags: Record<string, boolean | number | string>, data: import('./data-buffer.js').default | import('./data-stream.js').default) => FormatASCIIOutput;
/**
 * Format a numeric value for display.
 * @callback FormatNumber
 * @param {number} value The number to format.
 * @returns {string} The formatted number as a string.
 */
/**
 * ASCII formatting result: a two-element array of `[character, flags]`.
 * @typedef {Array.<string|Record<string, boolean|number|string>>} FormatASCIIOutput
 */
/**
 * Format a byte value for ASCII display in a hex table.
 * @callback FormatNumberToASCII
 * @param {number} value Input data to print out as a hex table.
 * @param {Record<string, boolean|number|string>} asciiFlags Any flags needed by the formatter.
 * @param {import('./data-buffer.js').default|import('./data-stream.js').default} data The data being processed.
 * @returns {FormatASCIIOutput} Character to represent this value and any flags for the function.
 */
/**
 * Format an amount of bytes to a human friendly string.
 * @param {number} input The number of bytes.
 * @param {number} [decimals] The number of trailing decimal places to chop to, default is 2.
 * @param {number} [bytes] The byte division value, alternatively could be 1000 for decimal values rather than binary values, default is 1024.
 * @param {string[]} [sizes] An optional array of the various size suffixes in ascending order of size: `['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']`
 * @returns {string} The human friendly representation of the number of bytes.
 * @see {@link https://en.wikipedia.org/wiki/Byte#Multiple-byte_units|Multiple-byte units}
 */
export declare const formatBytes: (input: number, decimals?: number, bytes?: number, sizes?: string[]) => string;
/**
 * ASCII text formatting function.
 * @param {number} value Input data to print out as a hex table.
 * @param {Record<string, boolean|number|string>} asciiFlags Any flags needed by the formatter.
 * @param {import('./data-buffer.js').default|import('./data-stream.js').default} _data The data being processed.
 * @returns {FormatASCIIOutput} Returns an array with the Character to represent this value and any flags for the function.
 */
export declare const formatASCII: (value: number, asciiFlags: Record<string, boolean | number | string>, _data: import('./data-buffer.js').default | import('./data-stream.js').default) => FormatASCIIOutput;
export type HexTableFormater = {
    /**
     * Offset formatting fuction.
     */
    offset: FormatNumber;
    /**
     * Byte value formating function.
     */
    value: FormatNumber;
    /**
     * ASCII text formatting function.
     */
    ascii: FormatNumberToASCII;
};
/**
 * Formatting functions for all value types.
 * @typedef {object} HexTableFormater
 * @property {FormatNumber} offset Offset formatting fuction.
 * @property {FormatNumber} value Byte value formating function.
 * @property {FormatNumberToASCII} ascii ASCII text formatting function.
 */
/**
 * @type {HexTableFormater}
 */
export declare const hexTableFormaters: HexTableFormater;
export type HexTableHeader = {
    /**
     * Offset header column presentation.
     */
    offset: string;
    /**
     * Byte value header values, grouped as defined in the provided HexTableDimensions.
     */
    value: string[];
    /**
     * ASCII text presentation.
     */
    ascii: string;
};
/**
 * Header layout definitions.
 * GNU poke hexTableHeader.value = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99', 'aa', 'bb', 'cc', 'dd', 'ee', 'ff']
 * @typedef {object} HexTableHeader
 * @property {string} offset Offset header column presentation.
 * @property {string[]} value Byte value header values, grouped as defined in the provided HexTableDimensions.
 * @property {string} ascii ASCII text presentation.
 */
/**
 * @type {HexTableHeader}
 */
export declare const hexTableHeader: HexTableHeader;
export type HexTableDimensions = {
    /**
     * The number of columns to show in the byte value section of the table.
     */
    columns: number;
    /**
     * The number of bytes to cluster together in the byte value section of the table.
     */
    grouping: number;
    /**
     * The maxiumum number of rows to show excluding the header & seperator rows.
     */
    maxRows: number;
};
/**
 * Header layout definitions.
 * @typedef {object} HexTableDimensions
 * @property {number} columns The number of columns to show in the byte value section of the table.
 * @property {number} grouping The number of bytes to cluster together in the byte value section of the table.
 * @property {number} maxRows The maxiumum number of rows to show excluding the header & seperator rows.
 */
/**
 * @type {HexTableDimensions}
 */
export declare const hexTableDimensions: HexTableDimensions;
/**
 * Generate a nicely formatted hex editor style table.
 * @param {import('./data-buffer.js').default|import('./data-stream.js').default} input Input data to print out as a hex table.
 * @param {number} offset Offset in the DataStream to start from.
 * @param {HexTableDimensions} dimensions Table size parameters for columns, rows and byte grouping.
 * @param {HexTableHeader} header The values for building the table header with offset, bytes and ASCII values.
 * @param {HexTableFormater} format The formatting functions for displaying offset, bytes and ASCII values.
 * @returns {string} The hex table ASCII.
 */
export declare const hexTable: (input: import('./data-buffer.js').default | import('./data-stream.js').default, offset?: number, dimensions?: HexTableDimensions, header?: HexTableHeader, format?: HexTableFormater) => string;
/**
 * Format a table line seperator for a given theme.
 * @param {number[]} columnLengths An array with each columns length
 * @param {string} type The type of the separator
 * @param {object} options The options
 * @param {TableFormatStyle} options.theme The theme to use for formatting.
 * @param {number} options.padding The amount of padding to use.
 * @returns {string} The seperator
 */
export declare const formatTableLine: (columnLengths: number[], type: string, options: {
    theme: TableFormatStyle;
    padding: number;
}) => string;
export type TableFormatStyle = {
    /**
     * If true, show the top frame, if false, hide the top frame. Typically used for full framed styles.
     */
    topRow: boolean;
    /**
     * If true, show the bottom frame, if false, hide the top frame. Typically used for full framed styles.
     */
    bottomRow: boolean;
    /**
     * Top Left Character
     */
    upperLeft: string;
    /**
     * Top Right Chcaracter
     */
    upperRight: string;
    /**
     * Bottom Left Character
     */
    lowerLeft: string;
    /**
     * Bottom Right Character
     */
    lowerRight: string;
    /**
     * 4 Way Intersection Character
     */
    intersection: string;
    /**
     * Horizontal Line Character
     */
    line: string;
    /**
     * Vertical Line Character
     */
    wall: string;
    /**
     * 2 Way Intersection from the bottom Character
     */
    intersectionTop: string;
    /**
     * 2 Way Intersection from the top Character
     */
    intersectionBottom: string;
    /**
     * 2 Way Intersection from the right Character
     */
    intersectionLeft: string;
    /**
     * 2 Way Intersection from the left Character
     */
    intersectionRight: string;
};
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
/**
 * MySQL Style Table Layout
 * @type {TableFormatStyle}
 */
export declare const formatTableThemeMySQL: TableFormatStyle;
/**
 * Unicode Table Layout
 * @type {TableFormatStyle}
 */
export declare const formatTableThemeUnicode: TableFormatStyle;
/**
 * Markdown Table Layout
 * @type {TableFormatStyle}
 */
export declare const formatTableThemeMarkdown: TableFormatStyle;
/**
 * Create an ASCII table from provided data and configuration.
 * @param {string[][]} data The data to add to the table.
 * @param {object} [options] Configuration.
 * @param {string[]} options.align The alignment of each column, left or right.
 * @param {number} options.padding Amount of padding to add to each cell.
 * @param {TableFormatStyle} options.theme The theme to use for formatting.
 * @param {string} options.title The title to display at the top of the table.
 * @returns {string} The ASCII table of data.
 */
export declare const formatTable: (data: string[][], options?: {
    align: string[];
    padding: number;
    theme: TableFormatStyle;
    title: string;
}) => string;
/**
 * Format diff edits as a hex-friendly table showing changes.
 * Shows three rows: original data, delta values, and resulting data.
 * @param {import('./diff/diff.js').Edit[]} edits The diff edits to format.
 * @param {object} [options] Configuration options.
 * @param {number} [options.bytesPerRow] Number of bytes per row, default is 16.
 * @param {boolean} [options.showOffset] Show byte offsets, default is true.
 * @param {boolean} [options.showAscii] Show ASCII representation, default is true.
 * @param {boolean} [options.showBits] Show binary representation, default is true.
 * @returns {string} The formatted diff output.
 */
export declare const formatDiffHex: (edits: import('./diff/diff.js').Edit[], options?: {
    bytesPerRow?: number;
    showOffset?: boolean;
    showAscii?: boolean;
    showBits?: boolean;
}) => string;
/**
 * Format diff hunks as a unified diff style with hex values.
 * @param {import('./diff/diff.js').Hunk[]} hunks The diff hunks to format.
 * @param {object} [options] Configuration options.
 * @param {number} [options.context] Number of context lines to show around changes, default is 3.
 * @returns {string} The formatted diff output.
 */
export declare const formatDiffHunks: (hunks: import('./diff/diff.js').Hunk[], options?: {
    context?: number;
}) => string;
export type MyersPathNode = {
    /**
     * The column (x sequence) index.
     */
    x: number;
    /**
     * The row (y sequence) index.
     */
    y: number;
    /**
     * True when the edge into this node is a diagonal (match) move.
     */
    diagonal?: boolean;
    /**
     * True when the edge into this node is a horizontal (delete) move.
     */
    horizontal?: boolean;
    /**
     * True when the edge into this node is a vertical (insert) move.
     */
    vertical?: boolean;
};
/**
 * A single node along the traced path through the Myers edit graph.
 * @typedef {object} MyersPathNode
 * @property {number} x The column (x sequence) index.
 * @property {number} y The row (y sequence) index.
 * @property {boolean} [diagonal] True when the edge into this node is a diagonal (match) move.
 * @property {boolean} [horizontal] True when the edge into this node is a horizontal (delete) move.
 * @property {boolean} [vertical] True when the edge into this node is a vertical (insert) move.
 */
/**
 * Format Myers diff result vectors as an ASCII grid visualization.
 * Shows the edit graph with the path taken through it.
 * @param {boolean[]} rx Result vector for x (deletions).
 * @param {boolean[]} ry Result vector for y (insertions).
 * @param {any[]} x The original sequence.
 * @param {any[]} y The modified sequence.
 * @param {object} [options] Configuration options.
 * @param {boolean} [options.showFull] Show full grid or just the path, default is false (path only).
 * @param {boolean} [options.showLabels] Show axis labels, default is true.
 * @returns {string} The formatted Myers graph.
 */
export declare const formatMyersGraph: (rx: boolean[], ry: boolean[], x: any[], y: any[], options?: {
    showFull?: boolean;
    showLabels?: boolean;
}) => string;
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