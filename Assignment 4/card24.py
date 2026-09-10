"""Command-line version of Card Game 24 (Assignment 4, Part 1).

The player receives four card values and enters an arithmetic expression that
attempts to make 24. Expressions are parsed with ``ast`` and evaluated by this
program; arbitrary Python code is never passed to ``eval``.
"""

from __future__ import annotations

import ast
from collections import Counter
from dataclasses import dataclass
from fractions import Fraction
import random
import re


TARGET = Fraction(24)
MAX_EXPRESSION_LENGTH = 200
ALLOWED_CHARACTERS = re.compile(r"^[0-9+\-*/()\s]+$")


class InvalidExpressionError(ValueError):
    """Raised when a player's expression is malformed or unsupported."""


@dataclass(frozen=True)
class AnswerResult:
    """The outcome returned after checking one attempted answer."""

    status: str
    message: str
    value: Fraction | None = None

    @property
    def is_correct(self) -> bool:
        return self.status == "correct"


def generate_cards(rng: random.Random | None = None) -> list[int]:
    """Return four independently generated card values from 1 through 13."""

    number_generator = rng if rng is not None else random
    return [number_generator.randint(1, 13) for _ in range(4)]


def format_card(value: int) -> str:
    """Format a card value, showing both the label and value for face cards."""

    face_cards = {
        1: "A (1)",
        11: "J (11)",
        12: "Q (12)",
        13: "K (13)",
    }
    return face_cards.get(value, str(value))


def _evaluate_node(node: ast.AST) -> tuple[Fraction, list[int]]:
    """Safely evaluate an approved AST node and collect its integer literals."""

    if isinstance(node, ast.Constant):
        # bool is a subclass of int, so an exact type check is intentional.
        if type(node.value) is not int:
            raise InvalidExpressionError(
                "Only whole-number card values may appear in the expression."
            )
        return Fraction(node.value), [node.value]

    if not isinstance(node, ast.BinOp):
        raise InvalidExpressionError(
            "Use only card values, +, -, *, /, and parentheses."
        )

    if not isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div)):
        raise InvalidExpressionError(
            "Only +, -, *, and / are permitted arithmetic operators."
        )

    left_value, left_cards = _evaluate_node(node.left)
    right_value, right_cards = _evaluate_node(node.right)

    if isinstance(node.op, ast.Add):
        result = left_value + right_value
    elif isinstance(node.op, ast.Sub):
        result = left_value - right_value
    elif isinstance(node.op, ast.Mult):
        result = left_value * right_value
    else:
        if right_value == 0:
            raise InvalidExpressionError("Division by zero is not allowed.")
        result = left_value / right_value

    return result, left_cards + right_cards


def parse_and_evaluate(expression: str) -> tuple[Fraction, list[int]]:
    """Parse and safely evaluate an expression using exact fraction arithmetic."""

    expression = expression.strip()
    if not expression:
        raise InvalidExpressionError("Please enter an expression.")
    if len(expression) > MAX_EXPRESSION_LENGTH:
        raise InvalidExpressionError("The expression is too long.")
    if ALLOWED_CHARACTERS.fullmatch(expression) is None:
        raise InvalidExpressionError(
            "Use only whole-number card values, +, -, *, /, and parentheses."
        )

    try:
        parsed = ast.parse(expression, mode="eval")
    except (SyntaxError, RecursionError) as error:
        raise InvalidExpressionError(
            "The expression is not valid arithmetic. Check its operators and parentheses."
        ) from error

    return _evaluate_node(parsed.body)


def validate_card_usage(used_values: list[int], cards: list[int]) -> bool:
    """Return whether the expression uses exactly the generated card multiset."""

    return Counter(used_values) == Counter(cards)


def _format_value(value: Fraction) -> str:
    """Format an exact value as an integer or a reduced fraction."""

    if value.denominator == 1:
        return str(value.numerator)
    return f"{value.numerator}/{value.denominator}"


def _format_value_list(values: list[int]) -> str:
    return ", ".join(str(value) for value in sorted(values))


def _card_usage_message(used_values: list[int], cards: list[int]) -> str:
    """Explain which required card values are missing or used in excess."""

    expected = Counter(cards)
    received = Counter(used_values)
    missing = list((expected - received).elements())
    extra = list((received - expected).elements())

    details: list[str] = []
    if missing:
        details.append(f"missing: {_format_value_list(missing)}")
    if extra:
        details.append(f"extra: {_format_value_list(extra)}")

    explanation = "; ".join(details)
    return f"Use each displayed card exactly once ({explanation})."


def check_answer(expression: str, cards: list[int]) -> AnswerResult:
    """Validate one expression and return a player-facing result."""

    try:
        value, used_values = parse_and_evaluate(expression)
    except InvalidExpressionError as error:
        return AnswerResult("invalid", f"Invalid expression: {error}")

    if not validate_card_usage(used_values, cards):
        return AnswerResult(
            "wrong_cards",
            _card_usage_message(used_values, cards),
            value,
        )

    formatted_value = _format_value(value)
    if value == TARGET:
        return AnswerResult("correct", "Correct! Your expression equals 24.", value)

    return AnswerResult(
        "incorrect",
        f"That expression equals {formatted_value}, not 24. Try again next round!",
        value,
    )


def main() -> None:
    """Run one command-line round of Card Game 24."""

    cards = generate_cards()

    print("Card Game 24")
    print("Use each card value exactly once with +, -, *, /, and parentheses.")
    print("Face cards use the numerical values shown.")
    print()
    print("Your cards:", "   ".join(format_card(card) for card in cards))

    try:
        expression = input("Enter an expression: ")
    except (EOFError, KeyboardInterrupt):
        print("\nGame cancelled.")
        return

    result = check_answer(expression, cards)
    print(result.message)


if __name__ == "__main__":
    main()
