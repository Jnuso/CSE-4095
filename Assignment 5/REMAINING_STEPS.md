# Assignment 5: Completion Checklist

## 1. BFS Python Solver

- [x] Use the required filename `bfs.py`.
- [x] Use `collections.deque` as the BFS queue.
- [x] Mark states discovered when they enter the queue.
- [x] Prevent duplicate queue entries with a discovered set.
- [x] Store parent relationships and reconstruct the complete path.
- [x] Print every state from the initial state through the goal.
- [x] Report total moves, states expanded, and states discovered.
- [x] Confirm the required puzzle takes 30 optimal moves.
- [x] Confirm 181,392 states are expanded and 181,440 are discovered.

## 2. BFS Static Visualizer

- [x] Provide the self-contained `bfs.html` file.
- [x] Run entirely in the browser without external dependencies.
- [x] Provide Solve, Play/Pause, Previous, Next, and Reset controls.
- [x] Provide adjustable playback speed.
- [x] Display the current step, moved tile, total moves, and search statistics.
- [x] Support custom starting configurations.
- [x] Detect invalid and unsolvable configurations.
- [x] Display every optimal-path state in a scrollable panel.

## 3. A* Python Solver

- [x] Create `astar.py`.
- [x] Implement Manhattan distance without including the blank.
- [x] Confirm the assignment's example produces `h(n) = 2`.
- [x] Use `heapq` as the priority queue.
- [x] Calculate priorities with `f(n) = g(n) + h(n)`.
- [x] Store the best known `g(n)` for every state.
- [x] Update states when a better path is found.
- [x] Ignore outdated priority-queue entries.
- [x] Reconstruct and print the complete optimal path.
- [x] Report moves, expanded states, and discovered states.
- [x] Confirm the required puzzle takes 30 optimal moves.
- [x] Confirm 7,329 states are expanded and 10,895 are discovered.

## 4. A* Static Visualizer

- [x] Create the self-contained `astar.html` file.
- [x] Use a browser-based binary min-heap priority queue.
- [x] Display and animate the complete optimal path.
- [x] Display `g(n)`, `h(n)`, and `f(n)` for the selected state.
- [x] Display the best waiting states from the A* open list.
- [x] Show each candidate's `g`, `h`, and `f` values.
- [x] Highlight the candidate with the lowest priority.
- [x] Provide all playback controls and adjustable speed.
- [x] Support custom valid starting configurations.
- [x] Detect invalid and unsolvable configurations.
- [x] Display every optimal-path state in a scrollable panel.

## 5. Comparison and Explanation

- [x] Compare both algorithms on the required puzzle.
- [x] Record the optimal move counts.
- [x] Record states expanded and discovered.
- [x] Add the comparison table to `README.md`.
- [x] Explain how BFS orders its exploration.
- [x] Explain how A* uses `g(n) + h(n)`.
- [x] Explain how Manhattan distance guides A*.
- [x] Explain why Manhattan distance preserves optimality.
- [x] Calculate the approximate reductions in search work.

## 6. Automated Verification

- [x] Test the required initial state with both algorithms.
- [x] Test the Manhattan-distance example.
- [x] Test the goal state.
- [x] Test a one-move state.
- [x] Test an unsolvable state.
- [x] Validate that every solution transition is a legal move.
- [x] Confirm BFS and A* return the same optimal path length.
- [x] Confirm both HTML files contain valid JavaScript.
- [x] Confirm both browser algorithms match the Python results.
- [x] Confirm neither webpage uses a remote dependency.

## 7. Final Submission

- [x] Include `bfs.py`.
- [x] Include `astar.py`.
- [x] Include `bfs.html`.
- [x] Include `astar.html`.
- [x] Include the comparison and explanations in `README.md`.
- [x] Include automated tests in `test_puzzle_solvers.py`.
- [ ] Manually double-click `astar.html` and perform one final visual click-through. Automated local-file browser access was blocked by browser security policy, although its code and algorithm checks passed.
- [ ] Use the Codex Share command to obtain the required chat link. The automated share request timed out without returning a link.

