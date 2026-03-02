import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { ErrorBoundary } from "../ErrorBoundary";

function ThrowError(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it("renders default fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders custom fallback UI when provided", () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom fallback</div>}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
  });

  it("resets error when resetKey changes", async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const [key, setKey] = useState("initial");
      const [shouldThrow, setShouldThrow] = useState(true);

      return (
        <div>
          <button onClick={() => { setShouldThrow(false); setKey("changed"); }} data-testid="reset-btn">
            Reset
          </button>
          <ErrorBoundary resetKey={key}>
            {shouldThrow ? <ThrowError /> : <div data-testid="recovered">Recovered</div>}
          </ErrorBoundary>
        </div>
      );
    }

    render(<TestComponent />);

    // Initially shows error fallback
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click reset button to change resetKey
    await user.click(screen.getByTestId("reset-btn"));

    // Should now show recovered content
    await waitFor(() => {
      expect(screen.getByTestId("recovered")).toBeInTheDocument();
    });
  });
});
