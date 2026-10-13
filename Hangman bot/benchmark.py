"""Reproducible, entirely local Hangman strategy comparisons.

Examples::

    python benchmark.py --bot frequency --bot strategy_dictionary:DictionaryBot
    python benchmark.py --bot strategy_general:GeneralBot --holdout 0.25 --seed 42
    python benchmark.py --bot my_bot:MyBot --test unseen_words.txt --output results.json

No API client is imported and no server requests are made. All strategies receive
the same games, and a playing state never contains the hidden word. A benchmark
on training words measures dictionary coverage; use --holdout or a separate
--test corpus to measure performance on unseen words.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from collections.abc import Iterable
import importlib
import inspect
import json
from pathlib import Path
import random
import string
import time
from typing import Any

ALPHABET = string.ascii_lowercase
FREQUENCY_ORDER = "etaoinshrdlucmfwypvbgkjqxz"
WORD_DIRECTORY = Path(__file__).resolve().parent / "bot_examples" / "words"
MAX_WRONG_GUESSES = 6
MAX_TOTAL_GUESSES = 26


class BotProtocolError(ValueError):
    """A strategy returned an invalid or already-used letter."""


class FrequencyBot:
    """Simple baseline: use word-presence frequency, ignoring the pattern."""

    def __init__(self, words: Iterable[str] | None = None) -> None:
        counts = Counter(letter for word in (words or ()) for letter in set(word))
        self.order = sorted(
            ALPHABET,
            key=lambda letter: (-counts[letter], FREQUENCY_ORDER.index(letter)),
        )

    def choose_letter(self, state: dict[str, Any]) -> str:
        guessed = set(state["guessed_letters"])
        return next(letter for letter in self.order if letter not in guessed)


class RandomBot:
    """Seeded random baseline, included without importing the API examples."""

    def __init__(self, words: Iterable[str] | None = None, seed: int = 42) -> None:
        self.rng = random.Random(seed)

    def choose_letter(self, state: dict[str, Any]) -> str:
        guessed = set(state["guessed_letters"])
        return self.rng.choice([letter for letter in ALPHABET if letter not in guessed])


def read_word_files(paths: Iterable[Path]) -> list[tuple[str, str]]:
    """Read unique ASCII words, retaining a known file's difficulty label."""
    found: dict[str, str] = {}
    for path in paths:
        difficulty = path.stem.lower()
        if difficulty not in {"easy", "medium", "hard"}:
            difficulty = "unknown"
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            word = line.strip().lower()
            if word and all(letter in ALPHABET for letter in word):
                found.setdefault(word, difficulty)
    return sorted(found.items())


def split_words(
    entries: list[tuple[str, str]], fraction: float, seed: int
) -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    """Split distinct words by difficulty with no training/test overlap."""
    if not 0 < fraction < 1:
        raise ValueError("holdout fraction must be between 0 and 1")
    grouped: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for word, difficulty in dict(entries).items():
        grouped[difficulty].append((word, difficulty))
    rng = random.Random(seed)
    training: list[tuple[str, str]] = []
    testing: list[tuple[str, str]] = []
    for difficulty in sorted(grouped):
        group = sorted(grouped[difficulty])
        rng.shuffle(group)
        count = max(1, round(len(group) * fraction))
        if len(group) > 1:
            count = min(len(group) - 1, count)
        testing.extend(group[:count])
        training.extend(group[count:])
    return sorted(training), sorted(testing)


def _public_state(
    word: str, guessed: list[str], incorrect: list[str], difficulty: str
) -> dict[str, Any]:
    """Construct only the fields a player can observe while playing."""
    return {
        "pattern": " ".join(letter if letter in guessed else "_" for letter in word),
        "guessed_letters": guessed.copy(),
        "incorrect_letters": incorrect.copy(),
        "remaining_guesses": MAX_WRONG_GUESSES - len(incorrect),
        "status": "playing",
        "difficulty": difficulty,
    }


