"""Standard-library regressions for starter-compatible Chopsticks rules and DP."""

from __future__ import annotations

from unittest import TestCase, main
from unittest.mock import Mock

import chopsticks


class StateAndMoveTests(TestCase):
    """Ordered left/right hand identity and immutable game values."""

    def test_state_preserves_both_players_left_right_hands(self) -> None:
        state = chopsticks.GameState((4, 1), (3, 0), chopsticks.PLAYER_B)

        self.assertEqual(state.a_hands, (4, 1))
        self.assertEqual(state.b_hands, (3, 0))
        self.assertEqual(state.current_hands, (3, 0))
        self.assertEqual(state.opponent_hands, (4, 1))
        self.assertNotEqual(state, chopsticks.GameState((1, 4), (3, 0), "B"))

    def test_state_rejects_invalid_hands_turns_and_double_knockout(self) -> None:
        invalid_constructors = (
            lambda: chopsticks.GameState((1,), (1, 1)),
            lambda: chopsticks.GameState((1, 5), (1, 1)),
            lambda: chopsticks.GameState((True, 1), (1, 1)),
            lambda: chopsticks.GameState((1, 1), (1, 1), "C"),
            lambda: chopsticks.GameState((0, 0), (0, 0)),
        )

        for constructor in invalid_constructors:
            with self.subTest(constructor=constructor):
                with self.assertRaises(ValueError):
                    constructor()

    def test_move_validation_rejects_bad_indices_but_accepts_zero_split(self) -> None:
        with self.assertRaises(ValueError):
            chopsticks.Move.attack(-1, 1)
        with self.assertRaises(ValueError):
            chopsticks.Move.attack(2, 0)
        self.assertEqual(chopsticks.Move.split((0, 4)).new_hands, (0, 4))
        with self.assertRaises(ValueError):
            chopsticks.Move("unknown")


