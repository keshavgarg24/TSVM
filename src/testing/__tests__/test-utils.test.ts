import { TestUtils, createMockToken, createMockAST, createMockInstruction, createMockValue } from '../test-utils';
import { TokenType, OpCode } from '../../types';

describe('TestUtils', () => {
  describe('Factory Methods', () => {
    it('should create source locations', () => {
      const location = TestUtils.createLocation(5, 10, 3);
      expect(location.line).toBe(5);
      expect(location.column).toBe(10);
      expect(location.length).toBe(3);
    });

    it('should create source locations with defaults', () => {
      const location = TestUtils.createLocation();
      expect(location.line).toBe(1);
      expect(location.column).toBe(1);
      expect(location.length).toBe(1);
    });

    it('should create mock tokens', () => {
      const token = TestUtils.createToken(TokenType.NUMBER, '42');
      expect(token.type).toBe(TokenType.NUMBER);
      expect(token.value).toBe('42');
      expect(token.location).toBeDefined();
    });

    it('should create mock AST nodes', () => {
      const node = TestUtils.createASTNode('Literal');
      expect(node.type).toBe('Literal');
      expect(node.location).toBeDefined();
    });

    it('should create mock instructions', () => {
      const instruction = TestUtils.createInstruction(OpCode.PUSH, 42);
      expect(instruction.opcode).toBe(OpCode.PUSH);
      expect(instruction.operand).toBe(42);
    });

    it('should create mock instructions without operand', () => {
      const instruction = TestUtils.createInstruction(OpCode.ADD);
      expect(instruction.opcode).toBe(OpCode.ADD);
      expect(instruction.operand).toBeUndefined();
    });

    it('should create mock values', () => {
      const numberValue = TestUtils.createValue(42);
      expect(numberValue.type).toBe('number');
      expect(numberValue.data).toBe(42);

      const stringValue = TestUtils.createValue('hello');
      expect(stringValue.type).toBe('string');
      expect(stringValue.data).toBe('hello');

      const booleanValue = TestUtils.createValue(true);
      expect(booleanValue.type).toBe('boolean');
      expect(booleanValue.data).toBe(true);

      const undefinedValue = TestUtils.createValue(undefined);
      expect(undefinedValue.type).toBe('undefined');
      expect(undefinedValue.data).toBeUndefined();
    });
  });

  describe('Sequence Creation', () => {
    it('should create token sequences', () => {
      const tokens = TestUtils.createTokenSequence([
        [TokenType.NUMBER, '42'],
        [TokenType.PLUS, '+'],
        [TokenType.NUMBER, '3']
      ]);

      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe(TokenType.NUMBER);
      expect(tokens[0]?.value).toBe('42');
      expect(tokens[1]?.type).toBe(TokenType.PLUS);
      expect(tokens[1]?.value).toBe('+');
      expect(tokens[2]?.type).toBe(TokenType.NUMBER);
      expect(tokens[2]?.value).toBe('3');
    });

    it('should create instruction sequences', () => {
      const instructions = TestUtils.createInstructionSequence([
        [OpCode.PUSH, 42],
        [OpCode.PUSH, 3],
        [OpCode.ADD]
      ]);

      expect(instructions).toHaveLength(3);
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(42);
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(3);
      expect(instructions[2]?.opcode).toBe(OpCode.ADD);
      expect(instructions[2]?.operand).toBeUndefined();
    });
  });

  describe('AST Node Creation', () => {
    it('should create literal nodes', () => {
      const numberLiteral = TestUtils.createLiteral(42);
      expect(numberLiteral.type).toBe('Literal');
      expect(numberLiteral.value).toBe(42);

      const stringLiteral = TestUtils.createLiteral('hello');
      expect(stringLiteral.type).toBe('Literal');
      expect(stringLiteral.value).toBe('hello');

      const booleanLiteral = TestUtils.createLiteral(true);
      expect(booleanLiteral.type).toBe('Literal');
      expect(booleanLiteral.value).toBe(true);
    });

    it('should create identifier nodes', () => {
      const identifier = TestUtils.createIdentifier('myVar');
      expect(identifier.type).toBe('Identifier');
      expect(identifier.name).toBe('myVar');
    });

    it('should create binary expression nodes', () => {
      const left = TestUtils.createLiteral(5);
      const right = TestUtils.createLiteral(3);
      const binaryExpr = TestUtils.createBinaryExpression(left, '+', right);

      expect(binaryExpr.type).toBe('BinaryExpression');
      expect(binaryExpr.left).toBe(left);
      expect(binaryExpr.operator).toBe('+');
      expect(binaryExpr.right).toBe(right);
    });
  });

  describe('Comparison Utilities', () => {
    it('should compare arrays for equality', () => {
      expect(TestUtils.arrayEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(TestUtils.arrayEquals([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(TestUtils.arrayEquals([1, 2], [1, 2, 3])).toBe(false);
      expect(TestUtils.arrayEquals([], [])).toBe(true);
    });

    it('should perform deep equality comparison', () => {
      // Primitives
      expect(TestUtils.deepEquals(42, 42)).toBe(true);
      expect(TestUtils.deepEquals('hello', 'hello')).toBe(true);
      expect(TestUtils.deepEquals(true, true)).toBe(true);
      expect(TestUtils.deepEquals(null, null)).toBe(true);
      expect(TestUtils.deepEquals(undefined, undefined)).toBe(true);

      // Different types
      expect(TestUtils.deepEquals(42, '42')).toBe(false);
      expect(TestUtils.deepEquals(null, undefined)).toBe(false);

      // Objects
      expect(TestUtils.deepEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(TestUtils.deepEquals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(TestUtils.deepEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);

      // Arrays
      expect(TestUtils.deepEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(TestUtils.deepEquals([1, 2, 3], [1, 2, 4])).toBe(false);

      // Nested objects
      expect(TestUtils.deepEquals(
        { a: { b: [1, 2] } },
        { a: { b: [1, 2] } }
      )).toBe(true);
      expect(TestUtils.deepEquals(
        { a: { b: [1, 2] } },
        { a: { b: [1, 3] } }
      )).toBe(false);
    });
  });

  describe('Random Data Generation', () => {
    it('should generate random integers', () => {
      const num = TestUtils.randomInt(10, 20);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
      expect(Number.isInteger(num)).toBe(true);
    });

    it('should generate random strings', () => {
      const str = TestUtils.randomString(10);
      expect(str).toHaveLength(10);
      expect(typeof str).toBe('string');
    });

    it('should generate random booleans', () => {
      const bool = TestUtils.randomBoolean();
      expect(typeof bool).toBe('boolean');
    });

    it('should create data generators', () => {
      const numberGen = TestUtils.createNumberGenerator(1, 10);
      const stringGen = TestUtils.createStringGenerator(5);
      const booleanGen = TestUtils.createBooleanGenerator();

      const num = numberGen();
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);

      const str = stringGen();
      expect(str).toHaveLength(5);

      const bool = booleanGen();
      expect(typeof bool).toBe('boolean');
    });
  });

  describe('Performance Utilities', () => {
    it('should measure execution time', () => {
      const { result, duration } = TestUtils.measureTime(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should measure async execution time', async () => {
      const { result, duration } = await TestUtils.measureTimeAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');
      expect(duration).toBeGreaterThanOrEqual(5); // Allow some variance
    });
  });

  describe('Test Utilities', () => {
    it('should create timeout promises', async () => {
      const start = Date.now();
      await TestUtils.timeout(50);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(45); // Allow some variance
    });

    it('should create timeout tests', () => {
      const timeoutTest = TestUtils.createTimeoutTest(50);
      expect(typeof timeoutTest).toBe('function');
    });

    it('should create failing tests', () => {
      const failingTest = TestUtils.createFailingTest('Custom error');
      expect(() => failingTest()).toThrow('Custom error');
    });

    it('should create passing tests', () => {
      const passingTest = TestUtils.createPassingTest();
      expect(() => passingTest()).not.toThrow();
    });
  });

  describe('Mock Utilities', () => {
    it('should create spy functions', () => {
      const spy = TestUtils.createSpy();
      
      spy('arg1', 'arg2');
      spy('arg3');
      
      expect(spy.callCount).toBe(2);
      expect(spy.calls).toEqual([['arg1', 'arg2'], ['arg3']]);
    });

    it('should create spy functions with implementation', () => {
      const spy = TestUtils.createSpy((a: number, b: number) => a + b);
      
      const result = spy(5, 3);
      
      expect(result).toBe(8);
      expect(spy.callCount).toBe(1);
      expect(spy.calls[0]).toEqual([5, 3]);
    });

    it('should reset spy functions', () => {
      const spy = TestUtils.createSpy();
      
      spy('test');
      expect(spy.callCount).toBe(1);
      
      spy.reset();
      expect(spy.callCount).toBe(0);
      expect(spy.calls).toHaveLength(0);
    });
  });

  describe('Convenience Functions', () => {
    it('should export convenience functions', () => {
      const token = createMockToken(TokenType.NUMBER, '42');
      expect(token.type).toBe(TokenType.NUMBER);
      expect(token.value).toBe('42');

      const ast = createMockAST('Literal');
      expect(ast.type).toBe('Literal');

      const instruction = createMockInstruction(OpCode.PUSH, 42);
      expect(instruction.opcode).toBe(OpCode.PUSH);
      expect(instruction.operand).toBe(42);

      const value = createMockValue(42);
      expect(value.type).toBe('number');
      expect(value.data).toBe(42);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays in comparison', () => {
      expect(TestUtils.arrayEquals([], [])).toBe(true);
      expect(TestUtils.deepEquals([], [])).toBe(true);
    });

    it('should handle null and undefined in deep comparison', () => {
      expect(TestUtils.deepEquals(null, null)).toBe(true);
      expect(TestUtils.deepEquals(undefined, undefined)).toBe(true);
      expect(TestUtils.deepEquals(null, undefined)).toBe(false);
      expect(TestUtils.deepEquals(null, 0)).toBe(false);
      expect(TestUtils.deepEquals(undefined, 0)).toBe(false);
    });

    it('should handle circular references gracefully', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;
      
      const obj2: any = { a: 1 };
      obj2.self = obj2;
      
      // This should not throw (though it may return false due to infinite recursion protection)
      expect(() => TestUtils.deepEquals(obj1, obj2)).not.toThrow();
    });

    it('should handle random generation edge cases', () => {
      // Same min and max
      const num = TestUtils.randomInt(5, 5);
      expect(num).toBe(5);

      // Zero length string
      const str = TestUtils.randomString(0);
      expect(str).toBe('');
    });
  });
});