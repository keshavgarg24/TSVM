import { CodeGenerator } from '../code-generator';
import { SymbolTable } from '../symbol-table';
import { 
  createLiteral, 
  createIdentifier, 
  createBinaryExpression,
  createAssignmentExpression,
  createIfStatement,
  createWhileStatement,
  createBlockStatement,
  createExpressionStatement,
  createProgram
} from '../../ast/nodes';
import { OpCode } from '../../types';

describe('Code Generator - Simple Control Flow', () => {
  let codeGen: CodeGenerator;
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
    codeGen = new CodeGenerator(symbolTable);
  });

  describe('Basic If Statements', () => {
    it('should compile simple if statement without else', () => {
      // if (true) { x = 10; }
      symbolTable.declare('x', 'number');
      
      const condition = createLiteral(true, { line: 1, column: 5 });
      const assignment = createExpressionStatement(
        createAssignmentExpression(
          createIdentifier('x', { line: 1, column: 15 }),
          createLiteral(10, { line: 1, column: 19 }),
          { line: 1, column: 15 }
        ),
        { line: 1, column: 15 }
      );
      
      const consequent = createBlockStatement([assignment], { line: 1, column: 13 });
      const ifStmt = createIfStatement(condition, consequent, undefined, { line: 1, column: 1 });
      const program = createProgram([ifStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Expected: PUSH true, JUMP_IF_FALSE end, PUSH 10, STORE x, end: HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(true);
      expect(instructions[1]?.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(instructions[2]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[2]?.operand).toBe(10);
      expect(instructions[3]?.opcode).toBe(OpCode.STORE);
      expect(instructions[3]?.operand).toBe('x');
      expect(instructions[4]?.opcode).toBe(OpCode.HALT);
    });

    it('should compile if-else statement', () => {
      // if (false) { x = 10; } else { x = 20; }
      symbolTable.declare('x', 'number');
      
      const condition = createLiteral(false, { line: 1, column: 5 });
      
      const thenAssignment = createExpressionStatement(
        createAssignmentExpression(
          createIdentifier('x', { line: 1, column: 15 }),
          createLiteral(10, { line: 1, column: 19 }),
          { line: 1, column: 15 }
        ),
        { line: 1, column: 15 }
      );
      
      const elseAssignment = createExpressionStatement(
        createAssignmentExpression(
          createIdentifier('x', { line: 1, column: 30 }),
          createLiteral(20, { line: 1, column: 34 }),
          { line: 1, column: 30 }
        ),
        { line: 1, column: 30 }
      );
      
      const consequent = createBlockStatement([thenAssignment], { line: 1, column: 13 });
      const alternate = createBlockStatement([elseAssignment], { line: 1, column: 25 });
      const ifStmt = createIfStatement(condition, consequent, alternate, { line: 1, column: 1 });
      const program = createProgram([ifStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Expected: PUSH false, JUMP_IF_FALSE else, PUSH 10, STORE x, JUMP end, else: PUSH 20, STORE x, end: HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(false);
      expect(instructions[1]?.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(instructions[2]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[2]?.operand).toBe(10);
      expect(instructions[3]?.opcode).toBe(OpCode.STORE);
      expect(instructions[3]?.operand).toBe('x');
      expect(instructions[4]?.opcode).toBe(OpCode.JUMP);
      expect(instructions[5]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[5]?.operand).toBe(20);
      expect(instructions[6]?.opcode).toBe(OpCode.STORE);
      expect(instructions[6]?.operand).toBe('x');
      expect(instructions[7]?.opcode).toBe(OpCode.HALT);
    });
  });

  describe('Basic While Statements', () => {
    it('should compile simple while loop', () => {
      // while (false) { x = x + 1; }
      symbolTable.declare('x', 'number');
      
      const condition = createLiteral(false, { line: 1, column: 8 });
      
      const increment = createExpressionStatement(
        createAssignmentExpression(
          createIdentifier('x', { line: 1, column: 18 }),
          createBinaryExpression(
            createIdentifier('x', { line: 1, column: 22 }),
            '+',
            createLiteral(1, { line: 1, column: 26 }),
            { line: 1, column: 22 }
          ),
          { line: 1, column: 18 }
        ),
        { line: 1, column: 18 }
      );
      
      const body = createBlockStatement([increment], { line: 1, column: 16 });
      const whileStmt = createWhileStatement(condition, body, { line: 1, column: 1 });
      const program = createProgram([whileStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Expected: loop: PUSH false, JUMP_IF_FALSE end, LOAD x, PUSH 1, ADD, STORE x, JUMP loop, end: HALT
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(false);
      expect(instructions[1]?.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(instructions[2]?.opcode).toBe(OpCode.LOAD);
      expect(instructions[2]?.operand).toBe('x');
      expect(instructions[3]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[3]?.operand).toBe(1);
      expect(instructions[4]?.opcode).toBe(OpCode.ADD);
      expect(instructions[5]?.opcode).toBe(OpCode.STORE);
      expect(instructions[5]?.operand).toBe('x');
      expect(instructions[6]?.opcode).toBe(OpCode.JUMP);
      expect(instructions[6]?.operand).toBe(0); // Jump back to start
      expect(instructions[7]?.opcode).toBe(OpCode.HALT);
    });
  });

  describe('Jump Address Validation', () => {
    it('should have valid jump addresses in if statement', () => {
      symbolTable.declare('x', 'number');
      
      const condition = createLiteral(true, { line: 1, column: 5 });
      const assignment = createExpressionStatement(
        createAssignmentExpression(
          createIdentifier('x', { line: 1, column: 15 }),
          createLiteral(10, { line: 1, column: 19 }),
          { line: 1, column: 15 }
        ),
        { line: 1, column: 15 }
      );
      
      const consequent = createBlockStatement([assignment], { line: 1, column: 13 });
      const ifStmt = createIfStatement(condition, consequent, undefined, { line: 1, column: 1 });
      const program = createProgram([ifStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Find JUMP_IF_FALSE instruction and validate its address
      const jumpIfFalse = instructions.find(instr => instr.opcode === OpCode.JUMP_IF_FALSE);
      expect(jumpIfFalse).toBeDefined();
      
      const jumpAddress = jumpIfFalse?.operand as number;
      expect(jumpAddress).toBeGreaterThanOrEqual(0);
      expect(jumpAddress).toBeLessThan(instructions.length);
    });

    it('should have valid jump addresses in while loop', () => {
      symbolTable.declare('x', 'number');
      
      const condition = createLiteral(false, { line: 1, column: 8 });
      const assignment = createExpressionStatement(
        createAssignmentExpression(
          createIdentifier('x', { line: 1, column: 18 }),
          createLiteral(1, { line: 1, column: 22 }),
          { line: 1, column: 18 }
        ),
        { line: 1, column: 18 }
      );
      
      const body = createBlockStatement([assignment], { line: 1, column: 16 });
      const whileStmt = createWhileStatement(condition, body, { line: 1, column: 1 });
      const program = createProgram([whileStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Validate all jump addresses
      for (const instr of instructions) {
        if (instr.opcode === OpCode.JUMP || instr.opcode === OpCode.JUMP_IF_FALSE) {
          const jumpAddress = instr.operand as number;
          expect(jumpAddress).toBeGreaterThanOrEqual(0);
          expect(jumpAddress).toBeLessThan(instructions.length);
        }
      }
    });
  });
});