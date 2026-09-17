"""Command-line Chopsticks game with a graph-based minimax opponent.

Player A (Player 1) is the maximizing player. Player B (Player 2) is
the minimizing player. Every score is measured from Player A's perspective.

The rules implemented here use the common cutoff variation:

* Each player starts with ``1 | 1``.
* An attack adds the attacking live hand to an opponent's live hand.
* A target that reaches 5 or more becomes 0; values do not wrap around.
* A 0 hand is inactive for attacks, but it may be revived by a split.
* A split preserves the player's total, changes the unordered hand pair, and
  leaves both resulting hands live (values 1 through 4).
* A player loses when both hands are 0.
* The same complete state occurring three times is a draw.

The game logic is intentionally independent from terminal input/output so it
can be imported and tested without starting an interactive game.
"""

from __future__ import annotations

from collections import Counter, deque
from dataclasses import dataclass
from functools import lru_cache
from typing import Callable, Iterable, Mapping


PLAYER_A = "A"
PLAYER_B = "B"
PLAYERS = (PLAYER_A, PLAYER_B)

KNOCKOUT_TOTAL = 5
MAX_LIVE_VALUE = KNOCKOUT_TOTAL - 1
DEFAULT_SEARCH_DEPTH = 50
DEFAULT_MAX_TURNS = 1_000
REPETITIONS_FOR_DRAW = 3
WIN_SCORE = 10_000
FORCED_RESULT_THRESHOLD = WIN_SCORE // 2
SEARCH_INFINITY = WIN_SCORE + DEFAULT_SEARCH_DEPTH + 1

DRAW = "draw"
TURN_LIMIT = "turn_limit"
QUIT = "quit"

Hands = tuple[int, int]
InputFunction = Callable[[str], str]
OutputFunction = Callable[[str], None]


def canonical_hands(values: Iterable[int]) -> Hands:
    """Validate two hand values and return them in ascending order."""

    hands = tuple(values)
    if len(hands) != 2:
        raise ValueError("A player must have exactly two hand values.")

    for value in hands:
        if type(value) is not int or not 0 <= value <= MAX_LIVE_VALUE:
            raise ValueError(
                f"Hand values must be whole numbers from 0 through {MAX_LIVE_VALUE}."
            )

    return tuple(sorted(hands))  # type: ignore[return-value]


def other_player(player: str) -> str:
    """Return the opponent of ``player``."""

    if player == PLAYER_A:
        return PLAYER_B
    if player == PLAYER_B:
        return PLAYER_A
    raise ValueError("The player must be 'A' or 'B'.")


@dataclass(frozen=True, slots=True)
class GameState:
    """An immutable, canonical Chopsticks position."""

    a_hands: Hands
    b_hands: Hands
    turn: str = PLAYER_A

    def __post_init__(self) -> None:
        object.__setattr__(self, "a_hands", canonical_hands(self.a_hands))
        object.__setattr__(self, "b_hands", canonical_hands(self.b_hands))

        if self.turn not in PLAYERS:
            raise ValueError("The turn must belong to Player A or Player B.")
        if self.a_hands == (0, 0) and self.b_hands == (0, 0):
            raise ValueError("Both players cannot be knocked out in a legal state.")

    @property
    def current_hands(self) -> Hands:
        """Return the hands belonging to the player whose turn it is."""

        return self.a_hands if self.turn == PLAYER_A else self.b_hands

    @property
    def opponent_hands(self) -> Hands:
        """Return the hands belonging to the waiting player."""

        return self.b_hands if self.turn == PLAYER_A else self.a_hands


INITIAL_STATE = GameState((1, 1), (1, 1), PLAYER_A)


