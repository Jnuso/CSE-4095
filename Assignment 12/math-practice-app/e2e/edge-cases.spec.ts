import { emptySavedData, trackMistakes } from '../src/services/storageService'
import { wrongFact } from '../src/test/mistakeStatisticsFixture'
import { test, expect, start, report, saved, storageKey, finish, metric, refresh } from './helpers'

test('editing a recovered session creates a fresh identity without merging old reports', async ({
  page,
}) => {
  await start(page)
  await report(page, true)
  const oldId = (await saved(page)).records[0].session.id
  await refresh(page)
  await page.getByRole('link', { name: 'Edit choices', exact: true }).click()
  await page.getByRole('button', { name: 'End session and leave', exact: true }).click()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await expect(page.getByText('Question 1 of 5', { exact: true })).toBeVisible()
  await report(page, false)
  const records = (await saved(page)).records
  expect(records).toHaveLength(2)
  const old = records.find((r) => r.session.id === oldId)!
  const fresh = records.find((r) => r.session.id !== oldId)!
  expect(old.session).toMatchObject({ attempted: 1, correct: 1, incorrect: 0 })
  expect(old.session.completedAt).toBeTruthy()
  expect(fresh.session).toMatchObject({ attempted: 1, correct: 0, incorrect: 1 })
  expect(fresh.session.completedAt).toBeUndefined()
  expect(fresh.attempts[0].id).not.toBe(old.attempts[0].id)
})

test('fresh practice remains usable after a clock rollback following history reset', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'))
  await page.goto('/statistics')
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Erase history', exact: true }).click()
  const cutoff = (await saved(page)).historyResetAt!
  await page.clock.setFixedTime(new Date('2026-10-21T11:00:00Z'))
  await page.getByRole('link', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await expect(page.getByRole('group', { name: 'Answer choices', exact: true })).toBeVisible()
  await report(page, true)
  expect(Date.parse((await saved(page)).records[0].session.startedAt)).toBeGreaterThan(cutoff)
  expect((await saved(page)).records[0].attempts).toHaveLength(1)
})

test('clock rollback keeps ended recap and saved reports valid after reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'))
  await start(page)
  await report(page, true)
  await page.clock.setFixedTime(new Date('2026-10-21T11:00:00Z'))
  await finish(page)
  await expect(metric(page, 'Questions attempted')).toHaveText('1')
  const record = (await saved(page)).records[0]
  expect(Date.parse(record.session.completedAt!)).toBeGreaterThanOrEqual(
    Date.parse(record.attempts[0].attemptedAt),
  )
  await page.reload()
  await expect(metric(page, 'Questions attempted')).toHaveText('1')
})

test('mastery threshold changes in another tab affect the active review safely', async ({
  page,
  context,
}) => {
  await page.goto('/practice/setup')
  const data = trackMistakes({
    ...emptySavedData(),
    mistakeEvents: [wrongFact('edge-origin', 'addition', 4, 3, '2026-10-18T00:00:00Z')],
  })
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: storageKey,
    data,
  })
  await page.reload()
  await page.getByRole('radio', { name: 'Mistake review', exact: true }).check()
  await page.getByRole('radio', { name: 'Continuous practice', exact: true }).check()
  await page.getByRole('button', { name: 'Start Session', exact: true }).click()
  await report(page, true)
  const other = await context.newPage()
  await other.goto('/settings')
  await other.getByRole('spinbutton', { name: 'Mastery threshold', exact: true }).fill('2')
  await other.getByRole('button', { name: 'Save Settings', exact: true }).click()
  await report(page, true)
  await expect(
    page.getByRole('heading', { name: 'Your practice recap', exact: true }),
  ).toBeVisible()
  expect((await saved(page)).mistakePatterns![0]).toMatchObject({
    similarCorrectCount: 2,
    mastered: true,
  })
  await other.getByRole('spinbutton', { name: 'Mastery threshold', exact: true }).fill('100')
  await other.getByRole('button', { name: 'Save Settings', exact: true }).click()
  expect((await saved(other)).mistakePatterns![0]).toMatchObject({
    similarCorrectCount: 2,
    mastered: false,
  })
})

test('cross-tab Clear All while the end dialog is open removes the stale dialog and card', async ({
  page,
  context,
}) => {
  await start(page)
  await report(page, false)
  await page.getByRole('button', { name: 'End Session', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'End this session?' })).toBeVisible()
  const other = await context.newPage()
  await other.goto('/settings')
  await other.getByRole('button', { name: 'Clear All Application Data' }).click()
  await other.getByRole('button', { name: 'Erase all app data' }).click()
  await expect(
    page.getByRole('heading', { name: 'Choose your practice', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await saved(page)).records).toEqual([])
  await page.reload()
  expect((await saved(page)).records).toEqual([])
})

test('double-clicking report counts once and never reports the following question', async ({
  page,
}) => {
  await start(page)
  await page.getByRole('group', { name: 'Answer choices' }).getByRole('button').first().click()
  await page.getByRole('button', { name: 'Flip Card', exact: true }).click()
  await page.getByRole('button', { name: 'I Got It Right', exact: true }).dblclick()
  await expect(page.getByText('Question 2 of 5', { exact: true })).toBeVisible()
  expect((await saved(page)).records[0].attempts).toHaveLength(1)
  await expect(page.getByRole('button', { name: 'Flip Card', exact: true })).toBeDisabled()
})

test('invalid threshold draft can be corrected without losing other unsaved preferences', async ({
  page,
}) => {
  await page.goto('/settings')
  const input = page.getByRole('spinbutton', { name: 'Mastery threshold', exact: true })
  await page.getByRole('checkbox', { name: /^Sound effects/ }).check()
  await input.fill('0')
  await expect(page.getByRole('button', { name: 'Save Settings' })).toBeDisabled()
  await input.fill('100')
  await page.getByRole('button', { name: 'Save Settings' }).click()
  await page.reload()
  await expect(input).toHaveValue('100')
  await expect(page.getByRole('checkbox', { name: /^Sound effects/ })).toBeChecked()
  expect((await saved(page)).settings.masteryThreshold).toBe(100)
})
