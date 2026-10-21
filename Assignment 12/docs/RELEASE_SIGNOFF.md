# Release verification — 2026-10-21

Application revision: `450b09455b41beddbc6a3e70928d7809d870f2a5`.

[Published Math Practice](https://jnuso.github.io/CSE-4095/) · [Successful verification and deployment](https://github.com/Jnuso/CSE-4095/actions/runs/39676377754)

| Full automated gate | Result |
| --- | --- |
| Formatting, lint, application/browser types, normal and Pages builds | Passed |
| Unit/component/service | 331 passed |
| Chromium desktop/mobile and real-process restart | 177 passed |
| Pages Chromium desktop/mobile and Firefox | 33 passed |
| Firefox regression | 87 passed, 1 expected skip |
| Total | **628 passed, 1 expected skip, 0 failures** |

The skip is the existing Chromium-only 4x CPU simulation; both Chromium projects passed it. These results include the final edge-case repairs and supersede the earlier 603-test gate.

## Hosted smoke

- [x] Firefox fresh disposable context: Pages deep link and reload.
- [x] Complete five-question addition session, alternating right/wrong reports.
- [x] Recap accuracy 60%, five attempts, preserved after reload.
- [x] Statistics route, viewport overflow assertion and no page runtime errors.
- [x] In-Codex browser: live Settings exposes the mastery threshold (value 3).
- [ ] Broader hosted review-session and every-route/responsive walkthrough.

The Firefox smoke used `notes/phase-20-firefox-live-check.mjs`; its screenshot is retained locally at `math-practice-app/output/playwright/phase-20-live/firefox-recap.png`. Normal browser-profile history was not reset.

## Remaining manual review

Actual screen-reader speech remains deferred at the student's request. Actual 200% browser zoom/enlarged system fonts, physical devices and actual Safari/installed Chrome/Edge coverage remain unverified. Automated accessibility, viewport and text-size simulation results do not replace those checks.

## Separate repository workflow

Follow-up commit `50ebcf2` fixes the older base-site Selenium import so lint passes. [Base workflow run 39676722214](https://github.com/Jnuso/CSE-4095/actions/runs/39676722214) reports **243 passed, 5 failed** in unrelated demos:

- Chopsticks experiment result text case.
- Checker Swap pause/resume behavior.
- Card Game mode-label text case.
- BFS and A* puzzle clearing/invalid-input behavior (two failures).

These failures remain open; the repository-wide workflows are not all green. Assignment 12 verification and deployment passed independently.
