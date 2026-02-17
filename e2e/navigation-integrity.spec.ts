import { test, expect } from '@playwright/test';

import { TEST_USER } from './env';
import { escapeRegExp, loginWithCredentials } from './test-helpers';

test.describe('Navigation integrity', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USER.email, TEST_USER.password);
  });

  test('settings menu entry should not break navigation', async ({ page }) => {
    const userMenuButton = page
      .locator('[data-slot="sidebar"]')
      .getByRole('button', { name: new RegExp(escapeRegExp(TEST_USER.email), 'i') });
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    await page.getByRole('menuitem', { name: /^settings$/i }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.locator('[data-slot="sidebar"]').getByRole('link', { name: /^dashboard$/i }),
    ).toBeVisible();
  });

  test('direct /invitations navigation should resolve to dashboard fallback', async ({ page }) => {
    await page.goto('/invitations');
    await expect(page).toHaveURL('/');

    const breadcrumb = page.getByLabel('breadcrumb');
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();
  });

  test('admin users page should show breadcrumb chain Admin > Users', async ({ page }) => {
    await page.goto('/admin/users');

    const breadcrumb = page.getByLabel('breadcrumb');
    await expect(breadcrumb.getByRole('link', { name: /^admin$/i })).toBeVisible();
    await expect(breadcrumb.getByText('Users')).toBeVisible();
  });
});
