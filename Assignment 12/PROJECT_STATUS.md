# Math Practice project status

## Start here

Read AGENTS.md, the relevant TODO phase and specification sections. Read DECISIONS.md only for affected existing behavior. Use TESTING.md and DEPLOYMENT.md for commands; historical phase evidence stays in DEVELOPMENT_LOG.md and notes/.

## Current milestone

- Phase 16 accessibility implementation is deployed at https://jnuso.github.io/CSE-4095/.
- Deployed app commit: e34a0f57af0e400a0aee80e653600eed76a4388c.
- Successful verification/deployment: https://github.com/Jnuso/CSE-4095/actions/runs/39494733877.
- Last application gate: 304 unit/component + 125 browser + 20 Pages tests = 449 passed; formatting, lint, types and builds passed. Isolated live desktop/mobile smoke checks passed.
- Phase 16 pending manual checks: actual 200% browser zoom, larger system text settings and actual screen-reader speech. Do not mark these verified from simulated reflow/text or DOM tests. Guide: PHASE_16_TESTING.md.
- Next development phase is Phase 17 responsive design and polish, once requested. Do not start it merely because the workflow was updated.

## Current workflow

Use focused tests while iterating, one final independent review for substantial changes, then the full check:all gate. Preserve CI deployment checks and perform a brief hosted smoke check. Read log summaries rather than entire logs; avoid repeated status polling and duplicate documentation. Gemma is paused. No model settings or connectors have been changed.

## Useful environment facts

- App folder: math-practice-app; shell: PowerShell; use npm.cmd/npx.cmd.
- Normal build uses BrowserRouter; Pages build uses hash routing and dist-pages.
- Browser verification owns isolated contexts and ports 4273/4373; never seed or erase the student's real profile.
- GitHub Pages publication from the public Jnuso/CSE-4095 repository is authorized; retain the separate Cloudflare base site.

Update this short file after each completed phase; do not append the full project history.
