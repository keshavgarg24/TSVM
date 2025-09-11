import { ASTNode } from '../../types';
import { applyConstantFolding } from './constant-folding';
import { applyDeadCodeElimination } from './dead-code-elimination';

export interface OptimizationOptions {
  constantFolding?: boolean;
  deadCodeElimination?: boolean;
  maxPasses?: number;
  verbose?: boolean;
}

export interface OptimizationResult {
  optimizedAST: ASTNode;
  passes: number;
  optimizationsApplied: string[];
  metrics: OptimizationMetrics;
}

export interface OptimizationMetrics {
  originalNodeCount: number;
  optimizedNodeCount: number;
  reductionPercentage: number;
  executionTime: number;
}

/**
 * Main optimization manager
 */
export class Optimizer {
  private options: Required<OptimizationOptions>;

  constructor(options: OptimizationOptions = {}) {
    this.options = {
      constantFolding: options.constantFolding ?? true,
      deadCodeElimination: options.deadCodeElimination ?? true,
      maxPasses: options.maxPasses ?? 3,
      verbose: options.verbose ?? false
    };
  }

  /**
   * Apply all enabled optimizations to an AST
   */
  optimize(ast: ASTNode): OptimizationResult {
    const startTime = Date.now();
    const originalNodeCount = this.countNodes(ast);
    const optimizationsApplied: string[] = [];
    
    let currentAST = ast;
    let passes = 0;
    let changed = true;

    if (this.options.verbose) {
      console.log('🔧 Starting optimization passes...');
      console.log(`Original AST has ${originalNodeCount} nodes`);
    }

    // Apply optimizations in multiple passes until no changes occur
    while (changed && passes < this.options.maxPasses) {
      passes++;
      changed = false;
      const passStartNodes = this.countNodes(currentAST);

      if (this.options.verbose) {
        console.log(`\nPass ${passes}:`);
      }

      // Apply constant folding
      if (this.options.constantFolding) {
        const beforeNodes = this.countNodes(currentAST);
        currentAST = applyConstantFolding(currentAST);
        const afterNodes = this.countNodes(currentAST);
        
        if (afterNodes !== beforeNodes) {
          changed = true;
          if (!optimizationsApplied.includes('constant-folding')) {
            optimizationsApplied.push('constant-folding');
          }
          if (this.options.verbose) {
            console.log(`  Constant folding: ${beforeNodes} → ${afterNodes} nodes`);
          }
        }
      }

      // Apply dead code elimination
      if (this.options.deadCodeElimination) {
        const beforeNodes = this.countNodes(currentAST);
        currentAST = applyDeadCodeElimination(currentAST);
        const afterNodes = this.countNodes(currentAST);
        
        if (afterNodes !== beforeNodes) {
          changed = true;
          if (!optimizationsApplied.includes('dead-code-elimination')) {
            optimizationsApplied.push('dead-code-elimination');
          }
          if (this.options.verbose) {
            console.log(`  Dead code elimination: ${beforeNodes} → ${afterNodes} nodes`);
          }
        }
      }

      const passEndNodes = this.countNodes(currentAST);
      if (this.options.verbose) {
        console.log(`  Pass ${passes} total: ${passStartNodes} → ${passEndNodes} nodes`);
      }
    }

    const endTime = Date.now();
    const optimizedNodeCount = this.countNodes(currentAST);
    const reductionPercentage = ((originalNodeCount - optimizedNodeCount) / originalNodeCount) * 100;

    const result: OptimizationResult = {
      optimizedAST: currentAST,
      passes,
      optimizationsApplied,
      metrics: {
        originalNodeCount,
        optimizedNodeCount,
        reductionPercentage,
        executionTime: endTime - startTime
      }
    };

    if (this.options.verbose) {
      this.printOptimizationSummary(result);
    }

    return result;
  }

