# Assignment 6 Final Checklist

Use this checklist immediately before uploading the `submission` folder.

## Folder Contents

- [ ] `index.html`, `style.css`, `game.js`, `ai.js`, `app.js`, `README.md`, and `VIBE_LOG.md` are present.
- [ ] `favicon.svg` is present and appears in the browser tab.
- [ ] Every file being submitted is intentional.
- [ ] The full conversation transcript is removed unless the instructor specifically requested it.

## Direct-Open Browser Check

- [ ] Double-click `index.html`; do not start a Python server for this check.
- [ ] The page loads with four hands showing one finger each.
- [ ] The browser console contains no red JavaScript errors.
- [ ] Refreshing the page still loads the game correctly.

## Required Gameplay

- [ ] Playing as Player A works, including an attack and a legal split.
- [ ] Playing as Player B makes the computer move first.
- [ ] Inactive hands cannot attack or be attacked.
- [ ] A legal redistribution can revive a zero hand.
- [ ] A player loses when both hands reach zero.
- [ ] A live game that reaches move 20 ends in the assignment's maximum-depth tie.
- [ ] Restart returns both players to `1 | 1` at level 0.

## AI and Interface

- [ ] The computer uses the DP/minimax move rather than a random move.
- [ ] Player A is labeled MAX and Player B is labeled MIN.
- [ ] The AI Analysis panel can be shown and hidden.
- [ ] The panel shows the current state, role, evaluated moves, values, and selected move.
- [ ] AI vs AI can start, pause, step, and finish.
- [ ] Move History scrolls instead of continually expanding the page.
- [ ] After a completed game, the decision map can review earlier and later moves without changing the final hands, winner, or history.
- [ ] The page remains usable at a narrow phone-sized width and a normal desktop width.

## Documentation and Upload

- [ ] `README.md` explains the rules, state, `nextMoves()`, minimax, bottom-up DP, organization, testing, limitations, extensions, and reflection questions.
- [ ] `VIBE_LOG.md` contains five structured interactions, including debugging or verification.
- [ ] Prompts and AI suggestions in the Vibe Log are direct excerpts rather than rewritten summaries.
- [ ] The submitted folder opens normally after copying it to another location.
- [ ] The final uploaded archive or folder contains the same files that were tested.
