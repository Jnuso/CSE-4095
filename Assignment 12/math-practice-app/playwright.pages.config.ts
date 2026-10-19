import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/pages.spec.ts',
  fullyParallel: true,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  outputDir: 'output/playwright/pages-results',
  reporter: [['list'], ['html', { outputFolder: 'output/playwright/pages-report', open: 'never' }]],
  use: {
    channel: 'chromium',
    baseURL: 'http://127.0.0.1:4373/CSE-4095/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'pages-desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'pages-mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: 'node scripts/pages-test-server.mjs',
    url: 'http://127.0.0.1:4373/CSE-4095/',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
