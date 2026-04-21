import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Anthropic SDK
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

const { __mockCreate } = await import("@anthropic-ai/sdk");
const { suggestAllocation } = await import("../allocationAgent.js");

function makeAlert(overrides = {}) {
  return {
    id: "alert-001",
    agent: "causal",
    severity: "critical",
    entity_ref: "PRJ-HERA",
    summary: "Motor supplier delay cascades to DVT gate",
    details: {},
    status: "open",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeContext(overrides = {}) {
  return {
    candidates: [
      {
        id: "user-aaa",
        name: "Nguyen Van A",
        role: "engineer",
        department: "Production",
        role_in_project: "member",
        current_load: 2,
        past_success_rate: null,
      },
      {
        id: "user-bbb",
        name: "Tran Thi B",
        role: "pm",
        department: "Management",
        role_in_project: "lead",
        current_load: 5,
        past_success_rate: null,
      },
      {
        id: "user-ccc",
        name: "Le Van C",
        role: "engineer",
        department: "Production",
        role_in_project: "member",
        current_load: 1,
        past_success_rate: null,
      },
    ],
    project_context: { lead: "user-bbb", lead_name: "Tran Thi B", phase: "DVT", health: "AT_RISK" },
    urgency_hint: "critical",
    similar_alerts_history: [],
    insufficient_data: false,
    ...overrides,
  };
}

function mockLLMResponse(json) {
  __mockCreate.mockResolvedValueOnce({
    content: [{ text: JSON.stringify(json) }],
    usage: { input_tokens: 800, output_tokens: 300 },
  });
}

describe("allocationAgent", () => {
  beforeEach(() => {
    __mockCreate.mockReset();
  });

  it("happy path: 3 candidates, critical alert → Sonnet called, valid allocation", async () => {
    mockLLMResponse({
      suggested_assignee_id: "user-ccc",
      suggested_deadline: "2026-04-23",
      rationale:
        "Le Van C has the lowest workload (1 open item) and is an engineer on the production team, best fit for a motor supply chain issue.",
      confidence: 0.85,
      alternative_assignees: [{ id: "user-aaa", why_considered: "Also production engineer, slightly higher load" }],
    });

    const result = await suggestAllocation(makeAlert(), makeContext());

    expect(result.suggested_assignee_id).toBe("user-ccc");
    expect(result.suggested_deadline).toBe("2026-04-23");
    expect(result.confidence).toBe(0.85);
    expect(result.model_used).toContain("sonnet"); // critical → Sonnet
    expect(result.alternative_assignees).toHaveLength(1);
    expect(__mockCreate).toHaveBeenCalledTimes(1);
  });

  it("insufficient data: no candidates → heuristic fallback, no LLM call", async () => {
    const context = makeContext({
      candidates: [],
      insufficient_data: true,
    });

    const result = await suggestAllocation(makeAlert(), context);

    expect(result.suggested_assignee_id).toBeNull();
    expect(result.model_used).toBe("heuristic");
    expect(result.cost_estimate_usd).toBe(0);
    expect(result.confidence).toBe(0.0);
    expect(result.rationale).toContain("Escalate");
    expect(__mockCreate).not.toHaveBeenCalled();
  });

  it("low urgency + few candidates → Haiku routing", async () => {
    mockLLMResponse({
      suggested_assignee_id: "user-aaa",
      suggested_deadline: "2026-05-01",
      rationale: "Low severity, assigned to Nguyen Van A with reasonable workload.",
      confidence: 0.7,
      alternative_assignees: [],
    });

    const context = makeContext({
      candidates: [
        {
          id: "user-aaa",
          name: "Nguyen Van A",
          role: "engineer",
          department: "Production",
          role_in_project: "member",
          current_load: 1,
          past_success_rate: null,
        },
        {
          id: "user-bbb",
          name: "Tran Thi B",
          role: "pm",
          department: "Management",
          role_in_project: "lead",
          current_load: 3,
          past_success_rate: null,
        },
      ],
      urgency_hint: "low",
    });

    const result = await suggestAllocation(makeAlert({ severity: "info" }), context);

    expect(result.model_used).toContain("haiku"); // low urgency + ≤3 candidates
    expect(result.suggested_assignee_id).toBe("user-aaa");
    expect(__mockCreate).toHaveBeenCalledTimes(1);
  });

  it("LLM returns invalid assignee_id → validation catches, returns null", async () => {
    mockLLMResponse({
      suggested_assignee_id: "user-FAKE-does-not-exist",
      suggested_deadline: "2026-04-25",
      rationale: "Assigned to a team member.",
      confidence: 0.8,
      alternative_assignees: [{ id: "user-ALSO-FAKE", why_considered: "Backup" }],
    });

    const result = await suggestAllocation(makeAlert(), makeContext());

    // Invalid ID should be caught
    expect(result.suggested_assignee_id).toBeNull();
    // Invalid alternatives should be filtered out
    expect(result.alternative_assignees).toHaveLength(0);
    // Should still have a deadline
    expect(result.suggested_deadline).toBeTruthy();
    expect(__mockCreate).toHaveBeenCalledTimes(1);
  });
});
