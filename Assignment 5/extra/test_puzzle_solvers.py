"""Regression tests for the BFS and A* 8-puzzle solvers."""

import unittest

import astar
import bfs


def assert_legal_path(test_case, path, initial_state, goal_state):
    """Assert that a path has the correct endpoints and legal transitions."""
    test_case.assertIsNotNone(path)
    test_case.assertEqual(path[0], initial_state)
    test_case.assertEqual(path[-1], goal_state)

    for previous_state, next_state in zip(path, path[1:]):
        test_case.assertIn(next_state, bfs.get_neighbors(previous_state))


class PuzzleSolverTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bfs_result = bfs.breadth_first_search(
            bfs.INITIAL_STATE,
            bfs.GOAL_STATE,
        )
        cls.astar_result = astar.a_star_search(
            astar.INITIAL_STATE,
            astar.GOAL_STATE,
        )

    def test_manhattan_distance_example(self):
        example_state = (
            1, 2, 3,
            4, 0, 5,
            7, 8, 6,
        )
        self.assertEqual(astar.manhattan_distance(example_state), 2)
        self.assertEqual(astar.manhattan_distance(astar.GOAL_STATE), 0)

    def test_bfs_required_state(self):
        path, expanded, discovered = self.bfs_result
        assert_legal_path(self, path, bfs.INITIAL_STATE, bfs.GOAL_STATE)
        self.assertEqual(len(path) - 1, 30)
        self.assertEqual(expanded, 181392)
        self.assertEqual(discovered, 181440)

    def test_astar_required_state(self):
        path, expanded, discovered = self.astar_result
        assert_legal_path(self, path, astar.INITIAL_STATE, astar.GOAL_STATE)
        self.assertEqual(len(path) - 1, 30)
        self.assertEqual(expanded, 7329)
        self.assertEqual(discovered, 10895)

    def test_bfs_and_astar_have_the_same_optimal_length(self):
        bfs_path = self.bfs_result[0]
        astar_path = self.astar_result[0]
        self.assertEqual(len(bfs_path), len(astar_path))

    def test_goal_state_requires_no_moves(self):
        path, expanded, discovered = astar.a_star_search(
            astar.GOAL_STATE,
            astar.GOAL_STATE,
        )
        self.assertEqual(path, [astar.GOAL_STATE])
        self.assertEqual(expanded, 0)
        self.assertEqual(discovered, 1)

    def test_one_move_state(self):
        one_move_state = (
            1, 2, 3,
            4, 5, 6,
            7, 0, 8,
        )
        path, _, _ = astar.a_star_search(one_move_state, astar.GOAL_STATE)
        assert_legal_path(self, path, one_move_state, astar.GOAL_STATE)
        self.assertEqual(len(path) - 1, 1)

    def test_unsolvable_state_is_rejected(self):
        unsolvable_state = (
            2, 1, 3,
            4, 5, 6,
            7, 8, 0,
        )
        path, expanded, discovered = astar.a_star_search(
            unsolvable_state,
            astar.GOAL_STATE,
        )
        self.assertIsNone(path)
        self.assertEqual(expanded, 0)
        self.assertEqual(discovered, 1)


if __name__ == "__main__":
    unittest.main()
