import {
  Program,
  Statement,
  Expression,
  VariableDeclaration,
  ExpressionStatement,
  BinaryExpression,
  Literal,
  Identifier,
  AssignmentExpression,
  IfStatement,
  WhileStatement,
  BlockStatement,
  FunctionDeclaration,
  CallExpression,
  ReturnStatement,
  Instruction,
  OpCode,
  ASTNode
} from '../types';
import { CodeGenerator as CodeGeneratorInterface } from '../interfaces';
import { SymbolTable } from './symbol-table';
import { BaseASTVisitor } from '../ast/nodes';
import { InstructionFactory } from '../bytecode';
import { CompileTimeError } from '../utils/errors';
import { Optimizer, OptimizationOptions, OptimizationResult } from './optimizations/optimizer';

export class CodeGenerator extends BaseASTVisitor<void> implements CodeGeneratorInterface {
  private instructions: Instruction[] = [];
  private factory = new InstructionFactory();
  private optimizer: Optimizer;

  constructor(
    private symbolTable: SymbolTable,
    optimizationOptions?: OptimizationOptions
  ) {
    super();
    this.optimizer = new Optimizer(optimizationOptions);
  }

  compile(ast: Program): Instruction[] {
    this.instructions = [];
    
    // Apply AST-level optimizations first
    const optimizationResult = this.optimizer.optimize(ast);
    const optimizedAST = optimizationResult.optimizedAST as Program;
    
    // Generate bytecode from optimized AST
    this.visit(optimizedAST);
    
    // Add HALT instruction at the end
    this.instructions.push(this.factory.halt());
    
    // Apply bytecode-level optimizations
    return this.optimize(this.instructions);
  }

  /**
   * Compile with detailed optimization information
   */
  compileWithOptimizationInfo(ast: Program): {
    instructions: Instruction[];
    astOptimization: OptimizationResult;
    bytecodeOptimization: {
      original: Instruction[];
      optimized: Instruction[];
      savings: number;
    };
  } {
    this.instructions = [];
    
    // Apply AST-level optimizations
    const astOptimization = this.optimizer.optimize(ast);
    const optimizedAST = astOptimization.optimizedAST as Program;
    
    // Generate bytecode from optimized AST
    this.visit(optimizedAST);
    this.instructions.push(this.factory.halt());
    
    // Apply bytecode-level optimizations
    const originalBytecode = [...this.instructions];
    const optimizedBytecode = this.optimize(this.instructions);
    
    return {
      instructions: optimizedBytecode,
      astOptimization,
      bytecodeOptimization: {
        original: originalBytecode,
        optimized: optimizedBytecode,
        savings: originalBytecode.length - optimizedBytecode.length
      }
    };
  }

  optimize(instructions: Instruction[]): Instruction[] {
    // Simple constant folding optimization
    const optimized: Instruction[] = [];
    let i = 0;

    while (i < instructions.length) {
      const current = instructions[i];
      if (!current) {
        i++;
        continue;
      }

      // Look for pattern: PUSH const1, PUSH const2, ARITHMETIC_OP
      if (current.opcode === OpCode.PUSH && 
          typeof current.operand === 'number' &&
          i + 2 < instructions.length) {
        
        const next = instructions[i + 1];
        const op = instructions[i + 2];
        
        if (next?.opcode === OpCode.PUSH && 
            typeof next.operand === 'number' &&
            op && this.isArithmeticOp(op.opcode)) {
          
          // Perform constant folding
          const result = this.evaluateConstantExpression(
            current.operand,
            next.operand,
            op.opcode
          );
          
          if (result !== null) {
            optimized.push(this.factory.push(result));
            i += 3; // Skip the three instructions we just optimized
            continue;
          }
        }
      }

      optimized.push(current);
      i++;
    }

    return optimized;
  }

  // AST Visitor Methods

  visitProgram(node: Program): void {
    for (const statement of node.body) {
      this.visit(statement);
    }
  }

