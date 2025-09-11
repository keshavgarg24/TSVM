import { REPL, REPLOptions } from './repl';
import { Lexer as LexerImpl } from '../lexer/lexer';
import { Parser as ParserImpl } from '../parser/parser';
import { CodeGenerator } from '../compiler/code-generator';
import { SymbolTable } from '../compiler/symbol-table';
import { VirtualMachine } from '../vm/vm';
import { CompileTimeError, RuntimeError } from '../utils/errors';
import { Instruction, Program } from '../types';

export interface IntegratedREPLOptions extends REPLOptions {
  showBytecode?: boolean;
  showAST?: boolean;
  showTokens?: boolean;
  persistVariables?: boolean;
}

export class IntegratedREPL extends REPL {
  private lexer: LexerImpl;
  private parser: ParserImpl;
  private codeGenerator: CodeGenerator;
  private symbolTable: SymbolTable;
  private vm: VirtualMachine;
  private integratedOptions: IntegratedREPLOptions;

  constructor(options: IntegratedREPLOptions = {}) {
    const replOptions = {
      ...options,
      welcomeMessage: options.welcomeMessage || 'Welcome to TypeScript VM Interactive REPL\nType "help" for commands or enter code to execute.'
    };
    
    super(replOptions);
    
    this.integratedOptions = {
      showBytecode: false,
      showAST: false,
      showTokens: false,
      persistVariables: true,
      ...options
    };

    // Initialize components
    this.lexer = new LexerImpl();
    this.parser = new ParserImpl();
    this.symbolTable = new SymbolTable();
    this.codeGenerator = new CodeGenerator(this.symbolTable);
    this.vm = new VirtualMachine();

    this.setupIntegratedCommands();
    this.setupCodeExecution();
  }

  private setupIntegratedCommands(): void {
    this.registerCommand({
      name: 'tokens',
      description: 'Toggle showing tokens for input',
      handler: () => this.toggleTokens()
    });

    this.registerCommand({
      name: 'ast',
      description: 'Toggle showing AST for input',
      handler: () => this.toggleAST()
    });

    this.registerCommand({
      name: 'bytecode',
      description: 'Toggle showing bytecode for input',
      handler: () => this.toggleBytecode()
    });

    this.registerCommand({
      name: 'vm-state',
      description: 'Show current VM state',
      handler: () => this.showVMState()
    });

    this.registerCommand({
      name: 'reset',
      description: 'Reset VM and clear all variables',
      handler: () => this.resetVM()
    });

    this.registerCommand({
      name: 'variables',
      description: 'Show declared variables',
      handler: () => this.showVariables()
    });

    this.registerCommand({
      name: 'compile',
      description: 'Compile code without executing (usage: compile <code>)',
      handler: (args) => this.compileOnly(args.join(' '))
    });

    this.registerCommand({
      name: 'execute',
      description: 'Execute bytecode directly (usage: execute <bytecode>)',
      handler: (args) => this.executeBytecode(args.join(' '))
    });
  }

  private setupCodeExecution(): void {
    this.on('input', async (code: string) => {
      try {
        await this.executeCode(code);
      } catch (error) {
        this.handleExecutionError(error);
      }
    });
  }

