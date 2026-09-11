# Part 3 Plan: Static Web Version

## Scope

This plan covers only Part 3 of the assignment: building a single-user, static browser version of Card Game 24 in `card24.html`.

Part 4's JavaScript solution finder is intentionally excluded from this step. We will add the solver only after the basic web game is implemented, tested, and reviewed.

## Required Outcome

The completed webpage must:

- Generate four random card values.
- Display those cards visually.
- Let the player enter an arithmetic expression.
- Provide a button that checks the expression.
- Determine whether the expression equals 24.
- Verify that every displayed card value is used exactly once.
- Clearly report correct answers, incorrect answers, invalid input, and incorrect card usage.
- Provide a way to generate a new set of cards.
- Run entirely in the browser without a server or backend.
- Open directly by double-clicking `card24.html`.

## Self-Contained File

All HTML, CSS, and JavaScript will be stored inside one file:

```text
card24.html
```

The page will not depend on:

- Flask, Node.js, or another server.
- A database.
- External JavaScript packages.
- External stylesheets or fonts.
- Network access.

This keeps the file portable and satisfies the assignment's direct-browser requirement.

## Proposed Player Experience

When the page opens, it will:

1. Display the title and a short explanation of the rules.
2. Generate four random card values from 1 through 13.
3. Show them as four playing-card-style panels.
4. Provide an expression input field.
5. Provide a **Check Answer** button.
6. Provide a **New Cards** button.
7. Display feedback below the controls without reloading the page.

Pressing Enter while the expression field is focused will also check the answer.

Pressing **New Cards** will generate a completely new random hand, clear the previous expression, clear old feedback, and return focus to the expression input.

## Card Representation

The JavaScript state will store the current hand as four integers from 1 through 13, matching the Python program.

- Ace will display as `A` with a visible value of `1`.
- Values 2 through 10 will display normally.
- Jack will display as `J` with a visible value of `11`.
- Queen will display as `Q` with a visible value of `12`.
- King will display as `K` with a visible value of `13`.

Expression entry will use the numerical values. Showing the numerical value beneath each face-card label will prevent ambiguity.

The values will remain fully random. Part 3 will not filter out hands that have no solution because solution detection belongs to Part 4.

## Visual Design

The approved design is a dark-mode, midnight card-room interface:

- A deep graphite background with restrained violet and lime accents.
- A centered dark game panel with strong contrast.
- Four responsive dark playing cards with rounded corners and layered shadows.
- Large, readable rank labels.
- A clearly labeled expression field.
- Distinct primary and secondary buttons.
- Color-coded result messages for success, ordinary failure, and invalid input.

The layout will fit desktop and mobile-sized browser windows. No images are necessary; the cards can be created entirely with semantic HTML and CSS.

## Safe Expression Evaluation

The page will not use JavaScript's `eval()` or the `Function` constructor. Both can execute arbitrary JavaScript and are inappropriate for untrusted player input.

Instead, the JavaScript will contain a small tokenizer and recursive-descent parser for this exact grammar:

```text
expression = term (("+" | "-") term)*
term       = factor (("*" | "/") factor)*
factor     = integer | "(" expression ")"
```

The parser will:

- Recognize only whole-number values, the four permitted operators, parentheses, and whitespace.
- Apply standard arithmetic precedence.
- Apply parentheses correctly.
- Reject missing operands or operators.
- Reject unmatched parentheses.
- Reject unsupported characters and syntax.
- Reject decimals, variables, function calls, exponentiation, and unary operators.
- Detect division by zero.
- Return both the calculated result and the list of integer card values used.

Rejecting unary `+` and unary `-` keeps the browser rules consistent with the approved Python version. Negative intermediate results remain possible through ordinary subtraction.

## Exact Arithmetic

JavaScript normally calculates with floating-point numbers. That can make a valid expression involving thirds appear slightly above or below 24.

To avoid that issue, calculations use a small rational-number representation containing:

- A `BigInt` numerator.
- A `BigInt` denominator.

Every operation will reduce the fraction using the greatest common divisor. The result equals 24 exactly when:

```text
numerator === 24 * denominator
```

This supports expressions such as `8 / (3 - 8 / 3)` without using a rounding tolerance.

Using `BigInt` keeps all arithmetic exact even when a player enters an unusually large invalid value. The final card-usage check still requires the four displayed values from 1 through 13.

## Verifying Card Usage

The parser will collect every integer literal from the player's expression. The program will compare the frequency of those values with the frequency of the four displayed cards.

This must be a multiset comparison rather than a set comparison so duplicate values are preserved.

For cards `3 3 8 8`:

- `8 / (3 - 8 / 3)` must be accepted.
- `8 + 8 + 8` must be rejected for using the wrong cards.
- `3 * 8` must be rejected for leaving two cards unused.
- `24` must be rejected even though the literal itself equals the target.

When usage is wrong, the feedback should identify missing and extra values just as the Python version does.

## Planned Page Structure

### HTML

The page will contain:

- A main game container.
- A heading and brief instructions.
- A live card-display region.
- A labeled expression form.
- A **Check Answer** submit button.
- A **New Cards** button.
- A result region announced to assistive technology.

Using a form for the expression naturally supports the Enter key.

