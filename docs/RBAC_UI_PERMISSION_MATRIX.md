---
title: RBAC UI Permission Matrix
description: Canonical UI-aligned permission matrix for E2E role coverage (admin, manager, member)
---

# RBAC UI Permission Matrix

This document is the source of truth for UI permission coverage in E2E tests.

## Roles
- `admin`
- `manager`
- `member`

## Route-level access matrix

| Route | Admin | Manager | Member |
| --- | --- | --- | --- |
| `/admin/users` | Allow | Allow (permission-gated actions) | Deny (redirect `/`) |
| `/admin/sessions` | Allow | Allow (permission-gated actions) | Deny (redirect `/`) |
| `/admin/organizations` | Allow | Allow (permission-gated actions) | Deny (redirect `/`) |
| `/admin/roles` | Allow | Allow (read-only or constrained by permissions) | Deny (redirect `/`) |

## Users page action matrix (current expected behavior)

### Target: self

| Action | Admin | Manager | Member |
| --- | --- | --- | --- |
| Edit user | Allow | Allow | N/A (no access) |
| Reset password | Allow | Deny | N/A |
| Change role | Deny | Deny | N/A |
| Impersonate | Deny | Deny | N/A |
| Delete user | Deny | Deny | N/A |

### Target: member user

| Action | Admin | Manager | Member |
| --- | --- | --- | --- |
| Edit user | Allow | Allow | N/A |
| Reset password | Allow | Deny | N/A |
| Change role | Allow | Deny | N/A |
| Impersonate | Allow | Deny | N/A |
| Ban/Unban | Allow | Allow | N/A |
| Delete user | Allow | Deny | N/A |

### Target: admin user (other)

| Action | Admin | Manager | Member |
| --- | --- | --- | --- |
| Any row action menu | Deny | Deny | N/A |

## Organizations page action matrix

| Action | Admin | Manager | Member |
| --- | --- | --- | --- |
| Create organization | Permission-gated | Permission-gated | N/A |
| Edit/Delete organization | Permission-gated | Permission-gated | N/A |
| Add member | Permission-gated (`organization:invite`) | Permission-gated (`organization:invite`) | N/A |
| Remove member | Permission-gated (`organization:invite`) | Permission-gated (`organization:invite`) | N/A |
| Change member role | Permission-gated (`organization:invite`) | Permission-gated (`organization:invite`) | N/A |

## Sessions page action matrix

| Action | Admin | Manager | Member |
| --- | --- | --- | --- |
| View sessions page | Allow | Allow | N/A |
| Revoke single session | Permission-gated (`session:revoke`) | Permission-gated (`session:revoke`) | N/A |
| Revoke all sessions | Permission-gated (`session:revoke`) | Permission-gated (`session:revoke`) | N/A |

## Roles page action matrix

| Action | Admin | Manager | Member |
| --- | --- | --- | --- |
| View roles page | Allow | Allow | N/A |
| Create role | Permission-gated (`role:create`) | Deny by UI unless explicitly granted | N/A |
| Edit role | Permission-gated (`role:update`) | Permission-gated (`role:update`) | N/A |
| Delete role | Permission-gated (`role:delete`) | Permission-gated (`role:delete`) | N/A |
| Manage permissions | Permission-gated (`role:assign`) | Permission-gated (`role:assign`) | N/A |

## Test authoring rules

1. Every matrix row must have at least one deterministic positive or negative assertion.
2. Avoid optional assertions (`if (visible) { ... }`) unless followed by explicit fallback assertions.
3. Avoid warning-only checks. Access control regressions must fail tests.
4. Prefer row targeting by deterministic user email/ID over first-row heuristics.
5. For action-level assertions, validate both:
   - UI visibility (`menuitem`/button exists or not)
   - API enforcement (`403` on forbidden mutations for authenticated role)
