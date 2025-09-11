import { CLI, parseArgs, printHelp, printVersion } from '../cli';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.readFileSync.mockClear();
    mockFs.writeFileSync.mockClear();
    mockFs.existsSync.mockClear();
    mockFs.mkdirSync.mockClear();
  });

  describe('parseArgs', () => {
    it('should parse basic run command', () => {
      const options = parseArgs(['program.ts']);
      expect(options.mode).toBe('run');
      expect(options.input).toBe('program.ts');
      expect(options.optimize).toBe(true);
    });

    it('should parse compile command', () => {
      const options = parseArgs(['-c', 'program.ts']);
      expect(options.mode).toBe('compile');
      expect(options.input).toBe('program.ts');
    });

    it('should parse output option', () => {
      const options = parseArgs(['-c', 'program.ts', '-o', 'output.bc']);
      expect(options.output).toBe('output.bc');
    });

    it('should parse verbose option', () => {
      const options = parseArgs(['--verbose', 'program.ts']);
      expect(options.verbose).toBe(true);
    });

    it('should parse no-optimize option', () => {
      const options = parseArgs(['--no-optimize', 'program.ts']);
      expect(options.optimize).toBe(false);
    });

    it('should parse memory options', () => {
      const options = parseArgs(['--memory-size', '2048', '--gc-threshold', '500', 'program.ts']);
      expect(options.memorySize).toBe(2048);
      expect(options.gcThreshold).toBe(500);
    });

    it('should parse help option', () => {
      const options = parseArgs(['--help']);
      expect(options.help).toBe(true);
    });

    it('should parse version option', () => {
      const options = parseArgs(['--version']);
      expect(options.version).toBe(true);
    });

    it('should parse disassemble mode', () => {
      const options = parseArgs(['-d', 'bytecode.bc']);
      expect(options.mode).toBe('disassemble');
      expect(options.input).toBe('bytecode.bc');
    });

    it('should parse assemble mode', () => {
      const options = parseArgs(['-a', 'assembly.asm']);
      expect(options.mode).toBe('assemble');
      expect(options.input).toBe('assembly.asm');
    });

    it('should parse debug mode', () => {
      const options = parseArgs(['--debug', 'program.ts']);
      expect(options.mode).toBe('debug');
      expect(options.input).toBe('program.ts');
    });

    it('should parse repl mode', () => {
      const options = parseArgs(['--repl']);
      expect(options.mode).toBe('repl');
    });

    it('should parse benchmark mode', () => {
      const options = parseArgs(['--benchmark']);
      expect(options.mode).toBe('benchmark');
    });

    it('should parse output flags', () => {
      const options = parseArgs(['--output-bytecode', '--output-ast', 'program.ts']);
      expect(options.outputBytecode).toBe(true);
      expect(options.outputAST).toBe(true);
    });
  });

  describe('CLI class', () => {
    const mockSourceCode = 'let x = 5; print(x);';
    const mockBytecode = [
      { opcode: 'PUSH', operand: 5 },
      { opcode: 'STORE', operand: 'x' },
      { opcode: 'LOAD', operand: 'x' },
      { opcode: 'CALL', operand: 'print' },
      { opcode: 'HALT' }
    ];

    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue(mockSourceCode);
      mockFs.existsSync.mockReturnValue(false);
    });

    describe('compile mode', () => {
      it('should compile source file to bytecode', async () => {
        const cli = new CLI({
          mode: 'compile',
          input: 'program.ts',
          output: 'program.bc',
          verbose: false
        });

        await cli.run();

        expect(mockFs.readFileSync).toHaveBeenCalledWith('program.ts', 'utf8');
        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should output AST when requested', async () => {
        const cli = new CLI({
          mode: 'compile',
          input: 'program.ts',
          outputAST: true,
          verbose: false
        });

        await cli.run();

        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          expect.stringContaining('.ast.json'),
          expect.any(String),
          'utf8'
        );
      });

      it('should show verbose output when enabled', async () => {
        const cli = new CLI({
          mode: 'compile',
          input: 'program.ts',
          verbose: true
        });

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Compiling:'));
      });

      it('should throw error when no input file provided', async () => {
        const cli = new CLI({
          mode: 'compile',
          verbose: false
        });

        await expect(cli.run()).rejects.toThrow('Input file required for compilation');
      });
    });

    describe('run mode', () => {
      it('should execute source file', async () => {
        const cli = new CLI({
          mode: 'run',
          input: 'program.ts',
          verbose: false
        });

        await cli.run();

        expect(mockFs.readFileSync).toHaveBeenCalledWith('program.ts', 'utf8');
      });

      it('should show execution stats when verbose', async () => {
        const cli = new CLI({
          mode: 'run',
          input: 'program.ts',
          verbose: true
        });

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Running:'));
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Execution stats:'));
      });

      it('should throw error when no input file provided', async () => {
        const cli = new CLI({
          mode: 'run',
          verbose: false
        });

        await expect(cli.run()).rejects.toThrow('Input file required for execution');
      });
    });

    describe('disassemble mode', () => {
      beforeEach(() => {
        mockFs.readFileSync.mockReturnValue(JSON.stringify(mockBytecode));
      });

      it('should disassemble bytecode file', async () => {
        const cli = new CLI({
          mode: 'disassemble',
          input: 'program.bc',
          verbose: false
        });

        await cli.run();

        expect(mockFs.readFileSync).toHaveBeenCalledWith('program.bc', 'utf8');
      });

      it('should output to file when specified', async () => {
        const cli = new CLI({
          mode: 'disassemble',
          input: 'program.bc',
          output: 'program.asm',
          verbose: false
        });

        await cli.run();

        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          'program.asm',
          expect.any(String),
          'utf8'
        );
      });

      it('should output to console when no output file specified', async () => {
        const cli = new CLI({
          mode: 'disassemble',
          input: 'program.bc',
          verbose: false
        });

        await cli.run();

        expect(mockConsoleLog).toHaveBeenCalled();
      });
    });

    describe('assemble mode', () => {
      const mockAssembly = 'PUSH 5\nSTORE x\nLOAD x\nCALL print\nHALT';

      beforeEach(() => {
        mockFs.readFileSync.mockReturnValue(mockAssembly);
      });

      it('should assemble assembly file to bytecode', async () => {
        const cli = new CLI({
          mode: 'assemble',
          input: 'program.asm',
          output: 'program.bc',
          verbose: false
        });

        await cli.run();

        expect(mockFs.readFileSync).toHaveBeenCalledWith('program.asm', 'utf8');
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          'program.bc',
          expect.any(String),
          'utf8'
        );
      });
    });

    describe('error handling', () => {
      it('should handle file read errors', async () => {
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error('File not found');
        });

        const cli = new CLI({
          mode: 'run',
          input: 'nonexistent.ts',
          verbose: false
        });

        await expect(cli.run()).rejects.toThrow('Cannot read file');
      });

      it('should handle file write errors', async () => {
        mockFs.writeFileSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const cli = new CLI({
          mode: 'compile',
          input: 'program.ts',
          output: '/readonly/program.bc',
          verbose: false
        });

        await expect(cli.run()).rejects.toThrow('Cannot write file');
      });

      it('should handle unknown mode', async () => {
        const cli = new CLI({
          mode: 'unknown' as any,
          verbose: false
        });

        await expect(cli.run()).rejects.toThrow('Unknown mode: unknown');
      });
    });

    describe('file path handling', () => {
      it('should create output directories if they do not exist', async () => {
        mockFs.existsSync.mockReturnValue(false);

        const cli = new CLI({
          mode: 'compile',
          input: 'program.ts',
          output: 'output/dir/program.bc',
          verbose: false
        });

        await cli.run();

        expect(mockFs.mkdirSync).toHaveBeenCalledWith('output/dir', { recursive: true });
      });

      it('should generate default output paths', async () => {
        const cli = new CLI({
          mode: 'compile',
          input: 'src/program.ts',
          verbose: false
        });

        await cli.run();

        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          expect.stringContaining('src/program.asm'),
          expect.any(String),
          'utf8'
        );
      });
    });
  });

  describe('utility functions', () => {
    describe('printHelp', () => {
      it('should print help information', () => {
        printHelp();
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('TypeScript VM'));
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      });
    });

    describe('printVersion', () => {
      it('should print version information', () => {
        // Mock require for package.json
        const mockRequire = jest.fn().mockReturnValue({ version: '1.0.0' });
        (global as any).require = mockRequire;

        printVersion();
        expect(mockConsoleLog).toHaveBeenCalledWith('TypeScript VM v1.0.0');
      });
    });
  });
});