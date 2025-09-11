import { Instruction, OpCode, VMState, Value, CallFrame } from "../types";
import { VirtualMachine } from "../vm/vm";

/**
 * Extract raw value from Value object for debugging purposes
 */
function extractRawValue(value: Value): any {
  return value.data;
}

/**
 * Extract raw values from an array of Value objects
 */
function extractRawValues(values: Value[]): any[] {
  return values.map(extractRawValue);
}

export interface DebuggerOptions {
  maxSteps?: number;
  autoBreakOnError?: boolean;
  traceExecution?: boolean;
}

export interface Breakpoint {
  id: number;
  address: number;
  condition?: string;
  enabled: boolean;
  hitCount: number;
}

export interface DebugSession {
  instructions: Instruction[];
  vm: VirtualMachine;
  breakpoints: Map<number, Breakpoint>;
  currentStep: number;
  isRunning: boolean;
  isPaused: boolean;
  executionTrace: ExecutionStep[];
  isHalted: boolean;
}

export interface ExecutionStep {
  stepNumber: number;
  address: number;
  instruction: Instruction;
  stackBefore: any[];
  stackAfter: any[];
  variablesBefore: Map<string, any>;
  variablesAfter: Map<string, any>;
  callStackBefore: CallFrame[];
  callStackAfter: CallFrame[];
}

export interface DebuggerEvent {
  type: "breakpoint" | "step" | "error" | "halt" | "start" | "reset";
  data?: any;
}

export class Debugger {
  private options: Required<DebuggerOptions>;
  private session: DebugSession | null = null;
  private nextBreakpointId = 1;
  private eventListeners: Map<string, ((event: DebuggerEvent) => void)[]> =
    new Map();

  constructor(options: DebuggerOptions = {}) {
    this.options = {
      maxSteps: options.maxSteps ?? 10000,
      autoBreakOnError: options.autoBreakOnError ?? true,
      traceExecution: options.traceExecution ?? false,
    };
  }

  /**
   * Start a new debug session
   */
  startSession(instructions: Instruction[]): DebugSession {
    const vm = new VirtualMachine();

    this.session = {
      instructions: [...instructions],
      vm,
      breakpoints: new Map(),
      currentStep: 0,
      isRunning: false,
      isPaused: false,
      executionTrace: [],
      isHalted: false,
    };

    // Load instructions into VM without executing
    vm.loadInstructions(instructions);

    this.emit({ type: "start" });
    return this.session;
  }

  /**
   * Get current debug session
   */
  getSession(): DebugSession | null {
    return this.session;
  }

  /**
   * Reset the debug session
   */
  reset(): void {
    if (this.session) {
      this.session.vm.reset();
      this.session.currentStep = 0;
      this.session.isRunning = false;
      this.session.isPaused = false;
      this.session.executionTrace = [];
      this.session.isHalted = false;

      // Reset breakpoint hit counts
      for (const breakpoint of this.session.breakpoints.values()) {
        breakpoint.hitCount = 0;
      }
    }

    this.emit({ type: "reset" });
  }

  /**
   * Execute a single step
   */
  step(): ExecutionStep | null {
    if (!this.session || this.session.isHalted) {
      return null;
    }

    const vm = this.session.vm;
    const state = vm.getState();

    if (state.pc >= this.session.instructions.length) {
      return null; // End of program
    }

    const instruction = this.session.instructions[state.pc];
    if (!instruction) {
      return null;
    }

    // Capture state before execution
    const stackBefore = extractRawValues(state.stack);
    const variablesBefore = new Map();
    for (const [key, value] of state.variables) {
      variablesBefore.set(key, extractRawValue(value));
    }
    const callStackBefore = [...state.callStack];

    // Execute one step
    const canContinue = vm.step();

    // Capture state after execution
    const stateAfter = vm.getState();
    const stackAfter = extractRawValues(stateAfter.stack);
    const variablesAfter = new Map();
    for (const [key, value] of stateAfter.variables) {
      variablesAfter.set(key, extractRawValue(value));
    }
    const callStackAfter = [...stateAfter.callStack];

    // Create execution step record
    const executionStep: ExecutionStep = {
      stepNumber: this.session.currentStep++,
      address: state.pc,
      instruction,
      stackBefore,
      stackAfter,
      variablesBefore,
      variablesAfter,
      callStackBefore,
      callStackAfter,
    };

    if (this.options.traceExecution) {
      this.session.executionTrace.push(executionStep);
    }

    this.emit({ type: "step", data: executionStep });

    if (!canContinue || instruction.opcode === OpCode.HALT) {
      this.session.isHalted = true;
      this.emit({ type: "halt" });
    }

    return executionStep;
  }

