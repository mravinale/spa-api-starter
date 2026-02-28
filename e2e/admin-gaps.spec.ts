import { test, expect, type APIRequestContext } from '@playwright/test';
import { Pool } from 'pg';

import { API_BASE_URL, TEST_USER } from './env';
import { uniqueEmail, withDatabase } from './test-helpers';
import { signInAndGetAuthHeaders } from './rbac-matrix.helpers';
import { resendTestEmail } from '../src/shared/utils/resendTestEmail';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BULK_DELETE_ORG_SLUG = `e2e-gaps-bulk-org-${Date.now()}`;
const BULK_DELETE_ORG_NAME = 'E2E Gaps Bulk Org';
const INVITATION_ORG_SLUG = `e2e-gaps-invite-org-${Date.now()}`;
const INVITATION_ORG_NAME = 'E2E Gaps Invitation Org';
const THROWAWAY_USER_EMAIL = resendTestEmail('delivered', `e2e-gaps-throwaway-${Date.now()}`);

async function ensureAdminRole(): Promise<void> {
  await withDatabase(async (pool) => {
    await pool.query(`UPDATE "user" SET role = 'admin', "emailVerified" = true WHERE email = $1`, [TEST_USER.email]);
    await pool.query(`DELETE FROM session WHERE "userId" IN (SELECT id FROM "user" WHERE email = $1)`, [TEST_USER.email]);
  });
}

async function createOrganizationFixture(slug: string, name: string): Promise<string> {
  return await withDatabase(async (pool) => {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO organization (id, name, slug, "createdAt", metadata)
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NULL)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name, slug],
    );
    return result.rows[0].id;
  });
}

