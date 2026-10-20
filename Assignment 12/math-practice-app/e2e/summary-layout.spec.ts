import { test, expect, start, report, finish, metric, answerButtons, noOverflow } from './helpers'

test('summary actions preserve setup and reset replay without replaying the completed card', async ({
  page,
}) => {
  await start(page)
  for (const right of [true, true, true, false, false]) await report(page, right)
  await expect(metric(page, 'Accuracy')).toHaveText('60%')
  await expect(metric(page, 'Operations practiced')).toHaveText('Addition')
  await expect(metric(page, 'Difficulty')).toHaveText('Beginner')
  await expect(metric(page, 'Mistake-review questions completed')).toHaveText('0')
  await expect(
    page.getByRole('heading', { name: 'Your practice recap', exact: true }),
  ).toBeFocused()
  await expect(page.getByRole('link', { name: 'Practice Mistakes', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Practice Again', exact: true }).click()
  await expect(page.getByText('Question 1 of 5', { exact: true })).toBeVisible()
  await expect(page.getByRole('status', { name: 'Session totals' })).toContainText('Completed: 0')
  await page.goBack()
  await expect(metric(page, 'Accuracy')).toHaveText('60%')
  for (const [action, heading] of [
    ['View Statistics', 'Your statistics'],
    ['Return Home', 'Big ideas start with small steps.'],
  ]) {
    await page.getByRole('link', { name: action, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeFocused()
    await page.goBack()
    await expect(metric(page, 'Accuracy')).toHaveText('60%')
  }
  await page.getByRole('link', { name: 'Change Settings', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeFocused()
  await expect(page.getByRole('radio', { name: '5 questions', exact: true })).toBeChecked()
})

test('empty ending has zero totals and no invented practiced operations', async ({ page }) => {
  await start(page, 'continuous')
  await finish(page)
  await expect(metric(page, 'Questions attempted')).toHaveText('0')
  await expect(metric(page, 'Accuracy')).toHaveText('0%')
  await expect(metric(page, 'Operations practiced')).toHaveText('None yet')
})

test('front, back, summary, and touch targets fit 390- and 320-pixel screens', async ({ page }) => {
  await start(page)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await noOverflow(page)
    const bounds = await answerButtons(page).first().boundingBox()
    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
  }
  await answerButtons(page).first().click()
  const before = await page.locator('.card-face').evaluate((el) => el.clientHeight)
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  expect(await page.locator('.card-face').evaluate((el) => el.clientHeight)).toBe(before)
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await noOverflow(page)
  }
  await finish(page)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await noOverflow(page)
  }
})
