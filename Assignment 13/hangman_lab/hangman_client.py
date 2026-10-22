"""A terminal client; the Flask server owns all Hangman game rules."""

import requests

BASE_URL = "https://hangman-ex89.onrender.com"
TIMEOUT = 30


class ClientError(Exception):
    """An HTTP request or server response could not be used."""


def request_state(method, path, payload=None, require_id=False):
    """Send one request and validate the fields needed by the terminal UI."""
    try:
        response = requests.request(
            method, BASE_URL + path, json=payload, timeout=TIMEOUT
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ClientError(f"Server request failed: {exc}") from exc
    try:
        state = response.json()
    except ValueError as exc:
        raise ClientError("Server returned invalid JSON.") from exc

    if not isinstance(state, dict):
        raise ClientError("Server response must be a JSON object.")
    if require_id and (
        not isinstance(state.get("game_id"), str) or not state["game_id"].strip()
    ):
        raise ClientError("Server response is missing a valid game_id.")
    if not isinstance(state.get("pattern"), str):
        raise ClientError("Server response is missing a valid pattern.")
    remaining = state.get("remaining_guesses")
    if type(remaining) is not int or remaining < 0:
        raise ClientError("Server response has invalid remaining_guesses.")
    if state.get("status") not in ("playing", "won", "lost"):
        raise ClientError("Server response has an invalid status.")
    return state


def create_game(difficulty):
    return request_state("POST", "/api/games", {"difficulty": difficulty}, True)


def get_game(game_id):
    return request_state("GET", f"/api/games/{game_id}")


def make_guess(game_id, letter):
    return request_state("POST", f"/api/games/{game_id}/guess", {"letter": letter})


def display_state(state):
    print(f"\nWord: {state['pattern']}")
    print(f"Remaining attempts: {state['remaining_guesses']}")


def main():
    try:
        state = create_game("easy")
        # Subsequent responses omit game_id, so retain it from creation.
        game_id = state["game_id"]
        print(f"Game: {game_id} (easy)")
        guessed = set()
        display_state(state)

        while state["status"] == "playing":
            letter = input("Enter a letter: ").strip().lower()
            if len(letter) != 1 or letter not in "abcdefghijklmnopqrstuvwxyz":
                print("Please enter one letter from a to z.")
                continue
            if letter in guessed:
                print("You already guessed that letter.")
                continue
            state = make_guess(game_id, letter)
            guessed.add(letter)
            display_state(state)

        print("You won!" if state["status"] == "won" else "You lost!")
        return 0
    except ClientError as exc:
        print(f"Unable to continue: {exc}")
        return 1
    except (EOFError, KeyboardInterrupt):
        print("\nGame interrupted. Goodbye!")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
