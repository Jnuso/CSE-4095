import { navigateTo, refresh } from './helpers'
import { test, expect } from './helpers'

for (const [route, heading] of [
  ['/', 'Big ideas start with small steps.'],
  ['/practice/setup', 'Choose your practice'],
  ['/practice/session', 'Choose your practice'],
  ['/practice/summary', 'Your practice recap'],
  ['/statistics', 'Your statistics'],
  ['/settings', 'Make it your own'],
  ['/unknown-page', "Let's find your way back."],
]) {
  test(`direct route ${route} and refresh`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: heading, level: 1, exact: true })).toBeVisible()
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await expect(page).toHaveTitle(route === '/' ? 'Math Practice' : `${heading} | Math Practice`)
    await refresh(page)
    await expect(page.getByRole('heading', { name: heading, level: 1, exact: true })).toBeVisible()
    if (route === '/unknown-page') {
      await page.getByRole('link', { name: 'Back home', exact: true }).click()
      await expect(page).toHaveURL('/')
    }
  })
}

test('home actions, active navigation, and destination focus', async ({ page }) => {
  for (const [action, route] of [
    ['Start Practice', '/practice/setup'],
    ['View Statistics', '/statistics'],
    ['Settings', '/settings'],
  ]) {
    await page.goto('/')
    await page.getByRole('main').getByRole('link', { name: action, exact: true }).click()
    await expect(page).toHaveURL(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    await expect(page.getByRole('navigation').locator('[aria-current="page"]')).toHaveCount(1)
  }
})

test('setup validation, multi-selection, exclusive controls, and edit round trip', async ({
  page,
}) => {
  await page.goto('/practice/setup')
  await expect(page.getByRole('checkbox', { name: 'Addition', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Beginner/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: '10 questions', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Start Session', exact: true })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('Choose at least one operation')
  await page.getByRole('button', { name: 'Select all operations', exact: true }).click()
  await page.getByRole('button', { name: 'Select all operations', exact: true }).click()
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(4)
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click()
  for (const name of ['Multiplication', 'Division'])
    await page.getByRole('checkbox', { name, exact: true }).check()
  await page.getByRole('radio', { name: /^Advanced/ }).check()
  await page.getByRole('radio', { name: '20 questions', exact: true }).check()
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(3)
  await expect(page.getByRole('radio', { name: 'Regular practice', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await expect(page.getByText('Multiplication, Division', { exact: true })).toBeVisible()
  await expect(page.getByText('Question 1 of 20', { exact: true })).toBeVisible()
  await navigateTo(page, 'Edit choices')
  await expect(page.getByRole('checkbox', { name: 'Addition', exact: true })).not.toBeChecked()
  for (const name of ['Multiplication', 'Division'])
    await expect(page.getByRole('checkbox', { name, exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: '20 questions', exact: true })).toBeChecked()
})
