"""Evaluate arithmetic with a numbers stack and an operators stack.

Run ``python expression_evaluator.py`` and enter an expression when prompted.
An expression may also be supplied as a quoted command-line argument:
``python expression_evaluator.py "2 * -(3 + 4)"``.

Supported: decimal numbers, +, -, *, /, parentheses, and unary + and -.
Numbers and results use Python floats; ordinary floating-point rounding applies.
No eval(), expression-evaluation library, or conversion to postfix is used.
"""

import math
import sys


class ExpressionError(ValueError):
    """An understandable error in an arithmetic expression."""


def tokenize(expression: str) -> list[str]:
    """Read whole decimal numbers and single-character operators/parentheses.

    Whitespace separates tokens, so ``1 2`` remains two numbers and is rejected
    later instead of being silently combined into ``12``.
    """
    tokens = []
    index = 0
    while index < len(expression):
        char = expression[index]
        if char.isspace():
            index += 1
        elif char in "0123456789.":
            start = index
            while index < len(expression) and expression[index] in "0123456789.":
                index += 1
            number = expression[start:index]
            if number == "." or number.count(".") > 1:
                raise ExpressionError(
                    f"Invalid number {number!r} at position {start + 1}."
                )
            tokens.append(number)
        elif char in "+-*/()":
            tokens.append(char)
            index += 1
        else:
            raise ExpressionError(
                f"Unexpected character {char!r} at position {index + 1}."
            )
    return tokens


def precedence(operator: str) -> int:
    """Unary signs bind most tightly; '(' blocks reductions until its ')'."""
    if operator in ("u+", "u-"):
        return 3
    if operator in ("*", "/"):
        return 2
    if operator in ("+", "-"):
        return 1
    return 0


def apply_operator(numbers: list[float], operators: list[str]) -> None:
    """Pop one operator and its operand(s), then push the computed value."""
    if not operators:
        raise ExpressionError("An operator is missing.")
    operator = operators.pop()

    if operator in ("u+", "u-"):
        if not numbers:
            raise ExpressionError("A unary sign needs a number or parentheses.")
        operand = numbers.pop()
        result = operand if operator == "u+" else -operand
    else:
        if operator not in ("+", "-", "*", "/"):
            raise ExpressionError("Mismatched parentheses.")
        if len(numbers) < 2:
            raise ExpressionError(f"Operator {operator!r} needs two operands.")
        # The top value is the RIGHT operand; order matters for - and /.
        right = numbers.pop()
        left = numbers.pop()
        if operator == "+":
            result = left + right
        elif operator == "-":
            result = left - right
        elif operator == "*":
            result = left * right
        else:
            if right == 0:
                raise ExpressionError("Division by zero is not allowed.")
            result = left / right

    if not math.isfinite(result):
        raise ExpressionError("The result is too large for finite float arithmetic.")
    numbers.append(result)


def evaluate(expression: str) -> float:
    """Evaluate infix input directly using exactly two calculation stacks.

    ``expect_operand`` distinguishes unary signs from binary operators and
    rejects missing operators, empty parentheses, and incomplete expressions.
    """
    tokens = tokenize(expression)
    if not tokens:
        raise ExpressionError("Enter an expression.")

    numbers: list[float] = []
    operators: list[str] = []
    expect_operand = True

    for token in tokens:
        if token[0] in "0123456789.":
            if not expect_operand:
                raise ExpressionError("Missing operator before a number.")
            number = float(token)
            if not math.isfinite(number):
                raise ExpressionError("A number is too large for finite float arithmetic.")
            numbers.append(number)
            expect_operand = False

        elif token == "(":
            if not expect_operand:
                raise ExpressionError("Missing operator before '('.")
            operators.append(token)

        elif token == ")":
            if expect_operand:
                raise ExpressionError("Expected a number or '(' before ')'.")
            while operators and operators[-1] != "(":
                apply_operator(numbers, operators)
            if not operators:
                raise ExpressionError("Closing ')' has no matching '('.")
            operators.pop()  # Discard the matching opening parenthesis.
            # The group is now one value, ready for signs such as -(2 + 3).
            while operators and operators[-1] in ("u+", "u-"):
                apply_operator(numbers, operators)
            expect_operand = False

        elif expect_operand:
            if token not in ("+", "-"):
                raise ExpressionError(f"Expected a number, unary sign, or '(' before {token!r}.")
            # At the start, after '(' or an operator, + and - are unary.
            # Push without reducing another unary sign: --2 means -(-2).
            operators.append("u" + token)

        else:
            # >= makes binary operators of equal precedence left-associative.
            # Parentheses act as barriers, so only this group is reduced.
            while (
                operators
                and operators[-1] != "("
                and precedence(operators[-1]) >= precedence(token)
            ):
                apply_operator(numbers, operators)
            operators.append(token)
            expect_operand = True

    if expect_operand:
        raise ExpressionError("The expression ends before an operand is provided.")

    while operators:
        if operators[-1] == "(":
            raise ExpressionError("Opening '(' has no matching ')'.")
        apply_operator(numbers, operators)

    if len(numbers) != 1:
        raise ExpressionError("The expression must produce exactly one result.")
    return numbers[0]


def main() -> int:
    """Read one expression and report its result or a friendly error."""
    try:
        if len(sys.argv) > 1:
            expression = " ".join(sys.argv[1:])
        else:
            expression = input("Enter an arithmetic expression: ")
        result = evaluate(expression)
    except ExpressionError as error:
        print(f"Error: {error}")
        return 1
    except (EOFError, KeyboardInterrupt):
        print("\nInput cancelled.")
        return 1
    print(f"Result: {result}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
