import {
  createProgram,
  createVariableDeclaration,
  createFunctionDeclaration,
  createBinaryExpression,
  createLiteral,
  createIdentifier,
  createBlockStatement,
  ASTVisitor,
} from "../nodes";
import { SourceLocation } from "../../types";

describe("AST Nodes", () => {
  const mockLocation: SourceLocation = { line: 1, column: 1 };

  describe("Node Creation", () => {
    it("should create Program node", () => {
      const program = createProgram([], mockLocation);

      expect(program.type).toBe("Program");
      expect(program.body).toEqual([]);
      expect(program.location).toEqual(mockLocation);
    });

    it("should create Literal node", () => {
      const literal = createLiteral(42, mockLocation);

      expect(literal.type).toBe("Literal");
      expect(literal.value).toBe(42);
      expect(literal.location).toEqual(mockLocation);
    });

    it("should create Identifier node", () => {
      const identifier = createIdentifier("variable", mockLocation);

      expect(identifier.type).toBe("Identifier");
      expect(identifier.name).toBe("variable");
      expect(identifier.location).toEqual(mockLocation);
    });

    it("should create BinaryExpression node", () => {
      const left = createLiteral(1, mockLocation);
      const right = createLiteral(2, mockLocation);
      const binary = createBinaryExpression(left, "+", right, mockLocation);

      expect(binary.type).toBe("BinaryExpression");
      expect(binary.operator).toBe("+");
      expect(binary.left).toEqual(left);
      expect(binary.right).toEqual(right);
      expect(binary.location).toEqual(mockLocation);
    });

    it("should create VariableDeclaration node", () => {
      const identifier = createIdentifier("x", mockLocation);
      const initializer = createLiteral(42, mockLocation);
      const varDecl = createVariableDeclaration(
        identifier,
        initializer,
        mockLocation
      );

      expect(varDecl.type).toBe("VariableDeclaration");
      expect(varDecl.identifier).toEqual(identifier);
      expect(varDecl.initializer).toEqual(initializer);
      expect(varDecl.location).toEqual(mockLocation);
    });

    it("should create VariableDeclaration without initializer", () => {
      const identifier = createIdentifier("x", mockLocation);
      const varDecl = createVariableDeclaration(
        identifier,
        undefined,
        mockLocation
      );

      expect(varDecl.type).toBe("VariableDeclaration");
      expect(varDecl.identifier).toEqual(identifier);
      expect(varDecl.initializer).toBeUndefined();
    });

    it("should create FunctionDeclaration node", () => {
      const name = createIdentifier("add", mockLocation);
      const param1 = createIdentifier("a", mockLocation);
      const param2 = createIdentifier("b", mockLocation);
      const body = createBlockStatement([], mockLocation);

      const funcDecl = createFunctionDeclaration(
        name,
        [param1, param2],
        body,
        mockLocation
      );

      expect(funcDecl.type).toBe("FunctionDeclaration");
      expect(funcDecl.name).toEqual(name);
      expect(funcDecl.parameters).toEqual([param1, param2]);
      expect(funcDecl.body).toEqual(body);
      expect(funcDecl.location).toEqual(mockLocation);
    });

    it("should create BlockStatement node", () => {
      const stmt1 = createVariableDeclaration(
        createIdentifier("x", mockLocation),
        createLiteral(1, mockLocation),
        mockLocation
      );
      const block = createBlockStatement([stmt1], mockLocation);

      expect(block.type).toBe("BlockStatement");
      expect(block.body).toEqual([stmt1]);
      expect(block.location).toEqual(mockLocation);
    });
  });

  describe("Node Relationships", () => {
    it("should maintain parent-child relationships in complex expressions", () => {
      const left = createBinaryExpression(
        createLiteral(1, mockLocation),
        "+",
        createLiteral(2, mockLocation),
        mockLocation
      );
      const right = createLiteral(3, mockLocation);
      const complex = createBinaryExpression(left, "*", right, mockLocation);

      expect(complex.left.type).toBe("BinaryExpression");
      expect(complex.right.type).toBe("Literal");
      expect((complex.left as any).operator).toBe("+");
    });

    it("should handle nested function declarations", () => {
      const innerFunc = createFunctionDeclaration(
        createIdentifier("inner", mockLocation),
        [],
        createBlockStatement([], mockLocation),
        mockLocation
      );

      const outerBody = createBlockStatement([innerFunc], mockLocation);
      const outerFunc = createFunctionDeclaration(
        createIdentifier("outer", mockLocation),
        [],
        outerBody,
        mockLocation
      );

      expect(outerFunc.body.body).toHaveLength(1);
      expect(outerFunc.body.body[0]?.type).toBe("FunctionDeclaration");
    });
  });

  describe("AST Visitor Pattern", () => {
    class TestVisitor implements ASTVisitor<string> {
      visitProgram(node: any): string {
        return `Program(${node.body
          .map((stmt: any) => this.visit(stmt))
          .join(", ")})`;
      }

      visitLiteral(node: any): string {
        return `Literal(${node.value})`;
      }

      visitIdentifier(node: any): string {
        return `Identifier(${node.name})`;
      }

      visitBinaryExpression(node: any): string {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        return `Binary(${left} ${node.operator} ${right})`;
      }

      visitVariableDeclaration(node: any): string {
        const id = this.visit(node.identifier);
        const init = node.initializer
          ? this.visit(node.initializer)
          : "undefined";
        return `VarDecl(${id} = ${init})`;
      }

      visitFunctionDeclaration(node: any): string {
        const name = this.visit(node.name);
        const params = node.parameters
          .map((p: any) => this.visit(p))
          .join(", ");
        const body = this.visit(node.body);
        return `FuncDecl(${name}(${params}) ${body})`;
      }

      visitBlockStatement(node: any): string {
        const stmts = node.body.map((stmt: any) => this.visit(stmt)).join("; ");
        return `Block(${stmts})`;
      }

      visitIfStatement(node: any): string {
        return `If(${this.visit(node.condition)})`;
      }

      visitWhileStatement(node: any): string {
        return `While(${this.visit(node.condition)})`;
      }

      visitReturnStatement(node: any): string {
        return `Return(${node.argument ? this.visit(node.argument) : "void"})`;
      }

      visitExpressionStatement(node: any): string {
        return `ExprStmt(${this.visit(node.expression)})`;
      }

      visitCallExpression(node: any): string {
        const callee = this.visit(node.callee);
        const args = node.arguments
          .map((arg: any) => this.visit(arg))
          .join(", ");
        return `Call(${callee}(${args}))`;
      }

      visitAssignmentExpression(node: any): string {
        return `Assign(${this.visit(node.left)} = ${this.visit(node.right)})`;
      }

      visit(node: any): string {
        switch (node.type) {
          case "Program":
            return this.visitProgram(node);
          case "Literal":
            return this.visitLiteral(node);
          case "Identifier":
            return this.visitIdentifier(node);
          case "BinaryExpression":
            return this.visitBinaryExpression(node);
          case "VariableDeclaration":
            return this.visitVariableDeclaration(node);
          case "FunctionDeclaration":
            return this.visitFunctionDeclaration(node);
          case "BlockStatement":
            return this.visitBlockStatement(node);
          case "IfStatement":
            return this.visitIfStatement(node);
          case "WhileStatement":
            return this.visitWhileStatement(node);
          case "ReturnStatement":
            return this.visitReturnStatement(node);
          case "ExpressionStatement":
            return this.visitExpressionStatement(node);
          case "CallExpression":
            return this.visitCallExpression(node);
          case "AssignmentExpression":
            return this.visitAssignmentExpression(node);
          default:
            throw new Error(`Unknown node type: ${node.type}`);
        }
      }
    }

    it("should traverse simple expressions", () => {
      const expr = createBinaryExpression(
        createLiteral(1, mockLocation),
        "+",
        createLiteral(2, mockLocation),
        mockLocation
      );

      const visitor = new TestVisitor();
      const result = visitor.visit(expr);

      expect(result).toBe("Binary(Literal(1) + Literal(2))");
    });

    it("should traverse variable declarations", () => {
      const varDecl = createVariableDeclaration(
        createIdentifier("x", mockLocation),
        createLiteral(42, mockLocation),
        mockLocation
      );

      const visitor = new TestVisitor();
      const result = visitor.visit(varDecl);

      expect(result).toBe("VarDecl(Identifier(x) = Literal(42))");
    });

    it("should traverse complete programs", () => {
      const varDecl = createVariableDeclaration(
        createIdentifier("x", mockLocation),
        createLiteral(42, mockLocation),
        mockLocation
      );
      const program = createProgram([varDecl], mockLocation);

      const visitor = new TestVisitor();
      const result = visitor.visit(program);

      expect(result).toBe("Program(VarDecl(Identifier(x) = Literal(42)))");
    });
  });
});
