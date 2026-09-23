"""Pytest coverage for the Breadth-First Search 8-puzzle solver."""

import pytest

import bfs


@pytest.fixture(scope="module")
def required_result():
    """Run the expensive required-state search only once per test module."""
    return bfs.breadth_first_search(bfs.INITIAL_STATE, bfs.GOAL_STATE)


def assert_legal_path(path, initial_state, goal_state):
    assert path is not None
    assert path[0] == initial_state
    assert path[-1] == goal_state

    for current_state, next_state in zip(path, path[1:]):
        assert next_state in bfs.get_neighbors(current_state)


def test_required_constants():
    assert bfs.INITIAL_STATE == (8, 7, 6, 5, 4, 3, 2, 1, 0)
    assert bfs.GOAL_STATE == (1, 2, 3, 4, 5, 6, 7, 8, 0)


def test_corner_neighbors_follow_up_down_left_right_order():
    neighbors = bfs.get_neighbors(bfs.INITIAL_STATE)

    assert neighbors == [
        (8, 7, 6, 5, 4, 0, 2, 1, 3),  # Blank moves up.
        (8, 7, 6, 5, 4, 3, 2, 0, 1),  # Blank moves left.
    ]


def test_center_blank_has_four_unique_neighbors():
    center_blank = (1, 2, 3, 4, 0, 5, 6, 7, 8)
    neighbors = bfs.get_neighbors(center_blank)

    assert len(neighbors) == 4
    assert len(set(neighbors)) == 4


def test_required_puzzle_has_optimal_30_move_path(required_result):
    path, _, _ = required_result

    assert_legal_path(path, bfs.INITIAL_STATE, bfs.GOAL_STATE)
    assert len(path) - 1 == 30


def test_required_puzzle_search_statistics(required_result):
    _, states_expanded, states_discovered = required_result

    assert states_expanded == 181392
    assert states_discovered == 181440


def test_goal_state_requires_zero_moves():
    path, states_expanded, states_discovered = bfs.breadth_first_search(
        bfs.GOAL_STATE,
        bfs.GOAL_STATE,
    )

    assert path == [bfs.GOAL_STATE]
    assert states_expanded == 0
    assert states_discovered == 1


def test_solution_output_contains_path_and_statistics(required_result, capsys):
    path, states_expanded, states_discovered = required_result
    bfs.display_solution(path, states_expanded, states_discovered)
    output = capsys.readouterr().out

    assert "Step 0" in output
    assert "Step 30" in output
    assert "Total moves: 30" in output
    assert "States expanded: 181392" in output
    assert "States discovered: 181440" in output

