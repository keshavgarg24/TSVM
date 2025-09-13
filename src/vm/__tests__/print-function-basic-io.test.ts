import { VirtualMachine } from "../vm";
import { InstructionFactory } from "../../bytecode";
import { OpCode } from "../../types";
import { RuntimeError } from "../../utils/errors";

describe("VM Print Function and Basic I/O", () => {
  let vm: VirtualMachine;
  let factory: InstructionFactory;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    vm = new VirtualMachine();
    factory = new InstructionFactory();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Print Function with Different Value Types", () => {
    describe("Number Printing", () => {
      it("should print positive integers", () => {
        const instructions = [
          factory.push(42),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith("42");
      });

      it("should print negative integers", () => {
        const instructions = [
          factory.push(-17),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("-17");
      });

      it("should print zero", () => {
        const instructions = [factory.push(0), factory.print(), factory.halt()];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("0");
      });

      it("should print floating point numbers", () => {
        const instructions = [
          factory.push(3.14159),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("3.14159");
      });

      it("should print very large numbers", () => {
        const largeNumber = 9007199254740991; // Number.MAX_SAFE_INTEGER
        const instructions = [
          factory.push(largeNumber),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith(String(largeNumber));
      });

      it("should print very small numbers", () => {
        const smallNumber = -9007199254740991; // Number.MIN_SAFE_INTEGER
        const instructions = [
          factory.push(smallNumber),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith(String(smallNumber));
      });

      it("should print decimal numbers with precision", () => {
        const testCases = [0.1, 0.01, 0.001, 1.23456789];

        testCases.forEach((num, index) => {
          vm.reset();
          consoleSpy.mockClear();

          const instructions = [
            factory.push(num),
            factory.print(),
            factory.halt(),
          ];

          vm.execute(instructions);

          expect(consoleSpy).toHaveBeenCalledWith(String(num));
        });
      });
    });

    describe("String Printing", () => {
      it("should print simple strings", () => {
        const instructions = [
          factory.push("Hello, World!"),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("Hello, World!");
      });

      it("should print empty strings", () => {
        const instructions = [
          factory.push(""),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("");
      });

      it("should print strings with special characters", () => {
        const testStrings = [
          "Hello\\nWorld",
          "Tab\\tSeparated",
          'Quote"Test',
          "Single'Quote",
          "Unicode: 🚀 ✨ 🎉",
          "Numbers: 123 and symbols: @#$%",
        ];

        testStrings.forEach((str, index) => {
          vm.reset();
          consoleSpy.mockClear();

          const instructions = [
            factory.push(str),
            factory.print(),
            factory.halt(),
          ];

          vm.execute(instructions);

          expect(consoleSpy).toHaveBeenCalledWith(str);
        });
      });

      it("should print very long strings", () => {
        const longString = "A".repeat(1000);

        const instructions = [
          factory.push(longString),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith(longString);
      });

      it("should print strings with whitespace", () => {
        const instructions = [
          factory.push("  spaced  string  "),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("  spaced  string  ");
      });
    });

    describe("Boolean Printing", () => {
      it("should print true boolean", () => {
        const instructions = [
          factory.push(true),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("true");
      });

      it("should print false boolean", () => {
        const instructions = [
          factory.push(false),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("false");
      });
    });

    describe("Mixed Type Printing", () => {
      it("should print multiple different types in sequence", () => {
        const instructions = [
          factory.push(42),
          factory.print(),
          factory.push("Hello"),
          factory.print(),
          factory.push(true),
          factory.print(),
          factory.push(3.14),
          factory.print(),
          factory.push(false),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(5);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "42");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Hello");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "true");
        expect(consoleSpy).toHaveBeenNthCalledWith(4, "3.14");
        expect(consoleSpy).toHaveBeenNthCalledWith(5, "false");
      });
    });
  });

  describe("Proper Formatting and Output Handling", () => {
    describe("Output Formatting", () => {
      it("should format numbers consistently", () => {
        const numbers = [0, 1, -1, 100, -100, 0.5, -0.5];

        numbers.forEach((num) => {
          vm.reset();
          consoleSpy.mockClear();

          const instructions = [
            factory.push(num),
            factory.print(),
            factory.halt(),
          ];

          vm.execute(instructions);

          expect(consoleSpy).toHaveBeenCalledWith(String(num));
        });
      });

      it("should preserve string formatting exactly", () => {
        const strings = [
          "exact string",
          "   leading spaces",
          "trailing spaces   ",
          "mixed\\tcontent\\nwith\\rspecial",
          "",
        ];

        strings.forEach((str) => {
          vm.reset();
          consoleSpy.mockClear();

          const instructions = [
            factory.push(str),
            factory.print(),
            factory.halt(),
          ];

          vm.execute(instructions);

          expect(consoleSpy).toHaveBeenCalledWith(str);
        });
      });

      it("should format booleans as lowercase strings", () => {
        const instructions = [
          factory.push(true),
          factory.print(),
          factory.push(false),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenNthCalledWith(1, "true");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "false");
      });
    });

    describe("Output Sequencing", () => {
      it("should handle rapid consecutive prints", () => {
        const instructions: any[] = [];

        for (let i = 0; i < 10; i++) {
          instructions.push(factory.push(i));
          instructions.push(factory.print());
        }
        instructions.push(factory.halt());

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(10);
        for (let i = 0; i < 10; i++) {
          expect(consoleSpy).toHaveBeenNthCalledWith(i + 1, String(i));
        }
      });

      it("should maintain print order with stack operations", () => {
        const instructions = [
          factory.push("first"),
          factory.push("second"),
          factory.push("third"),
          factory.print(), // prints 'third'
          factory.print(), // prints 'second'
          factory.print(), // prints 'first'
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "third");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "second");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "first");
      });
    });

    describe("Output Buffer Management", () => {
      it("should handle large volume printing", () => {
        const instructions: any[] = [];

        for (let i = 0; i < 100; i++) {
          instructions.push(factory.push(`Message ${i}`));
          instructions.push(factory.print());
        }
        instructions.push(factory.halt());

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(100);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Message 0");
        expect(consoleSpy).toHaveBeenNthCalledWith(50, "Message 49");
        expect(consoleSpy).toHaveBeenNthCalledWith(100, "Message 99");
      });

      it("should handle mixed content printing", () => {
        const instructions = [
          factory.push("String: "),
          factory.print(),
          factory.push("Hello"),
          factory.print(),
          factory.push("Number: "),
          factory.print(),
          factory.push(42),
          factory.print(),
          factory.push("Boolean: "),
          factory.print(),
          factory.push(true),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(6);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "String: ");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Hello");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "Number: ");
        expect(consoleSpy).toHaveBeenNthCalledWith(4, "42");
        expect(consoleSpy).toHaveBeenNthCalledWith(5, "Boolean: ");
        expect(consoleSpy).toHaveBeenNthCalledWith(6, "true");
      });
    });
  });

  describe("Print Function Integration with VM Execution", () => {
    describe("Integration with Variables", () => {
      it("should print stored variables", () => {
        const instructions = [
          factory.push("Hello, Variables!"),
          factory.store("message"),
          factory.load("message"),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("Hello, Variables!");
      });

      it("should print computed values from variables", () => {
        const instructions = [
          factory.push(10),
          factory.store("a"),
          factory.push(5),
          factory.store("b"),
          factory.load("a"),
          factory.load("b"),
          factory.add(),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("15");
      });

      it("should print multiple variables", () => {
        const instructions = [
          factory.push("Name: "),
          factory.store("label"),
          factory.push("Alice"),
          factory.store("name"),
          factory.push(25),
          factory.store("age"),
          factory.load("label"),
          factory.print(),
          factory.load("name"),
          factory.print(),
          factory.push("Age: "),
          factory.print(),
          factory.load("age"),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(4);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Name: ");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Alice");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "Age: ");
        expect(consoleSpy).toHaveBeenNthCalledWith(4, "25");
      });
    });

    describe("Integration with Arithmetic Operations", () => {
      it("should print arithmetic results", () => {
        const instructions = [
          factory.push(10),
          factory.push(5),
          factory.add(),
          factory.print(),
          factory.push(20),
          factory.push(3),
          factory.sub(),
          factory.print(),
          factory.push(6),
          factory.push(7),
          factory.mul(),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "15");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "17");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "42");
      });

      it("should print comparison results", () => {
        const instructions = [
          factory.push(10),
          factory.push(5),
          factory.gt(),
          factory.print(),
          factory.push(3),
          factory.push(3),
          factory.eq(),
          factory.print(),
          factory.push(2),
          factory.push(8),
          factory.lt(),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "true");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "true");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "true");
      });
    });

    describe("Integration with Control Flow", () => {
      it("should print within conditional branches", () => {
        const instructions = [
          factory.push(10),
          factory.push(5),
          factory.gt(),
          factory.jumpIfFalse(7),
          factory.push("10 is greater than 5"),
          factory.print(),
          factory.jump(9),
          factory.push("10 is not greater than 5"),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledWith("10 is greater than 5");
        expect(consoleSpy).not.toHaveBeenCalledWith("10 is not greater than 5");
      });

      it("should print within loops", () => {
        const instructions = [
          factory.push(0), // counter
          factory.dup(), // duplicate for comparison
          factory.push(3), // limit
          factory.lt(), // counter < 3
          factory.jumpIfFalse(10), // exit if false
          factory.dup(), // duplicate counter for printing
          factory.print(), // print counter
          factory.push(1), // increment
          factory.add(), // add to counter
          factory.jump(1), // jump back to condition
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "0");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "1");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "2");
      });
    });

    describe("Integration with Function Calls", () => {
      it("should handle print as a function call", () => {
        const instructions = [
          factory.push("Function call test"),
          factory.call("print"),
          factory.push("After function call"),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Function call test");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "After function call");
      });

      it("should handle multiple print function calls", () => {
        const instructions = [
          factory.push("First call"),
          factory.call("print"),
          factory.push("Second call"),
          factory.call("print"),
          factory.push("Third call"),
          factory.call("print"),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "First call");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Second call");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "Third call");
      });
    });

    describe("Complex Integration Scenarios", () => {
      it("should handle complete program with print statements", () => {
        // Simpler program: Calculate 2 * 3 and print result
        const instructions = [
          factory.push("Calculating 2 * 3:"),
          factory.print(),
          factory.push(2),
          factory.store("a"),
          factory.push(3),
          factory.store("b"),
          factory.push("a = "),
          factory.print(),
          factory.load("a"),
          factory.print(),
          factory.push("b = "),
          factory.print(),
          factory.load("b"),
          factory.print(),
          factory.load("a"),
          factory.load("b"),
          factory.mul(),
          factory.store("result"),
          factory.push("result = "),
          factory.print(),
          factory.load("result"),
          factory.print(),
          factory.halt(),
        ];

        vm.execute(instructions);

        expect(consoleSpy).toHaveBeenCalledTimes(7);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Calculating 2 * 3:");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "a = ");
        expect(consoleSpy).toHaveBeenNthCalledWith(3, "2");
        expect(consoleSpy).toHaveBeenNthCalledWith(4, "b = ");
        expect(consoleSpy).toHaveBeenNthCalledWith(5, "3");
        expect(consoleSpy).toHaveBeenNthCalledWith(6, "result = ");
        expect(consoleSpy).toHaveBeenNthCalledWith(7, "6");
      });
    });
  });

  describe("Print Function Error Handling", () => {
    describe("Stack Underflow Errors", () => {
      it("should handle print with empty stack", () => {
        const instructions = [
          factory.print(), // No value on stack
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
        expect(() => vm.execute(instructions)).toThrow(
          /cannot print from empty stack/i
        );
      });

      it("should handle print after stack operations", () => {
        const instructions = [
          factory.push(42),
          factory.pop(), // Remove the value
          factory.print(), // Try to print from empty stack
          factory.halt(),
        ];

        expect(() => vm.execute(instructions)).toThrow(RuntimeError);
      });
    });

    describe("Error Recovery", () => {
      it("should maintain output consistency after print errors", () => {
        // First, successful print
        vm.execute([factory.push("Success"), factory.print(), factory.halt()]);

        expect(consoleSpy).toHaveBeenCalledWith("Success");
        consoleSpy.mockClear();

        // Now try failed print
        try {
          vm.execute([
            factory.print(), // Empty stack
            factory.halt(),
          ]);
        } catch (error) {
          // Expected to fail
        }

        // Should not have printed anything during error
        expect(consoleSpy).not.toHaveBeenCalled();
      });

      it("should handle partial print sequences with errors", () => {
        const instructions = [
          factory.push("First"),
          factory.print(),
          factory.push("Second"),
          factory.print(),
          factory.print(), // Error: empty stack
          factory.push("Third"), // Should not execute
          factory.print(),
          factory.halt(),
        ];

        try {
          vm.execute(instructions);
        } catch (error) {
          // Expected to fail
        }

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "First");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Second");
        expect(consoleSpy).not.toHaveBeenCalledWith("Third");
      });
    });
  });

  describe("Performance and Stress Testing", () => {
    it("should handle high-volume printing efficiently", () => {
      const instructions: any[] = [];

      for (let i = 0; i < 1000; i++) {
        instructions.push(factory.push(`Message ${i}`));
        instructions.push(factory.print());
      }
      instructions.push(factory.halt());

      const startTime = Date.now();
      vm.execute(instructions);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in reasonable time
      expect(consoleSpy).toHaveBeenCalledTimes(1000);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, "Message 0");
      expect(consoleSpy).toHaveBeenNthCalledWith(1000, "Message 999");
    });

    it("should handle large string printing", () => {
      const largeString = "X".repeat(10000);

      const instructions = [
        factory.push(largeString),
        factory.print(),
        factory.halt(),
      ];

      vm.execute(instructions);

      expect(consoleSpy).toHaveBeenCalledWith(largeString);
    });

    it("should handle mixed large content printing", () => {
      const instructions: any[] = [];

      // Mix of different types and sizes
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          instructions.push(factory.push(i));
        } else if (i % 3 === 1) {
          instructions.push(factory.push(`String_${i}`));
        } else {
          instructions.push(factory.push(i % 2 === 0));
        }
        instructions.push(factory.print());
      }
      instructions.push(factory.halt());

      vm.execute(instructions);

      expect(consoleSpy).toHaveBeenCalledTimes(100);
    });
  });
});
