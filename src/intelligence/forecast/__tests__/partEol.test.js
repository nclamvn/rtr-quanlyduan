import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { forecastPartEolImpact } = await import("../partEol.js");

function mockResponse(data) {
  return { ok: true, json: async () => data };
}

describe("forecastPartEolImpact", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns empty when no EOL parts", async () => {
    mockFetch.mockResolvedValue(mockResponse([]));
    const results = await forecastPartEolImpact("http://sb", "key");
    expect(results).toHaveLength(0);
  });

  it("calculates warning for part with low stock", async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("inventory_alert")) {
        return mockResponse([
          {
            entity_id: "part-001",
            title: "PCB-Main",
            status: "eol",
            data: {
              partNumber: "PCB-001",
              partName: "Main PCB",
              lifecycleStatus: "EOL",
              availableQty: 50,
              totalQty: 50,
              reservedQty: 0,
              leadTimeDays: 30,
            },
          },
        ]);
      }
      if (url.includes("work_order")) {
        // 10 WOs in 90 days = ~0.11/day, 50 / 0.11 ≈ 450 days, - 30 lead = 420 days → info
        return mockResponse(
          Array.from({ length: 10 }, (_, i) => ({
            entity_id: `wo-${i}`,
            title: `WO containing PCB-001`,
            project_link: "PRJ-HERA",
            data: { productCode: "PCB-001" },
          })),
        );
      }
      if (url.includes("milestones")) return mockResponse([]);
      return mockResponse([]);
    });

    const results = await forecastPartEolImpact("http://sb", "key");

    expect(results).toHaveLength(1);
    expect(results[0].part_id).toBe("part-001");
    expect(results[0].days_to_depletion).toBeGreaterThan(0);
    expect(results[0].affected_work_orders.length).toBeGreaterThan(0);
  });

  it("returns critical for part with zero stock", async () => {
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("inventory_alert")) {
        return mockResponse([
          {
            entity_id: "part-002",
            title: "Motor-X",
            status: "eol",
            data: {
              partNumber: "MOT-X",
              partName: "Motor X",
              lifecycleStatus: "EOL",
              availableQty: 0,
              totalQty: 0,
              reservedQty: 0,
              leadTimeDays: 45,
            },
          },
        ]);
      }
      if (url.includes("work_order")) return mockResponse([]);
      if (url.includes("milestones")) return mockResponse([]);
      return mockResponse([]);
    });

    const results = await forecastPartEolImpact("http://sb", "key");

    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe("critical");
    expect(results[0].days_to_depletion).toBe(0);
  });
});
