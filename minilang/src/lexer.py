"""
Lexer for MiniLang.
Turns raw source text into a flat list of Token objects.
"""

KEYWORDS = {
    "let", "if", "else", "while", "for", "print",
    "true", "false", "and", "or", "not", "func", "return",
}

# Multi-character operators must be listed before their single-char prefixes.
SYMBOLS = [
    "==", "!=", "<=", ">=", "&&", "||",
    "+", "-", "*", "/", "%", "=", "<", ">",
    "(", ")", "{", "}", ";", ",", "!",
]


class Token:
    def __init__(self, kind, value, line):
        self.kind = kind    # NUMBER, STRING, IDENT, KEYWORD, SYMBOL, EOF
        self.value = value
        self.line = line

    def __repr__(self):
        return f"Token({self.kind}, {self.value!r}, line={self.line})"


class LexError(Exception):
    pass


def tokenize(source: str):
    tokens = []
    i = 0
    n = len(source)
    line = 1

    while i < n:
        ch = source[i]

        # whitespace
        if ch == "\n":
            line += 1
            i += 1
            continue
        if ch.isspace():
            i += 1
            continue

        # comments (// to end of line)
        if ch == "/" and i + 1 < n and source[i + 1] == "/":
            while i < n and source[i] != "\n":
                i += 1
            continue

        # numbers (integers and floats)
        if ch.isdigit():
            start = i
            while i < n and source[i].isdigit():
                i += 1
            if i < n and source[i] == "." and i + 1 < n and source[i + 1].isdigit():
                i += 1
                while i < n and source[i].isdigit():
                    i += 1
            text = source[start:i]
            value = float(text) if "." in text else int(text)
            tokens.append(Token("NUMBER", value, line))
            continue

        # strings
        if ch == '"':
            start = i
            i += 1
            buf = []
            while i < n and source[i] != '"':
                c = source[i]
                if c == "\\" and i + 1 < n:
                    nxt = source[i + 1]
                    esc = {"n": "\n", "t": "\t", '"': '"', "\\": "\\"}.get(nxt, nxt)
                    buf.append(esc)
                    i += 2
                    continue
                if c == "\n":
                    line += 1
                buf.append(c)
                i += 1
            if i >= n:
                raise LexError(f"Unterminated string literal starting at line {line}")
            i += 1  # skip closing quote
            tokens.append(Token("STRING", "".join(buf), line))
            continue

        # identifiers / keywords
        if ch.isalpha() or ch == "_":
            start = i
            while i < n and (source[i].isalnum() or source[i] == "_"):
                i += 1
            text = source[start:i]
            kind = "KEYWORD" if text in KEYWORDS else "IDENT"
            tokens.append(Token(kind, text, line))
            continue

        # symbols / operators
        matched = False
        for sym in SYMBOLS:
            if source.startswith(sym, i):
                tokens.append(Token("SYMBOL", sym, line))
                i += len(sym)
                matched = True
                break
        if matched:
            continue

        raise LexError(f"Unexpected character {ch!r} at line {line}")

    tokens.append(Token("EOF", None, line))
    return tokens
