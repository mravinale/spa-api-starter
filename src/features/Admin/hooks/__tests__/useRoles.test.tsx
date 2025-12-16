import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useRoles,
  useUsersByRole,
  useCreateRole,
  useDeleteRole,
  rbacKeys,
} from "../useRoles";
import { rbacService } from "../../services/rbacService";
import { adminService } from "../../services/adminService";

// Mock the services
vi.mock("../../services/rbacService", () => ({
  rbacService: {
    getRoles: vi.fn(),
    getRole: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    assignPermissions: vi.fn(),
    getPermissions: vi.fn(),
    getPermissionsGrouped: vi.fn(),
    getUserPermissions: vi.fn(),
    checkPermission: vi.fn(),
  },
}));

vi.mock("../../services/adminService", () => ({
  adminService: {
    listUsers: vi.fn(),
  },
}));

// Get typed mock references
const mockRbacService = rbacService as unknown as {
  getRoles: Mock;
  getRole: Mock;
  createRole: Mock;
  deleteRole: Mock;
};

const mockAdminService = adminService as unknown as {
  listUsers: Mock;
};

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useRoles hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rbacKeys", () => {
    it("should generate correct query keys", () => {
      expect(rbacKeys.all).toEqual(["rbac"]);
      expect(rbacKeys.roles()).toEqual(["rbac", "roles"]);
      expect(rbacKeys.role("role-1")).toEqual(["rbac", "role", "role-1"]);
      expect(rbacKeys.permissions()).toEqual(["rbac", "permissions"]);
      expect(rbacKeys.usersByRole("admin")).toEqual(["rbac", "users", "admin"]);
    });
  });

  describe("useRoles", () => {
    it("should fetch roles from API", async () => {
      const mockRoles = [
        { id: "1", name: "admin", displayName: "Admin", description: "Full access", color: "red", isSystem: true },
        { id: "2", name: "user", displayName: "User", description: "Basic user", color: "gray", isSystem: true },
      ];
      mockRbacService.getRoles.mockResolvedValue(mockRoles);

      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe("admin");
    });
  });

  describe("useUsersByRole", () => {
    it("should fetch users filtered by role", async () => {
      const mockUsers = {
        data: [
          { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
        ],
        total: 1,
      };
      mockAdminService.listUsers.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsersByRole("admin"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUsers);
      expect(mockAdminService.listUsers).toHaveBeenCalledWith({
        filterField: "role",
        filterValue: "admin",
      });
    });
  });

  describe("useCreateRole", () => {
    it("should create a new role", async () => {
      const newRole = { id: "3", name: "editor", displayName: "Editor", color: "blue", isSystem: false };
      mockRbacService.createRole.mockResolvedValue(newRole);

      const { result } = renderHook(() => useCreateRole(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        name: "editor",
        displayName: "Editor",
        color: "blue",
      });

      expect(mockRbacService.createRole).toHaveBeenCalledWith({
        name: "editor",
        displayName: "Editor",
        color: "blue",
      });
    });
  });

  describe("useDeleteRole", () => {
    it("should delete a role", async () => {
      mockRbacService.deleteRole.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteRole(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync("role-1");

      expect(mockRbacService.deleteRole).toHaveBeenCalledWith("role-1");
    });
  });
});
