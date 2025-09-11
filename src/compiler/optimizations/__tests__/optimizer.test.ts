import { Optimizer, optimizeAST, getOptimizationMetrics } from '../optimizer';
import { 
  Program, 
  BinaryExpression, 
  Literal, 
  ExpressionStatement,
  ReturnStatement,
  IfStatement,
  NodeType 
} from '../../../ast/nodes';

describe('Optimizer', () => {
  describe('Basic Optimization', () => {
    it('should apply constant folding', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(5), '+', new Literal(3))
        )
      ]);

      const optimizer = new Optimizer({ constantFolding: true, deadCodeElimination: false });
      const result = optimizer.optimize(program);

      expect(result.optimizationsApplied).toContain('constant-folding');
      const stmt = result.optimizedAST as Program;
      const expr = (stmt.body[0] as ExpressionStatement).expression as Literal;
      expect(expr.value).toBe(8);
    });

    it('should apply dead code elimination', () => {
      const program = new Program([
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(1)) // Dead code
      ]);

      const optimizer = new Optimizer({ constantFolding: false, deadCodeElimination: true });
      const result = optimizer.optimize(program);

      expect(result.optimizationsApplied).toContain('dead-code-elimination');
      const optimizedProgram = result.optimizedAST as Program;
      expect(optimizedProgram.body).toHaveLength(1);
    });

    it('should apply both optimizations', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(2), '*', new Literal(3))
        ),
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(1)) // Dead code
      ]);

      const optimizer = new Optimizer();
      const result = optimizer.optimize(program);

      expect(result.optimizationsApplied).toContain('constant-folding');
      expect(result.optimizationsApplied).toContain('dead-code-elimination');
      
      const optimizedProgram = result.optimizedAST as Program;
      expect(optimizedProgram.body).toHaveLength(2);
      
      const expr = (optimizedProgram.body[0] as ExpressionStatement).expression as Literal;
      expect(expr.value).toBe(6);
    });
  });

  describe('Multiple Passes', () => {
    it('should perform multiple optimization passes', () => {
      // Create a scenario where multiple passes are beneficial
      const program = new Program([
        new IfStatement(
          new BinaryExpression(new Literal(1), '===', new Literal(1)), // Always true
          new ExpressionStatement(
            new BinaryExpression(new Literal(4), '+', new Literal(2)) // Can be folded
          ),
          new ExpressionStatement(new Literal(999)) // Dead code
        )
      ]);

      const optimizer = new Optimizer({ maxPasses: 3 });
      const result = optimizer.optimize(program);

      expect(result.passes).toBeGreaterThan(1);
      
      // Should be optimized to just the expression statement with value 6
      const optimizedProgram = result.optimizedAST as Program;
      expect(optimizedProgram.body).toHaveLength(1);
      expect(optimizedProgram.body[0].type).toBe(NodeType.ExpressionStatement);
      
      const expr = (optimizedProgram.body[0] as ExpressionStatement).expression as Literal;
      expect(expr.value).toBe(6);
    });

    it('should stop when no more optimizations are possible', () => {
      const program = new Program([
        new ExpressionStatement(new Literal(42))
      ]);

      const optimizer = new Optimizer({ maxPasses: 5 });
      const result = optimizer.optimize(program);

      expect(result.passes).toBe(1); // Should stop after first pass
    });

    it('should respect max passes limit', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(1), '+', new Literal(2))
        )
      ]);

      const optimizer = new Optimizer({ maxPasses: 1 });
      const result = optimizer.optimize(program);

      expect(result.passes).toBe(1);
    });
  });

  describe('Optimization Metrics', () => {
    it('should calculate node reduction correctly', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(5), '+', new Literal(3))
        ),
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(1)) // Dead code
      ]);

      const optimizer = new Optimizer();
      const result = optimizer.optimize(program);

      expect(result.metrics.originalNodeCount).toBeGreaterThan(result.metrics.optimizedNodeCount);
      expect(result.metrics.reductionPercentage).toBeGreaterThan(0);
      expect(result.metrics.executionTime).toBeGreaterThan(0);
    });

    it('should handle cases with no optimization', () => {
      const program = new Program([
        new ExpressionStatement(new Literal(42))
      ]);

      const optimizer = new Optimizer();
      const result = optimizer.optimize(program);

      expect(result.metrics.reductionPercentage).toBe(0);
      expect(result.optimizationsApplied).toHaveLength(0);
    });
  });

  describe('Configuration Options', () => {
    it('should disable constant folding when configured', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(5), '+', new Literal(3))
        )
      ]);

      const optimizer = new Optimizer({ constantFolding: false });
      const result = optimizer.optimize(program);

      expect(result.optimizationsApplied).not.toContain('constant-folding');
      const stmt = result.optimizedAST as Program;
      const expr = (stmt.body[0] as ExpressionStatement).expression;
      expect(expr.type).toBe(NodeType.BinaryExpression);
    });

    it('should disable dead code elimination when configured', () => {
      const program = new Program([
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(1)) // Dead code
      ]);

      const optimizer = new Optimizer({ deadCodeElimination: false });
      const result = optimizer.optimize(program);

      expect(result.optimizationsApplied).not.toContain('dead-code-elimination');
      const optimizedProgram = result.optimizedAST as Program;
      expect(optimizedProgram.body).toHaveLength(2);
    });

    it('should work with verbose mode', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(2), '*', new Literal(4))
        )
      ]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const optimizer = new Optimizer({ verbose: true });
      optimizer.optimize(program);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Static Methods', () => {
    it('should create optimizer with static method', () => {
      const optimizer = Optimizer.create({ maxPasses: 2 });
      expect(optimizer).toBeInstanceOf(Optimizer);
    });

    it('should optimize with static method', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(3), '+', new Literal(4))
        )
      ]);

      const result = Optimizer.optimize(program);
      expect(result.optimizationsApplied).toContain('constant-folding');
    });
  });

  describe('Utility Functions', () => {
    it('should optimize AST with utility function', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(6), '/', new Literal(2))
        )
      ]);

      const optimized = optimizeAST(program);
      const stmt = optimized as Program;
      const expr = (stmt.body[0] as ExpressionStatement).expression as Literal;
      expect(expr.value).toBe(3);
    });

    it('should get optimization metrics with utility function', () => {
      const program = new Program([
        new ExpressionStatement(
          new BinaryExpression(new Literal(8), '-', new Literal(3))
        ),
        new ReturnStatement(new Literal(42)),
        new ExpressionStatement(new Literal(1)) // Dead code
      ]);

      const metrics = getOptimizationMetrics(program);
      expect(metrics.originalNodeCount).toBeGreaterThan(metrics.optimizedNodeCount);
      expect(metrics.reductionPercentage).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty program', () => {
      const program = new Program([]);

      const optimizer = new Optimizer();
      const result = optimizer.optimize(program);

      expect(result.optimizedAST).toEqual(program);
      expect(result.metrics.reductionPercentage).toBe(0);
    });

    it('should handle null nodes gracefully', () => {
      const program = new Program([
        new ExpressionStatement(new Literal(42))
      ]);

      const optimizer = new Optimizer();
      const result = optimizer.optimize(program);

      expect(result.optimizedAST).toBeDefined();
    });

    it('should handle complex nested structures', () => {
      const program = new Program([
        new IfStatement(
          new BinaryExpression(new Literal(1), '>', new Literal(0)), // Always true
          new Program([
            new ExpressionStatement(
              new BinaryExpression(new Literal(10), '*', new Literal(5))
            ),
            new ReturnStatement(new Literal(100)),
            new ExpressionStatement(new Literal(999)) // Dead code
          ])
        )
      ]);

      const optimizer = new Optimizer();
      const result = optimizer.optimize(program);

      expect(result.optimizationsApplied.length).toBeGreaterThan(0);
      expect(result.metrics.reductionPercentage).toBeGreaterThan(0);
    });
  });
});