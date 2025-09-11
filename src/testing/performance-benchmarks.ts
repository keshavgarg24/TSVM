import { TestHelpers } from './test-helpers';

export interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  memoryUsage?: number;
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  totalDuration: number;
}

/**
 * Performance benchmark suite for the TypeScript VM
 */
export class PerformanceBenchmarks {
  private helpers: TestHelpers;
  private results: BenchmarkSuite[] = [];

  constructor() {
    this.helpers = new TestHelpers();
  }

  /**
   * Run all performance benchmarks
   */
  async runAll(): Promise<BenchmarkSuite[]> {
    console.log('🚀 Starting Performance Benchmarks...\n');

    await this.benchmarkArithmetic();
    await this.benchmarkVariables();
    await this.benchmarkControlFlow();
    await this.benchmarkFunctions();
    await this.benchmarkStringOperations();
    await this.benchmarkComplexPrograms();

    this.printSummary();
    return this.results;
  }

  /**
   * Benchmark arithmetic operations
   */
  private async benchmarkArithmetic(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Arithmetic Operations',
      results: [],
      totalDuration: 0
    };

    // Simple arithmetic
    suite.results.push(await this.benchmark(
      'Simple Addition',
      () => this.helpers.expectPipelineResult('5 + 3', [8]),
      10000
    ));

    suite.results.push(await this.benchmark(
      'Complex Expression',
      () => this.helpers.expectPipelineResult('2 * 3 + 4 * 5 - 1', [25]),
      5000
    ));

    // Arithmetic loop
    const arithmeticLoop = this.helpers.createTestProgram([
      'let result = 0;',
      'let i = 0;',
      'while (i < 100) {',
      '  result = result + i * 2;',
      '  i = i + 1;',
      '}',
      'result'
    ]);

