import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode } from '../../types';
import { RuntimeError } from '../../utils/errors';

describe('VM Arithmetic and Comparison Instruction Execution', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('Arithmetic Instruction Execution', () => {
    describe('ADD Instruction', () => {
      it('should execute ADD with positive integers', () => {
        const instructions = [
          factory.push(15),
          factory.push(25),
          factory.add(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe('number');
        expect(state.stack[0]?.data).toBe(40);
      });

      it('should execute ADD with negative numbers', () => {
        const instructions = [
          factory.push(-10),
          factory.push(5),
          factory.add(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(-5);
      });

      it('should execute ADD with floating point numbers', () => {
        const instructions = [
          factory.push(3.14),
          factory.push(2.86),
          factory.add(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBeCloseTo(6.0);
      });

      it('should handle ADD type checking errors', () => {
        const instructions = [
          factory.push('hello'),
          factory.push(5),
          factory.add(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('SUB Instruction', () => {
      it('should execute SUB with positive result', () => {
        const instructions = [
          factory.push(20),
          factory.push(8),
          factory.sub(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(12);
      });

      it('should execute SUB with negative result', () => {
        const instructions = [
          factory.push(5),
          factory.push(10),
          factory.sub(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(-5);
      });

      it('should execute SUB with floating point precision', () => {
        const instructions = [
          factory.push(10.5),
          factory.push(3.2),
          factory.sub(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBeCloseTo(7.3);
      });

      it('should handle SUB type checking errors', () => {
        const instructions = [
          factory.push(10),
          factory.push('invalid_number'),
          factory.sub(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow();
      });
    });

    describe('MUL Instruction', () => {
      it('should execute MUL with positive numbers', () => {
        const instructions = [
          factory.push(6),
          factory.push(7),
          factory.mul(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(42);
      });

      it('should execute MUL with zero', () => {
        const instructions = [
          factory.push(100),
          factory.push(0),
          factory.mul(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it('should execute MUL with negative numbers', () => {
        const instructions = [
          factory.push(-4),
          factory.push(3),
          factory.mul(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(-12);
      });

      it('should execute MUL with floating point numbers', () => {
        const instructions = [
          factory.push(2.5),
          factory.push(4.0),
          factory.mul(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(10.0);
      });

      it('should handle MUL type checking errors', () => {
        const instructions = [
          factory.push('text'),
          factory.push(5),
          factory.mul(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('DIV Instruction', () => {
      it('should execute DIV with integer division', () => {
        const instructions = [
          factory.push(20),
          factory.push(4),
          factory.div(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(5);
      });

      it('should execute DIV with floating point result', () => {
        const instructions = [
          factory.push(7),
          factory.push(2),
          factory.div(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(3.5);
      });

      it('should execute DIV with negative numbers', () => {
        const instructions = [
          factory.push(-15),
          factory.push(3),
          factory.div(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(-5);
      });

      it('should handle division by zero error', () => {
        const instructions = [
          factory.push(10),
          factory.push(0),
          factory.div(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/division by zero/i);
      });

      it('should handle DIV type checking errors', () => {
        const instructions = [
          factory.push(10),
          factory.push('invalid'),
          factory.div(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('MOD Instruction', () => {
      it('should execute MOD with positive remainder', () => {
        const instructions = [
          factory.push(17),
          factory.push(5),
          factory.mod(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(2);
      });

      it('should execute MOD with zero remainder', () => {
        const instructions = [
          factory.push(20),
          factory.push(4),
          factory.mod(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it('should execute MOD with negative numbers', () => {
        const instructions = [
          factory.push(-17),
          factory.push(5),
          factory.mod(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(-2); // JavaScript modulo behavior
      });

      it('should handle modulo by zero error', () => {
        const instructions = [
          factory.push(10),
          factory.push(0),
          factory.mod(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/division by zero/i);
      });

      it('should handle MOD type checking errors', () => {
        const instructions = [
          factory.push('not_a_number'),
          factory.push(3),
          factory.mod(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow();
      });
    });
  });

  describe('Comparison Instruction Execution', () => {
    describe('EQ Instruction', () => {
      it('should execute EQ with equal numbers', () => {
        const instructions = [
          factory.push(42),
          factory.push(42),
          factory.eq(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe('boolean');
        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute EQ with unequal numbers', () => {
        const instructions = [
          factory.push(10),
          factory.push(20),
          factory.eq(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should execute EQ with equal strings', () => {
        const instructions = [
          factory.push('hello'),
          factory.push('hello'),
          factory.eq(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute EQ with different types', () => {
        const instructions = [
          factory.push(5),
          factory.push('5'),
          factory.eq(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should execute EQ with booleans', () => {
        const instructions = [
          factory.push(true),
          factory.push(true),
          factory.eq(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });
    });

    describe('NE Instruction', () => {
      it('should execute NE with unequal numbers', () => {
        const instructions = [
          factory.push(10),
          factory.push(20),
          factory.ne(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute NE with equal values', () => {
        const instructions = [
          factory.push('test'),
          factory.push('test'),
          factory.ne(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should execute NE with different types', () => {
        const instructions = [
          factory.push(0),
          factory.push(false),
          factory.ne(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });
    });

    describe('LT Instruction', () => {
      it('should execute LT with true result', () => {
        const instructions = [
          factory.push(5),
          factory.push(10),
          factory.lt(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute LT with false result', () => {
        const instructions = [
          factory.push(15),
          factory.push(10),
          factory.lt(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should execute LT with equal values', () => {
        const instructions = [
          factory.push(7),
          factory.push(7),
          factory.lt(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should execute LT with floating point numbers', () => {
        const instructions = [
          factory.push(3.14),
          factory.push(3.15),
          factory.lt(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should handle LT type checking errors', () => {
        const instructions = [
          factory.push('text'),
          factory.push(5),
          factory.lt(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('GT Instruction', () => {
      it('should execute GT with true result', () => {
        const instructions = [
          factory.push(20),
          factory.push(15),
          factory.gt(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute GT with false result', () => {
        const instructions = [
          factory.push(5),
          factory.push(10),
          factory.gt(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should execute GT with negative numbers', () => {
        const instructions = [
          factory.push(-5),
          factory.push(-10),
          factory.gt(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should handle GT type checking errors', () => {
        const instructions = [
          factory.push(10),
          factory.push('not_a_number'),
          factory.gt(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow();
      });
    });

    describe('LE Instruction', () => {
      it('should execute LE with less than result', () => {
        const instructions = [
          factory.push(3),
          factory.push(8),
          factory.le(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute LE with equal result', () => {
        const instructions = [
          factory.push(12),
          factory.push(12),
          factory.le(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute LE with greater than result', () => {
        const instructions = [
          factory.push(25),
          factory.push(20),
          factory.le(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should handle LE type checking errors', () => {
        const instructions = [
          factory.push('invalid'),
          factory.push(5),
          factory.le(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('GE Instruction', () => {
      it('should execute GE with greater than result', () => {
        const instructions = [
          factory.push(30),
          factory.push(25),
          factory.ge(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute GE with equal result', () => {
        const instructions = [
          factory.push(15),
          factory.push(15),
          factory.ge(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });

      it('should execute GE with less than result', () => {
        const instructions = [
          factory.push(8),
          factory.push(12),
          factory.ge(),
          factory.halt()
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(false);
      });

      it('should handle GE type checking errors', () => {
        const instructions = [
          factory.push('invalid'),
          factory.push(10),
          factory.ge(),
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow();
      });
    });
  });

  describe('Complex Arithmetic and Comparison Execution', () => {
    it('should execute complex arithmetic expression: (10 + 5) * 2 - 3', () => {
      const instructions = [
        factory.push(10),
        factory.push(5),
        factory.add(),      // Stack: [15]
        factory.push(2),
        factory.mul(),      // Stack: [30]
        factory.push(3),
        factory.sub(),      // Stack: [27]
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(27);
    });

    it('should execute comparison chain: 5 < 10 AND 10 <= 10', () => {
      const instructions = [
        factory.push(5),
        factory.push(10),
        factory.lt(),       // Stack: [true]
        factory.push(10),
        factory.push(10),
        factory.le(),       // Stack: [true, true]
        // Simulate AND operation (both should be true)
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(2);
      expect(state.stack[0]?.data).toBe(true);
      expect(state.stack[1]?.data).toBe(true);
    });

    it('should execute mixed arithmetic and comparison: (8 / 2) > 3', () => {
      const instructions = [
        factory.push(8),
        factory.push(2),
        factory.div(),      // Stack: [4]
        factory.push(3),
        factory.gt(),       // Stack: [true]
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should handle modulo in complex expression: 17 % 5 == 2', () => {
      const instructions = [
        factory.push(17),
        factory.push(5),
        factory.mod(),      // Stack: [2]
        factory.push(2),
        factory.eq(),       // Stack: [true]
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });
  });

  describe('Error Handling During Execution', () => {
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
        factory.lt(), // Missing second operand
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow(RuntimeError);
    });

    it('should provide meaningful error messages for type mismatches', () => {
      const instructions = [
        factory.push('hello'),
        factory.push(42),
        factory.add(),
        factory.halt()
      ];

      try {
        vm.execute(instructions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(RuntimeError);
        expect(error.message).toContain('string');
        expect(error.message).toContain('number');
      }
    });

    it('should handle division by zero with proper error message', () => {
      const instructions = [
        factory.push(100),
        factory.push(0),
        factory.div(),
        factory.halt()
      ];

      try {
        vm.execute(instructions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(RuntimeError);
        expect(error.type).toBe('division_by_zero');
      }
    });

    it('should maintain stack integrity after arithmetic errors', () => {
      // First, put some values on the stack
      vm.execute([
        factory.push(42),
        factory.push(24),
        factory.halt()
      ]);

      let state = vm.getState();
      expect(state.stack).toHaveLength(2);

      // Now try an operation that will fail
      try {
        vm.execute([
          factory.push('invalid'),
          factory.push(5),
          factory.add(),
          factory.halt()
        ]);
      } catch (error) {
        // Expected to fail
      }

      // Original stack should still be intact
      state = vm.getState();
      expect(state.stack[0]?.data).toBe(42);
      expect(state.stack[1]?.data).toBe(24);
    });

    it('should handle comparison type errors gracefully', () => {
      const instructions = [
        factory.push('text'),
        factory.push(100),
        factory.lt(),
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow(RuntimeError);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle very large numbers in arithmetic', () => {
      const instructions = [
        factory.push(Number.MAX_SAFE_INTEGER),
        factory.push(1),
        factory.add(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack[0]?.data).toBe(Number.MAX_SAFE_INTEGER + 1);
    });

    it('should handle very small numbers in arithmetic', () => {
      const instructions = [
        factory.push(Number.MIN_SAFE_INTEGER),
        factory.push(-1),
        factory.add(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack[0]?.data).toBe(Number.MIN_SAFE_INTEGER - 1);
    });

    it('should handle floating point precision in comparisons', () => {
      const instructions = [
        factory.push(0.1 + 0.2),
        factory.push(0.3),
        factory.eq(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      // Due to floating point precision, this should be false
      expect(state.stack[0]?.data).toBe(false);
    });

    it('should handle zero in various operations', () => {
      const instructions = [
        factory.push(0),
        factory.push(0),
        factory.add(),      // 0 + 0 = 0
        factory.push(0),
        factory.eq(),       // 0 == 0 = true
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack[0]?.data).toBe(true);
    });
  });
});