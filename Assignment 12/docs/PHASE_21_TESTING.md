# Phase 21 focused performance work

Update: the previously open lossless journal compaction and simulated slower-CPU work are now implemented locally. See FINAL_IMPLEMENTATION.md for the latest evidence. Measurements and open items below describe the earlier Phase 21 checkpoint; they are retained as historical evidence.

The student requested only checks relevant to this step, with the full suite at the end. Changes remain local so a push does not start the automatic full CI/deployment pipeline. This is focused verification, not a full release sign-off.

## Changes and measurements

- Memoize recent-session totals and mistake statistics. Memoize the mistake panel and storage context value to avoid work when unrelated parent/display controls render. Question generation already runs in lazy session initialization and user-event transitions; no generation was moved into render.
- Index regular and review events by original fact once before chronological mastery replay, replacing repeated full-journal scans per fact. Existing deduplication, timestamp tie order, inverse attribution and reset rules remain unchanged.
- Lazy-load Statistics and Settings; retain the shared header/navigation and accessible initial loading status. Synchronize heading/title/focus after deferred content arrives. React Router can retain the current page during navigation until the chunk arrives.
- Failed chunks receive a typed error. Try again reloads the document to clear the browser/React rejected import cache; ordinary render errors still retry in place. Saved storage is untouched by recovery.
- Initial production JavaScript: 326.53 kB / 99.60 kB gzip before; 311.35 kB / 96.71 kB gzip after. Deferred Statistics: 11.63 kB / 3.50 kB gzip; Settings: 4.96 kB / 1.69 kB gzip; dialog helper: 0.29 kB / 0.21 kB gzip. CSS stays 13.24 kB / 3.62 kB gzip. Measurements use Vite production output, not network or CPU timing guarantees.
- Production dependencies are React, React DOM and React Router, all used. Development dependencies support the configured build/test/lint tools; none was removed. Fonts already use Segoe UI/system-ui; no downloaded fonts or content images require compression.

## Focused evidence

- Eight affected unit/component files passed 82 checks (routes, statistics, settings, recap, storage and review replay). Subsequent expanded large-history cases passed 2 checks; error recovery passed 3 checks. Original assertions/deadlines/retries were retained; lazy-route tests now await actual page content.
- Six Firefox statistics/mistake-statistics flows passed. The new deferred-loading test passed after replacing an invalid assumption that React Router must display Suspense fallback during transitions with a deterministic held-chunk test. It asserts no secondary chunks on Home, navigation remains visible during the held download, headings receive focus/title after release, and direct reload works.
- A separate Firefox chunk-failure test covers a deliberate HTTP503, error heading focus, Try again reload, successful Settings and exact saved-data preservation. Expected download/React error reporting is deliberately scoped to this fault-injection test; normal flows retain the strict error guard.
- Production build, app/browser TypeScript checks and ESLint on changed files passed. No full check:all, full browser suite, Pages build, CI or deployment was run.
- Independent read-only review found cached rejected lazy imports and a corrupted loading character. Both were repaired, with focused error-recovery coverage added.

Raw local logs are under math-practice-app/output/phase-21-*.txt. They include first failures and focused repair runs; no full-suite pass is implied.

## Large-history limits and remaining work

The deterministic tests use 3000 and 6000 attempts, each on a distinct missed fact, across 150/300 sessions. Reload retains 100 detailed sessions (2000 attempts), every journal identity, every remembered fact and all remembered miss counts. Overall statistics continue to describe only the newest 100 sessions, as previously accepted; no lifetime overall statistic is introduced.

The 3000-case serialized save is below 5 MiB in UTF-16. The 6000-case is 8,006,572 UTF-16 bytes and exceeds that reference budget. An in-memory storage adapter measures serialization and proves round-trip invariants; it does not establish the quota of a particular browser. Quota injection verifies an honest unsaved warning and unchanged existing data. The first 6000 track/write/read measurement was approximately 310 ms on this host; timing is observational, not an assertion or slower-device result.

Lossless journal compaction/archival remains open. Silently dropping older events would damage cross-tab deduplication and mastery replay; this phase does not do that. Actual slower-device CPU/memory testing also remains open. Held Firefox chunk responses test loading resilience only. Full release checks and publication wait until the requested final gate. Phase 21 is not wholly complete; do not advance automatically.
