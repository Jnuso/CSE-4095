"""Collector boundaries and decision-graph value checks; no real HTTP calls."""

from functools import lru_cache
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock, patch
import os

from benchmark import FrequencyBot, simulate_game
from bot_examples.runner import play_evaluation
from collect_words import FinishedWordCollector, atomic_write_text, finished_word, import_completed_results
from bot_examples.api_client import HangmanApiError
from strategy_optimal import OptimalBot
from tree_bot import TreeBot


def brute_value(words, lives, guessed=frozenset()):
    """Independent exhaustive search retaining guessed letters explicitly."""
    @lru_cache(None)
    def value(candidates, remaining, tried):
        if remaining <= 0:
            return 0, 0
        letters = set().union(*(set(word) for word in candidates)) - tried
        if not letters:
            return len(candidates), len(candidates) * remaining
        best = (0, 0)
        for letter in letters:
            groups = {}
            for word in candidates:
                outcome = tuple(i for i, char in enumerate(word) if char == letter)
                groups.setdefault(outcome, []).append(word)
            children = [value(tuple(group), remaining - int(not outcome), tried | {letter})
                        for outcome, group in groups.items()]
            best = max(best, (sum(x[0] for x in children), sum(x[1] for x in children)))
        return best
    return value(tuple(sorted(words)), lives, guessed)


