# Phase 15: Advanced statistics review guide

Live app: https://jnuso.github.io/CSE-4095/#/statistics

This phase adds Mistakes and review to the existing Statistics page. The original newest-100-session totals, operation/difficulty breakdowns, history and reset controls remain. Phase 16 accessibility work is not marked complete by these automated scans.

## Review from a clean private window

1. Open the app in a private window. Statistics should show zero active/mastered patterns, zero similar questions and zero review questions marked right. Empty messages explain how to create a remembered mistake. Switching to Mastered mistakes should show its own empty message.
2. Start regular Addition/Beginner practice with 5 questions. Mark one wrong and four right. Visit Statistics. Expect 1 active pattern, 0 mastered, 0 similar questions, 0 review questions marked right. The active detail shows the original fact, level, 1 time marked wrong, its latest miss and 0 consecutive successes toward the goal of 3.
3. Start mistake review for Addition/Beginner. Mark three related questions right. With only one active pattern, review ends after three answers. Return to Statistics. Expect 0 active, 1 mastered, 3 similar questions practiced and 3 review questions marked right. Select Mastered mistakes: the original fact should show progress 3 of 3. The active view should be empty.
4. Refresh Statistics and switch views again. Counts must not grow. Saving Settings or switching active/mastered views must not add attempts or change mastery.
5. For the wrong-review path, create another active mistake, start its review, and mark a related answer wrong. The original pattern's wrong count/latest miss update, and consecutive progress resets. The miss belongs to the original fact/operation even if the generated review question used an inverse operation.
6. Create several different misses if desired. Details sort by wrong count descending, then latest miss. The top operation sums wrong counts across its original facts. All highest-count ties are listed, including mastered facts. Matching facts at different difficulty levels remain separate. More than ten details add Show more mistakes; switching views resets that detail limit.
7. Try the active/mastered choices with Tab and Space, and check the page on your phone. Controls, number facts and progress bars should fit; no horizontal scrolling should be needed at 320 pixels.

## Counts and retention

Most-missed areas include active and mastered remembered patterns. A wrong related review updates its original pattern only. Review totals count reported source=mistake-review answers, both finished and unfinished sessions, deduplicated by saved report/question identity. They include valid retained legacy review attempts without an original-pattern ID. Self-report is authoritative, as in regular Statistics.

Remembered patterns and journal-backed review totals can remain after session details age out of the newest 100. The original overall/session totals still cover the newest 100 only, so the two sections can legitimately differ. Legacy review answers not captured in a journal are countable only while their details remain; already discarded older records cannot be recovered. Browser quota and earlier save warnings still apply; this phase does not change or enlarge persistence guarantees.

Statistics Reset erases all these figures while keeping preferences. Cancelling preserves them. Clear All also restores preferences. Only confirm erasure in a window where you intend to discard that saved data. Review tests use disposable contexts and never your usual profile.

## Automated verification

From math-practice-app:

```powershell
npm.cmd run test -- src/services/mistakeStatistics.test.ts src/app/MistakeStatistics.test.tsx
npm.cmd run test:e2e -- mistake-statistics.spec.ts
npm.cmd run check:all
```

Focused checks cover legacy/incomplete review totals, dual-identity deduplication, remembered-vs-session retention, original-operation attribution, all ties, stable nonmutating sort, reset cutoff, active/mastered progress/date rendering and pagination. Browser checks include actual regular practice into mastery, read-only browsing of journal-only data, reset cancellation/confirmation, keyboard view switching, 320-pixel layout and full-page accessibility scans for active, mastered, empty and expanded states. DEVELOPMENT_LOG.md records actual results, separate review limits and deployment evidence.
