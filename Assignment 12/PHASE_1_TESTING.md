# Phase 1 testing guide

Phase 1 establishes the project and tools. It does not yet implement question generation, card flipping, sessions, statistics, or saved progress. The welcome screen's greeting checks that React is responding to input.

## 1. Start the application

Open PowerShell and run:

```powershell
Set-Location -LiteralPath 'C:\Users\Jnuso\OneDrive\Documents\UCONN FALL 2026\CSE4095\Assignment 12\math-practice-app'
node --version
npm.cmd --version
npm.cmd run dev
```

Dependencies are installed for the current workspace. On a fresh copy, first run `npm.cmd ci` in the same folder. Node 24 is recommended; the declared minimum is 22.12.

Expected: a ready message with a local URL, normally <http://127.0.0.1:5173/>. Keep this terminal running. If it says the port is already in use, check whether you already started this app in another terminal; use that server or stop your own old server. Use the exact printed URL.

## 2. Test the screen

These boxes are for the student's own verification; leave them unchecked until personally tested.

- [ ] The browser tab is titled **Math Practice**.
- [ ] The page shows **Big ideas start with small steps.** and **Hello, mathematician.**
- [ ] The initial message below the button reads **Ready when you are.**
- [ ] Clicking **Say hello** changes the message to **Hi, mathematician! Let's learn together.**
- [ ] Refreshing returns to **Ready when you are.** This greeting is temporary React state; browser persistence is a later phase.
- [ ] After refresh, press Tab to focus **Say hello**. Its focus outline is visible. Press Enter or Space; the greeting updates.
- [ ] Narrow the browser window to a phone-sized width. The content stacks and stays readable without horizontal scrolling.
- [ ] There are no Vite/React demo logos, demo counters, or default template links.

The four arithmetic symbols are decorative in Phase 1. There are no practice controls to test yet.

## 3. Run automated checks

Open a second terminal in the same app folder while the first terminal runs the server:

```powershell
npm.cmd run check
```

Expected: formatting passes, ESLint reports no errors, **2 tests pass**, TypeScript checking passes, and the production build succeeds with a `dist` folder. If one step fails, the check command stops; preserve its error message and report the command and what happened.

Individual checks, if needed:

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
```

`format:check` reports differences without changing files. `npm.cmd run format` intentionally formats project files.

## 4. Check the production build

After the build succeeds, run:

```powershell
npm.cmd run preview
```

Open the printed URL, normally <http://127.0.0.1:4173/>, and repeat the greeting interaction. This checks the built application rather than the development version. Stop preview with Ctrl+C when finished.

## 5. Save evidence and report a problem

For your report, save a screenshot of the welcome screen and the successful check output. Record the date, browser, and checks you performed. A useful bug report includes the exact URL, action taken, expected result, actual result, and any error text.

The agent's automated and browser results are recorded separately in DEVELOPMENT_LOG.md. They do not substitute for the student's manual checks above.
