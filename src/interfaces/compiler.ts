import { Program, Instruction } from '../types';

export interface CodeGenerator {
  compile(ast: Program): Instruction[];
  optimize(instructions: Instruction[]): Instruction[];
}

import { Symbol, ValueType } from '../types';

export interface SymbolTable {
  declare(name: string, type: ValueType): void;
  lookup(name: string): Symbol | undefined;
  enterScope(): void;
  exitScope(): void;
  getCurrentScope(): number;
  getCurrentScopeSymbols(): Symbol[];
  getAllSymbols(): Symbol[];
  reset(): void;
}