# RBAC Permissions Audit and Deep Fix Plan (v2)

**Projects audited**
- Frontend: `spa-api-starter`
- Backend: `nestjs-api-starter`

**Date**: 2026-02-19 (v2 — deep review update)
**Author**: Cascade audit
**Scope**: Verify whether permissions are truly restricted on frontend and backend, whether explicit validation exists on both sides, and whether roles are correctly grouped/assigned.

---

## 1) Executive summary

### Final verdict
1. **Backend restrictions are layered and enforceable** — guards + service-level policy + DB-backed role/permission checks.
2. **Frontend restrictions are UX-level gates** — routes, menus, action visibility — generally aligned, not the source of truth.
3. **Critical drift exists** between Better Auth role statements (`permissions.ts`), DB-seeded `role_permissions` used by `PermissionsGuard`, and the test helper seeding — **managers are silently blocked from operations the service layer is coded to allow**.
4. **E2E tests mask the drift** with `expect([201, 403])` assertions that accept both success and denial.
5. **Guard inconsistency**: `AdminUsersController` omits `RolesGuard`, unlike the other two controllers.

### Confidence
- **Audit confidence**: **0.95** (high — every authorization path traced end-to-end with precise drift matrix).
- **Post-fix target confidence**: **0.97+** after parity alignment + deterministic test assertions.

---

## 2) Evidence index (key files reviewed)

### Backend (`nestjs-api-starter`)
| Area | Files |
|---|---|
| Permission guard | `src/common/guards/permissions.guard.ts` |
| Role guard | `src/common/guards/roles.guard.ts`, `roles.guard.spec.ts` |
| RBAC controller | `src/rbac/rbac.controller.ts`, `rbac.controller.spec.ts` |
| Admin user management | `src/admin/admin.controller.ts`, `admin.service.ts`, `admin.service.spec.ts`, `admin.controller.spec.ts` |
| Admin utilities | `src/admin/admin.utils.ts` |
| Better Auth role defs | `src/permissions.ts`, `src/auth.ts` |
| DB seed/migration | `src/rbac/rbac.migration.ts` |
| Platform org management | `src/platform-admin/controllers/admin-organizations.controller.ts`, `admin-organizations.controller.spec.ts` |
| Platform org service | `src/platform-admin/services/admin-organizations.service.ts`, `admin-organizations.service.spec.ts` |
| E2E tests + helpers | `test/admin.e2e-spec.ts`, `test/test-helpers.ts` |

### Frontend (`spa-api-starter`)
| Area | Files |
|---|---|
| Route guards | `src/app/views/AppRoutes.tsx`, `src/shared/components/AdminRoute.tsx`, `AdminOnlyRoute.tsx`, `ProtectedRoute.tsx` |
| Auth context | `src/shared/context/AuthContext.tsx` |
| User page + capabilities | `src/features/Admin/views/UsersPage.tsx` |
| Admin service | `src/features/Admin/services/adminService.ts` |
| Org page + role filtering | `src/features/Admin/views/OrganizationsPage.tsx` |
| Role hierarchy utility | `src/features/Admin/utils/role-hierarchy.ts`, `role-hierarchy.test.ts` |
| Roles page | `src/features/Admin/views/RolesPage.tsx` |
| E2E suites | `e2e/guards.spec.ts`, `e2e/roles-visibility-rules.spec.ts`, `e2e/rbac-unified-roles.spec.ts` |

---

## 3) Current-state analysis

### 3.1 Backend: layered but inconsistent authorization

#### A) Guard configuration per controller

| Controller | Guards | Class-level `@Roles` |
|---|---|---|
| `AdminUsersController` | `PermissionsGuard` only | **None** (uses manual `requireAdminOrManager` in handlers) |
| `RbacController` | `RolesGuard` + `PermissionsGuard` | `@Roles('admin', 'manager')` |
| `AdminOrganizationsController` | `RolesGuard` + `PermissionsGuard` | `@Roles('admin', 'manager')` |

**Issue**: `AdminUsersController` is the only controller missing `RolesGuard`. A `member` with `user:read` DB permission (which they have) passes `PermissionsGuard` for read endpoints, then gets rejected inside the handler by `requireAdminOrManager`. This works but is inconsistent — the error comes from the handler, not the guard boundary.

#### B) PermissionsGuard behavior
- Checks `role_permissions` DB table for the user's role.
- **Admin bypass**: `if (userRole === 'admin') return true;` — skips DB check entirely.
- **No caching**: runs a JOIN query on every request.
- **No unit test file** (`permissions.guard.spec.ts` does not exist).

