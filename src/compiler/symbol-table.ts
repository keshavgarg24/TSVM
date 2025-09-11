import { Symbol, ValueType } from "../types";
import { SymbolTable as SymbolTableInterface } from "../interfaces";

export class SymbolTable implements SymbolTableInterface {
  private scopes: Map<string, Symbol>[] = [];
  private currentScope = 0;

  constructor() {
    // Initialize with global scope
    this.scopes.push(new Map());
  }

  declare(name: string, type: ValueType): void {
    const symbol: Symbol = {
      name,
      type,
      scope: this.currentScope,
    };

    // Add to current scope
    const currentScopeMap = this.scopes[this.currentScope];
    if (currentScopeMap) {
      currentScopeMap.set(name, symbol);
    }
  }

  lookup(name: string): Symbol | undefined {
    // Search from current scope up to global scope
    for (let i = this.currentScope; i >= 0; i--) {
      const scope = this.scopes[i];
      if (scope?.has(name)) {
        return scope.get(name);
      }
    }
    return undefined;
  }

  enterScope(): void {
    this.currentScope++;
    // Ensure we have a scope map for this level
    if (!this.scopes[this.currentScope]) {
      this.scopes[this.currentScope] = new Map();
    } else {
      // Clear existing scope if it exists
      const existingScope = this.scopes[this.currentScope];
      if (existingScope) {
        existingScope.clear();
      }
    }
  }

  exitScope(): void {
    if (this.currentScope > 0) {
      // Clear the current scope
      const currentScopeMap = this.scopes[this.currentScope];
      if (currentScopeMap) {
        currentScopeMap.clear();
      }
      this.currentScope--;
    }
  }

  getCurrentScope(): number {
    return this.currentScope;
  }

  getCurrentScopeSymbols(): Symbol[] {
    const currentScopeMap = this.scopes[this.currentScope];
    if (!currentScopeMap) {
      return [];
    }
    return Array.from(currentScopeMap.values());
  }

  getAllSymbols(): Symbol[] {
    const allSymbols: Symbol[] = [];
    for (let i = 0; i <= this.currentScope; i++) {
      const scope = this.scopes[i];
      if (scope) {
        allSymbols.push(...Array.from(scope.values()));
      }
    }
    return allSymbols;
  }

  clearCurrentScope(): void {
    const currentScopeMap = this.scopes[this.currentScope];
    if (currentScopeMap) {
      currentScopeMap.clear();
    }
  }

  reset(): void {
    this.scopes = [new Map()];
    this.currentScope = 0;
  }

  // Additional utility methods for compiler use

  /**
   * Check if a symbol is declared in the current scope only
   */
  isDeclaredInCurrentScope(name: string): boolean {
    return this.scopes[this.currentScope]?.has(name) ?? false;
  }

  /**
   * Get the scope level where a symbol is declared
   */
  getSymbolScope(name: string): number | undefined {
    for (let i = this.currentScope; i >= 0; i--) {
      const scope = this.scopes[i];
      if (scope?.has(name)) {
        return i;
      }
    }
    return undefined;
  }

  /**
   * Check if we're in global scope
   */
  isGlobalScope(): boolean {
    return this.currentScope === 0;
  }

  /**
   * Get symbols declared in a specific scope level
   */
  getScopeSymbols(scopeLevel: number): Symbol[] {
    const scope = this.scopes[scopeLevel];
    if (!scope) {
      return [];
    }
    return Array.from(scope.values());
  }

  /**
   * Get the number of nested scopes
   */
  getScopeDepth(): number {
    return this.currentScope + 1;
  }

  /**
   * Check if a symbol exists at any scope level
   */
  exists(name: string): boolean {
    return this.lookup(name) !== undefined;
  }

  /**
   * Get symbol information with additional metadata
   */
  getSymbolInfo(name: string):
    | {
        symbol: Symbol;
        scopeLevel: number;
        isLocal: boolean;
        isGlobal: boolean;
      }
    | undefined {
    const symbol = this.lookup(name);
    if (!symbol) {
      return undefined;
    }

    const scopeLevel = symbol.scope;
    return {
      symbol,
      scopeLevel,
      isLocal: scopeLevel > 0,
      isGlobal: scopeLevel === 0,
    };
  }

  /**
   * Create a snapshot of the current symbol table state
   */
  createSnapshot(): {
    currentScope: number;
    scopes: { [scopeLevel: number]: Symbol[] };
  } {
    const scopesSnapshot: { [scopeLevel: number]: Symbol[] } = {};

    for (let i = 0; i <= this.currentScope; i++) {
      const scope = this.scopes[i];
      if (scope) {
        scopesSnapshot[i] = Array.from(scope.values());
      }
    }

    return {
      currentScope: this.currentScope,
      scopes: scopesSnapshot,
    };
  }

  /**
   * Debug method to print symbol table state
   */
  debug(): void {
    console.log("Symbol Table State:");
    console.log(`Current Scope: ${this.currentScope}`);

    for (let i = 0; i <= this.currentScope; i++) {
      const scope = this.scopes[i];
      if (scope && scope.size > 0) {
        console.log(`Scope ${i}:`);
        for (const [name, symbol] of scope) {
          console.log(`  ${name}: ${symbol.type}`);
        }
      }
    }
  }
}
