/**
 * @typedef UttoriCharacterEncoding
 * @type {object}
 * @property {number} shiftjs Shift-JIS code as an integer.
 * @property {number} unicode Unicode value as an integer.
 * @property {string} string Unicode string representation.
 * @property {string} ascii ASCII string representation.
 * @property {string} name Unicode Name
 */
export type UttoriCharacterEncoding = {
    /**
     * Shift-JIS code as an integer.
     */
    shiftjs: number;
    /**
     * Unicode value as an integer.
     */
    unicode: number;
    /**
     * Unicode string representation.
     */
    string: string;
    /**
     * ASCII string representation.
     */
    ascii: string;
    /**
     * Unicode Name
     */
    name: string;
};
/**
 * Shift JIS (Shift Japanese Industrial Standards, also SJIS, MIME name Shift_JIS, known as PCK in Solaris contexts) is a character encoding for the Japanese language, originally developed by a Japanese company called ASCII Corporation in conjunction with Microsoft and standardized as JIS X 0208 Appendix 1.
 * Shift-JIS is also called MS Kanji, or DOS Kanji, and is a Microsoft standard (codepage 932).
 * Shift-JIS is an 8-bit encoding with 1 to 2 bytes per character.
 * @see {@link https://en.wikipedia.org/wiki/Shift_JIS|Shift-JIS}
 * @type {Record<number, UttoriCharacterEncoding>}
 */
export declare const characterEncoding: Record<number, UttoriCharacterEncoding>;
/**
 * Convert Shift-JIS data to Unicode text.
 *
 * Does not check for out of bounds characters and will use the `String.fromCharCode` value.
 * @param {import('../data-buffer.js').default} data The data to convert to text.
 * @returns {string} The Shift-JIS data converted to Unicode text.
 */
export declare const parse: (data: import('../data-buffer.js').default) => string;
declare const _default: {
    characterEncoding: Record<number, UttoriCharacterEncoding>;
    parse: typeof parse;
};
export default _default;
//# sourceMappingURL=shift-jis.d.ts.map