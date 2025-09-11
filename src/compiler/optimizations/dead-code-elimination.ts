import { ASTNode, NodeType, IfStatement, Literal, BlockStatement, Program } from '../../ast/nodes';

/**
 * Dead code elimination optimization
 * Removes unreachable code and unused variables
 */
export class DeadCodeEliminator {
  private reachableNodes = new Set<ASTNode>();
  private usedVariables = new Set<string>();

  /**
   * Apply dead code elimination to an AST node
   */
  eliminate(node: ASTNode): ASTNode {
    // First pass: mark reachable code
    this.markReachableCode(node);
    
    // Second pass: collect used variables
    this.collectUsedVariables(node);
    
    // Third pass: remove dead code
    return this.removeDeadCode(node);
  }

  /**
   * Mark reachable code starting from the root
   */
  private markReachableCode(node: ASTNode): void {
    if (this.reachableNodes.has(node)) {
      return; // Already processed
    }

    this.reachableNodes.add(node);

    switch (node.type) {
      case NodeType.Program:
        const program = node as Program;
        for (const stmt of program.body) {
          this.markReachableCode(stmt);
          // Stop marking after return statement
          if (stmt.type === NodeType.ReturnStatement) {
            break;
          }
        }
        break;

      case NodeType.BlockStatement:
        const block = node as BlockStatement;
        for (const stmt of block.body) {
          this.markReachableCode(stmt);
          // Stop marking after return statement
          if (stmt.type === NodeType.ReturnStatement) {
            break;
          }
        }
        break;

      case NodeType.IfStatement:
        const ifStmt = node as IfStatement;
        this.markReachableCode(ifStmt.test);
        
        // Check if condition is a constant
        if (ifStmt.test.type === NodeType.Literal) {
          const literal = ifStmt.test as Literal;
          if (literal.value) {
            // Condition is truthy, only consequent is reachable
            this.markReachableCode(ifStmt.consequent);
          } else if (ifStmt.alternate) {
            // Condition is falsy, only alternate is reachable
            this.markReachableCode(ifStmt.alternate);
          }
        } else {
          // Condition is not constant, both branches are potentially reachable
          this.markReachableCode(ifStmt.consequent);
          if (ifStmt.alternate) {
            this.markReachableCode(ifStmt.alternate);
          }
        }
        break;

      case NodeType.WhileStatement:
        if ('test' in node) {
          this.markReachableCode(node.test);
          // Check if condition is a constant false
          if (node.test.type === NodeType.Literal) {
            const literal = node.test as Literal;
            if (!literal.value) {
              // Loop never executes
              break;
            }
          }
          this.markReachableCode(node.body);
        }
        break;

      case NodeType.ForStatement:
        if ('init' in node && node.init) {
          this.markReachableCode(node.init);
        }
        if ('test' in node && node.test) {
          this.markReachableCode(node.test);
          // Check if condition is a constant false
          if (node.test.type === NodeType.Literal) {
            const literal = node.test as Literal;
            if (!literal.value) {
              // Loop never executes
              break;
            }
          }
        }
        if ('update' in node && node.update) {
          this.markReachableCode(node.update);
        }
        this.markReachableCode(node.body);
        break;

      default:
        // Mark all children as reachable
        this.markChildrenReachable(node);
        break;
    }
  }

  /**
   * Mark all children of a node as reachable
   */
  private markChildrenReachable(node: ASTNode): void {
    switch (node.type) {
      case NodeType.BinaryExpression:
        if ('left' in node) this.markReachableCode(node.left);
        if ('right' in node) this.markReachableCode(node.right);
        break;
      case NodeType.UnaryExpression:
        if ('operand' in node) this.markReachableCode(node.operand);
        break;
      case NodeType.ExpressionStatement:
        if ('expression' in node) this.markReachableCode(node.expression);
        break;
      case NodeType.VariableDeclaration:
        if ('init' in node && node.init) this.markReachableCode(node.init);
        break;
      case NodeType.AssignmentExpression:
        if ('left' in node) this.markReachableCode(node.left);
        if ('right' in node) this.markReachableCode(node.right);
        break;
      case NodeType.CallExpression:
        if ('callee' in node) this.markReachableCode(node.callee);
        if ('arguments' in node && Array.isArray(node.arguments)) {
          node.arguments.forEach(arg => this.markReachableCode(arg));
        }
        break;
      case NodeType.ReturnStatement:
        if ('argument' in node && node.argument) {
          this.markReachableCode(node.argument);
        }
        break;
    }
  }

