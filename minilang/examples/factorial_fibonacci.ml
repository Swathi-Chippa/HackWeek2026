// Factorial and Fibonacci, computed both recursively and iteratively.
// Demonstrates: functions, recursion, while-loops, if/else.

func factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

func fib(n) {
    if (n < 2) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

print("Factorials 0..10:");
for (let i = 0; i <= 10; i = i + 1) {
    print(factorial(i));
}

print("First 12 Fibonacci numbers:");
let i = 0;
while (i < 12) {
    print(fib(i));
    i = i + 1;
}
