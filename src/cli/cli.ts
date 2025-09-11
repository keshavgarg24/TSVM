#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { Lexer } from "../lexer";
import { Parser } from "../parser";
import { CodeGenerator, SymbolTable } from "../compiler";
import { VirtualMachine } from "../vm";
import { Disassembler } from "../tools/disassembler";
import { Assembler } from "../tools/assembler";
import { Debugger } from "../tools/debugger";
// import { REPL } from '../tools/repl';
// import { PerformanceRunner } from '../testing/performance/performance-runner';

export interface CLIOptions {
  input?: string;
  output?: string;
  mode:
    | "compile"
    | "run"
    | "disassemble"
    | "assemble"
    | "debug"
    | "repl"
    | "benchmark";
  optimize?: boolean;
  verbose?: boolean;
  help?: boolean;
  version?: boolean;
  outputBytecode?: boolean;
  outputAST?: boolean;
  memorySize?: number;
  gcThreshold?: number;
}

export class CLI {
  private lexer = new Lexer();
  private parser = new Parser();
  private symbolTable = new SymbolTable();
  private codeGenerator: CodeGenerator;
  private vm: VirtualMachine;
  private disassembler = new Disassembler();
  private assembler = new Assembler();
  private debugger: Debugger;
  // private repl: REPL;

  constructor(private options: CLIOptions) {
    this.codeGenerator = new CodeGenerator(this.symbolTable, {
      constantFolding: options.optimize ?? true,
      deadCodeElimination: options.optimize ?? true,
      verbose: options.verbose ?? false,
    });

    this.vm = new VirtualMachine(options.memorySize ?? 1024 * 1024);
    if (options.gcThreshold) {
      this.vm.setGCThreshold(options.gcThreshold);
    }

    this.debugger = new Debugger();
    // this.repl = new REPL(this.lexer, this.parser, this.codeGenerator, this.vm);
  }

