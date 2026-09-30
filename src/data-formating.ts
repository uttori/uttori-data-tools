/**
 * No-op logger, replaced by the `debug` package when enabled.
 * @callback DebugLogger
 * @param {...*} args The arguments to log.
 */

import type DataBuffer from "./data-buffer.js";
import type { Edit, Hunk } from "./diff/diff.js";

/** @type {DebugLogger} */
let debug = (..._args: unknown[]) => {};
/* c8 ignore next */
if (typeof process !== "undefined" && process.env.UTTORI_DATA_DEBUG) {
  try {
    const { default: d } = await import("debug");
    debug = d("DataFormatting");
  } catch {}
}

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
export type FormatNumberToASCII = (
  value: number,
  asciiFlags: Record<string, boolean | number | string>,
  data: DataBuffer,
) => FormatASCIIOutput | string;

/**
 * Format an amount of bytes to a human friendly string.
 * @param input The number of bytes.
 * @param decimals The number of trailing decimal places to chop to, default is 2.
 * @param bytes The byte division value, alternatively could be 1000 for decimal values rather than binary values, default is 1024.
 * @param sizes An optional array of the various size suffixes in ascending order of size: `['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']`
 * @returns The human friendly representation of the number of bytes.
 * @see {@link https://en.wikipedia.org/wiki/Byte#Multiple-byte_units|Multiple-byte units}
 */
