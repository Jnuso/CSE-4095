# Assignment 13 — Hangman REST API Lab

## Assignment details

- **Course:** CSE 4095 — Agentic Programming
- **Lab:** Exploring a Flask Server and REST API with Hangman
- **Type:** Individual lab assignment
- **Estimated time:** 75 minutes
- **Total:** 100 points
- **Prerequisites:** Basic Python programming; no prior Flask or REST API experience required
- **Application:** https://hangman-ex89.onrender.com/
- **API base URL:** `https://hangman-ex89.onrender.com`

This reference records the requirements supplied by the instructor. Track progress in [TODO.md](TODO.md). Responses, experiments, and evidence must reflect work actually performed.

## Overview and learning objectives

Explore a Hangman application with a Flask server that manages games and exposes a REST API. A browser, terminal application, and automated programs can communicate with the same server. Use browser developer tools, HTTP requests, JSON, and Python to understand its behavior.

By the end of the lab, you should be able to:

- Explain client-server architecture and the roles of Flask and server-side game logic.
- Identify HTTP requests and responses in browser developer tools.
- Explain REST API endpoints and distinguish GET from POST.
- Interpret JSON requests and responses.
- Write a Python client that communicates with a REST API.

AI coding assistants are encouraged, but you must understand and explain the implementation and experiment results.

## Part 1 — Explore the web application (15 points)

Open the application in Chrome. Start an Easy game and guess at least five letters, or continue until the game finishes. Observe the displayed word, guessed letters, and remaining attempts. Start another game and compare the games.

- **Q1 (5):** Identify the client, server, and game engine. Explain each component's responsibility.
- **Q2 (5):** Why should the hidden word remain on the server instead of being sent to the browser when a game starts?
- **Q3 (5):** How can the server distinguish games played by different users?

## Part 2 — Inspect HTTP requests (20 points)

Open Chrome Developer Tools, select **Network**, enable **Fetch/XHR**, and start a new game. Inspect the request that creates the game, then make a guess and inspect its request.

- **Q4 (5):** Record the game-creation request URL, HTTP method, request body (if present), and response status code.
- **Q5 (5):** Identify the game identifier and at least three other response fields. Explain each field.
- **Q6 (5):** Record the guess endpoint, HTTP method, and JSON request body.
- **Q7 (5):** Compare responses before and after a guess. Identify at least two fields that changed, or explain why a field remained unchanged.

**Required evidence:** Two screenshots of the Network tab: one for creating a game and one for submitting a guess.

## Part 3 — Interact with the API using curl (20 points)

The instructor's commands below use Bash syntax. Adapt shell syntax as needed for Windows PowerShell while preserving the HTTP requests.

### Task 3.1 — Create a game

```bash
BASE_URL="https://hangman-ex89.onrender.com"
curl -sS -X POST "$BASE_URL/api/games" \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy"}' \
  | python3 -m json.tool
```

Copy the returned game identifier.

### Task 3.2 — Submit a guess

```bash
GAME_ID="your-game-id"
curl -sS -X POST \
  "$BASE_URL/api/games/$GAME_ID/guess" \
  -H "Content-Type: application/json" \
  -d '{"letter":"e"}' \
  | python3 -m json.tool
```

### Task 3.3 — Retrieve the game state

```bash
curl -sS \
  "$BASE_URL/api/games/$GAME_ID" \
  | python3 -m json.tool
```

- **Q8 (5):** Explain the difference between the GET and POST requests used here.
- **Q9 (5):** Explain the purpose of `Content-Type: application/json`.
- **Q10 (5):** Request a nonexistent game identifier. Record the HTTP status code and explain its meaning.
- **Q11 (5):** Explain why a terminal application can interact with the server without the web interface.

**Required evidence:** Terminal output showing successful game creation, a submitted guess, and retrieval of game state. Record the nonexistent-game response for Q10 as well.

## Part 4 — Develop a Python REST API client (30 points)

Create `hangman_client.py`. You may install and use `requests`:

```bash
python3 -m pip install requests
```

The program must:

1. Connect to the deployed server and create a new game through its REST API.
2. Display the initial game state.
3. Accept a letter from the terminal and submit it using HTTP POST.
4. Display the updated word pattern and remaining attempts.
5. Continue until the server reports a win or loss, then display the final result.
6. Handle connection errors and invalid server responses gracefully.

Use API responses to determine game status. **Do not implement a local game engine or select the hidden word locally.**

Suggested structure:

```python
import requests

BASE_URL = "https://hangman-ex89.onrender.com"

def create_game(difficulty):
    # Send POST request to create a game.
    pass

def get_game(game_id):
    # Send GET request to retrieve game state.
    pass

def make_guess(game_id, letter):
    # Send POST request to submit a guess.
    pass

def main():
    # Create a game, request guesses, display updates, and stop at completion.
    pass

if __name__ == "__main__":
    main()
```

- **Q12 (10):** Submit the working `hangman_client.py`.
- **Q13 (10):** Demonstrate one complete game through the Python client, with a screenshot or terminal transcript.
- **Q14 (10):** Explain how the client interacts with Flask, including HTTP requests, JSON, and the game identifier.

## Part 5 — Reflection: Agentic programming (15 points)

- **Q15 (5):** Describe the tasks you used an AI assistant for and give at least two specific prompts you used.
- **Q16 (5):** Describe one problem encountered while developing or testing the client and how you diagnosed and resolved it.
- **Q17 (5):** Explain how you would replace the human player with an automated bot and whether the Flask server would need to change.

## Submission requirements

Submit a single ZIP named `hangman_lab.zip` with this structure:

```text
hangman_lab/
├── hangman_client.py
├── lab_report.pdf
└── screenshots/
    ├── create_game.png
    ├── guess_letter.png
    └── python_client.png
```

The report must answer **Q1–Q11 and Q14–Q17** and include requested evidence. Q12 is the program; Q13 is the complete-game demonstration. Terminal output may replace screenshots where appropriate; the two Network-tab screenshots are explicitly requested in Part 2. Preserve the listed screenshot structure when preparing the submission.

## Grading rubric

| Component | Points |
| --- | ---: |
| Part 1: Web application exploration | 15 |
| Part 2: HTTP request inspection | 20 |
| Part 3: REST API using curl | 20 |
| Part 4: Python REST API client | 30 |
| Part 5: Agentic programming reflection | 15 |
| **Total** | **100** |

## Additional guidelines

- Work individually; AI assistants, online documentation, and course materials are allowed.
- Understand and be able to explain the submitted code.
- Do not modify or bypass server game rules.
- Do not send large numbers of automated requests to the public server.
- If the server is unavailable, document the problem and contact the instructor.
- Do not submit API credentials or other secrets.

**Expected outcome:** Understand how browsers and Python programs communicate with a Flask server through a REST API and how AI assistants support development of clients for existing services.
