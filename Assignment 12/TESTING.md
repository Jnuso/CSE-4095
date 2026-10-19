# Automated regression tests

The app now has two complementary suites: Vitest checks arithmetic, data validation, storage, and React components; Playwright runs real browser flows on desktop and mobile-sized Chromium. Future application changes should pass both before being marked verified.

## Run everything

Open a terminal in `Assignment 12/math-practice-app`:

```powershell
npm.cmd run check:all
```

This checks formatting and lint, runs the existing unit/component tests, type-checks both app and browser tests, builds production output, and runs the browser suite. A failure stops the command and returns a nonzero exit code. Tests do not automatically retry and hide a first failure.

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
| `npm.cmd run test:e2e:headed` | Rebuild and watch tests run in visible browser windows                  |
| `npm.cmd run test:report`     | Open the latest browser report                                          |

For a focused browser run, append Playwright filters, for example:

```powershell
npm.cmd run test:e2e -- --project=desktop --grep "quota"
```

`check:all` is a run-on-demand gate. It does not start an unattended background watcher or a scheduled task. The assignment's AGENTS.md makes it the required check for future application changes made by the coding assistant. `test:watch` is available for continuous unit/component feedback during editing.

## Browser coverage

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
- Each normal test gets a fresh browser context and localStorage. Storage faults and fake records are injected only there. The restart test owns a separate temporary profile under the ignored test-results directory.
- Desktop and mobile projects run the shared flows; the actual process-restart scenario runs once on desktop.
- Unexpected page errors or console errors/warnings fail tests.
- The HTML report is under `math-practice-app/output/playwright/regression-report/index.html`. Failing tests retain screenshots and traces under `regression-results`; the report links to them. These generated files are ignored by Git. The next run replaces the last report/results.
- Playwright manages browser/server cleanup. Stop an interactive run with Ctrl+C. Do not kill unrelated browser or server processes to resolve a test-port conflict.

The reporter groups results by desktop/mobile and shows the exact passed/failed count. New tests should be added as later phases add statistics, mistakes, and settings features; those unfinished features are not claimed as covered now.

## What still needs human review

The suite verifies behavior and specified layout constraints. It does not judge every visual design change, educational wording, screen-reader experience, real mobile hardware, or every browser engine. There are no pixel-baseline screenshots to approve blindly. A brief visual review remains useful after layout changes, alongside the automatic checks.

Configuration follows the official [Playwright web-server guide](https://playwright.dev/docs/test-webserver) and [recording options](https://playwright.dev/docs/test-use-options#recording-options). See DEVELOPMENT_LOG.md for the actual verified run and any repaired test-harness issues.
