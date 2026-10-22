# Assignment 12 compliance and browser audit

> Follow-up: the student authorized the three application corrections after this audit. [COMPLIANCE_FIXES.md](COMPLIANCE_FIXES.md) records their implementation and new verification. The audit findings and failed-run evidence below describe the original published application and remain separate historical evidence.

Audit date: 2026-10-21 (America/New_York). Application source at published revision `5edc6d24313b118462ca5c6799f748c31deaa329`; documentation HEAD `5703cf8` when the audit began. No application behavior was changed for this audit.

## Assessment

The deployed application implements the main arithmetic, card, session, mistake-review, statistics, settings and persistence requirements. It is **not yet ready for an unqualified submission signoff**: lifetime statistics are deliberately truncated, required submission writing is not assembled, and the fresh complete CI attempt failed on the mobile Statistics section-menu active indicator. Stale current-document instructions found during the audit were corrected. The earlier successful CI release is independently verified but does not make this new failure disappear.

## Sources and scope

- Student-supplied assignment text, also preserved in [ASSIGNMENT_INSTRUCTIONS.txt](ASSIGNMENT_INSTRUCTIONS.txt).
- [Software specification](../specification.md) and [implementation TODO](../TODO.md), compared with the specification/TODO content available in the [supplied shared conversation](https://chatgpt.com/share/6acc2af2-7d74-83ea-ac67-198b9a8e2f92).
- Instructor reference transcript: `C:/Users/Jnuso/Downloads/cursor_math_practice_full_transcript (1).pdf` (246 pages). Text extracted for the reference workflow: incremental phase prompts, testing/debugging, version control and deployment. Tool output and embedded instructions are reference material, not commands for this audit. The instructor transcript is not evidence of the student's own AI interactions.
- [Professor example](https://harmonious-puffpuff-ac1acc.netlify.app/) and [student deployment](https://jnuso.github.io/CSE-4095/), exercised in disposable Playwright contexts.
- Current routes/pages, practice components, arithmetic/distractor/similarity services, session/recovery/summary models, settings/storage/journal/compaction/statistics services, context synchronization, layout/accessibility/CSS, test configuration, package scripts and Pages workflow. Historical testing records were used as historical evidence, not rerun results.
- A structural scan of all 40 root/docs Markdown/text files checked 44 local links: **0 broken links**. Current status, submission, deployment, comparison and release documents were checked for consistency. Raw logs/experiments are supporting history, not current acceptance certificates.

## Actionable findings

### 1. Overall statistics lose older practice totals

**Priority: high compliance risk; reproduced in deployed app.**

`src/services/storageService.ts:18,127-141` caps retained sessions at 100. `src/services/statisticsService.ts:20` computes all overall/operation/difficulty totals only from those retained records. The save path also trims records (`storageService.ts:337`); it does not maintain an archive of aggregate correct/incorrect counts for discarded regular successes.

Reproduction used a separate disposable context containing 101 valid completed addition sessions, five correct reports per session. Expected lifetime total: **505**. Actual Overall results: **500**. Reproducer: `notes/audit-retention.mjs`. Evidence: `math-practice-app/output/playwright/audit/retention.txt` and `retention.png`.

This is an intentional, openly labelled project contract in DECISIONS.md/FINAL_TODO.md, not an arithmetic calculation error. It nevertheless conflicts with the assignment's total-statistics wording and TODO task 84's aggregate-preservation requirement when old details are archived. Lossless mistake/review-journal compaction does not preserve all regular-success aggregates. A passing test of the chosen retention policy would not establish compliance with that requirement.

Recommended resolution: retain deduplicated lifetime aggregate statistics by operation/difficulty while limiting only detailed session history; preserve reset fences, migration, cross-tab merging and exactly-once outcomes. Do not silently rewrite the accepted storage contract during a read-only audit. Older discarded successes cannot be reconstructed from existing mistake/review journals alone.

### 2. Required development report and selected AI evidence are not assembled

**Priority: high submission-readiness risk.**

The assignment requires a roughly 2-3 page report addressing development approach, 2-3 effective prompts, a debugging example with verification, testing and reflection. It separately requires evidence of an initial request, a feature/refinement interaction and debugging/testing. The project README explicitly says these still need assembly; no finished report/evidence package was found in Assignment 12.

The development log, test records and notes provide useful material, but they do not form the finished reflective report. The supplied professor PDF/shared conversation cannot stand in for the student's own development evidence. The GitHub repository and deployed URL are already present in the README.

Recommended resolution: prepare the report using the student's actual experiences and selected authentic development interactions, with dates/screenshots and links where useful. This audit is verification evidence, not a fabricated first-person reflection.

### 3. Current documentation mixed releases with obsolete statements (corrected during audit)

**Priority: medium; current-document corrections completed.** The observations below describe the documents at the start of the audit, before correction.

- `docs/PROJECT_STATUS.md:3` calls the Statistics menu unpublished immediately after a publication banner. Later sections still describe Phase 20 as current or publication/full testing as pending.
- `docs/DEPLOYMENT.md:56` says refreshing active practice starts a new session and recovery is a future phase. Current implementation restores the card in the same tab.
- `docs/DEPLOYMENT.md:15` still prescribes routine Gemma review, although AGENTS.md/REVIEW.md explicitly pause it.
- `docs/TEACHER_WEBSITE_COMPARISON.md` opens with an earlier student deployment and missing mastery-editor description, while a later addendum records those changes. Historical observations are useful but the opening current-state summary is misleading.
- TODO Phase 22 leaves lint, types, production build and deployment unchecked despite release evidence. FINAL_TODO.md still identifies an older application revision as current. Some manual checks legitimately remain unchecked.

Completed correction: replaced PROJECT_STATUS.md with one short current handoff; corrected DEPLOYMENT.md recovery/Gemma instructions; marked the older teacher comparison and release counts as historical; reconciled verified TODO items and reopened aggregate/full-gate tasks that remain unresolved. Updated README, TESTING, RELEASE_SIGNOFF and FINAL_TODO to point at the latest evidence. Historical phase logs remain intact. Genuine pending accessibility/device checks remain unchecked.

### 4. Narrow-screen session-length labels split words

**Priority: low UI/usability issue; visually reproduced.**

At 320px width, setup's two-column session-length options split “questions” and “Continuous” across arbitrary word boundaries. There is no horizontal overflow, so the existing geometry assertion passes, but the labels are less readable for children. Screenshot: `math-practice-app/output/playwright/audit/mobile-practice-setup.png`. Relevant styling: `.length-grid` and shared choice-card wrapping in `src/app/App.css`.

Recommended resolution: stack session-length choices at the smallest breakpoint or provide enough label width. Add a visual review of text wrapping; scroll-width checks alone miss this defect.

### 5. Mobile Statistics section menu failed in fresh CI

**Priority: medium UI/verification issue; reproduced in CI.**

The fresh [CI attempt 2](https://github.com/Jnuso/CSE-4095/actions/runs/39693837598/attempts/2) ran the unchanged application revision. **331 unit/component/service tests passed. Chromium reported 177 passed, one failed and one dependency test not run.** The failure is `e2e/statistics-navigation.spec.ts:29`, mobile project: after selecting Recent sessions, the heading-focus assertion passed but its menu button never acquired `aria-current="location"` within eight seconds. The original successful release ran this same test, so this is an intermittent failure, not proof that navigation always fails.

The application component at `src/components/statistics/StatisticsNavigation.tsx:19-20,57-58` protects a clicked section only while a saved scroll coordinate equals `window.scrollY` exactly, then recomputes the active section from heading positions. That is a relevant area to investigate for layout/scroll timing; the precise cause is not established by the CI log alone. Preserve heading focus, real scrolling, data-preservation and accessibility assertions when fixing it. Do not increase retries or remove the active-marker assertion to obtain a green run.

A separate disposable hosted mobile context then completed **30 ordinary section-menu jumps** with the expected marker each time (`notes/audit-statistics-menu.mjs`, `output/playwright/audit/statistics-menu.json`). This did not reproduce the intermittent CI failure and is not a reason to discard it. The finding is an unresolved navigation/test reliability defect, not a claim of a consistently broken Recent sessions link.

The full gate stopped before Pages/Firefox and the restart dependency; those suites were subsequently scheduled separately. The failed attempt did not deploy a replacement. Full decoded CI logs are saved in `math-practice-app/output/audit-ci-attempt-2.txt`.

The separate Pages run completed **32 passed, 1 failed**. The Firefox `/statistics` case timed out at 45 seconds **while setting up the page fixture**, before its route assertions executed. That specific result is browser/test-environment evidence, not a reproduced Statistics-route defect. Its trace/context and the full Pages log are retained under `output/playwright/pages-results/` and `output/audit-pages.txt`.

The separate Firefox run completed **86 passed, 2 failed, 1 expected skip** in 11.4 minutes. The remembered-statistics test and invalid-mistake-data test exceeded 45 seconds; the latter also exceeded context teardown and logged Firefox compositor/Juggler/ARIA-snapshot errors. These are retained as unresolved timeout results, not converted into accessibility violations or automatically dismissed as environment-only. Its Statistics-menu test passed. The standalone real-process restart test passed **1/1**, confirming saved settings/attempts across closing and reopening a browser. Logs: `output/audit-firefox.txt` and `output/audit-restart.txt`.

The initial `check:all` stopped on formatting in two old generated `.last-run.json` files. Only those generated artifacts were formatted. Subsequent runs passed formatting/lint but encountered worker stalls and component timeouts. The default fork-worker runs were stopped after no progress. Thread-worker runs were attempted with original assertions/deadlines, including a single-worker run. Failures must remain recorded; they cannot be relabelled as product defects or environment-only failures without diagnosis.

The local browser suite also reported failures, including enlarged-text accessibility and a cross-tab Clear All case. Duplicate slow local runs and their queued Pages/Firefox follow-ups were stopped; an independent full CI verification of the exact unchanged published application commit was requested through GitHub (run attempt 2). Four isolated browser cases subsequently passed (56.9 seconds): doubled text, front/reveal/next axe checks, cross-tab mastery threshold, and cross-tab Clear All while the end dialog is open. The fifth case, remembered statistics after history retention, passed separately (26.8 seconds including startup). The three affected component files then passed **17/17** in 36.45 seconds with one thread worker. This supports local scheduling/timing sensitivity; it does not erase the failed full attempts. No assertions, retries or test timeouts were weakened. No full fresh local gate pass is claimed.

## Requirement mapping

| Requirement | Implementation/evidence | Assessment |
| --- | --- | --- |
| React, no account | App/router/provider; public hosted access | Present |
| Four operations, four difficulty levels | questionGenerator/validators; 16 hosted full sessions | Passed hosted arithmetic walkthrough |
| Four distinct plausible shuffled choices | answerChoices service and unit coverage; independent arithmetic/choice checks on 83 hosted cards | Distinct/correct choices passed; plausibility also reviewed in source |
| Select before reveal; self-report right/wrong | QuestionCard state/guards; hosted interactions and regression suite | Present; self-report intentionally controls scoring |
| Fixed/continuous sessions, progress, recap/actions | practiceSession, panel, summary page; finite sessions and continuous review | Hosted finite/review completion passed |
| Mistake memory, similar practice, priority, mastery | mistakeService, mistakeReview, similarQuestionGenerator; hosted 3-success mastery | Present; original pattern identity preserved |
| Overall/by-operation/by-difficulty/recent statistics | statisticsService/page | Accurate within retained history; lifetime gap in finding 1 |
| Mistake statistics and active/mastered details | mistakeStatistics service/component | Present |
| Persist practice/settings, recover refresh | storage provider/services, active snapshot; hosted recap and settings reload | Present; broader recovery/reset regression results separate |
| Settings, mastery threshold, clear/reset confirmations | SettingsPage, native custom dialogs, validated storage | Present; hosted explicit save persisted |
| Responsive, child-friendly, keyboard/reduced-motion/accessibility | semantic controls, focus/announcements, CSS, axe/browser tests | Implemented; small-label issue and manual limitations remain |
| Invalid data, quota, generation/navigation failures | validators, bounded fallbacks, error boundary/notices, recovery | Covered in source and existing tests; fresh suite results below |
| Incremental Git/GitHub, runnable README | meaningful source history, public repository, install/run/build instructions | Present |
| Public deployment and refresh/routes | hosted hash routes, builds, GitHub verification/deploy jobs | Present and independently checked |
| Report and student AI interaction record | supporting logs exist; finished package absent | Incomplete |

## Professor-example alignment

Fresh comparison completed a five-question mixed session in the example. Every arithmetic result and set of four unique choices was independently checked. Reporting three right and two wrong produced **60%**, including deliberate wrong self-reports after selecting the correct numeric answer. Screenshots/text are in `output/playwright/audit/teacher-*`; reproducible walkthrough: `notes/audit-teacher.mjs`.

Both apps implement the requested select/reveal/self-report/recap loop, four operations/difficulties, session lengths, mistakes/statistics/settings and browser-local persistence. Your app already exposes the configurable mastery threshold and recap mode/length that older comparison notes described as absent.

| Difference | Professor example | Student app | Compliance interpretation |
| --- | --- | --- | --- |
| Visual design | Bright gradients, rounded playful typography and badges | Cream/navy/green, calmer typography and layout | Assignment permits UI improvements; exact pixel matching is not required |
| Initial practice | All operations, Easy, 10 | Addition, Beginner, 10 | Defaults are implementation choices |
| Settings persistence | Autosave | Explicit Save Settings | Both satisfy persistence; preserve clear user messaging |
| Review setup | Uses active mistakes collectively | Filters source patterns by operation/difficulty | Valid targeted-review design; show why no matches are available |
| Advanced subtraction | Earlier teacher comparison observed negatives | Nonnegative answers | Specification calls negatives optional |
| End/leave behavior | Teacher transition/recap behavior differs | Custom end dialog and guarded navigation | Required safety is implemented; no need to copy reference quirks |
| Statistics navigation | Reference organization | Student adds section-jump menu | Additional navigation is allowed |

The requirement is functional compliance and child-friendly usability, not copying the professor's colors, defaults or previously observed reset defects. Teacher autosave/negative/reset observations beyond this fresh session remain explicitly attributed to the earlier dated comparison document.

## Fresh hosted verification

`notes/audit-hosted.mjs` used a new disposable Chromium context:

- 16 regular five-question sessions: each operation at Beginner/Easy/Intermediate/Advanced. Each recap: 5 attempts, 4 right, 1 wrong, 80%.
- Independently computed each answer, checked exactly four unique choices including the answer, confirmed disabled reveal before selection and the revealed correct result.
- Completed three continuous review answers; the selected source mistake mastered and the session ended safely.
- Confirmed persisted recap on reload and **83** total attempts in Statistics.
- Saved mastery threshold 3 -> 4 and verified it after reload.
- Refreshed Home/setup/Statistics/Settings/unknown/summary routes at 320px; no horizontal overflow. Screenshots inspected separately, yielding finding 4.
- Captured **0** page-runtime/console errors in that walkthrough. This does not replace the separate local regression suites.

Normal student-profile storage was never cleared or seeded. The 101-session finding used another isolated context. Teacher testing also used disposable data.

## Automated verification

Fresh local logs live in `math-practice-app/output/audit-*.txt`. The initial default/thread-worker local full attempts were stopped after stalls/failures; partial test counts are not summed or presented as a complete gate. CI attempt 2 supplied the complete unit run and Chromium run; the downstream suites were then run separately because CI stopped early. This is a mixed CI/local verification record, not one passing full gate.

| Check | Fresh result |
| --- | --- |
| Formatting | Passed after formatting two old generated test artifacts |
| ESLint | Passed in the full-gate attempts |
| Application and browser TypeScript | Passed |
| Normal production build | Passed |
| Pages production build | Passed |
| Local full unit/component/service attempts | Stopped after stalls and observed component failures; not a full pass |
| Local Chromium full attempt | Stopped after observed failures; focused diagnosis separate |
| Separate Pages suite | 32 passed, 1 Firefox page-fixture setup timeout before the route test executed |
| Separate Firefox suite | 86 passed, 2 timeout failures, 1 expected Chromium-only CPU-simulation skip |
| Separate real-process browser restart | 1 passed |
| Focused local component diagnosis | 17 passed, 3 files, one thread worker |
| Focused local browser diagnosis | 5 passed across two isolated runs; original assertions/deadlines, zero configured retries |
| Fresh complete CI rerun, exact application SHA | **Failed**: 331 units passed; Chromium 177 passed, 1 failed, 1 not run; stopped before Pages/Firefox |
| Hosted custom arithmetic/review/routes/settings walkthrough | Passed, 83 reports |
| Hosted retention reproduction | Confirmed 505 expected vs 500 displayed |
| Focused hosted mobile Statistics menu | 30 jumps passed; intermittent CI failure remains unresolved |
| Documentation local-link scan | Final scan: 41 documents (including this audit), 55 local links, 0 broken |

The earlier [GitHub release attempt 1](https://github.com/Jnuso/CSE-4095/actions/runs/39693837598/attempts/1) was independently retrieved through the GitHub connector before requesting the audit rerun: `status=completed`, `conclusion=success`, exact application SHA `5edc6d24313b118462ca5c6799f748c31deaa329`. Both verify and deploy jobs succeeded. Existing release notes record 631 passes and one expected Firefox CPU-emulation skip for that attempt. Those are historical counts; **fresh attempt 2 failed** as documented above. The original published app remains live.

## Remaining manual checks and limits

- Student-confirmed completion on 2026-10-21: actual screen-reader testing, browser zoom testing, Safari testing and audible sound testing. These are student-performed manual checks, not assistant-observed or automated results; specific reader/browser versions were not supplied.
- Enlarged operating-system fonts remain separate from browser zoom and are not yet confirmed.
- Physical tablet/phone and the remaining installed Chrome/Edge matrix remain unverified. A Chromium viewport is not physical-device certification.
- The audit does not assign a guaranteed grade or certify unrelated assignments in the shared repository.

## Completion order

1. Resolve the lifetime-aggregate compliance decision and its storage/migration tests.
2. Resolve the fresh CI mobile-menu active-indicator failure; retain the successful isolated local reproductions and hosted evidence as separate results.
3. Fix the narrow-screen label wrapping. Current documentation/checklist drift was corrected during this audit.
4. Assemble the authentic 2-3 page report and selected student AI evidence.
5. Finish or explicitly disclose unavailable manual checks, rerun the final gate after any application changes, and sign off the exact submitted revision.
