# Phase 16 accessibility review

Open https://jnuso.github.io/CSE-4095/ (Phase 16 deployment confirmed). Use a separate browser profile if you want disposable practice history.

1. Press Tab and Shift+Tab through navigation, Practice setup and Settings. Every focused control should have a dark visible outline. Use arrow keys to change native radio options; Enter or Space activates buttons.
2. Start five questions. Tab into the card, then press 1, 2, 3 and 4: each selects/focuses the corresponding answer, in displayed order. A checkmark identifies selection. Number keys outside the card must not select an answer. Flip with Space, confirm the answer, and report right/wrong with Enter. Focus should move to the next question.
3. Open Settings > Clear All Application Data. Tab and Shift+Tab must cycle between the two dialog buttons. Escape cancels and returns focus. Do not confirm erasure unless you intend to erase your data.
4. Turn animation off and try another card. Also try the operating system reduced-motion setting with app animation on: content must still change without card animation.
5. **Pending manual verification:** set actual browser zoom to 200% and visit Home, Practice, Statistics and Settings, including a card and confirmation dialog. Check readable text, usable controls, no clipped content or horizontal page scrolling. Restore zoom afterward.
6. **Pending manual verification:** increase browser/system text size and repeat these pages. Automated 32px base-font simulation passed; this does not replace the actual setting.
7. **Pending assistive-technology review:** with Narrator or NVDA, listen to the initial question, next question, correct-answer heading, selected answers and session totals. Confirm announcements are understandable and not disruptive. DOM/focus tests and axe cannot establish actual speech quality.

Report any problem with the page, action, browser and setting used. Actual zoom and system-font TODO items remain unchecked until verified.