@dataclass(frozen=True, slots=True)
class Move:
    """One attack or split; the acting player is implied by the state."""

    kind: str
    source: int | None = None
    target: int | None = None
    new_hands: Hands | None = None

    def __post_init__(self) -> None:
        if self.kind == "attack":
            if (
                type(self.source) is not int
                or type(self.target) is not int
                or not 1 <= self.source <= MAX_LIVE_VALUE
                or not 1 <= self.target <= MAX_LIVE_VALUE
                or self.new_hands is not None
            ):
                raise ValueError("An attack needs live source and target values.")
            return

        if self.kind == "split":
            if self.source is not None or self.target is not None:
                raise ValueError("A split does not have attack values.")
            if self.new_hands is None:
                raise ValueError("A split needs its resulting hand values.")

            normalized = canonical_hands(self.new_hands)
            if normalized[0] == 0:
                raise ValueError("Both hands must be live after a split.")
            object.__setattr__(self, "new_hands", normalized)
            return

        raise ValueError("A move kind must be 'attack' or 'split'.")

    @classmethod
    def attack(cls, source: int, target: int) -> Move:
        """Construct an attack move."""

        return cls("attack", source=source, target=target)

    @classmethod
    def split(cls, new_hands: Hands) -> Move:
        """Construct a split move."""

        return cls("split", new_hands=new_hands)


@dataclass(frozen=True, slots=True)
class SearchDecision:
    """The move selected by minimax and its predicted result."""

    move: Move
    next_state: GameState
    score: int


Graph = dict[GameState, tuple[tuple[Move, GameState], ...]]


def winner(state: GameState) -> str | None:
    """Return the winning player, or ``None`` while the game continues."""

    if state.a_hands == (0, 0):
        return PLAYER_B
    if state.b_hands == (0, 0):
        return PLAYER_A
    return None


def is_threefold_repetition(
    state: GameState,
    occurrences: Mapping[GameState, int],
) -> bool:
    """Return whether ``state`` has occurred enough times to be a draw."""

    return occurrences.get(state, 0) >= REPETITIONS_FOR_DRAW


def game_result(
    state: GameState,
    occurrences: Mapping[GameState, int] | None = None,
) -> str | None:
    """Return ``A``, ``B``, ``draw``, or ``None`` for an unfinished game.

    A win takes precedence over repetition because a terminal attack ends the
    game immediately.
    """

    victor = winner(state)
    if victor is not None:
        return victor
    if occurrences is not None and is_threefold_repetition(state, occurrences):
        return DRAW
    return None


def _replace_one(hands: Hands, old_value: int, new_value: int) -> Hands:
    """Replace one occurrence in ``hands`` and return a canonical pair."""

    updated = list(hands)
    try:
        index = updated.index(old_value)
    except ValueError as error:
        raise ValueError("The selected hand value is not present.") from error
    updated[index] = new_value
    return canonical_hands(updated)


def _next_state_after_attack(
    state: GameState,
    source: int,
    target: int,
) -> GameState:
    total = source + target
    new_target = 0 if total >= KNOCKOUT_TOTAL else total
    updated_opponent = _replace_one(state.opponent_hands, target, new_target)

    if state.turn == PLAYER_A:
        return GameState(state.a_hands, updated_opponent, PLAYER_B)
    return GameState(updated_opponent, state.b_hands, PLAYER_A)


def _next_state_after_split(state: GameState, new_hands: Hands) -> GameState:
    if state.turn == PLAYER_A:
        return GameState(new_hands, state.b_hands, PLAYER_B)
    return GameState(state.a_hands, new_hands, PLAYER_A)


def legal_successors(state: GameState) -> tuple[tuple[Move, GameState], ...]:
    """Return every unique legal ``(move, next_state)`` pair.

    Physical choices that reach the same canonical state are represented by
    the first deterministic move that reaches that state.
    """

    if winner(state) is not None:
        return ()

    successors: list[tuple[Move, GameState]] = []
    seen_states: set[GameState] = set()

    live_sources = sorted({value for value in state.current_hands if value > 0})
    live_targets = sorted({value for value in state.opponent_hands if value > 0})

    for source in live_sources:
        for target in live_targets:
            move = Move.attack(source, target)
            child = _next_state_after_attack(state, source, target)
            if child not in seen_states:
                successors.append((move, child))
                seen_states.add(child)

    total = sum(state.current_hands)
    for low_value in range(1, MAX_LIVE_VALUE + 1):
        high_value = total - low_value
        if not low_value <= high_value <= MAX_LIVE_VALUE:
            continue

        new_hands = (low_value, high_value)
        if new_hands == state.current_hands:
            continue

        move = Move.split(new_hands)
        child = _next_state_after_split(state, new_hands)
        if child not in seen_states:
            successors.append((move, child))
            seen_states.add(child)

    return tuple(successors)


