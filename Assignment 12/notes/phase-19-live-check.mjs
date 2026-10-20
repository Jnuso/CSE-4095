import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../math-practice-app/package.json', import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/', import.meta.url))
const { chromium, expect } = require('@playwright/test')
const output = new URL('../math-practice-app/output/playwright/phase-19-live/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chromium' })
const address = 'https://jnuso.github.io/CSE-4095/'
try {
  for (const [name, viewport] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 1000 }]]) {
    const context = await browser.newContext({ viewport, isMobile: name === 'mobile', hasTouch: name === 'mobile' })
    try {
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${address}#/practice/session`)
      await expect(page.getByRole('alert')).toContainText('There is no practice session to open')
      await expect(page.getByRole('heading', { name: 'Choose your practice', exact: true })).toBeVisible()
      await page.getByRole('link', { name: 'Back home', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Big ideas start with small steps.', exact: true })).toBeVisible()
      const startedAt = new Date(Date.now() - 60000).toISOString()
      const completedAt = new Date().toISOString()
      const base = { id: 'answer-valid', questionId: 'question-valid', sessionId: 'phase19-smoke', operation: 'addition', difficulty: 1, firstOperand: 1, secondOperand: 1, correctAnswer: 2, selectedAnswer: 2, selfReportedCorrect: false, source: 'regular', attemptedAt: completedAt }
      const data = {
        version: 1,
        settings: { soundEffectsEnabled: false, cardAnimationEnabled: true, showExplanations: false, defaultOperations: ['addition'], defaultDifficulty: 1, defaultSessionLength: 5, masteryThreshold: 3 },
        records: [{ session: { id: 'phase19-smoke', operations: ['addition'], difficulty: 1, sessionLength: 5, startedAt, completedAt, attempted: 2, correct: 1, incorrect: 1 }, attempts: [{ ...base, id: 'bad', questionId: 'bad-question', selectedAnswer: -1, selfReportedCorrect: true }, base] }],
      }
      // All data belongs to this fresh disposable context, never the student's browser profile.
      await page.evaluate(data => localStorage.setItem('mathPractice.data', JSON.stringify(data)), data)
      await page.goto(`${address}#/statistics`)
      await page.reload()
      await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText('damaged answers')
      await expect(page.getByText('Questions attempted', { exact: true }).first().locator('..').locator('dd')).toHaveText('1')
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: fileURLToPath(new URL(`${name}-recovery.png`, output)) })
      await page.getByRole('link', { name: 'Settings', exact: true }).click()
      await expect(page.getByRole('checkbox', { name: /^Show explanations/ })).not.toBeChecked()
      await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
      await page.reload()
      await expect(page.getByRole('status', { name: 'Saved data notice' })).toHaveCount(0)
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.data')))
      assert.equal(saved.records[0].attempts.length, 1)
      assert.equal(saved.settings.showExplanations, false)
      assert.deepEqual(errors, [])
      console.log(`${name}: hosted missing-session explanation, Home, valid-answer recovery, preserved preferences and save/reload passed`)
    } finally { await context.close() }
  }
} finally { await browser.close() }
