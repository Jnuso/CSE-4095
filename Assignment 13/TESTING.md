# Hangman client testing

## Verified result

On October 22, 2026, **16 unittest tests passed** in Python 3.12 inside Docker, with the test container's networking disabled. See `test_results.txt` for the actual output. Tests are in `tests/test_hangman_client.py`; `TEST_PLAN.md` describes their intended behavior.

Coverage includes correct create/get/guess requests and timeouts; creation ID validation; GET/guess responses without IDs; HTTP 404; connection failures; invalid JSON, missing fields, invalid field types and statuses; complete simulated win/loss loops; invalid and repeated inputs; uppercase normalization; retained game IDs; creation/guess failure handling; and EOF/Ctrl+C.

These are behavior tests with mocked server responses, not a numerical code-coverage measurement. They do not satisfy the required live-game demonstration or Chrome screenshots.

## Repeat offline tests

From `Assignment 13`:

```powershell
docker build -f Dockerfile.tests -t cse4095-hangman-tests .
docker run --rm --network none cse4095-hangman-tests
```

Alternatively, with Python and requests installed:

```powershell
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
```

Every test intercepts HTTP calls. Docker additionally enforces no network access during execution; building the image downloads dependencies.

## Run the real client

```powershell
python -m pip install -r requirements.txt
python hangman_lab/hangman_client.py
```

The client starts an Easy game, displays the pattern and attempts, and asks for letters. It exits when the server reports `won` or `lost`. A connection or response error ends the session with an explanatory message. The server retains the word and controls the rules.

## Implementation review notes

- Creation returns an identifier; the client retains it because actual GET and guess responses omit it.
- A correct guess can leave attempts unchanged; tests accept this observed behavior.
- The client does not infer a win from the pattern or a loss from the attempt count; it uses server status.
- No completed live game has been recorded yet. Mock terminal states assume the assignment's win/loss status names, `won` and `lost`; these still require confirmation in the live demonstration.
- The external coding worker timed out and its draft was not integrated. The saved implementation was written directly and verified by the Docker run above.

Keep testing support files outside `hangman_lab/` when preparing the final ZIP unless the instructor requests them.
