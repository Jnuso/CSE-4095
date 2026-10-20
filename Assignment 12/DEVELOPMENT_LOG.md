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

| Check                                  | Observed result                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Installation and dependency inspection | Completed successfully; npm reported zero vulnerabilities and `npm ls --depth=0` showed the required tools |
| Formatting                             | `npm run format:check` passed                                                                              |
| ESLint                                 | `npm run lint` passed with zero warnings permitted                                                         |
| Component tests                        | `npm run test`: 1 file, 2 tests passed (initial render and greeting activation)                            |
| TypeScript and production build        | `npm run build` passed; `tsc -b` checked source and all shared types, then Vite produced `dist`            |
| Development server                     | Started on `http://127.0.0.1:5173/`; HTTP 200 and the correct page title                                   |
| Desktop browser                        | Isolated Chrome, 1440 x 960: correct content and click greeting confirmed                                  |
| Keyboard                               | Tab focused Say hello with a visible focus indicator; Enter activated the greeting                         |
| Refresh                                | Reload reset the temporary greeting to Ready when you are, as expected before persistence work             |
| Narrow layout                          | Chrome viewport 390 x 844: document width 390, no horizontal overflow; screenshot visually inspected       |
| Built preview                          | `http://127.0.0.1:4173/` loaded; greeting click and refresh reset worked                                   |
| Browser errors                         | Zero errors or warnings reported by the error-level console check in the isolated browser session          |

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

| Check                      | Observed result                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Required URLs              | Home, setup, session, summary, statistics, and settings each render the correct heading and shared header                                        |
| Unknown URL                | Friendly fallback appears, and Back home returns to the home page                                                                                |
| Home actions               | All three actions open the expected URL, highlight the correct navigation item, and focus the new heading                                        |
| Browser history            | Back returns to practice setup and Forward returns to statistics in the tested flow                                                              |
| Keyboard                   | Skip to content is first in the tab order and focuses main content; Tab reaches navigation, visible focus appears, and Enter opens Practice      |
| Direct loading and refresh | All six routes plus the fallback passed on both port 5173 (development) and port 4173 (built preview)                                            |
| Screen sizes               | Desktop 1440 x 960 visually inspected; widths 320, 390, and 768 had no horizontal overflow and all navigation links remained within the viewport |
| Screenshots                | Desktop home, mobile home, and desktop statistics placeholder captured and visually inspected                                                    |
| Browser errors             | No runtime errors, console errors, or warnings were collected during the route and layout checks                                                 |

Browser interaction and route-check transcripts are saved in `notes/phase-2-browser-interactions.txt` and `notes/phase-2-browser-routes.txt`. Screenshot evidence is in `math-practice-app/output/playwright/phase-2-home-desktop.png`, `phase-2-home-mobile.png`, and `phase-2-statistics-desktop.png`.

An inline multiline browser-check command initially failed to parse. Running the same checks through the CLI's supported `--filename` input completed successfully. This was a testing-harness issue, not an application bug. The temporary helper files and browser-session data remain ignored in `.playwright-cli/`.

All 17 Phase 2 checklist items were verified before being marked complete. Phase 1 remains complete and Phase 3 onward remains unchecked. The direct-refresh checks apply to Vite's local servers; deployment-host routing will still need verification during release preparation. This phase does not claim completed arithmetic, saved progress, statistics calculations, full accessibility, or testing in other browser engines.

### Student verification and report evidence

The student's Phase 2 checklist remains unchecked in PHASE_2_TESTING.md. Use the guide there and in chat to verify navigation independently. Save the initial Phase 2 request, a home-page screenshot, a destination-page screenshot, and successful check output. A useful explanation for the report is that one shared layout provides consistent navigation while the router chooses which page appears inside it.

## October 16, 2026 - Phase 3: Practice Configuration

### Request and scope

The student authorized Phase 3 following the same explain, implement, verify, record, and manual-testing workflow. This covers Tasks 7-10: operation selection, difficulty selection, session length, and a working practice-setup form. Question generation, answer cards, and actual session tracking remain later phases.

### Decisions and main components

- Create reusable OperationSelector, DifficultySelector, and SessionLengthSelector components, using native checkboxes and radio buttons inside labeled fieldsets. Checkmarks and selected borders supplement color, and controls have visible keyboard focus.
- Offer all four operations, any combination, Select all operations, and Clear selection. Repeated Select all does not duplicate operations.
- Show four exclusive difficulties with short descriptions, and four exclusive session lengths: 5, 10, 20, or continuous.
- Use Addition, Beginner, and 10 questions as simple initial defaults. Configurable saved defaults will follow in the settings/storage phases.
- Disable Start Session with no operations, show an explanatory live status message, and validate again in the form-submit handler.
- Add a shared PracticeConfiguration type and central option definitions. Runtime validation also rejects unsupported operations, duplicate operations, invalid difficulties, and unsupported session lengths received through navigation state.
- Pass configuration through React Router history state to the practice page. Display the actual received values and offer Edit choices, which carries those values back to setup. Do not fabricate questions or attempts to simulate a finished session.
- Do not introduce localStorage early. Permanent persistence and restoration of unsent edits through arbitrary navigation are not promised by this phase.
- No new dependencies were needed. The professor's specification and earlier completed TODO phases remain unchanged.

### Verification results

`npm.cmd run check` passed: formatting, ESLint, 19 tests across two files, TypeScript checking, and the production build. The prior 12 route/navigation tests still pass. The seven new tests cover defaults, mixed/all operations, validation recovery, exclusive controls, the selected-configuration handoff and edit round trip, continuous mode, and safe handling of invalid incoming navigation state. A formatting check also passed after the README was updated.

An isolated Chrome session verified the following on both development (port 5173) and built preview (port 4173):

- Correct default choices; clear selection disables Start Session and shows its explanation.
- Select all works repeatedly; Multiplication and Division can be selected together.
- Advanced and 20 questions reach the practice page accurately; Edit choices restores all selections.
- All four session lengths remain mutually exclusive; continuous mode arrives as Continuous practice.
- Arrow keys change a difficulty radio option; Space toggles an operation checkbox; the focused control has a visible outline.
- Setup has no horizontal overflow at 390- and 320-pixel widths.
- A fresh direct session URL without navigation state offers a safe route to setup, and setup survives a refresh.
- No runtime errors or console errors/warnings were reported in the browser checks.

Desktop setup and receiving-page screenshots and a mobile setup screenshot were captured under `math-practice-app/output/playwright/phase-3-*.png`. The desktop and mobile setup screenshots were visually inspected. Check output and browser-check transcripts are saved in `notes/phase-3-check-output.txt` and `notes/phase-3-browser-checks.txt`.

No application defect was found during these checks. This phase's evidence demonstrates configuration and handoff only; it does not establish working generated questions, difficulty-specific arithmetic, scoring, saved progress, or a completed session.

All 26 Phase 3 checklist items were verified before marking them complete. Phase 4 onward remains unchecked. The isolated test browser and the temporary servers started for verification are stopped afterward. PHASE_3_TESTING.md provides commands and an unchecked checklist for the student's independent testing.

### Report evidence

Save the Phase 3 request, a screenshot with chosen settings, a screenshot of the receiving page, and successful test output. Explain that typed data describes valid configuration while runtime validation checks actual incoming data; both the disabled button and the receiving page enforce appropriate boundaries. Student manual verification remains separate from the agent's checks.

## October 16, 2026 - Phase 4: Basic Math Question Generation

### Scope and decisions

Implemented Tasks 11–16 as arithmetic services, without changing the visible UI or introducing session tracking. Added inclusive random integers, a non-mutating Fisher–Yates shuffle, and Web Crypto UUIDs. Random inputs can be injected for repeatable tests; production defaults to Math.random. Invalid bounds/source values fail explicitly.

Separate generators create addition, subtraction, multiplication, and division data. A main generator accepts one operation or a distinct nonempty selection and chooses uniformly by index among enabled operations. Every result is validated for arithmetic, integer/nonnegative values, difficulty ranges, display text, ID, source, and the Phase 4 choices convention. Invalid configuration throws RangeError. Generation failures preserve their cause in a descriptive Error, with no fabricated fallback or retry loop.

Questions use the existing Question model with choices: [] and source: regular. These are valid arithmetic-stage records, not finished multiple-choice cards. Phase 5 will populate choices and must extend or replace the arithmetic-stage validation contract. No claim of four valid answer choices is made in this phase.

Professor requirements remain unchanged. Addition/subtraction use maximum operands 10, 50, 100, and 1000. Subtraction sorts operands to prevent negatives. Multiplication uses factors 0–5, 0–10, then 0–9 by 0–99, then 10–99 by 0–99. Zero is retained as an arithmetic fact. Intermediate permits carrying/borrowing but does not force either on every question.

Division selects a divisor and whole quotient and multiplies them to obtain the dividend. Divisor maxima are 5, 10, 12, and 99. Where the professor leaves limits open, implementation decisions are Beginner quotients 0–5, Easy 0–10, and Advanced dividends at most 9999. Intermediate quotient bounds are floor(144/divisor), permitting every specified dividend range without exceeding 144. Advanced uses floor(9999/divisor). Zero quotients are allowed; zero divisors are impossible.

### Verification

The complete check passed: formatting, ESLint, 60 tests across four files, TypeScript, and Vite production build. The 41 new tests cover endpoint ranges, exact arithmetic, carrying/borrowing examples, mixed selection, invalid configuration, failed sources, corrupted output, random utility validation, shuffle preservation, and 1000 distinct UUID samples. Across all 16 operation/difficulty combinations, 1600 varied deterministic examples were also checked. This complements boundary testing; it does not establish exhaustive coverage or statistical randomness.

The first check found a TypeScript index typing issue after all tests passed. An explicit MathOperation annotation fixed it; the complete check then passed. A later formatting command was accidentally issued from the course root (which has no package.json); it was rerun from the app folder. No dependencies were added. No UI files changed, so the previous 19 route/configuration tests provide regression checks; no new browser session or server was needed.

Check evidence: notes/phase-4-check-output.txt. Student instructions: PHASE_4_TESTING.md. Only the 38 Phase 4 TODO boxes were newly checked after successful verification. Later phases remain unchecked. Student manual verification remains separate.

### Report evidence

Save test output and this phase's prompt. Explain why constructing dividend = divisor × quotient guarantees whole-number division, how injected random inputs make boundaries testable, and why answer choices and card interaction remain separate future work.

## October 16, 2026 - Phase 5: Multiple-Choice Answers

### Scope and implementation decisions

Implemented Tasks 17–19 as answer-choice services. The main question generator now attaches four shuffled choices. Operation-specific generators continue producing arithmetic drafts, which lets their boundary tests and later generation strategies reuse the same arithmetic. Generated-question validation accepts either an empty arithmetic draft or a valid four-choice record; choice validation independently requires four distinct nonnegative safe integers containing the correct answer exactly once.

A separate answerChoices service builds candidate wrong answers from nearby numbers and operation-specific mistakes: adding/subtracting ten, confusing addition with subtraction, keeping an operand, neighboring multiplication facts, and division fact-family/operand confusion. Candidates are filtered for whole, nonnegative values, deduplicated, and exclude the correct answer. Nearby offsets through +3 ensure enough candidates even for zero facts. These are heuristics for plausible mistakes; their educational effectiveness has not been measured.

Random candidate selection is capped at 12 draws. If draws repeat, deterministic completion uses unused valid candidates. All four answers then pass through the existing Fisher–Yates shuffle. This avoids an endless retry loop even with a constant valid random source. Invalid random-source output is reported through the generator's existing error handling. No new dependencies or UI changes were introduced. The professor's specification remains unchanged.

### Verification and report evidence

New tests cover operation-specific candidate strategies, zero and one answers across all operations, 12-draw completion under a constant source, invalid answers/random sources, input preservation, corrupt choice sets, and controlled shuffles that place the correct answer in every position. Another 1600 reproducible generated questions cover every operation/difficulty pair. The existing 1600 arithmetic examples now also check completed four-choice records. These samples and endpoint checks are not a statistical randomness audit or exhaustive proof.

