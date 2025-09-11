#!/usr/bin/env node
import { AdvancedBenchmarkSuite, DetailedBenchmarkResult } from './benchmark-suite';
import { MemoryProfiler, MemoryBenchmarkResult } from './memory-profiler';
import { CPUProfiler, CPUBenchmarkResult } from './cpu-profiler';
import * as fs from 'fs';
import * as path from 'path';

export interface PerformanceRunnerOptions {
  includeBenchmarks?: boolean;
  includeMemoryProfiling?: boolean;
  includeCPUProfiling?: boolean;
  outputDir?: string;
  baselineFile?: string;
  iterations?: {
    benchmarks?: number;
    memory?: number;
    cpu?: number;
  };
  verbose?: boolean;
  generateReports?: boolean;
}

export interface PerformanceResults {
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: NodeJS.MemoryUsage;
  };
  benchmarks?: DetailedBenchmarkResult[];
  memoryProfiles?: MemoryBenchmarkResult[];
  cpuProfiles?: CPUBenchmarkResult[];
  summary: PerformanceSummary;
  recommendations: string[];
}

export interface PerformanceSummary {
  totalBenchmarks: number;
  totalDuration: number;
  averageOpsPerSecond: number;
  memoryEfficiency: number;
  cpuEfficiency: number;
  overallScore: number;
}

/**
 * Comprehensive performance test runner
 */
export class PerformanceRunner {
  private options: Required<PerformanceRunnerOptions>;

  constructor(options: PerformanceRunnerOptions = {}) {
    this.options = {
      includeBenchmarks: options.includeBenchmarks ?? true,
      includeMemoryProfiling: options.includeMemoryProfiling ?? true,
      includeCPUProfiling: options.includeCPUProfiling ?? true,
      outputDir: options.outputDir ?? './performance-results',
      baselineFile: options.baselineFile ?? '',
      iterations: {
        benchmarks: options.iterations?.benchmarks ?? 1000,
        memory: options.iterations?.memory ?? 500,
        cpu: options.iterations?.cpu ?? 1000
      },
      verbose: options.verbose ?? true,
      generateReports: options.generateReports ?? true
    };
  }

