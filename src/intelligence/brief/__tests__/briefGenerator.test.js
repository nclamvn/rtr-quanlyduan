import { describe, it, expect, vi, beforeEach } from "vitest";

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
const { generateBrief } = await import("../briefGenerator.js");

const mockContext = {
  period: { start: "2026-04-14", end: "2026-04-20" },
  alerts: { total: 10, by_severity: { critical: 2, warning: 5, info: 3 }, resolved: 6, open: 4, resolution_rate: 60 },
  forecasts: { milestone_slips: [], eol_risks: [] },
  dispatch: { total: 8, sent: 7, failed: 1, by_channel: { email: 5, in_app: 3 } },
  projects: [{ id: "PRJ-HERA", name: "Hera", phase: "DVT", health: "AT_RISK" }],
  signals: { total: 50, by_type: { work_order: 30, inventory_alert: 20 } },
  top_risks: [{ entity: "PRJ-HERA", count: 5, severities: ["critical", "warning"], summaries: ["Motor delay"] }],
};

describe("generateBrief", () => {
  beforeEach(() => {
    __mockCreate.mockReset();
  });

  it("generates valid brief with 3 scenarios and 3 recommendations", async () => {
    __mockCreate.mockResolvedValueOnce({
      content: [
        {
          text: JSON.stringify({
            executive_summary: "Tuần này có 2 cảnh báo nghiêm trọng cho Hera.",
            highlights: [{ icon: "🔴", title: "Motor delay", body: "Supplier trễ 2 tuần" }],
            scenarios: [
              {
                title: "A: Giữ plan",
                description: "Tiếp tục",
                trade_offs: { pros: ["Ổn định"], cons: ["Risk"] },
                probability_of_success: 0.6,
                resource_needed: "None",
              },
              {
                title: "B: Thay supplier",
                description: "Tìm supplier mới",
                trade_offs: { pros: ["Giảm risk"], cons: ["Tốn cost"] },
                probability_of_success: 0.8,
                resource_needed: "Procurement 2w",
              },
              {
                title: "C: Delay milestone",
                description: "Lùi DVT 1 tháng",
                trade_offs: { pros: ["Giảm áp lực"], cons: ["Trễ MP"] },
                probability_of_success: 0.9,
                resource_needed: "PM approval",
              },
            ],
            recommendations: [
              {
                action: "Contact backup supplier",
                impact: "high",
                priority: 1,
                effort: "days",
                owner_hint: "Procurement",
              },
              {
                action: "Review DVT gate conditions",
                impact: "medium",
                priority: 2,
                effort: "hours",
                owner_hint: "Engineering",
              },
              {
                action: "Update stakeholder timeline",
                impact: "medium",
                priority: 3,
                effort: "hours",
                owner_hint: "PM",
              },
            ],
            risk_summary: {
              top_risks: ["Motor supplier sole source"],
              mitigations_in_flight: ["Dual-source evaluation"],
            },
          }),
        },
      ],
      usage: { input_tokens: 3000, output_tokens: 1500 },
    });

    const result = await generateBrief(mockContext);

    expect(result.brief.executive_summary).toContain("Hera");
    expect(result.brief.scenarios).toHaveLength(3);
    expect(result.brief.recommendations).toHaveLength(3);
    expect(result.brief.risk_summary.top_risks).toHaveLength(1);
    expect(result.model_used).toContain("sonnet");
    expect(result.cost_estimate_usd).toBeGreaterThan(0);
  });

  it("validates and pads to 3 scenarios when LLM returns fewer", async () => {
    __mockCreate.mockResolvedValueOnce({
      content: [
        {
          text: JSON.stringify({
            executive_summary: "Tu��n bình thường.",
            highlights: [],
            scenarios: [
              {
                title: "Only one",
                description: "Test",
                trade_offs: { pros: [], cons: [] },
                probability_of_success: 0.5,
                resource_needed: "None",
              },
            ],
            recommendations: [{ action: "Do nothing", impact: "low", priority: 1, effort: "hours", owner_hint: "CEO" }],
            risk_summary: { top_risks: [], mitigations_in_flight: [] },
          }),
        },
      ],
      usage: { input_tokens: 2000, output_tokens: 500 },
    });

    const result = await generateBrief(mockContext);

    expect(result.brief.scenarios).toHaveLength(3); // padded to 3
    expect(result.brief.recommendations).toHaveLength(3); // padded to 3
  });

  it("handles LLM parse error gracefully", async () => {
    __mockCreate.mockResolvedValueOnce({
      content: [{ text: "This is not JSON at all, sorry." }],
      usage: { input_tokens: 2000, output_tokens: 100 },
    });

    const result = await generateBrief(mockContext);

    expect(result._parse_error).toBe(true);
    expect(result.brief.scenarios).toHaveLength(3);
    expect(result.brief.recommendations).toHaveLength(3);
    expect(result.brief.executive_summary).toContain("Không thể tạo");
  });
});
