// Control flow demonstration
let x = 5;

// If-else statement
if (x > 0) {
  print("x is positive");
} else {
  print("x is not positive");
}

// While loop
let counter = 0;
print("Counting to 5:");
while (counter < 5) {
  counter = counter + 1;
  print("Count: " + toString(counter));
}

// Nested conditions
let grade = 85;
if (grade >= 90) {
  print("Grade A");
} else {
  if (grade >= 80) {
    print("Grade B");
  } else {
    if (grade >= 70) {
      print("Grade C");
    } else {
      print("Grade F");
    }
  }
}