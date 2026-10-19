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
