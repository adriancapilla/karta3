import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  use: { baseURL: process.env.KARTA3_BASE_URL ?? 'http://127.0.0.1:3000', ...devices['Desktop Chrome'], channel: 'chrome' },
  reporter: 'list'
});
