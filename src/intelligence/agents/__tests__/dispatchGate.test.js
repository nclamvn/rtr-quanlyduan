import { describe, it, expect } from "vitest";
import { computeDispatchPlan } from "../dispatch/dispatchGate.js";

function makeAlert(overrides = {}) {
  return {
    id: "alert-001",
    severity: "critical",
    suggested_assignee: "user-aaa",
    allocation_confidence: 0.9,
    ...overrides,
  };
}

describe("dispatchGate — computeDispatchPlan", () => {
  // ── High confidence (≥ 0.85) ──
  it("conf=0.9 + critical → auto, email+telegram+in_app", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.9, severity: "critical" }));
    expect(plan.gate).toBe("auto");
    expect(plan.channels).toEqual(["email", "telegram", "in_app"]);
    expect(plan.cc_project_lead).toBe(false);
  });

  it("conf=0.85 + warning → auto, email+in_app", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.85, severity: "warning" }));
    expect(plan.gate).toBe("auto");
    expect(plan.channels).toEqual(["email", "in_app"]);
  });

  it("conf=0.95 + info → auto, in_app only", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.95, severity: "info" }));
    expect(plan.gate).toBe("auto");
    expect(plan.channels).toEqual(["in_app"]);
  });

  // ── Medium confidence (0.7 ≤ c < 0.85) ──
  it("conf=0.75 + critical → cc_lead, email+in_app", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.75, severity: "critical" }));
    expect(plan.gate).toBe("cc_lead");
    expect(plan.channels).toEqual(["email", "in_app"]);
    expect(plan.cc_project_lead).toBe(true);
  });

  it("conf=0.7 + warning → cc_lead, in_app", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.7, severity: "warning" }));
    expect(plan.gate).toBe("cc_lead");
    expect(plan.channels).toEqual(["in_app"]);
    expect(plan.cc_project_lead).toBe(true);
  });

  it("conf=0.8 + info → skipped (medium conf + info)", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.8, severity: "info" }));
    expect(plan.gate).toBe("skipped");
    expect(plan.channels).toEqual([]);
  });

  // ── Low confidence (< 0.7) ──
  it("conf=0.5 + critical → queued_review, in_app only", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.5, severity: "critical" }));
    expect(plan.gate).toBe("queued_review");
    expect(plan.channels).toEqual(["in_app"]);
    expect(plan.cc_project_lead).toBe(false);
  });

  it("conf=0.3 + warning → queued_review, in_app only", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.3, severity: "warning" }));
    expect(plan.gate).toBe("queued_review");
    expect(plan.channels).toEqual(["in_app"]);
  });

  it("conf=0.1 + info → skipped", () => {
    const plan = computeDispatchPlan(makeAlert({ allocation_confidence: 0.1, severity: "info" }));
    expect(plan.gate).toBe("skipped");
    expect(plan.channels).toEqual([]);
  });

  // ── Edge: no assignee ──
  it("no suggested_assignee → skipped", () => {
    const plan = computeDispatchPlan(makeAlert({ suggested_assignee: null }));
    expect(plan.gate).toBe("skipped");
    expect(plan.recipient_user_id).toBeNull();
  });
});
