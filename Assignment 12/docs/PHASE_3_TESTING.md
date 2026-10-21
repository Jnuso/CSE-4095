# Phase 3 testing guide

Phase 3 adds practice configuration. It does not generate questions or count attempts. Start Session displays the selected configuration on the practice page; question generation is Phase 4 and the complete session flow comes later.

## Start the app

```powershell
Set-Location -LiteralPath 'C:\Users\Jnuso\OneDrive\Documents\UCONN FALL 2026\CSE4095\Assignment 12\math-practice-app'
npm.cmd run dev
```

Open the printed URL, normally <http://127.0.0.1:5173/>, then select Start Practice. If the app is already running, reuse it and refresh. Start defaults are Addition, Beginner, and 10 questions. Settings and persistent defaults are later phases.

## Student manual checklist

Leave each box unchecked until you personally verify it.

- [ ] All four operations are available. Addition is selected initially.
- [ ] More than one operation can be selected at the same time, with visible checkmarks and selected styling.
- [ ] Select all operations checks all four. Repeating it does not duplicate anything.
- [ ] Clear selection removes all operations, disables Start Session, and displays Choose at least one operation to start.
- [ ] Selecting any operation again enables Start Session.
- [ ] Beginner, Easy, Intermediate, and Advanced each have a short description. Selecting a difficulty deselects the previous one.
- [ ] The session-length choices are 5, 10, 20 questions, and Continuous practice. Exactly one is selected at a time; the default is 10.
- [ ] Choose Multiplication and Division, Advanced, and 20 questions. Start Session opens the practice page with exactly those three settings.
- [ ] Edit choices returns to setup and restores those selections.
- [ ] Choose Continuous practice and start again. The receiving page says Continuous practice, not an invented fixed count.
- [ ] Use Tab and Space to toggle operation checkboxes, arrow keys within radio groups, and Enter on Start Session. Controls have visible focus.
- [ ] On a narrow/mobile window, all controls stay readable without horizontal scrolling.
- [ ] A fresh direct visit to `/practice/session` without navigation state offers Go to practice setup rather than showing invented choices or questions.

Configuration is passed through React Router history state. This phase does not promise permanent storage, cross-device persistence, or preservation of unsent edits through arbitrary navigation. Use Edit choices for the supported editing round trip.

## Automated checks

In a second terminal in the same app folder:

```powershell
npm.cmd run check
```

Expected: formatting and linting pass, **19 tests pass**, TypeScript checking passes, and the production build succeeds.

## Built preview

After the build, run `npm.cmd run preview` and open the printed URL, normally <http://127.0.0.1:4173/>. Repeat the clear/reselect and configured start/edit flow. If your preview is already running, refresh it after rebuilding. Stop servers you started with Ctrl+C when finished.

Save a screenshot of your selections, the receiving page, and successful check output. Report any issue with expected behavior, actual behavior, exact URL, and steps to reproduce it. Agent verification is recorded separately in DEVELOPMENT_LOG.md.
