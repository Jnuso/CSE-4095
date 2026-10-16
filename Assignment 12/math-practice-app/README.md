# Math Practice

A math practice app for children ages 7-12, developed incrementally for Assignment 12.

## Current milestone: Phase 1

The project foundation is implemented: a custom React welcome screen with a working greeting button, TypeScript data definitions, and development tools. Practice questions, routing, sessions, statistics, and saved progress belong to later phases. The arithmetic symbols on this screen are decorative, not buttons.

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

The full Phase 1 manual checklist and expected results are in [PHASE_1_TESTING.md](../PHASE_1_TESTING.md).

## Main components

- `src/main.tsx`: attaches React to the browser page.
- `src/app/App.tsx`: the current welcome screen and greeting interaction.
- `src/types/`: shared descriptions of questions, attempts, sessions, mistake patterns, statistics, settings, and application state.
- `src/components/`, `pages/`, `hooks/`, `services/`, and `utils/`: the initial organization for later phases; empty folders are intentionally retained with `.gitkeep` files.
- `src/app/App.test.tsx`: checks that the screen appears and responds to a learner.
- `src/test/setup.ts`: browser-like test setup and cleanup between tests.
- `vite.config.ts`: development server, production preview, and Vitest settings.
- `eslint.config.js` and `.prettierrc.json`: code-quality and formatting rules.
- `package.json` and `package-lock.json`: commands and the dependency versions needed to reproduce the setup.

## Implementation references

- [Vite getting started](https://vite.dev/guide/)
- [Vitest getting started](https://vitest.dev/guide/)
- [React introduction](https://react.dev/learn)
