# MiniLang

A small, tree-walking interpreter for a C-like scripting language, written in
pure Python 3 (no external dependencies to run programs). Built as a learning
project: lexer → recursive-descent parser → AST → interpreter.

```
$ python3 minilang.py examples/fizzbuzz.ml
1
2
Fizz
4
Buzz
...
```

## Features

- **Variables**: `let x = 5;` and reassignment `x = x + 1;`
- **Data types**: integers, floats, strings, booleans, `nil`
- **Arithmetic**: `+ - * / %` (integer division stays an int when it divides evenly)
- **Comparisons**: `== != < > <= >=`
- **Boolean logic**: `&& || !` and the word forms `and or not`, with short-circuit evaluation
- **Conditionals**: `if (...) { ... } else { ... }`, with `else if` chaining
- **Loops**: `while (...) { ... }` and C-style `for (init; cond; update) { ... }`
- **Functions**: `func name(params) { ... return expr; }`, including recursion and closures
- **Lexical scoping**: each block/function call gets its own environment chained to its parent
- **Comments**: `// line comment`
- **`print(...)`** for output

## Project layout

```
minilang/
├── minilang.py              # CLI entry point: python3 minilang.py <file.ml>
├── src/
│   ├── lexer.py              # source text -> tokens
│   ├── ast_nodes.py          # AST node classes
│   ├── parser.py             # tokens -> AST (recursive descent)
│   └── interpreter.py        # tree-walking evaluator
├── examples/
│   ├── fizzbuzz.ml
│   ├── factorial_fibonacci.ml
│   └── primes.ml
├── tests/
│   └── test_minilang.py      # dependency-free assertion tests
├── screenshots/               # terminal captures of the example programs
└── make_screenshots.py        # regenerates the screenshots
```

## Running it

Requires only Python 3 (no pip installs needed for the interpreter itself):

```bash
python3 minilang.py examples/fizzbuzz.ml
python3 minilang.py examples/factorial_fibonacci.ml
python3 minilang.py examples/primes.ml
```

Run the test suite:

```bash
python3 tests/test_minilang.py
```

## Language tour

### Variables & arithmetic
```js
let x = 10;
let y = 3;
print(x + y);   // 13
print(x % y);   // 1
```

### Conditions
```js
if (x > y) {
    print("x is bigger");
} else if (x == y) {
    print("equal");
} else {
    print("y is bigger");
}
```

### Loops
```js
// while
let i = 0;
while (i < 5) {
    print(i);
    i = i + 1;
}

// for
for (let i = 1; i <= 30; i = i + 1) {
    if (i % 15 == 0) { print("FizzBuzz"); }
    else if (i % 3 == 0) { print("Fizz"); }
    else if (i % 5 == 0) { print("Buzz"); }
    else { print(i); }
}
```

### Functions & recursion
```js
func factorial(n) {
    if (n <= 1) { return 1; }
    return n * factorial(n - 1);
}
print(factorial(5)); // 120
```

## Example programs & output

### 1. FizzBuzz (`examples/fizzbuzz.ml`)
Classic FizzBuzz from 1 to 30, using a `for` loop and nested `if/else`.

![FizzBuzz output](screenshots/fizzbuzz_output.png)

### 2. Factorial & Fibonacci (`examples/factorial_fibonacci.ml`)
Recursive functions computing factorials 0–10 and the first 12 Fibonacci numbers.

![Factorial and Fibonacci output](screenshots/factorial_fibonacci_output.png)

### 3. Prime Sieve (`examples/primes.ml`)
Finds all primes up to 50 via trial division, using nested `while` loops and
boolean logic (`and`).

![Prime sieve output](screenshots/primes_output.png)

## Design notes

- **Lexer** (`src/lexer.py`): a single left-to-right scan producing tokens for
  numbers, strings, identifiers/keywords, and operators/punctuation. Handles
  `//` comments and basic string escapes (`\n`, `\t`, `\"`, `\\`).
- **Parser** (`src/parser.py`): classic recursive-descent with precedence
  climbing for expressions (`|| → && → equality → comparison → term → factor
  → unary → call → primary`), so `2 + 3 * 4 == 14` parses with the expected
  precedence.
- **Interpreter** (`src/interpreter.py`): walks the AST directly. Scoping is
  handled by a chain of `Environment` objects — every block (`if`, `while`,
  `for`, function call) opens a new child environment, so variables declared
  inside a block don't leak out, while lookups still fall through to outer
  scopes. Functions capture their defining environment as a closure. `return`
  is implemented by throwing a `ReturnSignal` exception that unwinds up to the
  enclosing function call.

## Possible extensions

- Arrays / lists and a `for-each` loop
- More string operations (`+` already concatenates strings; things like
  `length()`, indexing, or splitting would be natural next additions)
- A REPL mode
- Better error messages with source snippets instead of just line numbers

## License

MIT — do whatever you like with it.