def simulate_game(bot: Any, word: str, difficulty: str = "unknown") -> dict[str, Any]:
    """Play a local game, raising immediately for a bot protocol violation."""
    if not word or any(letter not in ALPHABET for letter in word):
        raise ValueError("the local secret must be a nonempty lowercase ASCII word")
    guessed: list[str] = []
    incorrect: list[str] = []
    trace: list[dict[str, Any]] = []
    strategy_seconds = 0.0
    while not set(word).issubset(guessed) and len(incorrect) < MAX_WRONG_GUESSES:
        if len(guessed) >= MAX_TOTAL_GUESSES:
            raise BotProtocolError("bot exceeded the 26-guess cap")
        state = _public_state(word, guessed, incorrect, difficulty)
        # Preserve the trace even if a bot mutates its own input dictionary.
        recorded_state = {key: value.copy() if isinstance(value, list) else value
                          for key, value in state.items()}
        start = time.perf_counter()
        letter = bot.choose_letter(state)
        strategy_seconds += time.perf_counter() - start
        if not isinstance(letter, str) or len(letter) != 1 or letter not in ALPHABET:
            raise BotProtocolError(f"expected one lowercase ASCII letter, got {letter!r}")
        if letter in guessed:
            raise BotProtocolError(f"repeated letter {letter!r}")
        guessed.append(letter)
        hit = letter in word
        if not hit:
            incorrect.append(letter)
        trace.append({"state": recorded_state, "letter": letter, "hit": hit})
    won = set(word).issubset(guessed)
    remaining = MAX_WRONG_GUESSES - len(incorrect)
    return {
        "word": word,
        "difficulty": difficulty,
        "status": "won" if won else "lost",
        "score": 100 + 10 * remaining if won else 0,
        "guesses": len(guessed),
        "guessed_letters": guessed,
        "incorrect_letters": incorrect,
        "remaining_guesses": remaining,
        "strategy_seconds": strategy_seconds,
        "trace": trace,
    }


def summarize(games: list[dict[str, Any]]) -> dict[str, Any]:
    wins = [game for game in games if game["status"] == "won"]
    count = len(games)
    return {
        "games": count,
        "wins": len(wins),
        "losses": sum(game["status"] == "lost" for game in games),
        "errors": sum(game["status"] == "error" for game in games),
        "win_rate": len(wins) / count if count else 0.0,
        "total_score": sum(game["score"] for game in games),
        "average_guesses": sum(game["guesses"] for game in games) / count if count else 0.0,
        "average_remaining_on_wins": (
            sum(game["remaining_guesses"] for game in wins) / len(wins) if wins else 0.0
        ),
        "strategy_seconds": sum(game.get("strategy_seconds", 0.0) for game in games),
    }


def load_bot(reference: str, words: tuple[str, ...], seed: int) -> Any:
    if reference == "frequency":
        return FrequencyBot(words=words)
    if reference == "random":
        return RandomBot(words=words, seed=seed)
    if ":" not in reference:
        raise ValueError("bot must be frequency, random, or module:Class")
    module_name, class_name = reference.rsplit(":", 1)
    cls = getattr(importlib.import_module(module_name), class_name)
    parameters = inspect.signature(cls).parameters
    kwargs: dict[str, Any] = {}
    if "words" in parameters or any(
        parameter.kind == inspect.Parameter.VAR_KEYWORD for parameter in parameters.values()
    ):
        kwargs["words"] = words
    elif words:
        raise TypeError(f"{reference} must accept words= so training splits are respected")
    if "seed" in parameters:
        kwargs["seed"] = seed
    return cls(**kwargs)


