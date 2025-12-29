# Admin Functionalities - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** December 23, 2024  
**Status:** Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Role Model](#role-model)
3. [User Management](#user-management)
4. [Organization Management](#organization-management)
5. [Permissions & Restrictions](#permissions--restrictions)
6. [API Endpoints](#api-endpoints)
7. [Security & Validation](#security--validation)
8. [UI/UX Requirements](#uiux-requirements)
9. [Database Schema](#database-schema)
10. [Test Coverage Requirements](#test-coverage-requirements)

---

## Overview

The admin functionalities provide a comprehensive role-based access control (RBAC) system with three distinct roles: **Admin**, **Manager**, and **Member**. The system enforces strict role hierarchy, organization scoping, and permission-based access control.

### Key Principles

- **Role Hierarchy:** Admins > Managers > Members
- **Organization Scoping:** Managers are restricted to their active organization
- **Mandatory Organization Assignment:** All non-admin users must belong to an organization
- **Least Privilege:** Users can only perform actions allowed by their role
- **Audit Trail:** All admin actions should be traceable (future enhancement)

---

## Role Model

### 1. Admin Role

**Description:** Global platform administrator with unrestricted access

**Capabilities:**
- ✅ Access all admin pages (Users, Sessions, Organizations, Roles & Permissions)
- ✅ View all users across all organizations
- ✅ Create users with any role (admin, manager, member)
- ✅ Create admin users without organization assignment
- ✅ Create manager/member users with required organization assignment
- ✅ Modify any user's role, name, password
- ✅ Ban/unban any user
- ✅ Delete any user
- ✅ Revoke any session
- ✅ Create, update, delete organizations
- ✅ Manage roles and permissions
- ✅ Impersonate any user (via Better Auth admin plugin)

**Restrictions:**
- ❌ None - full platform access

**Organization Assignment:**
- Optional - admins can exist without organization membership
- Can be members of multiple organizations
- Organization membership does not restrict admin capabilities

---

### 2. Manager Role

**Description:** Organization manager with scoped administrative access

**Capabilities:**
- ✅ Access admin pages (Users, Sessions, Organizations)
- ✅ View only users within their active organization
- ✅ Create users with manager or member roles (in their organization)
- ✅ Modify users within their organization (name, password)
- ✅ Change roles of users within their organization (manager ↔ member)
- ✅ Ban/unban users within their organization
- ✅ Delete users within their organization
- ✅ Revoke sessions of users within their organization
- ✅ View their organization details
- ✅ Switch active organization (if member of multiple orgs)

**Restrictions:**
- ❌ Cannot create admin users
- ❌ Cannot promote users to admin role
- ❌ Cannot view users outside their active organization
- ❌ Cannot modify users outside their active organization
- ❌ Cannot access Roles & Permissions page
- ❌ Cannot create, update, or delete organizations
- ❌ Cannot impersonate users (Better Auth restriction)
- ❌ Must have an active organization to perform admin actions

**Organization Assignment:**
- **Required** - managers must belong to at least one organization
- Can be members of multiple organizations
- Must have an active organization set in their session
- All admin actions are scoped to their active organization

---

### 3. Member Role

**Description:** Organization member with basic read access

**Capabilities:**
- ✅ Access dashboard and non-admin pages
- ✅ View their own profile
- ✅ Update their own profile (name, password)
- ✅ View organization they belong to
- ✅ Participate in organization activities (future features)

**Restrictions:**
- ❌ Cannot access any admin pages
- ❌ Cannot create, modify, or delete users
- ❌ Cannot manage organizations
- ❌ Cannot manage roles or permissions
- ❌ Cannot revoke sessions
- ❌ Cannot impersonate users
- ❌ Redirected to home page when attempting to access admin routes

**Organization Assignment:**
- **Required** - members must belong to at least one organization
- Can be members of multiple organizations
- No active organization concept (not performing admin actions)

---

## User Management

### User Creation

#### Admin Creating Users

**Scenario 1: Creating Admin User**
```typescript
{
  name: "John Admin",
  email: "john@example.com",
  password: "SecurePass123!",
  role: "admin",
  organizationId: undefined // Optional - can be omitted
}
```
- ✅ Organization field is optional and hidden in UI
- ✅ User created with admin role
- ✅ No member record created in organization
- ✅ User can access all platform features

**Scenario 2: Creating Manager User**
```typescript
{
  name: "Jane Manager",
  email: "jane@example.com",
  password: "SecurePass123!",
  role: "manager",
  organizationId: "org-uuid-123" // Required
}
```
- ✅ Organization field is required and visible in UI
- ✅ User created with manager role
- ✅ Member record created linking user to organization with manager role
- ✅ User can manage users within assigned organization

**Scenario 3: Creating Member User**
```typescript
{
  name: "Bob Member",
  email: "bob@example.com",
  password: "SecurePass123!",
  role: "member",
  organizationId: "org-uuid-123" // Required
}
```
- ✅ Organization field is required and visible in UI
- ✅ User created with member role
- ✅ Member record created linking user to organization with member role
- ✅ User has basic access only

#### Manager Creating Users

**Scenario 1: Creating Manager User**
```typescript
{
  name: "Alice Manager",
  email: "alice@example.com",
  password: "SecurePass123!",
  role: "manager",
  organizationId: "manager-org-uuid" // Auto-set to manager's active org
}
```
- ✅ Can only assign to their active organization
- ✅ Organization dropdown shows only their active organization
- ✅ User created with manager role in same organization

**Scenario 2: Creating Member User**
```typescript
{
  name: "Charlie Member",
  email: "charlie@example.com",
  password: "SecurePass123!",
  role: "member",
  organizationId: "manager-org-uuid" // Auto-set to manager's active org
}
```
- ✅ Can only assign to their active organization
- ✅ User created with member role in same organization

**Scenario 3: Attempting to Create Admin (FORBIDDEN)**
```typescript
{
  role: "admin", // Not available in role dropdown
}
```
- ❌ Admin role not shown in role dropdown
- ❌ Backend rejects request with 403 Forbidden
- ❌ Error message: "Role not allowed"

### User Role Changes

#### Admin Changing Roles

**Allowed Transitions:**
- ✅ member → manager (requires organization)
- ✅ member → admin (removes organization membership)
- ✅ manager → admin (removes organization membership)
- ✅ manager → member (keeps organization membership)
- ✅ admin → manager (requires organization assignment)
- ✅ admin → member (requires organization assignment)

**Implementation:**
```typescript
// Example: Promoting member to admin
PUT /api/admin/users/:userId/role
{
  role: "admin"
}
// Result: user.role = "admin", member records deleted
```

#### Manager Changing Roles

**Allowed Transitions (within their organization):**
- ✅ member → manager (within same organization)
- ✅ manager → member (within same organization)

**Forbidden Transitions:**
- ❌ Any role → admin
- ❌ Changing roles of users outside their organization

**Implementation:**
```typescript
// Example: Manager promoting member to manager
PUT /api/admin/users/:userId/role
{
  role: "manager"
}
// Backend validates:
// 1. Target user is in manager's active organization
// 2. New role is not "admin"
// 3. Manager has active organization set
```

### User Modification

#### Update User Name
- **Admin:** Can update any user
- **Manager:** Can update users in their organization only
- **Member:** Can update their own name only

#### Change User Password
- **Admin:** Can change any user's password
- **Manager:** Can change passwords of users in their organization
- **Member:** Can change their own password only

#### Ban/Unban User
- **Admin:** Can ban/unban any user
- **Manager:** Can ban/unban users in their organization
- **Member:** Cannot ban users

#### Delete User
- **Admin:** Can delete any user
- **Manager:** Can delete users in their organization
- **Member:** Cannot delete users

---

## Organization Management

### Organization Scoping for Managers

**Active Organization Concept:**
- Managers must have an `activeOrganizationId` set in their session
- All admin operations are scoped to this organization
- Managers can switch active organization if they belong to multiple orgs

**User List Filtering:**
```sql
-- Admin sees all users
SELECT * FROM "user";

-- Manager sees only users in their active organization
SELECT u.* FROM "user" u
INNER JOIN member m ON m."userId" = u.id
WHERE m."organizationId" = :activeOrganizationId;
```

**Session Management:**
```sql
-- Admin sees all sessions
SELECT * FROM session;

-- Manager sees only sessions of users in their organization
SELECT s.* FROM session s
INNER JOIN member m ON m."userId" = s."userId"
WHERE m."organizationId" = :activeOrganizationId;
```

### Organization Assignment Rules

**For Admin Role:**
- Organization assignment is **optional**
- Creating admin user: `organizationId` can be `undefined` or omitted
- Changing user to admin: All member records are deleted
- Admin can be added to organizations later if needed

**For Manager/Member Roles:**
- Organization assignment is **mandatory**
- Creating manager/member: `organizationId` is required
- Backend validates organization exists
- Backend creates member record with appropriate role
- Changing user to manager/member: Requires organization assignment

**Member Table Structure:**
```typescript
{
  id: string;              // UUID
  organizationId: string;  // FK to organization
  userId: string;          // FK to user
  role: 'manager' | 'member'; // Organization-level role
  createdAt: Date;
}
```

---

## Permissions & Restrictions

### Permission Matrix

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| **Navigation** |
| Access /admin/users | ✅ | ✅ | ❌ |
| Access /admin/sessions | ✅ | ✅ | ❌ |
| Access /admin/organizations | ✅ | ✅ (view only) | ❌ |
| Access /admin/roles | ✅ | ❌ | ❌ |
| **User Management** |
| View all users | ✅ | ❌ (org only) | ❌ |
| Create admin user | ✅ | ❌ | ❌ |
| Create manager user | ✅ | ✅ (org only) | ❌ |
| Create member user | ✅ | ✅ (org only) | ❌ |
| Update any user | ✅ | ❌ (org only) | ❌ |
| Change to admin role | ✅ | ❌ | ❌ |
| Change to manager/member | ✅ | ✅ (org only) | ❌ |
| Delete any user | ✅ | ❌ (org only) | ❌ |
| Ban/unban user | ✅ | ✅ (org only) | ❌ |
| Reset password | ✅ | ✅ (org only) | ❌ |
| **Session Management** |
| View all sessions | ✅ | ❌ (org only) | ❌ |
| Revoke any session | ✅ | ❌ (org only) | ❌ |
| **Organization Management** |
| Create organization | ✅ | ❌ | ❌ |
| Update organization | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ |
| View all organizations | ✅ | ❌ (own only) | ❌ |
| **Role & Permission Management** |
| Create role | ✅ | ❌ | ❌ |
| Update role | ✅ | ❌ | ❌ |
| Delete role | ✅ | ❌ | ❌ |
| Assign permissions | ✅ | ❌ | ❌ |
| **Impersonation** |
| Impersonate user | ✅ | ❌ | ❌ |

### Role Hierarchy Enforcement

**Creation Hierarchy:**
```
Admin can create: [admin, manager, member]
Manager can create: [manager, member]
Member can create: []
```

**Role Change Hierarchy:**
```
Admin can assign: [admin, manager, member]
Manager can assign: [manager, member] (within org only)
Member can assign: []
```

**Backend Validation:**
```typescript
function getAllowedRoleNamesForCreator(creatorRole: 'admin' | 'manager'): Array<'admin' | 'manager' | 'member'> {
  if (creatorRole === 'admin') {
    return ['admin', 'manager', 'member'];
  }
  return ['manager', 'member']; // Manager cannot create/assign admin
}
```

---

## API Endpoints

### User Management Endpoints

#### GET /api/admin/users/create-metadata
**Purpose:** Fetch allowed roles and organizations for user creation

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: Must have active organization

**Response:**
```typescript
{
  roles: [
    { name: 'admin', displayName: 'Admin', description: '...', color: '#...', isSystem: true },
    { name: 'manager', displayName: 'Manager', description: '...', color: '#...', isSystem: true },
    { name: 'member', displayName: 'Member', description: '...', color: '#...', isSystem: true }
  ],
  allowedRoleNames: ['admin', 'manager', 'member'], // or ['manager', 'member'] for managers
  organizations: [
    { id: 'uuid', name: 'Org Name', slug: 'org-slug' }
  ] // All orgs for admin, active org only for manager
}
```

#### POST /api/admin/users
**Purpose:** Create a new user

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: Must have active organization

**Request Body:**
```typescript
{
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'member';
  organizationId?: string; // Required for manager/member, optional for admin
}
```

**Validation:**
- Email format validation
- Password strength validation (min 8 chars)
- Duplicate email check
- Role allowed for creator
- Organization required for non-admin roles
- Manager can only assign to their active organization

**Response:**
```typescript
{
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Error Responses:**
- `400` - Validation error (invalid email, weak password, missing org)
- `403` - Role not allowed, organization mismatch
- `409` - Email already exists

#### GET /api/admin/users
**Purpose:** List users with pagination and search

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: Returns only users in active organization

**Query Parameters:**
```typescript
{
  limit?: number;    // Default: 10
  offset?: number;   // Default: 0
  search?: string;   // Search by name or email
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
    banned: boolean;
    createdAt: Date;
  }>;
  total: number;
}
```

#### PUT /api/admin/users/:userId
**Purpose:** Update user details

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: User must be in their active organization

**Request Body:**
```typescript
{
  name?: string;
}
```

#### PUT /api/admin/users/:userId/role
**Purpose:** Change user's platform role

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: User must be in their active organization, cannot assign admin

**Request Body:**
```typescript
{
  role: 'admin' | 'manager' | 'member';
}
```

**Side Effects:**
- Changing to admin: Deletes all member records
- Changing from admin: Creates member record in specified organization
- Updates user.role in database
- Updates member.role if applicable

#### PUT /api/admin/users/:userId/password
**Purpose:** Reset user password

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: User must be in their active organization

**Request Body:**
```typescript
{
  newPassword: string; // Min 8 characters
}
```

#### PUT /api/admin/users/:userId/ban
**Purpose:** Ban a user

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: User must be in their active organization

**Request Body:**
```typescript
{
  banReason?: string;
}
```

#### PUT /api/admin/users/:userId/unban
**Purpose:** Unban a user

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: User must be in their active organization

#### DELETE /api/admin/users/:userId
**Purpose:** Delete a user

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: User must be in their active organization

**Side Effects:**
- Cascades to delete sessions, member records, etc.

### Session Management Endpoints

#### GET /api/admin/sessions
**Purpose:** List active sessions

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: Returns only sessions of users in active organization

#### DELETE /api/admin/sessions/:token
**Purpose:** Revoke a session

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: Session user must be in their active organization

#### DELETE /api/admin/users/:userId/sessions
**Purpose:** Revoke all sessions for a user

**Authorization:**
- Requires: `admin` or `manager` role
- Manager: User must be in their active organization

---

## Security & Validation

### Authentication
- All admin endpoints require valid session cookie
- Session must have valid user with admin or manager role
- Expired sessions are rejected

### Authorization
- Role-based access control enforced at API level
- Organization scoping enforced in database queries
- Managers cannot bypass organization restrictions

### Input Validation

**Email Validation:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new BadRequestException('Invalid email format');
}
```

**Password Validation:**
```typescript
if (password.length < 8) {
  throw new BadRequestException('Password must be at least 8 characters');
}
// Future: Add complexity requirements (uppercase, numbers, symbols)
```

**Role Validation:**
```typescript
const allowedRoles = getAllowedRoleNamesForCreator(currentUserRole);
if (!allowedRoles.includes(requestedRole)) {
  throw new ForbiddenException('Role not allowed');
}
```

**Organization Validation:**
```typescript
// For non-admin roles
if (role !== 'admin' && !organizationId) {
  throw new BadRequestException('Organization is required for non-admin users');
}

// For managers creating users
if (currentUserRole === 'manager' && organizationId !== activeOrganizationId) {
  throw new ForbiddenException('Can only assign users to your active organization');
}
```

### SQL Injection Prevention
- All queries use parameterized statements
- No string concatenation in SQL queries
- Database service handles escaping

### XSS Prevention
- Frontend sanitizes user input
- Backend validates and escapes data
- Content-Security-Policy headers set

---

## UI/UX Requirements

### Create User Modal

**For Admin:**
```
┌─────────────────────────────────────┐
│ Create New User                  [X]│
├─────────────────────────────────────┤
│ Name:     [________________]        │
│ Email:    [________________]        │
│ Password: [________________]        │
│ Role:     [▼ Member        ]        │
│           Options: Admin, Manager,  │
│                    Member           │
│                                     │
│ Organization: [▼ Select org ]       │
│ (Only shown if role is Manager or  │
│  Member)                            │
│                                     │
│ [Cancel]              [Create User] │
└─────────────────────────────────────┘
```

**For Manager:**
```
┌─────────────────────────────────────┐
│ Create New User                  [X]│
├─────────────────────────────────────┤
│ Name:     [________________]        │
│ Email:    [________________]        │
│ Password: [________________]        │
│ Role:     [▼ Member        ]        │
│           Options: Manager, Member  │
│           (Admin not available)     │
│                                     │
│ Organization: [Manager Org]         │
│ (Read-only, set to active org)     │
│                                     │
│ [Cancel]              [Create User] │
└─────────────────────────────────────┘
```

### Users List Page

**For Admin:**
- Shows all users across all organizations
- Columns: Name, Email, Role, Organization, Status, Actions
- Search by name or email
- Filter by role, organization, status

**For Manager:**
- Shows only users in active organization
- Same columns and features as admin
- Cannot see users from other organizations
- Organization filter not available (always filtered to active org)

### Navigation Sidebar

**For Admin:**
```
Admin
├── Users
├── Sessions
├── Organizations
└── Roles & Permissions
```

**For Manager:**
```
Admin
├── Users
├── Sessions
└── Organizations (view only)
```

**For Member:**
```
(No admin section visible)
```

---

## Database Schema

### User Table
```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'manager' | 'member'
  image TEXT,
  banned BOOLEAN DEFAULT FALSE,
  "banReason" TEXT,
  "banExpires" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Organization Table
```sql
CREATE TABLE organization (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);
```

### Member Table
```sql
CREATE TABLE member (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'manager' | 'member' (org-level role)
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("organizationId", "userId")
);
```

### Session Table
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "activeOrganizationId" TEXT REFERENCES organization(id),
  "impersonatedBy" TEXT REFERENCES "user"(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Account Table (Better Auth)
```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "providerId" TEXT NOT NULL, -- 'credential' for email/password
  password TEXT, -- Hashed password
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Test Coverage Requirements

### Unit Tests
- [ ] `getAllowedRoleNamesForCreator()` returns correct roles
- [ ] `requireActiveOrganizationIdForManager()` throws for managers without active org
- [ ] Password hashing works correctly
- [ ] Email validation regex works

### Integration Tests (Backend API)

**User Creation:**
- [ ] Admin can create admin user without organization
- [ ] Admin can create manager user with organization
- [ ] Admin can create member user with organization
- [ ] Manager can create manager user in their org
- [ ] Manager can create member user in their org
- [ ] Manager cannot create admin user (403)
- [ ] Manager cannot create user in other org (403)
- [ ] Creating user without org for non-admin role fails (400)
- [ ] Creating user with duplicate email fails (409)
- [ ] Creating user with invalid email fails (400)
- [ ] Creating user with weak password fails (400)

**User Role Changes:**
- [ ] Admin can change member to manager
- [ ] Admin can change member to admin (removes org membership)
- [ ] Admin can change admin to manager (requires org)
- [ ] Manager can change member to manager in their org
- [ ] Manager cannot change user to admin (403)
- [ ] Manager cannot change role of user outside org (403)

**Organization Scoping:**
- [ ] Admin sees all users in list
- [ ] Manager sees only users in active org
- [ ] Manager cannot update user outside org (403)
- [ ] Manager cannot delete user outside org (403)
- [ ] Manager cannot revoke session of user outside org (403)

**Metadata Endpoint:**
- [ ] Admin gets all roles and all organizations
- [ ] Manager gets manager/member roles and active org only
- [ ] Manager without active org gets 403

### E2E Tests (Playwright)

**User Creation Flow:**
- [ ] Admin creates admin user successfully
- [ ] Admin creates manager user with org successfully
- [ ] Admin creates member user with org successfully
- [ ] Manager creates manager user in their org successfully
- [ ] Manager creates member user in their org successfully
- [ ] Manager sees only their org in org dropdown
- [ ] Manager does not see admin role in role dropdown
- [ ] Created user can login successfully
- [ ] Created user has correct role and permissions

**Role Change Flow:**
- [ ] Admin changes user role from member to manager
- [ ] Admin changes user role from manager to admin
- [ ] Manager changes user role within their org
- [ ] Manager cannot see admin option in role dropdown
- [ ] Role change updates UI immediately

**Organization Scoping:**
- [ ] Manager sees only users from their org in users list
- [ ] Manager cannot see users from other orgs
- [ ] Admin sees all users from all orgs
- [ ] Manager switching org updates visible users

**Navigation & Access:**
- [ ] Admin can access all admin pages
- [ ] Manager can access Users, Sessions, Organizations pages
- [ ] Manager cannot access Roles & Permissions page
- [ ] Member is redirected from all admin pages
- [ ] Sidebar shows correct menu items for each role

**Error Handling:**
- [ ] Creating user with duplicate email shows error
- [ ] Creating user without org (for non-admin) shows error
- [ ] Manager trying to create admin shows error
- [ ] Invalid email format shows validation error
- [ ] Weak password shows validation error

### Performance Tests
- [ ] User list loads within 2 seconds for 1000+ users
- [ ] Search/filter responds within 500ms
- [ ] User creation completes within 1 second

### Security Tests
- [ ] Unauthenticated requests return 401
- [ ] Member role cannot access admin endpoints (403)
- [ ] Manager cannot bypass org scoping via API manipulation
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized

---

## Future Enhancements

### Audit Trail
- Log all admin actions (create, update, delete, role changes)
- Store who performed action, when, and what changed
- Provide audit log viewer for admins

### Bulk Operations
- Bulk user import via CSV
- Bulk role changes
- Bulk organization assignment

### Advanced Permissions
- Custom permissions beyond role-based
- Permission inheritance
- Temporary permission grants

### Multi-Organization Management
- Manager can manage multiple organizations simultaneously
- Organization hierarchy (parent/child orgs)
- Cross-organization user transfers

### Enhanced Security
- Two-factor authentication for admin actions
- IP whitelisting for admin access
- Session timeout configuration
- Password complexity requirements
- Account lockout after failed attempts

### Notifications
- Email notifications for user creation
- Notify users when their role changes
- Alert admins of suspicious activity

---

## Appendix

### Glossary

- **Platform Role:** The global role assigned to a user (admin, manager, member) stored in `user.role`
- **Organization Role:** The role a user has within a specific organization (manager, member) stored in `member.role`
- **Active Organization:** The organization a manager is currently managing, stored in `session.activeOrganizationId`
- **Role Hierarchy:** The ordering of roles by privilege level (admin > manager > member)
- **Organization Scoping:** Restricting data access and operations to a specific organization

### References

- Better Auth Documentation: https://www.better-auth.com/
- NestJS Documentation: https://docs.nestjs.com/
- React Documentation: https://react.dev/
- Playwright Documentation: https://playwright.dev/

---

**Document Control:**
- **Author:** Development Team
- **Reviewers:** Product, Engineering, Security
- **Approval:** Product Manager
- **Next Review:** Q1 2025