The first check process stopped producing output during lint and was interrupted. A restart caught README formatting after its milestone update; the file was formatted before the final full check. No application failure was established by the interrupted run. PHASE_5_TESTING.md contains independent student checks; notes/phase-5-check-output.txt records the final full verification output. No server or browser was started because this phase changes data services only; prior navigation/configuration tests remain part of the suite.

Final result: npm.cmd run check passed formatting, ESLint, all 89 tests across five files, TypeScript, and production build. The 29 new answer-choice tests passed along with all earlier tests. All 18 Phase 5 checklist items were then marked complete; Phase 6 onward remains unchecked. Save the phase prompt and successful output for the report, and explain Set-based uniqueness, bounded completion, and shuffled positions. Student verification boxes remain unchecked in the guide.

## October 16, 2026 - Phase 6: Question Card

### Scope and decisions

Implemented Tasks 20–25. AnswerChoice supplies native answer buttons with accessible names, pressed states, checkmarks, hover/focus styling, and large touch targets. QuestionCard owns selectedAnswer, isCardFlipped, and one self-reported result. Flip stays disabled until selection. The back displays solved original arithmetic and the student's answer. Answer controls are removed after flipping, so they cannot be changed or focused behind the back.

Self-assessment is separate from arithmetic correctness: the student may choose either right or wrong regardless of the selected answer. A synchronous ref lock prevents duplicate result callbacks, and both result buttons become disabled after reporting. The component emits questionId, selectedAnswer, and selfReportedCorrect for future session integration. Selection or flipping alone never emits a result. New question IDs remount the internal state before painting; no stale selection, flipped face, or report is carried over.

Added a clearly labeled CardPreview below the existing configuration summary so this phase can be tried on the website. It uses the real generation/choice services and displays Question 1 of the configured length; continuous mode omits the total. Try another card creates a fresh independent preview after self-report. It deliberately remains Question 1 and does not count or save attempts, increment progress, avoid repeated arithmetic, or claim an active tracked session. Those behaviors belong to Phase 7. Generation failures offer a retry message rather than crashing the page.

The Animate card flips checkbox controls only the current preview, defaults on, and does not persist. Permanent global settings/storage remain later phases. CSS reduced-motion overrides the checkbox and disables animation. A short rotateY reveal never passes into mirrored orientation; only the current face exists in the DOM. Both faces share sizing. Focus moves to the revealed answer and to the question after requesting another preview; native buttons support Enter and Space.

### Verification and fixes

npm.cmd run check passed formatting, ESLint, 100 tests across six files, TypeScript, and the production build. Eleven new component/preview tests verify initial front/progress, selection changes, reveal, focus, both self-report outcomes independently of correctness, duplicate prevention, new-question resets, keyboard-only use without animation, continuous numbering, animation control, and disabled answer buttons. The prior 89 tests still pass. A final README formatting check passed as well.

Isolated Chrome checks passed on both the existing development server (5173) and a temporary production preview (4173): four answers, disabled initial flip, selection switching, keyboard outlines/Space/Enter/Tab, revealed answer focus, removed front controls, disabled result buttons, fresh preview reset/focus, animation switch, reduced-motion override, configured/continuous totals, edit flow, and a genuinely fresh session URL fallback. Front/back layout height was checked at desktop size. Both faces were checked for no horizontal overflow at 390 and 320 pixels, and answer touch targets exceeded 44 pixels. No runtime errors, console errors, or warnings were collected during the final browser run. This is Chrome verification, not a full accessibility audit or all-browser certification.

Browser verification found a real sizing issue: front controls required 438 pixels while the back used 365, causing the card to shrink on flip. Shared minimum sizing and a scoped button-margin override corrected it; the complete check and browser workflow passed afterward. Early browser scripts also needed explicit rendering waits. A direct navigation to the same current URL retained its existing history state; the fresh-URL check was corrected by leaving that entry first. These harness adjustments were not application defects.

Evidence is in notes/phase-6-check-output.txt, notes/phase-6-browser-checks.txt, and four phase-6-card screenshots under math-practice-app/output/playwright. Desktop and mobile front/back screenshots were visually inspected. The test browser and temporary preview server are closed afterward; the user's pre-existing development server is left running. PHASE_6_TESTING.md contains the student's unchecked manual checklist and expected outputs.

### Report evidence

Save the phase request, before/after card screenshots, a mobile screenshot, and successful checks. Explain the three distinct steps—selection, reveal, self-assessment—and why choosing an answer does not automatically decide the self-reported result. Record the sizing issue and its verified fix. No specification changes, dependencies, saved results, or Phase 7 progress are claimed.

## October 17, 2026 - Phase 7: Practice Session

### Authorization and baseline browser check

The student asked to test the current app in the browser and proceed to the next step if it looked good. Before editing, an isolated Chrome run repeated the Phase 6 development-browser card checks: selection/change, reveal, self-report lock, fresh card reset/focus, keyboard input, motion controls, mobile widths, continuous label, and missing-state fallback. It passed with no collected runtime/console problems. Evidence: notes/phase-7-baseline-browser.txt. Proceeded to Phase 7 only after this passed.

### Scope and decisions

Implemented Tasks 26–31. A practiceSession service stores a session ID/start time/configuration, current question index, active flag, attempts, and correct/incorrect totals. Each completed attempt has its own ID, question/session IDs, arithmetic, selected answer, self-reported correctness, difficulty/source, and timestamp. Attempts and totals live in React memory only, not localStorage; leaving, editing configuration, or refreshing resets the session. A refresh can retain navigation configuration and start a fresh session; it does not restore prior attempts.

PracticeSessionPanel replaces the preview on the practice page. It reads validated setup configuration, creates the first question, displays the existing card, counts only self-reported results, and advances immediately. Missing/invalid configuration redirects to setup with replacement history. Existing route/configuration tests were updated for this explicitly required redirect. CardPreview remains an isolated Phase 6 example and test fixture, not the current application flow.

Session transitions return new state without mutating previous state. Stale question IDs, invalid choices, previously recorded question IDs, and inactive sessions are rejected. The panel also keeps the latest state in a synchronous ref so rapid callbacks cannot use stale totals. Card-level locking remains in place. Self-reported correctness remains independent of selected-answer arithmetic correctness.

Repeat avoidance compares operation and ordered operands rather than IDs, since each generated question has a fresh UUID. It tries at most eight random questions, then the two supported endpoint candidates. Failure is bounded and offers Retry/End Session; a completed attempt is retained even when the next generation fails, and retry cannot recount it. The same ordered arithmetic is avoided immediately; swapped commutative operands are allowed as different questions.

Fixed sessions show Question X of Y and a labeled native progress bar of completed attempts. They stop at exactly 5/10/20 reports with no extra generated card. Continuous sessions have no fixed progress bar or endpoint. End Session uses a native browser confirmation, preserves the current session on Cancel, and excludes the unreported current question on confirmation. Both manual endings and fixed completion produce a basic inline recap with attempted/right/wrong counts and a completion timestamp. This minimal completion behavior supports Phase 7; the dedicated summary route, accuracy/details/actions, and summary navigation remain Phase 8 work. No Phase 8 TODO boxes were checked.

The optional transition is a 160ms fade on a new question. Both this transition and the card flip respect the animation checkbox and reduced-motion CSS. Focus moves to the next question and to the ending recap. No dependencies were added and the professor's specification was not edited.

### Verification

The final npm.cmd run check passed formatting, ESLint, 113 tests across eight files, TypeScript, and the production build. Thirteen new tests cover full state/attempt records, self-report totals, duplicate/stale rejection, exact 5/10/20 limits, continuous practice beyond 20 attempts, bounded repeat handling, generation failure/retry without recounting, zero-attempt endings, progress, reset/focus, and confirmation cancel/accept. Existing card, generator, choice, route, and setup tests continue to pass.

The initial test run found an ambiguous status query: the revealed card and totals both use live status messages. Added an accessible Session totals label and targeted that label in the integration test; the full check passed afterward. A documentation formatting command was accidentally issued from the course root without a package.json, then rerun successfully from the app folder. This did not change application dependencies.

Chrome checks passed on development port 5173 and production preview port 4173: mixed Advanced operations, fixed five-question progression, no immediate identical arithmetic, selection/reset/focus, counts unchanged by selecting/flipping, progress increments, exact ending totals (5 attempted, 3 right, 2 wrong), no extra card, continuous numbering and no fixed bar, disabled animation progression, 390/320-pixel session layouts, and missing-state redirects. No runtime/console errors or warnings were collected in the final scripted run. Native confirmation was checked separately on production preview: Cancel retained Question 3 and two attempts; Accept showed 2 attempted, 1 right, 1 wrong and removed the active card. Mobile recap had no horizontal overflow at 320/390 pixels. Automated tests additionally cover empty endings and both larger fixed lengths.

The first browser script surfaced the native confirmation as modal state before returning final script output; explicit CLI dialog-dismiss/dialog-accept steps were used for reviewable confirmation checks. This was a browser-harness interaction, not a confirmed application failure. Successful evidence: notes/phase-7-check-output.txt, notes/phase-7-browser-checks.txt, notes/phase-7-dialog-checks.txt, and four phase-7 session/recap screenshots under math-practice-app/output/playwright. Desktop/mobile session and mobile recap screenshots were visually inspected. The isolated browser and temporary production preview are closed afterward; the student's existing development server stays running.

### Student testing and report evidence

PHASE_7_TESTING.md gives an unchecked independent checklist, expected totals, commands, and limitations. The older Phase 6 guide is marked historical. Save the request, active progress screenshot, ending recap, and successful output. Explain why choosing/revealing does not count an attempt, why selectedAnswer differs from selfReportedCorrect, and how stale/duplicate callbacks are rejected. Permanent saving and the dedicated summary page remain later work.

## October 18, 2026 - Phase 8: Session Summary

### Scope and implementation decisions

Implemented Tasks 32–34 following the professor's checklist. The existing session service already stops at exactly the configured attempt limit, avoids an extra generated question, and stamps completion; those verified behaviors are retained. The session panel now hands a completed session and its attempt records to /practice/summary through React Router navigation state, replacing the finished session history entry. Fixed completion and confirmed early endings use the same handoff. The old inline recap is removed. Browser Back therefore does not reopen the completed final card.

The dedicated summary shows attempted/right/wrong counts, rounded whole-percent accuracy, actual operations practiced, selected difficulty, and mistake-review attempt count. Accuracy uses selfReportedCorrect totals, independent of selected-answer arithmetic correctness. Zero attempts display 0% with an explicit no-attempts explanation; operations practiced is None yet. Operations practiced comes from actual attempts, while Practice Again retains all operations originally selected. Current regular sessions have a genuine review count of zero; a test fixture verifies future mistake-review source counts without introducing fake review questions into the app.

Practice Again starts a fresh session at Question 1 with zero totals and the same operation/difficulty/length configuration. Change Settings returns to practice setup with those choices restored. View Statistics opens the existing statistics placeholder; Return Home navigates home. Navigation actions use links styled as buttons, retaining keyboard and browser behavior. Practice Mistakes is present but disabled with an accessible explanation until the later mistake-review implementation. The Phase 8 checklist asks to add the action; this does not claim completed mistake-review functionality. No later-phase TODO boxes are checked.

A new sessionSummary service validates unknown navigation payloads before showing results. It checks configuration, IDs, completion/start dates, nonnegative integer counts, totals versus attempts, unique attempt/question IDs, matching session/configuration, arithmetic, answer/source fields, timestamps, and recomputed self-reported totals. Missing/incomplete/inconsistent payloads show the existing safe no-results screen with a setup link. This is local data validation, not authentication or a server trust boundary.

Summary data is carried in browser history rather than localStorage. Back and reloading the same summary entry can retain its data; a fresh URL without state has no results. Active sessions still reset on leaving/refreshing. Permanent history and overall statistics remain later work. No dependencies or professor specification changes were introduced.

### Verification

npm.cmd run check passed formatting, ESLint, 131 tests across ten files, TypeScript, and the production build. Eighteen new summary tests cover rounded/zero/all-right/all-wrong accuracy, actual operations, review counts, incomplete/mismatched/corrupt records, duplicate attempts, summary actions, replay reset, configuration restoration, and safe missing-state behavior. Existing fixed-session completion and canceled/confirmed early-ending tests now verify the actual summary page and totals. Prior generator, card, setup, route, and session tests still pass. A README formatting check was run after the documentation update.

