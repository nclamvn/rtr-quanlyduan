import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service
vi.mock("../../services/alertsService", () => ({
  fetchAlerts: vi.fn(),
  subscribeToAlerts: vi.fn(() => vi.fn()),
  countOpenAlerts: vi.fn(() => 0),
}));

const { fetchAlerts } = await import("../../services/alertsService");
const { useAlertsStore } = await import("../alertsStore");

describe("alertsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAlertsStore.setState({
      alerts: [],
      filters: { status: "open", severity: "ALL", agent: "ALL" },
      selectedAlertId: null,
      loading: false,
      error: null,
      openCount: 0,
    });
  });

  it("loadAlerts updates alerts state", async () => {
    const mockAlerts = [
      { id: "a1", summary: "Alert 1", severity: "critical" },
      { id: "a2", summary: "Alert 2", severity: "warning" },
    ];
    fetchAlerts.mockResolvedValueOnce({ data: mockAlerts, error: null });

    await useAlertsStore.getState().loadAlerts();

    expect(useAlertsStore.getState().alerts).toEqual(mockAlerts);
    expect(useAlertsStore.getState().loading).toBe(false);
    expect(fetchAlerts).toHaveBeenCalledWith({ status: "open", severity: "ALL", agent: "ALL" });
  });

  it("setFilter triggers reload", async () => {
    fetchAlerts.mockResolvedValueOnce({ data: [], error: null });

    useAlertsStore.getState().setFilter("severity", "critical");

    expect(useAlertsStore.getState().filters.severity).toBe("critical");
    expect(fetchAlerts).toHaveBeenCalled();
  });
});
