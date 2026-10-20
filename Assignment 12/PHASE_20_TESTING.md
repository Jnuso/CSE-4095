# Phase 20: testing evidence and remaining manual checks

This phase audits existing coverage and adds the missing complete keyboard-only and reproducible mixed-operation browser flows. Firefox is included at the student's request. No application behavior was changed. Phase 18 remains pending.

## Unit coverage (TODO 79)

| Requirement | Evidence in math-practice-app/src/services |
| --- | --- |
| All arithmetic generators and difficulty boundaries | questionGenerator.test.ts: four operations, four levels, endpoints, carrying/borrowing, mixed selection and malformed results |
| Distractors and answer uniqueness | answerChoices.test.ts: operation-specific mistakes, four unique nonnegative whole choices, correct-answer placement, degenerate RNG and invalid input |
| Statistics calculations | statisticsService.test.ts and mistakeStatistics.test.ts: empty data, counts/accuracy, groups, remembered-vs-retained history and source attribution |
| Mistake updates | mistakeService.test.ts and mistakeStorage.test.ts: self-reported misses, deduplication, dates, retention, serialization and reset protection |
| Similar-question generation | similarQuestionGenerator.test.ts: related strategies, inverse limits, zero operands, repetition bounds, metadata and immutable inputs |
| Mastery rules | mistakeReview.test.ts: consecutive successes, wrong-answer reset, journal replay, configurable thresholds, reopened mistakes and session completion |
| Storage serialization and validation | storageService.test.ts and errorRecovery.test.ts: round trips, legacy versions, invalid categories/answers, preserved preferences, protected unknown data and bounded generation recovery |

## Component coverage (TODO 80)

| Requirement | Evidence in math-practice-app/src |
| --- | --- |
| Operation/difficulty selection | app/PracticeConfiguration.test.tsx: exclusive difficulty, mixed operations, no-selection validation and edit round trips |
| Answer selection, flip, right/wrong buttons | components/practice/QuestionCard.test.tsx and QuestionAccessibility.test.tsx: disabled flip, selection, reveal, self-report, keyboard and duplicate-callback protection |
| Progress and session completion | app/PracticeSession.test.tsx and SessionSummary.test.tsx: exact limits, counts, focused next question, empty/early endings and recap actions |
| Statistics display | app/Statistics.test.tsx and MistakeStatistics.test.tsx: totals, groups, pagination, facts, mastery and empty states |
| Confirmation dialogs | app/Statistics.test.tsx, Settings.test.tsx and ErrorHandling.test.tsx: cancel/confirm, failure recovery, preserved preferences and safe navigation |

## Integration coverage (TODO 81)

| Requirement | Browser evidence in math-practice-app/e2e |
| --- | --- |
| Full addition session | practice.spec.ts: fixed 5/10/20 default-addition sessions, exact limits, totals and saved attempts |
| Mixed-operation session | phase20.spec.ts: seeded disposable RNG, all-operation setup, multiple actual operations, independent arithmetic checks, 60% recap, persisted totals and refresh |
| Continuous practice | practice.spec.ts: 21 reports plus cancel/confirm ending |
| Incorrect answer creates a mistake | mistakes.spec.ts: immediate saved misses, no duplicate tracking and original fact identity |
| Mistake-review generation and mastery | review.spec.ts: eligibility, related questions, original-target progress, three successes, wrong reset and persistence |
| Browser refresh persistence | storage.spec.ts, pages.spec.ts and restart.spec.ts; restart remains the existing Chromium-owned real-process test |
| Reset statistics | statistics.spec.ts: confirmation, preference preservation, failed writes and stale-tab protection |

## Accessibility status (TODO 82)

| Requirement | Status / evidence |
| --- | --- |
| Complete a session using only keyboard | phase20.spec.ts uses Tab, arrows, number keys, Space and Enter from setup through all five reports and recap; no click/focus shortcuts |
| Actual screen-reader speech | PENDING. User asked to listen with Narrator/NVDA and report initial question, answer reveal and next-question announcements. DOM checks and axe do not prove speech quality. |
| Reduced motion | accessibility-phase16.spec.ts and practice.spec.ts check reduced-motion media and saved animation opt-out |
| Actual browser zoom | PENDING. Native Firefox computer control was stopped by the tool because URL-policy enforcement is unsupported for that Windows browser. Existing reflow/text simulations are retained but do not count as actual browser zoom. |
| Automated accessibility checker | Full-page axe checks remain enabled across routes, cards, review, storage recovery, dialogs, populated statistics and keyboard recap |
| Human review of issues | Automated findings will be reviewed after the gate; final screen-reader/zoom assessment still needs a human. Do not mark Phase 20 entirely complete while these checks are pending. |

For manual Firefox zoom review, open a private window, set actual browser zoom to 200%, and inspect Home, Practice setup, a card front/back, populated Statistics, Settings and a confirmation dialog. Check for clipped text, horizontal page scrolling and unreachable controls. Restore zoom afterward. With Narrator/NVDA, listen to a five-question session and note duplicate, missing or confusing announcements. Existing Phase 16 system-text checks also remain pending.

## Commands and isolation

- npm.cmd run check:all: existing unit/build, desktop/mobile Chromium, real restart and Pages checks plus full Firefox regressions and Firefox Pages checks.
- npm.cmd run test:firefox: builds current source, then runs Firefox regressions against the test-owned preview server.
- npm.cmd run test:pages: builds the Pages variant and checks Chromium desktop/mobile and Firefox against a strict static server.
- npm.cmd run test:install: installs Chromium and Firefox into the project-owned cache. CI installs both browsers with OS dependencies.

Firefox uses a fresh desktop context; responsive tests also set phone/tablet viewport sizes. This is not a claim of Firefox mobile-device emulation. No retries, timeouts or axe rules were relaxed. Browser reports remain separate under output/playwright; all contexts/profiles are disposable. Never use the student's saved profile for test data.

Final gate evidence: notes/phase-20-check-all.txt. Focused evidence: notes/phase-20-focused.txt, phase-20-firefox-focused.txt and phase-20-firefox-pages-focused.txt. The independent reviewer identified the standalone command's missing build, which was fixed before the full gate.
