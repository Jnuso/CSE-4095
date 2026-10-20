import { chromium } from '@playwright/test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { test, expect, report, metric, saved } from './helpers'

test('saved attempts and settings survive closing and reopening a real browser', async ({
  baseURL,
}) => {
  // Short, local temp storage avoids MAX_PATH and OneDrive sync overhead for LevelDB.
  const profileRoot = resolve(tmpdir())
  const profile = await mkdtemp(join(profileRoot, 'math-e2e-'))
  if (dirname(resolve(profile)) !== profileRoot || !basename(profile).startsWith('math-e2e-'))
    throw new Error('Unexpected test profile cleanup path.')
  const problems: string[] = []
  const open = async () =>
    test.step('Launch persistent browser process', async () => {
      const context = await chromium.launchPersistentContext(profile, {
        headless: true,
        channel: 'chromium',
        baseURL,
        viewport: { width: 1440, height: 1000 },
      })
      const page = context.pages()[0] ?? (await context.newPage())
      page.on('pageerror', (error) => problems.push(error.message))
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) problems.push(message.text())
      })
      return { context, page }
    })
  try {
    const first = await open()
    try {
      await first.page.goto('/settings')
      await first.page.getByRole('button', { name: 'Clear selection', exact: true }).click()
      await first.page.getByRole('checkbox', { name: 'Division', exact: true }).check()
      await first.page.getByRole('radio', { name: /^Advanced/ }).check()
      await first.page.getByRole('radio', { name: '5 questions', exact: true }).check()
      await first.page.getByRole('button', { name: 'Save Settings', exact: true }).click()
      await first.page.getByRole('link', { name: 'Practice', exact: true }).click()
      await first.page.getByRole('button', { name: 'Start Session', exact: true }).click()
      await first.page.getByRole('checkbox', { name: 'Animate card flips', exact: true }).uncheck()
      for (const right of [true, true, true, false, false]) await report(first.page, right)
      await expect(metric(first.page, 'Accuracy')).toHaveText('60%')
      expect((await saved(first.page)).records[0].attempts).toHaveLength(5)
      expect((await saved(first.page)).mistakeEvents).toHaveLength(2)
    } finally {
      await test.step('Close first browser process', () => first.context.close())
    }
    const second = await open()
    try {
      await second.page.goto('/practice/summary')
      await expect(metric(second.page, 'Questions attempted')).toHaveText('5')
      await expect(metric(second.page, 'Accuracy')).toHaveText('60%')
      expect((await saved(second.page)).mistakeEvents).toHaveLength(2)
      expect(
        (await saved(second.page)).mistakePatterns!.reduce(
          (sum, pattern) => sum + pattern.incorrectCount,
          0,
        ),
      ).toBe(2)
      await second.page.goto('/practice/setup')
      await expect(
        second.page.getByRole('checkbox', { name: 'Division', exact: true }),
      ).toBeChecked()
      await expect(second.page.getByRole('radio', { name: /^Advanced/ })).toBeChecked()
      await second.page.getByRole('button', { name: 'Start Session', exact: true }).click()
      await expect(
        second.page.getByRole('checkbox', { name: 'Animate card flips', exact: true }),
      ).not.toBeChecked()
    } finally {
      await test.step('Close second browser process', () => second.context.close())
    }
    expect(problems).toEqual([])
  } finally {
    await test.step('Remove owned temporary profile', () =>
      rm(profile, { recursive: true, force: true }))
  }
})
