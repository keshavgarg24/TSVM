# Design Document

## Overview

The TypeScript VM system is designed as a modular, stack-based virtual machine with a complete language toolchain. The architecture follows a traditional compiler pipeline: source code → lexical analysis → parsing → AST → code generation → bytecode → execution. The system emphasizes clean separation of concerns, extensibility, and comprehensive error handling.

## Architecture

The system consists of seven main components organized in a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Tooling Layer                        │
│  ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌─────────────┐   │
│  │  REPL   │ │ Disassembler│ │Assembler│ │  Debugger   │   │
│  └─────────┘ └─────────────┘ └─────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Runtime Layer                          │
│  ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│  │ Standard Library│ │         VM Engine               │ │
│  │                 │ │  ┌─────────┐ ┌─────────────────┐ │ │
│  │ - print()       │ │  │  Stack  │ │   Call Stack    │ │ │
│  │ - math funcs    │ │  │ Machine │ │                 │ │ │
│  │ - string ops    │ │  └─────────┘ └─────────────────┘ │ │
│  └─────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Compilation Layer                        │
│  ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│  │   Code Gen      │ │         Bytecode Format         │ │
│  │                 │ │                                 │ │
│  │ - AST Walker    │ │ - Opcodes + Operands           │ │
│  │ - Optimizer     │ │ - Serializable Format          │ │
│  └─────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                         │
│  ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│  │     Lexer       │ │            Parser               │ │
│  │                 │ │                                 │ │
│  │ - Tokenization  │ │ - Recursive Descent             │ │
│  │ - Error Recovery│ │ - AST Generation                │ │
│  └─────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Language Layer                          │
│                    Surface Syntax                           │
│  Variables, Functions, Control Flow, Expressions            │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Language Definition

**Surface Syntax:**

```typescript
// Example language syntax
let x = 10;
let y = 20;

function add(a, b) {
  return a + b;
}

if (x > 5) {
  print(add(x, y));
} else {
  print("x is small");
}

while (x > 0) {
  x = x - 1;
  print(x);
}
```

**Core Language Features:**

- Variables with `let` declarations
- Functions with parameters and return values
- Arithmetic and comparison operators
- Control flow: `if/else`, `while` loops
- Built-in functions: `print()`

### 2. Frontend Components

**Lexer Interface:**

```typescript
interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

interface Lexer {
  tokenize(source: string): Token[];
}
```

**Parser Interface:**

```typescript
interface ASTNode {
  type: string;
  location: SourceLocation;
}

interface Parser {
  parse(tokens: Token[]): Program;
}
```

**AST Node Types:**

- Program (root)
- VariableDeclaration
- FunctionDeclaration
- BinaryExpression
- CallExpression
- IfStatement
- WhileStatement
- ReturnStatement

### 3. Bytecode Format

**Instruction Set Architecture:**

```typescript
enum OpCode {
  // Stack operations
  PUSH = 0x01, // Push constant to stack
  POP = 0x02, // Pop from stack
  DUP = 0x03, // Duplicate top of stack

  // Arithmetic operations
  ADD = 0x10, // Pop two, push sum
  SUB = 0x11, // Pop two, push difference
  MUL = 0x12, // Pop two, push product
  DIV = 0x13, // Pop two, push quotient
  MOD = 0x14, // Pop two, push remainder

  // Comparison operations
  EQ = 0x20, // Pop two, push equality result
  NE = 0x21, // Pop two, push inequality result
  LT = 0x22, // Pop two, push less-than result
  GT = 0x23, // Pop two, push greater-than result
  LE = 0x24, // Pop two, push less-equal result
  GE = 0x25, // Pop two, push greater-equal result

  // Control flow
  JUMP = 0x30, // Unconditional jump
  JUMP_IF_FALSE = 0x31, // Jump if top of stack is false
  CALL = 0x32, // Call function
  RETURN = 0x33, // Return from function

  // Variable operations
  LOAD = 0x40, // Load variable to stack
  STORE = 0x41, // Store stack top to variable

  // Built-ins
  PRINT = 0x50, // Print top of stack
  HALT = 0xff, // Stop execution
}

interface Instruction {
  opcode: OpCode;
  operand?: number | string;
}
```

### 4. VM Engine

**Stack Machine Design:**

```typescript
interface VMState {
  stack: Value[]; // Operand stack
  callStack: CallFrame[]; // Function call stack
  variables: Map<string, Value>; // Variable storage
  pc: number; // Program counter
  instructions: Instruction[]; // Bytecode program
}

interface CallFrame {
  returnAddress: number;
  localVariables: Map<string, Value>;
  functionName: string;
}
```

**Execution Engine:**

```typescript
interface VM {
  execute(bytecode: Instruction[]): void;
  step(): boolean; // Single step execution for debugging
  getState(): VMState;
}
```

### 5. Code Generator

**Compiler Interface:**

```typescript
interface CodeGenerator {
  compile(ast: Program): Instruction[];
  optimize(instructions: Instruction[]): Instruction[];
}
```

**Symbol Table Management:**

```typescript
interface SymbolTable {
  declare(name: string, type: ValueType): void;
  lookup(name: string): Symbol | undefined;
  enterScope(): void;
  exitScope(): void;
}
```

## Data Models

### Value System

```typescript
type ValueType = "number" | "string" | "boolean" | "function" | "undefined";

interface Value {
  type: ValueType;
  data: number | string | boolean | Function | undefined;
}
```

