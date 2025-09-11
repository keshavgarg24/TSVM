import { TestHelpers } from './test-helpers';
import { TestRunner } from './test-runner';
import { ConsoleReporter } from './reporters';

/**
 * Integration test suite for the TypeScript VM
 * Tests complete pipeline from source code to execution
 */
export class IntegrationTestSuite {
  private helpers: TestHelpers;
  private runner: TestRunner;

  constructor() {
    this.helpers = new TestHelpers();
    this.runner = new TestRunner({ verbose: true });
  }

  /**
   * Run all integration tests
   */
  async runAll(): Promise<void> {
    this.setupBasicTests();
    this.setupArithmeticTests();
    this.setupVariableTests();
    this.setupControlFlowTests();
    this.setupFunctionTests();
    this.setupStringTests();
    this.setupErrorHandlingTests();
    this.setupPerformanceTests();
    this.setupRegressionTests();

    const stats = await this.runner.run();
    console.log('\n=== Integration Test Results ===');
    console.log(`Total: ${stats.total}`);
    console.log(`Passed: ${stats.passed}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Duration: ${stats.duration}ms`);

    if (stats.failed > 0) {
      throw new Error(`${stats.failed} integration tests failed`);
    }
  }

  /**
   * Basic functionality tests
   */
  private setupBasicTests(): void {
    this.runner.describe('Basic Functionality', () => {
      this.runner.it('should execute simple literal', () => {
        this.helpers.expectPipelineResult('42', [42]);
      });

      this.runner.it('should execute boolean literals', () => {
        this.helpers.expectPipelineResult('true', [true]);
        this.helpers.expectPipelineResult('false', [false]);
      });

      this.runner.it('should execute string literals', () => {
        this.helpers.expectPipelineResult('"hello"', ['hello']);
        this.helpers.expectPipelineResult("'world'", ['world']);
      });

      this.runner.it('should handle empty program', () => {
        this.helpers.expectPipelineResult('', []);
      });

      this.runner.it('should handle whitespace and comments', () => {
        const program = `
          // This is a comment
          42 /* inline comment */
          // Another comment
        `;
        this.helpers.expectPipelineResult(program, [42]);
      });
    });
  }

  /**
   * Arithmetic operation tests
   */
  private setupArithmeticTests(): void {
    this.runner.describe('Arithmetic Operations', () => {
      this.runner.it('should perform basic arithmetic', () => {
        this.helpers.expectPipelineResult('5 + 3', [8]);
        this.helpers.expectPipelineResult('10 - 4', [6]);
        this.helpers.expectPipelineResult('6 * 7', [42]);
        this.helpers.expectPipelineResult('15 / 3', [5]);
        this.helpers.expectPipelineResult('17 % 5', [2]);
      });

      this.runner.it('should handle operator precedence', () => {
        this.helpers.expectPipelineResult('2 + 3 * 4', [14]);
        this.helpers.expectPipelineResult('(2 + 3) * 4', [20]);
        this.helpers.expectPipelineResult('10 - 2 * 3', [4]);
        this.helpers.expectPipelineResult('(10 - 2) * 3', [24]);
      });

      this.runner.it('should handle complex expressions', () => {
        this.helpers.expectPipelineResult('2 * 3 + 4 * 5', [26]);
        this.helpers.expectPipelineResult('(2 + 3) * (4 + 5)', [45]);
        this.helpers.expectPipelineResult('10 / 2 + 3 * 4', [17]);
      });

      this.runner.it('should handle negative numbers', () => {
        this.helpers.expectPipelineResult('-5', [-5]);
        this.helpers.expectPipelineResult('-5 + 3', [-2]);
        this.helpers.expectPipelineResult('10 + -3', [7]);
      });

      this.runner.it('should handle floating point arithmetic', () => {
        this.helpers.expectPipelineResult('3.14 + 2.86', [6]);
        this.helpers.expectPipelineResult('10.5 / 2.5', [4.2]);
        this.helpers.expectPipelineResult('1.5 * 2.0', [3]);
      });
    });
  }

