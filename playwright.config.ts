import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  webServer: process.env.CI ? {
    command: 'node dist-server/server/main.js',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 30_000
  } : undefined,
  use: { baseURL: process.env.KARTA3_BASE_URL ?? 'http://127.0.0.1:3000', ...devices['Desktop Chrome'], channel: 'chrome' },
  reporter: 'list'
});
