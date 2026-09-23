"""Solve the 8-puzzle with breadth-first search."""

from collections import deque


BOARD_SIZE = 3

INITIAL_STATE = (
    8, 7, 6,
    5, 4, 3,
    2, 1, 0,
)

GOAL_STATE = (
    1, 2, 3,
    4, 5, 6,
    7, 8, 0,
)

# The blank tile is considered in this order for every expanded state.
MOVE_ORDER = (
    (-1, 0),  # Up
    (1, 0),   # Down
    (0, -1),  # Left
    (0, 1),   # Right
)


def get_neighbors(state):
    """Return all states reachable by one legal blank-tile move."""
    blank_index = state.index(0)
    blank_row, blank_column = divmod(blank_index, BOARD_SIZE)
    neighbors = []

    for row_change, column_change in MOVE_ORDER:
        new_row = blank_row + row_change
        new_column = blank_column + column_change

        if 0 <= new_row < BOARD_SIZE and 0 <= new_column < BOARD_SIZE:
            swap_index = new_row * BOARD_SIZE + new_column
            next_state = list(state)
            next_state[blank_index], next_state[swap_index] = (
                next_state[swap_index],
                next_state[blank_index],
            )
            neighbors.append(tuple(next_state))

    return neighbors


def reconstruct_path(parent, goal_state):
    """Follow parent links from the goal and return the path start-to-goal."""
    path = []
    current_state = goal_state

    while current_state is not None:
        path.append(current_state)
        current_state = parent[current_state]

    path.reverse()
    return path


def breadth_first_search(initial_state, goal_state):
    """Find an optimal path using BFS and return it with search statistics."""
    queue = deque([initial_state])

    # A state is marked discovered at the same time it enters the queue.
    discovered = {initial_state}
    parent = {initial_state: None}
    states_expanded = 0

    while queue:
        current_state = queue.popleft()

        if current_state == goal_state:
            path = reconstruct_path(parent, goal_state)
            return path, states_expanded, len(discovered)

        states_expanded += 1

        for neighbor in get_neighbors(current_state):
            if neighbor not in discovered:
                discovered.add(neighbor)
                parent[neighbor] = current_state
                queue.append(neighbor)

    return None, states_expanded, len(discovered)


def display_state(state):
    """Print one puzzle state as a 3-by-3 board."""
    for row_start in range(0, len(state), BOARD_SIZE):
        row = state[row_start:row_start + BOARD_SIZE]
        print(" ".join(str(tile) for tile in row))


def display_solution(path, states_expanded, states_discovered):
    """Print every state in the solution followed by search statistics."""
    for step_number, state in enumerate(path):
        print(f"Step {step_number}")
        print("*" * 10)
        display_state(state)
        print("*" * 10)
        print()

    print(f"Total moves: {len(path) - 1}")
    print(f"States expanded: {states_expanded}")
    print(f"States discovered: {states_discovered}")


def main():
    path, states_expanded, states_discovered = breadth_first_search(
        INITIAL_STATE,
        GOAL_STATE,
    )

    if path is None:
        print("No solution was found.")
        print(f"States expanded: {states_expanded}")
        print(f"States discovered: {states_discovered}")
        return

    display_solution(path, states_expanded, states_discovered)


if __name__ == "__main__":
    main()
