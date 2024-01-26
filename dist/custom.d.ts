export type FormatASCIIOutput = [string, Record<string, boolean | number | string>]

/**
 * Formatting Function
*/
export type FormatNumber = (value: number) => string

/**
 * Formatting ASCII Function
 */
export type FormatNumberToASCII = (value: number, asciiFlags: Record<string, boolean | number | string>, _data: DataBuffer | DataStream) => FormatASCIIOutput

/**
 * Formatting functions for all value types.
 */
export interface HexTableFormater {
  /** Offset formatting fuction. */
  offset: FormatNumber
  /** Byte value formating function. */
  value: FormatNumber
  /** ASCII text formatting function. */
  ascii: FormatNumberToASCII
}