def legal_moves(state: GameState) -> tuple[Move, ...]:
    """Return every unique legal move from ``state``."""

    return tuple(move for move, _child in legal_successors(state))


def apply_move(state: GameState, move: Move) -> GameState:
    """Apply a legal move and return a new state.

    ``ValueError`` is raised rather than silently accepting a move that is not
    present in the state's legal move list.
    """

    for legal_move, child in legal_successors(state):
        if move == legal_move:
            return child
    raise ValueError("That move is not legal from the current state.")


def build_game_graph(start: GameState = INITIAL_STATE) -> Graph:
    """Build the complete base-state graph reachable from ``start`` with BFS."""

    queue = deque([start])
    seen = {start}
    graph: Graph = {}

    while queue:
        state = queue.popleft()
        successors = legal_successors(state)
        graph[state] = successors

        for _move, child in successors:
            if child not in seen:
                seen.add(child)
                queue.append(child)

    return graph


# A name matching the terminology used in the planning document.
build_reachable_graph = build_game_graph


def heuristic_score(state: GameState) -> int:
    """Estimate a nonterminal position from Player A's perspective."""

    a_live_hands = sum(value > 0 for value in state.a_hands)
    b_live_hands = sum(value > 0 for value in state.b_hands)
    return (
        10 * (a_live_hands - b_live_hands)
        + sum(state.a_hands)
        - sum(state.b_hands)
    )


