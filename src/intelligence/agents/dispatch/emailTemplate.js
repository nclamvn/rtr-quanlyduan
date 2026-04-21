// ═══════════════════════════════════════════════════════════
// Email Template — render alert notification for dispatch
// ═══════════════════════════════════════════════════════════

const SEVERITY_LABEL = {
  critical: "CRITICAL / NGHIÊM TRỌNG",
  warning: "WARNING / CẢNH BÁO",
  info: "INFO / THÔNG TIN",
};

const APP_URL = process.env.VITE_APP_URL || "https://ct.rtrobotics.com";

/**
 * Render email subject + body from alert data.
 *
 * @param {object} alert - full alert row
 * @returns {{ subject: string, body: string }}
 */
export function renderEmail(alert) {
  const severityTag = SEVERITY_LABEL[alert.severity] || "INFO";
  const summary = (alert.summary || "").slice(0, 80);

  const subject = `[RtR Control Tower] ${severityTag}: ${summary}`;

  const rationale = alert.allocation_rationale || "Không có phân tích chi tiết.";
  const deadline = alert.suggested_deadline || "Chưa xác định";
  const agent = alert.agent || "unknown";
  const confidence = alert.allocation_confidence != null ? `${Math.round(alert.allocation_confidence * 100)}%` : "N/A";

  const cascade = alert.details?.cascade;
  const cascadeText =
    cascade && cascade.length > 0
      ? cascade
          .map(
            (c, i) =>
              `  ${i + 1}. ${c.entity_type || c.entity}:${c.entity_id || ""} → ${c.next_entity_type || c.next_entity}:${c.next_entity_id || ""} (${c.relationship})`,
          )
          .join("\n")
      : "  Không có cascade chain.";

  const recommendedAction = alert.details?.recommended_action || "";
  const alternatives = alert.details?.alternative_assignees;
  const altText =
    alternatives && alternatives.length > 0
      ? alternatives.map((a) => `  - ${a.id}: ${a.why_considered}`).join("\n")
      : "  Không có.";

  const alertUrl = `${APP_URL}/alerts/${alert.id}`;

  const body = `
═══════════════════════════════════════════════
  RtR Control Tower — Thông báo tự động
═══════════════════════════════════════════════

Mức độ: ${severityTag}
Agent: ${agent}
Độ tin cậy phân bổ: ${confidence}

─── Tóm tắt ───
${alert.summary}

─── Phân tích ───
${rationale}

─── Cascade chain ───
${cascadeText}

─── Hành động đề xuất ───
${recommendedAction || "Không có đề xuất cụ thể."}

─── Deadline gợi ý ───
${deadline}

─── Ứng viên thay thế ───
${altText}

─── Hành động tiếp theo ───
Xem chi tiết và phản hồi tại: ${alertUrl}
Nhấn "Acknowledge" để xác nhận tiếp nhận.

═══════════════════════════════════════════════
Đây là tin nhắn tự động từ hệ thống Control Tower.
Phản hồi email này không được theo dõi.
═══════════════════════════════════════════════
`.trim();

  return { subject, body };
}
