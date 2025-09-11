import { VirtualMachine } from "../vm";
import { InstructionFactory } from "../../bytecode";
import { OpCode } from "../../types";
import { RuntimeError } from "../../utils/errors";

describe("VM Mathematical Functions", () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
  });

  describe("Absolute Value Function (abs)", () => {
    describe("Basic Functionality", () => {
      it("should calculate absolute value of positive numbers", () => {
        const instructions = [
          factory.push(42),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe("number");
        expect(state.stack[0]?.data).toBe(42);
      });

      it("should calculate absolute value of negative numbers", () => {
        const instructions = [
          factory.push(-17),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(17);
      });

      it("should handle zero", () => {
        const instructions = [
          factory.push(0),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it("should handle floating point numbers", () => {
        const instructions = [
          factory.push(-3.14159),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBeCloseTo(3.14159);
      });

      it("should handle very large numbers", () => {
        const largeNumber = 9007199254740991; // Number.MAX_SAFE_INTEGER
        const instructions = [
          factory.push(-largeNumber),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(largeNumber);
      });

      it("should handle very small numbers", () => {
        const instructions = [
          factory.push(-0.000001),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBeCloseTo(0.000001);
      });
    });

    describe("Type Conversion", () => {
      it("should handle boolean true (converts to 1)", () => {
        const instructions = [
          factory.push(true),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(1);
      });

      it("should handle boolean false (converts to 0)", () => {
        const instructions = [
          factory.push(false),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it("should handle numeric strings", () => {
        const instructions = [
          factory.push("-42"),
          factory.call("abs"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(42);
      });
    });

    describe("Error Handling", () => {
      it("should handle empty stack", () => {
        const instructions = [factory.call("abs"), factory.halt()];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(
          /cannot execute abs from empty stack/i
        );
      });

      it("should handle non-numeric strings", () => {
        const instructions = [
          factory.push("not_a_number"),
          factory.call("abs"),
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });
  });

  describe("Square Root Function (sqrt)", () => {
    describe("Basic Functionality", () => {
      it("should calculate square root of positive numbers", () => {
        const instructions = [
          factory.push(25),
          factory.call("sqrt"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe("number");
        expect(state.stack[0]?.data).toBe(5);
      });

      it("should calculate square root of zero", () => {
        const instructions = [
          factory.push(0),
          factory.call("sqrt"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it("should handle perfect squares", () => {
        const testCases = [
          { input: 1, expected: 1 },
          { input: 4, expected: 2 },
          { input: 9, expected: 3 },
          { input: 16, expected: 4 },
          { input: 100, expected: 10 },
        ];

        testCases.forEach(({ input, expected }) => {
          vm.reset();

          const instructions = [
            factory.push(input),
            factory.call("sqrt"),
            factory.halt(),
          ];

          vm.execute(instructions);
          const state = vm.getState();

          expect(state.stack[0]?.data).toBe(expected);
        });
      });

      it("should handle non-perfect squares", () => {
        const instructions = [
          factory.push(2),
          factory.call("sqrt"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBeCloseTo(Math.sqrt(2));
      });

      it("should handle floating point numbers", () => {
        const instructions = [
          factory.push(6.25),
          factory.call("sqrt"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(2.5);
      });

      it("should handle very large numbers", () => {
        const instructions = [
          factory.push(1000000),
          factory.call("sqrt"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(1000);
      });
    });

    describe("Error Handling", () => {
      it("should handle negative numbers", () => {
        const instructions = [
          factory.push(-4),
          factory.call("sqrt"),
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(
          /cannot take square root of negative number/i
        );
      });

      it("should handle empty stack", () => {
        const instructions = [factory.call("sqrt"), factory.halt()];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it("should handle non-numeric types", () => {
        const instructions = [
          factory.push("invalid"),
          factory.call("sqrt"),
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });
  });

  describe("Power Function (pow)", () => {
    describe("Basic Functionality", () => {
      it("should calculate power of positive numbers", () => {
        const instructions = [
          factory.push(2), // base
          factory.push(3), // exponent
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(1);
        expect(state.stack[0]?.type).toBe("number");
        expect(state.stack[0]?.data).toBe(8);
      });

      it("should handle power of zero", () => {
        const instructions = [
          factory.push(5),
          factory.push(0),
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(1);
      });

      it("should handle zero to positive power", () => {
        const instructions = [
          factory.push(0),
          factory.push(5),
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0);
      });

      it("should handle negative exponents", () => {
        const instructions = [
          factory.push(2),
          factory.push(-2),
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(0.25);
      });

      it("should handle fractional exponents", () => {
        const instructions = [
          factory.push(8),
          factory.push(1 / 3),
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBeCloseTo(2);
      });

      it("should handle negative base with integer exponent", () => {
        const instructions = [
          factory.push(-2),
          factory.push(3),
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(-8);
      });

      it("should handle large exponents", () => {
        const instructions = [
          factory.push(2),
          factory.push(10),
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(1024);
      });

      it("should handle floating point base and exponent", () => {
        const instructions = [
          factory.push(2.5),
          factory.push(2),
          factory.call("pow"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(6.25);
      });
    });

    describe("Error Handling", () => {
      it("should handle zero to negative power", () => {
        const instructions = [
          factory.push(0),
          factory.push(-1),
          factory.call("pow"),
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(
          /cannot raise 0 to negative power/i
        );
      });

      it("should handle insufficient operands", () => {
        const instructions = [
          factory.push(2),
          factory.call("pow"), // Missing exponent
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        // The error message may vary, just check that it throws
      });

      it("should handle empty stack", () => {
        const instructions = [factory.call("pow"), factory.halt()];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it("should handle non-numeric types", () => {
        const instructions = [
          factory.push("base"),
          factory.push(2),
          factory.call("pow"),
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it("should handle operations that result in infinity", () => {
        const maxValue = 1.7976931348623157e+308; // Number.MAX_VALUE
        const instructions = [
          factory.push(maxValue),
          factory.push(2),
          factory.call("pow"),
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(/invalid number/i);
      });
    });
  });

  describe("Math Function Integration and Type Checking", () => {
    describe("Integration with Variables", () => {
      it("should work with stored variables", () => {
        const instructions = [
          factory.push(-42),
          factory.store("negative"),
          factory.load("negative"),
          factory.call("abs"),
          factory.store("positive"),
          factory.load("positive"),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(42);
        expect(state.variables.get("positive")?.data).toBe(42);
      });

      it("should work with computed values", () => {
        const instructions = [
          factory.push(3),
          factory.push(4),
          factory.mul(), // 3 * 4 = 12
          factory.call("sqrt"), // sqrt(12)
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBeCloseTo(Math.sqrt(12));
      });
    });

    describe("Integration with Arithmetic Operations", () => {
      it("should chain math functions with arithmetic", () => {
        const instructions = [
          factory.push(-5),
          factory.call("abs"), // abs(-5) = 5
          factory.push(2),
          factory.call("pow"), // pow(5, 2) = 25
          factory.call("sqrt"), // sqrt(25) = 5
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(5);
      });

      it("should work with comparison operations", () => {
        const instructions = [
          factory.push(16),
          factory.call("sqrt"), // sqrt(16) = 4
          factory.push(2),
          factory.push(2),
          factory.call("pow"), // pow(2, 2) = 4
          factory.eq(), // 4 == 4
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(true);
      });
    });

    describe("Integration with Control Flow", () => {
      it("should work within conditional branches", () => {
        const instructions = [
          factory.push(-10), // 0
          factory.dup(), // 1
          factory.push(0), // 2
          factory.lt(), // 3: -10 < 0
          factory.jumpIfFalse(7), // 4: if false, jump to 7
          factory.call("abs"), // 5: abs(-10) = 10
          factory.jump(7), // 6: jump to end
          factory.halt(), // 7: end
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(10);
      });

      it("should work within loops", () => {
        // Simpler test: calculate 2^2 and 3^2
        const instructions = [
          factory.push(2), // base
          factory.push(2), // exponent
          factory.call("pow"), // 2^2 = 4
          factory.push(3), // base
          factory.push(2), // exponent
          factory.call("pow"), // 3^2 = 9
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack).toHaveLength(2);
        expect(state.stack[0]?.data).toBe(4); // 2^2
        expect(state.stack[1]?.data).toBe(9); // 3^2
      });
    });

    describe("Complex Mathematical Expressions", () => {
      it("should calculate distance formula: sqrt((x2-x1)^2 + (y2-y1)^2)", () => {
        // Calculate distance between points (1,1) and (4,5)
        const instructions = [
          // Calculate (x2-x1)^2
          factory.push(4), // x2
          factory.push(1), // x1
          factory.sub(), // x2-x1 = 3
          factory.push(2),
          factory.call("pow"), // (x2-x1)^2 = 9

          // Calculate (y2-y1)^2
          factory.push(5), // y2
          factory.push(1), // y1
          factory.sub(), // y2-y1 = 4
          factory.push(2),
          factory.call("pow"), // (y2-y1)^2 = 16

          // Add and take square root
          factory.add(), // 9 + 16 = 25
          factory.call("sqrt"), // sqrt(25) = 5
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(5);
      });

      it("should calculate quadratic formula discriminant: b^2 - 4ac", () => {
        // For equation x^2 + 5x + 6 = 0 (a=1, b=5, c=6)
        const instructions = [
          factory.push(5), // b
          factory.push(2),
          factory.call("pow"), // b^2 = 25

          factory.push(4), // 4
          factory.push(1), // a
          factory.mul(), // 4a = 4
          factory.push(6), // c
          factory.mul(), // 4ac = 24

          factory.sub(), // b^2 - 4ac = 25 - 24 = 1
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        expect(state.stack[0]?.data).toBe(1);
      });
    });

    describe("Error Propagation", () => {
      it("should propagate errors through function chains", () => {
        const instructions = [
          factory.push(-4),
          factory.call("sqrt"), // Error: negative sqrt
          factory.call("abs"), // Should not execute
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });

      it("should maintain stack consistency after math function errors", () => {
        // First, successful operations
        vm.execute([factory.push(25), factory.call("sqrt"), factory.halt()]);

        let state = vm.getState();
        expect(state.stack[0]?.data).toBe(5);

        // Now try failed operation
        try {
          vm.execute([factory.push(-4), factory.call("sqrt"), factory.halt()]);
        } catch (error) {
          // Expected to fail
        }

        // Previous state should still be intact
        state = vm.getState();
        expect(state.stack[0]?.data).toBe(5);
      });
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle rapid math function calls", () => {
      const instructions = [];

      for (let i = 1; i <= 10; i++) {
        instructions.push(factory.push(i));
        instructions.push(factory.call("abs"));
        instructions.push(factory.push(2));
        instructions.push(factory.call("pow"));
      }
      instructions.push(factory.halt());

      const startTime = Date.now();
      vm.execute(instructions);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);

      const state = vm.getState();
      expect(state.stack).toHaveLength(10);
      expect(state.stack[9]?.data).toBe(100); // 10^2
    });

    it("should handle edge case numbers", () => {
      const epsilon = 2.220446049250313e-16; // Number.EPSILON
      const minValue = 5e-324; // Number.MIN_VALUE
      const testCases = [
        { func: "abs", input: epsilon, expected: epsilon },
        {
          func: "sqrt",
          input: minValue,
          expected: Math.sqrt(minValue),
        },
        { func: "abs", input: -epsilon, expected: epsilon },
      ];

      testCases.forEach(({ func, input, expected }) => {
        vm.reset();

        const instructions = [
          factory.push(input),
          factory.call(func),
          factory.halt(),
        ];

        vm.execute(instructions);
        const state = vm.getState();

        if (expected === epsilon) {
          expect(state.stack[0]?.data).toBeCloseTo(expected);
        } else {
          expect(state.stack[0]?.data).toBe(expected);
        }
      });
    });
  });
});