class MinimaxAI:
    """History-aware alpha-beta minimax over the reachable game graph.

    ``value`` is a fast, history-blind minimax table used only to order moves.
    The final decision comes from ``_search``, which carries occurrence counts
    through every simulated move and therefore evaluates threefold repetition
    correctly. Using the cached table only for ordering is safe: ordering can
    improve pruning efficiency, but it cannot change alpha-beta's answer.
    """

    def __init__(
        self,
        depth_limit: int = DEFAULT_SEARCH_DEPTH,
        graph: Graph | None = None,
    ) -> None:
        if (
            type(depth_limit) is not int
            or not 1 <= depth_limit <= DEFAULT_SEARCH_DEPTH
        ):
            raise ValueError(
                f"The minimax depth must be from 1 through {DEFAULT_SEARCH_DEPTH}."
            )

        self.depth_limit = depth_limit
        self.graph = graph if graph is not None else build_game_graph()
        self.last_search_nodes = 0
        self._cached_value = lru_cache(maxsize=None)(self._value_uncached)

    def _successors(
        self,
        state: GameState,
    ) -> tuple[tuple[Move, GameState], ...]:
        if state in self.graph:
            return self.graph[state]
        return legal_successors(state)

    @staticmethod
    def _terminal_score(victor: str, depth: int) -> int:
        """Score a terminal state while preferring faster forced wins."""

        if victor == PLAYER_A:
            return WIN_SCORE + depth
        return -WIN_SCORE - depth

    def value(self, state: GameState, depth: int) -> int:
        """Return a history-blind score used solely for move ordering."""

        return self._cached_value(state, depth)

    def _value_uncached(self, state: GameState, depth: int) -> int:
        """Calculate one entry for the per-instance move-ordering cache."""

        victor = winner(state)
        if victor is not None:
            return self._terminal_score(victor, depth)
        if depth <= 0:
            return heuristic_score(state)

        child_scores = [
            self.value(child, depth - 1)
            for _move, child in self._successors(state)
        ]

        if not child_scores:
            raise RuntimeError("A nonterminal state unexpectedly has no legal moves.")
        if state.turn == PLAYER_A:
            return max(child_scores)
        return min(child_scores)

    def _ordered_successors(
        self,
        state: GameState,
        child_depth: int,
    ) -> tuple[tuple[Move, GameState], ...]:
        """Order moves using the cached table while preserving stable ties."""

        successors = self._successors(state)
        return tuple(
            sorted(
                successors,
                key=lambda item: self.value(item[1], child_depth),
                reverse=state.turn == PLAYER_A,
            )
        )

    def _search(
        self,
        state: GameState,
        depth: int,
        alpha: int,
        beta: int,
        occurrences: Counter[GameState],
    ) -> int:
        """Return the exact repetition-aware value for this search horizon."""

        self.last_search_nodes += 1

        victor = winner(state)
        if victor is not None:
            return self._terminal_score(victor, depth)
        if occurrences[state] >= REPETITIONS_FOR_DRAW:
            return 0
        if depth <= 0:
            return heuristic_score(state)

        successors = self._ordered_successors(state, depth - 1)
        if not successors:
            raise RuntimeError("A nonterminal state unexpectedly has no legal moves.")

        if state.turn == PLAYER_A:
            best_value = -SEARCH_INFINITY
            for _move, child in successors:
                occurrences[child] += 1
                try:
                    child_value = self._search(
                        child,
                        depth - 1,
                        alpha,
                        beta,
                        occurrences,
                    )
                finally:
                    occurrences[child] -= 1
                    if occurrences[child] == 0:
                        del occurrences[child]

                best_value = max(best_value, child_value)
                alpha = max(alpha, best_value)
                if alpha >= beta:
                    break
            return best_value

        best_value = SEARCH_INFINITY
        for _move, child in successors:
            occurrences[child] += 1
            try:
                child_value = self._search(
                    child,
                    depth - 1,
                    alpha,
                    beta,
                    occurrences,
                )
            finally:
                occurrences[child] -= 1
                if occurrences[child] == 0:
                    del occurrences[child]

            best_value = min(best_value, child_value)
            beta = min(beta, best_value)
            if alpha >= beta:
                break
        return best_value

    def choose_move(
        self,
        state: GameState,
        occurrences: Mapping[GameState, int] | None = None,
        depth_limit: int | None = None,
    ) -> SearchDecision:
        """Choose the deterministic best move for the player whose turn it is."""

        if winner(state) is not None:
            raise ValueError("A move cannot be selected from a finished game.")

        depth = self.depth_limit if depth_limit is None else depth_limit
        if type(depth) is not int or not 1 <= depth <= DEFAULT_SEARCH_DEPTH:
            raise ValueError(
                f"The minimax depth must be from 1 through {DEFAULT_SEARCH_DEPTH}."
            )

        history: Counter[GameState] = Counter(occurrences or {})
        if history[state] == 0:
            history[state] = 1
        if history[state] >= REPETITIONS_FOR_DRAW:
            raise ValueError("A move cannot be selected after a repetition draw.")

        successors = self._ordered_successors(state, depth - 1)
        if not successors:
            raise RuntimeError("A nonterminal state unexpectedly has no legal moves.")

        self.last_search_nodes = 1
        alpha = -SEARCH_INFINITY
        beta = SEARCH_INFINITY
        best: SearchDecision | None = None

        for move, child in successors:
            history[child] += 1
            try:
                score = self._search(
                    child,
                    depth - 1,
                    alpha,
                    beta,
                    history,
                )
            finally:
                history[child] -= 1
                if history[child] == 0:
                    del history[child]

            candidate = SearchDecision(move, child, score)
            if best is None:
                best = candidate
            elif state.turn == PLAYER_A and score > best.score:
                best = candidate
            elif state.turn == PLAYER_B and score < best.score:
                best = candidate

            if state.turn == PLAYER_A:
                alpha = max(alpha, score)
            else:
                beta = min(beta, score)

        assert best is not None
        return best

    def cache_info(self):
        """Expose minimax cache statistics for diagnostics and tests."""

        return self._cached_value.cache_info()


