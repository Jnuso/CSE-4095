# Phase 9 testing guide

Reported attempts and their session details now save to browser localStorage. Selected setup choices save when starting a session, and the animation checkbox saves when changed. Use the same browser profile and exact address/port throughout testing: `127.0.0.1:5173` and `127.0.0.1:4173` have separate storage.

## Start locally

Open a terminal in `Assignment 12/math-practice-app`. Run `npm.cmd run dev` or use your existing running server. Open <http://127.0.0.1:5173/practice/setup>.

## Save and restore

- [ ] Select a recognizable configuration, such as Division, Advanced, and 5 questions. Select Start Session.
- [ ] Turn off Animate card flips.
- [ ] Complete five questions, marking three right and two wrong. Confirm the recap shows 5 attempts and 60% accuracy.
- [ ] Refresh the recap. Results should stay correct.
- [ ] Close the browser, reopen the same profile, and directly open <http://127.0.0.1:5173/practice/summary>. The latest saved completed session should appear, even without the old navigation history.
- [ ] Directly open <http://127.0.0.1:5173/practice/setup>. Confirm Division, Advanced, and 5 questions are selected from storage.
- [ ] Start a new session. Confirm animation stays off and the new session starts at Question 1 with zero current-session totals.

## Check attempts before completion

- [ ] Report one answer in that new session, then refresh. The active session starts fresh, but the already reported attempt remains saved in history.
- [ ] To inspect without changing data, open browser Developer Tools → Application → Local Storage → the current site. Find `mathPractice.data`. It should contain version 1, settings, and records with session/attempt data.
- [ ] In the earlier partial record, check the selected answer, self-reported result, operation, difficulty, session ID, and attemptedAt timestamp. The partial session should not have completedAt.
- [ ] Confirm reported attempts save immediately, while selecting or flipping alone creates no completed attempt.

Restoring an unfinished question or its flip/selection state is not part of this phase. A started session, including one with zero attempts, is a history record. The newest 100 session records by latest activity/completion are retained with all their attempts; older records and their associated attempts are removed on a later successful save. A very long continuous session can still reach the browser quota, in which case a warning appears and practice continues in memory.

## Recovery behavior

Automated tests and the isolated browser checks cover these cases; you do not need to alter your saved data manually:

- Invalid settings fall back to defaults while valid sessions remain available.
- Invalid session records are filtered individually while valid records remain.
- Malformed JSON, unknown schemas, and future versions are left unchanged; practice continues without overwriting them.
- Known version-0 or versionless layouts are loaded and rewritten as version 1 on the next successful save.
- Full or blocked storage produces a readable warning and keeps the current session usable. Failed writes preserve the previous successful save.
- Other applications' localStorage keys are never cleared.

Unreadable/unsupported data remains protected until its format is repaired or deliberately reset outside this phase. Defaults permit in-memory practice; they do not mean the unreadable save was erased or repaired automatically.

## Automated checks

```powershell
npm.cmd run check
```

Expected: formatting, lint, **161 tests across twelve files**, TypeScript, and production build all pass.

For the new storage checks:

```powershell
npm.cmd test -- src/services/storageService.test.ts src/app/StoragePersistence.test.tsx --reporter=verbose
```

Expected: **30 tests pass**, covering round trips, partial/completed attempts, defaults, migrations, validation, retention, duplicate/stale saves, fresh app mounts, failures, and merging already-saved records from another tab. Cross-tab merging is best effort; localStorage does not provide transactions across multiple simultaneous browser tabs.

For a production check, run `npm.cmd run build`, then `npm.cmd run preview`, and repeat the save/reopen steps at <http://127.0.0.1:4173/>. That address has its own history. Stop servers you started with Ctrl+C when finished.

## Report evidence

Save successful check output, a recap restored after reopening the browser, and a screenshot of the simulated storage warning. Explain why one versioned record keeps settings/sessions/attempts consistent in a single write, how validation and migration work, and why storage failures must not interrupt practice. The full Settings UI, statistics calculations/list, mistake-pattern persistence, and user-facing reset actions remain later phases. These unchecked boxes are for your independent verification.
