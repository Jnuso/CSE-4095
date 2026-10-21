import { navigateTo, refresh } from './helpers'
import AxeBuilder from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import { mistakeStatisticsFixture } from '../src/test/mistakeStatisticsFixture'
import { test, expect, start, report, answerButtons, noOverflow, storageKey } from './helpers'

async function scan(page: Page, info: TestInfo, state: string) {
  await page.locator('.card-face').evaluateAll(async (faces) => {
    await Promise.all(
      faces
        .flatMap((face) => face.getAnimations())
        .map((animation) => animation.finished.catch(() => {})),
    )
  })
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  await info.attach(`axe-phase16-${state}`, {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  expect(result.violations).toEqual([])
  await noOverflow(page)
}
async function tabAudit(page: Page) {
  const selector = 'a[href], button, input, select, textarea, summary, [tabindex]'
  const expected = await page.locator(selector).evaluateAll((elements) =>
    elements.flatMap((element, index) => {
      const e = element as HTMLElement
      if (e.tabIndex < 0 || e.matches(':disabled') || !e.getClientRects().length) return []
      if (e instanceof HTMLInputElement && e.type === 'radio' && !e.checked) return []
      return [index]
    }),
  )
  const reached = new Set<number>()
  for (let i = 0; i < expected.length + 5; i++) {
    await page.keyboard.press('Tab')
    const current = await page.locator(selector).evaluateAll((elements) => {
      const active = document.activeElement
      const index = elements.findIndex((element) => element === active)
      if (index < 0) return { index, outlined: true }
      const style = getComputedStyle(active!)
      return {
        index,
        outlined: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      }
    })
    if (expected.includes(current.index)) {
      reached.add(current.index)
      expect(current.outlined, `Visible focus on control ${current.index}`).toBe(true)
    }
  }
  expect([...reached].sort((a, b) => a - b)).toEqual([...expected].sort((a, b) => a - b))
}

test('phase16: Tab reaches controls, native radio arrows and modal keyboard focus work', async ({
  page,
}, info) => {
  await page.goto('/practice/setup')
  await tabAudit(page)
  await page.getByRole('radio', { name: /^Beginner/ }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: /^Easy/ })).toBeChecked()
  await page.goto('/settings')
  await tabAudit(page)
  const clear = page.getByRole('button', { name: 'Clear All Application Data', exact: true })
  await clear.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Keep my data', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Erase all app data', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Keep my data', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Erase all app data', exact: true })).toBeFocused()
  await scan(page, info, 'keyboard-modal')
  await page.keyboard.press('Escape')
  await expect(clear).toBeFocused()
})

test('phase16: number shortcuts are scoped, reveal/next retain focus and progress descriptions', async ({
  page,
}, info) => {
  await start(page)
  await expect(page.locator('.visually-hidden[aria-live="polite"]')).toContainText(
    'Question 1 of 5',
  )
  const choices = answerButtons(page)
  await choices.first().focus()
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press(String(i + 1))
    await expect(choices.nth(i)).toBeFocused()
    await expect(choices.nth(i)).toHaveAttribute('aria-pressed', 'true')
    await expect(choices.nth(i)).toHaveAttribute('aria-keyshortcuts', String(i + 1))
  }
  const selected = await choices.last().getAttribute('aria-label')
  await page.getByRole('checkbox', { name: 'Animate card flips', exact: true }).focus()
  await page.keyboard.press('1')
  await expect(choices.last()).toHaveAttribute('aria-pressed', 'true')
  await choices.last().focus()
  await page.keyboard.press('Control+1')
  await expect(choices.last()).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Flip Card', exact: true }).focus()
  await page.keyboard.press('Space')
  const answer = page.getByRole('heading', { name: /^Correct answer:/ })
  await expect(answer).toBeFocused()
  await expect(answer).toHaveAccessibleDescription('Question 1 of 5')
  await expect(page.locator('.student-answer')).toContainText(selected!.replace('Answer ', ''))
  expect(await page.locator('.card-face').evaluate((e) => getComputedStyle(e).opacity)).toBe('1')
  await scan(page, info, 'revealed')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'I Got It Right', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  const question = page.getByRole('heading', { name: /= \?/ })
  await expect(question).toBeFocused()
  await expect(question).toHaveAccessibleDescription('Question 2 of 5')
  await expect(page.getByRole('status', { name: 'Session totals' })).toHaveAttribute(
    'aria-atomic',
    'true',
  )
  await expect(page.getByRole('status', { name: 'Session totals' })).toContainText('Right: 1')
  await scan(page, info, 'next-focused')
})

test('phase16: reduced motion and saved animation preference keep content clear', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await start(page)
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  expect(await page.locator('.card-face').evaluate((e) => getComputedStyle(e).animationName)).toBe(
    'none',
  )
  await expect(page.getByRole('heading', { name: /^Correct answer:/ })).toBeVisible()
  await scan(page, info, 'reduced-motion')
  await page.getByRole('button', { name: 'I Got It Right', exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('checkbox', { name: 'Animate card flips', exact: true }).uncheck()
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  expect(await page.locator('.card-face').evaluate((e) => getComputedStyle(e).animationName)).toBe(
    'none',
  )
  await scan(page, info, 'animation-off')
})

test('phase16: zoom-equivalent 640px reflow preserves pages, cards and recap', async ({
  page,
}, info) => {
  // 1280px desktop at 200% zoom has 640 CSS pixels. This is reflow evidence, not literal browser zoom.
  await page.setViewportSize({ width: 640, height: 480 })
  for (const route of ['/', '/practice/setup', '/settings', '/statistics']) {
    await page.goto(route)
    await noOverflow(page)
  }
  await start(page)
  await scan(page, info, 'zoom-equivalent-front')
  for (let i = 0; i < 5; i++) await report(page, i % 2 === 0)
  await scan(page, info, 'zoom-equivalent-recap')
})

test('phase16: doubled base text reflows setup, populated statistics, cards and dialog', async ({
  page,
}, info) => {
  await page.goto('/statistics')
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data: mistakeStatisticsFixture(),
  })
  await refresh(page)
  // Simulate a larger browser base font. Actual OS/browser text-size settings remain a manual check.
  await page.addStyleTag({ content: ':root { font-size: 32px !important; }' })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Your statistics', exact: true })).toBeVisible()
  await scan(page, info, 'double-text-statistics')
  await page.getByRole('radio', { name: 'Mastered mistakes (1)', exact: true }).check()
  await scan(page, info, 'double-text-mastered')
  await navigateTo(page, 'Practice')
  await scan(page, info, 'double-text-setup')
  await page.getByRole('radio', { name: '5 questions', exact: true }).check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await scan(page, info, 'double-text-card')
  await navigateTo(page, 'Settings')
  await page.getByRole('button', { name: 'Clear All Application Data', exact: true }).click()
  await scan(page, info, 'double-text-dialog')
  await page.getByRole('button', { name: 'Keep my data', exact: true }).click()
})
