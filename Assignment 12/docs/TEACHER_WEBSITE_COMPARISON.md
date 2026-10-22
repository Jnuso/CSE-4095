# Teacher example versus current Math Practice app

> Historical comparison and follow-up record. The opening table describes the initial comparison before the approved alignment and deployment. For the current source, fresh professor/student walkthrough and unresolved findings, use [the assignment audit](ASSIGNMENT_12_AUDIT.md). The mastery editor, custom End Session dialog and recap mode/length are now deployed.

Compared on 2026-10-21 using the Codex in-app browser.

Teacher example: https://harmonious-puffpuff-ac1acc.netlify.app/

Student comparison target: current local production build at http://127.0.0.1:51138/, supported by [the recorded 52-check browser pass](IN_CODEX_BROWSER_TESTING.md) and targeted source inspection. The published student site remains the earlier Phase 20 version; this report compares the current local work, not an assumed new deployment.

## Findings

The main required practice loop is shared: choose operations/difficulty/length, select one of four answers, reveal, self-report right/wrong, view a recap, and review statistics/mistakes. The teacher exposes one notable setting absent from your Settings UI: a configurable mastery threshold. Other differences mostly concern defaults, review filtering, navigation, wording and presentation. Differences below are observations, not automatic assignment failures or authorization to change the implementation.

| Area | Teacher example: observed behavior | Your current app | Implication |
| --- | --- | --- | --- |
| Initial operations | All four selected | Addition selected | Different first-run experience; both allow mixed practice. |
| Initial difficulty | Easy | Beginner | Yours starts with a gentler level. |
| Initial session length | 10 | 10 | Same. Both offer5/10/20/continuous. |
| Sound default | On | Off | Different default; actual audible playback was not evaluated. |
| Other preference defaults | Animation, explanations and encouragement on | All three on | Same visible controls/defaults. |
| Saving settings | Automatic, no Save button | Draft changes require Save Settings; leaving discards unsaved edits | Different persistence contract. Teacher sound-off and threshold2 survived reload and history reset. |
| Mastery threshold | Editable numeric input, default3; changed to2; Statistics displayed progress0/2 and1/2 | Stored threshold3, no user-facing editor; three consecutive right reviews required | Concrete configurable feature absent from your Settings UI. Threshold2 completion and wrong-review reset passed in the continued run below. |
| Operation selector | Pressed buttons and Select All Operations | Checkboxes, Select all operations and Clear selection | Same choices; yours adds a direct clear action. Both disable Start with no operations. |
| Mistake review setup | Hides operation/difficulty controls; uses active saved mistakes collectively | Retains filters for operation/difficulty, disables Start if no matching active patterns | Yours offers targeted review; teacher is simpler to start. |
| Card controls | Answer labels include choice numbers1–4. With animation enabled, snapshot exposed question/disabled choices plus revealed answer; animation off showed only answer side | Answers have numeric labels, number-key shortcuts described in help; reveal replaces question-side controls | Different labels/rendering. Do not infer a screen-reader defect solely from the animated DOM snapshot. |
| Scoring | Self-report controls outcome, independent of selected numeric correctness | Same | Confirmed teacher accepted right reports after wrong selections and wrong reports after correct selections. |
| Active practice context | Finite progress count; continuous session exposed card and End Session without the setup/totals panel | Shows operation/difficulty/length, live right/wrong totals, Edit choices, animation toggle and End Session | Your practice page provides more context and direct controls. |
| End Session availability | Standalone button observed in continuous practice, absent from the finite5-question snapshot | Present in finite and continuous practice | Yours supports ending finite sessions directly. |
| End Session confirmation | Custom alertdialog with End Session / Keep Practicing; cancel and confirm both worked | Standalone End Session uses native window.confirm; custom dialog protects in-app navigation | Teacher dialog was controllable in Codex. Your native popup previously blocked browser automation; this does not establish that it fails for human users. |
| Leaving active practice | Statistics/Settings link opened Leave practice session?; Keep Practicing retained card; End Session went to recap instead of requested destination | Keep practicing retains card; End session and leave continues to requested destination | Clear behavior difference. Neither should be silently changed without choosing the intended contract. |
| Recap | Attempted/Correct/Incorrect/Accuracy/Review count, plus mode, configured operations, difficulty and length | Questions attempted/Marked right/Marked wrong/Accuracy, operations practiced, difficulty, review count | Yours makes self-report wording explicit; teacher shows additional configuration fields. |
| Review Practice Again | Link pointed to /practice/session | Review recap routes Practice Again through setup | After all patterns were mastered, clicking it opened a friendly Mistake review unavailable page with setup/Home links. |
| Statistics | Overall, review totals, frequent misses, active/mastered tabs, operation/difficulty breakdown and recent sessions | Equivalent categories; active/mastered radios, explicit mastery progress and detailed explanatory copy | Broad feature parity; different controls and organization. |
| History retention/pagination | Two recent sessions observed; no UI retention limit established | Newest100 session details explicitly documented; Show more verified | Teacher retention and large-history pagination are unknown, not missing. |
| Reset Statistics | Custom confirmation; cancel retained6 answers; confirm erased history/mistakes and preserved settings | Same reset contract, verified on125 generated answers and preferences | Functional parity in tested paths. |
| Clear All | Cancel retained changed threshold; confirm returned Home and restored threshold3, sound on, all operations/Easy/10 | Cancel/confirm verified; returns Home with Addition/Beginner/10 and sound off | Shared feature; reset defaults differ. |
| Privacy presentation | Separate Privacy area with five detailed statements about local data, personal information, analytics, ads and clearing | Shorter Your practice stays here explanation | Teacher has more detailed visible privacy copy. No network/analytics audit of teacher was performed. |
| Skip navigation | No skip link appeared in inspected teacher snapshots | Skip to content present and tested, including Pages hash routes | Yours has an additional observed keyboard navigation aid. This is not a complete accessibility comparison. |
| Unknown URL | Friendly Page Not Found with Return Home and shared navigation | Friendly not-found recovery with shared navigation/Home | Equivalent tested recovery path. |
| Appearance | Math-star messaging, ages7–12 badge, decorative symbols, numbered choices and icons | Small-steps messaging and your established design | Presentation difference, not a missing function. |