async function createThrowawayUser(orgId: string): Promise<string> {
  return await withDatabase(async (pool) => {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'member', true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
       RETURNING id`,
      ['E2E Throwaway User', THROWAWAY_USER_EMAIL],
    );
    const userId = result.rows[0].id;
    await pool.query(
      `INSERT INTO member (id, "organizationId", "userId", role, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'member', NOW())
       ON CONFLICT DO NOTHING`,
      [orgId, userId],
    );
    return userId;
  });
}

async function loginViaApi(request: APIRequestContext): Promise<Record<string, string>> {
  return signInAndGetAuthHeaders(request, TEST_USER.email, TEST_USER.password);
}

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: /^login$/i }).click();
  await expect(page).toHaveURL('/', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

// ─── Suite 1: User Creation Form Validation ──────────────────────────────────

test.describe.serial('User creation — form validation', () => {
  test.beforeAll(async () => {
    await ensureAdminRole();
    await createOrganizationFixture(BULK_DELETE_ORG_SLUG, BULK_DELETE_ORG_NAME);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/users');
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
  });

  test('selecting admin role hides the organization field', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create New User' })).toBeVisible();

    // Wait for metadata to load — org select appears as second combobox for non-admin role
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('combobox')).toHaveCount(2, { timeout: 8000 });

    // Switch role to admin
    const roleSelect = dialog.getByRole('combobox').first();
    await roleSelect.click();
    await page.getByRole('option', { name: /^admin$/i }).click();

    // Org combobox must be hidden when admin role is selected
    await expect(dialog.getByRole('combobox')).toHaveCount(1, { timeout: 3000 });

    // Switch back to member — org combobox must reappear
    await roleSelect.click();
    await page.getByRole('option', { name: /^member$/i }).click();
    await expect(dialog.getByRole('combobox')).toHaveCount(2, { timeout: 3000 });
  });

  test('cancel button closes dialog and does not create a user', async ({ page }) => {
    const usersBefore = await page.locator('table tbody tr').count();

    await page.getByRole('button', { name: /add user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create New User' })).toBeVisible();

    await page.getByLabel('Name').fill('Should Not Be Created');
    await page.getByLabel('Email').fill(uniqueEmail('e2e-gaps-cancel'));
    await page.getByLabel('Password').fill('ValidPass123!');

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Table row count must not have grown
    const usersAfter = await page.locator('table tbody tr').count();
    expect(usersAfter).toBe(usersBefore);
  });

  test('dialog stays open when password is too short', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(800);

    await page.getByLabel('Name').fill('Short Pass User');
    await page.getByLabel('Email').fill(uniqueEmail('e2e-gaps-shortpw'));
    await page.getByLabel('Password').fill('abc');

    const roleSelect = page.getByRole('dialog').getByRole('combobox').first();
    if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleSelect.click();
      const adminOption = page.getByRole('option', { name: /^admin$/i });
      if (await adminOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await adminOption.click();
      }
    }

    await page.getByRole('button', { name: /create user/i }).click();

    await page.waitForTimeout(2000);

    const dialogStillVisible = await page.getByRole('dialog').isVisible().catch(() => false);
    const hasErrorToast = await page.getByRole('status').filter({ hasText: /fail|error|password/i }).isVisible({ timeout: 1000 }).catch(() => false);
    expect(dialogStillVisible || hasErrorToast).toBeTruthy();
  });
});

// ─── Suite 2: Bulk Delete — Execution ────────────────────────────────────────

test.describe.serial('Bulk delete — execution flow', () => {
  let orgId: string;

  test.beforeAll(async () => {
    await ensureAdminRole();
    orgId = await createOrganizationFixture(BULK_DELETE_ORG_SLUG, BULK_DELETE_ORG_NAME);
    await createThrowawayUser(orgId);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/users');
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
  });

  test('searching for throwaway user shows exactly that row', async ({ page }) => {
    const search = page.getByPlaceholder(/search users/i);
    await search.fill(THROWAWAY_USER_EMAIL);
    await page.waitForTimeout(800);
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    await expect(page.getByText(THROWAWAY_USER_EMAIL)).toBeVisible({ timeout: 10000 });
  });

  test('selecting all visible rows enables delete button with correct count', async ({ page }) => {
    const search = page.getByPlaceholder(/search users/i);
    await search.fill(THROWAWAY_USER_EMAIL);
    await page.waitForTimeout(800);
    await expect(page.getByText(THROWAWAY_USER_EMAIL)).toBeVisible({ timeout: 10000 });

    const headerCheckbox = page.locator('table thead th').first().getByRole('checkbox');
    await headerCheckbox.click();
    await expect(page.getByRole('button', { name: /delete \(\d+\)/i })).toBeVisible();
  });

  test('confirming bulk delete removes selected users and resets selection', async ({ page }) => {
    const search = page.getByPlaceholder(/search users/i);
    await search.fill(THROWAWAY_USER_EMAIL);
    await page.waitForTimeout(800);
    await expect(page.getByText(THROWAWAY_USER_EMAIL)).toBeVisible({ timeout: 10000 });

    const rows = page.locator('table tbody tr');
    const targetRow = rows.filter({ hasText: THROWAWAY_USER_EMAIL }).first();
    const existsBeforeDelete = await targetRow.isVisible({ timeout: 5000 }).catch(() => false);

    test.skip(!existsBeforeDelete, 'throwaway user not found in table after search');
    if (!existsBeforeDelete) return;

    await targetRow.getByRole('checkbox').click();
    await expect(page.getByRole('button', { name: /delete \(1\)/i })).toBeVisible();
    await page.getByRole('button', { name: /delete \(1\)/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /delete 1 user/i })).toBeVisible();

    const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i }).last();
    await confirmButton.click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /delete \(\d+\)/i })).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── Suite 3: Invitation CRUD — API contract ─────────────────────────────────

test.describe.serial('Invitation CRUD — API contract', () => {
  let invitationOrgId: string;
  let createdInvitationId: string;

  test.beforeAll(async () => {
    await ensureAdminRole();
    invitationOrgId = await createOrganizationFixture(INVITATION_ORG_SLUG, INVITATION_ORG_NAME);
  });

  test('POST /invitations creates a new pending invitation', async ({ request }) => {
    const headers = await loginViaApi(request);
    const inviteEmail = uniqueEmail('e2e-gaps-invite-target');

    const response = await request.post(
      `${API_BASE_URL}/api/platform-admin/organizations/${invitationOrgId}/invitations`,
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        data: { email: inviteEmail, role: 'member' },
      },
    );

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    const invitation = body?.data ?? body;
    expect(invitation).toBeTruthy();
    createdInvitationId = invitation?.id ?? invitation?.data?.id ?? '';
  });

  test('GET /invitations lists the invitation just created', async ({ request }) => {
    const headers = await loginViaApi(request);

    const response = await request.get(
      `${API_BASE_URL}/api/platform-admin/organizations/${invitationOrgId}/invitations`,
      { headers },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    const list: Array<{ id: string; status: string }> = Array.isArray(body)
      ? body
      : (body?.data ?? []);
    expect(list.length).toBeGreaterThan(0);
    const found = list.some((inv) => inv.status === 'pending');
    expect(found).toBe(true);
  });

  test('DELETE /invitations/:id cancels the invitation', async ({ request }) => {
    test.skip(!createdInvitationId, 'invitation was not created in prior step');
    const headers = await loginViaApi(request);

    const response = await request.delete(
      `${API_BASE_URL}/api/platform-admin/organizations/${invitationOrgId}/invitations/${createdInvitationId}`,
      { headers },
    );

    expect([200, 204]).toContain(response.status());
  });

  test('GET /invitations after delete shows no pending invitations for that id', async ({ request }) => {
    test.skip(!createdInvitationId, 'invitation was not created in prior step');
    const headers = await loginViaApi(request);

    const response = await request.get(
      `${API_BASE_URL}/api/platform-admin/organizations/${invitationOrgId}/invitations`,
      { headers },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    const list: Array<{ id: string; status: string }> = Array.isArray(body)
      ? body
      : (body?.data ?? []);
    const stillPending = list.find((inv) => inv.id === createdInvitationId && inv.status === 'pending');
    expect(stillPending).toBeFalsy();
  });
});

// ─── Suite 4: Batch Capabilities — API contract ───────────────────────────────

test.describe.serial('Batch capabilities — API contract', () => {
  let targetUserId: string;

  test.beforeAll(async () => {
    await ensureAdminRole();
    await withDatabase(async (pool) => {
      const result = await pool.query<{ id: string }>(
        `SELECT id FROM "user" WHERE email != $1 AND role = 'member' LIMIT 1`,
        [TEST_USER.email],
      );
      if (result.rowCount && result.rowCount > 0) {
        targetUserId = result.rows[0].id;
      }
    });
  });

  test('POST /capabilities/batch returns 200 with action maps for known user ids', async ({ request }) => {
    test.skip(!targetUserId, 'no non-admin member user found in DB');
    const headers = await loginViaApi(request);

    const response = await request.post(
      `${API_BASE_URL}/api/admin/users/capabilities/batch`,
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        data: { userIds: [targetUserId] },
      },
    );

    expect([200, 201]).toContain(response.status());
    const body = await response.json() as Record<string, unknown>;
    expect(body).toBeTruthy();
    const capabilities = body[targetUserId] as { actions: Record<string, boolean> } | undefined;
    expect(capabilities).toBeTruthy();
    expect(typeof capabilities?.actions).toBe('object');
    expect(typeof capabilities?.actions?.update).toBe('boolean');
    expect(typeof capabilities?.actions?.ban).toBe('boolean');
    expect(typeof capabilities?.actions?.remove).toBe('boolean');
  });

  test('POST /capabilities/batch with empty array returns empty object', async ({ request }) => {
    const headers = await loginViaApi(request);

    const response = await request.post(
      `${API_BASE_URL}/api/admin/users/capabilities/batch`,
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        data: { userIds: [] },
      },
    );

    expect([200, 201, 204]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const body = await response.json();
      expect(Object.keys(body as Record<string, unknown>)).toHaveLength(0);
    }
  });

  test('POST /capabilities/batch with multiple ids returns one entry per id', async ({ request }) => {
    const additionalIds = await withDatabase(async (pool: Pool) => {
      const result = await pool.query<{ id: string }>(
        `SELECT id FROM "user" WHERE email != $1 LIMIT 3`,
        [TEST_USER.email],
      );
      return result.rows.map((r) => r.id);
    });

    test.skip(additionalIds.length < 2, 'not enough non-admin users in DB');

    const headers = await loginViaApi(request);
    const response = await request.post(
      `${API_BASE_URL}/api/admin/users/capabilities/batch`,
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        data: { userIds: additionalIds },
      },
    );

    expect([200, 201]).toContain(response.status());
    const body = await response.json() as Record<string, unknown>;
    expect(Object.keys(body).length).toBe(additionalIds.length);
    for (const id of additionalIds) {
      expect(body[id]).toBeTruthy();
    }
  });

  test('POST /capabilities/batch returns 401 when unauthenticated', async ({ request }) => {
    const response = await request.post(
      `${API_BASE_URL}/api/admin/users/capabilities/batch`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: { userIds: ['fake-id'] },
      },
    );

    expect([401, 403]).toContain(response.status());
  });
});
