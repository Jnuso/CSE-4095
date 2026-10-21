import { navigateTo, refresh } from './helpers'
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { completedFixture } from '../src/test/summaryFixture'
import { emptySavedData, trackMistakes } from '../src/services/storageService'
import {
  test,
  expect,
  report,
  saved,
  storageKey,
  metric,
  answerButtons,
  noOverflow,
} from './helpers'

function seedData(two = false) {
  const record = completedFixture()
  Object.assign(record.session, {
    operations: ['addition'],
    difficulty: 1,
    attempted: 1,
    correct: 0,
    incorrect: 1,
  })
  record.attempts = [
    {
      ...record.attempts[1],
      operation: 'addition',
      firstOperand: 4,
      secondOperand: 3,
      correctAnswer: 7,
      selectedAnswer: 7,
      difficulty: 1,
      source: 'regular',
    },
  ]
  const records = [record]
  if (two) {
    const other = structuredClone(record)
    other.session.id = 'other-session'
    Object.assign(other.attempts[0], {
      id: 'other-attempt',
      questionId: 'other-question',
      sessionId: 'other-session',
      firstOperand: 6,
      secondOperand: 2,
      correctAnswer: 8,
      selectedAnswer: 8,
    })
    records.push(other)
  }
  return trackMistakes({ ...emptySavedData(), records })
}
async function seed(page: Page, two = false) {
  await page.goto('/practice/setup')
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data: seedData(two),
  })
  await refresh(page)
}
async function reviewStart(page: Page) {
  await page.getByRole('radio', { name: 'Mistake review', exact: true }).check()
  await page.getByRole('radio', { name: '5 questions', exact: true }).check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your mistake review', exact: true }),
  ).toBeVisible()
}
async function scan(page: Page) {
  // Match the established accessibility suite: inspect settled card colors after the brief flip.
  await page.locator('.card-face').evaluateAll(async (faces) => {
    await Promise.all(
      faces
        .flatMap((face) => face.getAnimations())
        .map((animation) => animation.finished.catch(() => {})),
    )
  })
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze()
    ).violations,
  ).toEqual([])
  await noOverflow(page)
}

test('review eligibility, durable success, early mastery, and reload without double counting', async ({
  page,
}) => {
  await page.goto('/practice/setup')
  await expect(page.getByRole('radio', { name: 'Mistake review', exact: true })).toBeDisabled()
  await expect(page.getByText(/Mark a practice answer wrong to remember/)).toBeVisible()
  await scan(page)
  await seed(page)
  await page.getByRole('radio', { name: 'Mistake review', exact: true }).check()
  await page.getByRole('radio', { name: /^Easy/ }).check()
  await expect(page.getByRole('button', { name: 'Start Session', exact: true })).toBeDisabled()
  await expect(page.getByText(/No active mistakes match/)).toBeVisible()
  await page.getByRole('radio', { name: /^Beginner/ }).check()
  await scan(page)
  await reviewStart(page)
  await scan(page)
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await scan(page)
  await page.getByRole('button', { name: 'I Got It Right', exact: true }).click()
  await report(page, true)
  expect((await saved(page)).mistakePatterns![0]).toMatchObject({
    similarCorrectCount: 2,
    mastered: false,
  })
  await refresh(page)
  await expect(
    page.getByRole('heading', { name: 'Your mistake review', exact: true }),
  ).toBeVisible()
  await report(page, true)
  await expect(metric(page, 'Mistake-review questions completed')).toHaveText('3')
  await expect(page.getByRole('button', { name: 'Practice Mistakes', exact: true })).toBeDisabled()
  const data = await saved(page)
  expect(data.reviewEvents).toHaveLength(3)
  expect(data.mistakePatterns![0]).toMatchObject({
    similarCorrectCount: 3,
    mastered: true,
    incorrectCount: 1,
  })
  await scan(page)
  await refresh(page)
  expect((await saved(page)).mistakePatterns).toEqual(data.mistakePatterns)
  await navigateTo(page, 'Practice')
  await expect(page.getByRole('radio', { name: 'Mistake review', exact: true })).toBeDisabled()
})

test('mixed review targets original patterns, wrong resets success, summary counts and actions stay usable', async ({
  page,
}) => {
  await seed(page, true)
  await reviewStart(page)
  for (const right of [true, true, false, true, true]) await report(page, right)
  await expect(metric(page, 'Mistake-review questions completed')).toHaveText('5')
  await expect(metric(page, 'Accuracy')).toHaveText('80%')
  const data = await saved(page)
  const attempts = data.records.find((r) => r.session.reviewMode === 'mistake-review')!.attempts
  expect(new Set(attempts.map((a) => a.mistakePatternId)).size).toBe(2)
  expect(attempts.every((a) => a.source === 'mistake-review' && a.difficulty === 1)).toBe(true)
  expect(data.mistakePatterns).toHaveLength(2)
  expect(data.mistakePatterns!.reduce((n, p) => n + p.incorrectCount, 0)).toBe(3)
  expect(data.reviewEvents).toHaveLength(5)
  await page.getByRole('link', { name: 'Practice Mistakes', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Mistake review', exact: true })).toBeChecked()
  await scan(page)
})

test('review progress merges across tabs and stale review cannot restore an erased pattern', async ({
  page,
  context,
}) => {
  await seed(page)
  await reviewStart(page)
  await report(page, true)
  const other = await context.newPage()
  await other.goto('/practice/setup')
  await reviewStart(other)
  await report(other, true)
  expect((await saved(other)).mistakePatterns![0].similarCorrectCount).toBe(2)
  await page.bringToFront()
  await report(page, true)
  await expect(
    page.getByRole('heading', { name: 'Your practice recap', exact: true }),
  ).toBeVisible()
  expect((await saved(page)).mistakePatterns![0]).toMatchObject({
    similarCorrectCount: 3,
    mastered: true,
  })
  await navigateTo(page, 'Statistics')
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Erase history', exact: true }).click()
  await other.bringToFront()
  await expect(
    other.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeVisible()
  const reset = await saved(other)
  expect(reset.reviewEvents ?? []).toEqual([])
  expect(reset.mistakePatterns ?? []).toEqual([])
  expect(reset.mistakeEvents ?? []).toEqual([])
  await other.close()
})

test('quota failure preserves pending success and a later save retries without counting twice', async ({
  page,
}) => {
  await seed(page)
  await reviewStart(page)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    ;(window as unknown as { restoreStorage: () => void }).restoreStorage = () => {
      Storage.prototype.setItem = original
    }
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError')
    }
  })
  await report(page, true)
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText('full')
  expect((await saved(page)).reviewEvents ?? []).toHaveLength(0)
  await page.evaluate(() => (window as unknown as { restoreStorage: () => void }).restoreStorage())
  await page.getByRole('checkbox', { name: 'Animate card flips', exact: true }).uncheck()
  expect((await saved(page)).reviewEvents).toHaveLength(1)
  expect((await saved(page)).mistakePatterns![0].similarCorrectCount).toBe(1)
  await report(page, true)
  expect((await saved(page)).mistakePatterns![0].similarCorrectCount).toBe(2)
})