export const formatBytes = (
  input: number,
  decimals: number = 2,
  bytes: number = 1024,
  sizes: string[] = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
) => {
  if (!Number.isFinite(input)) {
    throw new RangeError(`Invalid byte size: ${input}`);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 100) {
    throw new RangeError(`Invalid decimal count: ${decimals}`);
  }
  if (!Number.isFinite(bytes) || bytes <= 1) {
    throw new RangeError(`Invalid byte division value: ${bytes}`);
  }
  if (sizes.length === 0) {
    throw new RangeError("At least one size suffix is required.");
  }
  if (input === 0) {
    return `0 ${sizes[0]}`;
  }
  const magnitude = Math.abs(input);
  let i = Math.max(
    0,
    Math.min(sizes.length - 1, Math.floor(Math.log(magnitude) / Math.log(bytes))),
  );
  // Logarithms can round up immediately below a unit boundary; compare the actual powers as well.
  while (i > 0 && magnitude < bytes ** i) {
    i--;
  }
  while (i < sizes.length - 1 && magnitude >= bytes ** (i + 1)) {
    i++;
  }
  return `${Number((input / bytes ** i).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * ASCII text formatting function.
 * @param value Input data to print out as a hex table.
 * @param asciiFlags Any flags needed by the formatter.
 * @param _data The data being processed.
 * @returns Returns an array with the Character to represent this value and any flags for the function.
 */
export const formatASCII = (
  value: number,
  asciiFlags: Record<string, boolean | number | string>,
  _data: DataBuffer,
): FormatASCIIOutput => {
  // Unprintable ASCII < 128 == ' ', > 128 == '.'
  if (value < 0x20) {
    return [" ", asciiFlags];
  }
  if (value > 0x7e) {
    return [".", asciiFlags];
  }
  // Alternatively: value.replace(/[^\x20-\x7E]+/g, '_')
  return [String.fromCharCode(value), asciiFlags];
};

/** Cached representations of the 256 possible byte values. */
const byteHex = /* @__PURE__ */ Array.from({ length: 256 }, (_, value) =>
  value.toString(16).padStart(2, "0").toUpperCase(),
);
const byteBits = /* @__PURE__ */ Array.from({ length: 256 }, (_, value) =>
  value.toString(2).padStart(8, "0"),
);
const byteBitChanges = /* @__PURE__ */ byteBits.map((value) =>
  value.replace(/0/g, " ").replace(/1/g, "^"),
);

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
export const hexTableFormaters: HexTableFormater = {
  offset: (value: number) => value.toString(16).padStart(8, "0"),
  value: (value: number) => byteHex[value] ?? value.toString(16).padStart(2, "0").toUpperCase(),
  ascii: formatASCII,
};

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

export const hexTableHeader: HexTableHeader = {
  offset: "76543210",
  value: [
    "00",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "0A",
    "0B",
    "0C",
    "0D",
    "0E",
    "0F",
  ],
  ascii: "0123456789ABCDEF",
};

/** Header layout definitions. */
export interface HexTableDimensions {
  /** The number of columns to show in the byte value section of the table. */
  columns: number;
  /** The number of bytes to cluster together in the byte value section of the table. */
  grouping: number;
  /** The maxiumum number of rows to show excluding the header & seperator rows. */
  maxRows: number;
}

export const hexTableDimensions: HexTableDimensions = {
  columns: 16,
  grouping: 4,
  maxRows: 40,
};

/**
 * Generate a nicely formatted hex editor style table.
 * @param input Input data to print out as a hex table.
 * @param offset Display offset for the first byte; reading starts at the input DataBuffer cursor.
 * @param dimensions Table size parameters for columns, rows and byte grouping.
 * @param header The values for building the table header with offset, bytes and ASCII values.
 * @param format The formatting functions for displaying offset, bytes and ASCII values.
 * @returns The hex table ASCII.
 */
export const hexTable = (
  input: DataBuffer,
  offset: number = 0,
  dimensions: HexTableDimensions = hexTableDimensions,
  header: HexTableHeader = hexTableHeader,
  format: HexTableFormater = hexTableFormaters,
): string => {
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new RangeError(`Invalid display offset: ${offset}`);
  }
  if (
    !Number.isSafeInteger(dimensions.columns) ||
    dimensions.columns < 1 ||
    !Number.isSafeInteger(dimensions.grouping) ||
    dimensions.grouping < 1 ||
    (dimensions.maxRows !== Infinity &&
      (!Number.isSafeInteger(dimensions.maxRows) || dimensions.maxRows < 0))
  ) {
    throw new RangeError("Invalid hex table dimensions.");
  }
  // Do not manipulate the input data.
  // The default ASCII formatter needs no lookahead, so copy only the bytes that can be displayed.
  // Custom callbacks retain a complete independent copy for lookahead and local cursor changes.
  const defaultASCII = format.ascii === formatASCII;
  const data = defaultASCII
    ? input.slice(
        input.offset,
        Math.min(input.remainingBytes(), dimensions.columns * dimensions.maxRows),
      )
    : input.copy();
  if (!defaultASCII) {
    data.seek(input.offset);
  }
  // Build the header, offset, then bytes with grouping & the dashed line seperator
  // Start with determining the customizable byte area for the header and separator
  let headerByteValues = "";
  for (let column = 0; column < dimensions.columns; column++) {
    headerByteValues += header.value[column] ?? format.value(column);
    // Grouping by provided value value, add spacing every gap space, but not the last column.
    if (column + 1 !== dimensions.columns && (column + 1) % dimensions.grouping === 0) {
      headerByteValues += " ";
    }
  }
  const headerASCII = header.ascii.slice(0, dimensions.columns).padEnd(dimensions.columns, " ");
  let output = `| ${header.offset} | ${headerByteValues} | ${headerASCII} |\n`;
  output += `|-${"-".repeat(header.offset.length)}-|-${"-".repeat(headerByteValues.length)}-|-${"-".repeat(headerASCII.length)}-|\n`;

  // Build the actual data portion of the table, starting from the provided offset.
  let ascii = "";
  let asciiValue = "";
  let asciiFlags: Record<string, boolean | number | string> = {};
  let row = 0;
  let column = 0;
  let valueWidth = 2;
  while (data.remainingBytes() > 0 && row < dimensions.maxRows) {
    // Update the offset when we get to a new column
    if (column === 0) {
      output += `| ${format.offset(offset)} | `;
    }

    // Read the actual value from the data and format it for the output
    const value = data.readUInt8();
    const formattedValue = format.value(value);
    if (column === 0) {
      valueWidth = formattedValue.length;
    }
    output += formattedValue;
    const asciiFormatted = format.ascii(value, asciiFlags, data);
    if (typeof asciiFormatted === "string") {
      asciiValue = asciiFormatted;
    } else {
      [asciiValue, asciiFlags] = asciiFormatted;
    }
    ascii += asciiValue;

    // Add spacing every gap space, but not the last column.
    if (column + 1 !== dimensions.columns && (column + 1) % dimensions.grouping === 0) {
      output += " ";
    }

    // Update the counters.
    column++;
    offset++;

    // Is this a new column, if so we reset
    if (column >= dimensions.columns) {
      output += ` | ${ascii} |\n`;
      ascii = "";
      column = 0;
      row++;
    }
  }

  // Fill in empty space to maintain the shape
  if (column > 0) {
    const emptyValue = " ".repeat(valueWidth);
    while (column < dimensions.columns) {
      ascii += " ";
      output += emptyValue;
      // Add spacing every gap space, but not the last column.
      if (column + 1 !== dimensions.columns && (column + 1) % dimensions.grouping === 0) {
        output += " ";
      }
      column++;
    }
    output += ` | ${ascii} |\n`;
  }

  return output.trimEnd();
};

/**
 * Format a table line seperator for a given theme.
 * @param columnLengths An array with each columns length
 * @param type The type of the separator
 * @param options The options for the formatting including the theme and padding.
 * @returns The seperator
 */
export const formatTableLine = (
  columnLengths: number[],
  type: string,
  options: FormatTableOptions,
): string => {
  if (
    !Number.isSafeInteger(options.padding) ||
    options.padding < 0 ||
    columnLengths.some((length) => !Number.isSafeInteger(length) || length < 0)
  ) {
    throw new RangeError("Invalid table padding or column length.");
  }
  if (columnLengths.length === 0) {
    return "";
  }
  // Separator for top bottom mid
  let separator = "";
  const { theme } = options;

  switch (type) {
    case "top":
    case "title_top":
      separator += theme.upperLeft;
      break;
    case "bottom":
      separator += theme.lowerLeft;
      break;
    case "title_bottom":
    default:
      separator += theme.intersectionLeft;
  }

  for (let i = 0; i < columnLengths.length; i++) {
    separator += theme.line.repeat(columnLengths[i]); // horizontal line
    separator += theme.line.repeat(options.padding * 2);

    if (i === columnLengths.length - 1) {
      switch (type) {
        case "top":
        case "title_top":
          separator += theme.upperRight;
          break;
        case "bottom":
          separator += theme.lowerRight;
          break;
        case "title_bottom":
          separator += theme.intersectionRight;
          break;
        default:
          separator += theme.intersectionRight;
      }
    } else {
      switch (type) {
        case "top":
        case "title_bottom":
          separator += theme.intersectionTop;
          break;
        case "bottom":
          separator += theme.intersectionBottom;
          break;
        case "title_top":
          separator += theme.line;
          break;
        default:
          separator += theme.intersection;
      }
    }
  }

  return separator;
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
export const formatTableThemeMySQL: TableFormatStyle = {
  topRow: true,
  bottomRow: true,
  upperLeft: "+",
  upperRight: "+",
  lowerLeft: "+",
  lowerRight: "+",
  intersection: "+",
  line: "-",
  wall: "|",
  intersectionTop: "+",
  intersectionBottom: "+",
  intersectionLeft: "+",
  intersectionRight: "+",
};

/** Unicode Style Table Layout */
export const formatTableThemeUnicode: TableFormatStyle = {
  topRow: true,
  bottomRow: true,
  upperLeft: "╔",
  upperRight: "╗",
  lowerLeft: "╚",
  lowerRight: "╝",
  intersection: "╬",
  line: "═",
  wall: "║",
  intersectionTop: "╦",
  intersectionBottom: "╩",
  intersectionLeft: "╠",
  intersectionRight: "╣",
};

/** Markdown Style Table Layout */
export const formatTableThemeMarkdown: TableFormatStyle = {
  topRow: false,
  bottomRow: false,
  upperLeft: "|",
  upperRight: "|",
  lowerLeft: "|",
  lowerRight: "|",
  intersection: "|",
  line: "-",
  wall: "|",
  intersectionTop: "|",
  intersectionBottom: "|",
  intersectionLeft: "|",
  intersectionRight: "|",
};

export interface FormatTableOptions {
  align: string[];
  padding: number;
  theme: TableFormatStyle;
  title: string;
}

// TODO: Emoji length is incorrect, for example:
// TODO: [...new Intl.Segmenter().segment('👩‍👩‍👧‍👦')].length === 1
// TODO: '👩‍👩‍👧‍👦'.length === 11
// TODO: From https://stackoverflow.com/questions/54369513/how-to-count-the-correct-length-of-a-string-with-emojis-in-javascript
// TODO: Add a flag to check for multibyte emoji
// TODO: See https://github.com/orling/grapheme-splitter for an indepth explination
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
export const formatTable = (
  data: readonly (readonly unknown[])[],
  options: Partial<FormatTableOptions> = {},
): string => {
  const align = options.align ?? ["left"];
  const padding = options.padding ?? 1;
  const theme = options.theme ?? formatTableThemeMySQL;
  const title = options.title ?? "";
  const resolved: FormatTableOptions = { align, padding, theme, title };

  if (!Number.isSafeInteger(padding) || padding < 0) {
    throw new RangeError(`Invalid table padding: ${padding}`);
  }
  // Do not mutate the parameter array; normalize cells once without a deep copy.
  const rows = data.map((row) =>
    Array.from(row, (column) => {
      const value = String(column);
      return value.includes("\n") || value.includes("\r") ? value.split(/\r\n|\r|\n/) : [value];
    }),
  );
  if (rows.length === 0) {
    return "";
  }

  // Ensure all the rows have the same number of columns.
  const allSameLength = data.every(({ length }) => length === data[0].length);
  if (!allSameLength) {
    debug("Uneven number of columns");
  }

  // Make an array with the length of each column
  const columnLengths: number[] = [];
  for (const row of rows) {
    for (const [i, column] of row.entries()) {
      for (const line of column) {
        columnLengths[i] = Math.max(columnLengths[i] || 1, line.length);
      }
    }
  }
  if (columnLengths.length === 0) {
    return "";
  }
  const titleLines = resolved.title.split(/\r\n|\r|\n/);
  if (resolved.title) {
    const innerWidth =
      columnLengths.reduce((sum, length) => sum + length + padding * 2, 0) +
      (columnLengths.length - 1) * resolved.theme.wall.length;
    const titleWidth = titleLines.reduce((maximum, line) => Math.max(maximum, line.length), 0);
    // Expand the final column instead of creating a negative padding length for a long title.
    columnLengths[columnLengths.length - 1] += Math.max(0, titleWidth - innerWidth);
  }

  // Add the title or the top line if the theme needs it
  let outputString = "";
  if (resolved.title) {
    outputString += `${formatTableLine(columnLengths, "title_top", resolved)}\n`;

    const total_length = formatTableLine(columnLengths, "", resolved).length;
    for (const line of titleLines) {
      const rem = Math.max(0, total_length - resolved.theme.wall.length * 2 - line.length);
      const half = Math.floor(rem / 2);

      let row = resolved.theme.wall;
      row += " ".repeat(half);
      row += line;
      row += " ".repeat(half + (rem % 2));
      row += resolved.theme.wall;
      outputString += `${row}\n`;
    }
    outputString += `${formatTableLine(columnLengths, "title_bottom", resolved)}\n`;
  } else if (resolved.theme.topRow) {
    outputString += `${formatTableLine(columnLengths, "top", resolved)}\n`; // Add top line
  }

  // Fill rows
  const cellPadding = " ".repeat(resolved.padding);
  for (let i = 0; i < rows.length; i++) {
    const height = rows[i].reduce((maximum, column) => Math.max(maximum, column.length), 1);
    for (let line = 0; line < height; line++) {
      let row = resolved.theme.wall;
      for (let j = 0; j < columnLengths.length; j++) {
        let col = cellPadding; // Left padding
        const value = rows[i][j]?.[line] ?? "";
        if (resolved.align[j] === "right") {
          col += value.padStart(columnLengths[j], " ");
        } else {
          col += value.padEnd(columnLengths[j], " ");
        }
        col += cellPadding;

        // if its not the last col
        if (j !== columnLengths.length - 1) {
          col += resolved.theme.wall;
        }
        row += col;
      }
      row += resolved.theme.wall;
      outputString += `${row}\n`;
    }

    // Header
    if (i === 0) {
      outputString += `${formatTableLine(columnLengths, "", resolved)}\n`;
    }
  }

  if (resolved.theme.bottomRow) {
    outputString += formatTableLine(columnLengths, "bottom", resolved);
  }

  return outputString;
};

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

/** A display column may be absent from either side of an insertion or deletion. */
interface DiffHexCell {
  x: number | undefined;
  y: number | undefined;
  op: number;
}

/** Reject non-byte values rather than rendering misleading NaN, string, or overflowing cells. */
const diffByte = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`Expected a byte value: ${String(value)}`);
  }
  return value;
};

/**
 * Format diff edits as a hex-friendly table showing changes.
 * Shows three rows: original data, delta values, and resulting data. Missing bytes use --; offsets track each side independently.
 * @param edits The diff edits to format.
 * @param options Configuration options.
 * @returns The formatted diff output.
 */
export const formatDiffHex = (
  edits: Edit[],
  options: Partial<FormatDiffHexOptions> = {},
): string => {
  const bytesPerRow = options.bytesPerRow ?? 16;
  if (!Number.isSafeInteger(bytesPerRow) || bytesPerRow < 1) {
    throw new RangeError(`Invalid bytes per row: ${bytesPerRow}`);
  }
  const showOffset = options.showOffset ?? true;
  const showAscii = options.showAscii ?? true;
  const showBits = options.showBits ?? true;
  let output = "";
  let xOffset = 0;
  let yOffset = 0;
  let rowBuffer: DiffHexCell[] = [];

  const flushRow = () => {
    if (rowBuffer.length === 0) {
      return;
    }

    // Check if this row has any changes
    const hasChanges = xOffset !== yOffset || rowBuffer.some(({ op }) => op !== 0);

    let offsetPrefix: string;
    if (showOffset) {
      offsetPrefix = `${xOffset.toString(16).padStart(8, "0")} | `;
    } else if (hasChanges) {
      offsetPrefix = " ";
    } else {
      offsetPrefix = "";
    }
    const resultOffsetPrefix = showOffset ? `${yOffset.toString(16).padStart(8, "0")} | ` : " ";
    xOffset += rowBuffer.reduce((count, cell) => count + (cell.x === undefined ? 0 : 1), 0);
    yOffset += rowBuffer.reduce((count, cell) => count + (cell.y === undefined ? 0 : 1), 0);

    // If no changes, just show a single row
    if (!hasChanges) {
      let row = offsetPrefix;
      let rowBits = "";
      let rowAscii = "";

      for (let i = 0; i < bytesPerRow; i++) {
        if (i < rowBuffer.length) {
          const { x } = rowBuffer[i];
          const hex = x === undefined ? "--" : byteHex[x];
          row += hex;

          if (showBits) {
            const bits = x === undefined ? "--------" : byteBits[x];
            rowBits += bits;
          }

          if (showAscii) {
            let char: string;
            if (x === undefined) {
              char = " ";
            } else if (x >= 0x20 && x <= 0x7e) {
              char = String.fromCharCode(x);
            } else {
              char = ".";
            }
            rowAscii += char;
          }
        } else {
          row += "  ";
          if (showBits) {
            rowBits += "        ";
          }
          if (showAscii) {
            rowAscii += " ";
          }
        }

        // Add spacing: 1 space between bytes, 2 spaces every 4 bytes
        if (i < bytesPerRow - 1) {
          row += (i + 1) % 4 === 0 ? "  " : " ";
          if (showBits) {
            rowBits += (i + 1) % 4 === 0 ? "  " : " ";
          }
        }
      }

      if (showBits) {
        row += " | " + rowBits;
      }

      if (showAscii) {
        row += " | " + rowAscii;
      }

      output += row + "\n";
      rowBuffer = [];
      return;
    }

    // Has changes, show three-row format
    const offsetPadding = showOffset ? " ".repeat(11) : " ";

    // Row 1: Original data
    let row1 = offsetPrefix;
    let row1Bits = "";
    let row1Ascii = "";

    // Row 2: Delta (difference between y and x)
    let row2 = offsetPadding;
    let row2Bits = "";

    // Row 3: Resulting data
    let row3 = resultOffsetPrefix;
    let row3Bits = "";
    let row3Ascii = "";

    for (let i = 0; i < bytesPerRow; i++) {
      if (i < rowBuffer.length) {
        const { x, y, op } = rowBuffer[i];

        // Original value
        const hex1 = x === undefined ? "--" : byteHex[x];
        row1 += hex1;

        if (showBits) {
          const bits1 = x === undefined ? "--------" : byteBits[x];
          row1Bits += bits1;
        }

        if (showAscii) {
          let char: string;
          if (x === undefined) {
            char = " ";
          } else if (x >= 0x20 && x <= 0x7e) {
            char = String.fromCharCode(x);
          } else {
            char = ".";
          }
          row1Ascii += char;
        }

        // Delta calculation - sign goes in the preceding space, then hex value
        if (op === 0) {
          // Match - no change
          row2 += "  ";
          if (showBits) {
            row2Bits += "        ";
          }
        } else {
          // Calculate signed difference
          const diff = (y ?? 0) - (x ?? 0);
          let sign: string;
          if (y === undefined) {
            sign = "-";
          } else if (x === undefined || diff >= 0) {
            sign = "+";
          } else {
            sign = "-";
          }
          const absDiff = Math.abs(diff);
          const deltaHex = byteHex[absDiff];
          // Back up one character to place sign in the space before the hex
          row2 = row2.slice(0, -1) + sign + deltaHex;

          if (showBits) {
            // Show XOR of bits to highlight which bits changed
            const xor = (x ?? 0) ^ (y ?? 0);
            // Replace 0s with spaces, keep 1s to show which bits flipped
            const diffBits = x === undefined || y === undefined ? "^^^^^^^^" : byteBitChanges[xor];
            row2Bits += diffBits;
          }
        }

        // Resulting value
        const hex3 = y === undefined ? "--" : byteHex[y];
        row3 += hex3;

        if (showBits) {
          const bits3 = y === undefined ? "--------" : byteBits[y];
          row3Bits += bits3;
        }

        if (showAscii) {
          let char: string;
          if (y === undefined) {
            char = " ";
          } else if (y >= 0x20 && y <= 0x7e) {
            char = String.fromCharCode(y);
          } else {
            char = ".";
          }
          row3Ascii += char;
        }
      } else {
        row1 += "  ";
        row2 += "  ";
        row3 += "  ";
        if (showBits) {
          row1Bits += "        ";
          row2Bits += "        ";
          row3Bits += "        ";
        }
        if (showAscii) {
          row1Ascii += " ";
          row3Ascii += " ";
        }
      }

      // Add spacing: 1 space between bytes, 2 spaces every 4 bytes
      if (i < bytesPerRow - 1) {
        if ((i + 1) % 4 === 0) {
          row1 += "  ";
          row2 += "  ";
          row3 += "  ";
          if (showBits) {
            row1Bits += "  ";
            row2Bits += "  ";
            row3Bits += "  ";
          }
        } else {
          row1 += " ";
          row2 += " ";
          row3 += " ";
          if (showBits) {
            row1Bits += " ";
            row2Bits += " ";
            row3Bits += " ";
          }
        }
      }
    }

    if (showBits) {
      row1 += " | " + row1Bits;
      row2 += " | " + row2Bits;
      row3 += " | " + row3Bits;
    }

    if (showAscii) {
      row1 += " | " + row1Ascii;
      row3 += " | " + row3Ascii;
    }

    output += row1 + "\n";
    output += row2 + "\n";
    output += row3 + "\n";

    rowBuffer = [];
  };

  const append = (cell: DiffHexCell) => {
    rowBuffer.push(cell);
    if (rowBuffer.length >= bytesPerRow) {
      flushRow();
    }
  };

  // Process edits, combining delete+insert runs into replacements while preserving both sequences.
  for (let i = 0; i < edits.length;) {
    const { op, x, y } = edits[i];
    if (op === 0) {
      // Match
      const original = diffByte(x);
      const modified = diffByte(y);
      if (original !== modified) {
        throw new RangeError("A match edit must contain equal byte values.");
      }
      append({ x: original, y: modified, op });
      i++;
      continue;
    }

    const deleted: number[] = [];
    const inserted: number[] = [];
    while (i < edits.length && edits[i].op !== 0) {
      const edit = edits[i++];
      if (edit.op === 1) {
        // Delete
        deleted.push(diffByte(edit.x));
      } else if (edit.op === 2) {
        // Insert (standalone, not part of replacement until paired below)
        inserted.push(diffByte(edit.y));
      } else {
        throw new RangeError(`Invalid edit operation: ${edit.op}`);
      }
    }
    for (let j = 0; j < Math.max(deleted.length, inserted.length); j++) {
      // Show as change; standalone deletes and inserts retain an absent side rather than a fictitious byte.
      append({ x: deleted[j], y: inserted[j], op: j < deleted.length ? 1 : 2 });
    }
  }

  flushRow();

  return output.trimEnd();
};

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
export const formatDiffHunks = (
  hunks: Hunk[],
  options: Partial<FormatDiffHunksOptions> = {},
): string => {
  const context = options.context ?? 3;
  if (!Number.isSafeInteger(context) || context < 0) {
    throw new RangeError(`Invalid diff context: ${context}`);
  }
  let output = "";

  for (const hunk of hunks) {
    const { posX, posY, edits } = hunk;

    // Find the range of changes (non-match operations)
    const firstChangeIdx = edits.findIndex((e) => e.op !== 0);
    let lastChangeIdx = edits.length - 1;
    while (lastChangeIdx >= 0 && edits[lastChangeIdx].op === 0) {
      lastChangeIdx--;
    }

    // No changes in this hunk, skip it
    if (firstChangeIdx === -1) {
      continue;
    }

    // Calculate context range
    const startIdx = Math.max(0, firstChangeIdx - context);
    const endIdx = Math.min(edits.length, lastChangeIdx + context + 1);

    // Calculate actual positions for header
    let xCount = 0;
    let yCount = 0;
    for (let i = startIdx; i < endIdx; i++) {
      // Not an insert
      if (edits[i].op !== 2) {
        xCount++;
      }
      // Not a delete
      if (edits[i].op !== 1) {
        yCount++;
      }
    }

    if (!Number.isSafeInteger(posX) || posX < 0 || !Number.isSafeInteger(posY) || posY < 0) {
      throw new RangeError("Invalid diff hunk position.");
    }
    let actualPosX = posX;
    let actualPosY = posY;
    for (let i = 0; i < startIdx; i++) {
      if (edits[i].op !== 2) {
        actualPosX++;
      }
      if (edits[i].op !== 1) {
        actualPosY++;
      }
    }

    // Header line
    output += `@@ -${actualPosX},${xCount} +${actualPosY},${yCount} @@\n`;

    // Process edits with context
    for (let i = startIdx; i < endIdx; i++) {
      const edit = edits[i];
      const { op, x, y } = edit;

      if (op !== 0 && op !== 1 && op !== 2) {
        throw new RangeError(`Invalid edit operation: ${op}`);
      }
      {
        const value = op === 2 ? y : x;
        const hex =
          typeof value === "number" && Number.isInteger(value) ? (byteHex[value] ?? "??") : "??";

        let char = ".";
        if (
          typeof value === "number" &&
          Number.isInteger(value) &&
          value >= 0x20 &&
          value <= 0x7e
        ) {
          char = String.fromCharCode(value);
        }

        if (op === 0) {
          // Match
          output += ` ${hex}  ${char}\n`;
        } else if (op === 1) {
          // Delete
          output += `-${hex}  ${char}\n`;
        } else if (op === 2) {
          // Insert
          output += `+${hex}  ${char}\n`;
        }
      }
    }

    output += "\n";
  }

  return output.trim();
};

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
export const formatMyersGraph = (
  rx: boolean[],
  ry: boolean[],
  x: unknown[],
  y: unknown[],
  options: Partial<FormatMyersGraphOptions> = {},
): string => {
  const showFull = options.showFull ?? false;
  const showLabels = options.showLabels ?? true;
  const width = x.length;
  const height = y.length;

  // Build the grid
  // Each cell is at least 4 chars wide: "o---" or "o   ", growing for wider axis labels.
  // Each row is 2 lines tall: node line and edge line
  const gridWidth = width + 1;
  const gridHeight = height + 1;
  const cellWidth = Math.max(4, width.toString().length + 1);
  const charWidth = gridWidth * cellWidth;
  const charHeight = gridHeight * 2;

  const maxCells = options.maxCells ?? 1_000_000;
  if (!Number.isSafeInteger(maxCells) || maxCells < 1 || charWidth * charHeight > maxCells) {
    throw new RangeError("Myers graph exceeds the maximum character cell count.");
  }
  const rowLabelWidth = Math.max(2, height.toString().length, cellWidth - 2);

  // Trace the path through the grid
  const path: MyersPathNode[] = [];
  let xi = 0;
  let yi = 0;

  path.push({ x: xi, y: yi });

  while (xi < width || yi < height) {
    if (xi < width && yi < height && !rx[xi] && !ry[yi]) {
      // Match - move diagonally
      xi++;
      yi++;
      path.push({ x: xi, y: yi, diagonal: true });
    } else if (xi < width && rx[xi]) {
      // Delete from x - move right
      xi++;
      path.push({ x: xi, y: yi, horizontal: true });
    } else if (yi < height && ry[yi]) {
      // Insert from y - move down
      yi++;
      path.push({ x: xi, y: yi, vertical: true });
    } else {
      break;
    }
  }

  // Initialize grid with spaces
  const grid: string[][] = Array.from({ length: charHeight }, () =>
    Array<string>(charWidth).fill(" "),
  );

  if (showFull) {
    // Draw full grid
    for (let row = 0; row <= height; row++) {
      for (let col = 0; col <= width; col++) {
        const gridY = row * 2;
        const gridX = col * cellWidth;

        // Place node
        grid[gridY][gridX] = "o";

        // Horizontal edges
        if (col < width) {
          for (let edge = 1; edge < cellWidth; edge++) {
            grid[gridY][gridX + edge] = "-";
          }
        }

        // Vertical edges
        if (row < height) {
          grid[gridY + 1][gridX] = "|";
        }

        // Diagonal edges (only where the elements actually match)
        if (col < width && row < height) {
          // Check if x[col] actually equals y[row]
          if (x[col] === y[row]) {
            grid[gridY + 1][gridX + Math.floor(cellWidth / 2)] = "\\";
          }
        }
      }
    }
  } else {
    // Draw only the path
    for (let i = 0; i < path.length; i++) {
      const { x: col, y: row } = path[i];
      const gridY = row * 2;
      const gridX = col * cellWidth;

      // Place node
      grid[gridY][gridX] = "o";

      // Draw edge to next node
      if (i < path.length - 1) {
        const next = path[i + 1];

        if (next.diagonal) {
          // Diagonal edge
          grid[gridY + 1][gridX + Math.floor(cellWidth / 2)] = "\\";
        } else if (next.horizontal) {
          // Horizontal edge
          for (let edge = 1; edge < cellWidth; edge++) {
            grid[gridY][gridX + edge] = "-";
          }
        } else if (next.vertical) {
          // Vertical edge
          grid[gridY + 1][gridX] = "|";
        }
      }
    }
  }

  // Convert grid to string with labels
  let output = "";

  if (showLabels) {
    // Top row: column numbers
    output += " ".repeat(rowLabelWidth - cellWidth + 2);
    for (let col = 0; col <= width; col++) {
      output += col.toString().padStart(cellWidth, " ");
    }
    output += "\n";
  }

  // Grid rows
  for (let row = 0; row < charHeight; row++) {
    if (showLabels && row % 2 === 0) {
      // Add row number for node lines
      output += (row / 2).toString().padStart(rowLabelWidth, " ") + " ";
    } else if (showLabels) {
      // Spacer for edge lines
      output += " ".repeat(rowLabelWidth + 1);
    }

    output += grid[row].join("") + "\n";
  }

  return output.trimEnd();
};

export default {
  formatBytes,
  formatASCII,
  hexTable,
  hexTableDimensions,
  hexTableHeader,
  hexTableFormaters,
  formatTable,
  formatTableThemeMySQL,
  formatTableThemeUnicode,
  formatTableThemeMarkdown,
  formatDiffHex,
  formatDiffHunks,
  formatMyersGraph,
};
