import {
  Token,
  TokenType,
  Program,
  Statement,
  Expression,
  BinaryExpression,
  Literal,
  Identifier,
  ExpressionStatement,
  VariableDeclaration,
  AssignmentExpression,
  FunctionDeclaration,
  BlockStatement,
  ReturnStatement,
  CallExpression,
  IfStatement,
  WhileStatement,
  SourceLocation
} from '../types';
import { Parser as ParserInterface } from '../interfaces';
import { ErrorReporter } from '../utils/errors';
import {
  createProgram,
  createBinaryExpression,
  createLiteral,
  createIdentifier,
  createExpressionStatement,
  createVariableDeclaration,
  createAssignmentExpression,
  createFunctionDeclaration,
  createBlockStatement,
  createReturnStatement,
  createCallExpression,
  createIfStatement,
  createWhileStatement
} from '../ast/nodes';

export class Parser implements ParserInterface {
  private tokens: Token[] = [];
  private current = 0;
  private errorReporter = new ErrorReporter();

  parse(tokens: Token[]): Program {
    this.tokens = tokens;
    this.current = 0;
    this.errorReporter.reset();

    const statements: Statement[] = [];
    
    while (!this.isAtEnd()) {
      try {
        const stmt = this.statement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (error) {
        // Error recovery: synchronize to next statement
        this.synchronize();
      }
    }

    return createProgram(statements, { line: 1, column: 1 });
  }

  private statement(): Statement | null {
    if (this.match(TokenType.FUNCTION)) {
      return this.functionDeclaration();
    }

    if (this.match(TokenType.LET)) {
      return this.variableDeclaration();
    }

    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }

    if (this.match(TokenType.RETURN)) {
      return this.returnStatement();
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      return this.blockStatement();
    }

    // Expression statement
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after expression");
    return createExpressionStatement(expr, expr.location);
  }

  private variableDeclaration(): VariableDeclaration {
    const nameToken = this.consume(TokenType.IDENTIFIER, "Expected variable name");
    const identifier = createIdentifier(nameToken.value, nameToken.location);

    let initializer: Expression | undefined = undefined;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");
    return createVariableDeclaration(identifier, initializer, nameToken.location);
  }

  private functionDeclaration(): FunctionDeclaration {
    const nameToken = this.consume(TokenType.IDENTIFIER, "Expected function name");
    const name = createIdentifier(nameToken.value, nameToken.location);

    this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");
    
    const parameters: Identifier[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const paramToken = this.consume(TokenType.IDENTIFIER, "Expected parameter name");
        parameters.push(createIdentifier(paramToken.value, paramToken.location));
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
    
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before function body");
    const body = this.blockStatement();
    
    return createFunctionDeclaration(name, parameters, body, nameToken.location);
  }

  private blockStatement(): BlockStatement {
    const statements: Statement[] = [];
    
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block");
    return createBlockStatement(statements, this.previous().location);
  }

  private returnStatement(): ReturnStatement {
    const keyword = this.previous();
    
    let value: Expression | undefined = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }
    
    this.consume(TokenType.SEMICOLON, "Expected ';' after return value");
    return createReturnStatement(value, keyword.location);
  }

  private ifStatement(): IfStatement {
    const keyword = this.previous();
    
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition");
    
    const consequent = this.statement();
    if (!consequent) {
      throw new Error("Expected statement after if condition");
    }
    
    let alternate: Statement | undefined = undefined;
    if (this.match(TokenType.ELSE)) {
      const elseStmt = this.statement();
      if (elseStmt) {
        alternate = elseStmt;
      }
    }
    
    return createIfStatement(condition, consequent, alternate, keyword.location);
  }

  private whileStatement(): WhileStatement {
    const keyword = this.previous();
    
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after while condition");
    
    const body = this.statement();
    if (!body) {
      throw new Error("Expected statement after while condition");
    }
    
    return createWhileStatement(condition, body, keyword.location);
  }

  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expr = this.logicalOr();

    if (this.match(TokenType.ASSIGN)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr.type === 'Identifier') {
        const name = expr as Identifier;
        return createAssignmentExpression(name, value, name.location);
      }

      this.errorReporter.reportParseError(
        "Invalid assignment target",
        "identifier",
        equals
      );
    }

    return expr;
  }

  private logicalOr(): Expression {
    let expr = this.logicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = createBinaryExpression(expr, operator, right, expr.location);
    }

    return expr;
  }

  private logicalAnd(): Expression {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous().value;
      const right = this.equality();
      expr = createBinaryExpression(expr, operator, right, expr.location);
    }

    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = createBinaryExpression(expr, operator, right, expr.location);
    }

    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();

    while (this.match(TokenType.GREATER_THAN, TokenType.GREATER_EQUAL, TokenType.LESS_THAN, TokenType.LESS_EQUAL)) {
      const operator = this.previous().value;
      const right = this.term();
      expr = createBinaryExpression(expr, operator, right, expr.location);
    }

    return expr;
  }

  private term(): Expression {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = createBinaryExpression(expr, operator, right, expr.location);
    }

    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();

    while (this.match(TokenType.DIVIDE, TokenType.MULTIPLY, TokenType.MODULO)) {
      const operator = this.previous().value;
      const right = this.unary();
      expr = createBinaryExpression(expr, operator, right, expr.location);
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.unary();
      return createBinaryExpression(
        createLiteral(0, this.previous().location),
        operator,
        right,
        this.previous().location
      );
    }

    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.TRUE)) {
      return createLiteral(true, this.previous().location);
    }

    if (this.match(TokenType.FALSE)) {
      return createLiteral(false, this.previous().location);
    }

    if (this.match(TokenType.NUMBER)) {
      const token = this.previous();
      const value = parseFloat(token.value);
      return createLiteral(value, token.location);
    }

    if (this.match(TokenType.STRING)) {
      const token = this.previous();
      return createLiteral(token.value, token.location);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      let expr: Expression = createIdentifier(token.value, token.location);
      
      // Handle function calls
      while (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      }
      
      return expr;
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }

    // Error case
    const current = this.peek();
    this.errorReporter.reportParseError(
      "Unexpected token in expression",
      "expression",
      current
    );
    
    // Return a dummy literal to continue parsing
    return createLiteral(0, current.location);
  }

  private finishCall(callee: Expression): CallExpression {
    const args: Expression[] = [];
    
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
    return createCallExpression(callee, args, callee.location);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current] || { 
      type: TokenType.EOF, 
      value: '', 
      location: { line: 1, column: 1 } 
    };
  }

  private previous(): Token {
    return this.tokens[this.current - 1] || { 
      type: TokenType.EOF, 
      value: '', 
      location: { line: 1, column: 1 } 
    };
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const current = this.peek();
    this.errorReporter.reportParseError(message, type, current);
    
    // Return current token to continue parsing
    return current;
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.FUNCTION:
        case TokenType.LET:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}