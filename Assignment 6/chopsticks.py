"""Command-line Chopsticks game with starter-compatible bottom-up minimax.

Player A (Player 1) is the maximizing player. Player B (Player 2) is
the minimizing player. Every score is measured from Player A's perspective.

The rules implemented here use the common cutoff variation:

* Each player starts with ``1 | 1``.
* An attack adds the attacking live hand to an opponent's live hand.
* A target that reaches 5 or more becomes 0; values do not wrap around.
* A 0 hand is inactive for attacks, but it may be revived by a split.
* A split transfers fingers between labeled left/right hands, preserves the
  total, and may leave one hand at 0; a pure left/right swap is not a move.
* A player loses when both hands are 0.
* An unfinished game is a tie after the fixed 20-ply default horizon.

The game logic is intentionally independent from terminal input/output so it
can be imported and tested without starting an interactive game.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from itertools import islice
from typing import Callable, Iterable, Mapping


PLAYER_A = "A"
PLAYER_B = "B"
PLAYERS = (PLAYER_A, PLAYER_B)

KNOCKOUT_TOTAL = 5
MAX_LIVE_VALUE = KNOCKOUT_TOTAL - 1
MAX_SUCCESSORS_PER_STATE = 7
DEFAULT_MOVES = 10
DEFAULT_GAME_PLIES = 2 * DEFAULT_MOVES
MAX_GAME_PLIES = 50
MAX_INPUT_LENGTH = 100

DRAW = "draw"
QUIT = "quit"

Hands = tuple[int, int]
TupleState = tuple[Hands, Hands, int]
DPEntry = tuple[int, TupleState | list[object]]
InputFunction = Callable[[str], str]
OutputFunction = Callable[[str], None]


def validate_hands(values: Iterable[int]) -> Hands:
    """Validate and preserve a player's left and right hand values."""

    try:
        # Read one item beyond the required pair so an accidental infinite
        # iterable cannot make validation run forever.
        hands = tuple(islice(iter(values), 3))
    except TypeError as error:
        raise ValueError("Hand values must be an iterable with exactly two values.") from error

    if len(hands) != 2:
        raise ValueError("A player must have exactly two hand values.")

    for value in hands:
        if type(value) is not int or not 0 <= value <= MAX_LIVE_VALUE:
            raise ValueError(
                f"Hand values must be whole numbers from 0 through {MAX_LIVE_VALUE}."
            )

    return hands  # type: ignore[return-value]


# Keep the earlier public name as an alias for callers of the first version.
canonical_hands = validate_hands


def other_player(player: str) -> str:
    """Return the opponent of ``player``."""

    if player == PLAYER_A:
        return PLAYER_B
    if player == PLAYER_B:
        return PLAYER_A
    raise ValueError("The player must be 'A' or 'B'.")


@dataclass(frozen=True, slots=True)
class GameState:
    """An immutable Chopsticks position with distinct left and right hands."""

    a_hands: Hands
    b_hands: Hands
    turn: str = PLAYER_A

    def __post_init__(self) -> None:
        object.__setattr__(self, "a_hands", validate_hands(self.a_hands))
        object.__setattr__(self, "b_hands", validate_hands(self.b_hands))

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
    """One attack or split; attack indices are 0=left and 1=right."""

    kind: str
    source: int | None = None
    target: int | None = None
    new_hands: Hands | None = None

    def __post_init__(self) -> None:
        if self.kind == "attack":
            if (
                type(self.source) is not int
                or type(self.target) is not int
                or self.source not in (0, 1)
                or self.target not in (0, 1)
                or self.new_hands is not None
            ):
                raise ValueError("An attack needs left/right source and target indices.")
            return

        if self.kind == "split":
            if self.source is not None or self.target is not None:
                raise ValueError("A split does not have attack values.")
            if self.new_hands is None:
                raise ValueError("A split needs its resulting hand values.")

            validated = validate_hands(self.new_hands)
            if validated == (0, 0):
                raise ValueError("A split cannot leave both hands knocked out.")
            object.__setattr__(self, "new_hands", validated)
            return

        raise ValueError("A move kind must be 'attack' or 'split'.")

    @classmethod
    def attack(cls, source: int, target: int) -> Move:
        """Construct an attack using left/right hand indices 0 or 1."""

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


