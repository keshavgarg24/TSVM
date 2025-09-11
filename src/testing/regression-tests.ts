import { TestHelpers } from './test-helpers';
import { TestRunner } from './test-runner';

export interface RegressionTest {
  id: string;
  description: string;
  dateAdded: string;
  category: 'lexer' | 'parser' | 'compiler' | 'vm' | 'integration';
  severity: 'critical' | 'major' | 'minor';
  testCase: () => void;
  expectedBehavior: string;
  actualBehavior?: string;
  fixCommit?: string;
}

/**
 * Regression test suite to prevent known issues from reoccurring
 */
export class RegressionTestSuite {
  private helpers: TestHelpers;
  private runner: TestRunner;
  private tests: RegressionTest[] = [];

  constructor() {
    this.helpers = new TestHelpers();
    this.runner = new TestRunner({ verbose: true });
    this.setupRegressionTests();
  }

  /**
   * Run all regression tests
   */
  async runAll(): Promise<void> {
    console.log('🔍 Running Regression Tests...\n');

    // Group tests by category
    const categories = ['lexer', 'parser', 'compiler', 'vm', 'integration'] as const;
    
    for (const category of categories) {
      const categoryTests = this.tests.filter(t => t.category === category);
      if (categoryTests.length === 0) continue;

      this.runner.describe(`${category.toUpperCase()} Regression Tests`, () => {
        for (const test of categoryTests) {
          this.runner.it(`${test.id}: ${test.description}`, test.testCase);
        }
      });
    }

    const stats = await this.runner.run();
    
    console.log('\n📋 Regression Test Summary');
    console.log('='.repeat(40));
    console.log(`Total Tests: ${stats.total}`);
    console.log(`Passed: ${stats.passed}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Duration: ${stats.duration}ms`);

    if (stats.failed > 0) {
      console.log(`\n❌ ${stats.failed} regression test(s) failed!`);
      console.log('This indicates that previously fixed issues may have reoccurred.');
      throw new Error(`${stats.failed} regression tests failed`);
    } else {
      console.log('\n✅ All regression tests passed!');
    }
  }

  /**
   * Add a new regression test
   */
  addRegressionTest(test: RegressionTest): void {
    this.tests.push(test);
  }

  /**
   * Get all regression tests
   */
  getRegressionTests(): RegressionTest[] {
    return [...this.tests];
  }

  /**
   * Get regression tests by category
   */
  getRegressionTestsByCategory(category: RegressionTest['category']): RegressionTest[] {
    return this.tests.filter(t => t.category === category);
  }

  /**
   * Get regression tests by severity
   */
  getRegressionTestsBySeverity(severity: RegressionTest['severity']): RegressionTest[] {
    return this.tests.filter(t => t.severity === severity);
  }

  /**
   * Setup all known regression tests
   */
  private setupRegressionTests(): void {
    // Lexer regression tests
    this.addRegressionTest({
      id: 'LEX-001',
      description: 'Handle unterminated string literals',
      dateAdded: '2024-01-15',
      category: 'lexer',
      severity: 'major',
      expectedBehavior: 'Should throw error for unterminated strings',
      testCase: () => {
        this.helpers.lexer.expectError('"unterminated string', 'Unterminated string');
      }
    });

    this.addRegressionTest({
      id: 'LEX-002',
      description: 'Handle invalid escape sequences',
      dateAdded: '2024-01-16',
      category: 'lexer',
      severity: 'minor',
      expectedBehavior: 'Should handle escape sequences correctly',
      testCase: () => {
        this.helpers.lexer.expectTokenValues('"hello\\nworld"', ['"hello\\nworld"']);
      }
    });

    this.addRegressionTest({
      id: 'LEX-003',
      description: 'Handle numbers with leading zeros',
      dateAdded: '2024-01-17',
      category: 'lexer',
      severity: 'minor',
      expectedBehavior: 'Should parse numbers with leading zeros correctly',
      testCase: () => {
        this.helpers.lexer.expectTokenValues('007', ['007']);
      }
    });

    // Parser regression tests
    this.addRegressionTest({
      id: 'PAR-001',
      description: 'Handle operator precedence in complex expressions',
      dateAdded: '2024-01-18',
      category: 'parser',
      severity: 'critical',
      expectedBehavior: 'Should parse operator precedence correctly',
      testCase: () => {
        const ast = this.helpers.parser.parse('2 + 3 * 4');
        // Should parse as 2 + (3 * 4), not (2 + 3) * 4
        this.helpers.parser.expectASTStructure(ast, {
          type: 'Program',
          body: [{
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '+',
              left: { type: 'Literal', value: 2 },
              right: {
                type: 'BinaryExpression',
                operator: '*',
                left: { type: 'Literal', value: 3 },
                right: { type: 'Literal', value: 4 }
              }
            }
          }]
        });
      }
    });