### Function Representation

```typescript
interface FunctionValue {
  name: string;
  parameters: string[];
  body: Instruction[];
  arity: number;
}
```

### Error Types

```typescript
interface CompileError {
  type: "syntax" | "semantic" | "type";
  message: string;
  location: SourceLocation;
}

interface RuntimeError {
  type:
    | "stack_overflow"
    | "undefined_variable"
    | "type_mismatch"
    | "division_by_zero";
  message: string;
  stackTrace: string[];
}
```

## Error Handling

### Compile-Time Error Recovery

- **Lexer**: Skip invalid characters, continue tokenization
- **Parser**: Synchronize on statement boundaries after errors
- **Code Generator**: Validate symbol references and type compatibility

### Runtime Error Management

- **Stack Overflow**: Monitor stack depth, throw before system limits
- **Type Errors**: Runtime type checking for operations
- **Undefined Variables**: Check symbol table before access
- **Division by Zero**: Explicit checks for arithmetic operations

### Error Reporting Strategy

```typescript
interface ErrorReporter {
  reportLexError(message: string, location: SourceLocation): void;
  reportParseError(message: string, expected: string, actual: Token): void;
  reportRuntimeError(error: RuntimeError): void;
}
```

## Testing Strategy

### Test-Driven Development Approach

The implementation will follow a strict TDD methodology where tests are written before or alongside the implementation code. Each component will have comprehensive unit tests that validate both positive and negative scenarios.

### Unit Testing Approach

1. **Lexer Tests**: Token generation for all language constructs
   - Write tests first for each token type
   - Test error recovery and invalid input handling
   - Validate line/column position tracking
2. **Parser Tests**: AST generation and error recovery
   - Test each grammar rule with valid and invalid inputs
   - Verify AST structure and node relationships
   - Test error synchronization and recovery
3. **Code Generator Tests**: Bytecode emission for each AST node type
   - Test instruction generation for each AST node
   - Verify symbol table management and scoping
   - Test optimization passes
4. **VM Tests**: Instruction execution and state management
   - Test each opcode individually
   - Test stack operations and state transitions
   - Test call stack management and function calls
5. **Integration Tests**: End-to-end program execution
   - Test complete programs from source to execution
   - Test standard library integration
   - Test error propagation through the entire pipeline

### Test-First Implementation Pattern

For each component, the development process will be:

1. **Write failing tests** that define the expected behavior
2. **Implement minimal code** to make tests pass
3. **Refactor** while keeping tests green
4. **Add more tests** for edge cases and error conditions
5. **Repeat** for the next feature

### Test Categories

- **Positive Tests**: Valid programs that should execute successfully
- **Negative Tests**: Invalid programs that should fail gracefully
- **Edge Cases**: Boundary conditions and corner cases
- **Performance Tests**: Large programs and stress testing
- **Regression Tests**: Prevent previously fixed bugs from reoccurring

### Test Framework Structure

```typescript
interface TestSuite {
  name: string;
  tests: Test[];
  setup?(): void;
  teardown?(): void;
}

interface Test {
  name: string;
  description: string;
  input: string;
  expectedOutput?: string;
  expectedError?: string;
  expectedBytecode?: Instruction[];
  expectedAST?: ASTNode;
  setup?(): void;
  teardown?(): void;
  run(): TestResult;
}

interface TestResult {
  passed: boolean;
  message?: string;
  actualOutput?: string;
  executionTime?: number;
}
```

### Testing Utilities

```typescript
interface TestHelpers {
  // Lexer testing
  expectTokens(source: string, expectedTokens: Token[]): void;
  expectLexError(source: string, expectedError: string): void;

  // Parser testing
  expectAST(source: string, expectedAST: ASTNode): void;
  expectParseError(source: string, expectedError: string): void;

  // Code generation testing
  expectBytecode(ast: ASTNode, expectedInstructions: Instruction[]): void;
  expectCompileError(ast: ASTNode, expectedError: string): void;

  // VM testing
  expectExecution(bytecode: Instruction[], expectedOutput: string): void;
  expectRuntimeError(bytecode: Instruction[], expectedError: string): void;
  expectStackState(vm: VM, expectedStack: Value[]): void;
}
```

### Continuous Testing Integration

- Tests will be run automatically during development
- Each component will have its test suite that can be run independently
- Integration tests will validate the entire pipeline
- Performance benchmarks will track execution speed and memory usage

## Performance Considerations

### Optimization Strategies

1. **Constant Folding**: Evaluate constant expressions at compile time
2. **Dead Code Elimination**: Remove unreachable code
3. **Instruction Combining**: Merge adjacent compatible instructions
4. **Stack Optimization**: Minimize stack operations

### Memory Management

- **Object Pooling**: Reuse instruction and value objects
- **Garbage Collection**: Automatic cleanup of unused variables
- **Stack Management**: Efficient stack growth and shrinkage

## Extensibility Design

### Plugin Architecture

```typescript
interface LanguageExtension {
  addTokenTypes(lexer: Lexer): void;
  addGrammarRules(parser: Parser): void;
  addInstructions(vm: VM): void;
}
```

### Standard Library Extension

```typescript
interface BuiltinFunction {
  name: string;
  arity: number;
  implementation: (args: Value[]) => Value;
}
```

This design provides a solid foundation for implementing a complete TypeScript VM with all the architectural components you specified, while maintaining clean separation of concerns and extensibility for future enhancements.
