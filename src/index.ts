/**
 * TypeScript VM - Main Entry Point
 * 
 * This is the main entry point for the TypeScript Virtual Machine.
 * It exports all the core components and provides a unified API.
 */

// Core Components
export { Lexer } from './lexer';
export { Parser } from './parser';
export { CodeGenerator, SymbolTable } from './compiler';
export { VirtualMachine } from './vm';

// AST and Types
export * from './ast/nodes';
export * from './types';
export * from './interfaces';

// Bytecode
export * from './bytecode';

// Utilities
export { RuntimeError, CompileTimeError, VMError } from './utils/errors';
export * from './utils/values';

// Tools
export { Disassembler } from './tools/disassembler';
export { Assembler } from './tools/assembler';
export { Debugger } from './tools/debugger';
export { REPL } from './repl';

// Testing and Performance
export { TestHelpers } from './testing/test-helpers';
export { PerformanceRunner } from './testing/performance/performance-runner';

// CLI
export { CLI, parseArgs, printHelp, printVersion } from './cli/cli';

// High-level API
export class TypeScriptVM {
  private lexer = new Lexer();
  private parser = new Parser();
  private symbolTable = new SymbolTable();
  private codeGenerator = new CodeGenerator(this.symbolTable);
  private vm = new VirtualMachine();

  /**
   * Execute TypeScript-like source code
   */
  execute(sourceCode: string): void {
    const tokens = this.lexer.tokenize(sourceCode);
    const ast = this.parser.parse(tokens);
    const bytecode = this.codeGenerator.compile(ast);
    this.vm.execute(bytecode);
  }

  /**
   * Compile source code to bytecode
   */
  compile(sourceCode: string) {
    const tokens = this.lexer.tokenize(sourceCode);
    const ast = this.parser.parse(tokens);
    const bytecode = this.codeGenerator.compile(ast);
    return {
      tokens,
      ast,
      bytecode
    };
  }

  /**
   * Get VM state
   */
  getState() {
    return this.vm.getState();
  }

  /**
   * Reset VM state
   */
  reset(): void {
    this.vm.reset();
    this.symbolTable = new SymbolTable();
    this.codeGenerator = new CodeGenerator(this.symbolTable);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return this.vm.getMemoryStats();
  }
}

// Re-export main components for convenience
import { Lexer } from './lexer';
import { Parser } from './parser';
import { CodeGenerator, SymbolTable } from './compiler';
import { VirtualMachine } from './vm';