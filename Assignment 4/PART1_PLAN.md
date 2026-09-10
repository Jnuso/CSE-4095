# Part 1 Plan: Python Command-Line Game

## Scope

This plan covers only Part 1 of the assignment: the playable command-line version of Card Game 24 in `card24.py`.

Part 2's automatic solution finder is intentionally excluded for now. We will design and add the solver only after Part 1 is implemented, tested, and reviewed.

## Intended Player Experience

When the program starts, it will:

1. Randomly generate four card values.
2. Display the cards clearly.
3. Ask the player to enter an arithmetic expression that equals 24.
4. Check whether the expression is legal and uses exactly the displayed cards.
5. Evaluate the expression safely.
6. Explain whether the answer is correct, incorrect, or invalid.

The first version will run one round and then exit. A replay loop can be added later if desired, but it is not necessary for the Part 1 requirements.

## Design Decisions

### Card representation

Generate four independent integer values from 1 through 13.

- `1` represents an Ace.
- `2` through `10` represent number cards.
- `11`, `12`, and `13` represent Jack, Queen, and King.
- Duplicate values are allowed, as they would be in a real deck.

This is simpler than modeling suits and a complete 52-card deck because suits do not affect the arithmetic game. It still reflects the possible values and duplicates of real cards.

Internally, the cards will remain integers. We can display face-card labels alongside their values if that does not make expression entry confusing.

### Permitted expression language

The player's expression may contain only:

- Integer card values.
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Parentheses.
- Whitespace.

The program will reject names, function calls, attributes, strings, exponentiation, floor division, modulo, lists, and all other Python syntax.

Unary `+` and unary `-` will initially be rejected. Negative intermediate results will still be allowed through ordinary subtraction, such as `(3 - 8)`. Rejecting unary operators keeps the accepted language closely aligned with the assignment's permitted binary operations and makes card-use validation unambiguous.

### Safe evaluation

The program will not use `eval()` on the player's text.

Instead, it will:

1. Parse the expression with Python's `ast` module.
2. Walk the resulting syntax tree.
3. Accept only integer literals and the four permitted binary operators.
4. Calculate the result itself during that tree traversal.

This provides the convenience of Python's parser without executing arbitrary Python code.

### Exact arithmetic

Calculations will use `fractions.Fraction` instead of floating-point numbers.

This prevents rounding errors with expressions such as:

```text
8 / (3 - 8 / 3)
```

The final value can therefore be compared exactly with `24`.

### Verifying card usage

While walking the parsed expression, the program will collect every integer literal used by the player. It will compare their frequency counts with the frequency counts of the four generated cards.

For example, with cards `3 3 8 8`:

- `8 / (3 - 8 / 3)` uses the correct multiset and is eligible for evaluation.
- `8 + 8 + 8` is rejected because it uses too many 8s and omits both 3s.
- `3 * 8` is rejected because it leaves two cards unused.

Using frequency counts rather than sets is essential because a set would lose duplicate-card information.

## Planned Program Structure

The code will be separated into small functions so each responsibility can be understood and tested independently.

### `generate_cards()`

- Return a list containing four random integers from 1 through 13.

### `format_card(value)`

- Convert `1`, `11`, `12`, and `13` into readable face-card labels if we choose to show them.
- Preserve the numerical value needed for expression entry.

### `parse_and_evaluate(expression)`

- Parse the input into an AST.
- Reject unsupported syntax.
- Recursively calculate an exact `Fraction` result.
- Collect and return the integer literals used in the expression.
- Detect division by zero and report it as invalid input.

### `validate_card_usage(used_values, cards)`

- Compare the two multisets with `collections.Counter`.
- Return whether the player used every generated card exactly once.
- Provide information that can support a useful error message.

### `check_answer(expression, cards)`

- Coordinate parsing, validation, and result checking.
- Distinguish among these outcomes:
  - Correct expression using all four cards and equaling 24.
  - Legal expression using all four cards but not equaling 24.
  - Wrong card usage.
  - Invalid or unsupported syntax.
  - Division by zero.

### `main()`

- Generate and display the hand.
- Prompt for one expression.
- Print the appropriate result message.

The normal Python entry-point guard will call `main()`:

```python
if __name__ == "__main__":
    main()
```

## Error-Handling Behavior

Invalid input should never cause an uncaught traceback during normal play. The program will give a concise explanation for inputs such as:

- An empty expression.
- Missing or mismatched parentheses.
- Division by zero.
- Decimal values such as `3.5`.
- Unsupported operators such as `**`, `//`, or `%`.
- Letters, variables, or function calls.
- Too many or too few card values.
- The correct numerical result produced with the wrong cards.

We will keep detailed programming exceptions internal and present clear player-facing messages.

## Testing Plan for Part 1

The core functions will be written so that tests can pass a fixed hand rather than depending on random cards.

At minimum, we will test:

| Cards | Expression | Expected result |
|---|---|---|
| `3 3 8 8` | `8 / (3 - 8 / 3)` | Correct |
| `3 3 8 8` | `8 + 8 + 3 + 3` | Valid cards, but not 24 |
| `3 3 8 8` | `8 + 8 + 8` | Wrong card usage |
| `3 3 8 8` | `24` | Wrong card usage |
| `1 2 3 4` | `1 * 2 * 3 * 4` | Correct |
| `1 2 3 4` | `(1 + 3) * (2 + 4)` | Correct |
| `1 2 2 3` | `1 / (2 - 2) + 3` | Division by zero, handled safely |
| `1 2 3 4` | `__import__('os')` | Rejected unsupported syntax |
| `1 2 3 4` | `2 ** 3 + 4 + 1` | Rejected unsupported operator |
| `1 2 3 4` | `(1 + 2` | Rejected malformed expression |

We will also test generated hands to verify that:

- Exactly four values are produced.
- Every value is between 1 and 13.
- Duplicate values are accepted.

## Review Questions Before Coding

Please review these choices in particular:

1. Should the first version play one round and exit, or continue offering new rounds until the user quits?
2. Should face cards be displayed as `A`, `J`, `Q`, and `K` with their numerical values, or simply as numbers from 1 to 13?
3. Is rejecting unary `+` and unary `-` acceptable, given that subtraction can still create negative intermediate values?

## Implementation Status

This plan was approved and implemented in `card24.py`. The listed core cases, invalid-input cases, face-card formatting, and 1,000 generated hands passed the initial test run. Part 2 remains intentionally unimplemented.
