# Fibonacci and Benford's Law

`benford_fibonacci.py` accepts `n` from the command line, generates the first
`n` positive Fibonacci terms, extracts each leading digit, and compares the
observed percentage to Benford's predicted percentage:

`P(first digit = d) = log10(1 + 1/d)` for `d = 1, ..., 9`.

Run it from this folder:

```powershell
python benford_fibonacci.py 1000
python benford_fibonacci.py 20 --show-terms
```

## When `n` becomes very large

The normal mode is exact: it really constructs every Fibonacci integer. The
number of digits in `F_n` grows about `0.209n`, so both memory and arithmetic
time grow substantially as `n` grows. On current Python versions, converting
very large integers to decimal strings can also reach a safety limit; the
program explains this case instead of giving an unclear traceback.

For an experiment with a larger `n`, use:

```powershell
python benford_fibonacci.py 1000000 --fast
```

Fast mode does not generate the full integers. It estimates their leading
digits using the logarithmic form of Binet's formula, so it avoids big-integer
storage. It still takes one loop iteration per term and floating-point
rounding eventually makes it unreliable for astronomically large indices.
