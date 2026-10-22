# Observed API behavior

Collected October 22, 2026 using curl.exe. Raw response JSON and HTTP headers are saved beside this file.

- POST `/api/games` with `{"difficulty":"easy"}` returns `game_id`, `pattern`, `remaining_guesses`, and `status`.
- Observed initial response: `{"game_id":"728393e7a2ad","pattern":"_ _ _ _ _","remaining_guesses":6,"status":"playing"}`.
- POST `/api/games/728393e7a2ad/guess` with `{"letter":"e"}` returned `{"guessed_letters":["e"],"incorrect_letters":[],"pattern":"_ e _ _ _","remaining_guesses":6,"status":"playing"}`.
- GET `/api/games/728393e7a2ad` returned the same state as the guess response.
- **Important for client validation:** Guess and GET responses do not contain `game_id`. Store the identifier returned during creation and reuse it in endpoint URLs.
- GET `/api/games/nonexistent-lab-check` returned HTTP **404 Not Found** and `{"error":"unknown game"}`.
- The correct guess revealed `e` and added it to guessed letters. Remaining guesses stayed at 6 because the guess was correct.

## Actual issue encountered

The first curl attempt passed inline JSON through Windows PowerShell and received HTTP 400 with `{"error":"request body must be a JSON object"}`. Saving JSON to an ASCII file and passing it with `--data-binary '@Assignment 13/create_payload.json'` produced a valid creation response. This is a real shell-quoting issue that can be discussed in the reflection; it is not a Python-client bug.

These terminal experiments do not replace the required Chrome Network screenshots or complete Python-client game demonstration.