  visitVariableDeclaration(node: VariableDeclaration): void {
    // Declare the variable in symbol table
    this.symbolTable.declare(node.identifier.name, 'number'); // Default to number for now
    
    // Compile initializer or push a default value
    if (node.initializer) {
      this.visit(node.initializer);
    } else {
      // Push a default value (0 for now, could be undefined in the future)
      this.instructions.push(this.factory.push(0));
    }
    
    // Store the value
    this.instructions.push(this.factory.store(node.identifier.name));
  }

  visitExpressionStatement(node: ExpressionStatement): void {
    this.visit(node.expression);
  }

  visitBinaryExpression(node: BinaryExpression): void {
    // Compile left operand
    this.visit(node.left);
    
    // Compile right operand
    this.visit(node.right);
    
    // Emit operation instruction
    switch (node.operator) {
      case '+':
        this.instructions.push(this.factory.add());
        break;
      case '-':
        this.instructions.push(this.factory.sub());
        break;
      case '*':
        this.instructions.push(this.factory.mul());
        break;
      case '/':
        this.instructions.push(this.factory.div());
        break;
      case '%':
        this.instructions.push(this.factory.mod());
        break;
      case '==':
        this.instructions.push(this.factory.eq());
        break;
      case '!=':
        this.instructions.push(this.factory.ne());
        break;
      case '<':
        this.instructions.push(this.factory.lt());
        break;
      case '>':
        this.instructions.push(this.factory.gt());
        break;
      case '<=':
        this.instructions.push(this.factory.le());
        break;
      case '>=':
        this.instructions.push(this.factory.ge());
        break;
      case '&&':
        // For now, implement as simple AND (will be improved later)
        this.instructions.push(this.factory.mul()); // Temporary implementation
        break;
      case '||':
        // For now, implement as simple OR (will be improved later)  
        this.instructions.push(this.factory.add()); // Temporary implementation
        break;
      default:
        throw new CompileTimeError(
          'semantic',
          `Unsupported binary operator: ${node.operator}`,
          node.location
        );
    }
  }

  visitLiteral(node: Literal): void {
    this.instructions.push(this.factory.push(node.value));
  }

  visitIdentifier(node: Identifier): void {
    // Check if variable is declared
    const symbol = this.symbolTable.lookup(node.name);
    if (!symbol) {
      throw new CompileTimeError(
        'semantic',
        `Undefined variable: ${node.name}`,
        node.location
      );
    }
    
    this.instructions.push(this.factory.load(node.name));
  }

  visitAssignmentExpression(node: AssignmentExpression): void {
    // Check if variable is declared
    const symbol = this.symbolTable.lookup(node.left.name);
    if (!symbol) {
      throw new CompileTimeError(
        'semantic',
        `Undefined variable: ${node.left.name}`,
        node.location
      );
    }
    
    // Compile the right-hand side
    this.visit(node.right);
    
    // Store the value
    this.instructions.push(this.factory.store(node.left.name));
  }

  visitIfStatement(node: any): void {
    // Compile condition
    this.visit(node.condition);
    
    // Reserve space for JUMP_IF_FALSE instruction
    const jumpIfFalseIndex = this.instructions.length;
    this.instructions.push(this.factory.jumpIfFalse(0)); // Placeholder address
    
    // Compile consequent (then block)
    this.visit(node.consequent);
    
    let jumpOverElseIndex = -1;
    if (node.alternate) {
      // Reserve space for JUMP instruction to skip else block
      jumpOverElseIndex = this.instructions.length;
      this.instructions.push(this.factory.jump(0)); // Placeholder address
    }
    
    // Update JUMP_IF_FALSE to point to else block or end
    const elseStartIndex = this.instructions.length;
    this.instructions[jumpIfFalseIndex] = this.factory.jumpIfFalse(elseStartIndex);
    
    if (node.alternate) {
      // Compile alternate (else block)
      this.visit(node.alternate);
      
      // Update JUMP to skip else block
      const endIndex = this.instructions.length;
      this.instructions[jumpOverElseIndex] = this.factory.jump(endIndex);
    }
  }

