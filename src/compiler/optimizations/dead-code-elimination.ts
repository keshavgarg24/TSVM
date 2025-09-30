import { 
  ASTNode, 
  NodeType,
  IfStatement, 
  WhileStatement,
  VariableDeclaration,
  Literal, 
  BlockStatement, 
  Program,
  Statement,
  Expression,
  ForStatement
} from '../../ast/nodes';

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
        this.markReachableCode(ifStmt.condition);
        
        // Check if condition is a constant
        if (ifStmt.condition.type === NodeType.Literal) {
          const literal = ifStmt.condition as Literal;
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
        const whileStmt = node as WhileStatement;
        this.markReachableCode(whileStmt.condition);
        // Check if condition is a constant false
        if (whileStmt.condition.type === NodeType.Literal) {
          const literal = whileStmt.condition as Literal;
          if (!literal.value) {
            // Loop never executes
            break;
          }
        }
        this.markReachableCode(whileStmt.body);
        break;

      case NodeType.ForStatement:
        const forStmt = node as ForStatement;
        if (forStmt.init) {
          this.markReachableCode(forStmt.init);
        }
        if (forStmt.test) {
          this.markReachableCode(forStmt.test);
          // Check if condition is a constant false
          if (forStmt.test.type === NodeType.Literal) {
            const literal = forStmt.test as Literal;
            if (!literal.value) {
              // Loop never executes
              break;
            }
          }
        }
        if (forStmt.update) {
          this.markReachableCode(forStmt.update);
        }
        this.markReachableCode(forStmt.body);
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
        if ('left' in node) this.markReachableCode(node.left as Expression);
        if ('right' in node) this.markReachableCode(node.right as Expression);
        break;
      case NodeType.UnaryExpression:
        if ('operand' in node) this.markReachableCode(node.operand as Expression);
        break;
      case NodeType.ExpressionStatement:
        if ('expression' in node) this.markReachableCode(node.expression as Expression);
        break;
      case NodeType.VariableDeclaration:
        if ('initializer' in node && node.initializer) this.markReachableCode(node.initializer as Expression);
        break;
      case NodeType.AssignmentExpression:
        if ('left' in node) this.markReachableCode(node.left as Expression);
        if ('right' in node) this.markReachableCode(node.right as Expression);
        break;
      case NodeType.CallExpression:
        if ('callee' in node) this.markReachableCode(node.callee as Expression);
        if ('arguments' in node && Array.isArray(node.arguments)) {
          node.arguments.forEach((arg: Expression) => this.markReachableCode(arg));
        }
        break;
      case NodeType.ReturnStatement:
        if ('argument' in node && node.argument) {
          this.markReachableCode(node.argument as Expression);
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
          node.body.forEach((child: Statement) => this.collectUsedVariables(child));
        }
        break;
      case NodeType.BlockStatement:
        if ('body' in node && Array.isArray(node.body)) {
          node.body.forEach((child: Statement) => this.collectUsedVariables(child));
        }
        break;
      case NodeType.BinaryExpression:
        if ('left' in node) this.collectUsedVariables(node.left as Expression);
        if ('right' in node) this.collectUsedVariables(node.right as Expression);
        break;
      case NodeType.UnaryExpression:
        if ('operand' in node) this.collectUsedVariables(node.operand as Expression);
        break;
      case NodeType.ExpressionStatement:
        if ('expression' in node) this.collectUsedVariables(node.expression as Expression);
        break;
      case NodeType.VariableDeclaration:
        if ('initializer' in node && node.initializer) this.collectUsedVariables(node.initializer as Expression);
        break;
      case NodeType.AssignmentExpression:
        if ('left' in node) this.collectUsedVariables(node.left as Expression);
        if ('right' in node) this.collectUsedVariables(node.right as Expression);
        break;
      case NodeType.CallExpression:
        if ('callee' in node) this.collectUsedVariables(node.callee as Expression);
        if ('arguments' in node && Array.isArray(node.arguments)) {
          node.arguments.forEach((arg: Expression) => this.collectUsedVariables(arg));
        }
        break;
      case NodeType.IfStatement:
        if ('condition' in node) this.collectUsedVariables(node.condition as Expression);
        if ('consequent' in node) this.collectUsedVariables(node.consequent as Statement);
        if ('alternate' in node && node.alternate) this.collectUsedVariables(node.alternate as Statement);
        break;
      case NodeType.WhileStatement:
        if ('condition' in node) this.collectUsedVariables(node.condition as Expression);
        if ('body' in node) this.collectUsedVariables(node.body as Statement);
        break;
      case NodeType.ForStatement:
        const forStmt = node as ForStatement;
        if (forStmt.init) this.collectUsedVariables(forStmt.init);
        if (forStmt.test) this.collectUsedVariables(forStmt.test);
        if (forStmt.update) this.collectUsedVariables(forStmt.update);
        this.collectUsedVariables(forStmt.body);
        break;
      case NodeType.ReturnStatement:
        if ('argument' in node && node.argument) {
          this.collectUsedVariables(node.argument as Expression);
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
        ifStmt.condition = this.removeDeadCode(ifStmt.condition);
        
        // Optimize constant conditions
        if (ifStmt.condition.type === NodeType.Literal) {
          const literal = ifStmt.condition as Literal;
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
        const whileStmt = newNode as WhileStatement;
        whileStmt.condition = this.removeDeadCode(whileStmt.condition) as Expression;
        // Check for constant false condition
        if (whileStmt.condition.type === NodeType.Literal) {
          const literal = whileStmt.condition as Literal;
          if (!literal.value) {
            // Loop never executes, remove it
            return null as any;
          }
        }
        whileStmt.body = this.removeDeadCode(whileStmt.body) as Statement;
        break;

      case NodeType.ForStatement:
        const forStmt = newNode as ForStatement;
        if (forStmt.init) {
          forStmt.init = this.removeDeadCode(forStmt.init);
        }
        if (forStmt.test) {
          forStmt.test = this.removeDeadCode(forStmt.test);
          // Check for constant false condition
          if (forStmt.test.type === NodeType.Literal) {
            const literal = forStmt.test as Literal;
            if (!literal.value) {
              // Loop never executes, remove it
              return null as any;
            }
          }
        }
        if (forStmt.update) {
          forStmt.update = this.removeDeadCode(forStmt.update);
        }
        forStmt.body = this.removeDeadCode(forStmt.body);
        break;

      case NodeType.VariableDeclaration:
        const varDecl = newNode as VariableDeclaration;
        // Remove unused variable declarations
        if (!this.usedVariables.has(varDecl.identifier.name)) {
          // Variable is not used, but keep if it has side effects in initializer
          if (varDecl.initializer && this.hasSideEffects(varDecl.initializer)) {
            // Convert to expression statement
            return {
              type: NodeType.ExpressionStatement,
              expression: this.removeDeadCode(varDecl.initializer) as Expression,
              location: varDecl.location
            } as ASTNode;
          }
          return null as any; // Remove unused variable
        }
        if (varDecl.initializer) {
          varDecl.initializer = this.removeDeadCode(varDecl.initializer) as Expression;
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
        if ('left' in node) node.left = this.removeDeadCode(node.left as Expression) as Expression;
        if ('right' in node) node.right = this.removeDeadCode(node.right as Expression) as Expression;
        break;
      case NodeType.UnaryExpression:
        if ('operand' in node) node.operand = this.removeDeadCode(node.operand as Expression) as Expression;
        break;
      case NodeType.ExpressionStatement:
        if ('expression' in node) node.expression = this.removeDeadCode(node.expression as Expression) as Expression;
        break;
      case NodeType.AssignmentExpression:
        if ('left' in node) node.left = this.removeDeadCode(node.left as Expression) as Expression;
        if ('right' in node) node.right = this.removeDeadCode(node.right as Expression) as Expression;
        break;
      case NodeType.CallExpression:
        if ('callee' in node) node.callee = this.removeDeadCode(node.callee as Expression) as Expression;
        if ('arguments' in node && Array.isArray(node.arguments)) {
          node.arguments = node.arguments.map((arg: Expression) => this.removeDeadCode(arg) as Expression).filter(Boolean);
        }
        break;
      case NodeType.ReturnStatement:
        if ('argument' in node && node.argument) {
          node.argument = this.removeDeadCode(node.argument as Expression) as Expression;
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
          return this.hasSideEffects(node.left as Expression) || this.hasSideEffects(node.right as Expression);
        }
        return false;
      case NodeType.UnaryExpression:
        if ('operand' in node) {
          return this.hasSideEffects(node.operand as Expression);
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