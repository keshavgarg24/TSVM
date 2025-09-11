import { Value, ValueType, FunctionValue } from '../types';

/**
 * Creates a Value object from a JavaScript primitive
 */
export function createValue(data: number | string | boolean | FunctionValue | undefined): Value {
  let type: ValueType;
  
  if (typeof data === 'number') {
    type = 'number';
  } else if (typeof data === 'string') {
    type = 'string';
  } else if (typeof data === 'boolean') {
    type = 'boolean';
  } else if (data && typeof data === 'object' && 'name' in data && 'parameters' in data) {
    type = 'function';
  } else {
    type = 'undefined';
  }

  return { type, data };
}

/**
 * Checks if two values are equal
 */
export function isEqual(a: Value, b: Value): boolean {
  if (a.type !== b.type) {
    return false;
  }
  
  return a.data === b.data;
}

/**
 * Converts a value to its string representation
 */
export function toString(value: Value): string {
  switch (value.type) {
    case 'number':
      return String(value.data);
    case 'string':
      return value.data as string;
    case 'boolean':
      return String(value.data);
    case 'function':
      const func = value.data as FunctionValue;
      return `function ${func.name}(${func.parameters.join(', ')})`;
    case 'undefined':
      return 'undefined';
    default:
      return 'unknown';
  }
}

/**
 * Determines if a value is truthy
 */
export function isTruthy(value: Value): boolean {
  switch (value.type) {
    case 'number':
      return (value.data as number) !== 0;
    case 'string':
      return (value.data as string).length > 0;
    case 'boolean':
      return value.data as boolean;
    case 'function':
      return true;
    case 'undefined':
      return false;
    default:
      return false;
  }
}

/**
 * Gets the type of a value
 */
export function getType(value: Value): ValueType {
  return value.type;
}

/**
 * Converts a value to a number if possible
 */
export function toNumber(value: Value): number {
  switch (value.type) {
    case 'number':
      return value.data as number;
    case 'string':
      const num = Number(value.data);
      if (isNaN(num)) {
        throw new Error(`Cannot convert string "${value.data}" to number`);
      }
      return num;
    case 'boolean':
      return (value.data as boolean) ? 1 : 0;
    default:
      throw new Error(`Cannot convert ${value.type} to number`);
  }
}

/**
 * Converts a value to a boolean
 */
export function toBoolean(value: Value): boolean {
  return isTruthy(value);
}