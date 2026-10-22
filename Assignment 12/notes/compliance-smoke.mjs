import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../math-practice-app/package.json', import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/', import.meta.url))
const { chromium, expect } = require('@playwright/test')
const base = process.argv[2] ?? 'https://jnuso.github.io/CSE-4095/#'
const output = new URL('../math-practice-app/output/playwright/compliance-focused-results/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await context.newPage(), errors = [], results = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
const count = p => p.getByLabel('Overall results', { exact: true }).getByText('Questions attempted', { exact: true }).locator('..').locator('dd')
try {
  await page.goto(base + '/statistics')
  await page.evaluate(() => {
    const settings = { feedbackEnabled: true, soundEffectsEnabled: false, cardAnimationEnabled: true, showExplanations: true, defaultSessionLength: 5, defaultDifficulty: 1, defaultOperations: ['addition'], masteryThreshold: 3 }
    const records = Array.from({ length: 101 }, (_, i) => {
      const id = 'compliance-smoke-' + i, start = Date.UTC(2026, 9, 1) + i * 60000
      return { session: { id, startedAt: new Date(start).toISOString(), completedAt: new Date(start + 10000).toISOString(), operations: ['addition'], difficulty: 1, sessionLength: 5, reviewMode: 'regular', attempted: 5, correct: 5, incorrect: 0 }, attempts: Array.from({ length: 5 }, (_, j) => ({ id: id + '-a' + j, questionId: id + '-q' + j, operation: 'addition', firstOperand: 1, secondOperand: 1, correctAnswer: 2, selectedAnswer: 2, selfReportedCorrect: true, difficulty: 1, source: 'regular', attemptedAt: new Date(start + j * 1000).toISOString(), sessionId: id })) }
    })
    localStorage.setItem('mathPractice.data', JSON.stringify({ version: 1, settings, records }))
  })
  await page.reload()
  await expect(count(page)).toHaveText('505')
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.data')))
  assert.equal(persisted.version, 3)
  assert.equal(persisted.records.length, 100)
  assert.equal(persisted.sessionTotals.length, 101)
  await page.goto(base + '/statistics')
  await page.reload()
  await expect(count(page)).toHaveText('505')
  results.push('505 lifetime attempts; 100 details; 101 summaries; version-3 save and reload')
  const menu = page.getByRole('navigation', { name: 'Statistics sections' })
  for (let round = 0; round < 5; round++) for (const name of ['By operation', 'By difficulty', 'Mistakes and review', 'Recent sessions', 'Reset history', 'Overview']) {
    const button = menu.getByRole('button', { name, exact: true })
    await button.click()
    await expect(button).toHaveAttribute('aria-current', 'location')
  }
  const recent = menu.getByRole('button', { name: 'Recent sessions', exact: true })
  await recent.click()
  await page.evaluate(() => { const before = scrollY; document.body.style.paddingTop = '12px'; scrollTo(0, before + 12) })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(recent).toHaveAttribute('aria-current', 'location')
  results.push('30 mobile menu jumps and layout-induced scroll preserve active marker')
  const other = await context.newPage()
  await other.goto(base + '/statistics')
  await page.bringToFront()
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Erase history', exact: true }).click()
  await other.bringToFront()
  await expect(count(other)).toHaveText('0')
  await other.getByRole('link', { name: 'Settings', exact: true }).click()
  await other.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await page.bringToFront()
  await page.reload()
  await expect(count(page)).toHaveText('0')
  results.push('cross-tab reset and stale-tab settings save do not resurrect totals')
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto(base + '/practice/setup')
  await expect(page.locator('.length-grid .choice-card')).toHaveCount(4)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: fileURLToPath(new URL('labels-320.png', output)), fullPage: true })
  assert.deepEqual(errors, [])
  results.push('320px setup screenshot; no horizontal overflow or captured runtime/console errors')
  console.log(JSON.stringify({ base, results }, null, 2))
} finally {
  await writeFile(new URL('smoke.json', output), JSON.stringify({ base, results, errors }, null, 2))
  await context.close()
  await browser.close()
}
