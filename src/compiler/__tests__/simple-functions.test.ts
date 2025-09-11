import { CodeGenerator } from '../code-generator';
import { SymbolTable } from '../symbol-table';
import { 
  createLiteral, 
  createIdentifier, 
  createBinaryExpression,
  createFunctionDeclaration,
  createCallExpression,
  createReturnStatement,
  createBlockStatement,
  createExpressionStatement,
  createProgram
} from '../../ast/nodes';
import { OpCode } from '../../types';

describe('Code Generator - Simple Functions', () => {
  let codeGen: CodeGenerator;
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
    codeGen = new CodeGenerator(symbolTable);
  });

  describe('Function Calls', () => {
    it('should compile function call with no arguments', () => {
      // greet()
      const callee = createIdentifier('greet', { line: 1, column: 1 });
      const call = createCallExpression(callee, [], { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(call, call.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions).toContainEqual(
        expect.objectContaining({ opcode: OpCode.CALL, operand: 'greet' })
      );
    });

    it('should compile function call with arguments', () => {
      // add(5, 3)
      const callee = createIdentifier('add', { line: 1, column: 1 });
      const arg1 = createLiteral(5, { line: 1, column: 5 });
      const arg2 = createLiteral(3, { line: 1, column: 8 });
      const call = createCallExpression(callee, [arg1, arg2], { line: 1, column: 1 });
      const program = createProgram([
        createExpressionStatement(call, call.location)
      ], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Arguments should be pushed in order, then call
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(5);
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(3);
      expect(instructions[2]?.opcode).toBe(OpCode.CALL);
      expect(instructions[2]?.operand).toBe('add');
    });
  });

  describe('Return Statements', () => {
    it('should compile return with expression', () => {
      // return 42;
      const returnStmt = createReturnStatement(
        createLiteral(42, { line: 1, column: 8 }),
        { line: 1, column: 1 }
      );
      const program = createProgram([returnStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(42);
      expect(instructions[1]?.opcode).toBe(OpCode.RETURN);
    });

    it('should compile return without expression', () => {
      // return;
      const returnStmt = createReturnStatement(undefined, { line: 1, column: 1 });
      const program = createProgram([returnStmt], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Should push default value and return
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(0);
      expect(instructions[1]?.opcode).toBe(OpCode.RETURN);
    });
  });

  describe('Simple Function Declarations', () => {
    it('should compile basic function structure', () => {
      // function test() { return 1; }
      const name = createIdentifier('test', { line: 1, column: 10 });
      const returnStmt = createReturnStatement(
        createLiteral(1, { line: 1, column: 25 }),
        { line: 1, column: 18 }
      );
      const body = createBlockStatement([returnStmt], { line: 1, column: 16 });
      const funcDecl = createFunctionDeclaration(name, [], body, { line: 1, column: 1 });
      const program = createProgram([funcDecl], { line: 1, column: 1 });

      const instructions = codeGen.compile(program);

      // Should have jump to skip function body, then function body, then halt
      expect(instructions[0]?.opcode).toBe(OpCode.JUMP); // Skip function body
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH); // Function body starts
      expect(instructions[1]?.operand).toBe(1);
      expect(instructions[2]?.opcode).toBe(OpCode.RETURN);
      expect(instructions[3]?.opcode).toBe(OpCode.HALT);
    });

    it('should register function in symbol table', () => {
      const name = createIdentifier('myFunc', { line: 1, column: 10 });
      const body = createBlockStatement([], { line: 1, column: 18 });
      const funcDecl = createFunctionDeclaration(name, [], body, { line: 1, column: 1 });
      const program = createProgram([funcDecl], { line: 1, column: 1 });

      codeGen.compile(program);

      // Function should be registered in symbol table
      const symbol = symbolTable.lookup('myFunc');
      expect(symbol).toBeDefined();
      expect(symbol?.type).toBe('function');
    });
  });
});