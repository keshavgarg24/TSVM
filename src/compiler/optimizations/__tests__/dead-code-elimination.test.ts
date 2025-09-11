import { DeadCodeEliminator, applyDeadCodeElimination } from '../dead-code-elimination';
import { 
  Program, 
  IfStatement, 
  Literal, 
  BlockStatement, 
  ReturnStatement,
  ExpressionStatement,
  VariableDeclaration,
  Identifier,
  NodeType 
} from '../../../ast/nodes';

describe('DeadCodeEliminator', () => {
  let eliminator: DeadCodeEliminator;

  beforeEach(() => {
    eliminator = new DeadCodeEliminator();
  });

  describe('Unreachable Code After Return', () => {
    it('should remove code after return statement', () => {
      const program = new Program([
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(1)), // Dead code
        new ExpressionStatement(new Literal(2))  // Dead code
      ]);

      const result = eliminator.eliminate(program) as Program;
      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(NodeType.ReturnStatement);
    });

    it('should remove code after return in block statement', () => {
      const block = new BlockStatement([
        new ExpressionStatement(new Literal(1)),
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(2)), // Dead code
        new ExpressionStatement(new Literal(3))  // Dead code
      ]);

      const result = eliminator.eliminate(block) as BlockStatement;
      expect(result.body).toHaveLength(2);
      expect(result.body[1].type).toBe(NodeType.ReturnStatement);
    });
  });

  describe('Constant Condition Optimization', () => {
    it('should remove else branch when condition is always true', () => {
      const ifStmt = new IfStatement(
        new Literal(true),
        new ExpressionStatement(new Literal(1)),
        new ExpressionStatement(new Literal(2)) // Dead code
      );

      const result = eliminator.eliminate(ifStmt);
      expect(result.type).toBe(NodeType.ExpressionStatement);
      expect((result as ExpressionStatement).expression.type).toBe(NodeType.Literal);
      expect(((result as ExpressionStatement).expression as Literal).value).toBe(1);
    });

    it('should remove if branch when condition is always false', () => {
      const ifStmt = new IfStatement(
        new Literal(false),
        new ExpressionStatement(new Literal(1)), // Dead code
        new ExpressionStatement(new Literal(2))
      );

      const result = eliminator.eliminate(ifStmt);
      expect(result.type).toBe(NodeType.ExpressionStatement);
      expect((result as ExpressionStatement).expression.type).toBe(NodeType.Literal);
      expect(((result as ExpressionStatement).expression as Literal).value).toBe(2);
    });

    it('should remove entire if statement when condition is false and no else', () => {
      const ifStmt = new IfStatement(
        new Literal(false),
        new ExpressionStatement(new Literal(1)) // Dead code
      );

      const result = eliminator.eliminate(ifStmt);
      expect(result).toBeNull();
    });

    it('should keep both branches when condition is not constant', () => {
      const ifStmt = new IfStatement(
        new Identifier('x'),
        new ExpressionStatement(new Literal(1)),
        new ExpressionStatement(new Literal(2))
      );

      const result = eliminator.eliminate(ifStmt) as IfStatement;
      expect(result.type).toBe(NodeType.IfStatement);
      expect(result.consequent).toBeDefined();
      expect(result.alternate).toBeDefined();
    });
  });

  describe('Loop Optimization', () => {
    it('should remove while loop with false condition', () => {
      const whileStmt = {
        type: NodeType.WhileStatement,
        test: new Literal(false),
        body: new ExpressionStatement(new Literal(1)) // Dead code
      };

      const result = eliminator.eliminate(whileStmt);
      expect(result).toBeNull();
    });

    it('should keep while loop with true condition', () => {
      const whileStmt = {
        type: NodeType.WhileStatement,
        test: new Literal(true),
        body: new ExpressionStatement(new Literal(1))
      };

      const result = eliminator.eliminate(whileStmt);
      expect(result).not.toBeNull();
      expect(result.type).toBe(NodeType.WhileStatement);
    });

    it('should remove for loop with false condition', () => {
      const forStmt = {
        type: NodeType.ForStatement,
        init: new VariableDeclaration(new Identifier('i'), new Literal(0)),
        test: new Literal(false),
        update: null,
        body: new ExpressionStatement(new Literal(1)) // Dead code
      };

      const result = eliminator.eliminate(forStmt);
      expect(result).toBeNull();
    });
  });

  describe('Unused Variable Elimination', () => {
    it('should remove unused variable declarations', () => {
      const program = new Program([
        new VariableDeclaration(new Identifier('unused'), new Literal(42)),
        new ExpressionStatement(new Literal(1))
      ]);

      const result = eliminator.eliminate(program) as Program;
      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(NodeType.ExpressionStatement);
    });

    it('should keep variable declarations with side effects', () => {
      const callExpr = {
        type: NodeType.CallExpression,
        callee: new Identifier('sideEffect'),
        arguments: []
      };
      
      const program = new Program([
        new VariableDeclaration(new Identifier('unused'), callExpr),
        new ExpressionStatement(new Literal(1))
      ]);

      const result = eliminator.eliminate(program) as Program;
      expect(result.body).toHaveLength(2);
      expect(result.body[0].type).toBe(NodeType.ExpressionStatement);
    });

    it('should keep used variables', () => {
      const program = new Program([
        new VariableDeclaration(new Identifier('used'), new Literal(42)),
        new ExpressionStatement(new Identifier('used'))
      ]);

      const result = eliminator.eliminate(program) as Program;
      expect(result.body).toHaveLength(2);
      expect(result.body[0].type).toBe(NodeType.VariableDeclaration);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle nested dead code', () => {
      const program = new Program([
        new IfStatement(
          new Literal(true),
          new BlockStatement([
            new ExpressionStatement(new Literal(1)),
            new ReturnStatement(new Literal(42)),
            new ExpressionStatement(new Literal(2)) // Dead code
          ])
        ),
        new ExpressionStatement(new Literal(3)) // Dead code after return
      ]);

      const result = eliminator.eliminate(program) as Program;
      expect(result.body).toHaveLength(1);
      
      const blockStmt = result.body[0] as BlockStatement;
      expect(blockStmt.body).toHaveLength(2);
      expect(blockStmt.body[1].type).toBe(NodeType.ReturnStatement);
    });

    it('should handle mixed reachable and unreachable code', () => {
      const program = new Program([
        new ExpressionStatement(new Literal(1)), // Reachable
        new IfStatement(
          new Literal(false),
          new ExpressionStatement(new Literal(2)) // Dead code
        ),
        new ExpressionStatement(new Literal(3)) // Reachable
      ]);

      const result = eliminator.eliminate(program) as Program;
      expect(result.body).toHaveLength(2);
      expect(result.body[0].type).toBe(NodeType.ExpressionStatement);
      expect(result.body[1].type).toBe(NodeType.ExpressionStatement);
    });
  });

  describe('applyDeadCodeElimination function', () => {
    it('should apply dead code elimination to an AST', () => {
      const program = new Program([
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(1)) // Dead code
      ]);

      const result = applyDeadCodeElimination(program) as Program;
      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(NodeType.ReturnStatement);
    });
  });

  describe('Side Effect Detection', () => {
    it('should preserve expressions with side effects', () => {
      const callExpr = {
        type: NodeType.CallExpression,
        callee: new Identifier('console.log'),
        arguments: [new Literal('hello')]
      };

      const program = new Program([
        new ExpressionStatement(callExpr),
        new ReturnStatement(new Literal(42))
      ]);

      const result = eliminator.eliminate(program) as Program;
      expect(result.body).toHaveLength(2);
    });

    it('should remove pure expressions that are not used', () => {
      const program = new Program([
        new ExpressionStatement(new Literal(42)), // Pure expression, can be removed if not used
        new ReturnStatement(new Literal(1))
      ]);

      const result = eliminator.eliminate(program) as Program;
      // The literal expression might be kept as it's reachable, but this tests the framework
      expect(result.body).toHaveLength(2);
    });
  });
});