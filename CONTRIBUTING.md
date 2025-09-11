# Contributing to TypeScript VM

Thank you for your interest in contributing to TypeScript VM! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Architecture Overview](#architecture-overview)

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Git
- TypeScript knowledge

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/typescript-vm.git
   cd typescript-vm
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Project Structure

```
src/
├── ast/           # Abstract Syntax Tree nodes and utilities
├── bytecode/      # Bytecode generation and instruction definitions
├── cli/           # Command-line interface implementation
├── compiler/      # Compilation pipeline and optimizations
├── interfaces/    # TypeScript interfaces and type definitions
├── lexer/         # Tokenization and lexical analysis
├── parser/        # Syntax parsing from tokens to AST
├── repl/          # Read-Eval-Print Loop implementation
├── runtime/       # Runtime environment and built-in functions
├── testing/       # Test utilities, benchmarks, and performance tools
├── tools/         # Development tools (debugger, disassembler, etc.)
├── types/         # Core type definitions and enums
├── utils/         # Utility functions and error handling
├── vm/            # Virtual machine execution engine
└── index.ts       # Main entry point and public API

examples/          # Sample programs demonstrating language features
scripts/           # Build and development scripts
bin/               # Executable scripts
```

## Development Workflow

### Making Changes

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards
3. Add or update tests as needed
4. Run the test suite:
   ```bash
   npm test
   ```

5. Build the project to check for compilation errors:
   ```bash
   npm run build
   ```

6. Test your changes with the CLI:
   ```bash
   npm run cli -- examples/hello-world.ts
   ```

### Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:integration` - Run integration tests only
- `npm run test:cli` - Run CLI tests only
- `npm run test:all` - Run comprehensive test suite
- `npm run benchmark` - Run performance benchmarks

## Testing

### Test Structure

The project uses Jest for testing with the following test categories:

1. **Unit Tests** (`src/**/__tests__/*.test.ts`)
   - Test individual components in isolation
   - Mock external dependencies
   - Fast execution

2. **Integration Tests** (`src/**/__tests__/*integration*.test.ts`)
   - Test component interactions
   - End-to-end compilation and execution
   - Real file system operations

3. **CLI Tests** (`src/cli/__tests__/*.test.ts`)
   - Test command-line interface
   - Argument parsing and validation
   - Output verification

4. **Performance Tests** (`src/testing/performance/`)
   - Benchmark execution speed
   - Memory usage analysis
   - Regression detection

### Writing Tests

#### Unit Test Example
```typescript
describe('Lexer', () => {
  let lexer: Lexer;

  beforeEach(() => {
    lexer = new Lexer();
  });

  it('should tokenize variable declaration', () => {
    const tokens = lexer.tokenize('let x = 42;');
    
    expect(tokens).toHaveLength(5);
    expect(tokens[0].type).toBe(TokenType.LET);
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[1].value).toBe('x');
  });
});
```

#### Integration Test Example
```typescript
describe('VM Integration', () => {
  let vm: VirtualMachine;

  beforeEach(() => {
    vm = new VirtualMachine();
  });

  it('should execute complete program', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    vm.execute('let result = 5 + 3; print(result);');
    
    expect(consoleSpy).toHaveBeenCalledWith('8');
    consoleSpy.mockRestore();
  });
});
```

### Test Guidelines

1. **Test Coverage**: Aim for high test coverage, especially for core components
2. **Test Names**: Use descriptive test names that explain the expected behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Mock External Dependencies**: Use Jest mocks for file system, console output, etc.
5. **Test Edge Cases**: Include tests for error conditions and boundary cases

### Running Specific Tests

```bash
# Run tests for a specific component
npm test -- lexer

# Run tests matching a pattern
npm test -- --testNamePattern="should tokenize"

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Code Style

### TypeScript Guidelines

1. **Type Safety**: Use strict TypeScript settings, avoid `any` types
2. **Interfaces**: Define clear interfaces for all public APIs
3. **Error Handling**: Use custom error classes with descriptive messages
4. **Documentation**: Add JSDoc comments for public methods and complex logic

### Formatting

The project uses TypeScript's built-in formatting. Key points:

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Use semicolons
- Maximum line length: 100 characters

### Example Code Style

```typescript
/**
 * Represents a token in the lexical analysis phase
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * Lexical analyzer for TypeScript VM language
 */
export class Lexer {
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  /**
   * Tokenizes the input source code
   * @param source - Source code to tokenize
   * @returns Array of tokens
   * @throws LexerError if invalid syntax is encountered
   */
  tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < source.length) {
      const token = this.nextToken(source);
      if (token) {
        tokens.push(token);
      }
    }
    
    return tokens;
  }
}
```

## Submitting Changes

### Pull Request Process

1. Ensure all tests pass:
   ```bash
   npm run test:all
   ```

2. Update documentation if needed
3. Add entries to examples if introducing new language features
4. Create a pull request with:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Reference to any related issues
   - Screenshots or examples if applicable

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Commit Messages

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Add support for while loops in parser"
git commit -m "Fix memory leak in garbage collector"
git commit -m "Update CLI help text for debug command"

# Avoid
git commit -m "Fix bug"
git commit -m "Update code"
git commit -m "WIP"
```