  /**
   * Variable operation tests
   */
  private setupVariableTests(): void {
    this.runner.describe('Variable Operations', () => {
      this.runner.it('should declare and use variables', () => {
        const program = this.helpers.createTestProgram([
          'let x = 42;',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [42]);
      });

      this.runner.it('should handle multiple variables', () => {
        const program = this.helpers.createTestProgram([
          'let x = 10;',
          'let y = 20;',
          'x + y'
        ]);
        this.helpers.expectPipelineResult(program, [30]);
      });

      this.runner.it('should handle variable assignment', () => {
        const program = this.helpers.createTestProgram([
          'let x = 5;',
          'x = 10;',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [10]);
      });

      this.runner.it('should handle variable scoping', () => {
        const program = this.helpers.createTestProgram([
          'let x = 1;',
          '{',
          '  let x = 2;',
          '  x',
          '}',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [2, 1]);
      });

      this.runner.it('should handle complex variable expressions', () => {
        const program = this.helpers.createTestProgram([
          'let a = 5;',
          'let b = 3;',
          'let c = a * b + 2;',
          'c'
        ]);
        this.helpers.expectPipelineResult(program, [17]);
      });
    });
  }

  /**
   * Control flow tests
   */
  private setupControlFlowTests(): void {
    this.runner.describe('Control Flow', () => {
      this.runner.it('should handle if statements', () => {
        const program = this.helpers.createTestProgram([
          'let x = 5;',
          'if (x > 3) {',
          '  x = 10;',
          '}',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [10]);
      });

      this.runner.it('should handle if-else statements', () => {
        const program1 = this.helpers.createTestProgram([
          'let x = 5;',
          'if (x > 10) {',
          '  x = 20;',
          '} else {',
          '  x = 30;',
          '}',
          'x'
        ]);
        this.helpers.expectPipelineResult(program1, [30]);

        const program2 = this.helpers.createTestProgram([
          'let x = 15;',
          'if (x > 10) {',
          '  x = 20;',
          '} else {',
          '  x = 30;',
          '}',
          'x'
        ]);
        this.helpers.expectPipelineResult(program2, [20]);
      });

      this.runner.it('should handle while loops', () => {
        const program = this.helpers.createTestProgram([
          'let i = 0;',
          'let sum = 0;',
          'while (i < 5) {',
          '  sum = sum + i;',
          '  i = i + 1;',
          '}',
          'sum'
        ]);
        this.helpers.expectPipelineResult(program, [10]); // 0+1+2+3+4 = 10
      });

      this.runner.it('should handle nested control structures', () => {
        const program = this.helpers.createTestProgram([
          'let result = 0;',
          'let i = 0;',
          'while (i < 3) {',
          '  if (i % 2 == 0) {',
          '    result = result + i;',
          '  }',
          '  i = i + 1;',
          '}',
          'result'
        ]);
        this.helpers.expectPipelineResult(program, [2]); // 0 + 2 = 2
      });
    });
  }

  /**
   * Function tests
   */
  private setupFunctionTests(): void {
    this.runner.describe('Functions', () => {
      this.runner.it('should handle function declarations and calls', () => {
        const program = this.helpers.createTestProgram([
          'function add(a, b) {',
          '  return a + b;',
          '}',
          'add(5, 3)'
        ]);
        this.helpers.expectPipelineResult(program, [8]);
      });

      this.runner.it('should handle functions with no parameters', () => {
        const program = this.helpers.createTestProgram([
          'function getAnswer() {',
          '  return 42;',
          '}',
          'getAnswer()'
        ]);
        this.helpers.expectPipelineResult(program, [42]);
      });

      this.runner.it('should handle recursive functions', () => {
        const program = this.helpers.createTestProgram([
          'function factorial(n) {',
          '  if (n <= 1) {',
          '    return 1;',
          '  } else {',
          '    return n * factorial(n - 1);',
          '  }',
          '}',
          'factorial(5)'
        ]);
        this.helpers.expectPipelineResult(program, [120]);
      });

      this.runner.it('should handle function scope', () => {
        const program = this.helpers.createTestProgram([
          'let x = 10;',
          'function test() {',
          '  let x = 20;',
          '  return x;',
          '}',
          'test()',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [20, 10]);
      });
    });
  }

  /**
   * String operation tests
   */
  private setupStringTests(): void {
    this.runner.describe('String Operations', () => {
      this.runner.it('should handle string concatenation', () => {
        const program = this.helpers.createTestProgram([
          'let greeting = "Hello";',
          'let name = "World";',
          'greeting + " " + name'
        ]);
        this.helpers.expectPipelineResult(program, ['Hello World']);
      });

      this.runner.it('should handle string comparison', () => {
        this.helpers.expectPipelineResult('"hello" == "hello"', [true]);
        this.helpers.expectPipelineResult('"hello" == "world"', [false]);
        this.helpers.expectPipelineResult('"hello" != "world"', [true]);
      });

      this.runner.it('should handle string length', () => {
        const program = this.helpers.createTestProgram([
          'let str = "hello";',
          'length(str)'
        ]);
        this.helpers.expectPipelineResult(program, [5]);
      });

      this.runner.it('should handle string methods', () => {
        const program = this.helpers.createTestProgram([
          'let str = "hello world";',
          'substring(str, 0, 5)'
        ]);
        this.helpers.expectPipelineResult(program, ['hello']);
      });
    });
  }

  /**
   * Error handling tests
   */
  private setupErrorHandlingTests(): void {
    this.runner.describe('Error Handling', () => {
      this.runner.it('should handle division by zero', () => {
        this.helpers.expectPipelineError('5 / 0', 'Division by zero');
      });

      this.runner.it('should handle undefined variables', () => {
        this.helpers.expectPipelineError('undefinedVar', 'Undefined variable');
      });

      this.runner.it('should handle type mismatches', () => {
        this.helpers.expectPipelineError('"hello" + 42', 'Type mismatch');
      });

      this.runner.it('should handle syntax errors', () => {
        this.helpers.expectPipelineError('5 +', 'Unexpected end');
      });

      this.runner.it('should handle invalid function calls', () => {
        this.helpers.expectPipelineError('undefinedFunction()', 'Undefined function');
      });

      this.runner.it('should handle stack overflow', () => {
        const program = this.helpers.createTestProgram([
          'function infiniteRecursion() {',
          '  return infiniteRecursion();',
          '}',
          'infiniteRecursion()'
        ]);
        this.helpers.expectPipelineError(program, 'Stack overflow');
      });
    });
  }

  /**
   * Performance benchmark tests
   */
  private setupPerformanceTests(): void {
    this.runner.describe('Performance Benchmarks', () => {
      this.runner.it('should execute arithmetic operations efficiently', () => {
        const program = this.helpers.createTestProgram([
          'let result = 0;',
          'let i = 0;',
          'while (i < 1000) {',
          '  result = result + i * 2;',
          '  i = i + 1;',
          '}',
          'result'
        ]);

        const startTime = Date.now();
        this.helpers.expectPipelineResult(program, [999000]);
        const duration = Date.now() - startTime;

        // Should complete within reasonable time (adjust threshold as needed)
        if (duration > 5000) {
          throw new Error(`Performance test took too long: ${duration}ms`);
        }
      });

      this.runner.it('should handle large programs efficiently', () => {
        // Generate a program with many operations
        const operations = [];
        for (let i = 0; i < 100; i++) {
          operations.push(`let var${i} = ${i};`);
        }
        operations.push('var0 + var99');

        const program = this.helpers.createTestProgram(operations);

        const startTime = Date.now();
        this.helpers.expectPipelineResult(program, [99]);
        const duration = Date.now() - startTime;

        if (duration > 3000) {
          throw new Error(`Large program test took too long: ${duration}ms`);
        }
      });

      this.runner.it('should handle deep recursion efficiently', () => {
        const program = this.helpers.createTestProgram([
          'function fibonacci(n) {',
          '  if (n <= 1) return n;',
          '  return fibonacci(n - 1) + fibonacci(n - 2);',
          '}',
          'fibonacci(10)'
        ]);

        const startTime = Date.now();
        this.helpers.expectPipelineResult(program, [55]);
        const duration = Date.now() - startTime;

        if (duration > 2000) {
          throw new Error(`Recursion test took too long: ${duration}ms`);
        }
      });
    });
  }

  /**
   * Regression tests for known issues
   */
  private setupRegressionTests(): void {
    this.runner.describe('Regression Tests', () => {
      this.runner.it('should handle operator precedence correctly (Issue #1)', () => {
        // Test case that previously failed
        this.helpers.expectPipelineResult('2 + 3 * 4 - 1', [13]);
        this.helpers.expectPipelineResult('10 / 2 + 3', [8]);
        this.helpers.expectPipelineResult('1 + 2 * 3 + 4', [11]);
      });

      this.runner.it('should handle variable scoping in nested blocks (Issue #2)', () => {
        const program = this.helpers.createTestProgram([
          'let x = 1;',
          '{',
          '  let y = 2;',
          '  {',
          '    let z = 3;',
          '    x + y + z',
          '  }',
          '}'
        ]);
        this.helpers.expectPipelineResult(program, [6]);
      });

      this.runner.it('should handle function parameter shadowing (Issue #3)', () => {
        const program = this.helpers.createTestProgram([
          'let x = 10;',
          'function test(x) {',
          '  return x * 2;',
          '}',
          'test(5)',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [10, 10]);
      });

      this.runner.it('should handle empty blocks correctly (Issue #4)', () => {
        const program = this.helpers.createTestProgram([
          'let x = 5;',
          'if (x > 0) {',
          '}',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [5]);
      });

      this.runner.it('should handle multiple return statements (Issue #5)', () => {
        const program = this.helpers.createTestProgram([
          'function test(x) {',
          '  if (x > 0) {',
          '    return x;',
          '  }',
          '  return -x;',
          '}',
          'test(5)',
          'test(-3)'
        ]);
        this.helpers.expectPipelineResult(program, [5, 3]);
      });

      this.runner.it('should handle boolean operations correctly (Issue #6)', () => {
        this.helpers.expectPipelineResult('true && true', [true]);
        this.helpers.expectPipelineResult('true && false', [false]);
        this.helpers.expectPipelineResult('false || true', [true]);
        this.helpers.expectPipelineResult('false || false', [false]);
      });

      this.runner.it('should handle string escape sequences (Issue #7)', () => {
        this.helpers.expectPipelineResult('"hello\\nworld"', ['hello\nworld']);
        this.helpers.expectPipelineResult('"say \\"hello\\""', ['say "hello"']);
      });

      this.runner.it('should handle edge case arithmetic (Issue #8)', () => {
        this.helpers.expectPipelineResult('0 * 999', [0]);
        this.helpers.expectPipelineResult('1 * 1', [1]);
        this.helpers.expectPipelineResult('999 % 1', [0]);
      });
    });
  }
}

/**
 * Run integration tests
 */
export async function runIntegrationTests(): Promise<void> {
  const suite = new IntegrationTestSuite();
  await suite.runAll();
}