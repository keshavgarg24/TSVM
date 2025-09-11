import { REPL, REPLOptions } from './repl';
import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { CodeGenerator } from '../compiler';
import { VirtualMachine } from '../vm';
import { SymbolTable } from '../compiler/symbol-table';
import { InstructionFactory } from '../bytecode';
import { RuntimeError, CompileTimeError } from '../utils/errors';
import { OpCode } from '../types';

export interface TypeScriptVMREPLOptions extends REPLOptions {
  persistState?: boolean;
  showBytecode?: boolean;
  showAST?: boolean;
}

export class TypeScriptVMREPL extends REPL {
  private lexer: Lexer;
  private parser: Parser;
  private codeGenerator: CodeGenerator;
  private vm: VirtualMachine;
  private symbolTable: SymbolTable;
  private instructionFactory: InstructionFactory;
  private vmOptions: Required<TypeScriptVMREPLOptions>;

  constructor(options: TypeScriptVMREPLOptions = {}) {
    const replOptions = {
      ...options,
      welcomeMessage: options.welcomeMessage || 'Welcome to TypeScript VM REPL\nType code to execute, or "help" for commands.'
    };

    super(replOptions);

    this.vmOptions = {
      prompt: replOptions.prompt || '> ',
      historySize: replOptions.historySize || 100,
      welcomeMessage: replOptions.welcomeMessage,
      exitCommands: replOptions.exitCommands || ['exit', 'quit', '.exit'],
      persistState: options.persistState ?? true,
      showBytecode: options.showBytecode ?? false,
      showAST: options.showAST ?? false
    };

    // Initialize components
    this.lexer = new Lexer();
    this.parser = new Parser();
    this.symbolTable = new SymbolTable();
    this.codeGenerator = new CodeGenerator(this.symbolTable);
    this.vm = new VirtualMachine();
    this.instructionFactory = new InstructionFactory();

    this.setupVMREPLCommands();
    this.setupEventHandlers();
  }

  private setupVMREPLCommands(): void {
    this.registerCommand({
      name: 'reset',
      description: 'Reset VM state and clear all variables',
      handler: () => this.resetVMState()
    });

    this.registerCommand({
      name: 'vars',
      description: 'Show current variables',
      handler: () => this.showVariables()
    });

    this.registerCommand({
      name: 'bytecode',
      description: 'Toggle bytecode display on/off',
      handler: (args) => this.toggleBytecode(args)
    });

    this.registerCommand({
      name: 'ast',
      description: 'Toggle AST display on/off',
      handler: (args) => this.toggleAST(args)
    });

    this.registerCommand({
      name: 'state',
      description: 'Show VM state (stack, variables, etc.)',
      handler: () => this.showVMState()
    });
  }

  private setupEventHandlers(): void {
    this.on('input', async (input: string, args: string[]) => {
      await this.executeCode(input);
    });

    this.on('error', (error: Error) => {
      this.displayError(error);
    });
  }

