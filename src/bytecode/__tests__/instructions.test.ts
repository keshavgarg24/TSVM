import {
  createInstruction,
  serializeBytecode,
  deserializeBytecode,
  InstructionFactory,
  BytecodeSerializer,
  validateInstruction,
  getInstructionInfo,
  getAllOpcodes,
  calculateBytecodeSize
} from '../instructions';
import { OpCode, Instruction } from '../../types';

describe('Bytecode Instructions', () => {
  describe('Instruction Creation', () => {
    it('should create instruction without operand', () => {
      const instruction = createInstruction(OpCode.ADD);
      
      expect(instruction.opcode).toBe(OpCode.ADD);
      expect(instruction.operand).toBeUndefined();
    });

    it('should create instruction with numeric operand', () => {
      const instruction = createInstruction(OpCode.PUSH, 42);
      
      expect(instruction.opcode).toBe(OpCode.PUSH);
      expect(instruction.operand).toBe(42);
    });

    it('should create instruction with string operand', () => {
      const instruction = createInstruction(OpCode.LOAD, 'variable');
      
      expect(instruction.opcode).toBe(OpCode.LOAD);
      expect(instruction.operand).toBe('variable');
    });
  });

  describe('Instruction Factory', () => {
    let factory: InstructionFactory;

    beforeEach(() => {
      factory = new InstructionFactory();
    });

    it('should create stack operations', () => {
      const push = factory.push(42);
      const pop = factory.pop();
      const dup = factory.dup();

      expect(push.opcode).toBe(OpCode.PUSH);
      expect(push.operand).toBe(42);
      expect(pop.opcode).toBe(OpCode.POP);
      expect(dup.opcode).toBe(OpCode.DUP);
    });

    it('should create arithmetic operations', () => {
      const add = factory.add();
      const sub = factory.sub();
      const mul = factory.mul();
      const div = factory.div();
      const mod = factory.mod();

      expect(add.opcode).toBe(OpCode.ADD);
      expect(sub.opcode).toBe(OpCode.SUB);
      expect(mul.opcode).toBe(OpCode.MUL);
      expect(div.opcode).toBe(OpCode.DIV);
      expect(mod.opcode).toBe(OpCode.MOD);
    });

    it('should create comparison operations', () => {
      const eq = factory.eq();
      const ne = factory.ne();
      const lt = factory.lt();
      const gt = factory.gt();
      const le = factory.le();
      const ge = factory.ge();

      expect(eq.opcode).toBe(OpCode.EQ);
      expect(ne.opcode).toBe(OpCode.NE);
      expect(lt.opcode).toBe(OpCode.LT);
      expect(gt.opcode).toBe(OpCode.GT);
      expect(le.opcode).toBe(OpCode.LE);
      expect(ge.opcode).toBe(OpCode.GE);
    });

    it('should create control flow operations', () => {
      const jump = factory.jump(10);
      const jumpIfFalse = factory.jumpIfFalse(20);
      const call = factory.call('function');
      const ret = factory.return();

      expect(jump.opcode).toBe(OpCode.JUMP);
      expect(jump.operand).toBe(10);
      expect(jumpIfFalse.opcode).toBe(OpCode.JUMP_IF_FALSE);
      expect(jumpIfFalse.operand).toBe(20);
      expect(call.opcode).toBe(OpCode.CALL);
      expect(call.operand).toBe('function');
      expect(ret.opcode).toBe(OpCode.RETURN);
    });

    it('should create variable operations', () => {
      const load = factory.load('x');
      const store = factory.store('y');

      expect(load.opcode).toBe(OpCode.LOAD);
      expect(load.operand).toBe('x');
      expect(store.opcode).toBe(OpCode.STORE);
      expect(store.operand).toBe('y');
    });

    it('should create built-in operations', () => {
      const print = factory.print();
      const halt = factory.halt();

      expect(print.opcode).toBe(OpCode.PRINT);
      expect(halt.opcode).toBe(OpCode.HALT);
    });
  });

  describe('Bytecode Serialization', () => {
    let serializer: BytecodeSerializer;

    beforeEach(() => {
      serializer = new BytecodeSerializer();
    });

    it('should serialize instructions to binary format', () => {
      const instructions: Instruction[] = [
        createInstruction(OpCode.PUSH, 42),
        createInstruction(OpCode.PUSH, 24),
        createInstruction(OpCode.ADD),
        createInstruction(OpCode.HALT)
      ];

      const binary = serializer.toBinary(instructions);
      
      expect(binary).toBeInstanceOf(Uint8Array);
      expect(binary.length).toBeGreaterThan(0);
    });

    it('should serialize instructions to text format', () => {
      const instructions: Instruction[] = [
        createInstruction(OpCode.PUSH, 42),
        createInstruction(OpCode.LOAD, 'x'),
        createInstruction(OpCode.ADD),
        createInstruction(OpCode.STORE, 'result')
      ];

      const text = serializer.toText(instructions);
      
      expect(text).toContain('PUSH 42');
      expect(text).toContain('LOAD x');
      expect(text).toContain('ADD');
      expect(text).toContain('STORE result');
    });

    it('should deserialize from binary format', () => {
      const original: Instruction[] = [
        createInstruction(OpCode.PUSH, 10),
        createInstruction(OpCode.DUP),
        createInstruction(OpCode.MUL)
      ];

      const binary = serializer.toBinary(original);
      const deserialized = serializer.fromBinary(binary);

      expect(deserialized).toHaveLength(original.length);
      expect(deserialized[0]?.opcode).toBe(OpCode.PUSH);
      expect(deserialized[0]?.operand).toBe(10);
      expect(deserialized[1]?.opcode).toBe(OpCode.DUP);
      expect(deserialized[2]?.opcode).toBe(OpCode.MUL);
    });

    it('should deserialize from text format', () => {
      const text = `
        PUSH 5
        PUSH 3
        SUB
        PRINT
        HALT
      `;

      const instructions = serializer.fromText(text);

      expect(instructions).toHaveLength(5);
      expect(instructions[0]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[0]?.operand).toBe(5);
      expect(instructions[1]?.opcode).toBe(OpCode.PUSH);
      expect(instructions[1]?.operand).toBe(3);
      expect(instructions[2]?.opcode).toBe(OpCode.SUB);
      expect(instructions[3]?.opcode).toBe(OpCode.PRINT);
      expect(instructions[4]?.opcode).toBe(OpCode.HALT);
    });

    it('should handle string operands in serialization', () => {
      const instructions: Instruction[] = [
        createInstruction(OpCode.PUSH, 'hello'),
        createInstruction(OpCode.LOAD, 'variable_name'),
        createInstruction(OpCode.CALL, 'function_name')
      ];

      const text = serializer.toText(instructions);
      const deserialized = serializer.fromText(text);

      expect(deserialized).toHaveLength(3);
      expect(deserialized[0]?.operand).toBe('hello');
      expect(deserialized[1]?.operand).toBe('variable_name');
      expect(deserialized[2]?.operand).toBe('function_name');
    });
  });

  describe('Instruction Validation', () => {
    it('should validate instruction opcodes', () => {
      const validInstruction = createInstruction(OpCode.ADD);
      expect(() => validateInstruction(validInstruction)).not.toThrow();
    });

    it('should validate operand types', () => {
      const pushNumber = createInstruction(OpCode.PUSH, 42);
      const pushString = createInstruction(OpCode.PUSH, 'hello');
      const loadVariable = createInstruction(OpCode.LOAD, 'x');

      expect(() => validateInstruction(pushNumber)).not.toThrow();
      expect(() => validateInstruction(pushString)).not.toThrow();
      expect(() => validateInstruction(loadVariable)).not.toThrow();
    });

    it('should reject invalid operand types', () => {
      const invalidInstruction = createInstruction(OpCode.ADD, 'should_not_have_operand');
      expect(() => validateInstruction(invalidInstruction)).toThrow();
    });
  });

  describe('Bytecode Utilities', () => {
    it('should calculate bytecode size', () => {
      const instructions: Instruction[] = [
        createInstruction(OpCode.PUSH, 42),
        createInstruction(OpCode.ADD),
        createInstruction(OpCode.HALT)
      ];

      const size = calculateBytecodeSize(instructions);
      expect(size).toBeGreaterThan(0);
    });

    it('should get instruction info', () => {
      const info = getInstructionInfo(OpCode.PUSH);
      
      expect(info.name).toBe('PUSH');
      expect(info.hasOperand).toBe(true);
      expect(info.description).toContain('Push');
    });

    it('should list all opcodes', () => {
      const opcodes = getAllOpcodes();
      
      expect(opcodes).toContain(OpCode.PUSH);
      expect(opcodes).toContain(OpCode.ADD);
      expect(opcodes).toContain(OpCode.HALT);
      expect(opcodes.length).toBeGreaterThan(10);
    });
  });
});

// Helper functions are now imported from the actual module