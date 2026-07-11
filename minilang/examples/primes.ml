// Prints all prime numbers up to 50 using simple trial division.
// Demonstrates: nested loops, boolean logic, variables, conditions.

let limit = 50;
let n = 2;

print("Prime numbers up to 50:");

while (n <= limit) {
    let is_prime = true;
    let divisor = 2;

    while (divisor * divisor <= n) {
        if (n % divisor == 0) {
            is_prime = false;
        }
        divisor = divisor + 1;
    }

    if (is_prime) {
        print(n);
    }

    n = n + 1;
}

// Bonus: count how many primes were found using and/or in a condition.
let count = 0;
let x = 2;
while (x <= limit) {
    let prime = true;
    let d = 2;
    while (d * d <= x) {
        if (x % d == 0 and d != x) {
            prime = false;
        }
        d = d + 1;
    }
    if (prime) {
        count = count + 1;
    }
    x = x + 1;
}
print("Total primes found:");
print(count);
