"""Dictionary Hangman player using only the public game state.

Filtering enforces *all* revealed occurrences of every guessed letter.  With
few candidate words, a bounded decision-tree search maximizes expected wins,
then lives saved.  Larger pools use hit probability and information gain, with
cached policy rollouts to avoid branches that would run out of lives.  An
interpolated character model provides guesses when the dictionary has no match.

Pass ``words=training_words`` to train exclusively on a benchmark's training
split; omitted words load the assignment's three supplied word lists.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from functools import lru_cache
from math import log2
from pathlib import Path
from typing import Iterable


ALPHABET = "abcdefghijklmnopqrstuvwxyz"
FREQUENCY_ORDER = "etaoinshrdlucmfwypvbgkjqxz"


class _SearchLimit(Exception):
    pass


class DictionaryBot:
    """Candidate elimination, life-aware endgames, and character backoff."""

    def __init__(self, words: Iterable[str] | None = None) -> None:
        if words is None:
            directory = Path(__file__).resolve().parent / "bot_examples" / "words"
            words = (line for path in sorted(directory.glob("*.txt"))
                     for line in path.read_text(encoding="utf-8").splitlines())
        self.words = tuple(sorted({w.strip().lower() for w in words
                                   if w.strip().isascii() and w.strip().isalpha()}))
        self._by_length: dict[int, list[int]] = defaultdict(list)
        self._positions: list[tuple[int, ...]] = []
        self._letters: list[int] = []
        self._contexts: dict[tuple[str, str], Counter[str]] = defaultdict(Counter)
        self._length_positions: dict[tuple[int, int], Counter[str]] = defaultdict(Counter)
        self._global = Counter()
        self._search_nodes = 0
        for index, word in enumerate(self.words):
            positions = [0] * 26
            for position, letter in enumerate(word):
                positions[ord(letter) - 97] |= 1 << position
                self._length_positions[(len(word), position)][letter] += 1
                self._global[letter] += 1
                padded = "^^" + word + "$$"
                target = position + 2
                for left in range(3):
                    for right in range(3):
                        context = (padded[target - left:target],
                                   padded[target + 1:target + 1 + right])
                        self._contexts[context][letter] += 1
            self._positions.append(tuple(positions))
            self._letters.append(sum(1 << i for i, mask in enumerate(positions) if mask))
            self._by_length[len(word)].append(index)

    @staticmethod
    def _read_state(state: dict) -> tuple[str, set[str], int]:
        pattern = "".join(str(state.get("pattern", "")).lower().split())
        pattern = "".join(c if c in ALPHABET else "_" for c in pattern)
        guessed = set(state.get("guessed_letters") or [])
        guessed.update(state.get("incorrect_letters") or [])
        guessed.update(c for c in pattern if c in ALPHABET)
        guessed = {str(c).lower() for c in guessed if str(c).lower() in ALPHABET}
        return pattern, guessed, max(1, int(state.get("remaining_guesses", 6)))

    def choose_letter(self, state: dict) -> str:
        pattern, guessed, lives = self._read_state(state)
        available = [letter for letter in FREQUENCY_ORDER if letter not in guessed]
        if not available:
            raise RuntimeError("no unused letters remain")
        candidates = self._candidate_indexes(pattern, guessed)
        guessed_indexes = [ord(letter) - 97 for letter in guessed]
        if not candidates:
            return self._fallback(pattern, guessed, available)
        guessed_mask = sum(1 << letter for letter in guessed_indexes)
        common = self._letters[candidates[0]]
        for index in candidates[1:]:
            common &= self._letters[index]
        safe = common & ~guessed_mask
        if safe:
            # Certain hits never spend lives. Prefer ones that distinguish words.
            return max((c for c in available if safe & (1 << (ord(c) - 97))),
                       key=lambda c: self._letter_rank(candidates, ord(c) - 97, lives))
        if len(candidates) <= 12:
            self._search_nodes = 0
            try:
                _, _, letter = self._plan(candidates, guessed_mask, lives)
                if letter >= 0:
                    return ALPHABET[letter]
            except _SearchLimit:
                return max(available, key=lambda c: self._letter_rank(candidates, ord(c) - 97, lives))
        actions = sorted((ord(c) - 97 for c in available),
                         key=lambda letter: self._letter_rank(candidates, letter, lives),
                         reverse=True)
        baseline = self._rollout(candidates, guessed_mask, lives)
        if baseline[0] == len(candidates):
            return ALPHABET[actions[0]]
        # One-step policy improvement: preserve wins before optimizing lives.
        # Only a few plausible alternatives need exploring for a rare bad branch.
        best, action = baseline, actions[0]
        for letter in actions[1:6]:
            values = [self._rollout(group, guessed_mask | (1 << letter), lives - int(not mask))
                      for mask, group in self._groups(candidates, letter).items()]
            score = sum(value[0] for value in values), sum(value[1] for value in values)
            if score > best:
                best, action = score, letter
            if best[0] == len(candidates):
                break
        return ALPHABET[action]

    def candidate_words(self, state: dict) -> tuple[str, ...]:
        """Expose exact public-state matches for an ensemble or diagnostics."""
        pattern, guessed, _ = self._read_state(state)
        return tuple(self.words[index] for index in self._candidate_indexes(pattern, guessed))

    def _candidate_indexes(self, pattern: str, guessed: set[str]) -> tuple[int, ...]:
        observed = [0] * 26
        for position, letter in enumerate(pattern):
            if letter in ALPHABET:
                observed[ord(letter) - 97] |= 1 << position
        guessed_indexes = [ord(letter) - 97 for letter in guessed]
        return tuple(index for index in self._by_length.get(len(pattern), [])
                     if all(self._positions[index][letter] == observed[letter]
                            for letter in guessed_indexes))

    def _groups(self, candidates: tuple[int, ...], letter: int) -> dict[int, tuple[int, ...]]:
        groups: dict[int, list[int]] = defaultdict(list)
        for index in candidates:
            groups[self._positions[index][letter]].append(index)
        return {mask: tuple(group) for mask, group in groups.items()}

    def _letter_rank(self, candidates: tuple[int, ...], letter: int, lives: int) -> tuple:
        groups = self._groups(candidates, letter)
        total = len(candidates)
        hit = 1 - len(groups.get(0, ())) / total
        entropy = -sum((len(group) / total) * log2(len(group) / total)
                       for group in groups.values())
        # Information has more value while there is room to recover from misses.
        score = hit + (0.035 * min(lives, 6)) * entropy
        reveals = sum(self._positions[index][letter].bit_count() for index in candidates) / total
        return score, hit, entropy, reveals, -FREQUENCY_ORDER.index(ALPHABET[letter])

    @lru_cache(maxsize=50000)
    def _rollout(self, candidates: tuple[int, ...], guessed: int, lives: int) -> tuple[int, int]:
        """Evaluate the base policy over candidate hypotheses, never hidden state.

        This is a local simulation of the supplied dictionary.  It lets a common
        opening be rejected if its later ambiguity would cost a win, even when
        that opening has a slightly better immediate chance of revealing a letter.
        """
        if lives <= 0:
            return 0, 0
        union = 0
        common = self._letters[candidates[0]]
        for index in candidates:
            union |= self._letters[index]
            common &= self._letters[index]
        remaining = union & ~guessed
        if not remaining:
            return len(candidates), lives * len(candidates)
        if len(candidates) <= 12:
            self._search_nodes = 0
            try:
                return self._plan(candidates, guessed, lives)[:2]
            except _SearchLimit:
                pass
        safe = common & remaining
        letter = max((i for i in range(26) if (safe or remaining) & (1 << i)),
                     key=lambda i: self._letter_rank(candidates, i, lives))
        values = [self._rollout(group, guessed | (1 << letter), lives - int(not mask))
                  for mask, group in self._groups(candidates, letter).items()]
        return sum(value[0] for value in values), sum(value[1] for value in values)

    @lru_cache(maxsize=50000)
    def _plan(self, candidates: tuple[int, ...], guessed: int, lives: int) -> tuple[int, int, int]:
        """Return total wins, total remaining lives, and best action over words."""
        self._search_nodes += 1
        if self._search_nodes > 18000:
            raise _SearchLimit
        if lives <= 0:
            return 0, 0, -1
        union = 0
        common = self._letters[candidates[0]]
        for index in candidates:
            union |= self._letters[index]
            common &= self._letters[index]
        remaining = union & ~guessed
        if not remaining:
            return len(candidates), lives * len(candidates), -1
        if len(candidates) == 1:
            letter = max((i for i in range(26) if remaining & (1 << i)),
                         key=lambda i: self._positions[candidates[0]][i].bit_count())
            return 1, lives, letter
        safe = common & remaining
        letters = [i for i in range(26) if (safe or remaining) & (1 << i)]
        letters.sort(key=lambda i: self._letter_rank(candidates, i, lives), reverse=True)
        # All guaranteed hits can be taken first, without sacrificing wins/lives.
        if safe:
            letters = letters[:1]
        best = (-1, -1, -1)
        seen_partitions = set()
        for letter in letters:
            groups = self._groups(candidates, letter)
            partition = (groups.get(0, ()), tuple(sorted(group for mask, group in groups.items() if mask)))
            if partition in seen_partitions:
                continue
            seen_partitions.add(partition)
            wins = saved = 0
            for mask, group in groups.items():
                if not mask and lives == 1:
                    continue
                value = self._plan(group, guessed | (1 << letter), lives - int(not mask))
                wins += value[0]
                saved += value[1]
            if (wins, saved) > best[:2]:
                best = (wins, saved, letter)
            # Every candidate won without a miss: this is a global upper bound.
            if wins == len(candidates) and saved == lives * len(candidates):
                break
        return best

    def _fallback(self, pattern: str, guessed: set[str], available: list[str]) -> str:
        """Estimate missing characters from short surrounding letter contexts."""
        miss_probability = {letter: 1.0 for letter in available}
        padded = "^^" + pattern + "$$"
        for position, known in enumerate(pattern):
            if known != "_":
                continue
            target = position + 2
            left = padded[max(0, target - 2):target].split("_")[-1]
            right = padded[target + 1:target + 3].split("_")[0]
            probability = {letter: self._global[letter] + 1.0 for letter in available}
            norm = sum(probability.values())
            probability = {letter: count / norm for letter, count in probability.items()}
            positional = self._length_positions.get((len(pattern), position), {})
            total = sum(positional.get(letter, 0) for letter in available)
            if total:
                probability = {letter: .55 * probability[letter] + .45 * positional.get(letter, 0) / total
                               for letter in available}
            # Back off from sparse long contexts to better-supported short ones.
            contexts = [(left[-l:] if l else "", right[:r])
                        for l in range(len(left) + 1) for r in range(len(right) + 1)
                        if l + r]
            contexts.sort(key=lambda context: (sum(map(len, context)), len(context[0])))
            for context in contexts:
                counts = self._contexts.get(context, {})
                total = sum(counts.get(letter, 0) for letter in available)
                if not total:
                    continue
                weight = total / (total + 12)
                probability = {letter: (1 - weight) * probability[letter]
                               + weight * counts.get(letter, 0) / total for letter in available}
            for letter in available:
                miss_probability[letter] *= 1 - probability[letter]
        return min(available, key=lambda letter: (miss_probability[letter], FREQUENCY_ORDER.index(letter)))
