import { createValue, isEqual, toString, isTruthy, getType } from '../values';
import { Value, ValueType } from '../../types';

describe('Value System', () => {
  describe('createValue', () => {
    it('should create number values', () => {
      const value = createValue(42);
      expect(value.type).toBe('number');
      expect(value.data).toBe(42);
    });

    it('should create string values', () => {
      const value = createValue('hello');
      expect(value.type).toBe('string');
      expect(value.data).toBe('hello');
    });

    it('should create boolean values', () => {
      const value = createValue(true);
      expect(value.type).toBe('boolean');
      expect(value.data).toBe(true);
    });

    it('should create undefined values', () => {
      const value = createValue(undefined);
      expect(value.type).toBe('undefined');
      expect(value.data).toBe(undefined);
    });
  });

  describe('isEqual', () => {
    it('should compare equal numbers', () => {
      const a = createValue(42);
      const b = createValue(42);
      expect(isEqual(a, b)).toBe(true);
    });

    it('should compare unequal numbers', () => {
      const a = createValue(42);
      const b = createValue(24);
      expect(isEqual(a, b)).toBe(false);
    });

    it('should compare equal strings', () => {
      const a = createValue('hello');
      const b = createValue('hello');
      expect(isEqual(a, b)).toBe(true);
    });

    it('should compare different types as unequal', () => {
      const a = createValue(42);
      const b = createValue('42');
      expect(isEqual(a, b)).toBe(false);
    });

    it('should handle undefined values', () => {
      const a = createValue(undefined);
      const b = createValue(undefined);
      expect(isEqual(a, b)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should convert numbers to strings', () => {
      const value = createValue(42);
      expect(toString(value)).toBe('42');
    });

    it('should convert strings to strings', () => {
      const value = createValue('hello');
      expect(toString(value)).toBe('hello');
    });

    it('should convert booleans to strings', () => {
      const trueValue = createValue(true);
      const falseValue = createValue(false);
      expect(toString(trueValue)).toBe('true');
      expect(toString(falseValue)).toBe('false');
    });

    it('should convert undefined to string', () => {
      const value = createValue(undefined);
      expect(toString(value)).toBe('undefined');
    });
  });

  describe('isTruthy', () => {
    it('should return true for non-zero numbers', () => {
      expect(isTruthy(createValue(42))).toBe(true);
      expect(isTruthy(createValue(-1))).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isTruthy(createValue(0))).toBe(false);
    });

    it('should return true for non-empty strings', () => {
      expect(isTruthy(createValue('hello'))).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isTruthy(createValue(''))).toBe(false);
    });

    it('should return correct values for booleans', () => {
      expect(isTruthy(createValue(true))).toBe(true);
      expect(isTruthy(createValue(false))).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTruthy(createValue(undefined))).toBe(false);
    });
  });

  describe('getType', () => {
    it('should return correct types', () => {
      expect(getType(createValue(42))).toBe('number');
      expect(getType(createValue('hello'))).toBe('string');
      expect(getType(createValue(true))).toBe('boolean');
      expect(getType(createValue(undefined))).toBe('undefined');
    });
  });
});