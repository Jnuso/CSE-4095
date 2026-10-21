import AxeBuilder from '@axe-core/playwright'
import { test, expect, start, report, finish, metric, saved } from './helpers'

test('mastery setting saves explicitly and survives reload', async ({ page }) => {
  await page.goto('/settings')
  const threshold = page.getByRole('spinbutton', { name: 'Mastery threshold', exact: true })
  await expect(threshold).toHaveValue('3')
  expect((await threshold.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  expect(scan.violations).toEqual([])
  for (const value of ['', '0', '101', '1.5']) {
    await threshold.fill(value)
    await expect(page.getByRole('button', { name: 'Save Settings' })).toBeDisabled()
  }
  await threshold.fill('2')
  await page.getByRole('button', { name: 'Save Settings' }).click()
  await page.reload()
  await expect(threshold).toHaveValue('2')
  expect((await saved(page)).settings.masteryThreshold).toBe(2)
})

test('end dialog traps focus, cancels with Escape and excludes unreported revealed answer', async ({
  page,
}) => {
  await start(page)
  await report(page, true)
  await page.getByRole('group', { name: 'Answer choices' }).getByRole('button').first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await page.getByRole('button', { name: 'End Session', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'End this session?', exact: true })
  const keep = dialog.getByRole('button', { name: 'Keep practicing', exact: true })
  const end = dialog.getByRole('button', { name: 'End session and view recap', exact: true })
  await expect(keep).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(end).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(keep).toBeFocused()
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  expect(scan.violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'End Session', exact: true })).toBeFocused()
  await expect(page.getByRole('heading', { name: /^Correct answer:/ })).toBeVisible()
  await finish(page)
  await expect(metric(page, 'Questions attempted')).toHaveText('1')
  await expect(metric(page, 'Practice mode')).toHaveText('Regular practice')
  await expect(metric(page, 'Session length')).toHaveText('5 questions')
})
