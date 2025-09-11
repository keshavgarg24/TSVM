import { Instruction, VMState } from '../types';

export interface VM {
  execute(bytecode: Instruction[]): void;
  step(): boolean;
  getState(): VMState;
  reset(): void;
  loadInstructions(bytecode: Instruction[]): void;
}