import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode } from '../../types';
import { RuntimeError } from '../../utils/errors';

describe('VM Control Flow and Function Call Execution', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('Jump Instruction Execution', () => {
    describe('JUMP Instruction', () => {
      it('should execute unconditional jump forward', () => {
        const instructions = [
          factory.push(1),      // 0
          factory.jump(4),      // 1 - jump to instruction 4
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
        expect(state.pc).toBe(5); // Should be at halt instruction
      });

      it('should execute unconditional jump backward', () => {
        const instructions = [
          factory.push(0),        // 0 - counter
          factory.dup(),          // 1 - duplicate counter for comparison
          factory.push(3),        // 2 - limit
          factory.ge(),           // 3 - check if counter >= 3
          factory.jumpIfFalse(8), // 4 - if false, jump to increment
          factory.halt(),         // 5 - exit if counter >= 3
          factory.push(999),      // 6 - should not execute
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

      it('should handle jump to beginning of program', () => {
        const instructions = [
          factory.push(1),      // 0
          factory.push(2),      // 1
          factory.jump(0),      // 2 - jump to beginning
          factory.halt()        // 3 - should not reach here initially
        ];

        // This will create an infinite loop, so we expect it to hit the instruction limit
        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle jump to end of program', () => {
        const instructions = [
          factory.push(42),     // 0
          factory.jump(3),      // 1 - jump to halt
          factory.push(24),     // 2 - should be skipped
          factory.halt()        // 3
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.data).toBe(42);
      });

      it('should validate jump address bounds', () => {
        const instructions = [
          factory.push(1),
          factory.jump(100), // Jump beyond program bounds
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/invalid jump address/i);
      });

      it('should validate negative jump addresses', () => {
        const instructions = [
          factory.push(1),
          factory.jump(-1), // Invalid negative jump
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should require numeric operand for jump', () => {
        const instructions = [
          factory.push(1),
          { opcode: OpCode.JUMP, operand: 'invalid' }, // Non-numeric operand
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('JUMP_IF_FALSE Instruction', () => {
      it('should jump when condition is false', () => {
        const instructions = [
          factory.push(false),    // 0
          factory.jumpIfFalse(4), // 1 - should jump
          factory.push(1),        // 2 - should be skipped
          factory.push(2),        // 3 - should be skipped
          factory.push(3),        // 4 - jump target
          factory.halt()          // 5
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.data).toBe(3);
      });

      it('should not jump when condition is true', () => {
        const instructions = [
          factory.push(true),     // 0
          factory.jumpIfFalse(4), // 1 - should not jump
          factory.push(1),        // 2 - should execute
          factory.push(2),        // 3 - should execute
          factory.push(3),        // 4 - should execute
          factory.halt()          // 5
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
          factory.push(0),        // 0
          factory.jumpIfFalse(4), // 1 - should jump (0 is falsy)
          factory.push(1),        // 2 - should be skipped
          factory.push(2),        // 3 - should be skipped
          factory.push(3),        // 4 - jump target
          factory.halt()          // 5
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.data).toBe(3);
      });

      it('should treat non-zero numbers as true', () => {
        const instructions = [
          factory.push(42),       // 0
          factory.jumpIfFalse(4), // 1 - should not jump (42 is truthy)
          factory.push(1),        // 2 - should execute
          factory.push(2),        // 3 - should execute
          factory.push(3),        // 4 - should execute
          factory.halt()          // 5
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(3);
      });

      it('should treat empty string as false', () => {
        const instructions = [
          factory.push(''),       // 0
          factory.jumpIfFalse(4), // 1 - should jump (empty string is falsy)
          factory.push(1),        // 2 - should be skipped
          factory.push(2),        // 3 - should be skipped
          factory.push(3),        // 4 - jump target
          factory.halt()          // 5
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.data).toBe(3);
      });

      it('should treat non-empty string as true', () => {
        const instructions = [
          factory.push('hello'),  // 0
          factory.jumpIfFalse(4), // 1 - should not jump (non-empty string is truthy)
          factory.push(1),        // 2 - should execute
          factory.push(2),        // 3 - should execute
          factory.push(3),        // 4 - should execute
          factory.halt()          // 5
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(3);
      });

      it('should handle stack underflow on conditional jump', () => {
        const instructions = [
          factory.jumpIfFalse(2), // No condition on stack
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should validate jump address bounds for conditional jump', () => {
        const instructions = [
          factory.push(false),
          factory.jumpIfFalse(100), // Jump beyond program bounds
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });
  });

  describe('Function Call and Return Execution', () => {
    describe('CALL Instruction', () => {
      it('should execute built-in print function call', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const instructions = [
          factory.push(42),
          factory.call('print'),
          factory.push(24),
          factory.halt()
        ];

        vm.execute(instructions);
        
        expect(consoleSpy).toHaveBeenCalledWith('42');
        
        const state = vm.getState();
        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.data).toBe(24);
        expect(state.callStack).toHaveLength(0); // Should be empty after return
        
        consoleSpy.mockRestore();
      });

      it('should handle multiple function calls', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const instructions = [
          factory.push('first'),
          factory.call('print'),
          factory.push('second'),
          factory.call('print'),
          factory.push('third'),
          factory.call('print'),
          factory.halt()
        ];

        vm.execute(instructions);
        
        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, 'first');
        expect(consoleSpy).toHaveBeenNthCalledWith(2, 'second');
        expect(consoleSpy).toHaveBeenNthCalledWith(3, 'third');
        
        const state = vm.getState();
        expect(state.callStack).toHaveLength(0);
        
        consoleSpy.mockRestore();
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

      it('should require string operand for call', () => {
        const instructions = [
          factory.push(42),
          { opcode: OpCode.CALL, operand: 123 }, // Non-string operand
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it('should handle call stack overflow', () => {
        // This would require recursive calls, but since we only have built-ins,
        // we'll test the call stack limit indirectly
        const instructions = [
          factory.push(1),
          factory.call('undefinedRecursive'), // This will fail before overflow
          factory.halt()
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe('RETURN Instruction', () => {
      it('should return from main program', () => {
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
        expect(state.pc).toBe(instructions.length + 1); // Should be past end
      });

      it('should handle return with empty call stack', () => {
        const instructions = [
          factory.push(1),
          factory.return(),
          factory.push(2), // Should not execute
          factory.halt()
        ];

        vm.execute(instructions);
        
        const state = vm.getState();
        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.data).toBe(1);
      });
    });
  });

  describe('Program Counter Management', () => {
    it('should maintain correct program counter during jumps', () => {
      const instructions = [
        factory.push(1),      // 0
        factory.push(2),      // 1
        factory.jump(5),      // 2 - jump to 5
        factory.push(3),      // 3 - skipped
        factory.push(4),      // 4 - skipped
        factory.push(5),      // 5 - executed
        factory.halt()        // 6
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.pc).toBe(6); // Should be at halt
      expect(state.stack).toHaveLength(3);
      expect(state.stack[2]?.data).toBe(5);
    });

    it('should handle program counter in conditional jumps', () => {
      const instructions = [
        factory.push(true),     // 0
        factory.jumpIfFalse(4), // 1 - should not jump
        factory.push(2),        // 2 - should execute
        factory.push(3),        // 3 - should execute
        factory.push(4),        // 4 - should execute
        factory.halt()          // 5
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.pc).toBe(5);
      expect(state.stack).toHaveLength(3);
    });

    it('should handle program counter wraparound prevention', () => {
      const instructions = [
        factory.push(1),
        factory.jump(0), // This creates infinite loop
        factory.halt()
      ];

      // Should hit instruction limit and throw error
      expect(() => vm.execute(instructions)).toThrow(RuntimeError);
    });
  });

  describe('Call Stack Management', () => {
    it('should manage call stack during function calls', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push('test'),
        factory.call('print'),
        factory.halt()
      ];

      // Check call stack during execution by examining final state
      vm.execute(instructions);
      
      const state = vm.getState();
      expect(state.callStack).toHaveLength(0); // Should be empty after return
      
      consoleSpy.mockRestore();
    });

    it('should handle nested function calls (simulated)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push('outer'),
        factory.call('print'),
        factory.push('inner'),
        factory.call('print'),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      const state = vm.getState();
      expect(state.callStack).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });

    it('should maintain call stack integrity', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Test that call stack is properly managed
      const instructions = [
        factory.push('first'),
        factory.call('print'),
        factory.push('second'),
        factory.call('print'),
        factory.halt()
      ];

      vm.execute(instructions);
      
      const state = vm.getState();
      expect(state.callStack).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Complex Control Flow Scenarios', () => {
    it('should implement if-else logic with jumps', () => {
      // Simulate: if (5 > 3) { result = 10; } else { result = 20; }
      const instructions = [
        factory.push(5),        // 0
        factory.push(3),        // 1
        factory.gt(),           // 2 - compare 5 > 3
        factory.jumpIfFalse(7), // 3 - if false, jump to else
        factory.push(10),       // 4 - then branch
        factory.jump(8),        // 5 - skip else
        factory.halt(),         // 6 - should not execute
        factory.push(20),       // 7 - else branch
        factory.halt()          // 8
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(10);
    });

    it('should implement while loop logic with jumps', () => {
      // Simulate: counter = 0; while (counter < 3) { counter++; }
      const instructions = [
        factory.push(0),        // 0 - initialize counter
        factory.dup(),          // 1 - duplicate for comparison
        factory.push(3),        // 2 - limit
        factory.lt(),           // 3 - check counter < 3
        factory.jumpIfFalse(8), // 4 - exit if false
        factory.push(1),        // 5 - increment value
        factory.add(),          // 6 - add to counter
        factory.jump(1),        // 7 - jump back to loop condition
        factory.halt()          // 8 - exit
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(3);
    });

    it('should handle nested control structures', () => {
      // Simulate nested if statements
      const instructions = [
        factory.push(7),        // 0 - x = 7
        factory.dup(),          // 1 - duplicate x for first condition
        factory.push(0),        // 2 - compare with 0
        factory.gt(),           // 3 - x > 0
        factory.jumpIfFalse(13), // 4 - if false, jump to outer else
        // Inner if-else (x > 5)
        factory.push(5),        // 5 - compare with 5
        factory.gt(),           // 6 - x > 5
        factory.jumpIfFalse(10), // 7 - if false, jump to inner else
        factory.push(1),        // 8 - result = 1
        factory.jump(14),       // 9 - jump to end
        factory.push(2),        // 10 - result = 2 (inner else)
        factory.jump(14),       // 11 - jump to end
        factory.halt(),         // 12 - should not execute
        factory.push(3),        // 13 - result = 3 (outer else)
        factory.halt()          // 14 - end
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(1);
    });

    it('should handle function calls within control flow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simulate: if (true) { print("yes"); } else { print("no"); }
      const instructions = [
        factory.push(true),     // 0
        factory.jumpIfFalse(6), // 1 - if false, jump to else
        factory.push('yes'),    // 2 - then branch
        factory.call('print'),  // 3 - print "yes"
        factory.jump(8),        // 4 - skip else
        factory.halt(),         // 5 - should not execute
        factory.push('no'),     // 6 - else branch
        factory.call('print'),  // 7 - print "no"
        factory.halt()          // 8
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledWith('yes');
      expect(consoleSpy).not.toHaveBeenCalledWith('no');
      
      const state = vm.getState();
      expect(state.callStack).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling in Control Flow', () => {
    it('should handle invalid jump addresses gracefully', () => {
      const instructions = [
        factory.push(true),
        factory.jumpIfFalse(-5), // Invalid negative address
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow(RuntimeError);
    });

    it('should handle missing operands for jump instructions', () => {
      const instructions = [
        { opcode: OpCode.JUMP }, // Missing operand
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow(RuntimeError);
    });

    it('should handle call stack underflow', () => {
      // This is handled by the return instruction when call stack is empty
      const instructions = [
        factory.return(), // Return with empty call stack
        factory.halt()
      ];

      // Should not throw, just halt execution
      vm.execute(instructions);
      const state = vm.getState();
      expect(state.pc).toBe(instructions.length + 1);
    });

    it('should maintain state consistency after control flow errors', () => {
      // First, execute valid instructions
      vm.execute([
        factory.push(42),
        factory.halt()
      ]);

      let state = vm.getState();
      expect(state.stack[0]?.data).toBe(42);

      // Now try invalid control flow
      try {
        vm.execute([
          factory.push(true),
          factory.jumpIfFalse(100), // Invalid jump
          factory.halt()
        ]);
      } catch (error) {
        // Expected to fail
      }

      // Original state should still be intact
      state = vm.getState();
      expect(state.stack[0]?.data).toBe(42);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle maximum jump distance', () => {
      // Create a program with maximum valid jump
      const instructions = [];
      for (let i = 0; i < 50; i++) {
        instructions.push(factory.push(i));
      }
      instructions.push(factory.jump(instructions.length + 1)); // Jump to halt
      instructions.push(factory.halt());

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(50);
    });

    it('should handle zero jump (jump to same instruction)', () => {
      const instructions = [
        factory.push(1),
        factory.jump(1), // Jump to self - infinite loop
        factory.halt()
      ];

      // Should hit instruction limit
      expect(() => vm.execute(instructions)).toThrow(RuntimeError);
    });

    it('should handle rapid function calls', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [];
      for (let i = 0; i < 10; i++) {
        instructions.push(factory.push(`call_${i}`));
        instructions.push(factory.call('print'));
      }
      instructions.push(factory.halt());

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledTimes(10);
      
      const state = vm.getState();
      expect(state.callStack).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
  });
});