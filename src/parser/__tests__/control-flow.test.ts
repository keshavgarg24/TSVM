import { Parser } from '../parser';
import { Lexer } from '../../lexer';
import { 
  IfStatement, 
  WhileStatement,
  BlockStatement,
  BinaryExpression,
  Identifier,
  Literal,
  ExpressionStatement
} from '../../types';

describe('Parser - Control Flow', () => {
  let parser: Parser;
  let lexer: Lexer;

  beforeEach(() => {
    parser = new Parser();
    lexer = new Lexer();
  });

  describe('If Statements', () => {
    it('should parse simple if statement', () => {
      const source = `
        if (x > 5) {
          return true;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      expect(program.body).toHaveLength(1);
      const ifStmt = program.body[0] as IfStatement;
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.condition.type).toBe('BinaryExpression');
      expect(ifStmt.consequent.type).toBe('BlockStatement');
      expect(ifStmt.alternate).toBeUndefined();
    });

    it('should parse if-else statement', () => {
      const source = `
        if (x > 5) {
          return true;
        } else {
          return false;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const ifStmt = program.body[0] as IfStatement;
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.condition.type).toBe('BinaryExpression');
      expect(ifStmt.consequent.type).toBe('BlockStatement');
      expect(ifStmt.alternate?.type).toBe('BlockStatement');
    });

    it('should parse if-else-if chain', () => {
      const source = `
        if (x > 10) {
          return "big";
        } else if (x > 5) {
          return "medium";
        } else {
          return "small";
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const ifStmt = program.body[0] as IfStatement;
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.alternate?.type).toBe('IfStatement');
      
      const elseIfStmt = ifStmt.alternate as IfStatement;
      expect(elseIfStmt.alternate?.type).toBe('BlockStatement');
    });

    it('should parse if with single statement (no braces)', () => {
      const source = `
        if (flag)
          x = 1;
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const ifStmt = program.body[0] as IfStatement;
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.consequent.type).toBe('ExpressionStatement');
    });

    it('should parse if-else with single statements', () => {
      const source = `
        if (flag)
          x = 1;
        else
          x = 0;
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const ifStmt = program.body[0] as IfStatement;
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.consequent.type).toBe('ExpressionStatement');
      expect(ifStmt.alternate?.type).toBe('ExpressionStatement');
    });

    it('should parse nested if statements', () => {
      const source = `
        if (x > 0) {
          if (y > 0) {
            return "both positive";
          }
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const outerIf = program.body[0] as IfStatement;
      const outerBlock = outerIf.consequent as BlockStatement;
      const innerIf = outerBlock.body[0] as IfStatement;
      
      expect(outerIf.type).toBe('IfStatement');
      expect(innerIf.type).toBe('IfStatement');
    });
  });

  describe('While Statements', () => {
    it('should parse simple while loop', () => {
      const source = `
        while (x > 0) {
          x = x - 1;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      expect(program.body).toHaveLength(1);
      const whileStmt = program.body[0] as WhileStatement;
      
      expect(whileStmt.type).toBe('WhileStatement');
      expect(whileStmt.condition.type).toBe('BinaryExpression');
      expect(whileStmt.body.type).toBe('BlockStatement');
    });

    it('should parse while with single statement', () => {
      const source = `
        while (running)
          count = count + 1;
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const whileStmt = program.body[0] as WhileStatement;
      
      expect(whileStmt.type).toBe('WhileStatement');
      expect(whileStmt.body.type).toBe('ExpressionStatement');
    });

    it('should parse while with complex condition', () => {
      const source = `
        while (x > 0 && y < 10) {
          x = x - 1;
          y = y + 1;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const whileStmt = program.body[0] as WhileStatement;
      
      expect(whileStmt.type).toBe('WhileStatement');
      expect(whileStmt.condition.type).toBe('BinaryExpression');
    });

    it('should parse nested while loops', () => {
      const source = `
        while (i < 10) {
          while (j < 5) {
            j = j + 1;
          }
          i = i + 1;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const outerWhile = program.body[0] as WhileStatement;
      const outerBlock = outerWhile.body as BlockStatement;
      const innerWhile = outerBlock.body[0] as WhileStatement;
      
      expect(outerWhile.type).toBe('WhileStatement');
      expect(innerWhile.type).toBe('WhileStatement');
    });

    it('should parse while with empty body', () => {
      const source = `
        while (condition) {
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const whileStmt = program.body[0] as WhileStatement;
      const block = whileStmt.body as BlockStatement;
      
      expect(whileStmt.type).toBe('WhileStatement');
      expect(block.body).toHaveLength(0);
    });
  });

  describe('Complex Control Flow', () => {
    it('should parse if inside while', () => {
      const source = `
        while (x > 0) {
          if (x % 2 == 0) {
            x = x / 2;
          } else {
            x = x - 1;
          }
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const whileStmt = program.body[0] as WhileStatement;
      const whileBlock = whileStmt.body as BlockStatement;
      const ifStmt = whileBlock.body[0] as IfStatement;
      
      expect(whileStmt.type).toBe('WhileStatement');
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.alternate).toBeDefined();
    });

    it('should parse while inside if', () => {
      const source = `
        if (shouldLoop) {
          while (counter < limit) {
            counter = counter + 1;
          }
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const ifStmt = program.body[0] as IfStatement;
      const ifBlock = ifStmt.consequent as BlockStatement;
      const whileStmt = ifBlock.body[0] as WhileStatement;
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(whileStmt.type).toBe('WhileStatement');
    });

    it('should parse control flow with function calls', () => {
      const source = `
        if (isValid(input)) {
          while (hasMore()) {
            process(getNext());
          }
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const ifStmt = program.body[0] as IfStatement;
      
      expect(ifStmt.type).toBe('IfStatement');
      expect(ifStmt.condition.type).toBe('CallExpression');
    });
  });

  describe('Logical Operators', () => {
    it('should parse logical AND in conditions', () => {
      const source = `
        if (x > 0 && y > 0) {
          return true;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const ifStmt = program.body[0] as IfStatement;
      const condition = ifStmt.condition as BinaryExpression;
      
      expect(condition.type).toBe('BinaryExpression');
      expect(condition.operator).toBe('&&');
    });

    it('should parse logical OR in conditions', () => {
      const source = `
        while (x < 0 || y < 0) {
          x = x + 1;
        }
      `;
      const tokens = lexer.tokenize(source);
      const program = parser.parse(tokens);
      
      const whileStmt = program.body[0] as WhileStatement;
      const condition = whileStmt.condition as BinaryExpression;
      
      expect(condition.type).toBe('BinaryExpression');
      expect(condition.operator).toBe('||');
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing condition in if statement', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('if { return 1; }');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing body in while statement', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('while (true)');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing closing brace', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const tokens = lexer.tokenize('if (true) { x = 1;');
      const program = parser.parse(tokens);
      
      expect(program.type).toBe('Program');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});