    this.addRegressionTest({
      id: 'PAR-002',
      description: 'Handle empty function parameter lists',
      dateAdded: '2024-01-19',
      category: 'parser',
      severity: 'major',
      expectedBehavior: 'Should parse functions with no parameters',
      testCase: () => {
        const ast = this.helpers.parser.parse('function test() { return 42; }');
        const func = this.helpers.parser.getNodeByPath(ast, 'body[0]');
        expect(func.parameters).toEqual([]);
      }
    });

    this.addRegressionTest({
      id: 'PAR-003',
      description: 'Handle nested block statements',
      dateAdded: '2024-01-20',
      category: 'parser',
      severity: 'major',
      expectedBehavior: 'Should parse nested blocks correctly',
      testCase: () => {
        const program = '{ { let x = 1; } }';
        expect(() => this.helpers.parser.parse(program)).not.toThrow();
      }
    });

    // Compiler regression tests
    this.addRegressionTest({
      id: 'COM-001',
      description: 'Generate correct jump addresses for nested loops',
      dateAdded: '2024-01-21',
      category: 'compiler',
      severity: 'critical',
      expectedBehavior: 'Should generate correct jump instructions for nested loops',
      testCase: () => {
        const program = `
          while (true) {
            while (true) {
              break;
            }
            break;
          }
        `;
        // Should compile without throwing errors
        expect(() => this.helpers.compiler.compile(program)).not.toThrow();
      }
    });

    this.addRegressionTest({
      id: 'COM-002',
      description: 'Handle variable scoping in function parameters',
      dateAdded: '2024-01-22',
      category: 'compiler',
      severity: 'major',
      expectedBehavior: 'Should handle parameter scoping correctly',
      testCase: () => {
        const program = `
          let x = 10;
          function test(x) {
            return x;
          }
          test(5);
        `;
        expect(() => this.helpers.compiler.compile(program)).not.toThrow();
      }
    });

    this.addRegressionTest({
      id: 'COM-003',
      description: 'Generate correct instructions for function returns',
      dateAdded: '2024-01-23',
      category: 'compiler',
      severity: 'major',
      expectedBehavior: 'Should generate RETURN instruction for function returns',
      testCase: () => {
        const program = 'function test() { return 42; }';
        const instructions = this.helpers.compiler.compile(program);
        const hasReturn = instructions.some(inst => inst.opcode === 0x33); // RETURN opcode
        expect(hasReturn).toBe(true);
      }
    });

    // VM regression tests
    this.addRegressionTest({
      id: 'VM-001',
      description: 'Handle division by zero gracefully',
      dateAdded: '2024-01-24',
      category: 'vm',
      severity: 'critical',
      expectedBehavior: 'Should throw runtime error for division by zero',
      testCase: () => {
        this.helpers.vm.expectError('5 / 0', 'Division by zero');
      }
    });

