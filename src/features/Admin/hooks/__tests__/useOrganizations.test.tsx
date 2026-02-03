import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useOrganizations,
  useUserInvitations,
  useAcceptInvitation,
  useRejectInvitation,
  useActiveMember,
  useLeaveOrganization,
  useSetActiveOrganization,
  useCheckSlug,
  organizationKeys,
} from "../useOrganizations"
import { organizationService } from "../../services/adminService"

// Mock the organization service
vi.mock("../../services/adminService", () => ({
  organizationService: {
    listOrganizations: vi.fn(),
    listUserInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    rejectInvitation: vi.fn(),
    getActiveMember: vi.fn(),
    leaveOrganization: vi.fn(),
    setActive: vi.fn(),
    checkSlug: vi.fn(),
  },
}))

// Get typed mock references
const mockOrgService = organizationService as unknown as {
  listOrganizations: Mock
  listUserInvitations: Mock
  acceptInvitation: Mock
  rejectInvitation: Mock
  getActiveMember: Mock
  leaveOrganization: Mock
  setActive: Mock
  checkSlug: Mock
}

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useOrganizations hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("organizationKeys", () => {
    it("should generate correct query keys", () => {
      expect(organizationKeys.all).toEqual(["organizations"])
      expect(organizationKeys.list({})).toEqual(["organizations", "list", {}])
      expect(organizationKeys.detail("org-1")).toEqual(["organizations", "detail", "org-1"])
      expect(organizationKeys.userInvitations()).toEqual(["organizations", "userInvitations"])
      expect(organizationKeys.activeMember()).toEqual(["organizations", "activeMember"])
    })
  })

  describe("useOrganizations", () => {
    it("should fetch organizations list", async () => {
      const mockOrgs = [
        { id: "org-1", name: "Org 1", slug: "org-1", createdAt: new Date(), logo: null, metadata: {} },
        { id: "org-2", name: "Org 2", slug: "org-2", createdAt: new Date(), logo: null, metadata: {} },
      ]
      mockOrgService.listOrganizations.mockResolvedValue(mockOrgs)

      const { result } = renderHook(() => useOrganizations(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockOrgs)
      expect(mockOrgService.listOrganizations).toHaveBeenCalledTimes(1)
    })
  })

  describe("useUserInvitations", () => {
    it("should fetch user invitations", async () => {
      const mockInvitations = [
        { id: "inv-1", email: "test@example.com", role: "member", status: "pending", organizationId: "org-1", inviterId: "user-1", expiresAt: new Date(), createdAt: new Date() },
      ]
      mockOrgService.listUserInvitations.mockResolvedValue(mockInvitations)

      const { result } = renderHook(() => useUserInvitations(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockInvitations)
    })
  })

  describe("useAcceptInvitation", () => {
    it("should accept an invitation", async () => {
      mockOrgService.acceptInvitation.mockResolvedValue({})

      const { result } = renderHook(() => useAcceptInvitation(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync("inv-1")

      expect(mockOrgService.acceptInvitation).toHaveBeenCalledWith("inv-1")
    })
  })

  describe("useRejectInvitation", () => {
    it("should reject an invitation", async () => {
      mockOrgService.rejectInvitation.mockResolvedValue(undefined)

      const { result } = renderHook(() => useRejectInvitation(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync("inv-1")

      expect(mockOrgService.rejectInvitation).toHaveBeenCalledWith("inv-1")
    })
  })

  describe("useActiveMember", () => {
    it("should fetch active member", async () => {
      const mockMember = { id: "member-1", role: "admin", organizationId: "org-1", createdAt: new Date(), userId: "user-1" }
      mockOrgService.getActiveMember.mockResolvedValue(mockMember)

      const { result } = renderHook(() => useActiveMember(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockMember)
    })
  })

  describe("useLeaveOrganization", () => {
    it("should leave an organization", async () => {
      mockOrgService.leaveOrganization.mockResolvedValue(undefined)

      const { result } = renderHook(() => useLeaveOrganization(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync("org-1")

      expect(mockOrgService.leaveOrganization).toHaveBeenCalledWith("org-1")
    })
  })

  describe("useSetActiveOrganization", () => {
    it("should set active organization", async () => {
      mockOrgService.setActive.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSetActiveOrganization(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync("org-1")

      expect(mockOrgService.setActive).toHaveBeenCalledWith("org-1")
    })
  })

  describe("useCheckSlug", () => {
    it("should check if slug is available", async () => {
      mockOrgService.checkSlug.mockResolvedValue({ status: true })

      const { result } = renderHook(() => useCheckSlug(), {
        wrapper: createWrapper(),
      })

      const checkResult = await result.current.mutateAsync("my-org")

      expect(mockOrgService.checkSlug).toHaveBeenCalledWith("my-org")
      expect(checkResult).toEqual({ status: true })
    })

    it("should return false for taken slug", async () => {
      mockOrgService.checkSlug.mockResolvedValue({ status: false })

      const { result } = renderHook(() => useCheckSlug(), {
        wrapper: createWrapper(),
      })

      const checkResult = await result.current.mutateAsync("existing-org")

      expect(checkResult).toEqual({ status: false })
    })
  })
})