  /**
   * Collect used variables
   */
  private collectUsedVariables(node: ASTNode): void {
    switch (node.type) {
      case NodeType.Identifier:
        if ('name' in node) {
          this.usedVariables.add(node.name as string);
        }
        break;
      default:
        this.collectUsedVariablesFromChildren(node);
        break;
    }
  }

  /**
   * Collect used variables from children
   */
  private collectUsedVariablesFromChildren(node: ASTNode): void {
    switch (node.type) {
      case NodeType.Program:
        if ('body' in node && Array.isArray(node.body)) {
          node.body.forEach(child => this.collectUsedVariables(child));
        }
        break;
      case NodeType.BlockStatement:
        if ('body' in node && Array.isArray(node.body)) {
          node.body.forEach(child => this.collectUsedVariables(child));
        }
        break;
      case NodeType.BinaryExpression:
        if ('left' in node) this.collectUsedVariables(node.left);
        if ('right' in node) this.collectUsedVariables(node.right);
        break;
      case NodeType.UnaryExpression:
        if ('operand' in node) this.collectUsedVariables(node.operand);
        break;
      case NodeType.ExpressionStatement:
        if ('expression' in node) this.collectUsedVariables(node.expression);
        break;
      case NodeType.VariableDeclaration:
        if ('init' in node && node.init) this.collectUsedVariables(node.init);
        break;
      case NodeType.AssignmentExpression:
        if ('left' in node) this.collectUsedVariables(node.left);
        if ('right' in node) this.collectUsedVariables(node.right);
        break;
      case NodeType.CallExpression:
        if ('callee' in node) this.collectUsedVariables(node.callee);
        if ('arguments' in node && Array.isArray(node.arguments)) {
          node.arguments.forEach(arg => this.collectUsedVariables(arg));
        }
        break;
      case NodeType.IfStatement:
        if ('test' in node) this.collectUsedVariables(node.test);
        if ('consequent' in node) this.collectUsedVariables(node.consequent);
        if ('alternate' in node && node.alternate) this.collectUsedVariables(node.alternate);
        break;
      case NodeType.WhileStatement:
        if ('test' in node) this.collectUsedVariables(node.test);
        if ('body' in node) this.collectUsedVariables(node.body);
        break;
      case NodeType.ForStatement:
        if ('init' in node && node.init) this.collectUsedVariables(node.init);
        if ('test' in node && node.test) this.collectUsedVariables(node.test);
        if ('update' in node && node.update) this.collectUsedVariables(node.update);
        if ('body' in node) this.collectUsedVariables(node.body);
        break;
      case NodeType.ReturnStatement:
        if ('argument' in node && node.argument) {
          this.collectUsedVariables(node.argument);
        }
        break;
    }
  }