  /**
   * Count nodes in an AST
   */
  private countNodes(node: ASTNode): number {
    if (!node) return 0;
    
    let count = 1; // Count this node

    // Count children based on node type
    switch (node.type) {
      case 'Program':
        if ('body' in node && Array.isArray(node.body)) {
          count += node.body.reduce((sum: number, child: any) => sum + this.countNodes(child), 0);
        }
        break;
      case 'BlockStatement':
        if ('body' in node && Array.isArray(node.body)) {
          count += node.body.reduce((sum: number, child: any) => sum + this.countNodes(child), 0);
        }
        break;
      case 'BinaryExpression':
        if ('left' in node) count += this.countNodes((node as any).left);
        if ('right' in node) count += this.countNodes((node as any).right);
        break;
      case 'UnaryExpression':
        if ('operand' in node) count += this.countNodes((node as any).operand);
        break;
      case 'ExpressionStatement':
        if ('expression' in node) count += this.countNodes((node as any).expression);
        break;
      case 'VariableDeclaration':
        if ('initializer' in node && (node as any).initializer) count += this.countNodes((node as any).initializer);
        break;
      case 'AssignmentExpression':
        if ('left' in node) count += this.countNodes((node as any).left);
        if ('right' in node) count += this.countNodes((node as any).right);
        break;
      case 'CallExpression':
        if ('callee' in node) count += this.countNodes((node as any).callee);
        if ('arguments' in node && Array.isArray((node as any).arguments)) {
          count += (node as any).arguments.reduce((sum: number, arg: any) => sum + this.countNodes(arg), 0);
        }
        break;
      case 'IfStatement':
        if ('condition' in node) count += this.countNodes((node as any).condition);
        if ('consequent' in node) count += this.countNodes((node as any).consequent);
        if ('alternate' in node && (node as any).alternate) count += this.countNodes((node as any).alternate);
        break;
      case 'WhileStatement':
        if ('condition' in node) count += this.countNodes((node as any).condition);
        if ('body' in node) count += this.countNodes((node as any).body);
        break;
      case 'ForStatement':
        if ('init' in node && (node as any).init) count += this.countNodes((node as any).init);
        if ('test' in node && (node as any).test) count += this.countNodes((node as any).test);
        if ('update' in node && (node as any).update) count += this.countNodes((node as any).update);
        if ('body' in node) count += this.countNodes((node as any).body);
        break;
      case 'ReturnStatement':
        if ('argument' in node && (node as any).argument) count += this.countNodes((node as any).argument);
        break;
      case 'FunctionDeclaration':
        if ('body' in node) count += this.countNodes((node as any).body);
        if ('parameters' in node && Array.isArray((node as any).parameters)) {
          count += (node as any).parameters.reduce((sum: number, param: any) => sum + this.countNodes(param), 0);
        }
        break;
    }

    return count;
  }

  /**
   * Print optimization summary
   */
  private printOptimizationSummary(result: OptimizationResult): void {
    console.log('\n🎯 Optimization Summary');
    console.log('='.repeat(30));
    console.log(`Passes: ${result.passes}`);
    console.log(`Optimizations applied: ${result.optimizationsApplied.join(', ') || 'none'}`);
    console.log(`Original nodes: ${result.metrics.originalNodeCount}`);
    console.log(`Optimized nodes: ${result.metrics.optimizedNodeCount}`);
    console.log(`Reduction: ${result.metrics.reductionPercentage.toFixed(1)}%`);
    console.log(`Execution time: ${result.metrics.executionTime}ms`);
  }

  /**
   * Create an optimizer with specific options
   */
  static create(options?: OptimizationOptions): Optimizer {
    return new Optimizer(options);
  }

  /**
   * Quick optimization with default settings
   */
  static optimize(ast: ASTNode, options?: OptimizationOptions): OptimizationResult {
    const optimizer = new Optimizer(options);
    return optimizer.optimize(ast);
  }
}

/**
 * Apply optimizations to an AST with default settings
 */
export function optimizeAST(ast: ASTNode, options?: OptimizationOptions): ASTNode {
  const optimizer = new Optimizer(options);
  const result = optimizer.optimize(ast);
  return result.optimizedAST;
}

/**
 * Get optimization metrics for an AST
 */
export function getOptimizationMetrics(ast: ASTNode, options?: OptimizationOptions): OptimizationMetrics {
  const optimizer = new Optimizer(options);
  const result = optimizer.optimize(ast);
  return result.metrics;
}