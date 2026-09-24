# Chopsticks AI Web Game

## Overview

This is a web version of the Chopsticks game from the Python starter code. You can play against the computer as Player A or Player B, play with a second person on the same device, or watch the computer play against itself. It's just HTML, CSS, and JavaScript, so there's no server or database.

The computer doesn't pick random moves. It uses minimax with a dynamic programming (DP) table that gets built when the page loads. Player A tries to get the highest score and Player B tries to get the lowest score. There's also an AI Analysis panel that shows why the computer picked a move.

## Running the Web Game

Open the project folder and double-click index.html. It opens in your browser and works right away. You don't need a server.

I didn't use JavaScript modules (import/export) because browsers block those when you open a file directly. Instead index.html loads game.js, ai.js, and app.js in that order.

The default is the assignment's 20-move limit. The Move limit / AI depth menu offers optional alternatives and starts a fresh game when changed. To upload the site later, keep these eight files together in one folder and upload the folder's contents to a static web host. The relative script, stylesheet, and icon links work without a build step. This project has not been published to a hosting service yet.

## Game Rules

I followed the starter code for the rules.

1. Both players start with 1 finger on each hand, so (1, 1) vs (1, 1).
2. Player A goes first and then the players take turns. One turn is either an attack or a split.
3. To attack, you pick one of your hands that isn't 0 and tap one of the other player's hands that isn't 0. Your hand's number gets added to their hand. Your hand doesn't change.
4. If the total is 5 or more, their hand goes to 0. It doesn't wrap around.
5. A hand with 0 can't attack and can't be attacked.
6. To split, you move fingers between your own two hands. The total stays the same, neither hand can go over 4, and just swapping left and right doesn't count as a move. A split can bring a 0 hand back to life, and it can also leave one hand at 0.
7. You lose when both of your hands are 0.
8. In the assignment-default setting, the game is limited to 20 turns total, which is 10 for each player. If it reaches turn 20 and both players still have a hand, it's a tie. If someone gets knocked out on turn 20 they still lose, so it's not a tie in that case. Optional depth choices use the same tie rule at their selected limit.

The 20 turn limit is from the assignment (the starter code sets moves = 10 and then uses depth = 2 * moves).

## State Representation

A state looks like this:

((A_left, A_right), (B_left, B_right), level)

For example the starting state is ((1, 1), (1, 1), 0).

The level is how many turns have been played. If the level is even it's A's turn and if it's odd it's B's turn. The level has to be part of the state because the same hands mean something different depending on how many turns are left. For example, a position with 18 turns left is different from the same position with 1 turn left.

## overflowSum() and nextMoves()

overflowSum(a, b) adds two numbers, but returns 0 if the total is 5 or more.

nextMoves(state) gives back a list of every state you could get to in one turn. It uses legalMoves(state) in game.js, which does this:

1. If the game is already over, it returns nothing.
2. It uses the level to figure out whose turn it is.
3. It goes through every attack. The attacking hand and the target hand both have to be more than 0. It uses overflowSum to get the new number.
4. It goes through every split. It takes 1 or more fingers from one hand and moves them to the other hand. It skips the split if the other hand would go over 4 or if it just swaps the hands.
5. It removes duplicates, since two different moves can end up in the same state.

At the start there are 4 legal moves: 2 attacks and 2 splits.

The website uses legalMoves() for everything. It's used for which hands you can click, for the list of splits, and for the computer's moves. The UI never figures out the rules by itself, so the AI and the UI can't disagree.

## Minimax Values

Every state gets a score from Player A's point of view:

1. +1 means A can force a win
2. 0 means neither player can force a win within the 20 turns
3. -1 means B can force a win

On A's turn the computer picks the move with the highest score, so A is MAX. On B's turn it picks the move with the lowest score, so B is MIN. The score of a state is what you get if both players always pick their best move from there. At a different selected move limit, 0 means no forced winner by that limit.

## Bottom-Up Dynamic Programming

bestMoveDP() in ai.js builds the whole depth-20 table when the page loads. Each row has the state, its score, and the best next state. Selecting a different depth builds or reuses a separate table for that depth.

It's built from the bottom up:

1. At level 20 (the last level), the score is -1 if A has (0, 0), +1 if B has (0, 0), and 0 if both are still alive.
2. Then it goes backwards from level 19 down to level 0. For each state it gets all the legal moves and looks up their scores, which are already in the table. On A's levels it keeps the highest one and on B's levels it keeps the lowest one.
3. It saves the score and the move that got that score.

Each hand can be 0 to 4, so there are 5 x 5 x 5 x 5 = 625 hand combos. There are 21 levels (0 through 20), so the table has 625 x 21 = 13,125 rows. When the game is running, the computer just looks up its move in the table.

Dynamic programming helps because lots of different move orders end up in the same state at the same level. The table saves each one so it only gets figured out once. A full tree would repeat the same work a lot.

At the start the default score is 0, so neither player can force a win in 20 turns if both play perfectly. The optional first-player analysis computes the opening score at several limits; it shows that this conclusion can change when the limit changes.

## Interface

