# Phase 19: Error handling

Live app after deployment: https://jnuso.github.io/CSE-4095/

1. In a private browser window, open https://jnuso.github.io/CSE-4095/#/practice/session directly. Expect the practice setup page plus a short explanation that no session is available. Choose a new session or use Back home.
2. In a fresh private window, open the recap before completing a session. It should explain that no results are available and offer practice setup and Home.
3. Complete a normal session, refresh its recap, and browse Statistics and Settings. Existing practice, saved defaults, feedback and scoring should work normally.
4. Recovery tests use disposable browser contexts. They place a damaged answer beside valid answers, verify that only the damaged answer is discarded and totals are rebuilt, check that preferences and mistake history survive, save the recovered data and reload. Do not corrupt your usual browser history to test this.
5. Unit tests inject thrown or malformed generated questions and a broken random source. Regular practice retries up to ten candidates and then uses a validated deterministic fallback; review makes three randomized attempts and one deterministic fallback that keeps the original mistake identity. Questions still obey arithmetic, difficulty and answer-choice rules.
6. An integrated component test simulates a page-render failure, checks that navigation and the skip link remain available, focuses the friendly error heading, retries, restores the recovered heading/title and returns Home. Technical exception details are never rendered. Development logs contain diagnostic codes and counts only; production omits those diagnostic warnings.

Unrecognized save versions and unreadable JSON remain protected from automatic overwrites. Recognized saves recover affected categories independently. A damaged records container does not reset valid preferences or mistake evidence; recoverable session totals are rebuilt from validated, deduplicated answers. Reading alone does not rewrite saved data. Existing reset/cross-tab safeguards remain in place.

Automated checks do not replace physical-device, actual zoom/system-text and screen-reader review. Phase 18 session recovery remains unimplemented because Phase 19 was explicitly requested first.

Run npm.cmd run check:all from math-practice-app. Full final evidence: notes/phase-19-check-all.txt.
