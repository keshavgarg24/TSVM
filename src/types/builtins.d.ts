/**
 * Type definitions for TypeScript VM built-in functions
 */

declare global {
  /**
   * Print a value to the console
   * @param value - The value to print
   */
  function print(value: any): void;

  /**
   * Get the absolute value of a number
   * @param x - The number
   * @returns The absolute value
   */
  function abs(x: number): number;

  /**
   * Get the square root of a number
   * @param x - The number
   * @returns The square root
   */
  function sqrt(x: number): number;

  /**
   * Raise a number to a power
   * @param x - The base
   * @param y - The exponent
   * @returns x raised to the power of y
   */
  function pow(x: number, y: number): number;

  /**
   * Get the length of a string
   * @param str - The string
   * @returns The length
   */
  function length(str: string): number;

  /**
   * Extract a substring
   * @param str - The source string
   * @param start - Start index
   * @param end - End index
   * @returns The substring
   */
  function substring(str: string, start: number, end: number): string;

  /**
   * Concatenate two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns The concatenated string
   */
  function concat(str1: string, str2: string): string;

  /**
   * Convert a value to string
   * @param value - The value to convert
   * @returns String representation
   */
  function toString(value: any): string;

  /**
   * Convert a value to number
   * @param value - The value to convert
   * @returns Numeric representation
   */
  function toNumber(value: any): number;

  /**
   * Convert a value to boolean
   * @param value - The value to convert
   * @returns Boolean representation
   */
  function toBoolean(value: any): boolean;
}

export {};