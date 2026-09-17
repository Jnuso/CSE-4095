# Assignment 6: Chopsticks

## Project Purpose

This project implements the two-player Chopsticks hand game as a Python
command-line program. It supports a person playing against the computer
and an autonomous demonstration in which the computer controls both players.
The computer strategy uses a graph of legal game states and minimax search:
Player A maximizes the evaluation score, while Player B minimizes it.

This README is the living overview of the project. Detailed game rules are in
[RULES.md](RULES.md), the program design is in
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), and a visual explanation of
the AI is in [AI_LOGIC_GRAPH.md](AI_LOGIC_GRAPH.md).

## Finalized Rules Summary

- Player A and Player B each start with two active hands at `1 | 1`.
- Player A moves first, and each turn contains exactly one action.
- An attack adds the value of one active hand to one active opponent hand.
- A hand whose total reaches **5 or more** is knocked out and becomes `0`;
  values do not wrap around.
- A knocked-out hand is temporarily inactive: it cannot attack or be
  attacked, but it is not permanently removed.
- Instead of attacking, a player may redistribute their total between their
  hands, including reviving a `0` hand.
- A redistribution must preserve the total and create a genuinely different
  unordered pair; simply swapping left and right is not a move.
- A player loses when both of their hands are `0`.
- Repeated positions will be handled as a draw so cyclic play terminates.

## First-Iteration Features

- Human versus computer, with the user choosing Player A or Player B.
- Autonomous computer-versus-computer demonstration with move explanations.
- Complete legal attack and redistribution generation.
- Canonical states that treat left/right-swapped hands as equivalent.
- A graph of reachable states with duplicate positions shared rather than
  rebuilt.
- Depth-limited minimax with Player A as MAX and Player B as MIN.
- A search horizon of 50 plies (individual turns).
- History-aware alpha-beta minimax, cached move ordering, repetition
  detection, and deterministic tie-breaking.
- Input validation and automated tests for rules and AI behavior.

## Possible Search Refinements

- Add iterative deepening and a configurable search time or node budget for
  slower computers while keeping 50 plies as the requested horizon.
- Experiment with a richer cutoff heuristic and compare its decisions against
  the current transparent heuristic.
- Show optional search-node and pruning statistics in demonstration mode.

The first iteration carries occurrence counts through the complete simulated
path, so a third occurrence at any searched ply receives a draw score. A fast
history-blind minimax table is used only to order moves for pruning; it does
not determine the final score.

## Current Status

- [x] Agree on the common Chopsticks rules used by this project.
- [x] Document the game rules.
- [x] Draft the Python implementation plan.
- [x] Document the move graph and minimax model.
- [x] Implement the Python game model and legal moves.
- [x] Implement graph generation and first-iteration minimax search.
- [x] Implement human-versus-computer mode.
- [x] Implement autonomous demonstration mode.
- [x] Add and run automated tests.
- [x] Review the first-iteration command-line experience and documentation.

The first Python iteration now contains the game model, graph construction,
minimax AI, human-versus-computer mode, and autonomous demonstration. Tests
and later refinements will continue to be tracked here.

## Verified Baseline

- Reachable move graph: **342 states** and **844 directed legal moves**.
- Maximum branching from one state: **5 unique moves**.
- Automated suite: **24 standard-library tests**, including a complete
  history-aware 50-ply search from the initial position.
- Both command-line modes have been exercised, and autonomous play terminates
  under the threefold-repetition rule.

## File Map

```text
Assignment 6/
|-- README.md                 # Living project overview and progress
|-- RULES.md                  # Finalized game rules and examples
|-- IMPLEMENTATION_PLAN.md    # Python architecture and design decisions
|-- AI_LOGIC_GRAPH.md         # State graph and minimax explanation
|-- chopsticks.py             # Game, graph, AI, and command-line modes
`-- test_chopsticks.py        # Standard-library automated tests
```

## Terminology

- **Hand value:** Number of fingers on one hand; `0` means knocked out.
- **State:** Both players' hand values plus whose turn it is.
- **Move:** One attack or redistribution performed during a turn.
- **Ply:** One player's move; the search depth of 50 means 50 plies.
- **Move graph:** Unique game states connected by legal moves.
- **Minimax:** Search in which Player A chooses the highest-valued continuation
  and Player B chooses the lowest-valued continuation.
- **Terminal state:** A state in which one player has `0 | 0` and has lost.
- **Heuristic:** An estimate used when search stops before reaching a terminal
  state.

## Running and Testing

Run these commands from the `Assignment 6` directory:

```powershell
python .\chopsticks.py

python -m unittest -v test_chopsticks.py
```

## Maintaining This README

Update this file whenever a rule, interface, file name, completed feature, or
next step changes. Keep the status checklist synchronized with the actual
files, move detailed explanations into the linked documents, and record any
departure from the finalized rules before changing the implementation.

## Next Steps

1. Review the first-iteration play transcript and move explanations.
2. Consider iterative deepening and an optional search budget.
3. Expand tests around deeper repetition choices and search statistics.
4. Add any presentation or assignment-report features requested later.
