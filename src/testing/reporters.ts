import { TestRunnerStats, TestResult } from "./test-runner";

export interface TestReporter {
  onStart(): void;
  onSuiteStart(suiteName: string): void;
  onSuiteEnd(suiteName: string): void;
  onTestStart(testName: string): void;
  onTestEnd(result: TestResult): void;
  onEnd(stats: TestRunnerStats): void;
}

/**
 * Console reporter for test results
 */
export class ConsoleReporter implements TestReporter {
  private currentSuite = "";
  private suiteStartTime = 0;

  onStart(): void {
    console.log("Starting test run...\n");
  }

  onSuiteStart(suiteName: string): void {
    this.currentSuite = suiteName;
    this.suiteStartTime = Date.now();
    console.log(`${suiteName}`);
  }

  onSuiteEnd(suiteName: string): void {
    const duration = Date.now() - this.suiteStartTime;
    console.log(`  (${duration}ms)\n`);
  }

  onTestStart(testName: string): void {
    // No output for test start in console reporter
  }

  onTestEnd(result: TestResult): void {
    const icon = result.passed ? "✓" : "✗";
    const color = result.passed ? "\x1b[32m" : "\x1b[31m"; // Green or red
    const reset = "\x1b[0m";

    let output = `  ${color}${icon}${reset} ${result.name}`;

    if (result.duration > 100) {
      output += ` (${result.duration}ms)`;
    }

    if (result.retries > 0) {
      output += ` (${result.retries} retries)`;
    }

    console.log(output);

    if (!result.passed && result.error) {
      console.log(`    ${result.error.message}`);
      if (result.error.stack) {
        const stackLines = result.error.stack.split("\n").slice(1, 4);
        stackLines.forEach((line) => console.log(`    ${line.trim()}`));
      }
    }
  }

  onEnd(stats: TestRunnerStats): void {
    console.log("\n" + "=".repeat(50));
    console.log(`Test Results:`);
    console.log(`  Suites: ${stats.suites}`);
    console.log(`  Tests:  ${stats.total}`);
    console.log(`  Passed: ${stats.passed}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Duration: ${stats.duration}ms`);

    if (stats.failed > 0) {
      console.log(`\n❌ ${stats.failed} test(s) failed`);
    } else {
      console.log(`\n✅ All tests passed!`);
    }
  }
}

/**
 * JSON reporter for test results
 */
export class JSONReporter implements TestReporter {
  private results: any = {
    suites: [],
    stats: null,
  };
  private currentSuite: any = null;

  onStart(): void {
    this.results = {
      suites: [],
      stats: null,
      startTime: new Date().toISOString(),
    };
  }

  onSuiteStart(suiteName: string): void {
    this.currentSuite = {
      name: suiteName,
      tests: [],
      startTime: new Date().toISOString(),
    };
  }

  onSuiteEnd(suiteName: string): void {
    if (this.currentSuite) {
      this.currentSuite.endTime = new Date().toISOString();
      this.results.suites.push(this.currentSuite);
      this.currentSuite = null;
    }
  }

  onTestStart(testName: string): void {
    // No action needed for JSON reporter
  }

  onTestEnd(result: TestResult): void {
    if (this.currentSuite) {
      this.currentSuite.tests.push({
        name: result.name,
        passed: result.passed,
        duration: result.duration,
        skipped: result.skipped,
        retries: result.retries,
        error: result.error
          ? {
              message: result.error.message,
              stack: result.error.stack,
            }
          : null,
      });
    }
  }

  onEnd(stats: TestRunnerStats): void {
    this.results.stats = stats;
    this.results.endTime = new Date().toISOString();
    console.log(JSON.stringify(this.results, null, 2));
  }

  getResults(): any {
    return this.results;
  }
}

/**
 * HTML reporter for test results
 */
export class HTMLReporter implements TestReporter {
  private html = "";
  private currentSuite = "";

  onStart(): void {
    this.html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .suite { margin-bottom: 20px; }
        .suite-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .test { margin-left: 20px; margin-bottom: 5px; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        .error { margin-left: 40px; color: red; font-family: monospace; }
        .stats { margin-top: 30px; padding: 20px; background: #f5f5f5; }
        .duration { color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <h1>Test Results</h1>
    <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
`;
  }

  onSuiteStart(suiteName: string): void {
    this.currentSuite = suiteName;
    this.html += `    <div class="suite">
        <div class="suite-name">${this.escapeHtml(suiteName)}</div>
`;
  }

  onSuiteEnd(suiteName: string): void {
    this.html += `    </div>
`;
  }

  onTestStart(testName: string): void {
    // No action needed
  }

  onTestEnd(result: TestResult): void {
    const className = result.passed
      ? "passed"
      : result.skipped
      ? "skipped"
      : "failed";
    const icon = result.passed ? "✓" : result.skipped ? "○" : "✗";

    this.html += `        <div class="test ${className}">
            ${icon} ${this.escapeHtml(result.name)}
            <span class="duration">(${result.duration}ms)</span>
`;

    if (!result.passed && result.error) {
      this.html += `            <div class="error">${this.escapeHtml(
        result.error.message
      )}</div>
`;
    }

    this.html += `        </div>
`;
  }

  onEnd(stats: TestRunnerStats): void {
    this.html += `
    <div class="stats">
        <h2>Summary</h2>
        <p>Suites: ${stats.suites}</p>
        <p>Tests: ${stats.total}</p>
        <p class="passed">Passed: ${stats.passed}</p>
        <p class="failed">Failed: ${stats.failed}</p>
        <p class="skipped">Skipped: ${stats.skipped}</p>
        <p>Duration: ${stats.duration}ms</p>
    </div>
</body>
</html>`;

    console.log(this.html);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  getHTML(): string {
    return this.html;
  }
}

/**
 * Multi-reporter that delegates to multiple reporters
 */
export class MultiReporter implements TestReporter {
  private reporters: TestReporter[];

  constructor(reporters: TestReporter[]) {
    this.reporters = reporters;
  }

  onStart(): void {
    this.reporters.forEach((reporter) => reporter.onStart());
  }

  onSuiteStart(suiteName: string): void {
    this.reporters.forEach((reporter) => reporter.onSuiteStart(suiteName));
  }

  onSuiteEnd(suiteName: string): void {
    this.reporters.forEach((reporter) => reporter.onSuiteEnd(suiteName));
  }

  onTestStart(testName: string): void {
    this.reporters.forEach((reporter) => reporter.onTestStart(testName));
  }

  onTestEnd(result: TestResult): void {
    this.reporters.forEach((reporter) => reporter.onTestEnd(result));
  }

  onEnd(stats: TestRunnerStats): void {
    this.reporters.forEach((reporter) => reporter.onEnd(stats));
  }

  addReporter(reporter: TestReporter): void {
    this.reporters.push(reporter);
  }

  removeReporter(reporter: TestReporter): void {
    const index = this.reporters.indexOf(reporter);
    if (index > -1) {
      this.reporters.splice(index, 1);
    }
  }
}
