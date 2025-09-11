#!/usr/bin/env node

import { runIntegrationTests } from './integration-tests';
import { runPerformanceBenchmarks } from './performance-benchmarks';
import { runRegressionTests } from './regression-tests';

export interface IntegrationRunnerOptions {
  includePerformance?: boolean;
  includeRegression?: boolean;
  includeIntegration?: boolean;
  outputFormat?: 'console' | 'json' | 'html';
  outputFile?: string;
  baseline?: string; // Path to baseline performance results
  verbose?: boolean;
}

/**
 * Main integration test runner
 */
export class IntegrationRunner {
  private options: Required<IntegrationRunnerOptions>;

  constructor(options: IntegrationRunnerOptions = {}) {
    this.options = {
      includePerformance: options.includePerformance ?? true,
      includeRegression: options.includeRegression ?? true,
      includeIntegration: options.includeIntegration ?? true,
      outputFormat: options.outputFormat ?? 'console',
      outputFile: options.outputFile ?? '',
      baseline: options.baseline ?? '',
      verbose: options.verbose ?? false
    };
  }

  /**
   * Run all selected test suites
   */
  async runAll(): Promise<void> {
    console.log('🚀 TypeScript VM Integration Test Suite');
    console.log('=' .repeat(50));
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log(`Options: ${JSON.stringify(this.options, null, 2)}\n`);

    const results = {
      timestamp: new Date().toISOString(),
      integration: null as any,
      performance: null as any,
      regression: null as any,
      summary: {
        totalDuration: 0,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        success: true
      }
    };

    const startTime = Date.now();

    try {
      // Run integration tests
      if (this.options.includeIntegration) {
        console.log('🧪 Running Integration Tests...');
        const integrationStart = Date.now();
        await runIntegrationTests();
        const integrationDuration = Date.now() - integrationStart;
        
        results.integration = {
          duration: integrationDuration,
          success: true
        };
        
        console.log(`✅ Integration tests completed in ${integrationDuration}ms\n`);
      }

      // Run regression tests
      if (this.options.includeRegression) {
        console.log('🔍 Running Regression Tests...');
        const regressionStart = Date.now();
        await runRegressionTests();
        const regressionDuration = Date.now() - regressionStart;
        
        results.regression = {
          duration: regressionDuration,
          success: true
        };
        
        console.log(`✅ Regression tests completed in ${regressionDuration}ms\n`);
      }

      // Run performance benchmarks
      if (this.options.includePerformance) {
        console.log('📊 Running Performance Benchmarks...');
        const performanceStart = Date.now();
        const benchmarkResults = await runPerformanceBenchmarks();
        const performanceDuration = Date.now() - performanceStart;
        
        results.performance = {
          duration: performanceDuration,
          results: benchmarkResults,
          success: true
        };
        
        console.log(`✅ Performance benchmarks completed in ${performanceDuration}ms\n`);
      }

      // Calculate summary
      const totalDuration = Date.now() - startTime;
      results.summary.totalDuration = totalDuration;
      results.summary.success = true;

      // Output results
      await this.outputResults(results);

      console.log('🎉 All tests completed successfully!');
      console.log(`Total duration: ${totalDuration}ms`);

    } catch (error) {
      results.summary.success = false;
      results.summary.totalDuration = Date.now() - startTime;
      
      console.error('\n❌ Test suite failed:');
      console.error(error instanceof Error ? error.message : String(error));
      
      await this.outputResults(results);
      
      process.exit(1);
    }
  }

  /**
   * Output results in the specified format
   */
  private async outputResults(results: any): Promise<void> {
    switch (this.options.outputFormat) {
      case 'json':
        await this.outputJSON(results);
        break;
      case 'html':
        await this.outputHTML(results);
        break;
      case 'console':
      default:
        this.outputConsole(results);
        break;
    }
  }

  /**
   * Output results to console
   */
  private outputConsole(results: any): void {
    console.log('\n📋 Test Suite Summary');
    console.log('=' .repeat(30));
    
    if (results.integration) {
      console.log(`Integration Tests: ${results.integration.success ? '✅' : '❌'} (${results.integration.duration}ms)`);
    }
    
    if (results.regression) {
      console.log(`Regression Tests: ${results.regression.success ? '✅' : '❌'} (${results.regression.duration}ms)`);
    }
    
    if (results.performance) {
      console.log(`Performance Tests: ${results.performance.success ? '✅' : '❌'} (${results.performance.duration}ms)`);
      
      if (results.performance.results && this.options.verbose) {
        console.log('\nPerformance Summary:');
        for (const suite of results.performance.results) {
          console.log(`  ${suite.name}: ${suite.totalDuration}ms`);
          for (const result of suite.results) {
            console.log(`    ${result.name}: ${result.opsPerSecond.toLocaleString()} ops/sec`);
          }
        }
      }
    }
    
    console.log(`\nOverall: ${results.summary.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Total Duration: ${results.summary.totalDuration}ms`);
  }

