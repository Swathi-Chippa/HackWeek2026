#!/usr/bin/env python3
"""
MiniLang CLI runner.

Usage:
    python3 minilang.py path/to/program.ml
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from lexer import tokenize, LexError
from parser import parse, ParseError
from interpreter import Interpreter, MiniLangError


def run_file(path):
    with open(path, "r") as f:
        source = f.read()

    try:
        tokens = tokenize(source)
        ast = parse(tokens)
        interp = Interpreter()  # output=None -> prints straight to stdout
        interp.run(ast)
    except LexError as e:
        print(f"Lex error: {e}", file=sys.stderr)
        sys.exit(1)
    except ParseError as e:
        print(f"Parse error: {e}", file=sys.stderr)
        sys.exit(1)
    except MiniLangError as e:
        print(f"Runtime error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 minilang.py <program.ml>", file=sys.stderr)
        sys.exit(1)
    run_file(sys.argv[1])


if __name__ == "__main__":
    main()
