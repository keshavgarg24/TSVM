// Core value system
export type ValueType = 'number' | 'string' | 'boolean' | 'function' | 'undefined';

export interface Value {
  type: ValueType;
  data: number | string | boolean | FunctionValue | undefined;
}

export interface FunctionValue {
  name: string;
  parameters: string[];
  body: Instruction[];
  arity: number;
}

// Source location for error reporting
export interface SourceLocation {
  line: number;
  column: number;
  length?: number;
}

// Token system
export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  
  // Keywords
  LET = 'LET',
  FUNCTION = 'FUNCTION',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  RETURN = 'RETURN',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  
  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  ASSIGN = 'ASSIGN',
  
  // Comparison
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',
  
  // Logical
  AND = 'AND',
  OR = 'OR',
  
  // Punctuation
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  
  // Special
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
}

export interface Token {
  type: TokenType;
  value: string;
  location: SourceLocation;
}

// AST Node types
export interface ASTNode {
  type: string;
  location: SourceLocation;
}

export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
}

export interface Statement extends ASTNode {}

export interface Expression extends ASTNode {}

export interface VariableDeclaration extends Statement {
  type: 'VariableDeclaration';
  identifier: Identifier;
  initializer?: Expression;
}

export interface FunctionDeclaration extends Statement {
  type: 'FunctionDeclaration';
  name: Identifier;
  parameters: Identifier[];
  body: BlockStatement;
}

export interface IfStatement extends Statement {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement;
  alternate?: Statement;
}

export interface WhileStatement extends Statement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement;
}

export interface ReturnStatement extends Statement {
  type: 'ReturnStatement';
  argument?: Expression;
}

export interface BlockStatement extends Statement {
  type: 'BlockStatement';
  body: Statement[];
}

export interface ExpressionStatement extends Statement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface BinaryExpression extends Expression {
  type: 'BinaryExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface CallExpression extends Expression {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface Identifier extends Expression {
  type: 'Identifier';
  name: string;
}

export interface Literal extends Expression {
  type: 'Literal';
  value: number | string | boolean;
}

export interface AssignmentExpression extends Expression {
  type: 'AssignmentExpression';
  left: Identifier;
  right: Expression;
}

// Bytecode system
export enum OpCode {
  // Stack operations
  PUSH = 0x01,
  POP = 0x02,
  DUP = 0x03,
  
  // Arithmetic operations
  ADD = 0x10,
  SUB = 0x11,
  MUL = 0x12,
  DIV = 0x13,
  MOD = 0x14,
  
  // Comparison operations
  EQ = 0x20,
  NE = 0x21,
  LT = 0x22,
  GT = 0x23,
  LE = 0x24,
  GE = 0x25,
  
  // Control flow
  JUMP = 0x30,
  JUMP_IF_FALSE = 0x31,
  CALL = 0x32,
  RETURN = 0x33,
  
  // Variable operations
  LOAD = 0x40,
  STORE = 0x41,
  
  // Built-ins
  PRINT = 0x50,
  HALT = 0xFF
}

export interface Instruction {
  opcode: OpCode;
  operand?: number | string | boolean;
}

// VM state
export interface VMState {
  stack: Value[];
  callStack: CallFrame[];
  variables: Map<string, Value>;
  pc: number;
  instructions: Instruction[];
}

export interface CallFrame {
  returnAddress: number;
  localVariables: Map<string, Value>;
  functionName: string;
}

// Error types
export interface CompileError {
  type: 'syntax' | 'semantic' | 'type';
  message: string;
  location: SourceLocation;
}

export interface RuntimeError {
  type: 'stack_overflow' | 'undefined_variable' | 'type_mismatch' | 'division_by_zero';
  message: string;
  stackTrace: string[];
}

// Symbol table
export interface Symbol {
  name: string;
  type: ValueType;
  scope: number;
}