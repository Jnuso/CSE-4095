# Assignment 6: Python Implementation Plan

## Goal

Create a command-line Python version of Chopsticks with two ways to run it:

1. **Human versus computer:** The user chooses Player 1 or Player 2 and the
   computer controls the other player.
2. **Autonomous demonstration:** The computer controls both players, prints
   every move, and explains how the position changes so a user can learn the
   game by watching.

The computer player will use the starter's bottom-up minimax dynamic
programming over a fixed game horizon of **20 plies** (10 A/B rounds) by
default. The whole game, not each individual search, shares that horizon.

## Project Files

```text
Assignment 6/
|-- README.md
|-- RULES.md
|-- IMPLEMENTATION_PLAN.md
|-- AI_LOGIC_GRAPH.md
|-- chopsticks.py
|-- test_chopsticks.py
|-- test_chopsticks_pytest.py
`-- pytest.ini
```

The Markdown planning files were completed before implementation and now track
the working first iteration. The Python game and automated tests have been
added and will be refined as later features are developed.

## Command-Line Experience

When `chopsticks.py` starts, it will:

1. Explain the available modes.
2. Ask whether to run human-versus-computer or autonomous mode.
3. In human-versus-computer mode, ask whether the user is Player 1 or
   Player 2. Player 1 moves first.
4. Print both players' hands and whose turn it is.
5. List legal moves with numbered choices rather than requiring the user to
   memorize a command syntax.
6. Validate the selection and keep prompting after invalid input instead of
   crashing or losing the turn. Reject non-text or responses longer than 100
   characters before parsing them.
7. Apply the move, explain the result, and continue until a player wins or
   both players remain alive at the fixed horizon (a tie).

The 20-ply default is finite even if legal redistributions revisit earlier
positions. Inputs and horizon arguments remain validated and bounded for
the offline CLI. A repetition does not itself declare a draw.

The executable portion will be protected by `if __name__ == "__main__":` so
the game logic can be imported and tested without starting an interactive
session. End-of-file and `Ctrl+C` during interactive use are caught at this
boundary and produce a clean exit message rather than a traceback.

## Game-State Model

A state needs only:

- Player 1's two hand values.
- Player 2's two hand values.
- The player whose turn it is.

A proposed immutable representation is:

```python
((p1_left, p1_right), (p2_left, p2_right), current_player)
```

Hand pairs retain their **left/right order** to match the supplied starter
code. For example, `(1, 4)` and `(4, 1)` are distinct states even though a
pure swap is not itself a legal move.

Each move records the attacking and target **hand indices** (left or right),
or the ordered hands resulting from a redistribution. The state supplies the
hands before the move. An attack based only on finger values cannot
distinguish two hands with the same value.

## Separation of Responsibilities

The implementation will keep input/output separate from game logic:

- `legal_moves(state)` returns every valid attack and redistribution.
- `apply_move(state, move)` returns a new state without changing the old one.
- `winner(state)` detects a terminal state.
- `best_move_dp(depth=20)` builds the level-indexed DP table, where each
  value stores a `-1`/`0`/`+1` result and a selected next position.
- `overflow_sum(a, b)`, `next_moves(v)`, `display(w)`, and
  `chopsticks_game(moves=10, index=0)` preserve the starter's recognizable
  interface. `index=0` means the human is A and moves first; `index=1`
  means the computer is A.
- `choose_computer_move(...)` and existing game-mode helpers can reuse the
  same DP policy without changing move legality.
- CLI functions display positions, obtain validated input, and run each mode.

Pure game functions make it practical to test every rule and let autonomous
mode reuse exactly the same logic as interactive mode.

## Move Generation

For an attack, the generator considers every active hand belonging to the
current player against every active opponent hand. Choices that produce the
same ordered successor state are returned only once.

For redistribution, the generator will:

1. Add the current player's two hand values.
2. Enumerate ordered pairs from `0` through `4` whose values have the same
   total.
3. Exclude the unchanged pair and simple left/right swaps.
4. Allow a knocked-out hand to be revived **or** a live hand to be emptied by
   a transfer. A player cannot transfer into a value above `4`.
5. Remove multiple moves that lead to the same state.

## Bottom-Up Minimax DP and the Move Graph

The program can build the complete reachable base-state graph with BFS; the
autonomous mode reports its size. With ordered hand positions and the
starter's transfer rule, the reachable graph contains 1,116 states, 4,080
legal transitions, and 48 terminal states. The starter-compatible DP table
is a separate time-layered structure constructed once per game.

The starter-compatible `best_move_dp(depth=20)` returns a dictionary keyed by
`((a_left, a_right), (b_left, b_right), level)`. Each value is a pair:
`(outcome, chosen_next_state)`, where outcome is `+1` for an A win, `-1`
for a B win, and `0` for a tie; a terminal entry has no chosen move.

The algorithm fills every level in reverse order:

1. At the final level, store `+1` or `-1` for a winner and `0` for a
   position where both players are still alive.
2. At each earlier level, assign terminal states their winner score.
3. For a nonterminal state, enumerate `next_moves` at that level and read
   the already-computed values of its children at `level + 1`.
4. Choose a maximum-value child on A's turn (even level) and a minimum-value
   child on B's turn (odd level). Store both its value and chosen child.
5. Break equal-valued choices deterministically so tests and demonstrations
   remain reproducible.

There are 25 ordered hand pairs per player. Since level fixes the active
player, there are at most `25 × 25 = 625` hand configurations at any level,
or `625 × 21 = 13,125` entries for a full 20-ply table. This is practical
in memory and time. The reachable base-state graph has fewer nodes, but
enumerating all bounded configurations stays close to the starter.

Although minimax is often drawn as a tree, the same ordered position can be
reached by different sequences. A time-layered table shares repeated
subproblems. Each move increases the level, so an apparent cycle in the
unlayered move graph cannot create a cycle in the DP dependency order.

## Autonomous Demonstration Mode

Autonomous mode will:

- Start from `1 | 1` versus `1 | 1`.
- Use the same computer strategy for both sides.
- Print the legal move selected on each turn.
- Print the calculation for attacks and the before/after values for splits.
- Show the full state after every move.
- Identify a win or draw clearly.
- Declare a tie if both players survive the fixed horizon.
- Stop at the configured horizon even if positions have repeated.

The output may optionally pause between turns or accept Enter to advance, but
the default can run continuously so it is easy to test.

## Testing Plan

The dependency-free `unittest` suite covers core behavior, while a dedicated
pytest regression suite adds parametrized, exhaustive, edge-case, and local
CLI safety checks. `python -m pytest -q` collects both files, and
`python -m unittest -v test_chopsticks.py` remains available when pytest is
not installed.

Automated tests cover:

- The initial position and turn order.
- Attack addition and the exact knockout boundary.
- The inability to attack with or target a knocked-out hand.
- Legal and illegal redistributions.
- Finger-total preservation during redistribution.
- Reviving a knocked-out hand through redistribution.
- Win detection when both hands reach zero.
- Preservation of left/right hand identity and deduplication of identical
  ordered successor moves.
- DP choosing a forced win and avoiding an immediate loss.
- Bottom-up base cases, level order, A/MAX and B/MIN decisions, and storage
  of both values and chosen successor positions.
- Guaranteed termination at the fixed horizon even when the base move graph
  contains a cycle.
- A complete autonomous game ending in a reported win or draw.
- Exhaustive successor invariants across every ordered game state.
- Empty, malformed, control-character, oversized, and out-of-range input.
- Horizon and runtime-argument boundaries, including rejecting booleans where an
  exact integer is required.
- Clean handling of end-of-file and keyboard interruption.
- Starter-compatible `overflow_sum`, `next_moves`, `best_move_dp`, `display`,
  and `chopsticks_game` behavior.
- A static regression guard against adding dynamic code execution, shell,
  file, or network operations to the offline CLI.

Interactive input/output will receive a small set of tests using patched input
and captured output; most tests will target the pure game functions.

## Security Boundaries

The program is designed as an offline local CLI: it has no need for
`eval`/`exec`, shell commands, subprocesses, network sockets, or gameplay file
access. Input length, the DP horizon, game states, moves, and runtime
arguments are bounded or validated to reduce accidental crashes and
resource exhaustion.

This validation protects the supported command-line interface; it is not a
sandbox for hostile Python code. Any code that imports the module already
runs with the user's Python permissions and is outside the application's
threat model.

The optional `graph=` constructor argument is a constrained-subgraph testing
hook. Supplied edges are copied, made read-only, and checked for legality, but
the hook may intentionally omit legal alternatives for focused search tests;
it should not be mistaken for the complete production graph.

## Current Design Decisions

- A hand becomes knocked out when an attack makes its value `5` or greater.
- A knocked-out hand becomes `0`; values do not wrap around.
- A knocked-out hand cannot attack or be targeted.
- Redistributing fingers may revive a knocked-out hand.
- Any genuinely different, total-preserving redistribution is allowed when
  both resulting hands contain from `0` through `4` fingers.
- A left/right swap by itself is not a move. Redistribution **can** leave one
  hand at zero, matching the starter's transfer behavior.
- Player 1 is Player A, moves first, and maximizes minimax scores. Player 2 is
  Player B and minimizes scores, all measured from Player A's perspective.
- The default game horizon is **20 individual turns**: the starter's
  `moves=10` corresponds to 10 A/B rounds. A nonterminal position at the
  horizon is a tie, even if positions repeated along the way.
- AI outcomes are `+1` (A win), `-1` (B win), and `0` (tie). The DP stores
  both an outcome and a chosen next position for each time-layered state.
