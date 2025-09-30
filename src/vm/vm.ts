import { 
  Instruction, 
  OpCode, 
  VMState, 
  CallFrame, 
  Value 
} from '../types';
import { VM as VMInterface } from '../interfaces';
import { 
  RuntimeError, 
  createDivisionByZeroError, 
  createStackOverflowError,
  createTypeMismatchError,
  createUndefinedVariableError
} from '../utils/errors';
import { 
  createValue, 
  toNumber, 
  isEqual, 
  toString,
  isTruthy 
} from '../utils/values';
import { MemoryManager, MemoryStats } from './memory-manager';

export class VirtualMachine implements VMInterface {
  private stack: Value[] = [];
  private callStack: CallFrame[] = [];
  private variables = new Map<string, Value>();
  private pc = 0; // Program counter
  private instructions: Instruction[] = [];
  private maxStackSize = 1000;
  private maxCallStackSize = 100;
  private maxInstructions = 10000; // Prevent infinite loops
  private memoryManager: MemoryManager;

  constructor(memorySize: number = 1024 * 1024) {
    this.memoryManager = new MemoryManager(memorySize);
  }

  execute(bytecode: Instruction[]): void {
    this.instructions = bytecode;
    this.pc = 0;
    let instructionCount = 0;

    while (this.pc < this.instructions.length) {
      if (instructionCount++ > this.maxInstructions) {
        throw new RuntimeError(
          'stack_overflow',
          'Maximum instruction count exceeded (possible infinite loop)',
          this.getStackTrace()
        );
      }

      const instruction = this.instructions[this.pc];
      if (!instruction) {
        break;
      }

      this.executeInstruction(instruction);
      
      // Check for halt instruction
      if (instruction.opcode === OpCode.HALT) {
        break;
      }
      
      this.pc++;
    }
  }

  step(): boolean {
    if (this.pc >= this.instructions.length) {
      return false;
    }

    const instruction = this.instructions[this.pc];
    if (!instruction) {
      return false;
    }

    this.executeInstruction(instruction);
    
    if (instruction.opcode === OpCode.HALT) {
      return false;
    }
    
    this.pc++;
    return true;
  }

  getState(): VMState {
    return {
      stack: [...this.stack],
      callStack: [...this.callStack],
      variables: new Map(this.variables),
      pc: this.pc,
      instructions: [...this.instructions]
    };
  }

  reset(): void {
    this.stack = [];
    this.callStack = [];
    this.variables.clear();
    this.pc = 0;
    this.instructions = [];
    this.memoryManager.reset();
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats {
    return this.memoryManager.getStats();
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): void {
    this.memoryManager.forceGC();
  }

  /**
   * Set garbage collection threshold
   */
  setGCThreshold(threshold: number): void {
    this.memoryManager.setGCThreshold(threshold);
  }

  loadInstructions(bytecode: Instruction[]): void {
    this.instructions = [...bytecode];
    this.pc = 0;
  }

  private executeInstruction(instruction: Instruction): void {
    switch (instruction.opcode) {
      case OpCode.PUSH:
        this.executePush(instruction.operand);
        break;
      case OpCode.POP:
        this.executePop();
        break;
      case OpCode.DUP:
        this.executeDup();
        break;
      case OpCode.ADD:
        this.executeAdd();
        break;
      case OpCode.SUB:
        this.executeSub();
        break;
      case OpCode.MUL:
        this.executeMul();
        break;
      case OpCode.DIV:
        this.executeDiv();
        break;
      case OpCode.MOD:
        this.executeMod();
        break;
      case OpCode.EQ:
        this.executeEq();
        break;
      case OpCode.NE:
        this.executeNe();
        break;
      case OpCode.LT:
        this.executeLt();
        break;
      case OpCode.GT:
        this.executeGt();
        break;
      case OpCode.LE:
        this.executeLe();
        break;
      case OpCode.GE:
        this.executeGe();
        break;
      case OpCode.JUMP:
        this.executeJump(instruction.operand);
        break;
      case OpCode.JUMP_IF_FALSE:
        this.executeJumpIfFalse(instruction.operand);
        break;
      case OpCode.LOAD:
        this.executeLoad(instruction.operand);
        break;
      case OpCode.STORE:
        this.executeStore(instruction.operand);
        break;
      case OpCode.CALL:
        this.executeCall(instruction.operand);
        break;
      case OpCode.RETURN:
        this.executeReturn();
        break;
      case OpCode.PRINT:
        this.executePrint();
        break;
      case OpCode.HALT:
        // Handled in main execution loop
        break;
      default:
        throw new RuntimeError(
          'type_mismatch',
          `Unknown opcode: ${instruction.opcode}`,
          this.getStackTrace()
        );
    }
  }

  // Stack operations
  private executePush(operand: number | string | boolean | undefined): void {
    if (operand === undefined) {
      throw new RuntimeError(
        'type_mismatch',
        'PUSH instruction requires an operand',
        this.getStackTrace()
      );
    }

    this.checkStackOverflow();
    
    let value: Value;
    if (typeof operand === 'number') {
      value = createValue(operand);
    } else if (typeof operand === 'string') {
      value = createValue(operand);
    } else if (typeof operand === 'boolean') {
      value = createValue(operand);
    } else {
      throw new RuntimeError(
        'type_mismatch',
        `Invalid operand type for PUSH: ${typeof operand}`,
        this.getStackTrace()
      );
    }

    this.stack.push(value);
  }

  private executePop(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot pop from empty stack',
        this.getStackTrace()
      );
    }

