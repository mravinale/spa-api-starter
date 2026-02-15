import { test, expect, type Page } from '@playwright/test';

import { TEST_USER } from './env';
import { ensureUserWithRole, loginWithCredentials, uniqueEmail, withDatabase } from './test-helpers';

const noSessionUserEmail = uniqueEmail('e2e-session-empty');
const noSessionUserPassword = 'SessionPassword123!';

async function loginAsAdmin(page: Page) {
  await loginWithCredentials(page, TEST_USER.email, TEST_USER.password);
}

async function openSessionsPage(page: Page) {
  await page.goto('/admin/sessions');
  await expect(page.getByRole('heading', { name: /user sessions/i })).toBeVisible();
}

async function selectUser(page: Page, params: { searchTerm: string; expectedText: string }) {
  await page.getByPlaceholder(/search users/i).fill(params.searchTerm);
  const userButton = page
    .locator('main')
    .getByRole('button', { name: new RegExp(params.expectedText, 'i') })
    .first();
  await expect(userButton).toBeVisible({ timeout: 15000 });
  await userButton.click();
}

async function selectFirstUserWithSessions(page: Page): Promise<void> {
  await page.getByPlaceholder(/search users/i).fill('');

  const userButtons = page.locator('main').locator('button', { hasText: /@/ });
  const userCount = await userButtons.count();

  for (let i = 0; i < Math.min(userCount, 8); i++) {
    const candidate = userButtons.nth(i);
    await candidate.click();
    await page.waitForTimeout(300);

    const hasRows = (await page.locator('table tbody tr').count()) > 0;
    if (hasRows) return;
  }

  throw new Error('No user with active sessions was found in the visible sessions user list');
}

test.describe('Sessions edge behavior', () => {
  test.beforeAll(async () => {
    const user = await ensureUserWithRole({
      email: noSessionUserEmail,
      password: noSessionUserPassword,
      name: 'E2E No Sessions User',
      role: 'member',
    });

    await withDatabase(async (pool) => {
      await pool.query('DELETE FROM session WHERE "userId" = $1', [user.id]);
    });
  });

  test('should show no-user-selected state before choosing a user', async ({ page }) => {
    await loginAsAdmin(page);
    await openSessionsPage(page);

    await expect(page.getByText(/select a user from the list to view their sessions/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /revoke all/i })).not.toBeVisible();
  });

  test('should show no active sessions state for user without sessions', async ({ page }) => {
    await loginAsAdmin(page);
    await openSessionsPage(page);
    await selectUser(page, {
      searchTerm: 'E2E No Sessions User',
      expectedText: noSessionUserEmail,
    });

    await expect(page.getByText(/no active sessions found for this user/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /revoke all/i })).toBeDisabled();
  });

  test('cancel revoke-all should keep the same session rows', async ({ page }) => {
    await loginAsAdmin(page);
    await openSessionsPage(page);
    await selectFirstUserWithSessions(page);

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    const beforeCount = await rows.count();

    await page.getByRole('button', { name: /revoke all/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /cancel/i }).click();

    await expect(dialog).not.toBeVisible();
    const afterCount = await page.locator('table tbody tr').count();
    expect(afterCount).toBe(beforeCount);
  });
});
