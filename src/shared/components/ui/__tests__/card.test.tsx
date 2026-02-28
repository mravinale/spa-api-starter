import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "../card";

describe("Card", () => {
  it("renders a div with data-slot=card", () => {
    render(<Card>body</Card>);
    const el = screen.getByText("body").closest("[data-slot='card']");
    expect(el).toBeInTheDocument();
    expect(el?.tagName.toLowerCase()).toBe("div");
  });

  it("merges custom className", () => {
    render(<Card className="custom-class">body</Card>);
    const el = screen.getByText("body").closest("[data-slot='card']");
    expect(el?.className).toContain("custom-class");
  });

  it("forwards additional props", () => {
    render(<Card data-testid="my-card">body</Card>);
    expect(screen.getByTestId("my-card")).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("renders a div with data-slot=card-header", () => {
    render(<CardHeader>header</CardHeader>);
    const el = screen.getByText("header").closest("[data-slot='card-header']");
    expect(el).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<CardHeader className="hdr-class">header</CardHeader>);
    const el = screen.getByText("header").closest("[data-slot='card-header']");
    expect(el?.className).toContain("hdr-class");
  });
});

describe("CardTitle", () => {
  it("renders a div with data-slot=card-title", () => {
    render(<CardTitle>My Title</CardTitle>);
    const el = screen.getByText("My Title").closest("[data-slot='card-title']");
    expect(el).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<CardTitle className="title-class">My Title</CardTitle>);
    const el = screen.getByText("My Title").closest("[data-slot='card-title']");
    expect(el?.className).toContain("title-class");
  });
});

describe("CardDescription", () => {
  it("renders a div with data-slot=card-description", () => {
    render(<CardDescription>A description</CardDescription>);
    const el = screen.getByText("A description").closest("[data-slot='card-description']");
    expect(el).toBeInTheDocument();
  });

  it("includes muted-foreground class by default", () => {
    render(<CardDescription>desc</CardDescription>);
    const el = screen.getByText("desc").closest("[data-slot='card-description']");
    expect(el?.className).toContain("muted-foreground");
  });
});

describe("CardAction", () => {
  it("renders a div with data-slot=card-action", () => {
    render(<CardAction>action</CardAction>);
    const el = screen.getByText("action").closest("[data-slot='card-action']");
    expect(el).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<CardAction className="act-class">action</CardAction>);
    const el = screen.getByText("action").closest("[data-slot='card-action']");
    expect(el?.className).toContain("act-class");
  });
});

describe("CardContent", () => {
  it("renders a div with data-slot=card-content", () => {
    render(<CardContent>content</CardContent>);
    const el = screen.getByText("content").closest("[data-slot='card-content']");
    expect(el).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<CardContent className="cnt-class">content</CardContent>);
    const el = screen.getByText("content").closest("[data-slot='card-content']");
    expect(el?.className).toContain("cnt-class");
  });
});

describe("CardFooter", () => {
  it("renders a div with data-slot=card-footer", () => {
    render(<CardFooter>footer</CardFooter>);
    const el = screen.getByText("footer").closest("[data-slot='card-footer']");
    expect(el).toBeInTheDocument();
  });

  it("includes flex and items-center classes by default", () => {
    render(<CardFooter>footer</CardFooter>);
    const el = screen.getByText("footer").closest("[data-slot='card-footer']");
    expect(el?.className).toContain("flex");
    expect(el?.className).toContain("items-center");
  });

  it("merges custom className", () => {
    render(<CardFooter className="ftr-class">footer</CardFooter>);
    const el = screen.getByText("footer").closest("[data-slot='card-footer']");
    expect(el?.className).toContain("ftr-class");
  });

  it("renders children content", () => {
    render(
      <CardFooter>
        <button>Save</button>
        <button>Cancel</button>
      </CardFooter>,
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});

describe("Card composition", () => {
  it("renders a fully composed card with all sub-components", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>
            <button>Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>
          <button>Submit</button>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /action/i })).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });
});