#### C) Service-level defense in depth
- `AdminService.assertTargetActionAllowed`: prevents admin-on-admin, manager-on-non-member, self-actions where prohibited.
- `AdminService.assertUserInManagerOrg`: scopes manager operations to their active org.
- `AdminOrganizationsService.updateMemberRole/removeMember`: prevents manager from touching non-member roles, prevents removal of last admin.
- `getAllowedRoleNamesForCreator`: restricts which roles each platform role can assign.

#### D) Explicit payload validation
- Controllers validate required fields, allowed role enums (`admin|manager|member`), password policy, pagination bounds, slug format, email format.

**Conclusion**: Backend is security-grade in depth, but the guard layer has inconsistencies and drift that weaken it.

---

### 3.2 Frontend: solid UX gating, secondary to backend

#### A) Route protection
- `ProtectedRoute` — blocks unauthenticated users.
- `AdminRoute` — allows `admin|manager` to `/admin/*`.
- `AdminOnlyRoute` — allows only `admin` (used for some but not all admin routes).

#### B) Capability-driven actions
- `UsersPage` fetches per-user `getUserCapabilities` from backend, gates action buttons accordingly.
- Falls back to `getFallbackUserActions` while capabilities load (permissive fallback).

#### C) Role assignment from backend metadata
- Create-user dialog: uses `allowedRoleNames` from backend `getCreateUserMetadata`.
- Org member role dropdowns: uses `assignableRoles` from backend `roles-metadata` + frontend `filterAssignableRoles`.

**Conclusion**: Frontend is well-structured but has a permissive fallback window and some route policy ambiguity.

---

### 3.3 Role grouping quality — duplication creates drift

Role-permission logic is defined in **4 separate places**:

1. Better Auth role statements (`nestjs: src/permissions.ts`)
2. DB seed matrix (`nestjs: src/rbac/rbac.migration.ts`)
3. Backend test helper seed (`nestjs: test/test-helpers.ts`)
4. Frontend role hierarchy (`spa: src/features/Admin/utils/role-hierarchy.ts`)

---

## 4) Findings and risk ranking

## CRITICAL severity

### C1 — Manager silently blocked from user:create, user:set-role, user:set-password, user:delete

**Root cause**: `PermissionsGuard` checks DB `role_permissions`, but the DB seed does NOT grant these to the manager role.

**Precise drift matrix for `manager` role:**

| Permission | `permissions.ts` (Better Auth) | DB seed (`rbac.migration.ts`) | Test helper seed (`test-helpers.ts`) | `@RequirePermissions` usage |
|---|---|---|---|---|
| `user:create` | ✅ (as `create`) | ❌ | ❌ | `POST /api/admin/users` |
| `user:read` | — (BA uses `list`/`get`) | ✅ | ✅ | `GET /api/admin/users`, `GET .../capabilities`, `GET .../create-metadata` |
| `user:update` | ✅ | ✅ | ✅ | `PUT /api/admin/users/:id` |
| `user:ban` | ✅ | ✅ | ✅ | `POST .../ban`, `POST .../unban` |
| `user:set-role` | ✅ | ❌ | ❌ | `PUT .../role` |
| `user:set-password` | ✅ | ❌ | ❌ | `POST .../password` |
| `user:delete` | — (not in BA) | ❌ | ❌ | `DELETE /api/admin/users/:id`, `POST .../bulk-delete` |
| `user:impersonate` | — (not in BA) | ❌ | ❌ | (not gated by `@RequirePermissions`) |
| `session:read` | — (BA uses `list`) | ✅ | ✅ | `GET .../sessions` |
| `session:revoke` | ✅ | ✅ | ✅ | `POST .../revoke`, `POST .../revoke-all` |
| `organization:create` | ✅ | ✅ | ❌ | `POST /api/platform-admin/organizations` |
| `organization:read` | — (BA uses `list`/`get`) | ✅ | ✅ | `GET /api/platform-admin/organizations/*` |
| `organization:update` | ✅ | ✅ | ✅ | `PUT /api/platform-admin/organizations/:id` |
| `organization:invite` | ✅ | ✅ | ✅ | `POST .../invitations`, `POST .../members`, etc. |
| `role:read` | — (BA uses `list`/`get`) | ✅ | ✅ | `GET /api/rbac/roles`, `GET .../permissions` |

