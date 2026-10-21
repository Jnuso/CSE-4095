import { test as base, expect, type Page } from '@playwright/test'
import type { SavedData } from '../src/services/storageService'

export const test = base.extend({
  page: async ({ page }, providePage) => {
    const problems: string[] = []
    page.on('pageerror', (error) => problems.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text())
    })
    await providePage(page)
    expect(problems, 'No browser runtime errors or console errors/warnings').toEqual([])
  },
})
export { expect }
export const storageKey = 'mathPractice.data'

/** Intentional navigation now ends an active session through the same confirmation as a user. */
export async function navigateTo(page: Page, name: string) {
  const active = await page.getByRole('button', { name: 'End Session', exact: true }).isVisible()
  await page.getByRole('link', { name, exact: true }).click({ noWaitAfter: active })
  if (active) {
    const dialog = page.getByRole('dialog', { name: 'Leave this session?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'End session and leave' }).click()
  }
}

export async function refresh(page: Page) {
  if (await page.getByRole('button', { name: 'End Session', exact: true }).isVisible())
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('beforeunload')
      await dialog.accept()
    })
  await page.reload()
}

export async function start(page: Page, length: 5 | 10 | 20 | 'continuous' = 5) {
  await page.goto('/practice/setup')
  await page
    .getByRole('radio', {
      name: length === 'continuous' ? 'Continuous practice' : `${length} questions`,
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Flip Card', exact: true })).toBeDisabled()
}
export const answerButtons = (page: Page) =>
  page.getByRole('group', { name: 'Answer choices', exact: true }).getByRole('button')
export const metric = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator('..').locator('dd')

export async function report(page: Page, right: boolean) {
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await page
    .getByRole('button', { name: right ? 'I Got It Right' : 'I Got It Wrong', exact: true })
    .click()
}
export async function finish(page: Page, accept = true) {
  await page.getByRole('button', { name: 'End Session', exact: true }).click()
  const confirmation = page.getByRole('dialog', { name: 'End this session?', exact: true })
  await expect(confirmation).toBeVisible()
  await expect(
    confirmation.getByRole('button', { name: 'Keep practicing', exact: true }),
  ).toBeFocused()
  await confirmation
    .getByRole('button', {
      name: accept ? 'End session and view recap' : 'Keep practicing',
      exact: true,
    })
    .click()
  if (accept) await expect(page).toHaveURL('/practice/summary')
}
export async function saved(page: Page): Promise<SavedData> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey)
}
export async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
}
