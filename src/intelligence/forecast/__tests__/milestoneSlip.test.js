import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { forecastMilestoneSlip } = await import("../milestoneSlip.js");

function mockResponse(data) {
  return { ok: true, json: async () => data };
}

describe("forecastMilestoneSlip", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("forecasts slip for project with history", async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("milestones")) {
        return mockResponse([
          { id: "m1", phase: "CONCEPT", status: "DONE", target_date: "2026-01-01", actual_date: "2026-01-10" }, // 9 days slip
          { id: "m2", phase: "EVT", status: "DONE", target_date: "2026-03-01", actual_date: "2026-03-05" }, // 4 days slip
          { id: "m3", phase: "DVT", status: "IN_PROGRESS", target_date: "2026-06-01", actual_date: null },
        ]);
      }
      if (url.includes("issues")) return mockResponse([{ id: "i1", severity: "CRITICAL" }]);
      if (url.includes("gate_conditions")) return mockResponse([{ id: "g1", phase: "DVT" }]);
      if (url.includes("alerts")) return mockResponse([]);
      return mockResponse([]);
    });

    const result = await forecastMilestoneSlip("PRJ-001", "http://sb", "key");

    expect(result.project_id).toBe("PRJ-001");
    expect(result.milestones).toHaveLength(1); // only DVT (pending)
    expect(result.milestones[0].phase).toBe("DVT");
    expect(result.milestones[0].expected_slip_days).toBeGreaterThan(0);
    expect(result.milestones[0].risk_factors.length).toBeGreaterThan(0);
  });

  it("returns low risk when no milestones", async () => {
    mockFetch.mockResolvedValue(mockResponse([]));

    const result = await forecastMilestoneSlip("PRJ-EMPTY", "http://sb", "key");

    expect(result.milestones).toHaveLength(0);
    expect(result.overall_project_risk).toBe("low");
  });

  it("returns high risk with many critical issues", async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("milestones")) {
        return mockResponse([
          { id: "m1", phase: "DVT", status: "PLANNED", target_date: "2026-06-01", actual_date: null },
        ]);
      }
      if (url.includes("issues")) {
        return mockResponse([
          { id: "i1", severity: "CRITICAL" },
          { id: "i2", severity: "CRITICAL" },
          { id: "i3", severity: "CRITICAL" },
        ]);
      }
      if (url.includes("gate_conditions"))
        return mockResponse([
          { id: "g1", phase: "DVT" },
          { id: "g2", phase: "DVT" },
        ]);
      if (url.includes("alerts")) return mockResponse([{ id: "a1" }]);
      return mockResponse([]);
    });

    const result = await forecastMilestoneSlip("PRJ-RISKY", "http://sb", "key");

    expect(result.overall_project_risk).toMatch(/high|critical/);
    expect(result.milestones[0].expected_slip_days).toBeGreaterThan(10);
  });
});
