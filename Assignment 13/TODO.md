# Assignment 13 — Phased TODO

Reference: [ASSIGNMENT.md](ASSIGNMENT.md). Check off tasks only after completing and verifying them.

## Final review status - October 22, 2026

The client, report, evidence, and ZIP are assembled. The report contains Q1-Q17 and your approved reflection. All 16 tests passed both in Docker and on your computer. The complete live-game transcript is included. See [REVIEW_BEFORE_SUBMISSION.md](REVIEW_BEFORE_SUBMISSION.md) for final checks and the remaining Chrome-versus-Edge evidence issue. The detailed checklist below records the earlier phased workflow; this final status supersedes unchecked items for completed report/package work. Student review and course submission remain pending.

## Phase 1 — Set up and explore (Part 1: 15 points)

- [x] Save the assignment reference and phased checklist.
- [x] Create the `hangman_lab/` submission folder and its `screenshots/` subfolder.
- [ ] Open the deployed application in Chrome and play an Easy game (at least five guesses or until completion).
- [ ] Start a second game and record differences in the displayed state and identifiers.
- [ ] Draft answers to Q1–Q3 using the observed behavior.

## Phase 2 — Inspect browser requests (Part 2: 20 points)

- [ ] Open Chrome DevTools → Network → Fetch/XHR.
- [ ] Create a game; record URL, method, request body, status, and response JSON (Q4).
- [ ] Identify the game identifier and explain at least three additional response fields (Q5).
- [ ] Save `screenshots/create_game.png` showing the Network-tab evidence.
- [ ] Submit a letter; record endpoint, method, and JSON body (Q6).
- [ ] Compare the before/after response fields and explain changes or unchanged values (Q7).
- [ ] Save `screenshots/guess_letter.png` showing the Network-tab evidence.

## Phase 3 — Run terminal API experiments (Part 3: 20 points)

- [ ] Adapt the supplied curl commands to the local shell if needed.
- [x] Create an Easy game and retain the returned identifier.
- [x] Submit a guess and retrieve that game's state.
- [x] Save readable terminal output for all three operations (raw JSON and headers; see API_NOTES.md).
- [x] Request a nonexistent game identifier; capture its actual HTTP status and response.
- [ ] Draft Q8–Q11, including the observed result for Q10.

## Phase 4 — Build and verify the Python client (Part 4: 30 points)

- [ ] Confirm the API's actual field names and status values from captured responses.
- [x] Implement `hangman_lab/hangman_client.py` with game creation, state retrieval, and guessing functions.
- [ ] Display initial state, updated word pattern, guessed letters as useful, and remaining attempts.
- [ ] Accept terminal guesses and continue until the API reports a win or loss.
- [ ] Display the final result using server-provided information.
- [ ] Handle connection failures, HTTP errors, and malformed/unexpected responses gracefully.
- [ ] Verify that no hidden word is selected locally and no local game engine controls the outcome.
- [x] Check relevant error handling without generating excessive public-server requests (16 offline tests passed; see TESTING.md).
- [ ] Play one complete game with the client and retain a transcript (Q13).
- [ ] Save `screenshots/python_client.png` showing the client demonstration.
- [ ] Draft Q14 explaining HTTP, JSON, Flask, and the game identifier.
- [ ] Review the code together so its behavior can be explained for Q12.

## Phase 5 — Write the report and reflection (Part 5: 15 points)

- [ ] Keep a record of actual AI prompts and assistance throughout the lab.
- [ ] Answer Q15 with at least two actual prompt examples.
- [ ] Answer Q16 using a real development/testing issue, diagnosis, and resolution.
- [ ] Answer Q17 describing bot changes and whether server changes are necessary.
- [ ] Assemble answers to Q1–Q11 and Q14–Q17 in a report source document.
- [ ] Include browser evidence, curl output, nonexistent-game status, and the complete Python-game demonstration.
- [ ] Export `hangman_lab/lab_report.pdf` and visually verify readability and layout.

## Phase 6 — Final review and package

- [ ] Check every assignment requirement against the reference and grading rubric.
- [ ] Verify screenshots are legible and match the report's observations.
- [ ] Verify the client runs from the submission folder and its dependency is documented in the report.
- [ ] Confirm the submission contains no secrets or unrelated files.
- [ ] Create `hangman_lab.zip` containing the top-level `hangman_lab/` folder and required files.
- [ ] Inspect the ZIP contents and confirm the PDF opens and the Python file is included.
- [ ] Submit `hangman_lab.zip` through the course's submission system.

## Working notes to retain

Record actual API responses, game identifiers, experiments, AI prompts, and encountered problems as we work. These notes will support accurate report answers and the reflection; do not invent evidence or outcomes.