  visitWhileStatement(node: any): void {
    // Mark the start of the loop (for backward jump)
    const loopStartIndex = this.instructions.length;
    
    // Compile condition
    this.visit(node.condition);
    
    // Reserve space for JUMP_IF_FALSE instruction (exit loop)
    const jumpIfFalseIndex = this.instructions.length;
    this.instructions.push(this.factory.jumpIfFalse(0)); // Placeholder address
    
    // Compile loop body
    this.visit(node.body);
    
    // Jump back to loop condition
    this.instructions.push(this.factory.jump(loopStartIndex));
    
    // Update JUMP_IF_FALSE to point to end of loop
    const loopEndIndex = this.instructions.length;
    this.instructions[jumpIfFalseIndex] = this.factory.jumpIfFalse(loopEndIndex);
  }

  visitBlockStatement(node: any): void {
    // Enter new scope for block
    this.symbolTable.enterScope();
    
    // Compile all statements in the block
    for (const statement of node.body) {
      this.visit(statement);
    }
    
    // Exit scope
    this.symbolTable.exitScope();
  }

  visitFunctionDeclaration(node: any): void {
    // Register function in symbol table
    this.symbolTable.declare(node.name.name, 'function');
    
    // Skip function body during main execution
    const skipJumpIndex = this.instructions.length;
    this.instructions.push(this.factory.jump(0)); // Placeholder address
    
    // Mark function start for calls
    const functionStartIndex = this.instructions.length;
    
    // Enter function scope
    this.symbolTable.enterScope();
    
    // Declare parameters in function scope
    for (const param of node.parameters) {
      this.symbolTable.declare(param.name, 'number'); // Default to number for now
    }
    
    // Compile function body
    this.visit(node.body);
    
    // Add implicit return if no explicit return at end
    const lastInstruction = this.instructions[this.instructions.length - 1];
    if (!lastInstruction || lastInstruction.opcode !== OpCode.RETURN) {
      this.instructions.push(this.factory.push(0)); // Default return value
      this.instructions.push(this.factory.return());
    }
    
    // Exit function scope
    this.symbolTable.exitScope();
    
    // Update skip jump to point after function body
    const afterFunctionIndex = this.instructions.length;
    this.instructions[skipJumpIndex] = this.factory.jump(afterFunctionIndex);
    
    // Store function address for later calls (simplified approach)
    // In a full implementation, we'd maintain a function table
  }

  visitCallExpression(node: any): void {
    // Compile arguments in order
    for (const arg of node.arguments) {
      this.visit(arg);
    }
    
    // Generate call instruction
    if (node.callee.type === 'Identifier') {
      this.instructions.push(this.factory.call(node.callee.name));
    } else {
      throw new CompileTimeError(
        'semantic',
        'Only direct function calls are supported',
        node.location
      );
    }
  }

  visitReturnStatement(node: any): void {
    // Compile return value or push default
    if (node.argument) {
      this.visit(node.argument);
    } else {
      this.instructions.push(this.factory.push(0)); // Default return value
    }
    
    // Generate return instruction
    this.instructions.push(this.factory.return());
  }



  // Helper methods

  private isArithmeticOp(opcode: OpCode): boolean {
    return [OpCode.ADD, OpCode.SUB, OpCode.MUL, OpCode.DIV, OpCode.MOD].includes(opcode);
  }

  private evaluateConstantExpression(left: number, right: number, op: OpCode): number | null {
    try {
      switch (op) {
        case OpCode.ADD:
          return left + right;
        case OpCode.SUB:
          return left - right;
        case OpCode.MUL:
          return left * right;
        case OpCode.DIV:
          if (right === 0) return null; // Don't optimize division by zero
          return left / right;
        case OpCode.MOD:
          if (right === 0) return null; // Don't optimize modulo by zero
          return left % right;
        default:
          return null;
      }
    } catch {
      return null; // If any error occurs, don't optimize
    }
  }

  // Utility methods for debugging and analysis

  getInstructions(): Instruction[] {
    return [...this.instructions];
  }

  getInstructionCount(): number {
    return this.instructions.length;
  }

  reset(): void {
    this.instructions = [];
  }

  // Method to compile and get both original and optimized bytecode
  compileWithOptimization(ast: Program): {
    original: Instruction[];
    optimized: Instruction[];
    optimizationSavings: number;
  } {
    const original = this.compile(ast);
    const optimized = this.optimize(original);
    
    return {
      original,
      optimized,
      optimizationSavings: original.length - optimized.length
    };
  }
}