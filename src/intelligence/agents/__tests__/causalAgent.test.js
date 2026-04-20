import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Anthropic SDK before importing causalAgent
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class MockAnthropic {
      constructor() {
        this.messages = { create: mockCreate };
      }
    },
    __mockCreate: mockCreate,
  };
});

// Must import after mock setup
const { __mockCreate } = await import("@anthropic-ai/sdk");
const { analyzeCausalChain } = await import("../causalAgent.js");

function makeSignal(overrides = {}) {
  return {
    source_app: "MRP",
    entity_type: "work_order",
    entity_id: "wo-123",
    title: "WO-001: Hera Frame × 10",
    status: "in_production",
    priority: "high",
    project_link: "PRJ-HERA",
    data: { woNumber: "WO-001", productName: "Hera Frame", productCode: "HF-01" },
    synced_at: new Date().toISOString(),
    ...overrides,
  };
}

function mockLLMResponse(json) {
  __mockCreate.mockResolvedValueOnce({
    content: [{ text: JSON.stringify(json) }],
    usage: { input_tokens: 500, output_tokens: 200 },
  });
}

describe("causalAgent", () => {
  beforeEach(() => {
    __mockCreate.mockReset();
  });

  it("returns warning alert for simple 1-hop cascade", async () => {
    mockLLMResponse({
      root_cause: "Work order delayed due to material shortage",
      cascade: [
        {
          entity: "HF-01",
          entity_type: "part",
          relationship: "delays",
          next_entity: "WO-001",
          explanation: "Part shortage",
        },
      ],
      impact_severity: "medium",
      recommended_action: "Expedite part order from supplier",
      needs_deep_analysis: false,
      confidence: 0.85,
    });

    const result = await analyzeCausalChain(makeSignal(), { projectEntities: [], relatedParts: [], relatedOrders: [] });

    expect(result.alert).not.toBeNull();
    expect(result.alert.severity).toBe("warning");
    expect(result.alert.agent).toBe("causal");
    expect(result.alert.details.cascade_depth).toBe(1);
    expect(result.escalated).toBe(false);
    expect(__mockCreate).toHaveBeenCalledTimes(1);
  });

  it("escalates to Sonnet when needs_deep_analysis is true", async () => {
    // First call (Haiku) returns needs_deep_analysis
    mockLLMResponse({
      root_cause: "Complex multi-project delay",
      cascade: [
        {
          entity: "HF-01",
          entity_type: "part",
          relationship: "delays",
          next_entity: "WO-001",
          explanation: "Shortage",
        },
        {
          entity: "WO-001",
          entity_type: "work_order",
          relationship: "blocks",
          next_entity: "WO-002",
          explanation: "Dependency",
        },
        {
          entity: "WO-002",
          entity_type: "work_order",
          relationship: "delays",
          next_entity: "SO-100",
          explanation: "Late",
        },
        {
          entity: "SO-100",
          entity_type: "sales_order",
          relationship: "risks",
          next_entity: "PRJ-HERA",
          explanation: "Milestone",
        },
      ],
      impact_severity: "high",
      recommended_action: "Escalate to PM",
      needs_deep_analysis: true,
      confidence: 0.6,
    });

    // Second call (Sonnet) returns deeper analysis
    mockLLMResponse({
      root_cause: "Supplier X sole-source for HF-01, lead time 45 days, no buffer",
      cascade: [
        {
          entity: "HF-01",
          entity_type: "part",
          relationship: "delays",
          next_entity: "WO-001",
          explanation: "Sole source",
        },
        {
          entity: "WO-001",
          entity_type: "work_order",
          relationship: "blocks",
          next_entity: "WO-002",
          explanation: "Dependency chain",
        },
        {
          entity: "WO-002",
          entity_type: "work_order",
          relationship: "delays",
          next_entity: "SO-100",
          explanation: "Customer order",
        },
        {
          entity: "SO-100",
          entity_type: "sales_order",
          relationship: "risks",
          next_entity: "PRJ-HERA",
          explanation: "Q2 milestone",
        },
      ],
      impact_severity: "critical",
      recommended_action: "Dual-source HF-01 immediately, notify customer of potential delay",
      needs_deep_analysis: false,
      confidence: 0.9,
    });

    const result = await analyzeCausalChain(makeSignal(), { projectEntities: [], relatedParts: [], relatedOrders: [] });

    expect(result.escalated).toBe(true);
    expect(result.alert.severity).toBe("critical");
    expect(result.alert.details.cascade_depth).toBe(4);
    expect(__mockCreate).toHaveBeenCalledTimes(2);
  });

  it("returns info alert when confidence is low", async () => {
    mockLLMResponse({
      root_cause: "Unclear — insufficient data to determine root cause",
      cascade: [],
      impact_severity: "low",
      recommended_action: "Gather more context from production team",
      needs_deep_analysis: false,
      confidence: 0.3,
    });

    const result = await analyzeCausalChain(makeSignal(), { projectEntities: [], relatedParts: [], relatedOrders: [] });

    expect(result.alert.severity).toBe("info");
    expect(result.chain.confidence).toBeLessThan(0.5);
    expect(result.escalated).toBe(false);
  });
});
