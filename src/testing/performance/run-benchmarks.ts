#!/usr/bin/env node
import { runAdvancedBenchmarks } from './benchmark-suite';
import { runMemoryBenchmarks } from './memory-profiler';
import { runCPUBenchmarks } from './cpu-profiler';
import { PerformanceRunner } from './performance-runner';

/**
 * Simple script to run all performance benchmarks
 */
async function runAllBenchmarks(): Promise<void> {
  console.log('🚀 TypeScript VM Performance Benchmarks');
  console.log('='.repeat(50));

  try {
    // Run comprehensive performance analysis
    const runner = new PerformanceRunner({
      includeBenchmarks: true,
      includeMemoryProfiling: true,
      includeCPUProfiling: true,
      generateReports: true,
      verbose: true
    });

    const results = await runner.runAll();

    console.log('\n✅ All benchmarks completed successfully!');
    console.log(`📊 Overall Performance Score: ${results.summary.overallScore.toFixed(1)}/100`);

  } catch (error) {
    console.error('❌ Benchmark execution failed:', error);
    process.exit(1);
  }
}

/**
 * Run individual benchmark suites
 */
async function runIndividualBenchmarks(): Promise<void> {
  console.log('🔧 Running Individual Benchmark Suites');
  console.log('='.repeat(50));

  try {
    // Run advanced benchmarks
    console.log('\n1. Advanced Performance Benchmarks');
    const benchmarkResults = await runAdvancedBenchmarks();
    console.log(`✅ Completed ${benchmarkResults.length} benchmarks`);

    // Run memory benchmarks
    console.log('\n2. Memory Profiling Benchmarks');
    const memoryResults = await runMemoryBenchmarks();
    console.log(`✅ Completed ${memoryResults.length} memory profiles`);

    // Run CPU benchmarks
    console.log('\n3. CPU Profiling Benchmarks');
    const cpuResults = await runCPUBenchmarks();
    console.log(`✅ Completed ${cpuResults.length} CPU profiles`);

    console.log('\n🎉 All individual benchmarks completed!');

  } catch (error) {
    console.error('❌ Individual benchmark execution failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--individual')) {
    await runIndividualBenchmarks();
  } else {
    await runAllBenchmarks();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { runAllBenchmarks, runIndividualBenchmarks };