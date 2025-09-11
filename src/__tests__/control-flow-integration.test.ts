import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { CodeGenerator } from '../compiler/code-generator';
import { SymbolTable } from '../compiler/symbol-table';
import { VirtualMachine } from '../vm';

describe('Control Flow Integration Tests', () => {
  let lexer: Lexer;
  let parser: Parser;
  let symbolTable: SymbolTable;
  let codeGen: CodeGenerator;
  let vm: VirtualMachine;

  beforeEach(() => {
    lexer = new Lexer();
    parser = new Parser();
    symbolTable = new SymbolTable();
    codeGen = new CodeGenerator(symbolTable);
    vm = new VirtualMachine();
  });

  describe('If Statements', () => {
    it('should execute if statement with true condition', () => {
      const source = `
        let result = 0;
        if (true) {
          result = 42;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(42);
      expect(state.variables.get('result')?.data).toBe(42);
    });

    it('should execute if statement with false condition', () => {
      const source = `
        let result = 10;
        if (false) {
          result = 42;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(10); // Should remain unchanged
    });

    it('should execute if-else statement with true condition', () => {
      const source = `
        let result = 0;
        if (true) {
          result = 100;
        } else {
          result = 200;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(100);
    });

    it('should execute if-else statement with false condition', () => {
      const source = `
        let result = 0;
        if (false) {
          result = 100;
        } else {
          result = 200;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(200);
    });

    it('should execute if statement with variable condition', () => {
      const source = `
        let x = 10;
        let result = 0;
        if (x > 5) {
          result = 1;
        } else {
          result = 2;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(1); // x > 5 is true
    });
  });

  describe('While Loops', () => {
    it('should not execute while loop with false condition', () => {
      const source = `
        let counter = 0;
        while (false) {
          counter = counter + 1;
        }
        counter;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(0); // Should remain 0
    });

    it('should execute while loop with countdown', () => {
      const source = `
        let x = 3;
        let sum = 0;
        while (x > 0) {
          sum = sum + x;
          x = x - 1;
        }
        sum;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(6); // 3 + 2 + 1 = 6
      expect(state.variables.get('x')?.data).toBe(0);
      expect(state.variables.get('sum')?.data).toBe(6);
    });
  });

  describe('Nested Control Flow', () => {
    it('should execute nested if statements', () => {
      const source = `
        let x = 10;
        let result = 0;
        if (x > 5) {
          if (x > 8) {
            result = 1;
          } else {
            result = 2;
          }
        } else {
          result = 3;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(1); // x > 5 and x > 8, so result = 1
    });

    it('should execute if inside while loop', () => {
      const source = `
        let i = 0;
        let evenSum = 0;
        let oddSum = 0;
        while (i < 5) {
          if (i == 0) {
            evenSum = evenSum + i;
          } else {
            oddSum = oddSum + i;
          }
          i = i + 1;
        }
        evenSum + oddSum;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(10); // 0 + (1 + 2 + 3 + 4) = 10
    });
  });

  describe('Complex Programs', () => {
    it('should execute factorial-like calculation', () => {
      const source = `
        let n = 4;
        let result = 1;
        while (n > 0) {
          result = result * n;
          n = n - 1;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(24); // 4! = 24
    });

    it('should execute Fibonacci-like sequence', () => {
      const source = `
        let a = 0;
        let b = 1;
        let count = 0;
        let result = 0;
        while (count < 5) {
          if (count == 0) {
            result = a;
          } else {
            if (count == 1) {
              result = b;
            } else {
              result = a + b;
              a = b;
              b = result;
            }
          }
          count = count + 1;
        }
        result;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(3); // 5th Fibonacci number (0, 1, 1, 2, 3)
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty if blocks', () => {
      const source = `
        let x = 5;
        if (x > 0) {
        }
        x;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(5);
    });

    it('should handle empty while blocks', () => {
      const source = `
        let x = 0;
        while (false) {
        }
        x;
      `;
      
      const tokens = lexer.tokenize(source);
      const ast = parser.parse(tokens);
      const bytecode = codeGen.compile(ast);
      
      vm.execute(bytecode);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(0);
    });
  });
});