# Assignment 6: Chopsticks

## Project Purpose

This project implements the two-player Chopsticks hand game in both a Python
command-line program and a browser interface built with HTML, CSS, and
JavaScript. Both offer human-versus-computer play and an autonomous
computer-versus-computer demonstration. The Python reference uses the
starter's bottom-up finite-horizon minimax table. The browser solves the
cyclic state graph directly so play can continue until a real knockout.
Player A maximizes the result, while Player B minimizes it.

This README is the living overview of the project. Detailed game rules are in
[RULES.md](RULES.md), the program design is in
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), and a visual explanation of
the AI is in [AI_LOGIC_GRAPH.md](AI_LOGIC_GRAPH.md).

## Current Legal-Move Rules

- Player A and Player B each start with two active hands at `1 | 1`.
- Player A moves first, and each turn contains exactly one action.
- An attack adds the value of one active hand to one active opponent hand.
- A hand whose total reaches **5 or more** is knocked out and becomes `0`;
  values do not wrap around.
- A knocked-out hand is temporarily inactive: it cannot attack or be
  attacked, but it is not permanently removed.
- Instead of attacking, a player may redistribute their total between their
  hands. This can revive a `0` hand or leave one hand at `0`, as in the
  supplied starter code.
- Each hand is identified as left or right; `0 | 2` and `2 | 0` are different
  positions. A redistribution must preserve the total, remain within `0` to
  `4` per hand, and genuinely change more than just swapping the hands.
- A player loses when both of their hands are `0`.
- A win ends play immediately. Browser games have no turn cutoff and continue
  until one player loses both hands. The Python reference retains the
  starter's separate 20-ply teaching horizon.

## Features

- Human versus computer, with the user choosing Player A or Player B.
- Autonomous computer-versus-computer demonstration with move explanations.
- Complete legal attack and redistribution generation.
- Immutable ordered states that retain left/right hand identity.
- A graph of reachable states with duplicate positions shared rather than
  rebuilt.
- A bottom-up DP table indexed by both hand pairs and the turn level. Each
  entry stores a `-1`, `0`, or `+1` result and a selected next position.
- Player A chooses the largest child value; Player B chooses the smallest.
  Equal-valued choices are broken deterministically.
- The Python CLI has a default 20-ply whole-game horizon, corresponding to the starter's
  `moves=10`. The game and AI use the same horizon, rather than starting a
  fresh 20-ply search after every turn.
- Starter-compatible `overflow_sum`, `next_moves`, `best_move_dp`, `display`,
  and `chopsticks_game` functions, with the existing CLI and autonomous mode
  as extensions.
- Bounded input and runtime-argument validation.
- Standard-library and pytest regression tests for rules, AI behavior, edge
  cases, and local CLI safety.

## Why Bottom-Up DP Fits

The ordered base graph has only 1,116 reachable positions. In a starter-style
time-layered table, a level fixes whose turn it is, and there are at most
`5^4 = 625` hand configurations per level. A full 20-ply table therefore
has at most `625 × 21 = 13,125` entries, even though an unmerged game tree
could contain vastly more paths. The table evaluates terminal positions and
20-ply ties first, then works backward to level zero. Cycles in the base
graph cannot create a cycle in the table because every edge advances the
level.

## Current Status

- [x] Align legal move generation with the supplied starter code.
- [x] Document the game rules.
- [x] Draft the Python implementation plan.
- [x] Document the move graph and minimax model.
- [x] Implement the Python game model and legal moves.
- [x] Implement graph generation and starter-style bottom-up minimax DP.
- [x] Implement human-versus-computer mode.
- [x] Implement autonomous demonstration mode.
- [x] Add and run automated tests.
- [x] Review the first-iteration command-line experience and documentation.
- [x] Add a browser interface with visible hands and move analysis.
- [x] Add JavaScript rule and minimax regression tests.
- [x] Replace the browser cutoff with an infinite-horizon cyclic-graph solver.

The Python program remains the starter-compatible reference implementation.
The browser shares its legal moves but uses an infinite-horizon graph solver,
while presenting both players' hands, choices, and AI decisions visually.

## Verified Baseline

- Reachable ordered move graph: **1,116 states** and **4,080 directed legal
  moves**, including **48 terminal states**.
- Maximum branching from one state: **7 unique moves**.
- Automated standard-library and pytest suites cover rule and CLI behavior.
- A complementary pytest suite exercises malformed and oversized input,
  exhaustive move invariants, horizon/DP behavior, runtime limits, and a
  defense-in-depth architecture guard against accidentally adding dynamic
  execution, shell, network, or gameplay-file calls.
- Verified after the DP migration: **141 pytest-collected tests plus 1,128
  subtests passed**; the dependency-free unittest suite has **18 tests**.
