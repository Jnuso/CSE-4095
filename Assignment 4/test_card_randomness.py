"""Distribution test for the Card Game 24 card generator.

This is an optional diagnostic script and is not an assignment submission file.
By default it generates one million four-card hands, counts all four million card
values, and reports how frequently each value appeared.
"""

from __future__ import annotations

import argparse
from collections import Counter
import random
import time

from card24 import generate_cards


DEFAULT_CYCLES = 1_000_000
CARD_VALUES = range(1, 14)
CARDS_PER_HAND = 4


def run_test(cycles: int, seed: int | None = None) -> Counter[int]:
    """Generate ``cycles`` hands and return counts for every card value."""

    rng = random.Random(seed)
    counts: Counter[int] = Counter()

    for _ in range(cycles):
        counts.update(generate_cards(rng))

    return counts


def print_report(counts: Counter[int], cycles: int, seed: int | None) -> None:
    """Print observed percentages and a simple uniformity diagnostic."""

    total_draws = cycles * CARDS_PER_HAND
    expected_count = total_draws / len(CARD_VALUES)
    expected_percent = 100 / len(CARD_VALUES)
    chi_square = sum(
        (counts[value] - expected_count) ** 2 / expected_count
        for value in CARD_VALUES
    )

    print("Card Generator Distribution Test")
    print(f"Hands generated: {cycles:,}")
    print(f"Total card draws: {total_draws:,}")
    print(f"Seed: {seed if seed is not None else 'system-generated'}")
    print(f"Expected percentage per value: {expected_percent:.6f}%")
    print()
    print(f"{'Card':>4} {'Occurrences':>13} {'Observed %':>12} {'Difference':>12}")
    print("-" * 45)

    for value in CARD_VALUES:
        observed_percent = counts[value] / total_draws * 100
        difference = observed_percent - expected_percent
        print(
            f"{value:>4} {counts[value]:>13,} "
            f"{observed_percent:>11.6f}% {difference:>+11.6f}%"
        )

    print()
    print(f"Chi-square statistic (12 degrees of freedom): {chi_square:.4f}")
    print("Percentages should be close to, but not exactly, the expected value.")
    print("This test checks the observed distribution; it does not prove true randomness.")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Test the distribution of the Card Game 24 generator."
    )
    parser.add_argument(
        "cycles",
        nargs="?",
        type=int,
        default=DEFAULT_CYCLES,
        help=f"number of four-card hands to generate (default: {DEFAULT_CYCLES:,})",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="optional fixed seed for a reproducible run",
    )
    arguments = parser.parse_args()

    if arguments.cycles <= 0:
        parser.error("cycles must be greater than zero")

    return arguments


def main() -> None:
    arguments = parse_arguments()
    start_time = time.perf_counter()
    counts = run_test(arguments.cycles, arguments.seed)
    elapsed = time.perf_counter() - start_time

    print_report(counts, arguments.cycles, arguments.seed)
    print(f"Elapsed time: {elapsed:.3f} seconds")


if __name__ == "__main__":
    main()
