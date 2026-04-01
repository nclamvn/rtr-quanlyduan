// ═══════════════════════════════════════════════════════════
// RtR Control Tower — Audit Log Tab (extracted from App.jsx)
// ═══════════════════════════════════════════════════════════
import { ScrollText, Download, Trash2 } from "lucide-react";
import { mono, sans } from "../constants";
import { Badge, Btn, Section } from "./ui";
import EmptyState, { EMPTY_MESSAGES } from "./EmptyState";

const ACTION_TYPES = [
  "ISSUE_CREATED",
  "ISSUE_STATUS_CHANGED",
  "ISSUE_REVIEWED",
  "ISSUE_CLOSED",
  "GATE_CHECK_TOGGLED",
  "USER_LOGIN",
  "USER_LOGOUT",
  "USER_ROLE_SWITCHED",
];

const ACTION_COLORS = {
  ISSUE_CREATED: "#10B981",
  ISSUE_STATUS_CHANGED: "#3B82F6",
  ISSUE_REVIEWED: "#8B5CF6",
  ISSUE_CLOSED: "#6B7280",
  GATE_CHECK_TOGGLED: "#F59E0B",
  USER_LOGIN: "#10B981",
  USER_LOGOUT: "#EF4444",
  USER_ROLE_SWITCHED: "#06B6D4",
  ISSUE_UPDATED: "#3B82F6",
  ISSUE_ASSIGNED: "#F97316",
  PHASE_TRANSITIONED: "#8B5CF6",
};

const selectStyle = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "4px 8px",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  fontFamily: sans,
};

export default function AuditTab({ audit, lang, t, auditFilter, setAuditFilter }) {
  const uniqueUsers = [...new Set(audit.logs.map((l) => l.userName))];

  let filtered = audit.logs;
  if (auditFilter.action !== "ALL") filtered = filtered.filter((l) => l.action === auditFilter.action);
  if (auditFilter.user !== "ALL") filtered = filtered.filter((l) => l.userName === auditFilter.user);

  const handleExport = () => {
    const csv = audit.exportCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rtr-audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section
      title={
        <>
          <ScrollText size={14} /> {t.audit.tab}{" "}
          <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 400, marginLeft: 4 }}>
            {filtered.length} entries
          </span>
        </>
      }
      actions={
        <>
          <Btn small onClick={handleExport}>
            <Download size={11} /> {t.audit.export}
          </Btn>
          <Btn
            variant="danger"
            small
            onClick={() => {
              if (confirm(t.audit.confirmClear)) audit.clearLogs();
            }}
          >
            <Trash2 size={11} /> {t.audit.clear}
          </Btn>
        </>
      }
    >
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select
          value={auditFilter.action}
          onChange={(e) => setAuditFilter((f) => ({ ...f, action: e.target.value }))}
          style={selectStyle}
        >
          <option value="ALL">{t.audit.allActions}</option>
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={auditFilter.user}
          onChange={(e) => setAuditFilter((f) => ({ ...f, user: e.target.value }))}
          style={selectStyle}
        >
          <option value="ALL">{t.audit.allUsers}</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={(EMPTY_MESSAGES[lang]?.audit || EMPTY_MESSAGES.vi.audit).icon}
          title={(EMPTY_MESSAGES[lang]?.audit || EMPTY_MESSAGES.vi.audit).title}
          description={(EMPTY_MESSAGES[lang]?.audit || EMPTY_MESSAGES.vi.audit).desc}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filtered.slice(0, 100).map((entry) => {
            const ts = new Date(entry.timestamp);
            const timeStr = ts.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const dateStr = ts.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US");
            const color = ACTION_COLORS[entry.action] || "var(--text-dim)";
            return (
              <div
                key={entry.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border-a10)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ width: 52, flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: mono, fontWeight: 600 }}>
                    {timeStr}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: mono }}>{dateStr}</div>
                </div>
                <div
                  style={{
                    width: 3,
                    borderRadius: 2,
                    background: color,
                    flexShrink: 0,
                    alignSelf: "stretch",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {entry.userName}
                    </span>
                    <Badge
                      label={t.role[entry.userRole] || entry.userRole}
                      color={
                        { admin: "#EF4444", pm: "#3B82F6", engineer: "#F59E0B", viewer: "#6B7280" }[entry.userRole] ||
                        "var(--text-dim)"
                      }
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <Badge label={entry.action} color={color} />
                  </div>
                  {entry.entityTitle && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span style={{ color: "#3B82F6", fontFamily: mono, fontSize: 12, fontWeight: 600 }}>
                        {entry.entityId}
                      </span>
                      {entry.entityTitle}
                    </div>
                  )}
                  {(entry.oldValue || entry.newValue) && (
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2, fontFamily: mono }}>
                      {entry.oldValue && <span style={{ color: "#EF4444" }}>{entry.oldValue}</span>}
                      {entry.oldValue && entry.newValue && <span> → </span>}
                      {entry.newValue && <span style={{ color: "#10B981" }}>{entry.newValue}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
