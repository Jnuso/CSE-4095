# Assignment 4: Card Game 24

## Purpose

Build two versions of the classic Card Game 24 while practicing an incremental, responsible AI-assisted development process:

1. A command-line Python program.
2. A self-contained, single-user static webpage that runs directly in a browser.

The goal is not only to produce working software. We are expected to describe requirements clearly, evaluate AI-generated suggestions, test the software, identify problems, and guide the AI through improvements.

## Game Rules

- Generate four playing-card values.
- Ace is 1, number cards use their face values, Jack is 11, Queen is 12, and King is 13.
- The player must create an expression equal to 24.
- Only `+`, `-`, `*`, `/`, and parentheses are permitted.
- Every displayed card value must be used exactly once, including duplicate values.
- Some hands may have multiple solutions or no solution.

Example for cards `3 3 8 8`:

```text
8 / (3 - 8 / 3) = 24
```

## Requirements from the Attached Assignment PDF

### Python program: `card24.py`

The command-line program must:

- Randomly generate and clearly display four cards.
- Accept an arithmetic expression from the player.
- Confirm that the expression uses only the permitted operations.
- Confirm that all four generated card values are used exactly once.
- Determine whether the expression evaluates to 24.
- Report correct, incorrect, and invalid input clearly without crashing.
- Avoid blindly evaluating arbitrary input with Python's `eval()`; we must choose and understand a safe evaluation approach.
- Determine whether a given four-card hand has a solution.
- Produce at least one solution when one exists and recognize when no solution exists.
- Systematically explore number arrangements, operators, and parenthesized groupings rather than relying on five separately hard-coded cases.

### Static webpage: `card24.html`

The webpage must:

- Be a single-user static application that runs entirely in the browser.
- Open directly from the HTML file without Flask, Node.js, a web server, a database, or another backend.
- Randomly generate and visually display four cards.
- Let the player enter an arithmetic expression.
- Provide a button to check the expression.
- Verify that the expression evaluates to 24.
- Verify that each displayed card value is used exactly once.
- Clearly report whether the answer is correct.
- Provide a way to generate a new set of cards.
- Include a JavaScript solver capable of finding a solution for the displayed cards.

The solver may be exposed through a feature such as a **Show Solution** button, or it may be used internally to generate only solvable hands. That design choice should be discussed with the AI assistant.

### Vibe-coding process

The PDF expects us to develop the assignment incrementally instead of asking the AI to write the entire solution at once. Topics to discuss with the AI include:

- How to represent cards.
- How to validate the exact multiset of card values, including duplicates.
- How to evaluate expressions safely.
- How to search systematically for solutions.
- How to translate the Python solver into JavaScript.
- How to improve the web interface.

When something fails, we should give the AI the error or observed behavior, ask it to diagnose the problem, and then evaluate the proposed fix.

### Testing expectations

Both versions should be tested with:

- Ordinary valid solutions.
- Duplicate card values.
- Incorrect answers.
- Invalid or malformed expressions.
- Division and parentheses.
- Attempts to use a card too many or too few times.
- Expressions that equal 24 numerically but do not use exactly the displayed cards.
- Many randomly generated hands to exercise the solver.
- Hands that have a solution and hands that have no solution.

The `3 3 8 8` hand is an important regression case: `8 / (3 - 8 / 3)` must be accepted, while expressions using three 8s or only one 3 must be rejected even if they evaluate to 24.

### Reflection content

The PDF requires a short reflection that describes:

- The vibe-coding process used.
- A few example prompts given to the AI.
- One or two problems encountered.
- How those problems were resolved with the AI.
- At least one case where AI-generated work was tested, questioned, or modified.

The reflection should show that we understood, tested, and evaluated the software rather than accepting generated code without review.

## Additional Submission Instructions from the User

The user's message specifies the exact files and link to submit:

- `card24.py`
- `card24.html`
- `reflection.pdf`
- A link to the conversation(s) with the AI agent

The attached PDF calls for a short reflection but does not prescribe the filename or PDF format; the requirement to submit it specifically as `reflection.pdf` comes from the user's message. The conversation-link requirement also comes from the user's message.

## Expected Final Contents of This Folder

```text
Assignment 4/
|-- card24.py
|-- card24.html
|-- reflection.pdf
`-- README.md
```

The AI conversation link will be submitted separately wherever the course submission system requests it.

## Current Status

This README records the requirements before planning or implementation begins. No implementation decisions have been finalized yet.
