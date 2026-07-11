"""
AST node definitions for MiniLang.
Plain data classes; the interpreter does the actual work.
"""

class Node:
    pass


# ---- Expressions ----

class NumberLit(Node):
    def __init__(self, value):
        self.value = value


class StringLit(Node):
    def __init__(self, value):
        self.value = value


class BoolLit(Node):
    def __init__(self, value):
        self.value = value


class Identifier(Node):
    def __init__(self, name):
        self.name = name


class BinaryOp(Node):
    def __init__(self, op, left, right):
        self.op = op
        self.left = left
        self.right = right


class UnaryOp(Node):
    def __init__(self, op, operand):
        self.op = op
        self.operand = operand


class Call(Node):
    def __init__(self, name, args):
        self.name = name
        self.args = args


# ---- Statements ----

class LetStmt(Node):
    def __init__(self, name, expr):
        self.name = name
        self.expr = expr


class AssignStmt(Node):
    def __init__(self, name, expr):
        self.name = name
        self.expr = expr


class PrintStmt(Node):
    def __init__(self, expr):
        self.expr = expr


class IfStmt(Node):
    def __init__(self, cond, then_body, else_body):
        self.cond = cond
        self.then_body = then_body
        self.else_body = else_body  # list of statements or None


class WhileStmt(Node):
    def __init__(self, cond, body):
        self.cond = cond
        self.body = body


class ForStmt(Node):
    def __init__(self, init, cond, update, body):
        self.init = init
        self.cond = cond
        self.update = update
        self.body = body


class FuncDef(Node):
    def __init__(self, name, params, body):
        self.name = name
        self.params = params
        self.body = body


class ReturnStmt(Node):
    def __init__(self, expr):
        self.expr = expr


class ExprStmt(Node):
    def __init__(self, expr):
        self.expr = expr


class Program(Node):
    def __init__(self, statements):
        self.statements = statements