class CollectorTests(unittest.TestCase):
    def temporary_folder(self):
        root = Path(__file__).resolve().parent / "results"
        root.mkdir(exist_ok=True)
        temporary = TemporaryDirectory(prefix="persistence_test_", dir=root)
        folder = Path(temporary.name).resolve()
        self.assertEqual(folder.parent, root.resolve())
        self.addCleanup(temporary.cleanup)
        return folder

    def test_temporary_file_lock_is_retried_without_losing_data(self):
        folder = self.temporary_folder()
        target = folder / "checkpoint.json"
        real_replace = os.replace
        failures = 0
        def transient_lock(source, destination):
            nonlocal failures
            if failures < 2:
                failures += 1
                raise PermissionError("simulated Windows file lock")
            return real_replace(source, destination)
        with patch("collect_words.os.replace", side_effect=transient_lock) as replace, \
             patch("collect_words.time.sleep"):
            atomic_write_text(target, '{"preserved": true}')
        self.assertEqual(replace.call_count, 3)
        self.assertEqual(json.loads(target.read_text()), {"preserved": True})
        self.assertEqual(list(folder.glob("*.tmp")), [])

    def test_persistent_project_locks_use_recovery_and_do_not_stop_games(self):
        folder = self.temporary_folder()
        bank, checkpoint = folder / "bank.txt", folder / "checkpoint.json"
        recovery = folder / "outside_sync"
        warnings = []
        collector = FinishedWordCollector(bank, checkpoint, "test", "offline",
                                           backup_dir=recovery, warning=warnings.append)
        real_replace = os.replace
        def project_lock(source, destination):
            if Path(destination) in {bank, checkpoint}:
                raise PermissionError("simulated persistent OneDrive lock")
            return real_replace(source, destination)
        with patch("collect_words.os.replace", side_effect=project_lock), \
             patch("collect_words.time.sleep"):
            for word in ("apple", "letter", "rhythm"):
                collector.observe({"status": "won", "word": word})
        self.assertEqual(len(collector.games), 3)
        self.assertEqual(set(collector.recovery_path(bank).read_text().splitlines()), {"apple", "letter", "rhythm"})
        self.assertEqual(json.loads(collector.recovery_path(checkpoint).read_text())["observed_games"], 3)
        self.assertEqual(len(warnings), 2)  # One warning per locked project file.
        restarted = FinishedWordCollector(bank, folder / "next.json", "test", "offline",
                                          backup_dir=recovery, warning=warnings.append)
        self.assertEqual(restarted.words, collector.words)
        collector.persist()  # Files become available again; restore normal paths.
        self.assertEqual(set(bank.read_text().splitlines()), collector.words)

    def test_all_storage_unavailable_is_nonfatal_and_keeps_words_in_memory(self):
        folder = self.temporary_folder()
        warnings = []
        collector = FinishedWordCollector(folder / "bank.txt", folder / "checkpoint.json", "test", "offline",
                                           backup_dir=folder / "recovery", warning=warnings.append)
        with patch("collect_words.atomic_write_text", side_effect=PermissionError("storage blocked")):
            for word in ("apple", "letter", "rhythm"):
                collector.observe({"status": "won", "word": word})
        self.assertEqual(collector.words, {"apple", "letter", "rhythm"})
        self.assertEqual(len(collector.games), 3)
        self.assertTrue(warnings)
        collector.persist()  # Latest in-memory snapshot is saved when storage returns.
        self.assertEqual(json.loads(collector.checkpoint_path.read_text())["observed_games"], 3)

    def test_finish_uses_memory_and_complete_results_when_checkpoint_is_locked(self):
        folder = self.temporary_folder()
        collector = FinishedWordCollector(folder / "bank.txt", folder / "checkpoint.json", "test", "offline",
                                           backup_dir=folder / "recovery", warning=lambda _: None)
        results = {"total_games": 2, "evaluation_id": "existing", "games": [
            {"status": "won", "word": "apple"}, {"status": "lost", "word": "letter"}]}
        real_replace = os.replace
        def checkpoint_lock(source, destination):
            if Path(destination) == collector.checkpoint_path:
                raise PermissionError("locked")
            return real_replace(source, destination)
        with patch("collect_words.os.replace", side_effect=checkpoint_lock), patch("collect_words.time.sleep"):
            collector.finish(results, folder / "official.json")
        self.assertTrue(collector.completed)
        self.assertEqual(collector.words, {"apple", "letter"})
        self.assertEqual(json.loads(collector.official_results_path.read_text()), results)
        saved = json.loads(collector.recovery_path(collector.checkpoint_path).read_text())
        self.assertTrue(saved["evaluation_completed"])
        self.assertEqual(saved["observed_games"], 2)

    def test_resume_completed_evaluation_does_not_start_a_new_run(self):
        client = Mock()
        client.get_evaluation.return_value = {"evaluation_id": "existing", "total_games": 300,
                                              "evaluation_status": "completed"}
        client.evaluation_results.return_value = {"wins": 300}
        started = []
        result = play_evaluation(client, Mock(), evaluation_id="existing", on_evaluation_started=started.append)
        self.assertEqual(result, {"wins": 300})
        self.assertEqual(started, ["existing"])
        client.start_evaluation.assert_not_called()
        client.evaluation_guess.assert_not_called()
        client.evaluation_next.assert_not_called()

    def test_abandoned_resume_does_not_start_replacement(self):
        client = Mock()
        client.get_evaluation.return_value = {"evaluation_status": "abandoned"}
        with self.assertRaises(HangmanApiError):
            play_evaluation(client, Mock(), evaluation_id="abandoned")
        client.start_evaluation.assert_not_called()
        client.evaluation_guess.assert_not_called()

    def test_playing_answer_is_never_accessed(self):
        class Guarded(dict):
            def get(self, key, default=None):
                if key == "word":
                    raise AssertionError("attempted to read a playing answer")
                return super().get(key, default)
        with self.assertRaises(ValueError):
            finished_word(Guarded(status="playing", word="secret"))
        self.assertEqual(finished_word({"status": "won", "word": "Letter"}), "letter")
        self.assertEqual(finished_word({"status": "lost", "word": "rhythm"}), "rhythm")

    def test_collection_callback_runs_only_after_terminal_games(self):
        class FakeClient:
            def __init__(self):
                self.secrets = ("letter", "cat", "rhythm")
                self.current = 0
                self.guessed = []
                self.finished = []
            def state(self):
                word = self.secrets[self.current]
                misses = [letter for letter in self.guessed if letter not in word]
                status = "won" if set(word) <= set(self.guessed) else ("lost" if len(misses) == 6 else "playing")
                result = {"evaluation_id": "fake", "total_games": 3,
                          "pattern": " ".join(c if c in self.guessed else "_" for c in word),
                          "guessed_letters": self.guessed.copy(), "incorrect_letters": misses,
                          "remaining_guesses": 6 - len(misses), "status": status,
                          "completed_games": self.current + int(status != "playing"),
                          "evaluation_status": "completed" if self.current == 2 and status != "playing" else "playing"}
                if status != "playing":
                    result["word"] = word
                return result
            def start_evaluation(self, name=None):
                return self.state()
            def evaluation_guess(self, evaluation_id, letter):
                self.guessed.append(letter)
                result = self.state()
                if result["status"] != "playing":
                    self.finished.append(result)
                return result
            def evaluation_next(self, evaluation_id):
                self.current += 1
                self.guessed = []
                return self.state()
            def evaluation_results(self, evaluation_id):
                return {"total_games": 3, "games": self.finished}
        client = FakeClient()
        observed = []
        result = play_evaluation(client, FrequencyBot(words=client.secrets), name="test",
                                 on_game_finished=lambda state: observed.append(finished_word(state)))
        self.assertEqual(observed, list(client.secrets))
        self.assertEqual(len(result["games"]), 3)

    def test_import_rejects_partial_or_playing_results_before_writing(self):
        results_root = Path(__file__).resolve().parent / "results"
        results_root.mkdir(exist_ok=True)
        with TemporaryDirectory(prefix="collection_test_", dir=results_root) as temporary:
            folder = Path(temporary).resolve()
            self.assertEqual(folder.parent, results_root.resolve())
            bank, checkpoint = folder / "bank.txt", folder / "checkpoint.json"
            collector = FinishedWordCollector(bank, checkpoint, "test", "offline")
            with self.assertRaises(ValueError):
                import_completed_results({"total_games": 2, "games": [{"status": "won", "word": "apple"}]}, collector)
            with self.assertRaises(ValueError):
                import_completed_results({"total_games": 2, "games": [
                    {"status": "won", "word": "apple"}, {"status": "playing", "word": "secret"}]}, collector)
            self.assertFalse(bank.exists())
            self.assertFalse(checkpoint.exists())
            import_completed_results({"total_games": 3, "games": [
                {"status": "won", "word": "apple"}, {"status": "lost", "word": "letter"},
                {"status": "won", "word": "apple"}]}, collector)
            self.assertEqual(bank.read_text().splitlines(), ["apple", "letter"])
            self.assertEqual(json.loads(checkpoint.read_text())["observed_games"], 3)
            self.assertEqual(json.loads(checkpoint.read_text())["unique_observed_this_run"], 2)