**Impact**: The service layer (`admin.service.ts`, `admin.utils.ts`) is coded to allow managers to create users and set roles. `getAllowedRoleNamesForCreator('manager')` returns `['manager', 'member']`. But the `PermissionsGuard` rejects the request before it ever reaches the service layer.

**E2E evidence**: `test/admin.e2e-spec.ts` line 242:
```typescript
// Manager may get 403 if not properly set up - accept both
expect([201, 403]).toContain(res.status);
```
This assertion **can never fail** for these HTTP statuses, masking the actual policy.

---

## HIGH severity

### H1 — Action vocabulary mismatch between Better Auth and DB

**Observation**: Better Auth uses granular `list`/`get` actions. The DB permissions table uses consolidated `read` action. The `PermissionsGuard` checks DB-style names (e.g., `user:read`).

**Examples**:
- BA manager: `user: ["create", "list", "get", "update", "ban", "set-role", "set-password"]`
- DB manager: `user:read`, `user:update`, `user:ban`
- BA: `session: ["list", "revoke"]` → DB: `session:read`, `session:revoke`
- BA: `role: ["list", "get"]` → DB: `role:read`

**Risk**: Two overlapping but incompatible permission vocabularies. Makes it impossible to reason about what a role can do without checking both systems.

### H2 — `AdminUsersController` missing `RolesGuard` (inconsistency)

**Observation**: The two other admin controllers use `@UseGuards(RolesGuard, PermissionsGuard)` with `@Roles('admin', 'manager')`. `AdminUsersController` only uses `@UseGuards(PermissionsGuard)` and relies on manual `requireAdminOrManager` inside each handler.

**Impact**: A `member` user with `user:read` in DB (which they have) passes `PermissionsGuard` for `GET /api/admin/users` and `GET .../create-metadata`. They're then caught by `requireAdminOrManager` in the handler body. This produces a `ForbiddenException` with message `'Admin access required'` instead of the guard-level `'Access denied. Required role: admin or manager'`.

**Risk**: Inconsistent error messages, defense-in-depth gap (if a handler forgets to call `requireAdminOrManager`, member access would succeed for any endpoint requiring only `user:read`).

### H3 — E2E tests mask policy with non-deterministic assertions

**Observation**: Backend E2E test `admin.e2e-spec.ts` line 242 accepts either `201` or `403` for manager user creation. This means the test suite passes regardless of whether the drift is fixed or not.

**Risk**: Regressions will never be caught. Policy changes go undetected.

---

## MEDIUM severity

### M1 — `/admin/roles` route uses `AdminRoute` (admin+manager) while `AdminOnlyRoute` exists

**Observation**: Current E2E tests expect manager to access the page with reduced controls (no create button, only sees member role). This is an intentional design decision, but it's not explicitly documented.

**Risk**: Policy ambiguity if product expectations change.

### M2 — `UsersPage` permissive fallback capability logic

**Observation**: `getFallbackUserActions` (lines 65-88 of UsersPage.tsx) grants actions based on coarse role rules before the backend `getUserCapabilities` response arrives. For example, a manager sees "Change Role" on member rows immediately, even though `PermissionsGuard` would block `user:set-role` for managers due to the drift (C1).

**Risk**: Users see action buttons, click them, and get 403 errors.

### M3 — Duplicate role hierarchy logic across FE and BE

**Observation**: Nearly identical `ROLE_HIERARCHY`, `getRoleLevel`, and `filterAssignableRoles` exist in:
- Backend: `src/platform-admin/services/admin-organizations.service.ts` (lines 33-55)
- Frontend: `src/features/Admin/utils/role-hierarchy.ts` (lines 1-28)

**Risk**: If one side changes and the other doesn't, assignability behavior diverges.

### M4 — `organization:create` missing from test helper seed

**Observation**: `test-helpers.ts` `ensureDefaultRolePermissions` does not seed `organization:create` for manager. The DB migration DOES seed it. This means E2E tests run against a different permission set than production.

**Risk**: Tests pass but production behavior differs. Manager organization creation may work in production but not in E2E (or vice versa).

### M5 — No `PermissionsGuard` unit test file

**Observation**: `permissions.guard.spec.ts` does not exist. `RolesGuard` has a full spec, but the permission guard (which is more complex — async, DB-dependent) has zero unit test coverage.

**Risk**: Guard logic changes could introduce regressions without detection.

---

## LOW severity

### L1 — Placeholder `hasPermission` in frontend admin service

**Observation**: `adminService.hasPermission` (lines 417-447) returns `false` for all non-admin users with comment `"For now, return false for non-admin users"`. Not currently called by any app flow.

