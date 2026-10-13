"""Dictionary and character-context Hangman strategy.

The only game input is the public state.  Training uses the supplied word lists
and, when present, a separately downloaded public English word list.  No server
word, game log, replay, or evaluation result is used by this strategy.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from functools import lru_cache
from math import exp, log2
from pathlib import Path
from typing import Any, Iterable


ALPHABET = "abcdefghijklmnopqrstuvwxyz"
FREQUENCY_ORDER = "etaoinshrdlucmfwypvbgkjqxz"


class GeneralBot:
    """Filter exact candidates, then use contexts if the word is unfamiliar."""

    def __init__(self, words: Iterable[str] | None = None) -> None:
        if words is None:
            root = Path(__file__).resolve().parent
            files = list((root / "bot_examples" / "words").glob("*.txt"))
            extra = root / "data" / "english_words.txt"
            if extra.is_file():
                files.append(extra)
            words = (line for file in files for line in file.read_text(encoding="utf-8").splitlines())
        clean = sorted({str(word).strip().lower() for word in words
                        if str(word).strip().isascii() and str(word).strip().isalpha()})
        self.words = tuple(clean)
        self.gapped_context_weight = 1.0
        self.relaxed_weight = 0.2
        self.entropy_weight = 0.12
        self.small_tree_limit = 12
        self.by_length: dict[int, list[str]] = defaultdict(list)
        self.position_counts: dict[int, list[Counter[str]]] = {}
        self.ngrams: dict[int, Counter[str]] = {size: Counter() for size in range(1, 5)}
        for word in self.words:
            size = len(word)
            self.by_length[size].append(word)
            if size not in self.position_counts:
                self.position_counts[size] = [Counter() for _ in word]
            for position, letter in enumerate(word):
                self.position_counts[size][position][letter] += 1
            marked = "^" + word + "$"
            for order, counts in self.ngrams.items():
                counts.update(marked[start:start + order]
                              for start in range(len(marked) - order + 1))
        global_counts = self.ngrams[1]
        total = sum(global_counts[letter] for letter in ALPHABET)
        self.base_prob = {letter: (global_counts[letter] + 1) / (total + 26)
                          for letter in ALPHABET}
        self._rank = {letter: index for index, letter in enumerate(FREQUENCY_ORDER)}
        self._candidate_cache: dict[tuple[str, frozenset[str]], tuple[str, ...]] = {}
        self._choice_cache: dict[tuple[str, frozenset[str], int], str] = {}
        # Four-character fragments can also supply evidence across a gap, e.g.
        # "^_a_". Index each character position with a compact integer bitset.
        grams = tuple(self.ngrams[4])
        self._fragments = grams
        self._fragment_weights = tuple(self.ngrams[4][gram] for gram in grams)
        buffers = {(position, letter): bytearray((len(grams) + 7) // 8)
                   for position in range(4) for letter in ALPHABET + "^$"}
        for index, gram in enumerate(grams):
            for position, letter in enumerate(gram):
                buffers[position, letter][index // 8] |= 1 << (index % 8)
        self._fragment_index = {key: int.from_bytes(buffer, "little")
                                for key, buffer in buffers.items()}
        self._fragment_all = (1 << len(grams)) - 1
        self._fragment_cache: dict[tuple[str, frozenset[str], int], dict[str, float]] = {}

    @staticmethod
    def _parse(state: dict[str, Any]) -> tuple[str, set[str], int]:
        raw = state.get("pattern", "")
        raw = "".join(raw) if isinstance(raw, (tuple, list)) else str(raw)
        pattern = "".join(char if char in ALPHABET else "_"
                          for char in raw.lower() if not char.isspace())
        guessed = {str(letter).lower() for letter in (state.get("guessed_letters") or [])
                   if str(letter).lower() in ALPHABET and len(str(letter)) == 1}
        guessed.update(char for char in pattern if char in ALPHABET)
        guessed.update(str(letter).lower() for letter in (state.get("incorrect_letters") or [])
                       if str(letter).lower() in ALPHABET and len(str(letter)) == 1)
        lives = int(state.get("remaining_guesses", 6))
        return pattern, guessed, max(1, min(6, lives))

    def _candidates(self, pattern: str, guessed: set[str]) -> tuple[str, ...]:
        key = (pattern, frozenset(guessed))
        cached = self._candidate_cache.get(key)
        if cached is not None:
            return cached
        result = tuple(word for word in self.by_length.get(len(pattern), ())
                       if all(actual == known if known != "_" else actual not in guessed
                              for actual, known in zip(word, pattern)))
        if len(self._candidate_cache) > 12000:
            self._candidate_cache.clear()
        self._candidate_cache[key] = result
        return result

    def _context_prediction(self, pattern: str, available: list[str]) -> dict[str, float]:
        """Predict letter presence from word position and adjacent known letters."""
        absent_probability = {letter: 1.0 for letter in available}
        marked = "^" + pattern + "$"
        profiles = self.position_counts.get(len(pattern))
        for position, known in enumerate(pattern):
            if known != "_":
                continue
            values = {letter: self.base_prob[letter] for letter in available}
            if profiles:
                profile = profiles[position]
                total = sum(profile.values())
                if total:
                    for letter in available:
                        values[letter] += 0.8 * profile[letter] / total
            center = position + 1
            left = ""
            right = ""
            for distance in range(1, 4):
                index = center - distance
                if index < 0 or marked[index] == "_":
                    break
                left = marked[index] + left
            for distance in range(1, 4):
                index = center + distance
                if index >= len(marked) or marked[index] == "_":
                    break
                right += marked[index]
            for left_size in range(min(3, len(left)) + 1):
                for right_size in range(min(3 - left_size, len(right)) + 1):
                    specificity = left_size + right_size
                    if not specificity:
                        continue
                    before = left[-left_size:] if left_size else ""
                    after = right[:right_size]
                    counts = self.ngrams[specificity + 1]
                    observed = {letter: counts[before + letter + after] for letter in available}
                    total = sum(observed.values())
                    if not total:
                        continue
                    weight = (2.5 ** specificity) * total / (total + 4)
                    for letter in available:
                        values[letter] += weight * observed[letter] / total
            # Include short contexts with an intervening blank. This recognizes
            # partial syllables that a contiguous character model cannot see.
            forbidden = frozenset(set(ALPHABET).difference(available))
            fragment_starts = (range(max(0, center - 3), min(center + 1, len(marked) - 3))
                               if self.gapped_context_weight else ())
            for start in fragment_starts:
                fragment = marked[start:start + 4]
                local_position = center - start
                known_count = 4 - fragment.count("_")
                if known_count < 2 or "_" not in fragment:
                    continue
                # Contiguous known letters already have stronger evidence above.
                if all(char != "_" for index, char in enumerate(fragment) if index != local_position):
                    continue
                key = (fragment, forbidden, local_position)
                predicted = self._fragment_cache.get(key)
                if predicted is None:
                    matches = self._fragment_all
                    for index, char in enumerate(fragment):
                        if char != "_":
                            matches &= self._fragment_index[index, char]
                        else:
                            excluded = self._fragment_index[index, "^"] | self._fragment_index[index, "$"]
                            for char in forbidden:
                                excluded |= self._fragment_index[index, char]
                            matches &= ~excluded
                    predicted = {letter: 0.0 for letter in available}
                    total = 0
                    while matches:
                        bit = matches & -matches
                        index = bit.bit_length() - 1
                        char = self._fragments[index][local_position]
                        frequency = self._fragment_weights[index]
                        predicted[char] += frequency
                        total += frequency
                        matches ^= bit
                    if total:
                        weight = (2.0 ** known_count) * total / (total + 10)
                        predicted = {letter: weight * value / total
                                     for letter, value in predicted.items()}
                    self._fragment_cache[key] = predicted
                for letter in available:
                    values[letter] += self.gapped_context_weight * predicted.get(letter, 0.0)
            total = sum(values.values()) or 1.0
            for letter in available:
                absent_probability[letter] *= 1.0 - values[letter] / total
        return {letter: 1.0 - absent_probability[letter] for letter in available}

    def _relaxed_prediction(self, pattern: str, guessed: set[str],
                            available: list[str]) -> dict[str, float]:
        """Use partial relatives of unfamiliar words without treating them as exact."""
        if not any(char != "_" for char in pattern):
            return {}
        scored: list[tuple[float, str]] = []
        incorrect = guessed.difference(pattern)
        best = float("inf")
        for word in self.by_length.get(len(pattern), ()):
            mismatch = sum(known != "_" and known != actual
                           for known, actual in zip(pattern, word))
            hidden_known = sum(known == "_" and actual in guessed
                               for known, actual in zip(pattern, word))
            cost = 2.0 * mismatch + 1.2 * len(set(word).intersection(incorrect)) + hidden_known
            best = min(best, cost)
            scored.append((cost, word))
        if not scored or best > 5:
            return {}
        counts = {letter: 0.0 for letter in available}
        total = 0.0
        for cost, word in scored:
            if cost > best + 2:
                continue
            weight = exp(-(cost - best))
            total += weight
            for letter in set(word).intersection(available):
                counts[letter] += weight
        return {letter: value / total for letter, value in counts.items()} if total else {}

    def _small_tree(self, candidates: tuple[str, ...], available: list[str],
                    lives: int, heuristic: dict[str, float]) -> str | None:
        """Find maximum win probability in a small exact candidate tree.

        Ties prefer more remaining lives.  The search is capped so decisions
        remain responsive.  A guessed letter is homogeneous inside the observed
        subset, so it cannot split that subset and is safely skipped below.
        """
        if not 2 <= len(candidates) <= self.small_tree_limit:
            return None
        n = len(candidates)
        full = (1 << n) - 1
        outcomes: dict[str, tuple[tuple[int, int], ...]] = {}
        for letter in available:
            groups: dict[int, int] = defaultdict(int)
            for index, word in enumerate(candidates):
                mask = sum(1 << position for position, char in enumerate(word) if char == letter)
                groups[mask] |= 1 << index
            outcomes[letter] = tuple(groups.items())
        calls = 0

        @lru_cache(maxsize=None)
        def solve(subset: int, remaining: int) -> tuple[int, int]:
            nonlocal calls
            calls += 1
            if calls > 10000:
                raise OverflowError
            count = subset.bit_count()
            if remaining <= 0:
                return 0, 0
            if count <= 1:
                return count, count * remaining
            best_result = (0, 0)
            split_found = False
            for groups in outcomes.values():
                branches = [(mask, members & subset) for mask, members in groups if members & subset]
                if len(branches) <= 1:
                    continue
                split_found = True
                wins = life_sum = 0
                for mask, members in branches:
                    child = solve(members, remaining - (mask == 0))
                    wins += child[0]
                    life_sum += child[1]
                best_result = max(best_result, (wins, life_sum))
            return best_result if split_found else (count, count * remaining)

        try:
            best_letter = None
            best_value: tuple[float, ...] = (-1.0,)
            for letter, groups in outcomes.items():
                if all(mask == 0 for mask, _ in groups):
                    continue
                wins = life_sum = 0
                # A sure correct guess can be made for free, including a letter
                # whose occurrence pattern does not distinguish candidates.
                if len(groups) == 1:
                    mask, _ = groups[0]
                    result = solve(full, lives) if mask else (0, 0)
                    wins, life_sum = result
                else:
                    for mask, members in groups:
                        result = solve(members, lives - (mask == 0))
                        wins += result[0]
                        life_sum += result[1]
                value = (wins, life_sum, heuristic[letter], -self._rank[letter])
                if value > best_value:
                    best_value, best_letter = value, letter
            return best_letter
        except OverflowError:
            return None

    def choose_letter(self, state: dict[str, Any]) -> str:
        pattern, guessed, lives = self._parse(state)
        available = [letter for letter in ALPHABET if letter not in guessed]
        if not available:
            raise RuntimeError("no unused letters remain")
        key = (pattern, frozenset(guessed), lives)
        cached = self._choice_cache.get(key)
        if cached is not None:
            return cached
        candidates = self._candidates(pattern, guessed)
        context = self._context_prediction(pattern, available)
        if candidates:
            count = len(candidates)
            scores: dict[str, float] = {}
            unknown = max(1, pattern.count("_"))
            entropy_weight = self.entropy_weight * lives / 6
            for letter in available:
                masks: Counter[int] = Counter()
                revealed = 0
                for word in candidates:
                    mask = 0
                    for position, char in enumerate(word):
                        if char == letter:
                            mask |= 1 << position
                            revealed += 1
                    masks[mask] += 1
                hit = 1.0 - masks[0] / count
                entropy = -sum((value / count) * log2(value / count) for value in masks.values())
                scores[letter] = (hit + entropy_weight * entropy / max(1.0, log2(count))
                                  + 0.015 * revealed / (count * unknown)
                                  + 0.025 * context.get(letter, 0.0))
            choice = self._small_tree(candidates, available, lives, scores)
            if choice is None:
                choice = max(available, key=lambda letter: (scores[letter], -self._rank[letter]))
        else:
            relaxed = self._relaxed_prediction(pattern, guessed, available)
            scores = {letter: ((1 - self.relaxed_weight) * context.get(letter, 0.0)
                               + self.relaxed_weight * relaxed.get(letter, 0.0))
                      for letter in available}
            choice = max(available, key=lambda letter: (scores[letter], -self._rank[letter]))
        if len(self._choice_cache) > 12000:
            self._choice_cache.clear()
        self._choice_cache[key] = choice
        return choice


if __name__ == "__main__":
    from bot_examples.runner import run_cli
    raise SystemExit(run_cli(GeneralBot(), "Dictionary and context bot"))
