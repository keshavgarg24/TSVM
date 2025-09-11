import { Disassembler } from '../disassembler';
import { OpCode, Instruction } from '../../types';

describe('Disassembler', () => {
  let disassembler: Disassembler;

  beforeEach(() => {
    disassembler = new Disassembler();
  });

  describe('Basic Disassembly', () => {
    it('should disassemble simple instructions', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 42 },
        { opcode: OpCode.PUSH, operand: 3 },
        { opcode: OpCode.ADD },
        { opcode: OpCode.PRINT },
        { opcode: OpCode.HALT }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('PUSH 42');
      expect(result).toContain('PUSH 3');
      expect(result).toContain('ADD');
      expect(result).toContain('PRINT');
      expect(result).toContain('HALT');
    });

    it('should handle different operand types', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 42 },
        { opcode: OpCode.PUSH, operand: 'hello' },
        { opcode: OpCode.PUSH, operand: true },
        { opcode: OpCode.PUSH, operand: false },
        { opcode: OpCode.HALT }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('PUSH 42');
      expect(result).toContain('PUSH "hello"');
      expect(result).toContain('PUSH true');
      expect(result).toContain('PUSH false');
    });

    it('should handle instructions without operands', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.POP },
        { opcode: OpCode.DUP },
        { opcode: OpCode.ADD },
        { opcode: OpCode.RETURN }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('POP');
      expect(result).toContain('DUP');
      expect(result).toContain('ADD');
      expect(result).toContain('RETURN');
    });

    it('should show addresses by default', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 },
        { opcode: OpCode.HALT }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('0:');
      expect(result).toContain('1:');
    });
  });

  describe('Disassembler Options', () => {
    it('should hide addresses when disabled', () => {
      disassembler = new Disassembler({ showAddresses: false });
      
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 },
        { opcode: OpCode.HALT }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).not.toContain('0:');
      expect(result).not.toContain('1:');
      expect(result).toContain('PUSH 1');
      expect(result).toContain('HALT');
    });

    it('should show hex opcodes when enabled', () => {
      disassembler = new Disassembler({ showHex: true });
      
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 }, // 0x01
        { opcode: OpCode.ADD }, // 0x10
        { opcode: OpCode.HALT } // 0xFF
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('0x01');
      expect(result).toContain('0x10');
      expect(result).toContain('0xFF');
    });

    it('should show operand types when enabled', () => {
      disassembler = new Disassembler({ showOperandTypes: true });
      
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 42 },
        { opcode: OpCode.PUSH, operand: 'hello' },
        { opcode: OpCode.PUSH, operand: true },
        { opcode: OpCode.ADD }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('; number');
      expect(result).toContain('; string');
      expect(result).toContain('; boolean');
    });

    it('should allow changing options after creation', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 }
      ];

      // Initially with addresses
      let result = disassembler.disassemble(instructions);
      expect(result).toContain('0:');

      // Change options
      disassembler.setOptions({ showAddresses: false });
      result = disassembler.disassemble(instructions);
      expect(result).not.toContain('0:');
    });
  });

  describe('Comments and Documentation', () => {
    it('should generate helpful comments for stack operations', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 5 },
        { opcode: OpCode.POP },
        { opcode: OpCode.DUP }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('Push 5 onto stack');
      expect(result).toContain('Pop top value from stack');
      expect(result).toContain('Duplicate top stack value');
    });

    it('should generate helpful comments for arithmetic operations', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.ADD },
        { opcode: OpCode.SUB },
        { opcode: OpCode.MUL },
        { opcode: OpCode.DIV },
        { opcode: OpCode.MOD }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('Pop two values, push sum');
      expect(result).toContain('Pop two values, push difference');
      expect(result).toContain('Pop two values, push product');
      expect(result).toContain('Pop two values, push quotient');
      expect(result).toContain('Pop two values, push remainder');
    });

    it('should generate helpful comments for comparison operations', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.EQ },
        { opcode: OpCode.NE },
        { opcode: OpCode.LT },
        { opcode: OpCode.GT },
        { opcode: OpCode.LE },
        { opcode: OpCode.GE }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('equality result');
      expect(result).toContain('inequality result');
      expect(result).toContain('less-than result');
      expect(result).toContain('greater-than result');
      expect(result).toContain('less-equal result');
      expect(result).toContain('greater-equal result');
    });

    it('should generate helpful comments for control flow operations', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.JUMP, operand: 5 },
        { opcode: OpCode.JUMP_IF_FALSE, operand: 10 },
        { opcode: OpCode.CALL, operand: 'myFunction' },
        { opcode: OpCode.RETURN }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('Jump to address 5');
      expect(result).toContain('Jump to address 10 if top of stack is false');
      expect(result).toContain('Call function myFunction');
      expect(result).toContain('Return from function');
    });

    it('should generate helpful comments for variable operations', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.LOAD, operand: 'x' },
        { opcode: OpCode.STORE, operand: 'y' }
      ];

      const result = disassembler.disassemble(instructions);
      
      expect(result).toContain('Load variable x onto stack');
      expect(result).toContain('Store top of stack to variable y');
    });
  });

  describe('Jump Target Analysis', () => {
    it('should identify jump targets', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 },     // 0
        { opcode: OpCode.JUMP_IF_FALSE, operand: 4 }, // 1
        { opcode: OpCode.PUSH, operand: 2 },     // 2
        { opcode: OpCode.JUMP, operand: 5 },     // 3
        { opcode: OpCode.PUSH, operand: 3 },     // 4 <- target
        { opcode: OpCode.HALT }                  // 5 <- target
      ];

      const jumpTargets = disassembler.analyzeJumpTargets(instructions);
      
      expect(jumpTargets.has(4)).toBe(true);
      expect(jumpTargets.has(5)).toBe(true);
      expect(jumpTargets.get(4)).toBe('L1');
      expect(jumpTargets.get(5)).toBe('L2');
    });

    it('should disassemble with labels', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 },     // 0
        { opcode: OpCode.JUMP_IF_FALSE, operand: 4 }, // 1
        { opcode: OpCode.PUSH, operand: 2 },     // 2
        { opcode: OpCode.JUMP, operand: 5 },     // 3
        { opcode: OpCode.PUSH, operand: 3 },     // 4
        { opcode: OpCode.HALT }                  // 5
      ];

      const result = disassembler.disassembleWithLabels(instructions);
      
      expect(result).toContain('L1:');
      expect(result).toContain('L2:');
      expect(result).toContain('JUMP_IF_FALSE L1');
      expect(result).toContain('JUMP L2');
    });

    it('should handle invalid jump targets gracefully', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.JUMP, operand: 100 }, // Invalid target
        { opcode: OpCode.JUMP_IF_FALSE, operand: -1 }, // Invalid target
        { opcode: OpCode.HALT }
      ];

      const jumpTargets = disassembler.analyzeJumpTargets(instructions);
      expect(jumpTargets.size).toBe(0);

      const result = disassembler.disassembleWithLabels(instructions);
      expect(result).toContain('JUMP 100');
      expect(result).toContain('JUMP_IF_FALSE -1');
    });
  });

  describe('Statistics', () => {
    it('should calculate basic statistics', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 },
        { opcode: OpCode.PUSH, operand: 2 },
        { opcode: OpCode.ADD },
        { opcode: OpCode.PRINT },
        { opcode: OpCode.HALT }
      ];

      const stats = disassembler.getStatistics(instructions);
      
      expect(stats.totalInstructions).toBe(5);
      expect(stats.opcodeFrequency.get('PUSH')).toBe(2);
      expect(stats.opcodeFrequency.get('ADD')).toBe(1);
      expect(stats.opcodeFrequency.get('PRINT')).toBe(1);
      expect(stats.opcodeFrequency.get('HALT')).toBe(1);
      expect(stats.jumpTargets).toBe(0);
    });

    it('should estimate maximum stack depth', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 },  // stack: 1
        { opcode: OpCode.PUSH, operand: 2 },  // stack: 2
        { opcode: OpCode.PUSH, operand: 3 },  // stack: 3
        { opcode: OpCode.ADD },               // stack: 2
        { opcode: OpCode.ADD },               // stack: 1
        { opcode: OpCode.HALT }
      ];

      const stats = disassembler.getStatistics(instructions);
      expect(stats.maxStackDepth).toBe(3);
    });

    it('should count jump targets in statistics', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.JUMP, operand: 2 },
        { opcode: OpCode.PUSH, operand: 1 },
        { opcode: OpCode.HALT }
      ];

      const stats = disassembler.getStatistics(instructions);
      expect(stats.jumpTargets).toBe(1);
    });
  });

  describe('Structured Output', () => {
    it('should provide structured disassembly objects', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 42 },
        { opcode: OpCode.ADD }
      ];

      const objects = disassembler.disassembleToObjects(instructions);
      
      expect(objects).toHaveLength(2);
      expect(objects[0]).toMatchObject({
        address: 0,
        opcode: 'PUSH',
        operand: 42,
        operandType: 'number',
        mnemonic: 'PUSH 42'
      });
      expect(objects[1]).toMatchObject({
        address: 1,
        opcode: 'ADD',
        mnemonic: 'ADD'
      });
      expect(objects[1]?.operand).toBeUndefined();
      expect(objects[1]?.operandType).toBeUndefined();
    });

    it('should include comments in structured output', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 5 }
      ];

      const objects = disassembler.disassembleToObjects(instructions);
      
      expect(objects[0]?.comment).toBe('Push 5 onto stack');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown opcodes gracefully', () => {
      const instructions: Instruction[] = [
        { opcode: 999 as OpCode } // Unknown opcode
      ];

      const result = disassembler.disassemble(instructions);
      expect(result).toContain('UNKNOWN_3E7'); // 999 in hex
    });

    it('should handle empty instruction array', () => {
      const instructions: Instruction[] = [];
      
      const result = disassembler.disassemble(instructions);
      expect(result).toBe('');
      
      const stats = disassembler.getStatistics(instructions);
      expect(stats.totalInstructions).toBe(0);
      expect(stats.maxStackDepth).toBe(0);
    });

    it('should handle null/undefined instructions', () => {
      const instructions = [
        { opcode: OpCode.PUSH, operand: 1 },
        null,
        undefined,
        { opcode: OpCode.HALT }
      ] as Instruction[];

      const result = disassembler.disassemble(instructions);
      expect(result).toContain('PUSH 1');
      expect(result).toContain('HALT');
    });
  });

  describe('Complex Programs', () => {
    it('should disassemble a complete program with control flow', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 10 },        // 0: Initialize counter
        { opcode: OpCode.STORE, operand: 'counter' }, // 1: Store counter
        { opcode: OpCode.LOAD, operand: 'counter' },  // 2: L1: Load counter
        { opcode: OpCode.PUSH, operand: 0 },         // 3: Push 0
        { opcode: OpCode.GT },                       // 4: Check if counter > 0
        { opcode: OpCode.JUMP_IF_FALSE, operand: 10 }, // 5: Exit if false
        { opcode: OpCode.LOAD, operand: 'counter' },  // 6: Load counter
        { opcode: OpCode.PRINT },                    // 7: Print counter
        { opcode: OpCode.LOAD, operand: 'counter' },  // 8: Load counter
        { opcode: OpCode.PUSH, operand: 1 },         // 9: Push 1
        { opcode: OpCode.SUB },                      // 10: Subtract 1
        { opcode: OpCode.STORE, operand: 'counter' }, // 11: Store new counter
        { opcode: OpCode.JUMP, operand: 2 },         // 12: Jump back to loop
        { opcode: OpCode.HALT }                      // 13: L2: End
      ];

      const result = disassembler.disassembleWithLabels(instructions);
      
      expect(result).toContain('PUSH 10');
      expect(result).toContain('STORE "counter"');
      expect(result).toContain('L1:');
      expect(result).toContain('JUMP_IF_FALSE L2');
      expect(result).toContain('JUMP L1');
      expect(result).toContain('L2:');
      expect(result).toContain('HALT');
    });

    it('should provide meaningful statistics for complex programs', () => {
      const instructions: Instruction[] = [
        { opcode: OpCode.PUSH, operand: 1 },
        { opcode: OpCode.PUSH, operand: 2 },
        { opcode: OpCode.PUSH, operand: 3 },
        { opcode: OpCode.ADD },
        { opcode: OpCode.MUL },
        { opcode: OpCode.STORE, operand: 'result' },
        { opcode: OpCode.LOAD, operand: 'result' },
        { opcode: OpCode.PRINT },
        { opcode: OpCode.HALT }
      ];

      const stats = disassembler.getStatistics(instructions);
      
      expect(stats.totalInstructions).toBe(9);
      expect(stats.opcodeFrequency.get('PUSH')).toBe(3);
      expect(stats.maxStackDepth).toBe(3);
      expect(stats.jumpTargets).toBe(0);
    });
  });
});