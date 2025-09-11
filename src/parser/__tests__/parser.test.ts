import { Parser } from '../parser';
import { Lexer } from '../../lexer';
import { TokenType, Program, BinaryExpression, Literal, Identifier } from '../../types';

describe('Parser', () => {
  let parser: Parser;
  let lexer: Lexer;

  beforeEach(() => {
    parser = new Parser();
    lexer = new Lexer();
  });

  function parseExpression(source: string) {
    const tokens = lexer.tokenize(source);
    const program = parser.parse(tokens);
    return program.body[0];
  }

  describe('Basic Expression Parsing', () => {
    it('should parse number literals', () => {
      const tokens = lexer.tokenize('42;');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(program.body).toHaveLength(1);
      
      const stmt = program.body[0];
      expect(stmt?.type).toBe('ExpressionStatement');
      
      const expr = (stmt as any).expression;
      expect(expr.type).toBe('Literal');
      expect(expr.value).toBe(42);
    });

    it('should parse string literals', () => {
      const tokens = lexer.tokenize('"hello";');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression;
      expect(expr.type).toBe('Literal');
      expect(expr.value).toBe('hello');
    });

    it('should parse boolean literals', () => {
      const tokens = lexer.tokenize('true;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression;
      expect(expr.type).toBe('Literal');
      expect(expr.value).toBe(true);
    });

    it('should parse identifiers', () => {
      const tokens = lexer.tokenize('variable;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression;
      expect(expr.type).toBe('Identifier');
      expect(expr.name).toBe('variable');
    });
  });

  describe('Binary Expressions', () => {
    it('should parse simple addition', () => {
      const tokens = lexer.tokenize('1 + 2;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('+');
      expect((expr.left as Literal).value).toBe(1);
      expect((expr.right as Literal).value).toBe(2);
    });

    it('should parse simple subtraction', () => {
      const tokens = lexer.tokenize('5 - 3;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('-');
      expect((expr.left as Literal).value).toBe(5);
      expect((expr.right as Literal).value).toBe(3);
    });

    it('should parse multiplication', () => {
      const tokens = lexer.tokenize('3 * 4;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('*');
      expect((expr.left as Literal).value).toBe(3);
      expect((expr.right as Literal).value).toBe(4);
    });

    it('should parse division', () => {
      const tokens = lexer.tokenize('8 / 2;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('/');
      expect((expr.left as Literal).value).toBe(8);
      expect((expr.right as Literal).value).toBe(2);
    });
  });

  describe('Operator Precedence', () => {
    it('should handle multiplication before addition', () => {
      const tokens = lexer.tokenize('1 + 2 * 3;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      // Should parse as: 1 + (2 * 3)
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('+');
      expect((expr.left as Literal).value).toBe(1);
      
      const rightExpr = expr.right as BinaryExpression;
      expect(rightExpr.type).toBe('BinaryExpression');
      expect(rightExpr.operator).toBe('*');
      expect((rightExpr.left as Literal).value).toBe(2);
      expect((rightExpr.right as Literal).value).toBe(3);
    });

    it('should handle division before subtraction', () => {
      const tokens = lexer.tokenize('10 - 6 / 2;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      // Should parse as: 10 - (6 / 2)
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('-');
      expect((expr.left as Literal).value).toBe(10);
      
      const rightExpr = expr.right as BinaryExpression;
      expect(rightExpr.type).toBe('BinaryExpression');
      expect(rightExpr.operator).toBe('/');
      expect((rightExpr.left as Literal).value).toBe(6);
      expect((rightExpr.right as Literal).value).toBe(2);
    });

    it('should handle left associativity for same precedence', () => {
      const tokens = lexer.tokenize('1 + 2 + 3;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      // Should parse as: (1 + 2) + 3
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('+');
      expect((expr.right as Literal).value).toBe(3);
      
      const leftExpr = expr.left as BinaryExpression;
      expect(leftExpr.type).toBe('BinaryExpression');
      expect(leftExpr.operator).toBe('+');
      expect((leftExpr.left as Literal).value).toBe(1);
      expect((leftExpr.right as Literal).value).toBe(2);
    });
  });

  describe('Parentheses', () => {
    it('should handle parentheses in expressions', () => {
      const tokens = lexer.tokenize('(1 + 2) * 3;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      // Should parse as: (1 + 2) * 3
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('*');
      expect((expr.right as Literal).value).toBe(3);
      
      const leftExpr = expr.left as BinaryExpression;
      expect(leftExpr.type).toBe('BinaryExpression');
      expect(leftExpr.operator).toBe('+');
      expect((leftExpr.left as Literal).value).toBe(1);
      expect((leftExpr.right as Literal).value).toBe(2);
    });

    it('should handle nested parentheses', () => {
      const tokens = lexer.tokenize('((1 + 2) * 3);');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('*');
    });
  });

  describe('Comparison Operators', () => {
    it('should parse equality comparison', () => {
      const tokens = lexer.tokenize('1 == 2;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('==');
      expect((expr.left as Literal).value).toBe(1);
      expect((expr.right as Literal).value).toBe(2);
    });

    it('should parse less than comparison', () => {
      const tokens = lexer.tokenize('x < y;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('<');
      expect((expr.left as Identifier).name).toBe('x');
      expect((expr.right as Identifier).name).toBe('y');
    });

    it('should handle comparison precedence', () => {
      const tokens = lexer.tokenize('1 + 2 < 3 * 4;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0];
      const expr = (stmt as any).expression as BinaryExpression;
      
      // Should parse as: (1 + 2) < (3 * 4)
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('<');
      
      const leftExpr = expr.left as BinaryExpression;
      expect(leftExpr.operator).toBe('+');
      
      const rightExpr = expr.right as BinaryExpression;
      expect(rightExpr.operator).toBe('*');
    });
  });

  describe('Error Recovery', () => {
    it('should handle unexpected tokens gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('1 + + 2;');
      const program = parser.parse(tokens);
      
      // Should still produce some kind of program
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing semicolons', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('1 + 2');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      // May or may not report error depending on implementation
      
      consoleSpy.mockRestore();
    });
  });
});