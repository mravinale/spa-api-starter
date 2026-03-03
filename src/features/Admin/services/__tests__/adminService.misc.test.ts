import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetchWithAuth, mockAdmin } = vi.hoisted(() => ({
  mockFetchWithAuth: vi.fn(),
  mockAdmin: {
    listUsers: vi.fn(),
    impersonateUser: vi.fn(),
    stopImpersonating: vi.fn(),
  },
}));

vi.mock("@shared/lib/fetch-with-auth", () => ({
  fetchWithAuth: mockFetchWithAuth,
}));

vi.mock("@shared/lib/auth-client", () => ({
  admin: mockAdmin,
  organization: {},
}));

import { adminService, getOrganizationRolesMetadata } from "../adminService";

describe("getOrganizationRolesMetadata", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns roles metadata on success", async () => {
    const metadata = { roles: [], assignableRoles: [] };
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(metadata),
    });

    const result = await getOrganizationRolesMetadata();

    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/api/platform-admin/organizations/roles-metadata"),
    );
    expect(result).toEqual(metadata);
  });

  it("throws on error response with message", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Forbidden" }),
    });

    await expect(getOrganizationRolesMetadata()).rejects.toThrow("Forbidden");
  });

  it("throws fallback message when error has no message — covers || fallback branch", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    await expect(getOrganizationRolesMetadata()).rejects.toThrow("Failed to get organization roles metadata");
  });

  it("throws fallback when json parse fails — covers .catch(() => ({})) branch", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(getOrganizationRolesMetadata()).rejects.toThrow("Failed to get organization roles metadata");
  });
});

describe("adminService.hasPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when admin.listUsers returns error — covers if(error) branch", async () => {
    mockAdmin.listUsers.mockResolvedValue({ data: null, error: { message: "List failed" } });

    await expect(
      adminService.hasPermission({ userId: "u-1", permissions: { user: ["read"] } }),
    ).rejects.toThrow("List failed");
  });

  it("throws fallback when error has no message", async () => {
    mockAdmin.listUsers.mockResolvedValue({ data: null, error: {} });

    await expect(
      adminService.hasPermission({ userId: "u-1", permissions: {} }),
    ).rejects.toThrow("Failed to check permission");
  });

  it("returns false when user not found — covers !user branch", async () => {
    mockAdmin.listUsers.mockResolvedValue({ data: { users: [] }, error: null });

    const result = await adminService.hasPermission({ userId: "missing", permissions: {} });

    expect(result).toEqual({ hasPermission: false });
  });

  it("returns true for admin role — covers user.role === admin branch", async () => {
    mockAdmin.listUsers.mockResolvedValue({ data: { users: [{ id: "u-1", role: "admin" }] }, error: null });

    const result = await adminService.hasPermission({ userId: "u-1", permissions: {} });

    expect(result).toEqual({ hasPermission: true });
  });

  it("returns false for non-admin role — covers else branch", async () => {
    mockAdmin.listUsers.mockResolvedValue({ data: { users: [{ id: "u-1", role: "member" }] }, error: null });

    const result = await adminService.hasPermission({ userId: "u-1", permissions: {} });

    expect(result).toEqual({ hasPermission: false });
  });
});
