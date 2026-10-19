# Gemma reviewer smoke test

This isolated experiment assesses the existing Gemma review worker with synthetic Python examples related to math practice. It does not change the React app or assess React/browser review ability. No secrets, personal data, or full project snapshots belong in the request.

## Protocol

- One job, review profile, hard limit of one model call; no automatic retry or resume.
- All four function implementations and their requirements are provided together in one compact request. Ask for a direct concise review without tool calls or edits.
- If another model call is ever authorized, wait at least 60 seconds after the previous request finishes before submitting it. Status/result reads do not call the model. This experiment does not change the worker's global rate settings.
- Docker remains required by the existing coding-workers workflow. Do not replace unavailable Docker execution with host execution of generated code.
- Keep expected labels/counterexamples out of the reviewer request. Do not show the answer key until after its response is saved. The model sees neutral function names, not buggy/fixed labels.

## Requirements sent to the reviewer

Accuracy functions: inputs are integers with 0 <= correct <= attempted, up to 1,000,000 attempts. Return the nearest whole-number percentage, rounding .5 upward; return 0 for zero attempts.

Append functions: each attempt has a nonempty string id. IDs uniquely identify attempts. Preserve existing entries; append a new ID once; ignore an existing ID even if other fields differ. Return a new list without mutating the input. No deep-copy requirement.

Review each function independently. Report actionable defects with function name, a concrete counterexample, actual versus required result, and a brief correction. Say no findings for correct functions. Ignore style and behavior outside the stated input contracts.

## Private scoring key (not sent to the reviewer)

| Function   | Expected assessment | Evidence                                                                                                 |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| accuracy_a | Defect              | 2/3 returns 66; requirement is 67. Truncation instead of rounding.                                       |
| accuracy_b | No findings         | Zero-safe rounding, including 1/8 = 13%.                                                                 |
| append_c   | Defect              | Same id with changed correct field appends a duplicate. Uses full-value equality instead of ID equality. |
| append_d   | No findings         | Deduplicates by ID and preserves input list/entries.                                                     |

Run `python verify_ground_truth.py` from this directory to verify the key locally. These are characterization assertions for intentionally defective fixtures, not application regression tests.

Score detected seeded defects out of 2, false-positive findings on the 2 correct controls, validity of counterexamples, response time, reported token usage if available, actual API calls, and whether the worker followed the one-turn request. A four-example smoke test cannot establish general reviewer reliability.

## Status

Completed October 19, 2026 with `gemma-4-26b-a4b-it`, using the existing coding-workers review profile. One API call, no retry/resume, no model tool calls, no edited files. The whole job took about 78 seconds including Docker preparation and verification overhead; this is not pure model response latency. Provider token usage was not exposed in the worker result.

| Measure                                     | Result                                 |
| ------------------------------------------- | -------------------------------------- |
| Seeded defects found                        | 2 of 2                                 |
| False-positive findings on correct controls | 0 across 2 controls                    |
| Concrete counterexamples                    | 2 valid, independently checked locally |
| Model requests                              | 1 total                                |
| Files changed by reviewer                   | 0                                      |

Ground-truth assertions and the returned counterexamples passed when running `python verify_ground_truth.py`. The standalone text-review request did not ask the worker to create project files. Its mandatory Docker pytest checks collected zero tests, so the worker correctly reports `verified: false`; the useful static review is not a passing application test run. No external model output was executed on the host or applied to the React app.

Artifacts: `request.txt` is the exact assignment submitted to the worker (the worker also prepends its built-in specialist instructions); `response.md` is the returned review; `worker-result.json` preserves job/test evidence; `score.json` records the assessment. Keep the original response unchanged when formatting documentation. The local scoring key was not sent.

This is a successful basic smoke test, not a reliable accuracy estimate from a representative dataset. A next experiment could use one small TypeScript diff with one known regression and one correct change, again under an explicit request budget. Larger/multi-turn jobs need a real request-spacing mechanism: the one-call cap here does not add a global rate limiter to the existing worker.
