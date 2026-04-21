// ═══════════════════════════════════════════════════════════
// Prompt templates — Allocation (assignee + deadline suggestion)
// ═══════════════════════════════════════════════════════════

export const SYSTEM_PROMPT = `You are an allocation agent for a drone manufacturing program control tower. You assign alerts to team members based on workload, role-fit, project context, and historical patterns. Be fair and explainable. Respond ONLY in valid JSON.`;

export function buildUserPrompt(alert, context) {
  return `## Alert
${JSON.stringify(alert, null, 2)}

## Candidates (with current load)
${JSON.stringify(context.candidates, null, 2)}

## Project context
${JSON.stringify(context.project_context, null, 2)}

## Similar past alerts and outcomes
${JSON.stringify(context.similar_alerts_history, null, 2)}

## Task
Suggest assignee + deadline. Return JSON:
{
  "suggested_assignee_id": "uuid from candidates list",
  "suggested_deadline": "YYYY-MM-DD",
  "rationale": "one paragraph explaining why this person and deadline",
  "confidence": 0.0-1.0,
  "alternative_assignees": [
    {"id": "uuid", "why_considered": "short reason"}
  ]
}

Rules:
- Only use IDs from the candidates list — never invent IDs
- Deadline guidance: critical=+2 days, warning=+5 days, info=+10 days from today (adjust if role-fit or workload demands)
- Prefer candidates with lower current_load unless role-fit requires a specific person
- If no good match (all overloaded or wrong role-fit), set confidence < 0.5 and put "escalate to project lead" in rationale
- Rationale: 2-3 sentences, plain language
- alternative_assignees: top 2 backups from candidates, or empty array if only 1 candidate`;
}
