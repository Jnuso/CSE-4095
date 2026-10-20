import AxeBuilder from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import { mistakeStatisticsFixture, wrongFact } from '../src/test/mistakeStatisticsFixture'
import { emptySavedData, trackMistakes } from '../src/services/storageService'
import { test, expect, start, report, saved, storageKey, noOverflow } from './helpers'

async function scan(page: Page, testInfo: TestInfo, state: string) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  await testInfo.attach(`axe-mistake-statistics-${state}`, {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  expect(result.violations).toEqual([])
  await noOverflow(page)
}
function total(page: Page, label: string) {
  return page
    .getByLabel('Mistake and review totals', { exact: true })
    .getByText(label, { exact: true })
    .locator('..')
    .locator('dd')
}
test('remembered statistics outlast session history, show mastered separately, and browsing is read-only', async ({
  page,
}, testInfo) => {
  await page.goto('/statistics')
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data: mistakeStatisticsFixture(),
  })
  await page.reload()
  const before = await page.evaluate((key) => localStorage.getItem(key), storageKey)
  await expect(total(page, 'Active mistake patterns')).toHaveText('1')
  await expect(total(page, 'Mastered mistake patterns')).toHaveText('1')
  await expect(total(page, 'Similar questions practiced')).toHaveText('4')
  await expect(total(page, 'Review questions marked right')).toHaveText('3')
  await expect(page.getByLabel('Overall results', { exact: true })).toContainText('0%')
  await expect(page.getByText('Subtraction — 3 misses.', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('article', { name: '4 + 3 = 7, level 1', exact: true }),
  ).toContainText('Times marked wrong2')
  await scan(page, testInfo, 'active')
  const masteredRadio = page.getByRole('radio', { name: 'Mastered mistakes (1)', exact: true })
  await masteredRadio.focus()
  await page.keyboard.press('Space')
  await expect(masteredRadio).toBeChecked()
  const mastered = page.getByRole('article', { name: '8 − 2 = 6, level 1', exact: true })
  await expect(mastered).toBeVisible()
  await expect(mastered.getByRole('progressbar')).toHaveAttribute('value', '3')
  await expect(mastered.getByRole('progressbar')).toHaveAccessibleName(
    /3 consecutive review answers/,
  )
  await expect(mastered.locator('time')).toHaveAttribute('datetime', '2026-10-19T00:00:00.000Z')
  await scan(page, testInfo, 'mastered')
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(before)
  await page.reload()
  await expect(total(page, 'Similar questions practiced')).toHaveText('4')
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Keep my history', exact: true }).click()
  await expect(total(page, 'Mastered mistake patterns')).toHaveText('1')
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Erase history', exact: true }).click()
  await expect(total(page, 'Similar questions practiced')).toHaveText('0')
  await expect(page.getByText(/No remembered mistakes yet/)).toBeVisible()
  await scan(page, testInfo, 'reset-empty')
})

test('ties, sorted details and pagination preserve matching counts on narrow screens', async ({
  page,
}, testInfo) => {
  await page.goto('/statistics')
  const events = Array.from({ length: 12 }, (_, i) =>
    wrongFact(`a-${i}`, 'addition', Math.floor(i / 10), i % 10, '2026-10-18T00:00:00Z'),
  )
  events.push(wrongFact('s1', 'subtraction', 10, 0, '2026-10-18T00:00:00Z'))
  for (let i = 0; i < 11; i++)
    events.push(
      wrongFact(
        `s-repeat-${i}`,
        'subtraction',
        10,
        0,
        `2026-10-18T01:00:${String(i).padStart(2, '0')}Z`,
      ),
    )
  const data = trackMistakes({ ...emptySavedData(), mistakeEvents: events })
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data,
  })
  await page.reload()
  await expect(
    page.getByText('Addition, Subtraction — 12 misses each (tied).', { exact: true }),
  ).toBeVisible()
  const list = page.locator('.mistake-history')
  await expect(list.getByRole('article')).toHaveCount(10)
  await expect(list.getByRole('article').first()).toHaveAccessibleName('10 − 0 = 10, level 1')
  await page.getByRole('button', { name: 'Show more mistakes', exact: true }).click()
  await expect(list.getByRole('article')).toHaveCount(13)
  await scan(page, testInfo, 'ties-expanded')
  await page.getByRole('radio', { name: 'Mastered mistakes (0)', exact: true }).check()
  await expect(page.getByText(/No mastered patterns yet/)).toBeVisible()
  await page.getByRole('radio', { name: 'Active mistakes (13)', exact: true }).check()
  await expect(list.getByRole('article')).toHaveCount(10)
  await page.setViewportSize({ width: 320, height: 844 })
  await noOverflow(page)
})

test('real practice and review immediately update dashboard mastery and review counts', async ({
  page,
}, testInfo) => {
  await start(page)
  for (const right of [false, true, true, true, true]) await report(page, right)
  await page.getByRole('link', { name: 'Statistics', exact: true }).click()
  await expect(total(page, 'Active mistake patterns')).toHaveText('1')
  await expect(total(page, 'Similar questions practiced')).toHaveText('0')
  await page.getByRole('link', { name: 'Start Practice', exact: true }).click()
  await page.getByRole('radio', { name: 'Mistake review', exact: true }).check()
  await page.getByRole('radio', { name: '5 questions', exact: true }).check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  for (let i = 0; i < 3; i++) await report(page, true)
  await page.getByRole('link', { name: 'View Statistics', exact: true }).click()
  await expect(total(page, 'Active mistake patterns')).toHaveText('0')
  await expect(total(page, 'Mastered mistake patterns')).toHaveText('1')
  await expect(total(page, 'Similar questions practiced')).toHaveText('3')
  await expect(total(page, 'Review questions marked right')).toHaveText('3')
  const before = await saved(page)
  await page.reload()
  expect((await saved(page)).mistakePatterns).toEqual(before.mistakePatterns)
  await page.getByRole('radio', { name: 'Mastered mistakes (1)', exact: true }).check()
  await scan(page, testInfo, 'real-mastery')
})