class RuleTests(TestCase):
    """Attacks, redistributions, move legality, and terminal states."""

    @staticmethod
    def successor_for(
        state: chopsticks.GameState,
        move: chopsticks.Move,
    ) -> chopsticks.GameState:
        successors = dict(chopsticks.legal_successors(state))
        if move not in successors:
            raise AssertionError(f"Expected {move!r} to be legal from {state!r}")
        return successors[move]

    def test_attack_adds_below_five(self) -> None:
        state = chopsticks.GameState((1, 2), (1, 3), chopsticks.PLAYER_A)

        child = self.successor_for(state, chopsticks.Move.attack(0, 1))

        self.assertEqual(child, chopsticks.GameState((1, 2), (1, 4), "B"))
        self.assertEqual(state, chopsticks.GameState((1, 2), (1, 3), "A"))

    def test_attack_knocks_out_at_five_and_does_not_roll_over_above_five(self) -> None:
        state = chopsticks.GameState((2, 3), (2, 4), chopsticks.PLAYER_A)

        exactly_five = self.successor_for(state, chopsticks.Move.attack(1, 0))
        above_five = self.successor_for(state, chopsticks.Move.attack(0, 1))

        self.assertEqual(exactly_five.b_hands, (0, 4))
        self.assertEqual(above_five.b_hands, (2, 0))
        self.assertNotEqual(above_five.b_hands, (2, 1))

    def test_dead_hands_cannot_attack_or_be_targeted(self) -> None:
        state = chopsticks.GameState((0, 2), (0, 3), chopsticks.PLAYER_A)
        successors = chopsticks.legal_successors(state)
        attacks = [(move, child) for move, child in successors if move.kind == "attack"]

        self.assertEqual(
            attacks,
            [
                (
                    chopsticks.Move.attack(1, 1),
                    chopsticks.GameState((0, 2), (0, 0), chopsticks.PLAYER_B),
                )
            ],
        )
        self.assertTrue(all(move.source == 1 and move.target == 1 for move, _ in attacks))

    def test_split_can_revive_a_dead_hand(self) -> None:
        state = chopsticks.GameState((0, 4), (1, 1), chopsticks.PLAYER_A)
        split_children = {
            move.new_hands: child
            for move, child in chopsticks.legal_successors(state)
            if move.kind == "split"
        }

        self.assertEqual(set(split_children), {(1, 3), (2, 2), (3, 1)})
        self.assertEqual(
            split_children[(1, 3)],
            chopsticks.GameState((1, 3), (1, 1), chopsticks.PLAYER_B),
        )
        self.assertEqual(split_children[(2, 2)].a_hands, (2, 2))
        self.assertEqual(split_children[(3, 1)].a_hands, (3, 1))
        self.assertNotIn((4, 0), split_children)  # A pure left/right swap.

    def test_split_preserves_total_and_may_create_a_dead_hand(self) -> None:
        state = chopsticks.GameState((1, 3), (1, 1), chopsticks.PLAYER_A)
        split_moves = [
            move for move in chopsticks.legal_moves(state) if move.kind == "split"
        ]

        self.assertEqual(set(split_moves), {
            chopsticks.Move.split((0, 4)),
            chopsticks.Move.split((2, 2)),
            chopsticks.Move.split((4, 0)),
        })
        for move in split_moves:
            self.assertIsNotNone(move.new_hands)
            assert move.new_hands is not None
            self.assertEqual(sum(move.new_hands), sum(state.a_hands))
            self.assertGreaterEqual(min(move.new_hands), 0)

        with self.assertRaises(ValueError):
            chopsticks.apply_move(state, chopsticks.Move.split((1, 2)))
        with self.assertRaises(ValueError):
            chopsticks.apply_move(state, chopsticks.Move.split((1, 3)))

    def test_starter_opening_has_four_distinct_ordered_successors(self) -> None:
        successors = chopsticks.legal_successors(chopsticks.INITIAL_STATE)

        self.assertEqual(len(successors), 4)
        self.assertEqual(
            {child for _move, child in successors},
            {
                chopsticks.GameState((1, 1), (2, 1), "B"),
                chopsticks.GameState((1, 1), (1, 2), "B"),
                chopsticks.GameState((0, 2), (1, 1), "B"),
                chopsticks.GameState((2, 0), (1, 1), "B"),
            },
        )
        self.assertEqual(sum(move.kind == "attack" for move, _ in successors), 2)
        self.assertEqual(sum(move.kind == "split" for move, _ in successors), 2)

    def test_distinct_attacks_with_the_same_result_share_one_edge(self) -> None:
        state = chopsticks.GameState((1, 3), (2, 4), chopsticks.PLAYER_A)
        attacks = [
            (move, child)
            for move, child in chopsticks.legal_successors(state)
            if move.kind == "attack"
        ]

        self.assertEqual(len(attacks), 3)
        self.assertEqual(
            {child.b_hands for _move, child in attacks},
            {(3, 4), (2, 0), (0, 4)},
        )

    def test_terminal_state_has_winner_and_no_legal_moves(self) -> None:
        a_wins = chopsticks.GameState((1, 2), (0, 0), chopsticks.PLAYER_B)
        b_wins = chopsticks.GameState((0, 0), (2, 3), chopsticks.PLAYER_A)

        self.assertEqual(chopsticks.winner(a_wins), chopsticks.PLAYER_A)
        self.assertEqual(chopsticks.winner(b_wins), chopsticks.PLAYER_B)
        self.assertEqual(chopsticks.legal_successors(a_wins), ())
        self.assertEqual(chopsticks.legal_successors(b_wins), ())
        with self.assertRaises(ValueError):
            chopsticks.apply_move(a_wins, chopsticks.Move.attack(0, 0))


