import { Assembler } from '../assembler';
import { OpCode, Instruction } from '../../types';

describe('Assembler', () => {
  let assembler: Assembler;

  beforeEach(() => {
    assembler = new Assembler();
  });

  describe('Basic Assembly', () => {
    it('should assemble simple instructions', () => {
      const assembly = `
        PUSH 42
        PUSH 3
        ADD
        PRINT
        HALT
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(5);
      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: 3 });
      expect(instructions[2]).toEqual({ opcode: OpCode.ADD });
      expect(instructions[3]).toEqual({ opcode: OpCode.PRINT });
      expect(instructions[4]).toEqual({ opcode: OpCode.HALT });
    });

    it('should handle different operand types', () => {
      const assembly = `
        PUSH 42
        PUSH "hello"
        PUSH true
        PUSH false
        HALT
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(5);
      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: 'hello' });
      expect(instructions[2]).toEqual({ opcode: OpCode.PUSH, operand: true });
      expect(instructions[3]).toEqual({ opcode: OpCode.PUSH, operand: false });
      expect(instructions[4]).toEqual({ opcode: OpCode.HALT });
    });

    it('should handle instructions without operands', () => {
      const assembly = `
        POP
        DUP
        ADD
        RETURN
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(4);
      expect(instructions[0]).toEqual({ opcode: OpCode.POP });
      expect(instructions[1]).toEqual({ opcode: OpCode.DUP });
      expect(instructions[2]).toEqual({ opcode: OpCode.ADD });
      expect(instructions[3]).toEqual({ opcode: OpCode.RETURN });
    });

    it('should handle variable operations', () => {
      const assembly = `
        LOAD x
        STORE y
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(2);
      expect(instructions[0]).toEqual({ opcode: OpCode.LOAD, operand: 'x' });
      expect(instructions[1]).toEqual({ opcode: OpCode.STORE, operand: 'y' });
    });

    it('should handle function calls', () => {
      const assembly = `
        CALL myFunction
        CALL print
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(2);
      expect(instructions[0]).toEqual({ opcode: OpCode.CALL, operand: 'myFunction' });
      expect(instructions[1]).toEqual({ opcode: OpCode.CALL, operand: 'print' });
    });
  });

  describe('Number Formats', () => {
    it('should parse decimal numbers', () => {
      const assembly = `
        PUSH 42
        PUSH 3.14
        PUSH -10
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: 3.14 });
      expect(instructions[2]).toEqual({ opcode: OpCode.PUSH, operand: -10 });
    });

    it('should parse hexadecimal numbers', () => {
      const assembly = `
        PUSH 0x2A
        PUSH 0xFF
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: 255 });
    });

    it('should parse binary numbers', () => {
      const assembly = `
        PUSH 0b101010
        PUSH 0b11111111
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: 255 });
    });

    it('should parse octal numbers', () => {
      const assembly = `
        PUSH 0o52
        PUSH 0o377
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: 255 });
    });
  });

  describe('Labels and Jumps', () => {
    it('should handle simple labels and jumps', () => {
      const assembly = `
        PUSH 1
        JUMP end
        PUSH 2
      end:
        HALT
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(4);
      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 1 });
      expect(instructions[1]).toEqual({ opcode: OpCode.JUMP, operand: 3 });
      expect(instructions[2]).toEqual({ opcode: OpCode.PUSH, operand: 2 });
      expect(instructions[3]).toEqual({ opcode: OpCode.HALT });
    });

    it('should handle conditional jumps', () => {
      const assembly = `
        PUSH true
        JUMP_IF_FALSE else
        PUSH 1
        JUMP end
      else:
        PUSH 2
      end:
        HALT
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(6);
      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: true });
      expect(instructions[1]).toEqual({ opcode: OpCode.JUMP_IF_FALSE, operand: 4 });
      expect(instructions[2]).toEqual({ opcode: OpCode.PUSH, operand: 1 });
      expect(instructions[3]).toEqual({ opcode: OpCode.JUMP, operand: 5 });
      expect(instructions[4]).toEqual({ opcode: OpCode.PUSH, operand: 2 });
      expect(instructions[5]).toEqual({ opcode: OpCode.HALT });
    });

    it('should handle multiple labels', () => {
      const assembly = `
      start:
        PUSH 1
      loop:
        PUSH 2
        JUMP start
      end:
        HALT
      `;

      const instructions = assembler.assemble(assembly);
      const labels = assembler.getLabels();

      expect(labels.get('start')).toBe(0);
      expect(labels.get('loop')).toBe(1);
      expect(labels.get('end')).toBe(3);
      expect(instructions[2]).toEqual({ opcode: OpCode.JUMP, operand: 0 });
    });

    it('should handle forward and backward references', () => {
      const assembly = `
        JUMP forward
      backward:
        PUSH 1
        HALT
      forward:
        JUMP backward
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions[0]).toEqual({ opcode: OpCode.JUMP, operand: 3 });
      expect(instructions[3]).toEqual({ opcode: OpCode.JUMP, operand: 1 });
    });
  });

  describe('Comments', () => {
    it('should handle line comments', () => {
      const assembly = `
        PUSH 42    ; Push the answer
        ADD        ; Add two values
        ; This is a comment line
        HALT       ; Stop execution
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(3);
      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.ADD });
      expect(instructions[2]).toEqual({ opcode: OpCode.HALT });
    });

    it('should handle comment-only lines', () => {
      const assembly = `
        ; Program start
        PUSH 1
        ; Do some calculation
        PUSH 2
        ADD
        ; Program end
        HALT
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(4);
    });

    it('should disable comments when option is false', () => {
      assembler = new Assembler({ allowComments: false });
      
      const assembly = `
        PUSH 42
        ADD ; This should cause an error
      `;

      expect(() => assembler.assemble(assembly)).toThrow();
    });
  });

  describe('String Handling', () => {
    it('should handle quoted strings with spaces', () => {
      const assembly = `
        PUSH "hello world"
        PUSH 'single quotes'
        STORE "variable name"
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 'hello world' });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: 'single quotes' });
      expect(instructions[2]).toEqual({ opcode: OpCode.STORE, operand: 'variable name' });
    });

    it('should handle empty strings', () => {
      const assembly = `
        PUSH ""
        PUSH ''
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: '' });
      expect(instructions[1]).toEqual({ opcode: OpCode.PUSH, operand: '' });
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case insensitive by default', () => {
      const assembly = `
        push 42
        Add
        HALT
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(3);
      expect(instructions[0]).toEqual({ opcode: OpCode.PUSH, operand: 42 });
      expect(instructions[1]).toEqual({ opcode: OpCode.ADD });
      expect(instructions[2]).toEqual({ opcode: OpCode.HALT });
    });

    it('should be case sensitive when enabled', () => {
      assembler = new Assembler({ caseSensitive: true });
      
      const assembly = `
        PUSH 42
        add
      `;

      expect(() => assembler.assemble(assembly)).toThrow('Unknown opcode');
    });
  });

  describe('Error Handling', () => {
    it('should report unknown opcodes', () => {
      const assembly = `
        PUSH 42
        UNKNOWN_OP
        HALT
      `;

      expect(() => assembler.assemble(assembly)).toThrow('Unknown opcode');
    });

    it('should report missing operands', () => {
      const assembly = `
        PUSH
        HALT
      `;

      expect(() => assembler.assemble(assembly)).toThrow('requires an operand');
    });

    it('should report unexpected operands in strict mode', () => {
      const assembly = `
        ADD 42
        HALT
      `;

      expect(() => assembler.assemble(assembly)).toThrow('does not accept an operand');
    });

    it('should ignore unexpected operands in non-strict mode', () => {
      assembler = new Assembler({ strictMode: false });
      
      const assembly = `
        ADD 42
        HALT
      `;

      const instructions = assembler.assemble(assembly);
      expect(instructions[0]).toEqual({ opcode: OpCode.ADD });
    });

    it('should report undefined labels', () => {
      const assembly = `
        JUMP undefined_label
        HALT
      `;

      expect(() => assembler.assemble(assembly)).toThrow('Undefined label');
    });

    it('should report duplicate labels', () => {
      const assembly = `
      start:
        PUSH 1
      start:
        HALT
      `;

      expect(() => assembler.assemble(assembly)).toThrow('Duplicate label');
    });

    it('should report invalid label names', () => {
      const assembly = `
      123invalid:
        HALT
      `;

      expect(() => assembler.assemble(assembly)).toThrow('Invalid label name');
    });

    it('should report labels that conflict with opcodes', () => {
      const assembly = `
      PUSH:
        HALT
      `;

      expect(() => assembler.assemble(assembly)).toThrow('conflicts with opcode name');
    });
  });

  describe('Validation', () => {
    it('should validate assembly without generating instructions', () => {
      const validAssembly = `
        PUSH 42
        HALT
      `;

      const errors = assembler.validate(validAssembly);
      expect(errors).toHaveLength(0);
    });

    it('should return validation errors', () => {
      const invalidAssembly = `
        PUSH 42
        UNKNOWN_OP
        HALT
      `;

      const errors = assembler.validate(invalidAssembly);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Unknown opcode');
      expect(errors[0]?.line).toBe(3);
    });
  });

  describe('Statistics', () => {
    it('should calculate assembly statistics', () => {
      const assembly = `
        ; This is a comment
        PUSH 42    ; Push value
        
        ADD        ; Add values
      start:
        HALT
      `;

      const stats = assembler.getStatistics(assembly);

      expect(stats.totalLines).toBe(8);
      expect(stats.codeLines).toBe(4);
      expect(stats.commentLines).toBe(1);
      expect(stats.emptyLines).toBe(3);
      expect(stats.labels).toBe(1);
      expect(stats.instructions).toBe(3);
    });
  });

  describe('Complex Programs', () => {
    it('should assemble a complete program with loops', () => {
      const assembly = `
        ; Initialize counter
        PUSH 10
        STORE counter
        
      loop:
        ; Load and check counter
        LOAD counter
        PUSH 0
        GT
        JUMP_IF_FALSE end
        
        ; Print counter and decrement
        LOAD counter
        PRINT
        LOAD counter
        PUSH 1
        SUB
        STORE counter
        
        ; Jump back to loop
        JUMP loop
        
      end:
        HALT
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(14);
      
      // Check that jumps are resolved correctly
      const labels = assembler.getLabels();
      expect(labels.get('loop')).toBe(2);
      expect(labels.get('end')).toBe(13);
      
      // Find JUMP_IF_FALSE instruction and verify it jumps to 'end'
      const jumpIfFalse = instructions.find(instr => instr.opcode === OpCode.JUMP_IF_FALSE);
      expect(jumpIfFalse?.operand).toBe(13);
      
      // Find JUMP instruction and verify it jumps to 'loop'
      const jump = instructions.find(instr => instr.opcode === OpCode.JUMP);
      expect(jump?.operand).toBe(2);
    });

    it('should assemble a program with function calls', () => {
      const assembly = `
        ; Main program
        PUSH 5
        PUSH 3
        CALL add
        PRINT
        HALT
        
        ; Add function would be here in a real implementation
        ; For now we just test the CALL instruction generation
      `;

      const instructions = assembler.assemble(assembly);

      expect(instructions).toHaveLength(5);
      expect(instructions[2]).toEqual({ opcode: OpCode.CALL, operand: 'add' });
    });

    it('should handle nested control structures', () => {
      const assembly = `
        PUSH 1
        JUMP_IF_FALSE outer_else
        
        PUSH 2
        JUMP_IF_FALSE inner_else
        PUSH 3
        JUMP inner_end
        
      inner_else:
        PUSH 4
        
      inner_end:
        JUMP outer_end
        
      outer_else:
        PUSH 5
        
      outer_end:
        HALT
      `;

      const instructions = assembler.assemble(assembly);
      const labels = assembler.getLabels();

      expect(labels.get('outer_else')).toBe(8);
      expect(labels.get('inner_else')).toBe(6);
      expect(labels.get('inner_end')).toBe(7);
      expect(labels.get('outer_end')).toBe(9);
      
      // Verify jump targets are correct
      expect(instructions[1]?.operand).toBe(8); // JUMP_IF_FALSE outer_else
      expect(instructions[3]?.operand).toBe(6); // JUMP_IF_FALSE inner_else
      expect(instructions[5]?.operand).toBe(7); // JUMP inner_end
      expect(instructions[7]?.operand).toBe(9); // JUMP outer_end
    });
  });

  describe('Options', () => {
    it('should allow changing options after creation', () => {
      const assembly = `
        push 42  ; lowercase opcode
        halt
      `;

      // Should work with case insensitive (default)
      let instructions = assembler.assemble(assembly);
      expect(instructions).toHaveLength(2);

      // Change to case sensitive
      assembler.setOptions({ caseSensitive: true });
      expect(() => assembler.assemble(assembly)).toThrow();
    });

    it('should return current options', () => {
      const options = assembler.getOptions();
      expect(options.allowComments).toBe(true);
      expect(options.caseSensitive).toBe(false);
      expect(options.strictMode).toBe(true);
    });
  });
});