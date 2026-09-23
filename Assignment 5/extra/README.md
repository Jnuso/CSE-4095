# 8-Puzzle: BFS, A*, and Search Visualization

This project solves the classic 8-puzzle with Breadth-First Search and A* search. Both algorithms reconstruct an optimal solution from the required initial state to the goal state.

## Required Puzzle

Initial state:

```text
8 7 6
5 4 3
2 1 0
```

Goal state:

```text
1 2 3
4 5 6
7 8 0
```

The blank position is represented by `0`.

## Project Files

- `bfs.py` — command-line Breadth-First Search solver.
- `astar.py` — command-line A* solver using Manhattan distance.
- `bfs.html` — self-contained BFS visualization.
- `astar.html` — self-contained A* visualization with priority information.
- `test_bfs_pytest.py` — pytest coverage for the BFS solver.
- `test_astar_pytest.py` — pytest coverage for the A* solver.
- `test_html_visualizers.py` — static and JavaScript runtime tests for both webpages.
- `test_puzzle_solvers.py` — shared regression tests for both Python solvers.
- `pytest.ini` — local pytest configuration.

The HTML files work directly in a browser and do not require Python, Flask, Node.js, a database, a web server, or an internet connection.

## Running the Python Programs

```powershell
python bfs.py
python astar.py
```

Run the complete automated test suite with:

```powershell
python -m pytest -v
```

## BFS and A* Comparison

Both algorithms were run with the same required initial and goal states and the same legal-move ordering: Up, Down, Left, Right.

| Measurement | BFS | A* with Manhattan distance |
|---|---:|---:|
| Optimal moves | 30 | 30 |
| States expanded | 181,392 | 7,329 |
| States discovered | 181,440 | 10,895 |

A* expanded 174,063 fewer states than BFS, a reduction of approximately 96%. It also discovered 170,545 fewer states, a reduction of approximately 94%.

### Why BFS Explores More States

BFS explores states according to their distance from the initial state. It first considers all states one move away, then all states two moves away, and so on. It has no information about whether a state appears closer to the goal. Because the required puzzle needs 30 moves, BFS examines nearly the entire reachable state space before it reaches the goal.

### Why A* Explores Fewer States

A* assigns each state the priority:

```text
f(n) = g(n) + h(n)
```

- `g(n)` is the number of moves already used to reach the state.
- `h(n)` is the Manhattan-distance estimate of the moves remaining.
- `f(n)` is the estimated total solution cost through the state.

Manhattan distance measures how many horizontal and vertical positions each numbered tile is away from its goal position. The blank tile is not included. This estimate helps A* prioritize states that have both a reasonably short path from the start and tiles that are closer to their goal positions.

### Why the A* Solution Is Still Optimal

Manhattan distance never overestimates the remaining solution cost. A legal move slides only one numbered tile by one position, so one move can reduce the total Manhattan distance by at most one. Therefore, at least `h(n)` moves are required to reach the goal from any state.

This makes Manhattan distance an admissible heuristic. It is also consistent because the heuristic can change by at most the cost of one legal move. With best-known `g` tracking, A* therefore returns an optimal solution. The matching 30-move results from BFS and A* confirm this for the required puzzle.

## Visualization Features

Both webpages provide:

- Solve, Play/Pause, Previous, Next, and Reset controls.
- Adjustable playback speed.
- A visually empty blank tile.
- Custom starting configurations.
- Input and solvability validation.
- Current step, moved tile, total moves, and search statistics.
- A scrollable and selectable view of the complete optimal path.

The A* page additionally displays:

- `g(n)`, `h(n)`, and `f(n)` for the selected state.
- The best candidate states waiting in the open list.
- Each candidate's `g`, `h`, and `f` values.
- A highlight on the candidate with the lowest priority.

## AI-Assisted Development

This project was developed incrementally with an AI coding assistant. The required conversation share link should be submitted with these project files.
