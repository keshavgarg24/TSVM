export interface TestOptions {
  timeout?: number;
  retries?: number;
  parallel?: boolean;
  verbose?: boolean;
  bail?: boolean; // Stop on first failure
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error | undefined;
  duration: number;
  skipped: boolean;
  retries: number;
}

export interface Test {
  name: string;
  fn: () => void | Promise<void>;
  skip?: boolean;
  only?: boolean;
  timeout?: number;
}

export interface TestSuite {
  name: string;
  tests: Test[];
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
  skip?: boolean;
  only?: boolean;
}

export interface TestRunnerStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  suites: number;
}

export class TestRunner {
  private suites: TestSuite[] = [];
  private options: Required<TestOptions>;
  private stats: TestRunnerStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    suites: 0
  };

  constructor(options: TestOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 5000,
      retries: options.retries ?? 0,
      parallel: options.parallel ?? false,
      verbose: options.verbose ?? false,
      bail: options.bail ?? false
    };
  }

  /**
   * Add a test suite
   */
  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  /**
   * Create a test suite
   */
  describe(name: string, fn: () => void): TestSuite {
    const suite: TestSuite = {
      name,
      tests: []
    };

    // Set current suite context
    const originalSuite = this.currentSuite;
    this.currentSuite = suite;
    
    try {
      fn();
    } finally {
      this.currentSuite = originalSuite;
    }

    this.addSuite(suite);
    return suite;
  }

  private currentSuite?: TestSuite | undefined;

  /**
   * Add a test to the current suite
   */
  it(name: string, fn: () => void | Promise<void>): Test {
    if (!this.currentSuite) {
      throw new Error('Test must be defined within a describe block');
    }

    const test: Test = { name, fn };
    this.currentSuite.tests.push(test);
    return test;
  }

  /**
   * Skip a test
   */
  xit(name: string, fn: () => void | Promise<void>): Test {
    const test = this.it(name, fn);
    test.skip = true;
    return test;
  }

  /**
   * Run only this test
   */
  fit(name: string, fn: () => void | Promise<void>): Test {
    const test = this.it(name, fn);
    test.only = true;
    return test;
  }

  /**
   * Skip a test suite
   */
  xdescribe(name: string, fn: () => void): TestSuite {
    const suite = this.describe(name, fn);
    suite.skip = true;
    return suite;
  }

  /**
   * Run only this test suite
   */
  fdescribe(name: string, fn: () => void): TestSuite {
    const suite = this.describe(name, fn);
    suite.only = true;
    return suite;
  }

  /**
   * Add beforeEach hook to current suite
   */
  beforeEach(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeEach must be defined within a describe block');
    }
    this.currentSuite.beforeEach = fn;
  }

  /**
   * Add afterEach hook to current suite
   */
  afterEach(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterEach must be defined within a describe block');
    }
    this.currentSuite.afterEach = fn;
  }

  /**
   * Add beforeAll hook to current suite
   */
  beforeAll(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeAll must be defined within a describe block');
    }
    this.currentSuite.beforeAll = fn;
  }

  /**
   * Add afterAll hook to current suite
   */
  afterAll(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterAll must be defined within a describe block');
    }
    this.currentSuite.afterAll = fn;
  }

  /**
   * Run all test suites
   */
  async run(): Promise<TestRunnerStats> {
    const startTime = Date.now();
    this.resetStats();

    // Filter suites based on 'only' flag
    let suitesToRun = this.suites;
    const onlySuites = this.suites.filter(suite => suite.only);
    if (onlySuites.length > 0) {
      suitesToRun = onlySuites;
    }

    // Filter out skipped suites
    suitesToRun = suitesToRun.filter(suite => !suite.skip);

    this.stats.suites = suitesToRun.length;

    if (this.options.parallel) {
      await this.runSuitesParallel(suitesToRun);
    } else {
      await this.runSuitesSequential(suitesToRun);
    }

    this.stats.duration = Date.now() - startTime;
    return this.stats;
  }

  /**
   * Run suites sequentially
   */
  private async runSuitesSequential(suites: TestSuite[]): Promise<void> {
    for (const suite of suites) {
      if (this.options.bail && this.stats.failed > 0) {
        break;
      }
      await this.runSuite(suite);
    }
  }

  /**
   * Run suites in parallel
   */
  private async runSuitesParallel(suites: TestSuite[]): Promise<void> {
    const promises = suites.map(suite => this.runSuite(suite));
    await Promise.all(promises);
  }

  /**
   * Run a single test suite
   */
  private async runSuite(suite: TestSuite): Promise<void> {
    if (this.options.verbose) {
      console.log(`\n${suite.name}`);
    }

    // Run beforeAll hook
    if (suite.beforeAll) {
      try {
        await this.runWithTimeout(suite.beforeAll, this.options.timeout);
      } catch (error) {
        console.error(`beforeAll failed in suite "${suite.name}":`, error);
        return;
      }
    }

    // Filter tests based on 'only' flag
    let testsToRun = suite.tests;
    const onlyTests = suite.tests.filter(test => test.only);
    if (onlyTests.length > 0) {
      testsToRun = onlyTests;
    }

    // Filter out skipped tests
    testsToRun = testsToRun.filter(test => !test.skip);

    // Run tests
    for (const test of testsToRun) {
      if (this.options.bail && this.stats.failed > 0) {
        break;
      }
      await this.runTest(suite, test);
    }

    // Count skipped tests
    const skippedTests = suite.tests.filter(test => test.skip);
    this.stats.skipped += skippedTests.length;

    // Run afterAll hook
    if (suite.afterAll) {
      try {
        await this.runWithTimeout(suite.afterAll, this.options.timeout);
      } catch (error) {
        console.error(`afterAll failed in suite "${suite.name}":`, error);
      }
    }
  }

  /**
   * Run a single test
   */
  private async runTest(suite: TestSuite, test: Test): Promise<TestResult> {
    const startTime = Date.now();
    let retries = 0;
    let lastError: Error | undefined;

    while (retries <= this.options.retries) {
      try {
        // Run beforeEach hook
        if (suite.beforeEach) {
          await this.runWithTimeout(suite.beforeEach, this.options.timeout);
        }

        // Run the test
        const timeout = test.timeout ?? this.options.timeout;
        await this.runWithTimeout(test.fn, timeout);

        // Run afterEach hook
        if (suite.afterEach) {
          await this.runWithTimeout(suite.afterEach, this.options.timeout);
        }

        // Test passed
        const result: TestResult = {
          name: test.name,
          passed: true,
          duration: Date.now() - startTime,
          skipped: false,
          retries
        };

        this.stats.total++;
        this.stats.passed++;

        if (this.options.verbose) {
          console.log(`  ✓ ${test.name} (${result.duration}ms)`);
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        retries++;

        if (retries <= this.options.retries) {
          if (this.options.verbose) {
            console.log(`  ↻ ${test.name} (retry ${retries})`);
          }
        }
      }
    }

    // Test failed after all retries
    const result: TestResult = {
      name: test.name,
      passed: false,
      error: lastError,
      duration: Date.now() - startTime,
      skipped: false,
      retries: retries - 1
    };

    this.stats.total++;
    this.stats.failed++;

    if (this.options.verbose) {
      console.log(`  ✗ ${test.name} (${result.duration}ms)`);
      if (lastError) {
        console.log(`    ${lastError.message}`);
      }
    }

    return result;
  }

  /**
   * Run a function with timeout
   */
  private async runWithTimeout(fn: () => void | Promise<void>, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);

      Promise.resolve(fn())
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      suites: 0
    };
  }

  /**
   * Get current statistics
   */
  getStats(): TestRunnerStats {
    return { ...this.stats };
  }

  /**
   * Clear all suites
   */
  clear(): void {
    this.suites = [];
    this.resetStats();
  }

  /**
   * Get all suites
   */
  getSuites(): TestSuite[] {
    return [...this.suites];
  }

  /**
   * Set options
   */
  setOptions(options: Partial<TestOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get options
   */
  getOptions(): TestOptions {
    return { ...this.options };
  }
}