# Assignment 5: Implementation Plan

## Current Project Structure

The completed project contains:

- `bfs.py`: command-line BFS solver.
- `astar.py`: command-line A* solver using Manhattan distance.
- `bfs.html`: self-contained BFS visualizer.
- `astar.html`: self-contained A* visualizer.
- `test_puzzle_solvers.py`: automated regression tests.
- `README.md`: algorithm comparison, explanations, and usage instructions.

The final structure is:

```text
Assignment 5/
├── bfs.py
├── astar.py
├── bfs.html
├── astar.html
├── test_puzzle_solvers.py
├── README.md
├── REMAINING_STEPS.md
└── IMPLEMENTATION_PLAN.md
```

## Phase 1: Finalize BFS — Complete

### Step 1. Use the Required Python Filename

The original BFS script was renamed to `bfs.py` so that the filename matches the assignment requirements.

### Step 2. Verify BFS Again

Run the renamed file and verify:

```text
Total moves: 30
States expanded: 181392
States discovered: 181440
```

Check that the path begins at the required initial state and ends at the required goal state.

## Phase 2: Implement Manhattan Distance — Complete

### Step 1. Define Goal Positions

Create a mapping from each numbered tile to its goal row and column:

```python
GOAL_POSITIONS = {
    1: (0, 0),
    2: (0, 1),
    3: (0, 2),
    4: (1, 0),
    5: (1, 1),
    6: (1, 2),
    7: (2, 0),
    8: (2, 1),
}
```

The blank tile will not be included.

### Step 2. Calculate Each Tile's Distance

For each numbered tile, calculate:

```text
absolute(current row - goal row)
+ absolute(current column - goal column)
```

Add the distances for tiles 1 through 8 to produce `h(n)`.

### Step 3. Test the Heuristic

Use the assignment's example:

```text
1 2 3
4 0 5
7 8 6
```

Tile 5 contributes 1 and tile 6 contributes 1, so the result must be:

```text
h(n) = 2
```

Also verify that the goal state produces `h(n) = 0`.

## Phase 3: Implement A* in `astar.py` — Complete

### Step 1. Reuse the Puzzle Representation

Use the same nine-number tuple representation as BFS. Reuse the same initial state, goal state, board size, and neighbor-generation rules.

### Step 2. Create the Priority Queue

Use Python's `heapq`. Each queue entry will contain enough information to order states consistently:

```text
(f value, h value, tie-break counter, state)
```

The tie-break counter prevents Python from needing to compare puzzle states when priorities are equal and makes results reproducible.

### Step 3. Track Search Information

Maintain:

- `g_score[state]`: the best known cost from the initial state.
- `parent[state]`: the preceding state on the best known path.
- A priority queue containing states waiting to be expanded.
- Counters for expanded and discovered/generated states.

The initial state will have:

```text
g(initial) = 0
h(initial) = Manhattan distance
f(initial) = g(initial) + h(initial)
```

### Step 4. Process States

Repeatedly remove the state with the smallest priority.

For every legal neighbor:

1. Calculate `tentative_g = current_g + 1`.
2. Compare `tentative_g` with the stored best `g` value.
3. If the new path is better, update `g_score` and `parent`.
4. Calculate the neighbor's Manhattan distance.
5. Add a new priority-queue entry using `f = g + h`.

Old queue entries can remain in the heap. When an outdated entry is removed, skip it by comparing its stored cost with the current best `g_score`.

### Step 5. Reconstruct the A* Path

When the goal state is removed from the priority queue, follow the parent links back to the initial state and reverse the result.

### Step 6. Display Results

Use output consistent with BFS:

```text
Step 0
**********
8 7 6
5 4 3
2 1 0
**********
```

At the end, display:

```text
Optimal moves: ...
States expanded: ...
States discovered: ...
```

## Phase 4: Test A* — Complete

### Algorithm Tests

Test these cases:

1. Required initial state: must take 30 moves.
2. Goal state: must take 0 moves.
3. One-move state: must take 1 move.
4. Another solvable state: compare its result with BFS.
5. Unsolvable state: reject it or report that no solution exists.

### Path Validation

For every consecutive pair of states:

- Exactly two positions should change.
- One changed position should contain the blank.
- The blank should move exactly one row or one column.

The first state must equal the selected initial state, and the last state must equal the goal.

## Phase 5: Build `astar.html` — Complete

### Step 1. Reuse the BFS Visual Design

Use `bfs.html` as the visual and interaction foundation so both pages feel like parts of the same project. Keep the page self-contained and preserve:

- Dark appearance
- Main puzzle board
- Top control bar
- Playback-speed slider
- Custom-start editor
- Search statistics
- Scrollable solution path
- Responsive layout

### Step 2. Replace the Search Algorithm

Replace the browser BFS function with an A* implementation using:

- A JavaScript priority queue implemented as a binary min-heap.
- A map of best known `g` values.
- Parent-state tracking.
- Manhattan distance excluding the blank.
- Consistent tie breaking.

### Step 3. Record Visualization Data

The A* search must record enough information for each visualization step:

- Current state
- `g(n)`
- `h(n)`
- `f(n)`
- The tile moved to reach the state
- A useful snapshot of the open list
- Which candidate state was selected next

Only a limited number of the best open-list candidates need to be displayed at once so the interface stays readable.

### Step 4. Add A* Score Cards

Add visible values for:

```text
g(n): moves from the start
h(n): estimated moves remaining
f(n): total estimated cost
```

Update these values whenever the user plays, pauses, or changes steps.

### Step 5. Add the Open-List Panel

Display the best candidate states currently waiting in the priority queue. Each candidate should show:

- A miniature puzzle board
- `g` value
- `h` value
- `f` value

Highlight the state with the smallest priority so the user can understand why A* selects it.

### Step 6. Preserve Playback Features

The page will support:

- Solve
- Play/Pause
- Previous
- Next
- Reset
- Playback speed
- Custom starting positions
- Clickable solution-path states

## Phase 6: Compare the Algorithms — Complete

### Step 1. Gather Results

Run `bfs.py` and `astar.py` on the required initial state and record:

| Measurement | BFS | A* |
|---|---:|---:|
| Optimal moves | 30 | 30 |
| States expanded | 181,392 | 7,329 |
| States discovered/generated | 181,440 | 10,895 |

### Step 2. Explain the Results

The written comparison will explain:

- BFS expands states in increasing order of distance from the initial state.
- BFS has no estimate of which states are closer to the goal.
- A* combines the known path cost with an estimate of the remaining cost.
- Manhattan distance gives A* information about how misplaced the numbered tiles are.
- This guidance usually allows A* to examine far fewer states.
- Manhattan distance never overestimates the remaining number of moves because one move changes a tile's Manhattan distance by at most one.
- Because the heuristic does not overestimate, A* can still return an optimal path.

### Step 3. Save the Comparison

The comparison table and explanation are saved in `README.md`.

## Phase 7: Final Verification — Automated Checks Complete

### Python Verification

- Run `python bfs.py`.
- Run `python astar.py`.
- Confirm that both reach the goal in 30 moves.
- Confirm that all reported statistics are clearly labeled.

### Browser Verification

- Open `bfs.html` directly.
- Open `astar.html` directly.
- Verify that neither page requires a server or internet connection.
- Test every control.
- Test valid custom boards.
- Test invalid and unsolvable boards.
- Check the layout at desktop and narrow screen sizes.

### Submission Verification

Confirm that the submission contains:

```text
bfs.py
astar.py
bfs.html
astar.html
```

Finally, include the required link to the AI-agent chat and review the code well enough to explain each search algorithm.
