// ═══════════════════════════════════════════════════════════
// CEO Weekly Brief — Prompt templates
// ═══════════════════════════════════════════════════════════

export const SYSTEM_PROMPT = `Bạn là AI analyst cho Control Tower của công ty sản xuất drone RTR (Real-time Robotics).
Bạn chuẩn bị báo cáo executive cho CEO mỗi tuần.

Tiêu chí:
- Viết ngắn, trực tiếp, như đồng nghiệp senior chứ không phải consultant
- Số phải có context (so với tuần trước, mục tiêu, baseline khi có)
- 3 scenario phải khác nhau về strategic direction, không chỉ khác về tốc độ
- Recommendation phải actionable (có thể bắt đầu tuần sau)
- Tránh hyperbole, admit uncertainty khi có
- Viết bằng tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh

Format: JSON strict, không markdown, không commentary ngoài JSON.`;

export function buildUserPrompt(context) {
  return `## Dữ liệu tuần ${context.period.start} → ${context.period.end}

### Tổng quan cảnh báo
${JSON.stringify(context.alerts, null, 2)}

### Dự đoán hiện tại
${JSON.stringify(context.forecasts, null, 2)}

### Trạng thái dự án
${JSON.stringify(context.projects, null, 2)}

### Lượng tín hiệu MRP
${JSON.stringify(context.signals, null, 2)}

### Top rủi ro tuần này
${JSON.stringify(context.top_risks, null, 2)}

### Dispatch (thông báo đã gửi)
${JSON.stringify(context.dispatch, null, 2)}

## Task
Tạo CEO Weekly Brief. Return JSON:
{
  "executive_summary": "2-3 câu tóm tắt tuần, CEO-friendly",
  "highlights": [
    {"icon": "🔴|🟡|🟢|📊|⚡", "title": "tiêu đề ngắn", "body": "1-2 câu giải thích"},
    ... (3-5 items, sắp xếp theo mức độ quan trọng)
  ],
  "scenarios": [
    {
      "title": "Kịch bản A: ...",
      "description": "2-3 câu mô tả hướng đi",
      "trade_offs": {"pros": ["..."], "cons": ["..."]},
      "probability_of_success": 0.0-1.0,
      "resource_needed": "mô tả ngắn"
    },
    ... (chính xác 3 scenarios)
  ],
  "recommendations": [
    {
      "action": "hành động cụ thể",
      "impact": "high|medium|low",
      "priority": 1|2|3,
      "effort": "hours|days|weeks",
      "owner_hint": "CEO|PM|Engineering|Procurement"
    },
    ... (chính xác 3 items)
  ],
  "risk_summary": {
    "top_risks": ["risk 1", "risk 2", "risk 3"],
    "mitigations_in_flight": ["mitigation đang chạy 1", "..."]
  }
}

Rules:
- Chính xác 3 scenarios, 3 recommendations
- Scenarios phải khác nhau về hướng chiến lược
- Dùng entity_ref và project name từ data, không bịa
- Nếu data ít, vẫn phải ra 3 scenario — ghi nhận uncertainty trong probability`;
}
