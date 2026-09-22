"""Pytest regression, edge-case, and security tests for ``chopsticks.py``.

The original ``unittest`` suite remains useful.  This companion suite leans on
pytest features such as parametrization, fixtures, ``monkeypatch``, ``capsys``,
and ``tmp_path``.  It deliberately uses only pytest and the Python standard
library so that it can run after every project change without extra services.
"""

from __future__ import annotations

import ast
import builtins
from collections import deque
from dataclasses import FrozenInstanceError
from itertools import product
from pathlib import Path
from typing import Callable, Iterable

import pytest

import chopsticks


VALID_HANDS = tuple(product(range(5), repeat=2))
ALL_VALID_STATES = tuple(
    chopsticks.GameState(a_hands, b_hands, turn)
    for a_hands in VALID_HANDS
    for b_hands in VALID_HANDS
    if not (a_hands == (0, 0) and b_hands == (0, 0))
    for turn in chopsticks.PLAYERS
)


@pytest.fixture(scope="module")
def reachable_graph() -> chopsticks.Graph:
    """Build the production graph once for all graph and AI tests."""

    return chopsticks.build_game_graph()


def scripted_input(responses: Iterable[str]) -> Callable[[str], str]:
    """Return a deterministic replacement for ``input``."""

    iterator = iter(responses)
    return lambda _prompt="": next(iterator)


def acting_and_waiting_hands(
    state: chopsticks.GameState,
) -> tuple[chopsticks.Hands, chopsticks.Hands]:
    """Return the acting player's hands followed by the waiting player's."""

    if state.turn == chopsticks.PLAYER_A:
        return state.a_hands, state.b_hands
    return state.b_hands, state.a_hands


def make_state_from_roles(
    state: chopsticks.GameState,
    acting: chopsticks.Hands,
    waiting: chopsticks.Hands,
) -> chopsticks.GameState:
    """Create the post-move state using actor/opponent-oriented hands."""

    next_turn = chopsticks.other_player(state.turn)
    if state.turn == chopsticks.PLAYER_A:
        return chopsticks.GameState(acting, waiting, next_turn)
    return chopsticks.GameState(waiting, acting, next_turn)


def reference_horizon_value(position: tuple, depth: int) -> int:
    """Uncached recursive oracle for shallow starter-style game trees."""

    a_hands, b_hands, level = position
    if a_hands == (0, 0) and b_hands == (0, 0):
        return 0
    if a_hands == (0, 0):
        return -1
    if b_hands == (0, 0):
        return 1
    if level == depth:
        return 0

    child_values = [
        reference_horizon_value(child, depth)
        for child in chopsticks.next_moves(position)
    ]
    assert child_values, position
    return max(child_values) if level % 2 == 0 else min(child_values)


@pytest.mark.parametrize(
    ("raw_hands", "expected"),
    [
        ((4, 0), (4, 0)),
        ([3, 1], (3, 1)),
        ((value for value in (2, 2)), (2, 2)),
    ],
)
def test_hands_validation_preserves_left_right_order(
    raw_hands: Iterable[int],
    expected: chopsticks.Hands,
) -> None:
    assert chopsticks.canonical_hands(raw_hands) == expected


@pytest.mark.parametrize(
    "bad_hands",
    [
        (),
        (1,),
        (1, 2, 3),
        (-1, 2),
        (1, 5),
        (True, 1),
        (False, 1),
        (1.0, 2),
        ("1", 2),
        (None, 2),
    ],
)
def test_canonical_hands_rejects_bad_shape_type_and_range(bad_hands: tuple) -> None:
    with pytest.raises(ValueError, match="exactly two|whole numbers"):
        chopsticks.canonical_hands(bad_hands)


def test_canonical_hands_stops_after_detecting_a_third_value() -> None:
    def too_many_values():
        yield 1
        yield 2
        yield 3
        raise AssertionError("canonical_hands consumed beyond its validation bound")

    with pytest.raises(ValueError, match="exactly two"):
        chopsticks.canonical_hands(too_many_values())


