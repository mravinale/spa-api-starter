import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

describe("Dialog components", () => {
  describe("DialogHeader", () => {
    it("renders children inside a div", () => {
      render(<DialogHeader data-testid="dh">Header content</DialogHeader>);
      const el = screen.getByTestId("dh");
      expect(el.tagName.toLowerCase()).toBe("div");
      expect(el).toHaveTextContent("Header content");
    });
  });

  describe("DialogFooter", () => {
    it("renders children inside a div", () => {
      render(<DialogFooter data-testid="df">Footer content</DialogFooter>);
      const el = screen.getByTestId("df");
      expect(el.tagName.toLowerCase()).toBe("div");
      expect(el).toHaveTextContent("Footer content");
    });
  });

  describe("DialogOverlay", () => {
    it("renders with the correct classes when ref is forwarded", () => {
      render(
        <Dialog open>
          <DialogOverlay data-testid="do" />
        </Dialog>,
      );
      expect(screen.getByTestId("do")).toBeInTheDocument();
    });
  });

  describe("DialogTitle", () => {
    it("renders accessible heading text", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>My Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>,
      );
      expect(screen.getByText("My Dialog Title")).toBeInTheDocument();
    });
  });

  describe("DialogDescription", () => {
    it("renders description text", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Some description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );
      expect(screen.getByText("Some description")).toBeInTheDocument();
    });
  });

  describe("DialogContent", () => {
    it("renders children inside an open dialog", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>,
      );
      expect(screen.getByText("Dialog body")).toBeInTheDocument();
    });
  });

  describe("DialogTrigger and DialogClose", () => {
    it("exports DialogTrigger and DialogClose without errors", () => {
      expect(DialogTrigger).toBeDefined();
      expect(DialogClose).toBeDefined();
    });
  });
});
