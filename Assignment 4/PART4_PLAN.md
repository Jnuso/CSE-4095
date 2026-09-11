# Part 4 Plan: Web Solver and Solvable-Hand Mode

## Scope

Part 4 extends the existing self-contained `card24.html` game with the solution-search ideas already used in `card24.py`.

This step adds two player-facing capabilities:

1. A **Show solution** button that displays one correct expression for the current hand or explains that no solution exists.
2. A **Solvable only** mode button that ensures newly generated hands have at least one solution while the mode is enabled.

The webpage will remain a single static file with no server, database, packages, or external resources.

## Required Outcome

After this step, the browser game must be able to:

- Determine whether the four displayed cards can make 24.
- Produce at least one correct expression when possible.
- Recognize and report an impossible hand.
- Reveal a solution only when the player requests it.
- Let the player turn solvable-only generation on or off.
- Keep ordinary random generation unchanged while solvable-only mode is off.
- Generate only verified solvable hands while solvable-only mode is on.
- Preserve all existing Part 3 expression checking, keyboard behavior, feedback, responsiveness, and accessibility.

## Solver Design

The JavaScript solver will use the same recursive pair-reduction strategy as the Python solver.

At each recursive step it will:

1. Select two current values.
2. Combine them with every legal operation.
3. Replace the pair with the combined value.
4. Repeat until only one value remains.
5. Return the associated expression if the final exact value is 24.

For two values `a` and `b`, the candidates are:

```text
a + b
a * b
a - b
b - a
a / b    when b is not zero
b / a    when a is not zero
```

Trying different pairs naturally covers every ordering and parenthesization pattern without manually coding five expression-tree shapes.

## Exact Arithmetic

The solver will reuse the existing reduced `BigInt` rational-number representation. Every intermediate result will retain an exact numerator and denominator.

This avoids floating-point errors in solutions such as:

```text
8 / (3 - 8 / 3)
```

The solver succeeds only when its final numerator is exactly 24 times its denominator.

## Tracking Expressions

Each recursive search item will store:

- Its exact rational value.
- The fully parenthesized expression that produced it.

Initial items use the four card values as their expression strings. Combining two items creates a new value and a new expression, ensuring the returned answer uses every original card exactly once.

The final solver expression will contain only syntax already accepted by the Part 3 parser: whole-number card values, `+`, `-`, `*`, `/`, and parentheses.

## Avoiding Repeated Work

The search will memoize numerical states that have already been proven unable to reach 24. A state key will contain the sorted reduced numerator/denominator pairs of all remaining values, including duplicates.

Duplicate results will be removed only within one selected pair. This is safe because two operations on the same pair that produce the same exact value have identical future mathematical possibilities. Results from different pairs must not be merged because their remaining values may differ.

The failed-state cache will be local to one call of the solver, preventing results from one hand from affecting another.

## Show Solution Behavior

The new **Show solution** button will:

- Solve the currently displayed hand only when clicked.
- Display one valid expression followed by `= 24` when a solution exists.
- Display a clear `No solution exists for this hand` message otherwise.
- Place the answer in a separate accessible solution panel so it does not erase feedback about the player's attempted expression.
- Cache the current hand's result so repeated clicks do not repeat the search.
- Hide the old solution whenever new cards are generated.

The solver will not automatically reveal anything during ordinary play.

## Solvable-Only Mode

The new mode control will be an accessible toggle button using `aria-pressed`.

- It begins **Off** whenever the page is opened.
- Turning it **On** immediately deals a new hand that the solver has verified is solvable.
- While it remains on, every press of **New cards** generates and verifies candidates until a solvable hand is found.
- Turning it **Off** keeps the current hand but allows all random hands, including impossible ones, on future deals.
- The button label and visual state will always show whether the mode is on or off.
- The preference lasts only for the current page session and is not saved in browser storage.

Ordinary mode therefore continues to satisfy the requirement for fully random card generation, while the optional mode supports players who prefer guaranteed puzzles.

## New Page State

The existing `currentCards` state will be supplemented by:

