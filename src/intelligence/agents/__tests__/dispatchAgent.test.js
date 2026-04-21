import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all adapters
vi.mock("../dispatch/emailAdapter.js", () => ({
  sendEmail: vi.fn(),
}));
vi.mock("../dispatch/telegramAdapter.js", () => ({
  sendTelegram: vi.fn(),
}));
vi.mock("../dispatch/inAppAdapter.js", () => ({
  createInAppNotification: vi.fn(),
}));

// Mock fetch for Supabase calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { sendEmail } = await import("../dispatch/emailAdapter.js");
const { sendTelegram } = await import("../dispatch/telegramAdapter.js");
const { createInAppNotification } = await import("../dispatch/inAppAdapter.js");
const { dispatchAlert } = await import("../dispatchAgent.js");

function makeAlert(overrides = {}) {
  return {
    id: "alert-001",
    agent: "causal",
    severity: "critical",
    entity_ref: "PRJ-HERA",
    summary: "Motor supplier delay cascades to DVT gate",
    details: { cascade: [], recommended_action: "Contact backup supplier" },
    status: "open",
    suggested_assignee: "user-aaa",
    allocation_confidence: 0.9,
    allocation_rationale: "Assigned to engineer with lowest load",
    suggested_deadline: "2026-04-23",
    dispatched_at: null,
    dispatch_channels: [],
    dispatch_gate: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Default fetch mock: return profile for recipient lookup + success for writes
function setupDefaultFetch() {
  mockFetch.mockImplementation(async (url) => {
    if (url.includes("/rest/v1/profiles")) {
      return {
        ok: true,
        json: async () => [{ id: "user-aaa", email: "a@rtr.vn", full_name: "Nguyen Van A", role: "engineer" }],
      };
    }
    if (url.includes("/rest/v1/projects")) {
      return {
        ok: true,
        json: async () => [{ phase_owner_id: "user-lead", phase_owner_name: "Lead" }],
      };
    }
    // Default: writes succeed
    return { ok: true, json: async () => [], headers: new Map() };
  });
}

describe("dispatchAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultFetch();
    sendEmail.mockResolvedValue({ status: "sent", response: { notification_id: "n1" } });
    sendTelegram.mockResolvedValue({ status: "skipped", error: "TELEGRAM_NOT_CONFIGURED" });
    createInAppNotification.mockResolvedValue({ status: "sent", response: { notification_id: "n2" } });
  });

  it("auto gate critical → email + telegram + in_app, telegram skipped gracefully", async () => {
    const result = await dispatchAlert(makeAlert(), "http://sb", "key");

    expect(result.gate).toBe("auto");
    expect(result.skipped).toBe(false);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(createInAppNotification).toHaveBeenCalledTimes(1);
    // Telegram fails gracefully — not in channels_sent
    expect(result.channels_sent).toContain("email");
    expect(result.channels_sent).toContain("in_app");
  });

  it("cc_lead gate warning → email + in_app, cc_project_lead passed", async () => {
    const alert = makeAlert({ severity: "warning", allocation_confidence: 0.75 });
    // Mock lead lookup returns different user
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/rest/v1/profiles") && url.includes("user-lead")) {
        return { ok: true, json: async () => [{ id: "user-lead", email: "lead@rtr.vn", full_name: "Lead" }] };
      }
      if (url.includes("/rest/v1/profiles")) {
        return { ok: true, json: async () => [{ id: "user-aaa", email: "a@rtr.vn", full_name: "A" }] };
      }
      if (url.includes("/rest/v1/projects")) {
        return { ok: true, json: async () => [{ phase_owner_id: "user-lead", phase_owner_name: "Lead" }] };
      }
      return { ok: true, json: async () => [], headers: new Map() };
    });

    const result = await dispatchAlert(alert, "http://sb", "key");

    expect(result.gate).toBe("cc_lead");
    // in_app channel dispatched (warning cc_lead = ['in_app'])
    expect(createInAppNotification).toHaveBeenCalled();
  });

  it("queued_review → in_app only, no email", async () => {
    const alert = makeAlert({ severity: "warning", allocation_confidence: 0.5 });
    const result = await dispatchAlert(alert, "http://sb", "key");

    expect(result.gate).toBe("queued_review");
    expect(createInAppNotification).toHaveBeenCalledTimes(1);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendTelegram).not.toHaveBeenCalled();
  });

  it("already dispatched → skip, return early", async () => {
    const alert = makeAlert({ dispatched_at: new Date().toISOString() });
    const result = await dispatchAlert(alert, "http://sb", "key");

    expect(result.gate).toBe("already_dispatched");
    expect(result.skipped).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendTelegram).not.toHaveBeenCalled();
    expect(createInAppNotification).not.toHaveBeenCalled();
  });

  it("no assignee → skipped, dispatch_gate=skipped", async () => {
    const alert = makeAlert({ suggested_assignee: null });
    const result = await dispatchAlert(alert, "http://sb", "key");

    expect(result.gate).toBe("skipped");
    expect(result.skipped).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
