# Client test plan

Automated tests use mocked HTTP responses and terminal input. They must not make public-server requests. Passing mock tests is not evidence of a complete live game; the live demonstration remains a separate assignment requirement.

| Case | Expected behavior |
| --- | --- |
| Create an Easy game | POST to `/api/games` with JSON difficulty and a request timeout; retain returned ID. |
| Retrieve state | GET the endpoint containing the retained ID; accept state without a returned ID. |
| Submit a letter | POST to the retained game's `/guess` endpoint with JSON letter and timeout. |
| Correct guess | Show revealed letters; accept unchanged remaining guesses. |
| Incorrect guess | Show the returned pattern and reduced remaining guesses. |
| Win | Display final result and stop asking for guesses. |
| Loss | Display final result and stop asking for guesses. |
| Invalid input | Reject empty, multiple-character, numeric, and non-ASCII input without an HTTP request. |
| Uppercase input | Normalize to lowercase before sending. |
| Repeated guess | Explain and reprompt without submitting again. |
| Connection failure or timeout | Display an understandable error and exit cleanly. |
| HTTP error such as 404 | Display an understandable error; do not invent a valid state. |
| Invalid JSON or wrong response shape | Report invalid server data without an uncaught traceback. |
| Missing state field or invalid status | Report invalid server data. |
| EOF or Ctrl+C | Exit cleanly. |

## Separate manual acceptance checks

- [ ] Run the client against the deployed server and complete one game.
- [ ] Save a terminal transcript or screenshot for Q13.
- [ ] Capture actual Chrome Network requests for creation and guessing.
- [ ] Confirm the student can explain requests, JSON, retained game ID, and termination.

Automated execution results will be recorded after the tests finish and the returned implementation has been reviewed.
