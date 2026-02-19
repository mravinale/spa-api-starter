# Test Coverage Plan

> Full-stack test strategy for **nestjs-api-starter** (API) and **spa-api-starter** (SPA).
> Status: Draft | Author: Architecture & QA Review | Date: 2026-02-17

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Phase 1 — API Integration Tests (nestjs-api-starter)](#2-phase-1--api-integration-tests-nestjs-api-starter)
3. [Phase 2 — Missing API Unit Tests](#3-phase-2--missing-api-unit-tests)
4. [Phase 3 — SPA Unit & Component Tests](#4-phase-3--spa-unit--component-tests)
5. [Phase 4 — CI/CD Test Gates](#5-phase-4--cicd-test-gates)
6. [Phase 5 — Coverage Thresholds & Reporting](#6-phase-5--coverage-thresholds--reporting)
7. [Appendix A — File-Level Gap Matrix](#appendix-a--file-level-gap-matrix)
8. [Appendix B — Test Naming Conventions](#appendix-b--test-naming-conventions)

---

## 1. Current State Summary

### Test Inventory

| Metric | nestjs-api-starter | spa-api-starter |
|---|---|---|
| Unit test cases | ~188 | ~57 |
| E2E / Integration test cases | ~47 | ~181 (Playwright) |
| Total | **~235** | **~238** |

### What Is Already Well-Tested

**API (NestJS)**
- `AdminService` — role hierarchy, self-action policies, bulk ops, capabilities (~40 tests)
- `AdminUsersController` — actor context delegation (~8 tests)
- `AdminOrganizationsService` — CRUD, invitations, member management, role hierarchy utils (~30 tests)
- `RoleService` — CRUD, permissions, system role protection (~12 tests)
- `OrgImpersonationService` — impersonate/stop, membership checks, self-impersonation block (~12 tests)
- `RolesGuard` — all branches covered (~9 tests)
- Controller validation specs (admin, rbac, platform-admin)
- Controller metadata specs (RBAC decorator verification)

**SPA (React)**
- Playwright e2e: auth, admin CRUD, RBAC roles, impersonation, guards, API protection, navigation (15 spec files, ~181 tests)
- React Query hooks: `useUsers`, `useOrganizations`, `useRoles` (~30 tests)
- Utilities: `role-hierarchy`, `fetch-with-auth`, `useIsImpersonating` (~27 tests)

### What Is Missing

| Gap | Project | Severity |
|---|---|---|
| **API integration tests with authenticated sessions** | nestjs-api-starter | **Critical** |
| `PermissionsGuard` unit tests | nestjs-api-starter | High |
| `OrgRoleGuard` unit tests | nestjs-api-starter | High |
| `EmailService` unit tests | nestjs-api-starter | Medium |
| `PermissionService` unit tests | nestjs-api-starter | Medium |
| `OrgImpersonationController` unit tests | nestjs-api-starter | Medium |
| `AuthContext` component tests | spa-api-starter | High |
| Route guard component tests (`ProtectedRoute`, `AdminRoute`, etc.) | spa-api-starter | Medium |
| Auth view component tests (`LoginPage`, `SignupPage`, etc.) | spa-api-starter | Low (covered by e2e) |
| `adminService.ts` / `rbacService.ts` unit tests | spa-api-starter | Medium |
| CI test gates (both projects) | Both | **Critical** |

---

## 2. Phase 1 — API Integration Tests (nestjs-api-starter)

> **Goal**: Full authenticated integration tests for every API endpoint, mirroring the Playwright e2e coverage on the SPA side. Use the existing `TestHelpers` infrastructure.

### 2.1 Test Infrastructure Enhancement

**File**: `test/test-helpers.ts` — extend the existing helper with convenience methods.

```
Additions needed:
├── signInAndGetCookie(email, password)    // Sign in existing user (vs signUp)
├── createOrganization(name, slug)         // Already exists ✓
├── addMemberToOrg(userId, orgId, role)    // Already exists ✓
├── setActiveOrganization(userId, orgId)   // Already exists ✓
├── getCookieForRole(role)                 // Convenience: setup + return cookie for admin/manager/member
├── createTestRole(name, displayName)      // Create custom RBAC role via DB
├── assignPermissionsToRole(roleName, permissions[])  // Assign permissions via DB
└── cleanup patterns (per-describe, not just global)
```

### 2.2 New Integration Test Files

#### `test/admin-users.e2e-spec.ts` — Admin User Management (EXPAND existing)

The current `admin.e2e-spec.ts` has good authenticated tests. Expand with:

```
describe('Admin User Management - Full Integration')
├── describe('GET /api/admin/users')
│   ├── [Admin] lists all users with pagination
│   ├── [Admin] filters users by search query
│   ├── [Manager] lists only users in their organization
│   ├── [Member] should return 403
│   └── [Unauthenticated] should return 401                    ✅ exists
│
├── describe('GET /api/admin/users/create-metadata')
│   ├── [Admin] returns all roles + all orgs                   ✅ exists
│   ├── [Manager] returns filtered roles + own org only        ✅ exists
│   └── [Member] should return 403
│
├── describe('POST /api/admin/users')
│   ├── [Admin] creates admin without org                      ✅ exists
│   ├── [Admin] creates manager with org                       ✅ exists
│   ├── [Admin] creates member with org
│   ├── [Manager] creates member in own org                    ✅ exists
│   ├── [Manager] rejects admin creation                       ✅ exists
│   ├── [Manager] rejects creation in different org
│   ├── rejects manager/member without org                     ✅ exists
│   ├── rejects duplicate email                                ✅ exists
│   ├── rejects weak password (validation)
│   └── rejects missing required fields (validation)
│
├── describe('PUT /api/admin/users/:id')
│   ├── [Admin] updates any user
│   ├── [Admin] self-update allowed
│   ├── [Manager] updates member in own org
│   ├── [Manager] rejects update of manager peer
│   ├── [Manager] rejects update of user outside org
│   └── rejects invalid payload
│
├── describe('PUT /api/admin/users/:id/role')
│   ├── [Admin] promotes to admin                              ✅ exists
│   ├── [Admin] demotes admin to member
│   ├── [Manager] rejects promotion to admin                   ✅ exists
│   ├── [Admin] rejects self role change
│   └── rejects invalid role value
│
├── describe('POST /api/admin/users/:id/ban')
│   ├── [Admin] bans member                                    ✅ exists
│   ├── [Admin] rejects ban of another admin
│   ├── [Admin] rejects self-ban
│   ├── [Manager] bans member in own org
│   └── [Manager] rejects ban of manager peer
│
├── describe('POST /api/admin/users/:id/unban')
│   ├── [Admin] unbans user                                    ✅ exists
│   └── [Admin] rejects self-unban
│
├── describe('POST /api/admin/users/:id/password')
│   ├── [Admin] sets password for any user
│   ├── [Admin] self-password change allowed
│   ├── rejects weak password
│   └── [Manager] sets password for member in org
│
├── describe('DELETE /api/admin/users/:id')
│   ├── [Admin] deletes member
│   ├── [Admin] rejects self-delete
│   ├── [Admin] rejects delete of another admin
│   └── [Manager] rejects delete of user outside org
│
├── describe('DELETE /api/admin/users/bulk')
│   ├── [Admin] bulk deletes multiple users
│   ├── [Admin] rejects bulk delete including self
│   ├── rejects empty array
│   └── [Manager] bulk deletes members in own org
│
├── describe('GET /api/admin/users/:id/capabilities')
│   ├── [Admin] on member — all actions enabled
│   ├── [Admin] on self — limited actions
│   ├── [Admin] on admin peer — no sensitive actions
│   ├── [Manager] on member in org — scoped actions
│   └── [Manager] on member outside org — no actions
│
├── describe('GET /api/admin/users/:id/sessions')
│   ├── [Admin] lists sessions for any user                    ✅ exists
│   ├── [Manager] lists sessions for member in org
│   └── [Manager] rejects listing for user outside org
│
├── describe('POST /api/admin/users/sessions/revoke')
│   ├── [Admin] revokes specific session
│   └── rejects invalid session token
│
└── describe('POST /api/admin/users/:id/sessions/revoke-all')
    ├── [Admin] revokes all sessions                           ✅ exists
    └── [Manager] revokes sessions for member in org
```

**Estimated**: ~55 test cases (current: ~30, adding ~25 new)

---

#### `test/platform-admin-orgs.e2e-spec.ts` — Platform Admin Organizations (REWRITE)

Replace the current stub-only `platform-admin.e2e-spec.ts` with full authenticated tests.

```
describe('Platform Admin - Organization Management')
├── describe('Authentication')
│   ├── All endpoints return 401 without auth                  ✅ exists
│   └── All endpoints return 403 for non-admin role
│
├── describe('GET /api/platform-admin/organizations')
│   ├── [Admin] lists all organizations with pagination
│   ├── [Admin] filters by search query
│   ├── [Admin] returns correct member counts
│   ├── [Manager] returns 403
│   └── [Member] returns 403
│
├── describe('GET /api/platform-admin/organizations/:id')
│   ├── [Admin] returns org details with members
│   ├── [Admin] returns 404 for non-existent org
│   └── [Manager] returns 403
│
├── describe('PUT /api/platform-admin/organizations/:id')
│   ├── [Admin] updates organization name
│   ├── [Admin] updates organization slug
│   ├── [Admin] returns 404 for non-existent org
│   └── rejects empty update payload
│
├── describe('DELETE /api/platform-admin/organizations/:id')
│   ├── [Admin] deletes organization and cascades
│   ├── [Admin] returns 404 for non-existent org
│   └── [Manager] returns 403
│
├── describe('GET /api/platform-admin/organizations/:id/members')
│   ├── [Admin] lists members with user info
│   └── returns empty array for new org
│
├── describe('PUT /api/platform-admin/organizations/:id/members/:memberId/role')
│   ├── [Admin] changes member role to manager
│   ├── [Admin] rejects downgrading last admin
│   ├── [Manager] can change member role in own org
│   └── [Manager] rejects changing peer manager role
│
├── describe('DELETE /api/platform-admin/organizations/:id/members/:memberId')
│   ├── [Admin] removes member from org
│   ├── [Admin] rejects removing last admin
│   ├── [Manager] removes member in own org
│   └── [Manager] rejects removing peer manager
│
├── describe('POST /api/platform-admin/organizations/:id/invitations')
│   ├── [Admin] creates invitation for any role
│   ├── [Manager] creates invitation for member only
│   ├── [Manager] rejects admin role invitation
│   ├── rejects invitation for existing member
│   └── rejects duplicate pending invitation
│
├── describe('GET /api/platform-admin/organizations/:id/roles')
│   ├── [Admin] returns all roles with assignable filter
│   └── [Manager] returns filtered assignable roles
│
└── describe('Cross-org isolation')
    ├── [Manager] cannot access other org's members
    ├── [Manager] cannot invite to other org
    └── [Manager] cannot remove members from other org
```

**Estimated**: ~40 test cases (current: ~4 stubs)

---

#### `test/rbac.e2e-spec.ts` — RBAC Roles & Permissions (NEW)

```
describe('RBAC API - Roles & Permissions')
├── describe('Authentication')
│   ├── All endpoints return 401 without auth                  ✅ exists (in platform-admin.e2e-spec.ts)
│   └── Member role returns 403 for all endpoints
│
├── describe('GET /api/rbac/roles')
│   ├── [Admin] lists all roles
│   ├── [Manager] lists all roles (has role:read)
│   └── response includes system flag, color, description
│
├── describe('GET /api/rbac/roles/:id')
│   ├── [Admin] returns role with permissions
│   └── returns 404 for non-existent role
│
├── describe('POST /api/rbac/roles')
│   ├── [Admin] creates custom role
│   ├── [Admin] rejects duplicate role name
│   ├── [Admin] rejects empty name
│   ├── [Admin] rejects empty displayName
│   └── [Manager] returns 403 (admin-only)
│
├── describe('PUT /api/rbac/roles/:id')
│   ├── [Admin] updates custom role
│   ├── [Admin] updates system role display only
│   ├── [Admin] returns 404 for non-existent
│   ├── [Admin] rejects empty update
│   └── [Manager] returns 403
│
├── describe('DELETE /api/rbac/roles/:id')
│   ├── [Admin] deletes custom role
│   ├── [Admin] rejects deleting system role
│   ├── [Admin] returns 404 for non-existent
│   └── [Manager] returns 403
│
├── describe('PUT /api/rbac/roles/:id/permissions')
│   ├── [Admin] assigns permissions to role
│   ├── [Admin] replaces existing permissions
│   ├── [Admin] assigns empty array (clear all)
│   ├── [Admin] returns 404 for non-existent role
│   └── [Manager] returns 403
│
├── describe('GET /api/rbac/permissions')
│   ├── [Admin] lists all permissions
│   └── returns id, resource, action, description
│
├── describe('GET /api/rbac/permissions/grouped')
│   ├── [Admin] returns permissions grouped by resource
│   └── groups include user, organization, role, session
│
├── describe('GET /api/rbac/users/:roleName/permissions')
│   ├── [Admin] returns effective permissions for admin role
│   ├── [Admin] returns effective permissions for manager role
│   └── returns empty for role with no permissions
│
└── describe('GET /api/rbac/check/:roleName/:resource/:action')
    ├── [Admin] returns true for assigned permission
    ├── [Admin] returns false for unassigned permission
    └── handles non-existent role
```

**Estimated**: ~35 test cases (current: ~4 stubs)

---

#### `test/impersonation.e2e-spec.ts` — Organization Impersonation (NEW)

```
describe('Organization Impersonation API')
├── describe('Authentication')
│   ├── POST /impersonate returns 401 without auth             ✅ exists
│   └── POST /stop-impersonating returns 401 without token     ✅ exists
│
├── describe('POST /api/organization/:orgId/impersonate')
│   ├── [Admin+Manager] impersonates member in org → returns session token
│   ├── [Manager] impersonates member in own org
│   ├── [Manager] rejects impersonation of non-member
│   ├── [Member] rejects impersonation (not manager/admin)
│   ├── rejects self-impersonation
│   ├── rejects impersonation of user in different org
│   └── impersonation session has correct activeOrganizationId
│
├── describe('POST /api/organization/stop-impersonating')
│   ├── stops impersonation with valid token
│   ├── rejects non-impersonation session token
│   └── rejects invalid/expired token
│
└── describe('Impersonation Session Behavior')
    ├── impersonated session sees target user's data
    ├── impersonated session has impersonatedBy field
    └── original session still valid after impersonation starts
```

**Estimated**: ~15 test cases (current: ~2 stubs)

---

#### `test/auth.e2e-spec.ts` — Authentication API (NEW)

```
describe('Authentication API')
├── describe('POST /api/auth/sign-up/email')
│   ├── creates new user successfully
│   ├── returns session cookie
│   ├── rejects duplicate email
│   ├── rejects weak password
│   └── rejects missing required fields
│
├── describe('POST /api/auth/sign-in/email')
│   ├── signs in with valid credentials
│   ├── returns session cookie
│   ├── rejects invalid password
│   ├── rejects non-existent email
│   └── rejects banned user
│
├── describe('GET /api/auth/get-session')
│   ├── returns session for valid cookie
│   ├── returns user data with role
│   └── returns 401 for invalid/expired cookie
│
├── describe('POST /api/auth/sign-out')
│   ├── invalidates session
│   └── subsequent requests return 401
│
└── describe('GET /health')
    ├── returns 200 with status ok                             ✅ exists
    └── includes timestamp and uptime                          ✅ exists
```

**Estimated**: ~15 test cases (current: ~2)

---

### 2.3 Phase 1 Summary

| Test File | New Tests | Existing Tests | Total |
|---|---|---|---|
| `admin-users.e2e-spec.ts` | ~25 | ~30 | ~55 |
| `platform-admin-orgs.e2e-spec.ts` | ~36 | ~4 | ~40 |
| `rbac.e2e-spec.ts` | ~31 | ~4 | ~35 |
| `impersonation.e2e-spec.ts` | ~13 | ~2 | ~15 |
| `auth.e2e-spec.ts` | ~13 | ~2 | ~15 |
| **Phase 1 Total** | **~118** | **~42** | **~160** |

---

## 3. Phase 2 — Missing API Unit Tests

### 3.1 Guards (Security-Critical)

#### `src/common/guards/permissions.guard.spec.ts` (NEW)

```
describe('PermissionsGuard')
├── allows access when no permissions are required
├── allows access when user has required permission
├── denies access when user lacks required permission
├── denies access when no session exists
├── denies access when session has no user
├── handles multiple required permissions (AND logic)
├── queries role_permissions table correctly
├── works with method-level + class-level permission merging
└── handles database errors gracefully
```

**Estimated**: ~10 test cases

#### `src/common/guards/org-role.guard.spec.ts` (NEW)

```
describe('OrgRoleGuard')
├── allows access when no org role is required
├── allows access when user is admin (bypasses org check)
├── allows access when user has required org role
├── denies access when user lacks org membership
├── denies access when user has wrong org role
├── denies access when no active organization in session
├── checks member table for org-scoped role
└── handles missing session gracefully
```

**Estimated**: ~8 test cases

### 3.2 Services

#### `src/email/email.service.spec.ts` (NEW)

```
describe('EmailService')
├── describe('sendEmailVerification')
│   ├── sends email with correct template data
│   ├── includes verification URL
│   └── handles Resend API error gracefully
├── describe('sendPasswordResetEmail')
│   ├── sends email with reset link
│   └── includes expiration info
├── describe('sendOrganizationInvitation')
│   ├── sends invitation with org name and role
│   ├── includes accept invitation URL
│   └── handles missing inviter name
└── describe('configuration')
    ├── uses correct from address
    └── respects test mode (skips actual send)
```

**Estimated**: ~10 test cases

#### `src/rbac/services/permission.service.spec.ts` (NEW)

```
describe('PermissionService')
├── describe('findAll')
│   ├── returns all permissions
│   └── returns empty array when none exist
├── describe('findGroupedByResource')
│   ├── groups permissions by resource correctly
│   ├── includes all actions per resource
│   └── handles empty permissions table
```

**Estimated**: ~5 test cases

#### `src/organization/controllers/org-impersonation.controller.spec.ts` (NEW)

```
describe('OrgImpersonationController')
├── describe('impersonate')
│   ├── delegates to service with correct params
│   ├── throws ForbiddenException when no session
│   └── returns sessionToken on success
├── describe('stopImpersonating')
│   ├── extracts Bearer token from auth header
│   ├── delegates to service with token
│   └── throws ForbiddenException when no auth header
```

**Estimated**: ~6 test cases

### 3.3 Phase 2 Summary

| Test File | Tests |
|---|---|
| `permissions.guard.spec.ts` | ~10 |
| `org-role.guard.spec.ts` | ~8 |
| `email.service.spec.ts` | ~10 |
| `permission.service.spec.ts` | ~5 |
| `org-impersonation.controller.spec.ts` | ~6 |
| **Phase 2 Total** | **~39** |

---

## 4. Phase 3 — SPA Unit & Component Tests

### 4.1 Critical Shared Infrastructure

#### `src/shared/context/__tests__/AuthContext.test.tsx` (NEW)

```
describe('AuthContext')
├── provides authentication state to children
├── isAuthenticated is true when session exists
├── isAdmin is true when user.role === 'admin'
├── login calls authClient.signIn.email
├── logout calls authClient.signOut and clears state
├── isLoading is true during initial fetch
├── handles auth error gracefully
└── redirects to /login when session expires
```

**Estimated**: ~8 test cases

#### `src/shared/components/__tests__/ProtectedRoute.test.tsx` (NEW)

```
describe('ProtectedRoute')
├── renders children when authenticated
├── redirects to /login when not authenticated
├── shows loading state during auth check
└── preserves return URL in redirect
```

**Estimated**: ~4 test cases

#### `src/shared/components/__tests__/AdminRoute.test.tsx` (NEW)

```
describe('AdminRoute')
├── renders children when user is admin
├── redirects non-admin to dashboard
├── renders children when user is manager (if allowed)
└── redirects member to dashboard
```

**Estimated**: ~4 test cases

#### `src/shared/hooks/__tests__/useOrgRole.test.tsx` (NEW)

```
describe('useOrgRole')
├── returns current organization role
├── returns null when no active organization
└── updates when organization changes
```

**Estimated**: ~3 test cases

### 4.2 Feature Services

#### `src/features/Admin/services/__tests__/adminService.test.ts` (NEW)

```
describe('adminService')
├── describe('listUsers') — calls correct endpoint with params
├── describe('createUser') — sends POST with body
├── describe('banUser') — sends POST to ban endpoint
├── describe('unbanUser') — sends POST to unban endpoint
├── describe('setRole') — sends PUT to role endpoint
├── describe('setPassword') — sends POST to password endpoint
├── describe('removeUser') — sends DELETE
├── describe('getUserCapabilities') — returns capability object
├── describe('listUserSessions') — calls sessions endpoint
├── describe('revokeSession') — sends POST with token
├── describe('revokeAllSessions') — sends POST for user
├── describe('error handling') — maps API errors correctly
└── describe('auth header') — includes session cookie
```

**Estimated**: ~15 test cases

#### `src/features/Admin/services/__tests__/rbacService.test.ts` (NEW)

```
describe('rbacService')
├── describe('getRoles') — fetches roles list
├── describe('getRole') — fetches role by ID with permissions
├── describe('createRole') — sends POST
├── describe('updateRole') — sends PUT
├── describe('deleteRole') — sends DELETE
├── describe('assignPermissions') — sends PUT with permissionIds
├── describe('getPermissions') — fetches all permissions
└── describe('getPermissionsGrouped') — fetches grouped
```

**Estimated**: ~10 test cases

### 4.3 Feature Components (Lower Priority — E2E Already Covers UI)

#### `src/shared/components/__tests__/ImpersonationBanner.test.tsx` (NEW)

```
describe('ImpersonationBanner')
├── renders banner when impersonating
├── does not render when not impersonating
├── shows impersonated user name
└── calls stopImpersonating on click
```

#### `src/shared/components/__tests__/OrganizationSwitcher.test.tsx` (NEW)

```
describe('OrganizationSwitcher')
├── renders current organization name
├── lists available organizations in dropdown
├── calls switch handler on selection
└── shows "No organization" when none active
```

**Estimated**: ~8 test cases

### 4.4 Phase 3 Summary

| Test File | Tests | Priority |
|---|---|---|
| `AuthContext.test.tsx` | ~8 | P0 |
| `ProtectedRoute.test.tsx` | ~4 | P1 |
| `AdminRoute.test.tsx` | ~4 | P1 |
| `useOrgRole.test.tsx` | ~3 | P1 |
| `adminService.test.ts` | ~15 | P1 |
| `rbacService.test.ts` | ~10 | P1 |
| `ImpersonationBanner.test.tsx` | ~4 | P2 |
| `OrganizationSwitcher.test.tsx` | ~4 | P2 |
| **Phase 3 Total** | **~52** | |

---

## 5. Phase 4 — CI/CD Test Gates

### 5.1 nestjs-api-starter — `.github/workflows/deploy-ecr.yml`

Add test steps **before** the Docker build:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nestjs_api_starter_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test              # Unit tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/nestjs_api_starter_test
      - run: npm run test:e2e      # Integration tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/nestjs_api_starter_test
      - run: npm run test:cov      # Coverage report
      # Upload coverage to GitHub Actions artifacts (optional)
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/

  deploy:
    needs: test                    # Deploy only if tests pass
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    # ... existing deploy steps ...
```

### 5.2 spa-api-starter — `.github/workflows/deploy-s3.yml`

Add test steps **before** the build:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx vitest run         # Unit tests
      - run: npx vitest run --coverage  # Coverage report

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    # ... existing deploy steps ...
```

> **Note**: Playwright e2e tests require a running API, so they should run in a separate
> workflow or as a scheduled nightly job, not as a gate on every push.

---

## 6. Phase 5 — Coverage Thresholds & Reporting

### 6.1 nestjs-api-starter — `package.json` jest config

Add coverage thresholds:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 60,
        "functions": 70,
        "lines": 70,
        "statements": 70
      },
      "src/common/guards/": {
        "branches": 90,
        "functions": 100,
        "lines": 90,
        "statements": 90
      },
      "src/admin/": {
        "branches": 80,
        "functions": 85,
        "lines": 85,
        "statements": 85
      }
    }
  }
}
```

### 6.2 spa-api-starter — `vitest.config.ts`

Add coverage thresholds:

```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    branches: 50,
    functions: 50,
    lines: 55,
    statements: 55,
  },
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    'src/main.tsx',
    'src/vite-env.d.ts',
    'src/shared/components/ui/',  // shadcn library components
  ],
},
```

> **Ratchet strategy**: Start with achievable thresholds, increase by 5% each quarter.

---

## Appendix A — File-Level Gap Matrix

### nestjs-api-starter

| Source File | Unit Test | Integration Test | Status |
|---|---|---|---|
| `admin/admin.service.ts` | `admin.service.spec.ts` | `admin.e2e-spec.ts` | Covered |
| `admin/admin.controller.ts` | `admin.controller.spec.ts` | `admin.e2e-spec.ts` | Covered |
| `admin/admin.controller.ts` (validation) | `admin.controller.validation.spec.ts` | — | Covered |
| `admin/admin.utils.ts` | `admin.utils.spec.ts` | — | Covered |
| `app.controller.ts` | `app.controller.spec.ts` | `app.e2e-spec.ts` | Covered |
| `common/guards/roles.guard.ts` | `roles.guard.spec.ts` | — | Covered |
| `common/guards/permissions.guard.ts` | **MISSING** | — | **Phase 2** |
| `common/guards/org-role.guard.ts` | **MISSING** | — | **Phase 2** |
| `config/config.service.ts` | `config.service.spec.ts` | — | Covered |
| `database/database.service.ts` (via module) | `database.service.spec.ts` | — | Covered |
| `email/email.service.ts` | **MISSING** | — | **Phase 2** |
| `organization/controllers/org-impersonation.controller.ts` | **MISSING** | **STUB ONLY** | **Phase 1+2** |
| `organization/services/org-impersonation.service.ts` | `org-impersonation.service.spec.ts` | — | Covered |
| `platform-admin/controllers/admin-organizations.controller.ts` | `admin-organizations.controller.spec.ts` | **STUB ONLY** | **Phase 1** |
| `platform-admin/controllers/...` (validation) | `admin-organizations.controller.validation.spec.ts` | — | Covered |
| `platform-admin/services/admin-organizations.service.ts` | `admin-organizations.service.spec.ts` | — | Covered |
| `rbac/rbac.controller.ts` | `rbac.controller.spec.ts` (metadata) | **STUB ONLY** | **Phase 1** |
| `rbac/rbac.controller.ts` (validation) | `rbac.controller.validation.spec.ts` | — | Covered |
| `rbac/rbac.migration.ts` | `rbac.migration.spec.ts` | — | Covered |
| `rbac/services/role.service.ts` | `role.service.spec.ts` | — | Covered |
| `rbac/services/permission.service.ts` | **MISSING** | — | **Phase 2** |
| `auth.ts` | `auth.spec.ts` | — | Covered |
| `permissions.ts` | — (config only) | — | N/A |
| `common/password-policy.ts` | — | — | Low priority |

### spa-api-starter

| Source File | Unit Test | E2E Coverage | Status |
|---|---|---|---|
| `features/Admin/hooks/useUsers.ts` | `useUsers.test.tsx` | Playwright | Covered |
| `features/Admin/hooks/useOrganizations.ts` | `useOrganizations.test.tsx` | Playwright | Covered |
| `features/Admin/hooks/useRoles.ts` | `useRoles.test.tsx` | Playwright | Covered |
| `features/Admin/services/adminService.ts` | Partial (`impersonation` only) | Playwright | **Phase 3** |
| `features/Admin/services/rbacService.ts` | **MISSING** | Playwright | **Phase 3** |
| `features/Admin/utils/role-hierarchy.ts` | `role-hierarchy.test.ts` | — | Covered |
| `features/Admin/views/*.tsx` (5 pages) | **MISSING** | Playwright | Low (e2e covers) |
| `features/Auth/views/*.tsx` (6 pages) | **MISSING** | Playwright | Low (e2e covers) |
| `features/Dashboard/views/DashboardPage.tsx` | **MISSING** | **MISSING** | **Phase 3** |
| `features/Dashboard/services/dashboardService.ts` | **MISSING** | **MISSING** | **Phase 3** |
| `shared/context/AuthContext.tsx` | **MISSING** | Playwright | **Phase 3 (P0)** |
| `shared/components/ProtectedRoute.tsx` | **MISSING** | Playwright | **Phase 3** |
| `shared/components/AdminRoute.tsx` | **MISSING** | Playwright | **Phase 3** |
| `shared/components/AdminOnlyRoute.tsx` | **MISSING** | Playwright | **Phase 3** |
| `shared/components/OrgManagerRoute.tsx` | **MISSING** | Playwright | **Phase 3** |
| `shared/components/ImpersonationBanner.tsx` | **MISSING** | Playwright | **Phase 3** |
| `shared/components/OrganizationSwitcher.tsx` | **MISSING** | Playwright | **Phase 3** |
| `shared/hooks/useIsImpersonating.ts` | `useIsImpersonating.test.tsx` | — | Covered |
| `shared/hooks/useOrgRole.ts` | **MISSING** | Playwright | **Phase 3** |
| `shared/lib/fetch-with-auth.ts` | `fetch-with-auth.test.ts` | — | Covered |
| `shared/lib/auth-client.ts` | **MISSING** | Playwright | Low (config file) |
| `shared/api/client.ts` | **MISSING** | Playwright | Low (thin wrapper) |

---

## Appendix B — Test Naming Conventions

### Integration tests (API)

```
test/
├── admin-users.e2e-spec.ts          # Admin user management endpoints
├── platform-admin-orgs.e2e-spec.ts  # Platform admin org endpoints
├── rbac.e2e-spec.ts                 # RBAC roles & permissions endpoints
├── impersonation.e2e-spec.ts        # Org impersonation endpoints
├── auth.e2e-spec.ts                 # Authentication endpoints
├── app.e2e-spec.ts                  # Health check, hello world
├── test-helpers.ts                  # Shared test infrastructure
├── setup.ts                         # dotenv for .env.test
├── teardown.ts                      # Global DB cleanup
└── jest-e2e.json                    # E2E jest config
```

### Unit tests (API)

Follow the existing convention: colocated with source files as `*.spec.ts`.

### Unit tests (SPA)

Follow the existing convention: `__tests__/` subdirectory with `*.test.ts(x)`.

### Test description format

```
describe('[ModuleName]')
  describe('[HTTP_METHOD /endpoint]')            // integration
  describe('[methodName]')                       // unit
    it('[Role] should [expected behavior]')      // role-scoped
    it('should [expected behavior]')             // general
    it('rejects [invalid scenario]')             // negative
```

---

## Execution Timeline

| Phase | Scope | New Tests | Priority | Depends On |
|---|---|---|---|---|
| **Phase 1** | API integration tests | ~118 | **P0** | — |
| **Phase 2** | API unit test gaps | ~39 | **P0** | — |
| **Phase 3** | SPA unit/component tests | ~52 | **P1** | — |
| **Phase 4** | CI/CD test gates | — | **P0** | Phase 1+2 |
| **Phase 5** | Coverage thresholds | — | **P1** | Phase 1+2+3 |
| **Total new tests** | | **~209** | | |

### Target State After All Phases

| Metric | Current | Target |
|---|---|---|
| API unit tests | ~188 | ~227 |
| API integration tests | ~47 | ~160 |
| SPA unit tests | ~57 | ~109 |
| SPA e2e tests | ~181 | ~181 (no change) |
| **Grand total** | **~473** | **~677** |
| CI test gates | 0 | 2 (both pipelines) |
| Coverage thresholds | None | Enforced in both projects |