  /**
   * Run all performance tests
   */
  async runAll(): Promise<PerformanceResults> {
    console.log('🚀 Starting Comprehensive Performance Analysis');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    const results: PerformanceResults = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      },
      summary: {
        totalBenchmarks: 0,
        totalDuration: 0,
        averageOpsPerSecond: 0,
        memoryEfficiency: 0,
        cpuEfficiency: 0,
        overallScore: 0
      },
      recommendations: []
    };

    // Run benchmarks
    if (this.options.includeBenchmarks) {
      console.log('\n📊 Running Performance Benchmarks...');
      const benchmarkSuite = new AdvancedBenchmarkSuite();
      results.benchmarks = await benchmarkSuite.runAll();
    }

    // Run memory profiling
    if (this.options.includeMemoryProfiling) {
      console.log('\n🧠 Running Memory Profiling...');
      const memoryProfiler = new MemoryProfiler();
      results.memoryProfiles = await memoryProfiler.runMemoryBenchmarks();
    }

    // Run CPU profiling
    if (this.options.includeCPUProfiling) {
      console.log('\n⚡ Running CPU Profiling...');
      const cpuProfiler = new CPUProfiler();
      results.cpuProfiles = await cpuProfiler.runCPUBenchmarks();
    }

    const endTime = Date.now();
    results.summary.totalDuration = endTime - startTime;

    // Calculate summary metrics
    this.calculateSummary(results);

    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);

    // Print final summary
    this.printFinalSummary(results);

    // Generate reports if requested
    if (this.options.generateReports) {
      await this.generateReports(results);
    }

    // Compare with baseline if provided
    if (this.options.baselineFile && fs.existsSync(this.options.baselineFile)) {
      await this.compareWithBaseline(results);
    }

    return results;
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(results: PerformanceResults): void {
    let totalBenchmarks = 0;
    let totalOpsPerSecond = 0;
    let memoryEfficiency = 0;
    let cpuEfficiency = 0;

    // Benchmark metrics
    if (results.benchmarks) {
      totalBenchmarks += results.benchmarks.length;
      totalOpsPerSecond += results.benchmarks.reduce((sum, b) => sum + b.operationsPerSecond, 0);
    }

    // Memory metrics
    if (results.memoryProfiles) {
      totalBenchmarks += results.memoryProfiles.length;
      memoryEfficiency = results.memoryProfiles.reduce((sum, m) => sum + m.memoryEfficiency, 0) / results.memoryProfiles.length;
    }

    // CPU metrics
    if (results.cpuProfiles) {
      totalBenchmarks += results.cpuProfiles.length;
      cpuEfficiency = results.cpuProfiles.reduce((sum, c) => sum + c.efficiency, 0) / results.cpuProfiles.length;
    }

    results.summary = {
      totalBenchmarks,
      totalDuration: results.summary.totalDuration,
      averageOpsPerSecond: totalBenchmarks > 0 ? totalOpsPerSecond / totalBenchmarks : 0,
      memoryEfficiency,
      cpuEfficiency,
      overallScore: this.calculateOverallScore(totalOpsPerSecond, memoryEfficiency, cpuEfficiency)
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(opsPerSecond: number, memoryEff: number, cpuEff: number): number {
    // Normalize metrics to 0-100 scale and weight them
    const normalizedOps = Math.min(100, (opsPerSecond / 10000) * 100); // Assume 10k ops/sec is excellent
    const normalizedMemory = Math.min(100, (memoryEff / 1000) * 100); // Assume 1000 ops/MB is excellent
    const normalizedCPU = Math.min(100, (cpuEff / 100) * 100); // Assume 100 ops/ms is excellent

    // Weighted average: 40% throughput, 30% memory, 30% CPU
    return (normalizedOps * 0.4) + (normalizedMemory * 0.3) + (normalizedCPU * 0.3);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(results: PerformanceResults): string[] {
    const recommendations: string[] = [];

    // Overall performance assessment
    const score = results.summary.overallScore;
    if (score >= 80) {
      recommendations.push('🎉 Excellent overall performance!');
    } else if (score >= 60) {
      recommendations.push('✅ Good performance with room for optimization');
    } else if (score >= 40) {
      recommendations.push('⚠️  Moderate performance - optimization recommended');
    } else {
      recommendations.push('🚨 Poor performance - significant optimization needed');
    }

    // Specific recommendations based on metrics
    if (results.summary.averageOpsPerSecond < 1000) {
      recommendations.push('• Low throughput detected - optimize hot code paths');
    }

    if (results.summary.memoryEfficiency < 100) {
      recommendations.push('• Poor memory efficiency - reduce allocations and implement object pooling');
    }

    if (results.summary.cpuEfficiency < 10) {
      recommendations.push('• Low CPU efficiency - profile and optimize computational bottlenecks');
    }

    // Memory-specific recommendations
    if (results.memoryProfiles) {
      const leaksDetected = results.memoryProfiles.filter(m => m.profile.leakDetected).length;
      if (leaksDetected > 0) {
        recommendations.push(`• ${leaksDetected} potential memory leaks detected - investigate object retention`);
      }

      const highMemoryUsage = results.memoryProfiles.filter(m => m.profile.peakMemory > 100 * 1024 * 1024).length;
      if (highMemoryUsage > 0) {
        recommendations.push(`• ${highMemoryUsage} benchmarks with high memory usage - consider optimization`);
      }
    }

    // CPU-specific recommendations
    if (results.cpuProfiles) {
      const lowThroughput = results.cpuProfiles.filter(c => c.throughput < 500).length;
      if (lowThroughput > 0) {
        recommendations.push(`• ${lowThroughput} benchmarks with low CPU throughput - optimize algorithms`);
      }
    }

    // Component-specific recommendations
    recommendations.push('');
    recommendations.push('Component-Specific Recommendations:');
    recommendations.push('• Lexer: Consider finite state machine for tokenization');
    recommendations.push('• Parser: Implement recursive descent with memoization');
    recommendations.push('• Compiler: Optimize bytecode generation and instruction selection');
    recommendations.push('• VM: Implement stack caching and instruction fusion');

    return recommendations;
  }

  /**
   * Print final summary
   */
  private printFinalSummary(results: PerformanceResults): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL PERFORMANCE SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nExecution Time: ${(results.summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`Total Benchmarks: ${results.summary.totalBenchmarks}`);
    console.log(`Average Throughput: ${results.summary.averageOpsPerSecond.toFixed(0)} ops/sec`);
    console.log(`Memory Efficiency: ${results.summary.memoryEfficiency.toFixed(2)} ops/MB`);
    console.log(`CPU Efficiency: ${results.summary.cpuEfficiency.toFixed(2)} ops/ms`);
    console.log(`Overall Score: ${results.summary.overallScore.toFixed(1)}/100`);

    // Performance grade
    const score = results.summary.overallScore;
    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 50) grade = 'D';

    console.log(`Performance Grade: ${grade}`);

    console.log('\n📋 RECOMMENDATIONS:');
    results.recommendations.forEach(rec => console.log(rec));

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Generate detailed reports
   */
  private async generateReports(results: PerformanceResults): Promise<void> {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Generate JSON report
    const jsonReport = path.join(this.options.outputDir, `performance-report-${timestamp}.json`);
    fs.writeFileSync(jsonReport, JSON.stringify(results, null, 2));

    // Generate HTML report
    const htmlReport = path.join(this.options.outputDir, `performance-report-${timestamp}.html`);
    const htmlContent = this.generateHTMLReport(results);
    fs.writeFileSync(htmlReport, htmlContent);

    // Generate CSV summary
    const csvReport = path.join(this.options.outputDir, `performance-summary-${timestamp}.csv`);
    const csvContent = this.generateCSVReport(results);
    fs.writeFileSync(csvReport, csvContent);

    console.log(`\n📄 Reports generated:`);
    console.log(`  JSON: ${jsonReport}`);
    console.log(`  HTML: ${htmlReport}`);
    console.log(`  CSV: ${csvReport}`);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(results: PerformanceResults): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>TypeScript VM Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4f8; padding: 15px; border-radius: 5px; flex: 1; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .grade-A { color: #28a745; }
        .grade-B { color: #ffc107; }
        .grade-C { color: #fd7e14; }
        .grade-D { color: #dc3545; }
        .grade-F { color: #6f42c1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TypeScript VM Performance Report</h1>
        <p>Generated: ${results.timestamp}</p>
        <p>Environment: Node.js ${results.environment.nodeVersion} on ${results.environment.platform}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Overall Score</h3>
            <h2 class="grade-${results.summary.overallScore >= 80 ? 'A' : results.summary.overallScore >= 60 ? 'B' : 'C'}">${results.summary.overallScore.toFixed(1)}/100</h2>
        </div>
        <div class="metric">
            <h3>Throughput</h3>
            <p>${results.summary.averageOpsPerSecond.toFixed(0)} ops/sec</p>
        </div>
        <div class="metric">
            <h3>Memory Efficiency</h3>
            <p>${results.summary.memoryEfficiency.toFixed(2)} ops/MB</p>
        </div>
        <div class="metric">
            <h3>CPU Efficiency</h3>
            <p>${results.summary.cpuEfficiency.toFixed(2)} ops/ms</p>
        </div>
    </div>

    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    ${results.benchmarks ? `
    <h3>Benchmark Results</h3>
    <table>
        <tr><th>Name</th><th>Ops/Sec</th><th>Avg Time (ms)</th><th>Memory (MB)</th></tr>
        ${results.benchmarks.map(b => `
        <tr>
            <td>${b.name}</td>
            <td>${b.operationsPerSecond.toFixed(0)}</td>
            <td>${b.averageDuration.toFixed(3)}</td>
            <td>${b.memoryUsage ? (b.memoryUsage.delta / 1024 / 1024).toFixed(2) : 'N/A'}</td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    <p><small>Report generated by TypeScript VM Performance Runner</small></p>
</body>
</html>
    `;
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(results: PerformanceResults): string {
    const lines = ['Category,Name,Value,Unit'];
    
    lines.push(`Summary,Overall Score,${results.summary.overallScore.toFixed(1)},/100`);
    lines.push(`Summary,Average Throughput,${results.summary.averageOpsPerSecond.toFixed(0)},ops/sec`);
    lines.push(`Summary,Memory Efficiency,${results.summary.memoryEfficiency.toFixed(2)},ops/MB`);
    lines.push(`Summary,CPU Efficiency,${results.summary.cpuEfficiency.toFixed(2)},ops/ms`);

    if (results.benchmarks) {
      for (const benchmark of results.benchmarks) {
        lines.push(`Benchmark,${benchmark.name},${benchmark.operationsPerSecond.toFixed(0)},ops/sec`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Compare with baseline results
   */
  private async compareWithBaseline(results: PerformanceResults): Promise<void> {
    try {
      const baselineData = JSON.parse(fs.readFileSync(this.options.baselineFile, 'utf8'));
      console.log('\n📈 BASELINE COMPARISON');
      console.log('='.repeat(40));

      // Compare overall scores
      const scoreDiff = results.summary.overallScore - baselineData.summary.overallScore;
      console.log(`Overall Score: ${results.summary.overallScore.toFixed(1)} vs ${baselineData.summary.overallScore.toFixed(1)} (${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(1)})`);

      // Compare throughput
      const throughputDiff = ((results.summary.averageOpsPerSecond - baselineData.summary.averageOpsPerSecond) / baselineData.summary.averageOpsPerSecond) * 100;
      console.log(`Throughput: ${throughputDiff > 0 ? '+' : ''}${throughputDiff.toFixed(1)}% change`);

      if (Math.abs(scoreDiff) > 5) {
        console.log(scoreDiff > 0 ? '🎉 Significant performance improvement!' : '⚠️  Performance regression detected');
      } else {
        console.log('📊 Performance is stable');
      }

    } catch (error) {
      console.log(`⚠️  Could not compare with baseline: ${error}`);
    }
  }
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: PerformanceRunnerOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--no-benchmarks':
        options.includeBenchmarks = false;
        break;
      case '--no-memory':
        options.includeMemoryProfiling = false;
        break;
      case '--no-cpu':
        options.includeCPUProfiling = false;
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--baseline':
        options.baselineFile = args[++i];
        break;
      case '--quiet':
        options.verbose = false;
        break;
      case '--no-reports':
        options.generateReports = false;
        break;
    }
  }

  const runner = new PerformanceRunner(options);
  await runner.runAll();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}