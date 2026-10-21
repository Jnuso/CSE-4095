# Phase 6 testing guide

Historical milestone: Phase 7 replaces the preview with tracked in-memory sessions. Use [PHASE_7_TESTING.md](PHASE_7_TESTING.md) for the current page flow.

This phase adds interactive question cards. The practice page labels them as a preview: results are not counted or saved. Full session progression follows in Phase 7.

## Start the app

Open PowerShell in `Assignment 12/math-practice-app`:

```powershell
npm.cmd run dev
```

Open <http://127.0.0.1:5173/>. If your existing development server is already running, use that page. Choose Practice, select operations/difficulty/session length, and select Start Session. The card preview appears below your configuration; scroll down if needed.

## Try the card

- [ ] Confirm there are four answer buttons, readable math, and “Question 1 of” your selected length.
- [ ] Confirm Flip Card starts disabled.
- [ ] Select an answer. It gains a checkmark and selected border; Flip Card becomes available.
- [ ] Select another answer. Only the new answer stays selected.
- [ ] Select Flip Card. Check that the original math with its correct answer and your selected answer both appear.
- [ ] Confirm the answer choices are no longer available after flipping.
- [ ] Choose I Got It Right or I Got It Wrong. Your choice should be acknowledged and both buttons should become disabled.
- [ ] Confirm you can self-report either result, regardless of whether your selected answer matched the solution.
- [ ] Select Try another card. Selection and flip state reset, and focus moves to the new question. The preview still says Question 1; it does not advance a tracked session.
- [ ] Turn off Animate card flips and repeat. Checking the answer must still work immediately.
- [ ] Choose Continuous practice through Edit choices. Confirm the card says Question 1 without a fixed total.

## Keyboard, motion, and small screens

- [ ] Use Tab to reach an answer and Space or Enter to select it. Verify the visible focus outline.
- [ ] Tab to Flip Card and press Enter. Focus should move to the revealed answer.
- [ ] Tab to a self-report button and activate it with Space or Enter.
- [ ] Enable your device/browser reduced-motion preference. Flipping must work without animation even with Animate card flips checked.
- [ ] Try a narrow window or browser mobile view at 390 and 320 pixels. Check the front and back for readable text, large buttons, and no horizontal scrolling.
- [ ] Front and back should occupy the same card space at normal text size. Browser zoom or unusually enlarged text may expand content as needed.

The animation setting lasts for the current preview. Permanent settings/storage come later. Refreshing or reopening the preview can create a new question and reset preview choices.

## Automated verification

```powershell
npm.cmd run check
```

Expected: formatting, lint, **100 tests across six files**, TypeScript, and production build all pass.

For the card tests only:

```powershell
npm.cmd test -- src/components/practice/QuestionCard.test.tsx --reporter=verbose
```

Expected: **11 tests pass**. These cover selection, reveal, self-report locking, new-question resets, keyboard interaction, animation control, and the preview integration.

For a local production check, run `npm.cmd run build`, then `npm.cmd run preview`, and repeat the card steps at <http://127.0.0.1:4173/>. Stop servers you started with Ctrl+C when finished.

## Report evidence

Save a screenshot before flipping, one after flipping, one on mobile, and successful check output. Explain that selecting, revealing, and self-reporting are separate actions, and that self-reported correctness is intentionally separate from whether the chosen answer matches the solution. These unchecked boxes are for your independent verification.