def test_states_and_moves_are_immutable_hashable_values() -> None:
    state = chopsticks.GameState((4, 1), (3, 0), chopsticks.PLAYER_B)
    move = chopsticks.Move.split((3, 1))

    assert state != chopsticks.GameState((1, 4), (0, 3), chopsticks.PLAYER_B)
    assert move != chopsticks.Move.split((1, 3))
    assert {state: move}[state] == move

    with pytest.raises(FrozenInstanceError):
        state.turn = chopsticks.PLAYER_A  # type: ignore[misc]
    with pytest.raises(FrozenInstanceError):
        move.kind = "attack"  # type: ignore[misc]


@pytest.mark.parametrize(
    "factory",
    [
        lambda: chopsticks.Move.attack(-1, 1),
        lambda: chopsticks.Move.attack(0, -1),
        lambda: chopsticks.Move.attack(2, 1),
        lambda: chopsticks.Move.attack(1, 2),
        lambda: chopsticks.Move.attack(True, 1),
        lambda: chopsticks.Move("attack", source=1, target=1, new_hands=(1, 1)),
        lambda: chopsticks.Move("split"),
        lambda: chopsticks.Move("split", source=1, new_hands=(1, 1)),
        lambda: chopsticks.Move.split((1, 5)),
        lambda: chopsticks.Move("delete"),
    ],
)
def test_malformed_moves_fail_closed(factory: Callable[[], chopsticks.Move]) -> None:
    with pytest.raises(ValueError):
        factory()


def test_every_valid_state_obeys_all_attack_and_split_invariants() -> None:
    """Exhaust all 1,248 ordered states, not just initially reachable ones."""

    assert len(ALL_VALID_STATES) == 1_248

    for state in ALL_VALID_STATES:
        successors = chopsticks.legal_successors(state)
        assert chopsticks.legal_moves(state) == tuple(move for move, _ in successors)
        assert len(successors) <= 7, state
        assert len(successors) == len(set(successors)), state
        assert len({child for _move, child in successors}) == len(successors), state

        if chopsticks.winner(state) is not None:
            assert successors == (), state
            continue

        assert successors, state
        acting, waiting = acting_and_waiting_hands(state)
        attack_edges = [edge for edge in successors if edge[0].kind == "attack"]
        split_edges = [edge for edge in successors if edge[0].kind == "split"]

        expected_attack_children: set[chopsticks.GameState] = set()
        for source_index, source_value in enumerate(acting):
            if source_value == 0:
                continue
            for target_index, target_value in enumerate(waiting):
                if target_value == 0:
                    continue
                new_target = 0 if source_value + target_value >= 5 else source_value + target_value
                new_waiting = list(waiting)
                new_waiting[target_index] = new_target
                expected_attack_children.add(
                    make_state_from_roles(state, acting, tuple(new_waiting))  # type: ignore[arg-type]
                )

        assert {child for _move, child in attack_edges} == expected_attack_children, state

        expected_splits: set[chopsticks.Hands] = set()
        for source_index, source_value in enumerate(acting):
            target_index = 1 - source_index
            for amount in range(1, source_value + 1):
                if acting[target_index] + amount > chopsticks.MAX_LIVE_VALUE:
                    continue
                proposed = list(acting)
                proposed[source_index] -= amount
                proposed[target_index] += amount
                new_hands = tuple(proposed)
                if new_hands != acting and new_hands != acting[::-1]:
                    expected_splits.add(new_hands)  # type: ignore[arg-type]
        assert {move.new_hands for move, _child in split_edges} == expected_splits, state

        for move, child in successors:
            assert child.turn == chopsticks.other_player(state.turn), (state, move)
            assert chopsticks.apply_move(state, move) == child
            child_acting, child_waiting = acting_and_waiting_hands(child)

            # The roles reverse after a move: the new waiting player was the actor.
            if move.kind == "attack":
                assert child_waiting == acting, (state, move, child)
                assert move.source is not None and move.target is not None
                assert move.source in (0, 1) and acting[move.source] != 0
                assert move.target in (0, 1) and waiting[move.target] != 0

                expected_target = (
                    0
                    if acting[move.source] + waiting[move.target] >= chopsticks.KNOCKOUT_TOTAL
                    else acting[move.source] + waiting[move.target]
                )
                expected_waiting = list(waiting)
                expected_waiting[move.target] = expected_target
                expected_child = make_state_from_roles(
                    state,
                    acting,
                    tuple(expected_waiting),  # type: ignore[arg-type]
                )
                assert child == expected_child, (state, move, child)
            else:
                assert move.new_hands is not None
                assert child_waiting == move.new_hands, (state, move, child)
                assert child_acting == waiting, (state, move, child)
                assert sum(move.new_hands) == sum(acting)
                assert min(move.new_hands) >= 0
                assert move.new_hands != acting
                assert move.new_hands != acting[::-1]