  private async executeCode(code: string): Promise<void> {
    try {
      // Step 1: Lexical Analysis
      const tokens = this.lexer.tokenize(code);
      
      if (this.vmOptions.showAST || this.vmOptions.showBytecode) {
        this.write(`--- Tokens ---`);
        this.write(tokens.map(t => `${t.type}: ${t.value}`).join(', '));
      }

      // Step 2: Parsing
      const ast = this.parser.parse(tokens);
      
      if (this.vmOptions.showAST) {
        this.write(`--- AST ---`);
        this.write(JSON.stringify(ast, null, 2));
      }

      // Step 3: Code Generation
      const bytecode = this.codeGenerator.compile(ast);
      
      if (this.vmOptions.showBytecode) {
        this.write(`--- Bytecode ---`);
        bytecode.forEach((instruction, index) => {
          const opcodeName = OpCode[instruction.opcode] || instruction.opcode;
          this.write(`${index.toString().padStart(3)}: ${opcodeName} ${instruction.operand || ''}`);
        });
      }

      // Step 4: Execution
      if (!this.vmOptions.persistState) {
        this.vm.reset();
      }

      this.vm.execute(bytecode);

      // Show result if there's something on the stack
      const state = this.vm.getState();
      if (state.stack.length > 0) {
        const result = state.stack[state.stack.length - 1];
        if (result) {
          this.write(`=> ${this.formatValue(result)}`);
        }
      }

    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private handleExecutionError(error: any): void {
    if (error instanceof CompileTimeError) {
      this.writeError(`Compile Error: ${error.message}`);
      if (error.location) {
        this.writeError(`  at line ${error.location.line}, column ${error.location.column}`);
      }
    } else if (error instanceof RuntimeError) {
      this.writeError(`Runtime Error: ${error.message}`);
      if (error.stackTrace && error.stackTrace.length > 0) {
        this.writeError(`Stack trace:`);
        error.stackTrace.forEach(trace => {
          this.writeError(`  ${trace}`);
        });
      }
    } else if (error instanceof Error) {
      this.writeError(`Error: ${error.message}`);
    } else {
      this.writeError(`Unknown error: ${error}`);
    }
  }

  private formatValue(value: any): string {
    if (value && typeof value === 'object' && 'type' in value && 'data' in value) {
      switch (value.type) {
        case 'string':
          return `"${value.data}"`;
        case 'number':
          return String(value.data);
        case 'boolean':
          return String(value.data);
        case 'function':
          return `[Function: ${value.data?.name || 'anonymous'}]`;
        case 'undefined':
          return 'undefined';
        default:
          return String(value.data);
      }
    }
    return String(value);
  }

  private resetVMState(): void {
    this.vm.reset();
    this.symbolTable = new SymbolTable();
    this.codeGenerator = new CodeGenerator(this.symbolTable);
    this.write('VM state reset. All variables cleared.');
  }

  private showVariables(): void {
    const state = this.vm.getState();
    
    if (state.variables.size === 0) {
      this.write('No variables defined.');
      return;
    }

    this.write('\nCurrent variables:');
    this.write('==================');
    
    for (const [name, value] of Array.from(state.variables.entries())) {
      this.write(`  ${name} = ${this.formatValue(value)}`);
    }
    this.write('');
  }

  private toggleBytecode(args: string[]): void {
    if (args.length > 0 && args[0]) {
      const setting = args[0].toLowerCase();
      if (setting === 'on' || setting === 'true') {
        this.vmOptions.showBytecode = true;
      } else if (setting === 'off' || setting === 'false') {
        this.vmOptions.showBytecode = false;
      } else {
        this.writeError('Usage: bytecode [on|off]');
        return;
      }
    } else {
      this.vmOptions.showBytecode = !this.vmOptions.showBytecode;
    }
    
    this.write(`Bytecode display: ${this.vmOptions.showBytecode ? 'ON' : 'OFF'}`);
  }

  private toggleAST(args: string[]): void {
    if (args.length > 0 && args[0]) {
      const setting = args[0].toLowerCase();
      if (setting === 'on' || setting === 'true') {
        this.vmOptions.showAST = true;
      } else if (setting === 'off' || setting === 'false') {
        this.vmOptions.showAST = false;
      } else {
        this.writeError('Usage: ast [on|off]');
        return;
      }
    } else {
      this.vmOptions.showAST = !this.vmOptions.showAST;
    }
    
    this.write(`AST display: ${this.vmOptions.showAST ? 'ON' : 'OFF'}`);
  }

  private showVMState(): void {
    const state = this.vm.getState();
    
    this.write('\nVM State:');
    this.write('=========');
    this.write(`Stack size: ${state.stack.length}`);
    this.write(`Call stack size: ${state.callStack.length}`);
    this.write(`Variables: ${state.variables.size}`);
    this.write(`Program counter: ${state.pc}`);
    
    if (state.stack.length > 0) {
      this.write('\nStack contents:');
      state.stack.forEach((value, index) => {
        this.write(`  [${index}] ${this.formatValue(value)}`);
      });
    }
    
    if (state.callStack.length > 0) {
      this.write('\nCall stack:');
      state.callStack.forEach((frame, index) => {
        this.write(`  [${index}] ${frame.functionName} (return: ${frame.returnAddress})`);
      });
    }
    
    this.write('');
  }

  private displayError(error: Error): void {
    this.writeError(`REPL Error: ${error.message}`);
  }

  public getVMState() {
    return this.vm.getState();
  }

  public getSymbolTable() {
    return this.symbolTable;
  }

  public isPersistentState(): boolean {
    return this.vmOptions.persistState;
  }

  public setPersistentState(persist: boolean): void {
    this.vmOptions.persistState = persist;
    this.write(`State persistence: ${persist ? 'ON' : 'OFF'}`);
  }
}