import DataBuffer from './data-buffer.js';
import DataStream from './data-stream.js';

let debug = (..._) => {};
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) { try { const { default: d } = await import('debug'); debug = d('DataFormatting'); } catch {} }

/**
 * Format an amount of bytes to a human friendly string.
 * @param {number} input The number of bytes.
 * @param {number} [decimals] The number of trailing decimal places to chop to, default is 2.
 * @param {number} [bytes] The byte division value, alternatively could be 1000 for decimal values rather than binary values, default is 1024.
 * @param {string[]} [sizes] An optional array of the various size suffixes in ascending order of size: `['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']`
 * @returns {string} The human friendly representation of the number of bytes.
 * @see {@link https://en.wikipedia.org/wiki/Byte#Multiple-byte_units|Multiple-byte units}
 */
export const formatBytes = (input, decimals = 2, bytes = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']) => {
  if (input === 0) {
    return `0 ${sizes[0]}`;
  }
  const i = Math.floor(Math.log(input) / Math.log(bytes));
  return `${Number.parseFloat((input / bytes ** i).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * ASCII text formatting function.
 * @param {number} value Input data to print out as a hex table.
 * @param {Record<string, boolean|number|string>} asciiFlags Any flags needed by the formatter.
 * @param {DataBuffer|DataStream} _data The data being processed.
 * @returns {import('../dist/custom.js').FormatASCIIOutput} Returns an array with the Character to represent this value and any flags for the function.
 */
export const formatASCII = (value, asciiFlags, _data) => {
  // Unprintable ASCII < 128 == ' ', > 128 == '.'
  if (value < 0x20) {
    return [' ', asciiFlags];
  }
  if (value > 0x7E) {
    return ['.', asciiFlags];
  }
  // Alternatively: value.replace(/[^\x20-\x7E]+/g, '_')
  return [String.fromCharCode(value), asciiFlags];
};

/**
 * Formatting functions for all value types.
 * @typedef {object} HexTableFormater
 * @property {import('../dist/custom.js').FormatNumber} offset Offset formatting fuction.
 * @property {import('../dist/custom.js').FormatNumber} value Byte value formating function.
 * @property {import('../dist/custom.js').FormatNumberToASCII} ascii ASCII text formatting function.
 */
/**
 * @type {import('../dist/custom.js').HexTableFormater}
 */
export const hexTableFormaters = {
  offset: (value) => value.toString(16).padStart(8, '0'),
  value: (value) => value.toString(16).padStart(2, '0').toUpperCase(),
  ascii: formatASCII,
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
export const hexTableHeader = {
  offset: '76543210',
  value: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '0E', '0F'],
  ascii: '0123456789ABCDEF',
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
export const hexTableDimensions = {
  columns: 16,
  grouping: 4,
  maxRows: 40,
};

/**
 * Generate a nicely formatted hex editor style table.
 * @param {DataBuffer|DataStream} input Input data to print out as a hex table.
 * @param {number} offset Offset in the DataStream to start from.
 * @param {HexTableDimensions} dimensions Table size parameters for columns, rows and byte grouping.
 * @param {HexTableHeader} header The values for building the table header with offset, bytes and ASCII values.
 * @param {HexTableFormater} format The formatting functions for displaying offset, bytes and ASCII values.
 * @returns {string} The hex table ASCII.
 */
export const hexTable = (input, offset = 0, dimensions = hexTableDimensions, header = hexTableHeader, format = hexTableFormaters) => {
  // Do not manipulate the input data.
  const data = input.copy();
  // Build the header, offset, then bytes with grouping & the dashed line seperator
  // Start with determining the customizable byte area for the header and seperatpr
  let headerByteValues = '';
  header.value.forEach((byte, column) => {
    headerByteValues += byte;
    // Grouping by provided value value, add spacing every gap space, but not the last column.
    if ((column + 1) !== dimensions.columns && (column + 1) % dimensions.grouping === 0) {
      headerByteValues += ' ';
    }
  });
  let output = `| ${header.offset} | ${headerByteValues} | ${header.ascii} |\n`;
  output += `|-${'-'.repeat(header.offset.length)}-|-${'-'.repeat(headerByteValues.length)}-|-${'-'.repeat(header.ascii.length)}-|\n`;

  // Build the actual data portion of the table, starting from the provided offset.
  let ascii = '';
  let asciiValue = '';
  /** @type {Record<string, boolean|number|string>} */
  let asciiFlags = {};
  let row = 0;
  let column = 0;
  while (data.remainingBytes() && row !== dimensions.maxRows) {
    // Update the offset when we get to a new column
    if (column === 0) {
      output += `| ${format.offset(offset)} | `;
    }

    // Read the actual value from the data and format it for the output
    const value = data.readUInt8();
    output += format.value(value);
    [asciiValue, asciiFlags] = format.ascii(value, asciiFlags, data);
    ascii += asciiValue;

    // Add spacing every gap space, but not the last column.
    if ((column + 1) !== dimensions.columns && (column + 1) % dimensions.grouping === 0) {
      output += ' ';
    }

    // Update the counters.
    column++;
    offset++;

    // Is this a new column, if so we reset
    if (column >= dimensions.columns) {
      output += ` | ${ascii} |\n`;
      ascii = '';
      column = 0;
      row++;
    }
  }

  // Fill in empty space to maintain the shape
  if (column > 0) {
    while (column <= dimensions.columns) {
      if (column === dimensions.columns) {
        output += ` | ${ascii} |`;
        ascii = '';
        row++;
      }
      ascii += ' ';
      output += '  ';
      // Add spacing every gap space, but not the last column.
      if ((column + 1) !== dimensions.columns && (column + 1) % dimensions.grouping === 0) {
        output += ' ';
      }
      column++;
      offset++;
    }
  }

  return output.trim();
};

/**
 * Format a table line seperator for a given theme.
 * @param {number[]} columnLengths An array with each columns length
 * @param {string} type The type of the separator
 * @param {object} options The options
 * @param {TableFormatStyle} options.theme The theme to use for formatting.
 * @param {number} options.padding The amount of padding to use.
 * @returns {string} The seperator
 */
export const formatTableLine = (columnLengths, type, options) => {
  // Separator for top bottom mid
  let separator = '';
  const { theme } = options;

  switch (type) {
    case 'top':
    case 'title_top':
      separator += theme.upperLeft;
      break;
    case 'bottom':
      separator += theme.lowerLeft;
      break;
    case 'title_bottom':
    default:
      separator += theme.intersectionLeft;
  }

  for (let i = 0; i < columnLengths.length; i++) {
    for (let l = 0; l < columnLengths[i]; l++) {
      separator += theme.line; // horizontal line
    }
    separator += Array(options.padding * 2 + 1).join(theme.line);

    if (i === columnLengths.length - 1) {
      switch (type) {
        case 'top':
        case 'title_top':
          separator += theme.upperRight;
          break;
        case 'bottom':
          separator += theme.lowerRight;
          break;
        case 'title_bottom':
          separator += theme.intersectionRight;
          break;
        default:
          separator += theme.intersectionRight;
      }
    } else {
      switch (type) {
        case 'top':
        case 'title_bottom':
          separator += theme.intersectionTop;
          break;
        case 'bottom':
          separator += theme.intersectionBottom;
          break;
        case 'title_top':
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

/**
 * MySQL Style Table Layout
 * @type {TableFormatStyle}
 */
export const formatTableThemeMySQL = {
  topRow: true,
  bottomRow: true,
  upperLeft: '+',
  upperRight: '+',
  lowerLeft: '+',
  lowerRight: '+',
  intersection: '+',
  line: '-',
  wall: '|',
  intersectionTop: '+',
  intersectionBottom: '+',
  intersectionLeft: '+',
  intersectionRight: '+',
};

/**
 * Unicode Table Layout
 * @type {TableFormatStyle}
 */
export const formatTableThemeUnicode = {
  topRow: true,
  bottomRow: true,
  upperLeft: '╔',
  upperRight: '╗',
  lowerLeft: '╚',
  lowerRight: '╝',
  intersection: '╬',
  line: '═',
  wall: '║',
  intersectionTop: '╦',
  intersectionBottom: '╩',
  intersectionLeft: '╠',
  intersectionRight: '╣',
};

/**
 * Markdown Table Layout
 * @type {TableFormatStyle}
 */
export const formatTableThemeMarkdown = {
  topRow: false,
  bottomRow: false,
  upperLeft: '|',
  upperRight: '|',
  lowerLeft: '|',
  lowerRight: '|',
  intersection: '|',
  line: '-',
  wall: '|',
  intersectionTop: '|',
  intersectionBottom: '|',
  intersectionLeft: '|',
  intersectionRight: '|',
};

// TODO: Emoji length is incorrect, for example:
// TODO: [...new Intl.Segmenter().segment('👩‍👩‍👧‍👦')].length === 1
// TODO: '👩‍👩‍👧‍👦'.length === 11
// TODO: From https://stackoverflow.com/questions/54369513/how-to-count-the-correct-length-of-a-string-with-emojis-in-javascript
// TODO: Add a flag to check for multibyte emoji
// TODO: See https://github.com/orling/grapheme-splitter for an indepth explination
/**
 * Create an ASCII table from provided data and configuration.
 * @param {string[][]} data The data to add to the table.
 * @param {object} options Configuration.
 * @param {string[]} options.align The alignment of each column, left or right.
 * @param {number} options.padding Amount of padding to add to each cell.
 * @param {TableFormatStyle} options.theme The theme to use for formatting.
 * @param {string} options.title The title to display at the top of the table.
 * @returns {string} The ASCII table of data.
 */
export const formatTable = (data, options) => {
  // Use JSON parse & stringify to get a deep copy of the parameter array
  data = structuredClone(data);
  options = {
    padding: 1,
    theme: formatTableThemeMySQL,
    title: '',
    ...options,
  };

  // Ensure all the rows have the same number of columns.
  const allSameLength = data.every(({ length }) => length === data[0].length);
  /* c8 ignore next 3 */
  if (!allSameLength) {
    debug('Uneven number of columns');
  }

  // Make an array with the length of each column
  const columnLengths = [];
  for (const row of data) {
    for (const [i, column] of row.entries()) {
      columnLengths[i] = Math.max(columnLengths[i] || 1, String(column).length);
    }
  }

  // Add the title or the top line if the theme needs it
  let outputString = '';
  if (options.title) {
    outputString += `${formatTableLine(columnLengths, 'title_top', options)}\n`;

    const total_length = formatTableLine(columnLengths, '', options).length;
    const rem = total_length - 2 - options.title.length;
    const half = Math.floor(rem / 2);

    let row = options.theme.wall;
    row += Array(half + 1).join(' ');
    row += options.title;
    row += Array(half + 1 + (rem % 2)).join(' ');
    row += options.theme.wall;
    outputString += `${row}\n`;
    outputString += `${formatTableLine(columnLengths, 'title_bottom', options)}\n`;
  } else if (options.theme.topRow) {
    outputString += `${formatTableLine(columnLengths, 'top', options)}\n`; // Add top line
  }

  // Fill rows
  for (let i = 0; i < data.length; i++) {
    let row = options.theme.wall;

    for (let j = 0; j < data[i].length; j++) {
      let col = Array(options.padding + 1).join(' '); // Left padding

      if (options.align[j] === 'right') {
        for (let l = 0; l < columnLengths[j] - String(data[i][j]).length; l++) {
          col += ' ';
        }
        col += data[i][j];
      } else {
        col += data[i][j];
        if (String(data[i][j]).length < columnLengths[j]) {
          for (let l = 0; l < columnLengths[j] - String(data[i][j]).length; l++) {
            col += ' ';
          }
        }
      }

      col += Array(options.padding + 1).join(' ');

      // if its not the last col
      if (j !== data[i].length - 1) {
        col += options.theme.wall;
      }
      row += col;
    }
    row += options.theme.wall;
    outputString += `${row}\n`;

    // Header
    if (i === 0) {
      outputString += `${formatTableLine(columnLengths, '', options)}\n`;
    }
  }

  if (options.theme.bottomRow) {
    outputString += formatTableLine(columnLengths, 'bottom', options);
  }

  return outputString;
};

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
export const formatDiffHex = (edits, options = {}) => {
  const config = {
    bytesPerRow: 16,
    showOffset: true,
    showAscii: true,
    showBits: true,
    ...options,
  };

  let output = '';
  let xOffset = 0;
  /** @type {import('./diff/diff.js').Edit[]} */
  let rowBuffer = [];

  const flushRow = () => {
    if (rowBuffer.length === 0) return;

    // Check if this row has any changes
    const hasChanges = rowBuffer.some(({ op }) => op !== 0);

    const offsetPrefix = config.showOffset ? `${xOffset.toString(16).padStart(8, '0')} | ` : '';

    // If no changes, just show a single row
    if (!hasChanges) {
      let row = offsetPrefix;
      let rowBits = '';
      let rowAscii = '';

      for (let i = 0; i < config.bytesPerRow; i++) {
        if (i < rowBuffer.length) {
          const { x } = rowBuffer[i];
          const hex = x.toString(16).padStart(2, '0').toUpperCase();
          row += hex;

          if (config.showBits) {
            const bits = x.toString(2).padStart(8, '0');
            rowBits += bits;
          }

          if (config.showAscii) {
            const char = (Number(x) >= 0x20 && Number(x) <= 0x7E) ? String.fromCharCode(Number(x)) : '.';
            rowAscii += char;
          }
        } else {
          row += '  ';
          if (config.showBits) rowBits += '        ';
          if (config.showAscii) rowAscii += ' ';
        }

        // Add spacing: 1 space between bytes, 2 spaces every 4 bytes
        if (i < config.bytesPerRow - 1) {
          row += ((i + 1) % 4 === 0) ? '  ' : ' ';
          if (config.showBits) rowBits += ((i + 1) % 4 === 0) ? '  ' : ' ';
        }
      }

      if (config.showBits) {
        row += ' | ' + rowBits;
      }

      if (config.showAscii) {
        row += ' | ' + rowAscii;
      }

      output += row + '\n';
      rowBuffer = [];
      return;
    }

    // Has changes, show three-row format
    const offsetPadding = config.showOffset ? ' '.repeat(11) : '';

    // Row 1: Original data
    let row1 = offsetPrefix;
    let row1Bits = '';
    let row1Ascii = '';

    // Row 2: Delta (difference between y and x)
    let row2 = offsetPadding;
    let row2Bits = '';

    // Row 3: Resulting data
    let row3 = offsetPrefix;
    let row3Bits = '';
    let row3Ascii = '';

    for (let i = 0; i < config.bytesPerRow; i++) {
      if (i < rowBuffer.length) {
        const { x, y, op } = rowBuffer[i];

        // Original value
        const hex1 = x.toString(16).padStart(2, '0').toUpperCase();
        row1 += hex1;

        if (config.showBits) {
          const bits1 = x.toString(2).padStart(8, '0');
          row1Bits += bits1;
        }

        if (config.showAscii) {
          const char = (Number(x) >= 0x20 && Number(x) <= 0x7E) ? String.fromCharCode(Number(x)) : '.';
          row1Ascii += char;
        }

        // Delta calculation - sign goes in the preceding space, then hex value
        if (op === 0) { // Match - no change
          row2 += '  ';
          if (config.showBits) row2Bits += '        ';
        } else {
          // Calculate signed difference
          const diff = Number(y) - Number(x);
          const sign = diff >= 0 ? '+' : '-';
          const absDiff = Math.abs(diff);
          const deltaHex = absDiff.toString(16).padStart(2, '0').toUpperCase();
          // Back up one character to place sign in the space before the hex
          row2 = row2.slice(0, -1) + sign + deltaHex;

          if (config.showBits) {
            // Show XOR of bits to highlight which bits changed
            const xor = Number(x) ^ Number(y);
            const xorBits = xor.toString(2).padStart(8, '0');
            // Replace 0s with spaces, keep 1s to show which bits flipped
            const diffBits = xorBits.split('').map(b => b === '1' ? '^' : ' ').join('');
            row2Bits += diffBits;
          }
        }

        // Resulting value
        const hex3 = y.toString(16).padStart(2, '0').toUpperCase();
        row3 += hex3;

        if (config.showBits) {
          const bits3 = y.toString(2).padStart(8, '0');
          row3Bits += bits3;
        }

        if (config.showAscii) {
          const char = (Number(y) >= 0x20 && Number(y) <= 0x7E) ? String.fromCharCode(Number(y)) : '.';
          row3Ascii += char;
        }
      } else {
        row1 += '  ';
        row2 += '  ';
        row3 += '  ';
        if (config.showBits) {
          row1Bits += '        ';
          row2Bits += '        ';
          row3Bits += '        ';
        }
        if (config.showAscii) {
          row1Ascii += ' ';
          row3Ascii += ' ';
        }
      }

      // Add spacing: 1 space between bytes, 2 spaces every 4 bytes
      if (i < config.bytesPerRow - 1) {
        if ((i + 1) % 4 === 0) {
          row1 += '  ';
          row2 += '  ';
          row3 += '  ';
          if (config.showBits) {
            row1Bits += '  ';
            row2Bits += '  ';
            row3Bits += '  ';
          }
        } else {
          row1 += ' ';
          row2 += ' ';
          row3 += ' ';
          if (config.showBits) {
            row1Bits += ' ';
            row2Bits += ' ';
            row3Bits += ' ';
          }
        }
      }
    }

    if (config.showBits) {
      row1 += ' | ' + row1Bits;
      row2 += ' | ' + row2Bits;
      row3 += ' | ' + row3Bits;
    }

    if (config.showAscii) {
      row1 += ' | ' + row1Ascii;
      row3 += ' | ' + row3Ascii;
    }

    output += row1 + '\n';
    output += row2 + '\n';
    output += row3 + '\n';

    rowBuffer = [];
  };

  // Process edits, combining delete+insert into replacements
  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i];
    const { op, x, y } = edit;

    if (op === 0) { // Match
      rowBuffer.push({ x, y, op });
    } else if (op === 1) { // Delete
      // Check if next edit is an insert - if so, treat as replacement
      if (i + 1 < edits.length && edits[i + 1].op === 2) {
        const nextEdit = edits[i + 1];
        // Show as change
        rowBuffer.push({ x, y: nextEdit.y, op: 1 });
        // Skip the next insert since we combined them
        i++;
      } else {
        // Standalone delete - show as x → x (no visual change in this context)
        rowBuffer.push({ x, y: x, op: 0 });
      }
    } else if (op === 2) { // Insert (standalone, not part of replacement)
      // Standalone insert - show as 0 → y
      rowBuffer.push({ x: 0, y, op: 2 });
    }

    if (rowBuffer.length >= config.bytesPerRow) {
      flushRow();
      xOffset += config.bytesPerRow;
    }
  }

  flushRow();

  return output.trim();
};

/**
 * Format diff hunks as a unified diff style with hex values.
 * @param {import('./diff/diff.js').Hunk[]} hunks The diff hunks to format.
 * @param {object} [options] Configuration options.
 * @param {number} [options.context] Number of context lines to show around changes, default is 3.
 * @returns {string} The formatted diff output.
 */
export const formatDiffHunks = (hunks, options = {}) => {
  const config = {
    context: 3,
    ...options,
  };

  let output = '';

  for (const hunk of hunks) {
    const { posX, posY, edits } = hunk;

    // Find the range of changes (non-match operations)
    let firstChangeIdx = edits.findIndex(e => e.op !== 0);
    let lastChangeIdx = edits.length - 1 - [...edits].reverse().findIndex(e => e.op !== 0);

    // No changes in this hunk, skip it
    if (firstChangeIdx === -1) {
      continue;
    }

    // Calculate context range
    const startIdx = Math.max(0, firstChangeIdx - config.context);
    const endIdx = Math.min(edits.length, lastChangeIdx + config.context + 1);

    // Calculate actual positions for header
    let xCount = 0;
    let yCount = 0;
    for (let i = startIdx; i < endIdx; i++) {
      // Not an insert
      if (edits[i].op !== 2) xCount++;
      // Not a delete
      if (edits[i].op !== 1) yCount++;
    }

    const actualPosX = posX + startIdx;
    const actualPosY = posY + startIdx;

    // Header line
    output += `@@ -${actualPosX},${xCount} +${actualPosY},${yCount} @@\n`;

    // Process edits with context
    for (let i = startIdx; i < endIdx; i++) {
      const edit = edits[i];
      const { op, x, y } = edit;

      if (typeof x === 'number' || typeof y === 'number') {
        const value = op === 2 ? y : x;
        const hex = typeof value === 'number' ? value.toString(16).padStart(2, '0').toUpperCase() : '??';

        let char = '.';
        if (typeof value === 'number' && value >= 0x20 && value <= 0x7E) {
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

    output += '\n';
  }

  return output.trim();
};

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
export const formatMyersGraph = (rx, ry, x, y, options = {}) => {
  const config = {
    showFull: false,
    showLabels: true,
    ...options,
  };

  const width = x.length;
  const height = y.length;

  // Trace the path through the grid
  const path = [];
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

  // Build the grid
  // Each cell is 4 chars wide: "o---" or "o   "
  // Each row is 2 lines tall: node line and edge line
  const gridWidth = width + 1;
  const gridHeight = height + 1;
  const charWidth = gridWidth * 4;
  const charHeight = gridHeight * 2;

  // Initialize grid with spaces
  /** @type {string[][]} */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const grid = Array.from({ length: charHeight }, () => Array(charWidth).fill(' '));

  if (config.showFull) {
    // Draw full grid
    for (let row = 0; row <= height; row++) {
      for (let col = 0; col <= width; col++) {
        const gridY = row * 2;
        const gridX = col * 4;

        // Place node
        grid[gridY][gridX] = 'o';

        // Horizontal edges
        if (col < width) {
          grid[gridY][gridX + 1] = '-';
          grid[gridY][gridX + 2] = '-';
          grid[gridY][gridX + 3] = '-';
        }

        // Vertical edges
        if (row < height) {
          grid[gridY + 1][gridX] = '|';
        }

        // Diagonal edges (only where the elements actually match)
        if (col < width && row < height) {
          // Check if x[col] actually equals y[row]
          if (x[col] === y[row]) {
            grid[gridY + 1][gridX + 2] = '\\';
          }
        }
      }
    }
  } else {
    // Draw only the path
    for (let i = 0; i < path.length; i++) {
      const { x: col, y: row } = path[i];
      const gridY = row * 2;
      const gridX = col * 4;

      // Place node
      grid[gridY][gridX] = 'o';

      // Draw edge to next node
      if (i < path.length - 1) {
        const next = path[i + 1];

        if (next.diagonal) {
          // Diagonal edge
          grid[gridY + 1][gridX + 2] = '\\';
        } else if (next.horizontal) {
          // Horizontal edge
          grid[gridY][gridX + 1] = '-';
          grid[gridY][gridX + 2] = '-';
          grid[gridY][gridX + 3] = '-';
        } else if (next.vertical) {
          // Vertical edge
          grid[gridY + 1][gridX] = '|';
        }
      }
    }
  }

  // Convert grid to string with labels
  let output = '';

  if (config.showLabels) {
    // Top row: column numbers
    for (let col = 0; col <= width; col++) {
      output += col.toString().padStart(4, ' ');
    }
    output += '\n';
  }

  // Grid rows
  for (let row = 0; row < charHeight; row++) {
    if (config.showLabels && row % 2 === 0) {
      // Add row number for node lines
      output += (row / 2).toString().padStart(2, ' ') + ' ';
    } else if (config.showLabels) {
      // Spacer for edge lines
      output += '   ';
    }

    output += grid[row].join('') + '\n';
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