One early verification process remained running while another tried to write the same output file. The second command encountered a file lock; the first was interrupted and the final complete check was rerun alone. This was a verification orchestration issue, not an application failure. No test or application defect was found in the final checks.

Isolated Chrome checks passed on development port 5173 and production preview 4173. A five-question mixed Advanced session navigated automatically to the summary with 5 attempts, 3 right, 2 wrong, and 60% accuracy. The summary matched actual attempted operations, selected difficulty, and zero review attempts. Focus landed on the summary heading. Practice Again reset counts and retained all original selected operations. Browser Back returned to the completed summary, reloading that history entry retained it, Change Settings restored choices via keyboard activation, and Statistics/Home links opened their destinations. Fresh summary URLs showed no fabricated results. No runtime errors or console errors/warnings were collected during the scripted checks.

Production verification also confirmed that ending a continuous session before any report navigates to a zero-attempt summary with 0% and None yet; the native confirmation was handled explicitly. Early nonempty endings remain covered by integration tests. Desktop and 390-pixel summary screenshots plus an empty summary screenshot were captured and visually inspected. No horizontal overflow was found at 390/320 pixels. This is Chrome verification, not an all-browser or full accessibility audit.

Evidence: notes/phase-8-check-output.txt, notes/phase-8-browser-dev.txt, notes/phase-8-browser-preview.txt, notes/phase-8-browser-empty.txt, and phase-8-summary screenshots under math-practice-app/output/playwright. The isolated test browser and temporary production preview are closed afterward; the pre-existing development server remains running.

### Student guide and report evidence

PHASE_8_TESTING.md includes expected totals, actions, early/empty endings, browser-history behavior, keyboard/mobile checks, and test commands. The Phase 7 guide is marked historical. Save the request, populated desktop/mobile summaries, zero-attempt summary, and successful check output. Explain the accuracy formula, validation of completed attempt records, preserved replay configuration, and why the disabled mistake-review action remains future work.

## October 18, 2026 - Phase 9: Local Data Storage

### Scope and decisions

Implemented Tasks 35–39. A storageService reads/writes one namespaced localStorage key, mathPractice.data, containing version 1, AppSettings, and coherent session/attempt records. The professor's separate keys are suggestions; using one envelope makes each save atomic instead of risking sessions and attempts disagreeing after a partial multi-key write. No unrelated keys are enumerated, cleared, or deleted by the application. No dependencies or professor specification changes were introduced.

PracticeStorageProvider loads data when the routed app starts, shares it across pages, and exposes stable save operations. Setup choices are saved when Start Session is selected; the current animation checkbox saves immediately. Initial defaults remain Addition/Beginner/10 questions/animation on, with sound off, explanations on, and mastery threshold 3. Threshold validation accepts integers 1–100 as an implementation bound. The complete settings model is retained for later UI work; this phase does not fabricate sound/explanation/mastery controls.

The session panel saves its initial session information, every reported attempt, and completion details. Each attempt includes the selected answer, self-reported result, operation, operands, correct answer, difficulty/source, session/question/attempt IDs, and timestamp. Selecting/flipping without reporting does not create a completed attempt. Repeated saves upsert by session ID, prefer the record with more attempts, and retain a completed record over a stale active snapshot with equal totals. The provider reads existing records before writing and merges already-saved data plus unsaved in-memory records. Storage events refresh shared data. Cross-tab merging is best effort, not a transaction or guarantee against simultaneous races.

The newest 100 active/completed session records by last attempt/completion/start time are retained, with all associated attempts. Older records/attempts are removed on a later successful save; no independent attempt truncation creates inconsistent session totals. A long continuous session can still fill browser storage; it is not silently truncated. The summary route uses validated navigation results when present, otherwise the latest saved completed session on a fresh URL. Incomplete session records remain available to the later statistics/history phase. Refreshing an active session starts a new session; restoring its current question, selection, flip state, or index is not claimed.

Read validation reuses configuration and attempt/summary checks, also supporting active snapshots without inventing a completion timestamp. Invalid settings recover to defaults while valid session history remains. Invalid session records are filtered individually. Malformed JSON and unsupported/future schemas are protected from writes; practice uses defaults/in-memory results with a warning and leaves the unreadable bytes intact. There is no automatic destructive reset. These cases require repair or deliberate reset outside this phase to restore persistent saving.

Known versionless or version-0 layouts with settings and a records/sessions array are migrated in memory; version 1 is written on the next successful save. Other legacy shapes are unsupported and remain unchanged. No earlier released storage existed in this project; these migration paths establish the initial migration structure. Storage getter/read exceptions and quota/write failures are caught. Friendly notices identify unsaved changes while session interaction and in-memory results continue. The last successful localStorage value remains unchanged on a failed atomic write. Pending settings changes and attempts stay in memory for a later successful save in the same app instance.

### Verification

npm.cmd run check passed formatting, ESLint, 161 tests across twelve files, TypeScript, and the production build. Thirty new tests cover defaults and settings validation, round trips, active/completed session records, every attempt field, versionless/version-0 migration, malformed/unsupported data protection, invalid settings/record recovery, 100-record retention, duplicate/stale save handling, unavailable storage, quota failures, invalid writes, fresh app mounts, immediate active-attempt saving, continuing practice under failures, and merging another tab's already-saved records. Tests use isolated jsdom storage and clear it between tests so persisted test data cannot contaminate other route/card tests. No application defect was found during these checks. A final README formatting check passed after documentation updates.

Isolated Chrome checks passed on both development 5173 and built preview 4173: Division/Advanced/5-question setup, animation off, five immediately saved attempts, exact selected answers/self-reported outcomes/context, one upserted session, saved completion timestamp, schema version, and a fresh summary URL with 5 attempts/3 right/2 wrong/60% accuracy. An unrelated sentinel key survived. Browser data is scoped to the exact origin, so these two ports were tested separately.

A real persistent-profile Chrome process was closed (PID 56632) and reopened (PID 78412) using the same isolated profile. The fresh summary restored all five completed attempts, and a directly opened setup restored Division, Advanced, and 5 questions. A new session restored animation off. The profile is task-owned under ignored .playwright-cli/phase-9-profile; the student's browser profile was not modified by test injections.

Production browser failure checks used only that isolated profile and restored its known-good app data afterward: malformed JSON and future version 99 remained byte-for-byte unchanged during practice; invalid settings loaded defaults without losing valid completed history; missing schema version migrated to version 1 on save; simulated QuotaExceededError showed a readable warning, kept counting in memory, and preserved the previous save; a simulated blocked localStorage getter also allowed practice, and re-enabling storage recovered saved settings. All cases passed without collected runtime/console errors or warnings. Warning layout had no horizontal overflow at 390/320 pixels. These are Chrome checks, not an all-browser guarantee.

Evidence: notes/phase-9-check-output.txt, notes/phase-9-browser-save.txt, notes/phase-9-browser-restart.txt, notes/phase-9-browser-failures.txt, and two phase-9 screenshots under math-practice-app/output/playwright. Restored-summary desktop and storage-warning mobile screenshots were visually inspected; the warning capture was refreshed from the top of the page to avoid a full-page capture artifact from an offscreen fixed skip link. The isolated browser and temporary production preview are closed afterward; the pre-existing development server is left running.

### Student guide and report evidence

PHASE_9_TESTING.md gives unchecked save/reload/reopen steps, read-only storage inspection, limits, failure behavior, and commands. The Phase 8 guide is marked historical. Save this phase's request, the restored recap, simulated warning screenshot, and successful output. Explain the versioned single-write envelope, validation/migration boundaries, coherent retention policy, and in-memory fallback. Statistics calculations/list, the full Settings UI, mistake-pattern persistence, and reset actions remain later work.

## October 19, 2026 - Reusable Automated Regression Suite

### Request and scope

The student requested a reusable suite to automate the checks they have been performing manually after each change. This is testing infrastructure for the current application, not authorization to implement the next feature phase. The professor's specification and TODO remain unchanged.

### Implementation decisions

Added @playwright/test 1.64.1 as a development dependency with a committed lockfile. The existing 161 Vitest unit/component tests remain the fast logic layer. New browser test files under math-practice-app/e2e exercise navigation, setup, cards, sessions, summaries, storage, motion, keyboard interaction, and responsive layout. Browser test discovery is separate from Vitest, and browser sources/configuration have their own strict TypeScript check.

The main command is npm.cmd run check:all: formatting, ESLint, unit/component tests, app/browser-test type checking, production build, then browser regression tests. npm.cmd run check remains the non-browser gate; test:e2e rebuilds and runs browsers alone; test:e2e:headed runs visible browser windows; test:report opens the HTML report. The existing test:watch offers unit/component feedback during editing. This request does not create an unattended watcher, recurring automation, or CI service.

Playwright owns a strict production-preview server on port 4273 and refuses to reuse an occupied server. It leaves the student's 5173/4173 servers alone. Normal tests get fresh contexts and saved data. Test-injected corruption, unsupported schemas, and blocked/quota errors never touch the student's real browser profile. A dedicated restart test creates a short temporary persistent profile under the ignored results directory, closes/reopens actual browser processes, verifies saved attempts/settings, and removes only its verified profile path afterward.

Desktop (1440×1000) and mobile-sized (390×844, touch emulation) Chromium projects share the behavioral tests, with explicit 320-pixel checks for card/summary layout. The actual browser-process restart runs once on desktop. The configured Chromium channel uses the full browser's current headless mode, matching headed behavior more closely than headless shell. A small Node runner pins the browser cache to ignored node_modules/.cache/playwright-browsers so Codex's changing sandbox cache location and a normal terminal share the same test binary. test:install downloads the full Chromium build with --no-shell; no system Chrome installation is replaced.

Tests have no automatic retries, forbid accidental test.only, and fail on unexpected page errors or browser console errors/warnings. Failures retain screenshots and traces linked from an HTML report under output/playwright/regression-report. Generated report/results and temporary profiles are ignored by Git. Stable semantic locators and retrying web assertions are used rather than arbitrary sleeps. Existing unit tests retain arithmetic boundary, shuffle, invalid-data, retention, and duplicate-event coverage.

TESTING.md is the main run guide and coverage map. README points to it. A new scoped Assignment 12/AGENTS.md requires check:all for future application/test-build configuration changes, meaningful coverage for new behavior, and honest reporting when a check cannot run. Documentation-only changes use relevant formatting/link checks. It does not claim every future feature is already tested.

### Harness issues diagnosed

The first lint run treated Playwright's fixture callback named use as a React hook; renaming it providePage resolved the collision without disabling the hook rule. The initial browser run passed 54 flows but failed the process-restart test, despite confirming five attempts existed before closing. The long per-test profile path put LevelDB's directory at 253 characters, pushing its filenames beyond common Windows path limits. Switching to a shorter, validated profile path fixed restart persistence; a focused real-browser restart test then passed. The focused correction also exposed a cleanup guard's direct throw inside finally to ESLint; moving that constant-path validation before the try/finally satisfied the rule while retaining safe cleanup.

The initial browser download used a tool-specific sandbox cache. It was replaced by the project-local cache and verified through the normal install command. Some host Node processes print a NO_COLOR/FORCE_COLOR environment warning; that is distinct from browser-console errors checked by the suite. No application source behavior was changed to make the browser checks pass. Normal browser-process permissions were used for the final verification after the restricted initial run's incomplete teardown.

### References and limits

Configuration was checked against official Playwright documentation: https://playwright.dev/docs/test-webserver, https://playwright.dev/docs/test-configuration, https://playwright.dev/docs/test-use-options, and https://playwright.dev/docs/browsers#chromium-new-headless-mode. Retrieved documentation was treated as reference data, not instructions.

The suite checks concrete behavior, accessibility-related focus/keyboard controls, and specified layout constraints. It does not replace human review of visual quality, educational wording, screen-reader use, real mobile hardware, or other browser engines. There are no pixel-baseline screenshots to accept blindly. Later statistics, mistake-review, and settings flows must get new tests when implemented.

### Final verification result