  /**
   * Output results to JSON file
   */
  private async outputJSON(results: any): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    const outputPath = this.options.outputFile || 'integration-test-results.json';
    const fullPath = path.resolve(outputPath);
    
    fs.writeFileSync(fullPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${fullPath}`);
  }

  /**
   * Output results to HTML file
   */
  private async outputHTML(results: any): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    const html = this.generateHTML(results);
    const outputPath = this.options.outputFile || 'integration-test-results.html';
    const fullPath = path.resolve(outputPath);
    
    fs.writeFileSync(fullPath, html);
    console.log(`📄 HTML report saved to: ${fullPath}`);
  }

  /**
   * Generate HTML report
   */
  private generateHTML(results: any): string {
    const successIcon = '✅';
    const failIcon = '❌';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>TypeScript VM Integration Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .card.success { border-left-color: #28a745; }
        .card.failure { border-left-color: #dc3545; }
        .card h3 { margin: 0 0 10px 0; color: #333; }
        .card .value { font-size: 24px; font-weight: bold; color: #007bff; }
        .card.success .value { color: #28a745; }
        .card.failure .value { color: #dc3545; }
        .performance { margin-top: 30px; }
        .performance table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .performance th, .performance td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .performance th { background: #f8f9fa; font-weight: bold; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TypeScript VM Integration Test Results</h1>
            <p>Generated on ${new Date(results.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="card ${results.summary.success ? 'success' : 'failure'}">
                <h3>Overall Status</h3>
                <div class="value">${results.summary.success ? successIcon + ' SUCCESS' : failIcon + ' FAILED'}</div>
            </div>
            
            <div class="card">
                <h3>Total Duration</h3>
                <div class="value">${results.summary.totalDuration}ms</div>
            </div>
            
            ${results.integration ? `
            <div class="card ${results.integration.success ? 'success' : 'failure'}">
                <h3>Integration Tests</h3>
                <div class="value">${results.integration.success ? successIcon : failIcon} ${results.integration.duration}ms</div>
            </div>
            ` : ''}
            
            ${results.regression ? `
            <div class="card ${results.regression.success ? 'success' : 'failure'}">
                <h3>Regression Tests</h3>
                <div class="value">${results.regression.success ? successIcon : failIcon} ${results.regression.duration}ms</div>
            </div>
            ` : ''}
            
            ${results.performance ? `
            <div class="card ${results.performance.success ? 'success' : 'failure'}">
                <h3>Performance Tests</h3>
                <div class="value">${results.performance.success ? successIcon : failIcon} ${results.performance.duration}ms</div>
            </div>
            ` : ''}
        </div>
        
        ${results.performance && results.performance.results ? `
        <div class="performance">
            <h2>📊 Performance Benchmarks</h2>
            ${results.performance.results.map((suite: any) => `
                <h3>${suite.name}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Benchmark</th>
                            <th>Operations/sec</th>
                            <th>Duration</th>
                            <th>Operations</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suite.results.map((result: any) => `
                            <tr>
                                <td>${result.name}</td>
                                <td>${result.opsPerSecond.toLocaleString()}</td>
                                <td>${result.duration}ms</td>
                                <td>${result.operations.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="timestamp">
            Report generated by TypeScript VM Integration Test Suite
        </div>
    </div>
</body>
</html>`;
  }
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: IntegrationRunnerOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--no-performance':
        options.includePerformance = false;
        break;
      case '--no-regression':
        options.includeRegression = false;
        break;
      case '--no-integration':
        options.includeIntegration = false;
        break;
      case '--format':
        options.outputFormat = args[++i] as 'console' | 'json' | 'html';
        break;
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--baseline':
        options.baseline = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
TypeScript VM Integration Test Runner

Usage: npm run test:integration [options]

Options:
  --no-performance    Skip performance benchmarks
  --no-regression     Skip regression tests
  --no-integration    Skip integration tests
  --format <format>   Output format: console, json, html (default: console)
  --output <file>     Output file path (for json/html formats)
  --baseline <file>   Baseline performance results for comparison
  --verbose           Verbose output
  --help              Show this help message

Examples:
  npm run test:integration
  npm run test:integration --format json --output results.json
  npm run test:integration --no-performance --verbose
        `);
        process.exit(0);
        break;
    }
  }

  const runner = new IntegrationRunner(options);
  await runner.runAll();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runIntegrationRunner };