def test_illegal_but_well_formed_moves_are_rejected_without_mutation() -> None:
    state = chopsticks.GameState((1, 2), (2, 3), chopsticks.PLAYER_A)
    original = state

    illegal_moves = (
        chopsticks.Move.split((1, 1)),  # does not preserve total
        chopsticks.Move.split((1, 2)),  # unchanged position
        chopsticks.Move.split((2, 1)),  # only swaps left and right
    )
    for move in illegal_moves:
        with pytest.raises(ValueError, match="not legal"):
            chopsticks.apply_move(state, move)

    assert state == original

    state_with_dead_hands = chopsticks.GameState((0, 2), (2, 0), "A")
    for move in (chopsticks.Move.attack(0, 0), chopsticks.Move.attack(1, 1)):
        with pytest.raises(ValueError, match="not legal"):
            chopsticks.apply_move(state_with_dead_hands, move)


def test_graph_is_a_closed_deterministic_reachable_set(
    reachable_graph: chopsticks.Graph,
) -> None:
    second_build = chopsticks.build_reachable_graph()
    assert second_build == reachable_graph
    assert len(reachable_graph) == 1_116
    assert sum(map(len, reachable_graph.values())) == 4_080
    assert sum(chopsticks.winner(state) is not None for state in reachable_graph) == 48
    assert max(map(len, reachable_graph.values())) == 7

    visited = {chopsticks.INITIAL_STATE}
    queue = deque([chopsticks.INITIAL_STATE])
    while queue:
        state = queue.popleft()
        assert reachable_graph[state] == chopsticks.legal_successors(state)
        for _move, child in reachable_graph[state]:
            assert child in reachable_graph
            if child not in visited:
                visited.add(child)
                queue.append(child)

    assert visited == set(reachable_graph)


@pytest.mark.parametrize("winner_name", chopsticks.PLAYERS)
def test_graph_builder_handles_a_terminal_start(winner_name: str) -> None:
    if winner_name == chopsticks.PLAYER_A:
        terminal = chopsticks.GameState((1, 1), (0, 0), chopsticks.PLAYER_B)
    else:
        terminal = chopsticks.GameState((0, 0), (1, 1), chopsticks.PLAYER_A)

    assert chopsticks.build_game_graph(terminal) == {terminal: ()}


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [(1, 3, 4), (1, 4, 0), (4, 4, 0), (0, 4, 4)],
)
def test_starter_overflow_sum_cutoff(left: int, right: int, expected: int) -> None:
    assert chopsticks.overflow_sum(left, right) == expected


@pytest.mark.parametrize("bad_pair", [(-1, 2), (6, 1), (True, 1), (1.0, 2)])
def test_overflow_sum_rejects_nonhand_values(bad_pair: tuple) -> None:
    with pytest.raises(ValueError):
        chopsticks.overflow_sum(*bad_pair)


