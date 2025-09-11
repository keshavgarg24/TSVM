import { Parser } from '../parser';
import { Lexer } from '../../lexer';
import { 
  VariableDeclaration, 
  AssignmentExpression, 
  Identifier, 
  Literal,
  ExpressionStatement 
} from '../../types';

describe('Parser - Variables', () => {
  let parser: Parser;
  let lexer: Lexer;

  beforeEach(() => {
    parser = new Parser();
    lexer = new Lexer();
  });

  describe('Variable Declarations', () => {
    it('should parse variable declaration with initializer', () => {
      const tokens = lexer.tokenize('let x = 42;');
      const program = parser.parse(tokens);
      
      expect(program.body).toHaveLength(1);
      const stmt = program.body[0] as VariableDeclaration;
      
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.identifier.type).toBe('Identifier');
      expect(stmt.identifier.name).toBe('x');
      expect(stmt.initializer?.type).toBe('Literal');
      expect((stmt.initializer as Literal).value).toBe(42);
    });

    it('should parse variable declaration without initializer', () => {
      const tokens = lexer.tokenize('let y;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as VariableDeclaration;
      
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.identifier.name).toBe('y');
      expect(stmt.initializer).toBeUndefined();
    });

    it('should parse variable declaration with string initializer', () => {
      const tokens = lexer.tokenize('let name = "John";');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as VariableDeclaration;
      
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.identifier.name).toBe('name');
      expect((stmt.initializer as Literal).value).toBe('John');
    });

    it('should parse variable declaration with boolean initializer', () => {
      const tokens = lexer.tokenize('let flag = true;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as VariableDeclaration;
      
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.identifier.name).toBe('flag');
      expect((stmt.initializer as Literal).value).toBe(true);
    });

    it('should parse variable declaration with expression initializer', () => {
      const tokens = lexer.tokenize('let sum = 1 + 2;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as VariableDeclaration;
      
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.identifier.name).toBe('sum');
      expect(stmt.initializer?.type).toBe('BinaryExpression');
    });
  });

  describe('Assignment Expressions', () => {
    it('should parse simple assignment', () => {
      const tokens = lexer.tokenize('x = 10;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const expr = stmt.expression as AssignmentExpression;
      
      expect(expr.type).toBe('AssignmentExpression');
      expect(expr.left.type).toBe('Identifier');
      expect(expr.left.name).toBe('x');
      expect(expr.right.type).toBe('Literal');
      expect((expr.right as Literal).value).toBe(10);
    });

    it('should parse assignment with expression', () => {
      const tokens = lexer.tokenize('result = a + b;');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const expr = stmt.expression as AssignmentExpression;
      
      expect(expr.type).toBe('AssignmentExpression');
      expect(expr.left.name).toBe('result');
      expect(expr.right.type).toBe('BinaryExpression');
    });

    it('should parse assignment with string', () => {
      const tokens = lexer.tokenize('message = "Hello World";');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const expr = stmt.expression as AssignmentExpression;
      
      expect(expr.type).toBe('AssignmentExpression');
      expect(expr.left.name).toBe('message');
      expect((expr.right as Literal).value).toBe('Hello World');
    });
  });

  describe('Multiple Statements', () => {
    it('should parse multiple variable declarations', () => {
      const source = `
        let x = 10;
        let y = 20;
        let z;
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      expect(program.body).toHaveLength(3);
      
      const stmt1 = program.body[0] as VariableDeclaration;
      expect(stmt1.type).toBe('VariableDeclaration');
      expect(stmt1.identifier.name).toBe('x');
      
      const stmt2 = program.body[1] as VariableDeclaration;
      expect(stmt2.type).toBe('VariableDeclaration');
      expect(stmt2.identifier.name).toBe('y');
      
      const stmt3 = program.body[2] as VariableDeclaration;
      expect(stmt3.type).toBe('VariableDeclaration');
      expect(stmt3.identifier.name).toBe('z');
      expect(stmt3.initializer).toBeUndefined();
    });

    it('should parse mixed declarations and assignments', () => {
      const source = `
        let x = 5;
        x = 10;
        let y = x + 5;
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      expect(program.body).toHaveLength(3);
      
      expect(program.body[0]?.type).toBe('VariableDeclaration');
      expect(program.body[1]?.type).toBe('ExpressionStatement');
      expect(program.body[2]?.type).toBe('VariableDeclaration');
    });
  });

  describe('Variable Name Validation', () => {
    it('should parse valid identifier names', () => {
      const validNames = ['x', 'variable', 'var123', '_private', 'camelCase'];
      
      for (const name of validNames) {
        const tokens = lexer.tokenize(`let ${name} = 1;`);
        const program = parser.parse(tokens);
        
        const stmt = program.body[0] as VariableDeclaration;
        expect(stmt.identifier.name).toBe(name);
      }
    });

    it('should handle keywords as variable names gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('let let = 5;');
      const program = parser.parse(tokens);
      
      // Should report error but continue parsing
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing variable name', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('let = 5;');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing semicolon in variable declaration', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('let x = 5');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      // May or may not report error depending on implementation
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid assignment target', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('42 = x;');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      // Should handle gracefully
      
      consoleSpy.mockRestore();
    });
  });
});