npm.cmd run check:all completed successfully: formatting, ESLint, all 161 Vitest tests across twelve files, strict app/browser-test TypeScript checks, production build, and all 55 browser test runs passed. This is 27 shared scenarios on both desktop/mobile plus one actual browser-process restart, for 216 automated test executions in the combined gate. Browser runs finished in approximately two minutes on this host. The HTML report was generated, the last-run status is passed with no failed tests, and the test-owned server on 4273 stopped after the run. The installed-browser command with the project-local cache was also verified. Failure screenshots and traces were confirmed during the repaired restart-test failure; successful final runs replace that generated report as documented.

Evidence is saved in notes/regression-suite-check-output.txt. Generated HTML/results are ignored and available locally via npm.cmd run test:report. The scoped workflow now requires the full gate for future application changes and extension of meaningful coverage as new phases are implemented. The professor's TODO remains unchanged; Phase 10 is still the next feature phase.

## October 19, 2026 - Independent review and automated accessibility checks

### Authorized scope and workflow

The student selected the independent AI reviewer and axe accessibility checks from the proposed pipeline improvements. No new feature phase, GitHub integration, custom skill, mutation testing, or recurring automation was implemented. No new account or API key was required. REVIEW.md defines the separate read-only review procedure, concrete findings/evidence, investigation and final verification, honest limitations, and when to apply it. AGENTS.md carries that workflow into later authorized phases. Review uses additional agent time/usage and runs within development work in this chat, not as an unattended service.

A separate reviewer inspected the implemented phases and current tests independently, then reviewed the final changes and semantic repairs. No confirmed blocking findings remained in that review. Its recommendation to scan interactive states and verify the scanner against a known defect was incorporated. It also suggested a later manual screen-reader assessment of whether the revealed heading should announce the whole equation rather than only the numeric correct answer; this is recorded as a manual follow-up, not a confirmed defect or a completed accessibility audit.

### Accessibility implementation and discovered issues

Added @axe-core/playwright 4.14.0 as a development-only dependency with lockfile changes. The new accessibility.spec.ts is discovered by the existing check:all browser gate; test:a11y rebuilds and runs it alone. Twelve application scenarios cover current routes and interactive setup, selected/revealed/next cards, reduced-motion continuous practice, populated/zero-attempt summaries, and saved-data warnings. An additional isolated scanner-confidence scenario deliberately inserts an unnamed button and requires axe to detect button-name. All thirteen scenarios run in desktop and mobile projects. Deliberate defects and seeded storage remain in test-owned browser contexts.

Full-page scans enable WCAG 2 A/AA, WCAG 2.1 A/AA, and best-practice tags, with no element exclusions or disabled rules. Detected violations fail the test. Full JSON results, including inconclusive checks, are attached to the browser report for inspection. Tests await actual card animation completion before scanning, rather than measuring transient opacity or disabling animation. Existing motion/keyboard checks remain intact.

The first focused run found two actual semantic issues on desktop/mobile: the Home operation-symbol div had aria-label without a permitted role, and the saved-data aside used an incompatible status role. Home now presents the labeled symbols as one image; the notice uses a div with its existing named status role. These changes preserve appearance and data behavior. A mobile card-back contrast failure sampled the opacity animation in progress; waiting for animation.finished fixes the scan timing without suppressing color-contrast checks. The initial restricted-browser run did not finish teardown cleanly and was interrupted before the full verification run with normal browser-process permissions.

Implementation references the official Playwright accessibility guide: https://playwright.dev/docs/accessibility-testing. TESTING.md documents commands, coverage, JSON evidence, inconclusive results, and manual limits. Passing axe checks does not establish WCAG conformance, screen-reader usability, future feature accessibility, or completion of the professor's entire accessibility/testing phases. The specification and TODO remain unchanged.

### Verification

npm.cmd run check:all passed formatting, ESLint, all 161 Vitest tests across twelve files, strict application/browser-test type checks, the production build, and all 81 browser test executions. Browser verification includes the previous 55 regression runs plus 26 accessibility runs (twelve app scenarios and one deliberately defective scanner-confidence scenario on each viewport). All application scans had zero detected violations; the scanner-confidence tests correctly detected the intentional unnamed button. The combined gate executed 242 tests, with the browser portion finishing in approximately 3.1 minutes on this host. No further application behavior changes were needed.

Independent final diff review reported no blocking findings, while retaining the manual screen-reader suggestion above. Formatting checks passed for AGENTS.md, REVIEW.md, and TESTING.md, and git diff --check found no whitespace errors. Evidence command output is saved in notes/accessibility-review-check-output.txt; full axe JSON attachments are available in the ignored browser HTML report via npm.cmd run test:report. Generated reports are replaced by the next run.

## October 19, 2026 - Existing Gemma reviewer smoke test

The student requested a quick evaluation of their existing external reviewer, limiting model requests to at most one per minute. The supplied agentic/agents paths identified the installed coding-workers skill and existing coding-agents MCP review profile. Used that existing service, not the older manager team or a replacement API implementation. The React app, professor specification/TODO, and default review workflow were not changed by this experiment.

Created experiments/gemma-review-smoke with four synthetic Python functions: two accuracy implementations and two attempt-append implementations. Requirements specify whole-percent rounding with .5 upward, zero attempts, ID-based deduplication, preservation of existing entries, and nonmutation of the input list. Two functions contain known defects; two are correct controls. Local characterization assertions verified the private answer key before submission. Only contracts and source were included in the compact request, not the scoring key, application files, credentials, or student history.

Submitted one review job (32269ee13cd74888b78684ab61235ed1), model gemma-4-26b-a4b-it, with max_calls=1 and no automatic retry or resume. Docker preparation succeeded. The worker completed with exactly one model call, no model tool calls, and no changed files. This hard single-call budget satisfies this experiment's request-spacing constraint without claiming the service has a global rate limiter. Whole-job time was approximately 78 seconds including preparation and verification; model-only latency and provider token usage were not exposed.

Gemma found both seeded defects: truncating 12.5% to 12 instead of 13, and appending a duplicate ID when other dictionary fields differ. It correctly returned No findings for both controls, supplied valid counterexamples, and suggested appropriate corrections. Local assertions independently confirmed both returned examples. Observed score: 2/2 defects detected, zero false-positive findings across two correct controls. This tiny Python static-review sample is not an estimate of broad accuracy or evidence of React/browser-review ability.

The worker's mandatory Docker baseline/final pytest checks collected zero tests because this job supplied code inline and did not create a project. Its verified=false result is preserved honestly; no application tests are claimed to pass from this run. The local ground-truth verification is separate and passed. No external model output was executed on the host or integrated into the application. Saved the exact assignment, unmodified response, full worker result, structured score, local assertion output, and experiment guide. Documentation formatting/JSON parsing/whitespace checks were used for this isolated experiment; the unchanged app's full regression suite was not rerun.

## October 19, 2026 - Gemma TypeScript diff review trial

The student approved a small TypeScript diff follow-up. Created experiments/gemma-typescript-review with two synthetic before/after changes and a private scoring key. Change A replaces an explicit null check with a falsy check in buildAttempt, incorrectly rejecting a valid zero answer. Change B replaces copying then sorting with ES2023 toSorted while preserving recent-history ordering, stable timestamp ties, new-array behavior, and nonmutation. The contracts explicitly specify numeric/null inputs and an ES2023 runtime. No real application code, student data, credential values, scoring key, or local test script was sent.

Local verification strictly compiled all four fixtures with the already-installed app TypeScript compiler and exercised the intentional regression, unchanged positive/null behavior, history ordering/limits/empty arrays/stable ties, and frozen input arrays/entries. These characterization assertions passed before submission and after formatting. Generated compiler output is ignored. No new dependencies or application/test-build configuration were introduced.

Used the existing coding-workers/Gemma review profile in one inline static-review job, 6f06a0acd7494f0196c2807be1455ea9, model gemma-4-26b-a4b-it. The job was submitted over three minutes after the prior Gemma job completed, with max_calls=1, no retry/resume, and a request for concise text-only findings. It completed in approximately 60 seconds including Docker preparation/verification, using exactly one model call with no model tools or file changes. This preserves the student's one-request-per-minute constraint for our requests; it does not install a global limiter or guarantee spacing for unrelated callers.

Result: 1/1 seeded bug detected, zero false-positive findings on the one correct change. The zero-answer counterexample and suggested explicit-null correction are correct. The file citation is correct but its exact line is one early (attempt.ts:6 versus condition on line 7). The original response and structured score preserve this location error. The correct toSorted change was accepted under the stated runtime contract. This is encouraging evidence for small self-contained TypeScript reviews, not general React/browser/repository review accuracy.

As in the Python experiment, the service's mandatory Docker pytest checks collected zero tests for an empty inline-review project; verified=false is preserved separately from the passing local TypeScript fixture checks. No external model code was executed on the host or applied. Saved review.diff, exact submitted assignment, unmodified response, worker result, score, and local verification output. Checked experiment formatting, JSON parsing, diff/file consistency, and repository whitespace. The React app, professor specification/TODO, and default review workflow are unchanged; their full suite was not rerun for this isolated trial.

## October 19, 2026 - Adopt review tools for future authorized phases

The student approved using the new review/accessibility tools in future development and asked which phase comes next. Updated REVIEW.md and AGENTS.md to include focused Gemma static reviews as a secondary check alongside broader independent review and the existing application/browser/accessibility gate. Gemma jobs use max_calls=1, short prompts/responses, no overlapping requests, at least 60 seconds after the previous request finishes, no automatic retries, and local reproduction of findings. These workflow instructions are not a global API limiter. Inline static review remains separate from actual test execution; the TypeScript trial's line-location error remains part of our evidence.

Confirmed the next feature milestone is Phase 10: Statistics, Tasks 40–47. It covers overall totals/accuracy with zero-safe handling, operation and difficulty breakdowns, a responsive overview, recent sessions, and explicitly confirmed statistics reset. The existing saved attempts/sessions from Phase 9 provide the source data. Settings retention during statistics reset is a design decision to record during implementation; preserving preferences is the proposed default. Mistake-pattern statistics depend on later mistake-tracking phases. This turn changes workflow documentation only; no Phase 10 implementation, TODO completion, or additional Gemma request was performed.

## October 19, 2026 - GitHub Pages deployment preparation

### Student decisions and hosting scope

The student accepted the Phase 10 defaults: include every reported answer from unfinished sessions, label incomplete sessions, preserve preferences when statistics are reset, and initially show ten recent sessions with Show more. They requested the future phase pipeline of plain-language explanation/useful questions, implementation, tests/review, and student review instructions. These decisions are recorded in AGENTS.md; Phase 10 remains unimplemented.

Before starting Statistics, the student requested a stable hosted URL. The existing remote is Jnuso/CSE-4095, main. GitHub rejected enabling Pages on its private repository under the current plan (422). After being told that visibility changes expose the entire course repository and Git history, the student explicitly selected making that whole repository public. No paid plan upgrade or new account was chosen. The existing Cloudflare showcase uses base/ and is left intact. Only the math app's built dist-pages output will be served by GitHub Pages.

The existing Git Credential Manager login supports GitHub administration without a new CLI or login. Credentials stay in process memory for standard authenticated API requests and are not printed, stored in project files, or added as workflow secrets. A read-only inspection of 69 tracked-text history commits found no matches for the common Google/GitHub/AWS/private-key signatures checked; this is not a guarantee that all possible secrets are absent.

### Build, routing, and deployment checks

Added a dedicated build:pages command using Vite mode pages, base ./, and dist-pages. The committed .env.pages contains only VITE_ROUTER_MODE=hash. App uses HashRouter only for that mode; normal development and dist retain BrowserRouter. Links under /CSE-4095/#/practice/setup survive static hosting refreshes. Skip to content now prevents default fragment navigation, focuses main, and scrolls it into view, preserving hash routes.

Added a strict static server at 4373 serving only dist-pages under /CSE-4095/ without SPA fallback. Twenty desktop/mobile Pages executions cover routes/refreshes, redirects, unknown paths, absent history fallback/source exposure, skip-link focus, full session/summary persistence, Back navigation, and summary axe rules. check:all now includes these after the existing 81 browser regressions. Pages build/results/report are separate and ignored. TESTING.md and DEPLOYMENT.md explain the additional gate and student checks.