  private async executeCode(code: string): Promise<void> {
    try {
      // Add semicolon if not present for REPL convenience
      const processedCode = code.trim().endsWith(';') ? code : code + ';';
      
      // Step 1: Tokenize
      const tokens = this.lexer.tokenize(processedCode);
      
      if (this.integratedOptions.showTokens) {
        this.write('\n--- Tokens ---');
        tokens.forEach((token, index) => {
          this.write(`${index}: ${token.type} = "${token.value}" (${token.location.line}:${token.location.column})`);
        });
        this.write('');
      }

      // Step 2: Parse
      const ast = this.parser.parse(tokens);
      
      if (this.integratedOptions.showAST) {
        this.write('\n--- AST ---');
        this.write(JSON.stringify(ast, null, 2));
        this.write('');
      }

      // Step 3: Compile
      const bytecode = this.codeGenerator.compile(ast);
      
      if (this.integratedOptions.showBytecode) {
        this.write('\n--- Bytecode ---');
        bytecode.forEach((instruction, index) => {
          const operandStr = instruction.operand !== undefined ? ` ${instruction.operand}` : '';
          this.write(`${index}: ${instruction.opcode}${operandStr}`);
        });
        this.write('');
      }

      // Step 4: Execute
      const output = this.captureVMOutput(() => {
        this.vm.execute(bytecode);
      });

      if (output.length > 0) {
        this.write(output);
      }

    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private captureVMOutput(executeFunction: () => void): string {
    const originalLog = console.log;
    let output = '';

    console.log = (...args: any[]) => {
      output += args.join(' ') + '\n';
    };

    try {
      executeFunction();
    } finally {
      console.log = originalLog;
    }

    return output.trim();
  }

  private handleExecutionError(error: any): void {
    if (error instanceof CompileTimeError) {
      this.writeError(`Compile Error (${error.type}): ${error.message}`);
      if (error.location) {
        this.writeError(`  at line ${error.location.line}, column ${error.location.column}`);
      }
    } else if (error instanceof RuntimeError) {
      this.writeError(`Runtime Error (${error.type}): ${error.message}`);
      if (error.stackTrace && error.stackTrace.length > 0) {
        this.writeError('Stack trace:');
        error.stackTrace.forEach(frame => this.writeError(`  ${frame}`));
      }
    } else {
      this.writeError(`Error: ${error.message || error}`);
    }
  }

  private toggleTokens(): void {
    this.integratedOptions.showTokens = !this.integratedOptions.showTokens;
    this.write(`Token display: ${this.integratedOptions.showTokens ? 'ON' : 'OFF'}`);
  }

  private toggleAST(): void {
    this.integratedOptions.showAST = !this.integratedOptions.showAST;
    this.write(`AST display: ${this.integratedOptions.showAST ? 'ON' : 'OFF'}`);
  }

  private toggleBytecode(): void {
    this.integratedOptions.showBytecode = !this.integratedOptions.showBytecode;
    this.write(`Bytecode display: ${this.integratedOptions.showBytecode ? 'ON' : 'OFF'}`);
  }

  private showVMState(): void {
    const state = this.vm.getState();
    
    this.write('\n--- VM State ---');
    this.write(`Program Counter: ${state.pc}`);
    this.write(`Stack (${state.stack.length} items):`);
    
    if (state.stack.length === 0) {
      this.write('  (empty)');
    } else {
      state.stack.forEach((value: any, index: number) => {
        this.write(`  ${index}: ${JSON.stringify(value)}`);
      });
    }
    
    this.write(`Call Stack (${state.callStack.length} frames):`);
    if (state.callStack.length === 0) {
      this.write('  (empty)');
    } else {
      state.callStack.forEach((frame: any, index: number) => {
        this.write(`  ${index}: ${frame.functionName} (return: ${frame.returnAddress})`);
      });
    }
    
    this.write(`Variables (${state.variables.size} declared):`);
    if (state.variables.size === 0) {
      this.write('  (none)');
    } else {
      for (const [name, value] of state.variables) {
        this.write(`  ${name} = ${JSON.stringify(value)}`);
      }
    }
    this.write('');
  }

  private resetVM(): void {
    this.vm.reset();
    this.symbolTable = new SymbolTable();
    this.codeGenerator = new CodeGenerator(this.symbolTable);
    this.write('VM reset. All variables and state cleared.');
  }

  private showVariables(): void {
    const symbols = this.symbolTable.getAllSymbols();
    
    this.write('\n--- Declared Variables ---');
    if (symbols.length === 0) {
      this.write('  (none)');
    } else {
      symbols.forEach(symbol => {
        this.write(`  ${symbol.name}: ${symbol.type}`);
      });
    }
    this.write('');
  }

  private async compileOnly(code: string): Promise<void> {
    if (!code.trim()) {
      this.writeError('Usage: compile <code>');
      return;
    }

    try {
      // Add semicolon if not present for REPL convenience
      const processedCode = code.trim().endsWith(';') ? code : code + ';';
      const tokens = this.lexer.tokenize(processedCode);
      const ast = this.parser.parse(tokens);
      const bytecode = this.codeGenerator.compile(ast);
      
      this.write('\n--- Compilation Result ---');
      this.write('Tokens:');
      tokens.forEach((token, index) => {
        this.write(`  ${index}: ${token.type} = "${token.value}"`);
      });
      
      this.write('\nBytecode:');
      bytecode.forEach((instruction, index) => {
        const operandStr = instruction.operand !== undefined ? ` ${instruction.operand}` : '';
        this.write(`  ${index}: ${instruction.opcode}${operandStr}`);
      });
      this.write('');
      
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async executeBytecode(bytecodeStr: string): Promise<void> {
    if (!bytecodeStr.trim()) {
      this.writeError('Usage: execute <bytecode>');
      this.writeError('Example: execute PUSH 5,PUSH 3,ADD,PRINT,HALT');
      return;
    }

    try {
      // Parse simple bytecode format: OPCODE operand,OPCODE operand,...
      const instructions: Instruction[] = [];
      const parts = bytecodeStr.split(',');
      
      for (const part of parts) {
        const trimmed = part.trim();
        const [opcode, operand] = trimmed.split(' ');
        
        if (!opcode) continue;
        
        const instruction: Instruction = {
          opcode: opcode as any, // Simple conversion for demo
          operand: operand ? (isNaN(Number(operand)) ? operand : Number(operand)) : 0
        };
        
        instructions.push(instruction);
      }
      
      this.write('\n--- Executing Bytecode ---');
      const output = this.captureVMOutput(() => {
        this.vm.execute(instructions);
      });
      
      if (output.length > 0) {
        this.write(output);
      }
      this.write('');
      
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  // Override start to show additional help
  public start(): void {
    super.start();
    this.write('Additional REPL features:');
    this.write('- Enter code directly to compile and execute');
    this.write('- Use "tokens", "ast", "bytecode" to toggle debug output');
    this.write('- Use "vm-state" to inspect VM state');
    this.write('- Use "variables" to see declared variables');
    this.write('');
  }

  // Utility methods for testing and debugging
  public getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }

  public getVM(): VirtualMachine {
    return this.vm;
  }

  public getCodeGenerator(): CodeGenerator {
    return this.codeGenerator;
  }

  public setDebugMode(tokens: boolean, ast: boolean, bytecode: boolean): void {
    this.integratedOptions.showTokens = tokens;
    this.integratedOptions.showAST = ast;
    this.integratedOptions.showBytecode = bytecode;
  }
}