import { useQuery } from "@tanstack/react-query";
import { adminService } from "../services/adminService";
import {
  ROLES,
  getRoleNames,
  getRole,
  roleHasPermission,
  type RoleName,
  type Role,
  type Resource,
  type PermissionStatement,
} from "../types/rbac";

/**
 * Query keys for roles-related queries
 */
export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  usersByRole: (role: string) => [...roleKeys.all, "users", role] as const,
  permissions: (userId: string) => [...roleKeys.all, "permissions", userId] as const,
};

/**
 * Hook to get all available roles and role utilities
 */
export function useRoles() {
  const roles = getRoleNames().map((name) => ROLES[name]);

  return {
    roles,
    roleNames: getRoleNames(),
    getRole: (name: RoleName): Role | undefined => getRole(name),
    hasPermission: (roleName: RoleName, resource: Resource, action: string): boolean =>
      roleHasPermission(roleName, resource, action),
  };
}

/**
 * Hook to fetch users filtered by role
 */
export function useUsersByRole(role: RoleName) {
  return useQuery({
    queryKey: roleKeys.usersByRole(role),
    queryFn: () =>
      adminService.listUsers({
        filterField: "role",
        filterValue: role,
      }),
  });
}

/**
 * Hook to check if a user has specific permissions
 */
export function useCheckPermission(
  userId: string,
  permissions: PermissionStatement,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: roleKeys.permissions(userId),
    queryFn: () =>
      adminService.hasPermission({
        userId,
        permissions: permissions as Record<string, string[]>,
      }),
    enabled: options?.enabled ?? true,
  });
}

// Note: useSetUserRole is exported from useUsers.ts to avoid duplication
