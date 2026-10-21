import { test, expect, start, report } from './helpers'

test('loads secondary pages on demand and restores heading focus after a slow chunk response', async ({
  page,
}) => {
  const chunks: string[] = []
  page.on('request', (request) => {
    if (/\/(StatisticsPage|SettingsPage)-.*\.js/.test(request.url())) chunks.push(request.url())
  })
  let releaseChunk: (() => void) | undefined
  await page.route(/\/(StatisticsPage|SettingsPage)-.*\.js/, async (route) => {
    await new Promise<void>((resolve) => {
      releaseChunk = resolve
    })
    await route.continue()
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(chunks).toEqual([])
  for (const [link, title] of [
    ['Statistics', 'Your statistics'],
    ['Settings', 'Make it your own'],
  ]) {
    await page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('link', { name: link, exact: true })
      .click()
    await expect
      .poll(() =>
        chunks.some((url) =>
          url.includes(`${link === 'Statistics' ? 'StatisticsPage' : 'SettingsPage'}-`),
        ),
      )
      .toBe(true)
    await expect(
      page.getByRole('navigation', { name: 'Main navigation', exact: true }),
    ).toBeVisible()
    releaseChunk!()
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeFocused()
    await expect(page).toHaveTitle(`${title} | Math Practice`)
  }
  expect(chunks.filter((url) => url.includes('StatisticsPage-'))).toHaveLength(1)
  expect(chunks.filter((url) => url.includes('SettingsPage-'))).toHaveLength(1)
  await page.unrouteAll({ behavior: 'wait' })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Make it your own' })).toBeVisible()
  await expect(page).toHaveTitle('Make it your own | Math Practice')
})
import { test as recoveryTest } from '@playwright/test'
import { emptySavedData, STORAGE_KEY } from '../src/services/storageService'
import { completedFixture } from '../src/test/summaryFixture'

recoveryTest(
  'a failed secondary-page download can recover with Try again without losing saved practice',
  async ({ page }) => {
    await page.goto('/')
    const data = { ...emptySavedData(), records: [completedFixture()] }
    await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
      key: STORAGE_KEY,
      data,
    })
    const chunk = /\/SettingsPage-.*\.js/
    await page.route(chunk, (route) =>
      route.fulfill({ status: 503, body: 'Temporarily unavailable' }),
    )
    await page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('link', { name: 'Settings', exact: true })
      .click()
    await expect(page.getByRole('heading', { name: 'Let’s try a fresh start' })).toBeFocused()
    await page.unroute(chunk)
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Make it your own' })).toBeVisible()
    await expect(page).toHaveTitle('Make it your own | Math Practice')
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY),
    ).toEqual(data)
  },
)

test('practice remains usable with simulated 4x CPU slowdown and sends no practice uploads', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'CPU emulation requires Chromium; this is not a physical-device check.',
  )
  const requests: { url: string; method: string }[] = []
  page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }))
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  try {
    await start(page)
    for (const correct of [true, false, true, false, true]) await report(page, correct)
    await expect(page.getByRole('heading', { name: 'Your practice recap' })).toBeVisible()
    await expect(page.getByText('Accuracy', { exact: true }).locator('..')).toContainText('60%')
    await page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('link', { name: 'Settings', exact: true })
      .click()
    await expect(page.getByRole('heading', { name: 'Your practice stays here' })).toBeVisible()
    expect(requests.length).toBeGreaterThan(0)
    const origin = new URL(page.url()).origin
    expect(
      requests.filter(
        (request) => new URL(request.url).origin !== origin || request.method !== 'GET',
      ),
    ).toEqual([])
  } finally {
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await session.detach()
  }
})
