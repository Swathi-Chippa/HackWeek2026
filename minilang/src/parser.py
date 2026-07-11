"""
Recursive-descent parser for MiniLang.
Converts a token stream (from lexer.py) into an AST (ast_nodes.py).

Grammar (informal):

    program     := statement*
    statement   := letStmt | assignStmt | printStmt | ifStmt | whileStmt
                 | forStmt | funcDef | returnStmt | exprStmt
    letStmt     := "let" IDENT "=" expr ";"
    assignStmt  := IDENT "=" expr ";"
    printStmt   := "print" "(" expr ")" ";"
    ifStmt      := "if" "(" expr ")" block ("else" block)?
    whileStmt   := "while" "(" expr ")" block
    forStmt     := "for" "(" (letStmt|assignStmt) expr ";" assignExprNoSemi ")" block
    funcDef     := "func" IDENT "(" params? ")" block
    returnStmt  := "return" expr? ";"
    block       := "{" statement* "}"
    expr        := logicOr
    logicOr     := logicAnd ( "||" logicAnd )*
    logicAnd    := equality ( "&&" equality )*
    equality    := comparison ( ("=="|"!=") comparison )*
    comparison  := term ( ("<"|">"|"<="|">=") term )*
    term        := factor ( ("+"|"-") factor )*
    factor      := unary ( ("*"|"/"|"%") unary )*
    unary       := ("!"|"-"|"not") unary | call
    call        := primary ( "(" args? ")" )?
    primary     := NUMBER | STRING | "true" | "false" | IDENT | "(" expr ")"
"""

from ast_nodes import (
    NumberLit, StringLit, BoolLit, Identifier, BinaryOp, UnaryOp, Call,
    LetStmt, AssignStmt, PrintStmt, IfStmt, WhileStmt, ForStmt,
    FuncDef, ReturnStmt, ExprStmt, Program,
)


class ParseError(Exception):
    pass


