import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, Check, X, Clock, User, ChevronRight, AlertCircle } from "lucide-react";
import { Badge, Btn, Section } from "./ui";
import { fetchApprovalRequests, fetchDecisions, submitDecision, fetchWorkflowSteps } from "../services/approvalService";
import { getConnectionStatus } from "../lib/supabase";
import { mono, sans } from "../constants";

const STATUS_STYLE = {
  PENDING: { color: "#F59E0B", bg: "#F59E0B15" },
  APPROVED: { color: "#10B981", bg: "#10B98115" },
  REJECTED: { color: "#EF4444", bg: "#EF444415" },
  CANCELLED: { color: "#6B7280", bg: "#6B728015" },
};

function ApprovalStep({ step, decision, currentUser, onDecide, lang }) {
  const [comment, setComment] = useState("");
  const isPending = !decision?.decision;
  const canDecide = isPending && currentUser && (currentUser.role === step.role || currentUser.role === "admin");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--border-a10)",
      }}
    >
      {/* Step indicator */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background:
            decision?.decision === "APPROVED"
              ? "#10B98120"
              : decision?.decision === "REJECTED"
                ? "#EF444420"
                : "var(--hover-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {decision?.decision === "APPROVED" ? (
          <Check size={14} color="#10B981" />
        ) : decision?.decision === "REJECTED" ? (
          <X size={14} color="#EF4444" />
        ) : (
          <Clock size={14} color="var(--text-faint)" />
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            {lang === "vi" ? step.label_vi || step.label : step.label}
          </span>
          <Badge label={step.role} color={step.role === "admin" ? "#EF4444" : "#3B82F6"} />
          {step.is_required && (
            <span style={{ fontSize: 9, color: "#EF4444", fontWeight: 700 }}>
              {lang === "vi" ? "BẮT BUỘC" : "REQUIRED"}
            </span>
          )}
        </div>

        {decision?.decision && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
            <span style={{ fontWeight: 600 }}>{decision.approver_name}</span>
            {" — "}
            <Badge label={decision.decision} color={decision.decision === "APPROVED" ? "#10B981" : "#EF4444"} />
            {decision.comment && (
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2, fontStyle: "italic" }}>
                "{decision.comment}"
              </div>
            )}
          </div>
        )}

        {canDecide && (
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", marginTop: 6 }}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={lang === "vi" ? "Ghi chú (tùy chọn)" : "Comment (optional)"}
              style={{
                flex: 1,
                padding: "5px 10px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 12,
                fontFamily: sans,
                outline: "none",
              }}
            />
            <Btn variant="success" small onClick={() => onDecide(decision?.id, "APPROVED", comment)}>
              <Check size={11} /> {lang === "vi" ? "Duyệt" : "Approve"}
            </Btn>
            <Btn variant="danger" small onClick={() => onDecide(decision?.id, "REJECTED", comment)}>
              <X size={11} /> {lang === "vi" ? "Từ chối" : "Reject"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApprovalPanel({ entityType, entityId, currentUser, lang }) {
  const [requests, setRequests] = useState([]);
  const [steps, setSteps] = useState({});
  const [decisions, setDecisions] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (getConnectionStatus() !== "online") {
      setLoading(false);
      return;
    }
    try {
      const { data: reqs } = await fetchApprovalRequests(entityType, entityId);
      setRequests(reqs || []);

      // Load steps and decisions for each request
      const stepsMap = {};
      const decisionsMap = {};
      for (const req of reqs || []) {
        const { data: stepData } = await fetchWorkflowSteps(req.workflow_id);
        stepsMap[req.id] = stepData || [];
        const { data: decData } = await fetchDecisions(req.id);
        decisionsMap[req.id] = decData || [];
      }
      setSteps(stepsMap);
      setDecisions(decisionsMap);
    } catch {
      /* offline */
    }
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDecide = async (decisionId, decision, comment) => {
    if (!decisionId) return;
    await submitDecision(decisionId, decision, comment, currentUser?.name);
    loadData(); // Refresh
  };

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ClipboardCheck size={13} />
        {lang === "vi" ? "Phê duyệt" : "Approvals"}
      </div>

      {requests.map((req) => {
        const reqSteps = steps[req.id] || [];
        const reqDecisions = decisions[req.id] || [];
        const style = STATUS_STYLE[req.status] || STATUS_STYLE.PENDING;

        return (
          <div
            key={req.id}
            style={{
              background: style.bg,
              border: `1px solid ${style.color}20`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Badge label={req.status} color={style.color} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {lang === "vi" ? "Yêu cầu bởi" : "Requested by"} {req.requested_by_name}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono, marginLeft: "auto" }}>
                {req.created_at?.split("T")[0]}
              </span>
            </div>
            {reqSteps.map((step) => {
              const decision = reqDecisions.find((d) => d.step_id === step.id);
              return (
                <ApprovalStep
                  key={step.id}
                  step={step}
                  decision={decision}
                  currentUser={currentUser}
                  onDecide={handleDecide}
                  lang={lang}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
