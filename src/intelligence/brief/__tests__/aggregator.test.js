import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { aggregateWeekData } = await import("../aggregator.js");

function mockResponse(data) {
  return { ok: true, json: async () => data };
}

describe("aggregateWeekData", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(mockResponse([]));
  });

  it("returns empty structure when no data", async () => {
    const result = await aggregateWeekData("http://sb", "key", "2026-04-14", "2026-04-20");

    expect(result.period.start).toBe("2026-04-14");
    expect(result.period.end).toBe("2026-04-20");
    expect(result.alerts.total).toBe(0);
    expect(result.forecasts.milestone_slips).toEqual([]);
    expect(result.signals.total).toBe(0);
  });

  it("aggregates alerts by severity and agent", async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/rest/v1/alerts") && url.includes("created_at")) {
        return mockResponse([
          { id: "a1", agent: "causal", severity: "critical", status: "open", entity_ref: "PRJ-HERA" },
          { id: "a2", agent: "convergence", severity: "warning", status: "resolved", entity_ref: "PRJ-HERA" },
          { id: "a3", agent: "causal", severity: "warning", status: "open", entity_ref: "PRJ-FPV" },
        ]);
      }
      return mockResponse([]);
    });

    const result = await aggregateWeekData("http://sb", "key", "2026-04-14", "2026-04-20");

    expect(result.alerts.total).toBe(3);
    expect(result.alerts.by_severity.critical).toBe(1);
    expect(result.alerts.by_severity.warning).toBe(2);
    expect(result.alerts.by_agent.causal).toBe(2);
    expect(result.alerts.resolved).toBe(1);
    expect(result.alerts.resolution_rate).toBe(33);
  });

  it("handles partial data gracefully", async () => {
    // Some endpoints fail
    let callCount = 0;
    mockFetch.mockImplementation(async () => {
      callCount++;
      if (callCount <= 2)
        return mockResponse([{ id: "x", agent: "causal", severity: "info", status: "open", entity_ref: null }]);
      return { ok: false, json: async () => [] };
    });

    const result = await aggregateWeekData("http://sb", "key", "2026-04-14", "2026-04-20");

    // Should not throw, partial data is OK
    expect(result.period.start).toBe("2026-04-14");
    expect(result.alerts).toBeDefined();
  });
});
