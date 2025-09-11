import { SymbolTable } from '../symbol-table';
import { ValueType } from '../../types';

describe('Symbol Table', () => {
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
  });

  describe('Basic Symbol Operations', () => {
    it('should declare and lookup symbols', () => {
      symbolTable.declare('x', 'number');
      const symbol = symbolTable.lookup('x');
      
      expect(symbol).toBeDefined();
      expect(symbol?.name).toBe('x');
      expect(symbol?.type).toBe('number');
      expect(symbol?.scope).toBe(0);
    });

    it('should handle different value types', () => {
      symbolTable.declare('num', 'number');
      symbolTable.declare('str', 'string');
      symbolTable.declare('bool', 'boolean');
      symbolTable.declare('func', 'function');
      
      expect(symbolTable.lookup('num')?.type).toBe('number');
      expect(symbolTable.lookup('str')?.type).toBe('string');
      expect(symbolTable.lookup('bool')?.type).toBe('boolean');
      expect(symbolTable.lookup('func')?.type).toBe('function');
    });

    it('should return undefined for undeclared symbols', () => {
      const symbol = symbolTable.lookup('undeclared');
      expect(symbol).toBeUndefined();
    });

    it('should allow redeclaration in same scope', () => {
      symbolTable.declare('x', 'number');
      symbolTable.declare('x', 'string'); // Redeclare with different type
      
      const symbol = symbolTable.lookup('x');
      expect(symbol?.type).toBe('string');
    });
  });

  describe('Scope Management', () => {
    it('should handle nested scopes', () => {
      symbolTable.declare('global', 'number');
      
      symbolTable.enterScope();
      symbolTable.declare('local', 'string');
      
      expect(symbolTable.lookup('global')).toBeDefined();
      expect(symbolTable.lookup('local')).toBeDefined();
      expect(symbolTable.lookup('global')?.scope).toBe(0);
      expect(symbolTable.lookup('local')?.scope).toBe(1);
    });

    it('should handle variable shadowing', () => {
      symbolTable.declare('x', 'number');
      
      symbolTable.enterScope();
      symbolTable.declare('x', 'string'); // Shadow the outer x
      
      const symbol = symbolTable.lookup('x');
      expect(symbol?.type).toBe('string');
      expect(symbol?.scope).toBe(1);
    });

    it('should restore outer scope after exit', () => {
      symbolTable.declare('x', 'number');
      
      symbolTable.enterScope();
      symbolTable.declare('x', 'string');
      symbolTable.declare('y', 'boolean');
      
      // Inner scope
      expect(symbolTable.lookup('x')?.type).toBe('string');
      expect(symbolTable.lookup('y')).toBeDefined();
      
      symbolTable.exitScope();
      
      // Back to outer scope
      expect(symbolTable.lookup('x')?.type).toBe('number');
      expect(symbolTable.lookup('y')).toBeUndefined();
    });

    it('should handle multiple nested scopes', () => {
      symbolTable.declare('level0', 'number');
      
      symbolTable.enterScope(); // Level 1
      symbolTable.declare('level1', 'string');
      
      symbolTable.enterScope(); // Level 2
      symbolTable.declare('level2', 'boolean');
      
      symbolTable.enterScope(); // Level 3
      symbolTable.declare('level3', 'function');
      
      // All variables should be accessible
      expect(symbolTable.lookup('level0')).toBeDefined();
      expect(symbolTable.lookup('level1')).toBeDefined();
      expect(symbolTable.lookup('level2')).toBeDefined();
      expect(symbolTable.lookup('level3')).toBeDefined();
      
      symbolTable.exitScope(); // Back to level 2
      expect(symbolTable.lookup('level3')).toBeUndefined();
      expect(symbolTable.lookup('level2')).toBeDefined();
      
      symbolTable.exitScope(); // Back to level 1
      expect(symbolTable.lookup('level2')).toBeUndefined();
      expect(symbolTable.lookup('level1')).toBeDefined();
      
      symbolTable.exitScope(); // Back to level 0
      expect(symbolTable.lookup('level1')).toBeUndefined();
      expect(symbolTable.lookup('level0')).toBeDefined();
    });

    it('should handle empty scopes', () => {
      symbolTable.enterScope();
      symbolTable.enterScope();
      
      expect(symbolTable.lookup('anything')).toBeUndefined();
      
      symbolTable.exitScope();
      symbolTable.exitScope();
      
      expect(symbolTable.lookup('anything')).toBeUndefined();
    });
  });

  describe('Function Scopes', () => {
    it('should handle function parameter scopes', () => {
      // Global scope
      symbolTable.declare('global', 'number');
      
      // Function scope
      symbolTable.enterScope();
      symbolTable.declare('param1', 'number');
      symbolTable.declare('param2', 'string');
      symbolTable.declare('local', 'boolean');
      
      expect(symbolTable.lookup('global')).toBeDefined();
      expect(symbolTable.lookup('param1')).toBeDefined();
      expect(symbolTable.lookup('param2')).toBeDefined();
      expect(symbolTable.lookup('local')).toBeDefined();
      
      symbolTable.exitScope();
      
      expect(symbolTable.lookup('global')).toBeDefined();
      expect(symbolTable.lookup('param1')).toBeUndefined();
      expect(symbolTable.lookup('param2')).toBeUndefined();
      expect(symbolTable.lookup('local')).toBeUndefined();
    });

    it('should handle nested function scopes', () => {
      symbolTable.declare('global', 'number');
      
      // Outer function
      symbolTable.enterScope();
      symbolTable.declare('outerParam', 'string');
      symbolTable.declare('outerLocal', 'boolean');
      
      // Inner function
      symbolTable.enterScope();
      symbolTable.declare('innerParam', 'number');
      symbolTable.declare('innerLocal', 'function');
      
      // All should be accessible in inner function
      expect(symbolTable.lookup('global')).toBeDefined();
      expect(symbolTable.lookup('outerParam')).toBeDefined();
      expect(symbolTable.lookup('outerLocal')).toBeDefined();
      expect(symbolTable.lookup('innerParam')).toBeDefined();
      expect(symbolTable.lookup('innerLocal')).toBeDefined();
      
      symbolTable.exitScope(); // Exit inner function
      
      expect(symbolTable.lookup('innerParam')).toBeUndefined();
      expect(symbolTable.lookup('innerLocal')).toBeUndefined();
      expect(symbolTable.lookup('outerParam')).toBeDefined();
      expect(symbolTable.lookup('outerLocal')).toBeDefined();
      
      symbolTable.exitScope(); // Exit outer function
      
      expect(symbolTable.lookup('outerParam')).toBeUndefined();
      expect(symbolTable.lookup('outerLocal')).toBeUndefined();
      expect(symbolTable.lookup('global')).toBeDefined();
    });
  });

  describe('Symbol Information', () => {
    it('should track symbol scope levels', () => {
      symbolTable.declare('global', 'number');
      
      symbolTable.enterScope();
      symbolTable.declare('level1', 'string');
      
      symbolTable.enterScope();
      symbolTable.declare('level2', 'boolean');
      
      expect(symbolTable.lookup('global')?.scope).toBe(0);
      expect(symbolTable.lookup('level1')?.scope).toBe(1);
      expect(symbolTable.lookup('level2')?.scope).toBe(2);
    });

    it('should provide symbol metadata', () => {
      symbolTable.declare('myVar', 'string');
      const symbol = symbolTable.lookup('myVar');
      
      expect(symbol?.name).toBe('myVar');
      expect(symbol?.type).toBe('string');
      expect(symbol?.scope).toBe(0);
    });
  });

  describe('Scope Utilities', () => {
    it('should get current scope level', () => {
      expect(symbolTable.getCurrentScope()).toBe(0);
      
      symbolTable.enterScope();
      expect(symbolTable.getCurrentScope()).toBe(1);
      
      symbolTable.enterScope();
      expect(symbolTable.getCurrentScope()).toBe(2);
      
      symbolTable.exitScope();
      expect(symbolTable.getCurrentScope()).toBe(1);
      
      symbolTable.exitScope();
      expect(symbolTable.getCurrentScope()).toBe(0);
    });

    it('should list symbols in current scope', () => {
      symbolTable.declare('global1', 'number');
      symbolTable.declare('global2', 'string');
      
      symbolTable.enterScope();
      symbolTable.declare('local1', 'boolean');
      symbolTable.declare('local2', 'function');
      
      const currentScopeSymbols = symbolTable.getCurrentScopeSymbols();
      expect(currentScopeSymbols).toHaveLength(2);
      expect(currentScopeSymbols.map(s => s.name)).toContain('local1');
      expect(currentScopeSymbols.map(s => s.name)).toContain('local2');
      expect(currentScopeSymbols.map(s => s.name)).not.toContain('global1');
      expect(currentScopeSymbols.map(s => s.name)).not.toContain('global2');
    });

    it('should list all symbols', () => {
      symbolTable.declare('global', 'number');
      
      symbolTable.enterScope();
      symbolTable.declare('local', 'string');
      
      const allSymbols = symbolTable.getAllSymbols();
      expect(allSymbols).toHaveLength(2);
      expect(allSymbols.map(s => s.name)).toContain('global');
      expect(allSymbols.map(s => s.name)).toContain('local');
    });
  });

  describe('Error Handling', () => {
    it('should handle exit scope on global scope gracefully', () => {
      expect(() => symbolTable.exitScope()).not.toThrow();
      expect(symbolTable.getCurrentScope()).toBe(0);
    });

    it('should handle multiple exit scopes', () => {
      symbolTable.enterScope();
      symbolTable.enterScope();
      
      symbolTable.exitScope();
      symbolTable.exitScope();
      symbolTable.exitScope(); // Should not throw
      symbolTable.exitScope(); // Should not throw
      
      expect(symbolTable.getCurrentScope()).toBe(0);
    });
  });

  describe('Reset and Clear', () => {
    it('should reset to initial state', () => {
      symbolTable.declare('x', 'number');
      symbolTable.enterScope();
      symbolTable.declare('y', 'string');
      
      symbolTable.reset();
      
      expect(symbolTable.getCurrentScope()).toBe(0);
      expect(symbolTable.lookup('x')).toBeUndefined();
      expect(symbolTable.lookup('y')).toBeUndefined();
      expect(symbolTable.getAllSymbols()).toHaveLength(0);
    });

    it('should clear current scope only', () => {
      symbolTable.declare('global', 'number');
      
      symbolTable.enterScope();
      symbolTable.declare('local1', 'string');
      symbolTable.declare('local2', 'boolean');
      
      symbolTable.clearCurrentScope();
      
      expect(symbolTable.lookup('global')).toBeDefined();
      expect(symbolTable.lookup('local1')).toBeUndefined();
      expect(symbolTable.lookup('local2')).toBeUndefined();
      expect(symbolTable.getCurrentScope()).toBe(1); // Still in the scope
    });
  });
});