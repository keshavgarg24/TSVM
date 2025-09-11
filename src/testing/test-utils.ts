import { 
  Token, 
  TokenType, 
  ASTNode, 
  Instruction, 
  OpCode, 
  Value,
  SourceLocation,
  Literal,
  Identifier,
  BinaryExpression
} from '../types';

/**
 * Utility functions for creating test data
 */
export class TestUtils {
  /**
   * Create a source location for testing
   */
  static createLocation(line = 1, column = 1, length = 1): SourceLocation {
    return { line, column, length };
  }

  /**
   * Create a mock token
   */
  static createToken(
    type: TokenType, 
    value: string, 
    location?: SourceLocation
  ): Token {
    return {
      type,
      value,
      location: location || TestUtils.createLocation()
    };
  }

  /**
   * Create a mock AST node
   */
  static createASTNode(type: string, location?: SourceLocation): ASTNode {
    return {
      type,
      location: location || TestUtils.createLocation()
    };
  }

  /**
   * Create a mock instruction
   */
  static createInstruction(opcode: OpCode, operand?: any): Instruction {
    const instruction: Instruction = { opcode };
    if (operand !== undefined) {
      instruction.operand = operand;
    }
    return instruction;
  }

  /**
   * Create a mock value
   */
  static createValue(data: any): Value {
    let type: Value['type'];
    
    if (typeof data === 'number') {
      type = 'number';
    } else if (typeof data === 'string') {
      type = 'string';
    } else if (typeof data === 'boolean') {
      type = 'boolean';
    } else if (data && typeof data === 'object' && 'name' in data) {
      type = 'function';
    } else {
      type = 'undefined';
    }

    return { type, data };
  }

  /**
   * Create a sequence of tokens
   */
  static createTokenSequence(tokenData: Array<[TokenType, string]>): Token[] {
    return tokenData.map(([type, value], index) => 
      TestUtils.createToken(type, value, TestUtils.createLocation(1, index + 1))
    );
  }

  /**
   * Create a sequence of instructions
   */
  static createInstructionSequence(instructionData: Array<[OpCode, any?]>): Instruction[] {
    return instructionData.map(([opcode, operand]) => 
      TestUtils.createInstruction(opcode, operand)
    );
  }

  /**
   * Create a literal AST node
   */
  static createLiteral(value: number | string | boolean, location?: SourceLocation): Literal {
    return {
      type: 'Literal',
      value,
      location: location || TestUtils.createLocation()
    };
  }

  /**
   * Create an identifier AST node
   */
  static createIdentifier(name: string, location?: SourceLocation): Identifier {
    return {
      type: 'Identifier',
      name,
      location: location || TestUtils.createLocation()
    };
  }

  /**
   * Create a binary expression AST node
   */
  static createBinaryExpression(
    left: ASTNode, 
    operator: string, 
    right: ASTNode,
    location?: SourceLocation
  ): BinaryExpression {
    return {
      type: 'BinaryExpression',
      left,
      operator,
      right,
      location: location || TestUtils.createLocation()
    };
  }

  /**
   * Compare two arrays for deep equality
   */
  static arrayEquals(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      if (!TestUtils.deepEquals(a[i], b[i])) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Deep equality comparison
   */
  static deepEquals(a: any, b: any, visited = new WeakSet()): boolean {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      // Handle circular references
      if (visited.has(a) || visited.has(b)) return a === b;
      visited.add(a);
      visited.add(b);
      
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!TestUtils.deepEquals(a[i], b[i], visited)) return false;
        }
        return true;
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!TestUtils.deepEquals(a[key], b[key], visited)) return false;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Generate random test data
   */
  static randomInt(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomString(length = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  /**
   * Create test data generators
   */
  static createNumberGenerator(min = 0, max = 100) {
    return () => TestUtils.randomInt(min, max);
  }

  static createStringGenerator(length = 10) {
    return () => TestUtils.randomString(length);
  }

  static createBooleanGenerator() {
    return () => TestUtils.randomBoolean();
  }

  /**
   * Measure execution time
   */
  static measureTime<T>(fn: () => T): { result: T; duration: number } {
    const start = Date.now();
    const result = fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * Measure async execution time
   */
  static async measureTimeAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * Create a test timeout
   */
  static timeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a test that should timeout
   */
  static createTimeoutTest(ms: number): () => Promise<void> {
    return () => TestUtils.timeout(ms + 100);
  }

  /**
   * Create a test that should fail
   */
  static createFailingTest(message = 'Test failed'): () => void {
    return () => {
      throw new Error(message);
    };
  }

  /**
   * Create a test that should pass
   */
  static createPassingTest(): () => void {
    return () => {
      // Do nothing - test passes
    };
  }

  /**
   * Validate test environment
   */
  static validateTestEnvironment(): void {
    // Check if we're in a test environment
    if (typeof globalThis === 'undefined') {
      throw new Error('Test environment not detected');
    }

    // Check for required globals
    const requiredGlobals = ['console'];
    for (const globalName of requiredGlobals) {
      if (typeof (globalThis as any)[globalName] === 'undefined') {
        throw new Error(`Required global '${globalName}' not found`);
      }
    }
  }

  /**
   * Mock console methods for testing
   */
  static mockConsole(): {
    log: any;
    error: any;
    warn: any;
    restore: () => void;
  } {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const mockLog = (...args: any[]) => {};
    const mockError = (...args: any[]) => {};
    const mockWarn = (...args: any[]) => {};

    console.log = mockLog;
    console.error = mockError;
    console.warn = mockWarn;

    return {
      log: mockLog,
      error: mockError,
      warn: mockWarn,
      restore: () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    };
  }

  /**
   * Create a spy function
   */
  static createSpy<T extends (...args: any[]) => any>(
    implementation?: T
  ): T & { calls: any[][]; callCount: number; reset: () => void } {
    const calls: any[][] = [];

    const spy = ((...args: any[]) => {
      calls.push(args);
      
      if (implementation) {
        return implementation(...args);
      }
    }) as T & { calls: any[][]; callCount: number; reset: () => void };

    Object.defineProperty(spy, 'calls', {
      get: () => calls
    });

    Object.defineProperty(spy, 'callCount', {
      get: () => calls.length
    });

    spy.reset = () => {
      calls.length = 0;
    };

    return spy;
  }
}

// Convenience functions
export const createMockToken = TestUtils.createToken;
export const createMockAST = TestUtils.createASTNode;
export const createMockInstruction = TestUtils.createInstruction;
export const createMockValue = TestUtils.createValue;