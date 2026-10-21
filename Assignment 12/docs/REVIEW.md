# Lean independent review

The student approved this lower-overhead workflow after Phase 16. It supersedes the previous default of repeated independent and Gemma review rounds.

## Review policy

- For substantial feature, storage, accessibility or test-infrastructure changes, request one read-only reviewer after the implementation and focused tests are ready.
- Give the reviewer a compact task: authorized scope, relevant specification/TODO and behavior contracts, changed files/diff, and verification summary. Prefer relevant files over full conversation-history inheritance when possible.
- Ask for concrete defects with file/line evidence and a failure scenario. The reviewer must not edit files, weaken tests, or flag explicitly future phases as missing work. A clean review is valid.
- Investigate findings, fix confirmed issues, and rerun affected checks. Re-contact the reviewer only for a significant finding or a substantial repair that needs another independent look; do not request a new review for every minor fix.
- Per the student’s 2026-10-20 instruction, use focused checks for each current step and defer check:all until the end. Report focused verification honestly. Review never substitutes for tests, student acceptance or assistive-technology checks.
- Record the result and limitations once in the phase log. If no reviewer ran, say so. Small routine fixes and documentation-only work can use self-review and relevant checks.

## Gemma: paused

Do not start Gemma jobs or probe Docker during normal phases. Resume only when the student explicitly requests it. When resumed, use the existing coding-workers skill, compact text-only TypeScript static review, profile review, max_calls=1, no tools/edits/test claims, no overlapping jobs and no automatic retry/resume. Wait at least 60 seconds after the preceding request finishes; honor longer provider quota delays. If completion is uncertain, confirm terminal status then wait a fresh minute. Supply only relevant code, no credentials or browser data. Verify findings locally and preserve the raw response; static review is not application test verification.
