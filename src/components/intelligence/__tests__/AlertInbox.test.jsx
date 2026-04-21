import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AlertInbox from "../AlertInbox";

// Mock alertsStore
const mockLoadAlerts = vi.fn();
const mockSetupRealtime = vi.fn();
const mockTeardownRealtime = vi.fn();
const mockSelectAlert = vi.fn();
const mockClearSelection = vi.fn();
const mockSetFilter = vi.fn();

let mockStoreState = {};

vi.mock("../../../stores/alertsStore", () => ({
  useAlertsStore: (selector) => {
    const state = {
      alerts: mockStoreState.alerts || [],
      filters: mockStoreState.filters || { status: "open", severity: "ALL", agent: "ALL" },
      selectedAlertId: mockStoreState.selectedAlertId || null,
      loading: mockStoreState.loading || false,
      loadAlerts: mockLoadAlerts,
      setFilter: mockSetFilter,
      selectAlert: mockSelectAlert,
      clearSelection: mockClearSelection,
      setupRealtime: mockSetupRealtime,
      teardownRealtime: mockTeardownRealtime,
    };
    return selector ? selector(state) : state;
  },
}));

const mockT = {
  inbox: {
    title: "Agent Inbox",
    open: "Open",
    acknowledged: "Acknowledged",
    resolved: "Resolved",
    ALL: "All",
    allSeverity: "All",
    loading: "Loading...",
    empty: "No alerts yet",
    emptySub: "4 agents are monitoring.",
  },
};

function makeAlert(overrides = {}) {
  return {
    id: "alert-1",
    agent: "causal",
    severity: "critical",
    entity_ref: "PRJ-HERA",
    summary: "Motor supplier delay cascades to DVT gate",
    status: "open",
    created_at: new Date().toISOString(),
    suggested_assignee: null,
    allocation_confidence: null,
    dispatched_at: null,
    dispatch_channels: [],
    dispatch_gate: null,
    details: {},
    ...overrides,
  };
}

describe("AlertInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {};
  });

  it("renders empty state when no alerts", () => {
    mockStoreState = { alerts: [], loading: false };
    render(<AlertInbox lang="en" t={mockT} />);
    expect(screen.getByText("No alerts yet")).toBeDefined();
    expect(mockLoadAlerts).toHaveBeenCalled();
    expect(mockSetupRealtime).toHaveBeenCalled();
  });

  it("renders list of alerts", () => {
    mockStoreState = {
      alerts: [
        makeAlert({ id: "a1", summary: "Motor delay" }),
        makeAlert({ id: "a2", summary: "PCB shortage", severity: "warning", agent: "convergence" }),
        makeAlert({ id: "a3", summary: "Low stock alert", severity: "info", agent: "allocation" }),
      ],
      loading: false,
    };

    render(<AlertInbox lang="en" t={mockT} />);
    expect(screen.getByText("Motor delay")).toBeDefined();
    expect(screen.getByText("PCB shortage")).toBeDefined();
    expect(screen.getByText("Low stock alert")).toBeDefined();
  });

  it("clicking alert card calls selectAlert", () => {
    mockStoreState = {
      alerts: [makeAlert({ id: "a1", summary: "Motor delay" })],
      loading: false,
    };

    render(<AlertInbox lang="en" t={mockT} />);
    fireEvent.click(screen.getByText("Motor delay"));
    expect(mockSelectAlert).toHaveBeenCalledWith("a1");
  });
});