def game_result(
    state: GameState,
    level: int,
    depth: int = DEFAULT_GAME_PLIES,
) -> str | None:
    """Return a winner, a horizon tie, or ``None`` while play continues.

    A knockout on the final allowed move takes priority over a horizon tie.
    """

    _validate_level_and_depth(level, depth)
    victor = winner(state)
    if victor is not None:
        return victor
    if level >= depth:
        return DRAW
    return None


def _replace_one(hands: Hands, index: int, new_value: int) -> Hands:
    """Replace the selected left/right hand without changing hand identity."""

    if type(index) is not int or index not in (0, 1):
        raise ValueError("A hand index must be 0 (left) or 1 (right).")
    updated = list(hands)
    updated[index] = new_value
    return validate_hands(updated)


def _next_state_after_attack(
    state: GameState,
    source: int,
    target: int,
) -> GameState:
    new_target = overflow_sum(
        state.current_hands[source],
        state.opponent_hands[target],
    )
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

    Left and right are distinct, as in the supplied starter program. Exact
    duplicate resulting states are represented by their first move.
    """

    if winner(state) is not None:
        return ()

    successors: list[tuple[Move, GameState]] = []
    seen_states: set[GameState] = set()

    for source in (0, 1):
        if state.current_hands[source] == 0:
            continue
        for target in (0, 1):
            if state.opponent_hands[target] == 0:
                continue
            move = Move.attack(source, target)
            child = _next_state_after_attack(state, source, target)
            if child not in seen_states:
                successors.append((move, child))
                seen_states.add(child)

    for donor in (0, 1):
        receiver = 1 - donor
        for amount in range(1, state.current_hands[donor] + 1):
            if state.current_hands[receiver] + amount > MAX_LIVE_VALUE:
                continue

            updated = list(state.current_hands)
            updated[donor] -= amount
            updated[receiver] += amount
            new_hands = validate_hands(updated)

            # The reference excludes a transfer that only exchanges the two
            # labeled hand values; no fingers actually change strategically.
            if new_hands == state.current_hands[::-1]:
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


def _validate_depth(depth: int) -> None:
    """Keep the complete bottom-up table within a practical fixed horizon."""

    if (
        type(depth) is not int
        or depth % 2 != 0
        or not 2 <= depth <= MAX_GAME_PLIES
    ):
        raise ValueError(
            f"The game depth must be an even number from 2 through {MAX_GAME_PLIES}."
        )


def _validate_moves(moves: int) -> None:
    """Validate a count of two-ply A/B rounds."""

    if type(moves) is not int or not 1 <= moves <= MAX_GAME_PLIES // 2:
        raise ValueError(
            f"The number of rounds must be from 1 through {MAX_GAME_PLIES // 2}."
        )


def _validate_level_and_depth(level: int, depth: int) -> None:
    _validate_depth(depth)
    if type(level) is not int or not 0 <= level <= depth:
        raise ValueError("The level must be a whole number within the game horizon.")


def overflow_sum(a: int, b: int) -> int:
    """Return 0 when adding two hand values reaches five, else their sum.

    The supplied starter accepts values through five at this helper boundary;
    playable hand states themselves are restricted to zero through four.
    """

    if (
        type(a) is not int
        or type(b) is not int
        or not 0 <= a <= KNOCKOUT_TOTAL
        or not 0 <= b <= KNOCKOUT_TOTAL
    ):
        raise ValueError("The values to add must be whole numbers from 0 through 5.")
    return 0 if a + b >= KNOCKOUT_TOTAL else a + b


def next_moves(v: TupleState) -> list[TupleState]:
    """Return starter-format successor states in deterministic order.

    A starter state is ((A left, A right), (B left, B right), level).
    The level is even on A's turn and odd on B's turn.
    """

    if not isinstance(v, tuple) or len(v) != 3:
        raise ValueError("A starter state must contain A hands, B hands, and level.")
    a_hands = validate_hands(v[0])
    b_hands = validate_hands(v[1])
    level = v[2]
    if type(level) is not int or level < 0:
        raise ValueError("The starter level must be a nonnegative whole number.")

    if a_hands == (0, 0) or b_hands == (0, 0):
        return []

    player = PLAYER_A if level % 2 == 0 else PLAYER_B
    state = GameState(a_hands, b_hands, player)
    return [
        (child.a_hands, child.b_hands, level + 1)
        for _move, child in legal_successors(state)
    ]


def best_move_dp(depth: int = DEFAULT_GAME_PLIES) -> dict[TupleState, DPEntry]:
    """Fill the complete finite-horizon minimax table bottom up.

    Each entry stores (score, best_child), where scores are -1, 0, or +1
    from A's perspective. Terminal and horizon entries store [] as their
    no-move marker, matching the supplied starter's shape.
    """

    _validate_depth(depth)
    hands = tuple(
        (left, right)
        for left in range(KNOCKOUT_TOTAL)
        for right in range(KNOCKOUT_TOTAL)
    )
    table: dict[TupleState, DPEntry] = {}

    for level in range(depth, -1, -1):
        for a_hands in hands:
            for b_hands in hands:
                state: TupleState = (a_hands, b_hands, level)

                if a_hands == (0, 0) and b_hands == (0, 0):
                    table[state] = (0, [])
                elif a_hands == (0, 0):
                    table[state] = (-1, [])
                elif b_hands == (0, 0):
                    table[state] = (1, [])
                elif level == depth:
                    table[state] = (0, [])
                else:
                    children = next_moves(state)
                    if not children:
                        raise RuntimeError(
                            "A nonterminal position unexpectedly has no legal move."
                        )
                    if level % 2 == 0:
                        best_child = max(children, key=lambda child: table[child][0])
                    else:
                        best_child = min(children, key=lambda child: table[child][0])
                    table[state] = (table[best_child][0], best_child)

    return table


def choose_computer_move(
    state: GameState,
    level: int = 0,
    depth: int = DEFAULT_GAME_PLIES,
    table: dict[TupleState, DPEntry] | None = None,
) -> SearchDecision:
    """Choose the table's best legal move at an absolute game level."""

    if type(state) is not GameState:
        raise ValueError("A computer move requires a GameState.")
    _validate_level_and_depth(level, depth)
    expected_turn = PLAYER_A if level % 2 == 0 else PLAYER_B
    if state.turn != expected_turn:
        raise ValueError("The state turn does not match the supplied level.")
    if winner(state) is not None or level == depth:
        raise ValueError("A move cannot be selected from a finished game.")

    if table is None:
        table = best_move_dp(depth)
    key = (state.a_hands, state.b_hands, level)
    if key not in table:
        raise ValueError("The DP table does not contain the current position.")
    score, best_child = table[key]
    if not isinstance(best_child, tuple):
        raise RuntimeError("A live DP position has no selected successor.")

    for move, child in legal_successors(state):
        candidate = (child.a_hands, child.b_hands, level + 1)
        if candidate == best_child:
            return SearchDecision(move, child, score)
    raise RuntimeError("The DP table selected a move that is not legal.")


