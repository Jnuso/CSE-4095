"""Synthetic reviewer-evaluation fixtures; never imported by the application."""

from math import floor


def accuracy_a(correct, attempted):
    if attempted == 0:
        return 0
    return int(100 * correct / attempted)


def accuracy_b(correct, attempted):
    if attempted == 0:
        return 0
    return floor(100 * correct / attempted + 0.5)


def append_c(attempts, attempt):
    if attempt in attempts:
        return list(attempts)
    return [*attempts, attempt]


def append_d(attempts, attempt):
    if any(existing["id"] == attempt["id"] for existing in attempts):
        return list(attempts)
    return [*attempts, attempt]
