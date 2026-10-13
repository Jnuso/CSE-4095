"""Meaningful local Hangman contract tests; no network requests are used."""

import importlib
import string
import unittest

from benchmark import (
    BotProtocolError, FrequencyBot, simulate_game, split_words, summarize,
)


class ScriptedBot:
    def __init__(self, letters):
        self.letters = iter(letters)
        self.states = []

    def choose_letter(self, state):
        self.states.append(state)
        return next(self.letters)


class SimulationTests(unittest.TestCase):
    def test_all_occurrences_reveal_and_correct_letters_cost_no_lives(self):
        bot = ScriptedBot("letr")
        result = simulate_game(bot, "letter")
        self.assertEqual(result["status"], "won")
        self.assertEqual(result["remaining_guesses"], 6)
        self.assertEqual(result["score"], 160)
        self.assertEqual(bot.states[1]["pattern"], "l _ _ _ _ _")
        self.assertEqual(bot.states[2]["pattern"], "l e _ _ e _")
        self.assertEqual(bot.states[3]["pattern"], "l e t t e _")

    def test_exactly_six_wrong_letters_end_game(self):
        bot = ScriptedBot("bcdefgz")
        result = simulate_game(bot, "a")
        self.assertEqual(result["status"], "lost")
        self.assertEqual(result["guesses"], 6)
        self.assertEqual(result["remaining_guesses"], 0)
        self.assertEqual(result["score"], 0)
        self.assertEqual([state["remaining_guesses"] for state in bot.states], [6, 5, 4, 3, 2, 1])

    def test_playing_states_have_only_public_information(self):
        bot = ScriptedBot("bad")
        simulate_game(bot, "bad", "easy")
        expected = {"pattern", "guessed_letters", "incorrect_letters", "remaining_guesses", "status", "difficulty"}
        for state in bot.states:
            self.assertEqual(set(state), expected)
            self.assertEqual(state["status"], "playing")
            self.assertNotIn("word", state)

    def test_invalid_and_repeated_guesses_are_rejected(self):
        for invalid in ["A", "ab", "", "é", 1, None]:
            with self.subTest(invalid=invalid), self.assertRaises(BotProtocolError):
                simulate_game(ScriptedBot([invalid]), "a")
        with self.assertRaises(BotProtocolError):
            simulate_game(ScriptedBot("aa"), "ab")

    def test_bot_cannot_mutate_simulator_or_recorded_state(self):
        class MutatingBot:
            def choose_letter(self, state):
                state["guessed_letters"].append("a")
                state["remaining_guesses"] = 99
                return "a"
        result = simulate_game(MutatingBot(), "a")
        self.assertEqual(result["guesses"], 1)
        self.assertEqual(result["remaining_guesses"], 6)
        self.assertEqual(result["trace"][0]["state"]["guessed_letters"], [])
        self.assertEqual(result["trace"][0]["state"]["remaining_guesses"], 6)

    def test_holdout_is_reproducible_and_disjoint(self):
        entries = [(word, difficulty) for difficulty, words in {
            "easy": ["cat", "dog", "ant", "cow"],
            "hard": ["rhythm", "quartz", "zephyr", "xylophone"],
        }.items() for word in words]
        training, testing = split_words(entries, 0.25, 7)
        self.assertEqual((training, testing), split_words(entries, 0.25, 7))
        self.assertEqual(len(training), 6)
        self.assertEqual(len(testing), 2)
        self.assertFalse(set(dict(training)) & set(dict(testing)))
        self.assertEqual(set(training + testing), set(entries))

    def test_score_and_summary(self):
        win = simulate_game(ScriptedBot("ba"), "a")
        loss = simulate_game(ScriptedBot("bcdefg"), "a")
        self.assertEqual(win["score"], 150)
        stats = summarize([win, loss])
        self.assertEqual(stats["wins"], 1)
        self.assertEqual(stats["losses"], 1)
        self.assertEqual(stats["win_rate"], 0.5)
        self.assertEqual(stats["total_score"], 150)
        self.assertEqual(stats["average_guesses"], 4)