def format_hands(hands: Hands) -> str:
    """Return a labeled left/right hand pair."""

    return f"left {hands[0]} | right {hands[1]}"


def format_state(state: GameState) -> str:
    """Return a multiline display of a game state."""

    return "\n".join(
        (
            f"Player A (MAX): {format_hands(state.a_hands)}",
            f"Player B (MIN): {format_hands(state.b_hands)}",
            f"Turn: Player {state.turn}",
        )
    )


def display(w: TupleState, output_function: OutputFunction = print) -> None:
    """Print A and B's hands in the supplied starter's display format."""

    if not isinstance(w, tuple) or len(w) != 3:
        raise ValueError("A starter state must contain A hands, B hands, and level.")
    a_hands = validate_hands(w[0])
    b_hands = validate_hands(w[1])
    output_function("***********************")
    output_function(f"A: {a_hands}")
    output_function(f"B: {b_hands}")


def describe_move(state: GameState, move: Move) -> str:
    """Return a clear explanation of ``move`` from ``state``."""

    if move.kind == "attack":
        assert move.source is not None and move.target is not None
        source_value = state.current_hands[move.source]
        target_value = state.opponent_hands[move.target]
        source_side = "left" if move.source == 0 else "right"
        target_side = "left" if move.target == 0 else "right"
        total = source_value + target_value
        result = 0 if total >= KNOCKOUT_TOTAL else total
        knockout = " (knocked out)" if result == 0 else ""
        return (
            f"Player {state.turn} attacks with {source_side} ({source_value}) "
            f"into the opponent's {target_side} ({target_value}): "
            f"{target_value} + {source_value} = {total}, target becomes "
            f"{result}{knockout}."
        )

    assert move.new_hands is not None
    return (
        f"Player {state.turn} splits {format_hands(state.current_hands)} into "
        f"{format_hands(move.new_hands)}."
    )


