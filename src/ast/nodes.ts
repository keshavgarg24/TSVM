import {
  Program,
  Statement,
  Expression,
  VariableDeclaration,
  FunctionDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  ReturnStatement,
  BlockStatement,
  ExpressionStatement,
  BinaryExpression,
  CallExpression,
  Identifier,
  Literal,
  AssignmentExpression,
  SourceLocation,
  ASTNode,
  NodeType
} from '../types';

// Re-export types for convenience
export {
  Program,
  Statement,
  Expression,
  VariableDeclaration,
  FunctionDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  ReturnStatement,
  BlockStatement,
  ExpressionStatement,
  BinaryExpression,
  CallExpression,
  Identifier,
  Literal,
  AssignmentExpression,
  SourceLocation,
  ASTNode,
  NodeType
} from '../types';

// Factory functions for creating AST nodes

export function createProgram(body: Statement[], location: SourceLocation): Program {
  return {
    type: 'Program',
    body,
    location
  };
}

export function createVariableDeclaration(
  identifier: Identifier,
  initializer: Expression | undefined,
  location: SourceLocation
): VariableDeclaration {
  const node: VariableDeclaration = {
    type: 'VariableDeclaration',
    identifier,
    location
  };
  if (initializer !== undefined) {
    node.initializer = initializer;
  }
  return node;
}

export function createFunctionDeclaration(
  name: Identifier,
  parameters: Identifier[],
  body: BlockStatement,
  location: SourceLocation
): FunctionDeclaration {
  return {
    type: 'FunctionDeclaration',
    name,
    parameters,
    body,
    location
  };
}

export function createIfStatement(
  condition: Expression,
  consequent: Statement,
  alternate: Statement | undefined,
  location: SourceLocation
): IfStatement {
  const node: IfStatement = {
    type: 'IfStatement',
    condition,
    consequent,
    location
  };
  if (alternate !== undefined) {
    node.alternate = alternate;
  }
  return node;
}

export function createWhileStatement(
  condition: Expression,
  body: Statement,
  location: SourceLocation
): WhileStatement {
  return {
    type: 'WhileStatement',
    condition,
    body,
    location
  };
}

export function createForStatement(
  init: Expression | undefined,
  test: Expression | undefined,
  update: Expression | undefined,
  body: Statement,
  location: SourceLocation
): ForStatement {
  return {
    type: 'ForStatement',
    init,
    test,
    update,
    body,
    location
  };
}

export function createReturnStatement(
  argument: Expression | undefined,
  location: SourceLocation
): ReturnStatement {
  const node: ReturnStatement = {
    type: 'ReturnStatement',
    location
  };
  if (argument !== undefined) {
    node.argument = argument;
  }
  return node;
}

export function createBlockStatement(
  body: Statement[],
  location: SourceLocation
): BlockStatement {
  return {
    type: 'BlockStatement',
    body,
    location
  };
}

export function createExpressionStatement(
  expression: Expression,
  location: SourceLocation
): ExpressionStatement {
  return {
    type: 'ExpressionStatement',
    expression,
    location
  };
}

export function createBinaryExpression(
  left: Expression,
  operator: string,
  right: Expression,
  location: SourceLocation
): BinaryExpression {
  return {
    type: 'BinaryExpression',
    left,
    operator,
    right,
    location
  };
}

export function createCallExpression(
  callee: Expression,
  args: Expression[],
  location: SourceLocation
): CallExpression {
  return {
    type: 'CallExpression',
    callee,
    arguments: args,
    location
  };
}

export function createIdentifier(name: string, location: SourceLocation): Identifier {
  return {
    type: 'Identifier',
    name,
    location
  };
}

export function createLiteral(
  value: number | string | boolean,
  location: SourceLocation
): Literal {
  return {
    type: 'Literal',
    value,
    location
  };
}

export function createAssignmentExpression(
  left: Identifier,
  right: Expression,
  location: SourceLocation
): AssignmentExpression {
  return {
    type: 'AssignmentExpression',
    left,
    right,
    location
  };
}

// Visitor pattern for AST traversal

export interface ASTVisitor<T> {
  visitProgram(node: Program): T;
  visitVariableDeclaration(node: VariableDeclaration): T;
  visitFunctionDeclaration(node: FunctionDeclaration): T;
  visitIfStatement(node: IfStatement): T;
  visitWhileStatement(node: WhileStatement): T;
  visitForStatement(node: ForStatement): T;
  visitReturnStatement(node: ReturnStatement): T;
  visitBlockStatement(node: BlockStatement): T;
  visitExpressionStatement(node: ExpressionStatement): T;
  visitBinaryExpression(node: BinaryExpression): T;
  visitCallExpression(node: CallExpression): T;
  visitIdentifier(node: Identifier): T;
  visitLiteral(node: Literal): T;
  visitAssignmentExpression(node: AssignmentExpression): T;
  visit(node: ASTNode): T;
}