  /**
   * Continue execution until breakpoint or end
   */
  continue(): void {
    if (!this.session) {
      return;
    }

    this.session.isRunning = true;
    this.session.isPaused = false;

    let stepCount = 0;
    while (this.session.isRunning && stepCount < this.options.maxSteps) {
      const state = this.session.vm.getState();

      // Check for breakpoint
      if (this.shouldBreakAt(state.pc)) {
        this.session.isRunning = false;
        this.session.isPaused = true;
        this.emit({ type: "breakpoint", data: { address: state.pc } });
        return;
      }

      try {
        const executionStep = this.step();
        if (!executionStep) {
          this.session.isRunning = false;
          return;
        }

        // Check if we hit HALT
        if (executionStep.instruction.opcode === OpCode.HALT) {
          this.session.isRunning = false;
          return;
        }

        stepCount++;
      } catch (error) {
        this.session.isRunning = false;
        if (this.options.autoBreakOnError) {
          this.session.isPaused = true;
          this.emit({ type: "error", data: error });
        }
        return;
      }
    }

    if (stepCount >= this.options.maxSteps) {
      this.session.isRunning = false;
      this.session.isPaused = true;
      this.emit({
        type: "error",
        data: new Error("Maximum step count exceeded"),
      });
    }
  }

  /**
   * Pause execution
   */
  pause(): void {
    if (this.session && this.session.isRunning) {
      this.session.isRunning = false;
      this.session.isPaused = true;
    }
  }

  /**
   * Add a breakpoint
   */
  addBreakpoint(address: number, condition?: string): Breakpoint {
    if (!this.session) {
      throw new Error("No active debug session");
    }

    if (address < 0 || address >= this.session.instructions.length) {
      throw new Error(`Invalid breakpoint address: ${address}`);
    }

    const breakpoint: Breakpoint = {
      id: this.nextBreakpointId++,
      address,
      enabled: true,
      hitCount: 0,
    };

    if (condition !== undefined) {
      breakpoint.condition = condition;
    }

    this.session.breakpoints.set(address, breakpoint);
    return breakpoint;
  }

  /**
   * Remove a breakpoint
   */
  removeBreakpoint(address: number): boolean {
    if (!this.session) {
      return false;
    }

    return this.session.breakpoints.delete(address);
  }

  /**
   * Enable/disable a breakpoint
   */
  toggleBreakpoint(address: number, enabled?: boolean): boolean {
    if (!this.session) {
      return false;
    }

    const breakpoint = this.session.breakpoints.get(address);
    if (!breakpoint) {
      return false;
    }

    breakpoint.enabled = enabled !== undefined ? enabled : !breakpoint.enabled;
    return true;
  }

  /**
   * Get all breakpoints
   */
  getBreakpoints(): Breakpoint[] {
    if (!this.session) {
      return [];
    }

    return Array.from(this.session.breakpoints.values());
  }

  /**
   * Clear all breakpoints
   */
  clearBreakpoints(): void {
    if (this.session) {
      this.session.breakpoints.clear();
    }
  }

