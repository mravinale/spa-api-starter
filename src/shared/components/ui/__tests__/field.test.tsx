import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "../field";

describe("Field components", () => {
  describe("FieldSet", () => {
    it("renders a fieldset element with data-slot", () => {
      render(<FieldSet data-testid="fs">content</FieldSet>);
      const el = screen.getByTestId("fs");
      expect(el.tagName.toLowerCase()).toBe("fieldset");
      expect(el).toHaveAttribute("data-slot", "field-set");
    });
  });

  describe("FieldLegend", () => {
    it("renders with default legend variant", () => {
      render(
        <fieldset>
          <FieldLegend data-testid="legend">My Legend</FieldLegend>
        </fieldset>,
      );
      const el = screen.getByTestId("legend");
      expect(el.tagName.toLowerCase()).toBe("legend");
      expect(el).toHaveAttribute("data-variant", "legend");
    });

    it("renders with label variant", () => {
      render(
        <fieldset>
          <FieldLegend variant="label" data-testid="legend-label">Label</FieldLegend>
        </fieldset>,
      );
      expect(screen.getByTestId("legend-label")).toHaveAttribute("data-variant", "label");
    });
  });

  describe("FieldGroup", () => {
    it("renders with data-slot field-group", () => {
      render(<FieldGroup data-testid="fg">group</FieldGroup>);
      expect(screen.getByTestId("fg")).toHaveAttribute("data-slot", "field-group");
    });
  });

  describe("Field", () => {
    it("renders with default vertical orientation", () => {
      render(<Field data-testid="field">content</Field>);
      const el = screen.getByTestId("field");
      expect(el).toHaveAttribute("data-slot", "field");
      expect(el).toHaveAttribute("data-orientation", "vertical");
    });

    it("renders with horizontal orientation", () => {
      render(
        <Field orientation="horizontal" data-testid="field-h">
          content
        </Field>,
      );
      expect(screen.getByTestId("field-h")).toHaveAttribute("data-orientation", "horizontal");
    });
  });

  describe("FieldContent", () => {
    it("renders with data-slot field-content", () => {
      render(<FieldContent data-testid="fc">content</FieldContent>);
      expect(screen.getByTestId("fc")).toHaveAttribute("data-slot", "field-content");
    });
  });

  describe("FieldLabel", () => {
    it("renders with data-slot field-label", () => {
      render(<FieldLabel data-testid="fl">Email</FieldLabel>);
      expect(screen.getByTestId("fl")).toHaveAttribute("data-slot", "field-label");
    });
  });

  describe("FieldTitle", () => {
    it("renders with data-slot field-label", () => {
      render(<FieldTitle data-testid="ft">Title</FieldTitle>);
      expect(screen.getByTestId("ft")).toHaveAttribute("data-slot", "field-label");
    });
  });

  describe("FieldDescription", () => {
    it("renders a paragraph with data-slot field-description", () => {
      render(<FieldDescription data-testid="fd">Helper text</FieldDescription>);
      const el = screen.getByTestId("fd");
      expect(el.tagName.toLowerCase()).toBe("p");
      expect(el).toHaveAttribute("data-slot", "field-description");
    });
  });

  describe("FieldSeparator", () => {
    it("renders with data-slot field-separator", () => {
      render(<FieldSeparator data-testid="fsep" />);
      expect(screen.getByTestId("fsep")).toHaveAttribute("data-slot", "field-separator");
    });

    it("renders children inside the separator", () => {
      render(<FieldSeparator data-testid="fsep2">OR</FieldSeparator>);
      expect(screen.getByText("OR")).toBeInTheDocument();
    });
  });

  describe("FieldError", () => {
    it("renders nothing when errors array is empty", () => {
      const { container } = render(<FieldError errors={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders a single error message", () => {
      render(<FieldError errors={[{ message: "Required" }]} />);
      expect(screen.getByText("Required")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("renders multiple unique errors as a list", () => {
      render(
        <FieldError
          errors={[{ message: "Too short" }, { message: "Invalid format" }]}
        />,
      );
      expect(screen.getByText("Too short")).toBeInTheDocument();
      expect(screen.getByText("Invalid format")).toBeInTheDocument();
    });

    it("deduplicates errors with the same message", () => {
      render(
        <FieldError errors={[{ message: "Required" }, { message: "Required" }]} />,
      );
      const items = screen.getAllByText("Required");
      expect(items).toHaveLength(1);
    });

    it("renders children when provided instead of errors", () => {
      render(<FieldError errors={[{ message: "ignored" }]}>Custom error</FieldError>);
      expect(screen.getByText("Custom error")).toBeInTheDocument();
      expect(screen.queryByText("ignored")).toBeNull();
    });

    it("renders nothing when errors contain only undefined entries", () => {
      const { container } = render(<FieldError errors={[undefined]} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
