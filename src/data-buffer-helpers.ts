import DataBuffer from "./data-buffer.js";
import { type Edit, edits } from "./diff/diff.js";
import UnderflowError from "./underflow-error.js";

type DataBufferInput =
  | number[]
  | ArrayBuffer
  | Buffer
  | DataBuffer
  | Int8Array
  | Int16Array
  | Int32Array
  | number
  | string
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | undefined;

/**
 * Diffs `input` against `buffer` from `offset`.
 * Import this when a comparison is needed. Parsers that only read bytes do not pull in Myers.
 * @param buffer The buffer to compare from.
 * @param input The bytes to compare against.
 * @param offset Start index in `buffer`. Defaults to 0.
 * @returns Edits that turn `buffer`'s bytes, from `offset`, into `input`.
 */
export function diffBuffer(buffer: DataBuffer, input: DataBufferInput, offset = 0): Edit[] {
  if (!buffer.availableAt(0, offset, false)) {
    throw new UnderflowError(`Insufficient Bytes: ${offset} + 0`);
  }
  let data: Uint8Array;
  if (input instanceof DataBuffer) {
    data = input.data;
  } else if (input instanceof Uint8Array) {
    data = input;
  } else {
    data = new DataBuffer(input).data;
  }

  const x = Array.from(buffer.data.subarray(offset));
  const y = Array.from(data);
  return edits(x, y, (a, b) => a === b);
}
