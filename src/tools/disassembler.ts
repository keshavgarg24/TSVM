import { Instruction, OpCode } from '../types';

export interface DisassemblerOptions {
  showAddresses?: boolean;
  showHex?: boolean;
  showOperandTypes?: boolean;
  indentSize?: number;
}

export interface DisassembledInstruction {
  address: number;
  opcode: string;
  operand?: string | number | boolean;
  operandType?: string;
  mnemonic: string;
  comment?: string;
}

export class Disassembler {
  private options: Required<DisassemblerOptions>;

  constructor(options: DisassemblerOptions = {}) {
    this.options = {
      showAddresses: options.showAddresses ?? true,
      showHex: options.showHex ?? false,
      showOperandTypes: options.showOperandTypes ?? false,
      indentSize: options.indentSize ?? 2
    };
  }

  /**
   * Disassemble bytecode instructions into readable format
   */
  disassemble(instructions: Instruction[]): string {
    const disassembled = this.disassembleToObjects(instructions);
    return this.formatOutput(disassembled);
  }

  /**
   * Disassemble bytecode instructions into structured objects
   */
  disassembleToObjects(instructions: Instruction[]): DisassembledInstruction[] {
    const result: DisassembledInstruction[] = [];

    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (!instruction) continue;

      const disassembled = this.disassembleInstruction(instruction, i);
      result.push(disassembled);
    }

