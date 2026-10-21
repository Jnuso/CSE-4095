import { test, expect, start, report, saved, storageKey } from './helpers'

test('refresh restores exact choices, selected answer, revealed face and counted progress', async ({
  page,
}) => {
  await start(page)
  await report(page, true)
  const question = await page.locator('.card-math').textContent()
  const choices = await page
    .getByRole('group', { name: 'Answer choices' })
    .getByRole('button')
    .locator('span:first-child')
    .allTextContents()
  await page.getByRole('group', { name: 'Answer choices' }).getByRole('button').nth(1).click()
  const selected = await page.getByRole('button', { pressed: true }).textContent()
  const before = await saved(page)
  page.once('dialog', (dialog) => dialog.accept())
  await page.reload()
  await expect(page.locator('.card-math')).toHaveText(question!)
  expect(
    await page
      .getByRole('group', { name: 'Answer choices' })
      .getByRole('button')
      .locator('span:first-child')
      .allTextContents(),
  ).toEqual(choices)
  await expect(page.getByRole('button', { pressed: true })).toHaveText(selected!)
  await expect(page.getByRole('status', { name: 'Session totals' })).toContainText('Completed: 1')
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  const answer = await page.locator('.card-math').textContent()
  page.once('dialog', (dialog) => dialog.accept())
  await page.reload()
  await expect(page.locator('.card-math')).toHaveText(answer!)
  await expect(page.getByRole('button', { name: 'I Got It Right', exact: true })).toBeVisible()
  expect((await saved(page)).records[0].session.id).toBe(before.records[0].session.id)
  expect((await saved(page)).records[0].attempts).toEqual(before.records[0].attempts)
  await page.getByRole('button', { name: 'I Got It Wrong', exact: true }).click()
  expect((await saved(page)).records[0].attempts).toHaveLength(2)
})

test('links and browser Back offer stay or end-and-leave, then completed entries cannot restart', async ({
  page,
}) => {
  await start(page)
  await report(page, true)
  const question = await page.locator('.card-math').textContent()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Statistics', exact: true })
    .click({ noWaitAfter: true })
  const dialog = page.getByRole('dialog', { name: 'Leave this session?' })
  await expect(dialog.getByRole('button', { name: 'Keep practicing' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.card-math')).toHaveText(question!)
  await page.evaluate(() => history.back())
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Keep practicing' }).click()
  await expect(page).toHaveURL('/practice/session')
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Statistics', exact: true })
    .click({ noWaitAfter: true })
  await dialog.getByRole('button', { name: 'End session and leave' }).click()
  await expect(page.getByRole('heading', { name: 'Your statistics', exact: true })).toBeVisible()
  expect((await saved(page)).records[0].session.completedAt).toBeTruthy()
  expect((await saved(page)).records[0].attempts).toHaveLength(1)
  await page.goBack()
  await expect(
    page.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeVisible()
})

test('another tab reset fences the active snapshot and prevents restoration of erased history', async ({
  page,
  context,
}) => {
  await start(page)
  await report(page, false)
  const other = await context.newPage()
  await other.goto('/')
  await other.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key)!)
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        settings: data.settings,
        records: [],
        historyResetAt: Date.now() + 1000,
      }),
    )
  }, storageKey)
  await expect(
    page.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeVisible()
  expect((await saved(page)).records).toEqual([])
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeVisible()
  expect((await saved(page)).records).toEqual([])
  await other.close()
})
