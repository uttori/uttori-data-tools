export function formatBytes(input: number, decimals?: number, bytes?: number, sizes?: string[]): string;
export function formatASCII(value: number, asciiFlags: object, _data: DataBuffer | DataStream): any[];
export namespace hexTableFormaters {
    export function offset(value: any): any;
    export function value(value: any): any;
    export { formatASCII as ascii };
}
export namespace hexTableHeader {
    let offset_1: string;
    export { offset_1 as offset };
    let value_1: string[];
    export { value_1 as value };
    export let ascii: string;
}
export namespace hexTableDimensions {
    let columns: number;
    let grouping: number;
    let maxRows: number;
}
export function hexTable(input: DataBuffer | DataStream, offset?: number, dimensions?: HexTableDimensions, header?: HexTableHeader, format?: HexTableFormater): string;
export function formatTableLine(columnLengths: any[], type: string, options: {
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
export function formatTable(data: string[][], options: object): string;
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
}
export default _default;
/**
 * Formatting functions for all value types.
 */
export type HexTableFormater = {
    /**
     * - Offset formatting fuction.
     */
    offset: Function;
    /**
     * - Byte value formating function.
     */
    value: Function;
    /**
     * - ASCII text formatting function.
     */
    ascii: Function;
};
/**
 * Header layout definitions.
 * GNU poke hexTableHeader.value = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99', 'aa', 'bb', 'cc', 'dd', 'ee', 'ff']
 */
export type HexTableHeader = {
    /**
     * - Offset header column presentation.
     */
    offset: string;
    /**
     * - Byte value header values, grouped as defined in the provided HexTableDimensions.
     */
    value: string[];
    /**
     * - ASCII text presentation.
     */
    ascii: string;
};
/**
 * Header layout definitions.
 */
export type HexTableDimensions = {
    /**
     * - The number of columns to show in the byte value section of the table.
     */
    columns: number;
    /**
     * - The number of bytes to cluster together in the byte value section of the table.
     */
    grouping: number;
    /**
     * - The maxiumum number of rows to show excluding the header & seperator rows.
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
import DataBuffer from './data-buffer.js';
import DataStream from './data-stream.js';
//# sourceMappingURL=data-formating.d.ts.map