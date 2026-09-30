import DataBuffer from "./data-buffer.js";
import { type Edit } from "./diff/diff.js";
type DataBufferInput = number[] | ArrayBuffer | Buffer | DataBuffer | Int8Array | Int16Array | Int32Array | number | string | Uint8Array | Uint16Array | Uint32Array | undefined;
/**
 * Diffs `input` against `buffer` from `offset`.
 * Import this when a comparison is needed. Parsers that only read bytes do not pull in Myers.
 * @param buffer The buffer to compare from.
 * @param input The bytes to compare against.
 * @param offset Start index in `buffer`. Defaults to 0.
 * @returns Edits that turn `buffer`'s bytes, from `offset`, into `input`.
 */
export declare function diffBuffer(buffer: DataBuffer, input: DataBufferInput, offset?: number): Edit[];
export {};
//# sourceMappingURL=data-buffer-helpers.d.ts.map