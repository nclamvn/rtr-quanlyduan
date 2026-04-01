import { query, insert, update } from "./supabaseService";

export async function fetchWorkflows() {
  return query("approval_workflows", { order: { column: "created_at", ascending: true } });
}

export async function fetchWorkflowSteps(workflowId) {
  return query("approval_steps", {
    filter: { column: "workflow_id", value: workflowId },
    order: { column: "step_order", ascending: true },
  });
}

export async function createApprovalRequest(request) {
  return insert("approval_requests", {
    workflow_id: request.workflowId,
    entity_type: request.entityType,
    entity_id: request.entityId,
    project_id: request.projectId,
    requested_by: request.requestedBy,
    requested_by_name: request.requestedByName,
    status: "PENDING",
    metadata: request.metadata || {},
  });
}

export async function fetchApprovalRequests(entityType, entityId) {
  const result = await query("approval_requests", {
    order: { column: "created_at", ascending: false },
  });
  return { data: (result.data || []).filter((r) => r.entity_type === entityType && r.entity_id === entityId) };
}

export async function fetchPendingApprovals(_userId) {
  const result = await query("approval_requests", {
    filter: { column: "status", value: "PENDING" },
    order: { column: "created_at", ascending: false },
  });
  return result;
}

export async function fetchDecisions(requestId) {
  return query("approval_decisions", {
    filter: { column: "request_id", value: requestId },
    order: { column: "decided_at", ascending: true },
  });
}

export async function submitDecision(decisionId, decision, comment, approverName) {
  return update("approval_decisions", decisionId, {
    decision,
    comment,
    approver_name: approverName,
    decided_at: new Date().toISOString(),
  });
}
