import AxeBuilder from '@axe-core/playwright'
import { completedFixture } from '../src/test/summaryFixture'
import { emptySavedData } from '../src/services/storageService'
import { test, expect, start, report, saved, storageKey } from './helpers'

test('misses persist immediately without double counting snapshots, refresh, or preferences', async ({
  page,
}) => {
  await start(page)
  for (const right of [false, true, false]) await report(page, right)
  const data = await saved(page)
  expect(data.mistakeEvents).toHaveLength(2)
  expect(data.mistakePatterns!.reduce((sum, pattern) => sum + pattern.incorrectCount, 0)).toBe(2)
  for (const attempt of data.records[0].attempts.filter(
    (attempt) => !attempt.selfReportedCorrect,
  )) {
    expect(data.mistakePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: attempt.operation,
          firstOperand: attempt.firstOperand,
          secondOperand: attempt.secondOperand,
          correctAnswer: attempt.correctAnswer,
          difficulty: attempt.difficulty,
          similarCorrectCount: 0,
          mastered: false,
        }),
      ]),
    )
  }
  const snapshot = data.mistakePatterns
  await page.reload()
  expect((await saved(page)).mistakePatterns).toEqual(snapshot)
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('checkbox', { name: /^Show explanations/ }).uncheck()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  expect((await saved(page)).mistakePatterns).toEqual(snapshot)
  await page.getByRole('link', { name: 'Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Erase history', exact: true }).click()
  expect((await saved(page)).mistakePatterns ?? []).toEqual([])
  expect((await saved(page)).mistakeEvents ?? []).toEqual([])
  expect((await saved(page)).settings.showExplanations).toBe(false)
  await page.reload()
  expect((await saved(page)).mistakePatterns ?? []).toEqual([])
})

test('two tabs preserve unique misses and a reset stops stale mistake restoration', async ({
  page,
  context,
}) => {
  await start(page)
  await report(page, false)
  const other = await context.newPage()
  await start(other)
  await report(other, false)
  expect((await saved(other)).mistakeEvents).toHaveLength(2)
  await page.bringToFront()
  await report(page, true)
  expect((await saved(page)).mistakeEvents).toHaveLength(2)
  await other.bringToFront()
  await other.getByRole('link', { name: 'Statistics', exact: true }).click()
  await other.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await other.getByRole('button', { name: 'Erase history', exact: true }).click()
  await page.bringToFront()
  await report(page, false)
  expect((await saved(page)).mistakeEvents ?? []).toEqual([])
  expect((await saved(page)).mistakePatterns ?? []).toEqual([])
  await start(page)
  await report(page, false)
  expect((await saved(page)).mistakeEvents).toHaveLength(1)
  await other.close()
})

test('invalid mistake data warns accessibly while valid history is recovered and saved', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.evaluate(
    ({ key, record, defaults }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          ...defaults,
          records: [record],
          mistakeEvents: [{ broken: true }],
          mistakePatterns: [{ incorrectCount: -1 }],
        }),
      ),
    { key: storageKey, record: completedFixture(), defaults: emptySavedData() },
  )
  await page.goto('/statistics')
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText(
    'mistake data could not be read',
  )
  await expect(page.getByLabel('Overall results', { exact: true })).toContainText('67%')
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  await testInfo.attach('axe-mistake-recovery', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  expect(result.violations).toEqual([])
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  expect((await saved(page)).mistakeEvents).toHaveLength(1)
  expect((await saved(page)).mistakePatterns![0].incorrectCount).toBe(1)
  await page.reload()
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear All Application Data', exact: true }).click()
  await page.getByRole('button', { name: 'Erase all app data', exact: true }).click()
  expect((await saved(page)).mistakeEvents ?? []).toEqual([])
  expect((await saved(page)).mistakePatterns ?? []).toEqual([])
})
