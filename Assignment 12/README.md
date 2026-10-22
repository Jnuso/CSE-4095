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
- Statistics, preferences and browser-local persistence without registration.
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

Latest review: [the 2026-10-21 assignment audit](docs/ASSIGNMENT_12_AUDIT.md) records fresh hosted checks, a failed mobile Statistics-menu CI check, the 100-session total-statistics limitation, and unfinished submission deliverables. The successful release result below is historical evidence, not a clean result for the latest rerun.

The published application revision passed **631 automated tests with one expected Firefox skip**. See [release evidence and limitations](docs/RELEASE_SIGNOFF.md) and the [remaining review checklist](docs/FINAL_TODO.md). The student confirmed screen-reader, browser zoom, Safari and sound testing complete on 2026-10-21. Enlarged system fonts, physical devices and remaining installed-browser checks are separate; the broader repository has older-demo failures.

To run the full suite later, install the test browsers once with `npm.cmd run test:install`, then use `npm.cmd run check:all`. See [testing details](docs/TESTING.md).

The assignment requires the repository URL, deployed URL, a roughly 2–3 page development report and AI conversation evidence. The report and selected conversation evidence still need to be assembled and reviewed for submission; the long development log is supporting material rather than the finished report. See the [full assignment instructions](docs/ASSIGNMENT_INSTRUCTIONS.txt).
