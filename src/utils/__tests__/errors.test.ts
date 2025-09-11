import { 
  VMError, 
  CompileTimeError, 
  RuntimeError, 
  ErrorReporter 
} from '../errors';
import { SourceLocation } from '../../types';

describe('Error System', () => {
  describe('VMError', () => {
    it('should create base VM error', () => {
      const error = new VMError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('VMError');
    });
  });

  describe('CompileTimeError', () => {
    it('should create syntax error', () => {
      const location: SourceLocation = { line: 1, column: 5 };
      const error = new CompileTimeError('syntax', 'Unexpected token', location);
      
      expect(error.type).toBe('syntax');
      expect(error.message).toBe('Unexpected token');
      expect(error.location).toEqual(location);
      expect(error.name).toBe('CompileTimeError');
    });

    it('should create semantic error', () => {
      const location: SourceLocation = { line: 2, column: 10 };
      const error = new CompileTimeError('semantic', 'Undefined variable', location);
      
      expect(error.type).toBe('semantic');
      expect(error.message).toBe('Undefined variable');
    });

    it('should format error message with location', () => {
      const location: SourceLocation = { line: 1, column: 5 };
      const error = new CompileTimeError('syntax', 'Unexpected token', location);
      
      expect(error.toString()).toContain('Line 1, Column 5');
      expect(error.toString()).toContain('Unexpected token');
    });
  });

  describe('RuntimeError', () => {
    it('should create runtime error with stack trace', () => {
      const stackTrace = ['main()', 'add()'];
      const error = new RuntimeError('type_mismatch', 'Cannot add string to number', stackTrace);
      
      expect(error.type).toBe('type_mismatch');
      expect(error.message).toBe('Cannot add string to number');
      expect(error.stackTrace).toEqual(stackTrace);
      expect(error.name).toBe('RuntimeError');
    });

    it('should format error message with stack trace', () => {
      const stackTrace = ['main()', 'add()'];
      const error = new RuntimeError('stack_overflow', 'Stack overflow', stackTrace);
      
      const formatted = error.toString();
      expect(formatted).toContain('Stack overflow');
      expect(formatted).toContain('main()');
      expect(formatted).toContain('add()');
    });
  });

  describe('ErrorReporter', () => {
    let reporter: ErrorReporter;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      reporter = new ErrorReporter();
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should report lex errors', () => {
      const location: SourceLocation = { line: 1, column: 5 };
      reporter.reportLexError('Invalid character', location);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Lexer Error')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid character')
      );
    });

    it('should report parse errors', () => {
      const token = {
        type: 'IDENTIFIER' as any,
        value: 'test',
        location: { line: 1, column: 5 }
      };
      
      reporter.reportParseError('Unexpected token', 'NUMBER', token);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parse Error')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected NUMBER')
      );
    });

    it('should report runtime errors', () => {
      const error = new RuntimeError('division_by_zero', 'Division by zero', ['main()']);
      reporter.reportRuntimeError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Runtime Error')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Division by zero')
      );
    });
  });
});