import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetchWithAuth } = vi.hoisted(() => ({
  mockFetchWithAuth: vi.fn(),
}));

vi.mock("@shared/lib/fetch-with-auth", () => ({
  fetchWithAuth: mockFetchWithAuth,
}));

vi.mock("@shared/lib/auth-client", () => ({
  admin: {},
  organization: {},
}));

import { organizationService } from "../adminService";

describe("organizationService permissions sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates organization through guarded backend endpoint", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "org-1", name: "New Org", slug: "new-org" } }),
    });

    const result = await organizationService.createOrganization({
      name: "New Org",
      slug: "new-org",
    });

    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/api/platform-admin/organizations"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual({ id: "org-1", name: "New Org", slug: "new-org" });
  });

  it("returns true immediately for admin create capability", async () => {
    const result = await organizationService.canCreateOrganization("admin");

    expect(result).toBe(true);
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });

  it("checks manager create capability through backend permission endpoint", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { hasPermission: true } }),
    });

    const result = await organizationService.canCreateOrganization("manager");

    expect(result).toBe(true);
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/api/rbac/check/manager/organization/create"),
    );
  });

  it("returns false when capability endpoint fails", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Forbidden" }),
    });

    const result = await organizationService.canCreateOrganization("manager");

    expect(result).toBe(false);
  });
});
