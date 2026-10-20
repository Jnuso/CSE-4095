import AxeBuilder from '@axe-core/playwright'
import { completedFixture } from '../src/test/summaryFixture'
import { emptySavedData } from '../src/services/storageService'
import { test, expect, storageKey, metric, noOverflow } from './helpers'

test('damaged answers recover independently, warn accessibly and save without losing preferences', async ({
  page,
}) => {
  const record = completedFixture()
  record.attempts[0].selectedAnswer = -1
  const data = { ...emptySavedData(), records: [record] }
  data.settings.showExplanations = false
  await page.goto('/')
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data,
  })
  await page.goto('/statistics')
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText(
    'damaged answers',
  )
  await expect(metric(page, 'Questions attempted').first()).toHaveText('2')
  await noOverflow(page)
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: /^Show explanations/ })).not.toBeChecked()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toHaveCount(0)
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey)
  expect(saved.records[0].attempts).toHaveLength(2)
  expect(saved.settings.showExplanations).toBe(false)
})

test('missing-session explanation keeps setup usable and provides safe Home navigation', async ({
  page,
}) => {
  await page.goto('/practice/session')
  await expect(
    page.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('There is no practice session to open')
  await noOverflow(page)
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.getByRole('link', { name: 'Back home', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Big ideas start with small steps.', exact: true }),
  ).toBeVisible()
  await page.goto('/practice/summary')
  await expect(page.getByRole('alert')).toContainText('There are no session results to show yet')
  await expect(page.getByRole('link', { name: 'Go to practice setup', exact: true })).toBeVisible()
})
