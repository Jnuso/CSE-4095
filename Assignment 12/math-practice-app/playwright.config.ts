import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  outputDir: 'output/playwright/regression-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'output/playwright/regression-report', open: 'never' }],
  ],
  use: {
    channel: 'chromium',
    baseURL: 'http://127.0.0.1:4273',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      testIgnore: '**/restart.spec.ts',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4273',
    url: 'http://127.0.0.1:4273',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
