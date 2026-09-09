# Benford Experiment Results

## How to read this table

Each entry is the largest absolute difference, in percentage points, between
the observed first-digit percentage and Benford's prediction. Smaller values
mean a closer match. The digit in parentheses is where that largest difference
occurred.

## Required sequences

| Sequence | n = 100 | n = 1,000 | n = 100,000 | n = 1,000,000 |
| --- | ---: | ---: | ---: | ---: |
| Fibonacci | 1.8847 (digit 8) | 0.1992 (digit 7) | 0.0017 (digit 8) | 0.0002 (digit 4) |
| Powers of 2 | 0.9874 (digit 5) | 0.2048 (digit 7) | 0.0023 (digit 7) | 0.0002 (digit 7) |
| Factorials | 4.8847 (digit 8) | 2.0053 (digit 6) | 0.1780 (digit 1) | 0.0489 (digit 5) |

The power-of-2 command examines `2^0` through `2^n`, so it includes `n + 1`
terms. Fibonacci and factorial commands examine exactly `n` terms.

## Conclusion

All three required sequences move closer to Benford's distribution as `n`
increases. Fibonacci and powers of 2 are already very close by `n = 1,000`,
while factorials converge more slowly but are still close by `n = 1,000,000`.
Small samples have noticeably larger variation, so their observed percentages
are less reliable indicators of the long-run distribution.

## Original experiment: powers of 3

Prediction: powers of 3 should approach Benford's Law because the leading
digit of `3^k` depends on the fractional part of `k * log10(3)`. Those
fractional parts spread through the interval from 0 up to 1, just as they do
for powers of 2.

| n | Terms examined | Largest difference | Result |
| ---: | ---: | ---: | --- |
| 100 | 101 | 1.7702 percentage points | Small-sample variation |
| 1,000 | 1,001 | 0.2062 percentage points | Close match |
| 100,000 | 100,001 | 0.0020 percentage points | Very close match |
| 1,000,000 | 1,000,001 | 0.0003 percentage points | Almost exact match |

The experiment supports the prediction: powers of 3 also follow Benford's Law
more closely as the number of terms grows.

## Dark-mode visualization

Run any experiment with `--plot` to save a dark-mode SVG bar chart under
`output/plots/`. The chart places the observed percentage and Benford
percentage side by side for each leading digit from 1 through 9.

```powershell
python benford.py fibonacci 1000 --plot
python benford.py power3 1000000 --plot
```
