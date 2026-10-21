import AxeBuilder from '@axe-core/playwright'
import { test, expect, noOverflow } from './helpers'

test('statistics section menu jumps, follows scrolling and preserves data', async ({ page }) => {
  await page.goto('/statistics')
  const menu = page.getByRole('navigation', { name: 'Statistics sections' })
  await expect(menu.getByRole('button', { name: 'Overview', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  )
  const before = await page.evaluate(() => JSON.stringify(localStorage))
  for (const name of [
    'By operation',
    'By difficulty',
    'Mistakes and review',
    'Recent sessions',
    'Reset history',
    'Overview',
  ]) {
    const button = menu.getByRole('button', { name, exact: true })
    await button.click()
    const title =
      name === 'Overview'
        ? 'Your statistics'
        : name === 'Reset history'
          ? 'Reset practice history'
          : name
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeFocused()
    await expect(button).toHaveAttribute('aria-current', 'location')
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeInViewport()
  }
  await page.getByRole('heading', { name: 'By operation', exact: true }).evaluate((heading) => {
    window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - 24)
  })
  await expect(menu.getByRole('button', { name: 'By operation', exact: true })).toHaveAttribute(
    'aria-current',
    'location',
  )
  await noOverflow(page)
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before)
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  expect(scan.violations).toEqual([])
  await page.setViewportSize({ width: 320, height: 720 })
  await noOverflow(page)
  await menu.getByRole('button', { name: 'Recent sessions', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Recent sessions', exact: true })).toBeFocused()
})
