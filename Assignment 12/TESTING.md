# Automated regression tests

The app now has two complementary suites: Vitest checks arithmetic, data validation, storage, and React components; Playwright runs real browser flows on desktop and mobile-sized Chromium. Future application changes should pass both before being marked verified.

## Run everything

Open a terminal in `Assignment 12/math-practice-app`:

```powershell
npm.cmd run check:all
```

This checks formatting and lint, runs the existing unit/component tests, type-checks both app and browser tests, builds production output, and runs the browser suite. A failure stops the command and returns a nonzero exit code. Tests do not automatically retry and hide a first failure.

The gate also builds and tests the GitHub Pages variant using a strict static server at port 4373. See DEPLOYMENT.md for hosted review steps, hash-route behavior, and the separate Pages report. Vitest uses at most two workers to limit jsdom resource contention while retaining the existing per-test deadlines and assertions.

On a fresh checkout, install dependencies and the test browser first:

```powershell
npm.cmd ci
npm.cmd run test:install
npm.cmd run check:all
```

Chromium installs under this project's ignored `node_modules/.cache/playwright-browsers`, so Codex and a regular terminal use the same copy. Run the browser install again after `npm.cmd ci` removes node_modules or a Playwright upgrade changes the required browser version.

## Other commands

| Command                       | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `npm.cmd run check`           | Formatting, lint, unit/component tests, type checking, production build |
| `npm.cmd run test:watch`      | Rerun unit/component tests as you edit source                           |
| `npm.cmd run test:e2e`        | Rebuild and run browser tests                                           |
| `npm.cmd run test:a11y`       | Rebuild and run accessibility scans on desktop and mobile               |
| `npm.cmd run test:e2e:headed` | Rebuild and watch tests run in visible browser windows                  |
| `npm.cmd run test:report`     | Open the latest browser report                                          |

For a focused browser run, append Playwright filters, for example:

```powershell
npm.cmd run test:e2e -- --project=desktop --grep "quota"
```

`check:all` is a run-on-demand gate. It does not start an unattended background watcher or a scheduled task. The assignment's AGENTS.md makes it the required check for future application changes made by the coding assistant. `test:watch` is available for continuous unit/component feedback during editing.

## Browser coverage

For the Phase 10 live review walkthrough, see PHASE_10_TESTING.md. Statistics tests cover reported-answer calculations, operation/difficulty groups, unfinished sessions, cross-tab reset protection, history ordering/pagination, cancellation, preference preservation, failed writes, and accessibility of the populated dashboard and reset dialog.

| Area            | Automated checks                                                                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation      | Direct routes, refreshes, missing-session redirects, unknown-route recovery, home actions, shared layout, active navigation, destination focus                                                                                                  |
| Setup           | Defaults, disabled start/validation, clear/select-all, mixed operations, exclusive options, configuration/edit round trip                                                                                                                       |
| Cards           | Four choices, disabled flip before selection, selection changes, keyboard selection/flip/report, reveal, locked front controls, reset and focus on next question                                                                                |
| Sessions        | Exact 5/10/20 limits, progress, no immediate repeated arithmetic, unique saved attempts, continuous practice beyond 20 reports, cancel/confirm ending                                                                                           |
| Summaries       | Counts, accuracy, actual practiced operation, difficulty, review count, empty sessions, replay/reset, setup restoration, Home/Statistics actions, history Back                                                                                  |
| Motion/layout   | Animation on/off, reduced motion, 390/320-pixel front/back/summary overflow, touch-target sizes, stable card dimensions                                                                                                                         |
| Storage         | Immediate attempt persistence, saved settings/animation, reloads, completed-summary fallback, unrelated data preservation, corruption/future schema protection, invalid settings recovery, legacy migration, quota and blocked-storage fallback |
| Browser restart | A task-owned persistent profile is closed and reopened; completed attempts and settings must survive                                                                                                                                            |

The existing unit/component tests complement this with all operation/difficulty boundaries, answer-choice uniqueness/shuffling, duplicate callbacks, generated-question failures, storage retention, and more invalid-input cases.

## Test isolation and reports

