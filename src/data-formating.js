import DataBuffer from './data-buffer.js';
import DataStream from './data-stream.js';

let debug = (..._) => {};
/* c8 ignore next */
if (process.env.UTTORI_DATA_DEBUG) { try { const { default: d } = await import('debug'); debug = d('DataFormatting'); } catch {} }

/**
 * Format an amount of bytes to a human friendly string.
 * @param {number} input The number of bytes.
 * @param {number} [decimals=2] The number of trailing decimal places to chop to.
 * @param {number} [bytes=1024] The byte division value, alternatively could be 1000 for decimal values rather than binary values.
 * @param {string[]} [sizes=['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']] An array of the various size suffixes.
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
};