- Both command-line modes are covered by regression tests, and autonomous
  play terminates at a win or the fixed horizon.
- The browser solver classifies 532 A-win states, 532 B-win states, and 52
  genuine cycle states. From the opening, optimal autonomous play reaches a
  Player B knockout on move 26 rather than stopping on move 20.

## File Map

```text
Assignment 6/
|-- README.md                 # Living project overview and progress
|-- RULES.md                  # Current game rules and examples
|-- IMPLEMENTATION_PLAN.md    # Python architecture and design decisions
|-- AI_LOGIC_GRAPH.md         # State graph and minimax explanation
|-- chopsticks.py             # Game, graph, AI, and command-line modes
|-- test_chopsticks.py        # Standard-library automated tests
|-- test_chopsticks_pytest.py # Pytest edge-case and safety regressions
|-- test_web_game.mjs         # Browser-engine rule and minimax tests
|-- pytest.ini                # Stable local pytest discovery settings
`-- web/
    |-- index.html            # Browser interface
    |-- styles.css            # Responsive visual design
    |-- game.js               # Pure rules, finite DP, and cyclic graph solver
    `-- app.js                # UI rendering and interaction
```

## Terminology

- **Hand value:** Number of fingers on one hand; `0` means knocked out.
- **State:** Both players' hand values plus whose turn it is; a DP table key
  also records the turn level.
- **Move:** One attack or redistribution performed during a turn.
- **Ply:** One player's move. Browser play has no fixed number of plies.
- **Move graph:** Unique game states connected by legal moves.
- **Minimax:** Search in which Player A chooses the highest-valued continuation
  and Player B chooses the lowest-valued continuation.
- **Terminal state:** A state in which one player has `0 | 0` and has lost.
- **Cycle state:** A browser position where perfect defense could repeat
  indefinitely. Autonomous mode uses a finish-seeking route if one repeats.

## Running and Testing

Run these commands from the `Assignment 6` directory:

```powershell
python .\chopsticks.py

# Run the complete regression suite (including unittest-style tests).
python -m pytest -q

# Run only the dependency-free standard-library suite.
python -m unittest -v test_chopsticks.py

# Test the JavaScript rules and minimax engine (requires Node.js).
node --test-isolation=none --test test_web_game.mjs
```

To use the browser version, serve this directory over HTTP, then open
[http://localhost:8000/web/](http://localhost:8000/web/) in a browser:

```powershell
python -m http.server 8000
```

Opening `web/index.html` directly as a `file:` URL may prevent its JavaScript
modules from loading; the local HTTP server avoids that restriction. Stop the
server with `Ctrl+C` when finished.

## Browser Features

- Four large, centered visual hands, with finger counts, knocked-out states,
  and accessible labels. Tap by choosing a live source hand and then a live
  opponent hand; the source hand visibly travels toward its target before the
  new finger count appears. Redistribute with the split control.
- Play as A or B, restart, or watch autonomous A-versus-B play with play/pause,
  single-step, and speed controls.
- Moves played, outcome, and move history, including a brief explanation of
  the AI's choice.
- A focused move-graph view showing the current position and its legal next
  positions with minimax values. The browser solves all 1,116 reachable
  positions and plays until a player is actually knocked out.
- A simplified game-first responsive layout with keyboard-operable controls.
  Reduced-motion preferences skip the hand-travel animation.

## Local CLI Security Scope

This is an offline, local command-line game. It does not evaluate user input
as Python, invoke a shell, start external processes, access the network, or
read and write gameplay files. Menu entries are treated only as text and are
matched against known choices.

Defensive limits keep accidental or malformed use predictable:

- A single interactive response is limited to **100 characters**.
- The DP horizon must be an even integer from **2 through 50 plies**;
  the default is **20**. The corresponding `moves` count is 1 through 25
  A/B rounds.
- The fixed game horizon ends cycles without a repetition rule. Defensive
  runtime limits may still reject unreasonable arguments.
- States, moves, and runtime options are validated before
  use; invalid values produce a controlled error or another prompt.
- End-of-file and `Ctrl+C` at the command line exit cleanly instead of
  displaying a traceback.

These measures harden the intended CLI against unintended input and local
resource abuse; they do **not** make the module a security sandbox. Python
code that already has permission to import and call the module runs with the
same permissions as the user and must still be trusted.

## Maintaining This README

Update this file whenever a rule, interface, file name, completed feature, or
next step changes. Keep the status checklist synchronized with the actual
files, move detailed explanations into the linked documents, and record any
departure from the current legal rules before changing the implementation.

## Next Steps

1. Keep the Python and JavaScript legal moves in sync while documenting their
   intentionally different ending policies.
2. Consider replay, undo, or deeper graph exploration after reviewing the
   first browser-play experience.
