# Math Practice — Assignment 12

A child-friendly arithmetic practice application for ages 7–12, built with React, TypeScript and Vite using an incremental AI-assisted development process.

[Open the deployed application](https://jnuso.github.io/CSE-4095/) · [GitHub repository](https://github.com/Jnuso/CSE-4095)

## Run locally

Install Node.js 24 LTS and npm. In PowerShell, from this Assignment 12 folder:

```powershell
cd math-practice-app
npm.cmd ci
npm.cmd run dev
```

Open the address printed by Vite, normally http://127.0.0.1:5173/. Stop the server with Ctrl+C. Other shells can use `npm` instead of `npm.cmd`.

## Build for deployment

From `math-practice-app`:

```powershell
npm.cmd run build
npm.cmd run preview
```

The standard build writes `dist/`; preview serves it locally, normally on port 4173. For the existing GitHub Pages deployment, `npm.cmd run build:pages` writes `dist-pages/` with hash routing. The repository's Math Practice workflow verifies the application before publishing. See [deployment details](docs/DEPLOYMENT.md).

## Features

- Addition, subtraction, multiplication and division with four difficulty levels.
- Multiple-choice question cards, answer reveal and right/wrong self-reporting.
- Fixed-length or continuous sessions, progress and performance recaps.
- Remembered mistakes, similar-question review and configurable mastery.
- Lifetime overall, operation and difficulty statistics, with the newest 100 detailed sessions retained.
- Preferences and browser-local persistence without registration.
- Active-session recovery, navigation confirmation and responsive keyboard-accessible controls.

Practice data stays in the browser; clearing its saved data removes progress.

## Project layout

| Location | Contents |
| --- | --- |
| [specification.md](specification.md) | Professor's application specification |
| [TODO.md](TODO.md) | Original implementation phases and completion record |
| [math-practice-app/](math-practice-app/) | Application source, automated tests and build configuration |
| [docs/](docs/README.md) | Release evidence, testing guides, decisions and development history |
| notes/ | Supporting scripts and raw development notes |
| experiments/ | Historical AI review experiments |

## Verification and submission

Application revision: [`5799564`](https://github.com/Jnuso/CSE-4095/commit/5799564925babde7318659c954bb5c08e07e7e78). The [complete GitHub Actions verification and deployment](https://github.com/Jnuso/CSE-4095/actions/runs/39718024568) succeeded: **647 tests passed, one expected Firefox skip, no failures**. This includes 338 unit/component/service tests, 185 Chromium/restart checks, 33 Pages checks and 91 Firefox checks, plus formatting, lint, TypeScript and production builds.

The final release fixes lifetime aggregate preservation, the mobile Statistics-menu active indicator and narrow-screen session-length labels. Isolated hosted verification confirmed 505 lifetime attempts with 100 detailed sessions retained, migration/save/reload, cross-tab reset, 30 mobile menu jumps and readable 320px labels, with no captured runtime or console errors. See [final compliance and release evidence](docs/COMPLIANCE_FIXES.md). Earlier failed audit results remain separately documented in [the original audit](docs/ASSIGNMENT_12_AUDIT.md).

The student confirmed screen-reader, browser zoom, Safari and sound testing complete on 2026-10-21. Enlarged operating-system fonts, physical-device testing and remaining installed Chrome/Edge checks are not claimed complete. Migration preserves available full-session records; answers already discarded by an older release cannot be reconstructed.

To run the full suite later, install the test browsers once with `npm.cmd run test:install`, then use `npm.cmd run check:all`. See [testing details](docs/TESTING.md).

Submission links:

- Repository: https://github.com/Jnuso/CSE-4095/tree/main/Assignment%2012
- Deployed application: https://jnuso.github.io/CSE-4095/
- Development report: prepared separately by the student; include it with the submission and the required authentic AI conversation evidence.

See the [full assignment instructions](docs/ASSIGNMENT_INSTRUCTIONS.txt). The development log and historical test records provide supporting evidence. GitHub Pages uses hash routes for refresh-safe navigation; the separate Cloudflare base site is unchanged.
