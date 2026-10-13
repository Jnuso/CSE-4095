"""Difficulty routing, cache binding, and public-state boundaries."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from benchmark import simulate_game
from tree_bot import TreeBot


class ImprovedTreeTests(unittest.TestCase):
    def test_known_public_difficulty_limits_the_candidate_bank(self):
        bot = TreeBot(word_groups={"easy": ["cat"], "hard": ["dog"]})
        for difficulty, word in (("easy", "cat"), ("hard", "dog")):
            result = simulate_game(bot, word, difficulty)
            self.assertEqual(result["status"], "won")
            self.assertEqual(result["remaining_guesses"], 6)

    def test_absent_unknown_and_mismatched_difficulty_use_combined_bank(self):
        bot = TreeBot(word_groups={"easy": ["cat"], "hard": ["dog"]})
        for difficulty in (None, "unknown", [], "hard"):
            state = {"pattern": "c _ _", "guessed_letters": ["c"], "incorrect_letters": [],
                     "remaining_guesses": 6, "status": "playing", "difficulty": difficulty}
            self.assertIn(bot.choose_letter(state), "at")

    def test_explicit_training_does_not_reload_public_words(self):
        bot = TreeBot(word_groups={"easy": ["cat", "bat"], "hard": ["dog"]})
        self.assertEqual(set(bot.words), {"cat", "bat", "dog"})
        self.assertEqual(set(bot.fallback.dictionary.words), set(bot.words))
        self.assertEqual(set(bot.fallback.general.words), set(bot.words))

    def test_live_answer_is_never_read(self):
        class Guarded(dict):
            def get(self, key, default=None):
                if key == "word":
                    raise AssertionError("read hidden answer")
                return super().get(key, default)
            def __getitem__(self, key):
                if key == "word":
                    raise AssertionError("read hidden answer")
                return super().__getitem__(key)
        bot = TreeBot(word_groups={"easy": ["cat", "bat"], "hard": ["dog"]})
        state = Guarded(pattern="_ _ _", guessed_letters=[], incorrect_letters=[],
                        remaining_guesses=6, difficulty="easy", status="playing", word="secret")
        self.assertIn(bot.choose_letter(state), "catb")

    def test_stale_and_corrupt_policy_cannot_change_explicit_training(self):
        root = Path(__file__).resolve().parent / "results"
        with TemporaryDirectory(dir=root, prefix="tree_policy_test_") as directory:
            policy = Path(directory) / "policy.json"
            policy.write_text(json.dumps({"version": 1, "banks": {"combined": {
                "words_sha256": "different bank", "states": [[[0, 1], 6, 2, 12, 25]]}}}))
            bot = TreeBot(words=["cat", "bat"], policy_path=policy)
            self.assertEqual(bot.loaded_policy_states, 0)
            self.assertEqual(simulate_game(bot, "cat")["status"], "won")
            policy.write_text("{broken")
            self.assertEqual(TreeBot(words=["cat", "bat"], policy_path=policy).loaded_policy_states, 0)


if __name__ == "__main__":
    unittest.main()