def describe_score(score: int) -> str:
    """Explain the starter's A-centric three-valued DP score."""

    if score == 1:
        return "+1, Player A can force a win within the horizon"
    if score == -1:
        return "-1, Player B can force a win within the horizon"
    if score == 0:
        return "0, neither player can force a win before the horizon"
    raise ValueError("A DP score must be -1, 0, or +1.")


def _read_bounded_response(
    prompt: str,
    input_function: InputFunction,
    output_function: OutputFunction,
) -> str | None:
    """Read and normalize one short line without ever echoing its contents."""

    response = input_function(prompt)
    if not isinstance(response, str):
        output_function("Input must be text.")
        return None
    if len(response) > MAX_INPUT_LENGTH:
        output_function(
            f"Input is too long; enter at most {MAX_INPUT_LENGTH} characters."
        )
        return None
    return response.strip().lower()


def _prompt_menu_choice(
    prompt: str,
    choices: Mapping[str, str],
    input_function: InputFunction,
    output_function: OutputFunction,
) -> str:
    while True:
        response = _read_bounded_response(prompt, input_function, output_function)
        if response is None:
            continue
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


def prompt_yes_no(
    prompt: str,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
    default: bool = False,
) -> bool:
    """Read a bounded yes/no answer, using ``default`` for an empty line."""

    if type(default) is not bool:
        raise ValueError("The yes/no default must be a Boolean value.")

    while True:
        response = _read_bounded_response(prompt, input_function, output_function)
        if response is None:
            continue
        if response in {"y", "yes"}:
            return True
        if response in {"n", "no"}:
            return False
        if response == "":
            return default
        output_function("Please enter y or n.")


