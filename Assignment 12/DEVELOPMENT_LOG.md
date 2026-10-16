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

The student subsequently reported "everything works" in chat before authorizing Phase 2. This records the student's overall confirmation, without inventing additional browser or test details.

## October 16, 2026 - Phase 2: Basic Interface

### Request and scope

The student asked to complete Phase 2 in the same way as Phase 1: explain the work, implement the supplied checklist, verify it, update only verified TODO items, record decisions, and provide a testing guide in chat. This phase covers Tasks 4-6: shared layout, home page, and application routing.

### Main components and decisions

- Preserve the Phase 1 visual style and shared TypeScript definitions.
- Replace the temporary Say hello setup interaction with the required Start Practice, View Statistics, and Settings navigation actions.
- Install React Router 8.4.0 and use its documented declarative BrowserRouter, Routes, Route, and Outlet APIs. Keep route definitions separate from the router wrapper so component tests can use MemoryRouter.
- Extract PageContainer, Header, Navigation, and AppLayout. The header, navigation, main content, and footer are shared by every route, including the unknown-page fallback.
- Use ActionLink for consistent button-like styling while retaining correct anchor semantics for navigation. Enter activates these links; Space is not treated as button activation.
- Indicate the active section with styling and aria-current, including the Practice section on all three practice routes. Include a keyboard-visible skip link and visible focus outlines. When the route changes, move focus to the destination heading and update the browser tab title.
- Implement all six required URLs and a wildcard fallback. The home page is functional; the practice, summary, statistics, and settings pages are honest placeholders. They do not present fake results or controls that imply later-phase functionality exists.
- Direct session/summary URLs show explanatory content and a link to setup. Session guards and actual session behavior remain later work.
- Reuse the student's already-running local development and production-preview servers. Leave those servers running; close only the isolated browser created for the agent's checks.
- Keep the professor's specification unchanged. The Phase 1 testing guide is retained as historical evidence; the current guide is PHASE_2_TESTING.md.

### Verification

The combined `npm.cmd run check` command passed: formatting, ESLint, 12 component tests in one file, TypeScript compilation, and the Vite production build. The test suite now checks the routed interface rather than the removed Phase 1 greeting. The output is saved in `notes/phase-2-check-output.txt`. npm reported zero vulnerabilities when installing React Router.

| Check | Observed result |
| --- | --- |
| Required URLs | Home, setup, session, summary, statistics, and settings each render the correct heading and shared header |
| Unknown URL | Friendly fallback appears, and Back home returns to the home page |
| Home actions | All three actions open the expected URL, highlight the correct navigation item, and focus the new heading |
| Browser history | Back returns to practice setup and Forward returns to statistics in the tested flow |
| Keyboard | Skip to content is first in the tab order and focuses main content; Tab reaches navigation, visible focus appears, and Enter opens Practice |
| Direct loading and refresh | All six routes plus the fallback passed on both port 5173 (development) and port 4173 (built preview) |
| Screen sizes | Desktop 1440 x 960 visually inspected; widths 320, 390, and 768 had no horizontal overflow and all navigation links remained within the viewport |
| Screenshots | Desktop home, mobile home, and desktop statistics placeholder captured and visually inspected |
| Browser errors | No runtime errors, console errors, or warnings were collected during the route and layout checks |

Browser interaction and route-check transcripts are saved in `notes/phase-2-browser-interactions.txt` and `notes/phase-2-browser-routes.txt`. Screenshot evidence is in `math-practice-app/output/playwright/phase-2-home-desktop.png`, `phase-2-home-mobile.png`, and `phase-2-statistics-desktop.png`.

An inline multiline browser-check command initially failed to parse. Running the same checks through the CLI's supported `--filename` input completed successfully. This was a testing-harness issue, not an application bug. The temporary helper files and browser-session data remain ignored in `.playwright-cli/`.

All 17 Phase 2 checklist items were verified before being marked complete. Phase 1 remains complete and Phase 3 onward remains unchecked. The direct-refresh checks apply to Vite's local servers; deployment-host routing will still need verification during release preparation. This phase does not claim completed arithmetic, saved progress, statistics calculations, full accessibility, or testing in other browser engines.

### Student verification and report evidence

The student's Phase 2 checklist remains unchecked in PHASE_2_TESTING.md. Use the guide there and in chat to verify navigation independently. Save the initial Phase 2 request, a home-page screenshot, a destination-page screenshot, and successful check output. A useful explanation for the report is that one shared layout provides consistent navigation while the router chooses which page appears inside it.
