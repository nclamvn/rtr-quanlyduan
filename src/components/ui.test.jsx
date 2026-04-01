import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Badge, Btn, Section, NotifIcon, RoleIcon } from "./ui";

describe("Badge", () => {
  it("renders label and applies color", () => {
    render(<Badge label="CRITICAL" color="#EF4444" />);
    const badge = screen.getByText("CRITICAL");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ color: "#EF4444" });
  });

  it("renders with custom icon", () => {
    const MockIcon = ({ size }) => <svg data-testid="mock-icon" width={size} />;
    render(<Badge label="TEST" color="#000" icon={MockIcon} />);
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("applies size lg padding", () => {
    render(<Badge label="BIG" color="#000" size="lg" />);
    const badge = screen.getByText("BIG");
    expect(badge).toHaveStyle({ padding: "3px 10px" });
  });
});

describe("Btn", () => {
  it("renders children and handles click", () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick}>Click me</Btn>);
    fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    const onClick = vi.fn();
    render(
      <Btn onClick={onClick} disabled>
        Disabled
      </Btn>,
    );
    const btn = screen.getByText("Disabled").closest("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveStyle({ opacity: "0.4" });
  });

  it("applies primary variant styles", () => {
    render(<Btn variant="primary">Save</Btn>);
    const btn = screen.getByText("Save").closest("button");
    expect(btn).toHaveStyle({ background: "#1D4ED8", color: "#fff" });
  });

  it("applies danger variant styles", () => {
    render(<Btn variant="danger">Delete</Btn>);
    const btn = screen.getByText("Delete").closest("button");
    expect(btn).toHaveStyle({ background: "#7F1D1D" });
  });

  it("applies small size", () => {
    render(<Btn small>Sm</Btn>);
    const btn = screen.getByText("Sm").closest("button");
    expect(btn).toHaveStyle({ padding: "3px 8px" });
  });
});

describe("Section", () => {
  it("renders title and children", () => {
    render(
      <Section title="My Section">
        <p>Content here</p>
      </Section>,
    );
    expect(screen.getByText("My Section")).toBeInTheDocument();
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("renders actions slot", () => {
    render(
      <Section title="Title" actions={<button>Action</button>}>
        <p>Body</p>
      </Section>,
    );
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders without title", () => {
    render(
      <Section>
        <p>No title</p>
      </Section>,
    );
    expect(screen.getByText("No title")).toBeInTheDocument();
  });
});

describe("NotifIcon", () => {
  it("renders CRITICAL_ISSUE icon", () => {
    const { container } = render(<NotifIcon type="CRITICAL_ISSUE" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders MILESTONE_IMPACT icon", () => {
    const { container } = render(<NotifIcon type="MILESTONE_IMPACT" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders default icon for unknown type", () => {
    const { container } = render(<NotifIcon type="UNKNOWN" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("RoleIcon", () => {
  it("renders admin icon", () => {
    const { container } = render(<RoleIcon role="admin" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders pm icon", () => {
    const { container } = render(<RoleIcon role="pm" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders engineer icon", () => {
    const { container } = render(<RoleIcon role="engineer" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders default icon for viewer", () => {
    const { container } = render(<RoleIcon role="viewer" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