def prompt_human_move(
    state: GameState,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> tuple[Move, GameState] | None:
    """List legal moves and return the selected successor, or ``None`` to quit."""

    successors = legal_successors(state)
    if not successors:
        raise ValueError("A move cannot be requested from a finished game.")

    output_function("Legal moves:")
    for number, (move, _child) in enumerate(successors, start=1):
        output_function(f"  {number}. {describe_move(state, move)}")

    while True:
        response = _read_bounded_response(
            "Select a move number (or q to quit): ",
            input_function,
            output_function,
        )
        if response is None:
            continue
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
        output_function("It is a tie: the fixed game horizon was reached.")
    elif result == QUIT:
        output_function("Game ended by the user.")


def run_human_vs_computer(
    human_player: str,
    moves: int = DEFAULT_MOVES,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> str:
    """Play a fixed-length game against the bottom-up DP computer."""

    if human_player not in PLAYERS:
        raise ValueError("The human player must be A or B.")
    _validate_moves(moves)
    depth = 2 * moves
    table = best_move_dp(depth)
    state = INITIAL_STATE

    output_function("")
    output_function(
        f"You are Player {human_player}. Player A moves first. "
        f"The game ends after at most {depth} individual turns."
    )

    for level in range(depth):
        output_function("")
        output_function(f"Turn {level + 1} of {depth}")
        output_function(format_state(state))

        if state.turn == human_player:
            selection = prompt_human_move(state, input_function, output_function)
            if selection is None:
                _announce_result(QUIT, output_function)
                return QUIT
            move, next_state = selection
            output_function(describe_move(state, move))
        else:
            decision = choose_computer_move(state, level, depth, table)
            next_state = decision.next_state
            output_function(describe_move(state, decision.move))
            output_function(f"DP evaluation: {describe_score(decision.score)}.")

        state = next_state
        result = game_result(state, level + 1, depth)
        if result is not None:
            output_function(format_state(state))
            _announce_result(result, output_function)
            return result

    raise RuntimeError("The fixed-horizon game ended without a result.")


def run_autonomous(
    moves: int = DEFAULT_MOVES,
    pause: bool = False,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> str:
    """Demonstrate both players following one bottom-up DP table."""

    _validate_moves(moves)
    if type(pause) is not bool:
        raise ValueError("The pause option must be a Boolean value.")

    depth = 2 * moves
    table = best_move_dp(depth)
    graph = build_game_graph()
    state = INITIAL_STATE
    edge_count = sum(len(edges) for edges in graph.values())

    output_function("")
    output_function("Autonomous demonstration")
    output_function(
        f"Reachable graph: {len(graph)} states and {edge_count} legal transitions."
    )
    output_function(
        f"Bottom-up DP: {len(table)} state-level entries; "
        f"fixed horizon of {depth} individual turns."
    )

    for level in range(depth):
        output_function("")
        output_function(f"Turn {level + 1} of {depth}")
        output_function(format_state(state))

        decision = choose_computer_move(state, level, depth, table)
        output_function(describe_move(state, decision.move))
        output_function(f"DP evaluation: {describe_score(decision.score)}.")

        state = decision.next_state
        result = game_result(state, level + 1, depth)
        if result is not None:
            output_function(format_state(state))
            _announce_result(result, output_function)
            return result

        if pause:
            _read_bounded_response(
                "Press Enter for the next move...",
                input_function,
                output_function,
            )

    raise RuntimeError("The fixed-horizon demonstration ended without a result.")


def chopsticks_game(
    moves: int = DEFAULT_MOVES,
    index: int = 0,
    input_function: InputFunction = input,
    output_function: OutputFunction = print,
) -> str:
    """Run the starter-style human game; index 0 moves first, index 1 second."""

    _validate_moves(moves)
    if type(index) is not int or index not in (0, 1):
        raise ValueError("The player index must be 0 (first) or 1 (second).")
    human_player = PLAYER_A if index == 0 else PLAYER_B
    return run_human_vs_computer(
        human_player,
        moves=moves,
        input_function=input_function,
        output_function=output_function,
    )


def main() -> None:
    """Start the interactive command-line program."""

    print("Assignment 6: Chopsticks")
    print("A dead hand is inactive, but a legal split can revive it.")
    print("A player loses only when both hands are dead (0 | 0).")
    print("An unfinished game is a tie after 20 individual turns.")
    print()

    try:
        mode = prompt_mode()
        if mode == "human":
            human_player = prompt_human_player()
            index = 0 if human_player == PLAYER_A else 1
            chopsticks_game(DEFAULT_MOVES, index)
            return

        pause = prompt_yes_no(
            "Pause after every autonomous move? (y/N): ",
            input_function=input,
            output_function=print,
        )
        run_autonomous(pause=pause)
    except (EOFError, KeyboardInterrupt):
        print("\nGame ended.")


if __name__ == "__main__":
    main()
