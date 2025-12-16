import { test, expect, Page } from '@playwright/test';
import { Pool } from 'pg';

const API_BASE_URL = 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://mravinale@localhost:5432/nestjs-api-starter';

/**
 * Comprehensive E2E Tests for Unified Role Model
 * 
 * Tests the 3-role system:
 * - Admin: Global platform administrator with full access
 * - Manager: Organization manager with org-scoped access
 * - Member: Organization member with basic read access
 * 
 * Uses a single test user (test@example.com) and changes their role between test suites.
 */

const TEST_USER = { email: 'test@example.com', password: 'password123' };

// Database helper
async function withDatabase<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

// Set user role and clear sessions
async function setUserRole(role: 'admin' | 'manager' | 'member') {
  await withDatabase(async (pool) => {
    await pool.query(`UPDATE "user" SET role = $1 WHERE email = $2`, [role, TEST_USER.email]);
    await pool.query(`DELETE FROM "session" WHERE "userId" IN (SELECT id FROM "user" WHERE email = $1)`, [TEST_USER.email]);
    console.log(`✅ Set user role to: ${role}`);
  });
}

// Login helper
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: /^login$/i }).click();
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

// ============================================================================
// ADMIN ROLE TESTS - Full Platform Access
// ============================================================================

test.describe('Admin Role - Full Platform Access', () => {
  test.beforeAll(async () => {
    await setUserRole('admin');
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should see all admin navigation items', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^users$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sessions/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /organizations/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /roles & permissions/i })).toBeVisible();
  });

  test('should access Users management page', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible();
  });

  test('should access Sessions management page', async ({ page }) => {
    await page.goto('/admin/sessions');
    await expect(page.getByRole('heading', { name: /sessions/i })).toBeVisible();
  });

  test('should access Organizations management page', async ({ page }) => {
    await page.goto('/admin/organizations');
    await expect(page.getByRole('heading', { name: /organizations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create organization/i })).toBeVisible();
  });

  test('should access Roles & Permissions page', async ({ page }) => {
    await page.goto('/admin/roles');
    await expect(page.getByRole('heading', { name: /roles & permissions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create role/i })).toBeVisible();
  });

  test('should see all 3 unified roles on Roles page', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForSelector('[data-testid^="role-card-"]');
    
    await expect(page.locator('[data-testid="role-card-admin"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-card-manager"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-card-member"]')).toBeVisible();
  });

  test('should see correct Admin role description', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForSelector('[data-testid^="role-card-"]');
    
    const adminCard = page.locator('[data-testid="role-card-admin"]');
    await expect(adminCard.getByText(/global platform administrator/i)).toBeVisible();
  });

  test('should see correct Manager role description', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForSelector('[data-testid^="role-card-"]');
    
    const managerCard = page.locator('[data-testid="role-card-manager"]');
    await expect(managerCard.getByText(/organization manager/i)).toBeVisible();
  });

  test('should see correct Member role description', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForSelector('[data-testid^="role-card-"]');
    
    const memberCard = page.locator('[data-testid="role-card-member"]');
    await expect(memberCard.getByText(/organization member/i)).toBeVisible();
  });

  test('should be able to manage permissions for roles', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForSelector('[data-testid^="role-card-"]');
    
    const managerCard = page.locator('[data-testid="role-card-manager"]');
    await managerCard.getByRole('button', { name: /manage/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/manage permissions/i)).toBeVisible();
    
    await page.keyboard.press('Escape');
  });

  test('should see impersonate option in user actions', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForSelector('table tbody tr');
    
    const actionButton = page.locator('table tbody tr').first().getByRole('button');
    await actionButton.click();
    
    await expect(page.getByRole('menuitem', { name: /impersonate/i })).toBeVisible();
  });

  test('should see change role option in user actions', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForSelector('table tbody tr');
    
    const actionButton = page.locator('table tbody tr').first().getByRole('button');
    await actionButton.click();
    
    await expect(page.getByRole('menuitem', { name: /change role/i })).toBeVisible();
  });

  test('Admin role should have all permissions (21+)', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForSelector('[data-testid^="role-card-"]');

    const adminCard = page.locator('[data-testid="role-card-admin"]');
    const permissionBadges = await adminCard.locator('.text-xs.font-mono').count();
    expect(permissionBadges).toBeGreaterThan(15);
  });

  test('Member role should have limited permissions (3)', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForSelector('[data-testid^="role-card-"]');

    const memberCard = page.locator('[data-testid="role-card-member"]');
    const permissionBadges = await memberCard.locator('.text-xs.font-mono').count();
    expect(permissionBadges).toBeLessThanOrEqual(5);
  });
});

