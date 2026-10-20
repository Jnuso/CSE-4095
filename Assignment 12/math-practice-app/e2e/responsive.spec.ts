import { test, expect, start, report, noOverflow, finish } from './helpers'

for (const size of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 844, height: 390 },
]) {
  test(`responsive practice and populated history ${size.width}x${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size)
    await start(page)
    await noOverflow(page)
    const choices = page.locator('.answer-choice')
    for (const choice of await choices.all()) {
      const box = await choice.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.width).toBeGreaterThanOrEqual(44)
    }
    const first = await choices.nth(0).boundingBox()
    const second = await choices.nth(1).boundingBox()
    if (size.width <= 420) expect(second!.y).toBeGreaterThan(first!.y)
    else expect(second!.y).toBe(first!.y)
    await report(page, false)
    await expect(page.getByRole('status', { name: 'Practice encouragement' })).not.toBeEmpty()
    await noOverflow(page)
    await finish(page)
    await page.getByRole('link', { name: 'Statistics', exact: true }).click()
    await expect(page.locator('.session-history > li')).toHaveCount(1)
    await noOverflow(page)
    for (const card of await page.locator('.statistics-grid .feature-card').all()) {
      const box = await card.boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width)
    }
  })
}

test('feedback preference survives reload and disables encouragement', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('checkbox', { name: /^Encouraging feedback/ }).uncheck()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: /^Encouraging feedback/ })).not.toBeChecked()
  await start(page)
  await report(page, true)
  await expect(page.getByRole('status', { name: 'Practice encouragement' })).toBeEmpty()
})

test('final reported answer keeps encouragement on the recap', async ({ page }) => {
  await start(page)
  for (let index = 0; index < 5; index++) await report(page, false)
  await expect(
    page.getByRole('heading', { name: 'Your practice recap', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('status', { name: 'Practice encouragement' })).not.toBeEmpty()
})