def test_starter_next_moves_agree_with_all_ordered_rules_states() -> None:
    """The level tuple interface must expose exactly the core legal moves."""

    for state in ALL_VALID_STATES:
        level = 0 if state.turn == chopsticks.PLAYER_A else 1
        position = (state.a_hands, state.b_hands, level)
        expected = {
            (child.a_hands, child.b_hands, level + 1)
            for _move, child in chopsticks.legal_successors(state)
        }
        actual = chopsticks.next_moves(position)
        assert len(actual) == len(set(actual)), position
        assert set(actual) == expected, position


@pytest.mark.parametrize(
    "bad_position",
    [(), ((1, 1), (1, 1)), ((1, 1), (1, 1), -1), ((1, 1), (1, 1), True), ((5, 0), (1, 1), 0)],
)
def test_next_moves_rejects_malformed_starter_positions(bad_position: tuple) -> None:
    with pytest.raises(ValueError):
        chopsticks.next_moves(bad_position)  # type: ignore[arg-type]


@pytest.mark.parametrize("bad_depth", [None, True, False, 0, -2, 3, 51, 1.5, "20"])
def test_bottom_up_dp_rejects_invalid_or_abusive_depth(bad_depth: object) -> None:
    with pytest.raises(ValueError, match="depth"):
        chopsticks.best_move_dp(bad_depth)  # type: ignore[arg-type]


@pytest.mark.parametrize("depth", [2, 4, 20])
def test_dp_table_is_complete_and_deterministic(depth: int) -> None:
    table = chopsticks.best_move_dp(depth)
    assert len(table) == 625 * (depth + 1)
    assert table == chopsticks.best_move_dp(depth)
    assert table[((1, 1), (1, 1), depth)] == (0, [])


def test_dp_terminal_outcome_takes_priority_over_horizon_tie() -> None:
    table = chopsticks.best_move_dp(4)
    for level in range(5):
        assert table[((2, 3), (0, 0), level)] == (1, [])
        assert table[((0, 0), (2, 3), level)] == (-1, [])
        assert table[((0, 0), (0, 0), level)] == (0, [])
    assert table[((1, 1), (1, 1), 4)] == (0, [])


def test_every_dp_entry_obeys_bottom_up_max_min_recurrence() -> None:
    """Check all 13,125 entries, including terminal states at each layer."""

    depth = 20
    table = chopsticks.best_move_dp(depth)
    for position, entry in table.items():
        score, best_child = entry
        assert score in {-1, 0, 1}, position
        a_hands, b_hands, level = position
        assert 0 <= level <= depth
        if a_hands == (0, 0) or b_hands == (0, 0) or level == depth:
            assert best_child == [], position
            if a_hands == (0, 0) and b_hands != (0, 0):
                assert score == -1, position
            elif b_hands == (0, 0) and a_hands != (0, 0):
                assert score == 1, position
            else:
                assert score == 0, position
            continue

        children = chopsticks.next_moves(position)
        assert children, position
        values = [table[child][0] for child in children]
        expected = max(values) if level % 2 == 0 else min(values)
        assert score == expected, position
        assert best_child in children, position
        assert table[best_child][0] == score, position


@pytest.mark.parametrize(
    ("position", "depth"),
    [
        (((1, 1), (1, 1), 0), 2),
        (((0, 2), (0, 3), 0), 4),
        (((0, 3), (0, 2), 1), 4),
        (((2, 2), (3, 3), 2), 4),
        (((3, 1), (2, 4), 3), 4),
    ],
)
def test_bottom_up_values_match_independent_recursive_oracle(
    position: tuple, depth: int
) -> None:
    table = chopsticks.best_move_dp(depth)
    assert table[position][0] == reference_horizon_value(position, depth)


