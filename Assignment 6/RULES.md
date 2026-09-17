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
- Both resulting hands must be live, so each result must be from `1` through
  `4`.
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
For example, `0 | 4` may become either `1 | 3` or `2 | 2`.

These are not legal redistributions:

```text
1 | 4 -> 4 | 1   (only swaps the hands)
2 | 2 -> 2 | 2   (does not change anything)
1 | 3 -> 0 | 4   (the move would produce a dead hand)
```

## Winning and Losing

- A player loses immediately when both of their hands are knocked out
  (`0 | 0`).
- Because no fingers remain at `0 | 0`, there is nothing left to redistribute
  and the player cannot revive either hand.
- The other player wins immediately.
- If both players still have at least one live hand, play continues unless
  the repetition rule declares a draw.

## Repetition and Draws

Redistributions can cause the game to return to earlier positions. To prevent
an endless software game, a draw is declared when the same **full game state**
occurs for the third time.

A full game state includes:

- both of Player A's hand values;
- both of Player B's hand values; and
- whose turn it is.

Therefore, identical hand values with a different player to move are not the
same state.

## Display Convention

Each position can be displayed in this form:

```text
Player A: 1 | 1
Player B: 1 | 1
Turn: Player A
```

The program sorts each pair from low to high because left and right have no
strategic difference. Human choices are listed as numbered moves, so the
display does not imply a permanent left/right identity.

The program will explain each selected action and show the updated position
after every turn, especially in autonomous mode.
