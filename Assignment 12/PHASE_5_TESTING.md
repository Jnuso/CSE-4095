# Phase 5 testing guide

This phase adds answer-choice data. The page still shows the Phase 3 configuration flow; clickable cards follow in Phase 6.

## Run the checks

Open PowerShell in `Assignment 12/math-practice-app` and run:

```powershell
npm.cmd run check
```

Expected: formatting, lint, tests, TypeScript, and the production build all pass. The suite contains **89 tests across five files**, including earlier navigation and configuration tests.

For detailed names of the new choice tests:

```powershell
npm.cmd test -- src/services/answerChoices.test.ts --reporter=verbose
```

Expected: **29 tests pass**.

## Independent checklist

- [ ] Each generated question has four distinct choices, exactly one equal to the correct answer.
- [ ] Wrong answers never equal the correct answer and contain no fractions or negative values.
- [ ] Addition/subtraction mistakes, neighboring multiplication facts, division fact-family confusion, and nearby values appear in candidate tests.
- [ ] Answers of zero and one work for every operation.
- [ ] A constant random source still finishes; random candidate selection stops after at most 12 attempts, then fills from remaining candidates.
- [ ] The shuffle test can place the correct answer in each of the four positions.
- [ ] All 16 operation/difficulty combinations pass repeated generation checks.
- [ ] Invalid choice sets and invalid random sources are rejected.

The tests use controlled inputs and reproducible sequences. They verify shuffle behavior and varied examples, not a statistical proof of perfect randomness or a pedagogical evaluation of every distractor.

## Optional website regression check

Run `npm.cmd run dev` and open <http://127.0.0.1:5173/>. Select operations, difficulty, and session length, then start and use Edit choices. Your configuration should still arrive and restore correctly. No answer buttons are visible in this phase. Stop your server with Ctrl+C when finished.

## Report evidence

Save successful test output. Explain how a Set prevents duplicate answers, filtering removes invalid values, bounded selection prevents endless retries, and Fisher–Yates shuffles all four choices. The main generator now returns complete multiple-choice data; the operation-specific generators remain arithmetic drafts with empty choices. These boxes are for the student's own verification.
