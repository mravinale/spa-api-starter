# Manager Organization-Creation Permission Sync Plan

**Date:** 2026-02-18
**Scope:** frontend (`spa-api-starter`) + backend (`nestjs-api-starter`)
**Goal:** Managers can create organizations **only when explicitly granted** `organization:create`; all other manager organization actions remain restricted to their own active organization.

---

## 1) Policy to enforce (source of truth)

1. `organization:create` is an explicit permission.
2. Managers:
   - can create organizations only if they have `organization:create`.
   - for non-create organization actions (list/get/members/invitations/member-role changes), can only act in their active organization.
3. Admins retain global organization permissions.
4. Frontend visibility and action enablement must match backend authorization decisions.

---

## 2) Root-cause analysis

## Root cause A — FE organization creation bypasses backend RBAC guard path

- Frontend currently calls Better Auth client directly for create:
  - `organization.create(...)` in admin org page service path (`spa-api-starter/src/features/Admin/services/adminService.ts`).
  - `organization.create(...)` in global org switcher (`spa-api-starter/src/shared/components/OrganizationSwitcher.tsx`).
- These paths do **not** pass through backend custom controller endpoints guarded by `@RequirePermissions(...)` in `PermissionsGuard`.

**Impact:** toggling `organization:create` in role-permissions UI may not control actual org creation behavior.

## Root cause B — Backend has two permission systems with drift risk

- Better Auth role statements are configured in `nestjs-api-starter/src/permissions.ts` and wired in `nestjs-api-starter/src/auth.ts`.
- Custom API authorization is enforced via DB-backed `role_permissions` in:
  - `nestjs-api-starter/src/common/guards/permissions.guard.ts`
  - seeded in `nestjs-api-starter/src/rbac/rbac.migration.ts`
- `platform-admin` organization controller enforces own-org constraints for managers, but has no create endpoint currently (`nestjs-api-starter/src/platform-admin/controllers/admin-organizations.controller.ts`).

**Impact:** `organization:create` can behave inconsistently depending on which path is used.

## Root cause C — FE shows create actions without capability gating

- Admin Organizations page always renders "Create Organization" button.
- OrganizationSwitcher always exposes "Create Organization" action.

**Impact:** UI suggests permission even when backend policy should deny.

---

## 3) Target architecture (synchronized FE/BE)

1. **Single effective server-side gate for org creation** using `organization:create`.
2. **Single creation entrypoint used by frontend** (no direct unguarded creation path).
3. **Shared permission contract** between Better Auth roles and DB `role_permissions` seed.
4. **Frontend create-action rendering derived from backend permission/capability** (deny-by-default until loaded).

---

## 4) Implementation plan (TDD-first)

## Phase 0 — Freeze policy and acceptance criteria

- Confirm with product/security:
  1. managers without `organization:create` must be denied with `403`.
  2. managers with `organization:create` can create orgs.
  3. existing own-org restrictions remain for non-create org operations.

**Deliverable:** approved policy matrix in docs.

## Phase 1 — Backend: enforce explicit `organization:create` for create flow

1. Add explicit backend creation gate path (recommended: guarded API route) OR enforce equivalent permission in Better Auth organization-create path.
2. Ensure managers require `organization:create` for creation.
3. Keep manager own-org restrictions unchanged for existing routes (list/get/members/invite/member updates).

**Tests first:**
- Controller/service tests:
  - manager + permission -> create succeeds.
  - manager without permission -> `403`.
  - admin -> create succeeds.
- Regression tests for existing manager own-org restrictions.

## Phase 2 — Backend: eliminate permission-source drift

1. Introduce canonical role-permission policy module.
2. Generate both:
   - Better Auth role statements (`permissions.ts`)
   - RBAC seed assignments (`rbac.migration.ts`)
   from canonical policy.

**Tests first:**
- Parity tests validating canonical matrix equals seeded `role_permissions` + Better Auth role statements.

## Phase 3 — Frontend: consume guarded creation path and gate UI

1. Replace direct `organization.create` calls in:
   - `src/features/Admin/services/adminService.ts`
   - `src/shared/components/OrganizationSwitcher.tsx`
   with the guarded backend path from Phase 1.
2. Add permission-aware rendering:
   - hide/disable create organization CTA when `organization:create` is missing.
   - deny-by-default until permissions resolve.
3. Keep org-scoped operations bound to active org context.

**Tests first:**
- Component tests for CTA visibility/disabled state by permission.
- API client tests for guarded endpoint handling.

## Phase 4 — E2E synchronization coverage

Add/extend scenarios:
1. Manager without `organization:create`:
   - no create CTA
   - direct API attempt -> `403`
2. Manager with `organization:create`:
   - can create organization
3. Manager non-create operations remain scoped to own org:
   - accessing another org endpoints -> `403`

## Phase 5 — Full verification gate

Run full suites after changes:
- Backend: `npm test` + `npm run test:e2e`
- Frontend: `npm test` + `npm run test:e2e`

No release until all green.

---

## 5) Acceptance criteria

1. `organization:create` controls manager org creation behavior end-to-end.
2. FE and BE both enforce the same create policy (no hidden bypass path).
3. Manager non-create org actions are restricted to own active org only.
4. Permission matrix remains consistent across Better Auth config and DB RBAC seed.
5. Unit + E2E coverage exists for allowed + forbidden paths.

---

## 6) Risks and mitigations

1. **Risk:** accidental lockout for valid manager workflows.
   - **Mitigation:** feature-flag rollout or staged deploy with E2E matrix checks.
2. **Risk:** policy drift reintroduced by future edits.
   - **Mitigation:** canonical matrix + parity tests in CI.
3. **Risk:** UI briefly over-permissive while permissions load.
   - **Mitigation:** deny-by-default render strategy.

---

## 7) Execution order (minimal-diff)

1. Backend create gate + tests.
2. Canonical permission parity + tests.
3. Frontend create-path migration + UI gating + tests.
4. E2E matrix updates.
5. Full-suite verification.