    suite.results.push(await this.benchmark(
      'Arithmetic Loop (100 iterations)',
      () => this.helpers.expectPipelineResult(arithmeticLoop, [9900]),
      100
    ));

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    this.results.push(suite);
  }

  /**
   * Benchmark variable operations
   */
  private async benchmarkVariables(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Variable Operations',
      results: [],
      totalDuration: 0
    };

    // Variable declaration and access
    suite.results.push(await this.benchmark(
      'Variable Declaration',
      () => this.helpers.expectPipelineResult('let x = 42; x', [42]),
      10000
    ));

    // Multiple variables
    const multipleVars = this.helpers.createTestProgram([
      'let a = 1;',
      'let b = 2;',
      'let c = 3;',
      'let d = 4;',
      'let e = 5;',
      'a + b + c + d + e'
    ]);

    suite.results.push(await this.benchmark(
      'Multiple Variables',
      () => this.helpers.expectPipelineResult(multipleVars, [15]),
      5000
    ));

    // Variable assignment in loop
    const varLoop = this.helpers.createTestProgram([
      'let x = 0;',
      'let i = 0;',
      'while (i < 50) {',
      '  x = x + 1;',
      '  i = i + 1;',
      '}',
      'x'
    ]);

    suite.results.push(await this.benchmark(
      'Variable Assignment Loop',
      () => this.helpers.expectPipelineResult(varLoop, [50]),
      200
    ));

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    this.results.push(suite);
  }

  /**
   * Benchmark control flow
   */
  private async benchmarkControlFlow(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Control Flow',
      results: [],
      totalDuration: 0
    };

    // If statement
    suite.results.push(await this.benchmark(
      'If Statement',
      () => this.helpers.expectPipelineResult('if (5 > 3) { 10 } else { 20 }', [10]),
      5000
    ));

    // Nested if statements
    const nestedIf = this.helpers.createTestProgram([
      'let x = 5;',
      'if (x > 0) {',
      '  if (x > 3) {',
      '    if (x > 4) {',
      '      x = 100;',
      '    }',
      '  }',
      '}',
      'x'
    ]);

    suite.results.push(await this.benchmark(
      'Nested If Statements',
      () => this.helpers.expectPipelineResult(nestedIf, [100]),
      2000
    ));

    // While loop
    const whileLoop = this.helpers.createTestProgram([
      'let sum = 0;',
      'let i = 0;',
      'while (i < 20) {',
      '  sum = sum + i;',
      '  i = i + 1;',
      '}',
      'sum'
    ]);

    suite.results.push(await this.benchmark(
      'While Loop (20 iterations)',
      () => this.helpers.expectPipelineResult(whileLoop, [190]),
      500
    ));

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    this.results.push(suite);
  }

  /**
   * Benchmark function operations
   */
  private async benchmarkFunctions(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Function Operations',
      results: [],
      totalDuration: 0
    };

    // Simple function call
    const simpleFunction = this.helpers.createTestProgram([
      'function add(a, b) {',
      '  return a + b;',
      '}',
      'add(5, 3)'
    ]);

    suite.results.push(await this.benchmark(
      'Simple Function Call',
      () => this.helpers.expectPipelineResult(simpleFunction, [8]),
      5000
    ));

    // Recursive function
    const recursiveFunction = this.helpers.createTestProgram([
      'function factorial(n) {',
      '  if (n <= 1) return 1;',
      '  return n * factorial(n - 1);',
      '}',
      'factorial(8)'
    ]);

    suite.results.push(await this.benchmark(
      'Recursive Function (factorial 8)',
      () => this.helpers.expectPipelineResult(recursiveFunction, [40320]),
      1000
    ));

    // Function with loop
    const functionWithLoop = this.helpers.createTestProgram([
      'function sumRange(n) {',
      '  let sum = 0;',
      '  let i = 0;',
      '  while (i <= n) {',
      '    sum = sum + i;',
      '    i = i + 1;',
      '  }',
      '  return sum;',
      '}',
      'sumRange(10)'
    ]);

    suite.results.push(await this.benchmark(
      'Function with Loop',
      () => this.helpers.expectPipelineResult(functionWithLoop, [55]),
      1000
    ));

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    this.results.push(suite);
  }

  /**
   * Benchmark string operations
   */
  private async benchmarkStringOperations(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'String Operations',
      results: [],
      totalDuration: 0
    };

    // String concatenation
    suite.results.push(await this.benchmark(
      'String Concatenation',
      () => this.helpers.expectPipelineResult('"hello" + " " + "world"', ['hello world']),
      5000
    ));

    // String comparison
    suite.results.push(await this.benchmark(
      'String Comparison',
      () => this.helpers.expectPipelineResult('"hello" == "hello"', [true]),
      5000
    ));

    // String length
    suite.results.push(await this.benchmark(
      'String Length',
      () => this.helpers.expectPipelineResult('length("hello world")', [11]),
      3000
    ));

    // String operations in loop
    const stringLoop = this.helpers.createTestProgram([
      'let result = "";',
      'let i = 0;',
      'while (i < 5) {',
      '  result = result + "a";',
      '  i = i + 1;',
      '}',
      'length(result)'
    ]);

    suite.results.push(await this.benchmark(
      'String Operations in Loop',
      () => this.helpers.expectPipelineResult(stringLoop, [5]),
      500
    ));

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    this.results.push(suite);
  }

  /**
   * Benchmark complex programs
   */
  private async benchmarkComplexPrograms(): Promise<void> {
    const suite: BenchmarkSuite = {
      name: 'Complex Programs',
      results: [],
      totalDuration: 0
    };

    // Fibonacci sequence
    const fibonacci = this.helpers.createTestProgram([
      'function fib(n) {',
      '  if (n <= 1) return n;',
      '  return fib(n - 1) + fib(n - 2);',
      '}',
      'fib(12)'
    ]);

    suite.results.push(await this.benchmark(
      'Fibonacci (12th number)',
      () => this.helpers.expectPipelineResult(fibonacci, [144]),
      50
    ));

    // Prime number check
    const primeCheck = this.helpers.createTestProgram([
      'function isPrime(n) {',
      '  if (n <= 1) return false;',
      '  if (n <= 3) return true;',
      '  if (n % 2 == 0 || n % 3 == 0) return false;',
      '  let i = 5;',
      '  while (i * i <= n) {',
      '    if (n % i == 0 || n % (i + 2) == 0) return false;',
      '    i = i + 6;',
      '  }',
      '  return true;',
      '}',
      'isPrime(97)'
    ]);

    suite.results.push(await this.benchmark(
      'Prime Number Check (97)',
      () => this.helpers.expectPipelineResult(primeCheck, [true]),
      100
    ));

    // Nested loops
    const nestedLoops = this.helpers.createTestProgram([
      'let sum = 0;',
      'let i = 0;',
      'while (i < 10) {',
      '  let j = 0;',
      '  while (j < 10) {',
      '    sum = sum + i * j;',
      '    j = j + 1;',
      '  }',
      '  i = i + 1;',
      '}',
      'sum'
    ]);

    suite.results.push(await this.benchmark(
      'Nested Loops (10x10)',
      () => this.helpers.expectPipelineResult(nestedLoops, [2025]),
      100
    ));

    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);
    this.results.push(suite);
  }

  /**
   * Run a single benchmark
   */
  private async benchmark(
    name: string,
    operation: () => void,
    iterations: number
  ): Promise<BenchmarkResult> {
    // Warm up
    for (let i = 0; i < Math.min(10, iterations); i++) {
      operation();
    }

    // Measure memory before
    const memoryBefore = process.memoryUsage().heapUsed;

    // Run benchmark
    const startTime = Date.now();
    for (let i = 0; i < iterations; i++) {
      operation();
    }
    const endTime = Date.now();

    // Measure memory after
    const memoryAfter = process.memoryUsage().heapUsed;

    const duration = endTime - startTime;
    const opsPerSecond = Math.round((iterations / duration) * 1000);
    const memoryUsage = memoryAfter - memoryBefore;

    const result: BenchmarkResult = {
      name,
      duration,
      operations: iterations,
      opsPerSecond,
      memoryUsage
    };

    console.log(`  ✓ ${name}: ${opsPerSecond.toLocaleString()} ops/sec (${duration}ms for ${iterations.toLocaleString()} ops)`);

    return result;
  }

  /**
   * Print benchmark summary
   */
  private printSummary(): void {
    console.log('\n📊 Performance Benchmark Summary');
    console.log('='.repeat(50));

    let totalDuration = 0;
    let totalOperations = 0;

    for (const suite of this.results) {
      console.log(`\n${suite.name}:`);
      console.log('-'.repeat(suite.name.length + 1));

      for (const result of suite.results) {
        console.log(`  ${result.name.padEnd(30)} ${result.opsPerSecond.toLocaleString().padStart(10)} ops/sec`);
        totalOperations += result.operations;
      }

      console.log(`  Suite Total: ${suite.totalDuration}ms`);
      totalDuration += suite.totalDuration;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Total Operations: ${totalOperations.toLocaleString()}`);
    console.log(`Average Throughput: ${Math.round((totalOperations / totalDuration) * 1000).toLocaleString()} ops/sec`);
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      suites: this.results,
      summary: {
        totalDuration: this.results.reduce((sum, s) => sum + s.totalDuration, 0),
        totalOperations: this.results.reduce((sum, s) => sum + s.results.reduce((ops, r) => ops + r.operations, 0), 0),
        suiteCount: this.results.length,
        benchmarkCount: this.results.reduce((sum, s) => sum + s.results.length, 0)
      }
    }, null, 2);
  }

  /**
   * Compare with baseline results
   */
  compareWithBaseline(baselineResults: BenchmarkSuite[]): void {
    console.log('\n📈 Performance Comparison with Baseline');
    console.log('='.repeat(50));

    for (const suite of this.results) {
      const baselineSuite = baselineResults.find(s => s.name === suite.name);
      if (!baselineSuite) continue;

      console.log(`\n${suite.name}:`);
      console.log('-'.repeat(suite.name.length + 1));

      for (const result of suite.results) {
        const baselineResult = baselineSuite.results.find(r => r.name === result.name);
        if (!baselineResult) continue;

        const improvement = ((result.opsPerSecond - baselineResult.opsPerSecond) / baselineResult.opsPerSecond) * 100;
        const symbol = improvement > 0 ? '📈' : improvement < 0 ? '📉' : '➡️';
        const color = improvement > 0 ? '\x1b[32m' : improvement < 0 ? '\x1b[31m' : '\x1b[33m';
        const reset = '\x1b[0m';

        console.log(`  ${symbol} ${result.name.padEnd(25)} ${color}${improvement.toFixed(1)}%${reset} (${result.opsPerSecond.toLocaleString()} vs ${baselineResult.opsPerSecond.toLocaleString()})`);
      }
    }
  }
}

/**
 * Run performance benchmarks
 */
export async function runPerformanceBenchmarks(): Promise<BenchmarkSuite[]> {
  const benchmarks = new PerformanceBenchmarks();
  return await benchmarks.runAll();
}