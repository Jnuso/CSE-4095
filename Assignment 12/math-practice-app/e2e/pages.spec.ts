import AxeBuilder from '@axe-core/playwright'
import { test, expect, report, metric } from './helpers'

for (const [route, heading] of [
  ['/', 'Big ideas start with small steps.'],
  ['/practice/setup', 'Choose your practice'],
  ['/practice/session', 'Choose your practice'],
  ['/practice/summary', 'Your practice recap'],
  ['/statistics', 'Your statistics'],
  ['/settings', 'Make it your own'],
  ['/unknown-page', "Let's find your way back."],
]) {
  test(`Pages direct hash route ${route} survives refresh`, async ({ page }) => {
    await page.goto(`./#${route}`)
    await expect(page.getByRole('heading', { name: heading, level: 1, exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: heading, level: 1, exact: true })).toBeVisible()
  })
}

test('Pages hosting has no history fallback', async ({ request }) => {
  expect((await request.get('./practice/setup')).status()).toBe(404)
  expect((await request.get('/src/main.tsx')).status()).toBe(404)
})

test('Pages skip link preserves route and focuses main content', async ({ page }) => {
  await page.goto('./#/practice/setup')
  await page.getByRole('link', { name: 'Skip to content', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page).toHaveURL(/\/CSE-4095\/#\/practice\/setup$/)
  await expect(
    page.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeVisible()
})

test('Pages session, summary persistence, navigation, and accessibility', async ({
  page,
}, testInfo) => {
  await page.goto('./#/practice/setup')
  await page.getByRole('radio', { name: '5 questions', exact: true }).check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await expect(page).toHaveURL(/#\/practice\/session$/)
  for (const right of [true, false, true, false, true]) await report(page, right)
  await expect(page).toHaveURL(/#\/practice\/summary$/)
  await expect(metric(page, 'Accuracy')).toHaveText('60%')
  await page.reload()
  await expect(metric(page, 'Questions attempted')).toHaveText('5')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  await testInfo.attach('axe-pages-summary', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  expect(results.violations).toEqual([])
  await page.getByRole('link', { name: 'View Statistics', exact: true }).click()
  await expect(page).toHaveURL(/#\/statistics$/)
  await expect(page.getByRole('heading', { name: 'Your statistics', exact: true })).toBeFocused()
  await page.goBack()
  await expect(metric(page, 'Accuracy')).toHaveText('60%')
})
