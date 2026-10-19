**Review Findings**

**Change A (attempt.ts)**
- **File/Line:** `attempt.ts:6`
- **Input:** `selectedAnswer = 0`
- **Actual:** `null`
- **Required:** `{ questionId, selectedAnswer: 0 }`
- **Fix:** Revert to `if (selectedAnswer === null)`. The change to a falsy check (`!selectedAnswer`) incorrectly treats the valid numeric answer `0` as a null selection, violating the contract that zero must create an attempt.

**Change B (history.ts)**
- No findings. The implementation uses `toSorted`, which satisfies the requirement for a new array (non-mutating) and utilizes ES2023's stable sorting to maintain input order on tied timestamps.