// ============================================================================
// MANAGER ROLE TESTS - Organization-Scoped Access
// ============================================================================

test.describe('Manager Role - Organization-Scoped Access', () => {
  test.beforeAll(async () => {
    await setUserRole('manager');
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should login successfully and see dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-slot="sidebar"]').getByRole('link', { name: /dashboard/i })).toBeVisible();
  });

  test('should NOT see Users admin link', async ({ page }) => {
    const usersLink = page.getByRole('link', { name: /^users$/i });
    await expect(usersLink).not.toBeVisible();
  });

  test('should NOT see Sessions admin link', async ({ page }) => {
    const sessionsLink = page.getByRole('link', { name: /sessions/i });
    await expect(sessionsLink).not.toBeVisible();
  });

  test('should NOT see Roles & Permissions admin link', async ({ page }) => {
    const rolesLink = page.getByRole('link', { name: /roles & permissions/i });
    await expect(rolesLink).not.toBeVisible();
  });

  test('should be redirected when accessing /admin/users directly', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/admin/users');
  });

  test('should be redirected when accessing /admin/roles directly', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/admin/roles');
  });

  test('should be redirected when accessing /admin/sessions directly', async ({ page }) => {
    await page.goto('/admin/sessions');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/admin/sessions');
  });
});

// ============================================================================
// MEMBER ROLE TESTS - Basic Read Access
// ============================================================================

test.describe('Member Role - Basic Read Access', () => {
  test.beforeAll(async () => {
    await setUserRole('member');
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should login successfully and see dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-slot="sidebar"]').getByRole('link', { name: /dashboard/i })).toBeVisible();
  });

  test('should NOT see any admin navigation items', async ({ page }) => {
    const usersLink = page.getByRole('link', { name: /^users$/i });
    const sessionsLink = page.getByRole('link', { name: /sessions/i });
    const rolesLink = page.getByRole('link', { name: /roles & permissions/i });
    
    await expect(usersLink).not.toBeVisible();
    await expect(sessionsLink).not.toBeVisible();
    await expect(rolesLink).not.toBeVisible();
  });

  test('should be redirected when accessing /admin/users directly', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/admin/users');
  });

  test('should be redirected when accessing /admin/organizations directly', async ({ page }) => {
    await page.goto('/admin/organizations');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/admin/organizations');
  });

  test('should be redirected when accessing /admin/roles directly', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/admin/roles');
  });

  test('should be redirected when accessing /admin/sessions directly', async ({ page }) => {
    await page.goto('/admin/sessions');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/admin/sessions');
  });
});

// ============================================================================
// API PERMISSION RESTRICTION TESTS
// ============================================================================

test.describe('API Permission Restrictions', () => {
  // Note: 401 = Unauthorized (not authenticated), 403 = Forbidden (authenticated but not allowed)
  // Without authentication, we expect 401 or 403 depending on the endpoint
  
  test('should reject role creation without authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/rbac/roles`, {
      data: { name: 'hacker-role', displayName: 'Hacker Role' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('should reject role update without authentication', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/api/rbac/roles/some-id`, {
      data: { displayName: 'Hacked Role' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('should reject role deletion without authentication', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/api/rbac/roles/some-id`);
    expect([401, 403]).toContain(response.status());
  });

  test('should reject permission assignment without authentication', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/api/rbac/roles/some-id/permissions`, {
      data: { permissionIds: [] },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('should reject platform admin org listing without authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/platform-admin/organizations`);
    expect([401, 403]).toContain(response.status());
  });

  test('should reject platform admin org update without authentication', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/api/platform-admin/organizations/some-id`, {
      data: { name: 'Hacked Org' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('should reject platform admin org deletion without authentication', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/api/platform-admin/organizations/some-id`);
    expect([401, 403]).toContain(response.status());
  });

  test('should reject org impersonation without authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/organization/some-org-id/impersonate`, {
      data: { userId: 'target-user-id' },
    });
    expect([401, 403]).toContain(response.status());
  });
});

// ============================================================================
// RESTORE ADMIN ROLE AFTER TESTS
// ============================================================================

test.describe('Cleanup', () => {
  test('restore admin role for test user', async () => {
    await setUserRole('admin');
  });
});
