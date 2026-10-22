# Authorized compliance corrections - 2026-10-21

User scope: lifetime aggregates with storage/migration tests, the intermittent mobile Statistics-menu active indicator, and narrow-screen session-length labels. Original audit evidence remains in [ASSIGNMENT_12_AUDIT.md](ASSIGNMENT_12_AUDIT.md) and output/audit-*; it is not rewritten as evidence for the new implementation.

## Implementation

- Preserve lifetime overall, operation and difficulty totals through per-session aggregate snapshots while retaining only 100 detailed sessions. Summaries are captured before trimming, merge idempotently by session identity/monotonic attempt count, and obey history reset fences. Disk/memory merges retain pending quota-failure progress.
- Persistent version 3 protects new totals from older clients. Existing plain/compact legacy saves load without read-time writes; available records become the migration baseline. Historical answers already discarded by the old release cannot be recovered. Settings/reset/Clear All retain existing confirmation, unrelated-key and protected-format behavior.
- Pin clicked Statistics headings through layout-induced coordinate changes and bottom clamping. Release on scroll intent, retaining heading focus, scroll-following behavior and the unchanged active-marker/accessibility assertions.
- Stack session-length choices in one column at small widths. Browser assertions check actual label width/height and alignment in addition to no horizontal overflow.

## Focused verification

- Production build and app/browser TypeScript passed.
- 39 lifetime/storage tests passed after correcting Clear All's returned state to include the same empty aggregate index as persisted storage. Compact serialization/statistics/large-history tests passed separately; the first focused attempt retained its storage mismatch and worker-startup failure for diagnosis.
- Eight Chromium desktop/mobile cases passed: 101 five-question sessions display 505 total attempts while keeping 100 details; migration/save/reload and cross-tab reset; layout-induced scroll adjustment; full-width 320px labels; original Statistics menu/focus/manual-scroll/read-only/full-axe coverage.
- No test deadlines, accessibility rules or result assertions were weakened. Version assertions changed specifically to require the new version 3.
- Independent read-only review found no concrete defects in the storage, migration, navigation or layout changes. The final full gate is running. No publication of these changes is claimed yet.

Logs: math-practice-app/output/compliance-*.txt. User-confirmed screen-reader, zoom, Safari and sound checks remain dated manual evidence, separate from these automated results.

## Final verification in progress

The final standard gate passed formatting and lint, then stalled at default Vitest fork-worker startup before reporting tests. Its log is retained separately. A complete single-thread Vitest run subsequently passed all 338 tests across 32 files (266.51 seconds). App/browser TypeScript and the production build passed again.

The complete local Chromium attempt recorded 182 passes, two failures and one dependent restart not run. The new mobile migration test timed out awaiting a background-tab evaluation after Settings reported a successful save; its trace did not return an incorrect stored count. The existing mobile review flow reached the unchanged 45-second deadline at its final overflow check. Explicitly activate each tab before using it in the new migration test, matching real interaction. No application behavior, assertion, deadline or retry setting changed for this repair. The 11-case focused follow-up passed: desktop/mobile compliance, original Statistics navigation, unchanged review flow, and real-process restart. Both the failed full-run evidence and focused follow-up remain separate logs. An unintended dependency-expanded follow-up was stopped and is not counted as a pass.

All 33 Pages cases passed across desktop/mobile Chromium and Firefox. Complete Firefox: 90 passed, one expected CPU-simulation skip, one new test-input failure. The layout-shift marker assertion passed, but Firefox's single wheel event stopped partway up the page rather than at Overview, as confirmed visually in the failure screenshot. Replaced that test input with native Home, retaining the same Overview assertion and deadline; focused verification is running. The original audit's failed CI and successful isolated/hosted evidence remain unchanged.

Final focused Firefox Home-key regression passed (1/1); final formatting and application/browser TypeScript passed. All 338 unit tests and 33 Pages cases passed, and the 11-case focused Chromium/restart follow-up passed. The student explicitly requested an immediate push for the submission deadline after these final checks. The existing CI workflow still requires the complete standard gate before deploying; a push is not a claim of successful deployment.
