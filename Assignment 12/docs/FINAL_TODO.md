> **Current readiness — 2026-10-21:** Published application revision 5edc6d2 remains live. Fresh verification attempt 2 failed a mobile Statistics-menu marker check; the aggregate-preservation and full-gate tasks below are reopened. [The assignment audit](ASSIGNMENT_12_AUDIT.md) records current results; [release history](RELEASE_SIGNOFF.md) preserves the earlier successful milestones.

# Final project completion checklist

Current readiness: [the assignment audit](ASSIGNMENT_12_AUDIT.md) records the newest failed CI rerun, the lifetime-statistics gap, remaining submission deliverables and manual limitations. Existing publication is application revision 5edc6d2. Historical milestone counts below do not override the audit.

Use this checklist to finish implementation before the final testing pass. It consolidates outstanding work from Phases 16–22; TODO.md remains the original phase checklist. Completed prototype instructions at the bottom of TODO.md are examples, not additional unfinished work.

Workflow: implement items below in order, run only checks directly relevant to each change, and fix confirmed defects. Run the complete suite once implementation is ready for the final gate. Do not trigger automatic full CI early by pushing application changes. Do not erase the student's real saved data during testing.

## 1. Finish session recovery — Phase 18

- [x] Persist an active-session snapshot: session identity/configuration, generated current question and choices, selected answer when applicable, card/reveal state, recorded attempts and progress.
- [x] Restore the same session after refresh without generating a replacement question or counting an answer twice.
- [x] Validate recovered data; handle invalid or incompatible snapshots with a clear recovery message and safe setup path.
- [x] Preserve regular/review mode and the original mistake-pattern identity when recovering review practice.
- [x] Clear the recovery snapshot when a session completes or the user explicitly ends it.
- [x] Make history reset and Clear All remove the recovery snapshot and prevent stale tabs from restoring erased data.

## 2. Finish navigation protection — Phase 18

- [x] Detect in-app navigation away from an unfinished session, including links and browser Back/Forward.
- [x] Offer a clear choice to keep practicing or end the session and leave.
- [x] On leaving, save the latest answered-question history, close the session consistently, and clear its recovery snapshot.
- [x] Use browser-supported protection for reload/tab close where applicable; retain recovery because browser prompts are not guaranteed.
- [x] Avoid duplicate prompts and any leave warnings after completion or an intentional end.
- [x] Keep confirmation controls accessible, with sensible focus and keyboard behavior.

## 3. Finish large-history storage management — Phase 21

- [x] Implement a lossless compaction/archival strategy for older mistake/review evidence; the measured 6000-distinct-fact save currently uses about 8 MB UTF-16.
- [x] Preserve remembered facts, miss totals, review totals, mastery progress, chronology and original-operation attribution.
- [x] Preserve enough identity/reset information to prevent retries, delayed saves and cross-tab merges from double-counting or resurrecting erased data.
- [x] Support existing saved data safely; protect unreadable/unsupported saves and retain honest quota-failure behavior.
- [x] Preserve lifetime overall/operation/difficulty aggregates while retaining the newest 100 detailed sessions, superseding the historical rolling-total policy; see COMPLIANCE_FIXES.md for migration limits and verification.
- [x] Document any revised storage format, migration and retention rules in DECISIONS.md and the user-facing explanation where needed.

Already implemented locally: memoized statistics/context, indexed journal replay, lazy Statistics/Settings, deferred heading/title/focus, and recovery from failed page downloads. Do not rebuild these features unnecessarily.

## 4. Finish privacy and release preparation — Phase 22

- [x] Review application requests, dependencies and saved fields for personal information, analytics, tracking and advertisements; remove any unnecessary collection if found.
- [x] Confirm practice data stays in browser storage and explain that clearing browser data removes progress. Repair missing or misleading user-facing wording.
- [x] Review the final changes once for concrete defects and resolve confirmed findings with relevant focused checks.
- [x] Update TODO.md, PROJECT_STATUS.md, TESTING.md and storage/deployment notes to match the final implementation and known limitations.

