> **Current readiness — 2026-10-21:** [The assignment audit](ASSIGNMENT_12_AUDIT.md) supersedes this historical release certificate for current readiness. Fresh CI attempt 2 on `5edc6d2` failed a mobile Statistics-menu marker assertion after 331 unit and 177 browser passes. No replacement was deployed. Original successful publication is [attempt 1](https://github.com/Jnuso/CSE-4095/actions/runs/39693837598/attempts/1): 631 passes, one expected skip.

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

On 2026-10-21 the student confirmed completing screen-reader, browser zoom, Safari and audible sound tests. These are recorded as student-performed manual checks, not assistant-observed tests. Enlarged operating-system fonts, physical devices and the remaining installed Chrome/Edge matrix are still separate unconfirmed checks. Automated accessibility, viewport and text-size simulations remain separate evidence.

## Separate repository workflow

Follow-up commit `50ebcf2` fixes the older base-site Selenium import so lint passes. [Base workflow run 39676722214](https://github.com/Jnuso/CSE-4095/actions/runs/39676722214) reports **243 passed, 5 failed** in unrelated demos:

- Chopsticks experiment result text case.
- Checker Swap pause/resume behavior.
- Card Game mode-label text case.
- BFS and A* puzzle clearing/invalid-input behavior (two failures).

These failures remain open; the repository-wide workflows are not all green. Assignment 12 verification and deployment passed independently.
