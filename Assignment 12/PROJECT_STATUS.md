# Math Practice project status

## Start here

Read AGENTS.md, the relevant TODO phase and specification sections. Read DECISIONS.md only for affected existing behavior. Use TESTING.md and DEPLOYMENT.md for commands; historical phase evidence stays in DEVELOPMENT_LOG.md and notes/.

## Current milestone

- Phase 20 automated testing is verified. The application remains live at https://jnuso.github.io/CSE-4095/; no application behavior changed in this phase.
- Verified/deployed revision: 2b868291b262ed0bfe48b54761b4efb3748fcb9c. Successful full CI gate/Pages deployment: https://github.com/Jnuso/CSE-4095/actions/runs/39517767620.
- CI passed 565 checks: 315 unit/component + 147 Chromium browser/restart + 30 Pages (including Firefox) + 73 Firefox regressions. Formatting, lint, types and builds passed.
- PHASE_20_TESTING.md maps all requested coverage. Added reproducible mixed-operation and complete keyboard-only sessions; Firefox regression/Pages projects now run in check:all and CI.
- Independent review's missing standalone Firefox build was fixed. Firefox Pages launch-channel inheritance was corrected. CI then caught a programmatic-focus assumption; the test now reaches its answer by real Tab input, retains the visible-outline assertion and explicitly checks focus.
- Final hosted Firefox smoke passed. At the student's request, internal ChatGPT browser testing also passed a five-question scratch-origin session, recap/reload and Statistics (3 right/2 wrong/60%); screenshot/evidence under output/playwright/phase-20-live and notes/phase-20-internal-browser-check.txt.
- Local parallel Windows units hit an existing retention deadline; isolated tests and a one-worker full unit run passed with original deadlines. The duplicate local browser run was stopped after CI verified the entire gate. See notes/phase-20-check-all.txt for the precise verification split; do not claim a complete local Windows gate pass.
- Actual screen-reader speech remains pending at the student's explicit request. Literal browser zoom remains pending: native Firefox control was unsupported, and the internal browser zoom shortcut did not establish a scale change. Phase 20 remains incomplete for those two manual checks.
- Phase 18 remains pending, as do Phase 17 physical-device and Phase 16 actual system-text/assistive-technology checks. Do not start another phase automatically. Gemma remains paused.

## Current workflow

Use focused tests while iterating, one final independent review for substantial changes, then the full check:all gate. Preserve CI deployment checks and perform a brief hosted smoke check. Read log summaries rather than entire logs; avoid repeated status polling and duplicate documentation. Gemma is paused. No model settings or connectors have been changed.

## Useful environment facts

- App folder: math-practice-app; shell: PowerShell; use npm.cmd/npx.cmd.
- Normal build uses BrowserRouter; Pages build uses hash routing and dist-pages.
- Browser verification owns isolated contexts and ports 4273/4373; never seed or erase the student's real profile.
- GitHub Pages publication from the public Jnuso/CSE-4095 repository is authorized; retain the separate Cloudflare base site.

Update this short file after each completed phase; do not append the full project history.
