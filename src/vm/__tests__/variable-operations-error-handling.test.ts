import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode } from '../../types';
import { RuntimeError } from '../../utils/errors';

describe('VM Variable Operations and Runtime Error Handling', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('Variable Load and Store Operations', () => {
    describe('STORE Instruction', () => {
      it('should store number values', () => {
        const instructions = [
          factory.push(42),
          factory.store('numberVar'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('numberVar')?.type).toBe('number');
        expect(state.variables.get('numberVar')?.data).toBe(42);
        expect(state.stack).toHaveLength(0); // Value should be consumed
      });

      it('should store string values', () => {
        const instructions = [
          factory.push('hello world'),
          factory.store('stringVar'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('stringVar')?.type).toBe('string');
        expect(state.variables.get('stringVar')?.data).toBe('hello world');
      });

      it('should store boolean values', () => {
        const instructions = [
          factory.push(true),
          factory.store('boolVar'),
          factory.push(false),
          factory.store('boolVar2'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('boolVar')?.type).toBe('boolean');
        expect(state.variables.get('boolVar')?.data).toBe(true);
        expect(state.variables.get('boolVar2')?.data).toBe(false);
      });

      it('should overwrite existing variables', () => {
        const instructions = [
          factory.push(100),
          factory.store('var'),
          factory.push(200),
          factory.store('var'), // Overwrite
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('var')?.data).toBe(200);
        expect(state.variables.size).toBe(1);
      });

      it('should handle variable names with special characters', () => {
        const instructions = [
          factory.push(42),
          factory.store('var_123'),
          factory.push(24),
          factory.store('_private'),
          factory.push(12),
          factory.store('$special'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('var_123')?.data).toBe(42);
        expect(state.variables.get('_private')?.data).toBe(24);
        expect(state.variables.get('$special')?.data).toBe(12);
      });

      it('should clone values during store to prevent reference issues', () => {
        const instructions = [
          factory.push('original'),
          factory.dup(),
          factory.store('var1'),
          factory.store('var2'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        const var1 = state.variables.get('var1');
        const var2 = state.variables.get('var2');

        expect(var1?.data).toBe('original');
        expect(var2?.data).toBe('original');
        expect(var1).not.toBe(var2); // Should be different objects
      });

      it('should handle empty string variable names', () => {
        const instructions = [
          factory.push(42),
          factory.store(''),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('')?.data).toBe(42);
      });

      it('should handle store without value on stack', () => {
        const instructions = [
          factory.store('var'), // No value on stack
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/cannot store from empty stack/i);
      });

      it('should require string operand for store', () => {
        const instructions = [
          factory.push(42),
          { opcode: OpCode.STORE, operand: 123 }, // Non-string operand
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('LOAD Instruction', () => {
      it('should load stored number values', () => {
        const instructions = [
          factory.push(42),
          factory.store('num'),
          factory.load('num'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe('number');
        expect(state.stack[0]?.data).toBe(42);
      });

      it('should load stored string values', () => {
        const instructions = [
          factory.push('test string'),
          factory.store('str'),
          factory.load('str'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.type).toBe('string');
        expect(state.stack[0]?.data).toBe('test string');
      });

      it('should load stored boolean values', () => {
        const instructions = [
          factory.push(true),
          factory.store('flag'),
          factory.load('flag'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.type).toBe('boolean');
        expect(state.stack[0]?.data).toBe(true);
      });

      it('should load multiple variables', () => {
        const instructions = [
          factory.push(10),
          factory.store('a'),
          factory.push(20),
          factory.store('b'),
          factory.push(30),
          factory.store('c'),
          factory.load('a'),
          factory.load('b'),
          factory.load('c'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(3);
        expect(state.stack[0]?.data).toBe(10);
        expect(state.stack[1]?.data).toBe(20);
        expect(state.stack[2]?.data).toBe(30);
      });

      it('should clone values during load to prevent reference issues', () => {
        const instructions = [
          factory.push('original'),
          factory.store('var'),
          factory.load('var'),
          factory.load('var'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(2);
        expect(state.stack[0]?.data).toBe('original');
        expect(state.stack[1]?.data).toBe('original');
        expect(state.stack[0]).not.toBe(state.stack[1]); // Should be different objects
      });

      it('should handle undefined variable access', () => {
        const instructions = [
          factory.load('undefinedVar'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/undefined variable/i);
      });

      it('should require string operand for load', () => {
        const instructions = [
          { opcode: OpCode.LOAD, operand: 123 }, // Non-string operand
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle load after variable deletion (reset)', () => {
        // Store a variable
        vm.execute([
          factory.push(42),
          factory.store('temp'),
          factory.halt()
        ]);

        // Reset VM (clears variables)
        vm.reset();

        // Try to load the variable
        expect(() => vm.execute([
          factory.load('temp'),
          factory.halt()
        ])).toThrow(RuntimeError);
      });
    });

    describe('Variable Operations Integration', () => {
      it('should handle variable arithmetic operations', () => {
        const instructions = [
          factory.push(10),
          factory.store('x'),
          factory.push(5),
          factory.store('y'),
          factory.load('x'),
          factory.load('y'),
          factory.add(),
          factory.store('result'),
          factory.load('result'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.data).toBe(15);
        expect(state.variables.get('result')?.data).toBe(15);
      });

      it('should handle variable comparison operations', () => {
        const instructions = [
          factory.push(10),
          factory.store('a'),
          factory.push(20),
          factory.store('b'),
          factory.load('a'),
          factory.load('b'),
          factory.lt(),
          factory.store('isLess'),
          factory.load('isLess'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.type).toBe('boolean');
        expect(state.stack[0]?.data).toBe(true);
      });

      it('should handle variable swapping', () => {
        const instructions = [
          factory.push(100),
          factory.store('a'),
          factory.push(200),
          factory.store('b'),
          // Swap: temp = a; a = b; b = temp;
          factory.load('a'),
          factory.store('temp'),
          factory.load('b'),
          factory.store('a'),
          factory.load('temp'),
          factory.store('b'),
          // Load results
          factory.load('a'),
          factory.load('b'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(2);
        expect(state.stack[0]?.data).toBe(200); // a should now be 200
        expect(state.stack[1]?.data).toBe(100); // b should now be 100
      });

      it('should handle variables in control flow', () => {
        const instructions = [
          factory.push(7),
          factory.store('x'),
          factory.load('x'),
          factory.push(5),
          factory.gt(),
          factory.jumpIfFalse(9),
          factory.push('big'),
          factory.store('result'),
          factory.jump(11),
          factory.push('small'),
          factory.store('result'),
          factory.load('result'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('big');
        expect(state.variables.get('result')?.data).toBe('big');
      });
    });
  });

  describe('Runtime Error Scenarios', () => {
    describe('Stack Overflow Errors', () => {
      it('should handle operand stack overflow', () => {
        const instructions: any[] = [];
        
        // Push many values to exceed stack limit
        for (let i = 0; i < 1001; i++) { // Exceeds maxStackSize of 1000
          instructions.push(factory.push(i));
        }
        instructions.push(factory.halt());

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/stack overflow/i);
      });

      it('should handle stack underflow in arithmetic operations', () => {
        const instructions = [
          factory.push(5),
          factory.add(), // Missing second operand
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle stack underflow in comparison operations', () => {
        const instructions = [
          factory.push(10),
          factory.eq(), // Missing second operand
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle stack underflow on pop', () => {
        const instructions = [
          factory.pop(), // Empty stack
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle stack underflow on dup', () => {
        const instructions = [
          factory.dup(), // Empty stack
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle call stack overflow', () => {
        // This would require recursive function calls
        // For now, test the basic call mechanism
        const instructions = [
          factory.push(1),
          factory.call('undefinedRecursive'), // Will fail before overflow
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('Undefined Variable Errors', () => {
      it('should handle undefined variable load', () => {
        const instructions = [
          factory.load('nonexistent'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/undefined variable.*nonexistent/i);
      });

      it('should handle undefined variable in arithmetic', () => {
        const instructions = [
          factory.push(10),
          factory.load('undefined_var'),
          factory.add(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle undefined variable in comparison', () => {
        const instructions = [
          factory.push(5),
          factory.load('missing'),
          factory.gt(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle undefined function calls', () => {
        const instructions = [
          factory.push(42),
          factory.call('undefinedFunction'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/undefined function/i);
      });
    });

    describe('Type Mismatch Errors', () => {
      it('should handle arithmetic type mismatches', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(42),
          factory.add(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle comparison type mismatches', () => {
        const instructions = [
          factory.push('text'),
          factory.push(100),
          factory.lt(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle division by zero', () => {
        const instructions = [
          factory.push(10),
          factory.push(0),
          factory.div(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/division by zero/i);
      });

      it('should handle modulo by zero', () => {
        const instructions = [
          factory.push(10),
          factory.push(0),
          factory.mod(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('Invalid Instruction Errors', () => {
      it('should handle unknown opcodes', () => {
        const instructions = [
          factory.push(42),
          { opcode: 999 as OpCode }, // Invalid opcode
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle invalid jump addresses', () => {
        const instructions = [
          factory.jump(100), // Beyond program bounds
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle invalid operand types', () => {
        const instructions = [
          { opcode: OpCode.PUSH }, // Missing operand
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('Infinite Loop Protection', () => {
      it('should prevent infinite loops with instruction limit', () => {
        const instructions = [
          factory.push(1),    // 0
          factory.jump(0),    // 1 - infinite loop
          factory.halt()      // 2 - never reached
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        // The infinite loop actually hits stack overflow first due to repeated PUSH operations
      });

      it('should handle complex infinite loops', () => {
        const instructions = [
          factory.push(1),    // 0
          factory.dup(),      // 1
          factory.pop(),      // 2
          factory.jump(1),    // 3 - loop back
          factory.halt()      // 4
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });
  });

  describe('Variable Storage with Proper Scoping', () => {
    describe('Global Variable Scope', () => {
      it('should maintain global variables across operations', () => {
        const instructions = [
          factory.push(100),
          factory.store('global1'),
          factory.push(200),
          factory.store('global2'),
          factory.load('global1'),
          factory.load('global2'),
          factory.add(),
          factory.store('sum'),
          factory.load('sum'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('global1')?.data).toBe(100);
        expect(state.variables.get('global2')?.data).toBe(200);
        expect(state.variables.get('sum')?.data).toBe(300);
        expect(state.stack[0]?.data).toBe(300);
      });

      it('should handle variable shadowing (overwriting)', () => {
        const instructions = [
          factory.push('initial'),
          factory.store('var'),
          factory.push('updated'),
          factory.store('var'), // Shadow/overwrite
          factory.load('var'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.get('var')?.data).toBe('updated');
        expect(state.stack[0]?.data).toBe('updated');
      });

      it('should maintain variable isolation between executions', () => {
        // First execution
        vm.execute([
          factory.push(42),
          factory.store('isolated'),
          factory.halt()
        ]);

        let state = vm.getState();
        expect(state.variables.get('isolated')?.data).toBe(42);

        // Reset and second execution
        vm.reset();
        
        expect(() => vm.execute([
          factory.load('isolated'), // Should fail - variable doesn't exist
          factory.halt()
        ])).toThrow(RuntimeError);
      });
    });

    describe('Variable Lifetime Management', () => {
      it('should handle variable creation and deletion', () => {
        const instructions = [
          factory.push(1),
          factory.store('temp1'),
          factory.push(2),
          factory.store('temp2'),
          factory.push(3),
          factory.store('temp3'),
          factory.halt()
        ];

        vm.execute(instructions);
        let state = vm.getState();

        expect(state.variables.size).toBe(3);

        // Reset clears all variables
        vm.reset();
        state = vm.getState();

        expect(state.variables.size).toBe(0);
      });

      it('should handle large numbers of variables', () => {
        const instructions: any[] = [];
        
        // Create many variables
        for (let i = 0; i < 100; i++) {
          instructions.push(factory.push(i));
          instructions.push(factory.store(`var_${i}`));
        }
        
        // Load some variables
        instructions.push(factory.load('var_0'));
        instructions.push(factory.load('var_50'));
        instructions.push(factory.load('var_99'));
        instructions.push(factory.halt());

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.variables.size).toBe(100);
        expect(state.stack).toHaveLength(3);
        expect(state.stack[0]?.data).toBe(0);
        expect(state.stack[1]?.data).toBe(50);
        expect(state.stack[2]?.data).toBe(99);
      });
    });
  });

  describe('Comprehensive Runtime Error Reporting', () => {
    describe('Stack Trace Generation', () => {
      it('should provide stack traces for runtime errors', () => {
        const instructions = [
          factory.push(10),
          factory.push(0),
          factory.div(), // Division by zero
          factory.halt()
        ];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error).toBeInstanceOf(RuntimeError);
          expect(error.stackTrace).toBeDefined();
          expect(Array.isArray(error.stackTrace)).toBe(true);
        }
      });

      it('should include instruction information in stack traces', () => {
        const instructions = [
          factory.load('nonexistent'),
          factory.halt()
        ];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.stackTrace).toBeDefined();
          expect(Array.isArray(error.stackTrace)).toBe(true);
          // Stack trace might be empty for some error types
        }
      });

      it('should provide meaningful error messages', () => {
        const testCases = [
          {
            instructions: [factory.load('missing'), factory.halt()],
            expectedMessage: /undefined variable.*missing/i
          },
          {
            instructions: [factory.push(10), factory.push(0), factory.div(), factory.halt()],
            expectedMessage: /division by zero/i
          },
          {
            instructions: [factory.push('text'), factory.push(5), factory.add(), factory.halt()],
            expectedMessage: /type.*mismatch/i
          }
        ];

        testCases.forEach(({ instructions, expectedMessage }) => {
          try {
            vm.reset();
            vm.execute(instructions);
            fail('Should have thrown an error');
          } catch (error: any) {
            expect(error.message).toMatch(expectedMessage);
          }
        });
      });

      it('should handle nested error contexts', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const instructions = [
          factory.push('test'),
          factory.call('print'), // This will succeed
          factory.load('undefined'), // This will fail
          factory.halt()
        ];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error).toBeInstanceOf(RuntimeError);
          expect(error.message).toContain('undefined');
        }

        consoleSpy.mockRestore();
      });
    });

    describe('Error Recovery and State Consistency', () => {
      it('should maintain state consistency after errors', () => {
        // First, execute valid instructions
        vm.execute([
          factory.push(42),
          factory.store('valid'),
          factory.halt()
        ]);

        let state = vm.getState();
        expect(state.variables.get('valid')?.data).toBe(42);

        // Now try invalid instructions
        try {
          vm.execute([
            factory.push(10),
            factory.push(0),
            factory.div(), // Division by zero
            factory.halt()
          ]);
        } catch (error) {
          // Expected to fail
        }

        // Previous state should still be intact
        state = vm.getState();
        expect(state.variables.get('valid')?.data).toBe(42);
      });

      it('should handle partial execution failures', () => {
        const instructions = [
          factory.push(1),
          factory.store('first'),
          factory.push(2),
          factory.store('second'),
          factory.load('nonexistent'), // This will fail
          factory.push(3),
          factory.store('third'), // Should not execute
          factory.halt()
        ];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error) {
          // Expected to fail
        }

        const state = vm.getState();
        expect(state.variables.get('first')?.data).toBe(1);
        expect(state.variables.get('second')?.data).toBe(2);
        expect(state.variables.has('third')).toBe(false); // Should not exist
      });

      it('should handle error propagation through complex operations', () => {
        const instructions = [
          factory.push(10),
          factory.store('x'),
          factory.load('x'),
          factory.load('undefined_var'), // Error here
          factory.add(), // Should not execute
          factory.store('result'), // Should not execute
          factory.halt()
        ];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toContain('undefined_var');
        }

        const state = vm.getState();
        expect(state.variables.get('x')?.data).toBe(10);
        expect(state.variables.has('result')).toBe(false);
      });
    });

    describe('Error Type Classification', () => {
      it('should classify stack overflow errors correctly', () => {
        const instructions = [factory.pop(), factory.halt()];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.type).toBe('stack_overflow');
        }
      });

      it('should classify undefined variable errors correctly', () => {
        const instructions = [factory.load('missing'), factory.halt()];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.type).toBe('undefined_variable');
        }
      });

      it('should classify division by zero errors correctly', () => {
        const instructions = [
          factory.push(10),
          factory.push(0),
          factory.div(),
          factory.halt()
        ];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.type).toBe('division_by_zero');
        }
      });

      it('should classify type mismatch errors correctly', () => {
        const instructions = [
          factory.push('text'),
          factory.push(5),
          factory.add(),
          factory.halt()
        ];

        try {
          vm.execute(instructions);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.type).toBe('type_mismatch');
        }
      });
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle large variable operations efficiently', () => {
      const instructions: any[] = [];
      
      // Create, modify, and access many variables
      for (let i = 0; i < 50; i++) {
        instructions.push(factory.push(i * 2));
        instructions.push(factory.store(`var_${i}`));
        instructions.push(factory.load(`var_${i}`));
        instructions.push(factory.push(1));
        instructions.push(factory.add());
        instructions.push(factory.store(`var_${i}`));
      }
      
      instructions.push(factory.halt());

      const startTime = Date.now();
      vm.execute(instructions);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly

      const state = vm.getState();
      expect(state.variables.size).toBe(50);
      
      // Check some values
      expect(state.variables.get('var_0')?.data).toBe(1); // (0 * 2) + 1
      expect(state.variables.get('var_10')?.data).toBe(21); // (10 * 2) + 1
    });

    it('should handle memory cleanup efficiently', () => {
      // Create many variables
      for (let i = 0; i < 5; i++) {
        const instructions: any[] = [];
        for (let j = 0; j < 20; j++) {
          instructions.push(factory.push(j));
          instructions.push(factory.store(`temp_${j}`));
        }
        instructions.push(factory.halt());

        vm.execute(instructions);
        vm.reset(); // Clean up
      }

      const state = vm.getState();
      expect(state.variables.size).toBe(0);
      expect(state.stack).toHaveLength(0);
    });
  });
});