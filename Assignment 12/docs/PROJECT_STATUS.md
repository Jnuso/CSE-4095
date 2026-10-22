# Math Practice project status

Updated 2026-10-21. Start with [the assignment audit](ASSIGNMENT_12_AUDIT.md) and [project README](../README.md). Historical phase evidence remains in DEVELOPMENT_LOG.md and PHASE_*_TESTING.md; it does not describe current release readiness.

## Published application

- Live: https://jnuso.github.io/CSE-4095/ . Public repository: Jnuso/CSE-4095.
- Application revision: 5edc6d24313b118462ca5c6799f748c31deaa329. [Original successful verification/deployment, attempt 1](https://github.com/Jnuso/CSE-4095/actions/runs/39693837598/attempts/1): 631 tests passed, one expected Firefox CPU-simulation skip.
- Published features include active-session recovery/navigation protection, compact mistake/review journals, editable mastery threshold, custom End Session dialog, recap mode/length and Statistics section navigation. These are no longer local-only or future phases.
- The audit itself changed no application source. Subsequent authorized fixes are local and described in [COMPLIANCE_FIXES.md](COMPLIANCE_FIXES.md); the separate Cloudflare base site is unchanged.

## Latest audit and verification

- [Fresh CI attempt 2](https://github.com/Jnuso/CSE-4095/actions/runs/39693837598/attempts/2) failed: 331 unit/component/service passes; Chromium 177 passes, one mobile Statistics-menu active-indicator failure and one dependency test not run. The failed attempt did not deploy a replacement.
- Hosted disposable Chromium walkthrough passed 83 reports: all 16 operation/difficulty combinations, review mastery, recap/settings persistence, route refreshes and 320px geometry, with no captured runtime/console errors. Thirty further hosted mobile menu jumps passed; this does not dismiss the intermittent CI failure.
- Local full attempts encountered worker stalls/timeouts. All 17 focused component and five focused browser reproductions passed with original assertions/deadlines. Separate Pages: 32 passed, one Firefox page-fixture startup timeout. Separate Firefox: 86 passed, two timeout failures, one expected CPU-simulation skip. Real-process restart: one passed. Full error classifications/logs are in the audit.
- Historical 52-check Codex, 603/628-test gates and earlier deployments remain supporting evidence, not the current audit result.

## Open work

1. Finish CI and hosted verification for the authorized Statistics-menu, lifetime-total and 320px label fixes. All 338 units and 33 Pages checks passed; local browser failures and focused repairs are recorded separately in COMPLIANCE_FIXES.md. Independent review found no concrete defects. The student requested an immediate push for submission; deployment remains gated by CI.
4. Assemble the required 2-3 page student development report and selected authentic AI interaction evidence.
5. Finish or explicitly disclose enlarged operating-system fonts, physical devices and the remaining installed Chrome/Edge checks. The student confirmed screen-reader, browser zoom, Safari and audible sound testing complete on 2026-10-21; these are student-performed checks.

## Working contracts

- Follow AGENTS.md; read the relevant specification/TODO and DECISIONS.md before changing behavior. The authorized lifetime-total contract supersedes the historical rolling-100 total policy; detailed records remain capped at 100.
- Use focused checks during implementation and the full gate at the end. Preserve meaningful assertions and axe rules; do not add retries just to hide failures. A full pass and successful CI are required before publishing changed application code.
- Use one independent read-only review for substantial application changes under REVIEW.md. Gemma is paused; do not probe Docker or start Gemma jobs without the student's request.
- Preserve the student's normal browser history/profile. Tests own disposable contexts and local ports 4273/4373.
- GitHub Pages publication is authorized for Jnuso/CSE-4095 after checks. Keep the separate Cloudflare site intact. Do not create chats or change model/connector settings automatically.
- PowerShell commands use npm.cmd/npx.cmd. App: math-practice-app. Normal build: dist with browser routing; Pages: dist-pages with hash routing. Current recovery restores the same tab's selected/revealed card after refresh.

Keep this file short and current. Add detailed chronology to DEVELOPMENT_LOG.md rather than stacking contradictory status banners here.
