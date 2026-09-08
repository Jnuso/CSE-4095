"""Compare Fibonacci numbers or powers of two with Benford's Law.

Examples:
    python benford_fibonacci.py 1000
    python benford_fibonacci.py 1000000 --sequence powers-of-2
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


def leading_digit_from_fraction(fractional_part: float) -> int:
    """Convert a base-10 logarithm's fractional part to its leading digit."""
    # The small tolerance fixes values such as 7.999999999999999 for 2**3.
    return min(9, int(10**fractional_part + 1e-12))


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
    return leading_digit_from_fraction(fractional_part)


def analyze_large_fibonacci(n: int, exact_terms: int = 50) -> list[int]:
    """Use exact early terms, then Binet's formula without building large integers.

    log10(F_k) is approximately k * log10(phi) - log10(sqrt(5)).  Its
    fractional part determines F_k's leading digit.
    """
    counts = [0] * 10
    exact_count = min(n, exact_terms)
    for term in fibonacci_terms(exact_count):
        counts[leading_digit(term)] += 1
    for index in range(exact_count + 1, n + 1):
        counts[leading_fibonacci_digit_by_log(index)] += 1
    return counts


def analyze_powers_of_two(max_exponent: int) -> list[int]:
    """Count leading digits of 2**0 through 2**max_exponent in log space.

    We update only the fractional part of k * log10(2), never calculate 2**k.
    """
    counts = [0] * 10
    fractional = 0.0
    log_two = math.log10(2)
    for _ in range(max_exponent + 1):
        counts[leading_digit_from_fraction(fractional)] += 1
        fractional += log_two
        if fractional >= 1.0:
            fractional -= 1.0
    return counts


def print_report(n: int, counts: list[int], elapsed: float, experiment: str) -> None:
    print(f"\nTerms examined: {n:,} ({experiment})")
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
        description="Compare a mathematical sequence's leading digits with Benford's Law."
    )
    parser.add_argument("n", type=int, help="number of positive Fibonacci terms to examine")
    parser.add_argument(
        "--show-terms", action="store_true", help="print every generated Fibonacci term"
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="for Fibonacci, use Binet's formula after the first 50 exact terms",
    )
    parser.add_argument(
        "--sequence",
        choices=("fibonacci", "powers-of-2"),
        default="fibonacci",
        help="sequence to test (default: fibonacci)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_arguments()
    if args.n < 1:
        raise SystemExit("n must be a positive integer.")
    if args.show_terms and (args.fast or args.sequence == "powers-of-2"):
        raise SystemExit("--show-terms is available only for exact Fibonacci mode.")

    started = time.perf_counter()
    try:
        if args.sequence == "powers-of-2":
            counts = analyze_powers_of_two(args.n)
            experiment = "powers of 2; logarithmic fractional-part method"
            terms_examined = args.n + 1
        elif args.fast:
            counts = analyze_large_fibonacci(args.n)
            experiment = "Fibonacci; Binet's logarithmic approximation"
            terms_examined = args.n
        else:
            counts = analyze_exact(args.n, args.show_terms)
            experiment = "Fibonacci; exact integers"
            terms_examined = args.n
    except ValueError as error:
        if "string conversion" in str(error):
            raise SystemExit(
                "A Fibonacci term exceeded Python's safe integer-to-string limit. "
                "Try a smaller n or use --fast."
            ) from error
        raise
    print_report(terms_examined, counts, time.perf_counter() - started, experiment)


if __name__ == "__main__":
    main()
