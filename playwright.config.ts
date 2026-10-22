import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: process.env.KARTA3_BASE_URL ?? 'http://127.0.0.1:3000', ...devices['Desktop Chrome'], channel: 'chrome', trace: 'retain-on-failure' },
  reporter: 'list'
});
