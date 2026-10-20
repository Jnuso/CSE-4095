import { test, expect, start, answerButtons, report, finish, metric, saved } from './helpers'

test('selection, flip, keyboard controls, focus, and independent self-report', async ({ page }) => {
  await start(page)
  await expect(answerButtons(page)).toHaveCount(4)
  // Exercise real keyboard navigation so Firefox activates its focus-visible modality too.
  for (let index = 0; index < 30; index++) {
    if (
      await answerButtons(page)
        .first()
        .evaluate((el) => el === document.activeElement)
    )
      break
    await page.keyboard.press('Tab')
  }
  await expect(answerButtons(page).first()).toBeFocused()
  await page.keyboard.press('Space')
  await expect(answerButtons(page).first()).toHaveAttribute('aria-pressed', 'true')
  expect(
    await answerButtons(page)
      .first()
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe('none')
  await answerButtons(page).nth(1).click()
  await expect(answerButtons(page).first()).toHaveAttribute('aria-pressed', 'false')
  const selected = await answerButtons(page).nth(1).getAttribute('aria-label')
  await page.getByRole('button', { name: 'Flip Card', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /^Correct answer:/ })).toBeFocused()
  await expect(page.locator('.student-answer')).toContainText(selected!.replace('Answer ', ''))
  await expect(page.getByRole('group', { name: 'Answer choices' })).toHaveCount(0)
  await expect(page.getByRole('status', { name: 'Session totals' })).toContainText('Completed: 0')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'I Got It Right', exact: true })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByText('Question 2 of 5', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /= \?/ })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Flip Card', exact: true })).toBeDisabled()
  await expect(page.getByRole('status', { name: 'Session totals' })).toContainText('Right: 1')
  expect((await saved(page)).records[0].attempts).toHaveLength(1)
})

for (const length of [5, 10, 20] as const) {
  test(`fixed ${length}-question session stops exactly at the limit`, async ({ page }) => {
    await start(page, length)
    let previous = ''
    for (let index = 0; index < length; index += 1) {
      await expect(
        page.getByText(`Question ${index + 1} of ${length}`, { exact: true }),
      ).toBeVisible()
      const math = await page.locator('.card-front h2').innerText()
      expect(math).not.toBe(previous)
      previous = math
      await expect(page.getByRole('progressbar')).toHaveAttribute('value', String(index))
      await expect(page.getByRole('button', { name: 'Flip Card', exact: true })).toBeDisabled()
      await report(page, index % 2 === 0)
    }
    await expect(page).toHaveURL('/practice/summary')
    await expect(metric(page, 'Questions attempted')).toHaveText(String(length))
    await expect(metric(page, 'Marked right')).toHaveText(String(Math.ceil(length / 2)))
    await expect(metric(page, 'Marked wrong')).toHaveText(String(Math.floor(length / 2)))
    await expect(metric(page, 'Accuracy')).toHaveText(
      `${Math.round((Math.ceil(length / 2) / length) * 100)}%`,
    )
    await expect(page.getByRole('button', { name: 'Flip Card', exact: true })).toHaveCount(0)
    const data = await saved(page)
    expect(data.records).toHaveLength(1)
    expect(data.records[0].attempts).toHaveLength(length)
    expect(new Set(data.records[0].attempts.map((attempt) => attempt.questionId)).size).toBe(length)
    expect(data.records[0].session.completedAt).toBeTruthy()
  })
}

test('continuous practice passes 20 attempts and handles cancel/accept ending', async ({
  page,
}) => {
  await start(page, 'continuous')
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  for (let index = 0; index < 21; index += 1) await report(page, index % 2 === 0)
  await expect(page.getByText('Question 22', { exact: true })).toBeVisible()
  await finish(page, false)
  await expect(page.getByText('Question 22', { exact: true })).toBeVisible()
  await finish(page)
  await expect(metric(page, 'Questions attempted')).toHaveText('21')
  await expect(metric(page, 'Marked right')).toHaveText('11')
  await expect(metric(page, 'Marked wrong')).toHaveText('10')
})

test('animation switch and reduced-motion preference', async ({ page }) => {
  await start(page)
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await expect(page.locator('.card-back')).toHaveCSS('animation-name', 'reveal-card')
  await page.getByRole('button', { name: 'I Got It Right', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Animate card flips', exact: true }).uncheck()
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await expect(page.locator('.card-back')).toHaveCSS('animation-name', 'none')
  await page.getByRole('button', { name: 'I Got It Wrong', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Animate card flips', exact: true }).check()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.card-front')).toHaveCSS('animation-name', 'none')
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await expect(page.locator('.card-back')).toHaveCSS('animation-name', 'none')
})
