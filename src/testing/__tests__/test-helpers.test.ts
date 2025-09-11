import { 
  LexerTestHelper, 
  ParserTestHelper, 
  CompilerTestHelper, 
  VMTestHelper,
  TestHelpers 
} from '../test-helpers';
import { TokenType, OpCode } from '../../types';

describe('Test Helpers', () => {
  describe('LexerTestHelper', () => {
    let helper: LexerTestHelper;

    beforeEach(() => {
      helper = new LexerTestHelper();
    });

    it('should tokenize simple expressions', () => {
      const tokens = helper.tokenize('42 + 3');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.type).toBe(TokenType.NUMBER);
      expect(tokens[1]?.type).toBe(TokenType.PLUS);
      expect(tokens[2]?.type).toBe(TokenType.NUMBER);
    });

    it('should expect token types correctly', () => {
      expect(() => {
        helper.expectTokenTypes('42 + 3', [TokenType.NUMBER, TokenType.PLUS, TokenType.NUMBER]);
      }).not.toThrow();
    });

    it('should throw when token types don\'t match', () => {
      expect(() => {
        helper.expectTokenTypes('42 + 3', [TokenType.STRING, TokenType.PLUS, TokenType.NUMBER]);
      }).toThrow('Token 0: expected STRING, got NUMBER');
    });

    it('should expect token values correctly', () => {
      expect(() => {
        helper.expectTokenValues('42 + 3', ['42', '+', '3']);
      }).not.toThrow();
    });

    it('should throw when token values don\'t match', () => {
      expect(() => {
        helper.expectTokenValues('42 + 3', ['41', '+', '3']);
      }).toThrow('Token 0: expected "41", got "42"');
    });

    it('should get token at specific position', () => {
      const token = helper.getTokenAt('42 + 3', 1);
      expect(token.type).toBe(TokenType.PLUS);
      expect(token.value).toBe('+');
    });

    it('should throw when token index is out of bounds', () => {
      expect(() => {
        helper.getTokenAt('42', 5);
      }).toThrow('Token index 5 out of bounds');
    });

    it('should expect lexer errors', () => {
      expect(() => {
        helper.expectError('42 @ 3', 'Unexpected character');
      }).not.toThrow();
    });

    it('should throw when lexer doesn\'t error as expected', () => {
      expect(() => {
        helper.expectError('42 + 3');
      }).toThrow('Expected lexer to throw an error, but it succeeded');
    });
  });

  describe('ParserTestHelper', () => {
    let helper: ParserTestHelper;

    beforeEach(() => {
      helper = new ParserTestHelper();
    });

    it('should parse simple expressions', () => {
      const ast = helper.parse('42 + 3');
      expect(ast.type).toBe('Program');
    });

    it('should expect node types correctly', () => {
      expect(() => {
        helper.expectNodeType('42 + 3', 'Program');
      }).not.toThrow();
    });

    it('should throw when node type doesn\'t match', () => {
      expect(() => {
        helper.expectNodeType('42 + 3', 'Expression');
      }).toThrow('Expected AST node type "Expression", got "Program"');
    });

    it('should expect AST structure', () => {
      const ast = helper.parse('42');
      expect(() => {
        helper.expectASTStructure(ast, {
          type: 'Program',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'Literal',
                value: 42
              }
            }
          ]
        });
      }).not.toThrow();
    });

    it('should get node by path', () => {
      const ast = helper.parse('42');
      const literal = helper.getNodeByPath(ast, 'body[0].expression');
      expect(literal.type).toBe('Literal');
      expect(literal.value).toBe(42);
    });

    it('should throw when path not found', () => {
      const ast = helper.parse('42');
      expect(() => {
        helper.getNodeByPath(ast, 'nonexistent.path');
      }).toThrow('Path "nonexistent.path" not found in AST');
    });

    it('should expect parser errors', () => {
      expect(() => {
        helper.expectError('42 +', 'Unexpected end of input');
      }).not.toThrow();
    });
  });

  describe('CompilerTestHelper', () => {
    let helper: CompilerTestHelper;

    beforeEach(() => {
      helper = new CompilerTestHelper();
    });

    it('should compile simple expressions', () => {
      const instructions = helper.compile('42 + 3');
      expect(instructions.length).toBeGreaterThan(0);
    });

    it('should expect opcodes correctly', () => {
      expect(() => {
        helper.expectOpcodes('42', [OpCode.PUSH]);
      }).not.toThrow();
    });

    it('should throw when opcodes don\'t match', () => {
      expect(() => {
        helper.expectOpcodes('42', [OpCode.POP]);
      }).toThrow('Instruction 0: expected POP, got PUSH');
    });

    it('should expect instructions correctly', () => {
      expect(() => {
        helper.expectInstructions('42', [{ opcode: OpCode.PUSH, operand: 42 }]);
      }).not.toThrow();
    });

    it('should get instruction at specific index', () => {
      const instruction = helper.getInstructionAt('42', 0);
      expect(instruction.opcode).toBe(OpCode.PUSH);
      expect(instruction.operand).toBe(42);
    });

    it('should throw when instruction index is out of bounds', () => {
      expect(() => {
        helper.getInstructionAt('42', 5);
      }).toThrow('Instruction index 5 out of bounds');
    });

    it('should expect compiler errors', () => {
      expect(() => {
        helper.expectError('undefined_variable', 'Undefined variable');
      }).not.toThrow();
    });
  });

  describe('VMTestHelper', () => {
    let helper: VMTestHelper;

    beforeEach(() => {
      helper = new VMTestHelper();
    });

    it('should execute simple expressions', () => {
      const stack = helper.execute('42');
      expect(stack).toHaveLength(1);
      expect(stack[0]?.data).toBe(42);
    });

    it('should expect stack values correctly', () => {
      expect(() => {
        helper.expectStackValues('42 + 3', [45]);
      }).not.toThrow();
    });

    it('should throw when stack values don\'t match', () => {
      expect(() => {
        helper.expectStackValues('42 + 3', [44]);
      }).toThrow('Stack[0]: expected 44, got 45');
    });

    it('should expect variable values correctly', () => {
      expect(() => {
        helper.expectVariableValues('let x = 42;', { x: 42 });
      }).not.toThrow();
    });

    it('should throw when variable not found', () => {
      expect(() => {
        helper.expectVariableValues('let x = 42;', { y: 42 });
      }).toThrow('Variable "y" not found');
    });

    it('should get VM state', () => {
      const state = helper.getState('let x = 42;');
      expect(state.variables.get('x')?.data).toBe(42);
    });

    it('should reset VM state', () => {
      helper.execute('let x = 42;');
      helper.reset();
      const state = helper.getState('let y = 10;');
      expect(state.variables.has('x')).toBe(false);
      expect(state.variables.get('y')?.data).toBe(10);
    });

    it('should expect runtime errors', () => {
      expect(() => {
        helper.expectError('1 / 0', 'Division by zero');
      }).not.toThrow();
    });
  });

  describe('TestHelpers (Combined)', () => {
    let helpers: TestHelpers;

    beforeEach(() => {
      helpers = new TestHelpers();
    });

    it('should provide access to all helpers', () => {
      expect(helpers.lexer).toBeInstanceOf(LexerTestHelper);
      expect(helpers.parser).toBeInstanceOf(ParserTestHelper);
      expect(helpers.compiler).toBeInstanceOf(CompilerTestHelper);
      expect(helpers.vm).toBeInstanceOf(VMTestHelper);
    });

    it('should test complete pipeline', () => {
      expect(() => {
        helpers.expectPipelineResult('42 + 3', [45]);
      }).not.toThrow();
    });

    it('should expect pipeline errors', () => {
      expect(() => {
        helpers.expectPipelineError('1 / 0', 'Division by zero');
      }).not.toThrow();
    });

    it('should create test programs', () => {
      const program = helpers.createTestProgram(['let x = 42;', 'x + 3']);
      expect(program).toBe('let x = 42;\nx + 3');
    });

    it('should create arithmetic tests', () => {
      const test = helpers.createArithmeticTest(42, '+', 3);
      expect(test).toBe('42 + 3');
    });

    it('should create variable tests', () => {
      const test = helpers.createVariableTest('x', 42);
      expect(test).toBe('let x = 42;');
    });

    it('should create function tests', () => {
      const test = helpers.createFunctionTest('add', ['a', 'b'], ['return a + b;']);
      expect(test).toBe('function add(a, b) {\n  return a + b;\n}');
    });
  });

  describe('Integration Tests', () => {
    let helpers: TestHelpers;

    beforeEach(() => {
      helpers = new TestHelpers();
    });

    it('should test arithmetic operations', () => {
      const testCases = [
        { expr: '5 + 3', expected: [8] },
        { expr: '10 - 4', expected: [6] },
        { expr: '6 * 7', expected: [42] },
        { expr: '15 / 3', expected: [5] },
        { expr: '17 % 5', expected: [2] }
      ];

      testCases.forEach(({ expr, expected }) => {
        expect(() => {
          helpers.expectPipelineResult(expr, expected);
        }).not.toThrow();
      });
    });

    it('should test comparison operations', () => {
      const testCases = [
        { expr: '5 > 3', expected: [true] },
        { expr: '3 < 5', expected: [true] },
        { expr: '5 >= 5', expected: [true] },
        { expr: '3 <= 5', expected: [true] },
        { expr: '5 == 5', expected: [true] },
        { expr: '5 != 3', expected: [true] }
      ];

      testCases.forEach(({ expr, expected }) => {
        expect(() => {
          helpers.expectPipelineResult(expr, expected);
        }).not.toThrow();
      });
    });

    it('should test variable operations', () => {
      const program = helpers.createTestProgram([
        'let x = 10;',
        'let y = 20;',
        'x + y'
      ]);

      expect(() => {
        helpers.expectPipelineResult(program, [30]);
      }).not.toThrow();
    });

    it('should test complex expressions', () => {
      const program = helpers.createTestProgram([
        'let a = 5;',
        'let b = 3;',
        'let c = 2;',
        'a * b + c'
      ]);

      expect(() => {
        helpers.expectPipelineResult(program, [17]);
      }).not.toThrow();
    });

    it('should test error propagation', () => {
      const errorCases = [
        { code: 'undefined_var', stage: 'compiler' },
        { code: '1 / 0', stage: 'runtime' },
        { code: '42 @', stage: 'lexer' },
        { code: '42 +', stage: 'parser' }
      ];

      errorCases.forEach(({ code }) => {
        expect(() => {
          helpers.expectPipelineError(code);
        }).not.toThrow();
      });
    });
  });
});