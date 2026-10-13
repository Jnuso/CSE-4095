"""Compare bundled default bots and disjoint training/test configurations.

All games run locally. The test words are never passed to a bot through state.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import random
import time

from benchmark import FrequencyBot, read_word_files, simulate_game, split_words, summarize
from my_bot import MyBot
from strategy_dictionary import DictionaryBot
from strategy_general import GeneralBot


ROOT = Path(__file__).resolve().parent


def compare(name, factories, testing):
    print(f"\n{name}: {len(testing)} identical local games", flush=True)
    results = []
    for label, factory in factories:
        start = time.perf_counter()
        bot = factory()
        games = [simulate_game(bot, word, difficulty) for word, difficulty in testing]
        stats = summarize(games)
        result = {"bot": label, **stats, "elapsed_seconds": time.perf_counter() - start,
                  "losses_words": [game["word"] for game in games if game["status"] != "won"],
                  "by_difficulty": {difficulty: summarize([game for game in games
                                        if game["difficulty"] == difficulty])
                                    for difficulty in sorted({d for _, d in testing})}}
        results.append(result)
        print(f"  {label}: {stats['wins']}/{len(testing)} ({stats['win_rate']:.2%}), "
              f"score={stats['total_score']}, lives/win={stats['average_remaining_on_wins']:.3f}, "
              f"time={result['elapsed_seconds']:.2f}s", flush=True)
    return {"suite": name, "test_words": [word for word, _ in testing], "results": results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--suite", choices=["known", "class_holdout", "broad_holdout"], required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--games", type=int, default=300, help="broad corpus test sample size")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    supplied = read_word_files((ROOT / "bot_examples" / "words").glob("*.txt"))
    extra = read_word_files([ROOT / "data" / "english_words.txt"])
    supplied_words = tuple(word for word, _ in supplied)
    if args.suite == "known":
        result = compare("All public class words (included in training)", [
            ("frequency", lambda: FrequencyBot(words=supplied_words)),
            ("dictionary", DictionaryBot), ("general", GeneralBot), ("hybrid", MyBot),
        ], supplied)
        result["training_test_overlap"] = len(supplied)
    elif args.suite == "class_holdout":
        training, testing = split_words(supplied, 0.25, args.seed)
        withheld = {word for word, _ in testing}
        train_words = tuple(word for word, _ in training)
        broader = tuple(sorted(set(train_words).union(word for word, _ in extra) - withheld))

        def hybrid():
            bot = MyBot(words=train_words)
            bot.general = GeneralBot(words=broader)
            return bot

        assert not withheld.intersection(broader)
        result = compare("25% class holdout (test words removed from ALL training)", [
            ("frequency", lambda: FrequencyBot(words=train_words)),
            ("dictionary", lambda: DictionaryBot(words=train_words)),
            ("general_small", lambda: GeneralBot(words=train_words)),
            ("general_expanded", lambda: GeneralBot(words=broader)),
            ("hybrid_expanded", hybrid),
        ], testing)
        result.update(training_test_overlap=0, primary_training_count=len(train_words),
                      expanded_training_count=len(broader))
    else:
        all_entries = sorted(dict(extra + supplied).items())
        training, testing = split_words(all_entries, 0.25, args.seed)
        rng = random.Random(args.seed)
        testing = rng.sample(testing, min(args.games, len(testing)))
        train_words = tuple(word for word, _ in training)
        primary = tuple(sorted(set(train_words).intersection(supplied_words)))

        def hybrid():
            bot = MyBot(words=primary)
            bot.general = GeneralBot(words=train_words)
            return bot

        result = compare("Broad public corpus holdout (unseen words)", [
            ("frequency", lambda: FrequencyBot(words=train_words)),
            ("general", lambda: GeneralBot(words=train_words)),
            ("hybrid", hybrid),
        ], testing)
        result.update(training_test_overlap=0, training_count=len(train_words),
                      primary_training_count=len(primary))
    result.update(local_only=True, seed=args.seed)
    output = args.output or ROOT / "results" / f"{args.suite}_{args.seed}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(f"Saved {output.resolve()}", flush=True)


if __name__ == "__main__":
    main()
