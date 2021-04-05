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
  // eslint-disable-next-line no-restricted-properties
  return `${Number.parseFloat((input / Math.pow(bytes, i)).toFixed(decimals))} ${sizes[i]}`;
};

// TODO
// Hex Editor View
// 00000000: 3734 3635 3733 3734 3061 6173 6466 6173  746573740aasdfas
// 00000010: 6466 6173 6466 6173 6466 6173 6466 6173  dfasdfasdfasdfas
// 00000020: 6466 6173 6466 6173 6466 0a              dfasdfasdf.

module.exports = {
  formatBytes,
};
