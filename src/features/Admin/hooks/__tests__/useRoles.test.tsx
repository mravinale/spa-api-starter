import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useRoles,
  useUsersByRole,
  useCheckPermission,
  roleKeys,
} from "../useRoles";
import { adminService } from "../../services/adminService";

// Mock the admin service
vi.mock("../../services/adminService", () => ({
  adminService: {
    listUsers: vi.fn(),
    setRole: vi.fn(),
    hasPermission: vi.fn(),
  },
}));

// Get typed mock references
const mockAdminService = adminService as unknown as {
  listUsers: Mock;
  setRole: Mock;
  hasPermission: Mock;
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

  describe("roleKeys", () => {
    it("should generate correct query keys", () => {
      expect(roleKeys.all).toEqual(["roles"]);
      expect(roleKeys.list()).toEqual(["roles", "list"]);
      expect(roleKeys.usersByRole("admin")).toEqual(["roles", "users", "admin"]);
      expect(roleKeys.permissions("user-1")).toEqual(["roles", "permissions", "user-1"]);
    });
  });

  describe("useRoles", () => {
    it("should return all available roles", () => {
      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      });

      expect(result.current.roles).toHaveLength(3);
      expect(result.current.roles.map((r: { name: string }) => r.name)).toEqual(["admin", "user", "moderator"]);
    });

    it("should return role by name", () => {
      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      });

      const adminRole = result.current.getRole("admin");
      expect(adminRole).toBeDefined();
      expect(adminRole?.displayName).toBe("Admin");
      expect(adminRole?.color).toBe("red");
    });

    it("should check if role has permission", () => {
      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasPermission("admin", "user", "delete")).toBe(true);
      expect(result.current.hasPermission("user", "user", "delete")).toBe(false);
      expect(result.current.hasPermission("moderator", "user", "ban")).toBe(true);
      expect(result.current.hasPermission("moderator", "user", "delete")).toBe(false);
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

  describe("useCheckPermission", () => {
    it("should check user permission via API", async () => {
      mockAdminService.hasPermission.mockResolvedValue({ hasPermission: true });

      const { result } = renderHook(
        () => useCheckPermission("user-1", { user: ["delete"] }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ hasPermission: true });
      expect(mockAdminService.hasPermission).toHaveBeenCalledWith({
        userId: "user-1",
        permissions: { user: ["delete"] },
      });
    });
  });

  // Note: useSetUserRole tests are in useUsers.test.tsx
});
