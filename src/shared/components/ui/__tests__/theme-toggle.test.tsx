import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockSetTheme } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
}));

vi.mock("../theme-provider", () => ({
  useTheme: () => ({ setTheme: mockSetTheme }),
}));

import { ThemeToggle } from "../theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("calls setTheme('light') when Light menu item is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(await screen.findByRole("menuitem", { name: /^light$/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("calls setTheme('dark') when Dark menu item is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(await screen.findByRole("menuitem", { name: /^dark$/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme('system') when System menu item is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(await screen.findByRole("menuitem", { name: /^system$/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
