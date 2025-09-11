import { OpCode, Instruction } from '../types';

/**
 * Creates a bytecode instruction
 */
export function createInstruction(opcode: OpCode, operand?: number | string | boolean): Instruction {
  const instruction: Instruction = { opcode };
  if (operand !== undefined) {
    instruction.operand = operand;
  }
  return instruction;
}

/**
 * Factory class for creating bytecode instructions
 */
export class InstructionFactory {
  // Stack operations
  push(value: number | string | boolean): Instruction {
    return createInstruction(OpCode.PUSH, value);
  }

  pop(): Instruction {
    return createInstruction(OpCode.POP);
  }

  dup(): Instruction {
    return createInstruction(OpCode.DUP);
  }

  // Arithmetic operations
  add(): Instruction {
    return createInstruction(OpCode.ADD);
  }

  sub(): Instruction {
    return createInstruction(OpCode.SUB);
  }

  mul(): Instruction {
    return createInstruction(OpCode.MUL);
  }

  div(): Instruction {
    return createInstruction(OpCode.DIV);
  }

  mod(): Instruction {
    return createInstruction(OpCode.MOD);
  }

  // Comparison operations
  eq(): Instruction {
    return createInstruction(OpCode.EQ);
  }

  ne(): Instruction {
    return createInstruction(OpCode.NE);
  }

  lt(): Instruction {
    return createInstruction(OpCode.LT);
  }

  gt(): Instruction {
    return createInstruction(OpCode.GT);
  }

  le(): Instruction {
    return createInstruction(OpCode.LE);
  }

  ge(): Instruction {
    return createInstruction(OpCode.GE);
  }

  // Control flow operations
  jump(address: number): Instruction {
    return createInstruction(OpCode.JUMP, address);
  }

  jumpIfFalse(address: number): Instruction {
    return createInstruction(OpCode.JUMP_IF_FALSE, address);
  }

  call(functionName: string): Instruction {
    return createInstruction(OpCode.CALL, functionName);
  }

  return(): Instruction {
    return createInstruction(OpCode.RETURN);
  }

  // Variable operations
  load(variableName: string): Instruction {
    return createInstruction(OpCode.LOAD, variableName);
  }

  store(variableName: string): Instruction {
    return createInstruction(OpCode.STORE, variableName);
  }

  // Built-in operations
  print(): Instruction {
    return createInstruction(OpCode.PRINT);
  }

  halt(): Instruction {
    return createInstruction(OpCode.HALT);
  }
}

/**
 * Bytecode serialization and deserialization
 */
export class BytecodeSerializer {
  /**
   * Serializes instructions to binary format
   */
  toBinary(instructions: Instruction[]): Uint8Array {
    const buffer: number[] = [];
    
    for (const instruction of instructions) {
      // Write opcode (1 byte)
      buffer.push(instruction.opcode);
      
      // Write operand type and value
      if (instruction.operand !== undefined) {
        if (typeof instruction.operand === 'number') {
          // Type: 1 = number
          buffer.push(1);
          // Write number as 4 bytes (IEEE 754 would be more accurate, but this is simpler)
          const num = instruction.operand;
          buffer.push((num >> 24) & 0xFF);
          buffer.push((num >> 16) & 0xFF);
          buffer.push((num >> 8) & 0xFF);
          buffer.push(num & 0xFF);
        } else if (typeof instruction.operand === 'string') {
          // Type: 2 = string
          buffer.push(2);
          // Write string length
          const str = instruction.operand;
          buffer.push(str.length);
          // Write string bytes
          for (let i = 0; i < str.length; i++) {
            buffer.push(str.charCodeAt(i));
          }
        } else if (typeof instruction.operand === 'boolean') {
          // Type: 3 = boolean
          buffer.push(3);
          buffer.push(instruction.operand ? 1 : 0);
        }
      } else {
        // Type: 0 = no operand
        buffer.push(0);
      }
    }
    
    return new Uint8Array(buffer);
  }

