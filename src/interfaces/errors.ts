import { CompileError, RuntimeError, SourceLocation, Token } from '../types';

export interface ErrorReporter {
  reportLexError(message: string, location: SourceLocation): void;
  reportParseError(message: string, expected: string, actual: Token): void;
  reportRuntimeError(error: RuntimeError): void;
}