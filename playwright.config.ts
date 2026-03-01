import path from 'node:path'
import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const formatRunStamp = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const port = process.env.PLAYWRIGHT_PORT ?? '4173'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const resolveRunStamp = () => {
  const baseStamp = process.env.PLAYWRIGHT_RUN_STAMP ?? formatRunStamp(new Date())

  let candidate = baseStamp
  let attempt = 1

  while (existsSync(path.join('playwright-report', candidate))) {
    attempt += 1
    candidate = `${baseStamp} (${attempt})`
  }

  return candidate
}

const runStamp = resolveRunStamp()
const isDetailedMode = process.env.PLAYWRIGHT_DETAILED === '1'
const runRootDir = path.join('playwright-report', runStamp)
const htmlOutputDir = path.join(runRootDir, 'html')
const outputDir = path.join(runRootDir, 'artifacts')

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: {
    timeout: 15_000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  preserveOutput: isDetailedMode ? 'always' : 'failures-only',
  outputDir,
  reporter: isDetailedMode
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: htmlOutputDir }],
        ['json', { outputFile: path.join(runRootDir, 'results.json') }]
      ]
    : [['list'], ['html', { open: 'never', outputFolder: htmlOutputDir }]],
  use: {
    baseURL,
    trace: isDetailedMode ? 'on' : 'on-first-retry',
    screenshot: isDetailedMode ? 'on' : 'only-on-failure',
    video: isDetailedMode ? 'on' : 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
    viewport: { width: 1366, height: 900 }
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      }
})
