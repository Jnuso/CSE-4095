# Part 2 Plan: Python Solution Finder

## Scope

This plan covers only Part 2 of the Python assignment: teaching `card24.py` to determine whether a four-card hand can make 24 and to produce at least one valid expression when a solution exists.

The static web version and JavaScript solver are not part of this step. The existing Part 1 parser, safety rules, card generator, and answer checker will remain in place.

## Required Outcome

For any list of four card values, the Python program will return one of two outcomes:

- A valid expression that uses all four values exactly once and evaluates to 24.
- A clear result indicating that no solution exists.

Examples:

```text
Cards: 3 3 8 8
Solution: 8 / (3 - 8 / 3) = 24
```

```text
Cards: 1 1 1 1
No solution exists.
```

## Proposed Mathematical Approach

Use recursive pair reduction rather than manually generating every number permutation, every operator sequence, and five separate parenthesis patterns.

At each stage, the solver will:

1. Select two of the remaining values.
2. Combine them with each permitted operation.
3. Replace the selected pair with the calculated result.
4. Repeat with the shorter list.
5. Succeed when the only remaining value is exactly 24.

For two values `a` and `b`, the solver will consider:

```text
a + b
a * b
a - b
b - a
a / b    when b is not zero
b / a    when a is not zero
```

Addition and multiplication need only one ordering because they are commutative. Subtraction and division require both orderings.

Reducing pairs in different orders naturally explores every binary-expression-tree shape, so the five possible parenthesization patterns do not need to be hard-coded.

## Exact Arithmetic

Every intermediate value will use Python's `fractions.Fraction` class.

This is important because a valid expression may depend on values such as `1/3`. Floating-point arithmetic could turn an exact answer into `23.999999999999996` and incorrectly reject it. With fractions, the final value can be compared exactly with 24; no tolerance or rounding rule is necessary.

## Tracking the Solution Expression

Each item in the recursive search will contain:

- Its exact numerical value.
- A string showing the expression that produced it.

The four initial expression strings will simply be the four card values. Whenever two items are combined, the solver will create both the new exact value and a fully parenthesized expression string.

For example, one successful search path for `3 3 8 8` is:

```text
8 / 3             -> 8/3
3 - (8 / 3)       -> 1/3
8 / (3 - 8 / 3)   -> 24
```

The complete expression can then be returned to the player.

## Avoiding Repeated Work

The solver will use a canonical state made from the sorted exact values currently remaining. This means states such as `[3, 8, 1/3]` and `[1/3, 3, 8]` are recognized as the same mathematical state.

States already proven unable to reach 24 will be stored in a set. If the search reaches one of those states again, that branch can stop immediately. Duplicate results created while combining the same pair will also be skipped.

This remains an exhaustive search, so it will not miss valid expressions, but it avoids much of the redundant work of a naive brute-force implementation.

## Planned Code Changes

### Solution item representation

Introduce a small internal representation containing an exact `Fraction` value and its corresponding expression string.

### `find_solution(cards)`

- Accept a list of four integer card values.
- Reject input that does not contain exactly four values from 1 through 13.
- Convert them into initial solution items.
- Start the recursive search.
- Return an expression string when a solution is found.
- Return `None` when every reachable state has been explored without reaching 24.

### Recursive search helper

- Stop when one value remains.
- Test whether that value is exactly 24.
- Select every unordered pair of current items.
- Generate all valid arithmetic results for the pair.
- Skip division by zero.
- Recurse after replacing the pair with each result.
- Return immediately after finding the first solution.
- Record an exhausted numerical state so it is not searched again.

### Command-line integration

The solver will be added without weakening or replacing Part 1. The current game will still generate cards, accept the player's expression, and check it safely.

After checking the player's attempted answer, the program will ask whether the player wants to see a solution. If the player answers yes, the program will display one solution or report that the hand has no solution.

The cards will remain fully random. The program will not discard an unsolvable hand and generate a replacement. This preserves the assignment's random-generation behavior and allows the player to encounter both solvable and unsolvable hands naturally.

All required Python functionality will remain in `card24.py`. We will not create a separate solver test file for submission. Solver checks can be run from temporary test commands during development so that the final submitted Python program stays self-contained.

## Correctness Rules

The solver must:

- Use every input card value exactly once.
- Preserve duplicate values as separate cards.
- Use only `+`, `-`, `*`, and `/`.
- Never divide by zero.
- Use exact arithmetic.
- Return only an expression that the existing Part 1 checker also accepts as correct.
- Correctly return `None` for hands with no solution.

Passing a solver result back through `check_answer()` gives us an independent consistency check between the solver and the player's expression validator.

## Testing Plan

Automated tests will include at least:

| Cards | Expected behavior |
|---|---|
| `3 3 8 8` | Find a solution that passes `check_answer()` |
| `1 2 3 4` | Find a solution that passes `check_answer()` |
| `5 5 5 1` | Find `(5 - 1 / 5) * 5` or another valid solution |
| `1 1 1 1` | Return no solution |
| Additional candidate hands | Verify both solvable and unsolvable outcomes during testing |
| `13 13 13 13` | Complete the exhaustive search and validate whichever result is returned |

We will also test many randomly generated hands. For every expression returned by the solver, the Part 1 checker must confirm that it uses the original cards exactly once and evaluates to 24.

The no-solution examples will be verified by the exhaustive search rather than assumed from intuition.

These tests will be executed during development without adding another required submission file. The final Python deliverable will be the self-contained `card24.py` specified by the assignment.

## Performance Expectations

Only four starting values are involved, so the search space is small. Pair reduction plus duplicate suppression and failed-state memoization should solve individual hands nearly instantly on a normal computer.

A larger random test will record how many hands are solvable and confirm that the solver handles both solvable and unsolvable inputs reliably. Performance optimization beyond what is needed for four cards is outside this assignment's scope.

## Documentation and Reflection Notes

During implementation, we should preserve evidence useful for the final reflection:

- Why pair reduction was chosen instead of hard-coded parenthesis cases.
- Why exact fractions were used instead of floating-point comparisons.
- How duplicate cards and repeated search states were handled.
- At least one solver result checked independently by `check_answer()`.
- Any bug or unexpected case discovered during testing and how it was corrected.

## Current Status

The design decisions were reviewed and approved, and Part 2 is now implemented in `card24.py`. The implementation was checked against an independent exact-arithmetic subset solver for all 1,820 distinct four-card rank multisets. All solvability results agreed, and every returned expression passed the Part 1 expression and card-usage checker.

## Reviewed Decisions

1. Keep the original randomly generated hand even when it has no solution.
2. Ask the player whether they want to see a solution after checking their answer.
3. Keep all functionality required for submission in `card24.py`; do not create a separate solver-test submission file.
