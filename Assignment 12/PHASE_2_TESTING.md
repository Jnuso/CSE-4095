# Phase 2 testing guide

This phase verifies the basic interface and navigation, not arithmetic practice. Start Practice opens the future practice-configuration page. Statistics and settings are honest placeholder pages until their implementation phases. The Phase 1 greeting button has been replaced by the required home actions.

## 1. Start or reuse local development

Open PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\Jnuso\OneDrive\Documents\UCONN FALL 2026\CSE4095\Assignment 12\math-practice-app'
npm.cmd run dev
```

Open the printed URL, normally <http://127.0.0.1:5173/>. If this project is already running, reuse its terminal and refresh the browser; strict port checking will reject a second server on the same port. Do not terminate unrelated applications. Existing production-preview tabs at port 4173 need a refresh after rebuilding to show the latest application.

## 2. Verify home-page actions

Leave these boxes unchecked until you personally verify them.

- [ ] Home shows Math Practice, the welcome message, and Start Practice, View Statistics, and Settings actions.
- [ ] Start Practice opens `/practice/setup` with the heading **Choose your practice**.
- [ ] Home in the header returns to `/`.
- [ ] View Statistics opens `/statistics` with **Your statistics**.
- [ ] Settings opens `/settings` with **Make it your own**.
- [ ] The brand title returns to home from another page.
- [ ] The shared header stays visible and the current navigation item is highlighted.
- [ ] Browser Back and Forward return to the expected pages.

## 3. Check direct addresses and refresh

Open each address directly on your local server and refresh it:

| Path | Expected heading |
| --- | --- |
| `/` | Big ideas start with small steps. |
| `/practice/setup` | Choose your practice |
| `/practice/session` | Your practice space |
| `/practice/summary` | Your practice recap |
| `/statistics` | Your statistics |
| `/settings` | Make it your own |
| `/not-a-real-page` | Let's find your way back. |

- [ ] Every direct address and refresh renders the expected page, with the shared header.
- [ ] The browser tab title identifies the current page.
- [ ] Unknown addresses show a helpful fallback; Back home returns to `/`.
- [ ] Opening a session or summary directly offers Go to practice setup; it shows no invented questions or results.

## 4. Check keyboard and screen sizes

- [ ] On a freshly loaded home page, Tab reveals Skip to content, then reaches the brand, navigation, and home actions.
- [ ] The focused link has a visible outline. Enter opens its destination.
- [ ] After navigation, focus moves to the new page heading, making the destination easier to identify.
- [ ] Skip to content moves past the header to the main content.
- [ ] At a phone-sized width, navigation remains visible and the home page stacks without horizontal scrolling or clipped controls.
- [ ] Desktop and tablet-sized layouts remain readable.

These are links for navigation. Enter activates them; Space is not expected to behave like Enter on a link.

## 5. Run automated checks

In another terminal, repeat the Set-Location command above and run:

```powershell
npm.cmd run check
```

Expected: formatting and ESLint pass, **12 component tests pass**, TypeScript checking passes, and Vite builds the production output successfully.

## 6. Verify the production preview

After the check command finishes, run:

```powershell
npm.cmd run preview
```

Open the printed URL, normally <http://127.0.0.1:4173/>, and repeat the home links, direct statistics URL and refresh, and unknown-page recovery. If your own preview is already running, refresh it after the new build instead of starting another copy. A preview verifies the local build; this phase does not deploy the site publicly.

## 7. Save evidence

Save screenshots of home and a destination page plus the successful test output. Record your browser, date, and any issue with its expected/actual behavior. The automated results are recorded in DEVELOPMENT_LOG.md, separately from your checks above. Stop servers you started with Ctrl+C when finished.