**Risk**: If used later by mistake, produces incorrect policy.

### L2 — `PermissionsGuard` queries DB on every request (no caching)

**Observation**: `getUserPermissions` runs a 3-table JOIN on every guarded request. Role permissions change rarely.

**Risk**: Performance concern under high traffic. Not a security issue.

---

## 5) Deep remediation plan (TDD-first, minimal diff, high confidence)

## Phase 0 — Lock policy expectations (decision checkpoint, no code)

### Goal
Freeze expected manager permissions before writing any code.

### Required decisions
1. **Manager user management scope**: Should managers be able to create users, set roles, set passwords, and delete users (within their org), or are those admin-only?
   - **If yes** → add `user:create`, `user:set-role`, `user:set-password`, `user:delete` to manager DB seed
   - **If no** → remove manager handling from service layer + simplify `getAllowedRoleNamesForCreator`
2. **`/admin/roles` page**: admin-only or admin+manager with restrictions?
3. **Permission vocabulary**: Unified `read` (current DB style) or split into `list`/`get` (Better Auth style)?

### Deliverable
- Approved permissions matrix in this document (section 4, table from C1).

---

## Phase 1 — Align DB seed with approved policy (fixes C1, H1, M4)

### Goal
Make DB `role_permissions` match the approved manager/member policy exactly.

### Implementation
1. **Update `src/rbac/rbac.migration.ts`**: add a new tracked migration `rbac_004_align_manager_permissions` that:
   - Adds missing permissions for manager (e.g., `user:create`, `user:set-role`, `user:set-password`, `user:delete` — if approved in Phase 0)
   - Or removes manager-handling code from services if decision is admin-only
2. **Update `test/test-helpers.ts` `ensureDefaultRolePermissions`**: mirror exact same set as the migration.
3. **Update `src/permissions.ts`**: align Better Auth statements to use the same action names as DB (or vice versa), resolving the vocabulary mismatch.

### Tests first (must fail first)
- New `rbac.migration.spec.ts` parity test: assert that manager DB permissions match a canonical constant.
- Update `admin.e2e-spec.ts` line 242: replace `expect([201, 403])` with **deterministic** `expect(201)` or `expect(403)` based on approved policy.

### Expected outcome
- Single source of truth for permissions.
- E2E tests that actually catch regressions.

---

## Phase 2 — Add `RolesGuard` to `AdminUsersController` (fixes H2)

### Goal
Consistent guard configuration across all admin controllers.

### Implementation
1. Add `RolesGuard` to `AdminUsersController`:
   ```typescript
   @Controller('api/admin/users')
   @UseGuards(RolesGuard, PermissionsGuard)
   @Roles('admin', 'manager')
   ```
2. Keep `requireAdminOrManager` calls as defense-in-depth (they also extract the role for downstream logic).

### Tests first
- Verify member gets guard-level rejection (not handler-level).
- Existing admin/manager tests continue to pass.

### Expected outcome
- Members blocked at guard boundary.
- Consistent error messages across all admin APIs.

---

## Phase 3 — Add `PermissionsGuard` unit tests (fixes M5)

### Goal
Test coverage for the most critical guard in the system.

### Implementation
Create `src/common/guards/permissions.guard.spec.ts` covering:
- No required permissions → allow.
- No session → `ForbiddenException('Authentication required')`.
- Admin role → bypass DB check, allow.
- Role with all required permissions → allow.
- Role missing a permission → `ForbiddenException` with missing permission names.
- Unknown role with no DB permissions → deny.

### Tests first
- Write spec, run, confirm it passes against current implementation.

---

## Phase 4 — Fix deterministic E2E assertions (fixes H3)

### Goal
Remove non-deterministic test assertions that mask policy.

### Implementation
1. **Backend `test/admin.e2e-spec.ts`**: Replace `expect([201, 403])` with exact expected status based on approved policy.
2. **Add explicit manager permission tests**:
   - Manager creates member → expect `201` (if approved) or `403` (if admin-only)
   - Manager sets role → expect `200` or `403`
   - Manager sets password → expect `201` or `403`
   - Manager deletes user → expect `200` or `403`
3. **Frontend `e2e/rbac-unified-roles.spec.ts`**: Ensure manager action visibility matches backend capabilities exactly.

### Expected outcome
- Any future drift immediately caught.

---

## Phase 5 — Fix frontend permissive fallback (fixes M2)

