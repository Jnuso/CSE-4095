# Phase 17: Responsive design and supportive feedback

Live URL after successful deployment: https://jnuso.github.io/CSE-4095/

1. On a phone, open Practice and start five questions. At narrow widths, answers stack vertically. Check that choices and Flip Card are easy to tap, navigation remains readable, and the page has no sideways scroll.
2. On a tablet, try portrait and landscape. The practice card stays centered with two answer columns. On a short landscape screen the card avoids unnecessary empty height.
3. Report an answer right, then wrong. Each report shows a brief positive or supportive message on the next card. The final answer's message appears on the recap. Messages vary without animation or extra sound; scoring still uses your own report.
4. Open Settings, turn off Encouraging feedback and save. Refresh, start again and report an answer. Encouragement should stay off. Sound and card animation have separate controls.
5. Open Statistics after practicing. Read operation/difficulty cards, mistake facts and recent sessions on a small screen. Labels and values should wrap and remain inside their cards.

Automated regression covers 320x568, 390x844, 768x1024, 1024x768 and 844x390 viewports in desktop and touch/mobile browser contexts, touch target size, answer stacking, populated statistics overflow and saved feedback preference. These checks simulate screen sizes; they do not replace physical device review. Phase 16 actual zoom/system-text/screen-reader checks remain pending.

Run npm.cmd run check:all from math-practice-app. Full evidence: notes/phase-17-check-all.txt. One read-only independent static review found no concrete defects.
