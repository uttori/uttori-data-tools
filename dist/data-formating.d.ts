export function formatBytes(input: number, decimals?: number, bytes?: number, sizes?: string[]): string;
export function formatASCII(value: number, asciiFlags: Record<string, boolean | number | string>, _data: import("./data-buffer.js").default | import("./data-stream.js").default): FormatASCIIOutput;
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
export const hexTableFormaters: HexTableFormater;
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
export const hexTableHeader: HexTableHeader;
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
export const hexTableDimensions: HexTableDimensions;
export function hexTable(input: import("./data-buffer.js").default | import("./data-stream.js").default, offset?: number, dimensions?: HexTableDimensions, header?: HexTableHeader, format?: HexTableFormater): string;
export function formatTableLine(columnLengths: number[], type: string, options: {
    theme: TableFormatStyle;
    padding: number;
}): string;
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
export const formatTableThemeMySQL: TableFormatStyle;
/**
 * Unicode Table Layout
 * @type {TableFormatStyle}
 */
export const formatTableThemeUnicode: TableFormatStyle;
/**
 * Markdown Table Layout
 * @type {TableFormatStyle}
 */
export const formatTableThemeMarkdown: TableFormatStyle;
export function formatTable(data: string[][], options?: {
    align: string[];
    padding: number;
    theme: TableFormatStyle;
    title: string;
}): string;
export function formatDiffHex(edits: import("./diff/diff.js").Edit[], options?: {
    bytesPerRow?: number | undefined;
    showOffset?: boolean | undefined;
    showAscii?: boolean | undefined;
    showBits?: boolean | undefined;
}): string;
export function formatDiffHunks(hunks: import("./diff/diff.js").Hunk[], options?: {
    context?: number | undefined;
}): string;
export function formatMyersGraph(rx: boolean[], ry: boolean[], x: any[], y: any[], options?: {
    showFull?: boolean | undefined;
    showLabels?: boolean | undefined;
}): string;
declare namespace _default {
    export { formatBytes };
    export { formatASCII };
    export { hexTable };
    export { hexTableDimensions };
    export { hexTableHeader };
    export { hexTableFormaters };
    export { formatTable };
    export { formatTableThemeMySQL };
    export { formatTableThemeUnicode };
    export { formatTableThemeMarkdown };
    export { formatDiffHex };
    export { formatDiffHunks };
    export { formatMyersGraph };
}
export default _default;
/**
 * No-op logger, replaced by the `debug` package when enabled.
 */
export type DebugLogger = (...args: any[]) => any;
/**
 * Format a numeric value for display.
 */
export type FormatNumber = (value: number) => string;
/**
 * ASCII formatting result: a two-element array of `[character, flags]`.
 */
export type FormatASCIIOutput = Array<string | Record<string, boolean | number | string>>;
/**
 * Format a byte value for ASCII display in a hex table.
 */
export type FormatNumberToASCII = (value: number, asciiFlags: Record<string, boolean | number | string>, data: import("./data-buffer.js").default | import("./data-stream.js").default) => FormatASCIIOutput;
/**
 * Formatting functions for all value types.
 */
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
 * Header layout definitions.
 * GNU poke hexTableHeader.value = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99', 'aa', 'bb', 'cc', 'dd', 'ee', 'ff']
 */
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
 */
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
 * Table Format Style definitions.
 */
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
 * A single node along the traced path through the Myers edit graph.
 */
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
    diagonal?: boolean | undefined;
    /**
     * True when the edge into this node is a horizontal (delete) move.
     */
    horizontal?: boolean | undefined;
    /**
     * True when the edge into this node is a vertical (insert) move.
     */
    vertical?: boolean | undefined;
};
//# sourceMappingURL=data-formating.d.ts.map