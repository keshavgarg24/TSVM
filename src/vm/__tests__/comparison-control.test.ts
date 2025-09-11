import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode } from '../../types';

describe('VM Comparison and Control Flow', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('Comparison Operations', () => {
    it('should test equality (equal values)', () => {
      const instructions = [
        factory.push(5),
        factory.push(5),
        factory.eq(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.type).toBe('boolean');
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should test equality (unequal values)', () => {
      const instructions = [
        factory.push(5),
        factory.push(3),
        factory.eq(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(false);
    });

    it('should test inequality', () => {
      const instructions = [
        factory.push(5),
        factory.push(3),
        factory.ne(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should test less than', () => {
      const instructions = [
        factory.push(3),
        factory.push(5),
        factory.lt(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should test greater than', () => {
      const instructions = [
        factory.push(7),
        factory.push(3),
        factory.gt(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should test less than or equal', () => {
      const instructions = [
        factory.push(5),
        factory.push(5),
        factory.le(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should test greater than or equal', () => {
      const instructions = [
        factory.push(8),
        factory.push(3),
        factory.ge(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should compare strings', () => {
      const instructions = [
        factory.push('hello'),
        factory.push('hello'),
        factory.eq(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });

    it('should compare different types as unequal', () => {
      const instructions = [
        factory.push(5),
        factory.push('5'),
        factory.eq(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(false);
    });

    it('should compare booleans', () => {
      const instructions = [
        factory.push(true),
        factory.push(false),
        factory.ne(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(true);
    });
  });

  describe('Control Flow - Unconditional Jump', () => {
    it('should jump to specified address', () => {
      const instructions = [
        factory.push(1),      // 0
        factory.jump(4),      // 1
        factory.push(2),      // 2 - should be skipped
        factory.push(3),      // 3 - should be skipped
        factory.push(4),      // 4 - jump target
        factory.halt()        // 5
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(2);
      expect(state.stack[0]?.data).toBe(1);
      expect(state.stack[1]?.data).toBe(4);
    });

    it('should handle backward jumps', () => {
      const instructions = [
        factory.push(0),        // 0 - counter
        factory.dup(),          // 1 - duplicate counter
        factory.push(3),        // 2 - limit
        factory.ge(),           // 3 - check if counter >= 3
        factory.jumpIfFalse(8), // 4 - if false, jump to increment
        factory.halt(),         // 5 - exit if counter >= 3
        factory.push(1),        // 6 - should not execute
        factory.halt(),         // 7 - should not execute
        factory.push(1),        // 8 - increment value
        factory.add(),          // 9 - add to counter
        factory.jump(1),        // 10 - jump back to duplicate
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(3);
    });
  });

  describe('Control Flow - Conditional Jump', () => {
    it('should jump when condition is false', () => {
      const instructions = [
        factory.push(false),
        factory.jumpIfFalse(4),
        factory.push(1),      // Should be skipped
        factory.push(2),      // Should be skipped
        factory.push(3),      // Jump target
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(3);
    });

    it('should not jump when condition is true', () => {
      const instructions = [
        factory.push(true),
        factory.jumpIfFalse(4),
        factory.push(1),      // Should execute
        factory.push(2),      // Should execute
        factory.push(3),      // Should execute
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(3);
      expect(state.stack[0]?.data).toBe(1);
      expect(state.stack[1]?.data).toBe(2);
      expect(state.stack[2]?.data).toBe(3);
    });

    it('should treat zero as false', () => {
      const instructions = [
        factory.push(0),
        factory.jumpIfFalse(4),
        factory.push(1),      // Should be skipped
        factory.push(2),      // Should be skipped
        factory.push(3),      // Jump target
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(3);
    });

    it('should treat non-zero as true', () => {
      const instructions = [
        factory.push(42),
        factory.jumpIfFalse(4),
        factory.push(1),      // Should execute
        factory.push(2),      // Should execute
        factory.push(3),      // Should execute
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(3); // 1 + 2 + 3 (42 is consumed by jumpIfFalse)
    });

    it('should treat empty string as false', () => {
      const instructions = [
        factory.push(''),
        factory.jumpIfFalse(4),
        factory.push(1),      // Should be skipped
        factory.push(2),      // Should be skipped
        factory.push(3),      // Jump target
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(3);
    });
  });

  describe('Complex Control Flow', () => {
    it('should implement if-else logic', () => {
      // Simulate: if (5 > 3) { result = 10; } else { result = 20; }
      const instructions = [
        factory.push(5),      // 0
        factory.push(3),      // 1
        factory.gt(),         // 2 - compare 5 > 3
        factory.jumpIfFalse(7), // 3 - if false, jump to else
        factory.push(10),     // 4 - then branch
        factory.jump(8),      // 5 - skip else
        factory.halt(),       // 6 - should not execute
        factory.push(20),     // 7 - else branch
        factory.halt()        // 8
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(10);
    });

    it('should implement while loop logic', () => {
      // Simulate: counter = 0; while (counter < 3) { counter++; }
      const instructions = [
        factory.push(0),      // 0 - initialize counter
        factory.dup(),        // 1 - duplicate for comparison
        factory.push(3),      // 2 - limit
        factory.lt(),         // 3 - check counter < 3
        factory.jumpIfFalse(8), // 4 - exit if false
        factory.push(1),      // 5 - increment value
        factory.add(),        // 6 - add to counter
        factory.jump(1),      // 7 - jump back to loop condition
        factory.halt()        // 8 - exit
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(3);
    });

    it('should handle nested conditions', () => {
      // Simulate: if (x > 0) { if (x > 5) { result = 1; } else { result = 2; } } else { result = 3; }
      const instructions = [
        factory.push(7),      // 0 - x = 7
        factory.dup(),        // 1 - duplicate x for first condition
        factory.push(0),      // 2 - compare with 0
        factory.gt(),         // 3 - x > 0
        factory.jumpIfFalse(13), // 4 - if false, jump to outer else
        // Inner if-else (x > 5)
        factory.push(5),      // 5 - compare with 5
        factory.gt(),         // 6 - x > 5
        factory.jumpIfFalse(10), // 7 - if false, jump to inner else
        factory.push(1),      // 8 - result = 1
        factory.jump(14),     // 9 - jump to end
        factory.push(2),      // 10 - result = 2 (inner else)
        factory.jump(14),     // 11 - jump to end
        factory.halt(),       // 12 - should not execute
        factory.push(3),      // 13 - result = 3 (outer else)
        factory.halt()        // 14 - end
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle stack underflow in comparisons', () => {
      const instructions = [
        factory.push(5),
        factory.eq(), // Only one operand
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should handle invalid jump addresses', () => {
      const instructions = [
        factory.jump(100), // Jump beyond program
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should handle negative jump addresses', () => {
      const instructions = [
        factory.jump(-1), // Invalid negative jump
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should handle missing operand for jump instructions', () => {
      // This would be caught at instruction creation, but test VM robustness
      const instructions = [
        { opcode: OpCode.JUMP }, // Missing operand
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });
  });
});