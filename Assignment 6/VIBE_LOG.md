# Vibe Coding Log

This file records five meaningful AI-assisted interactions from the Chopsticks
project. It is a concise project record rather than a complete transcript. The
prompts below are quoted or lightly shortened for readability.

## Interaction 1: Establishing the Rules

**Prompt**

> Can you look online to see if you can find a general consensus of the rules
> and explain whether my understanding is how most people play the game? Also,
> can a dead hand be revived, with a loss only when both hands are knocked out?

**AI suggestion**

The assistant explained that Chopsticks has several common variants, especially
for overflow and redistribution. It recommended writing the selected variant
explicitly instead of assuming every source used identical rules. It identified
the important distinction between an inactive `0` hand and a player losing when
both hands are `0`.

**What I accepted or changed**

I accepted revival through redistribution and the rule that a player loses only
when both hands are knocked out. Once the supplied starter code became
available, I chose it as the authoritative definition for attacks,
redistributions, and overflow rather than mixing rules from multiple variants.

**What I learned or verified**

I learned that a familiar game name does not guarantee one universal ruleset.
For software, edge cases such as whether a `0` hand can be revived must be made
explicit and tested.

## Interaction 2: Comparing the Starter Code

**Prompt**

> How does what we currently have compare to the base code? Are our rules
> aligned? Walk me through the starter functions, but do not make changes yet.

**AI suggestion**

The assistant mapped the starter program's main responsibilities:
`overflow_sum()` applies the knockout rule, `next_moves()` generates attacks
and redistributions, `best_move_dp()` is the unfinished bottom-up minimax
portion, `display()` formats the state, and `chopsticks_game()` runs the turn
loop. It recommended preserving those semantics and adding validation and UI
features around them.

**What I accepted or changed**

I accepted starter-code parity as the primary goal. The implementation kept
ordered left/right hands, live-to-live attacks, revival through legal
redistribution, the pure-swap restriction, and level parity. Input validation
and deterministic move order were retained as safe extensions because they do
not change the legal successor states.

**What I learned or verified**

I learned to separate rule compatibility from user-interface compatibility.
Two programs can present moves differently while still being equivalent if they
generate the same successor states and scores.

## Interaction 3: Choosing the DP Horizon

**Prompt**

> We do not specifically need 50 moves. If 20 makes the most sense, use that.
> Is complete bottom-up possible, or will the graph become too large?

**AI suggestion**

The assistant calculated that four hands with values `0` through `4` create at
most `5^4 = 625` configurations at one level. Including levels 0 through 20
creates at most `625 × 21 = 13,125` DP entries. It proposed filling level 20
first and working backward, storing both the minimax value and best successor
for every state.

**What I accepted or changed**

I accepted a 20-move horizon and a complete bottom-up table. Player A maximizes
the score, Player B minimizes it, and a live position at level 20 has value
`0`. I did not use the earlier arbitrary target of 50 moves.

**What I learned or verified**

I learned that the number of paths in a game tree can be huge while the number
of unique state-and-level combinations remains manageable. Dynamic programming
is useful because multiple paths can reuse one stored result.

## Interaction 4: Building and Iterating on the Web Interface

**Prompt**

> Implement this with HTML, JavaScript, and CSS. Use a modern tech/Apple
> aesthetic, visualize both players' hands, make the hands bigger and centered,
> simplify the interface, and animate attacks.

**AI suggestion**

The assistant proposed a static single-page app with a pure rules module, an AI
module, and a UI coordinator. It added direct hand selection, legal split
controls, responsive large hands, attack motion, game status, history, and an
autonomous demonstration. When asked to continue past move 20, it also proposed
an unlimited cyclic-state solver.

**What I accepted or changed**

I accepted the centered hand interface, direct attacks, animation, responsive
layout, and autonomous controls. The unlimited solver was initially accepted
for experimentation, but it was later removed from the required gameplay path
after checking the assignment specification.

**What I learned or verified**

I learned that a feature can improve a demonstration but still conflict with a
grading requirement. Presentation changes were reusable, while the different
ending policy changed the actual algorithm and needed correction.

## Interaction 5: Assignment Audit and Compliance Fix

**Prompt**

> Check the actual assignment against what we have and the initial base code.
> Explain bottom-up depth-20 DP and the maximum-depth tie, then implement the
> assignment-compliant version.

**AI suggestion**

The assistant created a requirement-by-requirement comparison. It found that
the rules and finite DP implementation matched the starter, but the live web
interface was calling the unlimited cyclic solver. It recommended making the
depth-20 table the actual decision engine, tracking the absolute level, ending
a live level-20 position as a tie, separating `game.js` and `ai.js`, expanding
AI Analysis, aligning the file structure, and adding assignment-specific tests
and documentation.

**What I accepted or changed**

I accepted the complete compliance correction. The required version now uses
bottom-up minimax, displays moves remaining, explains MAX/MIN and every
candidate value, and treats a nonterminal level-20 position as a tie. The
submission structure, README, and tests were aligned at the same time.

**What I learned or verified**

This was the project's main debugging and verification interaction. Comparing
the active call path—not merely checking whether a DP function existed—revealed
that the interface was using the wrong solver. The review also clarified that
`0` means “no forced winner within 20 moves,” not necessarily an infinite-game
draw. The correction is verified by targeted terminal, horizon, MAX/MIN,
starter-parity, and interface regression tests.
