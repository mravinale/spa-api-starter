import { defineConfig, devices } from '@playwright/test';
import { API_BASE_URL, FE_URL, ENV_TEST_PATH } from './e2e/env';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false, // Disable parallel to avoid race conditions with shared test user
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries - tests should be deterministic
  workers: 1, // Single worker to ensure test isolation
  reporter: 'html',
  use: {
    baseURL: FE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: '../nestjs-api-starter',
      url: `${API_BASE_URL}/api/auth/ok`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      // Tell dotenv/config (used by the backend) to load .env.test
      env: { DOTENV_CONFIG_PATH: ENV_TEST_PATH },
    },
    {
      command: 'npm run dev',
      url: FE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
