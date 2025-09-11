/// <reference path="global.d.ts" />

// Fibonacci sequence calculator
function fibonacci(n: number): number {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 10 fibonacci numbers
for (let i = 0; i < 10; i++) {
  let result = fibonacci(i);
  print("fibonacci(" + toString(i) + ") = " + toString(result));
}