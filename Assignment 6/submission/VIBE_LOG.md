# Vibe Coding Log

These are 5 of the AI chats I had while working on this project. I didn't paste the whole conversation. The prompts are copied word for word from my chat (typos included), and the AI suggestions are word for word too. When I only used part of a reply, I put […] where I skipped something.

## Interaction 1: Figuring Out the Rules

**Prompt**:

can you look online to see if you can find a general consesis of the rules online and then explain them to me in this chat see if my understanding is how most people play the game

can you check online if a dead hand is actually out because it seems online that you can revive a dead hand and you only loose when both hands are knocked out

**AI suggestion**:

There is no single official Chopsticks ruleset—it is a playground game with many regional variations.

[…]

1. Splitting can usually revive a dead hand, such as 0 | 4 → 2 | 2.
2. Merely swapping hands, such as 1 | 3 → 3 | 1, does not count.
3. The first player with 0 | 0 loses.

And after my second question:

You’re correct. In the commonly described rules, “dead” means temporarily inactive, not permanently unrecoverable.

1. A dead hand is represented by 0.
2. It cannot attack or be targeted.
3. The player can revive it by redistributing fingers from their remaining live hand.
4. The player loses only when both hands are dead.

**What I accepted or changed**:

I accepted that a hand at 0 can come back to life by splitting, and that you only lose when both hands are 0. A few chats later I got the starter code, and I decided to use the starter code's rules instead of the AI's version, since the assignment says the starter code is the official rules.

**What I learned or verified**:

I learned that Chopsticks doesn't have one official set of rules, so a program has to say exactly what it's doing. I started out thinking a knocked-out hand was out for good. I saw online that hands can be revived, so I asked the AI to check that, and it confirmed it and pointed to sources.

## Interaction 2: Comparing My Code to the Starter Code

**Prompt**:

ok i just got some more material for the assignment how does what we currently have compare to the base code that i just recevied, are our rules alligned with this initial test code if there are differences to me explain them also walk me through the main functions of the starter code in the chat dont make any changes yet in this turn just highlight the differences so we can make the desicion if we want to modify our python code also give me your opinion or if our python code is still valid

ok lets move to the rules from the starter code before you commit in this chat explain and show me the functions that will be changes and once i have reviewed we will then modify our script

**AI suggestion**:

The split rule is the most consequential difference. From the opening 1 | 1 versus 1 | 1, the starter allows A to transfer a finger to make 0 | 2 or 2 | 0. Our rules prohibit that.

[…]

My opinion: our program is a coherent, working version of Chopsticks, but I would not assume it satisfies this newly supplied assignment as-is.

After I approved the changes:

The legal moves now match the supplied starter code. Left and right hands remain distinct, a transfer may leave one hand at 0, and a pure swap is still prohibited. The opening has the starter’s four successors. An exhaustive comparison found zero move-set differences across 1,248 valid ordered states.

**What I accepted or changed**:

I asked the AI not to change anything at first and just show me the differences and which functions would need to change. After I read it, I told it to match the starter code's move rules first. That meant left and right hands are treated as different, and a split is allowed to leave a hand at 0. I decided on the draw rule and the AI method in a separate step.

**What I learned or verified**:

I learned that a small rule change can change the whole set of moves. Letting a split leave a hand at 0 gave the opening 4 moves instead of 1. I didn't check all 1,248 states by hand. The test suite compares the moves against the starter code, and the tests passed after the change.

## Interaction 3: Playing Past Move 20 and Then Going Back

**Prompt**:

ok its stopping after 20 moves i want them to play until the game is over

**AI suggestion**:

The browser game no longer stops at move 20. It now continues until one player has 0 | 0.

The new infinite-horizon graph solver determines that optimal play from the opening ends with Player B winning on move 26.

**Prompt**:

ok this is looking good now lets check over the actual assignment and see the differences between what we have and what the instructions are also check back with the initial base code too and ensure that we are still true to this

