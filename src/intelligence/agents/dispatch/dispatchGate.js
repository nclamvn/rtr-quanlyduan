// ═══════════════════════════════════════════════════════════
// Dispatch Gate — confidence-based routing for notifications
//
// Gate matrix (3 confidence bands × 3 severity levels):
//
//              | critical              | warning          | info
// ─────────────┼───────────────────────┼──────────────────┼────────────
// conf ≥ 0.85  | email+tg+in_app AUTO  | email+in_app AUTO| in_app AUTO
// 0.7 ≤ c <0.85| email+in_app CC_LEAD  | in_app CC_LEAD   | (skip)
// conf < 0.7   | in_app QUEUED_REVIEW  | in_app QUEUED    | (skip)
// no assignee  | (skipped)             | (skipped)        | (skipped)
// ═══════════════════════════════════════════════════════════

/**
 * Compute dispatch plan for an alert.
 * Pure function — no side effects, no IO.
 *
 * @param {object} alert - must have: suggested_assignee, allocation_confidence, severity
 * @returns {{ gate: string, channels: string[], cc_project_lead: boolean, recipient_user_id: string|null }}
 */
export function computeDispatchPlan(alert) {
  if (!alert.suggested_assignee) {
    return {
      gate: "skipped",
      channels: [],
      cc_project_lead: false,
      recipient_user_id: null,
    };
  }

  const confidence = alert.allocation_confidence ?? 0;
  const severity = alert.severity || "info";

  // High confidence: auto dispatch
  if (confidence >= 0.85) {
    let channels;
    if (severity === "critical") {
      channels = ["email", "telegram", "in_app"];
    } else if (severity === "warning") {
      channels = ["email", "in_app"];
    } else {
      channels = ["in_app"];
    }

    return {
      gate: "auto",
      channels,
      cc_project_lead: false,
      recipient_user_id: alert.suggested_assignee,
    };
  }

  // Medium confidence: CC project lead
  if (confidence >= 0.7) {
    let channels;
    if (severity === "critical") {
      channels = ["email", "in_app"];
    } else if (severity === "warning") {
      channels = ["in_app"];
    } else {
      // info + medium confidence → skip outbound
      return {
        gate: "skipped",
        channels: [],
        cc_project_lead: false,
        recipient_user_id: alert.suggested_assignee,
      };
    }

    return {
      gate: "cc_lead",
      channels,
      cc_project_lead: true,
      recipient_user_id: alert.suggested_assignee,
    };
  }

  // Low confidence: queued for review
  if (severity === "info") {
    return {
      gate: "skipped",
      channels: [],
      cc_project_lead: false,
      recipient_user_id: alert.suggested_assignee,
    };
  }

  return {
    gate: "queued_review",
    channels: ["in_app"],
    cc_project_lead: false,
    recipient_user_id: alert.suggested_assignee,
  };
}
