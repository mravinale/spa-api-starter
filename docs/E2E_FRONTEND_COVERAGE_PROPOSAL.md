# E2E vs Frontend Coverage Analysis & Deep-Coverage Proposal

## Objective
Evaluate current Playwright E2E coverage against implemented frontend behavior and identify missing cases/edges needed for deeper confidence.

---

## 1) Coverage Map (What is already covered)

### Authentication
**Frontend implemented**
- Login, signup, forgot-password, set-new-password, verify-email, accept-invitation routes are implemented in app routing and pages.

**Covered now**
- Core auth happy-path and basic failures are covered in `e2e/auth.spec.ts`.
- Protected-route redirect is covered.

### Admin / RBAC
**Frontend implemented**
- Admin routes for users/sessions/organizations/roles under guarded route hierarchy.
- Role-aware UI behavior in Users page.
- Impersonation banner + stop flow.

**Covered now**
- Admin navigation visibility, dialogs, CRUD-like smoke paths in `e2e/admin.spec.ts` and `e2e/full-coverage.spec.ts`.
- Role-model checks and manager/member restrictions in `e2e/rbac-unified-roles.spec.ts`.
- Impersonation flow checks in `e2e/rbac-impersonation.spec.ts`.

### API smoke
- Health endpoint and roles DB shape validated in `e2e/health-api.spec.ts` and `e2e/roles-api.spec.ts`.

---

## 2) Key Gaps and Missing Edge Cases

## Critical Gaps (P0)
1. **Accept-invitation flow is not deeply E2E validated**
   - Not-authenticated state, sessionStorage handoff (`pendingInvitationId`), login/signup continuation, and final acceptance UX are not covered end-to-end.
2. **Guard behavior is often weakly asserted**
   - Multiple tests use permissive assertions and conditional branches that can pass without validating the real behavior.
3. **Users role-hierarchy enforcement lacks strict negative coverage**
   - Need explicit failure checks for forbidden actions (manager targeting admin/manager, self-action restrictions, menu absence consistency).
4. **Impersonation resilience edges are missing**
   - Banner persistence on refresh, stop action idempotency/failed API handling, navigation while impersonated.

## High-Value Gaps (P1)
1. **Sessions UX edge cases**
   - Empty session state, expired session badge rendering, revoke-all confirmation cancellation, refresh consistency.
2. **Organizations edge cases**
   - Slug states (`checking`, `taken`, `available`) plus disabled Create action behavior.
   - Add-member with no available users.
   - Role update constraints for last owner / restricted role options per actor role.
3. **Role page manager-specific view restrictions**
   - Manager should only see member role card and should not access create/delete for protected roles.
4. **Create-user validations**
   - Non-admin user creation must enforce organization selection.
   - Role selector allowed-role filtering per caller role.

## Structural/Product Mismatch Risks (P1)
1. **Sidebar has `/settings` navigation, but no explicit route is defined in AppRoutes**.
2. **Breadcrumb config includes `/invitations`, but route is not wired in AppRoutes**.
3. **`InvitationsPage.tsx` exists but appears unreachable from current routing.**

These should be clarified as either intentional roadmap placeholders or implementation gaps.

---

## 3) Proposed New E2E Test Cases (Deep Coverage)

## A. Auth + Invitation Continuation
**Suggested file**: `e2e/auth-invitation-flow.spec.ts`

1. `accept-invitation/:id` when logged out shows sign-in/sign-up CTA.
2. Clicking **Sign In** stores `pendingInvitationId`, authenticates, and redirects to `/accept-invitation/:id`.
3. Clicking **Sign Up** stores `pendingInvitationId`, completes signup path, then redirects to invitation acceptance.
4. Invalid invitation id shows deterministic error state and no infinite loading.
5. Accept invitation success redirects to dashboard and updates organization context.

## B. Route-Guard Strictness
**Suggested file**: `e2e/guards.spec.ts`

1. Member direct access to each admin route (`/admin/users`, `/admin/sessions`, `/admin/organizations`, `/admin/roles`) must redirect deterministically.
2. Manager access to allowed routes succeeds; forbidden actions remain hidden and unreachable.
3. Unknown route fallback behavior validated (`* -> /`), including unauthenticated redirect chain.

## C. Users Page - Permission Matrix
**Suggested file**: `e2e/users-permissions-matrix.spec.ts`

1. Admin on self: only allowed self-actions shown (edit/reset), no impersonate/delete/role-change.
2. Admin on other admin: no actions.
3. Admin on manager/member: full actions visible and executable.
4. Manager on self: edit/reset only.
5. Manager on member: full manager-allowed actions.
6. Manager on admin/manager: no action menu.
7. Attempt self-impersonation path shows toast and does not mutate session.

## D. Organizations - Edge Behavior
**Suggested file**: `e2e/organizations-edge.spec.ts`

1. Create org slug status transitions and Create button disable conditions.
2. Add-member dialog with no available users path.
3. Member role dropdown excludes forbidden options based on caller role.
4. Remove-member cancel path leaves membership unchanged.
5. Organization search + pagination state retention after selection.

## E. Sessions - State Transitions
**Suggested file**: `e2e/sessions-edge.spec.ts`

1. No-user-selected panel state.
2. Selected user with no sessions state.
3. Revoke single session updates row count and success feedback.
4. Revoke all cancel leaves data unchanged.
5. Expired session badge rendering validation.

## F. Roles & Permissions - Manager vs Admin UX
**Suggested file**: `e2e/roles-visibility-rules.spec.ts`

1. Admin sees all role cards + create capability.
2. Manager sees filtered role set (member-only behavior expected by current implementation).
3. Manager cannot open/submit create role dialog.
4. System role delete button never appears across roles.
5. Permissions save failure path preserves dialog with error feedback.

## G. Navigation/Dead-Link Validation
**Suggested file**: `e2e/navigation-integrity.spec.ts`

1. Settings entry behavior (either route exists and loads, or explicit product decision test).
2. Invitations route behavior consistency with breadcrumb config.
3. Breadcrumb parent links deterministic behavior on admin pages.

---

## 4) Test Quality Hardening Recommendations

1. **Remove pass-without-assert patterns**
   - Replace `if (visible) { ... }` patterns with deterministic fixture setup and hard assertions.
2. **Reduce timing flake**
   - Prefer event/state-based waits over broad `waitForTimeout`.
3. **Prefer deterministic selectors**
   - Add stable `data-testid` for critical action points (role menus, add-member dialog controls, revoke buttons).
4. **Strengthen negative assertions**
   - Explicitly assert forbidden controls do not exist for restricted roles.
5. **Isolate role-mutating suites**
   - Keep role-changing scenarios serial and restore baseline role/org context in cleanup.

---

## 5) Prioritized Execution Plan

## Phase 1 (P0, immediate)
- Add `auth-invitation-flow.spec.ts`, `guards.spec.ts`, `users-permissions-matrix.spec.ts`.
- Refactor existing permissive assertions in RBAC specs to strict assertions.

## Phase 2 (P1)
- Add `organizations-edge.spec.ts`, `sessions-edge.spec.ts`, `roles-visibility-rules.spec.ts`.

## Phase 3 (P1/P2)
- Add `navigation-integrity.spec.ts` and align with product decision on `/settings` and `/invitations`.

---

## 6) Expected Outcome

If implemented, this plan will shift the suite from broad smoke coverage to **behavioral, permission-aware, edge-focused coverage**, especially around:
- auth continuation via invitation,
- deterministic RBAC enforcement,
- impersonation/session state transitions,
- and role/organization constraints.

This should materially reduce false confidence and catch regressions earlier in high-risk admin flows.
