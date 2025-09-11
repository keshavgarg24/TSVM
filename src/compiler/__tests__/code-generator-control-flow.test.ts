import { CodeGenerator } from '../code-generator';
import { SymbolTable } from '../symbol-table';
import { 
  createLiteral, 
  createIdentifier, 
  createBinaryExpression,
  createVariableDeclaration,
  createAssignmentExpression,
  createProgram,
  createExpressionStatement,
  createIfStatement,
  createWhileStatement,
  createBlockStatement
} from '../../ast/nodes';
import { OpCode } from '../../types';

describe('Code Generator - Control Flow', () => {
  let codeGen: CodeGenerator;
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
    codeGen = new CodeGenerator(symbolTable);
  });

  describe('If Statements', () => {
    it('should compile simple if statement without else', () => {
      // if (true) { x = 5; }
      symbolTable.declare('x', 'number');
      
      const condition = createLiteral(true, { line: 1, column: 5 });
      const identifier = createIdentifier('x', { line: 1, column: 13 });
      const value = createLiteral(5, { line: 1, column: 17 });
      const assignment = createAssignmentExpression(identifier, value, { line: 1, column: 13 });
      const consequent = createBlockStatement([
        createExpressionStatement(assignment, assignment.location)
      ], { line: 1, column: 11 });
      
      const ifStmt = createIfStatement(condition, consequent, undefined, { line: 1, column: 1 });
      const program = createProgram([ifStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Expected: PUSH true + JUMP_IF_FALSE + PUSH 5 + STORE x + HALT
      expect(instructions).toHaveLength(5);
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(true);
      expect(instructions[1]?.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(instructions[1]?.operand).toBe(4); // Jump to HALT
      expect(instructions[2]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[2]?.operand).toBe(5);
      expect(instructions[3]?.opcode).toBe(OpCode.STORE);
      expect(instructions[3]?.operand).toBe('x');
      expect(instructions[4]?.opcode).toBe(OpCode.HALT);
    });

    it('should compile if-else statement', () => {
      // if (x > 5) { y = 1; } else { y = 2; }
      symbolTable.declare('x', 'number');
      symbolTable.declare('y', 'number');
      
      const x = createIdentifier('x', { line: 1, column: 5 });
      const five = createLiteral(5, { line: 1, column: 9 });
      const condition = createBinaryExpression(x, '>', five, { line: 1, column: 5 });
      
      const y1 = createIdentifier('y', { line: 1, column: 15 });
      const one = createLiteral(1, { line: 1, column: 19 });
      const assignment1 = createAssignmentExpression(y1, one, { line: 1, column: 15 });
      const consequent = createBlockStatement([
        createExpressionStatement(assignment1, assignment1.location)
      ], { line: 1, column: 13 });
      
      const y2 = createIdentifier('y', { line: 1, column: 30 });
      const two = createLiteral(2, { line: 1, column: 34 });
      const assignment2 = createAssignmentExpression(y2, two, { line: 1, column: 30 });
      const alternate = createBlockStatement([
        createExpressionStatement(assignment2, assignment2.location)
      ], { line: 1, column: 28 });
      
      const ifStmt = createIfStatement(condition, consequent, alternate, { line: 1, column: 1 });
      const program = createProgram([ifStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Expected: LOAD x + PUSH 5 + GT + JUMP_IF_FALSE + PUSH 1 + STORE y + JUMP + PUSH 2 + STORE y + HALT
      expect(instructions).toHaveLength(10);
      expect(instructions[0]?.opcode).toBe(OpCode.LOAD);
      expect(instructions[0]?.operand).toBe('x');
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(5);
      expect(instructions[2]?.opcode).toBe(OpCode.GT);
      expect(instructions[3]?.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(instructions[3]?.operand).toBe(7); // Jump to else block
      expect(instructions[4]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[4]?.operand).toBe(1);
      expect(instructions[5]?.opcode).toBe(OpCode.STORE);
      expect(instructions[5]?.operand).toBe('y');
      expect(instructions[6]?.opcode).toBe(OpCode.JUMP);
      expect(instructions[6]?.operand).toBe(9); // Jump over else block
      expect(instructions[7]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[7]?.operand).toBe(2);
      expect(instructions[8]?.opcode).toBe(OpCode.STORE);
      expect(instructions[8]?.operand).toBe('y');
      expect(instructions[9]?.opcode).toBe(OpCode.HALT);
    });
  });

  describe('While Statements', () => {
    it('should compile simple while loop', () => {
      // while (x > 0) { x = x - 1; }
      symbolTable.declare('x', 'number');
      
      const x1 = createIdentifier('x', { line: 1, column: 8 });
      const zero = createLiteral(0, { line: 1, column: 12 });
      const condition = createBinaryExpression(x1, '>', zero, { line: 1, column: 8 });
      
      const x2 = createIdentifier('x', { line: 1, column: 18 });
      const x3 = createIdentifier('x', { line: 1, column: 22 });
      const one = createLiteral(1, { line: 1, column: 26 });
      const subtraction = createBinaryExpression(x3, '-', one, { line: 1, column: 22 });
      const assignment = createAssignmentExpression(x2, subtraction, { line: 1, column: 18 });
      const body = createBlockStatement([
        createExpressionStatement(assignment, assignment.location)
      ], { line: 1, column: 16 });
      
      const whileStmt = createWhileStatement(condition, body, { line: 1, column: 1 });
      const program = createProgram([whileStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Expected: LOAD x + PUSH 0 + GT + JUMP_IF_FALSE + LOAD x + PUSH 1 + SUB + STORE x + JUMP + HALT
      expect(instructions).toHaveLength(10);
      expect(instructions[0]?.opcode).toBe(OpCode.LOAD);
      expect(instructions[0]?.operand).toBe('x');
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(0);
      expect(instructions[2]?.opcode).toBe(OpCode.GT);
      expect(instructions[3]?.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(instructions[3]?.operand).toBe(9); // Jump to HALT
      expect(instructions[4]?.opcode).toBe(OpCode.LOAD);
      expect(instructions[4]?.operand).toBe('x');
      expect(instructions[5]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[5]?.operand).toBe(1);
      expect(instructions[6]?.opcode).toBe(OpCode.SUB);
      expect(instructions[7]?.opcode).toBe(OpCode.STORE);
      expect(instructions[7]?.operand).toBe('x');
      expect(instructions[8]?.opcode).toBe(OpCode.JUMP);
      expect(instructions[8]?.operand).toBe(0); // Jump back to condition
      expect(instructions[9]?.opcode).toBe(OpCode.HALT);
    });
  });

  describe('Variable Declarations and Assignments', () => {
    it('should compile variable declaration with assignment in control flow', () => {
      // if (true) { let x = 5; }
      const condition = createLiteral(true, { line: 1, column: 5 });
      const identifier = createIdentifier('x', { line: 1, column: 17 });
      const value = createLiteral(5, { line: 1, column: 21 });
      const varDecl = createVariableDeclaration(identifier, value, { line: 1, column: 13 });
      const consequent = createBlockStatement([varDecl], { line: 1, column: 11 });
      
      const ifStmt = createIfStatement(condition, consequent, undefined, { line: 1, column: 1 });
      const program = createProgram([ifStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Expected: PUSH true + JUMP_IF_FALSE + PUSH 5 + STORE x + HALT
      expect(instructions).toHaveLength(5);
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(true);
      expect(instructions[1]?.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(instructions[2]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[2]?.operand).toBe(5);
      expect(instructions[3]?.opcode).toBe(OpCode.STORE);
      expect(instructions[3]?.operand).toBe('x');
    });
  });
});