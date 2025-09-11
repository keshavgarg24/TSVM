import { Token, TokenType, SourceLocation } from '../types';
import { Lexer as LexerInterface } from '../interfaces';
import { ErrorReporter } from '../utils/errors';

export class Lexer implements LexerInterface {
  private source = '';
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private errorReporter = new ErrorReporter();

  private readonly keywords = new Map<string, TokenType>([
    ['let', TokenType.LET],
    ['function', TokenType.FUNCTION],
    ['if', TokenType.IF],
    ['else', TokenType.ELSE],
    ['while', TokenType.WHILE],
    ['return', TokenType.RETURN],
    ['true', TokenType.TRUE],
    ['false', TokenType.FALSE],
  ]);

  tokenize(source: string): Token[] {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;
    this.errorReporter.reset();

    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(this.createToken(TokenType.EOF, ''));
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      // Single character tokens
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '+':
        this.addToken(TokenType.PLUS);
        break;
      case '-':
        this.addToken(TokenType.MINUS);
        break;
      case '*':
        this.addToken(TokenType.MULTIPLY);
        break;
      case '/':
        if (this.match('/')) {
          // Single-line comment - skip to end of line
          this.skipComment();
        } else {
          this.addToken(TokenType.DIVIDE);
        }
        break;
      case '%':
        this.addToken(TokenType.MODULO);
        break;

      // Potentially multi-character tokens
      case '=':
        this.addToken(this.match('=') ? TokenType.EQUAL : TokenType.ASSIGN);
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.NOT_EQUAL : TokenType.IDENTIFIER);
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS_THAN);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER_THAN);
        break;
      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.AND);
        } else {
          this.errorReporter.reportLexError(
            'Unexpected character: &',
            this.getCurrentLocation()
          );
        }
        break;
      case '|':
        if (this.match('|')) {
          this.addToken(TokenType.OR);
        } else {
          this.errorReporter.reportLexError(
            'Unexpected character: |',
            this.getCurrentLocation()
          );
        }
        break;

      // Whitespace
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break;
      case '\n':
        this.line++;
        this.column = 1;
        break;

      // String literals
      case '"':
      case "'":
        this.string(c);
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.errorReporter.reportLexError(
            `Unexpected character: ${c}`,
            this.getCurrentLocation()
          );
        }
        break;
    }
  }

  private string(quote: string): void {
    const startLocation = this.getCurrentLocation();
    let value = '';
    
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      
      if (this.peek() === '\\') {
        // Handle escape sequences
        this.advance(); // consume backslash
        const escaped = this.advance();
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            // Invalid escape sequence - include as-is
            this.errorReporter.reportLexError(
              `Invalid escape sequence: \\${escaped}`,
              this.getCurrentLocation()
            );
            value += escaped;
            break;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.errorReporter.reportLexError(
        'Unterminated string',
        startLocation
      );
      this.addToken(TokenType.STRING, value);
      return;
    }

    // Consume the closing quote
    this.advance();

    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the '.'
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(this.start, this.current);
    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = this.keywords.get(text) || TokenType.IDENTIFIER;
    this.addToken(type, text);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private advance(): string {
    const char = this.source.charAt(this.current++);
    this.column++;
    return char;
  }

  private addToken(type: TokenType, literal?: string): void {
    const text = literal ?? this.source.substring(this.start, this.current);
    const token = this.createToken(type, text);
    this.tokens.push(token);
  }

  private createToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      location: {
        line: this.line,
        column: this.column - (this.current - this.start),
        length: this.current - this.start
      }
    };
  }

  private getCurrentLocation(): SourceLocation {
    return {
      line: this.line,
      column: this.column - (this.current - this.start)
    };
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private skipComment(): void {
    // Skip until end of line or end of file
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
  }
}