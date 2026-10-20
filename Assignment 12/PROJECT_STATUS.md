# Math Practice project status

## Start here

Read AGENTS.md, the relevant TODO phase and specification sections. Read DECISIONS.md only for affected existing behavior. Use TESTING.md and DEPLOYMENT.md for commands; historical phase evidence stays in DEVELOPMENT_LOG.md and notes/.

## Current milestone

- Phase 17 responsive design and supportive feedback is implemented and locally verified; deployment confirmation will be recorded after CI succeeds.
- Full final gate passed outside the sandbox: 306 unit/component + 139 browser + 20 Pages tests = 465 passed; formatting, lint, types and both builds passed.
- Narrow phones use stacked answers and compact navigation; statistics cards wrap within the viewport. Revealing a card preserves its front height.
- Encouraging feedback follows self-reported results, varies between short supportive phrases and has a saved Settings opt-out. Legacy settings remain valid.
- One independent read-only review found no concrete defects. Gemma remains paused.
- The sandbox lost the temporary restart-test profile on browser relaunch; the unchanged isolated test and complete gate passed outside it. Use the normal host environment if that sandbox behavior recurs; never weaken the persistence assertion.
- Phase 17 physical-device review remains for the student: PHASE_17_TESTING.md. Phase 16 actual 200% zoom, larger system text and screen-reader speech remain pending: PHASE_16_TESTING.md.
- Next development phase: Phase 18 session recovery and navigation safety, only once requested.

## Current workflow

Use focused tests while iterating, one final independent review for substantial changes, then the full check:all gate. Preserve CI deployment checks and perform a brief hosted smoke check. Read log summaries rather than entire logs; avoid repeated status polling and duplicate documentation. Gemma is paused. No model settings or connectors have been changed.

## Useful environment facts

- App folder: math-practice-app; shell: PowerShell; use npm.cmd/npx.cmd.
- Normal build uses BrowserRouter; Pages build uses hash routing and dist-pages.
- Browser verification owns isolated contexts and ports 4273/4373; never seed or erase the student's real profile.
- GitHub Pages publication from the public Jnuso/CSE-4095 repository is authorized; retain the separate Cloudflare base site.

Update this short file after each completed phase; do not append the full project history.