  /**
   * Get current VM state
   */
  getVMState(): VMState | null {
    if (!this.session) {
      return null;
    }

    return this.session.vm.getState();
  }

  /**
   * Get execution trace
   */
  getExecutionTrace(): ExecutionStep[] {
    if (!this.session) {
      return [];
    }

    return [...this.session.executionTrace];
  }

  /**
   * Get variable value
   */
  getVariable(name: string): any {
    const state = this.getVMState();
    const value = state?.variables.get(name);
    return value ? extractRawValue(value) : undefined;
  }

  /**
   * Get all variables
   */
  getVariables(): Map<string, any> {
    const state = this.getVMState();
    if (!state) return new Map();

    const rawVariables = new Map();
    for (const [key, value] of state.variables) {
      rawVariables.set(key, extractRawValue(value));
    }
    return rawVariables;
  }

  /**
   * Get stack contents
   */
  getStack(): any[] {
    const state = this.getVMState();
    return state ? extractRawValues(state.stack) : [];
  }

  /**
   * Get call stack
   */
  getCallStack(): CallFrame[] {
    const state = this.getVMState();
    return state ? [...state.callStack] : [];
  }

  /**
   * Get current instruction
   */
  getCurrentInstruction(): {
    address: number;
    instruction: Instruction;
  } | null {
    const state = this.getVMState();
    if (!state || !this.session) {
      return null;
    }

    const instruction = this.session.instructions[state.pc];
    if (!instruction) {
      return null;
    }

    return {
      address: state.pc,
      instruction,
    };
  }

  /**
   * Get instruction at address
   */
  getInstructionAt(address: number): Instruction | null {
    if (
      !this.session ||
      address < 0 ||
      address >= this.session.instructions.length
    ) {
      return null;
    }

    return this.session.instructions[address] || null;
  }

  /**
   * Check if execution should break at address
   */
  private shouldBreakAt(address: number): boolean {
    if (!this.session) {
      return false;
    }

    const breakpoint = this.session.breakpoints.get(address);
    if (!breakpoint || !breakpoint.enabled) {
      return false;
    }

    breakpoint.hitCount++;

    // TODO: Implement condition evaluation
    if (breakpoint.condition) {
      // For now, always break if there's a condition
      // In a full implementation, we'd evaluate the condition
      return true;
    }

    return true;
  }

  /**
   * Add event listener
   */
  on(eventType: string, listener: (event: DebuggerEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, listener: (event: DebuggerEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: DebuggerEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  /**
   * Set debugger options
   */
  setOptions(options: Partial<DebuggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): DebuggerOptions {
    return { ...this.options };
  }

  /**
   * Get debug session statistics
   */
  getStatistics(): {
    totalSteps: number;
    totalBreakpoints: number;
    enabledBreakpoints: number;
    traceSize: number;
    isRunning: boolean;
    isPaused: boolean;
  } {
    if (!this.session) {
      return {
        totalSteps: 0,
        totalBreakpoints: 0,
        enabledBreakpoints: 0,
        traceSize: 0,
        isRunning: false,
        isPaused: false,
      };
    }

    const enabledBreakpoints = Array.from(
      this.session.breakpoints.values()
    ).filter((bp) => bp.enabled).length;

    return {
      totalSteps: this.session.currentStep,
      totalBreakpoints: this.session.breakpoints.size,
      enabledBreakpoints,
      traceSize: this.session.executionTrace.length,
      isRunning: this.session.isRunning,
      isPaused: this.session.isPaused,
    };
  }

  /**
   * Export debug session for analysis
   */
  exportSession(): any {
    if (!this.session) {
      return null;
    }

    return {
      instructions: this.session.instructions,
      breakpoints: Array.from(this.session.breakpoints.values()),
      currentStep: this.session.currentStep,
      executionTrace: this.session.executionTrace,
      vmState: this.session.vm.getState(),
      statistics: this.getStatistics(),
    };
  }
}
