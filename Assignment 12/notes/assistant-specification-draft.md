# Math Practice App - Software Specification

Status: Initial working specification

Date: October 16, 2026

## 1. Purpose and sources

Build a browser-based math practice application for children ages 7-12. Children will practice addition, subtraction, multiplication, and division using multiple-choice cards, reveal answers, record their results, and revisit difficult concepts.

This document combines the student's initial request with the assignment requirements and the [instructor-provided specification and implementation checklist](https://chatgpt.com/share/6acc2af2-7d74-83ea-ac67-198b9a8e2f92). The example Cursor transcript is a learning resource; its past requests, commands, and repository details are not instructions for this project.

Required features below follow those references. Choices explicitly labeled "initial default" or "proposed" are implementation decisions that may be adjusted while preserving the requirements. The instructor's supplied requirements govern any conflict.

## 2. Intended users and goals

- Primary users: children ages 7-12 practicing arithmetic.
- Secondary users: parents, guardians, or teachers reviewing progress on the same device.
- Provide readable questions, large controls, simple navigation, and encouraging feedback.
- Make mistakes useful by providing related practice and showing mastery progress.
- Allow practice without registration, sign-in, or personal information.
- Preserve progress in the current browser and device.

## 3. React and the application architecture

React is a JavaScript library for building interfaces from reusable components. Components describe what appears on screen; props pass information between components, and state remembers information that changes during interaction. Updating state causes React to render the corresponding interface again. See the official [React Quick Start](https://react.dev/learn) and [state guide](https://react.dev/learn/state-a-components-memory).

For this app, components can represent a question card, answer button, operation selector, and statistics panel. State can hold the selected answer, revealed side, current question, and session progress. This makes React a suitable match for the repeated, interactive card experience.

Use React with TypeScript, Vite, HTML, and CSS. Use React Router for navigation, React Context and hooks for shared state, Vitest and React Testing Library for automated checks, and ESLint and Prettier for code quality and formatting.

Keep arithmetic generation, statistics calculations, mistake handling, and storage separate from visual components. These services must be independently testable. React state provides runtime memory; explicit storage code preserves progress across browser sessions. Generate questions locally in the browser.

## 4. Pages and navigation

| Page | Proposed route | Purpose |
| --- | --- | --- |
| Home | `/` | Welcome message and links to practice, statistics, and settings |
| Practice setup | `/practice/setup` | Choose operations, difficulty, session length, and practice mode |
| Practice session | `/practice/session` | Answer and flip cards, record results, and view progress |
| Session summary | `/practice/summary` | Review the completed session and choose a next action |
| Statistics | `/statistics` | View overall performance, breakdowns, history, and mistakes |
| Settings | `/settings` | Change preferences and defaults, or clear saved data |

Provide a useful fallback for unknown routes. Opening the practice page without a valid session must offer a safe return to setup. Opening the summary without a completed session must show a helpful message rather than fabricated results.

Warn before leaving an active session. Leaving or ending a session must not cause already recorded attempts to be counted again or lost.

## 5. Practice configuration

- Allow one or more operations to be selected, including a mixed/all-operations shortcut.
- Provide four difficulty levels: Beginner, Easy, Intermediate, and Advanced.
- Support sessions of 5, 10, or 20 questions and continuous practice.
- Support regular practice and practice based on previous mistakes.
- Disable starting a session until a valid operation, difficulty, and session length are present.
- Disable mistake-review mode when no eligible active mistakes exist, and explain why.
- Use saved defaults while allowing changes for an individual session.

Proposed initial defaults: addition, Beginner difficulty, 10 questions, and regular practice. These defaults do not restrict the available choices.

## 6. Difficulty and arithmetic rules

| Level | Addition | Subtraction | Multiplication | Division |
| --- | --- | --- | --- | --- |
| 1: Beginner | Operands 0-10; result at most 20 | Operands 0-10; nonnegative result | Factors 0-5 | Divisors 1-5; whole-number answers |
| 2: Easy | Operands 0-50; result at most 100 | Operands 0-50; nonnegative result | Factors 0-10 | Divisors 1-10; whole-number answers |
| 3: Intermediate | Operands 0-100; carrying may occur | Operands 0-100; borrowing may occur; nonnegative result | One-digit by one-digit or one-digit by two-digit | Divisors 1-12; dividends at most 144; whole-number answers |
| 4: Advanced | Operands up to 1,000 | Operands up to 1,000; nonnegative in the initial release | Two-digit by one-digit or two-digit by two-digit | Larger dividends and one-digit or two-digit divisors; whole-number answers |

Negative subtraction answers and division with remainders are outside the initial implementation. Advanced negative subtraction is optional in the supplied reference.

The supplied reference does not define every division quotient boundary. Proposed bounded defaults are quotients 0-5 at Level 1, 0-10 at Level 2, the largest valid quotient consistent with the 144 dividend limit at Level 3, and quotients 0-99 with divisors 1-99 at Level 4. Keep these limits in named configuration values and test them.

Generate division questions by selecting a nonzero divisor and a whole-number quotient, then calculating the dividend. Never divide by zero. All generated questions, including review questions, must satisfy their selected difficulty rules.

## 7. Question generation and choices

Each question must contain:

- A unique ID, operation, both operands, and display text.
- A mathematically correct answer and difficulty level.
- Exactly four unique numeric choices: one correct answer and three incorrect answers.
- A source of regular practice or mistake review.
- The originating mistake-pattern ID when generated for review.

Incorrect choices must be plausible, match the expected numeric type, and differ from the correct answer. Do not include negative distractors when negative answers are disallowed. Shuffle choices so the correct answer has no fixed position.

For mixed practice, choose only from selected operations. Avoid immediately repeating the same question where alternatives exist. Generation and distractor creation must use bounded retries and a valid fallback to avoid infinite loops. Validate questions before display.

## 8. Question-card behavior

### 8.1 Front of the card

- Show the arithmetic question in large text and four answer buttons.
- Show the current question number and fixed session total, or a continuous-practice indicator.
- Allow the child to choose and change an answer before revealing it.
- Highlight the selected answer using text or shape as well as color.
- Keep the Flip Card button disabled until an answer is selected.
- Do not record an attempt when an answer is selected or the card is flipped.

### 8.2 Revealing the answer

- Flip or reveal the back after Flip Card is activated.
- Show the original question, correct answer, and selected answer.
- Show an age-appropriate explanation when explanations are enabled.
- Provide I Got It Right and I Got It Wrong buttons.
- Prevent changes to the selected answer after revealing the answer.
- Make revealed content accessible with animations disabled or reduced motion enabled.

### 8.3 Recording a result

The child's self-reported result determines whether an attempt is counted as correct or incorrect. Preserve the selected numeric answer separately. Selecting a numerically correct choice and then pressing I Got It Wrong records an incorrect self-reported result, as required by the reference specification.

When either result button is pressed:

1. Confirm that an answer was selected and revealed, and that this question has no recorded result.
2. Create one attempt with the selected answer, self-reported result, session ID, and timestamp.
3. Update session and overall statistics.
4. Create or update the appropriate mistake pattern, or update review mastery.
5. Save the updated information.
6. Show readable feedback, then advance or complete the session.

Prevent duplicate recording caused by repeated clicks, delayed transitions, refreshes, or restored sessions. Reset answer selection and card-reveal state for each new question.

## 9. Sessions and summaries

Track the session ID, start time, selected operations, difficulty, mode, length, attempts, and correct/incorrect totals. Track completion time when the session ends.

Fixed-length sessions finish after the configured number of recorded attempts. Continuous practice has an End Session button and produces a summary when ended. Avoid generating an extra question after completion.

The summary must display attempted, correct, incorrect, accuracy, operations practiced, difficulty, and the number of mistake-review questions completed. Review-question count is distinct from the number of newly saved mistakes.

Provide Practice Again, Practice Mistakes, Change Settings, View Statistics, and Return Home actions. Enable mistake practice when eligible mistakes exist, including mistakes just recorded in the completed session. Practice Again must create a new session ID.

Persist the completed session before displaying its summary, and keep the summary usable after refresh.

## 10. Mistake tracking, review, and mastery

For each mistake pattern, store an ID, operation, both operands, correct answer, difficulty, incorrect count, successful related-review count, most recent incorrect timestamp, and mastery status.

- Incorrect attempts create or update a pattern rather than creating duplicate records for the same pattern.
- Review questions remain linked to the original pattern.
- Generate related questions through nearby operands, reversed addition/multiplication operands, or valid inverse-operation/fact-family questions.
- Do not treat reversed subtraction or division as equivalent.
- Review questions must honor selected operations, selected difficulty, and arithmetic validity; use another valid strategy when an inverse operation is not allowed.
- Prioritize frequently missed, recently missed, and less successfully reviewed patterns.
- Reduce review priority as successful related answers accumulate.
- Initially mark a pattern mastered after three correct similar questions; make the threshold configurable.
- Exclude mastered patterns from normal review, allow them to be viewed, and reactivate a pattern if it is missed again.
- Handle review sessions that run out of eligible patterns with a clear completion or empty-state message.

Proposed initial behavior: an incorrect review answer increments the original pattern's incorrect count and resets its current mastery progress. Record this policy consistently in tests and the interface.

## 11. Statistics

Show:

- Overall attempted, correct, incorrect, and accuracy.
- Attempted, correct, incorrect, and accuracy for each operation.
- The same breakdown for each difficulty level.
- Recent sessions, newest first, with date, operations, difficulty, totals, and accuracy.
- Active and mastered mistake-pattern counts, similar questions practiced, and correct review answers.
- Frequently missed operations and number facts, including clear handling of ties.
- Mistake details: incorrect counts, mastery progress, and most recent incorrect date.

Calculate accuracy as `correct / attempted * 100`; display 0% or an explanatory empty state when no questions have been attempted. Maintain `attempted = correct + incorrect` for every applicable breakdown.

Provide Reset Statistics with explicit confirmation. Proposed reset policy: clear sessions, attempts, aggregate statistics, mistake patterns, and any active session while preserving user preferences. Explain this scope before confirmation so reset data cannot reappear from leftover records.

## 12. Settings and feedback

Provide functioning settings for sound effects, card animation, explanations, default operations, default difficulty, default session length, and the review mastery threshold. A feedback-message toggle is a proposed additional preference.

Proposed initial preferences: sound off, animations on subject to reduced-motion preferences, explanations on, encouraging feedback on, and mastery threshold three.

Changes must be saved and affect the relevant behavior. Sound must follow browser interaction rules; unavailable audio must not prevent practice. Explanations must be mathematically accurate and understandable. Feedback must remain visible long enough to read and must encourage rather than shame the child.

Provide Clear All Application Data with a clear confirmation. It must remove only this application's saved information, restore defaults, and return to a safe initial view.

## 13. Browser storage and recovery

Use localStorage for settings, sessions, attempts, mistake patterns, statistics or their source records, a data-schema version, and the active-session snapshot. Use application-specific keys such as `mathPractice.settings` and `mathPractice.sessions`.

- Load and validate saved data at startup; use defaults for missing data.
- Save recorded attempts promptly and recover without duplicate attempts.
- Preserve the current question, its choices, selected answer, revealed side, and session progress across refreshes.
- Clear active-session snapshots after completion or an explicitly ended session.
- Use schema versioning and a migration structure for future changes.
- If a category of data is invalid, recover that category without unnecessarily clearing unrelated categories.
- Handle unavailable or full storage with a friendly warning; allow the current session to continue in memory where possible.
- Preserve aggregate totals if older detailed history must be summarized.

Progress belongs to the current device, browser, and browser profile. Clearing site data can remove progress. Storage does not provide synchronization between devices or separate browser profiles.

## 14. Interface, responsiveness, and accessibility

- Use a bright, welcoming style with readable text and uncluttered layouts.
- Provide large touch targets and clear button labels.
- Center the question card and keep both sides readable and aligned.
- Support desktop, laptop, tablet, and mobile layouts, including tablet portrait and landscape.
- Stack choices and statistics when necessary to prevent clipping and unintended horizontal scrolling.
- Use semantic HTML, visible focus, meaningful labels, and sufficient contrast.
- Support completing practice with the keyboard, including Tab, Enter, and Space.
- Support number keys 1-4 for answer selection without interfering with editable fields.
- Announce question changes, revealed answers, and progress accessibly.
- Respect prefers-reduced-motion and the animation preference.
- Communicate selection and results with more than color.
- Keep controls and content usable at 200% zoom and larger text sizes.

## 15. Error handling, privacy, and performance

Handle invalid stored data, unsupported storage, question-generation failures, invalid routes, missing sessions, and corrupted statistics without a blank screen or an uncaught crash. Provide a clear recovery action and avoid exposing technical error details in the child-facing interface.

Collect no personal information. Keep practice history in the browser and avoid sending it to external services. Do not include child-tracking analytics or advertisements. Explain the local nature of saved progress and the effect of clearing browser data.

Load promptly, generate questions without noticeable delay, and keep card interactions smooth. Keep generation outside render logic, avoid unnecessary state updates, and support several thousand stored attempts. Measure storage growth and bundle size; summarize old detail and defer loading secondary pages when appropriate.

## 16. Data model outline

| Model | Main information |
| --- | --- |
| Question | ID, operation, operands, display text, correct answer, choices, difficulty, source, optional mistake-pattern ID |
| Practice attempt | ID, question ID, operands, operation, correct and selected answers, self-reported correctness, difficulty, source, timestamp, session ID |
| Practice session | ID, start/completion timestamps, operations, difficulty, mode, length, attempted/correct/incorrect totals |
| Mistake pattern | ID, operation, operands, correct answer, difficulty, incorrect and review-success counts, last incorrect time, mastered status |
| Statistics | Overall and per-operation/per-difficulty totals; review and history summaries |
| Settings | Practice defaults, audio/animation/explanation/feedback preferences, mastery threshold |
| Active-session snapshot | Session, attempts, current question, selected answer, revealed state, and enough state for safe recovery |

Use shared TypeScript definitions and unique identifiers. Derive display totals from a consistent source and validate saved records before use.

## 17. Proposed source organization

```text
src/
  app/          Application providers, routes, and composition
  components/   Layout, question cards, controls, dialogs, and statistics panels
  pages/        Home, setup, session, summary, statistics, and settings
  services/     Arithmetic, related questions, mistakes, statistics, storage, and feedback
  hooks/        Reusable session and application behavior
  types/        Shared TypeScript definitions
  utils/        Randomness, shuffling, IDs, and validation
```

Keep this organization practical for the implementation. It is a proposed structure rather than a requirement to create unused files.

## 18. Verification requirements

### Unit checks

Test all operations and difficulty boundaries; nonnegative subtraction; zero handling; whole-number division; division-by-zero prevention; four unique plausible choices; shuffling; bounded generation; review similarity; priority and mastery transitions; statistics and accuracy; and storage validation, serialization, and migration behavior.

### Component checks

Test setup validation, answer selection, disabled flip state, front/back content, result buttons, duplicate-record prevention, progress, completion, settings behavior, empty states, statistics presentation, and reset confirmations.

### Complete-flow checks

Test a fixed-length session, mixed operations, continuous practice, a newly saved mistake becoming reviewable, related review reaching mastery, persistent statistics, active-session recovery, summary recovery, and both reset actions.

Test no saved data, corrupt data, all-right/all-wrong sessions, rapid repeated activation, storage failure, narrow layouts, keyboard-only use, reduced motion, zoom, and screen-reader announcements. Use automated accessibility checks plus manual review.

Use the reference's browser checklist: Chrome, Edge, Firefox, Safari, tablet, and mobile. Record which environments were actually tested and any unavailable environments; do not mark unperformed checks complete.

## 19. Development and deployment

Follow the supplied TODO phases, implementing and reviewing one phase at a time. Update task checkboxes after verification. Keep meaningful Git commits, a development log, and the student's own AI conversation evidence.

The repository must include source, configuration, dependencies and lockfile, reference documents, and a README with installation, local run, tests, and production build instructions. Keep credentials out of version control.

Deploy a production build to Netlify or another publicly accessible suitable host. Configure the actual project base directory, build command, output directory, and single-page routing fallback correctly. Verify the deployed home page, every route, direct-route refresh, saved progress, and responsive behavior.

The public application must run without a local development server or instructor account. Deployment is complete only when the actual public URL has been tested.

## 20. Completion criteria

- [ ] All four operations work at all four difficulty levels.
- [ ] Setup supports multiple operations, fixed and continuous sessions, and mistake review.
- [ ] Every question has exactly four unique choices and one correct answer.
- [ ] Selection, reveal, and self-reporting follow the required sequence.
- [ ] Attempts are counted exactly once and summaries match recorded attempts.
- [ ] Mistakes are saved, related questions are generated, and mastery works.
- [ ] Overall, operation, difficulty, review, and recent-history statistics are correct.
- [ ] Settings affect behavior and both reset actions require confirmation.
- [ ] Saved progress and active sessions recover correctly after refresh.
- [ ] Storage and navigation problems have usable recovery paths.
- [ ] The interface is child-friendly, responsive, and keyboard accessible.
- [ ] Required checks have been performed and their results recorded.
- [ ] Source and meaningful history are available in the student's GitHub repository.
- [ ] README instructions work and the publicly deployed app has been tested.

The assignment also requires a 2-3 page development report and AI conversation evidence covering initial implementation, feature work, and debugging/testing. These are submission deliverables alongside the repository link and deployed URL.

## 21. Future enhancements

Potential later additions include multiple profiles, optional accounts, synchronization, parent/teacher dashboards, timed practice, streaks, rewards, fractions, decimals, remainders, printable worksheets, and offline installation. These are outside the initial release unless the assignment scope is explicitly expanded.
