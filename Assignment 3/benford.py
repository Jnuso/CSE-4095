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
from pathlib import Path


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


def count_powers(base: int, max_exponent: int) -> list[int]:
    """Count base^0 through base^max_exponent without constructing powers."""
    log_base = math.log10(base)
    return count_fractional_logs(max_exponent + 1, lambda _: log_base)


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


def save_dark_mode_plot(
    sequence: str, n: int, terms_examined: int, counts: list[int]
) -> Path:
    """Save a dependency-free dark-mode SVG comparison chart."""
    digits = list(range(1, 10))
    observed = [counts[digit] / terms_examined * 100 for digit in digits]
    predicted = [BENFORD[digit] for digit in digits]
    canvas_width, canvas_height = 1000, 620
    left, right, top, bottom = 95, 45, 105, 100
    plot_width = canvas_width - left - right
    plot_height = canvas_height - top - bottom
    y_max = max(max(observed), max(predicted)) * 1.15
    group_width = plot_width / len(digits)
    bar_width = group_width * 0.34

    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{canvas_width}" height="{canvas_height}" viewBox="0 0 {canvas_width} {canvas_height}" role="img" aria-label="Dark-mode Benford comparison chart for {sequence}">',
        '<rect width="100%" height="100%" fill="#101417"/>',
        f'<rect x="{left}" y="{top}" width="{plot_width}" height="{plot_height}" fill="#192126"/>',
        f'<text x="{canvas_width / 2}" y="45" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="25" font-weight="bold">Benford&apos;s Law: {sequence} (n = {n:,})</text>',
        f'<text x="{canvas_width / 2}" y="74" text-anchor="middle" fill="#c9d6dc" font-family="Arial, sans-serif" font-size="15">Observed first-digit percentages compared with Benford&apos;s prediction</text>',
        f'<text x="{left + 10}" y="{top - 25}" fill="#4cc9f0" font-family="Arial, sans-serif" font-size="15">Observed</text>',
        f'<rect x="{left - 14}" y="{top - 37}" width="10" height="10" fill="#4cc9f0"/>',
        f'<text x="{left + 125}" y="{top - 25}" fill="#f9c74f" font-family="Arial, sans-serif" font-size="15">Benford prediction</text>',
        f'<rect x="{left + 101}" y="{top - 37}" width="10" height="10" fill="#f9c74f"/>',
    ]

    for tick in range(6):
        value = y_max * tick / 5
        y = top + plot_height - plot_height * value / y_max
        svg.append(f'<line x1="{left}" y1="{y:.1f}" x2="{left + plot_width}" y2="{y:.1f}" stroke="#53636d" stroke-opacity="0.55"/>')
        svg.append(f'<text x="{left - 10}" y="{y + 5:.1f}" text-anchor="end" fill="#d8e1e5" font-family="Arial, sans-serif" font-size="13">{value:.0f}%</text>')

    for index, digit in enumerate(digits):
        center = left + group_width * (index + 0.5)
        observed_height = plot_height * observed[index] / y_max
        predicted_height = plot_height * predicted[index] / y_max
        svg.append(f'<rect x="{center - bar_width - 3:.1f}" y="{top + plot_height - observed_height:.1f}" width="{bar_width:.1f}" height="{observed_height:.1f}" fill="#4cc9f0"/>')
        svg.append(f'<rect x="{center + 3:.1f}" y="{top + plot_height - predicted_height:.1f}" width="{bar_width:.1f}" height="{predicted_height:.1f}" fill="#f9c74f"/>')
        svg.append(f'<text x="{center:.1f}" y="{top + plot_height + 25}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="15">{digit}</text>')

    svg.extend([
        f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_height}" stroke="#8fa3ad"/>',
        f'<line x1="{left}" y1="{top + plot_height}" x2="{left + plot_width}" y2="{top + plot_height}" stroke="#8fa3ad"/>',
        f'<text x="{canvas_width / 2}" y="{canvas_height - 32}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16">Leading digit</text>',
        f'<text x="27" y="{top + plot_height / 2}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" transform="rotate(-90 27 {top + plot_height / 2})">Percentage of terms</text>',
        '</svg>',
    ])

    output = Path("output") / "plots" / f"benford_{sequence}_{n}.svg"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(svg), encoding="utf-8")
    return output


def parse_arguments(arguments: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare a mathematical sequence's leading digits with Benford's Law."
    )
    parser.add_argument("sequence", choices=("fibonacci", "power2", "factorial", "power3"))
    parser.add_argument("n", type=int, help="number of terms (maximum exponent for power2)")
    parser.add_argument("--show-terms", action="store_true", help="print exact Fibonacci terms")
    parser.add_argument(
        "--exact",
        action="store_true",
        help="force exact Fibonacci integer generation, even when n is large",
    )
    parser.add_argument(
        "--plot",
        action="store_true",
        help="save a dark-mode observed-versus-Benford bar chart under output/plots",
    )
    return parser.parse_args(arguments)


def main(arguments: list[str] | None = None) -> None:
    args = parse_arguments(arguments)
    if args.n < 1:
        raise SystemExit("n must be a positive integer.")
    if args.show_terms and args.sequence != "fibonacci":
        raise SystemExit("--show-terms is available only for Fibonacci.")
    if args.show_terms and args.n > EXACT_FIBONACCI_LIMIT:
        raise SystemExit(
            f"--show-terms requires n <= {EXACT_FIBONACCI_LIMIT:,} because it prints exact Fibonacci terms."
        )
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
            counts = count_powers(2, args.n)
            method = "powers of 2; logarithmic fractional-part method"
        elif args.sequence == "power3":
            counts = count_powers(3, args.n)
            method = "powers of 3; logarithmic fractional-part method"
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

    terms_examined = args.n + 1 if args.sequence in ("power2", "power3") else args.n
    print_report(terms_examined, counts, time.perf_counter() - started, method)
    if args.plot:
        plot_path = save_dark_mode_plot(args.sequence, args.n, terms_examined, counts)
        print(f"Dark-mode chart saved to: {plot_path}")


if __name__ == "__main__":
    main()
