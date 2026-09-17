# Assignment 6: Python Implementation Plan

## Goal

Create a command-line Python version of Chopsticks with two ways to run it:

1. **Human versus computer:** The user chooses Player 1 or Player 2 and the
   computer controls the other player.
2. **Autonomous demonstration:** The computer controls both players, prints
   every move, and explains how the position changes so a user can learn the
   game by watching.

The computer player will use minimax search over the legal move graph, with a
search limit of 50 plies (individual player moves).

## Project Files

```text
Assignment 6/
|-- README.md
|-- RULES.md
|-- IMPLEMENTATION_PLAN.md
|-- AI_LOGIC_GRAPH.md
|-- chopsticks.py
`-- test_chopsticks.py
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
   crashing or losing the turn.
7. Apply the move, explain the result, and continue until a player wins or
   the agreed draw condition is reached.

Both modes retain a high defensive turn cap for protection against an
implementation error. Under correct play, the threefold-repetition rule ends
a cyclic game before that safeguard is reached.

The executable portion will be protected by `if __name__ == "__main__":` so
the game logic can be imported and tested without starting an interactive
session.

## Game-State Model

A state needs only:

- Player 1's two hand values.
- Player 2's two hand values.
- The player whose turn it is.

A proposed immutable representation is:

```python
((p1_left, p1_right), (p2_left, p2_right), current_player)
```

Hand pairs can be stored in sorted order for search purposes. For example,
`(1, 4)` and `(4, 1)` are strategically identical. Canonicalizing them will
reduce duplicate branches in the move graph.

Each move will record enough information to describe itself clearly, such as
an attack's source and target values or a redistribution's before-and-after
hands.

## Separation of Responsibilities

The implementation will keep input/output separate from game logic:

- `legal_moves(state)` returns every valid attack and redistribution.
- `apply_move(state, move)` returns a new state without changing the old one.
- `winner(state)` detects a terminal state.
- `choose_computer_move(state, depth_limit=50)` selects a move using minimax.
- CLI functions display positions, obtain validated input, and run each mode.

Pure game functions make it practical to test every rule and let autonomous
mode reuse exactly the same logic as interactive mode.

## Move Generation

For an attack, the generator will consider every active hand belonging to the
current player against every active opponent hand. Equivalent moves that
produce the same canonical state will be returned only once.

For redistribution, the generator will:

1. Add the current player's two hand values.
2. Enumerate pairs from `1` through `4` whose values have the same total.
3. Exclude the current canonical pair and simple left/right swaps.
4. Allow a knocked-out hand to be revived, but do not allow a player to knock
   out one of their own hands through redistribution.
5. Remove multiple moves that lead to the same state.

## Minimax and the Move Graph

The computer will build the complete reachable base-state graph once when a
game mode starts. The finalized graph contains only 342 states and 844 legal
transitions, so keeping it in memory is inexpensive and avoids regenerating
legal moves during each search.

The planned search includes:

- A default horizon of **50 plies**, meaning 50 individual player moves.
- A win/loss score that favors winning and prefers faster wins.
- A heuristic at the depth limit based on active hands, finger counts, and
  immediate threats.
- History-aware alpha-beta pruning to skip branches that cannot affect the
  choice while carrying occurrence counts through the simulated path.
- A memoized `(state, remaining depth)` table used only to order promising
  moves. Final values come from the repetition-aware alpha-beta search, so the
  history-blind ordering cache cannot change the selected answer.
- Explicit threefold-repetition detection because redistributions can return
  to earlier positions.
- Deterministic tie-breaking so demonstrations and tests are reproducible.

Although minimax is often drawn as a tree, the same game position can be
reached by different sequences. Treating it as a graph with canonical states
and a cache avoids solving the same position repeatedly.

## Autonomous Demonstration Mode

Autonomous mode will:

- Start from `1 | 1` versus `1 | 1`.
- Use the same computer strategy for both sides.
- Print the legal move selected on each turn.
- Print the calculation for attacks and the before/after values for splits.
- Show the full state after every move.
- Identify a win or draw clearly.
- Declare a draw when the same complete state occurs for the third time.
- Enforce a turn cap as an additional safeguard against an implementation
  error or an unexpectedly long demonstration.

The output may optionally pause between turns or accept Enter to advance, but
the default can run continuously so it is easy to test.

## Testing Plan

Automated tests will cover:

- The initial position and turn order.
- Attack addition and the exact knockout boundary.
- The inability to attack with or target a knocked-out hand.
- Legal and illegal redistributions.
- Finger-total preservation during redistribution.
- Reviving a knocked-out hand through redistribution.
- Win detection when both hands reach zero.
- Deduplication of symmetric states and moves.
- Minimax choosing a forced win and avoiding an immediate loss.
- Search termination when the move graph contains a cycle.
- A complete autonomous game ending in a reported win or draw.

Interactive input/output will receive a small set of tests using patched input
and captured output; most tests will target the pure game functions.

## Finalized Design Decisions

- A hand becomes knocked out when an attack makes its value `5` or greater.
- A knocked-out hand becomes `0`; values do not wrap around.
- A knocked-out hand cannot attack or be targeted.
- Redistributing fingers may revive a knocked-out hand.
- Any genuinely different, total-preserving redistribution is allowed when
  both resulting hands contain from `1` through `4` fingers.
- A left/right swap by itself is not a move, and redistribution cannot be used
  to knock out one of the current player's hands.
- Player 1 is Player A, moves first, and maximizes minimax scores. Player 2 is
  Player B and minimizes scores, all measured from Player A's perspective.
- The minimax horizon is 50 plies.
- The same complete state occurring three times is a draw. A complete state
  includes both players' hands and whose turn it is.