def choose_computer_move(
    state: GameState,
    depth_limit: int = DEFAULT_SEARCH_DEPTH,
    occurrences: Mapping[GameState, int] | None = None,
) -> SearchDecision:
    """Convenience wrapper that builds an AI and chooses one move."""

    return MinimaxAI(depth_limit=depth_limit).choose_move(state, occurrences)


def format_hands(hands: Hands) -> str:
    """Return a human-readable hand pair."""

    return f"{hands[0]} | {hands[1]}"


def format_state(state: GameState) -> str:
    """Return a multiline display of a game state."""

    return "\n".join(
        (
            f"Player A (MAX): {format_hands(state.a_hands)}",
            f"Player B (MIN): {format_hands(state.b_hands)}",
            f"Turn: Player {state.turn}",
        )
    )


def describe_move(state: GameState, move: Move) -> str:
    """Return a clear explanation of ``move`` from ``state``."""

    if move.kind == "attack":
        assert move.source is not None and move.target is not None
        total = move.source + move.target
        result = 0 if total >= KNOCKOUT_TOTAL else total
        knockout = " (knocked out)" if result == 0 else ""
        return (
            f"Player {state.turn} attacks with {move.source} into {move.target}: "
            f"{move.target} + {move.source} = {total}, target becomes "
            f"{result}{knockout}."
        )

    assert move.new_hands is not None
    return (
        f"Player {state.turn} splits {format_hands(state.current_hands)} into "
        f"{format_hands(move.new_hands)}."
    )


def describe_score(score: int) -> str:
    """Explain a minimax score briefly."""

    if score > FORCED_RESULT_THRESHOLD:
        return f"{score:+d}, a predicted forced win for Player A"
    if score < -FORCED_RESULT_THRESHOLD:
        return f"{score:+d}, a predicted forced win for Player B"
    if score > 0:
        return f"{score:+d}, position estimated in Player A's favor"
    if score < 0:
        return f"{score:+d}, position estimated in Player B's favor"
    return "0, an even position or draw"


def _prompt_menu_choice(
    prompt: str,
    choices: Mapping[str, str],
    input_function: InputFunction,
    output_function: OutputFunction,
) -> str:
    while True:
        response = input_function(prompt).strip().lower()
        if response in choices:
            return choices[response]
        output_function("Please enter one of the listed choices.")


