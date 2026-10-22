# Hangman lab — Draft answers Q1–Q11

Based on the browser screenshots and terminal output collected during this lab. Review the explanations before submitting. The browser screenshots were captured in Microsoft Edge; the assignment specifies Chrome. Do not describe these screenshots as Chrome evidence.

## Q1. Client, server, and game engine

The client is the interface used to play, such as the browser or Python terminal program. It collects guesses, sends requests, and displays the returned game state. The Flask server receives HTTP requests, locates the requested game, and returns JSON responses. The game engine is the server-side logic that manages the hidden word, checks guesses, tracks remaining attempts, and determines whether a game is won or lost.

## Q2. Why the hidden word belongs on the server

If the hidden word were sent to the browser at the start, a player could inspect the network response or browser data to read the answer. Keeping it on the server prevents the client from receiving the answer before the game ends. During play, the server returns a masked pattern showing only correctly guessed letters.

## Q3. Distinguishing separate games

The server assigns each game a game identifier. Clients include that identifier in URLs when submitting guesses or retrieving state. For example, my browser game used `4faaf996e8c4`, while my curl game used `9c36a30e96ed`. The identifier allows the server to locate the corresponding game state; it identifies a game rather than necessarily identifying a person.

## Q4. Game-creation request

- Request URL: `https://hangman-ex89.onrender.com/api/games`
- HTTP method: `POST`
- JSON request body: `{"difficulty":"easy"}`
- Response status: `201 Created`

The status indicates that the request successfully created a new game. The creation screenshots show the request headers, payload, and response.

## Q5. Game-creation response fields

My browser returned:

```json
{
  "game_id": "4faaf996e8c4",
  "pattern": "_ _ _ _",
  "remaining_guesses": 6,
  "status": "playing"
}
```

- `game_id` identifies the game for later API requests.
- `pattern` represents the word with hidden letters masked. Four blanks indicate four letters.
- `remaining_guesses` is the number of incorrect guesses still allowed.
- `status` indicates whether the game is active or finished. Here, `playing` means it is active.

## Q6. Guess request

- Endpoint: `/api/games/4faaf996e8c4/guess`
- Full URL: `https://hangman-ex89.onrender.com/api/games/4faaf996e8c4/guess`
- HTTP method: `POST`
- JSON request body: `{"letter":"e"}`
- Observed response status: `200 OK`

The game identifier in the URL tells the server which game should receive the guess.

## Q7. State before and after the browser guess

Before the guess, the pattern was `_ _ _ _`. After guessing `e`, it became `_ _ _ e`, revealing the last letter. The guess response included `guessed_letters: ["e"]` and `incorrect_letters: []`. These arrays were not included in the creation response; the browser's initial display showed no guessed or incorrect letters.

The remaining guesses stayed at 6 because `e` was correct. The status stayed `playing` because the word was not fully revealed and the game had not ended.

## Q8. GET versus POST

POST requests created a new game and submitted a guess, both of which changed server-side state. GET retrieved an existing game's current state without submitting a guess. In my curl experiment, GET returned the same pattern, guessed letters, and five remaining guesses as the preceding guess response.

## Q9. Content-Type header

The `Content-Type: application/json` header tells the server that the request body is JSON. This lets the server interpret fields such as `difficulty` and `letter` as structured request data. The header describes the body being sent; it does not itself create that body or guarantee that its contents are valid.

## Q10. Nonexistent game

I requested `/api/games/nonexistent-lab-check` and received:

```text
HTTP/1.1 404 Not Found

{"error":"unknown game"}
```

The server received and processed the request, but no game matched the supplied identifier. The 404 response means that the requested game resource could not be found.

## Q11. Using a terminal without the web interface

The server exposes an HTTP API that is independent of the browser interface. A terminal program such as curl can send requests to the same endpoints and receive JSON responses. It only needs to follow the API's URL, method, and request-body format. The browser provides a graphical interface, but it is not required for communicating with the game server.

## Terminal evidence — User's curl experiment

The following records successful commands and responses supplied in the chat. The earlier failed command-order attempt is omitted from this successful-operation excerpt.

```powershell
$BASE_URL = "https://hangman-ex89.onrender.com"
'{"difficulty":"easy"}' | Set-Content -Encoding ascii create_payload.json
curl.exe -sS -X POST "$BASE_URL/api/games" -H "Content-Type: application/json" --data-binary "@create_payload.json"
```

```json
{"game_id":"9c36a30e96ed","pattern":"_ _ _ _ _","remaining_guesses":6,"status":"playing"}
```

```powershell
$GAME_ID = "9c36a30e96ed"
'{"letter":"e"}' | Set-Content -Encoding ascii guess_payload.json
curl.exe -sS -X POST "$BASE_URL/api/games/$GAME_ID/guess" -H "Content-Type: application/json" --data-binary "@guess_payload.json"
```

```json
{"guessed_letters":["e"],"incorrect_letters":["e"],"pattern":"_ _ _ _ _","remaining_guesses":5,"status":"playing"}
```

```powershell
curl.exe -sS "$BASE_URL/api/games/$GAME_ID"
```

```json
{"guessed_letters":["e"],"incorrect_letters":["e"],"pattern":"_ _ _ _ _","remaining_guesses":5,"status":"playing"}
```

```powershell
curl.exe -sS -i "$BASE_URL/api/games/nonexistent-lab-check"
```

```text
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":"unknown game"}
```

The last excerpt retains the status, content type, and error body; other response headers are omitted for readability. In this terminal game, `e` was incorrect, unlike the separate browser game where it was correct.