```text
solvableOnly       whether filtered generation is enabled
currentSolution    the expression found for this hand, or no solution
solutionChecked    whether the current hand has already been searched
```

Every new hand will reset the solution cache and hide the previous solution panel.

## Planned Interface Changes

### Game toolbar

The top controls will contain:

- **New cards**
- **Solvable only: Off/On**

The controls will wrap cleanly on narrow screens and retain visible keyboard focus indicators.

### Assistance area

A small assistance row below the normal answer feedback will contain:

- A short prompt for a stuck player.
- The **Show solution** button.
- A hidden-by-default solution panel with `aria-live="polite"`.

The solution panel will use text as well as color, so its meaning does not depend on visual styling alone.

## Planned JavaScript Components

### Solution search item

- Store a rational value and its expression string.

### `combineSolutionItems(left, right)`

- Produce all distinct legal exact results for one pair.
- Generate the corresponding parenthesized expressions.
- Skip division by zero.

### Recursive search helper

- Search every unordered pair.
- Stop immediately after finding one valid solution.
- Memoize only fully exhausted failed states.

### `findSolution(cards)`

- Validate the four card values.
- Return one expression string or `null`.

### `getCurrentSolution()`

- Solve the current hand at most once.
- Return the cached expression or cached no-solution result afterward.

### `generateSolvableCards()`

- Generate ordinary random four-card candidates.
- Run the solver on each candidate.
- Return the first candidate with a verified solution.

### Interface handlers

- Reveal the current solution when requested.
- Toggle solvable-only mode and update `aria-pressed`.
- Make **New cards** respect the active mode.
- Reset stale solution output after every deal.

## Testing Plan

### Solver correctness

- `3 3 8 8` must return a solution accepted by `checkAnswer()`.
- `1 2 3 4`, `1 3 4 6`, and `1 5 5 5` must return valid solutions.
- `1 1 1 1`, `2 2 2 2`, and `13 13 13 13` must return no solution.
- Every returned expression must use exactly the supplied cards and evaluate exactly to 24.
- Permuting the same hand must not change whether it is considered solvable.
- Divide-by-zero branches must be skipped without crashing.

### Exhaustive verification

Compare the implementation with a separate exact subset-dynamic-programming reference for all 1,820 unordered rank multisets from 1 through 13. Every solvable/no-solution decision must agree.

### Show Solution interface

- A solution appears only after the button is activated.
- An impossible hand shows the no-solution message.
- Repeated activation reuses the cached result.
- Generating new cards removes the previous answer.
- Normal answer feedback remains visible and independent.

### Solvable-only mode

- The button begins off.
- Turning it on updates its label and `aria-pressed` value.
- Turning it on immediately produces a verified solvable hand.
- Every new hand produced while enabled passes `findSolution()`.
- Turning it off preserves the current cards.
- New hands generated afterward are ordinary unfiltered random hands.

### Regression checks

- All Part 3 expression-validation cases still pass.
- The page still opens directly without a server.
- No external resources or unsafe evaluation calls are introduced.
- The new controls remain usable by keyboard and at narrow widths.

## Questions for Review

The following defaults are implemented and can be changed if you prefer something different:

1. **Persistent toggle or one-time button?** I will make **Solvable only** a persistent mode for the current page session. If you prefer, it could instead generate only one solvable hand per click.
2. **Separate solution panel?** I will keep the revealed answer separate from the player's correctness feedback so one message does not erase the other.
3. **One answer or every answer?** I will display one correct solution, which satisfies the assignment and avoids a long list of equivalent expressions.
4. **Mode persistence after reload?** I will reset solvable-only mode to Off whenever the page is reloaded rather than storing the preference.

## Current Status

Part 4 is implemented in `card24.html`. The web solver agreed with the independently verified totals for all 1,820 unordered four-card rank hands: 1,362 solvable and 458 unsolvable. Every returned expression passed the existing browser expression checker. The solution reveal, no-solution state, solution cache, solvable-only filtering, toggle state, focus behavior, and new-hand resets also passed automated integration checks.
