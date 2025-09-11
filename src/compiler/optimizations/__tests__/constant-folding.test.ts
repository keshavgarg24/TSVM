import { ConstantFolder, applyConstantFolding } from '../constant-folding';
import { BinaryExpression, UnaryExpression, Literal, NodeType } from '../../../ast/nodes';

describe('ConstantFolder', () => {
  let folder: ConstantFolder;

  beforeEach(() => {
    folder = new ConstantFolder();
  });

  describe('Binary Expression Folding', () => {
    it('should fold arithmetic operations', () => {
      const expr = new BinaryExpression(
        new Literal(5),
        '+',
        new Literal(3)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(8);
    });

    it('should fold multiplication', () => {
      const expr = new BinaryExpression(
        new Literal(4),
        '*',
        new Literal(7)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(28);
    });

    it('should fold division', () => {
      const expr = new BinaryExpression(
        new Literal(15),
        '/',
        new Literal(3)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(5);
    });

    it('should not fold division by zero', () => {
      const expr = new BinaryExpression(
        new Literal(10),
        '/',
        new Literal(0)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.BinaryExpression);
    });

    it('should fold string concatenation', () => {
      const expr = new BinaryExpression(
        new Literal('hello'),
        '+',
        new Literal(' world')
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe('hello world');
    });

    it('should fold boolean operations', () => {
      const expr = new BinaryExpression(
        new Literal(5),
        '>',
        new Literal(3)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(true);
    });

    it('should fold logical AND', () => {
      const expr = new BinaryExpression(
        new Literal(true),
        '&&',
        new Literal(false)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(false);
    });

    it('should fold logical OR', () => {
      const expr = new BinaryExpression(
        new Literal(false),
        '||',
        new Literal(true)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(true);
    });

    it('should not fold non-constant expressions', () => {
      const expr = new BinaryExpression(
        { type: NodeType.Identifier, name: 'x' },
        '+',
        new Literal(3)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.BinaryExpression);
    });
  });

  describe('Unary Expression Folding', () => {
    it('should fold unary minus', () => {
      const expr = new UnaryExpression('-', new Literal(5));

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(-5);
    });

    it('should fold unary plus', () => {
      const expr = new UnaryExpression('+', new Literal(5));

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(5);
    });

    it('should fold logical NOT', () => {
      const expr = new UnaryExpression('!', new Literal(true));

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(false);
    });

    it('should fold typeof operator', () => {
      const expr = new UnaryExpression('typeof', new Literal(42));

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe('number');
    });

    it('should not fold non-constant unary expressions', () => {
      const expr = new UnaryExpression('-', { type: NodeType.Identifier, name: 'x' });

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.UnaryExpression);
    });
  });

  describe('Nested Expression Folding', () => {
    it('should fold nested arithmetic', () => {
      const expr = new BinaryExpression(
        new BinaryExpression(new Literal(2), '+', new Literal(3)),
        '*',
        new BinaryExpression(new Literal(4), '-', new Literal(1))
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(15); // (2 + 3) * (4 - 1) = 5 * 3 = 15
    });

    it('should partially fold mixed expressions', () => {
      const expr = new BinaryExpression(
        new BinaryExpression(new Literal(2), '+', new Literal(3)),
        '*',
        { type: NodeType.Identifier, name: 'x' }
      );

      const result = folder.fold(expr) as BinaryExpression;
      expect(result.type).toBe(NodeType.BinaryExpression);
      expect(result.left.type).toBe(NodeType.Literal);
      expect((result.left as Literal).value).toBe(5);
      expect(result.right.type).toBe(NodeType.Identifier);
    });
  });

  describe('applyConstantFolding function', () => {
    it('should apply constant folding to an AST', () => {
      const expr = new BinaryExpression(
        new Literal(10),
        '+',
        new Literal(5)
      );

      const result = applyConstantFolding(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(15);
    });
  });

  describe('Edge Cases', () => {
    it('should handle modulo operation', () => {
      const expr = new BinaryExpression(
        new Literal(10),
        '%',
        new Literal(3)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(1);
    });

    it('should not fold modulo by zero', () => {
      const expr = new BinaryExpression(
        new Literal(10),
        '%',
        new Literal(0)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.BinaryExpression);
    });

    it('should handle power operation', () => {
      const expr = new BinaryExpression(
        new Literal(2),
        '**',
        new Literal(3)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(8);
    });

    it('should handle equality comparisons', () => {
      const expr = new BinaryExpression(
        new Literal(5),
        '===',
        new Literal(5)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(true);
    });

    it('should handle inequality comparisons', () => {
      const expr = new BinaryExpression(
        new Literal(5),
        '!==',
        new Literal(3)
      );

      const result = folder.fold(expr);
      expect(result.type).toBe(NodeType.Literal);
      expect((result as Literal).value).toBe(true);
    });
  });
});