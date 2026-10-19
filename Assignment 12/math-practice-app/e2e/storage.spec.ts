import { completedFixture } from '../src/test/summaryFixture'
import { defaultSettings } from '../src/services/storageService'
import { test, expect, start, report, saved, metric, storageKey } from './helpers'
import type { Page } from '@playwright/test'

async function seed(page: Page, raw: string) {
  await page.goto('/')
  await page.evaluate(
    ({ key, raw }) => {
      localStorage.setItem(key, raw)
      localStorage.setItem('e2e.unrelated', 'keep')
    },
    { key: storageKey, raw },
  )
}
const knownData = () => ({ version: 1, settings: defaultSettings(), records: [completedFixture()] })

test('every report persists full attempt data and a fresh recap works after reload', async ({
  page,
}) => {
  await start(page)
  for (const right of [true, false]) await report(page, right)
  const data = await saved(page)
  expect(data.version).toBe(1)
  expect(data.records).toHaveLength(1)
  expect(data.records[0].session.completedAt).toBeUndefined()
  expect(data.records[0].attempts).toHaveLength(2)
  for (const [index, attempt] of data.records[0].attempts.entries()) {
    expect(attempt.sessionId).toBe(data.records[0].session.id)
    expect(attempt.operation).toBe('addition')
    expect(attempt.difficulty).toBe(1)
    expect(Number.isInteger(attempt.selectedAnswer)).toBe(true)
    expect(attempt.selfReportedCorrect).toBe(index === 0)
    expect(Number.isNaN(Date.parse(attempt.attemptedAt))).toBe(false)
  }
  await page.reload()
  await expect(page.getByText('Question 1 of 5', { exact: true })).toBeVisible()
  expect(
    (await saved(page)).records.find((record) => record.session.id === data.records[0].session.id)
      ?.attempts,
  ).toHaveLength(2)
  await page.goto('/practice/summary')
  await expect(page.getByRole('link', { name: 'Go to practice setup', exact: true })).toBeVisible()
})

test('saved setup and animation reload, and newest completed recap loads without history state', async ({
  page,
}) => {
  const data = knownData()
  data.settings.defaultOperations = ['division']
  data.settings.defaultDifficulty = 4
  data.settings.cardAnimationEnabled = false
  await seed(page, JSON.stringify(data))
  await page.goto('/practice/setup')
  await expect(page.getByRole('checkbox', { name: 'Division', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await expect(
    page.getByRole('checkbox', { name: 'Animate card flips', exact: true }),
  ).not.toBeChecked()
  await page.goto('/practice/summary')
  await expect(metric(page, 'Accuracy')).toHaveText('67%')
  await page.reload()
  await expect(metric(page, 'Accuracy')).toHaveText('67%')
  expect(await page.evaluate(() => localStorage.getItem('e2e.unrelated'))).toBe('keep')
})

for (const [name, raw] of [
  ['corrupt JSON', '{broken'],
  ['future schema', JSON.stringify({ version: 99, settings: {}, records: [] })],
]) {
  test(`${name} is protected while practice continues`, async ({ page }) => {
    await seed(page, raw)
    await page.goto('/practice/setup')
    await expect(page.getByRole('status', { name: 'Saved data notice' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /^Beginner/ })).toBeChecked()
    await page.getByRole('button', { name: 'Start Session', exact: true }).click()
    await report(page, false)
    await expect(page.getByText('Question 2 of 10', { exact: true })).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(raw)
    expect(await page.evaluate(() => localStorage.getItem('e2e.unrelated'))).toBe('keep')
  })
}

test('invalid settings recover without discarding valid history', async ({ page }) => {
  await seed(page, JSON.stringify({ ...knownData(), settings: {} }))
  await page.goto('/practice/setup')
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText(
    'settings were invalid',
  )
  await expect(page.getByRole('radio', { name: /^Beginner/ })).toBeChecked()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  expect((await saved(page)).records.some((record) => record.session.id === 'session-1')).toBe(true)
})

for (const version of [undefined, 0]) {
  test(`legacy schema ${String(version)} migrates on the next successful save`, async ({
    page,
  }) => {
    await seed(
      page,
      JSON.stringify({ version, settings: defaultSettings(), sessions: [completedFixture()] }),
    )
    await page.goto('/practice/setup')
    await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText(
      'Older saved data',
    )
    await page.getByRole('button', { name: 'Start Session', exact: true }).click()
    expect((await saved(page)).version).toBe(1)
    expect((await saved(page)).records.some((record) => record.session.id === 'session-1')).toBe(
      true,
    )
  })
}

test('quota failure warns, keeps the previous save, and lets the session advance', async ({
  page,
}) => {
  const raw = JSON.stringify(knownData())
  await seed(page, raw)
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Simulated full storage', 'QuotaExceededError')
      original.call(this, name, value)
    }
  }, storageKey)
  await page.goto('/practice/setup')
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await report(page, false)
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText(
    'storage is full',
  )
  await expect(page.getByRole('status', { name: 'Session totals' })).toContainText('Wrong: 1')
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(raw)
})

test('blocked storage shows a warning and keeps practice usable', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Simulated blocked storage', 'SecurityError')
      },
    }),
  )
  await start(page)
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText('unavailable')
  await report(page, true)
  await expect(page.getByRole('status', { name: 'Session totals' })).toContainText('Right: 1')
})
