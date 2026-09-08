# Fibonacci and Benford's Law

`benford_fibonacci.py` accepts `n` from the command line, examines the first
`n` terms of a selected mathematical sequence, extracts each leading digit,
and compares the observed percentage to Benford's predicted percentage:

`P(first digit = d) = log10(1 + 1/d)` for `d = 1, ..., 9`.

Run it from this folder:

```powershell
python benford_fibonacci.py 1000
python benford_fibonacci.py 20 --show-terms
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
python benford_fibonacci.py 1000000 --sequence powers-of-2
```

## When `n` becomes very large

The normal mode is exact: it really constructs every Fibonacci integer. The
number of digits in `F_n` grows about `0.209n`, so both memory and arithmetic
time grow substantially as `n` grows. On current Python versions, converting
very large integers to decimal strings can also reach a safety limit; the
program explains this case instead of giving an unclear traceback.

For a large Fibonacci experiment, use:

```powershell
python benford_fibonacci.py 1000000 --fast
```

This begins with 50 exact terms, then uses Binet's formula,
`F_k ≈ phi^k / sqrt(5)`. Thus `log10(F_k) ≈ k log10(phi) - log10(sqrt(5))`,
and only the fractional part is needed to find the first digit. It avoids
big-integer storage, but still needs one loop per term; floating-point rounding
eventually makes either logarithmic method unreliable for astronomically large
indices.
