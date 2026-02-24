import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

const {
  mockUsePermissionsContext,
  mockUseAuth,
  mockCreateOrganization,
  mockOrganization,
} = vi.hoisted(() => ({
  mockUsePermissionsContext: vi.fn(),
  mockUseAuth: vi.fn(),
  mockCreateOrganization: vi.fn(),
  mockOrganization: {
    list: vi.fn(),
    getActiveMember: vi.fn(),
    setActive: vi.fn(),
    leave: vi.fn(),
  },
}))

vi.mock("@/shared/context/PermissionsContext", () => ({
  usePermissionsContext: () => mockUsePermissionsContext(),
}))

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("@/shared/lib/auth-client", () => ({
  organization: mockOrganization,
}))

vi.mock("@/features/Admin/services/adminService", () => ({
  organizationService: {
    createOrganization: (...args: unknown[]) => mockCreateOrganization(...args),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { OrganizationSwitcher } from "../OrganizationSwitcher"

describe("OrganizationSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePermissionsContext.mockReturnValue({ can: () => false })
    mockOrganization.list.mockResolvedValue({
      data: [{ id: "org-1", name: "Test Org", slug: "test-org" }],
    })
    mockOrganization.getActiveMember.mockResolvedValue({
      data: { organizationId: "org-1" },
    })
    mockOrganization.setActive.mockResolvedValue({ data: null, error: null })
    mockOrganization.leave.mockResolvedValue({ data: null, error: null })
  })

  it("renders a read-only organization control for managers", async () => {
    mockUseAuth.mockReturnValue({ isAdmin: false })

    render(<OrganizationSwitcher />)

    const button = await waitFor(() => screen.getByRole("button", { name: /test org/i }))

    expect(button).toBeDisabled()
    expect(screen.queryByText("Create Organization")).toBeNull()
    expect(screen.queryByText(/Leave Test Org/i)).toBeNull()
  })

  it("renders an interactive organization dropdown for admins", async () => {
    mockUseAuth.mockReturnValue({ isAdmin: true })

    render(<OrganizationSwitcher />)

    const button = await waitFor(() => screen.getByRole("button", { name: /test org/i }))

    expect(button).toBeEnabled()
  })
})
