# Chopsticks AI Web Game

## Overview

This project turns the supplied Python Chopsticks reference into a single-page
HTML, CSS, and JavaScript game. A person can play as Player A or Player B, or
watch the autonomous demonstration. The browser uses the same attack,
redistribution, and ending rules as the starter code.

The computer is not random. It uses a complete, bottom-up dynamic-programming
minimax table with a fixed depth of 20 moves. Player A is the maximizing player
and Player B is the minimizing player. The interface displays both players'
hands, guides the user through legal actions, and includes an AI Analysis panel
that explains the computer's evaluation.

The browser application is the required product. The Python version and its
tests remain in the project as a reference implementation and parity check.

## Running the Web Game

From the `Assignment 6` directory, start a static web server:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/) in a modern browser.
Stop the server with `Ctrl+C` when finished.

Opening `index.html` directly with a `file:` URL may prevent JavaScript modules
from loading. The local server avoids that browser restriction. The project
does not require a database, backend, account, or internet service.

The supplemental Python command-line version can be run with:

```powershell
python .\chopsticks.py
```

## Game Rules

The starter program is authoritative for this project. Its rules are:

1. Player A and Player B begin with `1 | 1` fingers.
2. Player A moves first. The players alternate, and one attack or
   redistribution counts as one move.
3. To attack, the current player selects one active hand and taps one active
   opponent hand. The source value is added to the target value.
4. If that sum is 5 or greater, the target is knocked out and becomes `0`.
   Values do not wrap around.
5. A `0` hand cannot attack and cannot be attacked.
6. Instead of attacking, a player may transfer fingers between their own
   labeled hands. The total must stay the same, both resulting values must be
   from 0 through 4, and the move must do more than merely swap the left and
   right values. Redistribution may revive a `0` hand or leave a hand at `0`.
7. A player loses immediately when both of their hands are `0`.
8. The assignment game has a 20-move search horizon. If level 20 is reached
   and neither player has been eliminated, the game ends in a tie.

The knockout check takes priority at level 20. Therefore, a player who loses
their second hand on move 20 loses; the result is not a tie.

More examples and rule details are available in [RULES.md](RULES.md).

## State Representation

JavaScript represents a state as:

```javascript
[[aLeft, aRight], [bLeft, bRight], level]
```

For example:

```javascript
[[1, 3], [0, 2], 7]
```

means that A has `1 | 3`, B has `0 | 2`, and seven moves have been played.
The level determines both the turn and the number of moves remaining:

- An even level is Player A's turn, so A chooses the maximum value.
- An odd level is Player B's turn, so B chooses the minimum value.
- `20 - level` is the number of moves remaining in the assignment horizon.

Hands are ordered and labeled. Consequently, `0 | 2` and `2 | 0` are distinct
states even though they contain the same total number of fingers. A DP key
includes all four hand values and the absolute level because the same hands
can have a different result when a different number of moves remains.

## `overflowSum()` and `nextMoves()`

`overflowSum(a, b)` implements an attack result. It returns `a + b` when the
sum is below 5 and returns `0` when the sum is 5 or greater.

`legalMoves(state, depth)` is the single source of truth for attacks and
redistributions. It:

1. Determines the actor from the level's parity.
2. Generates every attack between a nonzero source and nonzero target.
3. Generates every starter-compatible redistribution by transferring one or
   more fingers from one labeled hand to the other.
4. Rejects out-of-range results, unchanged results, and pure left/right swaps.
5. Removes duplicate successors and advances the level by one.
6. Returns no successors after a knockout or at the depth-20 boundary.

`nextMoves(state, depth)` presents the same engine output as successor states.
The AI and interface both use this move generator. The interface does not
maintain a second copy of the game rules, so a redistribution shown to the
user is legal for exactly the same reason that it is legal to the minimax AI.

## Minimax Values

Every state receives a value from Player A's perspective:

| Value | Meaning |
|---:|---|
| `+1` | A can force a win within the remaining moves. |
| `0` | Neither player can force a win before the depth-20 boundary. |
| `-1` | B can force a win within the remaining moves. |

