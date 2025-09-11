import { Debugger, DebuggerOptions, Breakpoint, ExecutionStep } from '../debugger';
import { OpCode, Instruction, Value } from '../../types';

describe('Debugger', () => {
  let vmDebugger: Debugger;
  let simpleProgram: Instruction[];
  let loopProgram: Instruction[];

  beforeEach(() => {
    vmDebugger = new Debugger();
    
    // Simple program: PUSH 5, PUSH 3, ADD, PRINT, HALT
    simpleProgram = [
      { opcode: OpCode.PUSH, operand: 5 },
      { opcode: OpCode.PUSH, operand: 3 },
      { opcode: OpCode.ADD },
      { opcode: OpCode.PRINT },
      { opcode: OpCode.HALT }
    ];

    // Loop program with variables
    loopProgram = [
      { opcode: OpCode.PUSH, operand: 10 },           // 0: PUSH 10
      { opcode: OpCode.STORE, operand: 'counter' },   // 1: STORE counter
      { opcode: OpCode.LOAD, operand: 'counter' },    // 2: LOAD counter (loop start)
      { opcode: OpCode.DUP },                         // 3: DUP
      { opcode: OpCode.PUSH, operand: 0 },            // 4: PUSH 0
      { opcode: OpCode.GT },                          // 5: GT
      { opcode: OpCode.JUMP_IF_FALSE, operand: 12 },  // 6: JUMP_IF_FALSE 12 (end)
      { opcode: OpCode.LOAD, operand: 'counter' },    // 7: LOAD counter
      { opcode: OpCode.PUSH, operand: 1 },            // 8: PUSH 1
      { opcode: OpCode.SUB },                         // 9: SUB
      { opcode: OpCode.STORE, operand: 'counter' },   // 10: STORE counter
      { opcode: OpCode.JUMP, operand: 2 },            // 11: JUMP 2 (loop)
      { opcode: OpCode.HALT }                         // 12: HALT
    ];
  });

  describe('Session Management', () => {
    it('should start a new debug session', () => {
      const session = vmDebugger.startSession(simpleProgram);
      
      expect(session).toBeDefined();
      expect(session.instructions).toEqual(simpleProgram);
      expect(session.currentStep).toBe(0);
      expect(session.isRunning).toBe(false);
      expect(session.isPaused).toBe(false);
      expect(session.breakpoints.size).toBe(0);
      expect(session.executionTrace).toHaveLength(0);
    });

    it('should get current session', () => {
      const session = vmDebugger.startSession(simpleProgram);
      expect(vmDebugger.getSession()).toBe(session);
    });

    it('should return null when no session exists', () => {
      expect(vmDebugger.getSession()).toBeNull();
      expect(vmDebugger.getVMState()).toBeNull();
    });

    it('should reset debug session', () => {
      const session = vmDebugger.startSession(simpleProgram);
      
      // Execute a few steps
      vmDebugger.step();
      vmDebugger.step();
      
      expect(session.currentStep).toBeGreaterThan(0);
      
      // Reset
      vmDebugger.reset();
      
      expect(session.currentStep).toBe(0);
      expect(session.isRunning).toBe(false);
      expect(session.isPaused).toBe(false);
      expect(session.executionTrace).toHaveLength(0);
    });
  });

  describe('Step Execution', () => {
    it('should execute single steps', () => {
      vmDebugger.startSession(simpleProgram);
      
      // Step 1: PUSH 5
      const step1 = vmDebugger.step();
      expect(step1).toBeDefined();
      expect(step1!.stepNumber).toBe(0);
      expect(step1!.address).toBe(0);
      expect(step1!.instruction.opcode).toBe(OpCode.PUSH);
      expect(step1!.instruction.operand).toBe(5);
      expect(step1!.stackAfter).toEqual([5]);
      
      // Step 2: PUSH 3
      const step2 = vmDebugger.step();
      expect(step2).toBeDefined();
      expect(step2!.stepNumber).toBe(1);
      expect(step2!.address).toBe(1);
      expect(step2!.instruction.opcode).toBe(OpCode.PUSH);
      expect(step2!.instruction.operand).toBe(3);
      expect(step2!.stackAfter).toEqual([5, 3]);
      
      // Step 3: ADD
      const step3 = vmDebugger.step();
      expect(step3).toBeDefined();
      expect(step3!.stepNumber).toBe(2);
      expect(step3!.address).toBe(2);
      expect(step3!.instruction.opcode).toBe(OpCode.ADD);
      expect(step3!.stackAfter).toEqual([8]);
    });

    it('should return null when program ends', () => {
      vmDebugger.startSession(simpleProgram);
      
      // Execute all steps
      let step;
      let stepCount = 0;
      while ((step = vmDebugger.step()) !== null && stepCount < 10) {
        stepCount++;
      }
      
      expect(stepCount).toBe(5); // 5 instructions in simple program
      expect(vmDebugger.step()).toBeNull(); // Should return null after program ends
    });

    it('should track variable changes', () => {
      vmDebugger.startSession(loopProgram);
      
      // Execute first two steps to set up counter variable
      vmDebugger.step(); // PUSH 10
      const step2 = vmDebugger.step(); // STORE counter
      
      expect(step2!.variablesBefore.size).toBe(0);
      expect(step2!.variablesAfter.get('counter')).toBe(10);
    });

    it('should track stack changes correctly', () => {
      vmDebugger.startSession(simpleProgram);
      
      const step1 = vmDebugger.step(); // PUSH 5
      expect(step1!.stackBefore).toEqual([]);
      expect(step1!.stackAfter).toEqual([5]);
      
      const step2 = vmDebugger.step(); // PUSH 3
      expect(step2!.stackBefore).toEqual([5]);
      expect(step2!.stackAfter).toEqual([5, 3]);
      
      const step3 = vmDebugger.step(); // ADD
      expect(step3!.stackBefore).toEqual([5, 3]);
      expect(step3!.stackAfter).toEqual([8]);
    });
  });

  describe('Continuous Execution', () => {
    it('should continue execution until end', () => {
      const session = vmDebugger.startSession(simpleProgram);
      
      let haltEmitted = false;
      vmDebugger.on('halt', () => { haltEmitted = true; });
      
      vmDebugger.continue();
      
      expect(session.isRunning).toBe(false);
      expect(haltEmitted).toBe(true);
    });

    it('should pause execution', () => {
      const session = vmDebugger.startSession(loopProgram);
      
      // Start execution and pause immediately
      session.isRunning = true;
      vmDebugger.pause();
      
      expect(session.isRunning).toBe(false);
      expect(session.isPaused).toBe(true);
    });

    it('should respect maximum step limit', () => {
      vmDebugger = new Debugger({ maxSteps: 5 });
      vmDebugger.startSession(loopProgram);
      
      let errorEmitted = false;
      vmDebugger.on('error', () => { errorEmitted = true; });
      
      vmDebugger.continue();
      
      expect(errorEmitted).toBe(true);
    });
  });

  describe('Breakpoints', () => {
    it('should add breakpoints', () => {
      vmDebugger.startSession(simpleProgram);
      
      const breakpoint = vmDebugger.addBreakpoint(2); // At ADD instruction
      
      expect(breakpoint.address).toBe(2);
      expect(breakpoint.enabled).toBe(true);
      expect(breakpoint.hitCount).toBe(0);
      expect(breakpoint.id).toBeDefined();
      
      const breakpoints = vmDebugger.getBreakpoints();
      expect(breakpoints).toHaveLength(1);
      expect(breakpoints[0]).toBe(breakpoint);
    });

    it('should add breakpoints with conditions', () => {
      vmDebugger.startSession(simpleProgram);
      
      const breakpoint = vmDebugger.addBreakpoint(2, 'stack.length > 1');
      
      expect(breakpoint.condition).toBe('stack.length > 1');
    });

    it('should reject invalid breakpoint addresses', () => {
      vmDebugger.startSession(simpleProgram);
      
      expect(() => vmDebugger.addBreakpoint(-1)).toThrow('Invalid breakpoint address');
      expect(() => vmDebugger.addBreakpoint(100)).toThrow('Invalid breakpoint address');
    });

    it('should remove breakpoints', () => {
      vmDebugger.startSession(simpleProgram);
      
      vmDebugger.addBreakpoint(2);
      expect(vmDebugger.getBreakpoints()).toHaveLength(1);
      
      const removed = vmDebugger.removeBreakpoint(2);
      expect(removed).toBe(true);
      expect(vmDebugger.getBreakpoints()).toHaveLength(0);
      
      const notRemoved = vmDebugger.removeBreakpoint(2);
      expect(notRemoved).toBe(false);
    });

    it('should toggle breakpoints', () => {
      vmDebugger.startSession(simpleProgram);
      
      const breakpoint = vmDebugger.addBreakpoint(2);
      expect(breakpoint.enabled).toBe(true);
      
      vmDebugger.toggleBreakpoint(2);
      expect(breakpoint.enabled).toBe(false);
      
      vmDebugger.toggleBreakpoint(2);
      expect(breakpoint.enabled).toBe(true);
      
      vmDebugger.toggleBreakpoint(2, false);
      expect(breakpoint.enabled).toBe(false);
    });

    it('should clear all breakpoints', () => {
      vmDebugger.startSession(simpleProgram);
      
      vmDebugger.addBreakpoint(1);
      vmDebugger.addBreakpoint(2);
      vmDebugger.addBreakpoint(3);
      
      expect(vmDebugger.getBreakpoints()).toHaveLength(3);
      
      vmDebugger.clearBreakpoints();
      expect(vmDebugger.getBreakpoints()).toHaveLength(0);
    });

    it('should break at enabled breakpoints', () => {
      vmDebugger.startSession(simpleProgram);
      vmDebugger.addBreakpoint(2); // At ADD instruction
      
      let breakpointEmitted = false;
      vmDebugger.on('breakpoint', () => { breakpointEmitted = true; });
      
      vmDebugger.continue();
      
      expect(breakpointEmitted).toBe(true);
      const state = vmDebugger.getVMState();
      expect(state!.pc).toBe(2);
    });

    it('should not break at disabled breakpoints', () => {
      vmDebugger.startSession(simpleProgram);
      vmDebugger.addBreakpoint(2);
      vmDebugger.toggleBreakpoint(2, false);
      
      let breakpointEmitted = false;
      vmDebugger.on('breakpoint', () => { breakpointEmitted = true; });
      
      vmDebugger.continue();
      
      expect(breakpointEmitted).toBe(false);
    });

    it('should track breakpoint hit counts', () => {
      vmDebugger.startSession(loopProgram);
      const breakpoint = vmDebugger.addBreakpoint(2); // At loop start
      
      // Execute a few loop iterations
      for (let i = 0; i < 3; i++) {
        vmDebugger.continue();
        expect(vmDebugger.getSession()!.isPaused).toBe(true);
        vmDebugger.step(); // Step past breakpoint to continue
      }
      
      expect(breakpoint.hitCount).toBe(3);
    });
  });

  describe('State Inspection', () => {
    it('should get VM state', () => {
      vmDebugger.startSession(simpleProgram);
      vmDebugger.step(); // PUSH 5
      vmDebugger.step(); // PUSH 3
      
      const state = vmDebugger.getVMState();
      expect(state).toBeDefined();
      expect(state!.pc).toBe(2);
      expect(state!.stack).toEqual([
        { type: 'number', data: 5 },
        { type: 'number', data: 3 }
      ]);
    });

    it('should get variables', () => {
      vmDebugger.startSession(loopProgram);
      vmDebugger.step(); // PUSH 10
      vmDebugger.step(); // STORE counter
      
      const variables = vmDebugger.getVariables();
      expect(variables.get('counter')).toBe(10);
      
      const counterValue = vmDebugger.getVariable('counter');
      expect(counterValue).toBe(10);
      
      const undefinedValue = vmDebugger.getVariable('nonexistent');
      expect(undefinedValue).toBeUndefined();
    });

    it('should get stack contents', () => {
      vmDebugger.startSession(simpleProgram);
      vmDebugger.step(); // PUSH 5
      vmDebugger.step(); // PUSH 3
      
      const stack = vmDebugger.getStack();
      expect(stack).toEqual([5, 3]);
    });

    it('should get current instruction', () => {
      vmDebugger.startSession(simpleProgram);
      
      const current = vmDebugger.getCurrentInstruction();
      expect(current).toBeDefined();
      expect(current!.address).toBe(0);
      expect(current!.instruction.opcode).toBe(OpCode.PUSH);
      expect(current!.instruction.operand).toBe(5);
    });

    it('should get instruction at address', () => {
      vmDebugger.startSession(simpleProgram);
      
      const instruction = vmDebugger.getInstructionAt(2);
      expect(instruction).toBeDefined();
      expect(instruction!.opcode).toBe(OpCode.ADD);
      
      const invalidInstruction = vmDebugger.getInstructionAt(100);
      expect(invalidInstruction).toBeNull();
    });
  });

  describe('Execution Tracing', () => {
    it('should trace execution when enabled', () => {
      vmDebugger = new Debugger({ traceExecution: true });
      vmDebugger.startSession(simpleProgram);
      
      vmDebugger.step();
      vmDebugger.step();
      vmDebugger.step();
      
      const trace = vmDebugger.getExecutionTrace();
      expect(trace).toHaveLength(3);
      expect(trace[0]!.instruction.opcode).toBe(OpCode.PUSH);
      expect(trace[1]!.instruction.opcode).toBe(OpCode.PUSH);
      expect(trace[2]!.instruction.opcode).toBe(OpCode.ADD);
    });

    it('should not trace execution when disabled', () => {
      vmDebugger = new Debugger({ traceExecution: false });
      vmDebugger.startSession(simpleProgram);
      
      vmDebugger.step();
      vmDebugger.step();
      vmDebugger.step();
      
      const trace = vmDebugger.getExecutionTrace();
      expect(trace).toHaveLength(0);
    });
  });

  describe('Event System', () => {
    it('should emit start event', () => {
      let startEmitted = false;
      vmDebugger.on('start', () => { startEmitted = true; });
      
      vmDebugger.startSession(simpleProgram);
      expect(startEmitted).toBe(true);
    });

    it('should emit step events', () => {
      vmDebugger.startSession(simpleProgram);
      
      let stepEmitted = false;
      let stepData: ExecutionStep | null = null;
      vmDebugger.on('step', (event) => {
        stepEmitted = true;
        stepData = event.data;
      });
      
      vmDebugger.step();
      
      expect(stepEmitted).toBe(true);
      expect(stepData).toBeDefined();
      expect(stepData!.instruction.opcode).toBe(OpCode.PUSH);
    });

    it('should emit halt event', () => {
      vmDebugger.startSession(simpleProgram);
      
      let haltEmitted = false;
      vmDebugger.on('halt', () => { haltEmitted = true; });
      
      vmDebugger.continue();
      expect(haltEmitted).toBe(true);
    });

    it('should emit reset event', () => {
      vmDebugger.startSession(simpleProgram);
      
      let resetEmitted = false;
      vmDebugger.on('reset', () => { resetEmitted = true; });
      
      vmDebugger.reset();
      expect(resetEmitted).toBe(true);
    });

    it('should remove event listeners', () => {
      let eventCount = 0;
      const listener = () => { eventCount++; };
      
      vmDebugger.on('step', listener);
      vmDebugger.startSession(simpleProgram);
      
      vmDebugger.step();
      expect(eventCount).toBe(1);
      
      vmDebugger.off('step', listener);
      vmDebugger.step();
      expect(eventCount).toBe(1); // Should not increment
    });
  });

  describe('Options and Configuration', () => {
    it('should set and get options', () => {
      const options: DebuggerOptions = {
        maxSteps: 1000,
        autoBreakOnError: false,
        traceExecution: true
      };
      
      vmDebugger.setOptions(options);
      const currentOptions = vmDebugger.getOptions();
      
      expect(currentOptions.maxSteps).toBe(1000);
      expect(currentOptions.autoBreakOnError).toBe(false);
      expect(currentOptions.traceExecution).toBe(true);
    });

    it('should use default options', () => {
      const options = vmDebugger.getOptions();
      
      expect(options.maxSteps).toBe(10000);
      expect(options.autoBreakOnError).toBe(true);
      expect(options.traceExecution).toBe(false);
    });
  });

  describe('Statistics and Export', () => {
    it('should provide session statistics', () => {
      vmDebugger.startSession(simpleProgram);
      vmDebugger.addBreakpoint(1);
      vmDebugger.addBreakpoint(2);
      vmDebugger.toggleBreakpoint(2, false);
      
      vmDebugger.step();
      vmDebugger.step();
      
      const stats = vmDebugger.getStatistics();
      
      expect(stats.totalSteps).toBe(2);
      expect(stats.totalBreakpoints).toBe(2);
      expect(stats.enabledBreakpoints).toBe(1);
      expect(stats.isRunning).toBe(false);
      expect(stats.isPaused).toBe(false);
    });

    it('should export debug session', () => {
      vmDebugger = new Debugger({ traceExecution: true });
      vmDebugger.startSession(simpleProgram);
      vmDebugger.addBreakpoint(1);
      vmDebugger.step();
      vmDebugger.step();
      
      const exported = vmDebugger.exportSession();
      
      expect(exported).toBeDefined();
      expect(exported.instructions).toEqual(simpleProgram);
      expect(exported.breakpoints).toHaveLength(1);
      expect(exported.currentStep).toBe(2);
      expect(exported.executionTrace).toHaveLength(2);
      expect(exported.vmState).toBeDefined();
      expect(exported.statistics).toBeDefined();
    });

    it('should return null when exporting without session', () => {
      const exported = vmDebugger.exportSession();
      expect(exported).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during execution', () => {
      // Create a program that will cause an error (division by zero)
      const errorProgram: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 5 },
        { opcode: OpCode.PUSH, operand: 0 },
        { opcode: OpCode.DIV }, // Division by zero
        { opcode: OpCode.HALT }
      ];
      
      vmDebugger.startSession(errorProgram);
      
      let errorEmitted = false;
      vmDebugger.on('error', () => { errorEmitted = true; });
      
      vmDebugger.continue();
      
      expect(errorEmitted).toBe(true);
    });

    it('should throw error when stepping without session', () => {
      expect(vmDebugger.step()).toBeNull();
    });

    it('should throw error when adding breakpoint without session', () => {
      expect(() => vmDebugger.addBreakpoint(0)).toThrow('No active debug session');
    });

    it('should return false when removing breakpoint without session', () => {
      expect(vmDebugger.removeBreakpoint(0)).toBe(false);
    });

    it('should return empty arrays when getting data without session', () => {
      expect(vmDebugger.getBreakpoints()).toEqual([]);
      expect(vmDebugger.getExecutionTrace()).toEqual([]);
      expect(vmDebugger.getStack()).toEqual([]);
      expect(vmDebugger.getCallStack()).toEqual([]);
      expect(vmDebugger.getVariables().size).toBe(0);
    });
  });

  describe('Complex Debugging Scenarios', () => {
    it('should debug nested function calls', () => {
      // Simple program to test breakpoint functionality
      const testProgram: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 5 },
        { opcode: OpCode.PUSH, operand: 10 },
        { opcode: OpCode.ADD },                   // Break here at address 2
        { opcode: OpCode.PRINT },
        { opcode: OpCode.HALT }
      ];
      
      vmDebugger.startSession(testProgram);
      vmDebugger.addBreakpoint(2); // Break at ADD instruction
      
      let breakpointHit = false;
      vmDebugger.on('breakpoint', () => { breakpointHit = true; });
      
      vmDebugger.continue();
      
      expect(breakpointHit).toBe(true);
      const state = vmDebugger.getVMState();
      expect(state!.pc).toBe(2);
    });

    it('should handle multiple breakpoints in loop', () => {
      vmDebugger.startSession(loopProgram);
      vmDebugger.addBreakpoint(2);  // Loop condition check
      vmDebugger.addBreakpoint(7);  // Inside loop body
      
      let breakpointCount = 0;
      vmDebugger.on('breakpoint', () => { breakpointCount++; });
      
      // Run for a few iterations
      for (let i = 0; i < 6; i++) {
        vmDebugger.continue();
        if (vmDebugger.getSession()!.isPaused) {
          vmDebugger.step(); // Step past breakpoint
        }
      }
      
      expect(breakpointCount).toBeGreaterThan(0);
    });
  });
});