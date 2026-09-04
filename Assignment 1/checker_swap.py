"""Animate a recursive solution to the adjacent checker-swap problem.

A red checker is represented by 0 and a black checker by 1.  Starting
with n red checkers followed by n black checkers, the program uses only
adjacent swaps to create the alternating arrangement 0, 1, 0, 1, ... .
"""

from __future__ import annotations

import os
import sys
import time
from dataclasses import dataclass
from typing import Callable


RED = 0
BLACK = 1
ANIMATION_DELAY = 0.35


@dataclass(frozen=True)
class SwapStep:
    """A snapshot taken immediately after one legal adjacent swap."""

    number: int
    left_index: int
    right_index: int
    recursion_level: int
    state: tuple[int, ...]


StepCallback = Callable[[SwapStep], None]


def move_black_left(
    checkers: list[int],
    current_index: int,
    target_index: int,
    recursion_level: int,
    steps: list[SwapStep],
    on_swap: StepCallback | None,
) -> None:
    """Recursively move one black checker left using adjacent swaps only."""

    if current_index == target_index:
        return

    left_index = current_index - 1
    checkers[left_index], checkers[current_index] = (
        checkers[current_index],
        checkers[left_index],
    )

    step = SwapStep(
        number=len(steps) + 1,
        left_index=left_index,
        right_index=current_index,
        recursion_level=recursion_level,
        state=tuple(checkers),
    )
    steps.append(step)
    if on_swap is not None:
        on_swap(step)

    move_black_left(
        checkers,
        current_index - 1,
        target_index,
        recursion_level,
        steps,
        on_swap,
    )


def arrange_checkers(
    checkers: list[int],
    start: int,
    pairs: int,
    steps: list[SwapStep],
    on_swap: StepCallback | None = None,
    recursion_level: int = 1,
) -> None:
    """Recursively alternate ``pairs`` red/black checkers from ``start``.

    The first black checker in the current subproblem is moved beside its
    first red checker.  The remaining suffix is then the same problem with
    one fewer pair.
    """

    if pairs <= 1:
        return

    first_black_index = start + pairs
    black_target_index = start + 1
    move_black_left(
        checkers,
        first_black_index,
        black_target_index,
        recursion_level,
        steps,
        on_swap,
    )

    arrange_checkers(
        checkers,
        start + 2,
        pairs - 1,
        steps,
        on_swap,
        recursion_level + 1,
    )


def solve_checker_swap(
    n: int, on_swap: StepCallback | None = None
) -> tuple[list[int], list[SwapStep]]:
    """Create and solve a checker row, returning its final state and steps."""

    if n < 1:
        raise ValueError("n must be at least 1")

    checkers = [RED] * n + [BLACK] * n
    steps: list[SwapStep] = []
    arrange_checkers(checkers, 0, n, steps, on_swap)
    return checkers, steps


def clear_terminal() -> None:
    """Clear an interactive terminal using its platform command."""

    if sys.stdout.isatty():
        os.system("cls" if os.name == "nt" else "clear")


def checker_symbols(checkers: list[int] | tuple[int, ...]) -> str:
    """Return a visual representation of a checker row."""

    red_symbol, black_symbol = display_symbols()
    return " ".join(
        red_symbol if checker == RED else black_symbol for checker in checkers
    )


def display_symbols() -> tuple[str, str]:
    """Use checker emojis when the terminal encoding supports them."""

    encoding = sys.stdout.encoding or "utf-8"
    try:
        "🔴⚫".encode(encoding)
    except (LookupError, UnicodeEncodeError):
        return "[R]", "[B]"
    return "🔴", "⚫"


def show_frame(
    initial_state: list[int],
    current_state: list[int] | tuple[int, ...],
    n: int,
    step: SwapStep | None = None,
    delay: float = ANIMATION_DELAY,
) -> None:
    """Draw one frame of the terminal animation."""

    clear_terminal()
    expected_swaps = n * (n - 1) // 2
    red_symbol, black_symbol = display_symbols()

    print("RECURSIVE CHECKER SWAP")
    print("=" * 24)
    print(f"Legend: 0 = red {red_symbol}   1 = black {black_symbol}")
    print(f"Number of each color: {n}")
    print(f"Initial state: {initial_state}")
    print(f"               {checker_symbols(initial_state)}")
    print()

    if step is None:
        print("Preparing the recursive solution...")
    else:
        print(
            f"Swap {step.number} of {expected_swaps}: "
            f"positions {step.left_index + 1} and {step.right_index + 1} "
            f"(recursion level {step.recursion_level})"
        )

    print(f"Current state: {list(current_state)}")
    print(f"               {checker_symbols(current_state)}")
    sys.stdout.flush()
    time.sleep(delay)


def print_solution_summary(
    initial_state: list[int], final_state: list[int], steps: list[SwapStep]
) -> None:
    """Print the complete swap history below the final animation frame."""

    target_state = [value for _ in range(len(final_state) // 2) for value in (0, 1)]

    print()
    print("SOLUTION COMPLETE")
    print("=" * 17)
    print(f"Initial: {initial_state}")
    print(f"Target:  {target_state}")
    print(f"Final:   {final_state}")
    print()
    print(f"Total adjacent swaps: {len(steps)}")
    print("Swap history (positions are numbered starting at 1):")

    if not steps:
        print("  No swaps were needed.")
    else:
        for step in steps:
            print(
                f"  Step {step.number:>3}: swap positions "
                f"{step.left_index + 1} and {step.right_index + 1} -> "
                f"{list(step.state)}"
            )

    print()
    print("Success! The checkers now alternate red and black.")


def prompt_for_n() -> int:
    """Prompt until the user enters a valid, recursion-safe value for n."""

    maximum_n = sys.getrecursionlimit() - 50
    while True:
        response = input(
            "Enter n (the number of red checkers and black checkers): "
        ).strip()
        try:
            n = int(response)
        except ValueError:
            print("Please enter a whole number, such as 3.")
            continue

        if n < 1:
            print("Please enter a number greater than or equal to 1.")
        elif n > maximum_n:
            print(
                f"Please enter {maximum_n} or less so the recursive solution "
                "does not exceed Python's recursion limit."
            )
        else:
            return n


def run_once(n: int, delay: float = ANIMATION_DELAY) -> None:
    """Animate and print one complete checker-swap solution."""

    initial_state = [RED] * n + [BLACK] * n
    live_state = initial_state.copy()
    show_frame(initial_state, live_state, n, delay=delay)

    def animate_swap(step: SwapStep) -> None:
        live_state[:] = step.state
        show_frame(initial_state, live_state, n, step, delay)

    final_state, steps = solve_checker_swap(n, animate_swap)
    print_solution_summary(initial_state, final_state, steps)


def main() -> None:
    """Run solutions repeatedly until the user presses Ctrl+C."""

    print("Recursive Checker Swap")
    print("Press Ctrl+C at any time to quit.\n")

    try:
        while True:
            n = prompt_for_n()
            run_once(n)
            print("\nEnter another value of n to play again, or press Ctrl+C to quit.")
    except KeyboardInterrupt:
        print("\n\nThanks for playing. Goodbye!")


if __name__ == "__main__":
    main()