class StrategyContractTests(unittest.TestCase):
    @staticmethod
    def available_strategies():
        for module_name, class_name in [
            ("strategy_dictionary", "DictionaryBot"),
            ("strategy_general", "GeneralBot"),
            ("my_bot", "MyBot"),
        ]:
            if importlib.util.find_spec(module_name) is not None:
                yield getattr(importlib.import_module(module_name), class_name)

    def test_frequency_known_and_unseen_words_terminate(self):
        for word in ["apple", "rhythm", "quartz"]:
            result = simulate_game(FrequencyBot(words=["apple", "orange"]), word)
            self.assertIn(result["status"], {"won", "lost"})
            self.assertLessEqual(result["guesses"], 26)

    def test_strategies_obey_protocol_on_known_and_unseen_words(self):
        # During parallel development these modules may not exist yet. Once
        # present, an import error in their code is a real test failure.
        for bot_class in self.available_strategies():
            class_name = bot_class.__name__
            training = ["apple", "angle", "amble", "letter", "little", "banana", "orange"]
            bot = bot_class(words=training)
            for word in ["apple", "letter", "banana", "quartz", "rhythm", "zookeeper", "a"]:
                with self.subTest(bot=class_name, word=word):
                    result = simulate_game(bot, word)
                    self.assertIn(result["status"], {"won", "lost"})
                    guesses = result["guessed_letters"]
                    self.assertEqual(len(guesses), len(set(guesses)))
                    self.assertTrue(all(letter in string.ascii_lowercase for letter in guesses))
                    self.assertLessEqual(len(guesses), 26)
                    self.assertTrue(all("word" not in item["state"] for item in result["trace"]))
            # Exact singleton dictionary matching should solve this word.
            bot = bot_class(words=["letter"])
            result = simulate_game(bot, "letter")
            self.assertEqual(result["status"], "won")

    def test_visible_and_incorrect_letters_are_not_repeated_when_guess_list_is_missing(self):
        words = ["apple", "angle", "amble", "agape", "allee"]
        state = {"pattern": "a _ _ _ e", "guessed_letters": [],
                 "incorrect_letters": ["b", "z"], "remaining_guesses": 4,
                 "status": "playing"}
        for bot_class in self.available_strategies():
            with self.subTest(bot=bot_class.__name__):
                letter = bot_class(words=words).choose_letter(state)
                self.assertIn(letter, string.ascii_lowercase)
                self.assertNotIn(letter, {"a", "e", "b", "z"})

    def test_candidate_filter_uses_all_occurrences_and_missing_guess_history(self):
        words = ["apple", "angle", "amble", "agape", "allee",
                 "letter", "lesser", "lecher", "leerer", "letper"]
        scenarios = [
            # A known a/e cannot occur in any of the hidden positions.
            ({"pattern": "a _ _ _ e", "guessed_letters": [], "incorrect_letters": []},
             {"apple", "angle", "amble"}),
            # Incorrect b excludes amble even though b is absent from guessed_letters.
            ({"pattern": "a _ _ _ e", "guessed_letters": [], "incorrect_letters": ["b"]},
             {"apple", "angle"}),
            # Repeated e is permitted only in the two revealed positions.
            ({"pattern": "l e _ _ e _", "guessed_letters": [], "incorrect_letters": []},
             {"letter", "lesser", "lecher", "letper"}),
            # The single revealed t excludes letter, whose second t would be visible.
            ({"pattern": "l e t _ e _", "guessed_letters": [], "incorrect_letters": []},
             {"letper"}),
        ]
        for bot_class in self.available_strategies():
            bot = bot_class(words=words)
            helper_owner = bot if hasattr(bot, "candidate_words") else getattr(bot, "dictionary", None)
            if helper_owner is not None and hasattr(helper_owner, "candidate_words"):
                candidates = helper_owner.candidate_words
            elif hasattr(bot, "_parse") and hasattr(bot, "_candidates"):
                candidates = lambda state: bot._candidates(*bot._parse(state)[:2])
            else:
                continue
            for state, expected in scenarios:
                with self.subTest(bot=bot_class.__name__, pattern=state["pattern"], incorrect=state["incorrect_letters"]):
                    self.assertEqual(set(candidates(state)), expected)

    def test_hidden_word_is_never_read_even_if_present(self):
        class GuardedState(dict):
            def __getitem__(self, key):
                if key == "word":
                    raise AssertionError("strategy accessed the hidden word")
                return super().__getitem__(key)

            def get(self, key, default=None):
                if key == "word":
                    raise AssertionError("strategy accessed the hidden word")
                return super().get(key, default)

        words = ["apple", "angle", "amble", "agape", "allee"]
        state = {"pattern": "a _ _ _ e", "guessed_letters": ["a", "e"],
                 "incorrect_letters": [], "remaining_guesses": 6, "status": "playing"}
        for bot_class in self.available_strategies():
            with self.subTest(bot=bot_class.__name__):
                expected = bot_class(words=words).choose_letter(state)
                for secret in ["apple", "zebra"]:
                    supplied = GuardedState(state, word=secret)
                    self.assertEqual(bot_class(words=words).choose_letter(supplied), expected)


if __name__ == "__main__":
    unittest.main(verbosity=2)
