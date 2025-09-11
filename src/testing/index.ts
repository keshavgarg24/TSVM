// Test framework exports
export { TestSuite, Test, TestResult, TestRunner, TestOptions } from './test-runner';
export { 
  LexerTestHelper, 
  ParserTestHelper, 
  CompilerTestHelper, 
  VMTestHelper,
  TestHelpers 
} from './test-helpers';
export { 
  TestReporter, 
  ConsoleReporter, 
  JSONReporter, 
  HTMLReporter 
} from './reporters';
export { 
  TestUtils,
  createMockToken,
  createMockAST,
  createMockInstruction,
  createMockValue
} from './test-utils';

// Integration test suite exports
export { IntegrationTestSuite, runIntegrationTests } from './integration-tests';
export { 
  PerformanceBenchmarks, 
  BenchmarkResult, 
  BenchmarkSuite,
  runPerformanceBenchmarks 
} from './performance-benchmarks';
export { 
  RegressionTestSuite, 
  RegressionTest,
  runRegressionTests 
} from './regression-tests';
export { 
  IntegrationRunner, 
  IntegrationRunnerOptions,
  runIntegrationRunner 
} from './integration-runner';