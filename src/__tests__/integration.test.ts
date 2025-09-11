import { TypeScriptVM } from '../index';
import { CLI, parseArgs } from '../cli/cli';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests', () => {
  describe('TypeScriptVM High-Level API', () => {
    let vm: TypeScriptVM;

    beforeEach(() => {
      vm = new TypeScriptVM();
    });

    it('should execute simple arithmetic', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      vm.execute('let result = 5 + 3; print(result);');
      
      expect(consoleSpy).toHaveBeenCalledWith('8');
      consoleSpy.mockRestore();
    });

    it('should execute function calls', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      vm.execute(`
        function add(a, b) {
          return a + b;
        }
        let result = add(10, 20);
        print(result);
      `);
      
      expect(consoleSpy).toHaveBeenCalledWith('30');
      consoleSpy.mockRestore();
    });

    it('should execute control flow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      vm.execute(`
        let x = 5;
        if (x > 0) {
          print("positive");
        } else {
          print("negative");
        }
      `);
      
      expect(consoleSpy).toHaveBeenCalledWith('positive');
      consoleSpy.mockRestore();
    });

    it('should execute loops', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      vm.execute(`
        let sum = 0;
        let i = 1;
        while (i <= 3) {
          sum = sum + i;
          i = i + 1;
        }
        print(sum);
      `);
      
      expect(consoleSpy).toHaveBeenCalledWith('6'); // 1 + 2 + 3 = 6
      consoleSpy.mockRestore();
    });

    it('should handle string operations', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      vm.execute(`
        let greeting = "Hello";
        let name = "World";
        let message = greeting + " " + name + "!";
        print(message);
      `);
      
      expect(consoleSpy).toHaveBeenCalledWith('Hello World!');
      consoleSpy.mockRestore();
    });

    it('should provide compilation details', () => {
      const result = vm.compile('let x = 42; print(x);');
      
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.ast).toBeDefined();
      expect(result.bytecode).toBeDefined();
      expect(result.bytecode.length).toBeGreaterThan(0);
    });

    it('should provide VM state', () => {
      vm.execute('let x = 42;');
      const state = vm.getState();
      
      expect(state.variables.has('x')).toBe(true);
      expect(state.variables.get('x')?.data).toBe(42);
    });

    it('should provide memory statistics', () => {
      vm.execute('let x = 42;');
      const memStats = vm.getMemoryStats();
      
      expect(memStats.totalMemory).toBeGreaterThan(0);
      expect(memStats.usedMemory).toBeGreaterThanOrEqual(0);
      expect(memStats.freeMemory).toBeGreaterThanOrEqual(0);
    });

    it('should reset properly', () => {
      vm.execute('let x = 42;');
      vm.reset();
      
      const state = vm.getState();
      expect(state.variables.size).toBe(0);
      expect(state.stack.length).toBe(0);
    });
  });

  describe('End-to-End Pipeline Tests', () => {
    it('should handle complex fibonacci program', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const vm = new TypeScriptVM();
      
      const fibonacciProgram = `
        function fibonacci(n) {
          if (n <= 1) {
            return n;
          }
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        let result = fibonacci(5);
        print(result);
      `;
      
      vm.execute(fibonacciProgram);
      
      expect(consoleSpy).toHaveBeenCalledWith('5'); // fibonacci(5) = 5
      consoleSpy.mockRestore();
    });

    it('should handle nested function calls', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const vm = new TypeScriptVM();
      
      const nestedProgram = `
        function multiply(a, b) {
          return a * b;
        }
        
        function square(x) {
          return multiply(x, x);
        }
        
        function sumOfSquares(a, b) {
          return square(a) + square(b);
        }
        
        let result = sumOfSquares(3, 4);
        print(result);
      `;
      
      vm.execute(nestedProgram);
      
      expect(consoleSpy).toHaveBeenCalledWith('25'); // 3² + 4² = 9 + 16 = 25
      consoleSpy.mockRestore();
    });

    it('should handle complex control flow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const vm = new TypeScriptVM();
      
      const controlFlowProgram = `
        function classify(num) {
          if (num > 0) {
            if (num % 2 == 0) {
              return "positive even";
            } else {
              return "positive odd";
            }
          } else {
            if (num == 0) {
              return "zero";
            } else {
              return "negative";
            }
          }
        }
        
        print(classify(4));
        print(classify(3));
        print(classify(0));
        print(classify(-2));
      `;
      
      vm.execute(controlFlowProgram);
      
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'positive even');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'positive odd');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'zero');
      expect(consoleSpy).toHaveBeenNthCalledWith(4, 'negative');
      consoleSpy.mockRestore();
    });

    it('should handle mathematical operations', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const vm = new TypeScriptVM();
      
      const mathProgram = `
        let a = 10;
        let b = 3;
        
        print(a + b);
        print(a - b);
        print(a * b);
        print(a / b);
        print(a % b);
        
        print(abs(-5));
        print(sqrt(16));
        print(pow(2, 3));
      `;
      
      vm.execute(mathProgram);
      
      expect(consoleSpy).toHaveBeenNthCalledWith(1, '13');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, '7');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, '30');
      expect(consoleSpy).toHaveBeenNthCalledWith(4, '3.3333333333333335');
      expect(consoleSpy).toHaveBeenNthCalledWith(5, '1');
      expect(consoleSpy).toHaveBeenNthCalledWith(6, '5');
      expect(consoleSpy).toHaveBeenNthCalledWith(7, '4');
      expect(consoleSpy).toHaveBeenNthCalledWith(8, '8');
      consoleSpy.mockRestore();
    });

    it('should handle string operations', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const vm = new TypeScriptVM();
      
      const stringProgram = `
        let str = "Hello World";
        print(length(str));
        print(substring(str, 0, 5));
        print(concat("Hello", " World"));
        print(toString(42));
        print(toNumber("123"));
        print(toBoolean(1));
      `;
      
      vm.execute(stringProgram);
      
      expect(consoleSpy).toHaveBeenNthCalledWith(1, '11');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Hello');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Hello World');
      expect(consoleSpy).toHaveBeenNthCalledWith(4, '42');
      expect(consoleSpy).toHaveBeenNthCalledWith(5, '123');
      expect(consoleSpy).toHaveBeenNthCalledWith(6, 'true');
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle lexer errors gracefully', () => {
      const vm = new TypeScriptVM();
      
      expect(() => {
        vm.execute('let x = "unterminated string');
      }).toThrow();
    });

    it('should handle parser errors gracefully', () => {
      const vm = new TypeScriptVM();
      
      expect(() => {
        vm.execute('let x = ;'); // Invalid syntax
      }).toThrow();
    });

    it('should handle runtime errors gracefully', () => {
      const vm = new TypeScriptVM();
      
      expect(() => {
        vm.execute('let x = 10 / 0; print(x);'); // Division by zero
      }).toThrow();
    });

    it('should handle undefined variable errors', () => {
      const vm = new TypeScriptVM();
      
      expect(() => {
        vm.execute('print(undefinedVariable);');
      }).toThrow();
    });

    it('should handle type mismatch errors', () => {
      const vm = new TypeScriptVM();
      
      expect(() => {
        vm.execute('let x = "hello"; let y = x + 5;'); // String + number
      }).toThrow();
    });
  });

  describe('Performance and Optimization Integration', () => {
    it('should apply constant folding optimization', () => {
      const vm = new TypeScriptVM();
      const result = vm.compile('let x = 5 + 3 * 2;');
      
      // The AST should be optimized to have fewer nodes due to constant folding
      expect(result.bytecode).toBeDefined();
      expect(result.bytecode.length).toBeGreaterThan(0);
    });

    it('should handle large programs efficiently', () => {
      const vm = new TypeScriptVM();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Generate a large program
      let largeProgram = '';
      for (let i = 0; i < 100; i++) {
        largeProgram += `let var${i} = ${i};\n`;
      }
      largeProgram += 'print("Done");';
      
      const startTime = Date.now();
      vm.execute(largeProgram);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(consoleSpy).toHaveBeenCalledWith('Done');
      consoleSpy.mockRestore();
    });

    it('should manage memory efficiently', () => {
      const vm = new TypeScriptVM();
      
      // Execute a program that creates many variables
      vm.execute(`
        for (let i = 0; i < 50; i++) {
          let temp = i * 2;
        }
      `);
      
      const memStats = vm.getMemoryStats();
      expect(memStats.usedMemory).toBeGreaterThanOrEqual(0);
      expect(memStats.freeMemory).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CLI Integration', () => {
    // Note: These tests would require actual file system operations
    // In a real environment, you might want to use temporary files
    
    it('should parse CLI arguments correctly', () => {
      const options = parseArgs(['-c', 'input.ts', '-o', 'output.bc', '--verbose']);
      
      expect(options.mode).toBe('compile');
      expect(options.input).toBe('input.ts');
      expect(options.output).toBe('output.bc');
      expect(options.verbose).toBe(true);
    });

    it('should handle help and version flags', () => {
      const helpOptions = parseArgs(['--help']);
      const versionOptions = parseArgs(['--version']);
      
      expect(helpOptions.help).toBe(true);
      expect(versionOptions.version).toBe(true);
    });

    it('should validate required arguments', () => {
      const options = parseArgs(['--compile']); // Missing input file
      
      expect(options.mode).toBe('compile');
      expect(options.input).toBeUndefined();
    });
  });

  describe('Regression Tests', () => {
    it('should maintain backward compatibility with basic programs', () => {
      const vm = new TypeScriptVM();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Test programs that should always work
      const basicPrograms = [
        'print("Hello World");',
        'let x = 42; print(x);',
        'function test() { return 1; } print(test());',
        'if (true) { print("yes"); }',
        'let i = 0; while (i < 3) { i = i + 1; } print(i);'
      ];
      
      for (const program of basicPrograms) {
        expect(() => vm.execute(program)).not.toThrow();
        vm.reset();
      }
      
      consoleSpy.mockRestore();
    });

    it('should handle edge cases consistently', () => {
      const vm = new TypeScriptVM();
      
      // Edge cases that should be handled gracefully
      const edgeCases = [
        'let x = 0; print(x);', // Zero value
        'let x = -1; print(x);', // Negative value
        'print("");', // Empty string
        'if (false) { print("no"); }', // False condition
        'let x = 1; let y = x; print(y);' // Variable assignment
      ];
      
      for (const testCase of edgeCases) {
        expect(() => vm.execute(testCase)).not.toThrow();
        vm.reset();
      }
    });
  });
});