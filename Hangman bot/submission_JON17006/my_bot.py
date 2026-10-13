"""Hangman bot combining the public class dictionary with a broader model.

The server owns the word and rules. This class reads only the public pattern,
guessed letters, incorrect letters, and remaining lives.
"""

from pathlib import Path
from typing import Iterable

from strategy_dictionary import DictionaryBot
from strategy_general import GeneralBot


ROOT = Path(__file__).resolve().parent


class MyBot:
    """Use the class dictionary when consistent; back off to broader English."""

    def __init__(self, words: Iterable[str] | None = None) -> None:
        if words is None:
            primary = {word.strip().lower()
                       for path in (ROOT / "bot_examples" / "words").glob("*.txt")
                       for word in path.read_text(encoding="utf-8").splitlines()
                       if word.strip()}
            broader = set(primary)
            extra = ROOT / "data" / "english_words.txt"
            if extra.exists():
                broader.update(extra.read_text(encoding="utf-8").splitlines())
        else:
            # An explicit training split is authoritative: never reload words
            # withheld by a local benchmark from the bundled dictionaries.
            primary = set(words)
            broader = set(primary)
        self.dictionary = DictionaryBot(words=primary)
        self.general = GeneralBot(words=broader)
    def choose_letter(self, state: dict) -> str:
        # Hangman reveals every occurrence of a correctly guessed letter.
        # A candidate cannot hide a guessed letter in an underscore slot.
        if self.dictionary.candidate_words(state):
            return self.dictionary.choose_letter(state)
        return self.general.choose_letter(state)


if __name__ == "__main__":
    from bot_examples.runner import run_cli

    raise SystemExit(run_cli(MyBot(), "Dictionary and context bot"))
