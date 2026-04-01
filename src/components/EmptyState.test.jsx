import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No data" description="Nothing to show" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Nothing to show")).toBeInTheDocument();
  });

  it("renders action button when actionLabel and onAction provided", () => {
    const onAction = vi.fn();
    render(<EmptyState title="Empty" actionLabel="Create" onAction={onAction} />);
    const btn = screen.getByText("Create");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("does not render action button without onAction", () => {
    render(<EmptyState title="Empty" actionLabel="Create" />);
    expect(screen.queryByText("Create")).not.toBeInTheDocument();
  });

  it("renders icon as svg", () => {
    const { container } = render(<EmptyState icon="Package" title="No BOM" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("falls back to AlertCircle for unknown icon", () => {
    const { container } = render(<EmptyState icon="NonExistent" title="Fallback" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("EMPTY_MESSAGES", () => {
  it("has both vi and en locales", () => {
    expect(EMPTY_MESSAGES).toHaveProperty("vi");
    expect(EMPTY_MESSAGES).toHaveProperty("en");
  });

  const expectedKeys = [
    "issues",
    "bom",
    "flights",
    "suppliers",
    "decisions",
    "audit",
    "review",
    "orders",
    "production",
    "inventory",
    "finance",
  ];

  it.each(expectedKeys)("vi locale has '%s' with title", (key) => {
    expect(EMPTY_MESSAGES.vi[key]).toHaveProperty("title");
    expect(EMPTY_MESSAGES.vi[key].title).toBeTruthy();
  });

  it.each(expectedKeys)("en locale has '%s' with title", (key) => {
    expect(EMPTY_MESSAGES.en[key]).toHaveProperty("title");
    expect(EMPTY_MESSAGES.en[key].title).toBeTruthy();
  });
});
