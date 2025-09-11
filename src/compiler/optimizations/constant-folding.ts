import { ASTNode, BinaryExpression, Literal } from '../../types';
import { createLiteral, createBinaryExpression } from '../../ast/nodes';

/**
 * Constant folding optimization
 * Evaluates constant expressions at compile time
 */
export class ConstantFolder {
  /**
   * Apply constant folding to an AST node
   */
  fold(node: ASTNode): ASTNode {
    switch (node.type) {
      case 'BinaryExpression':
        return this.foldBinaryExpression(node as BinaryExpression);
      default:
        return this.foldChildren(node);
    }
  }

  /**
   * Fold binary expressions
   */
  private foldBinaryExpression(node: BinaryExpression): ASTNode {
    // First fold children
    const left = this.fold(node.left);
    const right = this.fold(node.right);

    // Check if both operands are literals
    if (left.type === 'Literal' && right.type === 'Literal') {
      const leftLiteral = left as Literal;
      const rightLiteral = right as Literal;

      // Only fold if both are numbers
      if (typeof leftLiteral.value === 'number' && typeof rightLiteral.value === 'number') {
        const result = this.evaluateBinaryOperation(
          leftLiteral.value,
          node.operator,
          rightLiteral.value
        );

        if (result !== null) {
          return createLiteral(result, node.location);
        }
      }

      // Handle string concatenation
      if (node.operator === '+' && 
          (typeof leftLiteral.value === 'string' || typeof rightLiteral.value === 'string')) {
        return createLiteral(String(leftLiteral.value) + String(rightLiteral.value), node.location);
      }

      // Handle boolean operations
      if (this.isBooleanOperator(node.operator)) {
        const result = this.evaluateBooleanOperation(
          leftLiteral.value,
          node.operator,
          rightLiteral.value
        );
        if (result !== null) {
          return createLiteral(result, node.location);
        }
      }
    }

    // Return updated node with folded children
    return createBinaryExpression(left, node.operator, right, node.location);
  }



  /**
   * Fold children of a node
   */
  private foldChildren(node: ASTNode): ASTNode {
    // Create a copy of the node and fold its children
    const newNode = { ...node };

    // Handle different node types that have children
    switch (node.type) {
      case 'Program':
        if ('body' in newNode && Array.isArray(newNode.body)) {
          newNode.body = newNode.body.map((child: any) => this.fold(child));
        }
        break;
      case 'BlockStatement':
        if ('body' in newNode && Array.isArray(newNode.body)) {
          newNode.body = newNode.body.map((child: any) => this.fold(child));
        }
        break;
      case 'ExpressionStatement':
        if ('expression' in newNode) {
          newNode.expression = this.fold(newNode.expression as ASTNode);
        }
        break;
      case 'VariableDeclaration':
        if ('initializer' in newNode && newNode.initializer) {
          newNode.initializer = this.fold(newNode.initializer as ASTNode);
        }
        break;
      case 'AssignmentExpression':
        if ('right' in newNode) {
          newNode.right = this.fold(newNode.right as ASTNode);
        }
        break;
      case 'CallExpression':
        if ('arguments' in newNode && Array.isArray(newNode.arguments)) {
          newNode.arguments = newNode.arguments.map((arg: any) => this.fold(arg));
        }
        break;
      case 'IfStatement':
        if ('condition' in newNode) {
          newNode.condition = this.fold(newNode.condition as ASTNode);
        }
        if ('consequent' in newNode) {
          newNode.consequent = this.fold(newNode.consequent as ASTNode);
        }
        if ('alternate' in newNode && newNode.alternate) {
          newNode.alternate = this.fold(newNode.alternate as ASTNode);
        }
        break;
      case 'WhileStatement':
        if ('condition' in newNode) {
          newNode.condition = this.fold(newNode.condition as ASTNode);
        }
        if ('body' in newNode) {
          newNode.body = this.fold(newNode.body as ASTNode);
        }
        break;
      case 'ReturnStatement':
        if ('argument' in newNode && newNode.argument) {
          newNode.argument = this.fold(newNode.argument as ASTNode);
        }
        break;
    }

    return newNode as ASTNode;
  }

  /**
   * Evaluate binary arithmetic operations
   */
  private evaluateBinaryOperation(left: number, operator: string, right: number): number | null {
    switch (operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : null; // Avoid division by zero
      case '%': return right !== 0 ? left % right : null; // Avoid modulo by zero
      case '**': return Math.pow(left, right);
      default: return null;
    }
  }

  /**
   * Evaluate boolean operations
   */
  private evaluateBooleanOperation(left: any, operator: string, right: any): boolean | null {
    switch (operator) {
      case '==': return left == right;
      case '!=': return left != right;
      case '===': return left === right;
      case '!==': return left !== right;
      case '<': return left < right;
      case '<=': return left <= right;
      case '>': return left > right;
      case '>=': return left >= right;
      case '&&': return left && right;
      case '||': return left || right;
      default: return null;
    }
  }



  /**
   * Check if operator is a boolean operator
   */
  private isBooleanOperator(operator: string): boolean {
    return ['==', '!=', '===', '!==', '<', '<=', '>', '>=', '&&', '||'].includes(operator);
  }

  /**
   * Apply constant folding to an entire AST
   */
  optimize(ast: ASTNode): ASTNode {
    return this.fold(ast);
  }
}

/**
 * Apply constant folding optimization to an AST
 */
export function applyConstantFolding(ast: ASTNode): ASTNode {
  const folder = new ConstantFolder();
  return folder.optimize(ast);
}