def test_repeated_base_position_is_finite_because_level_advances() -> None:
    first = ((2, 2), (3, 3), 0)
    second = ((1, 3), (3, 3), 1)
    third = ((1, 3), (2, 4), 2)
    fourth = ((2, 2), (2, 4), 3)
    fifth = ((2, 2), (3, 3), 4)
    assert second in chopsticks.next_moves(first)
    assert third in chopsticks.next_moves(second)
    assert fourth in chopsticks.next_moves(third)
    assert fifth in chopsticks.next_moves(fourth)
    assert first[:2] == fifth[:2]
    assert first != fifth
    table = chopsticks.best_move_dp(4)
    assert table[fifth] == (0, [])


def test_game_result_awards_a_final_ply_knockout_before_horizon_tie() -> None:
    alive = chopsticks.GameState((1, 1), (1, 1), chopsticks.PLAYER_A)
    a_wins = chopsticks.GameState((0, 2), (0, 0), chopsticks.PLAYER_B)
    b_wins = chopsticks.GameState((0, 0), (0, 2), chopsticks.PLAYER_A)

    assert chopsticks.game_result(alive, level=1, depth=2) is None
    assert chopsticks.game_result(alive, level=2, depth=2) == chopsticks.DRAW
    assert chopsticks.game_result(a_wins, level=2, depth=2) == chopsticks.PLAYER_A
    assert chopsticks.game_result(b_wins, level=2, depth=2) == chopsticks.PLAYER_B


@pytest.mark.parametrize(
    ("state", "level", "expected_score"),
    [
        (chopsticks.GameState((0, 2), (0, 3), "A"), 0, 1),
        (chopsticks.GameState((0, 3), (0, 2), "B"), 1, -1),
    ],
)
def test_computer_uses_dp_table_for_both_players(
    state: chopsticks.GameState,
    level: int,
    expected_score: int,
) -> None:
    table = chopsticks.best_move_dp(2)
    decision = chopsticks.choose_computer_move(state, level=level, depth=2, table=table)

    assert decision.score == expected_score
    assert (decision.move, decision.next_state) in chopsticks.legal_successors(state)
    assert chopsticks.winner(decision.next_state) == state.turn


def test_computer_refuses_terminal_or_horizon_move() -> None:
    table = chopsticks.best_move_dp(2)
    terminal = chopsticks.GameState((1, 1), (0, 0), "B")
    with pytest.raises(ValueError):
        chopsticks.choose_computer_move(terminal, level=1, depth=2, table=table)
    with pytest.raises(ValueError):
        chopsticks.choose_computer_move(
            chopsticks.INITIAL_STATE, level=2, depth=2, table=table
        )


@pytest.mark.parametrize(
    ("responses", "expected"),
    [
        (["1"], "human"),
        (["  HuMaN  "], "human"),
        (["2"], "autonomous"),
        ([" AUTO "], "autonomous"),
    ],
)
def test_mode_prompt_accepts_documented_choices(
    responses: list[str],
    expected: str,
) -> None:
    output: list[str] = []
    assert chopsticks.prompt_mode(scripted_input(responses), output.append) == expected
    assert output[:2] == [
        "1. Human versus computer",
        "2. Autonomous computer demonstration",
    ]


@pytest.mark.parametrize(
    ("response", "expected"),
    [
        ("a", chopsticks.PLAYER_A),
        ("  PLAYER A ", chopsticks.PLAYER_A),
        ("1", chopsticks.PLAYER_A),
        ("B", chopsticks.PLAYER_B),
        ("player 2", chopsticks.PLAYER_B),
        (" 2 ", chopsticks.PLAYER_B),
    ],
)
def test_player_prompt_accepts_case_and_whitespace(
    response: str,
    expected: str,
) -> None:
    assert (
        chopsticks.prompt_human_player(
            scripted_input([response]),
            lambda _line: None,
        )
        == expected
    )


