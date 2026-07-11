"""
Basic tests for MiniLang. Run with: python3 tests/test_minilang.py
Uses plain assert statements (no pytest dependency required) so the repo
stays dependency-free.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from lexer import tokenize
from parser import parse
from interpreter import Interpreter


def run(source):
    tokens = tokenize(source)
    ast = parse(tokens)
    interp = Interpreter(output=[])
    return interp.run(ast)


def test_variables_and_arithmetic():
    out = run("""
        let a = 5;
        let b = 3;
        print(a + b);
        print(a - b);
        print(a * b);
        print(a % b);
    """)
    assert out == ["8", "2", "15", "2"], out


def test_if_else():
    out = run("""
        let x = 10;
        if (x > 5) {
            print("big");
        } else {
            print("small");
        }
    """)
    assert out == ["big"], out


def test_while_loop():
    out = run("""
        let i = 0;
        while (i < 5) {
            print(i);
            i = i + 1;
        }
    """)
    assert out == ["0", "1", "2", "3", "4"], out


def test_for_loop_fizzbuzz_small():
    out = run("""
        for (let i = 1; i <= 5; i = i + 1) {
            if (i % 3 == 0) {
                print("Fizz");
            } else {
                print(i);
            }
        }
    """)
    assert out == ["1", "2", "Fizz", "4", "5"], out


def test_functions_and_recursion():
    out = run("""
        func factorial(n) {
            if (n <= 1) {
                return 1;
            }
            return n * factorial(n - 1);
        }
        print(factorial(5));
        print(factorial(0));
    """)
    assert out == ["120", "1"], out


def test_boolean_logic():
    out = run("""
        let a = true;
        let b = false;
        print(a and b);
        print(a or b);
        print(not a);
    """)
    assert out == ["false", "true", "false"], out


def test_string_and_equality():
    out = run("""
        let s = "hello";
        print(s);
        print(s == "hello");
        print(s == "world");
    """)
    assert out == ["hello", "true", "false"], out


def test_nested_scope_does_not_leak():
    out = run("""
        let x = 1;
        if (true) {
            let x = 2;
            print(x);
        }
        print(x);
    """)
    assert out == ["2", "1"], out


TESTS = [
    test_variables_and_arithmetic,
    test_if_else,
    test_while_loop,
    test_for_loop_fizzbuzz_small,
    test_functions_and_recursion,
    test_boolean_logic,
    test_string_and_equality,
    test_nested_scope_does_not_leak,
]


def main():
    passed = 0
    for t in TESTS:
        try:
            t()
            print(f"PASS: {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"FAIL: {t.__name__}: {e}")
    print(f"\n{passed}/{len(TESTS)} tests passed")
    if passed != len(TESTS):
        sys.exit(1)


if __name__ == "__main__":
    main()
