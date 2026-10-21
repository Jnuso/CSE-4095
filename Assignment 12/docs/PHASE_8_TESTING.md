# Phase 8 testing guide

Historical milestone: Phase 9 adds persistent settings/session data and a saved-summary fallback. Use [PHASE_9_TESTING.md](PHASE_9_TESTING.md) for current storage behavior.

Completed sessions now navigate to `/practice/summary`. This replaces the inline Phase 7 recap. Results are based on self-reported right/wrong choices, not automatic grading of the selected answer.

## Run locally

Open a terminal in `Assignment 12/math-practice-app`. Run `npm.cmd run dev`, or use your existing running server. Open <http://127.0.0.1:5173/practice/setup>.

## Complete and inspect a session

- [ ] Select your operations, difficulty, and 5 questions, then start.
- [ ] Mark three attempts right and two wrong.
- [ ] Confirm automatic navigation to `/practice/summary`, with focus on Your practice recap.
- [ ] Confirm 5 questions attempted, 3 marked right, 2 marked wrong, and 60% accuracy.
- [ ] Check your difficulty and the operations actually attempted. An enabled operation that never appeared should not be listed as practiced.
- [ ] Confirm Mistake-review questions completed is 0 for current regular sessions.
- [ ] Confirm no sixth question is generated after completing the session.

Accuracy is rounded to the nearest whole percent. For example, two right out of three attempts is 67%. The zero-attempt case shows 0% with an explanation rather than NaN or infinity.

## Summary actions

- [ ] Select Practice Again. Confirm a new Question 1, zero totals, and the same selected operations, difficulty, and length. All originally selected operations are retained, including any that did not appear last time.
- [ ] Complete or end that session. Select Change Settings. Confirm setup restores your previous selections and lets you edit them.
- [ ] Check View Statistics opens the existing statistics page. Its calculations remain later work.
- [ ] Check Return Home opens the home page.
- [ ] Confirm Practice Mistakes is disabled with an explanation. The button is present for this phase; its review behavior will be enabled in the mistake-review phase.

## Early endings and safe fallback

- [ ] Start continuous practice, report one attempt right and one wrong, then End Session and confirm. The summary should show 2 attempted and 50% accuracy; the unreported current card must not count.
- [ ] Start another session and end before reporting anything. Check all counts are 0, accuracy is 0%, and Operations practiced says None yet.
- [ ] Open `/practice/summary` in a fresh tab with no completed session. It should offer Go to practice setup and show no invented results.
- [ ] Try browser Back after Practice Again. It should return to the completed summary rather than replaying the old completed question.

Summary data travels in browser navigation history. A reload of an existing summary entry may preserve it, and Back may revisit it. This is not permanent practice history: there is no localStorage persistence or overall statistics update yet. Refreshing an active session still resets its in-memory attempts.

## Keyboard and layout

- [ ] Use Tab and Enter to activate summary links. Verify visible focus and that destination headings receive focus.
- [ ] Check the summary at 390- and 320-pixel widths. Metrics should use two columns, action links should stack on narrow screens, and there should be no horizontal scrolling.

## Automated checks

```powershell
npm.cmd run check
```

Expected: formatting, lint, **131 tests across ten files**, TypeScript, and production build all pass.

For the new summary checks only:

```powershell
npm.cmd test -- src/services/sessionSummary.test.ts src/app/SessionSummary.test.tsx --reporter=verbose
```

Expected: **18 tests pass**, including rounded/zero accuracy, actual operation and review counts, invalid/incomplete/corrupt payloads, replay, restored configuration, navigation, and empty-state handling. Existing session tests also verify the real completion handoff.

For a local production check, run `npm.cmd run build`, then `npm.cmd run preview` and repeat at <http://127.0.0.1:4173/>. Stop servers you started with Ctrl+C afterward.

## Report evidence

Save the phase request, desktop/mobile summary screenshots, an empty summary, and successful checks. Explain the accuracy formula, validation of completed attempts/totals, navigation-history handoff, and why Practice Again starts fresh while preserving configuration. These unchecked boxes are for your independent verification.
