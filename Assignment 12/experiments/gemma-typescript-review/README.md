# Gemma TypeScript diff review

This second isolated evaluation tests static TypeScript review using the existing Gemma review worker. It does not change the React app or establish React/browser-review ability.

## Protocol

One new review job, hard limit of one model call, no retry/resume. All source context and requirements are included in a compact request; the model receives a diff without the private scoring key. Request no tools, edits, or generated tests, and a concise final report. Only synthetic examples are sent. The worker still uses its required Docker environment; TypeScript verification is performed locally against our own fixtures, using the existing app compiler.

Before submission, confirm at least 60 seconds have elapsed since the previous Gemma job finished. Status/result retrieval does not call the model. One-call job caps prevent additional requests within this experiment; they do not install a global rate limiter.

## Requirements sent to the reviewer

- `buildAttempt`: questionId is a nonempty string; selectedAnswer is null or a nonnegative integer up to 1,000,000. Null means no answer. Every numeric value, including zero, must create an attempt containing the same questionId and selectedAnswer. Return null only for no answer.
- `retainRecent`: IDs are unique; savedAt values are finite integer timestamps from 0 through 1,000,000,000,000. Inputs may be unsorted. Limit is an integer 1 through 100. Return a new list containing the newest entries first, capped to the limit, preserving input order for equal timestamps. Do not mutate the input list or entries. A deep copy of entries is not required. Runtime supports ES2023, including Array.prototype.toSorted.

Inspect changes A and B independently. Flag only regressions introduced by the diff, with location, concrete input, actual versus required output, and a brief correction. Say no findings for a change that meets its contract. Do not flag styles or behavior outside the contracts.

## Private scoring key (not sent)

| Change          | Expected              | Evidence                                                                                                                |
| --------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A: buildAttempt | One introduced defect | `buildAttempt('q1', 0)` incorrectly returns null after the change. Explicit null checking preserves valid zero answers. |
| B: retainRecent | No findings           | toSorted preserves descending order, stable ties, new-list behavior, and nonmutation in the specified ES2023 runtime.   |

Run `node verify-ground-truth.mjs` here. It strictly compiles the actual before/after fixtures and checks their behavior. These are characterization assertions for intentionally defective examples, not application tests. Generated compiler output is ignored.

## Outcome

Completed October 19, 2026 with `gemma-4-26b-a4b-it`, review job `6f06a0acd7494f0196c2807be1455ea9`. One model call, no retry/resume, no model tools, and no changed files. Whole-job duration was approximately 60 seconds including Docker preparation and verification, not pure model response latency. The previous job had finished more than three minutes before submission. Token usage was not exposed.

| Measure                                       | Result                                        |
| --------------------------------------------- | --------------------------------------------- |
| Seeded regressions detected                   | 1 of 1                                        |
| False-positive findings on the correct change | 0                                             |
| Counterexample                                | Correct: selectedAnswer = 0 is dropped        |
| Suggested correction                          | Correct: restore explicit null comparison     |
| File location                                 | Correct: attempt.ts                           |
| Exact line location                           | Off by one: reported 6, faulty condition is 7 |
| API calls                                     | 1                                             |

The reviewer correctly identified the falsy-value regression in A and accepted B under the supplied ES2023 contract. It did not confuse the runtime with an older environment or invent a mutation issue. Its numeric line citation was one line early; the unmodified response preserves this error. These findings were manually compared with the diff and local executable assertions.

The existing worker is Python-oriented and its mandatory Docker baseline/final pytest collected zero tests for this inline text-review job. Therefore `verified: false` is preserved. Our local TypeScript compilation and fixture assertions passed separately; no application tests are claimed from this experiment, and no external model output was executed or integrated.

Artifacts: `review.diff` is the synthetic before/after comparison; `request.txt` is the exact submitted assignment, to which the service prepends its normal worker instructions; `response.md` preserves the returned review; `worker-result.json` and `score.json` hold evidence and scoring; `local-verification.txt` records the executable checks. The answer key and local test script were not sent.

## Comparison and next use

| Experiment           | Seeded bugs found | False positives on correct examples | Model calls |
| -------------------- | ----------------- | ----------------------------------- | ----------- |
| Python smoke test    | 2/2               | 0 across 2 controls                 | 1           |
| TypeScript diff test | 1/1               | 0 across 1 correct change           | 1           |

These are three deliberately small bugs with explicit requirements, not a representative benchmark or a general accuracy estimate. The TypeScript result supports further trials as a secondary reviewer for small, self-contained diffs. It does not demonstrate React lifecycle, browser, repository-wide, or multi-turn review quality. The current application test gate and review workflow remain in place; this experiment does not automatically replace the reviewer or configure a global rate limiter.
