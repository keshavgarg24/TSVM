import { TypeScriptVMREPL, TypeScriptVMREPLOptions } from '../typescript-vm-repl';
import { RuntimeError, CompileTimeError } from '../../utils/errors';

// Mock readline to avoid actual terminal interaction in tests
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    on: jest.fn(),
    prompt: jest.fn(),
    close: jest.fn(),
    setPrompt: jest.fn()
  }))
}));

describe('TypeScript VM REPL Integration', () => {
  let repl: TypeScriptVMREPL;
  let mockReadline: any;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get the mocked readline interface
    const readline = require('readline');
    mockReadline = {
      on: jest.fn(),
      prompt: jest.fn(),
      close: jest.fn(),
      setPrompt: jest.fn()
    };
    readline.createInterface.mockReturnValue(mockReadline);
    
    // Mock console methods to capture output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'clear').mockImplementation();
  });

  afterEach(() => {
    if (repl && repl.isRunning()) {
      repl.stop();
    }
    jest.restoreAllMocks();
  });

  describe('REPL Initialization and Setup', () => {
    it('should create TypeScript VM REPL with default options', () => {
      repl = new TypeScriptVMREPL();
      
      expect(repl).toBeInstanceOf(TypeScriptVMREPL);
      expect(repl.isRunning()).toBe(false);
      expect(repl.isPersistentState()).toBe(true);
    });

    it('should create TypeScript VM REPL with custom options', () => {
      const options: TypeScriptVMREPLOptions = {
        prompt: 'ts> ',
        persistState: false,
        showBytecode: true,
        showAST: true
      };
      
      repl = new TypeScriptVMREPL(options);
      
      expect(repl.getPrompt()).toBe('ts> ');
      expect(repl.isPersistentState()).toBe(false);
    });

    it('should register VM-specific commands', () => {
      repl = new TypeScriptVMREPL();
      
      const commands = repl.getCommands();
      const commandNames = commands.map(cmd => cmd.name);
      
      expect(commandNames).toContain('reset');
      expect(commandNames).toContain('vars');
      expect(commandNames).toContain('bytecode');
      expect(commandNames).toContain('ast');
      expect(commandNames).toContain('state');
    });

    it('should setup event handlers for code execution', () => {
      repl = new TypeScriptVMREPL();
      
      // Check that input event handler is set up
      expect(repl.listenerCount('input')).toBeGreaterThan(0);
      expect(repl.listenerCount('error')).toBeGreaterThan(0);
    });
  });

  describe('Code Compilation and Execution', () => {
    beforeEach(() => {
      repl = new TypeScriptVMREPL();
    });

    it('should execute simple arithmetic expressions', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('5 + 3');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> 8');
    });

    it('should execute variable declarations and assignments', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 42');
      
      const state = repl.getVMState();
      expect(state.variables.get('x')?.data).toBe(42);
    });

    it('should execute function calls', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('print("Hello, REPL!")');
      
      expect(consoleSpy).toHaveBeenCalledWith('Hello, REPL!');
    });

    it('should execute complex expressions', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let a = 10');
      await executeCode('let b = 5');
      await executeCode('a * b + 2');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> 52');
    });

    it('should handle string operations', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let str = "hello"');
      await executeCode('length(str)');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> 5');
    });

    it('should handle mathematical functions', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('abs(-42)');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> 42');
    });

    it('should handle type conversions', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('toString(123)');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> "123"');
    });
  });

  describe('State Persistence', () => {
    it('should persist variables between executions by default', async () => {
      repl = new TypeScriptVMREPL({ persistState: true });
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 10');
      await executeCode('let y = 20');
      await executeCode('x + y');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> 30');
      
      const state = repl.getVMState();
      expect(state.variables.get('x')?.data).toBe(10);
      expect(state.variables.get('y')?.data).toBe(20);
    });

    it('should not persist state when disabled', async () => {
      repl = new TypeScriptVMREPL({ persistState: false });
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 10');
      
      let state = repl.getVMState();
      expect(state.variables.get('x')?.data).toBe(10);
      
      await executeCode('let y = 20');
      
      state = repl.getVMState();
      expect(state.variables.has('x')).toBe(false); // Should be cleared
      expect(state.variables.get('y')?.data).toBe(20);
    });

    it('should allow toggling state persistence', () => {
      repl = new TypeScriptVMREPL({ persistState: true });
      
      expect(repl.isPersistentState()).toBe(true);
      
      repl.setPersistentState(false);
      expect(repl.isPersistentState()).toBe(false);
      
      expect(consoleSpy).toHaveBeenCalledWith('State persistence: OFF');
    });
  });

  describe('VM-Specific Commands', () => {
    beforeEach(() => {
      repl = new TypeScriptVMREPL();
    });

    it('should handle reset command', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      // Set up some state
      await executeCode('let x = 42');
      await executeCode('let y = 24');
      
      expect(repl.getVMState().variables.size).toBe(2);
      
      // Reset
      const resetCommand = repl.getCommands().find(cmd => cmd.name === 'reset');
      await resetCommand!.handler([]);
      
      expect(repl.getVMState().variables.size).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('VM state reset. All variables cleared.');
    });

    it('should handle vars command with variables', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 42');
      await executeCode('let name = "Alice"');
      
      const varsCommand = repl.getCommands().find(cmd => cmd.name === 'vars');
      await varsCommand!.handler([]);
      
      expect(consoleSpy).toHaveBeenCalledWith('\nCurrent variables:');
      expect(consoleSpy).toHaveBeenCalledWith('  x = 42');
      expect(consoleSpy).toHaveBeenCalledWith('  name = "Alice"');
    });

    it('should handle vars command with no variables', async () => {
      const varsCommand = repl.getCommands().find(cmd => cmd.name === 'vars');
      await varsCommand!.handler([]);
      
      expect(consoleSpy).toHaveBeenCalledWith('No variables defined.');
    });

    it('should handle bytecode toggle command', async () => {
      const bytecodeCommand = repl.getCommands().find(cmd => cmd.name === 'bytecode');
      
      // Toggle on
      await bytecodeCommand!.handler(['on']);
      expect(consoleSpy).toHaveBeenCalledWith('Bytecode display: ON');
      
      // Toggle off
      await bytecodeCommand!.handler(['off']);
      expect(consoleSpy).toHaveBeenCalledWith('Bytecode display: OFF');
      
      // Toggle without args
      await bytecodeCommand!.handler([]);
      expect(consoleSpy).toHaveBeenCalledWith('Bytecode display: ON');
    });

    it('should handle AST toggle command', async () => {
      const astCommand = repl.getCommands().find(cmd => cmd.name === 'ast');
      
      await astCommand!.handler(['on']);
      expect(consoleSpy).toHaveBeenCalledWith('AST display: ON');
      
      await astCommand!.handler(['off']);
      expect(consoleSpy).toHaveBeenCalledWith('AST display: OFF');
    });

    it('should handle state command', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 42');
      await executeCode('5 + 3'); // Leaves result on stack
      
      const stateCommand = repl.getCommands().find(cmd => cmd.name === 'state');
      await stateCommand!.handler([]);
      
      expect(consoleSpy).toHaveBeenCalledWith('\nVM State:');
      expect(consoleSpy).toHaveBeenCalledWith('Variables: 1');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stack size:'));
    });
  });

  describe('Error Handling and Display', () => {
    beforeEach(() => {
      repl = new TypeScriptVMREPL();
    });

    it('should handle syntax errors gracefully', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = '); // Incomplete syntax
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Parse Error'));
    });

    it('should handle runtime errors gracefully', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('10 / 0'); // Division by zero
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Runtime Error:'));
    });

    it('should handle undefined variable errors', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('undefinedVar + 5');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    });

    it('should handle type mismatch errors', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('"hello" + 5'); // This might work due to type conversion
      // Let's try a more definitive type error
      await executeCode('length(42)'); // length expects string
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    });

    it('should display stack traces for runtime errors', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      // Create a runtime error with stack trace
      await executeCode('sqrt(-1)'); // Negative sqrt should error
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Runtime Error:'));
    });
  });

  describe('Interactive Program Execution', () => {
    beforeEach(() => {
      repl = new TypeScriptVMREPL();
    });

    it('should execute multi-line programs interactively', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      // Simulate interactive session
      await executeCode('let counter = 0');
      await executeCode('counter = counter + 1');
      await executeCode('counter = counter + 1');
      await executeCode('counter');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> 2');
    });

    it('should handle control flow interactively', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 10');
      await executeCode('if (x > 5) { print("big"); } else { print("small"); }');
      
      expect(consoleSpy).toHaveBeenCalledWith('big');
    });

    it('should handle function calls with variables', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let message = "Hello"');
      await executeCode('let name = "World"');
      await executeCode('concat(message, concat(" ", name))');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> "Hello World"');
    });

    it('should maintain state across complex operations', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      // Build up state over multiple interactions
      await executeCode('let numbers = 0');
      await executeCode('numbers = numbers + 10');
      await executeCode('numbers = numbers * 2');
      await executeCode('let result = sqrt(numbers)');
      await executeCode('result');
      
      expect(consoleSpy).toHaveBeenCalledWith('=> ' + Math.sqrt(20));
    });
  });

  describe('Debug and Analysis Features', () => {
    it('should show bytecode when enabled', async () => {
      repl = new TypeScriptVMREPL({ showBytecode: true });
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('5 + 3');
      
      expect(consoleSpy).toHaveBeenCalledWith('--- Bytecode ---');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PUSH'));
    });

    it('should show AST when enabled', async () => {
      repl = new TypeScriptVMREPL({ showAST: true });
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 42');
      
      expect(consoleSpy).toHaveBeenCalledWith('--- AST ---');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"type"'));
    });

    it('should show tokens when debug modes are enabled', async () => {
      repl = new TypeScriptVMREPL({ showBytecode: true });
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('let x = 42');
      
      expect(consoleSpy).toHaveBeenCalledWith('--- Tokens ---');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('LET'));
    });
  });

  describe('Value Formatting', () => {
    beforeEach(() => {
      repl = new TypeScriptVMREPL();
    });

    it('should format different value types correctly', () => {
      const formatValue = (repl as any).formatValue.bind(repl);
      
      expect(formatValue({ type: 'number', data: 42 })).toBe('42');
      expect(formatValue({ type: 'string', data: 'hello' })).toBe('"hello"');
      expect(formatValue({ type: 'boolean', data: true })).toBe('true');
      expect(formatValue({ type: 'boolean', data: false })).toBe('false');
      expect(formatValue({ type: 'undefined', data: undefined })).toBe('undefined');
    });

    it('should handle function values', () => {
      const formatValue = (repl as any).formatValue.bind(repl);
      
      const funcValue = { 
        type: 'function', 
        data: { name: 'testFunc' } 
      };
      
      expect(formatValue(funcValue)).toBe('[Function: testFunc]');
    });

    it('should handle unknown value types', () => {
      const formatValue = (repl as any).formatValue.bind(repl);
      
      expect(formatValue('plain string')).toBe('plain string');
      expect(formatValue(123)).toBe('123');
    });
  });

  describe('Integration Edge Cases', () => {
    beforeEach(() => {
      repl = new TypeScriptVMREPL();
    });

    it('should handle empty code input', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('');
      
      // Should not crash or produce errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      await executeCode('   \n  \t  ');
      
      // Should not crash or produce errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle very long expressions', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      // Create a long arithmetic expression
      let expr = '1';
      for (let i = 0; i < 50; i++) {
        expr += ' + 1';
      }
      
      await executeCode(expr);
      
      expect(consoleSpy).toHaveBeenCalledWith('=> 51');
    });

    it('should handle rapid successive executions', async () => {
      const executeCode = (repl as any).executeCode.bind(repl);
      
      // Execute multiple commands rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(executeCode(`let var${i} = ${i}`));
      }
      
      await Promise.all(promises);
      
      const state = repl.getVMState();
      expect(state.variables.size).toBe(10);
    });
  });
});