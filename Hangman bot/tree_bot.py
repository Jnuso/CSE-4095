"""Hangman decision graph over words consistent with public observations.

Each action is a letter; branches are its full position mask, including zero
for a miss. A node is (remaining candidate words, remaining lives). Cached
nodes shared by different paths form a directed acyclic graph.
"""

import hashlib
import json
from pathlib import Path
from typing import Iterable

from my_bot import MyBot
from strategy_optimal import OptimalBot


ROOT = Path(__file__).resolve().parent


class TreeBot:
    """Optimize wins, then lives, using the public difficulty when supplied.

Training uses the complete public dictionaries. A partial collection of observed
answers must never replace them. Missing difficulty or an unmatched word falls
back to the combined dictionary and the successful original bot.
"""

    def __init__(self, words: Iterable[str] | None = None, *,
                 word_groups: dict[str, Iterable[str]] | None = None,
                 policy_path: Path | None = None,
                 seconds: float = 0.25, node_limit: int = 60000) -> None:
        if words is not None and word_groups is not None:
            raise ValueError("pass words or word_groups, not both")
        default_training = words is None and word_groups is None
        if default_training:
            word_groups = {difficulty: (ROOT / "bot_examples" / "words" / f"{difficulty}.txt")
                           .read_text(encoding="utf-8").splitlines()
                           for difficulty in ("easy", "medium", "hard")}
            self.fallback = MyBot()
        else:
            if word_groups is not None:
                word_groups = {name: tuple(entries) for name, entries in word_groups.items()}
                words = set(word for entries in word_groups.values() for word in entries)
            words = tuple(words or ())
            self.fallback = MyBot(words=words)
        if default_training:
            words = set(word for entries in word_groups.values() for word in entries)
        self.bank_source = "complete public assignment dictionaries" if default_training else "explicit training words"
        self.tree = OptimalBot(words=words, seconds=seconds, node_limit=node_limit)
        self.by_difficulty = {name: OptimalBot(words=entries, seconds=seconds, node_limit=node_limit)
                              for name, entries in (word_groups or {}).items()}
        self.words = self.tree.words
        self.loaded_policy_states = 0
        if policy_path is not None or default_training:
            self._load_policy(policy_path or ROOT / "data" / "tree_policy.json")

    @staticmethod
    def word_fingerprint(planner: OptimalBot) -> str:
        return hashlib.sha256("\n".join(planner.words).encode("utf-8")).hexdigest()

    def planners(self) -> dict[str, OptimalBot]:
        return {"combined": self.tree, **self.by_difficulty}

    def _load_policy(self, path: Path) -> None:
        """Ignore stale or incomplete caches; the online planner still works."""
        try:
            document = json.loads(path.read_text(encoding="utf-8"))
            if document.get("version") != 1:
                return
            for name, planner in self.planners().items():
                bank = document.get("banks", {}).get(name, {})
                if bank.get("words_sha256") != self.word_fingerprint(planner):
                    continue
                loaded = {}
                for row in bank.get("states", []):
                    indexes, lives, wins, saved, letter = row
                    indexes = tuple(indexes)
                    if (not indexes or indexes != tuple(sorted(set(indexes)))
                            or not all(isinstance(i, int) and 0 <= i < len(planner.words) for i in indexes)
                            or not all(isinstance(i, int) for i in (lives, wins, saved, letter))
                            or not 1 <= lives <= 6 or not 0 <= wins <= len(indexes)
                            or not 0 <= saved <= wins * lives or not 0 <= letter < 26
                            or len(planner._groups(indexes, letter)) <= 1):
                        raise ValueError("invalid tree policy state")
                    loaded[indexes, lives] = wins, saved, letter
                planner._values.update(loaded)
                self.loaded_policy_states += len(loaded)
        except (OSError, ValueError, TypeError, KeyError, AttributeError):
            # A missing or invalid local optimization file cannot stop a run.
            return

    def choose_letter(self, state: dict) -> str:
        difficulty = state.get("difficulty")
        planner = self.by_difficulty.get(difficulty) if isinstance(difficulty, str) else None
        if planner is not None and planner.candidate_words(state):
            return planner.choose_letter(state)
        if self.tree.candidate_words(state):
            return self.tree.choose_letter(state)
        # The server may choose words outside every public dictionary.
        return self.fallback.choose_letter(state)


if __name__ == "__main__":
    from bot_examples.runner import run_cli

    raise SystemExit(run_cli(TreeBot(), "Decision graph bot"))