    this.addRegressionTest({
      id: 'VM-002',
      description: 'Handle stack underflow in arithmetic operations',
      dateAdded: '2024-01-25',
      category: 'vm',
      severity: 'critical',
      expectedBehavior: 'Should handle stack underflow gracefully',
      testCase: () => {
        // This should be caught during compilation, but test VM robustness
        const instructions = [
          { opcode: 0x10 } // ADD without operands on stack
        ];
        expect(() => this.helpers.vm.executeInstructions(instructions)).toThrow();
      }
    });

    this.addRegressionTest({
      id: 'VM-003',
      description: 'Handle function call stack overflow',
      dateAdded: '2024-01-26',
      category: 'vm',
      severity: 'major',
      expectedBehavior: 'Should detect and prevent stack overflow',
      testCase: () => {
        const program = `
          function infiniteRecursion() {
            return infiniteRecursion();
          }
          infiniteRecursion();
        `;
        this.helpers.vm.expectError(program, 'Stack overflow');
      }
    });

    // Integration regression tests
    this.addRegressionTest({
      id: 'INT-001',
      description: 'Handle complex arithmetic expressions end-to-end',
      dateAdded: '2024-01-27',
      category: 'integration',
      severity: 'major',
      expectedBehavior: 'Should execute complex expressions correctly',
      testCase: () => {
        this.helpers.expectPipelineResult('2 + 3 * 4 - 1', [13]);
        this.helpers.expectPipelineResult('(2 + 3) * (4 - 1)', [15]);
        this.helpers.expectPipelineResult('10 / 2 + 3 * 2', [11]);
      }
    });

    this.addRegressionTest({
      id: 'INT-002',
      description: 'Handle variable scoping across function calls',
      dateAdded: '2024-01-28',
      category: 'integration',
      severity: 'major',
      expectedBehavior: 'Should maintain correct variable scoping',
      testCase: () => {
        const program = this.helpers.createTestProgram([
          'let x = 10;',
          'function test(y) {',
          '  let x = 20;',
          '  return x + y;',
          '}',
          'test(5)',
          'x'
        ]);
        this.helpers.expectPipelineResult(program, [25, 10]);
      }
    });

    this.addRegressionTest({
      id: 'INT-003',
      description: 'Handle recursive function calls correctly',
      dateAdded: '2024-01-29',
      category: 'integration',
      severity: 'major',
      expectedBehavior: 'Should execute recursive functions correctly',
      testCase: () => {
        const program = this.helpers.createTestProgram([
          'function factorial(n) {',
          '  if (n <= 1) return 1;',
          '  return n * factorial(n - 1);',
          '}',
          'factorial(5)'
        ]);
        this.helpers.expectPipelineResult(program, [120]);
      }
    });

    this.addRegressionTest({
      id: 'INT-004',
      description: 'Handle string operations with special characters',
      dateAdded: '2024-01-30',
      category: 'integration',
      severity: 'minor',
      expectedBehavior: 'Should handle strings with escape sequences',
      testCase: () => {
        this.helpers.expectPipelineResult('"hello\\nworld"', ['hello\nworld']);
        this.helpers.expectPipelineResult('"say \\"hello\\""', ['say "hello"']);
      }
    });

    this.addRegressionTest({
      id: 'INT-005',
      description: 'Handle boolean operations correctly',
      dateAdded: '2024-01-31',
      category: 'integration',
      severity: 'major',
      expectedBehavior: 'Should execute boolean operations correctly',
      testCase: () => {
        this.helpers.expectPipelineResult('true && true', [true]);
        this.helpers.expectPipelineResult('true && false', [false]);
        this.helpers.expectPipelineResult('false || true', [true]);
        this.helpers.expectPipelineResult('false || false', [false]);
        this.helpers.expectPipelineResult('!true', [false]);
        this.helpers.expectPipelineResult('!false', [true]);
      }
    });