- The runner starts and stops a production-preview server on **127.0.0.1:4273**. It does not reuse a server already on that port, so a conflict fails clearly. Your development server on 5173 and preview on 4173 are unaffected.
- Each normal test gets a fresh browser context and localStorage. Storage faults and fake records are injected only there. The restart test owns a short `math-e2e-*` profile in the system temporary directory, outside synced folders, and validates its exact parent/name before cleanup.
- Desktop and mobile projects run the shared flows. A separate desktop-sized restart project depends on both, running the real process restart alone after those flows. It retains the same deadline/assertions and reports launch/close/cleanup steps.
- Unexpected page errors or console errors/warnings fail tests.
- The HTML report is under `math-practice-app/output/playwright/regression-report/index.html`. Failing tests retain screenshots and traces under `regression-results`; the report links to them. These generated files are ignored by Git. The next run replaces the last report/results.
- Playwright manages browser/server cleanup. Stop an interactive run with Ctrl+C. Do not kill unrelated browser or server processes to resolve a test-port conflict.

The reporter groups results by desktop/mobile and shows the exact passed/failed count. New tests should be added as later phases add mistake-tracking features; those unfinished features are not claimed as covered now.

## Automated accessibility checks and independent review

`npm.cmd run check:all` includes the accessibility suite automatically. To run only accessibility checks:

```powershell
npm.cmd run test:a11y
npm.cmd run test:report
```

The axe scans cover Home, setup, missing-summary results, empty Statistics and default Settings, unknown-route recovery, setup validation and selected options, card front/selection/reveal/next question, continuous practice with reduced motion, completed/zero-attempt summaries, and a saved-data warning. Scans run on both desktop and mobile-sized Chromium in isolated contexts. Future features need scans of their populated and interactive states; placeholders do not establish accessibility of unimplemented features.

A separate scanner-confidence test deliberately inserts an unnamed button into its own isolated page and requires axe to detect it. Its attachment intentionally contains that violation; the application scans still require zero detected violations. Card scans wait for actual animations to finish before checking the settled state.

The suite checks axe rules tagged WCAG 2 A/AA, WCAG 2.1 A/AA, and best practice. It requires zero detected violations, with no excluded elements or disabled rules. Every scan attaches full JSON results to its test in the HTML report, including passed rules and inconclusive (`incomplete`) checks. Open the attachment to inspect manual-review needs; inconclusive results are not silently counted as proof of accessibility. An automated pass is not a claim of WCAG conformance.

Independent review follows REVIEW.md. A separate read-only agent checks significant changes against the authorized requirements and tests, then the implementer investigates findings and records the outcome. This runs during development in this chat; it does not start a background service or require a new account.

