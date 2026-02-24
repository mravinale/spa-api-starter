/**
 * Role hierarchy for determining assignable roles.
 * Higher number = higher privilege.
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  member: 0,
  manager: 1,
  admin: 2,
};

/**
 * Returns the hierarchy level for a role name.
 * Unknown roles default to 0 (lowest).
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] ?? 0;
}

/**
 * Filter roles to only those assignable by the given requester role.
 * A user can only assign roles at or below their own level.
 */
export function filterAssignableRoles(allRoleNames: string[], requesterRole: string): string[] {
  const requesterLevel = getRoleLevel(requesterRole);
  return allRoleNames.filter((r) => {
    const roleLevel = ROLE_HIERARCHY[r];
    return roleLevel !== undefined && roleLevel <= requesterLevel;
  });
}