def benchmark(
    reference: str, training: list[tuple[str, str]], testing: list[tuple[str, str]], seed: int
) -> dict[str, Any]:
    initialization_start = time.perf_counter()
    bot = load_bot(reference, tuple(word for word, _ in training), seed)
    initialization_seconds = time.perf_counter() - initialization_start
    start = time.perf_counter()
    games = []
    for word, difficulty in testing:
        try:
            game = simulate_game(bot, word, difficulty)
        except Exception as error:
            # An invalid strategy must count as a failed game, never disappear.
            game = {"word": word, "difficulty": difficulty, "status": "error",
                    "error": f"{type(error).__name__}: {error}", "score": 0,
                    "guesses": 0, "remaining_guesses": 0, "trace": []}
        games.append(game)
    by_difficulty = {
        difficulty: summarize([game for game in games if game["difficulty"] == difficulty])
        for difficulty in sorted({game["difficulty"] for game in games})
    }
    return {
        "bot": reference,
        "initialization_seconds": initialization_seconds,
        "elapsed_seconds": time.perf_counter() - start,
        "summary": summarize(games),
        "by_difficulty": by_difficulty,
        "games": games,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bot", action="append", help="repeat for each module:Class, frequency, or random")
    parser.add_argument("--games", type=int, help="number of identical sampled games per bot; default: all test words")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--training", type=Path, action="append", help="training word file; repeat for multiple files")
    parser.add_argument("--test", type=Path, action="append", help="test word file; repeat for multiple files")
    parser.add_argument("--holdout", type=float, help="split supplied words; this fraction is held out for testing")
    parser.add_argument("--output", type=Path, help="save metadata, summaries, and local per-game traces as JSON")
    args = parser.parse_args(argv)
    if args.games is not None and args.games < 1:
        parser.error("--games must be positive")
    if args.holdout is not None and (not 0 < args.holdout < 1 or args.training or args.test):
        parser.error("--holdout must be between 0 and 1 and cannot be combined with --training/--test")
    supplied_paths = [WORD_DIRECTORY / f"{difficulty}.txt" for difficulty in ("easy", "medium", "hard")]
    if args.holdout is not None:
        training, testing = split_words(read_word_files(supplied_paths), args.holdout, args.seed)
    else:
        training = read_word_files(args.training or supplied_paths)
        testing = read_word_files(args.test or supplied_paths)
    if not training or not testing:
        parser.error("training and testing must both contain valid words")
    test_population = testing
    rng = random.Random(args.seed)
    if args.games is not None:
        testing = (rng.sample(test_population, args.games) if args.games <= len(test_population)
                   else rng.choices(test_population, k=args.games))
    training_words = {word for word, _ in training}
    overlap = len(training_words & {word for word, _ in test_population})
    print(f"Training: {len(training)} | Test pool: {len(test_population)} | Games per bot: {len(testing)} | Seed: {args.seed}")
    print(f"Training/test overlap: {overlap} words" + (" (known-word benchmark)" if overlap else " (unseen-word benchmark)"))
    comparisons = []
    for reference in args.bot or ["frequency"]:
        result = benchmark(reference, training, testing, args.seed)
        comparisons.append(result)
        stats = result["summary"]
        print(f"\n{reference}: {stats['wins']}/{stats['games']} wins ({stats['win_rate']:.1%}), "
              f"score {stats['total_score']}, guesses {stats['average_guesses']:.2f}, "
              f"lives/win {stats['average_remaining_on_wins']:.2f}, "
              f"errors {stats['errors']}, {result['elapsed_seconds']:.3f}s")
        for difficulty, stats in result["by_difficulty"].items():
            print(f"  {difficulty}: {stats['wins']}/{stats['games']} ({stats['win_rate']:.1%}), "
                  f"score {stats['total_score']}")
    if args.output:
        payload = {
            "local_only": True, "seed": args.seed, "holdout": args.holdout,
            "training_count": len(training), "test_pool_count": len(test_population),
            "training_test_overlap": overlap, "training_words": sorted(training_words),
            "test_words": [word for word, _ in testing], "results": comparisons,
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"\nSaved {args.output.resolve()}")
    return 1 if any(result["summary"]["errors"] for result in comparisons) else 0


if __name__ == "__main__":
    raise SystemExit(main())
