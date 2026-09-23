"""Solve the 8-puzzle with A* search and Manhattan distance."""

import heapq
from itertools import count


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

GOAL_POSITIONS = {
    tile: divmod(index, BOARD_SIZE)
    for index, tile in enumerate(GOAL_STATE)
    if tile != 0
}


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


def manhattan_distance(state):
    """Return the total Manhattan distance for tiles 1 through 8."""
    distance = 0

    for index, tile in enumerate(state):
        if tile == 0:
            continue

        current_row, current_column = divmod(index, BOARD_SIZE)
        goal_row, goal_column = GOAL_POSITIONS[tile]
        distance += abs(current_row - goal_row) + abs(current_column - goal_column)

    return distance


def is_solvable(state):
    """Return whether a 3-by-3 puzzle state can reach the goal state."""
    numbered_tiles = [tile for tile in state if tile != 0]
    inversions = 0

    for first_index in range(len(numbered_tiles)):
        for second_index in range(first_index + 1, len(numbered_tiles)):
            if numbered_tiles[first_index] > numbered_tiles[second_index]:
                inversions += 1

    return inversions % 2 == 0


def reconstruct_path(parent, goal_state):
    """Follow parent links from the goal and return the path start-to-goal."""
    path = []
    current_state = goal_state

    while current_state is not None:
        path.append(current_state)
        current_state = parent[current_state]

    path.reverse()
    return path


def a_star_search(initial_state, goal_state):
    """Find an optimal path with A* and return it with search statistics."""
    if not is_solvable(initial_state):
        return None, 0, 1

    tie_breaker = count()
    initial_h = manhattan_distance(initial_state)

    # Entries are (f, h, insertion order, g, state). The insertion counter
    # gives deterministic behavior when two states have the same scores.
    priority_queue = [
        (initial_h, initial_h, next(tie_breaker), 0, initial_state)
    ]

    best_g = {initial_state: 0}
    parent = {initial_state: None}
    states_expanded = 0
    states_discovered = 1

    while priority_queue:
        _, _, _, current_g, current_state = heapq.heappop(priority_queue)

        # A better path may have been inserted after this entry. Ignore stale
        # entries instead of incorrectly expanding an outdated path.
        if current_g != best_g.get(current_state):
            continue

        if current_state == goal_state:
            path = reconstruct_path(parent, goal_state)
            return path, states_expanded, states_discovered

        states_expanded += 1

        for neighbor in get_neighbors(current_state):
            tentative_g = current_g + 1
            previous_g = best_g.get(neighbor)

            if previous_g is None or tentative_g < previous_g:
                if previous_g is None:
                    states_discovered += 1

                best_g[neighbor] = tentative_g
                parent[neighbor] = current_state
                neighbor_h = manhattan_distance(neighbor)
                neighbor_f = tentative_g + neighbor_h
                heapq.heappush(
                    priority_queue,
                    (
                        neighbor_f,
                        neighbor_h,
                        next(tie_breaker),
                        tentative_g,
                        neighbor,
                    ),
                )

    return None, states_expanded, states_discovered


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

    print(f"Optimal moves: {len(path) - 1}")
    print(f"States expanded: {states_expanded}")
    print(f"States discovered: {states_discovered}")


def main():
    path, states_expanded, states_discovered = a_star_search(
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
