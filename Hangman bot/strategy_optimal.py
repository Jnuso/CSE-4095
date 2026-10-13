"""Exact finite-dictionary Hangman planning, with a bounded online fallback.

The Bellman state is (consistent words, lives). Previously guessed letters have
identical outcomes on every consistent word, so they cannot split this set and
need not be included in the cache key. Constant correct guesses are free and
can be filled in at any time. Values count wins first, then lives on wins.
"""

from __future__ import annotations

from collections import defaultdict
from math import log2
from time import perf_counter
from typing import Iterable

from strategy_dictionary import ALPHABET, FREQUENCY_ORDER, DictionaryBot


class PlanningLimit(Exception):
    """Search stopped before proving an optimum."""


class OptimalBot(DictionaryBot):
    """Maximize wins over a finite, uniformly distributed training dictionary.

Only a fully explored state is cached as exact. A time/node cutoff falls back
to the existing dictionary policy; it is never reported as an exact answer.
"""

    def __init__(self, words: Iterable[str] | None = None, *,
                 seconds: float = 1.0, node_limit: int = 100000) -> None:
        super().__init__(words=words)
        self.seconds = seconds
        self.node_limit = node_limit
        self._values: dict[tuple[tuple[int, ...], int], tuple[int, int, int]] = {}
        self._partitions: dict[tuple[int, ...], tuple] = {}
        self._deadline = float("inf")
        self._nodes = 0
        self.last_exact = False

    def _actions(self, candidates: tuple[int, ...]) -> tuple:
        cached = self._partitions.get(candidates)
        if cached is not None:
            return cached
        actions = []
        equivalent = set()
        count = len(candidates)
        for letter in range(26):
            groups = self._groups(candidates, letter)
            if len(groups) <= 1:
                # Absent letters spend a life without information; constant
                # correct letters can be filled in after identifying the word.
                continue
            misses = groups.get(0, ())
            children = tuple(sorted((mask, group) for mask, group in groups.items()))
            signature = (misses, tuple(sorted(group for mask, group in children if mask)))
            if signature in equivalent:
                continue
            equivalent.add(signature)
            entropy = -sum(len(group) / count * log2(len(group) / count)
                           for _, group in children)
            actions.append((letter, children, len(misses), entropy))
        actions.sort(key=lambda a: (a[2] / count - 0.15 * a[3],
                                   FREQUENCY_ORDER.index(ALPHABET[a[0]])))
        result = tuple(actions)
        self._partitions[candidates] = result
        return result

    def _solve(self, candidates: tuple[int, ...], lives: int) -> tuple[int, int, int]:
        key = candidates, lives
        if key in self._values:
            return self._values[key]
        self._nodes += 1
        if self._nodes > self.node_limit or (self._nodes % 128 == 0 and perf_counter() > self._deadline):
            raise PlanningLimit
        count = len(candidates)
        if lives <= 0:
            return 0, 0, -1
        if count <= 1:
            return count, count * lives, -1
        actions = self._actions(candidates)
        # An informative guaranteed hit is free. Taking it first cannot reduce
        # either objective, and every child has strictly fewer candidates.
        safe = next((a for a in actions if a[2] == 0), None)
        if safe:
            actions = (safe,)
        best = (-1, -1, -1)
        for letter, children, misses, _ in actions:
            # Even perfect continuations cannot recover these immediate misses.
            upper_wins = count - (misses if lives == 1 else 0)
            upper_lives = (count - misses) * lives + (misses * (lives - 1) if lives > 1 else 0)
            if (upper_wins, upper_lives) <= best[:2]:
                continue
            wins = saved = 0
            pending = count
            for mask, group in sorted(children, key=lambda branch: (branch[0] != 0, -len(branch[1]))):
                value = self._solve(group, lives - int(mask == 0))
                wins += value[0]
                saved += value[1]
                pending -= len(group)
                if (wins + pending, saved + pending * lives) <= best[:2]:
                    break
            else:
                if (wins, saved) > best[:2]:
                    best = wins, saved, letter
        if best[0] < 0:
            # Distinct cleaned words always have an informative letter.
            raise AssertionError("candidate set has no distinguishing letter")
        self._values[key] = best
        return best

    def solve_bank(self, *, lives: int = 6, seconds: float = 60.0,
                   node_limit: int = 1000000) -> list[dict]:
        """Prove each length's optimum, explicitly marking any search cutoff."""
        old_limit = self.node_limit
        self.node_limit = node_limit
        rows = []
        try:
            for length, indexes in sorted(self._by_length.items()):
                start = perf_counter()
                self._nodes = 0
                self._deadline = start + seconds
                try:
                    wins, saved, action = self._solve(tuple(indexes), lives)
                    row = dict(length=length, words=len(indexes), exact=True,
                               wins=wins, remaining_lives_sum=saved,
                               first_informative_letter=ALPHABET[action] if action >= 0 else None)
                except PlanningLimit:
                    row = dict(length=length, words=len(indexes), exact=False)
                rows.append(dict(row, states=self._nodes, seconds=perf_counter() - start))
        finally:
            self.node_limit = old_limit
            self._deadline = float("inf")
        return rows

    def choose_letter(self, state: dict) -> str:
        pattern, guessed, lives = self._read_state(state)
        candidates = self._candidate_indexes(pattern, guessed)
        self.last_exact = False
        if not candidates:
            return super().choose_letter(state)
        available = [c for c in FREQUENCY_ORDER if c not in guessed]
        if not available:
            raise RuntimeError("no unused letters remain")
        common = self._letters[candidates[0]]
        for index in candidates[1:]:
            common &= self._letters[index]
        safe = [c for c in available if common & (1 << (ord(c) - 97))]
        if safe:
            # Certain hits preserve wins and lives even when search is bounded.
            return max(safe, key=lambda c: self._letter_rank(candidates, ord(c) - 97, lives))
        self._nodes = 0
        self._deadline = perf_counter() + self.seconds
        try:
            _, _, action = self._solve(candidates, lives)
            self.last_exact = True
            if action >= 0 and ALPHABET[action] in available:
                return ALPHABET[action]
        except PlanningLimit:
            pass
        return super().choose_letter(state)
