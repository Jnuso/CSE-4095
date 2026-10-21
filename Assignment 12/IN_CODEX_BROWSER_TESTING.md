# In-Codex browser feature testing

Result as of 2026-10-21: **53 passed checks, 7 historical pending/unavailable groups**. This is a partial browser verification pass, not an all-features/full-release pass.

Production build on isolated disposable http://127.0.0.1:51138/. Pages hash build was checked at http://127.0.0.1:59344/. Checked rows were observed in Codex browser UI; separate from check:all. All test data was generated through UI on these scratch origins; the student's normal profile/site progress was untouched.

The main UI runs produced **125 reported answers:83right/42wrong/66%**. All16 operation/difficulty combinations completed5 questions each, plus8 mastery-review answers, mixed10/20 sessions and2 continuous reports. Statistics reconciled every operation/difficulty subtotal. The JSON answer trace contains retained checkpoints rather than all120 entries because browser-control resets interrupted long batches; completed sessions were checked against visible history before being marked.

One confirmed defect was fixed: body min-width320px created15px horizontal overflow with classic scrollbars at 320px viewport. Removed that minimum and strengthened the automated overflow helper to compare scrollWidth with clientWidth. Rebuilt normal/Pages output and verified root/body/scroll widths fit at320,390,768,1280 and all main static pages. No assertions/retries/deadlines were relaxed.

**Browser controls restored:** User cleared the native popup. Pagination, full keyboard session, Edit choices/Back/Forward, reset/Clear All cancellation and confirmation, cross-tab invalidation, mobile active-card layout and interactive Pages hash navigation now pass. User explicitly approved erasing disposable test data. Native End Session handling and active reload remain unverified in IAB. Normal-origin statistics were cleared to zero; Pages56899 completed5 reports (4right/1wrong/80%).

Evidence screenshots: [before320px fix](math-practice-app/output/in-codex-browser/statistics-320.jpg), [fixed mobile statistics](math-practice-app/output/in-codex-browser/statistics-mobile-fixed.jpg). Build logs: output/in-codex-overflow-build.txt and output/in-codex-pages-build.txt.