  async run(): Promise<void> {
    try {
      switch (this.options.mode) {
        case "compile":
          await this.compile();
          break;
        case "run":
          await this.runProgram();
          break;
        case "disassemble":
          await this.disassemble();
          break;
        case "assemble":
          await this.assemble();
          break;
        case "debug":
          await this.debug();
          break;
        case "repl":
          await this.startREPL();
          break;
        case "benchmark":
          await this.runBenchmarks();
          break;
        default:
          throw new Error(`Unknown mode: ${this.options.mode}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  private async compile(): Promise<void> {
    if (!this.options.input) {
      throw new Error("Input file required for compilation");
    }

    const sourceCode = await this.readFile(this.options.input);

    if (this.options.verbose) {
      console.log("🔧 Compiling:", this.options.input);
    }

    // Tokenize
    const tokens = this.lexer.tokenize(sourceCode);
    if (this.options.verbose) {
      console.log(`📝 Tokenized: ${tokens.length} tokens`);
    }

    // Parse
    const ast = this.parser.parse(tokens);
    if (this.options.verbose) {
      console.log("🌳 Parsed AST");
    }

    if (this.options.outputAST) {
      const astFile = this.getOutputPath(".ast.json");
      await this.writeFile(astFile, JSON.stringify(ast, null, 2));
      console.log(`📄 AST written to: ${astFile}`);
    }

    // Compile to bytecode
    const bytecode = this.codeGenerator.compile(ast);
    if (this.options.verbose) {
      console.log(`⚙️ Generated: ${bytecode.length} instructions`);
    }

    // Output bytecode
    if (this.options.output || this.options.outputBytecode) {
      const bytecodeFile = this.options.output || this.getOutputPath(".bc");
      const bytecodeJson = JSON.stringify(bytecode, null, 2);
      await this.writeFile(bytecodeFile, bytecodeJson);
      console.log(`💾 Bytecode written to: ${bytecodeFile}`);
    }

    // Output disassembly for readability
    const disassembly = this.disassembler.disassemble(bytecode);
    const asmFile = this.getOutputPath(".asm");
    await this.writeFile(asmFile, disassembly);
    console.log(`📋 Assembly written to: ${asmFile}`);

    console.log("✅ Compilation completed successfully");
  }

  private async runProgram(): Promise<void> {
    if (!this.options.input) {
      throw new Error("Input file required for execution");
    }

    const sourceCode = await this.readFile(this.options.input);

    if (this.options.verbose) {
      console.log("🚀 Running:", this.options.input);
    }

    // Full compilation pipeline
    const tokens = this.lexer.tokenize(sourceCode);
    const ast = this.parser.parse(tokens);
    const bytecode = this.codeGenerator.compile(ast);

    if (this.options.verbose) {
      console.log(`📊 Execution stats:`);
      console.log(`  Tokens: ${tokens.length}`);
      console.log(`  Instructions: ${bytecode.length}`);
      const memStats = this.vm.getMemoryStats();
      console.log(`  Memory: ${memStats.usedMemory} bytes used`);
    }

    // Execute
    console.log("--- Program Output ---");
    const startTime = Date.now();
    this.vm.execute(bytecode);
    const endTime = Date.now();

    if (this.options.verbose) {
      console.log("--- Execution Complete ---");
      console.log(`⏱️  Execution time: ${endTime - startTime}ms`);

      const finalMemStats = this.vm.getMemoryStats();
      console.log(`📊 Final memory stats:`);
      console.log(`  Used: ${finalMemStats.usedMemory} bytes`);
      console.log(`  GC runs: ${finalMemStats.gcRuns}`);
      console.log(`  GC time: ${finalMemStats.gcTime}ms`);
    }
  }

  private async disassemble(): Promise<void> {
    if (!this.options.input) {
      throw new Error("Input bytecode file required for disassembly");
    }

    const bytecodeJson = await this.readFile(this.options.input);
    const bytecode = JSON.parse(bytecodeJson);

    const disassembly = this.disassembler.disassemble(bytecode);

    if (this.options.output) {
      await this.writeFile(this.options.output, disassembly);
      console.log(`📋 Disassembly written to: ${this.options.output}`);
    } else {
      console.log(disassembly);
    }
  }

  private async assemble(): Promise<void> {
    if (!this.options.input) {
      throw new Error("Input assembly file required for assembly");
    }

    const assembly = await this.readFile(this.options.input);
    const bytecode = this.assembler.assemble(assembly);

    const outputFile = this.options.output || this.getOutputPath(".bc");
    const bytecodeJson = JSON.stringify(bytecode, null, 2);
    await this.writeFile(outputFile, bytecodeJson);

    console.log(`💾 Bytecode written to: ${outputFile}`);
  }

  private async debug(): Promise<void> {
    if (!this.options.input) {
      throw new Error("Input file required for debugging");
    }

    const sourceCode = await this.readFile(this.options.input);

    console.log("🐛 Starting debugger for:", this.options.input);

    // Compile
    const tokens = this.lexer.tokenize(sourceCode);
    const ast = this.parser.parse(tokens);
    const bytecode = this.codeGenerator.compile(ast);

    // Start debugging session
    this.debugger.startSession(bytecode);

    console.log(
      "Debugger started. Use debugger commands to control execution."
    );
    console.log(
      "Available commands: step, continue, pause, breakpoint <address>, variables, stack, quit"
    );

    // TODO: Implement interactive debugging interface
    // For now, just run a few steps as demonstration
    console.log("Running first few steps:");
    for (let i = 0; i < 5; i++) {
      const step = this.debugger.step();
      if (!step) break;
      console.log(
        `Step ${step.stepNumber}: ${step.instruction.opcode} at address ${step.address}`
      );
    }
  }

  private async startREPL(): Promise<void> {
    console.log("🔄 Starting TypeScript VM REPL");
    console.log("Type .help for commands, .exit to quit");
    console.log("REPL functionality not yet implemented");

    // TODO: Implement REPL
    // await this.repl.start();
  }

  private async runBenchmarks(): Promise<void> {
    console.log("📊 Running performance benchmarks");
    console.log("Benchmark functionality not yet implemented");

    // TODO: Implement benchmarking
    // const runner = new PerformanceRunner({
    //   includeBenchmarks: true,
    //   includeMemoryProfiling: true,
    //   includeCPUProfiling: true,
    //   generateReports: true,
    //   verbose: this.options.verbose ?? true,
    //   outputDir: './benchmark-results'
    // });
    //
    // await runner.runAll();
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, "utf8");
    } catch (error) {
      throw new Error(`Cannot read file '${filePath}': ${error}`);
    }
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, "utf8");
    } catch (error) {
      throw new Error(`Cannot write file '${filePath}': ${error}`);
    }
  }

  private getOutputPath(extension: string): string {
    if (!this.options.input) {
      return `output${extension}`;
    }

    const parsed = path.parse(this.options.input);
    return path.join(parsed.dir, parsed.name + extension);
  }
}

export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    mode: "run",
    optimize: true,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-v":
      case "--version":
        options.version = true;
        break;
      case "-c":
      case "--compile":
        options.mode = "compile";
        break;
      case "-r":
      case "--run":
        options.mode = "run";
        break;
      case "-d":
      case "--disassemble":
        options.mode = "disassemble";
        break;
      case "-a":
      case "--assemble":
        options.mode = "assemble";
        break;
      case "--debug":
        options.mode = "debug";
        break;
      case "--repl":
        options.mode = "repl";
        break;
      case "--benchmark":
        options.mode = "benchmark";
        break;
      case "-o":
      case "--output":
        if (i + 1 < args.length) {
          const nextArg = args[++i];
          if (nextArg !== undefined) {
            options.output = nextArg;
          }
        }
        break;
      case "--no-optimize":
        options.optimize = false;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--output-bytecode":
        options.outputBytecode = true;
        break;
      case "--output-ast":
        options.outputAST = true;
        break;
      case "--memory-size":
        if (i + 1 < args.length) {
          const nextArg = args[++i];
          if (nextArg !== undefined) {
            options.memorySize = parseInt(nextArg);
          }
        }
        break;
      case "--gc-threshold":
        if (i + 1 < args.length) {
          const nextArg = args[++i];
          if (nextArg !== undefined) {
            options.gcThreshold = parseInt(nextArg);
          }
        }
        break;
      default:
        if (arg && !arg.startsWith("-") && !options.input) {
          options.input = arg;
        }
        break;
    }
  }

  return options;
}

export function printHelp(): void {
  console.log(`
TypeScript VM - A virtual machine for executing TypeScript-like code

Usage: tsvm [options] [file]

Modes:
  -r, --run              Run source code (default)
  -c, --compile          Compile source to bytecode
  -d, --disassemble      Disassemble bytecode to assembly
  -a, --assemble         Assemble assembly to bytecode
  --debug                Start debugger
  --repl                 Start interactive REPL
  --benchmark            Run performance benchmarks

Options:
  -o, --output <file>    Output file path
  --no-optimize          Disable optimizations
  --verbose              Enable verbose output
  --output-bytecode      Output bytecode file (.bc)
  --output-ast           Output AST file (.ast.json)
  --memory-size <bytes>  Set VM memory size (default: 1MB)
  --gc-threshold <n>     Set GC threshold (default: 1000)
  -h, --help             Show this help
  -v, --version          Show version

Examples:
  tsvm program.ts                    # Run program
  tsvm -c program.ts                 # Compile to bytecode
  tsvm -c program.ts -o out.bc       # Compile with custom output
  tsvm --debug program.ts            # Debug program
  tsvm --repl                        # Start REPL
  tsvm --benchmark                   # Run benchmarks
  tsvm -d bytecode.bc                # Disassemble bytecode
  tsvm -a assembly.asm -o out.bc     # Assemble to bytecode
`);
}

export function printVersion(): void {
  const packageJson = require("../../package.json");
  console.log(`TypeScript VM v${packageJson.version}`);
}