class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    # ---- token helpers ----

    def peek(self):
        return self.tokens[self.pos]

    def advance(self):
        tok = self.tokens[self.pos]
        if tok.kind != "EOF":
            self.pos += 1
        return tok

    def check(self, kind, value=None):
        tok = self.peek()
        if tok.kind != kind:
            return False
        if value is not None and tok.value != value:
            return False
        return True

    def match(self, kind, value=None):
        if self.check(kind, value):
            return self.advance()
        return None

    def expect(self, kind, value=None):
        tok = self.peek()
        if not self.check(kind, value):
            raise ParseError(
                f"Line {tok.line}: expected {kind} {value!r}, got {tok.kind} {tok.value!r}"
            )
        return self.advance()

    # ---- entry point ----

    def parse_program(self):
        statements = []
        while not self.check("EOF"):
            statements.append(self.parse_statement())
        return Program(statements)

    # ---- statements ----

    def parse_block(self):
        self.expect("SYMBOL", "{")
        statements = []
        while not self.check("SYMBOL", "}"):
            statements.append(self.parse_statement())
        self.expect("SYMBOL", "}")
        return statements

    def parse_statement(self):
        if self.check("KEYWORD", "let"):
            return self.parse_let()
        if self.check("KEYWORD", "print"):
            return self.parse_print()
        if self.check("KEYWORD", "if"):
            return self.parse_if()
        if self.check("KEYWORD", "while"):
            return self.parse_while()
        if self.check("KEYWORD", "for"):
            return self.parse_for()
        if self.check("KEYWORD", "func"):
            return self.parse_func()
        if self.check("KEYWORD", "return"):
            return self.parse_return()
        if self.check("IDENT") and self.tokens[self.pos + 1].kind == "SYMBOL" and \
                self.tokens[self.pos + 1].value == "=":
            return self.parse_assign()
        # bare expression statement
        expr = self.parse_expr()
        self.expect("SYMBOL", ";")
        return ExprStmt(expr)

    def parse_let(self):
        self.expect("KEYWORD", "let")
        name = self.expect("IDENT").value
        self.expect("SYMBOL", "=")
        expr = self.parse_expr()
        self.expect("SYMBOL", ";")
        return LetStmt(name, expr)

    def parse_assign(self):
        name = self.expect("IDENT").value
        self.expect("SYMBOL", "=")
        expr = self.parse_expr()
        self.expect("SYMBOL", ";")
        return AssignStmt(name, expr)

    def parse_assign_no_semi(self):
        name = self.expect("IDENT").value
        self.expect("SYMBOL", "=")
        expr = self.parse_expr()
        return AssignStmt(name, expr)

    def parse_print(self):
        self.expect("KEYWORD", "print")
        self.expect("SYMBOL", "(")
        expr = self.parse_expr()
        self.expect("SYMBOL", ")")
        self.expect("SYMBOL", ";")
        return PrintStmt(expr)

    def parse_if(self):
        self.expect("KEYWORD", "if")
        self.expect("SYMBOL", "(")
        cond = self.parse_expr()
        self.expect("SYMBOL", ")")
        then_body = self.parse_block()
        else_body = None
        if self.match("KEYWORD", "else"):
            if self.check("KEYWORD", "if"):
                else_body = [self.parse_if()]
            else:
                else_body = self.parse_block()
        return IfStmt(cond, then_body, else_body)

    def parse_while(self):
        self.expect("KEYWORD", "while")
        self.expect("SYMBOL", "(")
        cond = self.parse_expr()
        self.expect("SYMBOL", ")")
        body = self.parse_block()
        return WhileStmt(cond, body)

    def parse_for(self):
        self.expect("KEYWORD", "for")
        self.expect("SYMBOL", "(")
        init = self.parse_let() if self.check("KEYWORD", "let") else self.parse_assign()
        cond = self.parse_expr()
        self.expect("SYMBOL", ";")
        update = self.parse_assign_no_semi()
        self.expect("SYMBOL", ")")
        body = self.parse_block()
        return ForStmt(init, cond, update, body)

    def parse_func(self):
        self.expect("KEYWORD", "func")
        name = self.expect("IDENT").value
        self.expect("SYMBOL", "(")
        params = []
        if not self.check("SYMBOL", ")"):
            params.append(self.expect("IDENT").value)
            while self.match("SYMBOL", ","):
                params.append(self.expect("IDENT").value)
        self.expect("SYMBOL", ")")
        body = self.parse_block()
        return FuncDef(name, params, body)

    def parse_return(self):
        self.expect("KEYWORD", "return")
        expr = None
        if not self.check("SYMBOL", ";"):
            expr = self.parse_expr()
        self.expect("SYMBOL", ";")
        return ReturnStmt(expr)

    # ---- expressions (precedence climbing) ----

    def parse_expr(self):
        return self.parse_logic_or()

    def parse_logic_or(self):
        left = self.parse_logic_and()
        while self.check("SYMBOL", "||") or self.check("KEYWORD", "or"):
            op = self.advance().value
            right = self.parse_logic_and()
            left = BinaryOp("||", left, right)
        return left

    def parse_logic_and(self):
        left = self.parse_equality()
        while self.check("SYMBOL", "&&") or self.check("KEYWORD", "and"):
            op = self.advance().value
            right = self.parse_equality()
            left = BinaryOp("&&", left, right)
        return left

    def parse_equality(self):
        left = self.parse_comparison()
        while self.check("SYMBOL", "==") or self.check("SYMBOL", "!="):
            op = self.advance().value
            right = self.parse_comparison()
            left = BinaryOp(op, left, right)
        return left

    def parse_comparison(self):
        left = self.parse_term()
        while (self.check("SYMBOL", "<") or self.check("SYMBOL", ">") or
               self.check("SYMBOL", "<=") or self.check("SYMBOL", ">=")):
            op = self.advance().value
            right = self.parse_term()
            left = BinaryOp(op, left, right)
        return left

    def parse_term(self):
        left = self.parse_factor()
        while self.check("SYMBOL", "+") or self.check("SYMBOL", "-"):
            op = self.advance().value
            right = self.parse_factor()
            left = BinaryOp(op, left, right)
        return left

    def parse_factor(self):
        left = self.parse_unary()
        while self.check("SYMBOL", "*") or self.check("SYMBOL", "/") or self.check("SYMBOL", "%"):
            op = self.advance().value
            right = self.parse_unary()
            left = BinaryOp(op, left, right)
        return left

    def parse_unary(self):
        if self.check("SYMBOL", "!") or self.check("SYMBOL", "-") or self.check("KEYWORD", "not"):
            op = self.advance().value
            operand = self.parse_unary()
            return UnaryOp(op, operand)
        return self.parse_call()

    def parse_call(self):
        expr = self.parse_primary()
        if isinstance(expr, Identifier) and self.check("SYMBOL", "("):
            self.advance()
            args = []
            if not self.check("SYMBOL", ")"):
                args.append(self.parse_expr())
                while self.match("SYMBOL", ","):
                    args.append(self.parse_expr())
            self.expect("SYMBOL", ")")
            return Call(expr.name, args)
        return expr

    def parse_primary(self):
        tok = self.peek()
        if tok.kind == "NUMBER":
            self.advance()
            return NumberLit(tok.value)
        if tok.kind == "STRING":
            self.advance()
            return StringLit(tok.value)
        if self.check("KEYWORD", "true"):
            self.advance()
            return BoolLit(True)
        if self.check("KEYWORD", "false"):
            self.advance()
            return BoolLit(False)
        if tok.kind == "IDENT":
            self.advance()
            return Identifier(tok.value)
        if self.check("SYMBOL", "("):
            self.advance()
            expr = self.parse_expr()
            self.expect("SYMBOL", ")")
            return expr
        raise ParseError(f"Line {tok.line}: unexpected token {tok.kind} {tok.value!r}")


def parse(tokens):
    return Parser(tokens).parse_program()
