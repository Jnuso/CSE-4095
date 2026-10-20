import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  outputDir: 'output/playwright/firefox-results',
  reporter: [
    ['list'],
    ...(process.env.GITHUB_ACTIONS ? [['github'] as const] : []),
    ['html', { outputFolder: 'output/playwright/firefox-report', open: 'never' }],
  ],
  use: { ...base.use, channel: undefined },
  projects: [
    {
      name: 'firefox',
      testIgnore: ['**/restart.spec.ts', '**/pages.spec.ts'],
      use: { browserName: 'firefox', viewport: { width: 1440, height: 1000 } },
    },
  ],
})