1. Click one of your hands, then click one of the other player's hands to attack. The hand does a little tap animation.
2. The Split button shows the legal splits you can pick from. Both hands move together when fingers are redistributed.
3. You can pick "You vs AI" (as A or B), "Two players" on one device, or "Watch AI vs AI" with start, pause, one step, and a speed slider.
4. Restart button.
5. Move History shows every move and it scrolls.
6. AI Analysis can be hidden. It says the expected result, whose turn it is, and the best next move. The "Explore the move tree" part lets you click a possible move to see what would happen without actually playing it.
7. After the game is over you can go back through the moves in the move tree.
8. DP Statistics shows the table size, how long it took to build, the current level, turns left, and how many legal moves there are.
9. The Sound button starts off. Turn it on for local synthesized tap, split, and game-end sounds; no audio files or network access are needed.
10. The AI experiments show how the opening score changes at different move limits and compare bottom-up DP against uncached recursion at depth 6. They never change the current game. DP fills all possible state-level rows while recursion follows only reachable branches, so the displayed times are not an apples-to-apples speed benchmark.

## Software Organization

The submission folder has these files:

1. index.html - the page layout
2. style.css - the styling and animations
3. game.js - the rules and move generation
4. ai.js - the DP table and minimax
5. app.js - buttons, drawing the board, and running the turns
6. favicon.svg - the chopsticks icon in the browser tab
7. README.md
8. VIBE_LOG.md

I kept the rules and the AI in different files so the display code can't change them by accident. game.js sets up ChopsticksGame, ai.js sets up ChopsticksAI, and app.js uses both.

## Testing

I tested it a few different ways. The test files are in my Git repo but not in this submission folder.

1. JavaScript tests (Node): These check the rules and the DP table. They compare my move generator against a separate check on every hand combo for both players. They check that every row of the DP table is right, that knockouts score correctly, that the level 20 tie works, and that A picks the max and B picks the min. They also play thousands of computer vs computer games and check the buttons and page IDs.
2. Python tests: These test the Python version, which follows the starter code. I also compared my JavaScript moves with the starter code's next_moves on the same states.
3. Selenium tests (7): These open the real page in Chrome. They check the first screen, the setup buttons, the tap animation, restart, the analysis panel and move tree, a full computer vs computer game to level 20, and a phone-sized window (390px wide). The original suite passed before these optional extensions; the updated build still needs a manual browser check where Chrome is available.
4. Illegal moves: The tests check that clicking something illegal doesn't change the game.
5. Opening the file directly: I also checked that the page works when you double-click index.html, with no console errors.

## Security and Input Handling

The game does not accept free-form commands, connect to a server, or send information over the internet. Human moves are checked against legalMoves() before the state changes. Disabled and illegal hand selections do nothing, malformed states and unsupported search depths are rejected, and text shown in the page is added as text instead of executable HTML.

## Known Limitations

1. A score of 0 only means nobody can force a win before the selected move limit. It doesn't mean the game is a draw forever. When we tried a version with no turn limit, Player B could force a win. If the limit is raised to 26 turns the opening score changes from 0 to -1 (24 turns is still 0). I kept 20 as the default because the assignment says to.
2. When two moves have the same score, the computer picks the first one in the list. It doesn't try to win faster.
3. The game isn't saved if you close or refresh the page.
4. It only works on one computer. There's no online multiplayer.

## Implemented Extensions

After the required game was working, I added AI vs AI mode, same-device two-player mode, move history, tap and redistribution animations, optional sound, adjustable depth, DP Statistics, first-player opening analysis, a small DP-vs-recursion comparison, and the interactive decision map. After a completed game, the decision map can also move backward and forward through the route that was played without changing the final board or move history.

## Possible Extensions

1. Upload the prepared static files to a chosen hosting service if a public link is needed. The site has not been published yet.
2. Add game save/resume or online multiplayer in a later version; neither is needed for this assignment.

## Reflection

Question 1: Why does Player A maximize while Player B minimizes?

The scores are all from Player A's side. +1 is good for A and -1 is good for B. So A wants the biggest number and B wants the smallest number, which is why B picks the lowest.

Question 2: Why is the DP table built from the deepest level toward level 0?

A state's score depends on the scores of the states after it. So the later states need to be finished before the earlier ones. Level 20 is the only level where the scores are already known (knockout or tie), so we start there and work backwards.

Question 3: Why can dynamic programming be faster than exploring the whole game tree?

In a tree, the same state shows up over and over through different move orders. With DP each state and level is only figured out once and then saved. There are at most 13,125 rows, which is small, and looking up a saved score is quick.

Question 4: Why should the UI get legal moves from the game engine?

If the UI had its own copy of the rules, it could end up different from the AI's rules. Then the AI might allow a move the buttons don't or the other way around. Using legalMoves() for everything means there's only one set of rules to get right.

Question 5: What part of the project did your AI assistant help with most?

For me it was mostly comparing my code to the starter code, turning the Python into JavaScript, building the interface, and writing lots of tests.

Question 6: What AI-generated suggestion did you have to verify, modify, or reject?

At first the AI made up its own rules (hands sorted so left and right didn't matter, and no splits that leave a hand at 0), and I changed them to match the starter code. I also asked it to make the game keep going past 20 turns. It built that, but when we checked the assignment it broke the depth 20 requirement, so we went back to the 20 turn limit.
