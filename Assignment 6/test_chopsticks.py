"""Standard-library tests for the Assignment 6 Chopsticks game.

The suite concentrates on pure game rules and small, deterministic minimax
positions.  It deliberately avoids a broad 50-ply search so a rules test does
not double as a long-running performance benchmark.
"""

from __future__ import annotations

from collections import Counter
from unittest import TestCase, main
from unittest.mock import Mock

import chopsticks


class StateAndMoveTests(TestCase):
    """Canonicalization and validation for immutable game values."""

    def test_state_canonicalizes_both_players_hands(self) -> None:
        state = chopsticks.GameState((4, 1), (3, 0), chopsticks.PLAYER_B)

        self.assertEqual(state.a_hands, (1, 4))
        self.assertEqual(state.b_hands, (0, 3))
        self.assertEqual(state.current_hands, (0, 3))
        self.assertEqual(state.opponent_hands, (1, 4))

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

    def test_move_validation_rejects_dead_attacks_and_splits_leaving_zero(self) -> None:
        with self.assertRaises(ValueError):
            chopsticks.Move.attack(0, 3)
        with self.assertRaises(ValueError):
            chopsticks.Move.attack(2, 0)
        with self.assertRaises(ValueError):
            chopsticks.Move.split((0, 4))
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

        child = self.successor_for(state, chopsticks.Move.attack(1, 3))

        self.assertEqual(child, chopsticks.GameState((1, 2), (1, 4), "B"))
        self.assertEqual(state, chopsticks.GameState((1, 2), (1, 3), "A"))

    def test_attack_knocks_out_at_five_and_does_not_roll_over_above_five(self) -> None:
        state = chopsticks.GameState((2, 3), (2, 4), chopsticks.PLAYER_A)

        exactly_five = self.successor_for(state, chopsticks.Move.attack(3, 2))
        above_five = self.successor_for(state, chopsticks.Move.attack(2, 4))

        self.assertEqual(exactly_five.b_hands, (0, 4))
        self.assertEqual(above_five.b_hands, (0, 2))
        self.assertNotEqual(above_five.b_hands, (1, 2))

    def test_dead_hands_cannot_attack_or_be_targeted(self) -> None:
        state = chopsticks.GameState((0, 2), (0, 3), chopsticks.PLAYER_A)
        successors = chopsticks.legal_successors(state)
        attacks = [(move, child) for move, child in successors if move.kind == "attack"]

        self.assertEqual(
            attacks,
            [
                (
                    chopsticks.Move.attack(2, 3),
                    chopsticks.GameState((0, 2), (0, 0), chopsticks.PLAYER_B),
                )
            ],
        )
        self.assertTrue(all(move.source != 0 and move.target != 0 for move, _ in attacks))

    def test_split_can_revive_a_dead_hand(self) -> None:
        state = chopsticks.GameState((0, 4), (1, 1), chopsticks.PLAYER_A)
        split_children = {
            move.new_hands: child
            for move, child in chopsticks.legal_successors(state)
            if move.kind == "split"
        }

        self.assertEqual(set(split_children), {(1, 3), (2, 2)})
        self.assertEqual(
            split_children[(1, 3)],
            chopsticks.GameState((1, 3), (1, 1), chopsticks.PLAYER_B),
        )
        self.assertEqual(
            split_children[(2, 2)],
            chopsticks.GameState((2, 2), (1, 1), chopsticks.PLAYER_B),
        )

    def test_split_preserves_total_and_cannot_create_a_dead_hand(self) -> None:
        state = chopsticks.GameState((1, 3), (1, 1), chopsticks.PLAYER_A)
        split_moves = [
            move for move in chopsticks.legal_moves(state) if move.kind == "split"
        ]

        self.assertEqual(split_moves, [chopsticks.Move.split((2, 2))])
        for move in split_moves:
            self.assertIsNotNone(move.new_hands)
            assert move.new_hands is not None
            self.assertEqual(sum(move.new_hands), sum(state.a_hands))
            self.assertGreaterEqual(min(move.new_hands), 1)

        with self.assertRaises(ValueError):
            chopsticks.apply_move(state, chopsticks.Move.split((1, 2)))
        with self.assertRaises(ValueError):
            chopsticks.apply_move(state, chopsticks.Move.split((1, 3)))

    def test_equivalent_physical_attacks_are_deduplicated(self) -> None:
        successors = chopsticks.legal_successors(chopsticks.INITIAL_STATE)

        self.assertEqual(len(successors), 1)
        self.assertEqual(successors[0][0], chopsticks.Move.attack(1, 1))
        self.assertEqual(
            successors[0][1],
            chopsticks.GameState((1, 1), (1, 2), chopsticks.PLAYER_B),
        )

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
            {(3, 4), (0, 2), (0, 4)},
        )

    def test_terminal_state_has_winner_and_no_legal_moves(self) -> None:
        a_wins = chopsticks.GameState((1, 2), (0, 0), chopsticks.PLAYER_B)
        b_wins = chopsticks.GameState((0, 0), (2, 3), chopsticks.PLAYER_A)

        self.assertEqual(chopsticks.winner(a_wins), chopsticks.PLAYER_A)
        self.assertEqual(chopsticks.winner(b_wins), chopsticks.PLAYER_B)
        self.assertEqual(chopsticks.legal_successors(a_wins), ())
        self.assertEqual(chopsticks.legal_successors(b_wins), ())
        with self.assertRaises(ValueError):
            chopsticks.apply_move(a_wins, chopsticks.Move.attack(1, 1))


