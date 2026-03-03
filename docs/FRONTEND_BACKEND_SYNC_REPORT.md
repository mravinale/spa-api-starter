# Frontend ↔ Backend Sync Report

Date: 2026-02-13
Scope:
- Frontend: `spa-api-starter`
- Backend: `nestjs-api-starter`
- Goal: identify **rules/restrictions/cases implemented in frontend but not enforced in backend project code**, and highlight key sync gaps.

---

## 1) Executive summary

There are important policy mismatches between UI and API behavior.

Most critical gaps:
1. **RBAC read/check endpoints are effectively public in backend code**, while frontend treats RBAC as admin-area functionality.
2. **User action constraints are enforced in UI only** (self-protection and admin-vs-admin protections), but not enforced in backend service methods.
3. **Several frontend input restrictions rely on UI controls only** (role creation required fields, password length in reset page) without explicit backend DTO validation in this project code.
4. Organization/member role rules are split between custom API endpoints and Better Auth plugin endpoints, making policy ownership fragmented.

---

## 2) Method and evidence sources

Reviewed key files in both repositories, including route guards, pages, services, controllers, guards, DTOs, and auth/plugin configuration.

Primary frontend references:
- `src/app/views/AppRoutes.tsx`
- `src/shared/components/AdminRoute.tsx`
- `src/shared/context/AuthContext.tsx`
- `src/features/Admin/views/UsersPage.tsx`
- `src/features/Admin/views/RolesPage.tsx`
- `src/features/Admin/views/OrganizationsPage.tsx`
- `src/features/Auth/views/SignupPage.tsx`
- `src/features/Auth/views/SetNewPasswordPage.tsx`

Primary backend references:
- `src/rbac/rbac.controller.ts`
- `src/common/guards/roles.guard.ts`
- `src/admin/admin.controller.ts`
- `src/admin/admin.service.ts`
- `src/rbac/dto/create-role.dto.ts`
- `src/rbac/dto/update-role.dto.ts`
- `src/platform-admin/controllers/admin-organizations.controller.ts`
- `src/platform-admin/services/admin-organizations.service.ts`
- `src/auth.ts`

---

## 3) Findings — frontend rules not mirrored in backend project enforcement

## F1 — UI assumes RBAC pages are protected, backend RBAC read endpoints are not role-protected

**Frontend rule**
- Admin pages are wrapped by `AdminRoute` (authenticated + admin/manager).
- RBAC page (`/admin/roles`) is inside admin routing.

**Backend status**
- `RbacController` uses `@UseGuards(RolesGuard)` but many read endpoints (`GET roles`, `GET role`, `GET permissions`, `GET permissions/grouped`, `GET check`) have no `@Roles(...)` / no permission requirement.
- `RolesGuard` returns `true` when no required roles metadata is present.

**Impact**
- A non-admin UI (or unauthenticated client, depending session wiring) may call endpoints the frontend assumes are admin-area only.

**Evidence**
- FE: `src/app/views/AppRoutes.tsx` and `src/shared/components/AdminRoute.tsx`
- BE: `src/rbac/rbac.controller.ts`, `src/common/guards/roles.guard.ts`

---

## F2 — User action matrix enforced in frontend only (self/admin protections)

**Frontend rule** (`UsersPage`)
- Action logic blocks many operations in UI:
  - self: edit-only/reset password
  - admin: no full actions on other admins
  - manager: full actions only on members

**Backend status**
- `AdminService` enforces manager org scoping and allowed role assignment.
- But no equivalent checks for:
  - admin mutating/deleting other admins
  - self-protection constraints (e.g., banning/deleting oneself)

**Impact**
- External UI clients can bypass UI-only restrictions and execute operations that current UI intentionally hides.

**Evidence**
- FE: `src/features/Admin/views/UsersPage.tsx`
- BE: `src/admin/admin.service.ts`

---

## F3 — Role creation/edit input constraints are UI-only

