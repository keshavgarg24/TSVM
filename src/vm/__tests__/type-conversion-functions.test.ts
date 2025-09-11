import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode } from '../../types';
import { RuntimeError } from '../../utils/errors';

describe('VM Type Conversion Functions', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('ToString Function (toString)', () => {
    describe('Basic Functionality', () => {
      it('should convert numbers to strings', () => {
        const testCases = [
          { input: 42, expected: '42' },
          { input: -17, expected: '-17' },
          { input: 0, expected: '0' },
          { input: 3.14159, expected: '3.14159' },
          { input: -0.5, expected: '-0.5' }
        ];

        testCases.forEach(({ input, expected }) => {
          vm.reset();
          
          const instructions = [
            factory.push(input),
            factory.call('toString'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack).toHaveLength(1);
          expect(state.stack[0]?.type).toBe('string');
          expect(state.stack[0]?.data).toBe(expected);
        });
      });

      it('should convert booleans to strings', () => {
        const instructions = [
          factory.push(true),
          factory.call('toString'),
          factory.halt()
        ];

        vm.execute(instructions);
        let state = vm.getState();

        expect(state.stack[0]?.type).toBe('string');
        expect(state.stack[0]?.data).toBe('true');

        vm.reset();

        const instructions2 = [
          factory.push(false),
          factory.call('toString'),
          factory.halt()
        ];

        vm.execute(instructions2);
        state = vm.getState();

        expect(state.stack[0]?.data).toBe('false');
      });

      it('should handle strings (identity conversion)', () => {
        const testStrings = [
          'hello',
          '',
          'Hello, World!',
          '123',
          'true',
          'false'
        ];

        testStrings.forEach(str => {
          vm.reset();
          
          const instructions = [
            factory.push(str),
            factory.call('toString'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack[0]?.type).toBe('string');
          expect(state.stack[0]?.data).toBe(str);
        });
      });

      it('should handle special number values', () => {
        const testCases = [
          { input: Number.MAX_SAFE_INTEGER, expected: String(Number.MAX_SAFE_INTEGER) },
          { input: Number.MIN_SAFE_INTEGER, expected: String(Number.MIN_SAFE_INTEGER) },
          { input: Number.EPSILON, expected: String(Number.EPSILON) }
        ];

        testCases.forEach(({ input, expected }) => {
          vm.reset();
          
          const instructions = [
            factory.push(input),
            factory.call('toString'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack[0]?.data).toBe(expected);
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle empty stack', () => {
        const instructions = [
          factory.call('toString'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/cannot execute toString from empty stack/i);
      });
    });
  });

  describe('ToNumber Function (toNumber)', () => {
    describe('Basic Functionality', () => {
      it('should convert numeric strings to numbers', () => {
        const testCases = [
          { input: '42', expected: 42 },
          { input: '-17', expected: -17 },
          { input: '0', expected: 0 },
          { input: '3.14159', expected: 3.14159 },
          { input: '-0.5', expected: -0.5 },
          { input: '123.456', expected: 123.456 }
        ];

        testCases.forEach(({ input, expected }) => {
          vm.reset();
          
          const instructions = [
            factory.push(input),
            factory.call('toNumber'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack).toHaveLength(1);
          expect(state.stack[0]?.type).toBe('number');
          expect(state.stack[0]?.data).toBe(expected);
        });
      });

      it('should convert booleans to numbers', () => {
        const instructions = [
          factory.push(true),
          factory.call('toNumber'),
          factory.halt()
        ];

        vm.execute(instructions);
        let state = vm.getState();

        expect(state.stack[0]?.type).toBe('number');
        expect(state.stack[0]?.data).toBe(1);

        vm.reset();

        const instructions2 = [
          factory.push(false),
          factory.call('toNumber'),
          factory.halt()
        ];

        vm.execute(instructions2);
        state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it('should handle numbers (identity conversion)', () => {
        const testNumbers = [42, -17, 0, 3.14159, -0.5];

        testNumbers.forEach(num => {
          vm.reset();
          
          const instructions = [
            factory.push(num),
            factory.call('toNumber'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack[0]?.type).toBe('number');
          expect(state.stack[0]?.data).toBe(num);
        });
      });

      it('should handle special numeric strings', () => {
        const testCases = [
          { input: '0.0', expected: 0 },
          { input: '1.0', expected: 1 },
          { input: '00042', expected: 42 },
          { input: '-0', expected: -0 }
        ];

        testCases.forEach(({ input, expected }) => {
          vm.reset();
          
          const instructions = [
            factory.push(input),
            factory.call('toNumber'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack[0]?.data).toBe(expected);
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle empty stack', () => {
        const instructions = [
          factory.call('toNumber'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/cannot execute toNumber from empty stack/i);
      });

      it('should handle invalid numeric strings', () => {
        const invalidStrings = [
          'hello',
          'not_a_number',
          '12.34.56',
          'abc123',
          '123abc'
        ];

        invalidStrings.forEach(str => {
          vm.reset();
          
          const instructions = [
            factory.push(str),
            factory.call('toNumber'),
            factory.halt()
          ];

          expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        });
      });
    });
  });

  describe('ToBoolean Function (toBoolean)', () => {
    describe('Basic Functionality', () => {
      it('should convert numbers to booleans', () => {
        const testCases = [
          { input: 0, expected: false },
          { input: 1, expected: true },
          { input: -1, expected: true },
          { input: 42, expected: true },
          { input: -17, expected: true },
          { input: 3.14159, expected: true },
          { input: -0.5, expected: true },
          { input: 0.0, expected: false }
        ];

        testCases.forEach(({ input, expected }) => {
          vm.reset();
          
          const instructions = [
            factory.push(input),
            factory.call('toBoolean'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack).toHaveLength(1);
          expect(state.stack[0]?.type).toBe('boolean');
          expect(state.stack[0]?.data).toBe(expected);
        });
      });

      it('should convert strings to booleans', () => {
        const testCases = [
          { input: '', expected: false },
          { input: 'hello', expected: true },
          { input: 'false', expected: true }, // Non-empty string is truthy
          { input: 'true', expected: true },
          { input: '0', expected: true }, // Non-empty string is truthy
          { input: ' ', expected: true }, // Non-empty string is truthy
          { input: 'Hello, World!', expected: true }
        ];

        testCases.forEach(({ input, expected }) => {
          vm.reset();
          
          const instructions = [
            factory.push(input),
            factory.call('toBoolean'),
            factory.halt()
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack[0]?.type).toBe('boolean');
          expect(state.stack[0]?.data).toBe(expected);
        });
      });

      it('should handle booleans (identity conversion)', () => {
        const instructions = [
          factory.push(true),
          factory.call('toBoolean'),
          factory.halt()
        ];

        vm.execute(instructions);
        let state = vm.getState();

        expect(state.stack[0]?.type).toBe('boolean');
        expect(state.stack[0]?.data).toBe(true);

        vm.reset();

        const instructions2 = [
          factory.push(false),
          factory.call('toBoolean'),
          factory.halt()
        ];

        vm.execute(instructions2);
        state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle empty stack', () => {
        const instructions = [
          factory.call('toBoolean'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/cannot execute toBoolean from empty stack/i);
      });
    });
  });

  describe('Type Conversion Integration and Edge Cases', () => {
    describe('Integration with Variables', () => {
      it('should work with stored variables', () => {
        const instructions = [
          factory.push(42),
          factory.store('number'),
          factory.load('number'),
          factory.call('toString'),
          factory.store('numberString'),
          factory.load('numberString'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('42');
        expect(state.variables.get('numberString')?.data).toBe('42');
      });

      it('should work with computed values', () => {
        const instructions = [
          factory.push(10),
          factory.push(5),
          factory.add(),           // 15
          factory.call('toString'), // "15"
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('15');
      });
    });

    describe('Integration with Arithmetic Operations', () => {
      it('should convert strings to numbers for arithmetic', () => {
        const instructions = [
          factory.push('10'),
          factory.call('toNumber'),  // 10
          factory.push('5'),
          factory.call('toNumber'),  // 5
          factory.add(),             // 15
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(15);
      });

      it('should use boolean conversion in comparisons', () => {
        const instructions = [
          factory.push('hello'),
          factory.call('toBoolean'), // true
          factory.push(0),
          factory.call('toBoolean'), // false
          factory.eq(),              // true == false = false
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });
    });

    describe('Integration with Control Flow', () => {
      it('should work within conditional branches', () => {
        const instructions = [
          factory.push(''),          // 0
          factory.call('toBoolean'), // 1: false
          factory.jumpIfFalse(5),    // 2: should jump
          factory.push('truthy'),    // 3: should not execute
          factory.jump(6),           // 4: should not execute
          factory.push('falsy'),     // 5: should execute
          factory.halt()             // 6
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('falsy');
      });

      it('should work with string concatenation after conversion', () => {
        const instructions = [
          factory.push(42),
          factory.call('toString'),  // "42"
          factory.push(' items'),
          factory.call('concat'),    // "42 items"
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('42 items');
      });
    });

    describe('Chained Type Conversions', () => {
      it('should handle number -> string -> number conversion', () => {
        const instructions = [
          factory.push(42),
          factory.call('toString'),  // "42"
          factory.call('toNumber'),  // 42
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.type).toBe('number');
        expect(state.stack[0]?.data).toBe(42);
      });

      it('should handle boolean -> number -> string conversion', () => {
        const instructions = [
          factory.push(true),
          factory.call('toNumber'),  // 1
          factory.call('toString'),  // "1"
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.type).toBe('string');
        expect(state.stack[0]?.data).toBe('1');
      });

      it('should handle string -> boolean -> number conversion', () => {
        const instructions = [
          factory.push('hello'),
          factory.call('toBoolean'), // true
          factory.call('toNumber'),  // 1
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.type).toBe('number');
        expect(state.stack[0]?.data).toBe(1);
      });
    });

    describe('Complex Type Conversion Scenarios', () => {
      it('should build formatted output with type conversions', () => {
        const instructions = [
          // Build "Count: 42, Active: true"
          factory.push('Count: '),
          factory.push(42),
          factory.call('toString'),
          factory.call('concat'),    // "Count: 42"
          
          factory.push(', Active: '),
          factory.call('concat'),    // "Count: 42, Active: "
          
          factory.push(true),
          factory.call('toString'),
          factory.call('concat'),    // "Count: 42, Active: true"
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('Count: 42, Active: true');
      });

      it('should validate input with type conversions', () => {
        const instructions = [
          factory.push('123'),       // 0: Input string
          factory.dup(),             // 1: Duplicate
          factory.call('toNumber'),  // 2: Convert to number: 123
          factory.push(100),         // 3: Comparison value
          factory.gt(),              // 4: 123 > 100 = true
          factory.jumpIfFalse(8),    // 5: if false, jump to 8
          factory.push('Valid'),     // 6: Valid result
          factory.jump(9),           // 7: jump to end
          factory.push('Invalid'),   // 8: Invalid result
          factory.halt()             // 9: end
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[1]?.data).toBe('Valid'); // Second item on stack
      });
    });

    describe('Error Propagation and Recovery', () => {
      it('should propagate errors through conversion chains', () => {
        const instructions = [
          factory.push('invalid_number'),
          factory.call('toNumber'),  // Error
          factory.call('toString'),  // Should not execute
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should maintain stack consistency after conversion errors', () => {
        // First, successful conversion
        vm.execute([
          factory.push('42'),
          factory.call('toNumber'),
          factory.halt()
        ]);

        let state = vm.getState();
        expect(state.stack[0]?.data).toBe(42);

        // Now try failed conversion
        try {
          vm.execute([
            factory.push('invalid'),
            factory.call('toNumber'),
            factory.halt()
          ]);
        } catch (error) {
          // Expected to fail
        }

        // Previous state should still be intact
        state = vm.getState();
        expect(state.stack[0]?.data).toBe(42);
      });

      it('should handle partial conversion operations with errors', () => {
        const instructions = [
          factory.push(42),
          factory.call('toString'),  // "42"
          factory.push('invalid'),
          factory.call('toNumber'),  // Error
          factory.halt()
        ];

        try {
          vm.execute(instructions);
        } catch (error) {
          // Expected to fail
        }

        const state = vm.getState();
        expect(state.stack[0]?.data).toBe('42'); // Should have the converted string
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid type conversion calls', () => {
      const instructions = [];
      
      // Perform multiple conversions
      for (let i = 0; i < 10; i++) {
        instructions.push(factory.push(i));
        instructions.push(factory.call('toString'));
        instructions.push(factory.call('toNumber'));
      }
      instructions.push(factory.halt());

      const startTime = Date.now();
      vm.execute(instructions);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(10);
      expect(state.stack[0]?.data).toBe(0);
      expect(state.stack[9]?.data).toBe(9);
    });

    it('should handle edge case values', () => {
      const testCases = [
        { value: Number.EPSILON, toString: String(Number.EPSILON) },
        { value: Number.MAX_VALUE, toString: String(Number.MAX_VALUE) },
        { value: Number.MIN_VALUE, toString: String(Number.MIN_VALUE) }
      ];

      testCases.forEach(({ value, toString: expectedString }) => {
        vm.reset();
        
        const instructions = [
          factory.push(value),
          factory.call('toString'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(expectedString);
      });
    });

    it('should handle very long strings in conversions', () => {
      const longString = 'A'.repeat(1000);
      
      const instructions = [
        factory.push(longString),
        factory.call('toString'), // Identity conversion for strings
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack[0]?.type).toBe('string');
      expect((state.stack[0]?.data as string).length).toBe(1000);
    });
  });
});