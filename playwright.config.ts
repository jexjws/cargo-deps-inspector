import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const PORT_DEV = 13001
const PORT_BUILD = 13002
const PORT_BUILD_SUBBASE = 13004
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './test/e2e',
  outputDir: './test/e2e/.results',
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['github']] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'dev',
      testMatch: /dev\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${PORT_DEV}` },
    },
    {
      name: 'build',
      testMatch: /build\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${PORT_BUILD}` },
    },
    {
      name: 'build-subbase',
      testMatch: /build-subbase\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${PORT_BUILD_SUBBASE}` },
    },
    {
      name: 'a11y',
      testMatch: /a11y\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${PORT_BUILD}` },
    },
  ],
  webServer: {
    command: 'node test/e2e/utils/orchestrate.mjs',
    url: `http://127.0.0.1:${PORT_DEV}/__connection.json`,
    reuseExistingServer: !isCI,
    timeout: 600_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      E2E_PORT_DEV: String(PORT_DEV),
      E2E_PORT_BUILD: String(PORT_BUILD),
      E2E_PORT_BUILD_SUBBASE: String(PORT_BUILD_SUBBASE),
    },
  },
})
