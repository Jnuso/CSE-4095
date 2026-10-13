# Training word sources

`../bot_examples/words/*.txt` are the public training lists supplied with the assignment.

`english_words.txt` is the 9,894-entry no-swears word list from [first20hours/google-10000-english](https://github.com/first20hours/google-10000-english), filtered to lowercase alphabetic words of 3 through 24 letters. Source: https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt (accessed 2026-10-08).

The two sources above are general public training words, obtained independently of the Hangman server. Web-frequency lists include names and abbreviations, so this dictionary is an imperfect approximation to English words.

`observed_words.txt`, when created by `collect_words.py`, records answers revealed only after completed server games. Each collection run's metadata and raw final results are stored in `../results/`. A 300-game sample is not proof of the server's complete vocabulary. No hidden answer from a playing game, upcoming word, game log, or replay is used.