def test_prompts_recover_from_malformed_and_extremely_large_input() -> None:
    output: list[str] = []
    mode = chopsticks.prompt_mode(
        scripted_input(["", "\x00", "3", "human please", "1"]),
        output.append,
    )
    assert mode == "human"
    assert output.count("Please enter one of the listed choices.") == 4

    bad_move_inputs = [
        "",
        "   ",
        "zero",
        "0",
        "-1",
        "1.0",
        "9" * 10_000,
        "1; import os",
        "1",  # The first of four legal opening moves.
    ]
    move_output: list[str] = []
    selected = chopsticks.prompt_human_move(
        chopsticks.INITIAL_STATE,
        scripted_input(bad_move_inputs),
        move_output.append,
    )

    assert selected == chopsticks.legal_successors(chopsticks.INITIAL_STATE)[0]
    assert move_output.count("Enter one of the displayed move numbers.") == 7
    assert move_output.count(
        f"Input is too long; enter at most {chopsticks.MAX_INPUT_LENGTH} characters."
    ) == 1


def test_prompts_reject_nontext_responses_without_crashing() -> None:
    output: list[str] = []
    result = chopsticks.prompt_mode(
        scripted_input([None, ["1"], "1"]),  # type: ignore[list-item]
        output.append,
    )

    assert result == "human"
    assert output.count("Input must be text.") == 2


def test_yes_no_prompt_retries_invalid_and_oversized_answers() -> None:
    output: list[str] = []
    result = chopsticks.prompt_yes_no(
        "Continue? ",
        scripted_input(["maybe", "x" * 101, " YES "]),
        output.append,
    )

    assert result is True
    assert "Please enter y or n." in output
    assert (
        f"Input is too long; enter at most {chopsticks.MAX_INPUT_LENGTH} characters."
        in output
    )


@pytest.mark.parametrize("quit_text", ["q", "Q", " quit ", "EXIT"])
def test_move_prompt_quit_aliases(quit_text: str) -> None:
    assert (
        chopsticks.prompt_human_move(
            chopsticks.INITIAL_STATE,
            scripted_input([quit_text]),
            lambda _line: None,
        )
        is None
    )


def test_move_prompt_rejects_a_finished_game_instead_of_looping() -> None:
    finished = chopsticks.GameState((1, 1), (0, 0), chopsticks.PLAYER_B)
    with pytest.raises(ValueError, match="finished"):
        chopsticks.prompt_human_move(
            finished,
            scripted_input(["q"]),
            lambda _line: None,
        )


def test_code_like_user_input_is_treated_as_data_not_executed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    marker_name = "_chopsticks_unexpected_code_execution"
    monkeypatch.delattr(builtins, marker_name, raising=False)
    payload = f"setattr(__import__('builtins'), {marker_name!r}, True)"
    output: list[str] = []

    result = chopsticks.prompt_human_move(
        chopsticks.INITIAL_STATE,
        scripted_input([payload, "q"]),
        output.append,
    )

    assert result is None
    assert not hasattr(builtins, marker_name)
    assert payload not in "\n".join(output)


def test_human_runner_handles_user_quit_cleanly() -> None:
    output: list[str] = []
    result = chopsticks.run_human_vs_computer(
        chopsticks.PLAYER_A,
        moves=1,
        input_function=scripted_input(["q"]),
        output_function=output.append,
    )

    assert result == chopsticks.QUIT
    assert output[-1] == "Game ended by the user."


@pytest.mark.parametrize("bad_moves", [None, True, False, 0, -1, 26, 1.5, "10"])
def test_game_runners_reject_invalid_or_abusive_round_counts(
    bad_moves: object,
) -> None:
    with pytest.raises(ValueError):
        chopsticks.run_human_vs_computer(
            chopsticks.PLAYER_A,
            moves=bad_moves,  # type: ignore[arg-type]
            input_function=scripted_input(["q"]),
            output_function=lambda _line: None,
        )

    with pytest.raises(ValueError):
        chopsticks.run_autonomous(
            moves=bad_moves,  # type: ignore[arg-type]
            output_function=lambda _line: None,
        )


