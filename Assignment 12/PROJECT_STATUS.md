# Math Practice project status

## Start here

Read AGENTS.md, the relevant TODO phase and specification sections. Read DECISIONS.md only for affected existing behavior. Use TESTING.md and DEPLOYMENT.md for commands; historical phase evidence stays in DEVELOPMENT_LOG.md and notes/.

## Current milestone

- Phase 20 testing is in progress. Automated coverage has been mapped in PHASE_20_TESTING.md; new mixed-operation and complete keyboard-only sessions passed focused desktop/mobile Chromium and Firefox checks. Firefox Pages focused checks passed (10 tests).
- The student's Firefox preference is implemented in new Firefox regression/Pages projects, local install commands and CI. The independent reviewer found a missing build in the standalone Firefox command; it was corrected. A focused run also caught and corrected inherited Chromium launch settings in the Firefox Pages project.
- Full local and CI gates are pending for this test-only change. No application behavior was changed; the previously verified Phase 19 app remains at https://jnuso.github.io/CSE-4095/.
- Phase 20 actual screen-reader speech, actual Firefox 200% zoom and final human accessibility review remain pending. Native Firefox control was stopped by the Windows tool because URL-policy enforcement is unsupported for that browser. The user was asked to provide screen-reader observations. Never mark these verified from DOM/axe/reflow tests.
- Phase 18 session recovery/navigation safety remains pending. Phase 17 physical-device and Phase 16 actual zoom/system text/screen-reader checks remain pending.
- Do not start Phase 21 or Phase 18 without a request. Gemma remains paused.

## Current workflow

Use focused tests while iterating, one final independent review for substantial changes, then the full check:all gate. Preserve CI deployment checks and perform a brief hosted smoke check. Read log summaries rather than entire logs; avoid repeated status polling and duplicate documentation. Gemma is paused. No model settings or connectors have been changed.

## Useful environment facts

- App folder: math-practice-app; shell: PowerShell; use npm.cmd/npx.cmd.
- Normal build uses BrowserRouter; Pages build uses hash routing and dist-pages.
- Browser verification owns isolated contexts and ports 4273/4373; never seed or erase the student's real profile.
- GitHub Pages publication from the public Jnuso/CSE-4095 repository is authorized; retain the separate Cloudflare base site.

Update this short file after each completed phase; do not append the full project history.
