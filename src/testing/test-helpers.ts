import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { CodeGenerator } from '../compiler';
import { SymbolTable } from '../compiler';
import { VirtualMachine } from '../vm/vm';
import { 
  Token, 
  TokenType, 
  ASTNode, 
  Instruction, 
  OpCode, 
  Value,
  SourceLocation 
} from '../types';

/**
 * Helper for testing the lexer
 */
export class LexerTestHelper {
  private lexer: Lexer;

  constructor() {
    this.lexer = new Lexer();
  }

  /**
   * Tokenize source code and return tokens
   */
  tokenize(source: string): Token[] {
    return this.lexer.tokenize(source);
  }

  /**
   * Assert that source produces expected token types
   */
  expectTokenTypes(source: string, expectedTypes: TokenType[]): void {
    const tokens = this.tokenize(source);
    const actualTypes = tokens.map(token => token.type);
    
    if (actualTypes.length !== expectedTypes.length) {
      throw new Error(
        `Expected ${expectedTypes.length} tokens, got ${actualTypes.length}\n` +
        `Expected: ${expectedTypes.join(', ')}\n` +
        `Actual: ${actualTypes.join(', ')}`
      );
    }

    for (let i = 0; i < expectedTypes.length; i++) {
      if (actualTypes[i] !== expectedTypes[i]) {
        throw new Error(
          `Token ${i}: expected ${expectedTypes[i]}, got ${actualTypes[i]}\n` +
          `Expected: ${expectedTypes.join(', ')}\n` +
          `Actual: ${actualTypes.join(', ')}`
        );
      }
    }
  }

  /**
   * Assert that source produces expected token values
   */
  expectTokenValues(source: string, expectedValues: string[]): void {
    const tokens = this.tokenize(source);
    const actualValues = tokens.map(token => token.value);
    
    if (actualValues.length !== expectedValues.length) {
      throw new Error(
        `Expected ${expectedValues.length} tokens, got ${actualValues.length}\n` +
        `Expected: ${expectedValues.join(', ')}\n` +
        `Actual: ${actualValues.join(', ')}`
      );
    }

    for (let i = 0; i < expectedValues.length; i++) {
      if (actualValues[i] !== expectedValues[i]) {
        throw new Error(
          `Token ${i}: expected "${expectedValues[i]}", got "${actualValues[i]}"\n` +
          `Expected: ${expectedValues.join(', ')}\n` +
          `Actual: ${actualValues.join(', ')}`
        );
      }
    }
  }

  /**
   * Assert that source throws a lexer error
   */
  expectError(source: string, expectedMessage?: string): void {
    try {
      this.tokenize(source);
      throw new Error('Expected lexer to throw an error, but it succeeded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (expectedMessage && !errorMessage.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to contain "${expectedMessage}", ` +
          `but got: "${errorMessage}"`
        );
      }
    }
  }

  /**
   * Get token at specific position
   */
  getTokenAt(source: string, index: number): Token {
    const tokens = this.tokenize(source);
    if (index >= tokens.length) {
      throw new Error(`Token index ${index} out of bounds (${tokens.length} tokens)`);
    }
    const token = tokens[index];
    if (!token) {
      throw new Error(`Token at index ${index} is undefined`);
    }
    return token;
  }
}

/**
 * Helper for testing the parser
 */
export class ParserTestHelper {
  private parser: Parser;
  private lexer: Lexer;

  constructor() {
    this.parser = new Parser();
    this.lexer = new Lexer();
  }

  /**
   * Parse source code and return AST
   */
  parse(source: string): ASTNode {
    const tokens = this.lexer.tokenize(source);
    return this.parser.parse(tokens);
  }

  /**
   * Assert that source produces expected AST node type
   */
  expectNodeType(source: string, expectedType: string): ASTNode {
    const ast = this.parse(source);
    if (ast.type !== expectedType) {
      throw new Error(`Expected AST node type "${expectedType}", got "${ast.type}"`);
    }
    return ast;
  }

