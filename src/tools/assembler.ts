import { Instruction, OpCode } from '../types';

export interface AssemblerOptions {
  allowComments?: boolean;
  caseSensitive?: boolean;
  strictMode?: boolean;
}

export interface AssemblerError {
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface AssemblyLine {
  lineNumber: number;
  originalText: string;
  label?: string;
  instruction?: {
    opcode: string;
    operand?: string;
  };
  comment?: string;
}

export class Assembler {
  private options: Required<AssemblerOptions>;
  private labels: Map<string, number> = new Map();
  private unresolvedReferences: Array<{
    instructionIndex: number;
    label: string;
    lineNumber: number;
  }> = [];

  constructor(options: AssemblerOptions = {}) {
    this.options = {
      allowComments: options.allowComments ?? true,
      caseSensitive: options.caseSensitive ?? false,
      strictMode: options.strictMode ?? true
    };
  }

  /**
   * Assemble text assembly code into bytecode instructions
   */
  assemble(assembly: string): Instruction[] {
    this.reset();
    
    const lines = this.parseAssembly(assembly);
    const instructions = this.generateInstructions(lines);
    this.resolveLabels(instructions);
    
    return instructions;
  }

  /**
   * Parse assembly text into structured lines
   */
  parseAssembly(assembly: string): AssemblyLine[] {
    const lines = assembly.split('\n');
    const parsedLines: AssemblyLine[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const originalText = lines[i] || '';
      const trimmed = originalText.trim();

      // Skip empty lines
      if (trimmed === '') {
        continue;
      }

      try {
        const parsed = this.parseLine(trimmed, lineNumber);
        if (parsed) {
          parsedLines.push(parsed);
        }
      } catch (error) {
        throw new Error(`Line ${lineNumber}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return parsedLines;
  }

  /**
   * Parse a single line of assembly
   */
  private parseLine(line: string, lineNumber: number): AssemblyLine | null {
    let workingLine = line;
    let comment: string | undefined;

    // Extract comment if comments are allowed
    if (this.options.allowComments) {
      const commentIndex = workingLine.indexOf(';');
      if (commentIndex !== -1) {
        comment = workingLine.substring(commentIndex + 1).trim();
        workingLine = workingLine.substring(0, commentIndex).trim();
      }
    }

    // Skip lines that are only comments
    if (workingLine === '') {
      return comment ? {
        lineNumber,
        originalText: line,
        comment
      } : null;
    }

    const result: AssemblyLine = {
      lineNumber,
      originalText: line
    };

    if (comment) {
      result.comment = comment;
    }

    // Check for label (ends with colon)
    if (workingLine.endsWith(':')) {
      const labelName = workingLine.slice(0, -1).trim();
      this.validateLabelName(labelName, lineNumber);
      result.label = labelName;
      return result;
    }

    // Parse instruction
    const parts = this.tokenizeLine(workingLine);
    if (parts.length === 0) {
      return result;
    }

    const opcode = parts[0]!; // We know parts.length > 0 from the check above
    const operand = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

    const instruction: { opcode: string; operand?: string } = {
      opcode: this.options.caseSensitive ? opcode : opcode.toUpperCase()
    };
    
    if (operand !== undefined) {
      instruction.operand = operand;
    }
    
    result.instruction = instruction;

    return result;
  }

  /**
   * Tokenize a line into parts, respecting quoted strings
   */
  private tokenizeLine(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (char === ' ' && !inQuotes) {
        if (current.trim().length > 0) {
          tokens.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.trim().length > 0) {
      tokens.push(current.trim());
    }

    return tokens;
  }

  /**
   * Generate instructions from parsed lines
   */
  private generateInstructions(lines: AssemblyLine[]): Instruction[] {
    const instructions: Instruction[] = [];
    let instructionIndex = 0;

    for (const line of lines) {
      // Process labels
      if (line.label) {
        if (this.labels.has(line.label)) {
          throw new Error(`Line ${line.lineNumber}: Duplicate label '${line.label}'`);
        }
        this.labels.set(line.label, instructionIndex);
      }

      // Process instructions
      if (line.instruction) {
        const instruction = this.createInstruction(line.instruction, line.lineNumber, instructionIndex);
        instructions.push(instruction);
        instructionIndex++;
      }
    }

    return instructions;
  }

  /**
   * Create a bytecode instruction from parsed assembly instruction
   */
  private createInstruction(
    assemblyInstruction: { opcode: string; operand?: string },
    lineNumber: number,
    instructionIndex: number
  ): Instruction {
    const opcode = this.parseOpcode(assemblyInstruction.opcode, lineNumber);
    const operand = this.parseOperand(
      assemblyInstruction.operand,
      opcode,
      lineNumber,
      instructionIndex
    );

    const instruction: Instruction = { opcode };
    if (operand !== undefined) {
      instruction.operand = operand;
    }
    return instruction;
  }

  /**
   * Parse opcode string to OpCode enum
   */
  private parseOpcode(opcodeStr: string, lineNumber: number): OpCode {
    const normalizedOpcode = this.options.caseSensitive ? opcodeStr : opcodeStr.toUpperCase();
    
    // Find the opcode in the enum
    for (const [key, value] of Object.entries(OpCode)) {
      if (key === normalizedOpcode) {
        return value as OpCode;
      }
    }

    throw new Error(`Line ${lineNumber}: Unknown opcode '${opcodeStr}'`);
  }

  /**
   * Parse operand based on opcode requirements
   */
  private parseOperand(
    operandStr: string | undefined,
    opcode: OpCode,
    lineNumber: number,
    instructionIndex: number
  ): string | number | boolean | undefined {
    const requiresOperand = this.opcodeRequiresOperand(opcode);
    
    if (requiresOperand && !operandStr) {
      throw new Error(`Line ${lineNumber}: Opcode '${OpCode[opcode]}' requires an operand`);
    }

    if (!requiresOperand && operandStr) {
      if (this.options.strictMode) {
        throw new Error(`Line ${lineNumber}: Opcode '${OpCode[opcode]}' does not accept an operand`);
      }
      return undefined; // Ignore operand in non-strict mode
    }

    if (!operandStr) {
      return undefined;
    }

    // Handle different operand types
    return this.parseOperandValue(operandStr, opcode, lineNumber, instructionIndex);
  }

  /**
   * Parse operand value based on its format
   */
  private parseOperandValue(
    operandStr: string,
    opcode: OpCode,
    lineNumber: number,
    instructionIndex: number
  ): string | number | boolean {
    const trimmed = operandStr.trim();

    // Boolean values
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // String literals (quoted)
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1); // Remove quotes
    }

    // Label references (for jump instructions)
    if (this.isJumpInstruction(opcode) && isNaN(Number(trimmed))) {
      this.unresolvedReferences.push({
        instructionIndex,
        label: trimmed,
        lineNumber
      });
      return 0; // Placeholder, will be resolved later
    }

    // Numeric values
    const numValue = this.parseNumber(trimmed);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Variable names (for LOAD/STORE)
    if (this.isVariableInstruction(opcode)) {
      return trimmed;
    }

    // Function names (for CALL)
    if (opcode === OpCode.CALL) {
      return trimmed;
    }

    throw new Error(`Line ${lineNumber}: Invalid operand '${operandStr}' for opcode '${OpCode[opcode]}'`);
  }

  /**
   * Parse number with support for different formats
   */
  private parseNumber(str: string): number {
    // Hexadecimal
    if (str.startsWith('0x') || str.startsWith('0X')) {
      return parseInt(str, 16);
    }

    // Binary
    if (str.startsWith('0b') || str.startsWith('0B')) {
      return parseInt(str.slice(2), 2);
    }

    // Octal
    if (str.startsWith('0o') || str.startsWith('0O')) {
      return parseInt(str.slice(2), 8);
    }

    // Decimal (including floating point)
    return parseFloat(str);
  }

  /**
   * Check if opcode requires an operand
   */
  private opcodeRequiresOperand(opcode: OpCode): boolean {
    const operandRequired = [
      OpCode.PUSH,
      OpCode.JUMP,
      OpCode.JUMP_IF_FALSE,
      OpCode.CALL,
      OpCode.LOAD,
      OpCode.STORE
    ];

    return operandRequired.includes(opcode);
  }

  /**
   * Check if opcode is a jump instruction
   */
  private isJumpInstruction(opcode: OpCode): boolean {
    return opcode === OpCode.JUMP || opcode === OpCode.JUMP_IF_FALSE;
  }

  /**
   * Check if opcode is a variable instruction
   */
  private isVariableInstruction(opcode: OpCode): boolean {
    return opcode === OpCode.LOAD || opcode === OpCode.STORE;
  }

  /**
   * Resolve label references in instructions
   */
  private resolveLabels(instructions: Instruction[]): void {
    for (const ref of this.unresolvedReferences) {
      const labelAddress = this.labels.get(ref.label);
      
      if (labelAddress === undefined) {
        throw new Error(`Line ${ref.lineNumber}: Undefined label '${ref.label}'`);
      }

      if (ref.instructionIndex >= instructions.length) {
        throw new Error(`Internal error: Invalid instruction index ${ref.instructionIndex}`);
      }

      instructions[ref.instructionIndex]!.operand = labelAddress;
    }
  }

  /**
   * Validate label name
   */
  private validateLabelName(name: string, lineNumber: number): void {
    if (name.length === 0) {
      throw new Error(`Line ${lineNumber}: Empty label name`);
    }

    // Check for valid identifier pattern
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(`Line ${lineNumber}: Invalid label name '${name}'. Labels must start with a letter or underscore and contain only letters, numbers, and underscores.`);
    }

    // Check for reserved words (opcode names)
    const upperName = name.toUpperCase();
    for (const opcodeName of Object.keys(OpCode)) {
      if (opcodeName === upperName) {
        throw new Error(`Line ${lineNumber}: Label name '${name}' conflicts with opcode name`);
      }
    }
  }

  /**
   * Reset assembler state
   */
  private reset(): void {
    this.labels.clear();
    this.unresolvedReferences = [];
  }

  /**
   * Get all defined labels
   */
  getLabels(): Map<string, number> {
    return new Map(this.labels);
  }

  /**
   * Set assembler options
   */
  setOptions(options: Partial<AssemblerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): AssemblerOptions {
    return { ...this.options };
  }

  /**
   * Validate assembly code without generating instructions
   */
  validate(assembly: string): AssemblerError[] {
    const errors: AssemblerError[] = [];
    
    try {
      this.assemble(assembly);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lineMatch = message.match(/Line (\d+):/);
      const lineNumber = lineMatch ? parseInt(lineMatch[1]!) : 1;
      
      errors.push({
        line: lineNumber,
        column: 1,
        message: message.replace(/^Line \d+:\s*/, ''),
        code: assembly.split('\n')[lineNumber - 1] || ''
      });
    }

    return errors;
  }

  /**
   * Get assembly statistics
   */
  getStatistics(assembly: string): {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    emptyLines: number;
    labels: number;
    instructions: number;
  } {
    const lines = assembly.split('\n');
    let codeLines = 0;
    let commentLines = 0;
    let emptyLines = 0;
    let labels = 0;
    let instructions = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        emptyLines++;
      } else if (trimmed.startsWith(';')) {
        commentLines++;
      } else {
        codeLines++;
        
        if (trimmed.endsWith(':')) {
          labels++;
        } else if (!trimmed.startsWith(';')) {
          instructions++;
        }
      }
    }

    return {
      totalLines: lines.length,
      codeLines,
      commentLines,
      emptyLines,
      labels,
      instructions
    };
  }
}