import { describe, it, expect, beforeEach } from "vitest";
import { ScoringEngine, type IndexConfig } from "./scoring";
import { InMemorySignalStore, createSignal, type Signal } from "./signal";

// ─── Test helpers ───────────────────────────────────────────────────

function makeSignal(overrides: Partial<Parameters<typeof createSignal>[0]> = {}): Signal {
  return createSignal({
    sourceId: "test",
    signalType: "issue.created",
    title: "Test signal",
    severity: "medium",
    dimensions: { projectId: "PRJ-001" },
    timestamp: new Date(),
    ...overrides,
  });
}

const baseConfig: IndexConfig = {
  id: "phi",
  entityDimension: "projectId",
  components: [
    {
      id: "criticality",
      weight: 0.4,
      signalTypes: ["issue.created"],
      aggregation: "count_weighted",
      windowMs: 7 * 24 * 60 * 60 * 1000,
      scaling: "linear",
      invert: false,
      range: [0, 50],
    },
    {
      id: "velocity",
      weight: 0.3,
      signalTypes: ["issue.closed"],
      aggregation: "count",
      windowMs: 7 * 24 * 60 * 60 * 1000,
      scaling: "linear",
      invert: true,
      range: [0, 20],
    },
  ],
  modifiers: [],
  range: [0, 100],
  thresholds: {
    healthy: [0, 30],
    warning: [30, 60],
    critical: [60, 100],
  },
};

// ─── Tests ──────────────────────────────────────────────────────────

