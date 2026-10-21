# Math Practice application

React, TypeScript and Vite application for Assignment 12. See the [project README](../README.md) for features, submission requirements and repository layout.

## Run locally

Use Node.js 24 LTS and npm. From this folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the address printed by Vite (normally http://127.0.0.1:5173/). Stop with Ctrl+C. Other shells can use `npm` instead of `npm.cmd`.

## Production build

```powershell
npm.cmd run build
npm.cmd run preview
```

The build writes `dist/`. Preview normally serves http://127.0.0.1:4173/. The GitHub Pages variant uses `npm.cmd run build:pages` and writes `dist-pages/`; see [deployment instructions](../docs/DEPLOYMENT.md).

## Checks

Install Chromium and Firefox once with `npm.cmd run test:install`. Run `npm.cmd run check:all` for formatting, lint, unit/component tests, TypeScript, production builds, Chromium desktop/mobile, accessibility, Pages and Firefox coverage. `npm.cmd run check` is the smaller non-browser gate.

[Testing guide](../docs/TESTING.md) · [Latest release evidence](../docs/RELEASE_SIGNOFF.md) · [Remaining manual review](../docs/FINAL_TODO.md)

## Source layout

- `src/`: application routes, pages, components, services, types and unit/component tests.
- `e2e/`: browser regression and accessibility tests.
- `scripts/`: browser test tooling.
- `public/`: static application assets.
- Root configuration files: Vite, TypeScript, ESLint, Prettier and Playwright settings.

Generated builds, browser profiles and test artifacts are not submission source. Dependencies are reproducible from the committed package lockfile.
