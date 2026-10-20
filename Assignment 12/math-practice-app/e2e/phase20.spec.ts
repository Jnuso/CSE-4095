import AxeBuilder from '@axe-core/playwright'
import { test, expect, report, saved, metric } from './helpers'

test('phase20: a reproducible mixed-operation session saves coherent arithmetic and totals', async ({
  page,
}) => {
  // Seed only this disposable browser context; do not depend on a lucky random sample.
  await page.addInitScript(() => {
    let state = 2026
    Math.random = () => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0
      return state / 2 ** 32
    }
  })
  await page.goto('/practice/setup')
  await page.getByRole('button', { name: 'Select all operations', exact: true }).click()
  await page.getByRole('radio', { name: '5 questions', exact: true }).check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  for (const right of [true, false, true, false, true]) await report(page, right)
  await expect(
    page.getByRole('heading', { name: 'Your practice recap', exact: true }),
  ).toBeVisible()
  await expect(metric(page, 'Accuracy')).toHaveText('60%')
  await expect.poll(async () => (await saved(page)).records[0].attempts.length).toBe(5)
  const record = (await saved(page)).records[0]
  expect(record.session.operations).toEqual([
    'addition',
    'subtraction',
    'multiplication',
    'division',
  ])
  expect(new Set(record.attempts.map((a) => a.operation)).size).toBeGreaterThanOrEqual(2)
  for (const attempt of record.attempts) {
    const a = attempt.firstOperand,
      b = attempt.secondOperand
    const expected =
      attempt.operation === 'addition'
        ? a + b
        : attempt.operation === 'subtraction'
          ? a - b
          : attempt.operation === 'multiplication'
            ? a * b
            : a / b
    expect(attempt.correctAnswer).toBe(expected)
    expect(Number.isSafeInteger(expected)).toBe(true)
    expect(expected).toBeGreaterThanOrEqual(0)
    expect(record.session.operations).toContain(attempt.operation)
    expect(attempt.difficulty).toBe(1)
  }
  await page.reload()
  await expect(metric(page, 'Questions attempted')).toHaveText('5')
  await expect(metric(page, 'Marked right')).toHaveText('3')
  await expect(metric(page, 'Marked wrong')).toHaveText('2')
})

test('phase20: complete setup and a five-question session using keyboard input only', async ({
  page,
}, info) => {
  await page.goto('/practice/setup')
  // Find a target by tabbing from the current real focus; never call locator.focus or click.
  async function tabTo(target: ReturnType<typeof page.getByRole>) {
    for (let index = 0; index < 60; index++) {
      if (await target.evaluate((el) => el === document.activeElement)) return
      await page.keyboard.press('Tab')
    }
    throw new Error('Keyboard could not reach the expected control')
  }
  const five = page.getByRole('radio', { name: '5 questions', exact: true })
  // Native radio groups have one Tab stop; select the first length using Home.
  await tabTo(page.getByRole('radio', { name: '10 questions', exact: true }))
  await page.keyboard.press('ArrowLeft')
  await expect(five).toBeChecked()
  await tabTo(page.getByRole('button', { name: 'Start Session', exact: true }))
  await page.keyboard.press('Enter')
  for (let index = 0; index < 5; index++) {
    const choices = page
      .getByRole('group', { name: 'Answer choices', exact: true })
      .getByRole('button')
    await tabTo(choices.first())
    await page.keyboard.press('1')
    await expect(choices.first()).toHaveAttribute('aria-pressed', 'true')
    await tabTo(page.getByRole('button', { name: 'Flip Card', exact: true }))
    await page.keyboard.press('Space')
    await expect(page.getByRole('heading', { name: /^Correct answer:/ })).toBeFocused()
    const result = page.getByRole('button', {
      name: index % 2 === 0 ? 'I Got It Right' : 'I Got It Wrong',
      exact: true,
    })
    await tabTo(result)
    await page.keyboard.press('Enter')
    if (index < 4) {
      await expect(page.getByRole('heading', { name: /= \?/ })).toBeFocused()
      await expect(page.getByRole('progressbar')).toHaveAttribute('value', String(index + 1))
    }
  }
  await expect(
    page.getByRole('heading', { name: 'Your practice recap', exact: true }),
  ).toBeFocused()
  await expect(metric(page, 'Questions attempted')).toHaveText('5')
  await expect(metric(page, 'Accuracy')).toHaveText('60%')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  await info.attach('phase20-keyboard-recap-axe', {
    body: JSON.stringify(results),
    contentType: 'application/json',
  })
  expect(results.violations).toEqual([])
})