export abstract class BaseASTVisitor<T> implements ASTVisitor<T> {
  visit(node: ASTNode): T {
    switch (node.type) {
      case 'Program':
        return this.visitProgram(node as Program);
      case 'VariableDeclaration':
        return this.visitVariableDeclaration(node as VariableDeclaration);
      case 'FunctionDeclaration':
        return this.visitFunctionDeclaration(node as FunctionDeclaration);
      case 'IfStatement':
        return this.visitIfStatement(node as IfStatement);
      case 'WhileStatement':
        return this.visitWhileStatement(node as WhileStatement);
      case 'ForStatement':
        return this.visitForStatement(node as ForStatement);
      case 'ReturnStatement':
        return this.visitReturnStatement(node as ReturnStatement);
      case 'BlockStatement':
        return this.visitBlockStatement(node as BlockStatement);
      case 'ExpressionStatement':
        return this.visitExpressionStatement(node as ExpressionStatement);
      case 'BinaryExpression':
        return this.visitBinaryExpression(node as BinaryExpression);
      case 'CallExpression':
        return this.visitCallExpression(node as CallExpression);
      case 'Identifier':
        return this.visitIdentifier(node as Identifier);
      case 'Literal':
        return this.visitLiteral(node as Literal);
      case 'AssignmentExpression':
        return this.visitAssignmentExpression(node as AssignmentExpression);
      default:
        throw new Error(`Unknown AST node type: ${(node as any).type}`);
    }
  }

  abstract visitProgram(node: Program): T;
  abstract visitVariableDeclaration(node: VariableDeclaration): T;
  abstract visitFunctionDeclaration(node: FunctionDeclaration): T;
  abstract visitIfStatement(node: IfStatement): T;
  abstract visitWhileStatement(node: WhileStatement): T;
  abstract visitForStatement(node: ForStatement): T;
  abstract visitReturnStatement(node: ReturnStatement): T;
  abstract visitBlockStatement(node: BlockStatement): T;
  abstract visitExpressionStatement(node: ExpressionStatement): T;
  abstract visitBinaryExpression(node: BinaryExpression): T;
  abstract visitCallExpression(node: CallExpression): T;
  abstract visitIdentifier(node: Identifier): T;
  abstract visitLiteral(node: Literal): T;
  abstract visitAssignmentExpression(node: AssignmentExpression): T;
}

// Utility functions for AST manipulation

export function cloneNode<T extends ASTNode>(node: T): T {
  return JSON.parse(JSON.stringify(node));
}

export function getNodeChildren(node: ASTNode): ASTNode[] {
  const children: ASTNode[] = [];

  switch (node.type) {
    case 'Program':
      children.push(...(node as Program).body);
      break;
    case 'VariableDeclaration':
      const varDecl = node as VariableDeclaration;
      children.push(varDecl.identifier);
      if (varDecl.initializer) {
        children.push(varDecl.initializer);
      }
      break;
    case 'FunctionDeclaration':
      const funcDecl = node as FunctionDeclaration;
      children.push(funcDecl.name);
      children.push(...funcDecl.parameters);
      children.push(funcDecl.body);
      break;
    case 'IfStatement':
      const ifStmt = node as IfStatement;
      children.push(ifStmt.condition);
      children.push(ifStmt.consequent);
      if (ifStmt.alternate) {
        children.push(ifStmt.alternate);
      }
      break;
    case 'WhileStatement':
      const whileStmt = node as WhileStatement;
      children.push(whileStmt.condition);
      children.push(whileStmt.body);
      break;
    case 'ForStatement':
      const forStmt = node as ForStatement;
      if (forStmt.init) children.push(forStmt.init);
      if (forStmt.test) children.push(forStmt.test);
      if (forStmt.update) children.push(forStmt.update);
      children.push(forStmt.body);
      break;
    case 'ReturnStatement':
      const returnStmt = node as ReturnStatement;
      if (returnStmt.argument) {
        children.push(returnStmt.argument);
      }
      break;
    case 'BlockStatement':
      children.push(...(node as BlockStatement).body);
      break;
    case 'ExpressionStatement':
      children.push((node as ExpressionStatement).expression);
      break;
    case 'BinaryExpression':
      const binExpr = node as BinaryExpression;
      children.push(binExpr.left);
      children.push(binExpr.right);
      break;
    case 'CallExpression':
      const callExpr = node as CallExpression;
      children.push(callExpr.callee);
      children.push(...callExpr.arguments);
      break;
    case 'AssignmentExpression':
      const assignExpr = node as AssignmentExpression;
      children.push(assignExpr.left);
      children.push(assignExpr.right);
      break;
    // Leaf nodes have no children
    case 'Identifier':
    case 'Literal':
      break;
  }

  return children;
}

export function walkAST(node: ASTNode, callback: (node: ASTNode) => void): void {
  callback(node);
  const children = getNodeChildren(node);
  for (const child of children) {
    walkAST(child, callback);
  }
}