describe("ScoringEngine", () => {
  let store: InMemorySignalStore;
  let engine: ScoringEngine;

  beforeEach(() => {
    store = new InMemorySignalStore();
    engine = new ScoringEngine([baseConfig]);
  });

  it("returns empty array for unknown index", () => {
    const scores = engine.computeAll("unknown", store);
    expect(scores).toEqual([]);
  });

  it("returns empty array when store is empty", () => {
    const scores = engine.computeAll("phi", store);
    expect(scores).toEqual([]);
  });

  it("computes score for single entity with signals", () => {
    store.put(makeSignal({ severity: "critical" }));
    store.put(makeSignal({ severity: "high" }));

    const scores = engine.computeAll("phi", store);
    expect(scores).toHaveLength(1);
    expect(scores[0].entityId).toBe("PRJ-001");
    expect(scores[0].indexId).toBe("phi");
    expect(scores[0].score).toBeGreaterThanOrEqual(0);
    expect(scores[0].score).toBeLessThanOrEqual(100);
    expect(scores[0].computedAt).toBeInstanceOf(Date);
  });

  it("computes scores for multiple entities", () => {
    store.put(makeSignal({ dimensions: { projectId: "PRJ-001" }, title: "s1" }));
    store.put(makeSignal({ dimensions: { projectId: "PRJ-002" }, title: "s2" }));

    const scores = engine.computeAll("phi", store);
    expect(scores).toHaveLength(2);

    const entityIds = scores.map((s) => s.entityId).sort();
    expect(entityIds).toEqual(["PRJ-001", "PRJ-002"]);
  });

  it("assigns a valid threshold level", () => {
    const score = engine.computeOne("phi", "PRJ-001", store);
    expect(["healthy", "warning", "critical"]).toContain(score.level);
  });

  it("computeOne returns all required fields", () => {
    store.put(makeSignal());
    const score = engine.computeOne("phi", "PRJ-001", store);

    expect(score).toHaveProperty("indexId", "phi");
    expect(score).toHaveProperty("entityId", "PRJ-001");
    expect(score).toHaveProperty("score");
    expect(score).toHaveProperty("level");
    expect(score).toHaveProperty("components");
    expect(score).toHaveProperty("activeModifiers");
    expect(score).toHaveProperty("trend");
    expect(score).toHaveProperty("computedAt");
    expect(score.components).toHaveProperty("criticality");
    expect(score.components).toHaveProperty("velocity");
  });

  it("tracks component signal counts", () => {
    store.put(makeSignal({ signalType: "issue.created", title: "created-1" }));
    store.put(makeSignal({ signalType: "issue.created", title: "created-2" }));
    store.put(makeSignal({ signalType: "issue.closed", title: "closed-1" }));

    const score = engine.computeOne("phi", "PRJ-001", store);
    expect(score.components.criticality.signalCount).toBe(2);
    expect(score.components.velocity.signalCount).toBe(1);
  });

  it("inverted component reduces score for more signals", () => {
    // velocity is inverted: more closed issues → lower component score
    store.put(makeSignal({ signalType: "issue.closed" }));
    const score1 = engine.computeOne("phi", "PRJ-001", store);

    store.put(makeSignal({ signalType: "issue.closed" }));
    store.put(makeSignal({ signalType: "issue.closed" }));
    const score2 = engine.computeOne("phi", "PRJ-001", store);

    // More closures should lower the velocity component weighted score
    expect(score2.components.velocity.weighted).toBeLessThanOrEqual(score1.components.velocity.weighted);
  });

  describe("modifiers", () => {
    it("applies floor modifier when condition met", () => {
      const configWithModifier: IndexConfig = {
        ...baseConfig,
        modifiers: [
          {
            condition: { scoreBelow: 50 },
            effect: { floor: 15 },
          },
        ],
      };

      const engineMod = new ScoringEngine([configWithModifier]);
      // With inverted velocity and no signals, score is ~30
      // scoreBelow: 50 → condition met → floor applies
      const score = engineMod.computeOne("phi", "PRJ-001", store);
      expect(score.score).toBeGreaterThanOrEqual(15);
      expect(score.activeModifiers.length).toBeGreaterThan(0);
    });

    it("applies ceiling modifier when condition met", () => {
      const configWithCeiling: IndexConfig = {
        ...baseConfig,
        modifiers: [
          {
            condition: { scoreAbove: -1 },
            effect: { ceiling: 50 },
          },
        ],
      };

      const engineCeil = new ScoringEngine([configWithCeiling]);
      // Add many critical signals to push score up
      for (let i = 0; i < 30; i++) {
        store.put(makeSignal({ severity: "critical", title: `sig-${i}` }));
      }
      const score = engineCeil.computeOne("phi", "PRJ-001", store);
      expect(score.score).toBeLessThanOrEqual(50);
    });
  });

  describe("trend computation", () => {
    it("returns stable when insufficient history", () => {
      const score = engine.computeOne("phi", "PRJ-001", store);
      expect(score.trend).toBe("stable");
    });

    it("tracks history and computes trend", () => {
      // Compute 5 times to build up history
      for (let i = 0; i < 5; i++) {
        engine.computeOne("phi", "PRJ-001", store);
      }

      const history = engine.getHistory("phi", "PRJ-001");
      expect(history.length).toBe(5);
    });
  });

  describe("reconfigure", () => {
    it("replaces configs", () => {
      const newConfig: IndexConfig = {
        ...baseConfig,
        id: "new-index",
      };

      engine.reconfigure([newConfig]);
      expect(engine.computeAll("phi", store)).toEqual([]);
      expect(engine.computeAll("new-index", store)).toEqual([]);
    });
  });

  describe("aggregation methods", () => {
    it("count aggregation", () => {
      const config: IndexConfig = {
        ...baseConfig,
        components: [
          {
            id: "count_test",
            weight: 1,
            signalTypes: ["issue.created"],
            aggregation: "count",
            windowMs: 7 * 24 * 60 * 60 * 1000,
            scaling: "linear",
            invert: false,
            range: [0, 10],
          },
        ],
      };

      const eng = new ScoringEngine([config]);
      store.put(makeSignal());
      store.put(makeSignal({ title: "sig2" }));
      store.put(makeSignal({ title: "sig3" }));

      const score = eng.computeOne("phi", "PRJ-001", store);
      expect(score.components.count_test.signalCount).toBe(3);
    });

    it("sum_value aggregation", () => {
      const config: IndexConfig = {
        ...baseConfig,
        components: [
          {
            id: "sum_test",
            weight: 1,
            signalTypes: ["issue.created"],
            aggregation: "sum_value",
            windowMs: 7 * 24 * 60 * 60 * 1000,
            scaling: "linear",
            invert: false,
            range: [0, 100],
          },
        ],
      };

      const eng = new ScoringEngine([config]);
      store.put(makeSignal({ value: 10, title: "s1" }));
      store.put(makeSignal({ value: 20, title: "s2" }));

      const score = eng.computeOne("phi", "PRJ-001", store);
      expect(score.components.sum_test.raw).toBe(30);
    });
  });
});
