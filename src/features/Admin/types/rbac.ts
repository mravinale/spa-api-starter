/**
 * RBAC Types for Role-Based Access Control
 * 
 * These types mirror the backend permissions configuration.
 */

/**
 * Available resources in the system
 */
export type Resource = "user" | "session";

/**
 * Actions available for user resource
 */
export type UserAction = "create" | "list" | "set-role" | "ban" | "impersonate" | "delete" | "set-password";

/**
 * Actions available for session resource
 */
export type SessionAction = "list" | "revoke" | "delete";

/**
 * Permission statement structure
 */
export interface PermissionStatement {
  user?: UserAction[];
  session?: SessionAction[];
}

/**
 * Role names available in the system
 */
export type RoleName = "admin" | "user" | "moderator";

/**
 * Role definition with metadata
 */
export interface Role {
  name: RoleName;
  displayName: string;
  description: string;
  color: "red" | "gray" | "blue" | "green" | "yellow" | "purple";
  permissions: PermissionStatement;
}

/**
 * All available roles with their configurations
 */
export const ROLES: Record<RoleName, Role> = {
  admin: {
    name: "admin",
    displayName: "Admin",
    description: "Full access to all resources and actions",
    color: "red",
    permissions: {
      user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password"],
      session: ["list", "revoke", "delete"],
    },
  },
  user: {
    name: "user",
    displayName: "User",
    description: "Basic user with no administrative permissions",
    color: "gray",
    permissions: {},
  },
  moderator: {
    name: "moderator",
    displayName: "Moderator",
    description: "Can manage users and sessions, but cannot delete or impersonate",
    color: "blue",
    permissions: {
      user: ["list", "ban"],
      session: ["list", "revoke"],
    },
  },
};

/**
 * Get all available role names
 */
export const getRoleNames = (): RoleName[] => Object.keys(ROLES) as RoleName[];

/**
 * Get role by name
 */
export const getRole = (name: RoleName): Role | undefined => ROLES[name];

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (
  roleName: RoleName,
  resource: Resource,
  action: string
): boolean => {
  const role = ROLES[roleName];
  if (!role) return false;
  
  // Admin has all permissions
  if (roleName === "admin") return true;
  
  const resourcePermissions = role.permissions[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions.includes(action as never);
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (roleName: RoleName): PermissionStatement => {
  const role = ROLES[roleName];
  return role?.permissions ?? {};
};

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  role: RoleName;
  resource: Resource;
  action: string;
}