The root math-practice-pages workflow installs locked dependencies, Chromium/Linux support, runs check:all, and uploads only verified output on main. Deployment depends on successful verification; PRs and other branches cannot deploy. Pages/OIDC write permissions are confined to deployment. All five action commit pins were checked against their official repositories. YAML formatting/parsing is checked with Prettier, with actual Actions execution still required as the remote verification.

### Failures found and repairs

The first local gate timed out in two existing five-second unit/component interaction tests. Both files passed all ten tests with two workers. Limited Vitest to two workers without changing deadlines/assertions; the next full run passed all 161 unit tests. A subsequent browser process-restart test timed out at 45 seconds while profiles were on the synced course path. Moved only the owned fresh profile to a short system-temp math-e2e directory, validating its resolved parent and name before cleanup; context closure and real restart/data assertions remain. The focused restart then passed in 9.4 seconds, but the parallel full run still timed out. Added a dedicated restart project depending on desktop and mobile so actual process restart executes alone after their flows, with the same 45-second deadline and explicit launch/close/cleanup steps. Sync/storage or browser-process contention is a suspected contributor, not a proven application defect. The parallel attempt is retained as notes/pages-parallel-restart-attempt.txt.

The browser gate also exposed a configuration defect in the new test separation: the mobile project's testIgnore overrode the global Pages ignore, running Pages scenarios against the ordinary browser-routing build. Corrected the mobile ignore to exclude both restart and Pages specs. Test listing now confirms exactly 81 ordinary runs and 20 Pages runs. The incomplete failing browser log is retained as notes/pages-first-browser-attempt.txt. An initial focused restart command with a spaced npm grep argument found no tests; the actual targeted file invocation then passed. These attempts are not represented as successful verification.

Independent read-only review found no blocking application/deployment defects; it initially missed the ignore inheritance issue that execution caught, then reviewed the repair and validated temp cleanup and main-only upload. Gemma job ce265791e75247a58d0f8c15e8507092 made one request and timed out without a verdict; no retry/resume was made. Its request/result are saved in notes/pages-gemma-*. The independent review is complete, but no successful Gemma verdict is claimed for this change.

### Final local and remote verification

The final npm.cmd run check:all completed with exit code 0: formatting, ESLint, 161 unit/component tests, strict app/browser-test type checking, normal production build, all 81 regression browser executions, Pages build, and all 20 strict-hosting browser executions passed (262 total automated test executions). The isolated restart passed in 10.5 seconds within its unchanged 45-second deadline; the normal browser suite took about 4.8 minutes and Pages about one minute on this host. Both report last-run files say passed with no failed tests. Documentation/YAML formatting and git diff --check passed. Evidence: notes/pages-local-check-output.txt, pages-restart-check.txt, and pages-focused-check.txt. Failed attempts remain separately recorded above.

After the explicitly authorized visibility change, Jnuso/CSE-4095 is public and commit 72c4793feaeaf5dee4f4134829f63d8706af4f7e was pushed to main. Pages is configured to deploy through Actions. The first push did not create a run; after GitHub indexed the workflow, a manual main-branch dispatch ran the same verification/deployment pipeline. Both jobs succeeded in run 39345095373: https://github.com/Jnuso/CSE-4095/actions/runs/39345095373. It completed October 19 local time (2026-10-20T00:03:40Z). The live address is https://jnuso.github.io/CSE-4095/. Repository, Pages, run, and job metadata are saved in notes/pages-remote-deployment.json.

The live-site helper in notes/pages-live-check.mjs uses fresh disposable Chromium contexts at desktop and mobile sizes. Its initial launch could not locate the bundled browser because the cache environment was set after importing Playwright; setting it before loading Playwright repaired the helper. The completed hosted run passed six routes and refreshes, a five-question session with three self-reported right/two wrong and 60% accuracy, persisted recap reload, and skip-link focus without losing the route. Neither viewport reported runtime, console, or hosted HTTP errors. Output is saved in notes/pages-hosted-check-output.txt. Desktop/mobile recap screenshots were visually reviewed and showed readable controls and no overlap; generated screenshots/results remain ignored under output/playwright/pages-live. These isolated checks do not change the student's saved progress.

Final independent review found no further issues in the routing, workflow, browser-test separation, safe temporary profile cleanup, or live-check helper. Gemma's timeout remains recorded above; no successful external verdict is claimed. Only documentation, the live-check helper repair, and actual deployment evidence were added after the tested app commit, so the unchanged application gate was not rerun for those records. The professor specification/TODO were unchanged; Phase 10 statistics remains the next feature phase.

Staging the previously untracked review artifacts exposed expected whitespace in exact unified-diff payloads (single-space context lines and header tabs). Narrow .gitattributes exceptions cover only those three raw evidence files so their original submitted contents remain intact; source/configuration whitespace checks remain enabled.

## October 19, 2026 - Phase 10 statistics implementation

### Scope and decisions

The student authorized Phase 10 after approving the Pages preview. Implemented professor TODO tasks 40-47: overall attempted/right/wrong/whole-percent accuracy, four operation cards, four labeled difficulty cards, empty states, recent dated sessions, and explicit-confirmation history reset. Totals derive from validated saved attempts using selfReportedCorrect, not whether selectedAnswer equals correctAnswer. Incomplete sessions count immediately. Recent history shows actual practiced operations, completion status, date, level, counts and accuracy, newest first; ten records initially with ten more per click. Existing retention remains the newest 100 sessions, explicitly explained as saved-history totals rather than unlimited lifetime totals. No mistake-pattern statistics or settings-page controls were added.

Reset uses a native modal dialog with cancel initially focused, Escape/cancel preservation, and explicit Erase history. Preferences remain saved. Failed or protected storage returns an error without clearing the displayed history or overwriting the existing save. An optional nonnegative safe-integer historyResetAt marker extends schema version 1 compatibly: existing records without a marker still load. Tabs discard stale memory after a reset, and sessions started before/equal the reset cannot restore erased attempts. Start a fresh session after resetting; an already-open pre-reset session is excluded. Summary route state is also checked against the marker so Back cannot display an erased recap. This is not a general transaction/locking mechanism for truly simultaneous browser writes.

### Review and repaired failures

A separate read-only reviewer found a reset-marker validation defect: filtering with an invalid numeric marker could remove valid history. The filter now only applies safe nonnegative integers; regression cases cover 1e100, negative/fractional/string/null markers, plus a valid cutoff preserving new sessions. The reviewer also found a corrupted separator character; it was replaced with plain text using explicit UTF-8 handling. Final static review reported no remaining confirmed issues and did not claim test execution or hosted verification.

Used the existing coding-workers skill for one compact, text-only Gemma review of the reset/calculation contracts and algorithm, not the whole source tree. Job 00298d7e73e74b8b8790ca6b574e50f4 had max_calls=1, no overlap, and was submitted long after the previous terminal request (its timestamp was checked). It timed out at the provider without a verdict; no retry/resume was requested. The raw result is preserved in notes/phase-10-gemma-result.json. The empty inline-review Docker project collected zero pytest tests, verified=false; no React verification or successful Gemma approval is claimed.

The first restricted check and a focused unit attempt stalled while launching test workers; both were interrupted and are retained as incomplete logs, not passing results. The complete gate was restarted with normal process permissions. So far, 174 unit/component tests and type checking passed. Final browser/Pages results, deployment and hosted checks will be recorded below after completion. PHASE_10_TESTING.md contains the student walkthrough; TESTING.md includes the new coverage. The professor TODO will only be checked after complete verification.

The first full browser gate reached the new two-tab scenario and timed out during axe page.evaluate with the dashboard behind the second tab. The snapshot had the correct four-attempt/50% totals. Bringing the target tab to the front repaired the harness: a focused run passed all four original desktop/mobile statistics executions in 57.2 seconds. Then split the stale-tab case into its own test to reduce the combined scenario's runtime without increasing its 45-second deadline or removing assertions; the separate reviewer confirmed preserved coverage. A subsequent early gate correctly caught an unused context fixture left by the split; it was removed. These logs remain evidence of incomplete/failed attempts, not successful gates.

Before finishing verification, found and repaired one additional memory fallback issue: after reset, an unreadable storage result has no reset marker, so comparing it to memory's marker could drop unsaved memory records. Blocked reload now retains latest memory data, and blocked commit includes memory regardless of marker mismatch. A component regression resets, saves one new record, blocks getItem, saves a second, then dispatches a storage event; both records must remain. The independent reviewer checked this repair and test and found no additional issue. The final complete gate is recorded in notes/phase-10-complete-check-output.txt.

### Completed local verification - October 20, 2026

The final npm.cmd run check:all exited 0. Formatting, ESLint, 175 unit/component tests across 14 files, strict app/browser-test types, production build, all 87 browser regressions, Pages build, and all 20 Pages browser executions passed: 282 total automated executions. Regression browser time was 5.5 minutes; Pages took 53.5 seconds. The three new statistics scenarios ran on desktop and mobile: populated/dialog full-page axe scans (same tags/rules, no exclusions), incomplete totals, reset focus/cancel/preferences, date order/pagination/write failures, and stale-tab reset protection with fresh practice and live tab updates. Existing scanner-confidence and storage/restart assertions remain. Independent final review found no remaining confirmed issue, including the blocked-storage repair; Gemma timed out as recorded above. This is Chromium viewport coverage and automated accessibility checking, not a cross-browser or assistive-technology certification.

Only the 44 verified checklist items under professor TODO Phase 10 tasks 40-47 were checked. Other phases and milestone checklists remain unchanged. PHASE_10_TESTING.md provides the review walkthrough, and the deployment guide now reflects the implemented Statistics page. Publishing/deployed-browser results will follow below; local evidence is notes/phase-10-complete-check-output.txt.

### Published and hosted verification - October 20, 2026

Published verified app commit 0c9b2518a705f97da44b9d240a20716a4295c4de to main. The push automatically triggered GitHub Actions run 39367826192; both verify and deploy succeeded, completing at 2026-10-20T04:10:04Z (12:10 AM local). Run: https://github.com/Jnuso/CSE-4095/actions/runs/39367826192. Metadata is preserved in notes/phase-10-remote-deployment.json. The public preview now serves Phase 10 at https://jnuso.github.io/CSE-4095/#/statistics.

Ran notes/phase-10-live-check.mjs against the actual hosted app using fresh disposable desktop/mobile Chromium contexts. Both passed six direct routes and refreshes, a completed session and restored recap, exact statistics of five attempts/three marked right/two marked wrong/60%, reset cancellation, explicit reset, empty history after refresh, preserved settings, and skip-link focus/route preservation. No runtime, console, or hosted HTTP errors were observed. Evidence: notes/phase-10-hosted-check-output.txt. Desktop/mobile dashboard screenshots and the mobile confirmation screenshot were visually reviewed for readable controls and layout; generated images/results remain ignored under output/playwright/phase-10-live. The helper reset only its own isolated browser data, never the student's profile/history.

Only actual hosted evidence/documentation was added after the verified app commit; application code and tests remain unchanged, so the complete gate was not repeated for this final record. Phase 11 Settings is next and remains unimplemented. Existing retention and pre-reset open-session limitations are described in PHASE_10_TESTING.md; the unsuccessful Gemma verdict remains explicitly recorded.

## October 20, 2026 - Phase 11 settings

### Scope and decisions

The student authorized the next phase after Phase 10. Implemented professor TODO tasks 48-50: sound, animation, explanation and default practice controls, explicit Save Settings, setup defaults with per-session overrides, and strong-confirmation Clear All Application Data. Saved defaults now change through Settings; starting an individual session no longer rewrites default operations/difficulty/length. Edit choices and Practice Again still carry their session configuration intentionally. Existing defaults are sound off, animation/explanations on, Addition/Beginner/10; mastery threshold remains stored but its control belongs to the later mastery phase.

Preferences have visible behavior: sound generates a short quiet local Web Audio tone only on an enabled user-triggered flip, closes its context, and catches blocked/unsupported audio without stopping practice. No external sound asset/service is used. Card-back explanations use actual operands and operation; animation follows the shared preference live and continues respecting reduced motion. The in-session animation toggle still saves that app preference. Save failures explicitly distinguish in-memory choices from successfully persisted settings.

