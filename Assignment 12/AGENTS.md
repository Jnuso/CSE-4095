# Assignment 12 development checks

- Follow the professor's specification and TODO, completing only the phase authorized by the student.
- For changes to application code or test/build configuration, run `npm.cmd run check:all` from `math-practice-app` before declaring the change verified. This runs formatting, lint, unit/component tests, test type checking, production build, and the browser regression suite.
- If the browser is missing, run `npm.cmd run test:install` once. Browser launching may need the host's normal execution permissions. If a check cannot run, report that limitation and do not claim it passed.
- Extend the tests with meaningful new flows when a phase adds behavior. Keep existing coverage; update expectations only when the intended behavior changes, not merely to silence failures.
- Browser tests use isolated contexts and the test-owned server at port 4273. Keep them separate from the student's saved browser profile and development server. Never seed, clear, or corrupt the student's real saved history for testing.
- Record important decisions, actual test results, and remaining limitations in DEVELOPMENT_LOG.md. Only check TODO items that were completed and verified.
- Keep TESTING.md current as the main test guide. Historical phase guides preserve milestone evidence.
- For documentation-only changes, use the relevant formatting/link checks rather than rerunning unrelated browser flows.