    this.stack.pop();
  }

  private executeDup(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot duplicate from empty stack',
        this.getStackTrace()
      );
    }

    this.checkStackOverflow();
    
    const top = this.stack[this.stack.length - 1];
    if (top) {
      this.stack.push({ ...top });
    }
  }

  // Arithmetic operations
  private executeAdd(): void {
    const { right, left } = this.popTwoOperands();
    
    // Check if either operand is a string - if so, do string concatenation
    if (left.type === 'string' || right.type === 'string') {
      const leftStr = toString(left);
      const rightStr = toString(right);
      const result = createValue(leftStr + rightStr);
      this.stack.push(result);
    } else {
      // Both operands are numbers - do numeric addition
      try {
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        const result = createValue(leftNum + rightNum);
        this.stack.push(result);
      } catch (error) {
        throw createTypeMismatchError(
          'number',
          `${left.type} and ${right.type}`,
          'addition'
        );
      }
    }
  }

  private executeSub(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      const result = createValue(leftNum - rightNum);
      this.stack.push(result);
    } catch (error) {
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'subtraction'
      );
    }
  }

  private executeMul(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      const result = createValue(leftNum * rightNum);
      this.stack.push(result);
    } catch (error) {
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'multiplication'
      );
    }
  }

  private executeDiv(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      
      if (rightNum === 0) {
        throw createDivisionByZeroError();
      }
      
      const result = createValue(leftNum / rightNum);
      this.stack.push(result);
    } catch (error) {
      if (error instanceof RuntimeError && error.type === 'division_by_zero') {
        throw error;
      }
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'division'
      );
    }
  }

  private executeMod(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      
      if (rightNum === 0) {
        throw createDivisionByZeroError();
      }
      
      const result = createValue(leftNum % rightNum);
      this.stack.push(result);
    } catch (error) {
      if (error instanceof RuntimeError && error.type === 'division_by_zero') {
        throw error;
      }
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'modulo'
      );
    }
  }

  // Comparison operations
  private executeEq(): void {
    const { right, left } = this.popTwoOperands();
    const result = createValue(isEqual(left, right));
    this.stack.push(result);
  }

  private executeNe(): void {
    const { right, left } = this.popTwoOperands();
    const result = createValue(!isEqual(left, right));
    this.stack.push(result);
  }

  private executeLt(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      const result = createValue(leftNum < rightNum);
      this.stack.push(result);
    } catch (error) {
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'less than comparison'
      );
    }
  }

  private executeGt(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      const result = createValue(leftNum > rightNum);
      this.stack.push(result);
    } catch (error) {
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'greater than comparison'
      );
    }
  }

  private executeLe(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      const result = createValue(leftNum <= rightNum);
      this.stack.push(result);
    } catch (error) {
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'less than or equal comparison'
      );
    }
  }

  private executeGe(): void {
    const { right, left } = this.popTwoOperands();
    
    try {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      const result = createValue(leftNum >= rightNum);
      this.stack.push(result);
    } catch (error) {
      throw createTypeMismatchError(
        'number',
        `${left.type} and ${right.type}`,
        'greater than or equal comparison'
      );
    }
  }

  // Control flow operations
  private executeJump(operand: number | string | boolean | undefined): void {
    if (typeof operand !== 'number') {
      throw new RuntimeError(
        'type_mismatch',
        'JUMP instruction requires a numeric address',
        this.getStackTrace()
      );
    }

    if (operand < 0 || operand >= this.instructions.length) {
      throw new RuntimeError(
        'type_mismatch',
        `Invalid jump address: ${operand}`,
        this.getStackTrace()
      );
    }

    this.pc = operand - 1; // -1 because pc will be incremented in main loop
  }

  private executeJumpIfFalse(operand: number | string | boolean | undefined): void {
    if (typeof operand !== 'number') {
      throw new RuntimeError(
        'type_mismatch',
        'JUMP_IF_FALSE instruction requires a numeric address',
        this.getStackTrace()
      );
    }

    if (operand < 0 || operand >= this.instructions.length) {
      throw new RuntimeError(
        'type_mismatch',
        `Invalid jump address: ${operand}`,
        this.getStackTrace()
      );
    }

    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot pop condition from empty stack',
        this.getStackTrace()
      );
    }

    const condition = this.stack.pop();
    if (!condition) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during conditional jump',
        this.getStackTrace()
      );
    }

    if (!isTruthy(condition)) {
      this.pc = operand - 1; // -1 because pc will be incremented in main loop
    }
  }

  // Variable operations
  private executeLoad(operand: number | string | boolean | undefined): void {
    if (typeof operand !== 'string') {
      throw new RuntimeError(
        'type_mismatch',
        'LOAD instruction requires a variable name',
        this.getStackTrace()
      );
    }

    const value = this.variables.get(operand);
    if (value === undefined) {
      throw createUndefinedVariableError(operand);
    }

    this.checkStackOverflow();
    this.stack.push({ ...value }); // Clone the value
  }

  private executeStore(operand: number | string | boolean | undefined): void {
    if (typeof operand !== 'string') {
      throw new RuntimeError(
        'type_mismatch',
        'STORE instruction requires a variable name',
        this.getStackTrace()
      );
    }

    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot store from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during store operation',
        this.getStackTrace()
      );
    }

    this.variables.set(operand, { ...value }); // Clone the value
  }

  // Function call operations
  private executeCall(operand: number | string | boolean | undefined): void {
    if (typeof operand !== 'string') {
      throw new RuntimeError(
        'type_mismatch',
        'CALL instruction requires a function name',
        this.getStackTrace()
      );
    }

    // Check call stack overflow
    if (this.callStack.length >= this.maxCallStackSize) {
      throw createStackOverflowError();
    }

    // Create call frame
    const callFrame: CallFrame = {
      returnAddress: this.pc + 1,
      localVariables: new Map(),
      functionName: operand
    };

    this.callStack.push(callFrame);

    // Built-in function system
    switch (operand) {
      case 'print':
        this.executePrint();
        this.executeReturn(); // Auto-return for built-ins
        break;
      case 'abs':
        this.executeAbs();
        this.executeReturn();
        break;
      case 'sqrt':
        this.executeSqrt();
        this.executeReturn();
        break;
      case 'pow':
        this.executePow();
        this.executeReturn();
        break;
      case 'length':
        this.executeLength();
        this.executeReturn();
        break;
      case 'substring':
        this.executeSubstring();
        this.executeReturn();
        break;
      case 'concat':
        this.executeConcat();
        this.executeReturn();
        break;
      case 'toString':
        this.executeToString();
        this.executeReturn();
        break;
      case 'toNumber':
        this.executeToNumber();
        this.executeReturn();
        break;
      case 'toBoolean':
        this.executeToBoolean();
        this.executeReturn();
        break;
      default:
        // For user-defined functions, we'd jump to the function address
        // For now, throw an error for undefined functions
        throw new RuntimeError(
          'undefined_variable',
          `Undefined function: ${operand}`,
          this.getStackTrace()
        );
    }
  }

  private executeReturn(): void {
    if (this.callStack.length === 0) {
      // Return from main program - halt execution
      this.pc = this.instructions.length;
      return;
    }

    const callFrame = this.callStack.pop();
    if (!callFrame) {
      throw new RuntimeError(
        'stack_overflow',
        'Call stack underflow during return',
        this.getStackTrace()
      );
    }

    // Restore program counter to return address
    this.pc = callFrame.returnAddress - 1; // -1 because pc will be incremented in main loop
  }

  // Built-in functions
  private executePrint(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot print from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during print operation',
        this.getStackTrace()
      );
    }

    const output = toString(value);
    console.log(output);
  }

  // Mathematical functions
  private executeAbs(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute abs from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during abs operation',
        this.getStackTrace()
      );
    }

    try {
      const num = toNumber(value);
      const result = createValue(Math.abs(num));
      this.checkStackOverflow();
      this.stack.push(result);
    } catch (error) {
      throw createTypeMismatchError(
        'number',
        value.type,
        'abs function'
      );
    }
  }

  private executeSqrt(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute sqrt from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during sqrt operation',
        this.getStackTrace()
      );
    }

    try {
      const num = toNumber(value);
      if (num < 0) {
        throw new RuntimeError(
          'type_mismatch',
          'Cannot take square root of negative number',
          this.getStackTrace()
        );
      }
      const result = createValue(Math.sqrt(num));
      this.checkStackOverflow();
      this.stack.push(result);
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }
      throw createTypeMismatchError(
        'number',
        value.type,
        'sqrt function'
      );
    }
  }

  private executePow(): void {
    if (this.stack.length < 2) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute pow: need two operands (base and exponent)',
        this.getStackTrace()
      );
    }

    const exponent = this.stack.pop();
    const base = this.stack.pop();

    if (!exponent || !base) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during pow operation',
        this.getStackTrace()
      );
    }

    try {
      const baseNum = toNumber(base);
      const expNum = toNumber(exponent);
      
      // Check for invalid operations
      if (baseNum === 0 && expNum < 0) {
        throw new RuntimeError(
          'type_mismatch',
          'Cannot raise 0 to negative power',
          this.getStackTrace()
        );
      }
      
      const result = createValue(Math.pow(baseNum, expNum));
      
      // Check for invalid results
      if (!isFinite(result.data as number)) {
        throw new RuntimeError(
          'type_mismatch',
          'Power operation resulted in invalid number',
          this.getStackTrace()
        );
      }
      
      this.checkStackOverflow();
      this.stack.push(result);
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }
      throw createTypeMismatchError(
        'number',
        `${base.type} and ${exponent.type}`,
        'pow function'
      );
    }
  }

  // String manipulation functions
  private executeLength(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute length from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during length operation',
        this.getStackTrace()
      );
    }

    if (value.type !== 'string') {
      throw createTypeMismatchError(
        'string',
        value.type,
        'length function'
      );
    }

    const str = value.data as string;
    const result = createValue(str.length);
    this.checkStackOverflow();
    this.stack.push(result);
  }

  private executeSubstring(): void {
    if (this.stack.length < 3) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute substring: need three operands (string, start, end)',
        this.getStackTrace()
      );
    }

    const endValue = this.stack.pop();
    const startValue = this.stack.pop();
    const stringValue = this.stack.pop();

    if (!endValue || !startValue || !stringValue) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during substring operation',
        this.getStackTrace()
      );
    }

    if (stringValue.type !== 'string') {
      throw createTypeMismatchError(
        'string',
        stringValue.type,
        'substring function (first argument)'
      );
    }

    try {
      const str = stringValue.data as string;
      const start = toNumber(startValue);
      const end = toNumber(endValue);

      // Validate indices
      if (start < 0 || end < 0) {
        throw new RuntimeError(
          'type_mismatch',
          'Substring indices cannot be negative',
          this.getStackTrace()
        );
      }

      if (start > str.length || end > str.length) {
        throw new RuntimeError(
          'type_mismatch',
          'Substring indices cannot exceed string length',
          this.getStackTrace()
        );
      }

      if (start > end) {
        throw new RuntimeError(
          'type_mismatch',
          'Substring start index cannot be greater than end index',
          this.getStackTrace()
        );
      }

      const result = createValue(str.substring(Math.floor(start), Math.floor(end)));
      this.checkStackOverflow();
      this.stack.push(result);
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }
      throw createTypeMismatchError(
        'number',
        `${startValue.type} and ${endValue.type}`,
        'substring function (indices)'
      );
    }
  }

  private executeConcat(): void {
    if (this.stack.length < 2) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute concat: need two operands (string1, string2)',
        this.getStackTrace()
      );
    }

    const string2Value = this.stack.pop();
    const string1Value = this.stack.pop();

    if (!string2Value || !string1Value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during concat operation',
        this.getStackTrace()
      );
    }

    // Convert both values to strings
    const str1 = toString(string1Value);
    const str2 = toString(string2Value);

    const result = createValue(str1 + str2);
    this.checkStackOverflow();
    this.stack.push(result);
  }

  // Type conversion functions
  private executeToString(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute toString from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during toString operation',
        this.getStackTrace()
      );
    }

    const result = createValue(toString(value));
    this.checkStackOverflow();
    this.stack.push(result);
  }

  private executeToNumber(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute toNumber from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during toNumber operation',
        this.getStackTrace()
      );
    }

    try {
      const num = toNumber(value);
      const result = createValue(num);
      this.checkStackOverflow();
      this.stack.push(result);
    } catch (error) {
      throw new RuntimeError(
        'type_mismatch',
        `Cannot convert ${value.type} value "${value.data}" to number`,
        this.getStackTrace()
      );
    }
  }

  private executeToBoolean(): void {
    if (this.stack.length === 0) {
      throw new RuntimeError(
        'stack_overflow',
        'Cannot execute toBoolean from empty stack',
        this.getStackTrace()
      );
    }

    const value = this.stack.pop();
    if (!value) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during toBoolean operation',
        this.getStackTrace()
      );
    }

    const result = createValue(isTruthy(value));
    this.checkStackOverflow();
    this.stack.push(result);
  }

  // Helper methods
  private popTwoOperands(): { left: Value; right: Value } {
    if (this.stack.length < 2) {
      throw new RuntimeError(
        'stack_overflow',
        'Not enough operands on stack for binary operation',
        this.getStackTrace()
      );
    }

    const right = this.stack.pop();
    const left = this.stack.pop();

    if (!right || !left) {
      throw new RuntimeError(
        'stack_overflow',
        'Stack underflow during binary operation',
        this.getStackTrace()
      );
    }

    return { left, right };
  }

  private checkStackOverflow(): void {
    if (this.stack.length >= this.maxStackSize) {
      throw createStackOverflowError();
    }
  }

  private getStackTrace(): string[] {
    const trace: string[] = [];
    
    // Add current instruction info
    if (this.pc < this.instructions.length) {
      const instruction = this.instructions[this.pc];
      if (instruction) {
        trace.push(`at instruction ${this.pc}: ${OpCode[instruction.opcode]}`);
      }
    }
    
    // Add call stack info
    for (let i = this.callStack.length - 1; i >= 0; i--) {
      const frame = this.callStack[i];
      if (frame) {
        trace.push(`at ${frame.functionName}()`);
      }
    }
    
    if (trace.length === 0) {
      trace.push('at <main>');
    }
    
    return trace;
  }
}