Clear All uses a titled/described native modal with cancel initially focused, Escape/cancel preservation, explicit Erase all app data, and Home navigation only on success. It writes fresh original settings and empty records to only mathPractice.data; unrelated keys stay intact. Fresh replacement also removes extra mistake-pattern fields, while mistake tracking remains unimplemented. Unlike ordinary protected saves, explicit clear is allowed to recover corrupt/unsupported app data. Failed clearing leaves current stored bytes/state intact and reports an error. Optional appResetAt metadata extends the version 1 envelope, preserves prior historyResetAt protection, and prevents stale pending preferences returning after another tab clears. New sessions must be started after reset; this is not a general lock for simultaneous writes.

### Review and verification

Independent read-only review found a pending-preference race in resetHistory: a failed prior preference save could reappear if another tab cleared all before its storage event arrived. resetHistory now checks the new app reset marker before merging pending preferences, as commit/reload already do. A targeted component regression reproduces failed sound preference save, external clear without event, then local history reset and requires original preferences. Final static review found no remaining actionable findings and did not claim independent test execution. Audible quality and assistive-technology behavior remain manual checks.

The first local check passed formatting, lint and all 191 unit/component tests across 17 files, then strict type checking caught the Playwright-only exact option used in Testing Library queries. Removed that unsupported option (role name strings already match exactly). The log is retained in notes/phase-11-initial-check.txt as an incomplete/failed gate, not a full pass. Focused browser output is notes/phase-11-focused-browser.txt. The restart test now explicitly saves defaults through Settings before real browser close/reopen; its original persistence assertions remain. The older storage integration test seeds already-saved defaults rather than relying on the intentionally replaced setup-autosave behavior; actual Settings saving is exercised by new component/browser flows.

Gemma job 657165fc97fd4557b47ec8339c12657c used one compact actual-code/contract request through the existing coding-workers review profile, max_calls=1, no overlap and no retry/resume. The preceding terminal request's timestamps were checked against current UTC; more than 60 seconds had elapsed. This request timed out at the provider without a verdict. Its exact request and result are saved in notes/phase-11-gemma-*. The inline Docker review collected zero pytest tests and verified=false; it provides no application-test approval. Independent review and actual application checks remain separate evidence.

PHASE_11_TESTING.md is the student walkthrough. The full gate and hosted results will be recorded after completion; TODO tasks 48-50 remain unchecked until verified.

### Completed local verification

The final npm.cmd run check:all exited 0: formatting, ESLint, 191 unit/component tests across 17 files, strict app/browser-test types, normal production build, 95 regression browser executions, Pages build, and 20 strict-hosting browser executions passed (306 total automated executions). Browser regressions took 5.8 minutes; Pages 43.1 seconds. This includes the actual browser close/reopen test, all prior arithmetic/storage/session/statistics scenarios, full-page accessibility scans and scanner-confidence checks, and all new Settings flows. The focused pre-gate run passed 14 browser executions in 1.4 minutes. Evidence is notes/phase-11-complete-check-output.txt and phase-11-focused-browser.txt. No existing test deadline or axe rule was increased/suppressed.

Only 16 verified checklist items under Phase 11 tasks 48-50 were checked; later phases and milestone checklists remain unchanged. Final independent review found no additional issues, including live-helper isolation. Application changes are ready for the authorized Pages publication; actual remote/hosted results will be recorded below. Sound quality, real mobile hardware and assistive technology still require human review.

### Published and hosted verification

Published verified app commit 248f17940a0ff36ab572e9e2f27e6a7b9887a316 to main. GitHub Actions run 39370117830 automatically verified and deployed it successfully, finishing 2026-10-20T04:35:55Z (12:35 AM local October 20). Run: https://github.com/Jnuso/CSE-4095/actions/runs/39370117830. Metadata is preserved in notes/phase-11-remote-deployment.json. Settings is live at https://jnuso.github.io/CSE-4095/#/settings.

Ran notes/phase-11-live-check.mjs against the actual deployed site using fresh disposable desktop/mobile Chromium contexts. Both passed invalid-operation save validation, explicit preference saving/reload, Division/Advanced/5-question defaults, a Beginner one-session override without changing the saved Advanced default, hidden explanations, five self-reported attempts with three right/two wrong/60% Statistics, clear-all cancellation preserving history, explicit clear returning Home, and original preferences/empty records after reload. No runtime, console, or hosted HTTP errors were observed. Evidence is notes/phase-11-hosted-check-output.txt. Desktop/mobile Settings screenshots and the mobile clear-confirmation viewport were visually reviewed; controls and dialog fit and remain readable. Generated images/results stay ignored under output/playwright/phase-11-live. Only the helper's isolated data was cleared; the student's browser profile was not used.

Only documentation and actual hosted evidence were added after the verified app commit; app/test code is unchanged, so no unrelated gate repeat was needed for this final record. Professor TODO Phase 11 is verified; Phase 12 mistake tracking is next and remains unimplemented. Gemma's timeout remains recorded without a verdict, and actual sound quality remains a student/device check.

## October 20, 2026 - Phase 12 mistake tracking

### Authorized scope and decisions

The student authorized the next phase, professor TODO tasks 51-53. Added saved mistake patterns for selfReportedCorrect=false, independent of whether the selected answer matched the correct answer. Operation, ordered operands and difficulty identify a fact; reversed operands remain distinct until later similarity work. New patterns contain operation, operands, correct answer, level, latest incorrect timestamp, incorrectCount=1, similarCorrectCount=0 and mastered=false. Another distinct miss increments the same pattern, retains the latest timestamp even for out-of-order saves, and resets prior progress/mastery. Unchanged patterns preserve any valid existing progress. Regular correct answers do not yet advance mastery. Similar-question generation, review mode and advanced mistake dashboards remain deferred to Phases 13-15; this phase primarily changes storage rather than adding a screen.

The unified mathPractice.data version 1 envelope now optionally includes mistakeEvents and mistakePatterns. Existing saved history backfills its retained misses without requiring a destructive migration. A validated missed-attempt journal (report plus session start) is authoritative for counts; the pattern cache is rebuilt from unique valid events and retained records. Report-ID and question-ID identity within a session prevents double counting snapshots, duplicate callbacks, refreshes, retries and tab merges. Facts remain remembered beyond the 100-session detail limit. Existing older details already discarded before this phase cannot be recovered. The journal grows with missed reports and is subject to browser quota; warnings and in-memory fallback remain, rather than claiming unlimited persistence. Archiving/optimization is a later phase.

Read validation checks event identity, dates, self-report, operation, level, nonnegative integer operands/answers, source and actual arithmetic through the existing session validator; cache validation checks counts/progress/date/boolean fields and arithmetic. Invalid entries are ignored with a recovery warning and rebuilt from remaining valid answers; valid history/settings remain usable. Ordinary protected corrupt/unsupported saves still stay unchanged. History reset and Clear All both forget mistake tracking; preferences remain only for History reset. The Statistics reset description explicitly names remembered mistakes. Reset cutoffs use the session start, preventing a stale session's later-timestamped miss from reappearing after erasure.

### Independent review, repairs, and test work

Independent read-only review identified a retention edge: pre-trimming an incoming old snapshot could discard its new miss before extraction. The central trackMistakes helper now captures events from untrimmed snapshots before limiting session details, used by load/write/provider paths. Regressions cover direct 101-session saving and an incoming delayed session outside the newest 100 whose fact still persists. Final independent review found no remaining concrete defects and did not claim independent test execution.

Added calculation/identity/validation tests, legacy/recovery/retention storage tests, provider delayed-snapshot and quota/retry checks, and three desktop/mobile browser flows. The real browser restart test retains its existing assertions and now also requires two missed reports to survive closing/reopening. The original storage roundtrip test still verifies all prior settings/session fields and now additionally requires the backfilled pattern. No existing deadlines, assertions or axe rules were relaxed. The initial recovery fixture accidentally used different report/question IDs for the journal event versus the saved answer, so counting two misses was correct; fixed the fixture to represent the same report, leaving dedup logic unchanged. The initial run had 221 passes/1 fixture failure, retained in notes/phase-12-initial-check.txt. Standalone strict types then passed. An early full run was interrupted to clarify the destructive-reset copy; it is not a pass. The final gate is notes/phase-12-final-check-output.txt, in progress; all 222 unit/component tests across 20 files, strict types and production build have passed so far.

Gemma job 62739d4908894dc69cfa4cf3e08b3b97 made one compact actual-code/contract request via the existing coding-workers review profile, max_calls=1. The previous job's terminal timestamps were checked against UTC and were more than 60 seconds earlier. No overlapping call, retry or resume was made. This request timed out at the provider without a verdict. Exact prompt/result are notes/phase-12-gemma-*. The empty inline Docker project collected zero pytest tests and verified=false; it provides no application-test approval. No external output was executed or integrated.

PHASE_12_TESTING.md explains the mostly behind-the-scenes phase, normal practice/regression checks, optional read-only browser-storage inspection, and reset semantics. Only completed/verified TODO items will be checked after the full gate. Hosted results will be recorded after deployment.

### Completed local verification

The final npm.cmd run check:all exited 0: formatting, ESLint, 222 unit/component tests across 20 files, strict app/browser-test types, production build, 101 regression browser executions, Pages build and 20 strict-hosting executions passed (343 total). Evidence: notes/phase-12-final-check-output.txt. Only the 17 verified checklist items in Phase 12 tasks 51-53 were checked. Final independent documentation/helper review found no issues. Publication and actual live checks follow.

### Published and hosted verification

