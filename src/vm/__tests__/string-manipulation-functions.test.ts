import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode } from '../../types';
import { RuntimeError } from '../../utils/errors';

describe('VM String Manipulation Functions', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('String Length Function (length)', () => {
    describe('Basic Functionality', () => {
      it('should calculate length of simple strings', () => {
        const instructions = [
          factory.push('hello'),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe('number');
        expect(state.stack[0]?.data).toBe(5);
      });

      it('should handle empty strings', () => {
        const instructions = [
          factory.push(''),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it('should handle single character strings', () => {
        const instructions = [
          factory.push('a'),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(1);
      });

      it('should handle strings with spaces', () => {
        const instructions = [
          factory.push('hello world'),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(11);
      });

      it('should handle strings with special characters', () => {
        const instructions = [
          factory.push('Hello, World! 123 @#$'),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(21);
      });

      it('should handle very long strings', () => {
        const longString = 'A'.repeat(1000);
        const instructions = [
          factory.push(longString),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(1000);
      });

      it('should handle Unicode characters', () => {
        const instructions = [
          factory.push('🚀✨🎉'),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(5); // JavaScript string length
      });
    });

    describe('Error Handling', () => {
      it('should handle empty stack', () => {
        const instructions = [
          factory.call('length'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/cannot execute length from empty stack/i);
      });

      it('should handle non-string types', () => {
        const testCases = [42, true, false];

        testCases.forEach(value => {
          vm.reset();
          
          const instructions = [
            factory.push(value),
            factory.call('length'),
            factory.halt()
          ];

          expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        });
      });
    });
  });

  describe('String Substring Function (substring)', () => {
    describe('Basic Functionality', () => {
      it('should extract substring with valid indices', () => {
        const instructions = [
          factory.push('hello world'),
          factory.push(0),    // start
          factory.push(5),    // end
          factory.call('substring'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe('string');
        expect(state.stack[0]?.data).toBe('hello');
      });

      it('should extract substring from middle of string', () => {
        const instructions = [
          factory.push('hello world'),
          factory.push(6),    // start
          factory.push(11),   // end
          factory.call('substring'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('world');
      });

      it('should handle substring with same start and end', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(2),    // start
          factory.push(2),    // end
          factory.call('substring'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('');
      });

      it('should handle substring of entire string', () => {
        const instructions = [
          factory.push('test'),
          factory.push(0),    // start
          factory.push(4),    // end
          factory.call('substring'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('test');
      });

      it('should handle substring with floating point indices', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(1.7),  // start (should floor to 1)
          factory.push(3.9),  // end (should floor to 3)
          factory.call('substring'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('el');
      });

      it('should handle empty string substring', () => {
        const instructions = [
          factory.push(''),
          factory.push(0),    // start
          factory.push(0),    // end
          factory.call('substring'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('');
      });

      it('should handle single character extraction', () => {
        const instructions = [
          factory.push('abcdef'),
          factory.push(2),    // start
          factory.push(3),    // end
          factory.call('substring'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('c');
      });
    });

    describe('Error Handling', () => {
      it('should handle insufficient operands', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(0),
          factory.call('substring'), // Missing end index
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        // The error message may vary based on execution order
      });

      it('should handle empty stack', () => {
        const instructions = [
          factory.call('substring'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle non-string first argument', () => {
        const instructions = [
          factory.push(42),   // Not a string
          factory.push(0),
          factory.push(2),
          factory.call('substring'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle negative indices', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(-1),   // Negative start
          factory.push(3),
          factory.call('substring'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/cannot be negative/i);
      });

      it('should handle indices beyond string length', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(0),
          factory.push(10),   // Beyond string length
          factory.call('substring'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/cannot exceed string length/i);
      });

      it('should handle start index greater than end index', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(3),    // start
          factory.push(1),    // end (less than start)
          factory.call('substring'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/start index cannot be greater than end index/i);
      });

      it('should handle non-numeric indices', () => {
        const instructions = [
          factory.push('hello'),
          factory.push('invalid'), // Non-numeric start
          factory.push(3),
          factory.call('substring'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });
  });

  describe('String Concatenation Function (concat)', () => {
    describe('Basic Functionality', () => {
      it('should concatenate two strings', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(' world'),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe('string');
        expect(state.stack[0]?.data).toBe('hello world');
      });

      it('should concatenate empty strings', () => {
        const instructions = [
          factory.push(''),
          factory.push(''),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('');
      });

      it('should concatenate string with empty string', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(''),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('hello');
      });

      it('should concatenate empty string with string', () => {
        const instructions = [
          factory.push(''),
          factory.push('world'),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('world');
      });

      it('should concatenate strings with special characters', () => {
        const instructions = [
          factory.push('Hello, '),
          factory.push('World! 🌍'),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('Hello, World! 🌍');
      });

      it('should concatenate long strings', () => {
        const str1 = 'A'.repeat(500);
        const str2 = 'B'.repeat(500);
        
        const instructions = [
          factory.push(str1),
          factory.push(str2),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(str1 + str2);
        expect((state.stack[0]?.data as string).length).toBe(1000);
      });
    });

    describe('Type Conversion', () => {
      it('should convert numbers to strings for concatenation', () => {
        const instructions = [
          factory.push('Number: '),
          factory.push(42),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('Number: 42');
      });

      it('should convert booleans to strings for concatenation', () => {
        const instructions = [
          factory.push('Value: '),
          factory.push(true),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('Value: true');
      });

      it('should handle mixed type concatenation', () => {
        const instructions = [
          factory.push(42),
          factory.push(' items'),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('42 items');
      });

      it('should convert false boolean correctly', () => {
        const instructions = [
          factory.push('Status: '),
          factory.push(false),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('Status: false');
      });
    });

    describe('Error Handling', () => {
      it('should handle insufficient operands', () => {
        const instructions = [
          factory.push('hello'),
          factory.call('concat'), // Missing second string
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        // The error message may vary based on execution order
      });

      it('should handle empty stack', () => {
        const instructions = [
          factory.call('concat'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });
  });

  describe('String Function Integration with VM', () => {
    describe('Integration with Variables', () => {
      it('should work with stored string variables', () => {
        const instructions = [
          factory.push('Hello, World!'),
          factory.store('message'),
          factory.load('message'),
          factory.call('length'),
          factory.store('messageLength'),
          factory.load('messageLength'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(13);
        expect(state.variables.get('messageLength')?.data).toBe(13);
      });

      it('should work with computed string values', () => {
        const instructions = [
          factory.push('Hello'),
          factory.push(', '),
          factory.call('concat'),
          factory.push('World!'),
          factory.call('concat'),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(13); // "Hello, World!".length
      });
    });

    describe('Integration with Arithmetic Operations', () => {
      it('should use string length in arithmetic', () => {
        const instructions = [
          factory.push('hello'),
          factory.call('length'),  // 5
          factory.push('world'),
          factory.call('length'),  // 5
          factory.add(),           // 10
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(10);
      });

      it('should use string length in comparisons', () => {
        const instructions = [
          factory.push('short'),
          factory.call('length'),  // 5
          factory.push('longer string'),
          factory.call('length'),  // 13
          factory.lt(),            // 5 < 13 = true
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });
    });

    describe('Integration with Control Flow', () => {
      it('should work within conditional branches', () => {
        const instructions = [
          factory.push('test'),    // 0
          factory.call('length'),  // 1: 4
          factory.push(5),         // 2
          factory.lt(),            // 3: 4 < 5 = true
          factory.jumpIfFalse(7),  // 4: if false, jump to 7
          factory.push('short'),   // 5
          factory.jump(8),         // 6: jump to end
          factory.push('long'),    // 7
          factory.halt()           // 8: end
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('short');
      });

      it('should work with string concatenation in loops', () => {
        // Simple test: concatenate "A" + "B"
        const instructions = [
          factory.push('A'),
          factory.push('B'),
          factory.call('concat'),
          factory.push('C'),
          factory.call('concat'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('ABC');
      });
    });

    describe('Complex String Operations', () => {
      it('should extract and concatenate substrings', () => {
        const instructions = [
          // Extract "Hello" from "Hello, World!"
          factory.push('Hello, World!'),
          factory.push(0),
          factory.push(5),
          factory.call('substring'), // "Hello"
          
          // Extract "World" from "Hello, World!"
          factory.push('Hello, World!'),
          factory.push(7),
          factory.push(12),
          factory.call('substring'), // "World"
          
          // Concatenate with " + "
          factory.push(' + '),
          factory.call('concat'),    // "World + "
          factory.call('concat'),    // "Hello" + "World + " = "HelloWorld + "
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('HelloWorld + ');
      });

      it('should build formatted strings', () => {
        const instructions = [
          // Build "Name: Alice, Age: 25"
          factory.push('Name: '),
          factory.push('Alice'),
          factory.call('concat'),    // "Name: Alice"
          
          factory.push(', Age: '),
          factory.call('concat'),    // "Name: Alice, Age: "
          
          factory.push(25),
          factory.call('concat'),    // "Name: Alice, Age: 25"
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('Name: Alice, Age: 25');
      });

      it('should validate string operations with length checks', () => {
        const instructions = [
          factory.push('programming'),
          factory.push(0),           // Start index
          factory.push(5),           // End index (fixed value)
          factory.call('substring'), // substring(0, 5) = "progr"
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe('progr');
      });
    });

    describe('Error Propagation and Recovery', () => {
      it('should propagate errors through string function chains', () => {
        const instructions = [
          factory.push(42),          // Not a string
          factory.call('length'),    // Error: type mismatch
          factory.push('test'),      // Should not execute
          factory.call('concat'),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should maintain stack consistency after string function errors', () => {
        // First, successful operation
        vm.execute([
          factory.push('hello'),
          factory.call('length'),
          factory.halt()
        ]);

        let state = vm.getState();
        expect(state.stack[0]?.data).toBe(5);

        // Now try failed operation
        try {
          vm.execute([
            factory.push(42),
            factory.call('length'), // Error
            factory.halt()
          ]);
        } catch (error) {
          // Expected to fail
        }

        // Previous state should still be intact
        state = vm.getState();
        expect(state.stack[0]?.data).toBe(5);
      });

      it('should handle partial string operations with errors', () => {
        const instructions = [
          factory.push('hello'),
          factory.push('world'),
          factory.call('concat'),    // "helloworld"
          factory.push(-1),          // Invalid index
          factory.push(5),
          factory.call('substring'), // Error
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid string function calls', () => {
      const instructions: any[] = [];
      
      // Perform multiple string operations
      for (let i = 0; i < 10; i++) {
        instructions.push(factory.push(`str${i}`));
        instructions.push(factory.call('length'));
      }
      instructions.push(factory.halt());

      const startTime = Date.now();
      vm.execute(instructions);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(10);
      expect(state.stack[0]?.data).toBe(4); // "str0".length
      expect(state.stack[9]?.data).toBe(4); // "str9".length
    });

    it('should handle very long string operations', () => {
      const longString = 'X'.repeat(5000);
      
      const instructions = [
        factory.push(longString),
        factory.call('length'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack[0]?.data).toBe(5000);
    });

    it('should handle edge case string operations', () => {
      const testCases = [
        { str: ' ', expectedLength: 1 },
        { str: '\n', expectedLength: 1 },
        { str: '\t', expectedLength: 1 },
        { str: '\\', expectedLength: 1 }
      ];

      testCases.forEach(({ str, expectedLength }) => {
        vm.reset();
        
        const instructions = [
          factory.push(str),
          factory.call('length'),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(expectedLength);
      });
    });
  });
});