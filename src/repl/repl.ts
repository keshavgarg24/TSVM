import * as readline from 'readline';
import { EventEmitter } from 'events';

export interface REPLCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<void> | void;
}

export interface REPLOptions {
  prompt?: string;
  historySize?: number;
  welcomeMessage?: string;
  exitCommands?: string[];
}

export class REPL extends EventEmitter {
  private rl: readline.Interface;
  private commands: Map<string, REPLCommand> = new Map();
  private history: string[] = [];
  private historyIndex: number = -1;
  private options: Required<REPLOptions>;
  private running: boolean = false;

  constructor(options: REPLOptions = {}) {
    super();
    
    this.options = {
      prompt: options.prompt || '> ',
      historySize: options.historySize || 100,
      welcomeMessage: options.welcomeMessage || 'Welcome to TypeScript VM REPL',
      exitCommands: options.exitCommands || ['exit', 'quit', '.exit']
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.options.prompt,
      historySize: this.options.historySize
    });

    this.setupReadlineHandlers();
    this.registerBuiltinCommands();
  }

  private setupReadlineHandlers(): void {
    this.rl.on('line', async (input: string) => {
      const trimmedInput = input.trim();
      
      if (trimmedInput === '') {
        this.rl.prompt();
        return;
      }

      this.addToHistory(trimmedInput);
      
      try {
        await this.processInput(trimmedInput);
      } catch (error) {
        this.handleError(error);
      }
      
      if (this.running) {
        this.rl.prompt();
      }
    });

    this.rl.on('close', () => {
      this.stop();
    });

    this.rl.on('SIGINT', () => {
      console.log('\nReceived SIGINT. Type "exit" to quit.');
      this.rl.prompt();
    });
  }

  private registerBuiltinCommands(): void {
    this.registerCommand({
      name: 'help',
      description: 'Show available commands',
      handler: () => this.showHelp()
    });

    this.registerCommand({
      name: 'history',
      description: 'Show command history',
      handler: () => this.showHistory()
    });

    this.registerCommand({
      name: 'clear',
      description: 'Clear the screen',
      handler: () => this.clearScreen()
    });

    // Register exit commands
    this.options.exitCommands.forEach(cmd => {
      this.registerCommand({
        name: cmd,
        description: 'Exit the REPL',
        handler: () => this.stop()
      });
    });
  }

  public registerCommand(command: REPLCommand): void {
    this.commands.set(command.name, command);
  }

  public unregisterCommand(name: string): boolean {
    return this.commands.delete(name);
  }

  public getCommands(): REPLCommand[] {
    return Array.from(this.commands.values());
  }

  private async processInput(input: string): Promise<void> {
    const parts = this.parseInput(input);
    const commandName = parts[0];
    const args = parts.slice(1);

    // Check if it's a registered command
    if (commandName && this.commands.has(commandName)) {
      const command = this.commands.get(commandName)!;
      await command.handler(args);
      return;
    }

    // If not a command, emit as code input
    this.emit('input', input, args);
  }

  private parseInput(input: string): string[] {
    // Simple parsing - split by spaces, but preserve quoted strings
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.length > 0) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      parts.push(current);
    }

    return parts;
  }

  private addToHistory(input: string): void {
    // Don't add duplicate consecutive entries
    if (this.history.length === 0 || this.history[this.history.length - 1] !== input) {
      this.history.push(input);
      
      // Limit history size
      if (this.history.length > this.options.historySize) {
        this.history.shift();
      }
    }
    
    this.historyIndex = this.history.length;
  }

  private showHelp(): void {
    console.log('\nAvailable commands:');
    console.log('==================');
    
    const commands = Array.from(this.commands.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    for (const command of commands) {
      console.log(`  ${command.name.padEnd(12)} - ${command.description}`);
    }
    
    console.log('\nYou can also enter code directly to execute it.');
    console.log('');
  }

  private showHistory(): void {
    console.log('\nCommand history:');
    console.log('================');
    
    if (this.history.length === 0) {
      console.log('  (empty)');
    } else {
      this.history.forEach((entry, index) => {
        console.log(`  ${(index + 1).toString().padStart(3)}: ${entry}`);
      });
    }
    
    console.log('');
  }

  private clearScreen(): void {
    console.clear();
    this.showWelcome();
  }

  private showWelcome(): void {
    console.log(this.options.welcomeMessage);
    console.log('Type "help" for available commands or enter code to execute.');
    console.log('');
  }

  private handleError(error: any): void {
    console.error('Error:', error.message || error);
    this.emit('error', error);
  }

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.showWelcome();
    this.rl.prompt();
    this.emit('start');
  }

  public stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    console.log('Goodbye!');
    this.rl.close();
    this.emit('stop');
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }

  public setPrompt(prompt: string): void {
    this.options.prompt = prompt;
    this.rl.setPrompt(prompt);
  }

  public getPrompt(): string {
    return this.options.prompt;
  }

  public write(text: string): void {
    console.log(text);
  }

  public writeError(text: string): void {
    console.error(text);
  }
}