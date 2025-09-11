# TypeScript VM CLI Documentation

The TypeScript VM provides a command-line interface for compiling, running, and debugging TypeScript-like programs.

## Installation

Clone and build from source:
```bash
git clone <repository-url>
cd typescript-vm
npm install
npm run build
```

## Usage

The CLI is accessed through npm scripts rather than a global command.

## Available Commands

### 1. Run Mode
Execute TypeScript-like source code directly:

```bash
# Run a program
npm run cli -- program.ts

# Run with development mode
npm run dev
```

**Example:**
```bash
npm run cli -- examples/hello-world.ts
```

### 2. Compile Mode
Compile source code to bytecode:

```bash
# Compile to bytecode
npm run compile -- program.ts
```

**Example:**
```bash
npm run compile -- examples/fibonacci.ts
```

### 3. Disassemble Mode
Convert bytecode back to human-readable assembly:

```bash
# Disassemble bytecode
npm run disassemble -- program.bc
```

### 4. Assemble Mode
Convert assembly code to bytecode:

```bash
# Assemble to bytecode
npm run assemble -- program.asm
```

### 5. Debug Mode
Start interactive debugger:

```bash
# Debug a program
npm run debug -- program.ts
```

### 6. REPL Mode
Start interactive Read-Eval-Print Loop:

```bash
# Start REPL
npm run repl
```

### 7. Testing and Benchmarks
Run tests and performance analysis:

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run CLI tests
npm run test:cli

# Run performance benchmarks
npm run benchmark

# Run memory benchmarks
npm run benchmark:memory

# Run CPU benchmarks
npm run benchmark:cpu
```

## Script Reference

| Script | Command | Description |
|--------|---------|-------------|
| Build | `npm run build` | Compile TypeScript to JavaScript |
| Development | `npm run dev` | Run in development mode |
| CLI | `npm run cli -- <file>` | Execute a program file |
| Start | `npm start` | Alias for npm run cli |
| REPL | `npm run repl` | Start interactive environment |
| Debug | `npm run debug -- <file>` | Start debugger for a file |
| Compile | `npm run compile -- <file>` | Compile to bytecode |
| Disassemble | `npm run disassemble -- <file>` | Convert bytecode to assembly |
| Assemble | `npm run assemble -- <file>` | Convert assembly to bytecode |
| Demo | `npm run demo` | Run demonstration workflow |

## Examples

### Hello World
```bash
# Run the hello world example
npm run cli -- examples/hello-world.ts
```

### Fibonacci Calculator
```bash
# Run the fibonacci example
npm run cli -- examples/fibonacci.ts
```

### Compile and Disassemble
```bash
# Compile to bytecode
npm run compile -- examples/math-operations.ts

# Disassemble bytecode to inspect
npm run disassemble -- examples/math-operations.bc
```

### Debug a Program
```bash
# Start debugger
npm run debug -- examples/control-flow.ts
```

### Performance Analysis
```bash
# Run all benchmarks
npm run benchmark

# Run specific benchmark types
npm run benchmark:memory
npm run benchmark:cpu
npm run benchmark:advanced
```

### REPL Session
```bash
# Start REPL
npm run repl
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:cli
npm run test:performance

# Run comprehensive test suite
npm run test:all
```

## File Formats

### Source Files (.ts)
TypeScript-like syntax with support for:
- Variables: `let x = 42;`
- Functions: `function add(a, b) { return a + b; }`
- Control flow: `if`, `while`, `for`
- Built-in functions: `print()`, `abs()`, `sqrt()`, etc.

### Bytecode Files (.bc)
JSON format containing instruction arrays:
```json
[
  { "opcode": "PUSH", "operand": 42 },
  { "opcode": "STORE", "operand": "x" },
  { "opcode": "HALT" }
]
```

### Assembly Files (.asm)
Human-readable instruction format:
```
PUSH 42
STORE x
HALT
```

### AST Files (.ast.json)
JSON representation of the Abstract Syntax Tree:
```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration",
      "identifier": { "type": "Identifier", "name": "x" },
      "initializer": { "type": "Literal", "value": 42 }
    }
  ]
}
```

## Error Handling

The CLI provides detailed error messages for:

### Compilation Errors
```bash
$ tsvm -c invalid.ts
Error: Unexpected token at line 1, column 5
```

### Runtime Errors
```bash
$ tsvm runtime-error.ts
Error: Division by zero at instruction 15
  at main()
```

### File Errors
```bash
$ tsvm nonexistent.ts
Error: Cannot read file 'nonexistent.ts': ENOENT: no such file or directory
```

## Performance Tips

1. **Use optimizations** (enabled by default):
   ```bash
   tsvm -c program.ts  # Optimizations enabled
   ```

2. **Adjust memory settings** for large programs:
   ```bash
   tsvm --memory-size 10485760 program.ts  # 10MB memory
   ```

3. **Monitor performance** with benchmarks:
   ```bash
   tsvm --benchmark
   ```

4. **Use verbose mode** for debugging performance:
   ```bash
   tsvm --verbose program.ts
   ```

## Integration with Build Systems

### npm scripts
```json
{
  "scripts": {
    "compile": "tsvm -c src/main.ts -o dist/main.bc",
    "run": "tsvm src/main.ts",
    "debug": "tsvm --debug src/main.ts",
    "test": "tsvm test/runner.ts"
  }
}
```

### Makefile
```makefile
compile:
	tsvm -c src/main.ts -o dist/main.bc

run:
	tsvm src/main.ts

debug:
	tsvm --debug src/main.ts

clean:
	rm -f dist/*.bc dist/*.asm
```

## Troubleshooting

### Common Issues

1. **"ts-node not found"** when running from source:
   ```bash
   npm install -g ts-node
   ```

2. **"Permission denied"** on Unix systems:
   ```bash
   chmod +x bin/tsvm
   ```

3. **Out of memory errors**:
   ```bash
   tsvm --memory-size 2097152 program.ts  # 2MB
   ```

4. **Slow performance**:
   ```bash
   tsvm --gc-threshold 2000 program.ts  # Less frequent GC
   ```

### Getting Help

- Use `tsvm --help` for quick reference
- Check the examples in the `examples/` directory
- Run `tsvm --benchmark` to verify installation
- Use `tsvm --verbose` for detailed execution information

## Advanced Usage

### Custom Memory Management
```bash
# Large program with custom memory settings
tsvm --memory-size 5242880 --gc-threshold 5000 large-program.ts
```

### Pipeline Usage
```bash
# Compile, disassemble, and inspect
tsvm -c program.ts -o program.bc --output-ast
tsvm -d program.bc -o program.asm
cat program.ast.json | jq '.body[0]'
```

### Batch Processing
```bash
# Compile multiple files
for file in src/*.ts; do
  tsvm -c "$file" -o "dist/$(basename "$file" .ts).bc"
done
```

This CLI provides a complete development environment for TypeScript VM programs, from initial development through debugging and performance analysis.