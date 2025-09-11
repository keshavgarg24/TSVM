#!/usr/bin/env node
import { CLI, parseArgs, printHelp, printVersion } from './cli';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Handle help and version
  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    printVersion();
    return;
  }

  // Validate options
  if (options.mode !== 'repl' && options.mode !== 'benchmark' && !options.input) {
    console.error('Error: Input file required for this mode');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  // Create and run CLI
  const cli = new CLI(options);
  await cli.run();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal Error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

export { main };