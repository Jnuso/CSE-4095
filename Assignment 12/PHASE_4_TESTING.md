# Phase 4 testing guide

Phase 4 implements arithmetic services, not question cards. The website should still show the Phase 3 configuration screen. Multiple-choice answers follow in Phase 5; visible cards follow in Phase 6.

## Run the checks

Open PowerShell in `Assignment 12/math-practice-app`.

```powershell
npm.cmd run check
```

Expected: formatting and lint pass, **60 tests pass across four files**, and the production build succeeds. This command checks the earlier navigation/configuration work as well as the new generator.

To see only the new tests with descriptive names:

```powershell
npm.cmd test -- src/services/questionGenerator.test.ts src/utils/random.test.ts --reporter=verbose
```

Expected: **41 tests pass**. Read the names to identify the four operations, difficulty boundaries, mixed selection, invalid configuration, and utility checks.

## What to inspect

- [ ] Addition endpoints are 0–10, 0–50, 0–100, and 0–1000; Beginner/Easy results cannot exceed 20/100.
- [ ] Subtraction allows zero and orders operands to avoid negative answers.
- [ ] Multiplication respects each difficulty's factor ranges, including one-digit/two-digit combinations.
- [ ] Division never uses zero as a divisor and produces whole-number answers; Intermediate dividends never exceed 144.
- [ ] Mixed mode chooses only enabled operations; invalid or duplicate selections are rejected.
- [ ] Random integers include endpoints; shuffling preserves inputs; UUID samples are distinct.
- [ ] Failed random sources produce an error instead of a fabricated question or unbounded retry.

The tests use controlled random inputs so their success does not depend on luck. The 1,600-question sample complements explicit boundary checks; it is not an exhaustive proof or a statistical fairness test.

## Optional website regression check

```powershell
npm.cmd run dev
```

Open <http://127.0.0.1:5173/>. Choose Practice, select operations/difficulty/length, and start. Confirm your selected configuration still appears and Edit choices restores it. No generated question is displayed yet. Stop the server with Ctrl+C when finished. If a server already occupies port 5173, use its existing page or stop it in its own terminal first.

## Report evidence

Save successful check output and describe why division is built by multiplying a divisor and quotient. Explain that Phase 4 questions have empty `choices` arrays pending Phase 5 and are not yet ready to render as multiple-choice cards. The unchecked boxes above are for your independent verification.
