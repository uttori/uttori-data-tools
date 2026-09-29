/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */

import DataBuffer from "./data-buffer.ts";

/** @type {DebugLogger} */
let debug = (..._args: unknown[]) => {};
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import("debug");
    debug = d("DataBufferList");
  } catch {}
}

/**
 * A linked list of DataBuffers.
 * @property {DataBuffer} first The first DataBuffer in the list.
 * @property {DataBuffer} last The last DataBuffer in the list.
 * @property {number} totalBuffers The number of buffers in the list.
 * @property {number} availableBytes The number of bytes avaliable to read.
 * @property {number} availableBuffers The number of buffers avaliable to read.
 * @example <caption>new DataBufferList(buffers)</caption>
 * const buffer = new DataBuffer(data);
 * const list = new DataBufferList([buffer]);
 * @class
 */
class DataBufferList {
  /** The first DataBuffer in the list. */
  first: DataBuffer | null = null;
  /** The last DataBuffer in the list. */
  last: DataBuffer | null = null;
  /** The number of buffers in the list. */
  totalBuffers: number = 0;
  /** The number of bytes avaliable to read. */
  availableBytes: number = 0;
  /** The number of buffers avaliable to read. */
  availableBuffers: number = 0;

  /**
   * Creates an instance of DataBufferList.
   * @param buffers DataBuffers to initialize with.
   */
  constructor(buffers?: DataBuffer[]) {
    debug("constructor");
    if (buffers && Array.isArray(buffers)) {
      for (const buffer of buffers) {
        this.append(buffer);
      }
    }
  }

  /**
   * Creates a copy of the DataBufferList.
   * @returns {DataBufferList} The copied DataBufferList.
   */
  copy() {
    debug("copy");
    const result = new DataBufferList();

    result.first = this.first;
    result.last = this.last;
    result.totalBuffers = this.totalBuffers;
    result.availableBytes = this.availableBytes;
    result.availableBuffers = this.availableBuffers;

    return result;
  }

  /**
   * Appends a DataBuffer to the DataBufferList.
   * @param buffer The DataBuffer to add to the list.
   * @returns The new number of buffers in the DataBufferList.
   */
  append(buffer: DataBuffer): number {
    debug("append");
    buffer.prev = this.last;
    if (this.last) {
      this.last.next = buffer;
    }
    this.last = buffer;
    if (this.first == null) {
      this.first = buffer;
    }

    this.availableBytes += buffer.length;
    this.availableBuffers++;
    this.totalBuffers++;

    debug("append:", this.totalBuffers);
    return this.totalBuffers;
  }

  /**
   * Checks if we are on the last buffer in the list.
   * @returns Returns false if there are more buffers in the list, returns true when we are on the last buffer.
   */
  moreAvailable(): boolean {
    if (this.first && this.first.next != null) {
      debug("moreAvailable: true");
      return true;
    }

    debug("moreAvailable: false");
    return false;
  }

  /**
   * Advance the buffer list to the next DataBuffer or to `null` when at the end of avaliable DataBuffers.
   *
   * If there is no next buffer, the current buffer is set to null.
   * @returns Returns false if there is no more buffers, returns true when the next buffer is set.
   */
  advance(): boolean {
    debug("advance");
    if (this.first) {
      this.availableBytes -= this.first.length;
      this.availableBuffers--;
    }
    if (this.first && this.first.next) {
      debug("advance: advancing");
      this.first = this.first.next;
      return true;
    }

    debug("advance: nothing to advance to");
    this.first = null;
    return false;
  }

  /**
   * Rewind the buffer list to the previous buffer.
   * @returns Returns false if there is no previous buffer, returns true when the previous buffer is set.
   */
  rewind(): boolean {
    debug("rewind");
    if (this.first && !this.first.prev) {
      return false;
    }

    this.first = this.first ? this.first.prev : this.last;
    if (this.first) {
      this.availableBytes += this.first.length;
      this.availableBuffers++;
    }

    return this.first != null;
  }

  /**
   * Reset the list to the beginning.
   */
  reset(): void {
    debug("reset");
    while (this.rewind()) {
      continue;
    }
  }
}

export default DataBufferList;
