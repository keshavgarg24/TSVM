import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode, Value } from '../../types';
import { createValue } from '../../utils/values';

describe('VM Stack Operations', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('Basic Stack Operations', () => {
    it('should push and pop values', () => {
      const instructions = [
        factory.push(42),
        factory.push(24),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(2);
      expect(state.stack[0]?.data).toBe(42);
      expect(state.stack[1]?.data).toBe(24);
    });

    it('should pop values from stack', () => {
      const instructions = [
        factory.push(10),
        factory.push(20),
        factory.pop(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(10);
    });

    it('should duplicate top of stack', () => {
      const instructions = [
        factory.push(5),
        factory.dup(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(2);
      expect(state.stack[0]?.data).toBe(5);
      expect(state.stack[1]?.data).toBe(5);
    });

    it('should handle different value types on stack', () => {
      const instructions = [
        factory.push(42),
        factory.push('hello'),
        factory.push(true),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(3);
      expect(state.stack[0]?.type).toBe('number');
      expect(state.stack[0]?.data).toBe(42);
      expect(state.stack[1]?.type).toBe('string');
      expect(state.stack[1]?.data).toBe('hello');
      expect(state.stack[2]?.type).toBe('boolean');
      expect(state.stack[2]?.data).toBe(true);
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add two numbers', () => {
      const instructions = [
        factory.push(10),
        factory.push(5),
        factory.add(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.type).toBe('number');
      expect(state.stack[0]?.data).toBe(15);
    });

    it('should subtract two numbers', () => {
      const instructions = [
        factory.push(10),
        factory.push(3),
        factory.sub(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(7);
    });

    it('should multiply two numbers', () => {
      const instructions = [
        factory.push(6),
        factory.push(7),
        factory.mul(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(42);
    });

    it('should divide two numbers', () => {
      const instructions = [
        factory.push(20),
        factory.push(4),
        factory.div(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(5);
    });

    it('should calculate modulo', () => {
      const instructions = [
        factory.push(17),
        factory.push(5),
        factory.mod(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(2);
    });

    it('should handle floating point arithmetic', () => {
      const instructions = [
        factory.push(3.14),
        factory.push(2.0),
        factory.mul(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBeCloseTo(6.28);
    });

    it('should handle negative numbers', () => {
      const instructions = [
        factory.push(-5),
        factory.push(3),
        factory.add(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(-2);
    });
  });

  describe('Complex Arithmetic Expressions', () => {
    it('should evaluate (5 + 3) * 2', () => {
      const instructions = [
        factory.push(5),
        factory.push(3),
        factory.add(),
        factory.push(2),
        factory.mul(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(16);
    });

    it('should evaluate 10 - 2 * 3', () => {
      const instructions = [
        factory.push(10),
        factory.push(2),
        factory.push(3),
        factory.mul(),
        factory.sub(),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(4);
    });

    it('should handle multiple operations with stack manipulation', () => {
      const instructions = [
        factory.push(8),
        factory.dup(),      // Stack: [8, 8]
        factory.push(2),    // Stack: [8, 8, 2]
        factory.div(),      // Stack: [8, 4]
        factory.add(),      // Stack: [12]
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(12);
    });
  });

  describe('Error Handling', () => {
    it('should handle stack underflow on pop', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const instructions = [
        factory.pop(),
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
      consoleSpy.mockRestore();
    });

    it('should handle stack underflow on arithmetic operations', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const instructions = [
        factory.push(5),
        factory.add(), // Only one operand on stack
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
      consoleSpy.mockRestore();
    });

    it('should handle division by zero', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const instructions = [
        factory.push(10),
        factory.push(0),
        factory.div(),
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
      consoleSpy.mockRestore();
    });

    it('should handle modulo by zero', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const instructions = [
        factory.push(10),
        factory.push(0),
        factory.mod(),
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
      consoleSpy.mockRestore();
    });

    it('should handle type mismatch in arithmetic', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const instructions = [
        factory.push('hello'),
        factory.push(5),
        factory.add(),
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('Stack State Management', () => {
    it('should maintain correct stack pointer', () => {
      const instructions = [
        factory.push(1),
        factory.push(2),
        factory.push(3),
        factory.pop(),
        factory.push(4),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(3);
      expect(state.stack[0]?.data).toBe(1);
      expect(state.stack[1]?.data).toBe(2);
      expect(state.stack[2]?.data).toBe(4);
    });

    it('should handle empty stack correctly', () => {
      const instructions = [
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(0);
    });

    it('should reset stack between executions', () => {
      // First execution
      vm.execute([
        factory.push(42),
        factory.halt()
      ]);

      let state = vm.getState();
      expect(state.stack).toHaveLength(1);

      // Reset and second execution
      vm.reset();
      vm.execute([
        factory.push(24),
        factory.halt()
      ]);

      state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(24);
    });
  });
});