class GraphTests(TestCase):
    """Regression and structural checks for the complete reachable graph."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.graph = chopsticks.build_game_graph()

    def test_reachable_graph_has_verified_size(self) -> None:
        edge_count = sum(len(edges) for edges in self.graph.values())
        terminal_count = sum(chopsticks.winner(state) is not None for state in self.graph)

        self.assertEqual(len(self.graph), 342)
        self.assertEqual(edge_count, 844)
        self.assertEqual(terminal_count, 22)
        self.assertEqual(max(map(len, self.graph.values())), 5)

    def test_every_graph_edge_is_legal_canonical_and_changes_turn(self) -> None:
        for state, edges in self.graph.items():
            with self.subTest(state=state):
                self.assertEqual(state.a_hands, tuple(sorted(state.a_hands)))
                self.assertEqual(state.b_hands, tuple(sorted(state.b_hands)))
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


class MinimaxTests(TestCase):
    """Small tactical positions that exercise both MAX and MIN behavior."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.graph = chopsticks.build_game_graph()

    def make_ai(self, depth: int = 2) -> chopsticks.MinimaxAI:
        return chopsticks.MinimaxAI(depth_limit=depth, graph=self.graph)

    def test_player_a_selects_an_immediate_win(self) -> None:
        state = chopsticks.GameState((0, 2), (0, 3), chopsticks.PLAYER_A)

        decision = self.make_ai().choose_move(state)

        self.assertEqual(decision.move, chopsticks.Move.attack(2, 3))
        self.assertEqual(chopsticks.winner(decision.next_state), chopsticks.PLAYER_A)
        self.assertGreater(decision.score, 0)

    def test_player_b_selects_an_immediate_win(self) -> None:
        state = chopsticks.GameState((0, 3), (0, 2), chopsticks.PLAYER_B)

        decision = self.make_ai().choose_move(state)

        self.assertEqual(decision.move, chopsticks.Move.attack(2, 3))
        self.assertEqual(chopsticks.winner(decision.next_state), chopsticks.PLAYER_B)
        self.assertLess(decision.score, 0)

    def test_player_a_splits_to_avoid_an_immediate_loss(self) -> None:
        state = chopsticks.GameState((0, 2), (0, 1), chopsticks.PLAYER_A)

        decision = self.make_ai().choose_move(state)

        self.assertEqual(decision.move, chopsticks.Move.split((1, 1)))
        self.assertEqual(
            decision.next_state,
            chopsticks.GameState((1, 1), (0, 1), chopsticks.PLAYER_B),
        )

    def test_player_b_splits_to_avoid_an_immediate_loss(self) -> None:
        state = chopsticks.GameState((0, 1), (0, 2), chopsticks.PLAYER_B)

        decision = self.make_ai().choose_move(state)

        self.assertEqual(decision.move, chopsticks.Move.split((1, 1)))
        self.assertEqual(
            decision.next_state,
            chopsticks.GameState((0, 1), (1, 1), chopsticks.PLAYER_A),
        )

    def test_requested_50_ply_search_completes_from_initial_state(self) -> None:
        occurrences = Counter({chopsticks.INITIAL_STATE: 1})
        ai = chopsticks.MinimaxAI(graph=self.graph)

        decision = ai.choose_move(chopsticks.INITIAL_STATE, occurrences)

        self.assertEqual(decision.move, chopsticks.Move.attack(1, 1))
        self.assertEqual(decision.score, 0)
        self.assertGreater(ai.last_search_nodes, 0)
        self.assertEqual(occurrences, Counter({chopsticks.INITIAL_STATE: 1}))