At an even level, A selects the legal successor with the greatest value. At
an odd level, B selects the successor with the smallest value. This models
both players making optimal decisions. Equal-valued choices use stable move
ordering so tests and demonstrations remain reproducible.

The terminal/base values are:

- A has `0 | 0`: `-1`
- B has `0 | 0`: `+1`
- Both players are alive at level 20: `0`

## Bottom-Up Dynamic Programming

`bestMoveDP(20)` builds the entire table from the deepest level back to the
opening instead of recursively rebuilding the same subtrees:

```text
for level from 20 down to 0:
    for every A-left, A-right, B-left, and B-right value from 0 to 4:
        if A is knocked out, store -1
        else if B is knocked out, store +1
        else if level is 20, store 0
        else:
            generate legal successor states
            look up their already-computed values at level + 1
            store MAX(successors) on A's turn
            store MIN(successors) on B's turn
            also store the selected move
```

Each of the four hands has five possible values, producing at most
`5^4 = 625` hand configurations at one level. Levels 0 through 20 produce at
most `625 × 21 = 13,125` entries. This complete table is small for a browser,
and every repeated state/level combination is evaluated once.

The reverse traversal is essential: while evaluating level 19, every needed
level-20 value must already exist. A forward traversal would ask for child
values that had not yet been computed.

`bestMove(state, table)` retrieves the stored optimal move. The AI Analysis
panel uses `evaluateMoves(state, table)` to display all legal candidates and
their minimax values, and `outcomeLabel(score)` translates the numeric value
to `WIN`, `TIE`, or `LOSS` from A's perspective.

## Interface and AI Analysis

The interface provides:

- Large visual hands for A and B, with finger counts and knocked-out styling
- Choice of playing first as A or second as B
- Direct hand selection for attacks
- Redistribution choices generated by the rules engine
- Move number, moves remaining, whose turn it is, and game result
- Restart/New Game controls
- Computer thinking, selection, tap, knockout, and turn-change feedback
- Autonomous A-versus-B controls in Game Setup with clearly labeled start,
  pause, single-move, and speed controls
- A roomy, fixed-height move history that scrolls instead of expanding the page
- A show/hide AI Analysis panel with a beginner summary and optional advanced
  calculation details
- An interactive move tree showing the route already played, the current node,
  every legal next branch, its effect on the hands, and the opponent's replies
- Completed-game review controls for moving backward and forward through the
  played route without changing the final hands, winner, or history
- A live DP Statistics panel showing table size, build time, current level,
  remaining moves, legal branches, and the active MAX/MIN role

The always-visible AI summary answers three beginner questions: what result is
expected, whose decision it is, and which move the AI prefers. The collapsed
advanced section then reports the complete state, MAX/MIN role, numeric score
key, every legal move considered, each successor's minimax value, and the
highlighted selection. Both views explain the same depth-20 table that actually
chooses the move.

The Move Tree stays deliberately bounded: it shows the actual played route,
the current state, every immediate legal move, and one reply layer for the
selected branch. Selecting a branch is a preview only and does not change the
game. This makes alternatives visible without attempting to render the
exponentially larger collection of every path through all 20 levels at once.
After a game ends, each node in the played route becomes selectable and
Previous, Next, and Return to final controls appear. The map then evaluates the
selected historical position and marks the branch that was actually played.
This is a review cursor only: the main board, final result, history, and DP
Statistics continue to describe the completed game.

## Software Organization

