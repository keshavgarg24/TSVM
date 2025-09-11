/// <reference path="global.d.ts" />

// Variable scoping examples
let globalVar = "I'm global";

function testScoping() {
  let localVar = "I'm local";
  print(globalVar);
  print(localVar);
  
  // Nested scope
  {
    let nestedVar = "I'm nested";
    print(nestedVar);
    print(localVar); // Can access outer scope
  }
  
  // nestedVar is not accessible here
  return localVar;
}

print("Testing variable scoping:");
let result = testScoping();
print("Function returned: " + result);