## Teacher checks actually performed

- [x] Home and primary navigation; empty review disabled; defaults inspected.
- [x] Settings autosave: sound disabled and mastery threshold changed3→2; values persisted across reload/history reset.
- [x] Empty-operation validation: all operations deselected, explanatory alert and disabled Start.
- [x] Mixed Easy five-question session: observed all four operations, four answer choices, reveal/explanation, number-key selection and self-report advancement.
- [x] Completion:5 attempted,3 correct,2 incorrect,60%; matching per-operation/difficulty statistics and two saved mistakes.
- [x] Review unlock and continuous mode: one related review report advanced original Addition pattern to1/2; no fixed progressbar; leave/cancel/confirm observed.
- [x] Continuous standalone End Session: custom cancel/confirm and zero-answer recap.
- [x] Reset Statistics cancel/confirm:6/4/2/67% retained on cancel, zeroed on confirm; preferences retained.
- [x] Clear All cancel/confirm and restored defaults; example browser data restored to a clean initial state after testing.
- [x] Animation disabled: reveal rendered the answer side without the choice controls.
- [x] Unknown-route recovery.

## Recommended decisions before changing code

1. Decide whether configurable mastery is needed for assignment parity. If so, add a validated threshold control with clear consecutive-answer wording and targeted persistence/mastery tests. Your fixed-three behavior is currently an intentional project contract.
2. Consider replacing your standalone native End Session confirmation with a custom accessible dialog consistent with your existing leave dialog. This would make its behavior easier to inspect and test in Codex; preserve the current unreported-question rule.
3. Keep or consciously align the differing defaults, explicit-save settings, review filters and leave destination. These are product choices, not demonstrated defects.
4. Consider showing Practice Mode and requested Session Length on your recap if closer example parity is desired. Your current recap already supplies the core results.

## Limits and evidence

This is a functional comparison, not an exhaustive teacher-site certification. The first pass covered one mixed finite session, one reported review answer and cancellation/zero-answer sessions; the continued run below adds mastery,10/20 completion and cross-tab reset checks. All16 arithmetic combinations, storage faults/quota/retention, actual sound, device/engine matrix, zoom and spoken screen-reader output remain unestablished. Your existing deeper tests do not imply equivalent teacher behavior.

An active teacher reload attempt left the selected question visible, but a completed document reload could not be proven. Treat exact refresh recovery on the teacher site as inconclusive, matching the existing Codex limitation on your app; do not call either site better on that evidence.

A few rapid teacher actions overlapped animation transitions; re-observation and deliberate next-question waits resolved progression. No product defect is claimed from those timing failures. A guessed recap heading did not match the actual Session Complete! heading; the actual recap was inspected.

Evidence captured under math-practice-app/output/teacher-comparison/ (local ignored artifacts): teacher-statistics.txt/.jpg, teacher-settings-defaults.txt, teacher-settings.jpg, teacher-revealed-card.txt/.jpg. These preserve UI snapshots/screenshots, not private storage dumps. Teacher history was reset only in this browser as authorized; no server-wide deletion or real student-profile reset was attempted. No app implementation, deployment or full regression run was performed for this documentation task.


