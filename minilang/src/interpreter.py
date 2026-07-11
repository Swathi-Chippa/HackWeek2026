"""
Tree-walking interpreter for MiniLang.
Evaluates the AST produced by parser.py directly (no bytecode/VM step).
"""

from ast_nodes import (
    NumberLit, StringLit, BoolLit, Identifier, BinaryOp, UnaryOp, Call,
    LetStmt, AssignStmt, PrintStmt, IfStmt, WhileStmt, ForStmt,
    FuncDef, ReturnStmt, ExprStmt, Program,
)


class MiniLangError(Exception):
    pass


class ReturnSignal(Exception):
    """Internal control-flow signal used to unwind out of a function call."""
    def __init__(self, value):
        self.value = value


class Environment:
    """A single lexical scope, chained to its parent for variable lookup."""

    def __init__(self, parent=None):
        self.vars = {}
        self.parent = parent

    def define(self, name, value):
        self.vars[name] = value

    def get(self, name):
        env = self
        while env is not None:
            if name in env.vars:
                return env.vars[name]
            env = env.parent
        raise MiniLangError(f"Undefined variable '{name}'")

    def set(self, name, value):
        env = self
        while env is not None:
            if name in env.vars:
                env.vars[name] = value
                return
            env = env.parent
        raise MiniLangError(f"Cannot assign to undefined variable '{name}' (use 'let' first)")


class Function:
    def __init__(self, name, params, body, closure):
        self.name = name
        self.params = params
        self.body = body
        self.closure = closure


class Interpreter:
    def __init__(self, output=None):
        # `output` lets callers (tests, the CLI) capture printed lines instead
        # of always writing straight to stdout.
        self.global_env = Environment()
        self._out = output if output is not None else []
        self._use_stdout = output is None

    def emit(self, text):
        if self._use_stdout:
            print(text)
        else:
            self._out.append(text)

    def run(self, program: Program):
        self.exec_block(program.statements, self.global_env)
        return self._out

    # ---- statement execution ----

    def exec_block(self, statements, env):
        for stmt in statements:
            self.exec_stmt(stmt, env)

    def exec_stmt(self, stmt, env):
        if isinstance(stmt, LetStmt):
            env.define(stmt.name, self.eval_expr(stmt.expr, env))
        elif isinstance(stmt, AssignStmt):
            env.set(stmt.name, self.eval_expr(stmt.expr, env))
        elif isinstance(stmt, PrintStmt):
            value = self.eval_expr(stmt.expr, env)
            self.emit(self.stringify(value))
        elif isinstance(stmt, IfStmt):
            if self.truthy(self.eval_expr(stmt.cond, env)):
                self.exec_block(stmt.then_body, Environment(env))
            elif stmt.else_body is not None:
                self.exec_block(stmt.else_body, Environment(env))
        elif isinstance(stmt, WhileStmt):
            while self.truthy(self.eval_expr(stmt.cond, env)):
                self.exec_block(stmt.body, Environment(env))
        elif isinstance(stmt, ForStmt):
            loop_env = Environment(env)
            self.exec_stmt(stmt.init, loop_env)
            while self.truthy(self.eval_expr(stmt.cond, loop_env)):
                self.exec_block(stmt.body, Environment(loop_env))
                self.exec_stmt(stmt.update, loop_env)
        elif isinstance(stmt, FuncDef):
            env.define(stmt.name, Function(stmt.name, stmt.params, stmt.body, env))
        elif isinstance(stmt, ReturnStmt):
            value = self.eval_expr(stmt.expr, env) if stmt.expr is not None else None
            raise ReturnSignal(value)
        elif isinstance(stmt, ExprStmt):
            self.eval_expr(stmt.expr, env)
        else:
            raise MiniLangError(f"Unknown statement node: {stmt}")

    # ---- expression evaluation ----

    def eval_expr(self, expr, env):
        if isinstance(expr, NumberLit):
            return expr.value
        if isinstance(expr, StringLit):
            return expr.value
        if isinstance(expr, BoolLit):
            return expr.value
        if isinstance(expr, Identifier):
            return env.get(expr.name)
        if isinstance(expr, UnaryOp):
            val = self.eval_expr(expr.operand, env)
            if expr.op == "-":
                return -val
            if expr.op in ("!", "not"):
                return not self.truthy(val)
            raise MiniLangError(f"Unknown unary operator '{expr.op}'")
        if isinstance(expr, BinaryOp):
            return self.eval_binary(expr, env)
        if isinstance(expr, Call):
            return self.eval_call(expr, env)
        raise MiniLangError(f"Unknown expression node: {expr}")

    def eval_binary(self, expr, env):
        op = expr.op
        # short-circuit operators
        if op == "&&":
            left = self.eval_expr(expr.left, env)
            if not self.truthy(left):
                return False
            return self.truthy(self.eval_expr(expr.right, env))
        if op == "||":
            left = self.eval_expr(expr.left, env)
            if self.truthy(left):
                return True
            return self.truthy(self.eval_expr(expr.right, env))

        left = self.eval_expr(expr.left, env)
        right = self.eval_expr(expr.right, env)

        if op == "+":
            return left + right
        if op == "-":
            return left - right
        if op == "*":
            return left * right
        if op == "/":
            if right == 0:
                raise MiniLangError("Division by zero")
            result = left / right
            # keep clean integers when both operands are ints and it divides evenly
            if isinstance(left, int) and isinstance(right, int) and left % right == 0:
                return left // right
            return result
        if op == "%":
            return left % right
        if op == "==":
            return left == right
        if op == "!=":
            return left != right
        if op == "<":
            return left < right
        if op == ">":
            return left > right
        if op == "<=":
            return left <= right
        if op == ">=":
            return left >= right
        raise MiniLangError(f"Unknown binary operator '{op}'")

    def eval_call(self, expr, env):
        func = env.get(expr.name)
        if not isinstance(func, Function):
            raise MiniLangError(f"'{expr.name}' is not a function")
        if len(expr.args) != len(func.params):
            raise MiniLangError(
                f"Function '{func.name}' expects {len(func.params)} args, got {len(expr.args)}"
            )
        call_env = Environment(func.closure)
        for param, arg_expr in zip(func.params, expr.args):
            call_env.define(param, self.eval_expr(arg_expr, env))
        try:
            self.exec_block(func.body, call_env)
        except ReturnSignal as ret:
            return ret.value
        return None

    # ---- helpers ----

    @staticmethod
    def truthy(value):
        if value is None:
            return False
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value != 0
        if isinstance(value, str):
            return len(value) > 0
        return True

    @staticmethod
    def stringify(value):
        if value is None:
            return "nil"
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value)
