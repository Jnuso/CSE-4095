# Math Practice project status

## Start here

Read AGENTS.md, the relevant TODO phase and specification sections. Read DECISIONS.md only for affected existing behavior. Use TESTING.md and DEPLOYMENT.md for commands; historical phase evidence stays in DEVELOPMENT_LOG.md and notes/.

## Current milestone

- Phase 19 is deployed at https://jnuso.github.io/CSE-4095/.
- Deployed commit: f05707b3ef852bfe0fe40cee08ee29069e3c3d85. Successful CI/Pages deployment: https://github.com/Jnuso/CSE-4095/actions/runs/39514009612.
- Final hosted desktop/mobile checks passed missing-session explanation, safe Home navigation, valid-answer recovery, preserved preferences and save/reload.
- CI initially caught an existing asynchronous migration assertion race. The test now waits for the actual save effect, preserving its expected version/history checks; full final local and CI gates passed.
- Phase 18 session recovery/navigation safety remains pending: the student explicitly requested Phase 19 after Phase 17. Do not mark Phase 18 completed or start another phase automatically.
- Final check:all passed in the normal host environment: 315 unit/component + 143 browser + 20 Pages tests = 478 passed, plus formatting, lint, types and both builds.
- Supported saves recover valid answers from damaged sessions, deduplicate identities and rebuild totals. Malformed record categories preserve valid settings and independent mistake/review evidence. Reads do not rewrite saves; unknown versions/unreadable JSON remain protected.
- Question display uses bounded validation/retries and deterministic fallbacks matching configuration and original review identity. Development warnings contain codes/counts only.
- Missing-session navigation explains the problem and offers safe Home/setup actions. Render failures preserve layout/navigation and restore heading focus/title after retry.
- One independent review found a layout/focus issue; it was fixed and re-reviewed. The remaining minor retry-title issue was also fixed and tested. Gemma remains paused.
- Manual Phase 19 review: PHASE_19_TESTING.md. Phase 17 physical-device review and Phase 16 actual zoom, system text and screen-reader checks remain pending.

## Current workflow

Use focused tests while iterating, one final independent review for substantial changes, then the full check:all gate. Preserve CI deployment checks and perform a brief hosted smoke check. Read log summaries rather than entire logs; avoid repeated status polling and duplicate documentation. Gemma is paused. No model settings or connectors have been changed.

## Useful environment facts

- App folder: math-practice-app; shell: PowerShell; use npm.cmd/npx.cmd.
- Normal build uses BrowserRouter; Pages build uses hash routing and dist-pages.
- Browser verification owns isolated contexts and ports 4273/4373; never seed or erase the student's real profile.
- GitHub Pages publication from the public Jnuso/CSE-4095 repository is authorized; retain the separate Cloudflare base site.

Update this short file after each completed phase; do not append the full project history.
