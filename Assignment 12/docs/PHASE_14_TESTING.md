# Phase 14: Mistake review mode

Live app: https://jnuso.github.io/CSE-4095/

Use a private window for a clean review without changing your usual saved progress. This phase adds mistake review to setup, related-question sessions and saved mastery. Advanced mistake dashboards remain Phase 15.

## Try a complete review

1. Start regular practice with Addition, Beginner and 5 questions. Mark one wrong and four right. The recap should show 5 attempts, 4 right, 1 wrong and 80%. Self-report is what counts, even if you selected the mathematical answer.
2. Select Practice Mistakes on the recap. Setup should select Mistake review and show one active pattern. Operations and difficulty filter the original mistakes; related questions can use an inverse operation. Changing to a difficulty with no matching mistakes should disable Start Session with an explanation.
3. Keep Addition/Beginner and choose 5 questions. Start. Expect Your mistake review, familiar cards and related questions. The original exact fact is excluded. Choices, flipping, explanations, keyboard controls and animation settings still work.
4. Mark the first review question right, the second wrong, then the next three right. The wrong report resets consecutive progress on the original pattern. The review recap should show 5 mistake-review questions, 4 right, 1 wrong and 80%. That original pattern is now mastered and excluded from new review.
5. Refresh the recap. Counts should not grow. Open setup: Mistake review is disabled when there are no active patterns, with an explanation. Regular practice remains available. If other mistakes already existed, review may remain available for those.
6. To see early completion, start with one active pattern and mark three review questions right in a row. The session ends after those three even if you chose five, because the selected work is mastered. The recap reports three actual attempts. Review Practice Again returns to setup so you can choose the remaining work or regular practice.
7. More mistakes: create misses on multiple regular questions and review again. The session should mix eligible patterns. Frequently/recently missed patterns with little successful review get priority. Another regular miss of a mastered original fact reopens it; simply marking an unrelated regular question right does not gain mastery.

## Persistence and reset checks

Refresh during review starts a new session, as before; already reported progress remains saved and should count only once. Saving Settings should not add progress. Two tabs share saved progress but do not synchronize the currently displayed card. The current card may still be completed if another tab masters its pattern; future question selection excludes patterns already mastered in the latest saved state. This is sequential merge protection, not a general simultaneous-write transaction lock.

Statistics Reset erases history, remembered mistakes and review progress while keeping preferences. Clear All also restores preferences. Both require explicit confirmation. Try these only in a disposable/private window where you intend to erase that data. Old sessions opened before reset cannot restore erased mistakes.

## Automatic checks and configuration

From math-practice-app, run `npm.cmd run check:all`. Focused logic checks are `npm.cmd run test -- src/services/mistakeReview.test.ts`; focused browser checks are `npm.cmd run test:e2e -- review.spec.ts`.

The mastery threshold defaults to 3 in defaultSettings() and is persisted as settings.masteryThreshold (validated range 1-100). It is configurable in code, as the specification asks; no new parent settings control is added. Current review sessions use that setting for subsequent reports. All progress uses self-reported outcomes and consecutive successes. Wrong review answers update their original pattern, not a new pattern for the generated fact.

A separate review-event journal preserves both successes and misses beyond the newest-100-session detail limit. It grows with review reports and remains subject to browser quota. Save failures warn and retain progress in memory; reload before a successful retry can lose unsaved work. Invalid entries are skipped with warnings and cache totals are rebuilt from valid evidence. Existing legacy non-targeted review attempts remain readable but cannot gain progress for an unknown original pattern.

Actual test results, limitations of independent/Gemma review, and deployment evidence are recorded in DEVELOPMENT_LOG.md. Automated desktop/mobile-size Chromium checks do not replace testing on your phone or with assistive technology.
