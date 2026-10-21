> **Release verified 2026-10-21:** Application commit `450b094` passed the full GitHub Actions gate: **628 passed, 1 expected Firefox skip, 0 failures**, and deployed successfully. [CI evidence](https://github.com/Jnuso/CSE-4095/actions/runs/39676377754). Hosted Firefox smoke passed in a fresh disposable profile: deep-link refresh, complete five-question session, 60% recap persistence and Statistics. Live Settings also exposes the new mastery threshold. See [RELEASE_SIGNOFF.md](RELEASE_SIGNOFF.md). Earlier results below are historical.

# Additional edge-case review — 2026-10-21

Follow-up to the earlier successful603-test release gate. These checks intentionally targeted interactions outside that suite. Four concrete failures were reproduced and fixed; final focused checks passed. No publication or full check:all rerun is claimed for these later patches.

## Confirmed issues fixed

| Issue | Reproduction / impact | Repair and regression |
| --- | --- | --- |
| Clock moves backward during practice | Start at noon, report an answer, move clock to11am, then end. completedAt preceded startedAt and the recap failed session validation. | Completion time is at least the session start and latest report time. Service regression plus browser end/reload verification. |
| Clock moves backward after a history reset | Reset at noon, move clock to11am, then Start Session. The brand-new session was treated as older than the reset marker and redirected away. | Fresh session starts strictly after the current durable reset fence. Existing stale-session fences are retained. Service regression and browser reset→rollback→fresh report verification. |
| Recovered Edit choices reuses old identity | Refresh an active session, choose Edit choices, confirm leaving and start again. Recovered full-session data was spread into the new session, overwriting its generated ID/start time and potentially merging history. Independent reviewer identified the real UI path; service regression reproduced reuse of old-session. | New sessions copy only permitted configuration fields. Old IDs, counters and completion metadata cannot override owned fields. Browser regression verifies two distinct sessions with independent right/wrong reports and preserved original history. |
| Mobile double-click selects the next question | Double-click I Got It Right in a mobile-sized Chromium viewport. First click reports once; second can land on an answer newly rendered under the pointer, enabling Flip without an intentional new selection. | AnswerChoice ignores repeated pointer-click events (detail>1), while accepting ordinary clicks and keyboard activation. Component regression and actual browser double-click tests verify exactly one report and an unselected next card. This is pointer/mobile-emulation evidence, not a physical touch-device claim. |

## Additional passing edge checks

- Lower mastery threshold from another tab during active review, complete at the updated threshold, then raise it to100 and recover the original progress as active rather than losing it.
- Clear All in another tab while the End Session dialog is open: modal/card disappear, setup becomes usable, reload cannot restore erased records.
- Correct an invalid numeric draft to100 without losing another unsaved preference; save/reload retains both choices.
- New-session IDs and timestamps cannot be overridden even if a runtime configuration object contains old completion metadata.
- Repeated answer clicks do not suppress keyboard activation or ordinary pointer selection.

## Verification

Final focused results:

- **42 passed** across practiceSession, activeSession, QuestionCard, PracticeSession and StoragePersistence unit/component suites; output/edge-reviewed-units.txt ends EDGE_EXIT=0.
- **14 passed** browser cases across desktop/mobile Chromium; output/edge-reviewed-chromium.txt ends EDGE_EXIT=0.
- **7 passed** Firefox browser cases; output/edge-reviewed-firefox.txt ends EDGE_EXIT=0.
- Production build, focused ESLint and app/e2e TypeScript passed; logs output/edge-reviewed-build.txt, edge-reviewed-lint.txt, edge-reviewed-types.txt.
- Changed code/tests were formatted with Prettier. No test assertions, deadlines or retry settings were weakened.
- Independent read-only edge_case_review examined the repairs, identified the recovered-config bug, and confirmed its explicit-field repair. No further concrete defects found; reviewer made no edits or test claims.

Initial failures are retained: output/edge-clock-before.txt, edge-reset-clock-before.txt, edge-recovered-config-before.txt, edge-browser-chromium.txt and copied failure artifacts under output/edge-first-browser-results/ and edge-reset-clock-first-results/. During overlapping browser/unit work an existing storage integration test exceeded its unchanged5-second deadline; the non-overlapping repeat passed. Do not hide those failed attempts or label them application assertion failures.

Paths above are relative to math-practice-app/. Browser fixtures own disposable data and profiles. System clocks were faked only inside tests; the computer clock and normal student history were not changed.

## Remaining verification

The earlier603-pass full gate in FINAL_RELEASE_TESTING.md predates these small code repairs. Current evidence is63focused passing cases; rerun check:all against the final sources before publication. Actual speech, actual browser/OS-font zoom review and physical-device/Safari/installed-browser matrix remain separate pending checks. This review cannot guarantee absence of every edge case.
