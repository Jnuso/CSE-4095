# Assignment 6: Chopsticks Game Rules

## Objective

Chopsticks is a two-player hand game. The goal is to knock out both of the
opponent's hands while keeping at least one of your own hands active.

## Starting the Game

- Player 1 and Player 2 each have a left hand and a right hand.
- Every hand begins with one finger, so the starting state is `1 | 1` for
  each player.
- Player 1 takes the first turn.
- Players alternate turns. A player completes exactly one action per turn.

## Action 1: Attack

The active player may tap one of their active hands against one of the
opponent's active hands.

1. Choose one of your hands as the attacking hand.
2. Choose one of the opponent's hands as the target.
3. Add the attacker's finger count to the target's finger count.

Example:

```text
Attacker: 3     Target before attack: 2
Target after attack: 5
```

Based on the assignment description, a target that goes **above 5** is
knocked out and represented by `0`:

```text
Attacker: 2     Target before attack: 4
2 + 4 = 6, so the target becomes 0 (knocked out)
```

A knocked-out hand cannot attack and cannot be selected as the target of an
attack.

## Action 2: Redistribute (Split)

Instead of attacking, the active player may redistribute the fingers on
their two hands. The total number of fingers must stay the same.

Example:

```text
Before: 4 | 1
After:  3 | 2
```

The redistribution uses the player's entire current total; it does not add
or remove fingers. It also has to change the position meaningfully, so merely
swapping left and right (for example, `1 | 4` to `4 | 1`) is not a move.

## Winning and Losing

- A player loses as soon as both of their hands are knocked out (`0 | 0`).
- The other player wins immediately.
- If neither player has lost, turns continue.

## Display Convention

Each position can be displayed in this form:

```text
Player 1: L=1, R=1
Player 2: L=1, R=1
Turn: Player 1
```

The program will explain each selected action and show the updated position
after every turn, especially in autonomous mode.

## Rule Decisions to Confirm Before Coding

Chopsticks has several common variants. The assignment description settles
some rules, but the following details need confirmation:

1. **Exactly five:** The phrase "goes above 5" means that a hand showing
   exactly `5` remains active. Many versions instead knock out a hand at
   exactly five. The current interpretation follows the assignment wording.
2. **Overflow:** The current interpretation changes any value over five
   directly to `0`; it does not wrap around with modulo arithmetic.
3. **Reviving a hand:** The current interpretation allows redistribution to
   move fingers onto a knocked-out hand, such as `0 | 4` becoming `2 | 2`.
4. **Allowed redistributions:** The current interpretation permits any new
   pair of legal hand values with the same total, rather than only dividing
   the total evenly.
5. **Repeated positions:** Because attacks and redistributions can create
   cycles, the program needs a draw/repetition rule or a search-only policy
   for handling repeated positions.

These items are assumptions for planning only. They will be finalized before
the Python game is implemented.