GitHub Pages hosting, hash routing and deployment infrastructure already exist. Verify them against the final build instead of selecting a new host or replacing the separate Cloudflare site.

## 5. Final testing gate — after implementation above

Historical in-Codex UI observations are in [IN_CODEX_BROWSER_TESTING.md](IN_CODEX_BROWSER_TESTING.md). The previous automated gate passed603tests/1expectedskip/exit0. Subsequent edge-case repairs passed42focusedunit/component +21browserchecks; repeat the full gate on the final sources before publication (EDGE_CASE_REVIEW.md). See [FINAL_RELEASE_TESTING.md](FINAL_RELEASE_TESTING.md) for full evidence and sandbox diagnostics.

- [x] Run the complete check:all gate: formatting, lint, unit/component tests, app/browser TypeScript, production builds, Chromium, Firefox, accessibility and Pages checks. Commit 5799564 passed CI run 39718024568: 647 passes, one expected skip, no failures.
- [x] Confirm recovery/navigation behavior: selected and revealed cards, refresh, Back/Forward, leave/stay, completion, reset, invalid snapshots, duplicate callbacks and multiple tabs.
- [x] Confirm large-history migration, compaction, lifetime aggregate preservation, storage size and quota failure on isolated data. Version-3 lifetime snapshots, 505-attempt retention, reset/reload and stale-tab behavior passed unit/browser/hosted checks; see COMPLIANCE_FIXES.md.
- [ ] Finish the installed Chrome/Edge browser matrix; automated Firefox evidence is recorded separately.
- [x] Test Safari. Student confirmed completion on 2026-10-21.
- [x] Test audible sound effects. Student confirmed completion on 2026-10-21.
- [ ] Check tablet/iPad and mobile layouts with emulators and an available physical device; do not substitute emulator evidence for physical-device evidence.
- [x] Check performance on a slower device or clearly labelled CPU/network simulation; delayed chunk responses alone do not prove slower-device performance.
- [x] Complete actual browser zoom review. Student confirmed completion on 2026-10-21.
- [ ] Complete enlarged operating-system font review; this is separate from browser zoom.
- [x] Complete actual screen-reader review. Student confirmed completion on 2026-10-21; recorded as student-performed verification, separate from automated axe/focus checks.
- [x] Resolve or explicitly record unavailable manual checks and remaining limitations. Do not mark unsupported/unperformed checks passed.

## 6. Publish and sign off — after the final gate

- [x] Publish the final revision through the existing GitHub Pages workflow and confirm successful CI/deployment for that exact revision.
- [x] Smoke-test every hosted route, refresh/deep links, practice/review/recap, statistics/settings and local-storage persistence in an isolated browser context. Fresh 83-report hosted walkthrough passed; this does not replace the failed full CI gate or remaining manual matrix.
- [ ] Verify responsive behavior and absence of unexpected browser-console/runtime errors.
- [x] Record the published revision, deployment URL, final test evidence and any outstanding manual limitations.

The original recovery, navigation, journal-compaction and privacy implementation is published; historical focused evidence is in FINAL_IMPLEMENTATION.md. The audit has reopened lifetime aggregate preservation and the final full gate. Current hosted route/review/settings/recap checks passed, while mobile label wrapping, intermittent Statistics-menu marking and the remaining listed manual checks remain open. The student confirmed screen-reader, browser zoom, Safari and audible sound testing complete on 2026-10-21. See ASSIGNMENT_12_AUDIT.md for the exact newest test results instead of treating earlier 603/628/631-pass milestones as current signoff.

Current live site: https://jnuso.github.io/CSE-4095/ . Application revision 5edc6d2 is published from successful attempt 1. Fresh audit attempt 2 failed and did not deploy. No application behavior changed during the audit.