  /**
   * Remove dead code from the AST
   */
  private removeDeadCode(node: ASTNode): ASTNode {
    if (!this.reachableNodes.has(node)) {
      // This node is unreachable, remove it
      return null as any; // Will be filtered out
    }

    const newNode = { ...node };

    switch (node.type) {
      case NodeType.Program:
        if ('body' in newNode && Array.isArray(newNode.body)) {
          newNode.body = this.filterDeadStatements(newNode.body);
        }
        break;

      case NodeType.BlockStatement:
        if ('body' in newNode && Array.isArray(newNode.body)) {
          newNode.body = this.filterDeadStatements(newNode.body);
        }
        break;

      case NodeType.IfStatement:
        const ifStmt = newNode as IfStatement;
        ifStmt.test = this.removeDeadCode(ifStmt.test);
        
        // Optimize constant conditions
        if (ifStmt.test.type === NodeType.Literal) {
          const literal = ifStmt.test as Literal;
          if (literal.value) {
            // Condition is always true, replace with consequent
            return this.removeDeadCode(ifStmt.consequent);
          } else {
            // Condition is always false, replace with alternate or remove
            return ifStmt.alternate ? this.removeDeadCode(ifStmt.alternate) : null as any;
          }
        }
        
        ifStmt.consequent = this.removeDeadCode(ifStmt.consequent);
        if (ifStmt.alternate) {
          ifStmt.alternate = this.removeDeadCode(ifStmt.alternate);
        }
        break;

      case NodeType.WhileStatement:
        if ('test' in newNode) {
          newNode.test = this.removeDeadCode(newNode.test);
          // Check for constant false condition
          if (newNode.test.type === NodeType.Literal) {
            const literal = newNode.test as Literal;
            if (!literal.value) {
              // Loop never executes, remove it
              return null as any;
            }
          }
        }
        if ('body' in newNode) {
          newNode.body = this.removeDeadCode(newNode.body);
        }
        break;

      case NodeType.VariableDeclaration:
        // Remove unused variable declarations
        if ('id' in newNode && 'name' in newNode.id && !this.usedVariables.has(newNode.id.name as string)) {
          // Variable is not used, but keep if it has side effects in initializer
          if ('init' in newNode && newNode.init && this.hasSideEffects(newNode.init)) {
            // Convert to expression statement
            return {
              type: NodeType.ExpressionStatement,
              expression: this.removeDeadCode(newNode.init)
            } as ASTNode;
          }
          return null as any; // Remove unused variable
        }
        if ('init' in newNode && newNode.init) {
          newNode.init = this.removeDeadCode(newNode.init);
        }
        break;

      default:
        // Process children
        this.removeDeadCodeFromChildren(newNode);
        break;
    }

    return newNode as ASTNode;
  }

  /**
   * Filter out dead statements from an array
   */
  private filterDeadStatements(statements: ASTNode[]): ASTNode[] {
    const result: ASTNode[] = [];
    
    for (const stmt of statements) {
      const processed = this.removeDeadCode(stmt);
      if (processed) {
        result.push(processed);
        // Stop processing after return statement
        if (stmt.type === NodeType.ReturnStatement) {
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * Remove dead code from children
   */
  private removeDeadCodeFromChildren(node: ASTNode): void {
    switch (node.type) {
      case NodeType.BinaryExpression:
        if ('left' in node) node.left = this.removeDeadCode(node.left);
        if ('right' in node) node.right = this.removeDeadCode(node.right);
        break;
      case NodeType.UnaryExpression:
        if ('operand' in node) node.operand = this.removeDeadCode(node.operand);
        break;
      case NodeType.ExpressionStatement:
        if ('expression' in node) node.expression = this.removeDeadCode(node.expression);
        break;
      case NodeType.AssignmentExpression:
        if ('left' in node) node.left = this.removeDeadCode(node.left);
        if ('right' in node) node.right = this.removeDeadCode(node.right);
        break;
      case NodeType.CallExpression:
        if ('callee' in node) node.callee = this.removeDeadCode(node.callee);
        if ('arguments' in node && Array.isArray(node.arguments)) {
          node.arguments = node.arguments.map(arg => this.removeDeadCode(arg)).filter(Boolean);
        }
        break;
      case NodeType.ReturnStatement:
        if ('argument' in node && node.argument) {
          node.argument = this.removeDeadCode(node.argument);
        }
        break;
    }
  }

  /**
   * Check if an expression has side effects
   */
  private hasSideEffects(node: ASTNode): boolean {
    switch (node.type) {
      case NodeType.CallExpression:
        return true; // Function calls may have side effects
      case NodeType.AssignmentExpression:
        return true; // Assignments have side effects
      case NodeType.BinaryExpression:
        if ('left' in node && 'right' in node) {
          return this.hasSideEffects(node.left) || this.hasSideEffects(node.right);
        }
        return false;
      case NodeType.UnaryExpression:
        if ('operand' in node) {
          return this.hasSideEffects(node.operand);
        }
        return false;
      case NodeType.Literal:
      case NodeType.Identifier:
        return false;
      default:
        return true; // Conservative approach
    }
  }

  /**
   * Apply dead code elimination to an entire AST
   */
  optimize(ast: ASTNode): ASTNode {
    // Reset state
    this.reachableNodes.clear();
    this.usedVariables.clear();
    
    return this.eliminate(ast);
  }
}

/**
 * Apply dead code elimination optimization to an AST
 */
export function applyDeadCodeElimination(ast: ASTNode): ASTNode {
  const eliminator = new DeadCodeEliminator();
  return eliminator.optimize(ast);
}