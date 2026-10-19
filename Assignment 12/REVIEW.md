# Independent development review

The student authorized independent review and, after the Python/TypeScript trials, ongoing use of their existing Gemma reviewer. Use a separate read-only agent inside the current chat for broader review and focused Gemma reviews through the existing coding-workers setup where useful. Review consumes additional agent time/usage; Gemma requests use the student's existing Google API quota. No recurring automation or second implementation is started by these instructions.

## When and how to review

Use this process for feature phases and substantial application or test-infrastructure changes. Small documentation-only edits can use formatting/link checks.

1. Give a separate reviewer the authorized scope, professor specification/TODO, project instructions, current changes, and verification evidence. Identify unfinished phases so they are not mistakenly reported as regressions.
2. Ask the reviewer to inspect requirements, behavior, data preservation, accessibility, and meaningful test coverage. Prefer an independent read before sharing the implementer's conclusions. The reviewer must not edit files or weaken tests.
3. Request concrete findings with file/line evidence, a failure scenario, impact, and a suggested check. Separate confirmed defects from questions or manual-review suggestions. A clean review is a valid outcome.
4. Have the implementer reproduce/investigate findings, repair confirmed issues within scope, and rerun affected checks. Run the complete `npm.cmd run check:all` gate before declaring application/test changes verified.
5. Ask the reviewer to inspect the final diff and any repairs. Record findings, disposition, test results, and limitations in DEVELOPMENT_LOG.md. Unresolved significant issues must be reported to the student. If no separate reviewer is available, record that limitation instead of claiming independent review.

## Reusable reviewer request

> Independently review the authorized change against the professor's specification, TODO, and AGENTS.md. Inspect the actual diff and relevant existing behavior/tests. Do not edit files. Prioritize reproducible bugs, omitted requirements within scope, saved-data risks, accessibility regressions, and tests that could pass despite incorrect behavior. Provide file/line evidence and a concrete scenario for each finding. Do not flag explicitly future phases as missing implementation. Distinguish confirmed issues from manual checks and state what you could not verify.

## Gemma request limits and scope

- Use the existing coding-workers skill and its review profile for compact secondary static reviews. Its execution tools are Python/Docker oriented; for TypeScript include the relevant diff, surrounding types, and explicit contracts inline and request text-only findings without tools, edits, or claims of running TypeScript tests.
- Default to one focused request per substantial change, with `max_calls=1` and no automatic retry/resume. Use additional targeted review rounds only for a concrete unresolved concern or a changed patch; give each job the same hard one-call cap.
- Never overlap our Gemma requests. Wait at least 60 seconds after the preceding request finishes before submitting another. Check the prior job's terminal status and timestamps; if completion timing is uncertain, wait a fresh 60 seconds after confirming completion. Status/result reads do not call the model. A running job with uncertain request status must reach a terminal state before the next request.
- Keep prompts and requested responses short because the token allowance is also limited. One request per minute does not guarantee staying within a token quota. If quota is exceeded, record it and honor the provider's longer wait instructions; do not loop on retries.
- Supply only relevant code and requirements. Do not send credentials, private browser data, or unnecessary project snapshots. Do not send the implementer's expected verdict before the independent review.
- Check every finding and line reference locally. The TypeScript trial found the intended defect but cited one line early. Reproduce bugs with local tests before making changes, and preserve the original response and actual result.
- Keep static-review completion separate from test verification. The inline trials collected zero Docker pytest tests and correctly returned `verified: false`; they did not verify the React app. The required local application/browser/accessibility gate remains authoritative for test execution.

These are development instructions enforced when using the reviewer in this chat, not a global rate limiter for other clients or independent callers. The tiny trial results justify further use as a secondary reviewer; they do not establish general React/browser review accuracy.

## What review establishes

The reviewer adds a second perspective; it does not guarantee correctness or replace tests, user acceptance, visual review, or assistive-technology testing. Review runs during authorized development work in the chat. It is not an unattended watcher, GitHub review integration, or a background service.
