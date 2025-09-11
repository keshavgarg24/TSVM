import { ASTNode, BinaryExpression, UnaryExpression, Literal, NodeType } from '../../ast/nodes';

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
      case NodeType.BinaryExpression:
        return this.foldBinaryExpression(node as BinaryExpression);
      case NodeType.UnaryExpression:
        return this.foldUnaryExpression(node as UnaryExpression);
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
    if (left.type === NodeType.Literal && right.type === NodeType.Literal) {
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
          return new Literal(result);
        }
      }

      // Handle string concatenation
      if (node.operator === '+' && 
          (typeof leftLiteral.value === 'string' || typeof rightLiteral.value === 'string')) {
        return new Literal(String(leftLiteral.value) + String(rightLiteral.value));
      }

      // Handle boolean operations
      if (this.isBooleanOperator(node.operator)) {
        const result = this.evaluateBooleanOperation(
          leftLiteral.value,
          node.operator,
          rightLiteral.value
        );
        if (result !== null) {
          return new Literal(result);
        }
      }
    }

    // Return updated node with folded children
    return new BinaryExpression(left, node.operator, right);
  }

  /**
   * Fold unary expressions
   */
  private foldUnaryExpression(node: UnaryExpression): ASTNode {
    const operand = this.fold(node.operand);

    // Check if operand is a literal
    if (operand.type === NodeType.Literal) {
      const literal = operand as Literal;
      const result = this.evaluateUnaryOperation(node.operator, literal.value);
      
      if (result !== null) {
        return new Literal(result);
      }
    }

    return new UnaryExpression(node.operator, operand);
  }

  /**
   * Fold children of a node
   */
  private foldChildren(node: ASTNode): ASTNode {
    // Create a copy of the node and fold its children
    const newNode = { ...node };

    // Handle different node types that have children
    switch (node.type) {
      case NodeType.Program:
        if ('body' in newNode && Array.isArray(newNode.body)) {
          newNode.body = newNode.body.map(child => this.fold(child));
        }
        break;
      case NodeType.BlockStatement:
        if ('body' in newNode && Array.isArray(newNode.body)) {
          newNode.body = newNode.body.map(child => this.fold(child));
        }
        break;
      case NodeType.ExpressionStatement:
        if ('expression' in newNode) {
          newNode.expression = this.fold(newNode.expression);
        }
        break;
      case NodeType.VariableDeclaration:
        if ('init' in newNode && newNode.init) {
          newNode.init = this.fold(newNode.init);
        }
        break;
      case NodeType.AssignmentExpression:
        if ('right' in newNode) {
          newNode.right = this.fold(newNode.right);
        }
        break;
      case NodeType.CallExpression:
        if ('arguments' in newNode && Array.isArray(newNode.arguments)) {
          newNode.arguments = newNode.arguments.map(arg => this.fold(arg));
        }
        break;
      case NodeType.IfStatement:
        if ('test' in newNode) {
          newNode.test = this.fold(newNode.test);
        }
        if ('consequent' in newNode) {
          newNode.consequent = this.fold(newNode.consequent);
        }
        if ('alternate' in newNode && newNode.alternate) {
          newNode.alternate = this.fold(newNode.alternate);
        }
        break;
      case NodeType.WhileStatement:
        if ('test' in newNode) {
          newNode.test = this.fold(newNode.test);
        }
        if ('body' in newNode) {
          newNode.body = this.fold(newNode.body);
        }
        break;
      case NodeType.ForStatement:
        if ('init' in newNode && newNode.init) {
          newNode.init = this.fold(newNode.init);
        }
        if ('test' in newNode && newNode.test) {
          newNode.test = this.fold(newNode.test);
        }
        if ('update' in newNode && newNode.update) {
          newNode.update = this.fold(newNode.update);
        }
        if ('body' in newNode) {
          newNode.body = this.fold(newNode.body);
        }
        break;
      case NodeType.ReturnStatement:
        if ('argument' in newNode && newNode.argument) {
          newNode.argument = this.fold(newNode.argument);
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
   * Evaluate unary operations
   */
  private evaluateUnaryOperation(operator: string, operand: any): any {
    switch (operator) {
      case '-': return typeof operand === 'number' ? -operand : null;
      case '+': return typeof operand === 'number' ? +operand : null;
      case '!': return !operand;
      case 'typeof': return typeof operand;
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