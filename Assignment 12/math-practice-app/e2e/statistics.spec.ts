import AxeBuilder from '@axe-core/playwright'
import { completedFixture } from '../src/test/summaryFixture'
import { emptySavedData } from '../src/services/storageService'
import { test, expect, start, report, saved, storageKey, noOverflow } from './helpers'

test('statistics: incomplete attempts, accessible reset and preferences', async ({
  page,
}, testInfo) => {
  await start(page)
  await page.getByRole('checkbox', { name: 'Animate card flips' }).uncheck()
  for (const right of [true, false, true]) await report(page, right)
  const before = await saved(page)
  await page.getByRole('link', { name: 'Statistics', exact: true }).click()
  await expect(page.getByLabel('Overall results', { exact: true })).toContainText('67%')
  await expect(page.locator('.session-history')).toContainText('Incomplete')
  await noOverflow(page)
  const scan = async (state: string) => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()
    await testInfo.attach(`axe-statistics-${state}`, {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    })
    expect(result.violations).toEqual([])
  }
  await scan('populated')
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Keep my history' })).toBeFocused()
  await scan('reset-dialog')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  expect((await saved(page)).records).toHaveLength(1)
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await dialog.getByRole('button', { name: 'Keep my history' }).click()
  expect((await saved(page)).records).toHaveLength(1)
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await dialog.getByRole('button', { name: 'Erase history' }).click()
  await expect(page.getByText(/No sessions yet/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset Statistics', exact: true })).toBeFocused()
  expect((await saved(page)).settings).toEqual(before.settings)
  expect((await saved(page)).records).toEqual([])
  await page.reload()
  await expect(page.getByText(/No sessions yet/)).toBeVisible()
  await start(page)
  await report(page, true)
  await page.getByRole('link', { name: 'Statistics', exact: true }).click()
  await expect(page.getByLabel('Overall results', { exact: true })).toContainText('100%')
  expect((await saved(page)).records).toHaveLength(1)
})

test('statistics: newest-first history, pagination and failed-reset preservation', async ({
  page,
}) => {
  await page.goto('/')
  const data = emptySavedData()
  data.records = Array.from({ length: 12 }, (_, index) => {
    const record = completedFixture()
    record.session.id = `history-${index}`
    record.session.startedAt = new Date(Date.UTC(2026, 9, index + 1, 12)).toISOString()
    record.session.completedAt = new Date(Date.UTC(2026, 9, index + 1, 13)).toISOString()
    record.attempts.forEach((attempt) => {
      attempt.sessionId = record.session.id
    })
    return record
  })
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data,
  })
  await page.goto('/statistics')
  const sessions = page.locator('.session-history > li')
  await expect(sessions).toHaveCount(10)
  await expect(sessions.first().locator('time')).toHaveAttribute(
    'datetime',
    data.records[11].session.completedAt!,
  )
  await page.getByRole('button', { name: 'Show more sessions' }).click()
  await expect(sessions).toHaveCount(12)
  await expect(page.getByRole('button', { name: 'Show more sessions' })).toHaveCount(0)
  await expect(page.getByLabel('Overall results', { exact: true })).toContainText('67%')
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError')
    }
  })
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Erase history' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'storage is full' })).toBeVisible()
  await expect(sessions).toHaveCount(12)
  expect((await saved(page)).records).toHaveLength(12)
})

test('statistics: cross-tab reset blocks stale saves and permits fresh practice', async ({
  page,
  context,
}) => {
  await start(page)
  await report(page, false)
  const statistics = await context.newPage()
  await statistics.goto('/statistics')
  await expect(statistics.getByLabel('Overall results', { exact: true })).toContainText('0%')
  await statistics.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await statistics.getByRole('button', { name: 'Erase history', exact: true }).click()
  await expect(statistics.getByText(/No sessions yet/)).toBeVisible()
  await page.bringToFront()
  await report(page, true)
  expect((await saved(page)).records).toEqual([])
  await start(page)
  await report(page, true)
  await page.getByRole('link', { name: 'Statistics', exact: true }).click()
  await expect(page.getByLabel('Overall results', { exact: true })).toContainText('100%')
  expect((await saved(page)).records).toHaveLength(1)
  await expect(statistics.getByLabel('Overall results', { exact: true })).toContainText('100%')
  await statistics.close()
})
