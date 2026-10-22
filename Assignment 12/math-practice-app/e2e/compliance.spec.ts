import { test, expect, noOverflow, saved, storageKey } from './helpers'
import { completedFixture } from '../src/test/summaryFixture'
import { defaultSettings } from '../src/services/storageService'

test('lifetime totals survive detail retention, migration, reload, stale tabs and reset', async ({
  page,
  context,
}) => {
  const records = Array.from({ length: 101 }, (_, index) => {
    const record = completedFixture()
    const id = `archive-${index}`
    const startedAt = new Date(Date.UTC(2026, 0, 1) + index * 60000).toISOString()
    record.attempts = Array.from({ length: 5 }, (_, n) => ({
      ...record.attempts[n % 3],
      id: `${id}-a-${n}`,
      questionId: `${id}-q-${n}`,
      sessionId: id,
      attemptedAt: startedAt,
      selfReportedCorrect: n < 3,
    }))
    Object.assign(record.session, {
      id,
      startedAt,
      completedAt: startedAt,
      attempted: 5,
      correct: 3,
      incorrect: 2,
    })
    return record
  })
  await page.goto('/statistics')
  await page.evaluate(
    ({ records, settings, key }) =>
      localStorage.setItem(key, JSON.stringify({ version: 1, settings, records })),
    { records, settings: defaultSettings(), key: storageKey },
  )
  await page.reload()
  const overall = page.getByLabel('Overall results', { exact: true })
  await expect(
    overall.getByText('Questions attempted', { exact: true }).locator('..').locator('dd'),
  ).toHaveText('505')
  await expect(
    overall.getByText('Marked right', { exact: true }).locator('..').locator('dd'),
  ).toHaveText('303')
  const other = await context.newPage()
  await other.goto('/statistics')
  await page.bringToFront()
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await expect.poll(async () => (await saved(page)).records.length).toBe(100)
  expect((await saved(page)).sessionTotals).toHaveLength(101)
  await page.getByRole('link', { name: 'Statistics', exact: true }).click()
  await page.reload()
  await expect(
    overall.getByText('Questions attempted', { exact: true }).locator('..').locator('dd'),
  ).toHaveText('505')
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Erase history', exact: true }).click()
  await other.bringToFront()
  await expect(
    other
      .getByLabel('Overall results', { exact: true })
      .getByText('Questions attempted', { exact: true })
      .locator('..')
      .locator('dd'),
  ).toHaveText('0')
  await other.getByRole('link', { name: 'Settings', exact: true }).click()
  await other.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await page.bringToFront()
  await page.reload()
  await expect(
    overall.getByText('Questions attempted', { exact: true }).locator('..').locator('dd'),
  ).toHaveText('0')
})

test('clicked section remains current after a layout-induced scroll adjustment', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/statistics')
  const menu = page.getByRole('navigation', { name: 'Statistics sections' })
  const recent = menu.getByRole('button', { name: 'Recent sessions', exact: true })
  await recent.click()
  await expect(recent).toHaveAttribute('aria-current', 'location')
  await page.evaluate(() => {
    const before = window.scrollY
    document.body.style.paddingTop = '12px'
    window.scrollTo(0, before + 12)
  })
  // Wait for actual browser frames so the scroll listener has a chance to overwrite the marker.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
  await expect(recent).toHaveAttribute('aria-current', 'location')
  await expect(page.getByRole('heading', { name: 'Recent sessions', exact: true })).toBeInViewport()
  // Firefox can clamp one wheel event to part of the document, regardless of delta.
  // Home expresses the intended native scroll-to-start action in both browsers.
  await page.keyboard.press('Home')
  await expect(menu.getByRole('button', { name: 'Overview', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  )
})

test('small-screen session lengths have full-width labels without splitting words', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/practice/setup')
  const choices = page.locator('.length-grid .choice-card')
  await expect(choices).toHaveCount(4)
  const boxes = await choices.evaluateAll((elements) =>
    elements.map((e) => ({
      x: e.getBoundingClientRect().x,
      width: e.getBoundingClientRect().width,
      height: e.getBoundingClientRect().height,
    })),
  )
  expect(new Set(boxes.map((b) => b.x)).size).toBe(1)
  expect(boxes.every((b) => b.width > 200 && b.height <= 70)).toBe(true)
  await noOverflow(page)
})
