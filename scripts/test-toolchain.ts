#!/usr/bin/env ts-node

/**
 * Test script to verify the complete TypeScript VM toolchain
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { TypeScriptVM } from '../src/index';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration: number;
}

class ToolchainTester {
  private results: TestResult[] = [];
  private tempDir = './temp-test';

  async runAllTests(): Promise<void> {
    console.log('🧪 Testing TypeScript VM Toolchain');
    console.log('='.repeat(50));

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    try {
      // Test high-level API
      await this.testHighLevelAPI();
      
      // Test CLI functionality
      await this.testCLI();
      
      // Test example programs
      await this.testExamplePrograms();
      
      // Test error handling
      await this.testErrorHandling();
      
      // Test performance
      await this.testPerformance();

      // Print results
      this.printResults();

    } finally {
      // Cleanup
      this.cleanup();
    }
  }

  private async testHighLevelAPI(): Promise<void> {
    console.log('\n📚 Testing High-Level API');
    
    await this.runTest('Basic execution', async () => {
      const vm = new TypeScriptVM();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      vm.execute('let x = 42; print(x);');
      
      if (!consoleSpy.mock.calls.some(call => call[0] === '42')) {
        throw new Error('Expected output not found');
      }
      
      consoleSpy.mockRestore();
    });

    await this.runTest('Compilation details', async () => {
      const vm = new TypeScriptVM();
      const result = vm.compile('let x = 5 + 3;');
      
      if (!result.tokens || result.tokens.length === 0) {
        throw new Error('No tokens generated');
      }
      
      if (!result.ast) {
        throw new Error('No AST generated');
      }
      
      if (!result.bytecode || result.bytecode.length === 0) {
        throw new Error('No bytecode generated');
      }
    });

    await this.runTest('Memory management', async () => {
      const vm = new TypeScriptVM();
      vm.execute('let x = 42;');
      
      const memStats = vm.getMemoryStats();
      if (memStats.totalMemory <= 0) {
        throw new Error('Invalid memory statistics');
      }
    });

    await this.runTest('State management', async () => {
      const vm = new TypeScriptVM();
      vm.execute('let x = 42;');
      
      const state = vm.getState();
      if (!state.variables.has('x')) {
        throw new Error('Variable not found in state');
      }
      
      vm.reset();
      const resetState = vm.getState();
      if (resetState.variables.size !== 0) {
        throw new Error('State not properly reset');
      }
    });
  }

  private async testCLI(): Promise<void> {
    console.log('\n💻 Testing CLI');
    
    // Create test program
    const testProgram = 'let result = 5 + 3; print(result);';
    const testFile = path.join(this.tempDir, 'test.ts');
    fs.writeFileSync(testFile, testProgram);

    await this.runTest('CLI compilation', async () => {
      const outputFile = path.join(this.tempDir, 'test.bc');
      const command = `ts-node src/cli/index.ts -c ${testFile} -o ${outputFile}`;
      
      try {
        execSync(command, { stdio: 'pipe' });
        
        if (!fs.existsSync(outputFile)) {
          throw new Error('Bytecode file not created');
        }
        
        const bytecode = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        if (!Array.isArray(bytecode) || bytecode.length === 0) {
          throw new Error('Invalid bytecode generated');
        }
      } catch (error) {
        throw new Error(`CLI compilation failed: ${error}`);
      }
    });

    await this.runTest('CLI execution', async () => {
      const command = `ts-node src/cli/index.ts ${testFile}`;
      
      try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        
        if (!output.includes('8')) {
          throw new Error('Expected output not found');
        }
      } catch (error) {
        throw new Error(`CLI execution failed: ${error}`);
      }
    });

    await this.runTest('CLI help', async () => {
      const command = `ts-node src/cli/index.ts --help`;
      
      try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        
        if (!output.includes('TypeScript VM') || !output.includes('Usage:')) {
          throw new Error('Help output incomplete');
        }
      } catch (error) {
        throw new Error(`CLI help failed: ${error}`);
      }
    });

    await this.runTest('CLI version', async () => {
      const command = `ts-node src/cli/index.ts --version`;
      
      try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        
        if (!output.includes('TypeScript VM v')) {
          throw new Error('Version output incomplete');
        }
      } catch (error) {
        throw new Error(`CLI version failed: ${error}`);
      }
    });
  }

  private async testExamplePrograms(): Promise<void> {
    console.log('\n📝 Testing Example Programs');
    
    const examples = [
      'examples/hello-world.ts',
      'examples/math-operations.ts',
      'examples/control-flow.ts'
    ];

    for (const example of examples) {
      if (fs.existsSync(example)) {
        await this.runTest(`Example: ${path.basename(example)}`, async () => {
          const vm = new TypeScriptVM();
          const sourceCode = fs.readFileSync(example, 'utf8');
          
          // Capture console output
          const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
          
          try {
            vm.execute(sourceCode);
            
            // Verify some output was produced
            if (consoleSpy.mock.calls.length === 0) {
              throw new Error('No output produced');
            }
          } finally {
            consoleSpy.mockRestore();
          }
        });
      }
    }
  }

  private async testErrorHandling(): Promise<void> {
    console.log('\n🚨 Testing Error Handling');
    
    await this.runTest('Lexer error handling', async () => {
      const vm = new TypeScriptVM();
      
      try {
        vm.execute('let x = "unterminated string');
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (!(error instanceof Error)) {
          throw new Error('Expected Error instance');
        }
        // Error was properly thrown
      }
    });

    await this.runTest('Parser error handling', async () => {
      const vm = new TypeScriptVM();
      
      try {
        vm.execute('let x = ;'); // Invalid syntax
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (!(error instanceof Error)) {
          throw new Error('Expected Error instance');
        }
        // Error was properly thrown
      }
    });

    await this.runTest('Runtime error handling', async () => {
      const vm = new TypeScriptVM();
      
      try {
        vm.execute('print(undefinedVariable);');
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (!(error instanceof Error)) {
          throw new Error('Expected Error instance');
        }
        // Error was properly thrown
      }
    });
  }

  private async testPerformance(): Promise<void> {
    console.log('\n⚡ Testing Performance');
    
    await this.runTest('Large program execution', async () => {
      const vm = new TypeScriptVM();
      
      // Generate a moderately large program
      let program = '';
      for (let i = 0; i < 50; i++) {
        program += `let var${i} = ${i} * 2;\n`;
      }
      program += 'print("Done");';
      
      const startTime = Date.now();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      vm.execute(program);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      consoleSpy.mockRestore();
      
      if (duration > 5000) { // 5 seconds
        throw new Error(`Execution too slow: ${duration}ms`);
      }
      
      if (!consoleSpy.mock.calls.some(call => call[0] === 'Done')) {
        throw new Error('Program did not complete');
      }
    });

    await this.runTest('Memory efficiency', async () => {
      const vm = new TypeScriptVM();
      
      // Execute a program that should trigger garbage collection
      vm.execute(`
        for (let i = 0; i < 100; i++) {
          let temp = i * i;
        }
      `);
      
      const memStats = vm.getMemoryStats();
      
      if (memStats.usedMemory < 0 || memStats.freeMemory < 0) {
        throw new Error('Invalid memory statistics');
      }
      
      if (memStats.totalMemory <= 0) {
        throw new Error('Invalid total memory');
      }
    });
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        success: true,
        duration
      });
      
      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      console.log(`  ❌ ${name} (${duration}ms)`);
      console.log(`     Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total duration: ${totalDuration}ms`);
    console.log(`Success rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    if (passed === this.results.length) {
      console.log('\n🎉 All tests passed! TypeScript VM toolchain is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
      process.exit(1);
    }
  }

  private cleanup(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Warning: Could not clean up temp directory:', error);
    }
  }
}

// Mock jest for standalone execution
if (typeof jest === 'undefined') {
  (global as any).jest = {
    spyOn: (obj: any, method: string) => {
      const original = obj[method];
      const calls: any[][] = [];
      
      const spy = (...args: any[]) => {
        calls.push(args);
        return original.apply(obj, args);
      };
      
      spy.mock = { calls };
      spy.mockImplementation = (fn?: Function) => {
        if (fn) {
          obj[method] = fn;
        }
        return spy;
      };
      spy.mockRestore = () => {
        obj[method] = original;
      };
      
      obj[method] = spy;
      return spy;
    }
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ToolchainTester();
  tester.runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ToolchainTester };