# Math Practice

A math practice app for children ages 7-12, developed incrementally for Assignment 12.

## Current milestone: Phase 6

The project foundation, navigation, and practice configuration are implemented. Choose one or more operations, one of four difficulties, and 5, 10, 20, or continuous practice. Start Session validates these choices and carries them to the practice page, which displays the configuration and offers Edit choices. Arithmetic generation now supports all four operations and difficulty levels, with validated question data and automated boundary tests. The main generator now attaches four shuffled, distinct choices with exactly one correct answer. The practice page includes a labeled card preview: choose an answer, flip to check it, self-report once, and try another card. Animation can be disabled and respects reduced motion. Results are not counted or saved; tracked practice sessions remain later work. Statistics and settings are still honest placeholders. The arithmetic symbols on the home page are decorative.

The requirements are in [the professor's specification](../specification.md), and progress is tracked in [the professor's TODO list](../TODO.md). Implementation choices and evidence belong in [the development log](../DEVELOPMENT_LOG.md), rather than changes to the specification.

## Requirements

Use Node.js 24 LTS (the version selected in `.nvmrc`) and npm. The package declares Node.js 22.12 or newer as the minimum. The verified environment is recorded in the development log.

## Run locally on Windows

Open a PowerShell terminal in this `math-practice-app` folder. The `.cmd` commands work even when PowerShell blocks the `npm.ps1` launcher.

```powershell
npm.cmd install
npm.cmd run dev
```

Open the exact URL printed by the server, normally <http://127.0.0.1:5173/>. Keep that terminal open while using the app. Press Ctrl+C to stop the server.

The development server uses a fixed local address and strict port checking. If port 5173 is occupied, it reports an error instead of silently serving on another port. Reuse an existing server for this project, stop your own old server, or explicitly choose a different port with `npm.cmd run dev -- --port 5174` and use that printed URL. Do not stop an unrelated application.

After cloning the project with its committed lockfile, use `npm.cmd ci` for a clean, reproducible installation. It replaces the dependency installation, so stop the dev server before using it.

## Checks

```powershell
npm.cmd run check
```

This runs the formatting check, ESLint, component tests, and the production build. The build includes TypeScript checking. Every step must exit successfully.

| Command                    | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `npm.cmd run dev`          | Start local development with live updates          |
| `npm.cmd run test`         | Run automated component tests once                 |
| `npm.cmd run test:watch`   | Keep tests running as source changes               |
| `npm.cmd run typecheck`    | Check TypeScript definitions and source            |
| `npm.cmd run lint`         | Check TypeScript and React code with ESLint        |
| `npm.cmd run format:check` | Check formatting without editing files             |
| `npm.cmd run format`       | Format project source and configuration            |
| `npm.cmd run build`        | Type-check and create the `dist` production output |
| `npm.cmd run preview`      | Serve the existing production build on port 4173   |

Run `npm.cmd run build` before `npm.cmd run preview`, then open <http://127.0.0.1:4173/>. Preview verifies the production output locally; it does not publish a website.

The current manual checklist and expected results are in [PHASE_6_TESTING.md](../PHASE_6_TESTING.md). The Phase 1 and Phase 2 guides preserve historical milestone checks; their temporary greeting and setup placeholder have been replaced.

## Main components

- `src/main.tsx`: attaches React to the browser page.
- `src/app/App.tsx`: starts browser-based routing.
- `src/app/AppRoutes.tsx`: maps URLs to pages, with a shared layout and fallback.
- `src/components/layout/`: reusable page container, header, navigation, and layout.
- `src/components/common/`: shared navigation-action styling and honest future-feature screens.
- `src/pages/`: the home page, five destination pages, and unknown-page fallback.
- `src/components/practice/`: accessible selectors, AnswerChoice buttons, the stateful QuestionCard, and a CardPreview that connects generated data without session scoring.
- `src/constants/practice.ts`: shared operation labels, difficulty descriptions, and session-length options.
- `src/services/practiceConfiguration.ts`: validates configuration received through navigation state.
- `src/types/`: shared descriptions of questions, attempts, sessions, mistake patterns, statistics, settings, and application state.
- `src/services/questionGenerator.ts`: operation-specific arithmetic drafts, mixed selection, validated arithmetic, and integration of complete answer choices.
- `src/services/answerChoices.ts`: plausible operation-specific distractors, bounded selection with fallback, shuffling, and choice validation.
- `src/utils/`: inclusive random integers, non-mutating shuffle, unique IDs, and utility tests. `src/hooks/` is reserved for later phases.
- `src/app/AppRoutes.test.tsx`: checks all routes, home actions, keyboard navigation, focus, and fallback recovery.
- `src/app/PracticeConfiguration.test.tsx`: checks defaults, multiple selections, validation, exclusive options, and the configuration handoff/edit flow.
- `src/test/setup.ts`: browser-like test setup and cleanup between tests.
- `vite.config.ts`: development server, production preview, and Vitest settings.
- `eslint.config.js` and `.prettierrc.json`: code-quality and formatting rules.
- `package.json` and `package-lock.json`: commands and the dependency versions needed to reproduce the setup.

## Implementation references

- [Vite getting started](https://vite.dev/guide/)
- [Vitest getting started](https://vitest.dev/guide/)
- [React introduction](https://react.dev/learn)
- [React Router declarative routing](https://reactrouter.com/start/declarative/routing)