    this.addRegressionTest({
      id: 'INT-006',
      description: 'Handle edge cases in control flow',
      dateAdded: '2024-02-01',
      category: 'integration',
      severity: 'major',
      expectedBehavior: 'Should handle edge cases in if/while statements',
      testCase: () => {
        // Empty if block
        const program1 = this.helpers.createTestProgram([
          'let x = 5;',
          'if (x > 0) {',
          '}',
          'x'
        ]);
        this.helpers.expectPipelineResult(program1, [5]);

        // While loop with false condition
        const program2 = this.helpers.createTestProgram([
          'let x = 0;',
          'while (false) {',
          '  x = 10;',
          '}',
          'x'
        ]);
        this.helpers.expectPipelineResult(program2, [0]);
      }
    });

    this.addRegressionTest({
      id: 'INT-007',
      description: 'Handle multiple return statements in functions',
      dateAdded: '2024-02-02',
      category: 'integration',
      severity: 'major',
      expectedBehavior: 'Should handle multiple return paths correctly',
      testCase: () => {
        const program = this.helpers.createTestProgram([
          'function test(x) {',
          '  if (x > 0) {',
          '    return x * 2;',
          '  }',
          '  if (x < 0) {',
          '    return x * -1;',
          '  }',
          '  return 0;',
          '}',
          'test(5)',
          'test(-3)',
          'test(0)'
        ]);
        this.helpers.expectPipelineResult(program, [10, 3, 0]);
      }
    });

    this.addRegressionTest({
      id: 'INT-008',
      description: 'Handle arithmetic edge cases',
      dateAdded: '2024-02-03',
      category: 'integration',
      severity: 'minor',
      expectedBehavior: 'Should handle arithmetic edge cases correctly',
      testCase: () => {
        this.helpers.expectPipelineResult('0 * 999', [0]);
        this.helpers.expectPipelineResult('1 * 1', [1]);
        this.helpers.expectPipelineResult('999 % 1', [0]);
        this.helpers.expectPipelineResult('5 % 5', [0]);
        this.helpers.expectPipelineResult('7 % 3', [1]);
      }
    });
  }

  /**
   * Generate regression test report
   */
  generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.tests.length,
      categories: {} as Record<string, number>,
      severities: {} as Record<string, number>,
      tests: this.tests.map(test => ({
        id: test.id,
        description: test.description,
        category: test.category,
        severity: test.severity,
        dateAdded: test.dateAdded,
        expectedBehavior: test.expectedBehavior
      }))
    };

    // Count by category
    for (const test of this.tests) {
      report.categories[test.category] = (report.categories[test.category] || 0) + 1;
    }

    // Count by severity
    for (const test of this.tests) {
      report.severities[test.severity] = (report.severities[test.severity] || 0) + 1;
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Print test statistics
   */
  printStatistics(): void {
    console.log('\n📊 Regression Test Statistics');
    console.log('='.repeat(40));
    console.log(`Total Tests: ${this.tests.length}`);

    console.log('\nBy Category:');
    const categories = {} as Record<string, number>;
    for (const test of this.tests) {
      categories[test.category] = (categories[test.category] || 0) + 1;
    }
    for (const [category, count] of Object.entries(categories)) {
      console.log(`  ${category.toUpperCase()}: ${count}`);
    }

    console.log('\nBy Severity:');
    const severities = {} as Record<string, number>;
    for (const test of this.tests) {
      severities[test.severity] = (severities[test.severity] || 0) + 1;
    }
    for (const [severity, count] of Object.entries(severities)) {
      const icon = severity === 'critical' ? '🔴' : severity === 'major' ? '🟡' : '🟢';
      console.log(`  ${icon} ${severity.toUpperCase()}: ${count}`);
    }
  }
}

/**
 * Run regression tests
 */
export async function runRegressionTests(): Promise<void> {
  const suite = new RegressionTestSuite();
  suite.printStatistics();
  await suite.runAll();
}