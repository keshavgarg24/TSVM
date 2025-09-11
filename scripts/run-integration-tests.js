#!/usr/bin/env node

/**
 * Simple script to run integration tests
 * This can be used as npm script or standalone
 */

const { spawn } = require('child_process');
const path = require('path');

async function runIntegrationTests() {
  console.log('🚀 Starting TypeScript VM Integration Tests...\n');

  try {
    // Run the integration test runner
    const tsNode = spawn('npx', ['ts-node', path.join(__dirname, '../src/testing/integration-runner.ts')], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    tsNode.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Integration tests completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Integration tests failed!');
        process.exit(1);
      }
    });

    tsNode.on('error', (error) => {
      console.error('Failed to start integration tests:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('Error running integration tests:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };