import AxeBuilder from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import { test, expect, start, answerButtons, report, finish, storageKey } from './helpers'

async function scan(page: Page, testInfo: TestInfo, state: string) {
  // Analyze the settled card, rather than sampling colors during its brief opacity animation.
  await page.locator('.card-face').evaluateAll(async (faces) => {
    await Promise.all(
      faces
        .flatMap((face) => face.getAnimations())
        .map((animation) => animation.finished.catch(() => {})),
    )
  })
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  await testInfo.attach(`axe-${state}`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  expect(results.violations, `Accessibility violations in ${state}`).toEqual([])
}

test('accessibility: scanner detects an intentionally unlabeled control', async ({
  page,
}, testInfo) => {
  // Only this isolated browser page contains the defect; application markup is unchanged.
  await page.setContent(
    '<html lang="en"><title>Scanner check</title><main><button></button></main></html>',
  )
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  await testInfo.attach('axe-scanner-confidence-check', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  expect(results.violations.map((violation) => violation.id)).toContain('button-name')
})

for (const [route, heading] of [
  ['/', 'Big ideas start with small steps.'],
  ['/practice/setup', 'Choose your practice'],
  ['/practice/summary', 'Your practice recap'],
  ['/statistics', 'Your statistics'],
  ['/settings', 'Make it your own'],
  ['/unknown-page', "Let's find your way back."],
]) {
  test(`accessibility: route ${route}`, async ({ page }, testInfo) => {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    await scan(page, testInfo, 'route')
  })
}

test('accessibility: setup validation and selected configuration', async ({ page }, testInfo) => {
  await page.goto('/practice/setup')
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Choose at least one operation')
  await scan(page, testInfo, 'no-operations')
  await page.getByRole('button', { name: 'Select all operations', exact: true }).click()
  await page.getByRole('radio', { name: /^Advanced/ }).check()
  await page.getByRole('radio', { name: 'Continuous practice', exact: true }).check()
  await scan(page, testInfo, 'selected-configuration')
})

test('accessibility: card front, selection, reveal, and next question', async ({
  page,
}, testInfo) => {
  await start(page)
  await scan(page, testInfo, 'card-front')
  await answerButtons(page).first().click()
  await scan(page, testInfo, 'selected-answer')
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await expect(page.getByRole('heading', { name: /^Correct answer:/ })).toBeVisible()
  await scan(page, testInfo, 'card-back')
  await page.getByRole('button', { name: 'I Got It Wrong', exact: true }).click()
  await expect(page.getByText('Question 2 of 5', { exact: true })).toBeVisible()
  await scan(page, testInfo, 'next-question')
})

test('accessibility: continuous practice with reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await start(page, 'continuous')
  await report(page, true)
  await scan(page, testInfo, 'continuous-reduced-motion')
})

test('accessibility: completed summary', async ({ page }, testInfo) => {
  await start(page)
  for (const right of [true, false, true, false, true]) await report(page, right)
  await expect(page).toHaveURL('/practice/summary')
  await expect(
    page.getByRole('heading', { name: 'Your practice recap', exact: true }),
  ).toBeVisible()
  await scan(page, testInfo, 'completed-summary')
})

test('accessibility: zero-attempt summary', async ({ page }, testInfo) => {
  await start(page, 'continuous')
  await finish(page)
  await scan(page, testInfo, 'zero-attempt-summary')
})

test('accessibility: saved-data warning', async ({ page }, testInfo) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), storageKey)
  await page.goto('/practice/setup')
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toBeVisible()
  await scan(page, testInfo, 'saved-data-warning')
})
