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
  const dialog = page.waitForEvent('dialog')
  const click = page.getByRole('button', { name: 'End Session', exact: true }).click()
  const confirmation = await dialog
  expect(confirmation.type()).toBe('confirm')
  if (accept) await confirmation.accept()
  else await confirmation.dismiss()
  await click
  if (accept) await expect(page).toHaveURL('/practice/summary')
}
export async function saved(page: Page): Promise<SavedData> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey)
}
export async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}