class TreeTests(unittest.TestCase):
    def test_graph_values_match_independent_exhaustive_search(self):
        for words in [("cat", "bat", "car", "bar"), ("aa", "ab", "bb"),
                      ("eerie", "erase", "evade"), ("abc", "abd", "bcd", "cde")]:
            bot = OptimalBot(words=words)
            candidates = tuple(range(len(bot.words)))
            for lives in (1, 2, 3):
                with self.subTest(words=words, lives=lives):
                    self.assertEqual(bot._solve(candidates, lives)[:2], brute_value(words, lives))

    def test_tree_policy_realizes_its_expected_wins(self):
        words = ("cat", "bat", "car", "bar")
        for lives in (1, 2, 3):
            bot = OptimalBot(words=words)
            expected = bot._solve(tuple(range(len(bot.words))), lives)[:2]
            # Simulate an initial miss budget by an independent short loop.
            actual_wins = actual_lives = 0
            for word in words:
                tried = []
                remaining = lives
                while remaining > 0 and not set(word) <= set(tried):
                    state = {"pattern": " ".join(c if c in tried else "_" for c in word),
                             "guessed_letters": tried.copy(), "incorrect_letters": [c for c in tried if c not in word],
                             "remaining_guesses": remaining, "status": "playing"}
                    letter = bot.choose_letter(state)
                    self.assertNotIn(letter, tried)
                    tried.append(letter)
                    remaining -= int(letter not in word)
                if set(word) <= set(tried):
                    actual_wins += 1
                    actual_lives += remaining
            self.assertEqual((actual_wins, actual_lives), expected)

    def test_bounded_search_returns_a_valid_fallback(self):
        bot = OptimalBot(words=["ab", "cd"], node_limit=0)
        state = {"pattern": "_ _", "guessed_letters": [], "remaining_guesses": 6}
        self.assertIn(bot.choose_letter(state), "abcd")
        self.assertFalse(bot.last_exact)

    def test_tree_bot_known_and_unseen_words_obey_contract(self):
        bot = TreeBot(words=["apple", "angle", "letter", "rhythm"])
        for word in ("apple", "letter", "rhythm", "quartz"):
            result = simulate_game(bot, word)
            self.assertIn(result["status"], {"won", "lost"})
            self.assertEqual(len(result["guessed_letters"]), len(set(result["guessed_letters"])))


if __name__ == "__main__":
    unittest.main(verbosity=2)