@pytest.mark.parametrize("bad_pause", [None, 0, 1, "yes", [], object()])
def test_autonomous_runner_requires_an_actual_boolean_pause(
    bad_pause: object,
) -> None:
    with pytest.raises(ValueError, match="pause"):
        chopsticks.run_autonomous(
            moves=1,
            pause=bad_pause,  # type: ignore[arg-type]
            output_function=lambda _line: None,
        )


def test_paused_autonomous_runner_prompts_once_per_unfinished_turn() -> None:
    prompts: list[str] = []

    def record_input(prompt: str) -> str:
        prompts.append(prompt)
        return ""

    output: list[str] = []
    result = chopsticks.run_autonomous(
        moves=1,
        pause=True,
        input_function=record_input,
        output_function=output.append,
    )

    assert result == chopsticks.DRAW
    assert prompts == ["Press Enter for the next move..."]
    assert "tie" in output[-1].lower() or "draw" in output[-1].lower()


def test_paused_autonomous_runner_does_not_prompt_after_final_allowed_turn() -> None:
    prompts: list[str] = []

    def record_input(prompt: str) -> str:
        prompts.append(prompt)
        if len(prompts) > 1:
            raise AssertionError("input was requested after the final allowed turn")
        return ""

    result = chopsticks.run_autonomous(
        moves=1,
        pause=True,
        input_function=record_input,
        output_function=lambda _line: None,
    )

    assert result == chopsticks.DRAW
    assert prompts == ["Press Enter for the next move..."]


@pytest.mark.parametrize(
    ("index", "expected_player"),
    [(0, chopsticks.PLAYER_A), (1, chopsticks.PLAYER_B)],
)
def test_starter_compatible_game_wrapper_maps_index_to_human_side(
    index: int, expected_player: str
) -> None:
    output: list[str] = []
    assert chopsticks.chopsticks_game(
        moves=1,
        index=index,
        input_function=scripted_input(["q"]),
        output_function=output.append,
    ) == chopsticks.QUIT
    assert "Game ended by the user." in output
    assert any(f"You are Player {expected_player}." in line for line in output)


@pytest.mark.parametrize("bad_index", [True, -1, 2, 0.0, "0"])
def test_game_wrapper_rejects_invalid_player_index(bad_index: object) -> None:
    with pytest.raises(ValueError, match="index"):
        chopsticks.chopsticks_game(
            moves=1,
            index=bad_index,  # type: ignore[arg-type]
            input_function=scripted_input(["q"]),
            output_function=lambda _line: None,
        )


def test_starter_display_reports_labeled_hand_pairs() -> None:
    output: list[str] = []
    chopsticks.display(((1, 3), (0, 4), 2), output_function=output.append)
    assert output == ["***********************", "A: (1, 3)", "B: (0, 4)"]


def test_autonomous_fixed_horizon_is_a_tie_when_both_survive() -> None:
    output: list[str] = []
    result = chopsticks.run_autonomous(
        moves=1,
        pause=False,
        input_function=lambda _prompt: pytest.fail("unpaused mode requested input"),
        output_function=output.append,
    )
    assert result == chopsticks.DRAW
    assert any("Turn 2" in line for line in output)


