import { describe, it, expect } from "vitest";
import { detectConvergence } from "../convergenceAgent.js";

function makeRow(overrides = {}) {
  return {
    source_app: "MRP",
    entity_type: "work_order",
    entity_id: `wo-${Math.random().toString(36).slice(2, 8)}`,
    title: "Test WO",
    status: "in_production",
    priority: "normal",
    project_link: "PRJ-HERA",
    data: {},
    synced_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("convergenceAgent", () => {
  describe("Rule A — project cluster", () => {
    it("returns warning when 3 high/urgent signals on same project", () => {
      const rows = [
        makeRow({ priority: "high", entity_id: "wo-1" }),
        makeRow({ priority: "urgent", entity_id: "wo-2" }),
        makeRow({ priority: "high", entity_id: "wo-3" }),
      ];

      const alerts = detectConvergence(rows);
      const clusterAlerts = alerts.filter((a) => a.details.rule === "project_cluster");

      expect(clusterAlerts.length).toBe(1);
      expect(clusterAlerts[0].severity).toBe("warning");
      expect(clusterAlerts[0].entity_ref).toBe("PRJ-HERA");
      expect(clusterAlerts[0].agent).toBe("convergence");
    });

    it("returns critical when 5+ high/urgent signals on same project", () => {
      const rows = Array.from({ length: 5 }, (_, i) => makeRow({ priority: "high", entity_id: `wo-${i}` }));

      const alerts = detectConvergence(rows);
      const clusterAlerts = alerts.filter((a) => a.details.rule === "project_cluster");

      expect(clusterAlerts.length).toBe(1);
      expect(clusterAlerts[0].severity).toBe("critical");
    });
  });

  describe("no convergence", () => {
    it("returns empty array when signals are normal priority", () => {
      const rows = [
        makeRow({ priority: "normal", entity_id: "wo-1" }),
        makeRow({ priority: "normal", entity_id: "wo-2" }),
      ];

      const alerts = detectConvergence(rows);
      const clusterAlerts = alerts.filter((a) => a.details.rule === "project_cluster");

      expect(clusterAlerts.length).toBe(0);
    });

    it("returns empty array with no data", () => {
      const alerts = detectConvergence([]);
      expect(alerts.length).toBe(0);
    });
  });
});
