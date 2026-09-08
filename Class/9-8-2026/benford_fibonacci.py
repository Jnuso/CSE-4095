"""Compare Fibonacci leading digits with Benford's Law.

The program treats F_1 = 1 and F_2 = 1, so it examines the first n
positive Fibonacci terms.  Example:  python benford_fibonacci.py 1000
"""

from __future__ import annotations

import argparse
import math
import time
from collections.abc import Iterator


BENFORD = {digit: math.log10(1 + 1 / digit) * 100 for digit in range(1, 10)}


def fibonacci_terms(n: int) -> Iterator[int]:
    """Yield F_1 through F_n without storing the full sequence."""
    first, second = 1, 1
    for index in range(n):
        if index < 2:
            yield 1
        else:
            first, second = second, first + second
            yield second


def leading_digit(number: int) -> int:
    """Return the first base-10 digit of a positive integer."""
    return int(str(number)[0])


def analyze_exact(n: int, show_terms: bool) -> list[int]:
    """Generate actual Fibonacci integers and count their leading digits."""
    counts = [0] * 10
    for position, term in enumerate(fibonacci_terms(n), start=1):
        digit = leading_digit(term)
        counts[digit] += 1
        if show_terms:
            print(f"F_{position} = {term}  (leading digit: {digit})")
    return counts


def leading_fibonacci_digit_by_log(index: int) -> int:
    """Estimate F_index's leading digit using Binet's formula in log space."""
    phi = (1 + math.sqrt(5)) / 2
    fractional_part = (index * math.log10(phi) - math.log10(math.sqrt(5))) % 1
    # The approximation is not reliable for astronomically large indexes.
    return min(9, int(10**fractional_part))


def analyze_fast(n: int) -> list[int]:
    """Count estimated leading digits without building enormous Fibonacci integers."""
    counts = [0] * 10
    for index in range(1, n + 1):
        counts[leading_fibonacci_digit_by_log(index)] += 1
    return counts


def print_report(n: int, counts: list[int], elapsed: float, method: str) -> None:
    print(f"\nFibonacci terms examined: {n:,} ({method} method)")
    print("digit  observed count  observed %  Benford %  difference")
    print("-----  --------------  ----------  ---------  ----------")
    for digit in range(1, 10):
        observed = counts[digit] / n * 100
        difference = observed - BENFORD[digit]
        print(
            f"  {digit}    {counts[digit]:>10,}    {observed:>8.3f}%"
            f"   {BENFORD[digit]:>7.3f}%  {difference:>+9.3f}%"
        )
    print(f"\nElapsed time: {elapsed:.3f} seconds")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare Fibonacci leading digits with Benford's Law."
    )
    parser.add_argument("n", type=int, help="number of positive Fibonacci terms to examine")
    parser.add_argument(
        "--show-terms", action="store_true", help="print every generated Fibonacci term"
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="estimate leading digits with logarithms instead of generating huge integers",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_arguments()
    if args.n < 1:
        raise SystemExit("n must be a positive integer.")
    if args.show_terms and args.fast:
        raise SystemExit("--show-terms cannot be used with --fast (terms are not generated).")

    started = time.perf_counter()
    try:
        counts = analyze_fast(args.n) if args.fast else analyze_exact(args.n, args.show_terms)
    except ValueError as error:
        if "string conversion" in str(error):
            raise SystemExit(
                "A Fibonacci term exceeded Python's safe integer-to-string limit. "
                "Try a smaller n or use --fast."
            ) from error
        raise
    print_report(args.n, counts, time.perf_counter() - started, "fast" if args.fast else "exact")


if __name__ == "__main__":
    main()
