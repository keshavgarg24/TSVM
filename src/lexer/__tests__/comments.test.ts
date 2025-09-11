import { Lexer } from '../lexer';
import { TokenType, Token } from '../../types';

function getToken(tokens: Token[], index: number): Token {
  const token = tokens[index];
  if (!token) {
    throw new Error(`Token at index ${index} is undefined`);
  }
  return token;
}

describe('Lexer Comments and Escape Sequences', () => {
  let lexer: Lexer;

  beforeEach(() => {
    lexer = new Lexer();
  });

  describe('Comments', () => {
    it('should skip single-line comments', () => {
      const source = '42 // this is a comment\n24';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 0).value).toBe('42');
      expect(getToken(tokens, 1).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 1).value).toBe('24');
      expect(getToken(tokens, 2).type).toBe(TokenType.EOF);
    });

    it('should skip comments at end of file', () => {
      const source = '42 // comment at end';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 0).value).toBe('42');
      expect(getToken(tokens, 1).type).toBe(TokenType.EOF);
    });

    it('should handle multiple comments', () => {
      const source = `
        let x = 42; // first comment
        let y = 24; // second comment
      `;
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.LET);
      expect(getToken(tokens, 1).type).toBe(TokenType.IDENTIFIER);
      expect(getToken(tokens, 1).value).toBe('x');
      expect(getToken(tokens, 2).type).toBe(TokenType.ASSIGN);
      expect(getToken(tokens, 3).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 3).value).toBe('42');
      expect(getToken(tokens, 4).type).toBe(TokenType.SEMICOLON);
      expect(getToken(tokens, 5).type).toBe(TokenType.LET);
    });
  });

  describe('String Escape Sequences', () => {
    it('should handle basic escape sequences', () => {
      const source = '"hello\\nworld"';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 0).value).toBe('hello\nworld');
    });

    it('should handle tab escape sequence', () => {
      const source = '"hello\\tworld"';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 0).value).toBe('hello\tworld');
    });

    it('should handle quote escape sequences', () => {
      const source = '"She said \\"Hello\\""';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 0).value).toBe('She said "Hello"');
    });

    it('should handle backslash escape sequence', () => {
      const source = '"path\\\\to\\\\file"';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 0).value).toBe('path\\to\\file');
    });

    it('should handle carriage return escape sequence', () => {
      const source = '"line1\\rline2"';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 0).value).toBe('line1\rline2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const source = '""';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 0).value).toBe('');
    });

    it('should handle strings with only spaces', () => {
      const source = '"   "';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 0).value).toBe('   ');
    });

    it('should handle very large numbers', () => {
      const source = '123456789.987654321';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 0).value).toBe('123456789.987654321');
    });

    it('should handle invalid escape sequences gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const source = '"invalid\\x"';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      // Should include the invalid escape as-is or handle gracefully
      
      consoleSpy.mockRestore();
    });
  });
});