  /**
   * Deserializes instructions from binary format
   */
  fromBinary(binary: Uint8Array): Instruction[] {
    const instructions: Instruction[] = [];
    let i = 0;
    
    while (i < binary.length) {
      const opcode = binary[i++] as OpCode;
      const operandType = binary[i++];
      
      let operand: number | string | boolean | undefined = undefined;
      
      if (operandType === 1) {
        // Number operand
        const byte1 = binary[i++] || 0;
        const byte2 = binary[i++] || 0;
        const byte3 = binary[i++] || 0;
        const byte4 = binary[i++] || 0;
        operand = (byte1 << 24) | (byte2 << 16) | (byte3 << 8) | byte4;
      } else if (operandType === 2) {
        // String operand
        const length = binary[i++] || 0;
        let str = '';
        for (let j = 0; j < length; j++) {
          str += String.fromCharCode(binary[i++] || 0);
        }
        operand = str;
      } else if (operandType === 3) {
        // Boolean operand
        operand = (binary[i++] || 0) === 1;
      }
      
      instructions.push(createInstruction(opcode, operand));
    }
    
    return instructions;
  }

  /**
   * Serializes instructions to human-readable text format
   */
  toText(instructions: Instruction[]): string {
    const lines: string[] = [];
    
    for (const instruction of instructions) {
      const opcodeName = this.getOpcodeName(instruction.opcode);
      if (instruction.operand !== undefined) {
        lines.push(`${opcodeName} ${instruction.operand}`);
      } else {
        lines.push(opcodeName);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Deserializes instructions from text format
   */
  fromText(text: string): Instruction[] {
    const instructions: Instruction[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const opcodeName = parts[0];
      
      if (!opcodeName) {
        continue; // Skip empty lines
      }
      
      const opcode = this.getOpcodeFromName(opcodeName);
      
      if (opcode === undefined) {
        throw new Error(`Unknown opcode: ${opcodeName}`);
      }
      
      let operand: number | string | boolean | undefined = undefined;
      if (parts.length > 1) {
        const operandStr = parts.slice(1).join(' ');
        // Try to parse as boolean first
        if (operandStr === 'true') {
          operand = true;
        } else if (operandStr === 'false') {
          operand = false;
        } else {
          // Try to parse as number
          const num = parseFloat(operandStr);
          if (!isNaN(num)) {
            operand = num;
          } else {
            operand = operandStr;
          }
        }
      }
      
      instructions.push(createInstruction(opcode, operand));
    }
    
    return instructions;
  }

  private getOpcodeName(opcode: OpCode): string {
    const opcodeNames: Record<OpCode, string> = {
      [OpCode.PUSH]: 'PUSH',
      [OpCode.POP]: 'POP',
      [OpCode.DUP]: 'DUP',
      [OpCode.ADD]: 'ADD',
      [OpCode.SUB]: 'SUB',
      [OpCode.MUL]: 'MUL',
      [OpCode.DIV]: 'DIV',
      [OpCode.MOD]: 'MOD',
      [OpCode.EQ]: 'EQ',
      [OpCode.NE]: 'NE',
      [OpCode.LT]: 'LT',
      [OpCode.GT]: 'GT',
      [OpCode.LE]: 'LE',
      [OpCode.GE]: 'GE',
      [OpCode.JUMP]: 'JUMP',
      [OpCode.JUMP_IF_FALSE]: 'JUMP_IF_FALSE',
      [OpCode.CALL]: 'CALL',
      [OpCode.RETURN]: 'RETURN',
      [OpCode.LOAD]: 'LOAD',
      [OpCode.STORE]: 'STORE',
      [OpCode.PRINT]: 'PRINT',
      [OpCode.HALT]: 'HALT'
    };
    
    return opcodeNames[opcode] || 'UNKNOWN';
  }

  private getOpcodeFromName(name: string): OpCode | undefined {
    const nameToOpcode: Record<string, OpCode> = {
      'PUSH': OpCode.PUSH,
      'POP': OpCode.POP,
      'DUP': OpCode.DUP,
      'ADD': OpCode.ADD,
      'SUB': OpCode.SUB,
      'MUL': OpCode.MUL,
      'DIV': OpCode.DIV,
      'MOD': OpCode.MOD,
      'EQ': OpCode.EQ,
      'NE': OpCode.NE,
      'LT': OpCode.LT,
      'GT': OpCode.GT,
      'LE': OpCode.LE,
      'GE': OpCode.GE,
      'JUMP': OpCode.JUMP,
      'JUMP_IF_FALSE': OpCode.JUMP_IF_FALSE,
      'CALL': OpCode.CALL,
      'RETURN': OpCode.RETURN,
      'LOAD': OpCode.LOAD,
      'STORE': OpCode.STORE,
      'PRINT': OpCode.PRINT,
      'HALT': OpCode.HALT
    };
    
    return nameToOpcode[name.toUpperCase()];
  }
}

/**
 * Instruction validation
 */
export function validateInstruction(instruction: Instruction): void {
  const info = getInstructionInfo(instruction.opcode);
  
  if (info.hasOperand && instruction.operand === undefined) {
    throw new Error(`Instruction ${info.name} requires an operand`);
  }
  
  if (!info.hasOperand && instruction.operand !== undefined) {
    throw new Error(`Instruction ${info.name} should not have an operand`);
  }
}

/**
 * Gets information about an instruction opcode
 */
export function getInstructionInfo(opcode: OpCode) {
  const instructionInfo: Record<OpCode, { name: string; hasOperand: boolean; description: string }> = {
    [OpCode.PUSH]: { name: 'PUSH', hasOperand: true, description: 'Push value onto stack' },
    [OpCode.POP]: { name: 'POP', hasOperand: false, description: 'Pop value from stack' },
    [OpCode.DUP]: { name: 'DUP', hasOperand: false, description: 'Duplicate top of stack' },
    [OpCode.ADD]: { name: 'ADD', hasOperand: false, description: 'Add two values' },
    [OpCode.SUB]: { name: 'SUB', hasOperand: false, description: 'Subtract two values' },
    [OpCode.MUL]: { name: 'MUL', hasOperand: false, description: 'Multiply two values' },
    [OpCode.DIV]: { name: 'DIV', hasOperand: false, description: 'Divide two values' },
    [OpCode.MOD]: { name: 'MOD', hasOperand: false, description: 'Modulo operation' },
    [OpCode.EQ]: { name: 'EQ', hasOperand: false, description: 'Test equality' },
    [OpCode.NE]: { name: 'NE', hasOperand: false, description: 'Test inequality' },
    [OpCode.LT]: { name: 'LT', hasOperand: false, description: 'Test less than' },
    [OpCode.GT]: { name: 'GT', hasOperand: false, description: 'Test greater than' },
    [OpCode.LE]: { name: 'LE', hasOperand: false, description: 'Test less than or equal' },
    [OpCode.GE]: { name: 'GE', hasOperand: false, description: 'Test greater than or equal' },
    [OpCode.JUMP]: { name: 'JUMP', hasOperand: true, description: 'Unconditional jump' },
    [OpCode.JUMP_IF_FALSE]: { name: 'JUMP_IF_FALSE', hasOperand: true, description: 'Jump if false' },
    [OpCode.CALL]: { name: 'CALL', hasOperand: true, description: 'Call function' },
    [OpCode.RETURN]: { name: 'RETURN', hasOperand: false, description: 'Return from function' },
    [OpCode.LOAD]: { name: 'LOAD', hasOperand: true, description: 'Load variable' },
    [OpCode.STORE]: { name: 'STORE', hasOperand: true, description: 'Store variable' },
    [OpCode.PRINT]: { name: 'PRINT', hasOperand: false, description: 'Print top of stack' },
    [OpCode.HALT]: { name: 'HALT', hasOperand: false, description: 'Halt execution' }
  };
  
  return instructionInfo[opcode] || { name: 'UNKNOWN', hasOperand: false, description: 'Unknown instruction' };
}

/**
 * Gets all available opcodes
 */
export function getAllOpcodes(): OpCode[] {
  const opcodes: OpCode[] = [];
  for (const key in OpCode) {
    const value = OpCode[key as keyof typeof OpCode];
    if (typeof value === 'number') {
      opcodes.push(value);
    }
  }
  return opcodes;
}

/**
 * Calculates the size of bytecode in bytes
 */
export function calculateBytecodeSize(instructions: Instruction[]): number {
  let size = 0;
  
  for (const instruction of instructions) {
    size += 2; // opcode + operand type
    
    if (instruction.operand !== undefined) {
      if (typeof instruction.operand === 'number') {
        size += 4; // 4 bytes for number
      } else if (typeof instruction.operand === 'string') {
        size += 1 + instruction.operand.length; // length byte + string bytes
      }
    }
  }
  
  return size;
}

/**
 * Convenience functions for common bytecode patterns
 */
export function serializeBytecode(instructions: Instruction[]): {
  binary: Uint8Array;
  text: string;
  size: number;
} {
  const serializer = new BytecodeSerializer();
  return {
    binary: serializer.toBinary(instructions),
    text: serializer.toText(instructions),
    size: calculateBytecodeSize(instructions)
  };
}

export function deserializeBytecode(data: Uint8Array | string): Instruction[] {
  const serializer = new BytecodeSerializer();
  
  if (typeof data === 'string') {
    return serializer.fromText(data);
  } else {
    return serializer.fromBinary(data);
  }
}