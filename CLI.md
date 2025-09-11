# TypeScript VM CLI Documentation

The TypeScript VM provides a comprehensive command-line interface for compiling, running, and debugging TypeScript-like programs.

## Installation

```bash
npm install -g typescript-vm
```

Or run from source:
```bash
npm install
npm run build
```

## Usage

### Basic Syntax
```bash
tsvm [options] [file]
```

## Modes

### 1. Run Mode (Default)
Execute TypeScript-like source code directly:

```bash
# Run a program
tsvm program.ts

# Run with verbose output
tsvm --verbose program.ts

# Run with custom memory settings
tsvm --memory-size 2048000 --gc-threshold 500 program.ts
```

**Example:**
```bash
tsvm examples/hello-world.ts
```

### 2. Compile Mode
Compile source code to bytecode:

```bash
# Compile to bytecode
tsvm --compile program.ts

# Compile with custom output
tsvm -c program.ts -o program.bc

# Compile with AST output
tsvm -c program.ts --output-ast

# Compile without optimizations
tsvm -c program.ts --no-optimize
```

**Example:**
```bash
tsvm -c examples/fibonacci.ts -o fibonacci.bc --verbose
```

### 3. Disassemble Mode
Convert bytecode back to human-readable assembly:

```bash
# Disassemble bytecode
tsvm --disassemble program.bc

# Disassemble to file
tsvm -d program.bc -o program.asm
```

**Example:**
```bash
tsvm -d fibonacci.bc -o fibonacci.asm
```

### 4. Assemble Mode
Convert assembly code to bytecode:

```bash
# Assemble to bytecode
tsvm --assemble program.asm

# Assemble with custom output
tsvm -a program.asm -o program.bc
```

### 5. Debug Mode
Start interactive debugger:

```bash
# Debug a program
tsvm --debug program.ts
```

**Debugger Commands:**
- `step` - Execute next instruction
- `continue` - Continue execution
- `break <address>` - Set breakpoint
- `info stack` - Show stack contents
- `info vars` - Show variables
- `info memory` - Show memory statistics
- `quit` - Exit debugger

### 6. REPL Mode
Start interactive Read-Eval-Print Loop:

```bash
# Start REPL
tsvm --repl
```

**REPL Commands:**
- `.help` - Show help
- `.exit` - Exit REPL
- `.clear` - Clear current context
- `.save <file>` - Save session to file
- `.load <file>` - Load session from file

### 7. Benchmark Mode
Run performance benchmarks:

```bash
# Run all benchmarks
tsvm --benchmark

# Run with verbose output
tsvm --benchmark --verbose
```

## Options

### Input/Output Options
- `-o, --output <file>` - Specify output file path
- `--output-bytecode` - Generate bytecode file (.bc)
- `--output-ast` - Generate AST file (.ast.json)

### Optimization Options
- `--no-optimize` - Disable all optimizations
- `--verbose` - Enable verbose output

### Memory Options
- `--memory-size <bytes>` - Set VM memory size (default: 1MB)
- `--gc-threshold <n>` - Set garbage collection threshold (default: 1000)

### Information Options
- `-h, --help` - Show help information
- `-v, --version` - Show version information

## Examples

### Hello World
```bash
# Create hello.ts
echo 'print("Hello, World!");' > hello.ts

# Run it
tsvm hello.ts
```

### Fibonacci Calculator
```bash
# Run the fibonacci example
tsvm examples/fibonacci.ts
```

### Compile and Run Separately
```bash
# Compile
tsvm -c examples/math-operations.ts -o math.bc

# Run bytecode (not directly supported, but you can disassemble and inspect)
tsvm -d math.bc
```

### Debug a Program
```bash
# Start debugger
tsvm --debug examples/control-flow.ts

# In debugger:
# > break 5
# > continue
# > info stack
# > step
# > quit
```

### Performance Analysis
```bash
# Run benchmarks
tsvm --benchmark --verbose

# The results will be saved to ./benchmark-results/
```

### REPL Session
```bash
# Start REPL
tsvm --repl

# In REPL:
# > let x = 42
# > print(x)
# > function add(a, b) { return a + b; }
# > add(5, 3)
# > .exit
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