class RepetitionAndRunnerTests(TestCase):
    """Threefold repetition, result priority, and autonomous execution."""

    def test_full_state_must_occur_three_times_and_includes_turn(self) -> None:
        state_a_turn = chopsticks.GameState((1, 2), (3, 4), chopsticks.PLAYER_A)
        state_b_turn = chopsticks.GameState((1, 2), (3, 4), chopsticks.PLAYER_B)
        occurrences = Counter({state_a_turn: 2})

        self.assertFalse(chopsticks.is_threefold_repetition(state_a_turn, occurrences))
        occurrences[state_a_turn] += 1
        self.assertTrue(chopsticks.is_threefold_repetition(state_a_turn, occurrences))
        self.assertFalse(chopsticks.is_threefold_repetition(state_b_turn, occurrences))

    def test_known_cycle_becomes_a_draw_on_its_third_occurrence(self) -> None:
        state = chopsticks.GameState((2, 2), (3, 3), chopsticks.PLAYER_A)
        starting_state = state
        cycle = (
            chopsticks.Move.split((1, 3)),
            chopsticks.Move.split((2, 4)),
            chopsticks.Move.split((2, 2)),
            chopsticks.Move.split((3, 3)),
        )
        occurrences = Counter({state: 1})

        for lap in range(2):
            for move in cycle:
                state = chopsticks.apply_move(state, move)
                occurrences[state] += 1
            self.assertEqual(state, starting_state)
            expected = chopsticks.DRAW if lap == 1 else None
            self.assertEqual(chopsticks.game_result(state, occurrences), expected)

    def test_terminal_win_takes_priority_over_repetition(self) -> None:
        terminal = chopsticks.GameState((2, 3), (0, 0), chopsticks.PLAYER_B)
        occurrences = Counter({terminal: 3})

        self.assertTrue(chopsticks.is_threefold_repetition(terminal, occurrences))
        self.assertEqual(
            chopsticks.game_result(terminal, occurrences),
            chopsticks.PLAYER_A,
        )

    def test_minimax_scores_a_third_occurrence_as_a_draw(self) -> None:
        only_child = chopsticks.legal_successors(chopsticks.INITIAL_STATE)[0][1]
        occurrences = Counter({chopsticks.INITIAL_STATE: 1, only_child: 2})
        ai = chopsticks.MinimaxAI(depth_limit=2)

        decision = ai.choose_move(chopsticks.INITIAL_STATE, occurrences)

        self.assertEqual(decision.next_state, only_child)
        self.assertEqual(decision.score, 0)
        self.assertEqual(occurrences[only_child], 2)

    def test_minimax_detects_a_third_occurrence_deeper_in_search(self) -> None:
        states = [chopsticks.GameState((2, 2), (3, 3), chopsticks.PLAYER_A)]
        moves = (
            chopsticks.Move.split((1, 3)),
            chopsticks.Move.split((2, 4)),
            chopsticks.Move.split((2, 2)),
            chopsticks.Move.split((3, 3)),
        )

        for move in moves:
            states.append(chopsticks.apply_move(states[-1], move))
        self.assertEqual(states[-1], states[0])

        forced_cycle_graph = {
            states[index]: ((move, states[index + 1]),)
            for index, move in enumerate(moves)
        }
        occurrences = Counter({states[0]: 2})
        ai = chopsticks.MinimaxAI(depth_limit=4, graph=forced_cycle_graph)

        decision = ai.choose_move(states[0], occurrences)

        self.assertEqual(decision.score, 0)
        self.assertEqual(occurrences, Counter({states[0]: 2}))

    def test_autonomous_mode_never_requests_input_and_reaches_a_result(self) -> None:
        input_function = Mock(side_effect=AssertionError("input was requested"))
        output: list[str] = []

        result = chopsticks.run_autonomous(
            depth_limit=2,
            max_turns=100,
            pause=False,
            input_function=input_function,
            output_function=output.append,
        )

        input_function.assert_not_called()
        self.assertIn(result, {chopsticks.PLAYER_A, chopsticks.PLAYER_B, chopsticks.DRAW})
        self.assertNotEqual(result, chopsticks.TURN_LIMIT)
        transcript = "\n".join(output)
        self.assertIn("Autonomous demonstration", transcript)
        self.assertIn("Reachable graph: 342 states and 844 legal transitions.", transcript)
        self.assertIn("Minimax evaluation:", transcript)
        self.assertTrue(
            "wins!" in transcript or "same complete position occurred three times" in transcript
        )


if __name__ == "__main__":
    main(verbosity=2)
