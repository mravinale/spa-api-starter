import { test, expect, type Page } from '@playwright/test';

import { API_BASE_URL, TEST_USER } from './env';
import {
  ensureUserWithRole,
  escapeRegExp,
  loginWithCredentials,
  uniqueEmail,
  withDatabase,
} from './test-helpers';

const noSessionUserEmail = uniqueEmail('e2e-session-empty');
const noSessionUserPassword = 'SessionPassword123!';
const activeSessionUserEmail = uniqueEmail('e2e-session-active');
const activeSessionUserPassword = 'SessionActivePassword123!';

async function loginAsAdmin(page: Page) {
  await loginWithCredentials(page, TEST_USER.email, TEST_USER.password);
}

async function openSessionsPage(page: Page) {
  await page.goto('/admin/sessions');
  await expect(page.getByRole('heading', { name: /user sessions/i })).toBeVisible();
}

async function selectUser(page: Page, params: { searchTerm: string; expectedText: string }) {
  await page.getByPlaceholder(/search users/i).fill(params.searchTerm);

  const buttonsInList = page.locator('main button');
  const byExpectedText = buttonsInList.filter({
    hasText: new RegExp(escapeRegExp(params.expectedText), 'i'),
  });
  const bySearchTerm = buttonsInList.filter({
    hasText: new RegExp(escapeRegExp(params.searchTerm), 'i'),
  });

  if ((await byExpectedText.count()) > 0) {
    await expect(byExpectedText.first()).toBeVisible({ timeout: 15000 });
    await byExpectedText.first().click();
    return;
  }

  await expect(bySearchTerm.first()).toBeVisible({ timeout: 15000 });
  await bySearchTerm.first().click();
}

test.describe('Sessions edge behavior', () => {
  test.beforeAll(async () => {
    const userWithoutSessions = await ensureUserWithRole({
      email: noSessionUserEmail,
      password: noSessionUserPassword,
      name: 'E2E No Sessions User',
      role: 'member',
    });

    await ensureUserWithRole({
      email: activeSessionUserEmail,
      password: activeSessionUserPassword,
      name: 'E2E Active Sessions User',
      role: 'member',
    });

    await withDatabase(async (pool) => {
      await pool.query('DELETE FROM session WHERE "userId" = $1', [userWithoutSessions.id]);
    });

    const signInResponse = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: activeSessionUserEmail,
        password: activeSessionUserPassword,
      }),
    });

    if (!signInResponse.ok) {
      const errorText = await signInResponse.text().catch(() => '');
      throw new Error(
        `Failed to create active session test user session: status=${signInResponse.status} body=${errorText}`,
      );
    }
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
    await selectUser(page, {
      searchTerm: 'E2E Active Sessions User',
      expectedText: activeSessionUserEmail,
    });

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
