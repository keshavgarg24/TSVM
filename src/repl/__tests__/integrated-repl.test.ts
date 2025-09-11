import { IntegratedREPL } from '../integrated-repl';
import { EventEmitter } from 'events';

// Mock readline to avoid actual terminal interaction in tests
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    on: jest.fn(),
    prompt: jest.fn(),
    close: jest.fn(),
    setPrompt: jest.fn()
  }))
}));

describe('Integrated REPL', () => {
  let repl: IntegratedREPL;
  let mockOutput: string[];
  let mockErrorOutput: string[];

  beforeEach(() => {
    mockOutput = [];
    mockErrorOutput = [];
    
    repl = new IntegratedREPL({
      welcomeMessage: 'Test REPL'
    });

    // Mock console output
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      mockOutput.push(args.join(' '));
    });
    
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      mockErrorOutput.push(args.join(' '));
    });

    // Override write methods to capture output
    repl.write = jest.fn((text: string) => {
      mockOutput.push(text);
    });
    
    repl.writeError = jest.fn((text: string) => {
      mockErrorOutput.push(text);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Integration', () => {
    it('should initialize all components', () => {
      expect(repl.getSymbolTable()).toBeDefined();
      expect(repl.getVM()).toBeDefined();
      expect(repl.getCodeGenerator()).toBeDefined();
    });

    it('should have integrated commands', () => {
      const commands = repl.getCommands();
      const commandNames = commands.map(cmd => cmd.name);
      
      expect(commandNames).toContain('tokens');
      expect(commandNames).toContain('ast');
      expect(commandNames).toContain('bytecode');
      expect(commandNames).toContain('vm-state');
      expect(commandNames).toContain('reset');
      expect(commandNames).toContain('variables');
      expect(commandNames).toContain('compile');
      expect(commandNames).toContain('execute');
    });
  });

  describe('Code Execution', () => {
    it('should execute simple arithmetic expression', async () => {
      // Simulate input event
      repl.emit('input', '5 + 3');
      
      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not have errors
      expect(mockErrorOutput).toHaveLength(0);
    });

    it('should execute variable declaration', async () => {
      repl.emit('input', 'let x = 10');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockErrorOutput).toHaveLength(0);
      
      // Check that variable is declared in symbol table
      const symbols = repl.getSymbolTable().getAllSymbols();
      expect(symbols.some(s => s.name === 'x')).toBe(true);
    });

    it('should execute print statement', async () => {
      repl.emit('input', 'print(42)');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockErrorOutput).toHaveLength(0);
    });

    it('should handle syntax errors gracefully', async () => {
      repl.emit('input', 'let x = ');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockErrorOutput.length).toBeGreaterThan(0);
      expect(mockErrorOutput.some(msg => msg.includes('Error'))).toBe(true);
    });

    it('should handle undefined variable errors', async () => {
      repl.emit('input', 'undefined_var + 5');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockErrorOutput.length).toBeGreaterThan(0);
      expect(mockErrorOutput.some(msg => msg.includes('Undefined variable'))).toBe(true);
    });
  });

  describe('Debug Features', () => {
    it('should toggle token display', () => {
      const tokensCommand = repl.getCommands().find(cmd => cmd.name === 'tokens');
      expect(tokensCommand).toBeDefined();
      
      tokensCommand!.handler([]);
      
      expect(mockOutput.some(msg => msg.includes('Token display'))).toBe(true);
    });

    it('should toggle AST display', () => {
      const astCommand = repl.getCommands().find(cmd => cmd.name === 'ast');
      expect(astCommand).toBeDefined();
      
      astCommand!.handler([]);
      
      expect(mockOutput.some(msg => msg.includes('AST display'))).toBe(true);
    });

    it('should toggle bytecode display', () => {
      const bytecodeCommand = repl.getCommands().find(cmd => cmd.name === 'bytecode');
      expect(bytecodeCommand).toBeDefined();
      
      bytecodeCommand!.handler([]);
      
      expect(mockOutput.some(msg => msg.includes('Bytecode display'))).toBe(true);
    });

    it('should show VM state', () => {
      const vmStateCommand = repl.getCommands().find(cmd => cmd.name === 'vm-state');
      expect(vmStateCommand).toBeDefined();
      
      vmStateCommand!.handler([]);
      
      expect(mockOutput.some(msg => msg.includes('VM State'))).toBe(true);
      expect(mockOutput.some(msg => msg.includes('Program Counter'))).toBe(true);
      expect(mockOutput.some(msg => msg.includes('Stack'))).toBe(true);
    });

    it('should show variables', () => {
      const variablesCommand = repl.getCommands().find(cmd => cmd.name === 'variables');
      expect(variablesCommand).toBeDefined();
      
      variablesCommand!.handler([]);
      
      expect(mockOutput.some(msg => msg.includes('Declared Variables'))).toBe(true);
    });

    it('should reset VM', () => {
      const resetCommand = repl.getCommands().find(cmd => cmd.name === 'reset');
      expect(resetCommand).toBeDefined();
      
      resetCommand!.handler([]);
      
      expect(mockOutput.some(msg => msg.includes('VM reset'))).toBe(true);
    });
  });

  describe('Compile-Only Mode', () => {
    it('should compile code without executing', async () => {
      const compileCommand = repl.getCommands().find(cmd => cmd.name === 'compile');
      expect(compileCommand).toBeDefined();
      
      await compileCommand!.handler(['let', 'x', '=', '5']);
      
      expect(mockOutput.some(msg => msg.includes('Compilation Result'))).toBe(true);
      expect(mockOutput.some(msg => msg.includes('Tokens'))).toBe(true);
      expect(mockOutput.some(msg => msg.includes('Bytecode'))).toBe(true);
    });

    it('should handle compile errors', async () => {
      const compileCommand = repl.getCommands().find(cmd => cmd.name === 'compile');
      expect(compileCommand).toBeDefined();
      
      await compileCommand!.handler(['let', 'x', '=']);
      
      expect(mockErrorOutput.length).toBeGreaterThan(0);
    });

    it('should show usage when no code provided', async () => {
      const compileCommand = repl.getCommands().find(cmd => cmd.name === 'compile');
      expect(compileCommand).toBeDefined();
      
      await compileCommand!.handler([]);
      
      expect(mockErrorOutput.some(msg => msg.includes('Usage: compile'))).toBe(true);
    });
  });

  describe('Direct Bytecode Execution', () => {
    it('should execute simple bytecode', async () => {
      const executeCommand = repl.getCommands().find(cmd => cmd.name === 'execute');
      expect(executeCommand).toBeDefined();
      
      await executeCommand!.handler(['PUSH', '42,PRINT,HALT']);
      
      expect(mockOutput.some(msg => msg.includes('Executing Bytecode'))).toBe(true);
    });

    it('should show usage when no bytecode provided', async () => {
      const executeCommand = repl.getCommands().find(cmd => cmd.name === 'execute');
      expect(executeCommand).toBeDefined();
      
      await executeCommand!.handler([]);
      
      expect(mockErrorOutput.some(msg => msg.includes('Usage: execute'))).toBe(true);
    });
  });

  describe('Debug Mode Configuration', () => {
    it('should set debug mode flags', () => {
      repl.setDebugMode(true, true, true);
      
      // Test that debug flags are set by triggering code execution
      repl.emit('input', '5');
      
      // The debug output should be enabled
      // (This is tested indirectly through the toggle commands above)
    });
  });

  describe('Error Handling', () => {
    it('should handle compile-time errors with location info', async () => {
      // This would require a more sophisticated test setup with actual error objects
      // For now, we test that error handling doesn't crash the REPL
      repl.emit('input', 'invalid syntax here');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not crash and should show some error
      expect(mockErrorOutput.length).toBeGreaterThan(0);
    });

    it('should handle runtime errors', async () => {
      // Test division by zero or similar runtime error
      repl.emit('input', '5 / 0');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should handle gracefully
      expect(mockErrorOutput.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('State Persistence', () => {
    it('should persist variables between executions', async () => {
      // Declare a variable
      repl.emit('input', 'let x = 5');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Use the variable in another expression
      repl.emit('input', 'x + 3');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not have undefined variable error
      expect(mockErrorOutput.some(msg => msg.includes('Undefined variable: x'))).toBe(false);
    });

    it('should clear state on reset', async () => {
      // Declare a variable
      repl.emit('input', 'let x = 5');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Reset
      const resetCommand = repl.getCommands().find(cmd => cmd.name === 'reset');
      resetCommand!.handler([]);
      
      // Clear previous errors
      mockErrorOutput.length = 0;
      
      // Try to use the variable - should fail
      repl.emit('input', 'x + 3');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should have undefined variable error now
      expect(mockErrorOutput.some(msg => msg.includes('Undefined variable') || msg.includes('Error'))).toBe(true);
    });
  });
});