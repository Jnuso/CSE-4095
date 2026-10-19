import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// A project-local browser cache works in both Codex's sandbox and a normal terminal.
const browserCache = fileURLToPath(
  new URL('../node_modules/.cache/playwright-browsers', import.meta.url),
)
const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserCache },
})
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
