import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseAuth = vi.fn();
const mockUseOrgRole = vi.fn();

vi.mock("react-router-dom", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

vi.mock("@shared/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/hooks/useOrgRole", () => ({
  useOrgRole: () => mockUseOrgRole(),
  isManagerRole: (role: string) => ["admin", "manager"].includes(role),
}));

import { OrgManagerRoute } from "../OrgManagerRoute";

describe("OrgManagerRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders children for authenticated user in organization", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseOrgRole.mockReturnValue({ isInOrganization: true });

    render(
      <OrgManagerRoute>
        <div data-testid="child">Org Manager Content</div>
      </OrgManagerRoute>,
    );

    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("redirects to /login when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockUseOrgRole.mockReturnValue({ isInOrganization: false });

    render(
      <OrgManagerRoute>
        <div data-testid="child">Org Manager Content</div>
      </OrgManagerRoute>,
    );

    const nav = screen.getByTestId("navigate");
    expect(nav.getAttribute("data-to")).toBe("/login");
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("redirects to fallback when not in organization", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseOrgRole.mockReturnValue({ isInOrganization: false });

    render(
      <OrgManagerRoute fallbackPath="/dashboard">
        <div data-testid="child">Org Manager Content</div>
      </OrgManagerRoute>,
    );

    const nav = screen.getByTestId("navigate");
    expect(nav.getAttribute("data-to")).toBe("/dashboard");
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("redirects when memberRole is not a manager role", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseOrgRole.mockReturnValue({ isInOrganization: true });

    render(
      <OrgManagerRoute memberRole="member">
        <div data-testid="child">Org Manager Content</div>
      </OrgManagerRoute>,
    );

    const nav = screen.getByTestId("navigate");
    expect(nav.getAttribute("data-to")).toBe("/");
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("renders children when memberRole is manager", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseOrgRole.mockReturnValue({ isInOrganization: true });

    render(
      <OrgManagerRoute memberRole="manager">
        <div data-testid="child">Org Manager Content</div>
      </OrgManagerRoute>,
    );

    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("renders children when memberRole is admin", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseOrgRole.mockReturnValue({ isInOrganization: true });

    render(
      <OrgManagerRoute memberRole="admin">
        <div data-testid="child">Org Manager Content</div>
      </OrgManagerRoute>,
    );

    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("renders nothing while loading", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    mockUseOrgRole.mockReturnValue({ isInOrganization: false });

    const { container } = render(
      <OrgManagerRoute>
        <div data-testid="child">Org Manager Content</div>
      </OrgManagerRoute>,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("navigate")).toBeNull();
  });
});
