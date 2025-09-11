import { VirtualMachine } from '../vm';
import { InstructionFactory } from '../../bytecode';
import { OpCode } from '../../types';

describe('VM Variables and Built-ins', () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe('Variable Operations', () => {
    it('should store and load variables', () => {
      const instructions = [
        factory.push(42),
        factory.store('x'),
        factory.load('x'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(42);
      expect(state.variables.get('x')?.data).toBe(42);
    });

    it('should handle multiple variables', () => {
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

    it('should overwrite existing variables', () => {
      const instructions = [
        factory.push(100),
        factory.store('x'),
        factory.push(200),
        factory.store('x'),
        factory.load('x'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(200);
    });

    it('should handle different value types in variables', () => {
      const instructions = [
        factory.push('hello'),
        factory.store('str'),
        factory.push(true),
        factory.store('bool'),
        factory.push(3.14),
        factory.store('num'),
        factory.load('str'),
        factory.load('bool'),
        factory.load('num'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(3);
      expect(state.stack[0]?.type).toBe('string');
      expect(state.stack[0]?.data).toBe('hello');
      expect(state.stack[1]?.type).toBe('boolean');
      expect(state.stack[1]?.data).toBe(true);
      expect(state.stack[2]?.type).toBe('number');
      expect(state.stack[2]?.data).toBe(3.14);
    });

    it('should use variables in arithmetic', () => {
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

    it('should handle variable names with underscores and numbers', () => {
      const instructions = [
        factory.push(42),
        factory.store('var_123'),
        factory.push(24),
        factory.store('_private'),
        factory.load('var_123'),
        factory.load('_private'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(2);
      expect(state.stack[0]?.data).toBe(42);
      expect(state.stack[1]?.data).toBe(24);
    });
  });

  describe('Built-in Functions - Print', () => {
    it('should print numbers', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push(42),
        factory.print(),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledWith('42');
      expect(vm.getState().stack).toHaveLength(0); // print consumes the value
      
      consoleSpy.mockRestore();
    });

    it('should print strings', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push('Hello, World!'),
        factory.print(),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledWith('Hello, World!');
      
      consoleSpy.mockRestore();
    });

    it('should print booleans', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push(true),
        factory.print(),
        factory.push(false),
        factory.print(),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledWith('true');
      expect(consoleSpy).toHaveBeenCalledWith('false');
      
      consoleSpy.mockRestore();
    });

    it('should print multiple values', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push(1),
        factory.print(),
        factory.push(2),
        factory.print(),
        factory.push(3),
        factory.print(),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, '1');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, '2');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, '3');
      
      consoleSpy.mockRestore();
    });

    it('should print variables', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push('stored value'),
        factory.store('message'),
        factory.load('message'),
        factory.print(),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledWith('stored value');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Complex Variable Usage', () => {
    it('should implement counter with variables', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const instructions = [
        factory.push(0),        // 0 - initialize counter
        factory.store('counter'), // 1 - store counter
        factory.load('counter'), // 2 - load counter for comparison
        factory.push(3),        // 3 - limit
        factory.lt(),           // 4 - counter < 3
        factory.jumpIfFalse(13), // 5 - exit if false (jump to halt)
        factory.load('counter'), // 6 - load counter for printing
        factory.print(),        // 7 - print counter
        factory.load('counter'), // 8 - load counter for increment
        factory.push(1),        // 9 - increment value
        factory.add(),          // 10 - add
        factory.store('counter'), // 11 - store updated counter
        factory.jump(2),        // 12 - jump back to condition
        factory.halt()          // 13 - end
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, '0');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, '1');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, '2');
      
      consoleSpy.mockRestore();
    });

    it('should implement variable swapping', () => {
      const instructions = [
        factory.push(10),
        factory.store('a'),
        factory.push(20),
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
      expect(state.stack[0]?.data).toBe(20); // a should now be 20
      expect(state.stack[1]?.data).toBe(10); // b should now be 10
    });

    it('should handle variable scoping (global variables)', () => {
      const instructions = [
        factory.push(100),
        factory.store('global'),
        factory.push(200),
        factory.store('local'),
        factory.load('global'),
        factory.load('local'),
        factory.add(),
        factory.store('result'),
        factory.load('result'),
        factory.halt()
      ];

      vm.execute(instructions);
      const state = vm.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toBe(300);
      expect(state.variables.get('global')?.data).toBe(100);
      expect(state.variables.get('local')?.data).toBe(200);
      expect(state.variables.get('result')?.data).toBe(300);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined variable access', () => {
      const instructions = [
        factory.load('undefined_var'),
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should handle store without value on stack', () => {
      const instructions = [
        factory.store('x'), // No value on stack
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should handle print without value on stack', () => {
      const instructions = [
        factory.print(), // No value on stack
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should handle invalid variable names', () => {
      const instructions = [
        factory.push(42),
        { opcode: OpCode.STORE }, // Missing operand
        factory.halt()
      ];

      expect(() => vm.execute(instructions)).toThrow();
    });

    it('should reset variables between executions', () => {
      // First execution
      vm.execute([
        factory.push(42),
        factory.store('x'),
        factory.halt()
      ]);

      let state = vm.getState();
      expect(state.variables.get('x')?.data).toBe(42);

      // Reset and second execution should fail
      vm.reset();
      
      expect(() => vm.execute([
        factory.load('x'), // Should fail - variable doesn't exist after reset
        factory.halt()
      ])).toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should run a complete program with variables and print', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Program: x = 5; y = 10; result = x * y + 2; print(result);
      const instructions = [
        factory.push(5),
        factory.store('x'),
        factory.push(10),
        factory.store('y'),
        factory.load('x'),
        factory.load('y'),
        factory.mul(),
        factory.push(2),
        factory.add(),
        factory.store('result'),
        factory.load('result'),
        factory.print(),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledWith('52');
      
      const state = vm.getState();
      expect(state.variables.get('x')?.data).toBe(5);
      expect(state.variables.get('y')?.data).toBe(10);
      expect(state.variables.get('result')?.data).toBe(52);
      
      consoleSpy.mockRestore();
    });

    it('should handle conditional variable assignment', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Program: x = 7; if (x > 5) { result = "big"; } else { result = "small"; } print(result);
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
        factory.print(),
        factory.halt()
      ];

      vm.execute(instructions);
      
      expect(consoleSpy).toHaveBeenCalledWith('big');
      expect(vm.getState().variables.get('result')?.data).toBe('big');
      
      consoleSpy.mockRestore();
    });
  });
});