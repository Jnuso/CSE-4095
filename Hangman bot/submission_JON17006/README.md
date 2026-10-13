# JON17006 Hangman submission

This folder preserves the same bot code and training files used for the completed successful evaluation. Keep the folder contents together: `my_bot.py` imports both strategy modules and the shared runner, and loads the included word lists.

## Recorded official result

- NetID: JON17006
- Evaluation ID: 3469322578b80fce
- Wins: 300/300 (100%)
- Total score: 45,270
- Average guesses: 7.34
- Average lives remaining on wins: 5.09
- Rank in the pasted leaderboard: 18

The complete user-provided terminal output is in `evidence/successful_run.txt`. The leaderboard can change and resets when the server restarts.

## Required screenshot before upload

The assignment asks for bot code and a screenshot showing your rank and win rate on the Hangman website. Save that website screenshot in `evidence/leaderboard.png` before submitting. Terminal output is included as supporting evidence; the required website screenshot has not yet been added. If using the ZIP, add the screenshot to the ZIP too, or attach it separately with your submission.

## Run

Use Python 3.10 or newer. No third-party packages are required; the HTTP client optionally uses certifi if it is already installed.

Open https://hangman-ex89.onrender.com/ and wait for the site to load. From this folder, run:

```powershell
python my_bot.py --evaluate --name JON17006 --url https://hangman-ex89.onrender.com
```

Let all 300 games finish. This command starts a new evaluation. There is no need to rerun the bot to use the successful result already recorded here.

## Strategy

The bot filters candidate words by word length, revealed letters, every occurrence of each guessed letter, and incorrect guesses. It prefers certain hits and uses letter frequency, information gain, and a bounded decision-tree search to choose other guesses. If the supplied dictionary has no matching candidate, it uses a broader public English dictionary and character context statistics. It returns one unused lowercase letter using public game state only.

`SHA256SUMS.txt` records hashes for the frozen runtime files so future experiments can be kept separate from this successful version.
