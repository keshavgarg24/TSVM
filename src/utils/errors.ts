import { CompileError, RuntimeError as RuntimeErrorType, SourceLocation, Token } from '../types';

/**
 * Base error class for all VM-related errors
 */
export class VMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VMError';
  }
}

/**
 * Compile-time error (syntax, semantic, type errors)
 */
export class CompileTimeError extends VMError implements CompileError {
  public readonly type: 'syntax' | 'semantic' | 'type';
  public readonly location: SourceLocation;

  constructor(type: 'syntax' | 'semantic' | 'type', message: string, location: SourceLocation) {
    super(message);
    this.name = 'CompileTimeError';
    this.type = type;
    this.location = location;
  }

  toString(): string {
    return `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Error at Line ${this.location.line}, Column ${this.location.column}: ${this.message}`;
  }
}

/**
 * Runtime error during VM execution
 */
export class RuntimeError extends VMError implements RuntimeErrorType {
  public readonly type: 'stack_overflow' | 'undefined_variable' | 'type_mismatch' | 'division_by_zero';
  public readonly stackTrace: string[];

  constructor(
    type: 'stack_overflow' | 'undefined_variable' | 'type_mismatch' | 'division_by_zero',
    message: string,
    stackTrace: string[] = []
  ) {
    super(message);
    this.name = 'RuntimeError';
    this.type = type;
    this.stackTrace = stackTrace;
  }

  toString(): string {
    let result = `Runtime Error (${this.type}): ${this.message}`;
    if (this.stackTrace.length > 0) {
      result += '\nStack trace:\n';
      this.stackTrace.forEach((frame, index) => {
        result += `  ${index + 1}. ${frame}\n`;
      });
    }
    return result;
  }
}

/**
 * Error reporter for handling and displaying errors
 */
export class ErrorReporter {
  private errorCount = 0;

  reportLexError(message: string, location: SourceLocation): void {
    this.errorCount++;
    console.error(`Lexer Error at Line ${location.line}, Column ${location.column}: ${message}`);
  }

  reportParseError(message: string, expected: string, actual: Token): void {
    this.errorCount++;
    console.error(
      `Parse Error at Line ${actual.location.line}, Column ${actual.location.column}: ${message}`
    );
    console.error(`Expected ${expected}, but got ${actual.type} (${actual.value})`);
  }

  reportRuntimeError(error: RuntimeError): void {
    this.errorCount++;
    console.error(`Runtime Error: ${error.toString()}`);
  }

  reportCompileError(error: CompileTimeError): void {
    this.errorCount++;
    console.error(`Compile Error: ${error.toString()}`);
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  reset(): void {
    this.errorCount = 0;
  }

  hasErrors(): boolean {
    return this.errorCount > 0;
  }
}

/**
 * Creates a type mismatch error
 */
export function createTypeMismatchError(expected: string, actual: string, operation: string): RuntimeError {
  return new RuntimeError(
    'type_mismatch',
    `Type mismatch in ${operation}: expected ${expected}, got ${actual}`
  );
}

/**
 * Creates an undefined variable error
 */
export function createUndefinedVariableError(variableName: string): RuntimeError {
  return new RuntimeError(
    'undefined_variable',
    `Undefined variable: ${variableName}`
  );
}

/**
 * Creates a division by zero error
 */
export function createDivisionByZeroError(): RuntimeError {
  return new RuntimeError(
    'division_by_zero',
    'Division by zero'
  );
}

/**
 * Creates a stack overflow error
 */
export function createStackOverflowError(): RuntimeError {
  return new RuntimeError(
    'stack_overflow',
    'Stack overflow: maximum call stack size exceeded'
  );
}