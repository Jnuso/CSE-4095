import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../math-practice-app/package.json', import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(new URL('../math-practice-app/node_modules/.cache/playwright-browsers/', import.meta.url))
const { firefox, expect } = require('@playwright/test')
const output = new URL('../math-practice-app/output/playwright/phase-20-live/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await firefox.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  try {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('https://jnuso.github.io/CSE-4095/#/practice/setup')
    await expect(page.getByRole('heading', { name: 'Choose your practice', exact: true })).toBeVisible()
    await page.reload()
    await page.getByRole('radio', { name: '5 questions', exact: true }).check()
    await page.getByRole('button', { name: 'Start Session', exact: true }).click()
    for (let index = 0; index < 5; index++) {
      const choices = page.getByRole('group', { name: 'Answer choices', exact: true }).getByRole('button')
      await choices.first().click()
      await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
      await page.getByRole('button', { name: index % 2 === 0 ? 'I Got It Right' : 'I Got It Wrong', exact: true }).click()
    }
    await expect(page.getByRole('heading', { name: 'Your practice recap', exact: true })).toBeVisible()
    const metric = label => page.getByText(label, { exact: true }).locator('..').locator('dd')
    await expect(metric('Accuracy')).toHaveText('60%')
    await page.reload()
    await expect(metric('Questions attempted')).toHaveText('5')
    await expect(metric('Accuracy')).toHaveText('60%')
    await page.screenshot({ path: fileURLToPath(new URL('firefox-recap.png', output)) })
    await page.getByRole('link', { name: 'Statistics', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your statistics', exact: true })).toBeVisible()
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.deepEqual(errors, [])
    console.log('Firefox hosted smoke passed: Pages deep route/reload, full addition session, 60% recap persistence and Statistics; fresh disposable context.')
  } finally { await context.close() }
} finally { await browser.close() }