### Goal
Prevent transient UI over-permission before capability API resolves.

### Implementation
- In `UsersPage`, replace `getFallbackUserActions` with **deny-by-default**:
  ```typescript
  // While loading, deny all mutating actions
  const loadingActions = { update: false, setRole: false, ban: false, ... };
  return [user.id, queryResult?.data?.actions ?? loadingActions];
  ```
- Optionally show loading/skeleton state for action menu cells.

### Tests first
- Unit test: fallback returns all-false.
- E2E: verify no stale action buttons visible before capability loads.

---

## Phase 6 — Tighten route semantics for roles page (fixes M1, if needed)

### Implementation per decision
- **If admin-only**: change `<AdminRoute>` → `<AdminOnlyRoute>` for `/admin/roles` in `AppRoutes.tsx`. Update E2E.
- **If admin+manager**: keep current, add explicit documentation comment.

---

## Phase 7 — Reduce FE/BE hierarchy duplication (fixes M3)

### Goal
Frontend should use backend-provided `assignableRoles` as the sole authority.

### Implementation
- `OrganizationsPage` and `UsersPage` already fetch `assignableRoles`/`allowedRoleNames` from backend.
- Remove or deprecate frontend `filterAssignableRoles` usage in favor of backend-provided lists.
- Keep `role-hierarchy.ts` only for display sorting (not for authorization decisions).

---

## 6) Proposed acceptance criteria

1. **C1 resolved**: Manager DB permissions match approved policy. No ambiguous 201/403.
2. **H1 resolved**: Single permission vocabulary across BA and DB.
3. **H2 resolved**: All admin controllers use `RolesGuard` + `PermissionsGuard`.
4. **H3 resolved**: All E2E assertions are deterministic.
5. **M5 resolved**: `PermissionsGuard` has dedicated unit tests.
6. **Regression safety**: Full backend + frontend test suites pass with exact assertions.

---

## 7) Verification checklist

### Static verification
- [ ] Manager DB permissions match approved canonical matrix exactly.
- [ ] `permissions.ts`, `rbac.migration.ts`, and `test-helpers.ts` all reference the same permission set.
- [ ] All 3 admin controllers use `RolesGuard` + `PermissionsGuard` consistently.
- [ ] No `expect([201, 403])` or similar non-deterministic assertions remain.

### Runtime verification
- [ ] Manager can perform approved operations and gets `403` on non-approved ones.
- [ ] Member gets guard-level rejection (`403`) on all `/api/admin/*` and `/api/rbac/*` endpoints.
- [ ] Admin can perform all operations.
- [ ] Frontend action buttons match backend capabilities (no transient over-exposure).

### Test execution
- [ ] Backend `npm test` — all pass.
- [ ] Backend `npm run test:e2e` — all pass with deterministic assertions.
- [ ] Frontend `npm test` — all pass.
- [ ] Frontend `npm run test:e2e` — all pass.

**Confidence gate**: Report **>= 0.97** only when all items checked.

---

## 8) Minimal-diff implementation order (recommended)

| Step | Phase | Files touched | Risk |
|---|---|---|---|
| 1 | P0 | This document | None (decision only) |
| 2 | P1 | `rbac.migration.ts`, `permissions.ts`, `test-helpers.ts` | Medium (permission changes) |
| 3 | P2 | `admin.controller.ts` | Low (additive guard) |
| 4 | P3 | New `permissions.guard.spec.ts` | None (test only) |
| 5 | P4 | `admin.e2e-spec.ts` | Low (assertion tightening) |
| 6 | P5 | `UsersPage.tsx` | Low (UI loading state) |
| 7 | P6 | `AppRoutes.tsx` (conditional) | Low |
| 8 | P7 | `OrganizationsPage.tsx` | Low |

---

## 9) Non-goals

- No retries logic introduced.
- No branch/PR/merge actions in this document.
- No broad refactor outside authorization/role-policy domain.
- No performance optimization of `PermissionsGuard` caching (L2 — deferred).

---

## 10) Final confidence statement

**Audit confidence: 0.95** — every authorization path traced end-to-end with precise drift evidence.

Key risks identified with concrete evidence:
- C1: Manager blocked at guard level for operations service layer supports (proven by E2E ambiguous assertions)
- H1: Two incompatible permission vocabularies in one system
- H2: Inconsistent guard configuration across admin controllers
- H3: Tests that cannot fail masking real policy gaps

After executing phases 0–5 with TDD discipline and passing the full verification gate, confidence should reach **0.97+**.