**Frontend rule**
- Role creation button disabled unless `name` and `displayName` are provided.
- Role color restricted to select options.

**Backend status**
- DTOs (`CreateRoleDto`, `UpdateRoleDto`) are plain TypeScript properties with no validation decorators in this code.
- Controller forwards DTO values to service without explicit validation rules here.

**Impact**
- Another UI can submit empty/invalid semantic values unless constrained by DB-level constraints.

**Evidence**
- FE: `src/features/Admin/views/RolesPage.tsx`
- BE: `src/rbac/dto/create-role.dto.ts`, `src/rbac/dto/update-role.dto.ts`, `src/rbac/rbac.controller.ts`

---

## F4 — Password reset minimum length check is explicit in frontend but not explicit in backend project code

**Frontend rule**
- Reset form requires password length >= 8 and confirm-password match before submission.

**Backend status**
- Backend project delegates auth/reset behavior to Better Auth plugin config (`auth.ts`), but no explicit project-level password policy validator shown for reset endpoint payloads.

**Impact**
- Policy depends on Better Auth defaults/config rather than explicit backend contract in this project; easy to drift across UIs.

**Evidence**
- FE: `src/features/Auth/views/SetNewPasswordPage.tsx`
- BE: `src/auth.ts`

---

## F5 — Organization member role safeguards are partially UI-level and partially backend-level (fragmented ownership)

**Frontend rule**
- Filters assignable roles by hierarchy and disables changing role for sole owner in member table UI.

**Backend status**
- Custom platform-admin add-member endpoint validates hierarchy.
- But member role updates in frontend use Better Auth client endpoint (`organization.updateMemberRole`) rather than custom platform-admin controller.
- Therefore, policy enforcement is split between custom API and plugin API.

**Impact**
- Harder to guarantee one consistent policy contract for future UIs.

**Evidence**
- FE: `src/features/Admin/views/OrganizationsPage.tsx`, `src/features/Admin/services/adminService.ts`
- BE: `src/platform-admin/controllers/admin-organizations.controller.ts`, `src/platform-admin/services/admin-organizations.service.ts`, `src/auth.ts`

---

## 4) In-sync areas (good)

1. **Platform role normalization** (`admin` / `manager` / `member`) is consistent in FE and BE helper logic.
2. **Manager org scoping** for admin user operations is enforced in backend service and reflected in frontend UX metadata flows.
3. **Create-user role allowlist** is backend-driven (`allowedRoleNames`) and consumed by frontend role selectors.
4. **Organization role hierarchy utility** exists on both FE and BE with same mapping (`member < manager < admin < owner`).

---

## 5) Recommended sync actions (priority order)

## P1 (high): move security-critical rules from UI into API
1. Protect RBAC read/check endpoints with explicit permission requirements (or role requirements) in backend controller.
2. Enforce user-action policy server-side for admin/self target rules (not only manager org scoping).

## P2 (high): define validation contract in backend DTO layer
1. Add DTO validation (required fields, string constraints, enums) for role/user/org payloads.
2. Expose explicit password policy from backend (or document Better Auth policy contract).

## P3 (medium): unify policy ownership for organization membership operations
1. Either:
   - standardize on custom NestJS platform-admin/org endpoints for add/update/remove member operations, or
   - clearly document Better Auth endpoint policy guarantees and align custom endpoints to same rules.

## P4 (medium): capabilities endpoint for future UIs
1. Add API capability responses (what actions current actor can perform on target entity).
2. Let all UIs render actions from API capabilities instead of embedding role matrices in UI only.

---

## 6) Conclusion

Your objective (API reusable by any UI) is achievable, but currently some important behavioral rules still live only in the SPA. The biggest gaps are:
- RBAC endpoint protection inconsistency,
- user action matrix not fully enforced server-side,
- backend validation contract not explicit in DTOs.

Addressing those three first will significantly improve backend/UI sync and make the API safer for additional clients.