Implementation follows the official [Playwright accessibility guide](https://playwright.dev/docs/accessibility-testing).

## What still needs human review

For a focused check of the deployed URL, run this from the course repository root after installing the app's dependencies and bundled browser:

```powershell
node "Assignment 12/notes/pages-live-check.mjs"
```

This checks hosted routes/refreshes, a five-question session and saved recap, and skip-link focus at desktop/mobile sizes using disposable browser contexts. It does not use your browser profile or saved progress. Generated screenshots and results go to the ignored math-practice-app/output/playwright/pages-live folder. This is a focused hosting check; the full local regression gate remains check:all.

The suite verifies behavior and specified layout constraints. It does not judge every visual design change, educational wording, screen-reader experience, real mobile hardware, or every browser engine. There are no pixel-baseline screenshots to approve blindly. A brief visual review remains useful after layout changes, alongside the automatic checks.

Configuration follows the official [Playwright web-server guide](https://playwright.dev/docs/test-webserver) and [recording options](https://playwright.dev/docs/test-use-options#recording-options). See DEVELOPMENT_LOG.md for the actual verified run and any repaired test-harness issues.

## Settings and clear-all checks

PHASE_11_TESTING.md provides the live review walkthrough. New component/service checks verify saved defaults versus session overrides, real preference behavior, quiet sound construction/cleanup and blocked audio, actual arithmetic explanations, invalid-operation validation, protected-data clearing, failed writes, and the pending-preference cross-tab reset race. Four browser scenarios run on desktop/mobile, covering saved preference reload, actual explanations/animation, clear confirmation/cancellation/Home/defaults, unrelated-data preservation, corruption recovery, write failures and stale tabs. Full-page axe scans include saved Settings and its confirmation dialog with the existing rules unchanged. The restart scenario saves preferences through Settings before closing/reopening Chromium. Hearing the tone and judging its volume remain manual checks.

## Mistake tracking checks

PHASE_12_TESTING.md gives the student walkthrough and optional read-only storage inspection. Service tests cover exact fact keys, reported outcomes, duplicate report/question identities, count/date updates, progress reset, immutable inputs and invalid fields. Storage/provider regressions cover legacy backfill, malformed cache/journal recovery, independent retention beyond 100 sessions, delayed snapshots, quota failures/retries and reset cutoffs. Three browser scenarios on desktop/mobile cover immediate tracking, reload/settings-save idempotence, two tabs, stale-session reset protection, invalid-data warning accessibility, and erasing mistakes. The real browser restart also verifies mistake tracking. Similar-question generation, review mode and mastery gains are not claimed as implemented.

## Phase 13 generator checks

src/services/similarQuestionGenerator.test.ts checks nearby/reversed/inverse strategies across all operations and levels, explicit endpoints with independent numeric bounds, invalid/zero facts, complete review metadata/choices, strategy selection and bounded recent-fact avoidance without changing saved patterns. No review-mode UI is introduced yet; existing full browser/accessibility/Pages tests remain required. See PHASE_13_TESTING.md for the student walkthrough.

## Phase 14 review mode

The mistakeReview unit suite covers priority/mixing/filtering, durable consecutive mastery, wrong-review updates on the original pattern, regular-miss reopening, configurable thresholds, idempotent journal replay, ordering/ties, stale reset, serialization/recovery/retention and session transitions. review.spec.ts adds desktop/mobile eligibility, matching choices, card/reveal/summary full-page accessibility, mastery after reload, mixed targets, two-tab merging/reset, and storage-full retry. Existing tests keep all prior checks; setup radio count and summary action expectations change because review mode now exists. See PHASE_14_TESTING.md.

## Phase 15 advanced statistics

The mistakeStatistics service/component suites cover active/mastered counts, source-review totals (including legacy/incomplete attempts), journal/record identity deduplication, retained-vs-remembered coverage, original-operation attribution, ties, stable immutable sorting, reset cutoff, detail dates/progress and pagination. mistake-statistics.spec.ts adds three flows on desktop/mobile for actual practice into mastery, journal-only data and read-only switching/reload, reset and empty states, ties/pagination, 320-pixel overflow checks and full-page axe scans preserving all rules. See PHASE_15_TESTING.md.

On GitHub Actions, the regression and Pages configurations add the built-in GitHub reporter alongside list/html so browser failures appear as check annotations, including file/line and the failed assertion. Local output is unchanged. This changes diagnostics only, not retries, deadlines, browser choices, accessibility rules or the deploy-success requirement.

## Phase 16 accessibility

See [PHASE_16_TESTING.md](PHASE_16_TESTING.md) for keyboard, reduced-motion, actual zoom, larger text and screen-reader review. New isolated browser coverage includes keyboard/dialog boundaries, scoped shortcuts, focus/progress semantics, full-page axe scans, 640px reflow and doubled base-text simulation. Literal zoom, actual system-font settings and screen-reader speech remain manual checks.


## Phase 17 responsive design and feedback

See PHASE_17_TESTING.md. The responsive browser suite covers five phone/tablet portrait and landscape sizes in both desktop and mobile contexts, 44px answer targets, single-column answers on narrow screens, populated statistics within viewport bounds, saved feedback opt-out and encouragement on the final recap. Existing card-height, keyboard, full-page axe and Pages tests remain intact. practiceFeedback.test.ts covers varied messages and optional-setting compatibility. Feedback uses the student's report and adds no sound or animation.


## Phase 19 error handling

See PHASE_19_TESTING.md. errorRecovery.test.ts checks isolated category recovery, valid-answer salvage, duplicate identities, repaired totals, unknown question validation, bounded fallbacks and original review identity. ErrorHandling.test.tsx checks missing-session explanations and an integrated route crash/retry/Home flow with navigation, focus and title recovery. error-handling.spec.ts verifies damaged-answer recovery and explicit save/reload while preserving preferences, plus accessible missing-session navigation on desktop/mobile with full-page axe rules. Existing protected-save, reset, cross-tab, restart and Pages tests remain required. Phase 18 remains pending.