    return result;
  }

  /**
   * Disassemble a single instruction
   */
  private disassembleInstruction(instruction: Instruction, address: number): DisassembledInstruction {
    const opcodeName = this.getOpcodeName(instruction.opcode);
    const operandInfo = this.analyzeOperand(instruction.operand);
    const mnemonic = this.generateMnemonic(opcodeName, instruction.operand);
    const comment = this.generateComment(instruction.opcode, instruction.operand);

    const result: DisassembledInstruction = {
      address,
      opcode: opcodeName,
      mnemonic
    };

    if (instruction.operand !== undefined) {
      result.operand = instruction.operand;
    }
    
    if (operandInfo.type !== 'none') {
      result.operandType = operandInfo.type;
    }
    
    if (comment) {
      result.comment = comment;
    }

    return result;
  }

  /**
   * Get the string name of an opcode
   */
  private getOpcodeName(opcode: OpCode): string {
    return OpCode[opcode] || `UNKNOWN_${opcode.toString(16).toUpperCase()}`;
  }

  /**
   * Analyze operand and determine its type
   */
  private analyzeOperand(operand: string | number | boolean | undefined): { type: string; formatted: string } {
    if (operand === undefined) {
      return { type: 'none', formatted: '' };
    }

    if (typeof operand === 'number') {
      return { type: 'number', formatted: operand.toString() };
    }

    if (typeof operand === 'boolean') {
      return { type: 'boolean', formatted: operand.toString() };
    }

    if (typeof operand === 'string') {
      return { type: 'string', formatted: `"${operand}"` };
    }

    return { type: 'unknown', formatted: String(operand) };
  }

  /**
   * Generate a human-readable mnemonic for the instruction
   */
  private generateMnemonic(opcodeName: string, operand?: string | number | boolean): string {
    if (operand === undefined) {
      return opcodeName;
    }

    const operandInfo = this.analyzeOperand(operand);
    return `${opcodeName} ${operandInfo.formatted}`;
  }

  /**
   * Generate explanatory comments for instructions
   */
  private generateComment(opcode: OpCode, operand?: string | number | boolean): string | undefined {
    switch (opcode) {
      case OpCode.PUSH:
        return `Push ${this.analyzeOperand(operand).formatted} onto stack`;
      case OpCode.POP:
        return 'Pop top value from stack';
      case OpCode.DUP:
        return 'Duplicate top stack value';
      case OpCode.ADD:
        return 'Pop two values, push sum';
      case OpCode.SUB:
        return 'Pop two values, push difference';
      case OpCode.MUL:
        return 'Pop two values, push product';
      case OpCode.DIV:
        return 'Pop two values, push quotient';
      case OpCode.MOD:
        return 'Pop two values, push remainder';
      case OpCode.EQ:
        return 'Pop two values, push equality result';
      case OpCode.NE:
        return 'Pop two values, push inequality result';
      case OpCode.LT:
        return 'Pop two values, push less-than result';
      case OpCode.GT:
        return 'Pop two values, push greater-than result';
      case OpCode.LE:
        return 'Pop two values, push less-equal result';
      case OpCode.GE:
        return 'Pop two values, push greater-equal result';
      case OpCode.JUMP:
        return `Jump to address ${operand}`;
      case OpCode.JUMP_IF_FALSE:
        return `Jump to address ${operand} if top of stack is false`;
      case OpCode.CALL:
        return `Call function ${operand}`;
      case OpCode.RETURN:
        return 'Return from function';
      case OpCode.LOAD:
        return `Load variable ${operand} onto stack`;
      case OpCode.STORE:
        return `Store top of stack to variable ${operand}`;
      case OpCode.PRINT:
        return 'Print top of stack';
      case OpCode.HALT:
        return 'Stop execution';
      default:
        return undefined;
    }
  }

  /**
   * Format disassembled instructions into readable text
   */
  private formatOutput(instructions: DisassembledInstruction[]): string {
    const lines: string[] = [];
    const maxAddressWidth = instructions.length.toString().length;

    for (const instruction of instructions) {
      let line = '';

      // Address
      if (this.options.showAddresses) {
        const addressStr = instruction.address.toString().padStart(maxAddressWidth, '0');
        line += `${addressStr}: `;
      }

      // Hex opcode (if enabled)
      if (this.options.showHex) {
        // Find the numeric value of the opcode by looking up the enum
        let opcodeValue = 0;
        for (const [key, value] of Object.entries(OpCode)) {
          if (key === instruction.opcode) {
            opcodeValue = value as number;
            break;
          }
        }
        const hexValue = opcodeValue.toString(16).toUpperCase().padStart(2, '0');
        line += `0x${hexValue} `;
      }

      // Mnemonic
      line += instruction.mnemonic.padEnd(20);

      // Operand type (if enabled and present)
      if (this.options.showOperandTypes && instruction.operandType && instruction.operandType !== 'none') {
        line += ` ; ${instruction.operandType}`;
      }

      // Comment (if present)
      if (instruction.comment) {
        const padding = this.options.showOperandTypes ? '' : ' ';
        line += `${padding} ; ${instruction.comment}`;
      }

      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Analyze bytecode for jump targets and create labels
   */
  analyzeJumpTargets(instructions: Instruction[]): Map<number, string> {
    const jumpTargets = new Set<number>();

    // First pass: collect all jump targets
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (!instruction) continue;

      if (instruction.opcode === OpCode.JUMP || instruction.opcode === OpCode.JUMP_IF_FALSE) {
        const target = instruction.operand as number;
        if (typeof target === 'number' && target >= 0 && target < instructions.length) {
          jumpTargets.add(target);
        }
      }
    }

    // Second pass: assign labels in address order
    const result = new Map<number, string>();
    const sortedTargets = Array.from(jumpTargets).sort((a, b) => a - b);
    
    sortedTargets.forEach((target, index) => {
      result.set(target, `L${index + 1}`);
    });

    return result;
  }

  /**
   * Disassemble with labels for jump targets
   */
  disassembleWithLabels(instructions: Instruction[]): string {
    const jumpTargets = this.analyzeJumpTargets(instructions);
    const disassembled = this.disassembleToObjects(instructions);
    const lines: string[] = [];
    const maxAddressWidth = instructions.length.toString().length;

    for (const instruction of disassembled) {
      // Add label if this address is a jump target
      const label = jumpTargets.get(instruction.address);
      if (label) {
        lines.push(`${label}:`);
      }

      let line = '';

      // Address
      if (this.options.showAddresses) {
        const addressStr = instruction.address.toString().padStart(maxAddressWidth, '0');
        line += `${addressStr}: `;
      }

      // Indent instruction if we have labels
      if (jumpTargets.size > 0) {
        line += ' '.repeat(this.options.indentSize);
      }

      // Replace jump addresses with labels in mnemonic
      let mnemonic = instruction.mnemonic;
      if ((instruction.opcode === 'JUMP' || instruction.opcode === 'JUMP_IF_FALSE') && 
          typeof instruction.operand === 'number') {
        const targetLabel = jumpTargets.get(instruction.operand);
        if (targetLabel) {
          mnemonic = `${instruction.opcode} ${targetLabel}`;
        }
      }

      line += mnemonic.padEnd(20);

      // Comment
      if (instruction.comment) {
        // Update comment for jumps with labels
        let comment = instruction.comment;
        if ((instruction.opcode === 'JUMP' || instruction.opcode === 'JUMP_IF_FALSE') && 
            typeof instruction.operand === 'number') {
          const targetLabel = jumpTargets.get(instruction.operand);
          if (targetLabel) {
            comment = comment.replace(`address ${instruction.operand}`, `label ${targetLabel}`);
          }
        }
        line += ` ; ${comment}`;
      }

      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Get statistics about the bytecode
   */
  getStatistics(instructions: Instruction[]): {
    totalInstructions: number;
    opcodeFrequency: Map<string, number>;
    jumpTargets: number;
    maxStackDepth: number;
  } {
    const opcodeFrequency = new Map<string, number>();
    const jumpTargets = this.analyzeJumpTargets(instructions);
    let stackDepth = 0;
    let maxStackDepth = 0;

    for (const instruction of instructions) {
      if (!instruction) continue;

      const opcodeName = this.getOpcodeName(instruction.opcode);
      opcodeFrequency.set(opcodeName, (opcodeFrequency.get(opcodeName) || 0) + 1);

      // Estimate stack depth changes
      switch (instruction.opcode) {
        case OpCode.PUSH:
          stackDepth++;
          maxStackDepth = Math.max(maxStackDepth, stackDepth);
          break;
        case OpCode.POP:
          stackDepth = Math.max(0, stackDepth - 1);
          break;
        case OpCode.DUP:
          stackDepth++;
          maxStackDepth = Math.max(maxStackDepth, stackDepth);
          break;
        case OpCode.ADD:
        case OpCode.SUB:
        case OpCode.MUL:
        case OpCode.DIV:
        case OpCode.MOD:
        case OpCode.EQ:
        case OpCode.NE:
        case OpCode.LT:
        case OpCode.GT:
        case OpCode.LE:
        case OpCode.GE:
          stackDepth = Math.max(0, stackDepth - 1); // Pop 2, push 1
          break;
        case OpCode.LOAD:
          stackDepth++;
          maxStackDepth = Math.max(maxStackDepth, stackDepth);
          break;
        case OpCode.STORE:
          stackDepth = Math.max(0, stackDepth - 1);
          break;
        case OpCode.PRINT:
          stackDepth = Math.max(0, stackDepth - 1);
          break;
      }
    }

    return {
      totalInstructions: instructions.length,
      opcodeFrequency,
      jumpTargets: jumpTargets.size,
      maxStackDepth
    };
  }

  /**
   * Set disassembler options
   */
  setOptions(options: Partial<DisassemblerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): DisassemblerOptions {
    return { ...this.options };
  }
}