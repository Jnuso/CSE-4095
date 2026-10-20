# Existing behavior contracts

Read the relevant entries when changing settings, storage, practice review or statistics. These preserve accepted decisions; they do not authorize future phases. Historical evidence remains in DEVELOPMENT_LOG.md.

- Accepted Phase 10 defaults: count every reported answer including incomplete sessions; label incomplete recent sessions; statistics reset preserves preferences; initially show 10 recent sessions with Show more. These decisions do not authorize implementing Phase 10 until requested.

- Phase 11 defaults are saved explicitly through Settings; individual session setup overrides must not rewrite them. Sound defaults off; animation and explanations default on. Keep browser audio failures from interrupting practice.

- Clear All Application Data requires explicit destructive confirmation and restores preferences as well as history. It may deliberately replace protected app data, but must touch only the app's storage key, preserve unrelated data, report write failures honestly, and prevent stale tabs restoring erased records/pending preferences.

- Phase 12 mistake counts follow self-reported wrong answers, keyed by operation, ordered operands and difficulty. Capture events before trimming session details; preserve idempotence across snapshots, retries and tabs. History reset and Clear All erase both the journal and cached patterns. Use the later phase rules below for review/mastery gains.

- Phase 14 review filters source patterns by selected operation/difficulty, while valid inverse questions may use a related operation. Self-report is authoritative; consecutive successes use settings.masteryThreshold (default 3). Wrong review updates the original pattern, resets progress, and does not create a duplicate generated-fact pattern.

- Keep reviewEvents as authoritative deduplicated right/wrong evidence alongside base mistakeEvents. Capture before session trimming, merge both with reset protection, replay chronologically and do not restore mastery from cache when a present journal has no supporting evidence. A later regular miss reopens the original. The displayed card may finish after a cross-tab update; subsequent selection uses current progress and excludes mastered patterns.

- Phase 15 Statistics is read-only: mistake/review metrics use all remembered patterns plus deduplicated journal and retained legacy source-review attempts, while the original history totals keep the newest-100-session scope. Attribute wrong inverse reviews to their original fact/operation, include active and mastered patterns in frequency rankings, show all top ties and keep detail sorting deterministic. Browsing views/pagination must not save or change mastery.

- Phase 19 recognizes supported saves and repairs affected categories independently: validate and deduplicate recoverable answers, rebuild session totals, preserve valid preferences and independent mistake/review evidence, and never rewrite merely on read. Unreadable JSON and unsupported versions remain protected. Displayed questions must have four valid choices and match configuration; bounded deterministic fallbacks retain the original review pattern. Page errors preserve layout navigation and provide focused, plain-language recovery without rendering exception details. Phase 18 remains pending.