  /**
   * Assert that source throws a parser error
   */
  expectError(source: string, expectedMessage?: string): void {
    try {
      this.parse(source);
      throw new Error('Expected parser to throw an error, but it succeeded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (expectedMessage && !errorMessage.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to contain "${expectedMessage}", ` +
          `but got: "${errorMessage}"`
        );
      }
    }
  }

  /**
   * Assert that AST has expected structure
   */
  expectASTStructure(ast: ASTNode, expectedStructure: any): void {
    this.compareASTStructure(ast, expectedStructure, '');
  }

  private compareASTStructure(actual: any, expected: any, path: string): void {
    if (expected === null || expected === undefined) {
      return; // Skip null/undefined expectations
    }

    if (typeof expected === 'object' && !Array.isArray(expected)) {
      for (const key in expected) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in actual)) {
          throw new Error(`Missing property "${currentPath}" in AST`);
        }
        
        this.compareASTStructure(actual[key], expected[key], currentPath);
      }
    } else if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected array at "${path}", got ${typeof actual}`);
      }
      
      if (actual.length !== expected.length) {
        throw new Error(
          `Expected array length ${expected.length} at "${path}", got ${actual.length}`
        );
      }
      
      for (let i = 0; i < expected.length; i++) {
        this.compareASTStructure(actual[i], expected[i], `${path}[${i}]`);
      }
    } else {
      if (actual !== expected) {
        throw new Error(`Expected "${expected}" at "${path}", got "${actual}"`);
      }
    }
  }

  /**
   * Get specific node from AST by path
   */
  getNodeByPath(ast: ASTNode, path: string): any {
    const parts = path.split('.');
    let current: any = ast;
    
    for (const part of parts) {
      if (part.includes('[') && part.includes(']')) {
        const splitResult = part.split('[');
        const prop = splitResult[0];
        const indexStr = splitResult[1];
        if (!prop || !indexStr) {
          throw new Error(`Invalid path part: ${part}`);
        }
        const index = parseInt(indexStr.replace(']', ''), 10);
        current = current[prop][index];
      } else {
        current = current[part];
      }
      
      if (current === undefined) {
        throw new Error(`Path "${path}" not found in AST`);
      }
    }
    
    return current;
  }
}

/**
 * Helper for testing the compiler
 */
export class CompilerTestHelper {
  private compiler: CodeGenerator;
  private parser: Parser;
  private lexer: Lexer;

  constructor() {
    this.compiler = new CodeGenerator(new SymbolTable());
    this.parser = new Parser();
    this.lexer = new Lexer();
  }

  /**
   * Compile source code to bytecode
   */
  compile(source: string): Instruction[] {
    const tokens = this.lexer.tokenize(source);
    const ast = this.parser.parse(tokens);
    return this.compiler.compile(ast);
  }

  /**
   * Assert that source produces expected opcodes
   */
  expectOpcodes(source: string, expectedOpcodes: OpCode[]): void {
    const instructions = this.compile(source);
    const actualOpcodes = instructions.map(inst => inst.opcode);
    
    if (actualOpcodes.length !== expectedOpcodes.length) {
      throw new Error(
        `Expected ${expectedOpcodes.length} instructions, got ${actualOpcodes.length}\n` +
        `Expected: ${expectedOpcodes.map(op => OpCode[op]).join(', ')}\n` +
        `Actual: ${actualOpcodes.map(op => OpCode[op]).join(', ')}`
      );
    }

    for (let i = 0; i < expectedOpcodes.length; i++) {
      const expectedOp = expectedOpcodes[i];
      const actualOp = actualOpcodes[i];
      if (actualOp !== expectedOp) {
        throw new Error(
          `Instruction ${i}: expected ${expectedOp !== undefined ? OpCode[expectedOp] : 'undefined'}, got ${actualOp !== undefined ? OpCode[actualOp] : 'undefined'}\n` +
          `Expected: ${expectedOpcodes.map(op => OpCode[op]).join(', ')}\n` +
          `Actual: ${actualOpcodes.map(op => OpCode[op]).join(', ')}`
        );
      }
    }
  }

  /**
   * Assert that source produces expected instructions
   */
  expectInstructions(source: string, expectedInstructions: Partial<Instruction>[]): void {
    const instructions = this.compile(source);
    
    if (instructions.length !== expectedInstructions.length) {
      throw new Error(
        `Expected ${expectedInstructions.length} instructions, got ${instructions.length}`
      );
    }

    for (let i = 0; i < expectedInstructions.length; i++) {
      const actual = instructions[i];
      const expected = expectedInstructions[i];
      
      if (!actual || !expected) {
        throw new Error(`Instruction ${i} is undefined`);
      }
      
      if (expected.opcode !== undefined && actual.opcode !== expected.opcode) {
        throw new Error(
          `Instruction ${i}: expected opcode ${OpCode[expected.opcode]}, got ${OpCode[actual.opcode]}`
        );
      }
      
      if (expected.operand !== undefined && actual.operand !== expected.operand) {
        throw new Error(
          `Instruction ${i}: expected operand ${expected.operand}, got ${actual.operand}`
        );
      }
    }
  }

  /**
   * Assert that source throws a compiler error
   */
  expectError(source: string, expectedMessage?: string): void {
    try {
      this.compile(source);
      throw new Error('Expected compiler to throw an error, but it succeeded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (expectedMessage && !errorMessage.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to contain "${expectedMessage}", ` +
          `but got: "${errorMessage}"`
        );
      }
    }
  }

  /**
   * Get instruction at specific index
   */
  getInstructionAt(source: string, index: number): Instruction {
    const instructions = this.compile(source);
    if (index >= instructions.length) {
      throw new Error(`Instruction index ${index} out of bounds (${instructions.length} instructions)`);
    }
    const instruction = instructions[index];
    if (!instruction) {
      throw new Error(`Instruction at index ${index} is undefined`);
    }
    return instruction;
  }
}

/**
 * Helper for testing the VM
 */
