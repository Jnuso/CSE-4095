import AxeBuilder from '@axe-core/playwright'
import {
  test,
  expect,
  start,
  report,
  saved,
  storageKey,
  noOverflow,
  answerButtons,
} from './helpers'

test('settings save, reload, session overrides, explanations and animation', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Save Settings', exact: true })).toBeDisabled()
  await page.getByRole('checkbox', { name: 'Division', exact: true }).check()
  await page.getByRole('radio', { name: /^Advanced/ }).check()
  await page.getByRole('radio', { name: '5 questions', exact: true }).check()
  await page.getByRole('checkbox', { name: /^Card animation/ }).uncheck()
  await page.getByRole('checkbox', { name: /^Show explanations/ }).uncheck()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Settings update' })).toContainText(
    'Settings saved',
  )
  await page.reload()
  await expect(page.getByRole('checkbox', { name: /^Card animation/ })).not.toBeChecked()
  await page.getByRole('link', { name: 'Practice', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Division', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: '5 questions', exact: true })).toBeChecked()
  await page.getByRole('radio', { name: /^Beginner/ }).check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await expect(page.locator('.answer-explanation')).toHaveCount(0)
  await expect(page.locator('.card-face')).not.toHaveClass(/card-flip/)
  expect((await saved(page)).settings.defaultDifficulty).toBe(4)
  await page.getByRole('link', { name: 'Practice', exact: true }).click()
  await expect(page.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('checkbox', { name: /^Show explanations/ }).check()
  await page.getByRole('checkbox', { name: /^Sound effects/ }).check()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await page.getByRole('link', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await answerButtons(page).first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await expect(page.locator('.answer-explanation')).toContainText('equal groups')
  await noOverflow(page)
})

test('clear-all confirmation is accessible, cancellable, and restores only app data', async ({
  page,
}, testInfo) => {
  await start(page)
  await report(page, true)
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('checkbox', { name: /^Sound effects/ }).check()
  await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await page.evaluate((key) => {
    localStorage.setItem('e2e.unrelated', 'keep')
    localStorage.setItem(
      key,
      JSON.stringify({
        ...JSON.parse(localStorage.getItem(key)!),
        mistakePatterns: ['test-pattern'],
      }),
    )
  }, storageKey)
  const before = await page.evaluate((key) => localStorage.getItem(key), storageKey)
  const scan = async (state: string) => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()
    await testInfo.attach(`axe-settings-${state}`, {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    })
    expect(result.violations).toEqual([])
  }
  await noOverflow(page)
  await scan('saved')
  const clear = page.getByRole('button', { name: 'Clear All Application Data', exact: true })
  await clear.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Keep my data' })).toBeFocused()
  await scan('confirmation')
  await page.keyboard.press('Escape')
  await expect(clear).toBeFocused()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(before)
  await clear.click()
  await dialog.getByRole('button', { name: 'Keep my data' }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(before)
  await clear.click()
  await dialog.getByRole('button', { name: 'Erase all app data' }).click()
  await expect(page).toHaveURL('/')
  const data = await saved(page)
  expect(data.records).toEqual([])
  expect(data.settings).toMatchObject({
    soundEffectsEnabled: false,
    cardAnimationEnabled: true,
    showExplanations: true,
    defaultOperations: ['addition'],
    defaultDifficulty: 1,
    defaultSessionLength: 10,
  })
  expect(data).not.toHaveProperty('mistakePatterns')
  expect(await page.evaluate(() => localStorage.getItem('e2e.unrelated'))).toBe('keep')
  await page.goto('/settings')
  await page.reload()
  await expect(page.getByRole('checkbox', { name: /^Sound effects/ })).not.toBeChecked()
})

test('failed clear-all preserves data; explicit confirmation can recover protected storage', async ({
  page,
}) => {
  await start(page)
  await report(page, false)
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  const before = await page.evaluate((key) => localStorage.getItem(key), storageKey)
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError')
    }
  })
  await page.getByRole('button', { name: 'Clear All Application Data', exact: true }).click()
  await page.getByRole('button', { name: 'Erase all app data', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Settings update' })).toContainText(
    'could not be cleared',
  )
  await expect(page).toHaveURL('/settings')
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(before)
  await page.reload()
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), storageKey)
  await page.reload()
  await expect(page.getByRole('status', { name: 'Saved data notice' })).toContainText(
    'left unchanged',
  )
  await page.getByRole('button', { name: 'Clear All Application Data', exact: true }).click()
  await page.getByRole('button', { name: 'Erase all app data', exact: true }).click()
  await expect(page).toHaveURL('/')
  expect((await saved(page)).records).toEqual([])
})

test('clear-all in another tab resets live preferences and blocks stale practice saves', async ({
  page,
  context,
}) => {
  await start(page)
  await page.getByRole('checkbox', { name: 'Animate card flips', exact: true }).uncheck()
  await report(page, false)
  const other = await context.newPage()
  await other.goto('/settings')
  await other.getByRole('button', { name: 'Clear All Application Data', exact: true }).click()
  await other.getByRole('button', { name: 'Erase all app data', exact: true }).click()
  await expect(other).toHaveURL('/')
  await page.bringToFront()
  await expect(
    page.getByRole('checkbox', { name: 'Animate card flips', exact: true }),
  ).toBeChecked()
  await report(page, true)
  expect((await saved(page)).records).toEqual([])
  await start(page)
  await report(page, true)
  expect((await saved(page)).records).toHaveLength(1)
  await other.close()
})