def prompt_mode(
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> str:
    """Ask whether to run human play or an autonomous demonstration."""

    output_function("1. Human versus computer")
    output_function("2. Autonomous computer demonstration")
    return _prompt_menu_choice(
        "Choose a mode (1 or 2): ",
        {"1": "human", "human": "human", "2": "autonomous", "auto": "autonomous"},
        input_function,
        output_function,
    )


def prompt_human_player(
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> str:
    """Ask whether the user will control Player A or Player B."""

    return _prompt_menu_choice(
        "Would you like to be Player A/1 or Player B/2? ",
        {
            "a": PLAYER_A,
            "1": PLAYER_A,
            "player a": PLAYER_A,
            "player 1": PLAYER_A,
            "b": PLAYER_B,
            "2": PLAYER_B,
            "player b": PLAYER_B,
            "player 2": PLAYER_B,
        },
        input_function,
        output_function,
    )


def prompt_human_move(
    state: GameState,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> tuple[Move, GameState] | None:
    """List legal moves and return the selected successor, or ``None`` to quit."""

    successors = legal_successors(state)
    output_function("Legal moves:")
    for number, (move, _child) in enumerate(successors, start=1):
        output_function(f"  {number}. {describe_move(state, move)}")

    while True:
        response = input_function("Select a move number (or q to quit): ").strip().lower()
        if response in {"q", "quit", "exit"}:
            return None

        try:
            choice = int(response)
        except ValueError:
            output_function("Enter one of the displayed move numbers.")
            continue

        if 1 <= choice <= len(successors):
            return successors[choice - 1]
        output_function("Enter one of the displayed move numbers.")


def _announce_result(result: str, output_function: OutputFunction) -> None:
    if result in PLAYERS:
        output_function(f"Player {result} wins!")
    elif result == DRAW:
        output_function("Draw: the same complete position occurred three times.")
    elif result == TURN_LIMIT:
        output_function("Draw: the game reached its safety turn limit.")
    elif result == QUIT:
        output_function("Game ended by the user.")


def run_human_vs_computer(
    human_player: str,
    depth_limit: int = DEFAULT_SEARCH_DEPTH,
    max_turns: int = DEFAULT_MAX_TURNS,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> str:
    """Run one human-versus-computer game and return its result."""

    if human_player not in PLAYERS:
        raise ValueError("The human player must be A or B.")

    graph = build_game_graph()
    ai = MinimaxAI(depth_limit=depth_limit, graph=graph)
    state = INITIAL_STATE
    occurrences: Counter[GameState] = Counter({state: 1})

    output_function("")
    output_function(
        f"You are Player {human_player}. Player A moves first. "
        f"The AI searches {depth_limit} plies."
    )

    for turn_number in range(1, max_turns + 1):
        output_function("")
        output_function(f"Turn {turn_number}")
        output_function(format_state(state))

        if state.turn == human_player:
            selection = prompt_human_move(state, input_function, output_function)
            if selection is None:
                _announce_result(QUIT, output_function)
                return QUIT
            move, next_state = selection
            output_function(describe_move(state, move))
        else:
            decision = ai.choose_move(state, occurrences)
            move, next_state = decision.move, decision.next_state
            output_function(describe_move(state, move))
            output_function(f"AI evaluation: {describe_score(decision.score)}.")

        state = next_state
        occurrences[state] += 1
        result = game_result(state, occurrences)
        if result is not None:
            output_function(format_state(state))
            _announce_result(result, output_function)
            return result

    _announce_result(TURN_LIMIT, output_function)
    return TURN_LIMIT


def run_autonomous(
    depth_limit: int = DEFAULT_SEARCH_DEPTH,
    max_turns: int = DEFAULT_MAX_TURNS,
    pause: bool = False,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> str:
    """Run an explained computer-versus-computer demonstration."""

    graph = build_game_graph()
    ai = MinimaxAI(depth_limit=depth_limit, graph=graph)
    state = INITIAL_STATE
    occurrences: Counter[GameState] = Counter({state: 1})
    edge_count = sum(len(edges) for edges in graph.values())

    output_function("")
    output_function("Autonomous demonstration")
    output_function(
        f"Reachable graph: {len(graph)} states and {edge_count} legal transitions."
    )
    output_function(f"Both players search up to {depth_limit} plies.")

    for turn_number in range(1, max_turns + 1):
        output_function("")
        output_function(f"Turn {turn_number}")
        output_function(format_state(state))

        decision = ai.choose_move(state, occurrences)
        output_function(describe_move(state, decision.move))
        output_function(f"Minimax evaluation: {describe_score(decision.score)}.")

        state = decision.next_state
        occurrences[state] += 1
        result = game_result(state, occurrences)
        if result is not None:
            output_function(format_state(state))
            _announce_result(result, output_function)
            return result

        if pause:
            input_function("Press Enter for the next move...")

    _announce_result(TURN_LIMIT, output_function)
    return TURN_LIMIT


def main() -> None:
    """Start the interactive command-line program."""

    print("Assignment 6: Chopsticks")
    print("A dead hand is inactive, but a legal split can revive it.")
    print("A player loses only when both hands are dead (0 | 0).")
    print()

    try:
        mode = prompt_mode()
        if mode == "human":
            human_player = prompt_human_player()
            run_human_vs_computer(human_player)
            return

        pause_response = input("Pause after every autonomous move? (y/N): ")
        pause = pause_response.strip().lower() in {"y", "yes"}
        run_autonomous(pause=pause)
    except (EOFError, KeyboardInterrupt):
        print("\nGame ended.")


if __name__ == "__main__":
    main()
