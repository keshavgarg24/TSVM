# TypeScript VM

A virtual machine implementation for executing TypeScript-like code with a custom language syntax, featuring lexical analysis, parsing, compilation to bytecode, and execution.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

## Quick Start

### Installation

Clone and build from source:

```bash
git clone https://github.com/keshavgarg24/TSVM.git
cd typescript-vm
npm install
npm run build
```

### Basic Usage

```bash
# Run a program
npm run cli -- program.ts

# Start interactive REPL
npm run repl

# Compile to bytecode
npm run compile -- program.ts

# Debug a program
npm run debug -- program.ts
```

### Hello World Example

See the `examples/` directory for sample programs:

```bash
# Run the hello world example
npm run cli -- examples/hello-world.ts

# Try other examples
npm run cli -- examples/calculator.ts
npm run cli -- examples/fibonacci.ts
```

## 🏗️ Architecture

The TypeScript VM follows a traditional compiler architecture:

```
Source Code → Lexer → Parser → Compiler → VM → Output
     ↓          ↓       ↓        ↓       ↓
   Tokens     AST   Bytecode  Execution Results
```

### Core Components

- **Lexer**: Tokenizes source code into meaningful tokens
- **Parser**: Builds Abstract Syntax Tree (AST) from tokens
- **Compiler**: Generates optimized bytecode from AST
- **Virtual Machine**: Executes bytecode with stack-based architecture
- **Standard Library**: Built-in functions and utilities

## Features

### Core Components
- **Lexer**: Tokenizes source code
- **Parser**: Builds Abstract Syntax Tree (AST)
- **Compiler**: Generates bytecode from AST
- **Virtual Machine**: Executes bytecode with stack-based architecture
- **REPL**: Interactive programming environment
- **Debugger**: Step-by-step execution and inspection tools

### Language Support
- Variables and assignments
- Functions with parameters and return values
- Control flow (if/else, while, for)
- Arithmetic and comparison operations
- String operations
- Built-in functions

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Build | `npm run build` | Compile TypeScript to JavaScript |
| Test | `npm run test` | Run all tests |
| CLI | `npm run cli -- <file>` | Execute a program file |
| REPL | `npm run repl` | Start interactive environment |
| Debug | `npm run debug -- <file>` | Start debugger |
| Compile | `npm run compile -- <file>` | Compile to bytecode |
| Benchmark | `npm run benchmark` | Run performance tests |

See [CLI.md](CLI.md) for detailed CLI documentation.

##  Examples

Check the `examples/` directory for sample programs:

- `hello-world.ts` - Basic output and variables
- `calculator.ts` - Arithmetic operations
- `fibonacci.ts` - Recursive functions
- `control-flow.ts` - If/else and loops
- `math-operations.ts` - Mathematical functions
- `variables.ts` - Variable declarations and assignments

##  Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:cli
npm run test:performance

# Run all tests including toolchain
npm run test:all
```

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Development mode
npm run dev
```

### Benchmarking

```bash
# Run performance benchmarks
npm run benchmark

# Run specific benchmark suites
npm run benchmark:memory
npm run benchmark:cpu
npm run benchmark:advanced
```

## Debugging

### Interactive Debugger

```bash
npm run debug -- program.ts
```

### REPL Environment

```bash
npm run repl
```

## Performance

The TypeScript VM includes performance monitoring and benchmarking tools:

```bash
npm run benchmark
```

Available benchmark suites:
- Memory profiling
- CPU profiling  
- Advanced performance analysis

##  Project Structure

```
src/
├── ast/           # Abstract Syntax Tree nodes and utilities
├── bytecode/      # Bytecode generation and operations
├── cli/           # Command-line interface
├── compiler/      # Compilation pipeline
├── lexer/         # Tokenization and lexical analysis
├── parser/        # Syntax parsing
├── repl/          # Read-Eval-Print Loop
├── runtime/       # Runtime environment and built-ins
├── testing/       # Test utilities and benchmarks
├── tools/         # Development and debugging tools
├── vm/            # Virtual machine execution engine
└── index.ts       # Main entry point
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Development setup and workflow
- Testing requirements and best practices
- Code style and architecture guidelines
- How to submit pull requests

Quick start for contributors:

```bash
git clone <repository-url>
cd typescript-vm
npm install
npm run build
npm test
```

## Documentation

- **CLI Documentation**: See [CLI.md](CLI.md) for detailed command-line usage
- **Contributing Guide**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- **Examples**: Check the `examples/` directory for sample programs
- **Project Overview**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture details

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**TypeScript VM** - A virtual machine implementation for executing TypeScript-like code with custom language support.