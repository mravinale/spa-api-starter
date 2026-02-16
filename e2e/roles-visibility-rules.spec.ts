import { test, expect, type Page } from '@playwright/test';

import {
  ensureOrganizationMembership,
  ensureUserWithRole,
  loginWithCredentials,
  setActiveOrganizationForUserSessions,
  uniqueEmail,
} from './test-helpers';

const PASSWORD = 'RolesVisibility123!';

const adminEmail = uniqueEmail('e2e-roles-admin');
const managerEmail = uniqueEmail('e2e-roles-manager');
const orgSlug = `e2e-roles-org-${Date.now()}`;

let managerOrganizationId = '';

async function openRolesPage(page: Page) {
  await page.goto('/admin/roles');
  await expect(page).toHaveURL('/admin/roles', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /roles & permissions/i })).toBeVisible({ timeout: 15000 });
}

async function loginAsAdmin(page: Page) {
  await loginWithCredentials(page, adminEmail, PASSWORD);
}

async function loginAsManager(page: Page) {
  await loginWithCredentials(page, managerEmail, PASSWORD);
  await setActiveOrganizationForUserSessions({
    userEmail: managerEmail,
    organizationId: managerOrganizationId,
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Roles page visibility rules', () => {
  test.beforeAll(async () => {
    await ensureUserWithRole({
      email: adminEmail,
      password: PASSWORD,
      name: 'E2E Roles Admin',
      role: 'admin',
    });

    await ensureUserWithRole({
      email: managerEmail,
      password: PASSWORD,
      name: 'E2E Roles Manager',
      role: 'manager',
    });

    managerOrganizationId = await ensureOrganizationMembership({
      userEmail: managerEmail,
      role: 'manager',
      orgSlug,
      orgName: 'E2E Roles Organization',
    });
  });

  test('admin should see create role action and all system role cards', async ({ page }) => {
    await loginAsAdmin(page);
    await openRolesPage(page);

    await expect(page.getByRole('button', { name: /create role/i })).toBeVisible();
    await expect(page.locator('[data-testid="role-card-admin"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-card-manager"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-card-member"]')).toBeVisible();
  });

  test('manager should only see member role card and no create role action', async ({ page }) => {
    await loginAsManager(page);
    await openRolesPage(page);

    await expect(page.getByRole('button', { name: /create role/i })).not.toBeVisible();
    await expect(page.locator('[data-testid="role-card-member"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-card-admin"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="role-card-manager"]')).not.toBeVisible();
  });

  test('system roles should not render edit or delete actions', async ({ page }) => {
    await loginAsAdmin(page);
    await openRolesPage(page);

    for (const roleName of ['admin', 'manager', 'member']) {
      const roleCard = page.locator(`[data-testid="role-card-${roleName}"]`);
      await expect(roleCard).toBeVisible();
      await expect(roleCard.getByText(/^system$/i)).toBeVisible();
      await expect(roleCard.getByRole('button', { name: /^edit$/i })).toHaveCount(0);
      await expect(roleCard.locator('button.text-destructive')).toHaveCount(0);
    }
  });

  test('manager can open permissions dialog for visible role', async ({ page }) => {
    await loginAsManager(page);
    await openRolesPage(page);

    const memberCard = page.locator('[data-testid="role-card-member"]');
    await memberCard.getByRole('button', { name: /manage/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/manage permissions/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /save permissions/i })).toBeVisible();
  });
});