### CSS

The embedded stylesheet will define:

- Theme colors and reusable spacing values.
- The centered game layout.
- Responsive card sizing and wrapping.
- Input and button focus states.
- Success, error, and neutral feedback styles.
- Small-screen adjustments.
- Reduced-motion behavior where applicable.

### JavaScript state

The page will maintain one main state value:

```text
currentCards = [value1, value2, value3, value4]
```

Generating new cards will replace this array and re-render the interface.

## Planned JavaScript Components

### `randomCardValue()` and `generateCards()`

- Generate four independent integers from 1 through 13.
- Permit duplicate values.

### `formatCard(value)` and `renderCards()`

- Convert numerical face-card values into readable labels.
- Rebuild the four visual cards from `currentCards`.

### Tokenizer

- Read the expression one character at a time.
- Create tokens for integers, operators, and parentheses.
- Ignore whitespace.
- Reject any unsupported character immediately.

### Recursive-descent parser

- Implement the expression, term, and factor grammar.
- Calculate exact rational results.
- Collect all integer tokens used by the player.
- Require the parser to consume the entire input.

### Rational arithmetic helpers

- Normalize signs.
- Reduce fractions with a greatest-common-divisor function.
- Add, subtract, multiply, and divide rational values.
- Reject a zero denominator.

### `sameCardMultiset(usedValues, cards)`

- Compare duplicate-aware frequency counts.
- Provide missing and extra values when the counts differ.

### `checkAnswer(expression, cards)`

- Coordinate parsing, card validation, and comparison with 24.
- Return a structured result rather than directly changing the page.
- Keep the game logic independently testable.

### Interface handlers

- Handle form submission.
- Display the appropriate result message.
- Handle the **New Cards** button.
- Initialize the first hand when the page loads.

## Feedback Behavior

The browser version will distinguish among:

- **Correct:** all cards are used exactly once and the expression equals 24.
- **Incorrect result:** the expression is legal and uses the correct cards but does not equal 24.
- **Wrong cards:** values are missing, added, or repeated incorrectly.
- **Invalid expression:** syntax is malformed or contains unsupported content.
- **Division by zero:** the expression attempts an undefined operation.

The page will remain usable after every result so the player can edit and check another expression or request new cards.

## Accessibility and Usability

The implementation will include:

- A real label associated with the expression input.
- Keyboard-accessible buttons.
- Visible keyboard focus indicators.
- An `aria-live` result area for feedback.
- Sufficient color contrast.
- Feedback communicated with text, not color alone.
- Responsive sizing without horizontal scrolling.
- A useful example expression in the instructions.

## Testing Plan

The calculation and validation logic will be kept separate from the interface so it can be tested with fixed hands.

At minimum, we will test:

| Cards | Expression | Expected result |
|---|---|---|
| `3 3 8 8` | `8 / (3 - 8 / 3)` | Correct |
| `3 3 8 8` | `8 + 8 + 3 + 3` | Valid cards, but not 24 |
| `3 3 8 8` | `8 + 8 + 8` | Wrong card usage |
| `3 3 8 8` | `24` | Wrong card usage |
| `1 2 3 4` | `1 * 2 * 3 * 4` | Correct |
| `1 2 3 4` | `(1 + 3) * (2 + 4)` | Correct |
| `1 2 2 3` | `1 / (2 - 2) + 3` | Division by zero handled safely |
| `1 2 3 4` | `2 ** 3 + 4 + 1` | Rejected unsupported syntax |
| `1 2 3 4` | `(1 + 2` | Rejected malformed expression |
| `1 2 3 4` | `alert(1)` | Rejected function call |

We will also verify:

- Four values appear on every new hand.
- Every generated value is between 1 and 13.
- Duplicate card values display and validate correctly.
- Enter submits the form.
- **New Cards** resets all previous round state.
- Repeated checks do not reload the page.
- The page works when opened directly from the filesystem.
- The layout remains usable at desktop and mobile widths.
- No external resources or network requests are required.

## Manual Visual Review

After functional tests pass, the page will be opened in a browser and inspected for:

- Card alignment and consistent sizing.
- Readable text and strong contrast.
- Clear hover and focus behavior.
- Correct wrapping on narrow screens.
- Feedback that is noticeable without shifting the layout excessively.
- No browser-console errors.

## Reviewed Decisions

1. Use the dark-mode, midnight card-room visual theme described above.
2. Display face-card labels and their numeric input values together.
3. Use a custom parser and exact rational arithmetic rather than `eval()` or floating-point tolerance.
4. Keep unary operators rejected for consistency with `card24.py`.
5. Keep all HTML, CSS, and JavaScript embedded in the single `card24.html` file.
6. Keep Part 4's **Show Solution** feature out of this implementation step.

## Current Status

Part 3 is implemented in the self-contained `card24.html`. The parser, exact arithmetic, validation outcomes, random generation, and interface state changes passed automated local tests. Static inspection confirmed that the file has no external resources or unsafe evaluation calls. Interactive visual inspection could not be completed because browser-preview access was declined, so final appearance should also be reviewed by opening the file directly in a browser. The later Part 4 solver and assistance controls are documented separately in `PART4_PLAN.md`.
