# Phase 13: Similar question generator review guide

Live app: https://jnuso.github.io/CSE-4095/

This phase implements the service used by the next phase. There is no new review-mode button yet. Regular practice and stored mistakes should behave as before. Similar-question sessions, prioritization and mastery gains remain Phase 14 work.

## What the service does

Given a valid saved mistake, generateSimilarQuestion returns a new question with four unique answer choices, source mistake-review, and the related mistake-pattern ID. It preserves the pattern difficulty and never returns the original exact operation/ordered operands.

It chooses among currently valid strategies: nearby operands (within two), reversed operands for addition/multiplication, and inverse fact families. Division nearby questions vary divisor/quotient within two and reconstruct the dividend so the answer stays whole. Reversals and inverse facts are filtered by existing operation-specific difficulty rules; invalid inverses are skipped rather than changing difficulty. For example, Level 1 4×3 can produce 12÷3 or 12÷4, but Level 1 10+10 cannot produce subtraction with operand 20 because that exceeds the level's operand range.

The caller supplies recent questions oldest-to-newest. The generator avoids the last ten facts when possible. If all valid candidates have appeared recently, it reuses the least recently seen candidate. There are no unbounded retries or hidden global history. The future session builder must pass its recent list. Original exact facts are always excluded. Level 3/4 multiplication operand bounds remain asymmetric, so some reversals are intentionally unavailable. Saved mistakes and recent questions are never modified by generation.

## Student browser review

1. Open the live app in a private window, start a five-question practice session and mark three right/two wrong. Expect 5 attempted, 3 right, 2 wrong, 60%.
2. Refresh the recap, visit Statistics and save a Settings preference. Counts should not increase just because of reload/settings changes.
3. Check card flipping, answer choices, right/wrong buttons and navigation still work on desktop and your phone. Histories are separate across devices.
4. The new generator has no visible control yet. Its exact strategies/boundaries are checked automatically; Phase 14 will make the related questions available through review mode.

## Automatic generator checks

From math-practice-app:

```powershell
npm.cmd run test -- src/services/similarQuestionGenerator.test.ts
npm.cmd run check:all
```

The focused tests exercise every operation/level, actual minima/maxima and independent arithmetic bounds, nearby relationships, both allowed reversals, all four inverse directions, zero and equal operands, invalid inverses, asymmetric multiplication, all strategy selection paths, complete answer choices/metadata, repeat avoidance and exhausted pools, unique IDs, immutability and invalid inputs/random sources. The complete gate preserves existing browser/accessibility/storage/restart/Pages coverage. Actual outcomes and review limitations are in DEVELOPMENT_LOG.md, not inferred from test existence.