## Architecture Overview

### Compilation Pipeline

1. **Lexer** (`src/lexer/`) - Converts source code into tokens
2. **Parser** (`src/parser/`) - Builds Abstract Syntax Tree from tokens
3. **Compiler** (`src/compiler/`) - Generates bytecode from AST
4. **Optimizer** (`src/compiler/optimizations/`) - Optimizes bytecode
5. **VM** (`src/vm/`) - Executes bytecode

### Key Components

#### Virtual Machine (`src/vm/`)
- Stack-based execution engine
- Instruction dispatch and execution
- Memory management and garbage collection
- Built-in function handling

#### Bytecode System (`src/bytecode/`)
- Instruction definitions and opcodes
- Instruction factory for creating bytecode
- Serialization and deserialization

#### Tools (`src/tools/`)
- Debugger for step-by-step execution
- Disassembler for bytecode analysis
- REPL for interactive development

### Adding New Features

#### Adding a New Language Feature

1. **Update Lexer**: Add new token types if needed
2. **Update Parser**: Add AST node types and parsing logic
3. **Update Compiler**: Add bytecode generation for new constructs
4. **Update VM**: Add instruction execution if new opcodes are needed
5. **Add Tests**: Unit and integration tests for the new feature
6. **Update Examples**: Add example programs demonstrating the feature

#### Adding a New Built-in Function

1. **Define Opcode**: Add to `OpCode` enum in `src/types/index.ts`
2. **Update Instruction Factory**: Add method in `src/bytecode/instructions.ts`
3. **Update VM**: Add execution logic in VM instruction handler
4. **Update Compiler**: Add function recognition in compiler
5. **Add Tests**: Test the new built-in function
6. **Update Documentation**: Add to CLI.md and examples

### Performance Considerations

1. **Memory Management**: Be mindful of object creation in hot paths
2. **Instruction Dispatch**: Keep VM instruction execution fast
3. **Compilation Speed**: Optimize parser and compiler performance
4. **Benchmarking**: Use `npm run benchmark` to measure performance impact

### Debugging Tips

1. **Use the Debugger**: `npm run debug -- your-program.ts`
2. **Inspect Bytecode**: Use disassembler to see generated instructions
3. **Enable Verbose Mode**: Add logging to trace execution
4. **Unit Test Components**: Test individual components in isolation

## Getting Help

- Check existing issues on GitHub
- Look at the examples in `examples/` directory
- Review the test files for usage patterns
- Run `npm run cli -- --help` for CLI usage
- Use the REPL (`npm run repl`) to experiment with language features

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and contribute
- Follow the project's technical standards

Thank you for contributing to TypeScript VM!