class GraphTests(TestCase):
    """Regression and structural checks for the complete reachable graph."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.graph = chopsticks.build_game_graph()

    def test_reachable_graph_has_verified_size(self) -> None:
        edge_count = sum(len(edges) for edges in self.graph.values())
        terminal_count = sum(chopsticks.winner(state) is not None for state in self.graph)

        self.assertEqual(len(self.graph), 1_116)
        self.assertEqual(edge_count, 4_080)
        self.assertEqual(terminal_count, 48)
        self.assertEqual(max(map(len, self.graph.values())), 7)

    def test_every_graph_edge_is_legal_ordered_and_changes_turn(self) -> None:
        for state, edges in self.graph.items():
            with self.subTest(state=state):
                self.assertTrue(all(0 <= value <= 4 for value in state.a_hands))
                self.assertTrue(all(0 <= value <= 4 for value in state.b_hands))
                self.assertEqual(len({child for _move, child in edges}), len(edges))

                if chopsticks.winner(state) is not None:
                    self.assertEqual(edges, ())
                else:
                    self.assertGreater(len(edges), 0)

                for move, child in edges:
                    self.assertIn(child, self.graph)
                    self.assertEqual(
                        child.turn,
                        chopsticks.other_player(state.turn),
                    )
                    self.assertEqual(chopsticks.apply_move(state, move), child)


class DynamicProgrammingTests(TestCase):
    """The starter's level-indexed bottom-up MAX/MIN table."""

    def test_depth_20_table_is_complete_and_finite(self) -> None:
        table = chopsticks.best_move_dp(20)

        self.assertEqual(len(table), 625 * 21)
        self.assertIn(((1, 1), (1, 1), 0), table)
        self.assertIn(((4, 4), (4, 4), 20), table)
        self.assertEqual(table[((1, 1), (1, 1), 20)], (0, []))

    def test_terminal_wins_take_precedence_over_horizon_tie(self) -> None:
        table = chopsticks.best_move_dp(2)

        for level in range(3):
            with self.subTest(level=level):
                self.assertEqual(table[((2, 3), (0, 0), level)], (1, []))
                self.assertEqual(table[((0, 0), (2, 3), level)], (-1, []))
                self.assertEqual(table[((0, 0), (0, 0), level)], (0, []))
                self.assertEqual(table[((1, 1), (1, 1), 2)], (0, []))

    def test_a_maximizes_and_b_minimizes_the_child_value(self) -> None:
        table = chopsticks.best_move_dp(4)
        positions = (
            ((0, 2), (0, 3), 0),
            ((0, 3), (0, 2), 1),
            ((1, 1), (1, 1), 0),
            ((2, 2), (3, 3), 2),
        )

        for position in positions:
            with self.subTest(position=position):
                children = chopsticks.next_moves(position)
                score, best_child = table[position]
                child_values = [table[child][0] for child in children]
                expected = max(child_values) if position[2] % 2 == 0 else min(child_values)
                self.assertEqual(score, expected)
                self.assertIn(best_child, children)
                self.assertEqual(table[best_child][0], score)

    def test_one_ply_tactical_win_for_both_players(self) -> None:
        table = chopsticks.best_move_dp(2)
        a_position = ((0, 2), (0, 3), 0)
        b_position = ((0, 3), (0, 2), 1)

        self.assertEqual(table[a_position][0], 1)
        self.assertEqual(table[table[a_position][1]][0], 1)
        self.assertEqual(table[b_position][0], -1)
        self.assertEqual(table[table[b_position][1]][0], -1)


class RunnerTests(TestCase):
    """Autonomous mode terminates by the fixed starter-style horizon."""

    def test_autonomous_mode_never_requests_input_and_reaches_a_result(self) -> None:
        input_function = Mock(side_effect=AssertionError("input was requested"))
        output: list[str] = []

        result = chopsticks.run_autonomous(
            moves=2,
            pause=False,
            input_function=input_function,
            output_function=output.append,
        )

        input_function.assert_not_called()
        self.assertIn(result, {chopsticks.PLAYER_A, chopsticks.PLAYER_B, chopsticks.DRAW})
        transcript = "\n".join(output)
        self.assertIn("Autonomous demonstration", transcript)
        self.assertIn("Reachable graph: 1116 states and 4080 legal transitions.", transcript)


if __name__ == "__main__":
    main(verbosity=2)
