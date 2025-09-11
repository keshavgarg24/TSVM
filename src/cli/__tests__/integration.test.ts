import * as fs from 'fs';
import * as path from 'path';
import { CLI } from '../index';
import { TestHelpers } from '../../testing/test-helpers';

describe('CLI Integration Tests', () => {
  let helpers: TestHelpers;
  let tempDir: string;
  let originalArgv: string[];

  beforeAll(() => {
    helpers = new TestHelpers();
    tempDir = path.join(__dirname, 'temp');
    
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  afterAll(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Complete Toolchain', () => {
    it('should compile and run a simple program', async () => {
      const sourceFile = path.join(tempDir, 'simple.ts');
      const bytecodeFile = path.join(tempDir, 'simple.bc');
      
      // Create source file
      fs.writeFileSync(sourceFile, 'let x = 42; print(x);');
      
      // Test compilation
      process.argv = ['node', 'cli.js', 'compile', sourceFile];
      const compileCLI = new CLI();
      
      // Mock console to capture output
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (message: string) => logs.push(message);
      
      try {
        await compileCLI.run();
        
        // Check that bytecode file was created
        expect(fs.existsSync(bytecodeFile)).toBe(true);
        
        // Verify bytecode content
        const bytecode = JSON.parse(fs.readFileSync(bytecodeFile, 'utf-8'));
        expect(Array.isArray(bytecode)).toBe(true);
        expect(bytecode.length).toBeGreaterThan(0);
        
        // Test running the compiled program
        process.argv = ['node', 'cli.js', 'run', sourceFile];
        const runCLI = new CLI();
        await runCLI.run();
        
        // Should have printed 42
        expect(logs).toContain('42');
        
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle the complete assembly/disassembly cycle', async () => {
      const sourceFile = path.join(tempDir, 'assembly-test.ts');
      const bytecodeFile = path.join(tempDir, 'assembly-test.bc');
      const assemblyFile = path.join(tempDir, 'assembly-test.asm');
      const reassembledFile = path.join(tempDir, 'assembly-test-reassembled.bc');
      
      // Create source file
      fs.writeFileSync(sourceFile, 'print("Hello Assembly");');
      
      // Compile to bytecode
      process.argv = ['node', 'cli.js', 'compile', sourceFile];
      await new CLI().run();
      
      // Disassemble to assembly
      process.argv = ['node', 'cli.js', 'disassemble', bytecodeFile];
      await new CLI().run();
      
      expect(fs.existsSync(assemblyFile)).toBe(true);
      
      // Read assembly content
      const assemblyContent = fs.readFileSync(assemblyFile, 'utf-8');
      expect(assemblyContent).toContain('PUSH');
      expect(assemblyContent).toContain('PRINT');
      expect(assemblyContent).toContain('HALT');
      
      // Reassemble back to bytecode
      process.argv = ['node', 'cli.js', 'assemble', '--output', reassembledFile, assemblyFile];
      await new CLI().run();
      
      expect(fs.existsSync(reassembledFile)).toBe(true);
      
      // Compare original and reassembled bytecode
      const originalBytecode = JSON.parse(fs.readFileSync(bytecodeFile, 'utf-8'));
      const reassembledBytecode = JSON.parse(fs.readFileSync(reassembledFile, 'utf-8'));
      
      expect(reassembledBytecode).toEqual(originalBytecode);
    });

    it('should handle different output formats', async () => {
      const sourceFile = path.join(tempDir, 'formats.ts');
      const jsonFile = path.join(tempDir, 'formats.json');
      const asmFile = path.join(tempDir, 'formats.asm');
      
      fs.writeFileSync(sourceFile, 'let result = 5 + 3; print(result);');
      
      // Compile to JSON format
      process.argv = ['node', 'cli.js', 'compile', '--format', 'json', '--output', jsonFile, sourceFile];
      await new CLI().run();
      
      expect(fs.existsSync(jsonFile)).toBe(true);
      const jsonContent = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      expect(jsonContent).toHaveProperty('instructions');
      expect(jsonContent).toHaveProperty('symbols');
      
      // Compile to assembly format
      process.argv = ['node', 'cli.js', 'compile', '--format', 'assembly', '--output', asmFile, sourceFile];
      await new CLI().run();
      
      expect(fs.existsSync(asmFile)).toBe(true);
      const asmContent = fs.readFileSync(asmFile, 'utf-8');
      expect(asmContent).toContain('PUSH');
      expect(asmContent).toContain('ADD');
      expect(asmContent).toContain('PRINT');
    });

    it('should handle complex programs with functions and control flow', async () => {
      const sourceFile = path.join(tempDir, 'complex.ts');
      
      const complexProgram = `
        function fibonacci(n) {
          if (n <= 1) {
            return n;
          }
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        let result = fibonacci(8);
        print("Fibonacci(8) = " + result);
      `;
      
      fs.writeFileSync(sourceFile, complexProgram);
      
      // Mock console to capture output
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (message: string) => logs.push(message);
      
      try {
        process.argv = ['node', 'cli.js', 'run', sourceFile];
        await new CLI().run();
        
        // Should calculate fibonacci(8) = 21
        expect(logs.some(log => log.includes('21'))).toBe(true);
        
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle error cases gracefully', async () => {
      const invalidFile = path.join(tempDir, 'invalid.ts');
      fs.writeFileSync(invalidFile, 'invalid syntax @#$%');
      
      // Mock console to capture errors
      const originalError = console.error;
      const originalExit = process.exit;
      const errors: string[] = [];
      let exitCode = 0;
      
      console.error = (message: string) => errors.push(message);
      process.exit = ((code: number) => { exitCode = code; }) as any;
      
      try {
        process.argv = ['node', 'cli.js', 'compile', invalidFile];
        await new CLI().run();
        
        expect(errors.some(error => error.includes('Compilation error'))).toBe(true);
        expect(exitCode).toBe(1);
        
      } finally {
        console.error = originalError;
        process.exit = originalExit;
      }
    });

    it('should handle file I/O errors', async () => {
      const nonexistentFile = path.join(tempDir, 'nonexistent.ts');
      
      // Mock console to capture errors
      const originalError = console.error;
      const originalExit = process.exit;
      const errors: string[] = [];
      let exitCode = 0;
      
      console.error = (message: string) => errors.push(message);
      process.exit = ((code: number) => { exitCode = code; }) as any;
      
      try {
        process.argv = ['node', 'cli.js', 'run', nonexistentFile];
        await new CLI().run();
        
        expect(errors.some(error => error.includes('Failed to read file'))).toBe(true);
        expect(exitCode).toBe(1);
        
      } finally {
        console.error = originalError;
        process.exit = originalExit;
      }
    });
  });

  describe('Example Programs', () => {
    const examplesDir = path.join(__dirname, '../../../examples');
    
    it('should run hello-world example', async () => {
      const helloWorldFile = path.join(examplesDir, 'hello-world.ts');
      
      if (fs.existsSync(helloWorldFile)) {
        const originalLog = console.log;
        const logs: string[] = [];
        console.log = (message: string) => logs.push(message);
        
        try {
          process.argv = ['node', 'cli.js', 'run', helloWorldFile];
          await new CLI().run();
          
          expect(logs).toContain('Hello, World!');
          
        } finally {
          console.log = originalLog;
        }
      }
    });

    it('should run calculator example', async () => {
      const calculatorFile = path.join(examplesDir, 'calculator.ts');
      
      if (fs.existsSync(calculatorFile)) {
        const originalLog = console.log;
        const logs: string[] = [];
        console.log = (message: string) => logs.push(message);
        
        try {
          process.argv = ['node', 'cli.js', 'run', calculatorFile];
          await new CLI().run();
          
          expect(logs.some(log => log.includes('Addition'))).toBe(true);
          expect(logs.some(log => log.includes('15'))).toBe(true); // 10 + 5
          
        } finally {
          console.log = originalLog;
        }
      }
    });

    it('should run fibonacci example', async () => {
      const fibonacciFile = path.join(examplesDir, 'fibonacci.ts');
      
      if (fs.existsSync(fibonacciFile)) {
        const originalLog = console.log;
        const logs: string[] = [];
        console.log = (message: string) => logs.push(message);
        
        try {
          process.argv = ['node', 'cli.js', 'run', fibonacciFile];
          await new CLI().run();
          
          expect(logs.some(log => log.includes('Fibonacci(10)'))).toBe(true);
          expect(logs.some(log => log.includes('55'))).toBe(true); // fibonacci(10) = 55
          
        } finally {
          console.log = originalLog;
        }
      }
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle large programs efficiently', async () => {
      const largeFile = path.join(tempDir, 'large.ts');
      
      // Generate a large program with many variables and operations
      const lines = ['let sum = 0;'];
      for (let i = 0; i < 100; i++) {
        lines.push(`let var${i} = ${i};`);
        lines.push(`sum = sum + var${i};`);
      }
      lines.push('print("Sum: " + sum);');
      
      fs.writeFileSync(largeFile, lines.join('\n'));
      
      const startTime = Date.now();
      
      process.argv = ['node', 'cli.js', 'compile', largeFile];
      await new CLI().run();
      
      const compileTime = Date.now() - startTime;
      
      // Should compile within reasonable time (adjust threshold as needed)
      expect(compileTime).toBeLessThan(5000);
      
      // Verify bytecode was generated
      const bytecodeFile = path.join(tempDir, 'large.bc');
      expect(fs.existsSync(bytecodeFile)).toBe(true);
    });

    it('should handle deeply nested function calls', async () => {
      const deepFile = path.join(tempDir, 'deep.ts');
      
      const deepProgram = `
        function countdown(n) {
          if (n <= 0) {
            return 0;
          }
          return countdown(n - 1) + 1;
        }
        
        let result = countdown(50);
        print("Countdown result: " + result);
      `;
      
      fs.writeFileSync(deepFile, deepProgram);
      
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (message: string) => logs.push(message);
      
      try {
        process.argv = ['node', 'cli.js', 'run', deepFile];
        await new CLI().run();
        
        expect(logs.some(log => log.includes('50'))).toBe(true);
        
      } finally {
        console.log = originalLog;
      }
    });
  });
});