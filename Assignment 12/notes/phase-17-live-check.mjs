import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../math-practice-app/package.json', import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/', import.meta.url))
const { chromium, expect } = require('@playwright/test')
const output = new URL('../math-practice-app/output/playwright/phase-17-live/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chromium' })
try {
  for (const [name, viewport] of [['mobile', { width: 320, height: 844 }], ['tablet', { width: 1024, height: 768 }]]) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: name === 'mobile' })
    try {
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      await page.goto('https://jnuso.github.io/CSE-4095/#/practice/setup')
      await page.getByRole('radio', { name: '5 questions', exact: true }).check()
      await page.getByRole('button', { name: 'Start Session', exact: true }).click()
      for (let i = 0; i < 5; i++) {
        await page.getByRole('group', { name: 'Answer choices', exact: true }).getByRole('button').first().click()
        await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
        await page.getByRole('button', { name: 'I Got It Wrong', exact: true }).click()
      }
      await expect(page.getByRole('heading', { name: 'Your practice recap', exact: true })).toBeVisible()
      await expect(page.getByRole('status', { name: 'Practice encouragement' })).not.toBeEmpty()
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.getByRole('link', { name: 'Statistics', exact: true }).click()
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: fileURLToPath(new URL(`${name}-statistics.png`, output)), fullPage: true })
      await page.getByRole('link', { name: 'Settings', exact: true }).click()
      await page.getByRole('checkbox', { name: /^Encouraging feedback/ }).uncheck()
      await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
      await page.reload()
      await expect(page.getByRole('checkbox', { name: /^Encouraging feedback/ })).not.toBeChecked()
      assert.deepEqual(errors, [])
      console.log(`${name}: hosted practice, final encouragement, statistics fit, saved feedback toggle passed`)
    } finally { await context.close() }
  }
} finally { await browser.close() }
