const DataBuffer = require('./data-buffer');
const DataStream = require('./data-stream');

/**
 * Format an amount of bytes to a human friendly string.
 *
 * @param {number} input The number of bytes.
 * @param {number} [decimals=2] The number of trailing decimal places to chop to.
 * @param {number} [bytes=1024] The byte division value, alternatively could be 1000 for decimal values rather than binary values.
 * @param {string[]} [sizes=['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']] An array of the various size suffixes.
 * @returns {string} The human friendly representation of the number of bytes.
 * @see {@link https://en.wikipedia.org/wiki/Byte#Multiple-byte_units|Multiple-byte units}
 */
const formatBytes = (input, decimals = 2, bytes = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']) => {
  if (input === 0) {
    return `0 ${sizes[0]}`;
  }
  const i = Math.floor(Math.log(input) / Math.log(bytes));
  return `${Number.parseFloat((input / bytes ** i).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * ASCII text formatting function.
 *
 * @param {number} value Input data to print out as a hex table.
 * @param {object} asciiFlags Any flags needed by the formatter.
 * @param {DataBuffer|DataStream} _data The data being processed.
 * @returns {any[]} Returns an array with the Character to represent this value and any flags for the function.
 */
const formatASCII = (value, asciiFlags, _data) => {
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
 *
 * @typedef {object} HexTableFormater
 * @property {Function} offset - Offset formatting fuction.
 * @property {Function} value - Byte value formating function.
 * @property {Function} ascii - ASCII text formatting function.
 */
const hexTableFormaters = {
  offset: (value) => value.toString(16).padStart(8, '0'),
  value: (value) => value.toString(16).padStart(2, '0').toUpperCase(),
  ascii: formatASCII,
};

// GNU poke headerBytes = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99', 'aa', 'bb', 'cc', 'dd', 'ee', 'ff']

/**
 * Header layout definitions.
 *
 * @typedef {object} HexTableHeader
 * @property {string} offset - Offset header column presentation.
 * @property {string[]} value - Byte value header values, grouped as defined in the provided HexTableDimensions.
 * @property {string} ascii - ASCII text presentation.
 */
const hexTableHeader = {
  offset: '76543210',
  value: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '0E', '0F'],
  ascii: '0123456789ABCDEF',
};

/**
 * Header layout definitions.
 *
 * @typedef {object} HexTableDimensions
 * @property {number} columns - The number of columns to show in the byte value section of the table.
 * @property {number} grouping - The number of bytes to cluster together in the byte value section of the table.
 * @property {number} maxRows - The maxiumum number of rows to show excluding the header & seperator rows.
 */
const hexTableDimensions = {
  columns: 16,
  grouping: 4,
  maxRows: 40,
};

/**
 *
 * @param {DataBuffer|DataStream} input Input data to print out as a hex table.
 * @param {number} offset Offset in the DataStream to start from.
 * @param {HexTableDimensions} dimensions Table size parameters for columns, rows and byte grouping.
 * @param {HexTableHeader} header The values for building the table header with offset, bytes and ASCII values.
 * @param {HexTableFormater} format The formatting functions for displaying offset, bytes and ASCII values.
 * @returns {string} The hex table output
 */
const hexTable = (input, offset = 0, dimensions = hexTableDimensions, header = hexTableHeader, format = hexTableFormaters) => {
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

  // console.log(output);
  return output.trim();
};

module.exports = {
  formatBytes,
  formatASCII,
  hexTable,
  hexTableDimensions,
  hexTableHeader,
  hexTableFormaters,
};
