"""One command-line program for Benford's Law sequence experiments.

Examples:
    python benford.py fibonacci 1000
    python benford.py power2 1000000
    python benford.py factorial 1000000
"""

from __future__ import annotations

import argparse
import math
import time
from collections.abc import Callable, Iterator


BENFORD = {digit: math.log10(1 + 1 / digit) * 100 for digit in range(1, 10)}
EXACT_FIBONACCI_LIMIT = 10_000


def leading_digit(number: int) -> int:
    """Return the first decimal digit of a positive integer."""
    return int(str(number)[0])


def leading_digit_from_fraction(fractional_part: float) -> int:
    """Turn the fractional part of log10(x) into x's leading digit."""
    # The tolerance protects values such as 7.999999999999999 from becoming 7.
    return min(9, int(10**fractional_part + 1e-12))


def fibonacci_terms(n: int) -> Iterator[int]:
    """Yield F_1 through F_n, where F_1 = F_2 = 1."""
    first, second = 1, 1
    for index in range(n):
        if index < 2:
            yield 1
        else:
            first, second = second, first + second
            yield second


def count_exact_terms(terms: Iterator[int], show_terms: bool = False) -> list[int]:
    """Shared counting logic for a sequence that produces actual integers."""
    counts = [0] * 10
    for index, term in enumerate(terms, start=1):
        digit = leading_digit(term)
        counts[digit] += 1
        if show_terms:
            print(f"term {index} = {term}  (leading digit: {digit})")
    return counts


def fibonacci_leading_digit(index: int) -> int:
    """Estimate F_index's leading digit using Binet's formula in log space."""
    phi = (1 + math.sqrt(5)) / 2
    logarithm = index * math.log10(phi) - math.log10(math.sqrt(5))
    return leading_digit_from_fraction(logarithm % 1)


def count_large_fibonacci(n: int) -> list[int]:
    """Count 50 exact Fibonacci terms, then use the Binet approximation."""
    exact_terms = min(n, 50)
    counts = count_exact_terms(fibonacci_terms(exact_terms))
    for index in range(exact_terms + 1, n + 1):
        counts[fibonacci_leading_digit(index)] += 1
    return counts


def count_fractional_logs(n: int, increment: Callable[[int], float]) -> list[int]:
    """Shared logarithmic counting for sequences whose logs can be updated."""
    counts = [0] * 10
    fractional = 0.0
    for index in range(n):
        counts[leading_digit_from_fraction(fractional)] += 1
        fractional = (fractional + increment(index)) % 1
    return counts


def count_powers_of_two(max_exponent: int) -> list[int]:
    """Count 2^0 through 2^max_exponent without calculating those powers."""
    log_two = math.log10(2)
    return count_fractional_logs(max_exponent + 1, lambda _: log_two)


def count_factorials(n: int) -> list[int]:
    """Count 1! through n! without calculating giant factorial integers."""
    # Before term k! is counted, the accumulator contains log10(k!).
    return count_fractional_logs(n, lambda index: math.log10(index + 2))


def print_report(terms_examined: int, counts: list[int], elapsed: float, method: str) -> None:
    print(f"\nTerms examined: {terms_examined:,} ({method})")
    print("digit  observed count  observed %  Benford %  difference")
    print("-----  --------------  ----------  ---------  ----------")
    for digit in range(1, 10):
        observed = counts[digit] / terms_examined * 100
        difference = observed - BENFORD[digit]
        print(
            f"  {digit}    {counts[digit]:>10,}    {observed:>8.3f}%"
            f"   {BENFORD[digit]:>7.3f}%  {difference:>+9.3f}%"
        )
    print(f"\nElapsed time: {elapsed:.3f} seconds")


def parse_arguments(arguments: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare a mathematical sequence's leading digits with Benford's Law."
    )
    parser.add_argument("sequence", choices=("fibonacci", "power2", "factorial"))
    parser.add_argument("n", type=int, help="number of terms (maximum exponent for power2)")
    parser.add_argument("--show-terms", action="store_true", help="print exact Fibonacci terms")
    parser.add_argument(
        "--exact",
        action="store_true",
        help="force exact Fibonacci integer generation, even when n is large",
    )
    return parser.parse_args(arguments)


def main(arguments: list[str] | None = None) -> None:
    args = parse_arguments(arguments)
    if args.n < 1:
        raise SystemExit("n must be a positive integer.")
    if args.show_terms and args.sequence != "fibonacci":
        raise SystemExit("--show-terms is available only for Fibonacci.")
    if args.exact and args.sequence != "fibonacci":
        raise SystemExit("--exact is available only for Fibonacci.")

    started = time.perf_counter()
    try:
        if args.sequence == "fibonacci":
            if args.exact or args.n <= EXACT_FIBONACCI_LIMIT:
                counts = count_exact_terms(fibonacci_terms(args.n), args.show_terms)
                method = "Fibonacci; exact integers"
            else:
                counts = count_large_fibonacci(args.n)
                method = "Fibonacci; Binet's logarithmic approximation"
        elif args.sequence == "power2":
            counts = count_powers_of_two(args.n)
            method = "powers of 2; logarithmic fractional-part method"
        else:
            counts = count_factorials(args.n)
            method = "factorials; logarithmic fractional-part method"
    except ValueError as error:
        if "string conversion" in str(error):
            raise SystemExit(
                "An exact Fibonacci term exceeded Python's safe integer-to-string limit. "
                "Run without --exact to use Binet's approximation."
            ) from error
        raise

    terms_examined = args.n + 1 if args.sequence == "power2" else args.n
    print_report(terms_examined, counts, time.perf_counter() - started, method)


if __name__ == "__main__":
    main()
