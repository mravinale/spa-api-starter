import { defineConfig, devices } from '@playwright/test';
import { API_BASE_URL, FE_URL, ENV_TEST_PATH, DATABASE_URL } from './e2e/env';

function getPortFromUrl(url: string, fallback: number): number {
  try {
    const parsed = new URL(url);
    if (parsed.port) return Number(parsed.port);
    if (parsed.protocol === 'https:') return 443;
    if (parsed.protocol === 'http:') return 80;
    return fallback;
  } catch {
    return fallback;
  }
}

const apiPort = getPortFromUrl(API_BASE_URL, 3000);
const fePort = getPortFromUrl(FE_URL, 5173);
const reuseExistingServer = process.env.E2E_REUSE_EXISTING_SERVER === 'true';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false, // Disable parallel to avoid race conditions with shared test user
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries - tests should be deterministic
  workers: 1, // Single worker to ensure test isolation
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
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
      url: `${API_BASE_URL}/health`,
      reuseExistingServer,
      timeout: 120 * 1000,
      // Tell dotenv/config (used by the backend) to load .env.test
      env: {
        DOTENV_CONFIG_PATH: ENV_TEST_PATH,
        PORT: String(apiPort),
        DATABASE_URL,
        BASE_URL: API_BASE_URL,
        FE_URL,
        TRUSTED_ORIGINS: `${FE_URL},http://localhost:${fePort},http://127.0.0.1:${fePort}`,
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${fePort}`,
      url: FE_URL,
      reuseExistingServer,
      timeout: 120 * 1000,
      env: {
        VITE_API_URL: API_BASE_URL,
      },
    },
  ],
});