- [x] **Home and setup navigation** — Fresh Home rendered shared navigation; Start Practice focused Choose your practice. Default Addition/Beginner/10; Mistake review disabled with zero active patterns.
- [x] **Empty statistics** — Zero overall/mistake results, empty sessions, operation/difficulty sections and reset action rendered.
- [x] **Settings defaults and privacy copy** — Feedback, animation and explanations on; sound off; no personal-information fields. Browser-only storage/data-clearing explanation visible.
- [x] **Settings validation/save/reload** — Empty operation set disabled Save. Division/Advanced/5 plus feedback/animation/explanations off and sound on survived reload.
- [x] **Setup validation and overrides** — Zero operations disabled Start; saved Division/Advanced defaults were overridden to Addition/Beginner for this session only.
- [x] **Card/scoring basics and preferences** — 5 questions: four unique choices incl correct result, selection enables Flip, correct reveal, self-report advances. 3 right/2 wrong gives 60% even though all selected numbers were mathematically correct. Explanations off respected.
- [x] **Five-question completion** — Session completed exactly after five reports; recap showed 5 attempted,3 right,2 wrong,60%, and no active card.
- [x] **Addition / Beginner arithmetic** — Completed 5 UI-generated questions; exact arithmetic and four distinct choices validated for every card.
- [x] **Recap reload persistence** — Completed 5-question recap restored with the same 60% after page reload.
- [x] **Explicit-save boundary** — Practice overrides did not change saved Division/Advanced/5 defaults. Unsaved sound-off draft was discarded when leaving Settings.
- [x] **Review eligibility/filtering** — Mistake review unlocked after misses; incompatible saved Division/Advanced filters disabled Start and explained no matching active mistakes.
- [x] **Live cross-tab review statistics and wrong-answer reset** — Two right reviews advanced both original patterns to1; a wrong review reset one to0 and live observer updated without reload. No extra generated-fact pattern was created.
- [ ] **Active-session selected/revealed refresh in Codex browser** — Reload/F5 left the selected card, focus and feedback unchanged; a completed navigation could not be established. Prior Firefox automated recovery evidence is separate; not checked off here.
- [x] **Mastery threshold and early review completion** — Both original patterns reached 3 consecutive correct reviews; continuous review ended at8 reports (7right/1wrong,88%). Active0/mastered2; mastered details retained original facts and miss totals.
- [x] **Review explanations/encouragement and inverse attribution** — Explanations and encouragement appeared when enabled. Subtraction inverses appeared for Addition originals; mistake-frequency attribution remained Addition and exactly2 original patterns.
- [x] **Addition / Easy arithmetic** — 5 UI-generated questions: verified arithmetic, 4 unique valid choices, correct reveal, explanation,3right/2wrong and60% recap.
- [x] **Addition / Intermediate arithmetic** — 5 UI-generated questions: verified arithmetic, 4 unique valid choices, correct reveal, explanation,3right/2wrong and60% recap.
- [x] **Addition / Advanced arithmetic** — 5 UI-generated questions: verified arithmetic, 4 unique valid choices, correct reveal, explanation,3right/2wrong and60% recap.
- [x] **Subtraction / Beginner arithmetic** — 5 UI questions were executed before the browser-control timeout; completed 3right/2wrong,60% history was subsequently verified in the observer. Arithmetic/choice assertions ran before each reveal.
- [x] **Subtraction / Easy arithmetic** — 5 UI questions were executed before the browser-control timeout; completed 3right/2wrong,60% history was subsequently verified in the observer. Arithmetic/choice assertions ran before each reveal.
- [x] **Subtraction / Intermediate arithmetic** — 5 UI questions were executed before the browser-control timeout; completed 3right/2wrong,60% history was subsequently verified in the observer. Arithmetic/choice assertions ran before each reveal.
- [x] **Subtraction / Advanced arithmetic** — Completed the interrupted 5-question session; verified 698−177=521 plus remaining cards,3right/2wrong and60% recap.
- [x] **Multiplication / Beginner arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Multiplication / Easy arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Multiplication / Intermediate arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Multiplication / Advanced arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Division / Beginner arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Division / Easy arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Division / Intermediate arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Division / Advanced arithmetic** — 5 UI questions: exact arithmetic,4 unique choices,correct reveal,3right/2wrong,60% recap.
- [x] **Mixed operations / ten-question sessions** — Configured all4 operations at Intermediate. Progress max10/value5 halfway; completed exactly10 with7right/3wrong,70% recap. Observed operations: − × ÷
- [x] **Twenty-question sessions and full mixed-operation coverage** — Completed20 reports,15right/5wrong,75%. Across the10/20-question samples all4 operation symbols appeared and every answer was verified.
- [x] **Continuous regular session** — Two reports retained1right/1wrong,50%; current question3 remained active and there was no fixed-length progress bar.
- [x] **Leave modal stay/Escape and focus trap** — Statistics navigation opened focused Keep practicing; ShiftTab/Tab cycled between its two controls; Escape preserved question55+24 and2 reported answers.
- [ ] **Native End Session accept/cancel in Codex browser** — Input dispatch timed out with native confirmation blocking tab3; getJsDialog returned undefined and Escape could not dismiss it. Other tab remains usable. Prior Firefox automated confirmation evidence is separate.
- [x] **Keyboard-only full session in Codex browser** — Entered setup and completed all five questions using Enter, Space and number key 2. Each second choice became pressed; next-card focus advanced; recap showed 5 right, 0 wrong, 100%.
- [x] **Overall/operation/difficulty statistics** — 120 reported attempts =78right+42wrong,65%. Four operation and four difficulty totals reconcile to120; operation accuracies match rounded self-report ratios.
- [x] **Initial recent history and incomplete-session coverage** — Statistics initially shows10 newest session rows; unfinished continuous session retains2 attempts/50% alongside completed recaps.
- [x] **Session/mistake pagination after native popup** — After user cleared native dialog, both lists expanded from 10 to 20 entries using their Show more buttons.
- [x] **320px classic-scrollbar layout** — Found and fixed body min-width320px causing15px horizontal overflow. Retest with new CSS: root/body/scroll all305px at320px viewport; strengthened noOverflow now compares against clientWidth.
- [x] **Responsive populated statistics at 320/390/768/1280** — All4 actual viewport overrides: no horizontal overflow using scrollbar-excluding clientWidth; eight operation/difficulty cards fit available width.
- [x] **Missing-session recovery route** — Direct /practice/session without configuration returned to setup with a plain-language explanation and retained saved history.
- [x] **Direct summary fallback and incomplete exclusion** — Direct /practice/summary recovered latest completed20-question75% recap, ignoring newer unfinished2-question session.
- [x] **Unknown-route fallback** — Unknown URL rendered friendly not-found page with Back home link and preserved header/navigation.
- [x] **320px Home/setup/Settings/recap layout and touch targets** — All4 pages fit scrollbar-excluding usable width with no horizontal overflow. Visible action/navigation controls measured at least43px high (44px target with rounding tolerance).
- [x] **Browser data persistence through new documents** — Statistics still shows120attempts,78right,42wrong,65% after production-build reload and several direct document navigations; latest completed recap remains20questions/75%.
- [x] **Working-tab runtime console** — No error/warning entries captured in tab4 through statistics, Settings, setup, recap, unknown-route and responsive reads. Native-dialog tool failures are recorded separately.
- [x] **Pages hash direct routes and safe fallbacks** — Fresh Pages Home plus six direct hash routes rendered:setup,missing-session→setup,summary,statistics,Settings,unknown-page. Own origin used no normal-build test history.
- [x] **Back/Forward, Edit choices, end-and-leave completion** — Practice Again opened a new zero-answer session. Edit choices opened custom guard; End session and leave retained Addition/Beginner/5 on setup. Back safely redirected closed entry to setup with no-session message; Forward remained safe.
- [x] **Reset Statistics cancel/confirm and preference preservation** — Cancel preserved125/83/42/66%. Confirm erased history/mistakes/review counters to zero and retained saved Division/Advanced/5 plus feedback, animation and explanation preferences.
- [x] **Clear All cancel/confirm and restored defaults** — Cancel kept saved data and peer active question. Confirm returned Home and restored Addition/Beginner/10, feedback/animation/explanations on and sound off. Statistics remained zero. User explicitly approved deletion of disposable test-origin data.
- [x] **Cross-tab reset/Clear All invalidates active recovery** — Both reset actions immediately redirected another tab from its active session to setup with no-session message. Reload after each did not recover the erased session; defaults reflected reset versus Clear All correctly.
- [x] **Practice-card responsive layout after overflow fix** — At requested320px (root client305 with classic scrollbar), question and revealed-answer views both had scrollWidth305. All four answer buttons measured221×64px; selection and reveal worked. No claim from stale larger-viewport measurements.
- [ ] **Audible sound playback** — Sound setting save/reload passed; actual audible output was not observed.
- [ ] **Actual browser200% zoom and larger OS fonts** — Viewport overrides are not browser zoom/system-font evidence; unavailable from these controls.
- [ ] **Actual screen-reader speech** — Still explicitly deferred by user; DOM/accessibility names are not spoken-output verification.
- [ ] **Physical devices and Chrome/Firefox/Edge/Safari matrix** — This run uses only Codex in-app browser; no claim about other engines or physical devices.
- [ ] **Fault-injection/storage boundary tests** — Quota/blocked storage, unsupported/corrupt saves, generator/chunk failures,100-session retention and6000-attempt compaction need the separate controlled automated suite; not established through normal UI here.
- [x] **Interactive Pages session and skip-link routing** — Fresh Pages hash build: skip link focused main-content on Home and recap; normal UI completed5 answers with4right/1wrong/80%, routed to recap then Statistics with matching totals.
- [x] **Complete automated check:all release gate** — Completed2026-10-21:603passed,1expected Firefox skip, exit0. See FINAL_RELEASE_TESTING.md; this is separate automated evidence, not a claim that every check ran through Codex UI.

## Limitations

The run is waiting for the inaccessible native popup to be dismissed before the remaining interactive checks can continue. Actual speech/OS fonts/physical devices and other engines are not certified here. Browser geometry and captured accessibility text are not substitutes for those checks. Full automated release gate and deployment remain pending.

Full automated gate follow-up: FINAL_RELEASE_TESTING.md supersedes the earlier pending automated-gate entry. The old native End Session pending entry is historical: PROFESSOR_ALIGNMENT.md replaced that popup with a custom dialog and verified cancellation/confirmation in Codex and all automated browser projects. Remaining UI-only checks are not implied passed by automation.
