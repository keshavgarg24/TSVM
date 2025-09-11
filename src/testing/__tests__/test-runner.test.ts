import { TestRunner, TestOptions, TestSuite, Test } from '../test-runner';

describe('TestRunner', () => {
  let runner: TestRunner;

  beforeEach(() => {
    runner = new TestRunner();
  });

  describe('Basic Functionality', () => {
    it('should create a test runner with default options', () => {
      const options = runner.getOptions();
      expect(options.timeout).toBe(5000);
      expect(options.retries).toBe(0);
      expect(options.parallel).toBe(false);
      expect(options.verbose).toBe(false);
      expect(options.bail).toBe(false);
    });

    it('should create a test runner with custom options', () => {
      const customOptions: TestOptions = {
        timeout: 1000,
        retries: 2,
        parallel: true,
        verbose: true,
        bail: true
      };
      
      const customRunner = new TestRunner(customOptions);
      const options = customRunner.getOptions();
      
      expect(options.timeout).toBe(1000);
      expect(options.retries).toBe(2);
      expect(options.parallel).toBe(true);
      expect(options.verbose).toBe(true);
      expect(options.bail).toBe(true);
    });

    it('should allow setting options after creation', () => {
      runner.setOptions({ timeout: 2000, verbose: true });
      const options = runner.getOptions();
      
      expect(options.timeout).toBe(2000);
      expect(options.verbose).toBe(true);
      expect(options.retries).toBe(0); // Should keep default
    });
  });

  describe('Suite Management', () => {
    it('should add test suites', () => {
      const suite: TestSuite = {
        name: 'Test Suite',
        tests: []
      };
      
      runner.addSuite(suite);
      const suites = runner.getSuites();
      
      expect(suites).toHaveLength(1);
      expect(suites[0]).toBe(suite);
    });

    it('should create suites with describe', () => {
      let testAdded = false;
      
      runner.describe('Test Suite', () => {
        runner.it('should work', () => {
          testAdded = true;
        });
      });
      
      const suites = runner.getSuites();
      expect(suites).toHaveLength(1);
      expect(suites[0]?.name).toBe('Test Suite');
      expect(suites[0]?.tests).toHaveLength(1);
      expect(suites[0]?.tests[0]?.name).toBe('should work');
    });

    it('should support nested describe blocks', () => {
      runner.describe('Outer Suite', () => {
        runner.it('outer test', () => {});
        
        runner.describe('Inner Suite', () => {
          runner.it('inner test', () => {});
        });
      });
      
      const suites = runner.getSuites();
      expect(suites).toHaveLength(2);
      expect(suites[0]?.name).toBe('Outer Suite');
      expect(suites[1]?.name).toBe('Inner Suite');
    });

    it('should clear all suites', () => {
      runner.describe('Suite 1', () => {
        runner.it('test 1', () => {});
      });
      
      runner.describe('Suite 2', () => {
        runner.it('test 2', () => {});
      });
      
      expect(runner.getSuites()).toHaveLength(2);
      
      runner.clear();
      expect(runner.getSuites()).toHaveLength(0);
    });
  });

  describe('Test Management', () => {
    it('should throw error when adding test outside describe', () => {
      expect(() => {
        runner.it('test', () => {});
      }).toThrow('Test must be defined within a describe block');
    });

    it('should support skipped tests', () => {
      runner.describe('Suite', () => {
        runner.xit('skipped test', () => {});
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.tests[0]?.skip).toBe(true);
    });

    it('should support focused tests', () => {
      runner.describe('Suite', () => {
        runner.fit('focused test', () => {});
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.tests[0]?.only).toBe(true);
    });

    it('should support skipped suites', () => {
      runner.xdescribe('Skipped Suite', () => {
        runner.it('test', () => {});
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.skip).toBe(true);
    });

    it('should support focused suites', () => {
      runner.fdescribe('Focused Suite', () => {
        runner.it('test', () => {});
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.only).toBe(true);
    });
  });

  describe('Hooks', () => {
    it('should support beforeEach hook', () => {
      let hookCalled = false;
      
      runner.describe('Suite', () => {
        runner.beforeEach(() => {
          hookCalled = true;
        });
        
        runner.it('test', () => {
          expect(hookCalled).toBe(true);
        });
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.beforeEach).toBeDefined();
    });

    it('should support afterEach hook', () => {
      runner.describe('Suite', () => {
        runner.afterEach(() => {});
        runner.it('test', () => {});
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.afterEach).toBeDefined();
    });

    it('should support beforeAll hook', () => {
      runner.describe('Suite', () => {
        runner.beforeAll(() => {});
        runner.it('test', () => {});
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.beforeAll).toBeDefined();
    });

    it('should support afterAll hook', () => {
      runner.describe('Suite', () => {
        runner.afterAll(() => {});
        runner.it('test', () => {});
      });
      
      const suite = runner.getSuites()[0];
      expect(suite?.afterAll).toBeDefined();
    });

    it('should throw error when adding hooks outside describe', () => {
      expect(() => runner.beforeEach(() => {})).toThrow();
      expect(() => runner.afterEach(() => {})).toThrow();
      expect(() => runner.beforeAll(() => {})).toThrow();
      expect(() => runner.afterAll(() => {})).toThrow();
    });
  });

  describe('Test Execution', () => {
    it('should run passing tests', async () => {
      let testRan = false;
      
      runner.describe('Suite', () => {
        runner.it('passing test', () => {
          testRan = true;
        });
      });
      
      const stats = await runner.run();
      
      expect(testRan).toBe(true);
      expect(stats.total).toBe(1);
      expect(stats.passed).toBe(1);
      expect(stats.failed).toBe(0);
      expect(stats.skipped).toBe(0);
    });

    it('should run failing tests', async () => {
      runner.describe('Suite', () => {
        runner.it('failing test', () => {
          throw new Error('Test failed');
        });
      });
      
      const stats = await runner.run();
      
      expect(stats.total).toBe(1);
      expect(stats.passed).toBe(0);
      expect(stats.failed).toBe(1);
      expect(stats.skipped).toBe(0);
    });

    it('should skip tests marked as skipped', async () => {
      runner.describe('Suite', () => {
        runner.xit('skipped test', () => {
          throw new Error('Should not run');
        });
      });
      
      const stats = await runner.run();
      
      expect(stats.total).toBe(0);
      expect(stats.passed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.skipped).toBe(1);
    });

    it('should run only focused tests when present', async () => {
      let focusedRan = false;
      let normalRan = false;
      
      runner.describe('Suite', () => {
        runner.fit('focused test', () => {
          focusedRan = true;
        });
        
        runner.it('normal test', () => {
          normalRan = true;
        });
      });
      
      const stats = await runner.run();
      
      expect(focusedRan).toBe(true);
      expect(normalRan).toBe(false);
      expect(stats.total).toBe(1);
      expect(stats.passed).toBe(1);
    });

    it('should run only focused suites when present', async () => {
      let focusedRan = false;
      let normalRan = false;
      
      runner.fdescribe('Focused Suite', () => {
        runner.it('test', () => {
          focusedRan = true;
        });
      });
      
      runner.describe('Normal Suite', () => {
        runner.it('test', () => {
          normalRan = true;
        });
      });
      
      const stats = await runner.run();
      
      expect(focusedRan).toBe(true);
      expect(normalRan).toBe(false);
      expect(stats.suites).toBe(1);
    });

    it('should skip suites marked as skipped', async () => {
      let testRan = false;
      
      runner.xdescribe('Skipped Suite', () => {
        runner.it('test', () => {
          testRan = true;
        });
      });
      
      const stats = await runner.run();
      
      expect(testRan).toBe(false);
      expect(stats.suites).toBe(0);
    });
  });

  describe('Hooks Execution', () => {
    it('should run beforeEach before each test', async () => {
      const calls: string[] = [];
      
      runner.describe('Suite', () => {
        runner.beforeEach(() => {
          calls.push('beforeEach');
        });
        
        runner.it('test 1', () => {
          calls.push('test 1');
        });
        
        runner.it('test 2', () => {
          calls.push('test 2');
        });
      });
      
      await runner.run();
      
      expect(calls).toEqual(['beforeEach', 'test 1', 'beforeEach', 'test 2']);
    });

    it('should run afterEach after each test', async () => {
      const calls: string[] = [];
      
      runner.describe('Suite', () => {
        runner.afterEach(() => {
          calls.push('afterEach');
        });
        
        runner.it('test 1', () => {
          calls.push('test 1');
        });
        
        runner.it('test 2', () => {
          calls.push('test 2');
        });
      });
      
      await runner.run();
      
      expect(calls).toEqual(['test 1', 'afterEach', 'test 2', 'afterEach']);
    });

    it('should run beforeAll once before all tests', async () => {
      const calls: string[] = [];
      
      runner.describe('Suite', () => {
        runner.beforeAll(() => {
          calls.push('beforeAll');
        });
        
        runner.it('test 1', () => {
          calls.push('test 1');
        });
        
        runner.it('test 2', () => {
          calls.push('test 2');
        });
      });
      
      await runner.run();
      
      expect(calls).toEqual(['beforeAll', 'test 1', 'test 2']);
    });

    it('should run afterAll once after all tests', async () => {
      const calls: string[] = [];
      
      runner.describe('Suite', () => {
        runner.afterAll(() => {
          calls.push('afterAll');
        });
        
        runner.it('test 1', () => {
          calls.push('test 1');
        });
        
        runner.it('test 2', () => {
          calls.push('test 2');
        });
      });
      
      await runner.run();
      
      expect(calls).toEqual(['test 1', 'test 2', 'afterAll']);
    });
  });

  describe('Async Tests', () => {
    it('should support async tests', async () => {
      let testRan = false;
      
      runner.describe('Suite', () => {
        runner.it('async test', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          testRan = true;
        });
      });
      
      const stats = await runner.run();
      
      expect(testRan).toBe(true);
      expect(stats.passed).toBe(1);
    });

    it('should support async hooks', async () => {
      const calls: string[] = [];
      
      runner.describe('Suite', () => {
        runner.beforeAll(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          calls.push('beforeAll');
        });
        
        runner.beforeEach(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          calls.push('beforeEach');
        });
        
        runner.it('test', () => {
          calls.push('test');
        });
        
        runner.afterEach(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          calls.push('afterEach');
        });
        
        runner.afterAll(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          calls.push('afterAll');
        });
      });
      
      await runner.run();
      
      expect(calls).toEqual(['beforeAll', 'beforeEach', 'test', 'afterEach', 'afterAll']);
    });
  });

  describe('Error Handling', () => {
    it('should handle test timeouts', async () => {
      runner.setOptions({ timeout: 50 });
      
      runner.describe('Suite', () => {
        runner.it('timeout test', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      });
      
      const stats = await runner.run();
      
      expect(stats.failed).toBe(1);
    });

    it('should handle hook failures', async () => {
      let testRan = false;
      
      runner.describe('Suite', () => {
        runner.beforeAll(() => {
          throw new Error('Hook failed');
        });
        
        runner.it('test', () => {
          testRan = true;
        });
      });
      
      await runner.run();
      
      expect(testRan).toBe(false);
    });

    it('should retry failed tests when configured', async () => {
      let attempts = 0;
      
      runner.setOptions({ retries: 2 });
      
      runner.describe('Suite', () => {
        runner.it('flaky test', () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Flaky failure');
          }
        });
      });
      
      const stats = await runner.run();
      
      expect(attempts).toBe(3);
      expect(stats.passed).toBe(1);
    });

    it('should bail on first failure when configured', async () => {
      let test2Ran = false;
      
      runner.setOptions({ bail: true });
      
      runner.describe('Suite', () => {
        runner.it('failing test', () => {
          throw new Error('Test failed');
        });
        
        runner.it('test 2', () => {
          test2Ran = true;
        });
      });
      
      const stats = await runner.run();
      
      expect(test2Ran).toBe(false);
      expect(stats.failed).toBe(1);
      expect(stats.total).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      runner.describe('Suite 1', () => {
        runner.it('passing test', () => {});
        runner.it('failing test', () => { throw new Error('Failed'); });
        runner.xit('skipped test', () => {});
      });
      
      runner.describe('Suite 2', () => {
        runner.it('another passing test', () => {});
      });
      
      const stats = await runner.run();
      
      expect(stats.suites).toBe(2);
      expect(stats.total).toBe(3);
      expect(stats.passed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.skipped).toBe(1);
      expect(stats.duration).toBeGreaterThan(0);
    });

    it('should reset statistics between runs', async () => {
      runner.describe('Suite', () => {
        runner.it('test', () => {});
      });
      
      await runner.run();
      let stats = runner.getStats();
      expect(stats.total).toBe(1);
      
      await runner.run();
      stats = runner.getStats();
      expect(stats.total).toBe(1); // Should not accumulate
    });
  });
});