# Final automated release testing — 2026-10-21

**Later-source note:** EDGE_CASE_REVIEW.md records repairs made after this successful gate. Those patches have63focused passes; this603-pass result does not claim a full rerun of the later sources.

**PASS: npm.cmd run check:all completed with exit code0.**

| Stage | Result |
| --- | --- |
| Prettier formatting | Passed |
| ESLint, zero warnings | Passed |
| Unit/component/service tests | 327passed across31files |
| App and browser TypeScript | Passed |
| Normal production build | Passed |
| Chromium desktop/mobile plus real browser restart | 163passed |
| Pages build and desktop/mobile Chromium/Firefox checks | 33passed |
| Firefox regression | 80passed,1expected skip |
| Total automated tests | **603passed,1expected skip,0failures** |

The sole skip is the existing Chromium-only4xCPU simulation in the Firefox project. Both Chromium projects ran and passed that simulation; no assertion, deadline or retry rule was weakened.

Coverage includes all operation/difficulty arithmetic boundaries;5/10/20/continuous sessions; choices/reveal/self-report/keyboard/focus; configurable mastery and wrong-review reset; recap metadata; settings/defaults/persistence; exact selected/revealed-card recovery; navigation/Back/Forward/closed-entry protection; cross-tab reset/ClearAll fencing; corrupt/future/legacy data; quota/blocked storage; large-history transport, size and aggregate preservation; desktop/mobile layouts; full-page axe scans; lazy loading/failure recovery; Pages hash routes/deep links; and browser-process restart persistence. The test fixtures own their profiles and data; no normal student profile was reset.

## Runs and diagnostics

1. Initial check:all stopped at four unformatted saved QA artifacts. They were formatted without changing application behavior or assertions. Log: math-practice-app/output/full-release-gate-initial.txt.
2. Sandbox repeat passed327units and162Chromiumdesktop/mobile tests but failed persistent-profile restart. A diagnostic run showed that both app storage and an independent restart-control localStorage value disappeared after restarting the test browser. Separately, sandbox Firefox crashed before page load on Windows registry initialization (NS_ERROR_FAILURE; process exit3221225477). Sandbox runners also stalled at teardown and were interrupted; they are not clean gate passes. Logs: full-release-gate-repeat.txt, restart-diagnostic.txt, restart-browser-debug.txt, restart-control.txt and full-release-pages.txt in math-practice-app/output/.
3. The unchanged assertions/deadlines passed in the complete unrestricted rerun. Chromium restart passed and all Firefox launches succeeded; runner teardown completed normally. Authoritative log: [full-release-gate-unsandboxed.txt](math-practice-app/output/full-release-gate-unsandboxed.txt), ending GATE_EXIT_CODE=0. Chromium163passed(9.5m), Pages33passed(1.8m), Firefox80passed/1skipped(5.6m). Unit stage327passed(50.97s).

Retained restart diagnostics attach the task-owned profile file list and reopened storage/history state; an unrelated test-only control value distinguishes browser-profile persistence from app record handling. No application fix was needed. Failure evidence remains in output/full-gate-first-browser-results/, restart-sandbox-diagnostics/ and pages-sandbox-diagnostics/; original traces remain intact.

## Limits and next step

This completes the automated release gate for the current local sources, including professor-alignment changes. It does not establish actual screen-reader speech, actual200%browser zoom/enlarged OS fonts, physical-device results, or an actual Safari/installed Chrome/Edge matrix. Existing viewport/text-size and Chromium/Firefox evidence is labelled accurately; speech remains explicitly deferred by the student.

No commit, push, CI run or deployment was performed. The hosted site still serves the previously published revision; publication and hosted smoke verification are separate outstanding steps. Historical focused-run limitations in PROFESSOR_ALIGNMENT.md are superseded by this complete successful gate, not erased.
