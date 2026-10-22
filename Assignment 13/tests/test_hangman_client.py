"""Offline behavior tests. Every HTTP call is intercepted by a mock."""

import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import Mock, patch

import requests
from hangman_lab import hangman_client as client


def state(status="playing", pattern="_ e _ _ _", remaining=6):
    # Real GET/guess responses do not contain game_id.
    return {"pattern": pattern, "remaining_guesses": remaining, "status": status,
            "guessed_letters": ["e"], "incorrect_letters": []}


def created():
    return {"game_id": "abc123", "pattern": "_ _ _ _ _",
            "remaining_guesses": 6, "status": "playing"}


class ApiTests(unittest.TestCase):
    def setUp(self):
        # This patch protects every API test against accidental live requests.
        self.patcher = patch.object(client.requests, "request")
        self.request = self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.response = Mock()
        self.response.json.return_value = state()
        self.request.return_value = self.response

    def test_create_request_and_returned_id(self):
        self.response.json.return_value = created()
        self.assertEqual(client.create_game("easy"), created())
        self.request.assert_called_once_with(
            "POST", client.BASE_URL + "/api/games",
            json={"difficulty": "easy"}, timeout=client.TIMEOUT)
        self.response.raise_for_status.assert_called_once_with()

    def test_get_accepts_real_state_without_game_id(self):
        self.assertEqual(client.get_game("abc123"), state())
        self.request.assert_called_once_with(
            "GET", client.BASE_URL + "/api/games/abc123",
            json=None, timeout=client.TIMEOUT)
        self.response.raise_for_status.assert_called_once_with()

    def test_guess_accepts_real_state_without_game_id(self):
        self.assertEqual(client.make_guess("abc123", "e"), state())
        self.request.assert_called_once_with(
            "POST", client.BASE_URL + "/api/games/abc123/guess",
            json={"letter": "e"}, timeout=client.TIMEOUT)
        self.response.raise_for_status.assert_called_once_with()

    def test_timeout_and_connection_failure(self):
        for error in (requests.Timeout("timed out"), requests.ConnectionError("offline")):
            with self.subTest(error=type(error).__name__):
                self.request.side_effect = error
                with self.assertRaisesRegex(client.ClientError, "request failed"):
                    client.create_game("easy")

    def test_http_404_is_rejected_before_parsing_json(self):
        self.response.raise_for_status.side_effect = requests.HTTPError("404 unknown game")
        with self.assertRaisesRegex(client.ClientError, "404"):
            client.get_game("missing")
        self.response.json.assert_not_called()

    def test_invalid_json(self):
        self.response.json.side_effect = ValueError("bad JSON")
        with self.assertRaisesRegex(client.ClientError, "invalid JSON"):
            client.get_game("abc123")

    def test_non_object_response(self):
        for value in (None, [], "text", 42):
            with self.subTest(value=value):
                self.response.json.return_value = value
                with self.assertRaises(client.ClientError):
                    client.get_game("abc123")

    def test_create_requires_nonempty_string_id(self):
        for value in (None, "", " ", 123):
            with self.subTest(value=value):
                self.response.json.return_value = dict(state(), game_id=value)
                with self.assertRaisesRegex(client.ClientError, "game_id"):
                    client.create_game("easy")

    def test_missing_state_fields(self):
        for field in ("pattern", "remaining_guesses", "status"):
            with self.subTest(field=field):
                data = state()
                del data[field]
                self.response.json.return_value = data
                with self.assertRaises(client.ClientError):
                    client.get_game("abc123")

    def test_invalid_state_fields(self):
        for field, values in (
            ("pattern", (None, [])),
            ("remaining_guesses", (-1, True, "6", 1.5)),
            ("status", ("unknown", None, [])),
        ):
            for value in values:
                with self.subTest(field=field, value=value):
                    self.response.json.return_value = dict(state(), **{field: value})
                    with self.assertRaises(client.ClientError):
                        client.get_game("abc123")


class GameLoopTests(unittest.TestCase):
    def setUp(self):
        # Catch unexpected HTTP calls even when testing the higher-level loop.
        blocker = patch.object(client.requests, "request", side_effect=AssertionError("Live HTTP forbidden"))
        blocker.start()
        self.addCleanup(blocker.stop)

    def run_game(self, inputs, responses):
        output = io.StringIO()
        with patch.object(client, "create_game", return_value=created()), \
             patch.object(client, "make_guess", side_effect=responses) as guess, \
             patch("builtins.input", side_effect=inputs) as read, redirect_stdout(output):
            result = client.main()
        return result, output.getvalue(), guess, read

    def test_complete_win_retains_id_and_stops(self):
        result, output, guess, read = self.run_game(
            ["e", "a"], [state(), state("won", "p e a c h")])
        self.assertEqual(result, 0)
        self.assertIn("Word: _ _ _ _ _", output)
        self.assertIn("Remaining attempts: 6", output)
        self.assertIn("Word: p e a c h", output)
        self.assertIn("You won!", output)
        self.assertEqual([call.args for call in guess.call_args_list],
                         [("abc123", "e"), ("abc123", "a")])
        self.assertEqual(read.call_count, 2)

    def test_loss_displays_final_state_and_stops(self):
        result, output, guess, read = self.run_game(["z"], [state("lost", remaining=0)])
        self.assertEqual(result, 0)
        self.assertIn("Remaining attempts: 0", output)
        self.assertIn("You lost!", output)
        guess.assert_called_once_with("abc123", "z")
        self.assertEqual(read.call_count, 1)

    def test_invalid_inputs_normalization_and_repeated_guess(self):
        result, output, guess, read = self.run_game(
            ["", "ab", "1", "é", " E ", "e", "a"],
            [state(), state("won", "p e a c h")])
        self.assertEqual(result, 0)
        self.assertEqual(guess.call_count, 2)
        self.assertEqual([call.args[1] for call in guess.call_args_list], ["e", "a"])
        self.assertIn("already guessed", output)
        self.assertEqual(output.count("Please enter one letter"), 4)

    def test_failed_guess_exits_without_claiming_result(self):
        result, output, guess, read = self.run_game(["e"], [client.ClientError("offline")])
        self.assertEqual(result, 1)
        self.assertIn("Unable to continue: offline", output)
        self.assertNotIn("You won!", output)
        self.assertNotIn("You lost!", output)
        self.assertEqual(guess.call_count, 1)

    def test_input_interruptions_exit_cleanly(self):
        for error in (EOFError(), KeyboardInterrupt()):
            with self.subTest(error=type(error).__name__):
                result, output, guess, read = self.run_game([error], [])
                self.assertEqual(result, 0)
                self.assertIn("interrupted", output)
                guess.assert_not_called()

    def test_creation_failure_exits_without_asking_for_input(self):
        output = io.StringIO()
        with patch.object(client, "create_game", side_effect=client.ClientError("bad response")), \
             patch("builtins.input") as read, redirect_stdout(output):
            self.assertEqual(client.main(), 1)
        self.assertIn("bad response", output.getvalue())
        read.assert_not_called()


if __name__ == "__main__":
    unittest.main()