export class VMTestHelper {
  private vm: VirtualMachine;
  private compiler: CodeGenerator;
  private parser: Parser;
  private lexer: Lexer;

  constructor() {
    this.vm = new VirtualMachine();
    this.compiler = new CodeGenerator(new SymbolTable());
    this.parser = new Parser();
    this.lexer = new Lexer();
  }

  /**
   * Execute source code and return final stack
   */
  execute(source: string): Value[] {
    const instructions = this.compileSource(source);
    this.vm.reset();
    this.vm.execute(instructions);
    return this.vm.getState().stack;
  }

  /**
   * Execute bytecode instructions
   */
  executeInstructions(instructions: Instruction[]): Value[] {
    this.vm.reset();
    this.vm.execute(instructions);
    return this.vm.getState().stack;
  }

  /**
   * Assert that source produces expected stack values
   */
  expectStackValues(source: string, expectedValues: any[]): void {
    const stack = this.execute(source);
    const actualValues = stack.map(value => value.data);
    
    if (actualValues.length !== expectedValues.length) {
      throw new Error(
        `Expected stack length ${expectedValues.length}, got ${actualValues.length}\n` +
        `Expected: [${expectedValues.join(', ')}]\n` +
        `Actual: [${actualValues.join(', ')}]`
      );
    }

    for (let i = 0; i < expectedValues.length; i++) {
      if (actualValues[i] !== expectedValues[i]) {
        throw new Error(
          `Stack[${i}]: expected ${expectedValues[i]}, got ${actualValues[i]}\n` +
          `Expected: [${expectedValues.join(', ')}]\n` +
          `Actual: [${actualValues.join(', ')}]`
        );
      }
    }
  }

  /**
   * Assert that source produces expected variable values
   */
  expectVariableValues(source: string, expectedVariables: Record<string, any>): void {
    this.execute(source);
    const variables = this.vm.getState().variables;
    
    for (const [name, expectedValue] of Object.entries(expectedVariables)) {
      const actualValue = variables.get(name);
      if (!actualValue) {
        throw new Error(`Variable "${name}" not found`);
      }
      
      if (actualValue.data !== expectedValue) {
        throw new Error(
          `Variable "${name}": expected ${expectedValue}, got ${actualValue.data}`
        );
      }
    }
  }

  /**
   * Assert that source throws a runtime error
   */
  expectError(source: string, expectedMessage?: string): void {
    try {
      this.execute(source);
      throw new Error('Expected VM to throw an error, but it succeeded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (expectedMessage && !errorMessage.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to contain "${expectedMessage}", ` +
          `but got: "${errorMessage}"`
        );
      }
    }
  }

  /**
   * Get VM state after execution
   */
  getState(source: string) {
    this.execute(source);
    return this.vm.getState();
  }

  /**
   * Reset VM state
   */
  reset(): void {
    this.vm.reset();
  }

  /**
   * Step through execution
   */
  step(instructions: Instruction[]): boolean {
    return this.vm.step();
  }

  /**
   * Load instructions without executing
   */
  loadInstructions(instructions: Instruction[]): void {
    this.vm.loadInstructions(instructions);
  }

  private compileSource(source: string): Instruction[] {
    const tokens = this.lexer.tokenize(source);
    const ast = this.parser.parse(tokens);
    return this.compiler.compile(ast);
  }
}

/**
 * Combined test helpers
 */
export class TestHelpers {
  public lexer: LexerTestHelper;
  public parser: ParserTestHelper;
  public compiler: CompilerTestHelper;
  public vm: VMTestHelper;

  constructor() {
    this.lexer = new LexerTestHelper();
    this.parser = new ParserTestHelper();
    this.compiler = new CompilerTestHelper();
    this.vm = new VMTestHelper();
  }

  /**
   * Test complete pipeline from source to execution
   */
  expectPipelineResult(source: string, expectedStackValues: any[]): void {
    this.vm.expectStackValues(source, expectedStackValues);
  }

  /**
   * Test that source throws error at any stage
   */
  expectPipelineError(source: string, expectedMessage?: string): void {
    try {
      this.vm.execute(source);
      throw new Error('Expected pipeline to throw an error, but it succeeded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (expectedMessage && !errorMessage.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to contain "${expectedMessage}", ` +
          `but got: "${errorMessage}"`
        );
      }
    }
  }

  /**
   * Create a simple test program
   */
  createTestProgram(operations: string[]): string {
    return operations.join('\n');
  }

  /**
   * Create arithmetic test
   */
  createArithmeticTest(left: number, operator: string, right: number): string {
    return `${left} ${operator} ${right}`;
  }

  /**
   * Create variable test
   */
  createVariableTest(name: string, value: any): string {
    return `let ${name} = ${JSON.stringify(value)};`;
  }

  /**
   * Create function test
   */
  createFunctionTest(name: string, params: string[], body: string[]): string {
    return `function ${name}(${params.join(', ')}) {\n${body.map(line => '  ' + line).join('\n')}\n}`;
  }
}