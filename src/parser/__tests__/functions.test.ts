import { Parser } from '../parser';
import { Lexer } from '../../lexer';
import { 
  FunctionDeclaration, 
  CallExpression, 
  BlockStatement,
  ReturnStatement,
  ExpressionStatement,
  Identifier,
  Literal
} from '../../types';

describe('Parser - Functions', () => {
  let parser: Parser;
  let lexer: Lexer;

  beforeEach(() => {
    parser = new Parser();
    lexer = new Lexer();
  });

  describe('Function Declarations', () => {
    it('should parse function with no parameters', () => {
      const source = `
        function greet() {
          return "Hello";
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      expect(program.body).toHaveLength(1);
      const func = program.body[0] as FunctionDeclaration;
      
      expect(func.type).toBe('FunctionDeclaration');
      expect(func.name.type).toBe('Identifier');
      expect(func.name.name).toBe('greet');
      expect(func.parameters).toHaveLength(0);
      expect(func.body.type).toBe('BlockStatement');
    });

    it('should parse function with single parameter', () => {
      const source = `
        function square(x) {
          return x * x;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const func = program.body[0] as FunctionDeclaration;
      
      expect(func.type).toBe('FunctionDeclaration');
      expect(func.name.name).toBe('square');
      expect(func.parameters).toHaveLength(1);
      expect(func.parameters[0]?.name).toBe('x');
    });

    it('should parse function with multiple parameters', () => {
      const source = `
        function add(a, b, c) {
          return a + b + c;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const func = program.body[0] as FunctionDeclaration;
      
      expect(func.type).toBe('FunctionDeclaration');
      expect(func.name.name).toBe('add');
      expect(func.parameters).toHaveLength(3);
      expect(func.parameters[0]?.name).toBe('a');
      expect(func.parameters[1]?.name).toBe('b');
      expect(func.parameters[2]?.name).toBe('c');
    });

    it('should parse function with empty body', () => {
      const source = `
        function empty() {
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const func = program.body[0] as FunctionDeclaration;
      
      expect(func.type).toBe('FunctionDeclaration');
      expect(func.body.body).toHaveLength(0);
    });

    it('should parse function with multiple statements', () => {
      const source = `
        function complex(x, y) {
          let sum = x + y;
          let product = x * y;
          return sum + product;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const func = program.body[0] as FunctionDeclaration;
      
      expect(func.type).toBe('FunctionDeclaration');
      expect(func.body.body).toHaveLength(3);
      expect(func.body.body[0]?.type).toBe('VariableDeclaration');
      expect(func.body.body[1]?.type).toBe('VariableDeclaration');
      expect(func.body.body[2]?.type).toBe('ReturnStatement');
    });
  });

  describe('Return Statements', () => {
    it('should parse return with expression', () => {
      const source = `
        function getValue() {
          return 42;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const func = program.body[0] as FunctionDeclaration;
      const returnStmt = func.body.body[0] as ReturnStatement;
      
      expect(returnStmt.type).toBe('ReturnStatement');
      expect(returnStmt.argument?.type).toBe('Literal');
      expect((returnStmt.argument as Literal).value).toBe(42);
    });

    it('should parse return without expression', () => {
      const source = `
        function doSomething() {
          return;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const func = program.body[0] as FunctionDeclaration;
      const returnStmt = func.body.body[0] as ReturnStatement;
      
      expect(returnStmt.type).toBe('ReturnStatement');
      expect(returnStmt.argument).toBeUndefined();
    });

    it('should parse return with complex expression', () => {
      const source = `
        function calculate(a, b) {
          return a * b + 10;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const func = program.body[0] as FunctionDeclaration;
      const returnStmt = func.body.body[0] as ReturnStatement;
      
      expect(returnStmt.type).toBe('ReturnStatement');
      expect(returnStmt.argument?.type).toBe('BinaryExpression');
    });
  });

  describe('Function Calls', () => {
    it('should parse function call with no arguments', () => {
      const tokens = lexer.tokenize('greet();');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const call = stmt.expression as CallExpression;
      
      expect(call.type).toBe('CallExpression');
      expect(call.callee.type).toBe('Identifier');
      expect((call.callee as Identifier).name).toBe('greet');
      expect(call.arguments).toHaveLength(0);
    });

    it('should parse function call with single argument', () => {
      const tokens = lexer.tokenize('square(5);');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const call = stmt.expression as CallExpression;
      
      expect(call.type).toBe('CallExpression');
      expect((call.callee as Identifier).name).toBe('square');
      expect(call.arguments).toHaveLength(1);
      expect(call.arguments[0]?.type).toBe('Literal');
      expect((call.arguments[0] as Literal).value).toBe(5);
    });

    it('should parse function call with multiple arguments', () => {
      const tokens = lexer.tokenize('add(1, 2, 3);');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const call = stmt.expression as CallExpression;
      
      expect(call.type).toBe('CallExpression');
      expect((call.callee as Identifier).name).toBe('add');
      expect(call.arguments).toHaveLength(3);
      expect((call.arguments[0] as Literal).value).toBe(1);
      expect((call.arguments[1] as Literal).value).toBe(2);
      expect((call.arguments[2] as Literal).value).toBe(3);
    });

    it('should parse function call with expression arguments', () => {
      const tokens = lexer.tokenize('calculate(x + 1, y * 2);');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const call = stmt.expression as CallExpression;
      
      expect(call.type).toBe('CallExpression');
      expect(call.arguments).toHaveLength(2);
      expect(call.arguments[0]?.type).toBe('BinaryExpression');
      expect(call.arguments[1]?.type).toBe('BinaryExpression');
    });

    it('should parse nested function calls', () => {
      const tokens = lexer.tokenize('outer(inner(5));');
      const program = parser.parse(tokens);
      
      const stmt = program.body[0] as ExpressionStatement;
      const outerCall = stmt.expression as CallExpression;
      
      expect(outerCall.type).toBe('CallExpression');
      expect((outerCall.callee as Identifier).name).toBe('outer');
      expect(outerCall.arguments).toHaveLength(1);
      
      const innerCall = outerCall.arguments[0] as CallExpression;
      expect(innerCall.type).toBe('CallExpression');
      expect((innerCall.callee as Identifier).name).toBe('inner');
    });
  });

  describe('Mixed Function Usage', () => {
    it('should parse function declaration and call together', () => {
      const source = `
        function double(x) {
          return x * 2;
        }
        let result = double(5);
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      expect(program.body).toHaveLength(2);
      expect(program.body[0]?.type).toBe('FunctionDeclaration');
      expect(program.body[1]?.type).toBe('VariableDeclaration');
    });

    it('should parse function call in expression', () => {
      const source = `
        let result = add(1, 2) * 3;
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const varDecl = program.body[0] as any;
      const expr = varDecl.initializer;
      
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.left.type).toBe('CallExpression');
      expect(expr.right.type).toBe('Literal');
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing function name', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('function () { return 1; }');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing closing parenthesis in parameters', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('function test(a, b { return a + b; }');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing closing parenthesis in function call', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('test(1, 2;');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});