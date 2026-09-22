# Assignment 6: Chopsticks Game Rules

## Objective

Chopsticks is a two-player hand game. The goal is to knock out both of the
opponent's hands while keeping at least one of your own hands active.

Player A is also called Player 1, and Player B is also called Player 2.

## Starting the Game

- Player A and Player B each have a left hand and a right hand.
- Every hand begins with one finger, so the starting state is `1 | 1` for
  each player.
- Player A (Player 1) takes the first turn.
- Players alternate turns. A player completes exactly one action per turn:
  either an **attack** or a **redistribution**.

## Hand Values

- A live hand has a value from `1` through `4`.
- A knocked-out (dead) hand is represented by `0`.
- A dead hand is temporarily inactive, not permanently removed: it cannot
  attack or be targeted, but its owner may revive it through redistribution
  while their other hand is still live.
- If an attack makes a hand's value **5 or greater**, that hand becomes `0`.
- Values do not roll over. For example, a result of `6` becomes `0`, not `1`.

## Action 1: Attack

The active player may tap one of the opponent's live hands with one of their
own live hands.

1. Choose one of your live hands as the attacking hand.
2. Choose one of the opponent's live hands as the target.
3. Add the attacker's finger count to the target's finger count.
4. Leave the attacking hand unchanged.
5. If the target reaches `5` or more, replace its value with `0`.

Example in which the target remains active:

```text
Attacking hand: 2
Target before:  1
Target after:   3

The attacking hand is still 2.
```

Example in which the target is knocked out at exactly five:

```text
Attacking hand: 3
Target before:  2
3 + 2 = 5, so the target becomes 0.
```

Example showing that there is no rollover:

```text
Attacking hand: 2
Target before:  4
2 + 4 = 6, so the target becomes 0, not 1.
```

A dead hand cannot attack and cannot be selected as the target of an attack.

## Action 2: Redistribute (Split)

Instead of attacking, the active player may redistribute the fingers already
present on their own two hands.

A legal redistribution must follow all of these rules:

- The total number of fingers must stay the same.
- Each resulting hand must be from `0` through `4`. A player may move all
  fingers off one hand, leaving that hand at `0`.
- The distribution must genuinely change.
- Merely swapping the two hand values does not count as a move.

For example, this redistribution is legal because the total stays at five:

```text
Before: 4 | 1
After:  3 | 2
```

Redistribution may revive a dead hand:

```text
Before: 0 | 4
After:  2 | 2
```

Redistribution is flexible; it does not have to divide the fingers evenly.
For example, `0 | 4` may become `1 | 3`, `2 | 2`, or `3 | 1`. A redistribution
can also create a dead hand: `1 | 3` may become `0 | 4`. The total stays at
four in each case. This follows the supplied starter code's transfer rule.

These are not legal redistributions:

```text
1 | 4 -> 4 | 1   (only swaps the hands)
2 | 2 -> 2 | 2   (does not change anything)
4 | 1 -> 0 | 5   (a hand cannot have five fingers)
```

## Winning and Losing

- A player loses immediately when both of their hands are knocked out
  (`0 | 0`).
- Because no fingers remain at `0 | 0`, there is nothing left to redistribute
  and the player cannot revive either hand.
- The other player wins immediately.
- In the assignment browser mode, play also ends at the fixed level-20
  boundary. If both players are still active then, the result is a tie.

## Ending Policies

The browser and starter Python program both use the supplied fixed horizon of
**20 individual turns** (10 turns for A and 10 for B) by default. A win ends
the game immediately. If both players still have a live hand after turn 20,
the result is a tie. A
position returning to an earlier configuration does **not** end the game;
there is no threefold-repetition rule. The horizon ensures that even a
cycle ends after a finite number of turns.

In both implementations, an A win has value `+1`, a B win has value `-1`,
and a live position at the horizon has value `0`. This scoring does not
change the legal moves.

## Display Convention

Each position can be displayed in this form:

```text
Player A: 1 | 1
Player B: 1 | 1
Turn: Player A
```

The first number is the **left** hand and the second is the **right** hand.
The program keeps those positions distinct, just as the supplied starter
code does: `0 | 2` and `2 | 0` are different states. Attacks identify the
source and target by left/right position. A pure swap is still not a legal
redistribution, even though the two ordered positions differ.

At the initial `A: 1 | 1`, `B: 1 | 1` position, A has four ordered successor
states: attack B's left, attack B's right, transfer to A's left to reach
`2 | 0`, or transfer to A's right to reach `0 | 2`.

The program will explain each selected action and show the updated position
after every turn, especially in autonomous mode.