def test_main_dispatches_human_mode(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    calls: list[str] = []
    monkeypatch.setattr(chopsticks, "prompt_mode", lambda: "human")
    monkeypatch.setattr(chopsticks, "prompt_human_player", lambda: chopsticks.PLAYER_B)
    monkeypatch.setattr(
        chopsticks,
        "run_human_vs_computer",
        lambda player, **_kwargs: calls.append(player) or chopsticks.DRAW,
    )

    chopsticks.main()

    assert calls == [chopsticks.PLAYER_B]
    assert "Assignment 6: Chopsticks" in capsys.readouterr().out


@pytest.mark.parametrize(
    ("answer", "expected_pause"),
    [("yes", True), (" Y ", True), ("no", False), ("", False)],
)
def test_main_dispatches_autonomous_pause_choice(
    answer: str,
    expected_pause: bool,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    calls: list[bool] = []
    monkeypatch.setattr(chopsticks, "prompt_mode", lambda: "autonomous")
    monkeypatch.setattr(builtins, "input", lambda _prompt: answer)
    monkeypatch.setattr(
        chopsticks,
        "run_autonomous",
        lambda *, pause: calls.append(pause) or chopsticks.DRAW,
    )

    chopsticks.main()

    assert calls == [expected_pause]
    assert "Assignment 6: Chopsticks" in capsys.readouterr().out


@pytest.mark.parametrize("interruption", [EOFError, KeyboardInterrupt])
def test_main_exits_cleanly_when_terminal_input_ends(
    interruption: type[BaseException],
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    def interrupt() -> str:
        raise interruption()

    monkeypatch.setattr(chopsticks, "prompt_mode", interrupt)
    chopsticks.main()

    assert capsys.readouterr().out.rstrip().endswith("Game ended.")


def test_source_avoids_dynamic_execution_shells_network_and_unsafe_loading() -> None:
    """Enforce the offline CLI architecture as a defense-in-depth guard."""

    source_path = Path(chopsticks.__file__).resolve()
    tree = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
    banned_import_roots = {
        "ctypes",
        "http",
        "marshal",
        "pickle",
        "requests",
        "shelve",
        "socket",
        "subprocess",
        "urllib",
    }
    banned_direct_calls = {"compile", "eval", "exec", "open", "__import__"}
    banned_attribute_calls = {
        "check_call",
        "check_output",
        "Popen",
        "popen",
        "spawnl",
        "spawnle",
        "spawnlp",
        "spawnlpe",
        "spawnv",
        "spawnve",
        "spawnvp",
        "spawnvpe",
        "system",
    }

    violations: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.split(".", 1)[0] in banned_import_roots:
                    violations.append(f"banned import {alias.name!r} on line {node.lineno}")
        elif isinstance(node, ast.ImportFrom) and node.module:
            if node.module.split(".", 1)[0] in banned_import_roots:
                violations.append(f"banned import {node.module!r} on line {node.lineno}")
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in banned_direct_calls:
                violations.append(f"banned call {node.func.id!r} on line {node.lineno}")
            if isinstance(node.func, ast.Attribute) and node.func.attr in banned_attribute_calls:
                violations.append(f"banned call {node.func.attr!r} on line {node.lineno}")
            for keyword in node.keywords:
                if (
                    keyword.arg == "shell"
                    and isinstance(keyword.value, ast.Constant)
                    and keyword.value.value is True
                ):
                    violations.append(f"shell=True on line {node.lineno}")

    assert violations == []


def test_source_has_no_bare_exception_handlers() -> None:
    source_path = Path(chopsticks.__file__).resolve()
    tree = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
    violations: list[str] = []

    for handler in (node for node in ast.walk(tree) if isinstance(node, ast.ExceptHandler)):
        if handler.type is None:
            violations.append(f"bare except on line {handler.lineno}")
            continue
    assert violations == []


def test_source_keeps_interactive_startup_behind_main_guard() -> None:
    source_path = Path(chopsticks.__file__).resolve()
    tree = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))

    guarded_main_calls = []
    for node in tree.body:
        if not isinstance(node, ast.If) or not isinstance(node.test, ast.Compare):
            continue
        if (
            isinstance(node.test.left, ast.Name)
            and node.test.left.id == "__name__"
            and len(node.test.ops) == 1
            and isinstance(node.test.ops[0], ast.Eq)
            and len(node.test.comparators) == 1
            and isinstance(node.test.comparators[0], ast.Constant)
            and node.test.comparators[0].value == "__main__"
        ):
            guarded_main_calls.extend(
                statement
                for statement in node.body
                if isinstance(statement, ast.Expr)
                and isinstance(statement.value, ast.Call)
                and isinstance(statement.value.func, ast.Name)
                and statement.value.func.id == "main"
            )

    assert len(guarded_main_calls) == 1
