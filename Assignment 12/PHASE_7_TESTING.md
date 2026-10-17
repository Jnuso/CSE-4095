# Phase 7 testing guide

The browser card preview passed before Phase 7 began. The practice page now runs a session: self-reporting automatically counts an attempt and opens the next card.

## Start locally

Open a terminal in `Assignment 12/math-practice-app`, run `npm.cmd run dev`, and open <http://127.0.0.1:5173/practice/setup>. If your development server is already running, use its page.

Results are held in memory for the current session only. Leaving, refreshing, or editing choices resets them. Permanent saving belongs to Phase 9. The basic ending recap appears on the practice page; Phase 8 will build the dedicated summary page and its actions.

## Fixed session

- [ ] Choose any operations and difficulty, select 5 questions, and start.
- [ ] Confirm Question 1 of 5, zero completed attempts, and an empty progress bar.
- [ ] Choose an answer and flip. Totals must remain zero until you self-report.
- [ ] Mark the first two attempts right and the next three wrong. You may self-report either outcome regardless of your selected answer.
- [ ] After each report, confirm the question number and completed count increase once, the bar advances, and the next card has no selection and a disabled Flip Card button.
- [ ] Check that the same ordered arithmetic question does not appear twice in a row.
- [ ] After the fifth report, confirm Session complete, 5 attempted, 2 marked right, and 3 marked wrong. No sixth card should appear.
- [ ] Repeat with 10 or 20 questions if desired. Automated tests cover both limits.

## Continuous session and ending

- [ ] Select Edit choices, choose Continuous practice, and start again. Totals should reset to zero.
- [ ] Confirm Question 1 without a fixed total or fixed progress bar.
- [ ] Mark one attempt right and one wrong. The next card should be Question 3, with two completed attempts.
- [ ] Select End Session, then Cancel in the browser confirmation. Your card and totals should remain intact.
- [ ] Select End Session again and confirm. The recap should show 2 attempted, 1 right, and 1 wrong. The unreported third card must not count.
- [ ] Try ending a new session before reporting anything. Its recap should show zeros.

## Accessibility and recovery

- [ ] Use Tab, Space, and Enter to select, flip, and report. Focus should move to the revealed answer, then to the next question, and finally to Session complete.
- [ ] Turn off Animate card flips. Progression must still work. Reduced-motion preferences also disable the short next-card transition.
- [ ] Try a 390- or 320-pixel browser width. The session and ending recap should have no horizontal scrolling.
- [ ] Open `/practice/session` in a fresh tab without starting a session. It should redirect to setup.

Generation-failure recovery is exercised by automated tests: completed attempts are preserved, and retry does not count them again. It is not necessary to deliberately break your browser to test this.

## Automated checks

```powershell
npm.cmd run check
```

Expected: formatting, lint, **113 tests across eight files**, TypeScript, and production build pass.

For only the new session checks:

```powershell
npm.cmd test -- src/services/practiceSession.test.ts src/app/PracticeSession.test.tsx --reporter=verbose
```

Expected: **13 tests pass**, covering state/attempt records, duplicate rejection, exact limits, continuous practice beyond 20 attempts, bounded repeat avoidance, failure/retry, ending, and the page integration.

For a production check, run `npm.cmd run build`, then `npm.cmd run preview`, and repeat at <http://127.0.0.1:4173/>. Stop servers you started with Ctrl+C when finished.

## Report evidence

Save the phase request, an active session showing progress, an ending recap, and successful checks. Explain why a completed attempt includes both selectedAnswer and selfReportedCorrect, why flipping alone does not count, and how duplicate/stale reports are rejected. These boxes are for your independent verification.
