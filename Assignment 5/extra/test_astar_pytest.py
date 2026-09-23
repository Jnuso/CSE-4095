"""Pytest coverage for the A* Manhattan-distance 8-puzzle solver."""

import pytest

import astar


@pytest.fixture(scope="module")
def required_result():
    """Run the required-state A* search only once per test module."""
    return astar.a_star_search(astar.INITIAL_STATE, astar.GOAL_STATE)


def assert_legal_path(path, initial_state, goal_state):
    assert path is not None
    assert path[0] == initial_state
    assert path[-1] == goal_state

    for current_state, next_state in zip(path, path[1:]):
        assert next_state in astar.get_neighbors(current_state)


def test_manhattan_distance_assignment_example():
    example_state = (
        1, 2, 3,
        4, 0, 5,
        7, 8, 6,
    )

    assert astar.manhattan_distance(example_state) == 2


def test_manhattan_distance_goal_is_zero():
    assert astar.manhattan_distance(astar.GOAL_STATE) == 0


def test_blank_tile_is_excluded_from_manhattan_distance():
    one_move_state = (1, 2, 3, 4, 5, 6, 7, 0, 8)

    assert astar.manhattan_distance(one_move_state) == 1


def test_required_puzzle_has_optimal_30_move_path(required_result):
    path, _, _ = required_result

    assert_legal_path(path, astar.INITIAL_STATE, astar.GOAL_STATE)
    assert len(path) - 1 == 30


def test_required_puzzle_search_statistics(required_result):
    _, states_expanded, states_discovered = required_result

    assert states_expanded == 7329
    assert states_discovered == 10895


def test_goal_state_requires_zero_moves():
    path, states_expanded, states_discovered = astar.a_star_search(
        astar.GOAL_STATE,
        astar.GOAL_STATE,
    )

    assert path == [astar.GOAL_STATE]
    assert states_expanded == 0
    assert states_discovered == 1


def test_one_move_state():
    one_move_state = (1, 2, 3, 4, 5, 6, 7, 0, 8)
    path, _, _ = astar.a_star_search(one_move_state, astar.GOAL_STATE)

    assert_legal_path(path, one_move_state, astar.GOAL_STATE)
    assert len(path) - 1 == 1


def test_unsolvable_state_is_rejected_before_search():
    unsolvable_state = (2, 1, 3, 4, 5, 6, 7, 8, 0)
    path, states_expanded, states_discovered = astar.a_star_search(
        unsolvable_state,
        astar.GOAL_STATE,
    )

    assert path is None
    assert states_expanded == 0
    assert states_discovered == 1


def test_solution_output_contains_path_and_statistics(required_result, capsys):
    path, states_expanded, states_discovered = required_result
    astar.display_solution(path, states_expanded, states_discovered)
    output = capsys.readouterr().out

    assert "Step 0" in output
    assert "Step 30" in output
    assert "Optimal moves: 30" in output
    assert "States expanded: 7329" in output
    assert "States discovered: 10895" in output