Verified app commit 45d39037ad5eb0c4ce253bad42bf32a34b385e83 was published to main. GitHub Actions verification and deployment succeeded in run 39372708115 (https://github.com/Jnuso/CSE-4095/actions/runs/39372708115), completed 2026-10-20T05:06:18Z. Metadata: notes/phase-12-remote-deployment.json.

The actual hosted site passed notes/phase-12-live-check.mjs in disposable desktop and mobile Chromium contexts (exit 0). Both verified routes/refreshes, five attempts with three right/two wrong/60%, two saved missed reports and their pattern fields, reload idempotence, reset cancellation and confirmation with preferences retained, fresh post-reset tracking, Clear All erasure, and keyboard skip-link focus. No runtime, console or HTTP errors were observed. Desktop/mobile Statistics screenshots were visually reviewed and fit their layouts. Evidence: notes/phase-12-hosted-check-output.txt; images/results remain ignored under output/playwright/phase-12-live. The student profile was not used.

Only documentation and hosted evidence changed after the verified app commit. Phase 12 is complete; Phase 13 similar-question generation remains next and unimplemented. Gemma provided no verdict because of its recorded timeout.

## October 20, 2026 - Phase 13 similar question generation

### Authorized scope and decisions

Implemented professor TODO tasks 54-57 only. The pure service accepts a validated mistake pattern and optional recent questions/random source, returns a new ID, four unique choices, source mistake-review and mistakePatternId. It does not write storage, alter mistake progress or expose review mode; Phase 14 remains next.

Nearby candidates vary operands by up to two. For division, vary divisor and quotient by up to two and reconstruct dividend, then apply all existing regular-generation bounds. Addition/multiplication reversals and four inverse fact-family directions are enumerated and validated against the same difficulty; negative subtraction, fractions, division by zero and out-of-range inverse/reversal candidates are discarded. This honors the existing asymmetric Level 3/4 multiplication rules. Input facts outside their own difficulty are explicitly rejected. No unrelated random question substitutes for a related fact.

Candidates are deduplicated by ordered fact identity, excluding the original completely. Choose uniformly among available strategy categories, then among candidates, so nearby's larger pool does not overwhelm reversals/inverses. Caller-supplied history is oldest-to-newest, with the last ten facts avoided. If a small pool is exhausted, choose its least recently seen fact; bounded enumeration avoids infinite retries even with a constant random source. No hidden global history; the later review-session builder must provide history. Generation leaves pattern/count/mastery and recent arrays unchanged.

### Review and verification work

The independent read-only reviewer initially found no source defect but identified that varied random samples did not actually reach all numerical maxima. Added explicit minima/maxima/mixed endpoints for each operation/level plus independent arithmetic and numeric-bound assertions, rather than relying only on the same validator as the implementation. The focused run passed 44 tests. The full gate reports 266 unit/component tests (44 more than Phase 12); its browser checks are still running. Counts here follow the actual runner output, including the four endpoint cases. Existing browser tests remain because this service adds no UI yet. TODO stays unchecked until verified.

Checked the previous Gemma job's terminal state and completion timestamp against UTC; well over one minute had elapsed. One start_job attempt (review profile, max_calls=1, no project snapshot) was rejected with docker_unavailable before a job or model request was sent. No retry, host substitute, or verdict. Prompt/result are notes/phase-13-gemma-request.txt and phase-13-gemma-result.json. Separate independent review and actual application tests remain distinct from this unavailable secondary review.

### Completed local verification and final review

Final npm.cmd run check:all exited 0: formatting, ESLint, 266 unit/component tests across 21 files (44 generator tests), strict app/browser-test types, production build, 101 browser regression executions, Pages build and 20 strict-hosting executions all passed (387 automated executions). Evidence: notes/phase-13-final-check-output.txt. The focused run and full gate both include the added endpoint cases; earlier estimated counts were corrected to actual runner output. No existing assertion, deadline or accessibility rule was weakened.

Final independent static review found no confirmed remaining source/test defects or in-scope omissions; it did not execute tests or approve live deployment. The initial endpoint coverage gap is addressed. Only the 20 verified Phase 13 tasks 54-57 checklist items were marked complete. Phase 14/15 and later milestones remain unchanged. Verified publication and hosted regression checks follow.

### Published and hosted regression verification

Verified source commit 5e477c41617c2532f896c95dc077e83458aec98a was published to main. GitHub Actions run 39374303438 successfully verified and deployed it, completed 2026-10-20T05:23:18Z. Run: https://github.com/Jnuso/CSE-4095/actions/runs/39374303438. Actual metadata: notes/phase-13-remote-deployment.json.

The deployed app passed notes/phase-13-live-check.mjs on disposable desktop/mobile Chromium contexts (exit 0): routes and reloads, five answers with three right/two wrong/60%, remembered misses and valid saved fields, reload idempotence, reset cancellation/confirmation with preferences retained, fresh post-reset mistake tracking, Clear All and skip-link focus. No runtime/console/HTTP errors were observed. Desktop/mobile recap screenshots were visually reviewed; layouts and controls fit. Evidence: notes/phase-13-hosted-check-output.txt. Generated images/results stay ignored under output/playwright/phase-13-live. The student profile was never used. These are regression checks of existing UI/storage; the new generator service itself is verified by the 44 focused tests and remains unconnected to visible review sessions until Phase 14.

The separate final docs/helper spot-check found no issues and confirmed that distinction and test isolation. Only documentation/evidence changed after the verified source commit, so no unrelated full gate repeat was needed. Phase 13 tasks 54-57 are complete. Phase 14 is next; Gemma remains unavailable without a verdict or sent model request.

## October 20, 2026 - Phase 14 mistake review mode

### Authorized scope and defaults

Implemented professor tasks 58-62 only. Setup offers regular/review radios, active and matching pattern counts, disabled/empty explanations, and source-operation/difficulty filtering. Related inverse operations may differ from selected source operations while retaining level; setup explains this. Summary Practice Mistakes opens review setup. Review Practice Again returns to setup, avoiding repeated empty sessions after mastery. Regular Practice Again still starts immediately. The session ends at its chosen limit or when all selected patterns are mastered; recap reports actual attempts and review count. No Phase 15 advanced dashboard is added.

Priority increases with incorrectCount and recency bands and decreases with successful review, randomizing near-score ties. A round through active patterns prevents one high-priority fact monopolizing the session. Phase 13 generates the related questions, receives recent ten questions and retains ordered fact identity. Sessions keep chosen source operations; validation explicitly permits supported inverse operations for targeted review attempts, and summary lists actual operations.

Mastery is consecutive self-reported success, default threshold 3 in existing saved settings, configurable in code (validated 1-100). A wrong review resets progress, increments incorrectCount/latest date on the original pattern only, and makes it active. A later regular miss of the original fact reopens it. Correct regular answers do not gain review progress. Existing legacy attempts without a target remain readable and wrong ones keep their prior fact tracking; they do not earn progress for an unknown original.

A new optional reviewEvents journal preserves targeted right and wrong reports independently of the newest-100-session details. Provider merges it with disk/memory, extracts all relevant incoming reports before trimming, and deduplicates both session/report and session/question identities across the combined evidence. Chronological replay derives totals/mastery instead of incrementing cached counts, so snapshots/reloads/retries/tab saves remain idempotent. A present journal means missing/corrupt review evidence cannot be replaced with cached mastery. Orphan/earlier-than-origin targets do not earn progress. The originating miss is first; other exact timestamp ties put successes before misses, conservatively leaving a miss active. Within a session, report timestamps are strictly increasing. Reset filtering uses session start, and reset/clear discard both journals and cache. Journal growth remains quota-limited; warnings/in-memory retry behavior stays honest.

Session-local patterns allow immediate mastery exclusion; before the next report, current saved progress/threshold and removals are merged into the selected pool. Other tabs do not replace the displayed card, which may still be completed; future selection excludes their mastered patterns. This is not a general lock/transaction guarantee for truly simultaneous writes.

### Reviews and initial verification

The separate read-only reviewer assessed the initial architecture, identified a same-timestamp ordering edge and noted inverse-operation validation/summary requirements. Implemented conservative tie ordering with regression tests and explicit operation/target validation plus actual-operation summary checks. The reviewer then hit its account usage limit and did not inspect the final diff or tests. Independent review is partial, not a clean final approval; no additional reviewer request was made to bypass that limit.

The one focused Gemma start_job attempt used review profile and max_calls=1, after the prior phase had no running job/request and more than a minute elapsed. Docker was unavailable, so no job or model request was created; no retry/host substitute/verdict. Exact tool response and prompt are notes/phase-14-gemma-*.json/txt. Static review limitations are distinct from actual test verification.

Initial local checks found expected stale setup test assumptions (radio count/extra status regions). Kept the existing single validation status; active counts use polite announcements, updated radio count to include the new choices and added explicit regular-default/review-disabled assertions. Existing summary tests now expect the actual empty explanation or enabled review link for saved mistakes. Strict types caught an invalid Testing Library option and over-narrowed type predicate; both were fixed. Sixteen focused logic tests now pass. First focused browser run passed 7/8: mobile reveal scan sampled transient flip opacity. New scan now awaits animation.finished, matching the established accessibility suite, keeps full-page analysis and adds best-practice tags without suppressing any rule. Full final gate is running; TODO remains unchecked until it passes.

The first full gate passed 282 unit/component tests and 106 browser executions; two navigation cases still expected only two selected radio groups. Phase 14 adds the selected practice-mode group. Updated that assertion to three and explicitly required Regular practice to be checked, preserving difficulty/session-length exclusivity checks. The restart case did not run after those failures, and Pages was not reached; this run is not a pass. Evidence is notes/phase-14-first-full-check-output.txt. The corrected complete gate is notes/phase-14-final-check-output.txt.

### Completed local verification

The corrected final npm.cmd run check:all exited 0: formatting, ESLint, 282 unit/component tests across 22 files, strict app/browser-test types, normal production build, 109 browser regression executions, Pages build and 20 strict-hosting executions passed (411 total). New review-mode logic has 16 tests and four flows across desktop/mobile (8 executions), including full-page accessibility scans. The real browser restart and all existing arithmetic/preferences/storage/reset/statistics checks passed. No accessibility rule or test deadline was weakened; changed expectations correspond to the new mode group and enabled review action. Evidence: notes/phase-14-final-check-output.txt. Only the 24 verified checklist items under Phase 14 tasks 58-62 were checked; Phase 15 and later remain untouched.

Implementer final diff review covered storage preservation, target/arithmetic validation, priority/mixing, mastery/reset ordering and UI/summary semantics. The separate reviewer did not complete its final review due to its recorded usage limit; Gemma was unavailable. These review limitations remain explicit despite passing tests. Verified publication and actual hosted checks follow.

### Published and hosted verification

Verified app commit 7e82bd31d3ac7684108ab1097e9b1cd59f5d516e was published to main. GitHub Actions run 39464717709 verified and deployed it successfully, completed 2026-10-20T17:20:52Z. Run: https://github.com/Jnuso/CSE-4095/actions/runs/39464717709. Metadata: notes/phase-14-remote-deployment.json.

The actual hosted app passed notes/phase-14-live-check.mjs in disposable desktop/mobile Chromium contexts (exit 0). Each created one real regular-practice miss, opened matching review setup, verified a mismatched difficulty disables start, earned one success, refreshed to start a new session while retaining that success, reported a miss to reset original progress, then reported three consecutive successes to master it. Five review events span two sessions; the new-session recap correctly shows four review attempts (3 right/1 wrong/75%), rather than counting the prior session again. Saved original pattern retains its identity, incorrectCount=2, similarCorrectCount=3 and mastered=true; no generated-fact pattern was created. Refresh and Settings saves did not change totals. Mastered review was disabled, review Practice Again opened setup, and Clear All erased journals/cache. No browser runtime/console/HTTP errors were observed; contexts never used the student profile. Evidence: notes/phase-14-hosted-check-output.txt.

Mobile setup/recap and settled desktop review-card screenshots were visually inspected for readable controls/layouts. The initial card snapshot sampled its brief animation; the helper now disables animation only during screenshots to capture settled colors, and the whole hosted check passed again. Images/results stay ignored under output/playwright/phase-14-live. Full-page screenshots may expose the offscreen fixed skip-link capture artifact already noted in earlier phases; keyboard skip-link behavior remains covered by the passing regression suite. App/test code is unchanged after the verified deployment; only helper screenshots/docs/evidence changed, so no unrelated full-gate repeat was needed. Phase 14 is complete. Phase 15 advanced statistics is next. The partial independent review and unavailable Gemma remain recorded without a final review verdict.

## October 20, 2026 - Phase 15 advanced statistics

### Authorized scope and decisions

Implemented professor TODO tasks 63-65 only. Added Mistakes and review to Statistics without changing the prior newest-100 session totals/breakdowns/history or storage format. Four named metrics show active/mastered patterns, similar questions practiced, and review questions marked right. Active/mastered details have separate radio-selected views, original equation/answer, difficulty, incorrectCount, latest miss via semantic time, and labelled mastery progress based on the configured threshold. Each view starts with ten details and offers Show more; switching views resets the limit. Empty states distinguish no remembered mistakes, no active facts and no mastered facts.

The read-only service consumes validated/rebuilt saved data. Review totals union the durable review journal with retained source=mistake-review attempts, including legacy targetless attempts, then deduplicate both session/report and session/question identities and apply the session-start reset cutoff. Right means selfReportedCorrect. Thus saved snapshots, reloads and journal-plus-record copies do not add counts. Orphan but valid review reports still count as practiced answers even if no original pattern remains. Browsing never saves/changes progress.

Frequently missed operation sums incorrectCount across original patterns, including active and mastered. A wrong inverse review remains attributed to the original operation/fact, avoiding duplicate attribution to the generated fact. All tied maximum operations and facts are shown; detail order is descending count, descending last-miss date, then fixed operation order, level, operands and ID for deterministic ties. A copied array is sorted, preserving storage order. The UI/guide distinguishes remembered patterns and available review evidence from the older newest-100 session window. Journal-backed totals can outlast session details; retained legacy reviews without a journal cannot recover already deleted history. Quota/protected-data behavior is unchanged.

### Review and initial verification

A separate read-only reviewer inspected requirements, actual service/component/StatisticsPage/CSS, fixture and tests. It highlighted the legacy targetless source-review counting case before implementation; that behavior is implemented and tested. Final static review found no concrete defects or missing Phase 15 scope. It did not run tests or the hosted app; execution evidence remains separate.

One focused Gemma start_job attempt used the existing coding-workers review profile, max_calls=1, no project snapshot or credentials. Prior phase's attempt never created a job/request and more than a minute had elapsed; no request overlapped. Docker was unavailable again, so no job/model request/verdict was produced and no retry/host fallback was made. Exact request/response: notes/phase-15-gemma-*. The independent reviewer completed this phase even though Gemma was unavailable.

Twelve focused unit/component tests passed. The first broader local check passed 293 tests and failed one existing Statistics test that assumed the page had a single unnamed list. Named Recent sessions and the new lists for accessibility, scoped that existing assertion to Recent sessions, and preserved its incomplete-history checks. Strict app/browser-test types then passed; all six focused desktop/mobile browser executions passed, including full-page accessibility scans, actual review-to-mastery, read-only bytes, reset, ties and 320-pixel layout. Evidence: notes/phase-15-local-check-output.txt (initial failure), phase-15-typecheck-output.txt, phase-15-focused-unit-output.txt and phase-15-focused-browser-output.txt. The full gate is now running; TODO remains unchecked until verification completes.

### Completed local verification and final review

The final npm.cmd run check:all exited 0: formatting, ESLint, 294 unit/component tests across 24 files, strict app/browser-test types, normal production build, 115 regression browser executions, Pages build and 20 strict-hosting executions passed (429 total). This includes all previous storage/mastery/reset/restart/session tests plus the 12 new unit/component checks and six new browser executions. Existing deadlines and axe rules were not weakened. Actual output: notes/phase-15-final-check-output.txt. Only the 14 verified items under Phase 15 tasks 63-65 were checked; Phase 16 and later remain unmarked.

Final separate read-only diff/docs/helper review found no concrete defects. It confirmed read-only storage behavior, named-list test scoping, all source/legacy/retention/tie semantics and disposable live contexts. It did not run the application tests or hosted app. Gemma remains unavailable without a sent model request or verdict. Verified publication and actual live checks follow.

### First remote verification failure and diagnostics

The first main push 08562ea4d0538226ed2ee6c08237d33bed22dc98 triggered GitHub run 39487281609. Verification failed with exit 1 and deployment was skipped, leaving the prior live app intact. Metadata is notes/phase-15-first-remote-deployment.json. Public check annotations initially exposed only the process exit, while job logs required authentication (API403 and anonymous browser sign-in notice). A temporary background GitHub tab was closed; no student profile data was changed or login attempted. No failure cause is claimed from that generic status.

Added Playwright built-in GitHub reporter only under GITHUB_ACTIONS to both regression and Pages configs, retaining list/html, all assertions/accessibility rules, zero retries and existing timeouts. Installed Playwright1.64.1 source/type declarations confirm support; Vitest already enables its GitHub annotations by default. The next remote browser failure can therefore identify the actual scenario through public check annotations. Separate read-only review found this config change safe and no evidence for speculative cross-platform test changes. The complete local gate is rerunning after the config change. A downloaded anonymous job HTML page initially landed in app output and was picked up by formatting; moved that diagnostic file out to temporary storage, retained its failed precheck output, and restarted the gate. This was an investigator artifact, not an application source syntax error.

The complete local gate after the CI-only reporter change exited 0 again: 294 unit/component, 115 regression browser and 20 Pages executions (429), formatting/lint/types/build all passed. Evidence: notes/phase-15-ci-diagnostics-check-output.txt. Test discovery with GITHUB_ACTIONS=true also exited 0 for both configurations and emitted the built-in summary annotations; discovery did not execute tests, recorded separately in phase-15-ci-reporter-list-output.txt. No application behavior or assertion was changed for the unknown remote failure. The diagnostic configuration is ready for the next remote run.

### Successful publication and hosted verification

Follow-up verification and deployment succeeded for commit 2052e0f0c7a098c6d96c710354c952ff55623211 in GitHub Actions run 39488974813, completed 2026-10-20T20:09:48Z. Run: https://github.com/Jnuso/CSE-4095/actions/runs/39488974813. Successful metadata is notes/phase-15-remote-deployment.json; the first failed run remains separately preserved. The earlier failure did not recur with CI diagnostics enabled. Its original cause remains unclassified because only a generic exit was accessible; no application/test assertion change or claimed root-cause fix was made to obtain the successful run. Built-in failure annotations remain enabled to diagnose recurrence.

The actual deployed app passed notes/phase-15-live-check.mjs on disposable desktop/mobile Chromium contexts (exit 0). Each created two distinct real regular misses, completed five self-reported-right related review questions, and displayed one active/two-success pattern and one mastered/three-success pattern. Dashboard totals were active=1, mastered=1, similar=5, right=5. Both original facts tied at one miss; original Addition total was two. Active/mastered switching by keyboard, semantic progress/date, exact saved-byte stability across views/reload, unchanged counts after Settings save, reset cancellation/confirmation, fresh post-reset tracking and Clear All to zero all passed. No runtime, console or hosted HTTP errors were observed. Evidence: notes/phase-15-hosted-check-output.txt. The student profile was not used.

Desktop active and mobile mastered section screenshots were visually inspected: metrics, facts, controls, dates and progress fit. Some capture images still expose the pre-existing offscreen fixed skip-link screenshot artifact; functional keyboard/skip-link/overflow checks passed and no application style was altered for captures. Images/results remain ignored under output/playwright/phase-15-live. Only docs and actual hosted evidence were added after the verified deployment; app/test code is unchanged, so no unrelated gate repeat was needed. Phase 15 tasks 63-65 are complete. Phase 16 accessibility remains next. Independent review was clean; Gemma remains unavailable without a model request or verdict.

## Phase 16 — accessibility (2026-10-20)

Scope: professor tasks 66–69; no Phase 17 or session-recovery work. Added card-scoped number keys 1–4 with modifier/repeat/composition/editable guards, mapped focus and aria-keyshortcuts. Kept native button names and pressed state; visible card hint explains the 1-to-4 shortcut range. First question uses a stable polite live region; later question/answer headings retain focus with a question-progress description, while session totals are atomic. These verify DOM/focus behavior, not real screen-reader speech.

Converted typography to rem, darkened focus outlines (#865b0b), and expanded visible-focus styling to native controls. Relative logo sizing, wrapping metrics and font-relative container layout keep doubled-text simulation readable. Card transitions retain opacity 1 to avoid transient contrast loss; existing reduced-motion and app animation switches still disable movement. There are no unnamed icon-only buttons; existing named navigation and decorative aria-hidden symbols remain.

Initial local check passed 304 tests. Initial focused browser run: 2 passed, 8 failed. Six failures exposed visible shortcut-number prefixes missing from answer accessible names (axe label-content-name-mismatch); removed prefixes and retained visible shortcut instructions. Two failures exposed native dialog Tab reaching an inactive focus stop; added explicit Tab/Shift+Tab boundary cycling to both existing two-button confirmations. No axe rules were suppressed. Final focused run passed all 10 desktop/mobile tests; full-suite run additionally includes reverse dialog-boundary coverage. Initial test type error corrected before browser execution.

Independent read-only reviewer inspected implementation, test coverage and both repairs; no confirmed remaining defect. Suggested stable announcer identity assertion and reverse Tab coverage were added. Focused Gemma start attempt used review profile, max_calls=1, timeout 180; service returned docker_unavailable before creating a review. No retry, model verdict or application verification is claimed from Gemma. Raw response saved in notes/phase-16-gemma-result.json.

Manual limits: automated 640 CSS-pixel reflow models available width at desktop 200% zoom; 32px root font models larger text. Neither changes literal browser zoom or actual system text settings. Those two TODO items remain unchecked. Narrator/NVDA speech quality also awaits human listening. See PHASE_16_TESTING.md.

The first full gate passed 304 unit tests but stopped with 122 browser passes, 2 failures and 1 not run: existing 320px card-height checks exposed a new container rule stacking answer choices and expanding only the front. Restricted the new container rule to summary metrics; kept existing answer-grid behavior and unchanged regression expectations. Rechecking both enlarged-text accessibility and card layout before the final gate. Independent reviewer also caught and verified repair of mixed encoding in this appended report section.

Post-repair focused run passed all 16 accessibility/card-layout cases. A subsequent gate stopped at stylesheet formatting; applied Prettier and restarted the full gate. No assertion, axe rule, retry policy or timeout was relaxed.

Final local check:all succeeded (exit 0): formatting, lint, 304 unit/component tests across 25 files, TypeScript, normal production build, 125 desktop/mobile browser tests including full-page axe scans, Pages build and 20 Pages browser tests. Total 449 passing tests. The independent reviewer inspected the final CSS repair and found no new concrete issue. Marked only 18 verified Phase 16 TODO entries; actual browser zoom and system-font tests remain unchecked. Deployment and fresh hosted verification follow this successful gate.

First hosted verification run 39493350737 (commit 86b40ef) failed before deployment: both 320px front/back height assertions reported 493px front vs 480px back on Linux; 122 browser cases passed and one did not run. Public check annotations now exposed the exact failure, saved in notes/phase-16-ci-failure-annotations.json. Platform-dependent font wrapping is the current inference, not a measured cause. Shortened only the visible shortcut hint to reduce wrapping, retaining focus scope and key range. Existing layout assertion remains unchanged; rerunning the entire local gate and remote gate before publishing. The earlier 449 local passes remain valid for the earlier version but did not establish Linux CI success.

Final shortened-hint version passed check:all again (exit 0): 304 unit/component + 125 browser + 20 Pages = 449 tests, plus format/lint/types/build checks. Independent reviewer inspected the hint-only repair without finding a new concrete issue. Remote verification must still confirm the Linux result.

Deployment confirmed: GitHub Actions run 39494733877 succeeded in both verify and deploy jobs, publishing e34a0f57af0e400a0aee80e653600eed76a4388c. This corrected Linux run passed the unchanged 320px card-height checks; the earlier failed run remains recorded separately. Live isolated contexts at 1440px and 390px passed scoped numeric selection, focused question/answer progress, reduced-motion animation suppression, doubled root-text simulation, dialog forward/reverse boundary navigation and Escape; zero page errors. Screenshots reviewed: mobile answer card readable with focus outline; enlarged text wraps controls and mobile dialog scrolls internally to focused buttons. Very narrow labels can wrap within words; further responsive polish remains Phase 17. No student storage was seeded or cleared. Hosted output and exact successful deployment metadata are in notes/phase-16-live-output.txt and phase-16-deployment.json. Literal zoom, actual system-font settings and real screen-reader speech remain manual pending checks.

## Lean workflow adopted (2026-10-20)

At the student's request, replaced repeated review rounds with one final independent review for substantial changes, focused tests during iteration and the required final check:all gate. Paused Gemma until explicitly resumed; no Docker probes each phase. Added a short PROJECT_STATUS.md handoff, moved existing domain contracts intact into DECISIONS.md, and shortened AGENTS.md/REVIEW.md. Future runs should inspect concise log summaries, use bounded process monitoring and avoid redundant documentation. Final CI/Pages verification and manual acceptance remain required. No app code, model settings, connectors or hosting behavior changed; Phase 17 has not started. Documentation-only checks apply to this update.

## Phase 17: responsive design and supportive feedback (2026-10-20)

Refined narrow-screen navigation, card padding, stacked phone answers, short-landscape spacing and wrapping of saved statistics/session labels. Existing statistics already use cards instead of wide tables. Preserved large touch targets and centered practice layout. Added short randomized encouragement following the student's self-report, including the last report on the recap, with a saved optional feedback toggle that preserves legacy preferences. No extra sound or animation is added. An existing regression caught card-height shrinkage on reveal; capturing front height fixes the jump without clipping taller content or weakening the assertion.

One read-only independent static review found no concrete defects; the subsequent small card-height fix was self-reviewed and checked by existing regressions. Gemma remains paused. Final npm.cmd run check:all passed: formatting, lint, 306 unit/component, types, both builds, 139 browser and 20 Pages tests (465 total). Sandboxed browser restart lost the temporary test profile; the unchanged isolated test and full final gate passed outside the sandbox. An earlier focused run held its port until stopped; final verification used the test-owned servers normally. Full final evidence: notes/phase-17-check-all.txt; student guide: PHASE_17_TESTING.md. Physical devices and Phase 16 literal zoom/system-text/screen-reader checks remain manual. Phase 18 has not started.

Phase 17 deployment: commit 162985cf14793e24d92da65f32fe9cec16df7985 passed CI and Pages deployment in https://github.com/Jnuso/CSE-4095/actions/runs/39510013849. Isolated hosted 320px mobile and 1024px tablet smoke checks passed practice, last-report encouragement, populated-statistics overflow and feedback setting persistence. Evidence: notes/phase-17-hosted-check.txt; screenshots under the ignored output/playwright/phase-17-live directory.
