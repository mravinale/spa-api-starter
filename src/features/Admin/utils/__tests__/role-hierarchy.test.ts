import { describe, it, expect } from 'vitest';
import { ROLE_HIERARCHY, getRoleLevel, filterAssignableRoles } from '../role-hierarchy';

describe('Role Hierarchy Utilities', () => {
  describe('ROLE_HIERARCHY', () => {
    it('should have member < manager < admin < owner', () => {
      expect(ROLE_HIERARCHY.member).toBeLessThan(ROLE_HIERARCHY.manager);
      expect(ROLE_HIERARCHY.manager).toBeLessThan(ROLE_HIERARCHY.admin);
      expect(ROLE_HIERARCHY.admin).toBeLessThan(ROLE_HIERARCHY.owner);
    });
  });

  describe('getRoleLevel', () => {
    it('should return correct level for known roles', () => {
      expect(getRoleLevel('member')).toBe(0);
      expect(getRoleLevel('manager')).toBe(1);
      expect(getRoleLevel('admin')).toBe(2);
      expect(getRoleLevel('owner')).toBe(3);
    });

    it('should return 0 for unknown roles', () => {
      expect(getRoleLevel('unknown')).toBe(0);
      expect(getRoleLevel('')).toBe(0);
    });
  });

  describe('filterAssignableRoles', () => {
    const allRoles = ['admin', 'manager', 'member'];

    it('manager should only assign manager and member', () => {
      expect(filterAssignableRoles(allRoles, 'manager')).toEqual(['manager', 'member']);
    });

    it('admin should assign all roles', () => {
      expect(filterAssignableRoles(allRoles, 'admin')).toEqual(['admin', 'manager', 'member']);
    });

    it('member should only assign member', () => {
      expect(filterAssignableRoles(allRoles, 'member')).toEqual(['member']);
    });

    it('owner should assign all roles including admin', () => {
      const rolesWithOwner = ['owner', 'admin', 'manager', 'member'];
      expect(filterAssignableRoles(rolesWithOwner, 'owner')).toEqual(rolesWithOwner);
    });

    it('unknown role should only assign member-level roles', () => {
      expect(filterAssignableRoles(allRoles, 'unknown')).toEqual(['member']);
    });

    it('should handle empty input', () => {
      expect(filterAssignableRoles([], 'admin')).toEqual([]);
    });
  });
});