## Continued tests — 2026-10-21

### Additional verified differences

| Area | Teacher observed behavior | Your current app comparison |
| --- | --- | --- |
| Cross-tab live statistics | Observer showed mastery1/2 after a wrong report in the practice tab; reload corrected it to0/2. After two right reviews, it still showed active1/mastered0 until reload exposed active0/mastered1. | Your existing browser pass verified live cross-tab review updates without reload. |
| Cross-tab Reset Statistics | Reset in observer showed zero. Active practice tab remained on question2. Reporting its next answer restored prior history:41attempts/31right/10wrong/76% on observer reload. | Your reset invalidated the active card and prevented recovery, verified in the prior pass. |
| Cross-tab Clear All | Clear All returned Home, but old practice tab remained on question3. A wrong report there restored42attempts/31right/11wrong/74%. | Your Clear All immediately invalidated other-tab practice and restored defaults without resurrection. |
| Negative subtraction | Advanced session generated688−868 with correct choice−180 and negative distractors. Independently computed and verified reveal. | Your app deliberately produces nonnegative results. This is a curriculum difference; do not copy it without changing the accepted arithmetic contract. |
| Recap Change Settings | After Advanced/addition+subtraction/20, setup reset to saved all-operations/Easy/10. Same saved-default reset was seen after the Beginner multiplication session. | Yours passes previous session configuration back to setup. Teacher behavior is consistent with its saved-default approach. |
| Review restart after mastery | Practice Again led to an explicit Mistake review unavailable page after no active patterns remained. | Yours routes review Practice Again through setup. Both provide a safe way forward. |

### Tests completed

- [x] Single-pattern mastery at threshold2: regular5-question fixture produced one mistake,4right/1wrong. Review right→wrong→right→right ended continuous review at4reports,3right/1wrong/75%. Observer reload showed active0/mastered1 and original3+38 fact retained with2misses.
- [x] Wrong review reset: original pattern progress1/2 became0/2 and miss count1 became2 after wrong review; two subsequent consecutive right reports mastered it.
- [x] Ten-question completion: Beginner Multiplication,10attempts/7right/3wrong/70%. Every card independently checked arithmetic, four unique integer choices including the correct result, and revealed result.
- [x] Twenty-question completion: Advanced Addition/Subtraction,20attempts/15right/5wrong/75%; midpoint progress10; every card checked independently. Negative answers supported. An initial unsigned-choice parser rejected a negative label; parser was corrected to accept signed integers, then the actual card and remainder were verified. This was a test-parser limitation, not invalid teacher arithmetic.
- [x] Cross-tab live-update behavior observed both before and after reload; teacher observer was stale in the tested transitions.
- [x] Reset and Clear All stale-session resurrection reproduced through ordinary UI. Totals reconcile with generated data:5regular+4review+10regular+20regular+2continuous=41 before Clear All, then one more report=42.
- [x] Safe cleanup: ended/closed stale practice tab first, reloaded observer, then Clear All; fresh Statistics showed0/0/0/0%. No active stale writer remained from these tests.

### Reproduction of teacher reset issue

1. Open practice and Statistics in two tabs on the teacher origin. Generate a report in the practice tab.
2. In Statistics, confirm Reset Statistics (or use Settings → Clear All).
3. Observe zero totals/Home in the reset tab while the practice tab still has its active card.
4. Select, reveal and report another answer in that old practice tab.
5. Reload Statistics: pre-reset records reappear with the new report. This comparison exercised only disposable generated data with the user's authorization.

Evidence: output/teacher-comparison/cross-tab-reset-resurrection.txt/.jpg, cross-tab-clear-resurrection.txt/.jpg and continued-arithmetic.json under math-practice-app/. These are observations of the deployed teacher example on this date, not claims about its source implementation or root cause. Your existing reset fences and live synchronization should be retained; there is no reason to imitate these reference-site failures.

No student application implementation was changed. Full regression, actual screen-reader speech, zoom/device matrix and teacher storage-boundary testing remain separate pending work.


## Implemented alignment follow-up
User approved the first three recommendations. The current local app now exposes validated mastery threshold1–100 (default3) through explicit Save Settings, uses a custom standalone End Session dialog, and includes Practice mode and Session length on recaps. Earlier comparison rows describe the pre-change observation. Autosave/defaults/review filters/nonnegative arithmetic and reset fences remain as before. Publication and full release verification remain pending.