**AI suggestion**:

The core game rules are aligned, but the current website is not fully assignment-compliant. The main conflict is that the browser now plays until knockout using the cyclic solver, while the assignment requires the starter code’s depth-20 bottom-up minimax model and a tie at the search limit.

[…]

This changes the opening result:

1. Starter/assignment model: score 0, meaning a tie within the 20-move horizon.
2. Current browser model: score -1, meaning B can force a knockout after 26 moves.

**Prompt**:

were doing the maximum depth thing again after 20 moves the game stops does it say that this is supposed to happen anywhere in the game directions?

**AI suggestion**:

Yes. The 20-move ending is explicitly required by this assignment, even though it is not necessarily part of ordinary playground Chopsticks.

**What I accepted or changed**:

I thought the game stopping at 20 moves was a bug, so I asked for the game to keep going. The AI did it, but then the check against the assignment showed it broke the required depth 20 rule. It even changed the opening result from a tie to a win for Player B. I told it to make the site follow the assignment, and the 20 turn limit and the tie went back in. Later the game stopped at 20 again and I asked if that was on purpose, and it said the assignment requires it.

**What I learned or verified**:

The 20 turn limit isn't a bug, it's part of the assignment. The assignment calls it a depth-limited game tree, a score of 0 means a tie within the search limit, and one of the required tests is the maximum-depth tie. This was my debugging entry, because I saw a "problem" that was really the assignment's rule.

## Interaction 4: Understanding Bottom-Up DP and the Tie

**Prompt**:

ok allign the file structure, interface, ai analysis panel, and testing also we should align Bottom-up depth-20 DP and Maximum-depth tie but before we do this explain the last two to me in more detail of what we have and what we need i do not fully understand yet

**AI suggestion**:

The level must be included because the same hands can have different values depending on how many moves remain.

[…]

We calculate the ending level first and then work backward toward the opening:

[…]

A useful interpretation of 0 is:

“No forced winner was established within the assignment’s 20-move search horizon.”

[…]

Therefore, a knockout on the twentieth move still counts as a win. It is only a tie when level 20 is reached and neither player has been eliminated.

**What I accepted or changed**:

I asked for the explanation before letting the AI change any code. After I understood it, I told it to go ahead and make the site follow the assignment. That meant the depth 20 table, the tie at the max depth, and moving the files into the required layout.

**What I learned or verified**:

I learned why the level is part of the state, and why the table is built starting at level 20 and going back to level 0. I also learned that a tie at the max depth only means nobody won yet, not that the game is a draw forever. The size adds up. 5 x 5 x 5 x 5 is 625 hand combos, and times 21 levels is 13,125, which is the same number the assignment gives.

## Interaction 5: Making the Tests Better

**Prompt**:

Increase the test sweet ensure things are working properly

Can you use selenium to test the web pages

**AI suggestion**:

I also fixed two mutation risks in game.js: the initial state is now deeply frozen, and split metadata no longer shares arrays with successor states.

And for Selenium:

The Codex sandbox blocks Chrome from launching, so Selenium tests were collected but skipped here.

**What I accepted or changed**:

I accepted the bigger test suite and the two fixes in game.js. The Selenium tests couldn't run in the AI's sandbox, so I ran them in my own terminal. At first 6 of the 7 passed. I pasted the output back and the AI said the failing one was a problem with the test, not the website. The phone-sized window test was resizing the whole Chrome window, and Chrome on Windows has a minimum window width, so it couldn't get down to 390px. The AI changed it to use Chrome's device emulation for a real 390px wide screen. After that all the tests passed.

**What I learned or verified**:

Tests can help you find weak spots in your code, and the tests themselves can be wrong too. While the tests were being written, the AI found two places where the starting state and the split data could get changed by accident, and fixed them. The Selenium failure was a problem in the test, not in the website. I reran everything after each fix to make sure it still passed.