```text
Assignment 6/
|-- index.html                 # Single-page interface and semantic structure
|-- favicon.svg                # Crossed-chopsticks browser-tab icon
|-- style.css                  # Responsive design and animations
|-- game.js                    # State validation, rules, and move generation
|-- ai.js                      # Depth-20 DP, minimax, and analysis helpers
|-- app.js                     # Rendering, controls, and turn coordination
|-- README.md                  # Setup, design, testing, and reflections
|-- VIBE_LOG.md                # Record of meaningful AI-assisted work
|-- chopsticks.py              # Supplemental Python reference and CLI
|-- test_web_game.mjs          # JavaScript engine and interface regressions
|-- test_chopsticks.py         # Dependency-free Python tests
|-- test_chopsticks_pytest.py  # Extended Python and safety tests
|-- pytest.ini                 # Pytest discovery configuration
|-- RULES.md                   # Expanded rules and examples
|-- IMPLEMENTATION_PLAN.md     # Earlier architecture decisions
`-- AI_LOGIC_GRAPH.md          # Visual explanation of the minimax graph
```

Keeping `game.js` and `ai.js` separate prevents presentation code from
silently changing the rules or algorithm. `app.js` consumes those modules and
does not calculate its own legal moves. The additional Python and Markdown
files are supporting material; the required web application remains static.

## Testing

Run all Python tests from `Assignment 6` with:

```powershell
python -m pytest -q
```

Run the dependency-free Python suite with:

```powershell
python -m unittest -v test_chopsticks.py
```

Run the JavaScript tests with a current Node.js installation:

```powershell
node --test-isolation=none --test test_web_game.mjs
```

Run the optional real-browser Selenium tests with Chrome and Selenium 4:

```powershell
python -m pip install pytest selenium
python -m pytest -q test_web_selenium.py
```

The Selenium suite starts a loopback-only static server, opens Chrome in
headless mode, and closes both when testing finishes. Selenium Manager normally
selects the matching ChromeDriver. These optional environment variables can be
used when automatic discovery is unavailable:

```powershell
$env:SELENIUM_BROWSER_BINARY = 'C:\path\to\chrome.exe'
$env:SELENIUM_DRIVER_PATH = 'C:\path\to\chromedriver.exe'
$env:SELENIUM_HEADLESS = '0' # Show the browser while the tests run.
$env:SELENIUM_REQUIRED = '1' # Fail instead of skip if Chrome cannot start.
python -m pytest -q test_web_selenium.py
```

The browser tests skip with an explanatory reason when Selenium, Chrome, or a
compatible driver is unavailable. That keeps the dependency-free engine suite
usable on systems without browser automation.

The regression suite covers:

- The `1 | 1` versus `1 | 1` initial state
- Every accepted overflow input and all 1,250 ordered hand configurations for
  both player turns against an independent move-generation oracle
- Zero-hand attack restrictions and overflow knockouts
- Legal and illegal redistributions, including revival
- Invalid states and malformed inputs
- Move uniqueness, determinism, value bounds, finger-total preservation, and
  caller-state immutability across 3,750 state-and-level combinations
- A-knockout and B-knockout terminal scores
- The level-20 nonterminal tie
- MAX selection on A turns and MIN selection on B turns
- A position whose successor values differ
- Every row in the 13,125-entry DP table, including stable first-optimum
  tie-breaking through the public AI functions
- Complete table construction and autonomous play at depths 2, 4, 6, and 20
- Legal computer move selection on representative A and B turns
- Interface contract checks for restart wiring and guards that reject illegal
  selections before state mutation
- Autonomous play ending in a knockout or at the fixed horizon from every live
  hand configuration at five representative levels (2,880 simulations)
- Agreement between representative JavaScript and Python states
- Required interface controls and explicit wide/narrow CSS layout rules
- DOM-ID and ARIA-reference integrity, button behavior, keyboard focus styles,
  reduced-motion support, and local dependency boundaries
- Move-tree route tracking, legal branch previews, impact explanations,
  non-mutating selection, and bounded horizontal scrolling
- Live DP statistics, one-time table-build timing, depth progress, and responsive
  metric layout
- Presence and structure of the required README sections and five-entry AI log
- Selenium browser coverage for first render, setup and playback controls, the
  source-to-target tap animation, restart, analysis disclosure, non-mutating
  tree previews, a complete AI-versus-AI game, browser-console errors, and a
  390-pixel mobile viewport

Before submission, the web application should also be opened manually at a
wide desktop size and a narrow mobile size. Confirm that attacks,
redistributions, both player choices, autonomous mode, restart, AI Analysis,
and the move-20 tie work without console errors.

## Security and Input Handling

The project is a local static application. It does not evaluate user-provided
code, invoke a shell from gameplay, use network APIs, or save gameplay data.
The rules modules validate hand values, levels, and the DP depth. The browser
builds game output with DOM text rather than interpreting move descriptions as
HTML. The Python CLI limits input length and validates menu selections and
runtime arguments.

These controls make unintended local input predictable; they do not turn an
imported Python or JavaScript module into a security sandbox.

## Known Limitations

- A `0` score means no forced winner was found within 20 moves. It does not
  prove that the unlimited cyclic version of the game is a permanent draw.
- The depth is intentionally fixed at 20 for assignment compliance.
- Game progress is not saved after the page is closed or refreshed.
- The computer optimizes only the `-1`, `0`, and `+1` outcome. Among equally
  valued moves, it uses stable ordering rather than preferring the fastest win
  or longest defense.
- The interface is designed for one local browser and has no networked
  multiplayer mode.

## Implemented Extensions

The completed optional extensions are:

- Interactive immediate move tree with the played route and reply previews
- Scrollable move history
- Animated attacks with reduced-motion support
- AI-versus-AI playback with pause, step, and speed controls
- Live DP Statistics panel with the 13,125-row table size, device-specific build
  time, current depth, remaining moves, legal branches, and MAX/MIN role

The statistics panel measures the single `bestMoveDP(20)` construction when the
page loads. Its other values update after every move and restart, using the same
state and legal-move engine as the game.

## Possible Extensions

After the assignment version is complete and verified, possible extensions
include:

- A user-selectable search depth while keeping 20 as the assignment default
- A selectable one-, two-, or three-reply depth for the move-tree preview
- Human-versus-human play
- Saved/replayable move history
- Optional sound and additional animations
- A comparison between recursive minimax and bottom-up DP
- A separate unlimited-play experiment for studying cycles
- Static-site deployment

## Reflection

### 1. Why does Player A maximize while Player B minimizes?

Scores are defined from A's perspective: `+1` is good for A and `-1` is good
for B. Therefore A chooses the greatest available score. An optimal B tries
to make A's result as small as possible, so B chooses the minimum. Reversing
one of those roles would model that player deliberately helping the opponent.

### 2. Why is the table filled from the deepest level toward level zero?

A state's value depends on the values of its legal successors one level
deeper. Starting with known terminal and depth-20 values means every child is
available when its parent is evaluated. Working forward would require unknown
future values or recursive revisiting.

### 3. Why is dynamic programming faster than searching a plain game tree?

Different sequences frequently reach the same hand values at the same level.
A plain tree recalculates the shared continuation once per path. The DP table
uses the state and level as a key, calculates that continuation once, and
reuses the stored result. The bounded table has at most 13,125 entries even
when the unmerged tree contains far more paths.

### 4. Why does the interface use moves returned by the engine?

One rules engine prevents the UI and AI from disagreeing. If the engine says
a hand cannot attack, the UI cannot accidentally offer that attack. If it
returns a redistribution, the AI can consider it and the UI can display the
same move. This also lets the tests verify rules without driving the visual
interface for every case.

### 5. What did AI assistance help with most?

It was most useful for comparing rule variants, mapping the starter functions
to a browser architecture, identifying edge cases, and exposing the important
difference between an unlimited cyclic solver and the assignment's finite
depth-20 DP. Those suggestions were treated as proposals and checked against
the starter code, assignment document, and automated tests.

### 6. What AI-generated suggestion was verified, modified, or rejected?

The unlimited solver was initially accepted because it satisfied the request
to continue until a knockout. After reviewing the assignment, that design was
modified: the required browser path now uses bottom-up depth-20 DP and declares
a maximum-depth tie. This was not a cosmetic preference; the two models give
different opening predictions. Keeping the assignment's specified horizon
ensures that the displayed analysis, game ending, and grading expectations all
describe the same algorithm.

## Project Record

See [VIBE_LOG.md](VIBE_LOG.md) for five meaningful AI-assisted interactions,
including the rule decision, starter-code comparison, DP design, interface
iteration, and the assignment-compliance correction.
