import { Lexer } from '../lexer';
import { TokenType, Token } from '../../types';

// Helper function to safely access tokens
function getToken(tokens: Token[], index: number): Token {
  const token = tokens[index];
  if (!token) {
    throw new Error(`Token at index ${index} is undefined`);
  }
  return token;
}

describe('Lexer', () => {
  let lexer: Lexer;

  beforeEach(() => {
    lexer = new Lexer();
  });

  describe('Basic Tokens', () => {
    it('should tokenize numbers', () => {
      const tokens = lexer.tokenize('42');
      expect(tokens).toHaveLength(2); // number + EOF
      const token = getToken(tokens, 0);
      expect(token.type).toBe(TokenType.NUMBER);
      expect(token.value).toBe('42');
      expect(token.location.line).toBe(1);
      expect(token.location.column).toBe(1);
    });

    it('should tokenize decimal numbers', () => {
      const tokens = lexer.tokenize('3.14');
      const token = getToken(tokens, 0);
      expect(token.type).toBe(TokenType.NUMBER);
      expect(token.value).toBe('3.14');
    });

    it('should tokenize identifiers', () => {
      const tokens = lexer.tokenize('variable');
      const token = getToken(tokens, 0);
      expect(token.type).toBe(TokenType.IDENTIFIER);
      expect(token.value).toBe('variable');
    });

    it('should tokenize identifiers with underscores and numbers', () => {
      const tokens = lexer.tokenize('var_123');
      const token = getToken(tokens, 0);
      expect(token.type).toBe(TokenType.IDENTIFIER);
      expect(token.value).toBe('var_123');
    });

    it('should tokenize string literals', () => {
      const tokens = lexer.tokenize('"hello world"');
      const token = getToken(tokens, 0);
      expect(token.type).toBe(TokenType.STRING);
      expect(token.value).toBe('hello world');
    });

    it('should tokenize single-quoted strings', () => {
      const tokens = lexer.tokenize("'hello'");
      const token = getToken(tokens, 0);
      expect(token.type).toBe(TokenType.STRING);
      expect(token.value).toBe('hello');
    });
  });

  describe('Operators', () => {
    it('should tokenize arithmetic operators', () => {
      const source = '+ - * / %';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.PLUS);
      expect(getToken(tokens, 1).type).toBe(TokenType.MINUS);
      expect(getToken(tokens, 2).type).toBe(TokenType.MULTIPLY);
      expect(getToken(tokens, 3).type).toBe(TokenType.DIVIDE);
      expect(getToken(tokens, 4).type).toBe(TokenType.MODULO);
    });

    it('should tokenize assignment operator', () => {
      const tokens = lexer.tokenize('=');
      expect(getToken(tokens, 0).type).toBe(TokenType.ASSIGN);
    });

    it('should tokenize comparison operators', () => {
      const source = '== != < > <= >=';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.EQUAL);
      expect(getToken(tokens, 1).type).toBe(TokenType.NOT_EQUAL);
      expect(getToken(tokens, 2).type).toBe(TokenType.LESS_THAN);
      expect(getToken(tokens, 3).type).toBe(TokenType.GREATER_THAN);
      expect(getToken(tokens, 4).type).toBe(TokenType.LESS_EQUAL);
      expect(getToken(tokens, 5).type).toBe(TokenType.GREATER_EQUAL);
    });
  });

  describe('Punctuation', () => {
    it('should tokenize punctuation', () => {
      const source = '(); , {}';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.LEFT_PAREN);
      expect(getToken(tokens, 1).type).toBe(TokenType.RIGHT_PAREN);
      expect(getToken(tokens, 2).type).toBe(TokenType.SEMICOLON);
      expect(getToken(tokens, 3).type).toBe(TokenType.COMMA);
      expect(getToken(tokens, 4).type).toBe(TokenType.LEFT_BRACE);
      expect(getToken(tokens, 5).type).toBe(TokenType.RIGHT_BRACE);
    });
  });

  describe('Keywords', () => {
    it('should tokenize keywords', () => {
      const keywords = ['let', 'function', 'if', 'else', 'while', 'return', 'true', 'false'];
      const expectedTypes = [
        TokenType.LET,
        TokenType.FUNCTION,
        TokenType.IF,
        TokenType.ELSE,
        TokenType.WHILE,
        TokenType.RETURN,
        TokenType.TRUE,
        TokenType.FALSE
      ];

      keywords.forEach((keyword, index) => {
        const tokens = lexer.tokenize(keyword);
        const token = getToken(tokens, 0);
        expect(token.type).toBe(expectedTypes[index]);
        expect(token.value).toBe(keyword);
      });
    });

    it('should distinguish keywords from identifiers', () => {
      const tokens = lexer.tokenize('letter'); // not 'let'
      const token = getToken(tokens, 0);
      expect(token.type).toBe(TokenType.IDENTIFIER);
      expect(token.value).toBe('letter');
    });
  });

  describe('Whitespace and Line Tracking', () => {
    it('should skip whitespace', () => {
      const tokens = lexer.tokenize('  42   ');
      expect(tokens).toHaveLength(2); // number + EOF
      expect(getToken(tokens, 0).type).toBe(TokenType.NUMBER);
    });

    it('should track line numbers', () => {
      const source = 'let x\nlet y';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).location.line).toBe(1); // let
      expect(getToken(tokens, 1).location.line).toBe(1); // x
      expect(getToken(tokens, 2).location.line).toBe(2); // let
      expect(getToken(tokens, 3).location.line).toBe(2); // y
    });

    it('should track column numbers', () => {
      const source = 'let x = 42';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).location.column).toBe(1); // let
      expect(getToken(tokens, 1).location.column).toBe(5); // x
      expect(getToken(tokens, 2).location.column).toBe(7); // =
      expect(getToken(tokens, 3).location.column).toBe(9); // 42
    });
  });

  describe('Error Recovery', () => {
    it('should handle invalid characters', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('42 @ 24');
      
      // Should skip the invalid character and continue
      expect(getToken(tokens, 0).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 0).value).toBe('42');
      expect(getToken(tokens, 1).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 1).value).toBe('24');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle unterminated strings', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('"unterminated');
      
      // Should still produce a string token with available content
      expect(getToken(tokens, 0).type).toBe(TokenType.STRING);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Complex Expressions', () => {
    it('should tokenize a simple expression', () => {
      const source = 'x + 42';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.IDENTIFIER);
      expect(getToken(tokens, 0).value).toBe('x');
      expect(getToken(tokens, 1).type).toBe(TokenType.PLUS);
      expect(getToken(tokens, 2).type).toBe(TokenType.NUMBER);
      expect(getToken(tokens, 2).value).toBe('42');
      expect(getToken(tokens, 3).type).toBe(TokenType.EOF);
    });

    it('should tokenize function call', () => {
      const source = 'print("hello")';
      const tokens = lexer.tokenize(source);
      
      expect(getToken(tokens, 0).type).toBe(TokenType.IDENTIFIER);
      expect(getToken(tokens, 0).value).toBe('print');
      expect(getToken(tokens, 1).type).toBe(TokenType.LEFT_PAREN);
      expect(getToken(tokens, 2).type).toBe(TokenType.STRING);
      expect(getToken(tokens, 2).value).toBe('hello');
      expect(getToken(tokens, 3).type).toBe(TokenType.RIGHT_PAREN);
    });
  });
});