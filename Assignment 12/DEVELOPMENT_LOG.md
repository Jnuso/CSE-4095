# Development log

## October 16, 2026 - Phase 1: Project Setup

### Request and scope

The student requested an explanation, implementation, verification, a testing guide in chat, and a record of decisions for the report. Work follows Phase 1, Tasks 1-3, of the professor's TODO list. The professor's specification remains the source of truth. No later-phase functionality is marked complete.

### Decisions

- Keep the professor's specification and TODO in the Assignment 12 folder, with the Vite application in its suggested `math-practice-app` subfolder.
- Use the Vite React + TypeScript template and enable strict TypeScript checking. Use the package lockfile to record installed versions.
- Replace the current starter's Oxlint configuration with ESLint because Phase 1 explicitly requires ESLint. Use React hooks and refresh rules plus TypeScript linting, with Prettier for formatting.
- Use Vitest, jsdom, React Testing Library, and user-event for a small test of rendering and user interaction.
- Replace all Vite demonstration content with a minimal welcome screen and a working greeting. This is a setup check; navigation, arithmetic cards, statistics, and persistence remain future work.
- Define shared types matching the professor's data-model fields. Keep `selectedAnswer` separate from `selfReportedCorrect`, preserving the required self-assessment flow.
- Model initial session lengths as 5, 10, 20, or continuous, matching the supplied checklist. No runtime practice settings are implemented in this phase.
- Use local development port 5173 and preview port 4173 with strict port checking, so another active server cannot silently lead us to test a different instance. Bind to the local device only.
- Retain initial future-feature folders with `.gitkeep` files, without adding unused feature implementations.
- Recommend Node 24, record the verified environment, and provide Windows `npm.cmd` instructions to avoid PowerShell launcher-policy problems.
- Keep application text files in LF format through a project-local `.gitattributes` file so Windows Git checkouts remain consistent with Prettier; PNG evidence stays binary.

### Setup issue and investigation

Two ordinary dependency-installation attempts failed with Windows `EPERM` errors while creating different folders inside this OneDrive project's `node_modules`. Creating the first reported directory directly succeeded, but retrying installation encountered a different directory. The evidence established an installation/file-access problem, not an application bug. The exact underlying cause (sandbox restrictions versus file-system interference) was not proven.

A subsequent attempt with the approved broader execution permission completed successfully. npm reported zero vulnerabilities. No operating-system protections or folder permissions were disabled. This resolved the immediate installation failure, without proving whether the original cause was sandbox restrictions or another file-system interaction.

The first ESLint installation selected version 9, which npm reported as unsupported. The installed TypeScript and React plugins explicitly declared ESLint 10 compatibility, so ESLint and its core rules were upgraded to the supported current releases before validation. The final lint check succeeded.

The first isolated Chrome launch also failed inside the sandbox because Chrome's crash-reporting process could not launch. The same local browser check succeeded with approved broader execution permission. This was test-environment setup, not an application failure.

### Verification record

Verified on October 16, 2026, on Windows, with Node.js 24.19.0 and npm 11.17.0.

Installed versions from `npm ls --depth=0`: React/React DOM 19.3.1, TypeScript 6.0.3, Vite 8.3.4, ESLint 10.13.0, Prettier 3.9.10, Vitest 5.0.5, React Testing Library 16.3.3, user-event 14.6.8, jest-dom 7.0.1, and jsdom 30.1.3. The exact dependency graph is recorded in `math-practice-app/package-lock.json`.

| Check | Observed result |
| --- | --- |
| Installation and dependency inspection | Completed successfully; npm reported zero vulnerabilities and `npm ls --depth=0` showed the required tools |
| Formatting | `npm run format:check` passed |
| ESLint | `npm run lint` passed with zero warnings permitted |
| Component tests | `npm run test`: 1 file, 2 tests passed (initial render and greeting activation) |
| TypeScript and production build | `npm run build` passed; `tsc -b` checked source and all shared types, then Vite produced `dist` |
| Development server | Started on `http://127.0.0.1:5173/`; HTTP 200 and the correct page title |
| Desktop browser | Isolated Chrome, 1440 x 960: correct content and click greeting confirmed |
| Keyboard | Tab focused Say hello with a visible focus indicator; Enter activated the greeting |
| Refresh | Reload reset the temporary greeting to Ready when you are, as expected before persistence work |
| Narrow layout | Chrome viewport 390 x 844: document width 390, no horizontal overflow; screenshot visually inspected |
| Built preview | `http://127.0.0.1:4173/` loaded; greeting click and refresh reset worked |
| Browser errors | Zero errors or warnings reported by the error-level console check in the isolated browser session |

The combined `npm.cmd run check` command exited successfully. Its captured output is saved in `notes/phase-1-check-output.txt`. Desktop and mobile screenshots are in `math-practice-app/output/playwright/phase-1-desktop.png` and `phase-1-mobile.png`.

All 21 Phase 1 checklist items were verified. Later phases remain unchecked; the professor's specification is unchanged. These tests establish only the Phase 1 foundation. They do not establish future arithmetic, storage, routing, full accessibility, or cross-browser functionality. Safari, Firefox, Edge, and assistive-technology testing have not been performed in this phase.

The isolated automated browser and temporary development/preview servers are stopped after verification. The student can start development again with `npm.cmd run dev`.

### Student verification and evidence

Use PHASE_1_TESTING.md and the testing guide in this chat. Student manual checks are initially unchecked and must be recorded by the student. Preserve this Phase 1 request, the implementation discussion, the installation issue and resolution, screenshots, and check results as evidence for the development report. Describe the installation issue honestly as a setup/debugging experience, not as an invented arithmetic bug.
