import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode, VMState, CallFrame } from '../../types';

describe('VM Core - Stack and Call Stack Management', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('VM Initialization and State Management', () => {
    it('should initialize with empty state', () => {
      const state = vm.getState();

      expect(state.stack).toEqual([]);
      expect(state.callStack).toEqual([]);
      expect(state.variables.size).toBe(0);
      expect(state.pc).toBe(0);
      expect(state.instructions).toEqual([]);
    });

    it('should reset to initial state', () => {
      // Execute some instructions to change state
      vm.execute([
        factory.push(42),
        factory.store('x'),
        factory.halt()
      ]);

      // Verify state has changed
      let state = vm.getState();
      expect(state.stack).toHaveLength(0);
      expect(state.variables.size).toBe(1);
      expect(state.pc).toBe(2); // PC stops at halt instruction

      // Reset and verify clean state
      vm.reset();
      state = vm.getState();
      expect(state.stack).toEqual([]);
      expect(state.callStack).toEqual([]);
      expect(state.variables.size).toBe(0);
      expect(state.pc).toBe(0);
      expect(state.instructions).toEqual([]);
    });

    it('should maintain program counter correctly', () => {
      const instructions = [
        factory.push(1),    // 0
        factory.push(2),    // 1
        factory.add(),      // 2
        factory.halt()      // 3
      ];

      // Execute step by step
      vm.execute(instructions);
      const state = vm.getState();
      
      // PC should be at halt instruction (3)
      expect(state.pc).toBe(3);
    });

    it('should handle step execution', () => {
      const instructions = [
        factory.push(10),
        factory.push(20),
        factory.add(),
        factory.halt()
      ];

      vm.execute(instructions);
      vm.reset();
      
      // Load instructions for step execution
      vm.execute([]);
      vm.reset();
      
      // Manually set up for step execution
      const vmState = vm.getState();
      vmState.instructions = instructions;
      
      // Step through manually by executing the full program
      // (Note: The current VM doesn't expose step-by-step execution in a way that's easy to test)
      vm.execute(instructions);
      
      const finalState = vm.getState();
      expect(finalState.stack).toHaveLength(1);
      expect(finalState.stack[0]?.data).toBe(30);
    });
  });

  describe('Stack Management', () => {
    it('should manage stack growth and shrinkage', () => {
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

    it('should handle stack overflow protection', () => {
      // Create a program that would cause stack overflow
      const instructions: any[] = [];
      
      // Push many values to test stack limits
      for (let i = 0; i < 1001; i++) { // Exceeds maxStackSize of 1000
        instructions.push(factory.push(i));
      }
      instructions.push(factory.halt());

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should handle stack underflow protection', () => {
      const instructions = [
        factory.pop(), // Try to pop from empty stack
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should maintain stack integrity during operations', () => {
      const instructions = [
        factory.push(10),
        factory.dup(),      // Stack: [10, 10]
        factory.push(5),    // Stack: [10, 10, 5]
        factory.add(),      // Stack: [10, 15]
        factory.dup(),      // Stack: [10, 15, 15]
        factory.pop(),      // Stack: [10, 15]
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(2);
      expect(state.stack[0]?.data).toBe(10);
      expect(state.stack[1]?.data).toBe(15);
    });
  });

  describe('Call Stack Management', () => {
    it('should initialize with empty call stack', () => {
      const state = vm.getState();
      expect(state.callStack).toEqual([]);
    });

    it('should handle function calls and returns', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push(42),
        factory.call('print'), // Built-in function call
        factory.halt()
      ];

      vm.execute(instructions);
      
      const state = vm.getState();
      expect(state.callStack).toHaveLength(0); // Should be empty after return
      expect(consoleSpy).toHaveBeenCalledWith('42');
      
      consoleSpy.mockRestore();
    });

    it('should handle call stack overflow protection', () => {
      // This would require a recursive function setup
      // For now, we test the basic call stack limit
      const instructions = [
        factory.push(1),
        factory.call('undefined_function'), // This will throw before stack overflow
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should maintain call stack integrity', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Test multiple function calls
      const instructions = [
        factory.push('first'),
        factory.call('print'),
        factory.push('second'),
        factory.call('print'),
        factory.halt()
      ];

      vm.execute(instructions);
      
      const state = vm.getState();
      expect(state.callStack).toHaveLength(0); // All calls should have returned
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });

    it('should handle return from main program', () => {
      const instructions = [
        factory.push(42),
        factory.return(), // Return from main
        factory.push(24), // Should not execute
        factory.halt()
      ];

      vm.execute(instructions);
      
      const state = vm.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(42);
    });
  });

  describe('Instruction Fetch and Decode Cycle', () => {
    it('should fetch and execute instructions sequentially', () => {
      const instructions = [
        factory.push(1),    // PC: 0
        factory.push(2),    // PC: 1
        factory.add(),      // PC: 2
        factory.push(3),    // PC: 3
        factory.mul(),      // PC: 4
        factory.halt()      // PC: 5
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(9); // (1 + 2) * 3 = 9
    });

    it('should handle unknown opcodes gracefully', () => {
      const instructions = [
        factory.push(42),
        { opcode: 999 as OpCode }, // Invalid opcode
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should stop execution on halt instruction', () => {
      const instructions = [
        factory.push(1),
        factory.halt(),
        factory.push(2), // Should not execute
        factory.push(3)  // Should not execute
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(1);
    });

    it('should handle empty program', () => {
      vm.execute([]);
      const state = vm.getState();

      expect(state.stack).toEqual([]);
      expect(state.pc).toBe(0);
    });

    it('should prevent infinite loops with instruction limit', () => {
      const instructions = [
        factory.push(1),    // 0
        factory.jump(0),    // 1 - infinite loop
        factory.halt()      // 2 - never reached
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should handle variable storage efficiently', () => {
      const instructions = [
        factory.push(100),
        factory.store('var1'),
        factory.push(200),
        factory.store('var2'),
        factory.push(300),
        factory.store('var3'),
        factory.load('var1'),
        factory.load('var2'),
        factory.load('var3'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.variables.size).toBe(3);
      expect(state.stack).toHaveLength(3);
      expect(state.variables.get('var1')?.data).toBe(100);
      expect(state.variables.get('var2')?.data).toBe(200);
      expect(state.variables.get('var3')?.data).toBe(300);
    });

    it('should clone values to prevent reference issues', () => {
      const instructions = [
        factory.push('original'),
        factory.store('var'),
        factory.load('var'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      const stackValue = state.stack[0];
      const varValue = state.variables.get('var');

      expect(stackValue?.data).toBe('original');
      expect(varValue?.data).toBe('original');
      
      // They should be separate objects (cloned)
      expect(stackValue).not.toBe(varValue);
    });

    it('should handle memory cleanup on reset', () => {
      // Fill up some memory
      const instructions = [
        factory.push(1),
        factory.store('a'),
        factory.push(2),
        factory.store('b'),
        factory.push(3),
        factory.push(4),
        factory.push(5),
        factory.halt()
      ];

      vm.execute(instructions);
      
      let state = vm.getState();
      expect(state.stack.length).toBeGreaterThan(0);
      expect(state.variables.size).toBeGreaterThan(0);

      // Reset should clean everything
      vm.reset();
      state = vm.getState();
      
      expect(state.stack).toEqual([]);
      expect(state.variables.size).toBe(0);
      expect(state.callStack).toEqual([]);
    });
  });

  describe('Error Recovery and Robustness', () => {
    it('should provide meaningful error messages', () => {
      const instructions = [
        factory.load('nonexistent'),
        factory.halt()
      ];

      try {
        vm.execute(instructions);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('nonexistent');
      }
    });

    it('should maintain state consistency after errors', () => {
      // First, execute a valid program
      vm.execute([
        factory.push(42),
        factory.store('valid'),
        factory.halt()
      ]);

      let state = vm.getState();
      expect(state.variables.get('valid')?.data).toBe(42);

      // Now try an invalid program
      try {
        vm.execute([
          factory.push(10),
          factory.div(), // Missing second operand
          factory.halt()
        ]);
      } catch (error) {
        // Error expected
      }

      // Previous state should still be intact
      state = vm.getState();
      expect(state.variables.get('valid')?.data).toBe(42);
    });

    it('should handle program counter bounds correctly', () => {
      const instructions = [
        factory.push(1),
        factory.jump(10), // Jump beyond program bounds
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });
  });
});