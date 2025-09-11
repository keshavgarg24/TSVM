import { CodeGenerator } from '../code-generator';
import { SymbolTable } from '../symbol-table';
import { 
  createLiteral, 
  createIdentifier, 
  createBinaryExpression,
  createVariableDeclaration,
  createAssignmentExpression,
  createProgram,
  createExpressionStatement
} from '../../ast/nodes';
import { OpCode } from '../../types';

describe('Code Generator - Expressions', () => {
  let codeGen: CodeGenerator;
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
    codeGen = new CodeGenerator(symbolTable);
  });

  describe('Literal Expressions', () => {
    it('should compile number literals', () => {
      const literal = createLiteral(42, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(literal, literal.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(2); // PUSH + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(42);
      expect(instructions[1]?.opcode).toBe(OpCode.HALT);
    });

    it('should compile string literals', () => {
      const literal = createLiteral('hello', { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(literal, literal.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(2);
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe('hello');
    });

    it('should compile boolean literals', () => {
      const trueLiteral = createLiteral(true, { line: 1, column: 1 });
      const falseLiteral = createLiteral(false, { line: 1, column: 5 });
      const program = createProgram([
        createExpressionStatement(trueLiteral, trueLiteral.location),
        createExpressionStatement(falseLiteral, falseLiteral.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(3); // PUSH true + PUSH false + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(true);
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(false);
    });

    it('should compile floating point numbers', () => {
      const literal = createLiteral(3.14, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(literal, literal.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[0]?.operand).toBe(3.14);
    });
  });

  describe('Variable Expressions', () => {
    it('should compile variable declarations', () => {
      const identifier = createIdentifier('x', { line: 1, column: 5 });
      const initializer = createLiteral(42, { line: 1, column: 9 });
      const varDecl = createVariableDeclaration(identifier, initializer, { line: 1, column: 1 });
      const program = createProgram([varDecl], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(3); // PUSH + STORE + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(42);
      expect(instructions[1]?.opcode).toBe(OpCode.STORE);
      expect(instructions[1]?.operand).toBe('x');
    });

    it('should compile variable access', () => {
      // First declare the variable
      symbolTable.declare('x', 'number');
      
      const identifier = createIdentifier('x', { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(identifier, identifier.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(2); // LOAD + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.LOAD);
      expect(instructions[0]?.operand).toBe('x');
    });

    it('should compile variable assignment', () => {
      symbolTable.declare('x', 'number');
      
      const identifier = createIdentifier('x', { line: 1, column: 1 });
      const value = createLiteral(100, { line: 1, column: 5 });
      const assignment = createAssignmentExpression(identifier, value, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(assignment, assignment.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(3); // PUSH + STORE + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(100);
      expect(instructions[1]?.opcode).toBe(OpCode.STORE);
      expect(instructions[1]?.operand).toBe('x');
    });

    it('should handle variable declaration without initializer', () => {
      const identifier = createIdentifier('y', { line: 1, column: 5 });
      const varDecl = createVariableDeclaration(identifier, undefined, { line: 1, column: 1 });
      const program = createProgram([varDecl], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(3); // PUSH 0 + STORE + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(0);
      expect(instructions[1]?.opcode).toBe(OpCode.STORE);
      expect(instructions[1]?.operand).toBe('y');
    });
  });

  describe('Binary Expressions', () => {
    it('should compile addition', () => {
      const left = createLiteral(5, { line: 1, column: 1 });
      const right = createLiteral(3, { line: 1, column: 5 });
      const binary = createBinaryExpression(left, '+', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(4); // PUSH 5 + PUSH 3 + ADD + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(5);
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(3);
      expect(instructions[2]?.opcode).toBe(OpCode.ADD);
    });

    it('should compile subtraction', () => {
      const left = createLiteral(10, { line: 1, column: 1 });
      const right = createLiteral(4, { line: 1, column: 6 });
      const binary = createBinaryExpression(left, '-', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.SUB);
    });

    it('should compile multiplication', () => {
      const left = createLiteral(6, { line: 1, column: 1 });
      const right = createLiteral(7, { line: 1, column: 5 });
      const binary = createBinaryExpression(left, '*', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.MUL);
    });

    it('should compile division', () => {
      const left = createLiteral(20, { line: 1, column: 1 });
      const right = createLiteral(4, { line: 1, column: 6 });
      const binary = createBinaryExpression(left, '/', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.DIV);
    });

    it('should compile modulo', () => {
      const left = createLiteral(17, { line: 1, column: 1 });
      const right = createLiteral(5, { line: 1, column: 6 });
      const binary = createBinaryExpression(left, '%', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.MOD);
    });
  });

  describe('Comparison Expressions', () => {
    it('should compile equality comparison', () => {
      const left = createLiteral(5, { line: 1, column: 1 });
      const right = createLiteral(5, { line: 1, column: 6 });
      const binary = createBinaryExpression(left, '==', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.EQ);
    });

    it('should compile inequality comparison', () => {
      const left = createLiteral(5, { line: 1, column: 1 });
      const right = createLiteral(3, { line: 1, column: 6 });
      const binary = createBinaryExpression(left, '!=', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.NE);
    });

    it('should compile less than comparison', () => {
      const left = createLiteral(3, { line: 1, column: 1 });
      const right = createLiteral(5, { line: 1, column: 5 });
      const binary = createBinaryExpression(left, '<', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.LT);
    });

    it('should compile greater than comparison', () => {
      const left = createLiteral(8, { line: 1, column: 1 });
      const right = createLiteral(3, { line: 1, column: 5 });
      const binary = createBinaryExpression(left, '>', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.GT);
    });

    it('should compile less than or equal comparison', () => {
      const left = createLiteral(5, { line: 1, column: 1 });
      const right = createLiteral(5, { line: 1, column: 6 });
      const binary = createBinaryExpression(left, '<=', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.LE);
    });

    it('should compile greater than or equal comparison', () => {
      const left = createLiteral(7, { line: 1, column: 1 });
      const right = createLiteral(3, { line: 1, column: 5 });
      const binary = createBinaryExpression(left, '>=', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[2]?.opcode).toBe(OpCode.GE);
    });
  });

  describe('Complex Expressions', () => {
    it('should compile nested binary expressions', () => {
      // (5 + 3) * 2
      const innerLeft = createLiteral(5, { line: 1, column: 2 });
      const innerRight = createLiteral(3, { line: 1, column: 6 });
      const innerBinary = createBinaryExpression(innerLeft, '+', innerRight, { line: 1, column: 1 });
      
      const outerRight = createLiteral(2, { line: 1, column: 11 });
      const outerBinary = createBinaryExpression(innerBinary, '*', outerRight, { line: 1, column: 1 });
      
      const program = createProgram([
        createExpressionStatement(outerBinary, outerBinary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(6); // PUSH 5 + PUSH 3 + ADD + PUSH 2 + MUL + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(5);
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(3);
      expect(instructions[2]?.opcode).toBe(OpCode.ADD);
      expect(instructions[3]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[3]?.operand).toBe(2);
      expect(instructions[4]?.opcode).toBe(OpCode.MUL);
    });

    it('should compile expressions with variables', () => {
      symbolTable.declare('x', 'number');
      symbolTable.declare('y', 'number');
      
      // x + y * 2
      const x = createIdentifier('x', { line: 1, column: 1 });
      const y = createIdentifier('y', { line: 1, column: 5 });
      const two = createLiteral(2, { line: 1, column: 9 });
      
      const multiply = createBinaryExpression(y, '*', two, { line: 1, column: 5 });
      const add = createBinaryExpression(x, '+', multiply, { line: 1, column: 1 });
      
      const program = createProgram([
        createExpressionStatement(add, add.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(6); // LOAD x + LOAD y + PUSH 2 + MUL + ADD + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.LOAD);
      expect(instructions[0]?.operand).toBe('x');
      expect(instructions[1]?.opcode).toBe(OpCode.LOAD);
      expect(instructions[1]?.operand).toBe('y');
      expect(instructions[2]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[2]?.operand).toBe(2);
      expect(instructions[3]?.opcode).toBe(OpCode.MUL);
      expect(instructions[4]?.opcode).toBe(OpCode.ADD);
    });

    it('should compile assignment with expression', () => {
      symbolTable.declare('result', 'number');
      
      // result = 10 + 5
      const ten = createLiteral(10, { line: 1, column: 10 });
      const five = createLiteral(5, { line: 1, column: 15 });
      const add = createBinaryExpression(ten, '+', five, { line: 1, column: 10 });
      
      const result = createIdentifier('result', { line: 1, column: 1 });
      const assignment = createAssignmentExpression(result, add, { line: 1, column: 1 });
      
      const program = createProgram([
        createExpressionStatement(assignment, assignment.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toHaveLength(5); // PUSH 10 + PUSH 5 + ADD + STORE result + HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(10);
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(5);
      expect(instructions[2]?.opcode).toBe(OpCode.ADD);
      expect(instructions[3]?.opcode).toBe(OpCode.STORE);
      expect(instructions[3]?.operand).toBe('result');
    });
  });

  describe('Optimization', () => {
    it('should optimize simple constant expressions', () => {
      // 5 + 3 should be optimized to 8
      const left = createLiteral(5, { line: 1, column: 1 });
      const right = createLiteral(3, { line: 1, column: 5 });
      const binary = createBinaryExpression(left, '+', right, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);
      const optimized = codeGen.optimize(instructions);

      // Should be optimized to just PUSH 8 + HALT
      expect(optimized).toHaveLength(2);
      expect(optimized[0]?.opcode).toBe(OpCode.PUSH);
      expect(optimized[0]?.operand).toBe(8);
    });

    it('should not optimize expressions with variables', () => {
      symbolTable.declare('x', 'number');
      
      const x = createIdentifier('x', { line: 1, column: 1 });
      const three = createLiteral(3, { line: 1, column: 5 });
      const binary = createBinaryExpression(x, '+', three, { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);
      const optimized = codeGen.optimize(instructions);

      // Should remain unoptimized
      expect(optimized).toEqual(instructions);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined variables', () => {
      const identifier = createIdentifier('undefined_var', { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(identifier, identifier.location)
      ], { line: 1, column: 1 });

      expect(() => codeGen.compile(program)).toThrow();
    });

    it('should handle unsupported operators', () => {
      const left = createLiteral(5, { line: 1, column: 1 });
      const right = createLiteral(3, { line: 1, column: 5 });
      const binary = createBinaryExpression(left, '**', right, { line: 1, column: 1 }); // Unsupported operator
      const program = createProgram([
        createExpressionStatement(binary, binary.location)
      ], { line: 1, column: 1 });

      expect(() => codeGen.compile(program)).toThrow();
    });
  });
});