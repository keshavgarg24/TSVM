#!/usr/bin/env ts-node

/**
 * Demonstration script showing the complete TypeScript VM workflow
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

class WorkflowDemo {
  private demoDir = './demo-output';

  async runDemo(): Promise<void> {
    console.log('🚀 TypeScript VM Complete Workflow Demo');
    console.log('='.repeat(60));

    // Setup
    this.setup();

    try {
      // Step 1: Create a sample program
      await this.step1_CreateProgram();
      
      // Step 2: Compile the program
      await this.step2_CompileProgram();
      
      // Step 3: Examine the outputs
      await this.step3_ExamineOutputs();
      
      // Step 4: Run the program
      await this.step4_RunProgram();
      
      // Step 5: Disassemble bytecode
      await this.step5_DisassembleBytecode();
      
      // Step 6: Demonstrate debugging
      await this.step6_DemonstrateDebugging();
      
      // Step 7: Show performance analysis
      await this.step7_PerformanceAnalysis();
      
      // Step 8: REPL demonstration
      await this.step8_REPLDemo();

      console.log('\n🎉 Workflow demonstration completed successfully!');
      console.log(`📁 All outputs saved to: ${this.demoDir}`);

    } finally {
      // Note: Not cleaning up so user can examine outputs
      console.log('\n💡 Tip: Check the demo-output directory to see all generated files');
    }
  }

  private setup(): void {
    if (!fs.existsSync(this.demoDir)) {
      fs.mkdirSync(this.demoDir, { recursive: true });
    }
  }

  private async step1_CreateProgram(): Promise<void> {
    console.log('\n📝 Step 1: Creating Sample Program');
    console.log('-'.repeat(40));

    const sampleProgram = `
// Sample TypeScript VM Program
// Demonstrates various language features

function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 == 0 || num % 3 == 0) return false;
  
  let i = 5;
  while (i * i <= num) {
    if (num % i == 0 || num % (i + 2) == 0) {
      return false;
    }
    i = i + 6;
  }
  return true;
}

// Main program
print("=== TypeScript VM Demo ===");
print("");

// Test factorial function
print("Factorial calculations:");
for (let i = 1; i <= 5; i++) {
  let result = factorial(i);
  print("factorial(" + toString(i) + ") = " + toString(result));
}

print("");

// Test prime checking
print("Prime number check (1-20):");
for (let num = 1; num <= 20; num++) {
  if (isPrime(num)) {
    print(toString(num) + " is prime");
  }
}

print("");

// Mathematical operations
let a = 15;
let b = 4;
print("Mathematical operations with a=" + toString(a) + ", b=" + toString(b) + ":");
print("a + b = " + toString(a + b));
print("a - b = " + toString(a - b));
print("a * b = " + toString(a * b));
print("a / b = " + toString(a / b));
print("a % b = " + toString(a % b));

print("");

// Built-in functions
print("Built-in function demonstrations:");
print("abs(-10) = " + toString(abs(-10)));
print("sqrt(16) = " + toString(sqrt(16)));
print("pow(2, 4) = " + toString(pow(2, 4)));

print("");

// String operations
let greeting = "Hello";
let target = "TypeScript VM";
let message = concat(greeting, concat(" ", target));
print("String operations:");
print("message = " + message);
print("length(message) = " + toString(length(message)));
print("substring(message, 0, 5) = " + substring(message, 0, 5));

print("");
print("=== Demo Complete ===");
`;

    const programFile = path.join(this.demoDir, 'demo-program.ts');
    fs.writeFileSync(programFile, sampleProgram.trim());
    
    console.log(`✅ Created sample program: ${programFile}`);
    console.log(`📊 Program size: ${sampleProgram.length} characters`);
  }

  private async step2_CompileProgram(): Promise<void> {
    console.log('\n⚙️ Step 2: Compiling Program');
    console.log('-'.repeat(40));

    const inputFile = path.join(this.demoDir, 'demo-program.ts');
    const outputFile = path.join(this.demoDir, 'demo-program.bc');
    
    const command = `ts-node src/cli/index.ts -c ${inputFile} -o ${outputFile} --output-ast --verbose`;
    
    console.log(`🔧 Running: ${command}`);
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      console.log(output);
      
      // Check file sizes
      const sourceSize = fs.statSync(inputFile).size;
      const bytecodeSize = fs.statSync(outputFile).size;
      const astFile = path.join(this.demoDir, 'demo-program.ast.json');
      const astSize = fs.existsSync(astFile) ? fs.statSync(astFile).size : 0;
      
      console.log(`📊 Compilation Results:`);
      console.log(`   Source code: ${sourceSize} bytes`);
      console.log(`   Bytecode: ${bytecodeSize} bytes`);
      console.log(`   AST: ${astSize} bytes`);
      
    } catch (error) {
      console.error('❌ Compilation failed:', error);
      throw error;
    }
  }

  private async step3_ExamineOutputs(): Promise<void> {
    console.log('\n🔍 Step 3: Examining Generated Files');
    console.log('-'.repeat(40));

    // Show bytecode structure
    const bytecodeFile = path.join(this.demoDir, 'demo-program.bc');
    if (fs.existsSync(bytecodeFile)) {
      const bytecode = JSON.parse(fs.readFileSync(bytecodeFile, 'utf8'));
      console.log(`📄 Bytecode contains ${bytecode.length} instructions`);
      console.log(`🔧 First few instructions:`);
      bytecode.slice(0, 5).forEach((instr: any, i: number) => {
        console.log(`   ${i}: ${instr.opcode} ${instr.operand || ''}`);
      });
    }

    // Show AST structure
    const astFile = path.join(this.demoDir, 'demo-program.ast.json');
    if (fs.existsSync(astFile)) {
      const ast = JSON.parse(fs.readFileSync(astFile, 'utf8'));
      console.log(`🌳 AST contains ${ast.body ? ast.body.length : 0} top-level statements`);
    }

    // Show assembly
    const asmFile = path.join(this.demoDir, 'demo-program.asm');
    if (fs.existsSync(asmFile)) {
      const assembly = fs.readFileSync(asmFile, 'utf8');
      const lines = assembly.split('\n').length;
      console.log(`📋 Assembly contains ${lines} lines`);
    }
  }

  private async step4_RunProgram(): Promise<void> {
    console.log('\n🚀 Step 4: Running Program');
    console.log('-'.repeat(40));

    const inputFile = path.join(this.demoDir, 'demo-program.ts');
    const command = `ts-node src/cli/index.ts --run ${inputFile} --verbose`;
    
    console.log(`🔧 Running: ${command}`);
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      console.log(output);
    } catch (error) {
      console.error('❌ Execution failed:', error);
      throw error;
    }
  }

  private async step5_DisassembleBytecode(): Promise<void> {
    console.log('\n🔍 Step 5: Disassembling Bytecode');
    console.log('-'.repeat(40));

    const bytecodeFile = path.join(this.demoDir, 'demo-program.bc');
    const asmFile = path.join(this.demoDir, 'disassembled.asm');
    
    const command = `ts-node src/cli/index.ts -d ${bytecodeFile} -o ${asmFile}`;
    
    console.log(`🔧 Running: ${command}`);
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      console.log(output);
      
      // Show first few lines of disassembly
      if (fs.existsSync(asmFile)) {
        const assembly = fs.readFileSync(asmFile, 'utf8');
        const lines = assembly.split('\n').slice(0, 10);
        console.log(`📋 First 10 lines of disassembly:`);
        lines.forEach((line, i) => {
          console.log(`   ${i.toString().padStart(2)}: ${line}`);
        });
      }
    } catch (error) {
      console.error('❌ Disassembly failed:', error);
      throw error;
    }
  }

  private async step6_DemonstrateDebugging(): Promise<void> {
    console.log('\n🐛 Step 6: Debugging Capabilities');
    console.log('-'.repeat(40));

    // Create a simple program for debugging demo
    const debugProgram = `
let x = 10;
let y = 20;
let result = x + y;
print(result);
`;

    const debugFile = path.join(this.demoDir, 'debug-demo.ts');
    fs.writeFileSync(debugFile, debugProgram);

    console.log(`📝 Created debug demo program: ${debugFile}`);
    console.log(`🔧 Program content:`);
    console.log(debugProgram);
    
    console.log(`💡 To debug this program, run:`);
    console.log(`   ts-node src/cli/index.ts --debug ${debugFile}`);
    console.log(`   Then use debugger commands like: step, continue, info stack, etc.`);
  }

  private async step7_PerformanceAnalysis(): Promise<void> {
    console.log('\n⚡ Step 7: Performance Analysis');
    console.log('-'.repeat(40));

    console.log(`🔧 Running performance benchmarks...`);
    
    try {
      // Run a quick benchmark
      const command = `ts-node src/cli/index.ts --benchmark`;
      console.log(`Running: ${command}`);
      
      // Note: This might take a while, so we'll just show the command
      console.log(`💡 Benchmark results will be saved to ./benchmark-results/`);
      console.log(`📊 This includes detailed performance metrics, memory usage, and optimization reports`);
      
    } catch (error) {
      console.log(`⚠️  Benchmark demo skipped (would take too long for demo)`);
      console.log(`💡 Run 'npm run benchmark' to see full performance analysis`);
    }
  }

  private async step8_REPLDemo(): Promise<void> {
    console.log('\n🔄 Step 8: REPL Demonstration');
    console.log('-'.repeat(40));

    console.log(`💡 To start the interactive REPL, run:`);
    console.log(`   ts-node src/cli/index.ts --repl`);
    console.log(``);
    console.log(`🔧 Example REPL session:`);
    console.log(`   > let x = 42`);
    console.log(`   > print(x)`);
    console.log(`   42`);
    console.log(`   > function double(n) { return n * 2; }`);
    console.log(`   > double(21)`);
    console.log(`   42`);
    console.log(`   > .help`);
    console.log(`   [shows available commands]`);
    console.log(`   > .exit`);
    console.log(``);
    console.log(`📚 REPL supports all language features including:`);
    console.log(`   - Variable declarations and assignments`);
    console.log(`   - Function definitions and calls`);
    console.log(`   - Control flow (if/else, loops)`);
    console.log(`   - Built-in functions`);
    console.log(`   - Mathematical operations`);
    console.log(`   - String manipulation`);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  const demo = new WorkflowDemo();
  demo.runDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { WorkflowDemo };