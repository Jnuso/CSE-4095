# Benford's Law Sequence Experiments

`benford.py` is one refactored program for all Benford experiments. It accepts
a sequence name and `n`, extracts each leading digit,
and compares the observed percentage to Benford's predicted percentage:

`P(first digit = d) = log10(1 + 1/d)` for `d = 1, ..., 9`.

Run it from this folder:

```powershell
python benford.py fibonacci 1000
python benford.py fibonacci 20 --show-terms
```

## Dark-mode chart

Add `--plot` to save a dependency-free dark-mode SVG bar chart comparing
observed leading-digit percentages to Benford's prediction. Charts are saved
in `output/plots/`.

```powershell
python benford.py fibonacci 1000 --plot
```

## Experiment 2: powers of 2

The second sequence is `1, 2, 4, 8, 16, ...`, or `2^k` beginning at `k = 0`.
For this experiment, `n` is the maximum exponent, so the program examines
`2^0` through `2^n` (a total of `n + 1` terms), matching the lecture example.
The program never computes the large powers themselves. Since
`log10(2^k) = k log10(2)`, the first digit comes from the fractional part of
that logarithm. The code adds `log10(2)` each iteration and keeps only its
fractional part.

```powershell
python benford.py power2 1000000
```

## Your own experiment: powers of 3

The program also supports powers of 3. Before running it, our prediction is
that it will approach Benford's Law because the fractional parts of
`k * log10(3)` spread across the interval from 0 up to 1.

```powershell
python benford.py power3 1000000 --plot
```

## Factorials

Factorials are also available through the same shared Benford counting and
reporting code. This command examines `1!` through `n!` by accumulating
logarithms rather than constructing enormous factorial integers:

```powershell
python benford.py factorial 1000000
```

## When `n` becomes very large

For Fibonacci inputs through 10,000, the normal mode constructs every
Fibonacci integer exactly. The number of digits in `F_n` grows about `0.209n`,
so both memory and arithmetic time grow substantially as `n` grows. On current
Python versions, converting very large integers to decimal strings can also
reach a safety limit when `--exact` is used.

For a large Fibonacci experiment, use:

```powershell
python benford.py fibonacci 1000000
```

For Fibonacci inputs over 10,000, the program automatically begins with 50
exact terms, then uses Binet's formula,
`F_k ≈ phi^k / sqrt(5)`. Thus `log10(F_k) ≈ k log10(phi) - log10(sqrt(5))`,
and only the fractional part is needed to find the first digit. It avoids
big-integer storage, but still needs one loop per term; floating-point rounding
eventually makes either logarithmic method unreliable for astronomically large
indices. Add `--exact` to force direct Fibonacci integer generation.
